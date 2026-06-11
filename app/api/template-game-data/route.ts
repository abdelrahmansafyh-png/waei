import { NextRequest, NextResponse } from "next/server";
import ftp from "basic-ftp";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import os from "os";
import { execFileSync } from "child_process";

export const runtime = "nodejs";

type TtsItem = { id: string; text: string; file: string };

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function safeId(value: string) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function textKey(value: any) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function addTts(tts: TtsItem[], id: string, text: any, file: string) {
  const clean = String(text || "").trim();
  if (!clean) return;
  tts.push({ id, text: clean, file });
}

function normalizeTemplateGame(templateId: string, input: any) {
  const game = { ...(input || {}) };

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

  if (templateId === "fishing_game") {
    game.title = game.title || "لعبة الصيد";
    game.question = game.question || "اختر الإجابات الصحيحة";
    game.targetCount = Number(game.targetCount || 5);
    game.targetCategory = game.targetCategory || "strength";

    if (!Array.isArray(game.items)) {
      game.items = [];
    }

    game.items = game.items.map((item: any) => ({
      text: item?.text || item?.label || "",
      image: item?.image || "",
      category: item?.category || item?.type || "strength",
      audio: item?.audio || "",
    }));
  }

  if (templateId === "maze_quiz") {
    game.title = game.title || "المتاهة";

    if (!Array.isArray(game.questions)) {
      game.questions = [];
    }

    game.questions = game.questions.map((q: any, qIndex: number) => ({
      type: q?.image ? "image" : "text",
      q: q?.q || q?.question || q?.text || `السؤال ${qIndex + 1}`,
      image: q?.image || "",
      audio: q?.audio || "",
      answers: Array.isArray(q?.answers)
        ? q.answers.map((a: any) => ({
            type: a?.image ? "image" : "text",
            text: a?.text || a?.label || "",
            image: a?.image || "",
            correct: Boolean(a?.correct),
            audio: a?.audio || "",
          }))
        : [],
    }));
  }

  return game;
}

function collectPreviousAudio(previousGame: any) {
  const map = new Map<string, string>();

  function remember(text: any, audio: any) {
    const key = textKey(text);
    const value = String(audio || "").trim();
    if (key && value) map.set(key, value);
  }

  remember(previousGame?.title, previousGame?.titleAudio || previousGame?.audio);
  remember(previousGame?.question, previousGame?.questionAudio);

  if (Array.isArray(previousGame?.items)) {
    previousGame.items.forEach((item: any) => remember(item?.text || item?.label, item?.audio));
  }

  if (Array.isArray(previousGame?.cards)) {
    previousGame.cards.forEach((card: any) =>
      remember(card?.text || card?.label || card?.front || card?.back || card?.question, card?.audio)
    );
  }

  if (Array.isArray(previousGame?.levels)) {
    previousGame.levels.forEach((level: any) => {
      remember(level?.question || level?.title, level?.audio);
      if (Array.isArray(level?.items)) {
        level.items.forEach((item: any) => remember(item?.text || item?.label, item?.audio));
      }
    });
  }

  if (Array.isArray(previousGame?.questions)) {
    previousGame.questions.forEach((q: any) => {
      remember(q?.q || q?.question || q?.text || q?.title, q?.audio);
      if (Array.isArray(q?.answers)) {
        q.answers.forEach((a: any) => remember(a?.text || a?.label || a?.answer, a?.audio));
      }
    });
  }

  return map;
}

function assignAudioWithCache(game: any, gameId: string, previousGame: any) {
  const previousAudio = collectPreviousAudio(previousGame);
  const tts: TtsItem[] = [];
  const audioBase = `/uploads/game-audio/${gameId}`;

  function audioFor(id: string, text: any, fallbackFile: string) {
    const clean = String(text || "").trim();
    if (!clean) return "";

    const oldAudio = previousAudio.get(textKey(clean));
    if (oldAudio) return oldAudio;

    addTts(tts, id, clean, fallbackFile);
    return `${audioBase}/${fallbackFile}`;
  }

  if (game.title) {
    game.titleAudio = audioFor("title", game.title, "title.mp3");
  }

  if (game.question) {
    game.questionAudio = audioFor("question", game.question, "question.mp3");
  }

  if (Array.isArray(game.items)) {
    game.items = game.items.map((item: any, index: number) => {
      const text = item?.text || item?.label || "";
      return {
        ...item,
        audio: audioFor(`item_${index}`, text, `item_${index}.mp3`),
      };
    });
  }

  if (Array.isArray(game.levels)) {
    game.levels = game.levels.map((level: any, levelIndex: number) => {
      const levelText = level?.question || level?.title || "";
      const nextLevel: any = {
        ...level,
        audio: audioFor(
          `level_${levelIndex}_question`,
          levelText,
          `level_${levelIndex}_question.mp3`
        ),
        targetCategory: level?.targetCategory || level?.target || "correct",
      };

      if (Array.isArray(level.items)) {
        nextLevel.items = level.items.map((item: any, itemIndex: number) => {
          const text = item?.text || item?.label || "";
          return {
            ...item,
            category: item?.category || item?.type || "correct",
            audio: audioFor(
              `level_${levelIndex}_item_${itemIndex}`,
              text,
              `level_${levelIndex}_item_${itemIndex}.mp3`
            ),
          };
        });
      }

      return nextLevel;
    });
  }

  if (Array.isArray(game.cards)) {
    game.cards = game.cards.map((card: any, index: number) => {
      const text = card?.text || card?.label || card?.front || card?.back || card?.question;
      return {
        ...card,
        audio: audioFor(`card_${index}`, text, `card_${index}.mp3`),
      };
    });
  }

  if (Array.isArray(game.questions)) {
    game.questions = game.questions.map((q: any, qIndex: number) => {
      const qText = q?.q || q?.question || q?.text || q?.title;
      const nextQ: any = {
        ...q,
        audio: audioFor(`question_${qIndex}`, qText, `question_${qIndex}.mp3`),
      };

      if (Array.isArray(q.answers)) {
        nextQ.answers = q.answers.map((a: any, aIndex: number) => {
          const aText = a?.text || a?.label || a?.answer;
          return {
            ...a,
            audio: audioFor(
              `question_${qIndex}_answer_${aIndex}`,
              aText,
              `question_${qIndex}_answer_${aIndex}.mp3`
            ),
          };
        });
      }

      return nextQ;
    });
  }

  return { game, tts };
}

