"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";
import ChildLayout from "@/components/child/ChildLayout";
import { getChildAvatar, getChildName, isProActive } from "@/components/child/childUtils";
import { CHILD_PROGRAM_PAGE_STYLES } from "@/components/child/program/childProgramStyles";
import { SequentialActivityCard } from "@/components/child/program/SequentialActivityCard";
import type { Content, Program, Tab } from "@/components/child/program/types";
import {
  getActivityCover,
  getContentKind,
  getNativeStoryAnswerLabel,
  getNativeStoryInfo,
  getSequentialCardIcon,
  getSequentialExperienceCopy,
  getStoryMediaUrl,
  icon,
  isPlayableContent,
  isTimedExternalPlayableContent,
  normalizeIframeUrl,
  youtubeEmbed,
} from "@/components/child/program/programUtils";


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
  const [storyVideoEnded, setStoryVideoEnded] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const elapsedSecondsRef = useRef(0);
  const savedFinalRef = useRef(false);

  const selectedGameRef = useRef<Content | null>(null);
  const storyVideoRef = useRef<HTMLVideoElement | null>(null);
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
    setStoryVideoEnded(false);
  }, [activeGameId, activeTab]);

  useEffect(() => {
    setStoryVideoEnded(false);
  }, [storySceneIndex, storyFeedback]);

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
    setStoryVideoEnded(false);
    setGameAnswers([]);
    setGameResult(null);
  }

  function replayStoryVideo() {
    const video = storyVideoRef.current;

    if (!video) return;

    setStoryVideoEnded(false);
    video.currentTime = 0;
    void video.play().catch(() => {
      // بعض المتصفحات تمنع التشغيل التلقائي، ساعتها الطفل يضغط تشغيل من controls.
    });
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
    setStoryVideoEnded(false);
    setGameAnswers([]);
    setGameResult(null);
    saveCurrentPosition(selectedGame);
  }

  function answerNativeStory(answer: any, answerIndex: number) {
    const info = getNativeStoryInfo(selectedGame);
    const currentScene = info.scenes[storySceneIndex];

    const requestedNextSceneId =
      answer?.nextSceneId ||
      answer?.next_scene_id ||
      answer?.targetSceneId ||
      answer?.target_scene_id ||
      answer?.sceneId ||
      answer?.scene_id ||
      "";

    const requestedNextSceneIndexRaw = answer?.nextSceneIndex ?? answer?.next_scene_index;
    const requestedNextSceneIndex =
      typeof requestedNextSceneIndexRaw === "number"
        ? requestedNextSceneIndexRaw
        : typeof requestedNextSceneIndexRaw === "string" && requestedNextSceneIndexRaw.trim() !== ""
          ? Number(requestedNextSceneIndexRaw)
          : -1;

    const nextSceneIndexFromId = requestedNextSceneId
      ? info.scenes.findIndex((scene: any) =>
          [scene?.id, scene?.scene_id, scene?.key, scene?.title]
            .filter(Boolean)
            .map(String)
            .includes(String(requestedNextSceneId))
        )
      : -1;

    const rawNextSceneIndex =
      Number.isFinite(requestedNextSceneIndex) && requestedNextSceneIndex >= 0
        ? requestedNextSceneIndex
        : nextSceneIndexFromId >= 0
          ? nextSceneIndexFromId
          : storySceneIndex + 1;

    const nextSceneIndex = rawNextSceneIndex > storySceneIndex ? rawNextSceneIndex : storySceneIndex + 1;
    const nextScene = info.scenes[nextSceneIndex];

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
      nextSceneIndex: nextScene ? nextSceneIndex : null,
      nextSceneVideoUrl: nextScene?.videoUrl || "",
      nextSceneImageUrl: nextScene?.imageUrl || "",
      feedbackVideoUrl: answer?.feedbackVideoUrl || answer?.feedback_video_url || answer?.videoUrl || answer?.video_url || "",
      feedbackImageUrl: answer?.feedbackImageUrl || answer?.feedback_image_url || answer?.imageUrl || answer?.image_url || "",
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
    const feedbackNextSceneIndex =
      typeof storyFeedback?.nextSceneIndex === "number" ? storyFeedback.nextSceneIndex : null;
    const targetSceneIndex =
      feedbackNextSceneIndex !== null && feedbackNextSceneIndex > storySceneIndex
        ? feedbackNextSceneIndex
        : storySceneIndex + 1;
    const hasNextScene = targetSceneIndex < info.scenes.length;

    setStoryFeedback(null);

    if (hasNextScene) {
      setStorySceneIndex(targetSceneIndex);
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
    const feedbackMedia = storyFeedback?.feedbackVideoUrl || storyFeedback?.nextSceneVideoUrl || "";
    const feedbackImage = storyFeedback?.feedbackImageUrl || storyFeedback?.nextSceneImageUrl || "";
    const currentMedia = feedbackMedia || currentScene?.videoUrl || "";
    const currentImage = !currentMedia ? feedbackImage || currentScene?.imageUrl || "" : "";
    const feedbackNextSceneIndex =
      typeof storyFeedback?.nextSceneIndex === "number" ? storyFeedback.nextSceneIndex : null;
    const targetSceneIndexAfterVideo =
      feedbackNextSceneIndex !== null && feedbackNextSceneIndex > storySceneIndex
        ? feedbackNextSceneIndex
        : storySceneIndex + 1;
    const canContinueAfterVideo = Boolean(storyFeedback) || sceneAnswers.length === 0;
    const hasNextAfterVideo = targetSceneIndexAfterVideo < scenes.length;
    const videoNextLabel = hasNextAfterVideo ? "المشهد التالي" : "إنهاء القصة";
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
                <>
                  <video
                    ref={storyVideoRef}
                    key={`${storySceneIndex}-${storyFeedback ? "feedback" : "scene"}-${currentMedia}`}
                    src={getStoryMediaUrl(currentMedia)}
                    controls={!storyVideoEnded}
                    controlsList="nodownload"
                    playsInline
                    autoPlay={Boolean(storyFeedback)}
                    preload="auto"
                    className={`story-native-video ${storyVideoEnded ? "video-ended-clean" : ""}`}
                    onPlay={() => setStoryVideoEnded(false)}
                    onLoadedMetadata={() => setStoryVideoEnded(false)}
                    onEnded={(e) => {
                      const video = e.currentTarget;

                      if (Number.isFinite(video.duration) && video.duration > 0) {
                        video.currentTime = Math.max(0, video.duration - 0.25);
                        video.pause();
                      }

                      setStoryVideoEnded(true);
                    }}
                  />

                  {storyVideoEnded && (
                    <div className="story-video-end-actions">
                      <button type="button" className="story-video-replay-btn" onClick={replayStoryVideo}>
                        إعادة التشغيل ↻
                      </button>

                      {canContinueAfterVideo ? (
                        <button type="button" className="story-video-next-btn" onClick={continueNativeStory}>
                          {videoNextLabel} ▶
                        </button>
                      ) : null}
                    </div>
                  )}
                </>
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
            <style>{CHILD_PROGRAM_PAGE_STYLES}</style>

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
                                          <SequentialActivityCard
                                            key={game.id}
                                            game={game}
                                            index={index}
                                            done={done}
                                            active={active}
                                            unlocked={unlocked}
                                            cover={cover}
                                            icon={getSequentialCardIcon(game, index, sequentialCopy)}
                                            title={game.title || `${sequentialCopy.itemLabel} ${index + 1}`}
                                            itemLabel={sequentialCopy.itemLabel}
                                            doneStatus={sequentialCopy.doneStatus}
                                            activeStatus={sequentialCopy.activeStatus}
                                            openStatus={sequentialCopy.openStatus}
                                            lockedStatus={sequentialCopy.lockedStatus}
                                            className={sequentialCopy.kind === "challenge" ? "challenge-activity-card" : ""}
                                            onClick={() => openLearningActivity(game, index)}
                                          />
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
                                          <SequentialActivityCard
                                            key={game.id}
                                            game={game}
                                            index={index}
                                            done={done}
                                            active={active}
                                            unlocked={unlocked}
                                            cover={cover}
                                            icon="🎭"
                                            title={game.title || `${sequentialCopy.itemLabel} ${index + 1}`}
                                            itemLabel={sequentialCopy.itemLabel}
                                            doneStatus={sequentialCopy.doneStatus}
                                            activeStatus={sequentialCopy.activeStatus}
                                            openStatus={sequentialCopy.openStatus}
                                            lockedStatus={sequentialCopy.lockedStatus}
                                            className="story-activity-card"
                                            onClick={() => openStoryActivity(game, index)}
                                          />
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
