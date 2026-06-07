import { NextRequest, NextResponse } from "next/server";
import ftp from "basic-ftp";
import AdmZip from "adm-zip";
import { Readable } from "stream";
import path from "path";

export const runtime = "nodejs";

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

const BRIDGE_JS = `
(function () {
  function send(payload) {
    try {
      window.parent.postMessage(
        Object.assign({
          type: payload.event === "result" ? "WAEI_GAME_RESULT" : "WAEI_GAME_EVENT",
          at: new Date().toISOString()
        }, payload),
        "*"
      );
    } catch (e) {}
  }

  var correctQuestions = {};
  var lastResult = "";

  function cleanText(v) {
    return String(v || "")
      .replace(/\\u00a0/g, " ")
      .replace(/[ \\t]+/g, " ")
      .replace(/\\n{3,}/g, "\\n\\n")
      .trim();
  }

  function injectStyle() {
    if (document.getElementById("waei-style")) return;
    var style = document.createElement("style");
    style.id = "waei-style";
    style.innerHTML =
      "html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;max-width:100vw!important;max-height:100vh!important;}*{box-sizing:border-box!important;scrollbar-width:none!important;}*::-webkit-scrollbar{display:none!important;}";
    document.head.appendChild(style);
  }

  function scan() {
    injectStyle();

    var text = cleanText(document.body ? document.body.innerText : "");
    var q = text.match(/سؤال رقم:\\s*(\\d+)/);
    var currentQuestion = q ? Number(q[1]) : null;

    if (currentQuestion && /correct answer|✓/.test(text)) {
      correctQuestions[currentQuestion] = true;
    }

    var maxMatch =
      text.match(/total score[\\s\\S]{0,160}?\\/\\s*(\\d+)/i) ||
      text.match(/\\/\\s*(\\d+)[\\s\\S]{0,100}?لقد أنهيت التدريب/i);

    var maxScore = maxMatch ? Number(maxMatch[1]) : null;

    var scoreMatch =
      text.match(/total score[\\s\\S]{0,120}?(\\d+)\\s*\\/\\s*(\\d+)/i) ||
      text.match(/(\\d+)\\s*\\/\\s*(\\d+)[\\s\\S]{0,120}?لقد أنهيت التدريب/i);

    var finalScore = null;

    if (scoreMatch) {
      finalScore = Number(scoreMatch[1]);
      maxScore = Number(scoreMatch[2]);
    }

    var completed = /لقد أنهيت التدريب بنجاح|أنهيت التدريب بنجاح|total score/i.test(text);
    var trackedScore = Object.keys(correctQuestions).length;

    if (completed) {
      var result = {
        event: "result",
        completed: true,
        score: finalScore !== null ? finalScore : trackedScore,
        maxScore: maxScore || 23,
        percentage: maxScore ? Math.round(((finalScore !== null ? finalScore : trackedScore) / maxScore) * 100) : null,
        trackedScore: trackedScore,
        correctQuestions: Object.keys(correctQuestions).map(Number),
        confidence: finalScore !== null ? "high" : "tracked"
      };

      var sig = JSON.stringify(result);
      if (sig !== lastResult) {
        lastResult = sig;
        send(result);
      }
    }
  }

  document.addEventListener("click", function () {
    setTimeout(scan, 300);
    setTimeout(scan, 1000);
  }, true);

  send({ event: "loaded", url: location.href });
  setTimeout(scan, 500);
  setInterval(scan, 1200);
})();
`;

async function uploadDir(
  client: ftp.Client,
  entries: AdmZip.IZipEntry[],
  remoteBase: string
) {
  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryName = entry.entryName.replace(/\\/g, "/");
    const remotePath = `${remoteBase}/${entryName}`;
    const remoteDir = path.posix.dirname(remotePath);

    await client.ensureDir(remoteDir);
    await client.uploadFrom(bufferToStream(entry.getData()), path.posix.basename(remotePath));
  }
}

export async function POST(req: NextRequest) {
  const client = new ftp.Client();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ success: false, message: "الملف يجب أن يكون ZIP" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let indexEntry = entries.find((e) => !e.isDirectory && e.entryName.toLowerCase().endsWith("index.html"));

    if (!indexEntry) {
      return NextResponse.json({ success: false, message: "لم يتم العثور على index.html" }, { status: 400 });
    }

    let html = indexEntry.getData().toString("utf8");
    const scriptTag = `<script src="./waei-bridge.js"></script>`;

    if (!html.includes("waei-bridge.js")) {
      if (/<\/body\s*>/i.test(html)) {
        html = html.replace(/<\/body\s*>/i, `${scriptTag}\\n</body>`);
      } else if (/<\/body\s*>/i.test(html)) {
        html = html.replace(/<\/body\s*>/i, `${scriptTag}\\n</head>`);
      } else {
        html += `\\n${scriptTag}`;
      }
    }

    zip.updateFile(indexEntry.entryName, Buffer.from(html, "utf8"));

    const bridgePath = path.posix.join(path.posix.dirname(indexEntry.entryName), "waei-bridge.js");
    zip.addFile(bridgePath, Buffer.from(BRIDGE_JS, "utf8"));

    const gameId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const basePath = process.env.FTP_BASE_PATH!;
    const remoteBase = `${basePath}/uploads/games/${gameId}`;

    await client.access({
      host: process.env.FTP_HOST!,
      user: process.env.FTP_USER!,
      password: process.env.FTP_PASSWORD!,
      port: 21,
      secure: false,
      secureOptions: { rejectUnauthorized: false },
    });

    await client.ensureDir(remoteBase);
    await uploadDir(client, zip.getEntries(), remoteBase);

    client.close();

    const indexPublicPath = `/uploads/games/${gameId}/${indexEntry.entryName}`;
    const gameUrl = `${process.env.NEXT_PUBLIC_FILES_URL}${indexPublicPath}`;

    return NextResponse.json({
      success: true,
      game_url: gameUrl,
      game_folder: `/uploads/games/${gameId}`,
      message: "تم رفع وتجهيز اللعبة بنجاح",
    });
  } catch (error: any) {
    client.close();

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Upload game failed",
      },
      { status: 500 }
    );
  }
}