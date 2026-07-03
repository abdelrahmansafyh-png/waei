import { getFileUrl } from "@/lib/files";
import type { Content, Tab } from "./types";

export function youtubeEmbed(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export function normalizeIframeUrl(value: string) {
  if (!value) return "";
  const srcMatch = value.match(/src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : value.trim();
}

export function icon(type: string) {
  if (type === "interactive_stories" || type === "interactive_story") return "🎭";
  if (type === "games" || type === "iframe" || type === "zip_game") return "🎮";
  if (type === "youtube") return "▶️";
  if (type === "video") return "🎬";
  if (type === "image" || type === "images") return "🖼️";
  if (type === "file" || type === "files") return "📎";
  return "📘";
}

export function calculateXp(score: number, maxScore: number, percentage: number) {
  if (maxScore > 0) return Math.max(0, score) * 10;
  if (percentage >= 90) return 150;
  if (percentage >= 70) return 120;
  if (percentage > 0) return 100;
  return 0;
}

export function hasNativeStoryData(item: Content | null | undefined) {
  if (!item || item.content_type !== "interactive_story") return false;

  const meta = readContentMeta(item);
  const editorScenes = Array.isArray(meta.editor_scenes) ? meta.editor_scenes : [];
  const storyScenes = Array.isArray(meta.story?.scenes) ? meta.story.scenes : [];

  return editorScenes.length > 0 || storyScenes.some((scene: any) => Array.isArray(scene?.answers));
}

export function isPlayableContent(item: Content) {
  if (item.content_type === "interactive_story") {
    return Boolean(item.iframe_url) || hasNativeStoryData(item);
  }

  return (item.content_type === "iframe" || item.content_type === "zip_game") && Boolean(item.iframe_url);
}

export function isTimedExternalPlayableContent(item: Content | null | undefined) {
  if (!item?.iframe_url) return false;
  if (item.game_folder) return false;

  const url = normalizeIframeUrl(item.iframe_url).toLowerCase();

  // Wordwall / external iframe activities do not send game results.
  // They are counted as completed after the child stays on their sub-tab for 25 seconds.
  return item.content_type === "iframe" || url.includes("wordwall.net");
}

export function getContentKind(contentType: string) {
  if (contentType === "interactive_story" || contentType === "interactive_stories") return "story";
  if (contentType === "iframe" || contentType === "zip_game") return "game";
  return "content";
}

export function readContentMeta(item: Content | null | undefined) {
  if (!item?.body) return {} as any;

  try {
    return JSON.parse(item.body) || {};
  } catch {
    return {} as any;
  }
}

export function getActivityCover(item: Content | null | undefined, index = 0) {
  const meta = readContentMeta(item);
  const cover = meta.cover_image_url || meta.coverImageUrl || meta.thumbnail_url || meta.image_url;

  if (cover) return `url("${getFileUrl(cover)}")`;

  const fallback = [
    "linear-gradient(135deg, var(--rashid-color-dff7ff), var(--rashid-color-f6e7ff))",
    "linear-gradient(135deg, var(--rashid-color-fff2cc), var(--rashid-color-e3fff1))",
    "linear-gradient(135deg, var(--rashid-color-e9ddff), var(--rashid-color-f5fbff))",
    "linear-gradient(135deg, var(--rashid-color-d9f99d), var(--rashid-color-e0f2fe))",
    "linear-gradient(135deg, var(--rashid-color-ffe4e6), var(--rashid-color-ede9fe))",
    "linear-gradient(135deg, var(--rashid-color-ccfbf1), var(--rashid-color-fef3c7))",
  ];

  return fallback[index % fallback.length];
}

export function getActivityIcon(item: Content | null | undefined, index = 0) {
  const meta = readContentMeta(item);
  if (meta.activity_icon) return meta.activity_icon;

  const icons = ["🧩", "🔎", "🎧", "🎨", "🌱", "🃏", "🚀", "📚"];
  return icons[index % icons.length];
}

export function normalizeArabicForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u0652]/g, "");
}

export function hasAnyWord(value: string, words: string[]) {
  const normalized = normalizeArabicForMatch(value);
  return words.some((word) => normalized.includes(normalizeArabicForMatch(word)));
}

