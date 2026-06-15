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



export default function ChildDashboard({ profile }: { profile: any }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [progressItems, setProgressItems] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [localAccessCode, setLocalAccessCode] = useState(profile?.access_code || "");

  const childName = getChildName(profile);
  const childIcon = getChildAvatar(profile);
  const proActive = isProActive(profile);

  useEffect(() => {
    loadData();
    ensureAccessCode();
  }, []);

  async function ensureAccessCode() {
    if (profile?.access_code) {
      setLocalAccessCode(profile.access_code);
      return;
    }

    const generatedCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    setLocalAccessCode(generatedCode);

    await supabase
      .from("profiles")
      .update({ access_code: generatedCode })
      .eq("id", profile.id);
  }

  async function copyAccessCode() {
    if (!localAccessCode) return;

    await navigator.clipboard.writeText(localAccessCode);
    alert("تم نسخ كود الربط ✅");
  }

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

    setPrograms((programsData as Program[]) || []);
    setAttempts((attemptsData as Attempt[]) || []);
    setProgressItems((progressData as ChildProgress[]) || []);
    setLoading(false);
  }

  function isProgramCompleted(programId: string) {
    // مهم: إكمال لعبة واحدة لا يعني أن البرنامج كامل.
    // البرنامج يعتبر مكتمل فقط من Attempt خاص بزر "إنهاء البرنامج" ويكون content_id = null.
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

    return `/child/programs/${program.slug}`;
  }

  const completedPrograms = useMemo(
    () => programs.filter((program) => isProgramCompleted(program.id)).length,
    [programs, attempts]
  );

  const totalXp = useMemo(() => {
    return progressItems.reduce((sum, item) => sum + (item.xp_awarded ? item.xp_earned || 0 : 0), 0);
  }, [progressItems]);

  const displayXp = profile?.xp ?? totalXp;

  const lastAttempt = attempts[0];

  const lastIncompleteProgress = useMemo(() => {
    return progressItems.find((item) => !isProgramCompleted(item.program_id));
  }, [progressItems, attempts]);

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
                  <p className="text-sm font-black text-[#0E9FAA]">👋 أهلاً بعودتك</p>
                  <h1 className="mt-1 text-3xl font-black text-[#14224A] md:text-6xl">
                    يا {childName}
                  </h1>
                  <p className="mt-2 text-sm font-bold text-[#566681] md:mt-3 md:text-lg">
                    اختر برنامجك وابدأ رحلة جديدة اليوم.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={proActive ? "/dashboard/subscription" : "/plans"}
                  className="rounded-[1.2rem] bg-[#FFEBA5] px-4 py-3 text-sm font-black text-[#8A6200] shadow-lg md:rounded-[1.4rem] md:px-6 md:py-4 md:text-base"
                >
                  {proActive ? "👑 اشتراك Pro" : "🟢 اشتراك Free"}
                </Link>

                <button className="rounded-[1.2rem] bg-[#0E9FAA] px-4 py-3 text-sm font-black text-white shadow-lg md:rounded-[1.4rem] md:px-6 md:py-4 md:text-base">
                  🏆 ترتيبي
                </button>

                <Link
                  href={continueHref}
                  className="rounded-[1.2rem] bg-[#7050E8] px-4 py-3 text-sm font-black text-white shadow-lg md:rounded-[1.4rem] md:px-6 md:py-4 md:text-base"
                >
                  🚀 {continueLabel}
                </Link>
              </div>
            </div>
          </header>

  

          {!proActive && (
            <section className="mb-7 rounded-[2.4rem] bg-[#FFF4C7] p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#14224A]">👑 برامج مميزة بانتظارك</h2>
                  <p className="mt-2 font-bold text-[#8A6200]">
                    بعض البرامج تحتاج اشتراك Pro. يمكنك مشاهدة البرامج، لكن الدخول إلى محتوى Pro يتطلب تفعيل الاشتراك.
                  </p>
                </div>
                <Link
                  href="/plans"
                  className="rounded-full bg-[#0E9FAA] px-7 py-4 font-black text-white shadow-lg"
                >
                  مشاهدة الخطط والاشتراكات
                </Link>
              </div>
            </section>
          )}

          <div className="mb-4 grid grid-cols-3 gap-2 md:mb-7 md:gap-5">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#BFE9FF] to-[#EAF7FF] p-3 text-center text-[#1D3772] shadow-lg md:rounded-[2rem] md:p-6 md:text-start md:shadow-xl">
              <div className="absolute left-3 top-3 text-3xl opacity-20 md:left-5 md:top-5 md:text-6xl">📚</div>
              <div className="relative text-3xl md:text-6xl">📖</div>
              <div className="relative mt-2 text-3xl font-black md:mt-4 md:text-5xl">{programs.length}</div>
              <div className="relative mt-1 text-xs font-black leading-5 md:mt-2 md:text-base">برامج متاحة</div>
            </div>

            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#DDF8CC] to-[#F2FFE8] p-3 text-center text-[#247B25] shadow-lg md:rounded-[2rem] md:p-6 md:text-start md:shadow-xl">
              <div className="absolute left-3 top-3 text-3xl opacity-20 md:left-5 md:top-5 md:text-6xl">⭐</div>
              <div className="relative text-3xl md:text-6xl">✅</div>
              <div className="relative mt-2 text-3xl font-black md:mt-4 md:text-5xl">{completedPrograms}</div>
              <div className="relative mt-1 text-xs font-black leading-5 md:mt-2 md:text-base">برامج مكتملة</div>
            </div>

            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#FFE89D] to-[#FFF7D8] p-3 text-center text-[#B75A00] shadow-lg md:rounded-[2rem] md:p-6 md:text-start md:shadow-xl">
              <div className="absolute left-3 top-3 text-3xl opacity-20 md:left-5 md:top-5 md:text-6xl">⚡</div>
              <div className="relative text-3xl md:text-6xl">⚡</div>
              <div className="relative mt-2 text-3xl font-black md:mt-4 md:text-5xl">{displayXp}</div>
              <div className="relative mt-1 text-xs font-black leading-5 md:mt-2 md:text-base">XP المكتسب</div>
            </div>
          </div>

          <section className="mb-6 overflow-hidden rounded-[1.8rem] bg-white/90 p-4 shadow-lg backdrop-blur md:rounded-[2.2rem] md:p-5 md:shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-black text-[#0E9FAA]">رحلتك القادمة</p>
                <h2 className="mt-1 text-2xl font-black text-[#14224A] md:text-3xl">
                  {resumeProgram ? resumeProgram.title : nextProgram ? nextProgram.title : "كل البرامج جاهزة"}
                </h2>
                <p className="mt-1 text-sm font-bold text-[#566681]">
                  {resumeProgram ? "ارجع لنفس المكان الذي وصلت له." : nextProgram ? "ابدأ البرنامج التالي في رحلتك." : "استكشف البرامج أو أعد اللعب لتحسين نتيجتك."}
                </p>
              </div>

              <Link
                href={continueHref}
                className="rounded-full bg-[#7050E8] px-7 py-4 font-black text-white shadow-lg"
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
                    <p className="font-black text-[#0E9FAA]">آخر نشاط</p>
                    <h2 className="mt-1 text-3xl font-black text-[#14224A]">
                      نتيجتك الأخيرة: {lastAttempt.score ?? 0} / {lastAttempt.max_score ?? "-"}
                    </h2>
                    <p className="mt-2 font-bold text-[#566681]">
                      استمر، كل محاولة تقرّبك من إنجاز جديد.
                    </p>
                  </div>
                </div>

                <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-3xl font-black text-[#0E9FAA] shadow-lg ring-8 ring-[#E7FBF4]">
                  {lastAttempt.percentage ?? 0}%
                </div>
              </div>
            </section>
          )}
          

          <section className="rounded-[1.8rem] bg-white/82 p-4 shadow-lg backdrop-blur md:rounded-[2.6rem] md:p-6 md:shadow-xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#0E9FAA]">
                  برامجي 🗺️
                </div>
                <h2 className="text-2xl font-black text-[#14224A] md:text-4xl">
                  جرّب برامجنا التفاعلية
                </h2>
              </div>

              <Link
                href="/child/programs"
                className="inline-flex items-center gap-2 rounded-full bg-[#7050E8] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 md:gap-3 md:px-7 md:py-4 md:text-base"
              >
                عرض كل البرامج
              </Link>
            </div>
            

            {loading ? (
              <div className="rounded-[2rem] bg-white p-12 text-center font-black text-[#6E7A99]">
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
                    "from-[#22C7A9] to-[#4DA3FF]",
                    "from-[#FF5C8A] to-[#FFB347]",
                    "from-[#4423B8] to-[#6C63FF]",
                    "from-[#FF8A00] to-[#FFD166]",
                    "from-[#2A3556] to-[#7464C8]",
                    "from-[#0E9FAA] to-[#B2F06A]",
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
                            <div className="absolute left-4 top-4 rounded-full bg-[#0E9FAA] px-4 py-2 text-sm font-black text-white shadow-lg">
                              ✅
                            </div>
                          )}

                          {locked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#14224A]/45 backdrop-blur-[1px]">
                              <div className="rounded-2xl bg-white px-4 py-3 text-center font-black text-[#14224A] shadow-xl">
                                Pro 🔒
                              </div>
                            </div>
                          )}

                          {bestScore !== null && (
                            <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[#14224A] shadow-lg">
                              {bestScore}%
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="mb-3 flex flex-wrap gap-2">
                            {program.categories?.name && (
                              <span className="rounded-full bg-[#D9F5EE] px-3 py-1.5 text-xs font-black text-[#0E9FAA]">
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

                          <h3 className="text-2xl font-black text-[#14224A]">
                            {program.title}
                          </h3>

                          {program.description && (
                            <p className="mt-2 line-clamp-2 leading-7 text-[#5F5A7B]">
                              {program.description}
                            </p>
                          )}
                        </div>
                      </Link>

                      <div className="px-5 pb-5">
                        {locked ? (
                          <Link
                            href="/plans"
                            className="block rounded-full bg-[#14224A] px-6 py-3 text-center font-black text-white"
                          >
                            فعّل اشتراكك
                          </Link>
                        ) : (
                          <Link
                            href={`/child/programs/${program.slug}`}
                            className="inline-flex rounded-full bg-[#0E9FAA] px-6 py-3 font-black text-white shadow-lg"
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
              <div className="rounded-[2rem] border-2 border-dashed border-[#DDEDEA] bg-white p-12 text-center">
                <h3 className="text-3xl font-black text-[#14224A]">
                  لا توجد برامج منشورة حاليًا
                </h3>
              </div>
            )}

            
          </section>

          <section className="relative mt-6 mb-1 overflow-hidden rounded-[2.6rem] bg-gradient-to-l from-[#5E38D8] to-[#7B4DFF] p-6 text-white shadow-[0_22px_60px_rgba(94,56,216,.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,.20),transparent_14%),radial-gradient(circle_at_88%_65%,rgba(255,214,102,.30),transparent_12%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="rounded-[1.8rem] bg-white px-8 py-5 text-center shadow-2xl">
                <div className="text-sm font-black text-[#6E46E8]">كود الربط</div>
                <div className="mt-2 text-5xl font-black tracking-[0.25em] text-[#0E9FAA]">
                  {localAccessCode || "------"}
                </div>
                <button
                  type="button"
                  onClick={copyAccessCode}
                  className="mt-4 rounded-full bg-[#6E46E8]/15 px-6 py-3 text-sm font-black text-[#6E46E8]"
                >
                  نسخ الكود
                </button>
              </div>

              <div className="max-w-2xl">
                <div className="mb-3 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black">
                  🔗 ربط ولي الأمر
                </div>
                <h2 className="text-3xl font-black md:text-4xl">
                  شارك هذا الكود مع ولي أمرك
                </h2>
                <p className="mt-3 text-sm font-bold leading-7 text-white/85">
                  يمكن لولي الأمر إدخال هذا الكود لربط حسابك ومتابعة تقدمك وبرامجك.
                </p>
              </div>

              <div className="hidden text-7xl md:block">⭐</div>
            </div>
          </section>
        </div>
      </section>
    </ChildLayout>
  );
}
