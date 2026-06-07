import { NextRequest, NextResponse } from "next/server";
import ftp from "basic-ftp";
import AdmZip from "adm-zip";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import os from "os";
import { execFileSync } from "child_process";
import { WAEI_CAPTURE_SCRIPT } from "@/lib/gameCaptureScript";

export const runtime = "nodejs";

type TtsItem = { id: string; text: string; file: string };

const TEMPLATES: Record<string, { file: string; label: string }> = {
  balloon_plane: { file: "balloon_plane.zip", label: "الطائرة والبالونات" },
  subway: { file: "subway.zip", label: "السيارات" },
  drag_dynamic_kid: { file: "drag_dynamic_kid.zip", label: "اسحب وصنّف" },
};

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").toLowerCase();
}

function dirname(entryName: string) {
  const normalized = entryName.replace(/\\/g, "/");
  return normalized.includes("/")
    ? normalized.split("/").slice(0, -1).join("/")
    : "";
}

async function uploadDir(client: ftp.Client, entries: AdmZip.IZipEntry[], remoteBase: string) {
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const entryName = entry.entryName.replace(/\\/g, "/");
    const remotePath = `${remoteBase}/${entryName}`;
    const remoteDir = path.posix.dirname(remotePath);
    await client.ensureDir(remoteDir);
    await client.uploadFrom(bufferToStream(entry.getData()), path.posix.basename(remotePath));
  }
}

async function getHtml2CanvasBuffer() {
  const res = await fetch("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  if (!res.ok) throw new Error("Failed to download html2canvas");
  return Buffer.from(await res.arrayBuffer());
}

function addTts(tts: TtsItem[], id: string, text: any, file: string) {
  const clean = String(text || "").trim();
  if (!clean) return;
  tts.push({ id, text: clean, file });
}

function normalizeTemplateGame(templateId: string, input: any) {
  const game = { ...(input || {}) };

  // Subway/car template expects: game.levels[].items[]
  // Builder form usually sends flat: question + targetCategory + items.
  // Convert it automatically so the template receives the right structure.
  if (templateId === "subway") {
    if (!Array.isArray(game.levels)) {
      game.levels = [
        {
          question: game.question || game.title || "ابدأ اللعب",
          targetCategory: game.targetCategory || game.target || "correct",
          items: Array.isArray(game.items) ? game.items : [],
        },
      ];
    }

    delete game.question;
    delete game.items;
    delete game.target;
    delete game.targetCategory;
  }

  if (templateId === "drag_dynamic_kid") {
    game.instruction = game.instruction || game.question || "اسحب كل بطاقة إلى المكان الصحيح";
    game.character = game.character || "images/character.png";

    if (!Array.isArray(game.groups)) {
      game.groups = [
        { id: "correct", title: "صحيح" },
        { id: "wrong", title: "خطأ" },
      ];
    }

    if (!Array.isArray(game.cards) && Array.isArray(game.items)) {
      game.cards = game.items.map((item: any) => ({
        text: item?.text || item?.label || "",
        image: item?.image || "",
        group: item?.group || item?.category || item?.type || "correct",
      }));
    }

    delete game.items;
    delete game.question;
  }

  return game;
}

function buildTtsFromGame(game: any) {
  const tts: TtsItem[] = [];

  if (game.title) addTts(tts, "title", game.title, "title.mp3");

  if (game.question) {
    addTts(tts, "question", game.question, "question.mp3");
    game.questionAudio = "audio/question.mp3";
  }

  if (Array.isArray(game.items)) {
    game.items = game.items.map((item: any, index: number) => {
      const file = `item_${index}.mp3`;
      addTts(tts, `item_${index}`, item?.text, file);
      return { ...item, audio: `audio/${file}` };
    });
  }

  if (Array.isArray(game.levels)) {
    game.levels = game.levels.map((level: any, levelIndex: number) => {
      const qFile = `level_${levelIndex}_question.mp3`;
      addTts(tts, `level_${levelIndex}_question`, level?.question || level?.title, qFile);

      const nextLevel: any = {
        ...level,
        audio: `audio/${qFile}`,
        targetCategory: level?.targetCategory || level?.target || "correct",
      };

      if (Array.isArray(level.items)) {
        nextLevel.items = level.items.map((item: any, itemIndex: number) => {
          const file = `level_${levelIndex}_item_${itemIndex}.mp3`;
          addTts(tts, `level_${levelIndex}_item_${itemIndex}`, item?.text || item?.label, file);
          return {
            ...item,
            category: item?.category || item?.type || "correct",
            audio: `audio/${file}`,
          };
        });
      }

      return nextLevel;
    });
  }

  if (Array.isArray(game.cards)) {
    game.cards = game.cards.map((card: any, index: number) => {
      const text = card?.text || card?.label || card?.front || card?.back || card?.question;
      const existingAudio = String(card?.audio || "");
      const file = existingAudio.startsWith("audio/")
        ? existingAudio.replace(/^audio\//, "")
        : `card_${index}.mp3`;

      addTts(tts, `card_${index}`, text, file);

      return {
        ...card,
        audio: `audio/${file}`,
      };
    });
  }

  if (Array.isArray(game.questions)) {
    game.questions = game.questions.map((q: any, qIndex: number) => {
      const qFile = `question_${qIndex}.mp3`;
      addTts(tts, `question_${qIndex}`, q?.question || q?.text || q?.title, qFile);
      const nextQ = { ...q, audio: `audio/${qFile}` };
      if (Array.isArray(q.answers)) {
        nextQ.answers = q.answers.map((a: any, aIndex: number) => {
          const aFile = `q_${qIndex}_answer_${aIndex}.mp3`;
          addTts(tts, `q_${qIndex}_answer_${aIndex}`, a?.text || a?.label, aFile);
          return { ...a, audio: `audio/${aFile}` };
        });
      }
      return nextQ;
    });
  }

  return { game, tts };
}

function writeZipToDir(zip: AdmZip, dir: string) {
  zip.extractAllTo(dir, true);
}

function addDirToZip(zip: AdmZip, baseDir: string, zipBase = "") {
  if (!fs.existsSync(baseDir)) return;
  for (const name of fs.readdirSync(baseDir)) {
    const full = path.join(baseDir, name);
    const rel = zipBase ? `${zipBase}/${name}` : name;
    if (fs.statSync(full).isDirectory()) addDirToZip(zip, full, rel);
    else zip.addFile(rel.replace(/\\/g, "/"), fs.readFileSync(full));
  }
}

function findPythonCommand() {
  const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
  for (const cmd of candidates) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "ignore" });
      return cmd;
    } catch {}
  }
  throw new Error("Python غير موجود على الجهاز الذي يشغل واعي. شغّل المشروع محليًا على جهاز فيه Python أو على VPS.");
}

