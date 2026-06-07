import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, message: "Missing url" },
        { status: 400 }
      );
    }

    let target: URL;

    try {
      target = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid url" },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(target.protocol)) {
      return NextResponse.json(
        { success: false, message: "Only http/https URLs are allowed" },
        { status: 400 }
      );
    }

    const res = await fetch(target.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent": "WAEI-Game-Json-Reader",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch game.json: ${res.status}`,
          url: target.toString(),
        },
        { status: 404 }
      );
    }

    const text = await res.text();

    try {
      const game = JSON.parse(text);
      return NextResponse.json({ success: true, game });
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "game.json is not valid JSON",
          url: target.toString(),
        },
        { status: 500 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Failed to read game.json",
      },
      { status: 500 }
    );
  }
}