function findPythonCommand() {
  const candidates = ["python3", "python", "py"];
  for (const cmd of candidates) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "pipe" });
      return cmd;
    } catch {}
  }
  throw new Error("Python غير موجود على السيرفر/الجهاز");
}

function generateAudioWithEdgeTts(workDir: string) {
  const python = findPythonCommand();
  const script = path.join(process.cwd(), "scripts", "generate_audio_edge.py");
  if (!fs.existsSync(script)) {
    throw new Error("ملف scripts/generate_audio_edge.py غير موجود");
  }

  execFileSync(python, [script, workDir, process.env.EDGE_TTS_VOICE || "ar-SA-HamedNeural"], {
    stdio: "pipe",
    timeout: 120000,
  });
}

async function uploadFileBuffer(client: ftp.Client, remoteDir: string, fileName: string, buffer: Buffer) {
  await client.ensureDir(remoteDir);
  await client.uploadFrom(bufferToStream(buffer), fileName);
}

async function uploadAudioFolder(client: ftp.Client, localAudioDir: string, remoteDir: string) {
  if (!fs.existsSync(localAudioDir)) return 0;

  const files = fs.readdirSync(localAudioDir).filter((name) => name.toLowerCase().endsWith(".mp3"));
  for (const fileName of files) {
    const buffer = fs.readFileSync(path.join(localAudioDir, fileName));
    await uploadFileBuffer(client, remoteDir, fileName, buffer);
  }

  return files.length;
}

function getTemplateUrl(templateId: string) {
  const base = process.env.NEXT_PUBLIC_GAME_TEMPLATE_BASE_URL;
  const filesBaseUrl = process.env.NEXT_PUBLIC_FILES_URL || "";

  if (base) {
    return `${base.replace(/\/$/, "")}/${templateId}/index.html`;
  }

  return `${filesBaseUrl}/game-templates/${templateId}/index.html`;
}

export async function POST(req: NextRequest) {
  const client = new ftp.Client();
  let workDir = "";

  try {
    const body = await req.json();
    const templateId = safeId(String(body.template_id || ""));
    const inputGame = body.game || {};
    const previousGame = body.previous_game || null;
    const requestedId = safeId(String(body.id || body.content_id || ""));

    if (!templateId) {
      return NextResponse.json({ success: false, message: "template_id مطلوب" }, { status: 400 });
    }

    const gameId = requestedId || `${templateId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const filesBaseUrl = process.env.NEXT_PUBLIC_FILES_URL || "";
    const basePath = process.env.FTP_BASE_PATH!;

    const normalizedGame = normalizeTemplateGame(templateId, inputGame);
    const { game, tts } = assignAudioWithCache(normalizedGame, gameId, previousGame);

    workDir = path.join(os.tmpdir(), `waei-game-data-${gameId}`);
    fs.mkdirSync(workDir, { recursive: true });
    fs.writeFileSync(path.join(workDir, "tts_items.json"), JSON.stringify(tts, null, 2), "utf8");

    if (tts.length > 0) {
      generateAudioWithEdgeTts(workDir);
    }

    await client.access({
      host: process.env.FTP_HOST!,
      user: process.env.FTP_USER!,
      password: process.env.FTP_PASSWORD!,
      port: Number(process.env.FTP_PORT || 21),
      secure: process.env.FTP_SECURE === "true",
      secureOptions: { rejectUnauthorized: false },
    });

    const dataRemoteDir = `${basePath}/uploads/game-data`;
    const audioRemoteDir = `${basePath}/uploads/game-audio/${gameId}`;
    const dataFileName = `${gameId}.json`;
    const dataPublicPath = `/uploads/game-data/${dataFileName}`;

    await uploadFileBuffer(
      client,
      dataRemoteDir,
      dataFileName,
      Buffer.from(JSON.stringify(game, null, 2), "utf8")
    );

    const uploadedAudioCount = await uploadAudioFolder(client, path.join(workDir, "audio"), audioRemoteDir);

    client.close();

    const dataUrl = `${filesBaseUrl}${dataPublicPath}`;
    const templateUrl = getTemplateUrl(templateId);
    const gameUrl = `${templateUrl}?data=${encodeURIComponent(dataPublicPath)}&v=${Date.now()}`;

    return NextResponse.json({
      success: true,
      id: gameId,
      template_id: templateId,
      game,
      game_url: gameUrl,
      iframe_url: gameUrl,
      data_path: dataPublicPath,
      data_url: dataUrl,
      tts_count: tts.length,
      uploaded_audio_count: uploadedAudioCount,
      reused_audio_count: Math.max(0, JSON.stringify(game).split("/uploads/game-audio/").length - 1 - tts.length),
      message: tts.length
        ? `تم حفظ بيانات اللعبة وتوليد ${tts.length} صوت جديد فقط`
        : "تم حفظ بيانات اللعبة بدون توليد أصوات جديدة",
    });
  } catch (error: any) {
    client.close();

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "فشل حفظ بيانات اللعبة",
      },
      { status: 500 }
    );
  } finally {
    if (workDir && fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}
