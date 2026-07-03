
import { NextRequest, NextResponse } from "next/server";
import ftp from "basic-ftp";
import AdmZip from "adm-zip";
import { Readable } from "stream";
import path from "path";
import { WAEI_CAPTURE_SCRIPT } from "@/lib/gameCaptureScript";

export const runtime = "nodejs";

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);  
  return stream;
}

function safeName(name: string) {
  return name
    .replace(/\.zip$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function dirname(entryName: string) {
  const normalized = entryName.replace(/\\/g, "/");
  return normalized.includes("/")
    ? normalized.split("/").slice(0, -1).join("/")
    : "";
}

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
    await client.uploadFrom(
      bufferToStream(entry.getData()),
      path.posix.basename(remotePath)
    );
  }
}

async function getHtml2CanvasBuffer() {
  const res = await fetch(
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
  );

  if (!res.ok) {
    throw new Error("Failed to download html2canvas");
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req: NextRequest) {
  const client = new ftp.Client();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const contentId = String(formData.get("content_id") || "");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { success: false, message: "الملف يجب أن يكون ZIP" },
        { status: 400 }
      );
    }

    const zip = new AdmZip(Buffer.from(await file.arrayBuffer()));
    const entries = zip.getEntries();

    const indexEntry = entries.find((entry) => {
      if (entry.isDirectory) return false;

      const name = entry.entryName.toLowerCase().replace(/\\/g, "/");

      return name.endsWith("index.html");
    });

    if (!indexEntry) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على index.html" },
        { status: 400 }
      );
    }

    const gameDir = dirname(indexEntry.entryName);
    const prefix = gameDir ? `${gameDir}/` : "";

    let html = indexEntry.getData().toString("utf8");

    if (!html.includes("html2canvas.min.js")) {
      html = html.replace(
        /<\/head\s*>/i,
        `<script src="./html2canvas.min.js"></script>\n</head>`
      );
    }

    if (!html.includes("waei-capture.js")) {
      const scriptTag = `<script src="./waei-capture.js"></script>`;

      if (/<\/body\s*>/i.test(html)) {
        html = html.replace(/<\/body\s*>/i, `${scriptTag}\n</body>`);
      } else if (/<\/head\s*>/i.test(html)) {
        html = html.replace(/<\/head\s*>/i, `${scriptTag}\n</head>`);
      } else {
        html += `\n${scriptTag}`;
      }
    }

    zip.updateFile(indexEntry.entryName, Buffer.from(html, "utf8"));
    zip.addFile(`${prefix}waei-capture.js`, Buffer.from(WAEI_CAPTURE_SCRIPT, "utf8"));
    zip.addFile(`${prefix}html2canvas.min.js`, await getHtml2CanvasBuffer());

    const gameId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    await uploadDir(client, zip.getEntries(), remoteBase);

    client.close();

    const indexPublicPath = `/uploads/games/${gameId}/${indexEntry.entryName.replace(/\\/g, "/")}`;
    const gameUrl = `${process.env.NEXT_PUBLIC_FILES_URL}${indexPublicPath}`;

    return NextResponse.json({
      success: true,
      game_url: gameUrl,
      iframe_url: gameUrl,
      game_folder: `/uploads/games/${gameId}`,
      content_id: contentId || null,
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
