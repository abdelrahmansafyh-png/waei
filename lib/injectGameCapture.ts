
import JSZip from "jszip";
import { WAEI_CAPTURE_SCRIPT } from "./gameCaptureScript";

function dir(path: string) {
  return path.includes("/") ? path.split("/").slice(0, -1).join("/") + "/" : "";
}

function findIndex(zip: JSZip) {
  const files = Object.keys(zip.files);
  const indexes = files.filter((p) => p.toLowerCase().endsWith("index.html") && !zip.files[p].dir);
  return indexes.find((p) => files.includes(dir(p) + "config.js")) || indexes[0] || null;
}

export async function injectGameCaptureToZip(input: ArrayBuffer | Buffer) {
  const zip = await JSZip.loadAsync(input);
  const indexPath = findIndex(zip);

  if (!indexPath) throw new Error("لم يتم العثور على index.html داخل اللعبة");

  const base = dir(indexPath);

  zip.file(base + "waei-capture.js", WAEI_CAPTURE_SCRIPT);

  // zip.file(
  //   base + "html2canvas.min.js",
  //   await fetch("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js").then((r) => r.text())
  // );

  const html2canvasRes = await fetch(
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
  );

  if (!html2canvasRes.ok) {
    throw new Error("Failed to load html2canvas");
  }

  const html2canvasCode: string = await html2canvasRes.text();

  zip.file(base + "html2canvas.min.js", html2canvasCode);

  let html = await zip.file(indexPath)!.async("string");

  if (!html.includes("html2canvas.min.js")) {
    html = html.replace(/<\/head>/i, `<script src="html2canvas.min.js"></script>\n</head>`);
  }

  if (!html.includes("waei-capture.js")) {
    html = /<\/body>/i.test(html)
      ? html.replace(/<\/body>/i, `<script src="waei-capture.js"></script>\n</body>`)
      : html + `\n<script src="waei-capture.js"></script>\n`;
  }

  zip.file(indexPath, html);

  return {
    buffer: await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
    indexPath,
  };
}
