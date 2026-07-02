"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";
import ChildLayout from "@/components/child/ChildLayout";
import { getChildAvatar, getChildName, isProActive } from "@/components/child/childUtils";

type Program = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  age_range: string | null;
  access_type: string | null;
  categories?: { name: string } | null;
};

type Tab = {
  id: string;
  title: string;
  type: string;
  sort_order: number;
};

type Content = {
  id: string;
  tab_id: string;
  content_type: string;
  title: string | null;
  body: string | null;
  file_url: string | null;
  youtube_url: string | null;
  iframe_url: string | null;
  game_folder?: string | null;
  sort_order: number;
};

function youtubeEmbed(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function normalizeIframeUrl(value: string) {
  if (!value) return "";
  const srcMatch = value.match(/src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : value.trim();
}

function icon(type: string) {
  if (type === "interactive_stories" || type === "interactive_story") return "🎭";
  if (type === "games" || type === "iframe" || type === "zip_game") return "🎮";
  if (type === "youtube") return "▶️";
  if (type === "video") return "🎬";
  if (type === "image" || type === "images") return "🖼️";
  if (type === "file" || type === "files") return "📎";
  return "📘";
}

function calculateXp(score: number, maxScore: number, percentage: number) {
  if (maxScore > 0) return Math.max(0, score) * 10;
  if (percentage >= 90) return 150;
  if (percentage >= 70) return 120;
  if (percentage > 0) return 100;
  return 0;
}

function hasNativeStoryData(item: Content | null | undefined) {
  if (!item || item.content_type !== "interactive_story") return false;

  const meta = readContentMeta(item);
  const editorScenes = Array.isArray(meta.editor_scenes) ? meta.editor_scenes : [];
  const storyScenes = Array.isArray(meta.story?.scenes) ? meta.story.scenes : [];

  return editorScenes.length > 0 || storyScenes.some((scene: any) => Array.isArray(scene?.answers));
}

function isPlayableContent(item: Content) {
  if (item.content_type === "interactive_story") {
    return Boolean(item.iframe_url) || hasNativeStoryData(item);
  }

  return (item.content_type === "iframe" || item.content_type === "zip_game") && Boolean(item.iframe_url);
}

function isTimedExternalPlayableContent(item: Content | null | undefined) {
  if (!item?.iframe_url) return false;
  if (item.game_folder) return false;

  const url = normalizeIframeUrl(item.iframe_url).toLowerCase();

  // Wordwall / external iframe activities do not send game results.
  // They are counted as completed after the child stays on their sub-tab for 25 seconds.
  return item.content_type === "iframe" || url.includes("wordwall.net");
}

function getContentKind(contentType: string) {
  if (contentType === "interactive_story" || contentType === "interactive_stories") return "story";
  if (contentType === "iframe" || contentType === "zip_game") return "game";
  return "content";
}

function readContentMeta(item: Content | null | undefined) {
  if (!item?.body) return {} as any;

  try {
    return JSON.parse(item.body) || {};
  } catch {
    return {} as any;
  }
}

function getActivityCover(item: Content | null | undefined, index = 0) {
  const meta = readContentMeta(item);
  const cover = meta.cover_image_url || meta.coverImageUrl || meta.thumbnail_url || meta.image_url;

  if (cover) return `url("${getFileUrl(cover)}")`;

  const fallback = [
    "linear-gradient(135deg, #dff7ff, #f6e7ff)",
    "linear-gradient(135deg, #fff2cc, #e3fff1)",
    "linear-gradient(135deg, #e9ddff, #f5fbff)",
    "linear-gradient(135deg, #d9f99d, #e0f2fe)",
    "linear-gradient(135deg, #ffe4e6, #ede9fe)",
    "linear-gradient(135deg, #ccfbf1, #fef3c7)",
  ];

  return fallback[index % fallback.length];
}

function getActivityIcon(item: Content | null | undefined, index = 0) {
  const meta = readContentMeta(item);
  if (meta.activity_icon) return meta.activity_icon;

  const icons = ["🧩", "🔎", "🎧", "🎨", "🌱", "🃏", "🚀", "📚"];
  return icons[index % icons.length];
}

function normalizeArabicForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u0652]/g, "");
}

function hasAnyWord(value: string, words: string[]) {
  const normalized = normalizeArabicForMatch(value);
  return words.some((word) => normalized.includes(normalizeArabicForMatch(word)));
}

