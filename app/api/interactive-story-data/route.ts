import { NextRequest, NextResponse } from "next/server";
import ftp from "basic-ftp";
import { Readable } from "stream";

export const runtime = "nodejs";

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function safeFileName(value?: string | null) {
  const clean = String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return clean || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(req: NextRequest) {
  const client = new ftp.Client();

  try {
    const body = await req.json();
    const story = body.story || body.game;

    if (!story || typeof story !== "object") {
      return NextResponse.json(
        { success: false, message: "بيانات القصة غير موجودة" },
        { status: 400 }
      );
    }

    const id = safeFileName(body.id || body.content_id || body.story_id);
    const fileName = `${id}.json`;

    const basePath = process.env.FTP_BASE_PATH!;
    const filesBaseUrl = process.env.NEXT_PUBLIC_FILES_URL || "";
    const remoteDir = `${basePath}/uploads/story-data`;
    const publicPath = `/uploads/story-data/${fileName}`;

    const buffer = Buffer.from(JSON.stringify(story, null, 2), "utf8");

    await client.access({
      host: process.env.FTP_HOST!,
      user: process.env.FTP_USER!,
      password: process.env.FTP_PASSWORD!,
      port: Number(process.env.FTP_PORT || 21),
      secure: process.env.FTP_SECURE === "true",
      secureOptions: { rejectUnauthorized: false },
    });

    await client.ensureDir(remoteDir);
    await client.uploadFrom(bufferToStream(buffer), fileName);
    client.close();

    return NextResponse.json({
      success: true,
      id,
      path: publicPath,
      url: `${filesBaseUrl}${publicPath}`,
      message: "تم حفظ بيانات القصة فقط بدون رفع التيمبليت",
    });
  } catch (error: any) {
    client.close();

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "فشل حفظ بيانات القصة",
      },
      { status: 500 }
    );
  }
}
