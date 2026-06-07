"use client";

import { useState } from "react";

export default function ZipGameUploader({
  onUploaded,
}: {
  onUploaded?: (game: {
    game_url: string;
    path: string;
    game_folder: string;
  }) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [gameUrl, setGameUrl] = useState("");
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload-game", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "فشل رفع اللعبة");
      }

      setGameUrl(json.game_url);
      onUploaded?.(json);
    } catch (e: any) {
      setError(e?.message || "فشل رفع اللعبة");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#DDEDEA] bg-[#F9FFFD] p-4">
      <label className="mb-3 block font-black text-[#0B4D6B]">
        رفع لعبة ZIP
      </label>

      <input
        type="file"
        accept=".zip,application/zip"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
        className="w-full rounded-xl bg-white p-3"
      />

      {uploading && (
        <div className="mt-3 rounded-xl bg-[#FFF7D8] p-3 font-black text-[#9A6B00]">
          جاري رفع اللعبة وفك الضغط وحقن bridge...
        </div>
      )}

      {gameUrl && (
        <div className="mt-3 rounded-xl bg-[#E9FFF7] p-3 text-sm font-black text-[#064E3B] break-all">
          تم تجهيز اللعبة:
          <br />
          {gameUrl}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 p-3 font-black text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