function getSequentialExperienceCopy(tab: Tab | null | undefined) {
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

function getSequentialCardIcon(item: Content | null | undefined, index: number, copy: ReturnType<typeof getSequentialExperienceCopy>) {
  const metaIcon = readContentMeta(item).activity_icon;
  if (metaIcon) return metaIcon;
  if (copy.kind === "challenge") return ["🏆", "⚡", "🎯", "🎁", "⭐", "👑", "🚀", "💎"][index % 8];
  return getActivityIcon(item, index);
}

function normalizeStoryScene(scene: any, index: number) {
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

function getNativeStoryInfo(item: Content | null | undefined) {
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

function getNativeStoryAnswerLabel(answer: any, index: number) {
  return answer?.text || answer?.title || answer?.label || `الخيار ${index + 1}`;
}

function getStoryMediaUrl(value?: string | null) {
  if (!value) return "";
  return getFileUrl(value);
}

export default function ChildProgramPage() {
  const params = useParams();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const resumeContentId = searchParams.get("content") || "";

  const [profile, setProfile] = useState<any>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [activeGameId, setActiveGameId] = useState("");
  const [gameResult, setGameResult] = useState<any>(null);
  const [gameAnswers, setGameAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [fullscreenGame, setFullscreenGame] = useState<string | null>(null);
  const [completedContentIds, setCompletedContentIds] = useState<string[]>([]);
  const [storyStarted, setStoryStarted] = useState(false);
  const [storySceneIndex, setStorySceneIndex] = useState(0);
  const [storyFeedback, setStoryFeedback] = useState<any>(null);
  const [storyAnswers, setStoryAnswers] = useState<any[]>([]);

  const startTimeRef = useRef<number>(Date.now());
  const elapsedSecondsRef = useRef(0);
  const savedFinalRef = useRef(false);

  const selectedGameRef = useRef<Content | null>(null);
  const externalIframeTimersRef = useRef<Record<string, number>>({});

  const proActive = isProActive(profile);
  const locked = program?.access_type === "pro" && !proActive;

  const childName = getChildName(profile);
  const childAvatar = getChildAvatar(profile);

  useEffect(() => {
    fetchPage();
  }, []);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    if (!profile?.id || !program?.id) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("child_program_progress")
        .select("elapsed_seconds")
        .eq("child_profile_id", profile.id)
        .eq("program_id", program.id)
        .maybeSingle();

      if (!cancelled && !error && typeof data?.elapsed_seconds === "number") {
        setElapsedSeconds(data.elapsed_seconds);
        elapsedSecondsRef.current = data.elapsed_seconds;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, program?.id]);

  useEffect(() => {
    if (!profile?.id || !program?.id || finished) return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [profile?.id, program?.id, finished]);

  useEffect(() => {
    if (!profile?.id || !program?.id) return;

    const saveElapsed = async () => {
      await supabase.from("child_program_progress").upsert(
        {
          child_profile_id: profile.id,
          program_id: program.id,
          elapsed_seconds: elapsedSecondsRef.current,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "child_profile_id,program_id" }
      );
    };

    const interval = window.setInterval(saveElapsed, 5000);

    const onBeforeUnload = () => {
      void saveElapsed();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void saveElapsed();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      void saveElapsed();
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [profile?.id, program?.id]);

  async function fetchPage() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profileData) {
      router.push("/login");
      return;
    }

    setProfile(profileData);

    const { data: programData } = await supabase
      .from("programs")
      .select("*, categories(name)")
      .eq("slug", slug)
      .eq("is_published", true)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .single();

    if (!programData) {
      setLoading(false);
      return;
    }

    setProgram(programData as Program);

    const { data: tabsData } = await supabase
      .from("program_tabs")
      .select("*")
      .eq("program_id", programData.id)
      .order("sort_order", { ascending: true });

    const tabIds = (tabsData || []).map((t) => t.id);

    let contentData: Content[] = [];

    if (tabIds.length) {
      const { data } = await supabase
        .from("tab_contents")
        .select("*")
        .in("tab_id", tabIds)
        .order("sort_order", { ascending: true });

      contentData = (data as Content[]) || [];
    }

    setProgram(programData as Program);
    setTabs((tabsData as Tab[]) || []);
    setContents(contentData);

    const { data: progressData } = await supabase
      .from("child_content_progress")
      .select("content_id")
      .eq("child_profile_id", profileData.id)
      .eq("program_id", programData.id)
      .eq("completed", true);

    setCompletedContentIds(
      Array.from(
        new Set(
          ((progressData || []) as any[])
            .map((item) => item.content_id)
            .filter(Boolean)
        )
      )
    );

    if (tabsData?.length) {
      const resumeContent = resumeContentId
        ? contentData.find((item) => item.id === resumeContentId)
        : null;

      setActiveTab(resumeContent?.tab_id || tabsData[0].id);
      if (resumeContent && isPlayableContent(resumeContent)) {
        setActiveGameId(resumeContent.id);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      const data = event.data;

      if (!data || typeof data !== "object" || !data.type) return;

      if (data.type === "RASHID_GAME_EVENT" && data.event === "question_snapshot") {
        if (Array.isArray(data.answers)) {
          setGameAnswers(data.answers);
        }
      }

      if (data.type === "RASHID_GAME_RESULT" || data.type === "WAEI_GAME_RESULT") {
        setGameResult(data);

        if (Array.isArray(data.answers)) {
          setGameAnswers(data.answers);
        }

        await saveAttempt(data);
      }
    }

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [profile, program]);

  async function saveAttempt(data: any) {
    if (!profile?.id || !program?.id || !selectedGameRef.current?.id) return;

    const content = selectedGameRef.current;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        console.error("save attempt/progress failed", "missing session token");
        return;
      }

      const response = await fetch("/api/child/progress/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_id: program.id,
          content_id: content.id,
          content_type: content.content_type,
          last_position: currentStepIndex,
          duration_seconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
          result: data,
          answers: data.answers || [],
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        console.error("save attempt/progress failed", json.message || json);
        return;
      }

      setCompletedContentIds((prev) =>
        prev.includes(content.id) ? prev : [...prev, content.id]
      );

      if (typeof json.total_xp === "number") {
        setProfile((prev: any) => (prev ? { ...prev, xp: json.total_xp } : prev));
      }

      if (content.content_type === "interactive_story") {
        advanceToNextSequentialContent(content);
      }
    } catch (err) {
      console.error("save attempt/progress failed", err);
    }
  }

  async function saveCurrentPosition(nextContent?: Content | null) {
    if (!profile?.id || !program?.id) return;

    const content = nextContent || selectedGameRef.current || normalContents[0] || null;
    if (!content?.id) return;

    try {
      const now = new Date().toISOString();

      await supabase.from("child_content_progress").upsert(
        {
          child_profile_id: profile.id,
          program_id: program.id,
          content_id: content.id,
          content_type: getContentKind(content.content_type),
          last_position: currentStepIndex,
          updated_at: now,
        },
        { onConflict: "child_profile_id,content_id" }
      );

      await supabase.from("child_program_progress").upsert(
        {
          child_profile_id: profile.id,
          program_id: program.id,
          elapsed_seconds: elapsedSecondsRef.current,
          last_tab_id: content.tab_id || activeTab || null,
          last_content_id: content.id,
          updated_at: now,
        },
        { onConflict: "child_profile_id,program_id" }
      );
    } catch (err) {
      console.error("save position failed", err);
    }
  }

  async function markContentCompleted(
    content: Content | null | undefined,
    resultOverride?: any,
    answersOverride?: any[]
  ) {
    if (!profile?.id || !program?.id || !content?.id) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        console.error("mark content completed failed", "missing session token");
        return;
      }

      const response = await fetch("/api/child/progress/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_id: program.id,
          content_id: content.id,
          content_type: content.content_type,
          last_position: currentStepIndex,
          duration_seconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
          result:
            resultOverride || {
              type: "RASHID_PASSIVE_COMPLETION",
              source: getContentKind(content.content_type),
              completed: true,
              score: 0,
              maxScore: 0,
              percentage: 0,
            },
          answers: answersOverride || [],
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        console.error("mark content completed failed", json.message || json);
        return;
      }

      setCompletedContentIds((prev) =>
        prev.includes(content.id) ? prev : [...prev, content.id]
      );

      if (typeof json.total_xp === "number") {
        setProfile((prev: any) => (prev ? { ...prev, xp: json.total_xp } : prev));
      }
    } catch (err) {
      console.error("mark content completed failed", err);
    }
  }

  function isAutoCompleteContent(item: Content) {
    return ["text", "image", "images", "video", "youtube", "file", "files"].includes(
      item.content_type
    );
  }

  function markTabAutoContentsCompleted(tabId: string) {
    const items = contents.filter(
      (item) => item.tab_id === tabId && isAutoCompleteContent(item)
    );

    items.forEach((item) => {
      if (!completedContentIds.includes(item.id)) {
        markContentCompleted(item);
      }
    });
  }

  function getGameIframeSrc(game: Content | null | undefined) {
    if (!game?.iframe_url) return "";

    const baseUrl = normalizeIframeUrl(game.iframe_url);

    // External iframe activities مثل Wordwall لا نضيف عليها game_data
    // لأنها ممكن تخرب رابط النشاط. نخليها مثل ما هي.
    if (game.content_type === "iframe" && !game.game_folder) {
      return baseUrl;
    }

    // ألعاب وقصص راشد المرفوعة عندنا يكون معها game_folder،
    // والـ game.json موجود داخل نفس فولدر اللعبة على السيرفر.
    if (game.game_folder) {
      const separator = baseUrl.includes("?") ? "&" : "?";
      const folder = game.game_folder.replace(/\/$/, "");
      const gameDataPath = `${folder}/game.json`;

      return `${baseUrl}${separator}game_data=${encodeURIComponent(gameDataPath)}`;
    }

    return baseUrl;
  }

  const activeContents = useMemo(
    () => contents.filter((x) => x.tab_id === activeTab),
    [contents, activeTab]
  );

  const iframeGames = useMemo(
    () =>
      activeContents.filter(isPlayableContent),
    [activeContents]
  );

  const normalContents = useMemo(
    () =>
      activeContents.filter(
        (item) => item.content_type !== "iframe" && item.content_type !== "interactive_story" && item.content_type !== "zip_game"
      ),
    [activeContents]
  );

  const activeTabInfo = tabs.find((t) => t.id === activeTab);
  const activeTabTitle = activeTabInfo?.title;
  const activeTabIcon = activeTabInfo ? icon(activeTabInfo.type) : "🎮";
  const isLearningGamesTab = activeTabInfo?.type === "games";
  const isInteractiveStoriesTab = activeTabInfo?.type === "interactive_stories";
  const isSequentialCardsTab = isLearningGamesTab || isInteractiveStoriesTab;
  const sequentialCopy = getSequentialExperienceCopy(activeTabInfo);

  const selectedGame =
    iframeGames.find((game) => game.id === activeGameId) ||
    (isSequentialCardsTab ? getCurrentLearningActivity(iframeGames) : iframeGames[0]);

  selectedGameRef.current = selectedGame || null;

  useEffect(() => {
    setStoryStarted(false);
    setStorySceneIndex(0);
    setStoryFeedback(null);
    setStoryAnswers([]);
  }, [activeGameId, activeTab]);

  useEffect(() => {
    if (!activeTab) return;
    markTabAutoContentsCompleted(activeTab);
  }, [activeTab, contents, profile?.id, program?.id]);

  useEffect(() => {
    // الألعاب/القصص/الأنشطة الفرعية الخارجية مثل Wordwall لا ترسل نتيجة.
    // لذلك إذا بقي الطفل داخل نفس التاب الفرعي 25 ثانية نحسبه مكتمل.
    // ألعاب راشد الداخلية التي لديها game_folder تبقى تعتمد على RASHID_GAME_RESULT فقط.
    if (!selectedGame) return;
    if (!isTimedExternalPlayableContent(selectedGame)) return;
    if (completedContentIds.includes(selectedGame.id)) return;
    if (externalIframeTimersRef.current[selectedGame.id]) return;

    const contentToComplete = selectedGame;

    externalIframeTimersRef.current[contentToComplete.id] = window.setTimeout(() => {
      markContentCompleted(contentToComplete);
      delete externalIframeTimersRef.current[contentToComplete.id];
    }, 25000);
  }, [selectedGame?.id, completedContentIds.join("|")]);

  const activeIndex = tabs.findIndex((x) => x.id === activeTab);

  const isLastTab = activeIndex === tabs.length - 1;

  const selectedGameIndex = iframeGames.findIndex(
    (game) => game.id === selectedGame?.id
  );

  const hasGames = iframeGames.length > 0;
  const isLastGame = !hasGames || selectedGameIndex === iframeGames.length - 1;
  const isEndStep = isLastTab && isLastGame;

  function isTabCompleted(tabId: string) {
    const tabContentIds = contents
      .filter((item) => item.tab_id === tabId)
      .map((item) => item.id);

    return (
      tabContentIds.length > 0 &&
      tabContentIds.every((id) => completedContentIds.includes(id))
    );
  }

  const totalProgramContents = contents.length;
  const completedProgramContents = contents.filter((item) =>
    completedContentIds.includes(item.id)
  ).length;

  const canFinishProgram =
    totalProgramContents > 0 &&
    completedProgramContents === totalProgramContents;

  const missingProgramContents = contents.filter(
    (item) => !completedContentIds.includes(item.id)
  );

  useEffect(() => {
    const games = contents.filter(
      (item) => item.tab_id === activeTab && isPlayableContent(item)
    );

    setGameResult(null);
    setGameAnswers([]);

    if (games.length > 0) {
      const resumeGame = resumeContentId
        ? games.find((game) => game.id === resumeContentId)
        : null;
      const currentLearningActivity = getCurrentLearningActivity(games);
      const preferredGame =
        isSequentialCardsTab && resumeGame && completedContentIds.includes(resumeGame.id)
          ? currentLearningActivity
          : resumeGame || (isSequentialCardsTab ? currentLearningActivity : games[0]);

      setActiveGameId((previousId) => {
        const previousGame = games.find((game) => game.id === previousId);

        if (isSequentialCardsTab) {
          if (
            previousGame &&
            !completedContentIds.includes(previousGame.id) &&
            isActivityUnlockedInList(games, games.findIndex((game) => game.id === previousGame.id))
          ) {
            return previousGame.id;
          }

          return preferredGame?.id || games[0].id;
        }

        return preferredGame?.id || previousGame?.id || games[0].id;
      });
    } else {
      setActiveGameId("");
    }
  }, [activeTab, contents, completedContentIds.join("|"), isSequentialCardsTab, resumeContentId]);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function getTabGamesCount(tabId: string) {
    return contents.filter((item) => item.tab_id === tabId && isPlayableContent(item)).length;
  }

  const totalSteps = useMemo(() => {
    if (!tabs.length) return 1;

    return tabs.reduce((sum, tab) => {
      const gamesCount = getTabGamesCount(tab.id);
      return sum + Math.max(1, gamesCount);
    }, 0);
  }, [tabs, contents]);

  const currentStepIndex = useMemo(() => {
    if (!tabs.length || !activeTab) return 0;

    let index = 0;

    for (const tab of tabs) {
      if (tab.id === activeTab) {
        const gamesCount = getTabGamesCount(tab.id);

        if (gamesCount > 0) {
          return index + Math.max(0, selectedGameIndex);
        }

        return index;
      }

      index += Math.max(1, getTabGamesCount(tab.id));
    }

    return 0;
  }, [tabs, contents, activeTab, selectedGameIndex]);

  const progressPercentage = finished
    ? 100
    : Math.min(100, Math.max(0, Math.round((currentStepIndex / totalSteps) * 100)));

  async function finishProgram() {
    if (savedFinalRef.current) return;

    if (!canFinishProgram) {
      const firstMissing = missingProgramContents[0];
      alert(
        firstMissing?.title
          ? `أكمل "${firstMissing.title}" أولًا 🌟`
          : "أكمل كل الدروس والأنشطة أولًا 🌟"
      );
      return;
    }

    savedFinalRef.current = true;
    setFinished(true);

    const duration = elapsedSecondsRef.current;

    if (profile?.id && program?.id) {
      const now = new Date().toISOString();

      await supabase.from("child_program_progress").upsert(
        {
          child_profile_id: profile.id,
          program_id: program.id,
          elapsed_seconds: duration,
          last_tab_id: activeTab || null,
          last_content_id: selectedGame?.id || normalContents[0]?.id || null,
          completed: true,
          updated_at: now,
        },
        { onConflict: "child_profile_id,program_id" }
      );

      await supabase.from("game_attempts").insert({
        child_profile_id: profile.id,
        parent_profile_id: profile.parent_profile_id || null,
        content_id: null,
        program_id: program.id,
        score: 0,
        max_score: 0,
        percentage: 100,
        completed: true,
        duration_seconds: duration,
        attempt_number: 1,
        result: {
          event: "program_completed",
          duration_seconds: duration,
          duration_minutes: Math.ceil(duration / 60),
          total_steps: totalSteps,
        },
        answers: [],
      });
    }

    alert(`أحسنت! أنهيت البرنامج خلال ${formatTime(duration)} 🎉`);
    router.push("/dashboard");
  }

  function nextTab() {
    if (!tabs.length) return;

    if (hasGames && !isLastGame) {
      if (isSequentialCardsTab && selectedGame && !completedContentIds.includes(selectedGame.id)) {
        alert(sequentialCopy.currentAlert);
        return;
      }

      const nextGame = iframeGames[selectedGameIndex + 1];
      saveCurrentPosition(nextGame);
      setActiveGameId(nextGame.id);
      if (isInteractiveStoriesTab) {
        resetNativeStoryState();
      }
      return;
    }

    if (isEndStep) {
      finishProgram();
      return;
    }

    const next = activeIndex + 1;
    markTabAutoContentsCompleted(activeTab);
    saveCurrentPosition();
    setActiveTab(tabs[next].id);
  }

  function prevTab() {
    if (!tabs.length) return;

    if (hasGames && selectedGameIndex > 0) {
      const prevGame = iframeGames[selectedGameIndex - 1];
      saveCurrentPosition(prevGame);
      setActiveGameId(prevGame.id);
      return;
    }

    const prev = activeIndex - 1 < 0 ? 0 : activeIndex - 1;
    markTabAutoContentsCompleted(activeTab);
    saveCurrentPosition();
    setActiveTab(tabs[prev].id);
  }

  function isActivityUnlockedInList(games: Content[], index: number) {
    if (index <= 0) return true;

    const previous = games[index - 1];
    const current = games[index];

    return (
      completedContentIds.includes(previous?.id || "") ||
      completedContentIds.includes(current?.id || "")
    );
  }

  function getCurrentLearningActivity(games: Content[]) {
    if (!games.length) return undefined;

    const nextIncomplete = games.find((game, index) => {
      return !completedContentIds.includes(game.id) && isActivityUnlockedInList(games, index);
    });

    return nextIncomplete || games[games.length - 1];
  }

  function isActivityUnlocked(index: number) {
    return isActivityUnlockedInList(iframeGames, index);
  }

  function openLearningActivity(game: Content | null | undefined, index: number) {
    if (!game) return;

    if (!isActivityUnlocked(index)) {
      alert(sequentialCopy.lockedAlert);
      return;
    }

    saveCurrentPosition(game);
    setActiveGameId(game.id);
    setFullscreenGame(getGameIframeSrc(game));
  }

  function startSelectedLearningActivity() {
    if (!selectedGame) return;

    const index = iframeGames.findIndex((game) => game.id === selectedGame.id);

    if (!isActivityUnlocked(index)) {
      alert(sequentialCopy.lockedAlert);
      return;
    }

    setFullscreenGame(getGameIframeSrc(selectedGame));
  }

  function resetNativeStoryState() {
    setStoryStarted(false);
    setStorySceneIndex(0);
    setStoryFeedback(null);
    setStoryAnswers([]);
    setGameAnswers([]);
    setGameResult(null);
  }

  function advanceToNextSequentialContent(content: Content | null | undefined) {
    if (!content?.id) return false;

    const tabItems = contents
      .filter((item) => item.tab_id === content.tab_id && isPlayableContent(item))
      .sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = tabItems.findIndex((item) => item.id === content.id);
    const nextItem = currentIndex >= 0 ? tabItems[currentIndex + 1] : null;

    if (!nextItem) return false;

    saveCurrentPosition(nextItem);
    setActiveGameId(nextItem.id);
    resetNativeStoryState();
    return true;
  }

  function openStoryActivity(game: Content | null | undefined, index: number) {
    if (!game) return;

    if (!isActivityUnlocked(index)) {
      alert(sequentialCopy.lockedAlert);
      return;
    }

    saveCurrentPosition(game);
    setActiveGameId(game.id);
    resetNativeStoryState();
  }

  function startNativeStory() {
    if (!selectedGame) return;

    setStoryStarted(true);
    setStorySceneIndex(0);
    setStoryFeedback(null);
    setStoryAnswers([]);
    setGameAnswers([]);
    setGameResult(null);
    saveCurrentPosition(selectedGame);
  }

  function answerNativeStory(answer: any, answerIndex: number) {
    const info = getNativeStoryInfo(selectedGame);
    const currentScene = info.scenes[storySceneIndex];

    const record = {
      questionNumber: storySceneIndex + 1,
      sceneTitle: currentScene?.title || `المشهد ${storySceneIndex + 1}`,
      questionText: currentScene?.question || currentScene?.story || "",
      selectedAnswers: [{ text: getNativeStoryAnswerLabel(answer, answerIndex) }],
      isCorrect: Boolean(answer?.isCorrect ?? answer?.correct),
    };

    setStoryAnswers((prev) => [...prev, record]);
    setGameAnswers((prev) => [...prev, record]);

    setStoryFeedback({
      ...answer,
      answerIndex,
      text: getNativeStoryAnswerLabel(answer, answerIndex),
      feedbackVideoUrl: answer?.feedbackVideoUrl || answer?.feedback_video_url || answer?.videoUrl || answer?.video_url || "",
      feedbackText:
        answer?.feedbackText ||
        answer?.feedback ||
        (answer?.isCorrect || answer?.correct
          ? "اختيار جميل! تابع القصة."
          : "حاول أن تفكر بالتصرف الأفضل في الموقف القادم."),
      isCorrect: Boolean(answer?.isCorrect ?? answer?.correct),
    });
  }

  async function completeNativeStory() {
    if (!selectedGame) return;

    const result = {
      type: "RASHID_NATIVE_STORY_RESULT",
      source: "story",
      completed: true,
      score: storyAnswers.filter((answer) => answer.isCorrect).length,
      maxScore: storyAnswers.length,
      percentage: storyAnswers.length
        ? Math.round((storyAnswers.filter((answer) => answer.isCorrect).length / storyAnswers.length) * 100)
        : 100,
      answers: storyAnswers,
    };

    await markContentCompleted(selectedGame, result, storyAnswers);

    const movedToNextStory = advanceToNextSequentialContent(selectedGame);

    if (!movedToNextStory) {
      setGameResult(result);
    }
  }

  function continueNativeStory() {
    const info = getNativeStoryInfo(selectedGame);
    const hasNextScene = storySceneIndex < info.scenes.length - 1;

    setStoryFeedback(null);

    if (hasNextScene) {
      setStorySceneIndex((prev) => prev + 1);
      return;
    }

    completeNativeStory();
  }

  function renderLegacyStoryIframe(showTitle = true) {
    const legacyTitleNode = showTitle ? (
      <h2 className="content-title">{activeTabTitle || "قصة تفاعلية"} {activeTabIcon}</h2>
    ) : null;

    if (!selectedGame?.iframe_url) {
      return <div className="empty">لا توجد قصة داخل هذا القسم 🎭</div>;
    }

    return (
      <>
        {legacyTitleNode}
        <div className="story-legacy-card">
          <div className="story-legacy-head">
            <span>🎭</span>
            <div>
              <strong>{selectedGame.title || "قصة تفاعلية"}</strong>
              <p>هذه القصة محفوظة بالطريقة السابقة، وستعمل كما هي بدون حذف أو تغيير بياناتها.</p>
            </div>
          </div>

          <div className="story-legacy-frame">
            <button
              type="button"
              className="desktop-fullscreen-btn"
              onClick={() => setFullscreenGame(getGameIframeSrc(selectedGame))}
              aria-label="فتح القصة على كامل الشاشة"
              title="كامل الشاشة"
            >
              ⛶
            </button>
            <iframe
              src={getGameIframeSrc(selectedGame)}
              className="game-player-iframe"
              allowFullScreen
              allow="fullscreen; autoplay; clipboard-write; encrypted-media"
            />
          </div>
        </div>
      </>
    );
  }

  function renderNativeStoryExperience(showTitle = true) {
    const info = getNativeStoryInfo(selectedGame);
    const scenes = info.scenes;

    if (!selectedGame || !scenes.length) {
      return renderLegacyStoryIframe(showTitle);
    }

    const completed = completedContentIds.includes(selectedGame.id);
    const currentScene = scenes[Math.min(storySceneIndex, scenes.length - 1)];
    const sceneAnswers = Array.isArray(currentScene?.answers) ? currentScene.answers : [];
    const storyCover = info.coverImageUrl ? `url("${getFileUrl(info.coverImageUrl)}")` : getActivityCover(selectedGame, selectedGameIndex);
    const currentMedia = storyFeedback?.feedbackVideoUrl || currentScene?.videoUrl || "";
    const currentImage = !currentMedia ? currentScene?.imageUrl || "" : "";
    const storyTitleNode = showTitle ? (
      <h2 className="content-title">{activeTabTitle || "قصة تفاعلية"} {activeTabIcon}</h2>
    ) : null;

    if (completed && !storyStarted) {
      return (
        <>
          {storyTitleNode}
          <div className="story-start-card">
            <div
              className={`story-start-art ${storyCover.startsWith("linear-gradient") ? "" : "has-image"}`}
              style={{ background: storyCover }}
            >
              <span className="story-start-badge">✅ مكتملة</span>
            </div>
            <div className="story-start-body">
              <div className="story-kicker">قصة تفاعلية</div>
              <h3>{info.title}</h3>
              <p>{info.description}</p>
              <button type="button" className="story-main-btn" onClick={startNativeStory}>
                إعادة مشاهدة القصة <span>↻</span>
              </button>
            </div>
          </div>
        </>
      );
    }

    if (!storyStarted) {
      return (
        <>
          {storyTitleNode}
          <div className="story-start-card">
            <div
              className={`story-start-art ${storyCover.startsWith("linear-gradient") ? "" : "has-image"}`}
              style={{ background: storyCover }}
            >
              <div className="story-floating-character">🎭</div>
              <span className="story-start-badge">{scenes.length} مشاهد</span>
            </div>
            <div className="story-start-body">
              <div className="story-kicker">رحلة قصة</div>
              <h3>{info.title}</h3>
              <p>{info.description}</p>
              {/* <div className="story-start-note">
                الطفل لا يختار المشهد. المشاهد تظهر بالتدريج في نفس المكان.
              </div> */}
              <button type="button" className="story-main-btn" onClick={startNativeStory}>
                ابدأ القصة <span>▶</span>
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        {storyTitleNode}

        <div className="native-story-shell">
          <div className="native-story-top">
            <div>
              <span className="story-kicker">المشهد {storySceneIndex + 1} من {scenes.length}</span>
              <h3>{storyFeedback ? "نتيجة اختيارك" : currentScene.title}</h3>
            </div>
            <span className={`story-status-pill ${completed ? "done" : ""}`}>
              {completed ? "مكتملة ✓" : "بالترتيب"}
            </span>
          </div>

          <div className="story-progress-line" aria-hidden="true">
            {scenes.map((scene: any, index: number) => (
              <span
                key={`${scene?.title || "scene"}-${index}`}
                className={index < storySceneIndex ? "done" : index === storySceneIndex ? "active" : ""}
              />
            ))}
          </div>

          <div className="story-scene-stage">
            <div className="story-media-panel">
              {currentMedia ? (
                <video
                  key={`${storySceneIndex}-${storyFeedback ? "feedback" : "scene"}-${currentMedia}`}
                  src={getStoryMediaUrl(currentMedia)}
                  controls
                  playsInline
                  className="story-native-video"
                />
              ) : currentImage ? (
                <img
                  src={getStoryMediaUrl(currentImage)}
                  alt={currentScene.title}
                  className="story-native-image"
                />
              ) : (
                <div className="story-media-placeholder">
                  <span>🎬</span>
                  <strong>{storyFeedback ? "نتيجة الاختيار" : currentScene.title}</strong>
                </div>
              )}
            </div>

            <div className="story-content-panel">
              {storyFeedback ? (
                <>
                  <div className={`story-feedback-badge ${storyFeedback.isCorrect ? "good" : "try"}`}>
                    {storyFeedback.isCorrect ? "اختيار جميل 👏" : "نتعلم من التجربة 🌱"}
                  </div>
                  <h3>{storyFeedback.text}</h3>
                  <p>{storyFeedback.feedbackText}</p>
                  <button type="button" className="story-main-btn" onClick={continueNativeStory}>
                    {storySceneIndex < scenes.length - 1 ? "المشهد التالي" : "إنهاء القصة"} <span>←</span>
                  </button>
                </>
              ) : (
                <>
                  {currentScene.story ? <p className="story-scene-text">{currentScene.story}</p> : null}

                  {currentScene.question ? (
                    <div className="story-question-box">
                      <span>سؤال المشهد</span>
                      <strong>{currentScene.question}</strong>
                    </div>
                  ) : null}

                  {sceneAnswers.length > 0 ? (
                    <div className="story-answer-grid">
                      {sceneAnswers.map((answer: any, answerIndex: number) => (
                        <button
                          key={`${getNativeStoryAnswerLabel(answer, answerIndex)}-${answerIndex}`}
                          type="button"
                          className="story-answer-btn"
                          onClick={() => answerNativeStory(answer, answerIndex)}
                        >
                          <span>{answerIndex + 1}</span>
                          {getNativeStoryAnswerLabel(answer, answerIndex)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button type="button" className="story-main-btn" onClick={continueNativeStory}>
                      {storySceneIndex < scenes.length - 1 ? "المشهد التالي" : "إنهاء القصة"} <span>←</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {gameResult?.type === "RASHID_NATIVE_STORY_RESULT" && (
          <div className="story-done-card">
            <span>🎉</span>
            <div>
              <strong>أحسنت! تم حفظ تقدم القصة.</strong>
              <p>صار بإمكانك الانتقال للجزء التالي من البرنامج.</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (loading || !program) {
    return (
      <main className="preview-page" dir="rtl">
        <div className="loading-card">جاري تحميل البرنامج...</div>
      </main>
    );
  }

  return (
    <ChildLayout profile={profile} activeHref="/child/programs">
        <section className="min-w-0 flex-1">
          <div className="preview-page" dir="rtl">
            <style>{`
              .preview-page {
                  min-height: 100%;
                  background: transparent;
                  color: #20294f;
                  padding: 24px;
                  overflow-x: hidden;
                  font-family: Arial, sans-serif;
              }

              .preview-shell {
                max-width: 1180px;
                margin: 0 auto;
              }

              .center-text-only {
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .top-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 18px;
                margin-bottom: 24px;
              }

              .top-btn,
              .preview-badge {
                border: 0;
                text-decoration: none;
                background: #fff;
                color: #20294f;
                padding: 16px 22px;
                border-radius: 24px;
                font-weight: 900;
                box-shadow: 0 12px 32px rgba(62, 87, 120, .13);
              }

              .preview-badge {
                background: linear-gradient(135deg, #8b5cf6, #5b7cfa);
                color: white;
              }

              .child-card {
                display: flex;
                align-items: center;
                gap: 14px;
                background: rgba(255,255,255,.95);
                padding: 12px 18px;
                border-radius: 30px;
                box-shadow: 0 12px 32px rgba(62, 87, 120, .13);
              }

              .avatar-emoji {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: #dff4ff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 42px;
              }

              .child-name {
                font-size: 23px;
                font-weight: 900;
              }

              .xp {
                color: #f5a800;
                font-weight: 900;
                font-size: 18px;
              }

              .xp-bar {
                margin-top: 8px;
                width: 150px;
                height: 10px;
                background: #dce4f5;
                border-radius: 999px;
                overflow: hidden;
              }

              .xp-fill {
                height: 100%;
                width: 65%;
                background: #5ec267;
                border-radius: 999px;
              }

              .hero {
                position: relative;
                background: rgba(255,255,255,.92);
                border: 1px solid rgba(255,255,255,.9);
                border-radius: 42px;
                padding: 26px;
                box-shadow: 0 18px 45px rgba(62, 87, 120, .13);
                overflow: hidden;
              }

              .hero::before {
                content: "";
                position: absolute;
                inset: 0;
                background:
                  radial-gradient(circle at 8% 12%, rgba(255,255,255,.95), transparent 11%),
                  radial-gradient(circle at 92% 8%, rgba(255,218,89,.55), transparent 8%),
                  linear-gradient(135deg, rgba(195,233,255,.9), rgba(255,255,255,.6));
                z-index: 0;
              }

              .hero-inner {
                position: relative;
                z-index: 1;
                display: grid;
                grid-template-columns: 1.1fr .9fr;
                gap: 28px;
                align-items: center;
              }

              .age-pill {
                display: inline-block;
                background: #f0e9ff;
                color: #7048e8;
                padding: 12px 20px;
                border-radius: 999px;
                font-weight: 900;
                margin-bottom: 18px;
                box-shadow: 0 8px 18px rgba(112,72,232,.12);
              }

              .hero-title {
                font-size: 54px;
                line-height: 1.2;
                font-weight: 900;
                margin: 0;
                color: #20294f;
              }

              .hero-desc {
                font-size: 21px;
                line-height: 2;
                color: #667085;
                max-width: 650px;
                margin-top: 18px;
              }

              .stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 14px;
                margin-top: 28px;
              }

              .stat {
                background: rgba(255,255,255,.85);
                border: 1px solid #edf0f8;
                border-radius: 24px;
                padding: 18px;
                text-align: center;
                box-shadow: 0 8px 20px rgba(62, 87, 120, .08);
              }

              .stat-icon {
                font-size: 30px;
              }

              .stat-label {
                color: #9aa3b2;
                font-size: 13px;
                font-weight: 800;
                margin-top: 8px;
              }

              .stat-value {
                color: #20294f;
                font-size: 16px;
                font-weight: 900;
                margin-top: 3px;
              }

              .hero-image-wrap {
                background: white;
                padding: 12px;
                border-radius: 34px;
                box-shadow: 0 14px 34px rgba(62, 87, 120, .15);
              }

              .hero-image {
                width: 100%;
                height: 330px;
                border-radius: 26px;
                object-fit: cover;
                display: block;
              }

              .tabs-panel {
                background: rgba(255,255,255,.96);
                margin-top: 26px;
                border-radius: 40px;
                padding: 22px;
                box-shadow: 0 18px 45px rgba(62, 87, 120, .12);
              }

              .tabs-row {
                display: flex;
                gap: 14px;
                overflow-x: auto;
                padding-bottom: 16px;
                margin-bottom: 20px;
              }

              .tab-btn {
                position: relative;
                border: 0;
                min-width: max-content;
                border-radius: 22px;
                padding: 17px 24px;
                background: white;
                color: #20294f;
                font-size: 18px;
                font-weight: 900;
                box-shadow: 0 8px 22px rgba(62, 87, 120, .12);
                cursor: pointer;
              }

              .tab-done-check {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                margin-inline-start: 6px;
                border-radius: 999px;
                background: #22c55e;
                color: white;
                font-size: 13px;
                font-weight: 900;
              }

              .tab-btn.active {
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
              }

              .tab-btn.active::after {
                content: "";
                position: absolute;
                bottom: -8px;
                left: 50%;
                width: 18px;
                height: 18px;
                background: #6847f5;
                transform: translateX(-50%) rotate(45deg);
                border-radius: 3px;
              }

              .empty {
                background: #f8fbff;
                border: 2px dashed #dbe7ff;
                border-radius: 30px;
                padding: 60px 20px;
                text-align: center;
                font-size: 24px;
                font-weight: 900;
                color: #20294f;
              }

              .content-list {
                display: grid;
                gap: 22px;
              }

              .content-card {
                background: #fbfdff;
                border: 1px solid #e8eefc;
                border-radius: 34px;
                padding: 28px;
                box-shadow: 0 10px 24px rgba(62,87,120,.06);
              }

              .content-title {
                text-align: center;
                color: #7048e8;
                font-size: 30px;
                font-weight: 900;
                margin: 0 0 22px;
              }

              .text-content {
                display: grid;
                grid-template-columns: 1fr 20px;
                gap: 28px;
                align-items: center;
              }

              .text-body {
                font-size: 21px;
                line-height: 2.1;
                color: #667085;
                text-align: center;
                font-weight: 700;
                align-items: center;
                justify-content: center;
              }

              .media-wrap {
                width: 100%;
                margin: 0 auto;
                background: white;
                padding: 12px;
                border-radius: 30px;
                box-shadow: 0 12px 28px rgba(62,87,120,.15);
                overflow: hidden;
              }

              .media-image {
                width: 100%;
                max-height: 380px;
                object-fit: cover;
                border-radius: 22px;
                display: block;
              }

              .video-frame {
                width: 100%;
                aspect-ratio: 16 / 9;
                border: 0;
                border-radius: 22px;
                display: block;
              }

              .learn-showcase {
                display: grid;
                grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
                gap: 26px;
                align-items: stretch;
              }

              .learn-hero-card {
                position: relative;
                min-height: 310px;
                border-radius: 32px;
                overflow: hidden;
                padding: 34px;
                display: flex;
                align-items: flex-end;
                box-shadow: 0 18px 40px rgba(62,87,120,.16);
                background: linear-gradient(135deg, #dff7ff, #f6e7ff);
              }

              .learn-hero-card.has-image {
                background-size: cover !important;
                background-position: center !important;
              }

              .learn-hero-card::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, rgba(17,24,39,.55), rgba(17,24,39,.14), rgba(255,255,255,.05));
                pointer-events: none;
              }

              .learn-hero-content {
                position: relative;
                z-index: 1;
                max-width: 460px;
                color: white;
              }

              .learn-badge {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                margin-bottom: 14px;
                border-radius: 999px;
                padding: 9px 14px;
                background: rgba(139,92,246,.95);
                font-size: 13px;
                font-weight: 900;
                box-shadow: 0 10px 22px rgba(76,52,201,.22);
              }

              .learn-hero-title {
                margin: 0;
                font-size: 42px;
                line-height: 1.25;
                font-weight: 1000;
                text-shadow: 0 3px 16px rgba(0,0,0,.24);
              }

              .learn-hero-desc {
                margin: 12px 0 22px;
                font-size: 18px;
                line-height: 1.9;
                font-weight: 800;
                color: rgba(255,255,255,.92);
              }

              .learn-start-btn {
                border: 0;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                border-radius: 999px;
                padding: 15px 30px;
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                font-size: 18px;
                font-weight: 1000;
                box-shadow: 0 10px 0 #4c34c9, 0 18px 34px rgba(76,52,201,.28);
              }

              .learn-side-card {
                border-radius: 32px;
                border: 1px solid #e9e4ff;
                background: linear-gradient(180deg, #ffffff, #faf8ff);
                padding: 26px;
                box-shadow: 0 14px 32px rgba(62,87,120,.10);
              }

              .learn-side-label {
                display: inline-flex;
                border-radius: 999px;
                padding: 9px 16px;
                background: #f0e9ff;
                color: #7048e8;
                font-weight: 1000;
                margin-bottom: 14px;
              }

              .learn-side-title {
                color: #20294f;
                font-size: 28px;
                line-height: 1.4;
                font-weight: 1000;
                margin: 0 0 12px;
              }

              .learn-side-desc {
                color: #667085;
                font-size: 16px;
                line-height: 1.9;
                font-weight: 800;
              }

              .learn-next-note {
                margin-top: 22px;
                border-radius: 20px;
                background: #f4f0ff;
                color: #7048e8;
                padding: 14px 16px;
                font-weight: 900;
                line-height: 1.8;
              }

              .activity-guide {
                margin: 0 auto 22px;
                max-width: 820px;
                border-radius: 24px;
                border: 1px solid #ece7ff;
                background: linear-gradient(135deg, #fbfaff, #ffffff);
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 14px;
                text-align: right;
                color: #20294f;
                box-shadow: 0 10px 24px rgba(62,87,120,.07);
              }

              .activity-guide > span {
                flex: 0 0 auto;
                width: 44px;
                height: 44px;
                border-radius: 999px;
                background: #eefbf1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
              }

              .activity-guide strong {
                display: block;
                font-size: 18px;
                font-weight: 1000;
                color: #7048e8;
              }

              .activity-guide p {
                margin: 4px 0 0;
                color: #667085;
                font-size: 14px;
                line-height: 1.7;
                font-weight: 800;
              }

              .activity-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 18px;
                margin-top: 24px;
              }

              .activity-card {
                position: relative;
                border: 1px solid #edf0fb;
                border-radius: 26px;
                background: white;
                overflow: hidden;
                box-shadow: 0 12px 26px rgba(62,87,120,.09);
                cursor: pointer;
                text-align: right;
                transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
              }

              .activity-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 18px 34px rgba(62,87,120,.14);
              }

              .activity-card.active {
                border-color: #8b5cf6;
                box-shadow: 0 0 0 4px rgba(139,92,246,.13), 0 18px 34px rgba(62,87,120,.13);
              }

              .activity-card.locked {
                opacity: .72;
                filter: grayscale(.25);
                cursor: not-allowed;
              }

              .activity-cover {
                height: 132px;
                background-size: cover !important;
                background-position: center !important;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                padding: 12px;
              }

              .activity-status {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 38px;
                height: 34px;
                padding: 0 10px;
                border-radius: 999px;
                background: rgba(255,255,255,.94);
                color: #7048e8;
                font-weight: 1000;
                box-shadow: 0 8px 18px rgba(62,87,120,.14);
              }

              .activity-status.done {
                color: #16a34a;
              }

              .activity-status.lock {
                color: #64748b;
              }

              .activity-body {
                padding: 16px 16px 18px;
              }

              .activity-title {
                min-height: 52px;
                color: #20294f;
                font-size: 17px;
                font-weight: 1000;
                line-height: 1.55;
              }

              .activity-meta {
                margin-top: 12px;
                display: flex;
                justify-content: space-between;
                gap: 10px;
                color: #6e7a99;
                font-size: 13px;
                font-weight: 900;
              }

              .story-player-section {
                margin-top: 26px;
              }

              .story-activity-grid {
                margin-bottom: 6px;
              }

              .challenge-guide > span {
                background: #fff7ed;
                color: #f59e0b;
              }

              .challenge-activity-card.active {
                border-color: #f59e0b;
                box-shadow: 0 0 0 4px rgba(245,158,11,.16), 0 18px 34px rgba(62,87,120,.13);
              }

              .challenge-activity-card .activity-status {
                color: #b45309;
              }

              .challenge-activity-card .activity-status.done {
                color: #16a34a;
              }

              .journey-strip {
                margin-top: 24px;
                border-radius: 28px;
                background: linear-gradient(135deg, #f7f3ff, #ffffff);
                border: 1px solid #ece7ff;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
              }

              .journey-dots {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
              }

              .journey-dot {
                width: 36px;
                height: 36px;
                border-radius: 999px;
                background: #e5e7eb;
                color: #64748b;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 1000;
                box-shadow: inset 0 -3px 0 rgba(0,0,0,.06);
              }

              .journey-dot.done { background: #22c55e; color: white; }
              .journey-dot.active { background: #7048e8; color: white; transform: scale(1.12); }

              .journey-line {
                height: 3px;
                flex: 1;
                min-width: 18px;
                border-radius: 999px;
                background: repeating-linear-gradient(90deg, #c4b5fd 0 8px, transparent 8px 16px);
              }

              .story-start-card {
                display: grid;
                grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr);
                gap: 24px;
                align-items: stretch;
                border-radius: 34px;
                padding: 18px;
                background: linear-gradient(135deg, #fff, #f7f3ff);
                border: 1px solid #ece7ff;
                box-shadow: 0 16px 36px rgba(62,87,120,.10);
              }

              .story-start-art {
                position: relative;
                min-height: 360px;
                border-radius: 28px;
                overflow: hidden;
                background-size: cover !important;
                background-position: center !important;
                display: flex;
                align-items: flex-end;
                justify-content: flex-start;
                padding: 22px;
              }

              .story-start-art::after {
                content: "";
                position: absolute;
                inset: 0;
                background:
                  radial-gradient(circle at 20% 18%, rgba(255,255,255,.55), transparent 14%),
                  linear-gradient(180deg, rgba(32,41,79,.05), rgba(32,41,79,.50));
                pointer-events: none;
              }

              .story-floating-character {
                position: absolute;
                right: 24px;
                top: 24px;
                z-index: 1;
                width: 78px;
                height: 78px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 28px;
                background: rgba(255,255,255,.92);
                font-size: 42px;
                box-shadow: 0 14px 28px rgba(62,87,120,.16);
                animation: storyFloat 2.6s ease-in-out infinite;
              }

              @keyframes storyFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }

              .story-start-badge {
                position: relative;
                z-index: 1;
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                padding: 12px 18px;
                background: rgba(255,255,255,.94);
                color: #7048e8;
                font-weight: 1000;
                box-shadow: 0 10px 22px rgba(62,87,120,.16);
              }

              .story-start-body {
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 20px 8px;
              }

              .story-kicker {
                display: inline-flex;
                align-self: flex-start;
                border-radius: 999px;
                padding: 9px 16px;
                background: #f0e9ff;
                color: #7048e8;
                font-size: 14px;
                font-weight: 1000;
                margin-bottom: 14px;
              }

              .story-start-body h3,
              .native-story-top h3,
              .story-content-panel h3 {
                margin: 0;
                color: #20294f;
                font-size: 36px;
                line-height: 1.35;
                font-weight: 1000;
              }

              .story-start-body p,
              .story-content-panel p {
                color: #667085;
                font-size: 18px;
                line-height: 2;
                font-weight: 800;
                margin: 16px 0 0;
              }

              .story-start-note {
                margin: 22px 0;
                border-radius: 22px;
                padding: 16px 18px;
                background: #fff8db;
                color: #7a5b00;
                font-weight: 900;
                line-height: 1.9;
              }

              .story-main-btn {
                border: 0;
                cursor: pointer;
                align-self: flex-start;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                border-radius: 999px;
                padding: 16px 30px;
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                font-size: 18px;
                font-weight: 1000;
                box-shadow: 0 10px 0 #4c34c9, 0 18px 34px rgba(76,52,201,.26);
              }

              .native-story-shell {
                border-radius: 34px;
                padding: 22px;
                background: linear-gradient(180deg, #ffffff, #fbfaff);
                border: 1px solid #ece7ff;
                box-shadow: 0 16px 36px rgba(62,87,120,.10);
              }

              .native-story-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 18px;
              }

              .story-status-pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 44px;
                border-radius: 999px;
                padding: 0 16px;
                background: #eef7ff;
                color: #3361cc;
                font-weight: 1000;
                flex: 0 0 auto;
              }

              .story-status-pill.done {
                background: #dcfce7;
                color: #15803d;
              }

              .story-progress-line {
                display: flex;
                gap: 8px;
                margin-bottom: 22px;
              }

              .story-progress-line span {
                flex: 1;
                height: 12px;
                border-radius: 999px;
                background: #e5e7eb;
                overflow: hidden;
              }

              .story-progress-line span.done { background: #22c55e; }
              .story-progress-line span.active { background: #8b5cf6; box-shadow: 0 0 0 5px rgba(139,92,246,.12); }

              .story-scene-stage {
                display: grid;
                grid-template-columns: minmax(0, .92fr) minmax(320px, .78fr);
                gap: 22px;
                align-items: stretch;
              }

              .story-media-panel {
                min-height: 440px;
                border-radius: 30px;
                padding: 12px;
                background: #ffffff;
                box-shadow: inset 0 0 0 1px #edf2ff, 0 12px 28px rgba(62,87,120,.09);
                overflow: hidden;
              }

              .story-native-video,
              .story-native-image {
                width: 100%;
                height: 100%;
                min-height: 416px;
                border-radius: 22px;
                object-fit: cover;
                display: block;
                background: #111827;
              }

              .story-media-placeholder {
                min-height: 416px;
                height: 100%;
                border-radius: 22px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 14px;
                background:
                  radial-gradient(circle at 25% 20%, rgba(255,255,255,.8), transparent 15%),
                  linear-gradient(135deg, #dff7ff, #f6e7ff);
                color: #20294f;
                text-align: center;
                padding: 24px;
              }

              .story-media-placeholder span { font-size: 56px; }
              .story-media-placeholder strong { font-size: 26px; font-weight: 1000; }

              .story-content-panel {
                border-radius: 30px;
                background: #f8fbff;
                border: 1px solid #edf2ff;
                padding: 26px;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }

              .story-scene-text {
                margin-top: 0 !important;
              }

              .story-question-box {
                margin-top: 18px;
                border-radius: 24px;
                padding: 18px;
                background: white;
                border: 1px solid #e9e4ff;
                box-shadow: 0 10px 22px rgba(62,87,120,.07);
              }

              .story-question-box span {
                display: block;
                color: #7048e8;
                font-size: 13px;
                font-weight: 1000;
                margin-bottom: 8px;
              }

              .story-question-box strong {
                display: block;
                color: #20294f;
                font-size: 22px;
                line-height: 1.7;
                font-weight: 1000;
              }

              .story-answer-grid {
                display: grid;
                gap: 12px;
                margin-top: 20px;
              }

              .story-answer-btn {
                border: 2px solid #e9e4ff;
                border-radius: 22px;
                background: white;
                color: #20294f;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 17px;
                line-height: 1.6;
                font-weight: 1000;
                text-align: right;
                cursor: pointer;
                box-shadow: 0 10px 22px rgba(62,87,120,.07);
                transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
              }

              .story-answer-btn:hover {
                transform: translateY(-3px);
                border-color: #8b5cf6;
                box-shadow: 0 16px 30px rgba(62,87,120,.12);
              }

              .story-answer-btn span {
                flex: 0 0 auto;
                width: 38px;
                height: 38px;
                border-radius: 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #f0e9ff;
                color: #7048e8;
              }

              .story-feedback-badge {
                align-self: flex-start;
                border-radius: 999px;
                padding: 10px 16px;
                font-size: 14px;
                font-weight: 1000;
                margin-bottom: 16px;
              }

              .story-feedback-badge.good {
                background: #dcfce7;
                color: #15803d;
              }

              .story-feedback-badge.try {
                background: #fff7ed;
                color: #9a3412;
              }

              .story-done-card {
                margin-top: 20px;
                border-radius: 28px;
                padding: 20px;
                background: #ecfdf5;
                border: 1px solid #bbf7d0;
                color: #166534;
                display: flex;
                gap: 14px;
                align-items: center;
                font-weight: 900;
              }

              .story-done-card > span { font-size: 32px; }
              .story-done-card strong { display: block; font-size: 18px; }
              .story-done-card p { margin: 4px 0 0; color: #15803d; }

              .story-legacy-card {
                border-radius: 34px;
                padding: 22px;
                background: linear-gradient(180deg, #ffffff, #fbfaff);
                border: 1px solid #ece7ff;
                box-shadow: 0 16px 36px rgba(62,87,120,.10);
              }

              .story-legacy-head {
                display: flex;
                gap: 14px;
                align-items: center;
                margin-bottom: 18px;
                color: #20294f;
              }

              .story-legacy-head > span {
                width: 56px;
                height: 56px;
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #f0e9ff;
                font-size: 28px;
              }

              .story-legacy-head strong { display: block; font-size: 22px; font-weight: 1000; }
              .story-legacy-head p { margin: 4px 0 0; color: #667085; font-weight: 800; }

              .story-legacy-frame {
                position: relative;
                width: min(100%, 620px);
                aspect-ratio: 3 / 4;
                margin: 0 auto;
                border-radius: 32px;
                padding: 12px;
                background: white;
                box-shadow: 0 18px 45px rgba(62,87,120,.15);
                overflow: hidden;
              }

              .game-tabs {
                  display: flex;
                  gap: 12px;
                  overflow-x: auto;
                  overflow-y: hidden;
                  padding: 6px 4px 18px;
                  margin-bottom: 16px;
                  max-width: 100%;
                  scrollbar-width: thin;
                }

                .game-tabs::-webkit-scrollbar {
                  height: 8px;
                }

                .game-tabs::-webkit-scrollbar-thumb {
                  background: #d8d2ff;
                  border-radius: 999px;
                }

                .game-tab {
                  flex: 0 0 auto;
                  max-width: 320px;
                  border: 0;
                  cursor: pointer;
                  white-space: normal;
                  overflow: visible;
                  text-overflow: clip;
                  line-height: 1.5;
                  text-align: center;
                  border-radius: 18px;
                  padding: 14px 20px;
                  background: #eef7ff;
                  color: #20294f;
                  font-weight: 900;
                  font-size: 15px;
                  box-shadow: 0 8px 18px rgba(62,87,120,.08);
              }

              .game-tab.active {
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
              }

              .game-done-check {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                margin-inline-start: 6px;
                border-radius: 999px;
                background: #22c55e;
                color: white;
                font-size: 13px;
                font-weight: 900;
                vertical-align: middle;
              }

              .game-tab.active .game-done-check {
                background: white;
                color: #16a34a;
              }

              .game-player-shell {
                width: 100%;
              }

              .game-player-desktop {
                display: flex;
                justify-content: center;
                width: 100%;
              }

              .game-player-frame {
                position: relative;
                width: min(100%, 620px);
                aspect-ratio: 3 / 4;
                background: white;
                border-radius: 32px;
                padding: 12px;
                box-shadow: 0 18px 45px rgba(62,87,120,.15);
                overflow: hidden;
              }

              .desktop-fullscreen-btn {
                position: absolute;
                top: 18px;
                left: 18px;
                z-index: 10;
                width: 48px;
                height: 48px;
                border: 0;
                border-radius: 16px;
                background: rgba(255,255,255,.96);
                color: #20294f;
                font-size: 22px;
                font-weight: 900;
                cursor: pointer;
                box-shadow: 0 10px 24px rgba(0,0,0,.16);
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .desktop-fullscreen-btn:hover {
                transform: translateY(-1px);
                background: #ffffff;
              }

              .game-player-iframe {
                width: 100%;
                height: 100%;
                border: 0;
                border-radius: 24px;
                display: block;
                background: white;
              }

              .game-player-mobile-btn {
                display: none;
              }

              .game-player-mobile-preview {
                position: relative;
                width: 100%;
                border-radius: 28px;
                overflow: hidden;
                cursor: pointer;
                display: none;
                background: white;
                box-shadow: 0 18px 45px rgba(62,87,120,.15);
              }

              .game-player-mobile-preview-frame {
                width: 100%;
                aspect-ratio: 1 / 1;
                border: 0;
                display: block;
                pointer-events: none;
                background: white;
              }

              .game-player-mobile-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, rgba(15,23,42,.12), rgba(15,23,42,.45));
                color: white;
                font-size: 32px;
                font-weight: 900;
                text-shadow: 0 3px 12px rgba(0,0,0,.35);
              }

              .game-player-mobile-overlay span {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                padding: 18px 34px;
                background: linear-gradient(135deg,#8b5cf6,#6847f5);
                box-shadow: 0 10px 0 #4c34c9, 0 18px 36px rgba(76,52,201,.35);
              }

              .game-fullscreen {
                position: fixed;
                inset: 0;
                z-index: 999999;
                width: 100vw;
                height: 100dvh;
                background: #000;
              }

              .game-fullscreen-frame {
                width: 100vw;
                height: 100dvh;
                border: 0;
                display: block;
              }

              .game-fullscreen-close {
                position: fixed;
                top: max(14px, env(safe-area-inset-top));
                left: max(14px, env(safe-area-inset-left));
                z-index: 1000000;
                border: 0;
                border-radius: 999px;
                background: rgba(255,255,255,.96);
                color: #111827;
                padding: 12px 18px;
                font-size: 16px;
                font-weight: 900;
                font-family: inherit;
                box-shadow: 0 14px 34px rgba(0,0,0,.28);
                cursor: pointer;
              }

              .answers-report {
                margin-top: 22px;
                display: grid;
                gap: 18px;
              }

              .answer-card {
                background: white;
                border: 1px solid #e8eefc;
                border-radius: 28px;
                padding: 20px;
                box-shadow: 0 10px 24px rgba(62,87,120,.08);
              }

              .answer-head {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: center;
                margin-bottom: 14px;
              }

              .answer-pill {
                border-radius: 999px;
                padding: 9px 14px;
                font-size: 13px;
                font-weight: 900;
                background: #eef7ff;
                color: #0E9FAA;
              }

              .answer-pill.ok {
                background: #dcfce7;
                color: #166534;
              }

              .answer-pill.bad {
                background: #fee2e2;
                color: #991b1b;
              }

              .answer-question {
                font-size: 22px;
                line-height: 1.8;
                font-weight: 900;
                color: #0E9FAA;
              }

              .selected-answer-box {
                margin-top: 14px;
                border-radius: 18px;
                padding: 14px;
                background: #fff7ed;
                border: 1px solid #fed7aa;
                color: #9a3412;
                font-weight: 900;
              }

              .file-link {
                display: inline-flex;
                background: #22c55e;
                color: white;
                text-decoration: none;
                padding: 16px 28px;
                border-radius: 999px;
                font-weight: 900;
              }

              .bottom-nav {
                position: sticky;
                bottom: 0;
                margin-top: 24px;
                background: rgba(255,255,255,.92);
                backdrop-filter: blur(10px);
                border-radius: 32px 32px 0 0;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 -12px 30px rgba(62,87,120,.1);
              }

              .nav-btn {
                border: 0;
                border-radius: 999px;
                padding: 17px 34px;
                font-size: 19px;
                font-weight: 900;
                cursor: pointer;
              }

              .prev {
                background: white;
                color: #7048e8;
                box-shadow: 0 8px 20px rgba(62,87,120,.12);
              }

              .next {
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                box-shadow: 0 8px 20px rgba(112,72,232,.22);
              }

              .dots {
                display: flex;
                gap: 8px;
              }

              .dot {
                width: 11px;
                height: 11px;
                border-radius: 999px;
                background: #d7dce8;
              }

              .dot.active {
                width: 38px;
                background: #7048e8;
              }

              .loading-card {
                margin: 120px auto;
                max-width: 520px;
                background: white;
                padding: 40px;
                border-radius: 32px;
                text-align: center;
                font-size: 24px;
                font-weight: 900;
                color: #7048e8;
              }

              .pro-lock-card {
                background: #fff8d9;
                border: 2px solid #f4e7a2;
                border-radius: 30px;
                padding: 28px;
                margin-top: 28px;
                box-shadow: 0 12px 28px rgba(122,107,34,.1);
              }

              .pro-lock-title {
                font-size: 28px;
                font-weight: 900;
                color: #0E9FAA;
              }

              .pro-lock-text {
                margin-top: 12px;
                font-size: 18px;
                font-weight: 800;
                line-height: 1.9;
                color: #7A6B22;
              }

              .pro-lock-link {
                display: inline-flex;
                margin-top: 18px;
                background: #0E9FAA;
                color: white;
                text-decoration: none;
                padding: 16px 28px;
                border-radius: 999px;
                font-weight: 900;
              }

              @media (max-width: 900px) {
                .preview-page {
                  padding: 10px;
                  font-family: Arial, sans-serif;
                }

                .preview-shell {
                  max-width: 100%;
                }

                /* الموبايل: لا نخلي كروت الطفل/التقدم/الوقت تاخذ شاشة كاملة */
                .top-bar {
                  position: sticky;
                  top: 0;
                  z-index: 50;
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 10px;
                  margin: -2px -2px 12px;
                  padding: 8px;
                  border-radius: 0 0 26px 26px;
                  background: rgba(245, 251, 255, .86);
                  backdrop-filter: blur(14px);
                  -webkit-backdrop-filter: blur(14px);
                  box-shadow: 0 10px 26px rgba(20,34,74,.08);
                }

                .child-card {
                  min-width: 0;
                  justify-content: center;
                  gap: 8px;
                  padding: 10px 12px;
                  border-radius: 22px;
                  box-shadow: 0 8px 20px rgba(62,87,120,.09);
                }

                .child-card:nth-child(1) {
                  grid-column: 1 / -1;
                  justify-content: space-between;
                  padding-inline: 14px;
                }

                .child-card:nth-child(2),
                .child-card:nth-child(3),
                .top-btn {
                  min-height: 78px;
                }

                .avatar-emoji {
                  width: 50px;
                  height: 50px;
                  font-size: 32px;
                  flex: 0 0 auto;
                }

                .child-name {
                  font-size: 16px;
                  line-height: 1.25;
                }

                .xp {
                  font-size: 14px;
                  line-height: 1.35;
                }

                .xp-bar {
                  width: 100px;
                  height: 8px;
                  margin-top: 6px;
                }

                .top-btn {
                  grid-column: auto;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 10px 8px;
                  border-radius: 20px;
                  text-align: center;
                  font-size: 14px;
                  line-height: 1.5;
                }

                .preview-badge {
                  display: none;
                }

                .hero {
                  border-radius: 28px;
                  padding: 14px;
                  box-shadow: 0 12px 30px rgba(62,87,120,.10);
                }

                .hero-inner {
                  grid-template-columns: 1fr;
                  gap: 14px;
                }

                .age-pill {
                  display: inline-flex;
                  margin-bottom: 10px;
                  padding: 8px 14px;
                  font-size: 13px;
                }

                .hero-title {
                  font-size: 30px;
                  text-align: center;
                  line-height: 1.35;
                }

                .hero-desc {
                  text-align: center;
                  font-size: 16px;
                  line-height: 1.9;
                  margin-top: 10px;
                }

                .stats {
                  grid-template-columns: repeat(3, 1fr);
                  gap: 8px;
                  margin-top: 16px;
                }

                .stat {
                  border-radius: 20px;
                  padding: 12px 6px;
                }

                .stat-icon {
                  font-size: 24px;
                }

                .stat-label {
                  font-size: 11px;
                }

                .stat-value {
                  font-size: 12px;
                  line-height: 1.35;
                }

                .hero-image-wrap {
                  padding: 8px;
                  border-radius: 24px;
                }

                .hero-image {
                  height: 190px;
                  border-radius: 18px;
                }

                .tabs-panel {
                  margin-top: 14px;
                  border-radius: 28px;
                  padding: 12px;
                }

                .tabs-row {
                  gap: 10px;
                  padding: 4px 2px 14px;
                  margin-bottom: 12px;
                  scroll-snap-type: x mandatory;
                }

                .tab-btn {
                  padding: 12px 16px;
                  border-radius: 18px;
                  font-size: 15px;
                  scroll-snap-align: start;
                }

                .tab-btn.active::after {
                  bottom: -7px;
                  width: 14px;
                  height: 14px;
                }

                .content-list {
                  gap: 14px;
                }

                .content-card {
                  border-radius: 26px;
                  padding: 16px;
                }

                .content-title {
                  font-size: 24px;
                  margin-bottom: 14px;
                  line-height: 1.45;
                }

                .text-content {
                  grid-template-columns: 1fr;
                  gap: 0;
                }

                .text-body {
                  font-size: 17px;
                  line-height: 2;
                  text-align: center;
                }

                .media-wrap {
                  padding: 8px;
                  border-radius: 24px;
                }

                .media-image {
                  max-height: 230px;
                  border-radius: 18px;
                }

                .video-frame {
                  border-radius: 18px;
                }

                .learn-showcase {
                display: grid;
                grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
                gap: 26px;
                align-items: stretch;
              }

              .learn-hero-card {
                position: relative;
                min-height: 310px;
                border-radius: 32px;
                overflow: hidden;
                padding: 34px;
                display: flex;
                align-items: flex-end;
                box-shadow: 0 18px 40px rgba(62,87,120,.16);
                background: linear-gradient(135deg, #dff7ff, #f6e7ff);
              }

              .learn-hero-card.has-image {
                background-size: cover !important;
                background-position: center !important;
              }

              .learn-hero-card::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, rgba(17,24,39,.55), rgba(17,24,39,.14), rgba(255,255,255,.05));
                pointer-events: none;
              }

              .learn-hero-content {
                position: relative;
                z-index: 1;
                max-width: 460px;
                color: white;
              }

              .learn-badge {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                margin-bottom: 14px;
                border-radius: 999px;
                padding: 9px 14px;
                background: rgba(139,92,246,.95);
                font-size: 13px;
                font-weight: 900;
                box-shadow: 0 10px 22px rgba(76,52,201,.22);
              }

              .learn-hero-title {
                margin: 0;
                font-size: 42px;
                line-height: 1.25;
                font-weight: 1000;
                text-shadow: 0 3px 16px rgba(0,0,0,.24);
              }

              .learn-hero-desc {
                margin: 12px 0 22px;
                font-size: 18px;
                line-height: 1.9;
                font-weight: 800;
                color: rgba(255,255,255,.92);
              }

              .learn-start-btn {
                border: 0;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                border-radius: 999px;
                padding: 15px 30px;
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                font-size: 18px;
                font-weight: 1000;
                box-shadow: 0 10px 0 #4c34c9, 0 18px 34px rgba(76,52,201,.28);
              }

              .learn-side-card {
                border-radius: 32px;
                border: 1px solid #e9e4ff;
                background: linear-gradient(180deg, #ffffff, #faf8ff);
                padding: 26px;
                box-shadow: 0 14px 32px rgba(62,87,120,.10);
              }

              .learn-side-label {
                display: inline-flex;
                border-radius: 999px;
                padding: 9px 16px;
                background: #f0e9ff;
                color: #7048e8;
                font-weight: 1000;
                margin-bottom: 14px;
              }

              .learn-side-title {
                color: #20294f;
                font-size: 28px;
                line-height: 1.4;
                font-weight: 1000;
                margin: 0 0 12px;
              }

              .learn-side-desc {
                color: #667085;
                font-size: 16px;
                line-height: 1.9;
                font-weight: 800;
              }

              .learn-next-note {
                margin-top: 22px;
                border-radius: 20px;
                background: #f4f0ff;
                color: #7048e8;
                padding: 14px 16px;
                font-weight: 900;
                line-height: 1.8;
              }

              .activity-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 18px;
                margin-top: 24px;
              }

              .activity-card {
                position: relative;
                border: 1px solid #edf0fb;
                border-radius: 26px;
                background: white;
                overflow: hidden;
                box-shadow: 0 12px 26px rgba(62,87,120,.09);
                cursor: pointer;
                text-align: right;
                transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
              }

              .activity-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 18px 34px rgba(62,87,120,.14);
              }

              .activity-card.active {
                border-color: #8b5cf6;
                box-shadow: 0 0 0 4px rgba(139,92,246,.13), 0 18px 34px rgba(62,87,120,.13);
              }

              .activity-card.locked {
                opacity: .72;
                filter: grayscale(.25);
                cursor: not-allowed;
              }

              .activity-cover {
                height: 132px;
                background-size: cover !important;
                background-position: center !important;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                padding: 12px;
              }

              .activity-status {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 38px;
                height: 34px;
                padding: 0 10px;
                border-radius: 999px;
                background: rgba(255,255,255,.94);
                color: #7048e8;
                font-weight: 1000;
                box-shadow: 0 8px 18px rgba(62,87,120,.14);
              }

              .activity-status.done {
                color: #16a34a;
              }

              .activity-status.lock {
                color: #64748b;
              }

              .activity-body {
                padding: 16px 16px 18px;
              }

              .activity-title {
                min-height: 52px;
                color: #20294f;
                font-size: 17px;
                font-weight: 1000;
                line-height: 1.55;
              }

              .activity-meta {
                margin-top: 12px;
                display: flex;
                justify-content: space-between;
                gap: 10px;
                color: #6e7a99;
                font-size: 13px;
                font-weight: 900;
              }

              .journey-strip {
                margin-top: 24px;
                border-radius: 28px;
                background: linear-gradient(135deg, #f7f3ff, #ffffff);
                border: 1px solid #ece7ff;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
              }

              .journey-dots {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
              }

              .journey-dot {
                width: 36px;
                height: 36px;
                border-radius: 999px;
                background: #e5e7eb;
                color: #64748b;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 1000;
                box-shadow: inset 0 -3px 0 rgba(0,0,0,.06);
              }

              .journey-dot.done { background: #22c55e; color: white; }
              .journey-dot.active { background: #7048e8; color: white; transform: scale(1.12); }

              .journey-line {
                height: 3px;
                flex: 1;
                min-width: 18px;
                border-radius: 999px;
                background: repeating-linear-gradient(90deg, #c4b5fd 0 8px, transparent 8px 16px);
              }

              .story-start-card,
              .story-scene-stage {
                grid-template-columns: 1fr;
              }

              .story-start-card,
              .native-story-shell,
              .story-legacy-card {
                border-radius: 26px;
                padding: 14px;
              }

              .story-start-art {
                min-height: 230px;
                border-radius: 22px;
              }

              .story-floating-character {
                width: 58px;
                height: 58px;
                border-radius: 20px;
                font-size: 32px;
              }

              .story-start-body {
                padding: 10px 2px;
                text-align: center;
                align-items: center;
              }

              .story-kicker,
              .story-main-btn,
              .story-feedback-badge {
                align-self: center;
              }

              .story-start-body h3,
              .native-story-top h3,
              .story-content-panel h3 {
                font-size: 24px;
                text-align: center;
              }

              .story-start-body p,
              .story-content-panel p,
              .story-scene-text {
                font-size: 16px;
                line-height: 1.9;
                text-align: center;
              }

              .native-story-top {
                flex-direction: column;
                text-align: center;
              }

              .story-media-panel {
                min-height: 250px;
                border-radius: 24px;
              }

              .story-native-video,
              .story-native-image,
              .story-media-placeholder {
                min-height: 245px;
                border-radius: 18px;
              }

              .story-content-panel {
                border-radius: 24px;
                padding: 18px;
              }

              .story-question-box strong {
                font-size: 18px;
                text-align: center;
              }

              .story-answer-btn {
                font-size: 15px;
                border-radius: 18px;
                padding: 13px;
              }

              .story-legacy-frame {
                width: 100%;
                border-radius: 24px;
              }

              .game-tabs {
                  gap: 9px;
                  padding-bottom: 12px;
                  margin-bottom: 12px;
                }

                .game-tab {
                  max-width: 150px;
                  border-radius: 16px;
                  padding: 12px 16px;
                  font-size: 14px;
                }

                .game-player-desktop {
                  display: none;
                }

                .game-player-mobile-btn {
                  display: none;
                }

                .game-player-mobile-preview {
                  display: block;
                  border-radius: 24px;
                }

                .game-player-mobile-overlay {
                  font-size: 24px;
                }

                .game-player-mobile-overlay span {
                  padding: 14px 24px;
                  box-shadow: 0 8px 0 #4c34c9, 0 14px 28px rgba(76,52,201,.30);
                }

                .bottom-nav {
                  position: sticky;
                  bottom: 8px;
                  z-index: 40;
                  gap: 10px;
                  margin-top: 14px;
                  border-radius: 24px;
                  padding: 10px;
                  box-shadow: 0 -10px 28px rgba(62,87,120,.11);
                }

                .dots {
                  display: none;
                }

                .nav-btn {
                  flex: 1;
                  padding: 13px 12px;
                  font-size: 15px;
                }

                .answers-report {
                  gap: 12px;
                }

                .answer-card {
                  border-radius: 22px;
                  padding: 14px;
                }

                .answer-head {
                  flex-direction: column;
                  align-items: stretch;
                }

                .answer-question {
                  font-size: 18px;
                  text-align: center;
                }

                .selected-answer-box {
                  font-size: 15px;
                  line-height: 1.8;
                }

                .activity-guide {
                  margin: 0 0 12px;
                  padding: 12px;
                  border-radius: 20px;
                  justify-content: flex-start;
                  text-align: right;
                }

                .activity-guide > span {
                  width: 38px;
                  height: 38px;
                  font-size: 21px;
                }

                .activity-guide strong {
                  font-size: 15px;
                }

                .activity-guide p {
                  font-size: 12px;
                  line-height: 1.6;
                }

                .learn-showcase,
                .learn-side-card,
                .learn-hero-card {
                  display: none !important;
                }

                .activity-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  gap: 12px;
                  margin-top: 12px;
                }

                .activity-card {
                  display: grid;
                  grid-template-columns: 112px minmax(0, 1fr);
                  min-height: 118px;
                  border-radius: 22px;
                }

                .activity-card:hover {
                  transform: none;
                }

                .activity-cover {
                  height: 100%;
                  min-height: 118px;
                  padding: 9px;
                }

                .activity-status {
                  min-width: 30px;
                  height: 28px;
                  padding: 0 8px;
                  font-size: 12px;
                }

                .activity-body {
                  padding: 12px 14px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }

                .activity-title {
                  min-height: 0;
                  font-size: 15px;
                  line-height: 1.55;
                }

                .activity-meta {
                  margin-top: 10px;
                  font-size: 12px;
                }

                .journey-strip {
                  display: none;
                }
              }

              @media (max-width: 1100px) and (min-width: 901px) {
                .activity-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
              }

              @media (max-width: 640px) {
                .activity-grid {
                  grid-template-columns: 1fr !important;
                }

                .activity-card {
                  grid-template-columns: 112px minmax(0, 1fr);
                }
              }



                .nav-btn.next.disabled {
                  opacity: 0.55;
                  cursor: not-allowed;
                  filter: grayscale(0.25);
                  transform: none !important;
                }
              `}</style>

            <div className="preview-shell">
              <header className="top-bar">
                <div className="child-card">
                  <div className="avatar-emoji">{childAvatar}</div>

                  <div>
                    <div className="child-name">{childName}</div>
                    <div className="xp">⭐ جاهز للتحدي</div>
                  </div>

                  <div style={{ fontSize: 34 }}>🛡️</div>
                </div>

                <div className="child-card">
                  <div>
                    <div className="child-name">التقدم</div>
                    <div className="xp">{progressPercentage}%</div>
                    <div className="xp-bar">
                      <div
                        className="xp-fill"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="child-card">
                  <div style={{ fontSize: 34 }}>⏱️</div>
                  <div>
                    <div className="child-name">الوقت</div>
                    <div className="xp">{formatTime(elapsedSeconds)}</div>
                  </div>
                </div>

                <Link href="/dashboard" className="top-btn">
                  رجوع ←
                </Link>

                {/* <div className="preview-badge">
                  {isEndStep ? "🎉 إنهاء البرنامج" : "👁️ تجربة البرنامج"}
                </div> */}

                
              </header>

              <section className="hero">
                <div className="hero-inner">
                  <div>
                    {program.age_range && (
                      <div className="age-pill">عمر {program.age_range}</div>
                    )}

                    <h1 className="hero-title">
                      {program.title} <span>🌱</span>
                    </h1>

                    {program.description && (
                      <p className="hero-desc">{program.description}</p>
                    )}

                    <div className="stats">
                      <div className="stat">
                        <div className="stat-icon">🌿</div>
                        <div className="stat-label">القيمة</div>
                        <div className="stat-value">ثقة وشخصية</div>
                      </div>

                      <div className="stat">
                        <div className="stat-icon">
                          {program.access_type === "pro" ? "👑" : "🟢"}
                        </div>
                        <div className="stat-label">نوع البرنامج</div>
                        <div className="stat-value">
                          {program.access_type === "pro" ? "Pro" : "مجاني"}
                        </div>
                      </div>

                      <div className="stat">
                        <div className="stat-icon">🎮</div>
                        <div className="stat-label">الأنشطة</div>
                        <div className="stat-value">{tabs.length} أقسام</div>
                      </div>
                    </div>

                    {locked && (
                      <div className="pro-lock-card">
                        <div className="pro-lock-title">
                          هذا البرنامج ضمن اشتراك Pro 🔒
                        </div>
                        <div className="pro-lock-text">
                          فعّل اشتراكك للوصول إلى هذا البرنامج والبرامج المميزة.
                        </div>
                        <Link href="/plans" className="pro-lock-link">
                          الانتقال للخطط والاشتراكات
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="hero-image-wrap">
                    <img
                      src={
                        program.image_url
                          ? getFileUrl(program.image_url)
                          : "/images/preview/preview_hero_illustration.png"
                      }
                      className="hero-image"
                      alt={program.title}
                    />
                  </div>
                </div>
              </section>

              {!locked && (
                <>
                  <section className="tabs-panel">
                    {tabs.length === 0 ? (
                      <div className="empty">لا توجد تابات بعد 🧩</div>
                    ) : (
                      <>
                        <div className="tabs-row">
                          {tabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => { markTabAutoContentsCompleted(activeTab); saveCurrentPosition(); setActiveTab(tab.id); }}
                              className={`tab-btn ${
                                activeTab === tab.id ? "active" : ""
                              }`}
                            >
                              {icon(tab.type)} {tab.title} {isTabCompleted(tab.id) ? <span className="tab-done-check">✓</span> : null}
                            </button>
                          ))}
                        </div>

                        {activeContents.length === 0 ? (
                          <div className="empty">
                            لا يوجد محتوى داخل هذا التاب 📦
                          </div>
                        ) : (
                          <div className="content-list">
                            {normalContents.map((item) => (
                              <article key={item.id} className="content-card">
                                {item.title && (
                                  <h2 className="content-title">
                                    {item.title}
                                  </h2>
                                )}

                                {/* {item.content_type === "text" && (
                                  <div className="w-full  text-content">
                                    <div className="text-body text-center">{item.body}</div>
                                  </div>
                                )} */}

                                {/* {item.content_type === "text" && (
                                  <div className="w-full px-20 md:px-20" dir="rtl">
                                    <div className="text-body text-center">
                                      {item.body}
                                    </div>
                                  </div>
                                )} */}
                                
                                {item.content_type === "text" && (
                                    <div className="text-content center-text-only center-text-only"
                                        dir="rtl"
                                        style={{
                                          whiteSpace: "pre-line",
                                          direction: "rtl",
                                          textAlign: "center",
                                          lineHeight: "2.2",
                                        }}>
                                      <div
                                        className="text-body ">
                                        {item.body}
                                      </div>
                                    </div>
                                  )}
                                {item.content_type === "image" &&
                                  item.file_url && (
                                    <div className="media-wrap">
                                      <img
                                        src={getFileUrl(item.file_url)}
                                        className="media-image"
                                        alt={item.title || ""}
                                      />
                                    </div>
                                  )}

                                {item.content_type === "video" &&
                                  item.file_url && (
                                    <div className="media-wrap">
                                      <video
                                        src={getFileUrl(item.file_url)}
                                        controls
                                        className="video-frame"
                                      />
                                    </div>
                                  )}

                                {item.content_type === "youtube" &&
                                  item.youtube_url && (
                                    <div className="media-wrap">
                                      <iframe
                                        src={youtubeEmbed(item.youtube_url)}
                                        className="video-frame"
                                        allowFullScreen
                                      />
                                    </div>
                                  )}

                                {item.content_type === "file" &&
                                  item.file_url && (
                                    <div style={{ textAlign: "center" }}>
                                      <a
                                        href={getFileUrl(item.file_url)}
                                        target="_blank"
                                        className="file-link"
                                      >
                                        📎 فتح الملف
                                      </a>
                                    </div>
                                  )}
                              </article>
                            ))}

                            {iframeGames.length > 0 && (
                              <article className="content-card" style={{ overflow: "hidden" }}>
                               
                                {isLearningGamesTab ? (
                                  <>
                                    <h2 className="content-title">{activeTabTitle || "العب وتعلّم"} {activeTabIcon}</h2>

                                    <div className={`activity-guide ${sequentialCopy.kind === "challenge" ? "challenge-guide" : ""}`}>
                                      <span>{sequentialCopy.guideIcon}</span>
                                      <div>
                                        <strong>{sequentialCopy.guideTitle}</strong>
                                        <p>{sequentialCopy.guideDescription}</p>
                                      </div>
                                    </div>

                                    <div className="activity-grid">
                                      {iframeGames.map((game, index) => {
                                        const done = completedContentIds.includes(game.id);
                                        const active = selectedGame?.id === game.id;
                                        const unlocked = isActivityUnlocked(index);
                                        const cover = getActivityCover(game, index);

                                        return (
                                          <button
                                            key={game.id}
                                            type="button"
                                            onClick={() => openLearningActivity(game, index)}
                                            className={`activity-card ${sequentialCopy.kind === "challenge" ? "challenge-activity-card" : ""} ${active ? "active" : ""} ${!unlocked ? "locked" : ""}`}
                                          >
                                            <div
                                              className="activity-cover"
                                              style={{ background: cover }}
                                            >
                                              <span className={`activity-status ${done ? "done" : !unlocked ? "lock" : ""}`}>
                                                {done ? "✓" : !unlocked ? "🔒" : index + 1}
                                              </span>
                                              <span className="activity-status">{getSequentialCardIcon(game, index, sequentialCopy)}</span>
                                            </div>
                                            <div className="activity-body">
                                              <div className="activity-title">
                                                {game.title || `${sequentialCopy.itemLabel} ${index + 1}`}
                                              </div>
                                              <div className="activity-meta">
                                                <span>{done ? sequentialCopy.doneStatus : active ? sequentialCopy.activeStatus : unlocked ? sequentialCopy.openStatus : sequentialCopy.lockedStatus}</span>
                                                <span>{sequentialCopy.itemLabel} {index + 1}</span>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div className="journey-strip">
                                      <div className="journey-dots">
                                        {iframeGames.map((game, index) => (
                                          <Fragment key={game.id}>
                                            <span className={`journey-dot ${completedContentIds.includes(game.id) ? "done" : selectedGame?.id === game.id ? "active" : ""}`}>
                                              {completedContentIds.includes(game.id) ? "✓" : index + 1}
                                            </span>
                                            {index < iframeGames.length - 1 ? <span className="journey-line" /> : null}
                                          </Fragment>
                                        ))}
                                      </div>
                                      <strong>رحلة {sequentialCopy.kind === "challenge" ? "التحديات" : "الأنشطة"}</strong>
                                    </div>
                                  </>
                                ) : isInteractiveStoriesTab ? (
                                  <>
                                    <h2 className="content-title">{activeTabTitle || "قصة تفاعلية"} {activeTabIcon}</h2>

                                    <div className="activity-guide story-guide">
                                      <span>{sequentialCopy.guideIcon}</span>
                                      <div>
                                        <strong>{sequentialCopy.guideTitle}</strong>
                                        <p>{sequentialCopy.guideDescription}</p>
                                      </div>
                                    </div>

                                    <div className="activity-grid story-activity-grid">
                                      {iframeGames.map((game, index) => {
                                        const done = completedContentIds.includes(game.id);
                                        const active = selectedGame?.id === game.id;
                                        const unlocked = isActivityUnlocked(index);
                                        const cover = getActivityCover(game, index);

                                        return (
                                          <button
                                            key={game.id}
                                            type="button"
                                            onClick={() => openStoryActivity(game, index)}
                                            className={`activity-card story-activity-card ${active ? "active" : ""} ${!unlocked ? "locked" : ""}`}
                                          >
                                            <div
                                              className="activity-cover"
                                              style={{ background: cover }}
                                            >
                                              <span className={`activity-status ${done ? "done" : !unlocked ? "lock" : ""}`}>
                                                {done ? "✓" : !unlocked ? "🔒" : index + 1}
                                              </span>
                                              <span className="activity-status">🎭</span>
                                            </div>
                                            <div className="activity-body">
                                              <div className="activity-title">
                                                {game.title || `${sequentialCopy.itemLabel} ${index + 1}`}
                                              </div>
                                              <div className="activity-meta">
                                                <span>{done ? sequentialCopy.doneStatus : active ? sequentialCopy.activeStatus : unlocked ? sequentialCopy.openStatus : sequentialCopy.lockedStatus}</span>
                                                <span>{sequentialCopy.itemLabel} {index + 1}</span>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div className="story-player-section">
                                      {renderNativeStoryExperience(false)}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <h2 className="content-title">
                                      {activeTabTitle ? `${activeTabTitle} ${activeTabIcon}` : "ألعاب البرنامج 🎮"}
                                    </h2>

                                    <div
                                      className="game-tabs"
                                      style={{
                                        overflowX: "auto",
                                        flexWrap: "nowrap",
                                      }}
                                    >
                                      {iframeGames.map((game, index) => (
                                        <button
                                          key={game.id}
                                          onClick={() => { saveCurrentPosition(game); setActiveGameId(game.id); }}
                                          className={`game-tab ${
                                            selectedGame?.id === game.id
                                              ? "active"
                                              : ""
                                          }`}
                                        >
                                          {game.content_type === "interactive_story" ? "🎭" : "🎮"} {game.title || `لعبة ${index + 1}`}
                                          {completedContentIds.includes(game.id) ? (
                                            <span className="game-done-check">✓</span>
                                          ) : null}
                                        </button>
                                      ))}
                                    </div>

                                    {selectedGame?.iframe_url && (
                                      <div>
                                        <div className="game-player-shell">
                                          <div className="game-player-desktop">
                                            <div className="game-player-frame">
                                              <button
                                                type="button"
                                                className="desktop-fullscreen-btn"
                                                onClick={() =>
                                                  setFullscreenGame(getGameIframeSrc(selectedGame))
                                                }
                                                aria-label="فتح اللعبة على كامل الشاشة"
                                                title="كامل الشاشة"
                                              >
                                                ⛶
                                              </button>

                                              <iframe
                                                src={getGameIframeSrc(selectedGame)}
                                                className="game-player-iframe"
                                                allowFullScreen
                                                allow="fullscreen; autoplay; clipboard-write; encrypted-media"
                                              />
                                            </div>
                                          </div>

                                          <div
                                            className="game-player-mobile-preview"
                                            onClick={() =>
                                              setFullscreenGame(getGameIframeSrc(selectedGame))
                                            }
                                            role="button"
                                            tabIndex={0}
                                          >
                                            <iframe
                                              src={getGameIframeSrc(selectedGame)}
                                              className="game-player-mobile-preview-frame"
                                              allowFullScreen
                                              allow="fullscreen; autoplay; clipboard-write; encrypted-media"
                                            />

                                            <div className="game-player-mobile-overlay">
                                              <span>▶ العب الآن</span>
                                            </div>
                                          </div>
                                        </div>

                                    {gameResult && (
                                      <div
                                        style={{
                                          marginTop: 20,
                                          background: "#E9FFF7",
                                          border: "2px solid #0E9FAA",
                                          borderRadius: 24,
                                          padding: 20,
                                          fontWeight: 900,
                                          color: "#064E3B",
                                        }}
                                      >
                                        <div>✅ وصلت نتيجة اللعبة بنجاح</div>

                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                              "repeat(3, 1fr)",
                                            gap: 12,
                                            marginTop: 16,
                                          }}
                                        >
                                          <div
                                            style={{
                                              background: "white",
                                              borderRadius: 18,
                                              padding: 16,
                                              textAlign: "center",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontSize: 26,
                                                color: "#0E9FAA",
                                              }}
                                            >
                                              {gameResult.score ?? 0}
                                            </div>
                                            <div style={{ fontSize: 13 }}>
                                              Score
                                            </div>
                                          </div>

                                          <div
                                            style={{
                                              background: "white",
                                              borderRadius: 18,
                                              padding: 16,
                                              textAlign: "center",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontSize: 26,
                                                color: "#0E9FAA",
                                              }}
                                            >
                                              {gameResult.maxScore ?? "-"}
                                            </div>
                                            <div style={{ fontSize: 13 }}>
                                              Max
                                            </div>
                                          </div>

                                          <div
                                            style={{
                                              background: "white",
                                              borderRadius: 18,
                                              padding: 16,
                                              textAlign: "center",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontSize: 26,
                                                color: "#0E9FAA",
                                              }}
                                            >
                                              {gameResult.percentage ?? 0}%
                                            </div>
                                            <div style={{ fontSize: 13 }}>
                                              Percentage
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {gameAnswers.length > 0 && (
                                      <div className="answers-report">
                                        <h3
                                          className="content-title"
                                          style={{ marginTop: 12 }}
                                        >
                                          تفاصيل الأسئلة والإجابات 📋
                                        </h3>

                                        {gameAnswers.map((answer, index) => (
                                          <div
                                            key={`${
                                              answer.questionNumber || index
                                            }-${index}`}
                                            className="answer-card"
                                          >
                                            <div className="answer-head">
                                              <span className="answer-pill">
                                                سؤال{" "}
                                                {answer.questionNumber ||
                                                  index + 1}
                                              </span>

                                              {answer.isCorrect === true ? (
                                                <span className="answer-pill ok">
                                                  صحيح ✅
                                                </span>
                                              ) : answer.isCorrect === false ? (
                                                <span className="answer-pill bad">
                                                  غير صحيح
                                                </span>
                                              ) : (
                                                <span className="answer-pill">
                                                  غير مؤكد
                                                </span>
                                              )}
                                            </div>

                                            {answer.questionText && (
                                              <div className="answer-question">
                                                {answer.questionText}
                                              </div>
                                            )}

                                            {answer.selectedAnswers?.length >
                                              0 && (
                                              <div className="selected-answer-box">
                                                اختيار الطفل:{" "}
                                                {answer.selectedAnswers
                                                  .map(
                                                    (x: any) =>
                                                      x.text ||
                                                      x.image ||
                                                      "اختيار غير معروف"
                                                  )
                                                  .join("، ")}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                  </>
                                )}
                              </article>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </section>

                  <footer className="bottom-nav">
                    <button onClick={prevTab} className="nav-btn prev">
                      ← السابق
                    </button>

                    <div className="dots">
                      {tabs.map((tab) => (
                        <span
                          key={tab.id}
                          className={`dot ${
                            activeTab === tab.id ? "active" : ""
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={nextTab}
                      disabled={isEndStep && !canFinishProgram}
                      title={
                        isEndStep && !canFinishProgram
                          ? `باقي ${Math.max(
                              totalProgramContents - completedProgramContents,
                              0
                            )} محتوى لإكمال البرنامج`
                          : undefined
                      }
                      className={`nav-btn next ${
                        isEndStep && !canFinishProgram ? "disabled" : ""
                      }`}
                    >
                      {isEndStep
                        ? canFinishProgram
                          ? "إنهاء البرنامج 🎉"
                          : `أكمل الباقي (${completedProgramContents}/${totalProgramContents})`
                        : hasGames && !isLastGame
                        ? isInteractiveStoriesTab
                          ? "القصة التالية 🎭"
                          : "اللعبة التالية 🎮"
                        : "التالي →"}
                    </button>
                  </footer>
                </>
              )}
            </div>
          </div>
        </section>

        {fullscreenGame && (
          <div className="game-fullscreen" dir="rtl">
            <button
              type="button"
              onClick={() => setFullscreenGame(null)}
              className="game-fullscreen-close"
            >
              ✕ خروج
            </button>

            <iframe
              src={fullscreenGame}
              className="game-fullscreen-frame"
              allowFullScreen
              allow="fullscreen; autoplay; clipboard-write; encrypted-media"
            />
          </div>
        )}
    </ChildLayout>
  );
}

// RASHID_MOBILE_CHILD_PROGRAM_FIXED

// RASHID_MOBILE_BACK_BUTTON_THIRD_ITEM
