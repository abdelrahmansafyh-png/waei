import { NextRequest, NextResponse } from "next/server";
import ftp from "basic-ftp";
import { Readable } from "stream";

export const runtime = "nodejs";

function safeFileName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "png";
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "files";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 },
      );
    }

    const allowedFolders = [
      "banners",
      "programs",
      "files",
      "games",
      "game-images",
      "game-audio",
      "landing",
    ];
    const safeFolder = allowedFolders.includes(folder) ? folder : "files";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = safeFileName(file.name);

    const basePath = process.env.FTP_BASE_PATH!;
    const remoteDir = `${basePath}/uploads/${safeFolder}`;
    const publicPath = `/uploads/${safeFolder}/${fileName}`;

    client.ftp.verbose = true;

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
    await client.uploadFrom(bufferToStream(buffer), fileName);

    client.close();

    return NextResponse.json({
      success: true,
      path: publicPath,
      url: `${process.env.NEXT_PUBLIC_FILES_URL}${publicPath}`,
    });
  } catch (error: any) {
    client.close();

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Upload failed",
      },
      { status: 500 },
    );
  }
}
