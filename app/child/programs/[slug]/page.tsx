"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";
import ChildLayout from "@/components/dashboard/ChildLayout";
import { getChildAvatar, getChildName, isProActive } from "@/components/dashboard/childUtils";

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



export default function ChildProgramPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<any>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [activeGameId, setActiveGameId] = useState("");
  const [gameResult, setGameResult] = useState<any>(null);
  const [gameAnswers, setGameAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const savedFinalRef = useRef(false);

  const selectedGameRef = useRef<Content | null>(null);

  const proActive = isProActive(profile);
  const locked = program?.access_type === "pro" && !proActive;

  const childName = getChildName(profile);
  const childAvatar = getChildAvatar(profile);

  useEffect(() => {
    fetchPage();
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

    if (tabsData?.length) setActiveTab(tabsData[0].id);

    setLoading(false);
  }

  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      const data = event.data;

      if (!data || typeof data !== "object" || !data.type) return;

      if (data.type === "WAEI_GAME_EVENT" && data.event === "question_snapshot") {
        if (Array.isArray(data.answers)) {
          setGameAnswers(data.answers);
        }
      }

      if (data.type === "WAEI_GAME_RESULT") {
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
    if (!profile?.id || !program?.id) return;

    try {
      await supabase.from("game_attempts").insert({
        child_profile_id: profile.id,
        parent_profile_id: profile.parent_profile_id || null,
        content_id: selectedGameRef.current?.id || null,
        program_id: program.id,
        score: data.score || 0,
        max_score: data.maxScore || 0,
        percentage: data.percentage || 0,
        completed: true,
        duration_seconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        attempt_number: 1,
        result: data,
        answers: data.answers || [],
      });
    } catch (err) {
      console.error("save attempt failed", err);
    }
  }

  const activeContents = useMemo(
    () => contents.filter((x) => x.tab_id === activeTab),
    [contents, activeTab]
  );

  const iframeGames = useMemo(
    () =>
      activeContents.filter(
        (item) =>
          (item.content_type === "iframe" || item.content_type === "zip_game" || item.content_type === "interactive_story") &&
          item.iframe_url
      ),
    [activeContents]
  );

  const normalContents = useMemo(
    () =>
      activeContents.filter(
        (item) => item.content_type !== "iframe" && item.content_type !== "interactive_story" && item.content_type !== "zip_game"
      ),
    [activeContents]
  );

  const selectedGame =
    iframeGames.find((game) => game.id === activeGameId) || iframeGames[0];

  selectedGameRef.current = selectedGame || null;

  const activeIndex = tabs.findIndex((x) => x.id === activeTab);

  const isLastTab = activeIndex === tabs.length - 1;

  const selectedGameIndex = iframeGames.findIndex(
    (game) => game.id === selectedGame?.id
  );

  const hasGames = iframeGames.length > 0;
  const isLastGame = !hasGames || selectedGameIndex === iframeGames.length - 1;
  const isEndStep = isLastTab && isLastGame;

  useEffect(() => {
    const games = contents.filter(
      (item) =>
        item.tab_id === activeTab &&
        (item.content_type === "iframe" || item.content_type === "zip_game" || item.content_type === "interactive_story") &&
        item.iframe_url
    );

    setGameResult(null);
    setGameAnswers([]);

    if (games.length > 0) {
      setActiveGameId(games[0].id);
    } else {
      setActiveGameId("");
    }
  }, [activeTab, contents]);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function getTabGamesCount(tabId: string) {
    return contents.filter(
      (item) =>
        item.tab_id === tabId &&
        (item.content_type === "iframe" || item.content_type === "zip_game" || item.content_type === "interactive_story") &&
        item.iframe_url
    ).length;
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

    savedFinalRef.current = true;
    setFinished(true);

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    if (profile?.id && program?.id) {
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
      setActiveGameId(iframeGames[selectedGameIndex + 1].id);
      return;
    }

    if (isEndStep) {
      finishProgram();
      return;
    }

    const next = activeIndex + 1;
    setActiveTab(tabs[next].id);
  }

  function prevTab() {
    if (!tabs.length) return;

    if (hasGames && selectedGameIndex > 0) {
      setActiveGameId(iframeGames[selectedGameIndex - 1].id);
      return;
    }

    const prev = activeIndex - 1 < 0 ? 0 : activeIndex - 1;
    setActiveTab(tabs[prev].id);
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
                  min-height: 100vh;
                  background:
                      linear-gradient(rgba(255,255,255,.25), rgba(255,255,255,.25)),
                      url("/images/kids-soft-bg.png");
                  background-size: cover;
                  background-position: center top;
                  background-repeat: no-repeat;
                  background-attachment: fixed;
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
                  max-width: 180px;
                  border: 0;
                  cursor: pointer;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
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

             .game-frame-wrap {
  width: 100%;
  min-height: 760px;
  overflow: hidden;
  border-radius: 28px;
  background: white;
}

.game-frame {
  width: 100%;
  height: 700px;
  border: 0;
  border-radius: 28px;
  display: block;
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
                color: #0B4D6B;
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
                color: #0B4D6B;
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
                color: #0B4D6B;
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
                background: #0B4D6B;
                color: white;
                text-decoration: none;
                padding: 16px 28px;
                border-radius: 999px;
                font-weight: 900;
              }

              @media (max-width: 900px) {
                .preview-page {
                  padding: 14px;
                }

                .top-bar {
                  flex-direction: column;
                  align-items: stretch;
                }

                .child-card {
                  justify-content: center;
                }

                .hero-inner {
                  grid-template-columns: 1fr;
                }

                .hero-title {
                  font-size: 38px;
                  text-align: center;
                }

                .hero-desc {
                  text-align: center;
                  font-size: 18px;
                }

                .stats {
                  grid-template-columns: 1fr;
                }

                .hero-image {
                  height: 250px;
                }

                .text-content {
                  grid-template-columns: 1fr;
                }

                .game-frame {
                  width: 100%;
                  height: 680px;
                  border: 0;
                  border-radius: 28px;
                  overflow: hidden;
                  display: block;
                  background: white;
                }

                .bottom-nav {
                  gap: 10px;
                }

                .dots {
                  display: none;
                }

                .nav-btn {
                  flex: 1;
                  padding: 15px 14px;
                }
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
                  عودة للخلف ←
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
                              onClick={() => setActiveTab(tab.id)}
                              className={`tab-btn ${
                                activeTab === tab.id ? "active" : ""
                              }`}
                            >
                              {icon(tab.type)} {tab.title}
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
                               
                                <h2 className="content-title">
                                  {tabs.find((t) => t.id === activeTab)?.title === "الأنشطة"
                                    ? "أنشطة البرنامج ✨"
                                    : "ألعاب البرنامج 🎮"}
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
                                      onClick={() => setActiveGameId(game.id)}
                                      className={`game-tab ${
                                        selectedGame?.id === game.id
                                          ? "active"
                                          : ""
                                      }`}
                                    >
                                      {game.content_type === "interactive_story" ? "🎭" : "🎮"} {game.title || `لعبة ${index + 1}`}
                                    </button>
                                  ))}
                                </div>

                                {selectedGame?.iframe_url && (
                                  <div className="media-wrap game-frame-wrap">
                                    <iframe
                                      src={normalizeIframeUrl(
                                        selectedGame.iframe_url
                                      )}
                                      className="game-frame"
                                      allowFullScreen
                                      allow="fullscreen; autoplay; clipboard-write; encrypted-media"
                                    />

                                    {gameResult && (
                                      <div
                                        style={{
                                          marginTop: 20,
                                          background: "#E9FFF7",
                                          border: "2px solid #42BFA8",
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
                                                color: "#0B4D6B",
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
                                                color: "#0B4D6B",
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
                                                color: "#0B4D6B",
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

                    <button onClick={nextTab} className="nav-btn next">
                      {isEndStep
                        ? "إنهاء البرنامج 🎉"
                        : hasGames && !isLastGame
                        ? "اللعبة التالية 🎮"
                        : "التالي →"}
                    </button>
                  </footer>
                </>
              )}
            </div>
          </div>
        </section>
    </ChildLayout>
  );
}