export function getSequentialExperienceCopy(tab: Tab | null | undefined) {
  const title = (tab?.title || "").trim();
  const titlePart = title ? `قسم "${title}"` : "هذا القسم";

  if (tab?.type === "interactive_stories") {
    return {
      kind: "story",
      icon: "🎭",
      guideIcon: "🎭",
      itemName: "القصة",
      itemPrevious: "القصة السابقة",
      itemNext: "القصة التالية",
      itemLabel: "قصة",
      fallbackTitle: "القصة",
      guideTitle: "تابع القصص بالترتيب",
      guideDescription: `داخل ${titlePart}: ابدأ القصة الحالية، وبعد إكمالها تفتح القصة التالية تلقائيًا.`,
      lockedAlert: "أكمل القصة السابقة أولًا 🎭",
      currentAlert: "أكمل القصة الحالية أولًا 🎭",
      doneStatus: "مكتملة",
      activeStatus: "الحالية",
      openStatus: "مفتوحة",
      lockedStatus: "تفتح لاحقًا",
    };
  }

  const isLearningTitle = hasAnyWord(title, [
    "العب",
    "لعب",
    "تعلم",
    "تعليم",
    "نشاط",
    "انشطة",
    "أنشطة",
    "محطات",
  ]);

  const isChallenge =
    hasAnyWord(title, [
      "تحدي",
      "تحديات",
      "اكسب",
      "اختبر",
      "اختبار",
      "مهمة",
      "مهام",
      "مسابقة",
      "جائزة",
      "جوائز",
      "كأس",
      "كاس",
      "بطل",
      "بطولة",
      "مسار",
    ]) ||
    (tab?.type === "games" && !isLearningTitle);

  if (isChallenge) {
    return {
      kind: "challenge",
      icon: "🏆",
      guideIcon: "🏆",
      itemName: "التحدي",
      itemPrevious: "التحدي السابق",
      itemNext: "التحدي التالي",
      itemLabel: "تحدي",
      fallbackTitle: "التحدي",
      guideTitle: "امشِ على التحديات بالترتيب",
      guideDescription: `داخل ${titlePart}: اضغط على التحدي الحالي، وبعد إكماله يفتح التحدي التالي تلقائيًا.`,
      lockedAlert: "أكمل التحدي السابق أولًا 🏆",
      currentAlert: "أكمل التحدي الحالي أولًا 🏆",
      doneStatus: "مكتمل",
      activeStatus: "الحالي",
      openStatus: "مفتوح",
      lockedStatus: "يفتح لاحقًا",
    };
  }

  return {
    kind: "activity",
    icon: "🌱",
    guideIcon: "🌱",
    itemName: "النشاط",
    itemPrevious: "النشاط السابق",
    itemNext: "النشاط التالي",
    itemLabel: "نشاط",
    fallbackTitle: "النشاط",
    guideTitle: "امشِ على الأنشطة بالترتيب",
    guideDescription: `داخل ${titlePart}: اضغط على النشاط الحالي، وبعد إكماله يفتح النشاط التالي تلقائيًا.`,
    lockedAlert: "أكمل النشاط السابق أولًا 🌱",
    currentAlert: "أكمل النشاط الحالي أولًا 🌱",
    doneStatus: "مكتمل",
    activeStatus: "الحالي",
    openStatus: "مفتوح",
    lockedStatus: "يفتح لاحقًا",
  };
}

export function getSequentialCardIcon(item: Content | null | undefined, index: number, copy: ReturnType<typeof getSequentialExperienceCopy>) {
  const metaIcon = readContentMeta(item).activity_icon;
  if (metaIcon) return metaIcon;
  if (copy.kind === "challenge") return ["🏆", "⚡", "🎯", "🎁", "⭐", "👑", "🚀", "💎"][index % 8];
  return getActivityIcon(item, index);
}

export function normalizeStoryScene(scene: any, index: number) {
  return {
    ...scene,
    title: scene?.title || `المشهد ${index + 1}`,
    story: scene?.story || scene?.description || scene?.text || "",
    videoUrl: scene?.videoUrl || scene?.video_url || scene?.file_url || scene?.mediaUrl || "",
    imageUrl: scene?.imageUrl || scene?.image_url || scene?.image || "",
    question: scene?.question || scene?.prompt || "",
    answers: Array.isArray(scene?.answers) ? scene.answers : [],
  };
}

export function getNativeStoryInfo(item: Content | null | undefined) {
  const meta = readContentMeta(item);
  const story = meta.story || {};
  const editorScenes = Array.isArray(meta.editor_scenes) ? meta.editor_scenes : [];
  const templateScenes = Array.isArray(story.scenes)
    ? story.scenes.filter((scene: any) => Array.isArray(scene?.answers) || scene?.question || scene?.story)
    : [];
  const rawScenes = editorScenes.length ? editorScenes : templateScenes;

  return {
    title: story.title || item?.title || "قصة تفاعلية",
    description:
      story.description ||
      meta.description ||
      "شاهد القصة مشهدًا وراء مشهد، واختر التصرف المناسب داخل نفس الشاشة.",
    coverImageUrl: meta.cover_image_url || meta.coverImageUrl || meta.thumbnail_url || meta.image_url || "",
    scenes: rawScenes.map(normalizeStoryScene),
  };
}

export function getNativeStoryAnswerLabel(answer: any, index: number) {
  return answer?.text || answer?.title || answer?.label || `الخيار ${index + 1}`;
}

export function getStoryMediaUrl(value?: string | null) {
  if (!value) return "";
  return getFileUrl(value);
}