function generateAudioWithEdgeTts(workDir: string) {
  const python = findPythonCommand();
  const script = path.join(process.cwd(), "scripts", "generate_audio_edge.py");
  if (!fs.existsSync(script)) throw new Error("ملف scripts/generate_audio_edge.py غير موجود");

  try {
    execFileSync(python, [script, workDir, process.env.EDGE_TTS_VOICE || "ar-SA-HamedNeural"], {
      stdio: "pipe",
      timeout: 120000,
    });
  } catch (error: any) {
    const stderr = error?.stderr?.toString?.() || "";
    const stdout = error?.stdout?.toString?.() || "";
    if ((stderr + stdout).includes("No module named") || (stderr + stdout).includes("edge_tts")) {
      throw new Error("مكتبة edge-tts غير مثبتة على الجهاز الذي يشغل واعي. ثبّتها مرة واحدة: pip install edge-tts");
    }
    throw new Error(`فشل توليد الصوت Edge TTS: ${stderr || stdout || error?.message}`);
  }
}

export async function POST(req: NextRequest) {
  const client = new ftp.Client();
  let workDir = "";

  try {
    const body = await req.json();
    const templateId = safeId(String(body.template_id || ""));
    const contentId = String(body.content_id || "");
    const gameInput = body.game || {};

    const template = TEMPLATES[templateId];
    if (!template) {
      return NextResponse.json({ success: false, message: "Template غير معروف" }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), "game-templates", template.file);
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ success: false, message: `ملف التمبليت غير موجود: ${template.file}` }, { status: 500 });
    }

    const zip = new AdmZip(templatePath);
    const indexEntry = zip.getEntries().find((entry) => {
      if (entry.isDirectory) return false;
      const name = entry.entryName.toLowerCase().replace(/\\/g, "/");
      return name.endsWith("index.html");
    });

    if (!indexEntry) {
      return NextResponse.json({ success: false, message: "التمبليت لا يحتوي على index.html" }, { status: 400 });
    }

    const gameDir = dirname(indexEntry.entryName);
    const prefix = gameDir ? `${gameDir}/` : "";
    const normalizedGame = normalizeTemplateGame(templateId, gameInput);
    const { game, tts } = buildTtsFromGame(normalizedGame);

    zip.updateFile(`${prefix}game.json`, Buffer.from(JSON.stringify(game, null, 2), "utf8"));
    zip.addFile(`${prefix}tts_items.json`, Buffer.from(JSON.stringify(tts, null, 2), "utf8"));

    const gameId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    workDir = path.join(os.tmpdir(), `waei-template-game-${gameId}`);
    fs.mkdirSync(workDir, { recursive: true });
    writeZipToDir(zip, workDir);
    fs.writeFileSync(path.join(workDir, "tts_items.json"), JSON.stringify(tts, null, 2), "utf8");

    generateAudioWithEdgeTts(workDir);

    // Rebuild zip from generated folder so audio files are included.
    const finalZip = new AdmZip();
    addDirToZip(finalZip, workDir);

    const finalIndex = finalZip.getEntries().find((entry) => {
      if (entry.isDirectory) return false;
      return entry.entryName.toLowerCase().replace(/\\/g, "/").endsWith("index.html");
    });
    if (!finalIndex) throw new Error("index.html اختفى بعد تجهيز اللعبة");

    let html = finalIndex.getData().toString("utf8");
    if (!html.includes("html2canvas.min.js")) {
      html = html.replace(/<\/head\s*>/i, `<script src="./html2canvas.min.js"></script>\n</head>`);
    }
    if (!html.includes("waei-capture.js")) {
      const scriptTag = `<script src="./waei-capture.js"></script>`;
      if (/<\/body\s*>/i.test(html)) html = html.replace(/<\/body\s*>/i, `${scriptTag}\n</body>`);
      else if (/<\/head\s*>/i.test(html)) html = html.replace(/<\/head\s*>/i, `${scriptTag}\n</head>`);
      else html += `\n${scriptTag}`;
    }

    finalZip.updateFile(finalIndex.entryName, Buffer.from(html, "utf8"));
    finalZip.addFile(`${prefix}waei-capture.js`, Buffer.from(WAEI_CAPTURE_SCRIPT, "utf8"));
    finalZip.addFile(`${prefix}html2canvas.min.js`, await getHtml2CanvasBuffer());

    const basePath = process.env.FTP_BASE_PATH!;
    const remoteBase = `${basePath}/uploads/games/${gameId}`;

    await client.access({
      host: process.env.FTP_HOST!,
      user: process.env.FTP_USER!,
      password: process.env.FTP_PASSWORD!,
      port: Number(process.env.FTP_PORT || 21),
      secure: process.env.FTP_SECURE === "true",
      secureOptions: { rejectUnauthorized: false },
    });

    await client.ensureDir(remoteBase);
    await uploadDir(client, finalZip.getEntries(), remoteBase);
    client.close();

    const indexPublicPath = `/uploads/games/${gameId}/${finalIndex.entryName.replace(/\\/g, "/")}`;
    const gameUrl = `${process.env.NEXT_PUBLIC_FILES_URL}${indexPublicPath}`;

    return NextResponse.json({
      success: true,
      game_url: gameUrl,
      iframe_url: gameUrl,
      game_folder: `/uploads/games/${gameId}`,
      content_id: contentId || null,
      tts_count: tts.length,
      message: "تم توليد اللعبة والصوت ورفعها بنجاح",
    });
  } catch (error: any) {
    client.close();
    return NextResponse.json({ success: false, message: error?.message || "Template game failed" }, { status: 500 });
  } finally {
    if (workDir && fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}
