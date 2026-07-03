const FILES_BASE_URL =
  process.env.NEXT_PUBLIC_FILES_URL || "";

export function getFileUrl(path?: string | null) {
  if (!path) return "/placeholder.png";

  if (path.startsWith("http")) {
    return path;
  }

  return `${FILES_BASE_URL}${path}`;
}