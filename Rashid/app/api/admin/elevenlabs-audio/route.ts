import { NextRequest, NextResponse } from "next/server";
import ftp from "basic-ftp";
import { Readable } from "stream";

export const runtime = "nodejs";

function safeFileName(name: string) {
  const clean = String(name || "audio")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");

  return `${Date.now()}-${clean || "audio"}.mp3`;
}

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(req: NextRequest) {
  const client = new ftp.Client();

  try {
    const { text, name } = await req.json();
    const cleanText = String(text || "").trim();

    if (!cleanText) {
      return NextResponse.json(
        { success: false, message: "النص مطلوب لتوليد الصوت" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "ELEVENLABS_API_KEY غير موجود في .env" },
        { status: 500 },
      );
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "w4LX7bK479eHGM1k15Em";

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            speed: 1.0,
            stability: 0.4,
            similarity_boost: 0.15,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!elevenRes.ok) {
      const error = await elevenRes.text();
      return NextResponse.json(
        { success: false, message: error || "فشل توليد الصوت من ElevenLabs" },
        { status: 500 },
      );
    }

    const audioBuffer = Buffer.from(await elevenRes.arrayBuffer());
    const fileName = safeFileName(name || "tts");

    const basePath = process.env.FTP_BASE_PATH!;
    const remoteDir = `${basePath}/uploads/game-audio`;
    const publicPath = `/uploads/game-audio/${fileName}`;

    await client.access({
      host: process.env.FTP_HOST!,
      user: process.env.FTP_USER!,
      password: process.env.FTP_PASSWORD!,
      port: 21,
      secure: false,
      secureOptions: {
        rejectUnauthorized: false,
      },
    });

    await client.ensureDir(remoteDir);
    await client.uploadFrom(bufferToStream(audioBuffer), fileName);
    client.close();

    return NextResponse.json({
      success: true,
      path: publicPath,
      url: `${process.env.NEXT_PUBLIC_FILES_URL || ""}${publicPath}`,
    });
  } catch (error: any) {
    client.close();
    return NextResponse.json(
      { success: false, message: error?.message || "فشل توليد الصوت" },
      { status: 500 },
    );
  }
}
