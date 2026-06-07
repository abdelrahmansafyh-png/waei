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
  var correctQuestions = {};
  var answersByQuestion = {};
  var lastResult = "";

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

  function cleanText(v) {
    return String(v || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function absUrl(url) {
    try {
      if (!url) return "";
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url || "";
    }
  }

  function unique(arr) {
    var out = [];
    var seen = {};
    arr.forEach(function (x) {
      if (!x || seen[x]) return;
      seen[x] = true;
      out.push(x);
    });
    return out;
  }

  function getVisibleMedia() {
    var images = Array.prototype.slice.call(document.querySelectorAll("img"))
      .filter(function (img) {
        var r = img.getBoundingClientRect();
        return r.width > 40 && r.height > 40 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
      })
      .map(function (img) { return absUrl(img.currentSrc || img.src); });

    var audio = Array.prototype.slice.call(document.querySelectorAll("audio source, audio"))
      .map(function (el) { return absUrl(el.src || el.currentSrc); });

    var video = Array.prototype.slice.call(document.querySelectorAll("video source, video"))
      .map(function (el) { return absUrl(el.src || el.currentSrc); });

    return {
      images: unique(images).slice(0, 12),
      audio: unique(audio).slice(0, 8),
      video: unique(video).slice(0, 4)
    };
  }

  function parseQuestionText(text, questionNumber) {
    var lines = text.split("\n").map(cleanText).filter(Boolean);
    var bad = ["question score", "Text multiple choice question", "Picture Multiple Choice question", "Text Drag & Drop", "__:__/__:__", "correct answer", "total score"];
    lines = lines.filter(function (line) {
      if (!line || line === String(questionNumber)) return false;
      return !bad.some(function (b) { return line.toLowerCase().indexOf(b.toLowerCase()) >= 0; });
    });
    var idx = lines.findIndex(function (line) { return /سؤال رقم:\s*\d+/.test(line); });
    if (idx >= 0 && lines[idx + 1]) return lines[idx + 1];
    return lines.slice(0, 8).join(" | ").slice(0, 500);
  }

  function extractOptions(text) {
    var lines = text.split("\n").map(cleanText).filter(Boolean);
    var blocked = ["question score", "Text multiple choice question", "Picture Multiple Choice question", "Text Drag & Drop", "__:__/__:__", "correct answer", "ملاحظة: إضغط هنا"];
    var options = [];
    lines.forEach(function (line) {
      if (!line || /^\d+$/.test(line) || /سؤال رقم/.test(line)) return;
      if (blocked.some(function (b) { return line.toLowerCase().indexOf(b.toLowerCase()) >= 0; })) return;
      var isCorrect = /✓/.test(line);
      var clean = line.replace(/✓/g, "").trim();
      if (clean.length >= 2 && clean.length <= 160) {
        options.push({ type: "text", text: clean, isCorrect: isCorrect });
      }
    });
    var seen = {};
    return options.filter(function (o) {
      if (seen[o.text]) return false;
      seen[o.text] = true;
      return true;
    }).slice(0, 12);
  }

  function buildSnapshot(clickInfo) {
    var text = cleanText(document.body ? document.body.innerText : "");
    var q = text.match(/سؤال رقم:\s*(\d+)/);
    var questionNumber = q ? Number(q[1]) : null;
    var media = getVisibleMedia();
    var questionText = parseQuestionText(text, questionNumber);
    var options = extractOptions(text);
    var selected = null;

    if (clickInfo && clickInfo.text) selected = { type: "text", text: clickInfo.text };
    else if (clickInfo && clickInfo.image) selected = { type: "image", image: clickInfo.image };

    var hasCorrect = /correct answer|✓/.test(text);
    if (questionNumber && hasCorrect) correctQuestions[questionNumber] = true;

    var snapshot = {
      questionNumber: questionNumber,
      questionText: questionText,
      questionMedia: media,
      options: options,
      selectedAnswers: selected ? [selected] : [],
      correctAnswers: options.filter(function (o) { return o.isCorrect; }),
      isCorrect: questionNumber ? !!correctQuestions[questionNumber] : undefined,
      confidence: hasCorrect ? "medium" : "low",
      rawText: text.slice(0, 1500)
    };

    if (questionNumber) {
      var old = answersByQuestion[questionNumber] || {};
      answersByQuestion[questionNumber] = Object.assign({}, old, snapshot, {
        selectedAnswers: snapshot.selectedAnswers.length ? snapshot.selectedAnswers : (old.selectedAnswers || []),
        correctAnswers: snapshot.correctAnswers.length ? snapshot.correctAnswers : (old.correctAnswers || []),
        isCorrect: snapshot.isCorrect
      });
    }

    return snapshot;
  }

  function parseFinal(text) {
    var maxMatch = text.match(/total score[\s\S]{0,160}?\/\s*(\d+)/i) || text.match(/\/\s*(\d+)[\s\S]{0,100}?لقد أنهيت التدريب/i);
    var maxScore = maxMatch ? Number(maxMatch[1]) : null;
    var scoreMatch = text.match(/total score[\s\S]{0,120}?(\d+)\s*\/\s*(\d+)/i) || text.match(/(\d+)\s*\/\s*(\d+)[\s\S]{0,120}?لقد أنهيت التدريب/i);
    var finalScore = null;
    if (scoreMatch) {
      finalScore = Number(scoreMatch[1]);
      maxScore = Number(scoreMatch[2]);
    }
    var completed = /لقد أنهيت التدريب بنجاح|أنهيت التدريب بنجاح|total score/i.test(text);
    var trackedScore = Object.keys(correctQuestions).length;
    return { completed: completed, score: finalScore !== null ? finalScore : trackedScore, maxScore: maxScore, trackedScore: trackedScore, confidence: finalScore !== null ? "high" : "tracked" };
  }

  function scan(clickInfo) {
    var snapshot = buildSnapshot(clickInfo);
    var text = cleanText(document.body ? document.body.innerText : "");
    var finalData = parseFinal(text);

    send({
      event: "question_snapshot",
      snapshot: snapshot,
      answers: Object.keys(answersByQuestion).map(function (k) { return answersByQuestion[k]; })
    });

    if (finalData.completed) {
      var answers = Object.keys(answersByQuestion).sort(function (a, b) { return Number(a) - Number(b); }).map(function (k) { return answersByQuestion[k]; });
      var result = {
        event: "result",
        completed: true,
        score: finalData.score,
        maxScore: finalData.maxScore || 23,
        percentage: finalData.maxScore ? Math.round((finalData.score / finalData.maxScore) * 100) : null,
        trackedScore: finalData.trackedScore,
        correctQuestions: Object.keys(correctQuestions).map(Number),
        confidence: finalData.confidence,
        answers: answers
      };
      var sig = JSON.stringify(result);
      if (sig !== lastResult) {
        lastResult = sig;
        send(result);
      }
    }
  }

  document.addEventListener("click", function (e) {
    var target = e.target;
    var text = cleanText((target && (target.innerText || target.textContent)) || "").slice(0, 220);
    var image = "";
    try {
      if (target && target.tagName === "IMG") image = absUrl(target.currentSrc || target.src);
      if (!image && target && target.querySelector) {
        var img = target.querySelector("img");
        if (img) image = absUrl(img.currentSrc || img.src);
      }
    } catch (err) {}
    setTimeout(function () { scan({ text: text, image: image }); }, 250);
    setTimeout(function () { scan({ text: text, image: image }); }, 900);
    setTimeout(function () { scan({ text: text, image: image }); }, 1600);
  }, true);

  send({ event: "loaded", url: location.href });
  setTimeout(function () { scan(null); }, 500);
  setInterval(function () { scan(null); }, 1500);
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
        html = html.replace(/<\/body\s*>/i, `${scriptTag}\n</body>`);
      } else if (/<\/head\s*>/i.test(html)) {
        html = html.replace(/<\/head\s*>/i, `${scriptTag}\n</head>`);
      } else {
        html += `\n${scriptTag}`;
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