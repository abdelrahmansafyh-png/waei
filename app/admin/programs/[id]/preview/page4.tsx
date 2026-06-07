"use client";

import { use, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";

type Program = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  age_range: string | null;
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
  const extractedUrl = srcMatch ? srcMatch[1] : value.trim();

  return extractedUrl;
}

function icon(type: string) {
  if (type === "games" || type === "iframe") return "🎮";
  if (type === "youtube") return "▶️";
  if (type === "video") return "🎬";
  if (type === "image" || type === "images") return "🖼️";
  if (type === "file" || type === "files") return "📎";
  return "📘";
}

export default function ProgramPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [program, setProgram] = useState<Program | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [activeGameId, setActiveGameId] = useState("");
  const [gameResult, setGameResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    fetchPreview();
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data;

      if (!data || typeof data !== "object" || !data.type) return;

      if (data.type === "WAEI_GAME_RESULT") {
        setGameResult(data);
      }
    }

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);


  async function fetchPreview() {
    setLoading(true);

    const { data: programData } = await supabase
      .from("programs")
      .select("id,title,description,image_url,age_range")
      .eq("id", id)
      .single();

    const { data: tabsData } = await supabase
      .from("program_tabs")
      .select("*")
      .eq("program_id", id)
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

  const activeContents = useMemo(
    () => contents.filter((x) => x.tab_id === activeTab),
    [contents, activeTab]
  );

  const iframeGames = useMemo(
    () =>
      activeContents.filter(
        (item) =>
          (item.content_type === "iframe" || item.content_type === "zip_game") &&
          item.iframe_url
      ),
    [activeContents]
  );

  const normalContents = useMemo(
    () => activeContents.filter((item) => item.content_type !== "iframe"),
    [activeContents]
  );

  const selectedGame =
    iframeGames.find((game) => game.id === activeGameId) || iframeGames[0];

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
        (item.content_type === "iframe" || item.content_type === "zip_game") &&
        item.iframe_url
    );

    setGameResult(null);

    if (games.length > 0) {
      setActiveGameId(games[0].id);
    } else {
      setActiveGameId("");
    }
  }, [activeTab, contents]);

    function nextTab() {
    if (!tabs.length) return;

    if (hasGames && !isLastGame) {
        setActiveGameId(iframeGames[selectedGameIndex + 1].id);
        return;
    }

    if (isEndStep) {
        alert("أحسنت! أنهيت البرنامج 🎉");
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
        <div className="loading-card">جاري تحميل المعاينة...</div>
      </main>
    );
  }

  return (
    <main className="preview-page" dir="rtl">
      <style>{`
        // .preview-page {
        //   min-height: 100vh;
        //   background:
        //     radial-gradient(circle at 10% 10%, rgba(255,255,255,.9), transparent 24%),
        //     linear-gradient(180deg, #dff4ff 0%, #f7fbff 45%, #eaffdd 100%);
        //   color: #20294f;
        //   padding: 24px;
        //   overflow-x: hidden;
        //   font-family: Arial, sans-serif;
        // }

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

        .avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          background: #dff4ff;
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
          grid-template-columns: 1fr 300px;
          gap: 28px;
          align-items: center;
        }

        .text-body {
          font-size: 21px;
          line-height: 2.1;
          color: #667085;
          text-align: center;
          font-weight: 700;

            // display: flex;
            align-items: center;
            justify-content: center;


        }

        .center-text-only {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .side-img {
          width: 100%;
          border-radius: 26px;
          box-shadow: 0 12px 25px rgba(62,87,120,.15);
        }

        .media-wrap {
          max-width: 780px;
          margin: 0 auto;
          background: white;
          padding: 12px;
          border-radius: 30px;
          box-shadow: 0 12px 28px rgba(62,87,120,.15);
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

        .iframe-frame {
          width: 100%;
          height: 430px;
          border: 0;
          border-radius: 22px;
          background: white;
        }

        .game-tabs {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 6px 4px 18px;
          margin-bottom: 16px;
        }

        .game-tab {
          border: 0;
          cursor: pointer;
          white-space: nowrap;
          border-radius: 18px;
          padding: 14px 20px;
          background: #eef7ff;
          color: #20294f;
          font-weight: 900;
          font-size: 16px;
          box-shadow: 0 8px 18px rgba(62,87,120,.08);
        }

        .game-tab.active {
          background: linear-gradient(135deg, #8b5cf6, #6847f5);
          color: white;
        }

        .game-frame-wrap {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 28px;
        }


        .game-frame {
          width: 100%;
          height: 820px;
          border: 0;
          border-radius: 28px;
          display: block;
          background: white;
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

          .side-img {
            display: none;
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
          <a href="/admin/programs" className="top-btn">
            ← رجوع للبرامج
          </a>

          <div className="preview-badge">
            {isEndStep ? "🎉 إنهاء البرنامج" : "👁️ معاينة الطفل"}
            </div>

          <div className="child-card">
            <img
              src="/images/preview/preview_avatar.png"
              className="avatar"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <div>
              <div className="child-name">سامي البطل</div>
              <div className="xp">⭐ 120 XP</div>
              <div className="xp-bar">
                <div className="xp-fill" />
              </div>
            </div>

            <div style={{ fontSize: 34 }}>🛡️</div>
          </div>
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
                {/* <div className="stat">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-label">المدة</div>
                  <div className="stat-value">10 - 15 دقيقة</div>
                </div> */}

                {/* <div className="stat">
                  <div className="stat-icon">👦</div>
                  <div className="stat-label">عدد اللاعبين</div>
                  <div className="stat-value">لاعب 1</div>
                </div> */}

                <div className="stat">
                  <div className="stat-icon">🌿</div>
                  <div className="stat-label">القيمة</div>
                  <div className="stat-value">ثقة وشخصية</div>
                </div>
              </div>
            </div>

            <div className="hero-image-wrap">
              <img
                src={
                  program.image_url
                    ? getFileUrl(program.image_url)
                    : "/images/preview/preview_hero_illustration.png"
                }
                className="hero-image"
              />
            </div>
          </div>
        </section>

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
                    className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  >
                    {icon(tab.type)} {tab.title}
                  </button>
                ))}
              </div>

              {activeContents.length === 0 ? (
                <div className="empty">لا يوجد محتوى داخل هذا التاب 📦</div>
              ) : (
                <div className="content-list">
                  {normalContents.map((item) => (
                    <article key={item.id} className="content-card">
                      {item.title && (
                        <h2 className="content-title">{item.title}</h2>
                      )}

                      {item.content_type === "text" && (
                        <div className="text-content center-text-only">
                          <div className="text-body">{item.body}</div>
                        </div>
                      )}

                      {item.content_type === "image" && item.file_url && (
                        <div className="media-wrap">
                          <img
                            src={getFileUrl(item.file_url)}
                            className="media-image"
                          />
                        </div>
                      )}

                      {item.content_type === "video" && item.file_url && (
                        <div className="media-wrap">
                          <video
                            src={getFileUrl(item.file_url)}
                            controls
                            className="video-frame"
                          />
                        </div>
                      )}

                      {item.content_type === "youtube" && item.youtube_url && (
                        <div className="media-wrap">
                          <iframe
                            src={youtubeEmbed(item.youtube_url)}
                            className="video-frame"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {item.content_type === "file" && item.file_url && (
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
                    <article className="content-card">
                      <h2 className="content-title">ألعاب البرنامج 🎮</h2>

                      <div className="game-tabs">
                        {iframeGames.map((game, index) => (
                          <button
                            key={game.id}
                            onClick={() => setActiveGameId(game.id)}
                            className={`game-tab ${
                              selectedGame?.id === game.id ? "active" : ""
                            }`}
                          >
                            🎮 {game.title || `لعبة ${index + 1}`}
                          </button>
                        ))}
                      </div>

                     {selectedGame?.iframe_url && (
                        <div className="media-wrap game-frame-wrap">
                            <iframe
                              src={normalizeIframeUrl(selectedGame.iframe_url)}
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
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: 12,
                                    marginTop: 16,
                                  }}
                                >
                                  <div style={{ background: "white", borderRadius: 18, padding: 16, textAlign: "center" }}>
                                    <div style={{ fontSize: 26, color: "#0B4D6B" }}>{gameResult.score ?? 0}</div>
                                    <div style={{ fontSize: 13 }}>Score</div>
                                  </div>

                                  <div style={{ background: "white", borderRadius: 18, padding: 16, textAlign: "center" }}>
                                    <div style={{ fontSize: 26, color: "#0B4D6B" }}>{gameResult.maxScore ?? "-"}</div>
                                    <div style={{ fontSize: 13 }}>Max</div>
                                  </div>

                                  <div style={{ background: "white", borderRadius: 18, padding: 16, textAlign: "center" }}>
                                    <div style={{ fontSize: 26, color: "#0B4D6B" }}>{gameResult.percentage ?? 0}%</div>
                                    <div style={{ fontSize: 13 }}>Percentage</div>
                                  </div>

                                  {/* <div style={{ background: "white", borderRadius: 18, padding: 16, textAlign: "center" }}>
                                    <div style={{ fontSize: 20, color: "#0B4D6B" }}>{gameResult.confidence || "tracked"}</div>
                                    <div style={{ fontSize: 13 }}>Confidence</div>
                                  </div> */}
                                </div>

                                {gameResult.correctQuestions?.length > 0 && (
                                  <div style={{ marginTop: 14 }}>
                                    الأسئلة الصحيحة: {gameResult.correctQuestions.join(", ")}
                                  </div>
                                )}
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
                className={`dot ${activeTab === tab.id ? "active" : ""}`}
              />
            ))}
          </div>

          <button onClick={nextTab} className="nav-btn next">
            {isEndStep ? "إنهاء البرنامج 🎉" : hasGames && !isLastGame ? "اللعبة التالية 🎮" : "التالي →"}
            </button>
        </footer>
      </div>
    </main>
  );
}




