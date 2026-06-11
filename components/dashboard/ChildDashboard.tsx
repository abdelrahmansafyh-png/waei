"use client";

import { useEffect, useMemo, useState } from "react";
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



export default function ChildDashboard({ profile }: { profile: any }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
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

    setPrograms((programsData as Program[]) || []);
    setAttempts((attemptsData as Attempt[]) || []);
    setLoading(false);
  }

  function isProgramCompleted(programId: string) {
    return attempts.some(
      (attempt) => attempt.program_id === programId && attempt.completed
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
    return attempts.reduce((sum, attempt) => {
      const percentage = attempt.percentage || 0;

      if (percentage >= 90) return sum + 150;
      if (percentage >= 70) return sum + 120;
      if (percentage > 0) return sum + 100;

      return sum;
    }, 0);
  }, [attempts]);

  const displayXp = profile?.xp ?? totalXp;

  const lastAttempt = attempts[0];

  return (
    <ChildLayout profile={profile} activeHref="/dashboard">
      <section className="relative flex-1 px-4 py-5 md:px-8 md:py-7">
        <div className="relative mx-auto max-w-7xl">
          <header className="relative mb-7 overflow-hidden rounded-[2.4rem] bg-white/78 p-6 shadow-[0_22px_60px_rgba(44,62,120,.12)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.9),transparent_18%),radial-gradient(circle_at_65%_55%,rgba(255,214,102,.30),transparent_22%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="hidden text-8xl md:block">🏰</div>
                <div>
                  <p className="text-sm font-black text-[#42BFA8]">👋 أهلاً بعودتك</p>
                  <h1 className="mt-1 text-4xl font-black text-[#211B4C] md:text-6xl">
                    يا {childName}
                  </h1>
                  <p className="mt-3 text-base font-bold text-[#4C4A73] md:text-lg">
                    اختر برنامجك وابدأ رحلة جديدة اليوم.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={proActive ? "/dashboard/subscription" : "/plans"}
                  className="rounded-[1.4rem] bg-[#FFEBA5] px-6 py-4 font-black text-[#8A6200] shadow-lg"
                >
                  {proActive ? "👑 اشتراك Pro" : "🟢 اشتراك Free"}
                </Link>

                <button className="rounded-[1.4rem] bg-[#0B4D6B] px-6 py-4 font-black text-white shadow-lg">
                  🏆 ترتيبي
                </button>
              </div>
            </div>
          </header>

          <section className="relative mb-7 overflow-hidden rounded-[2.4rem] bg-gradient-to-l from-[#5E38D8] to-[#7B4DFF] p-6 text-white shadow-[0_22px_60px_rgba(94,56,216,.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,.20),transparent_14%),radial-gradient(circle_at_88%_65%,rgba(255,214,102,.30),transparent_12%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="rounded-[1.8rem] bg-white px-8 py-5 text-center shadow-2xl">
                <div className="text-sm font-black text-[#6E46E8]">كود الربط</div>
                <div className="mt-2 text-5xl font-black tracking-[0.25em] text-[#0B4D6B]">
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

          {!proActive && (
            <section className="mb-7 rounded-[2.2rem] bg-[#FFF4C7] p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#211B4C]">👑 برامج مميزة بانتظارك</h2>
                  <p className="mt-2 font-bold text-[#8A6200]">
                    بعض البرامج تحتاج اشتراك Pro. يمكنك مشاهدة البرامج، لكن الدخول إلى محتوى Pro يتطلب تفعيل الاشتراك.
                  </p>
                </div>
                <Link
                  href="/plans"
                  className="rounded-full bg-[#0B4D6B] px-7 py-4 font-black text-white shadow-lg"
                >
                  مشاهدة الخطط والاشتراكات
                </Link>
              </div>
            </section>
          )}

          <div className="mb-7 grid gap-5 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#BFE9FF] to-[#EAF7FF] p-6 text-[#1D3772] shadow-xl">
              <div className="absolute left-5 top-5 text-6xl opacity-20">📚</div>
              <div className="relative text-6xl">📖</div>
              <div className="relative mt-4 text-5xl font-black">{programs.length}</div>
              <div className="relative mt-2 font-black">برامج متاحة</div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#DDF8CC] to-[#F2FFE8] p-6 text-[#247B25] shadow-xl">
              <div className="absolute left-5 top-5 text-6xl opacity-20">⭐</div>
              <div className="relative text-6xl">✅</div>
              <div className="relative mt-4 text-5xl font-black">{completedPrograms}</div>
              <div className="relative mt-2 font-black">برامج مكتملة</div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#FFE89D] to-[#FFF7D8] p-6 text-[#B75A00] shadow-xl">
              <div className="absolute left-5 top-5 text-6xl opacity-20">⚡</div>
              <div className="relative text-6xl">⚡</div>
              <div className="relative mt-4 text-5xl font-black">{displayXp}</div>
              <div className="relative mt-2 font-black">XP المكتسب</div>
            </div>
          </div>

          {lastAttempt && (
            <section className="mb-8 overflow-hidden rounded-[2.2rem] bg-white/82 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="hidden text-7xl md:block">🐉</div>
                  <div>
                    <p className="font-black text-[#42BFA8]">آخر نشاط</p>
                    <h2 className="mt-1 text-3xl font-black text-[#211B4C]">
                      نتيجتك الأخيرة: {lastAttempt.score ?? 0} / {lastAttempt.max_score ?? "-"}
                    </h2>
                    <p className="mt-2 font-bold text-[#4C4A73]">
                      استمر، كل محاولة تقرّبك من إنجاز جديد.
                    </p>
                  </div>
                </div>

                <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-3xl font-black text-[#42BFA8] shadow-lg ring-8 ring-[#E7FBF4]">
                  {lastAttempt.percentage ?? 0}%
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[2.4rem] bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
                  برامجي 🗺️
                </div>
                <h2 className="text-4xl font-black text-[#211B4C]">
                  جرّب برامجنا التفاعلية
                </h2>
              </div>

              <Link
                href="/child/programs"
                className="inline-flex items-center gap-3 rounded-full bg-[#7050E8] px-7 py-4 font-black text-white shadow-lg transition hover:-translate-y-1"
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
                    "from-[#42BFA8] to-[#B2F06A]",
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
                            <div className="absolute left-4 top-4 rounded-full bg-[#42BFA8] px-4 py-2 text-sm font-black text-white shadow-lg">
                              ✅
                            </div>
                          )}

                          {locked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#211B4C]/45 backdrop-blur-[1px]">
                              <div className="rounded-2xl bg-white px-4 py-3 text-center font-black text-[#211B4C] shadow-xl">
                                Pro 🔒
                              </div>
                            </div>
                          )}

                          {bestScore !== null && (
                            <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[#211B4C] shadow-lg">
                              {bestScore}%
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="mb-3 flex flex-wrap gap-2">
                            {program.categories?.name && (
                              <span className="rounded-full bg-[#D9F5EE] px-3 py-1.5 text-xs font-black text-[#0B4D6B]">
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

                          <h3 className="text-2xl font-black text-[#211B4C]">
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
                            className="block rounded-full bg-[#211B4C] px-6 py-3 text-center font-black text-white"
                          >
                            فعّل اشتراكك
                          </Link>
                        ) : (
                          <Link
                            href={`/child/programs/${program.slug}`}
                            className="inline-flex rounded-full bg-[#42BFA8] px-6 py-3 font-black text-white shadow-lg"
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
                <h3 className="text-3xl font-black text-[#211B4C]">
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
