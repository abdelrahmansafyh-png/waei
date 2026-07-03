"use client";

import { useEffect, useMemo, useState } from "react";
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
  sort_order: number;
  categories?: { name: string } | null;
};

type Attempt = {
  id: string;
  program_id: string | null;
  content_id: string | null;
  completed: boolean;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  created_at: string;
};

type ChildProgress = {
  id: string;
  child_profile_id: string;
  program_id: string;
  content_id: string;
  completed: boolean;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  xp_earned: number | null;
  xp_awarded: boolean | null;
  last_position: number | null;
  updated_at: string;
};

type ProgramProgress = {
  id: string;
  child_profile_id: string;
  program_id: string;
  elapsed_seconds: number | null;
  last_tab_id: string | null;
  last_content_id: string | null;
  completed: boolean | null;
  updated_at: string | null;
};



export default function ChildDashboard({ profile }: { profile: any }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [progressItems, setProgressItems] = useState<ChildProgress[]>([]);
  const [programProgress, setProgramProgress] = useState<ProgramProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const childName = getChildName(profile);
  const childIcon = getChildAvatar(profile);
  const proActive = isProActive(profile);

  useEffect(() => {
    loadData();
  }, []);


  async function loadData() {
    setLoading(true);

    const { data: programsData } = await supabase
      .from("programs")
      .select("*, categories(name)")
      .eq("is_published", true)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .order("sort_order", { ascending: true });

    const { data: attemptsData } = await supabase
      .from("game_attempts")
      .select("*")
      .eq("child_profile_id", profile.id)
      .eq("completed", true)
      .order("created_at", { ascending: false });

    const { data: progressData } = await supabase
      .from("child_content_progress")
      .select("*")
      .eq("child_profile_id", profile.id)
      .order("updated_at", { ascending: false });

    const { data: programProgressData } = await supabase
      .from("child_program_progress")
      .select("*")
      .eq("child_profile_id", profile.id)
      .order("updated_at", { ascending: false });

    setPrograms((programsData as Program[]) || []);
    setAttempts((attemptsData as Attempt[]) || []);
    setProgressItems((progressData as ChildProgress[]) || []);
    setProgramProgress((programProgressData as ProgramProgress[]) || []);
    setLoading(false);
  }

  function getProgramProgress(programId: string) {
    return programProgress.find((row) => row.program_id === programId);
  }

  function isProgramCompleted(programId: string) {
    const progress = getProgramProgress(programId);

    if (progress?.completed === true) {
      return true;
    }

    return attempts.some(
      (attempt) =>
        attempt.program_id === programId &&
        attempt.completed &&
        attempt.content_id === null &&
        (attempt.percentage || 0) >= 100
    );
  }

  function getProgramBestScore(programId: string) {
    const related = attempts.filter((attempt) => attempt.program_id === programId);

    const percentages = related
      .map((attempt) => attempt.percentage || 0)
      .filter((value) => value > 0);

    if (!percentages.length) return null;

    return Math.max(...percentages);
  }

  function getProgramHref(program: Program) {
    const locked = program.access_type === "pro" && !proActive;

    if (locked) {
      return "/plans";
    }

    const progress = getProgramProgress(program.id);

    if (progress?.last_content_id && !isProgramCompleted(program.id)) {
      return `/child/programs/${program.slug}?content=${progress.last_content_id}`;
    }

    return `/child/programs/${program.slug}`;
  }

  const completedPrograms = useMemo(
    () => programs.filter((program) => isProgramCompleted(program.id)).length,
    [programs, attempts, programProgress]
  );

  const totalXp = useMemo(() => {
    return progressItems.reduce((sum, item) => sum + (item.xp_awarded ? item.xp_earned || 0 : 0), 0);
  }, [progressItems]);

  const displayXp = profile?.xp ?? totalXp;

  const lastAttempt = attempts[0];

  const lastIncompleteProgress = useMemo(() => {
    const fromProgramProgress = programProgress.find(
      (item) => item.last_content_id && !isProgramCompleted(item.program_id)
    );

    if (fromProgramProgress) {
      return {
        program_id: fromProgramProgress.program_id,
        content_id: fromProgramProgress.last_content_id,
        updated_at: fromProgramProgress.updated_at || "",
      };
    }

    return progressItems.find((item) => !isProgramCompleted(item.program_id));
  }, [progressItems, attempts, programProgress]);

  const resumeProgram = lastIncompleteProgress
    ? programs.find((program) => program.id === lastIncompleteProgress.program_id)
    : null;

  const nextProgram = programs.find((program) => !isProgramCompleted(program.id));

  const continueHref = resumeProgram
    ? `/child/programs/${resumeProgram.slug}?content=${lastIncompleteProgress?.content_id}`
    : nextProgram
    ? getProgramHref(nextProgram)
    : "/child/programs";

  const continueLabel = resumeProgram
    ? "أكمل البرنامج"
    : nextProgram
    ? "ابدأ البرنامج التالي"
    : "عرض البرامج";

  function isToday(dateValue: string | null | undefined) {
    if (!dateValue) return false;

    const date = new Date(dateValue);
    const now = new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const lastCompletedProgram = useMemo(() => {
    const completedProgramIds = new Set<string>();

    programProgress.forEach((row) => {
      if (row.completed && row.program_id) {
        completedProgramIds.add(row.program_id);
      }
    });

    attempts.forEach((attempt) => {
      if (
        attempt.program_id &&
        attempt.completed &&
        attempt.content_id === null &&
        (attempt.percentage || 0) >= 100
      ) {
        completedProgramIds.add(attempt.program_id);
      }
    });

    const rows = Array.from(completedProgramIds)
      .map((programId) => {
        const progress = programProgress.find((row) => row.program_id === programId);
        const attempt = attempts.find(
          (row) =>
            row.program_id === programId &&
            row.completed &&
            row.content_id === null &&
            (row.percentage || 0) >= 100
        );

        return {
          programId,
          at: progress?.updated_at || attempt?.created_at || "",
        };
      })
      .sort((a, b) => {
        const aTime = a.at ? new Date(a.at).getTime() : 0;
        const bTime = b.at ? new Date(b.at).getTime() : 0;
        return bTime - aTime;
      });

    const row = rows[0];
    if (!row) return null;

    return programs.find((program) => program.id === row.programId) || null;
  }, [programProgress, attempts, programs]);

  const todayProgress = useMemo(() => {
    const todayContentIds = new Set<string>();

    progressItems.forEach((item) => {
      if (item.completed && isToday(item.updated_at)) {
        todayContentIds.add(item.content_id);
      }
    });

    attempts.forEach((attempt) => {
      if (attempt.completed && attempt.content_id && isToday(attempt.created_at)) {
        todayContentIds.add(attempt.content_id);
      }
    });

    const completedToday = todayContentIds.size;
    const dailyTarget = 5;
    const percentage = Math.min(100, Math.round((completedToday / dailyTarget) * 100));

    return {
      completedToday,
      percentage,
      dailyTarget,
    };
  }, [progressItems, attempts]);

  return (
    <ChildLayout profile={profile} activeHref="/dashboard">
      <section className="relative flex-1 px-3 py-3 md:px-8 md:py-7">
        <div className="relative mx-auto max-w-7xl">
          <header className="relative mb-4 overflow-hidden rounded-[1.8rem] bg-white/86 p-4 shadow-[0_18px_44px_rgba(20,34,74,.10)] backdrop-blur-xl md:mb-7 md:rounded-[2.6rem] md:p-6 md:shadow-[0_22px_60px_rgba(20,34,74,.12)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.9),transparent_18%),radial-gradient(circle_at_65%_55%,rgba(255,214,102,.30),transparent_22%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="hidden text-8xl md:block">🌈</div>
                <div>
                  <p className="text-sm font-black text-[var(--rashid-color-0e9faa)]">👋 أهلاً بعودتك</p>
                  <h1 className="mt-1 text-3xl font-black text-[var(--rashid-color-14224a)] md:text-6xl">
                    يا {childName}
                  </h1>
                  <p className="mt-2 text-sm font-bold text-[var(--rashid-color-566681)] md:mt-3 md:text-lg">
                    اختر برنامجك وابدأ رحلة جديدة اليوم.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={proActive ? "/dashboard/subscription" : "/plans"}
                  className="rounded-[1.2rem] bg-[var(--rashid-color-ffeba5)] px-4 py-3 text-sm font-black text-[var(--rashid-color-8a6200)] shadow-lg md:rounded-[1.4rem] md:px-6 md:py-4 md:text-base"
                >
                  {proActive ? "👑 اشتراك Pro" : "🟢 اشتراك Free"}
                </Link>

                <button className="rounded-[1.2rem] bg-[var(--rashid-color-0e9faa)] px-4 py-3 text-sm font-black text-white shadow-lg md:rounded-[1.4rem] md:px-6 md:py-4 md:text-base">
                  🏆 ترتيبي
                </button>

                <Link
                  href={continueHref}
                  className="rounded-[1.2rem] bg-[var(--rashid-color-7050e8)] px-4 py-3 text-sm font-black text-white shadow-lg md:rounded-[1.4rem] md:px-6 md:py-4 md:text-base"
                >
                  🚀 {continueLabel}
                </Link>
              </div>
            </div>
          </header>

  

          {!proActive && (
            <section className="mb-7 rounded-[2.4rem] bg-[var(--rashid-color-fff4c7)] p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[var(--rashid-color-14224a)]">👑 برامج مميزة بانتظارك</h2>
                  <p className="mt-2 font-bold text-[var(--rashid-color-8a6200)]">
                    بعض البرامج تحتاج اشتراك Pro. يمكنك مشاهدة البرامج، لكن الدخول إلى محتوى Pro يتطلب تفعيل الاشتراك.
                  </p>
                </div>
                <Link
                  href="/plans"
                  className="rounded-full bg-[var(--rashid-color-0e9faa)] px-7 py-4 font-black text-white shadow-lg"
                >
                  مشاهدة الخطط والاشتراكات
                </Link>
              </div>
            </section>
          )}

          <div className="mb-4 grid grid-cols-3 gap-2 md:mb-7 md:gap-5">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[var(--rashid-color-bfe9ff)] to-[var(--rashid-color-eaf7ff)] p-3 text-center text-[var(--rashid-color-1d3772)] shadow-lg md:rounded-[2rem] md:p-6 md:text-start md:shadow-xl">
              <div className="absolute left-3 top-3 text-3xl opacity-20 md:left-5 md:top-5 md:text-6xl">📚</div>
              <div className="relative text-3xl md:text-6xl">📖</div>
              <div className="relative mt-2 text-3xl font-black md:mt-4 md:text-5xl">{programs.length}</div>
              <div className="relative mt-1 text-xs font-black leading-5 md:mt-2 md:text-base">برامج متاحة</div>
            </div>

            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[var(--rashid-color-ddf8cc)] to-[var(--rashid-color-f2ffe8)] p-3 text-center text-[var(--rashid-color-247b25)] shadow-lg md:rounded-[2rem] md:p-6 md:text-start md:shadow-xl">
              <div className="absolute left-3 top-3 text-3xl opacity-20 md:left-5 md:top-5 md:text-6xl">⭐</div>
              <div className="relative text-3xl md:text-6xl">✅</div>
              <div className="relative mt-2 text-3xl font-black md:mt-4 md:text-5xl">{completedPrograms}</div>
              <div className="relative mt-1 text-xs font-black leading-5 md:mt-2 md:text-base">برامج مكتملة</div>
            </div>

            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[var(--rashid-color-ffe89d)] to-[var(--rashid-color-fff7d8)] p-3 text-center text-[var(--rashid-color-b75a00)] shadow-lg md:rounded-[2rem] md:p-6 md:text-start md:shadow-xl">
              <div className="absolute left-3 top-3 text-3xl opacity-20 md:left-5 md:top-5 md:text-6xl">⚡</div>
              <div className="relative text-3xl md:text-6xl">⚡</div>
              <div className="relative mt-2 text-3xl font-black md:mt-4 md:text-5xl">{displayXp}</div>
              <div className="relative mt-1 text-xs font-black leading-5 md:mt-2 md:text-base">XP المكتسب</div>
            </div>
          </div>

          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.7rem] bg-white/90 p-5 shadow-lg backdrop-blur">
              <div className="text-3xl">🏁</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-0e9faa)]">آخر برنامج مكتمل</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-14224a)]">
                {lastCompletedProgram?.title || "لم تكمل برنامجًا بعد"}
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--rashid-color-566681)]">سيظهر هنا آخر إنجاز كامل.</div>
            </div>

            <div className="rounded-[1.7rem] bg-white/90 p-5 shadow-lg backdrop-blur">
              <div className="text-3xl">🚀</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-7050e8)]">متابعة آخر برنامج</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-14224a)]">
                {resumeProgram?.title || nextProgram?.title || "كل البرامج مكتملة"}
              </div>
              <Link href={continueHref} className="mt-3 inline-flex rounded-full bg-[var(--rashid-color-7050e8)] px-5 py-2 text-sm font-black text-white">
                {continueLabel}
              </Link>
            </div>

            <div className="rounded-[1.7rem] bg-white/90 p-5 shadow-lg backdrop-blur">
              <div className="text-3xl">☀️</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-b75a00)]">تقدم اليوم</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-14224a)]">
                {todayProgress.percentage}%
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--rashid-color-ffeec2)]">
                <div className="h-full rounded-full bg-gradient-to-l from-[var(--rashid-color-ffd54a)] to-[var(--rashid-color-f59e0b)]" style={{ width: `${todayProgress.percentage}%` }} />
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--rashid-color-566681)]">
                {todayProgress.completedToday} من {todayProgress.dailyTarget} أنشطة اليوم
              </div>
            </div>
          </section>

          <section className="mb-6 overflow-hidden rounded-[1.8rem] bg-white/90 p-4 shadow-lg backdrop-blur md:rounded-[2.2rem] md:p-5 md:shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-black text-[var(--rashid-color-0e9faa)]">رحلتك القادمة</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--rashid-color-14224a)] md:text-3xl">
                  {resumeProgram ? resumeProgram.title : nextProgram ? nextProgram.title : "كل البرامج جاهزة"}
                </h2>
                <p className="mt-1 text-sm font-bold text-[var(--rashid-color-566681)]">
                  {resumeProgram ? "ارجع لنفس المكان الذي وصلت له." : nextProgram ? "ابدأ البرنامج التالي في رحلتك." : "استكشف البرامج أو أعد اللعب لتحسين نتيجتك."}
                </p>
              </div>

              <Link
                href={continueHref}
                className="rounded-full bg-[var(--rashid-color-7050e8)] px-7 py-4 font-black text-white shadow-lg"
              >
                {continueLabel} 🚀
              </Link>
            </div>
          </section>

          {lastAttempt && (
            <section className="mb-8 overflow-hidden rounded-[2.4rem] bg-white/90 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="hidden text-7xl md:block">⭐</div>
                  <div>
                    <p className="font-black text-[var(--rashid-color-0e9faa)]">آخر نشاط</p>
                    <h2 className="mt-1 text-3xl font-black text-[var(--rashid-color-14224a)]">
                      نتيجتك الأخيرة: {lastAttempt.score ?? 0} / {lastAttempt.max_score ?? "-"}
                    </h2>
                    <p className="mt-2 font-bold text-[var(--rashid-color-566681)]">
                      استمر، كل محاولة تقرّبك من إنجاز جديد.
                    </p>
                  </div>
                </div>

                <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-3xl font-black text-[var(--rashid-color-0e9faa)] shadow-lg ring-8 ring-[var(--rashid-color-e7fbf4)]">
                  {lastAttempt.percentage ?? 0}%
                </div>
              </div>
            </section>
          )}
          

          <section className="rounded-[1.8rem] bg-white/82 p-4 shadow-lg backdrop-blur md:rounded-[2.6rem] md:p-6 md:shadow-xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-[var(--rashid-color-e8f8f3)] px-5 py-2 font-black text-[var(--rashid-color-0e9faa)]">
                  برامجي 🗺️
                </div>
                <h2 className="text-2xl font-black text-[var(--rashid-color-14224a)] md:text-4xl">
                  جرّب برامجنا التفاعلية
                </h2>
              </div>

              <Link
                href="/child/programs"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--rashid-color-7050e8)] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 md:gap-3 md:px-7 md:py-4 md:text-base"
              >
                عرض كل البرامج
              </Link>
            </div>
            

            {loading ? (
              <div className="rounded-[2rem] bg-white p-12 text-center font-black text-[var(--rashid-color-6e7a99)]">
                جاري تحميل البرامج...
              </div>
            ) : programs.length > 0 ? (
              <div
                className={`grid gap-5 ${
                  programs.length === 1
                    ? "mx-auto max-w-[360px]"
                    : programs.length === 2
                    ? "mx-auto max-w-3xl md:grid-cols-2"
                    : "sm:grid-cols-2 xl:grid-cols-4"
                }`}
              >
                {programs.slice(0, 6).map((program, index) => {
                  const completed = isProgramCompleted(program.id);
                  const bestScore = getProgramBestScore(program.id);
                  const locked = program.access_type === "pro" && !proActive;
                  const fallbackGradients = [
                    "from-[var(--rashid-color-22c7a9)] to-[var(--rashid-color-4da3ff)]",
                    "from-[var(--rashid-color-ff5c8a)] to-[var(--rashid-color-ffb347)]",
                    "from-[var(--rashid-color-4423b8)] to-[var(--rashid-color-6c63ff)]",
                    "from-[var(--rashid-color-ff8a00)] to-[var(--rashid-color-ffd166)]",
                    "from-[var(--rashid-color-2a3556)] to-[var(--rashid-color-7464c8)]",
                    "from-[var(--rashid-color-0e9faa)] to-[var(--rashid-color-b2f06a)]",
                  ];

                  return (
                    <div
                      key={program.id}
                      className="group overflow-hidden rounded-[1.8rem] bg-white shadow-xl transition hover:-translate-y-2"
                    >
                      <Link href={getProgramHref(program)}>
                        <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${fallbackGradients[index % fallbackGradients.length]}`}>
                          {program.image_url ? (
                            <img
                              src={getFileUrl(program.image_url)}
                              alt={program.title}
                              className={`h-full w-full object-cover ${locked ? "opacity-75" : ""}`}
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-7xl">
                              {index % 3 === 0 ? "🏝️" : index % 3 === 1 ? "🏰" : "🚀"}
                            </div>
                          )}

                          {completed && (
                            <div className="absolute left-4 top-4 rounded-full bg-[var(--rashid-color-0e9faa)] px-4 py-2 text-sm font-black text-white shadow-lg">
                              ✅
                            </div>
                          )}

                          {locked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[var(--rashid-color-14224a)]/45 backdrop-blur-[1px]">
                              <div className="rounded-2xl bg-white px-4 py-3 text-center font-black text-[var(--rashid-color-14224a)] shadow-xl">
                                Pro 🔒
                              </div>
                            </div>
                          )}

                          {bestScore !== null && (
                            <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[var(--rashid-color-14224a)] shadow-lg">
                              {bestScore}%
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="mb-3 flex flex-wrap gap-2">
                            {program.categories?.name && (
                              <span className="rounded-full bg-[var(--rashid-color-d9f5ee)] px-3 py-1.5 text-xs font-black text-[var(--rashid-color-0e9faa)]">
                                {program.categories.name}
                              </span>
                            )}

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-black ${
                                program.access_type === "pro"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {program.access_type === "pro" ? "👑 Pro" : "مجاني"}
                            </span>
                          </div>

                          <h3 className="text-2xl font-black text-[var(--rashid-color-14224a)]">
                            {program.title}
                          </h3>

                          {program.description && (
                            <p className="mt-2 line-clamp-2 leading-7 text-[var(--rashid-color-5f5a7b)]">
                              {program.description}
                            </p>
                          )}
                        </div>
                      </Link>

                      <div className="px-5 pb-5">
                        {locked ? (
                          <Link
                            href="/plans"
                            className="block rounded-full bg-[var(--rashid-color-14224a)] px-6 py-3 text-center font-black text-white"
                          >
                            فعّل اشتراكك
                          </Link>
                        ) : (
                          <Link
                            href={`/child/programs/${program.slug}`}
                            className="inline-flex rounded-full bg-[var(--rashid-color-0e9faa)] px-6 py-3 font-black text-white shadow-lg"
                          >
                            {completed ? "إعادة البرنامج" : "ابدأ الآن"}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] bg-white p-12 text-center">
                <h3 className="text-3xl font-black text-[var(--rashid-color-14224a)]">
                  لا توجد برامج منشورة حاليًا
                </h3>
              </div>
            )}

            
          </section>
</div>
      </section>
    </ChildLayout>
  );
}
