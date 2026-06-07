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
        <section className="relative min-h-screen flex-1 overflow-hidden px-4 py-5 md:px-8 md:py-7">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#42BFA8]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-80 h-72 w-72 rounded-full bg-[#D8F36A]/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[2.5rem] border border-[#E6F1EE] bg-white p-5 shadow-[0_14px_40px_rgba(15,35,55,0.05)]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#ECFBF7] text-4xl lg:hidden">
                  {childIcon}
                </div>

                <div>
                  <p className="text-sm font-black text-[#42BFA8]">
                    🌞 أهلاً بعودتك
                  </p>

                  <h1 className="mt-1 text-3xl font-black md:text-4xl">
                    يا {childName}
                  </h1>

                  <p className="mt-2 text-sm font-bold text-[#6E7A99] md:text-base">
                    اختر برنامجك وابدأ رحلة جديدة اليوم.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={proActive ? "/dashboard/subscription" : "/plans"}
                  className={`rounded-2xl px-5 py-3 font-black shadow-sm ${
                    proActive
                      ? "bg-[#FFF8D9] text-[#8A6A00]"
                      : "bg-[#ECFBF7] text-[#0B4D6B]"
                  }`}
                >
                  {proActive ? "👑 اشتراك Pro" : "🟢 اشتراك Free"}
                </Link>

                <button className="rounded-2xl bg-[#0B4D6B] px-5 py-3 font-black text-white shadow-lg">
                  🏆 ترتيبي
                </button>
              </div>
            </header>

            <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-[#DDEDEA] bg-gradient-to-br from-[#7048e8] to-[#8b5cf6] p-6 text-white shadow-[0_18px_45px_rgba(112,72,232,.22)]">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black">
                    🔗 ربط ولي الأمر
                  </div>

                  <h2 className="text-3xl font-black">
                    شارك هذا الكود مع ولي أمرك
                  </h2>

                  <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/80">
                    يمكن لولي الأمر إدخال هذا الكود لربط حسابك ومتابعة تقدمك وبرامجك.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="rounded-[2rem] bg-white px-8 py-5 text-center shadow-2xl">
                    <div className="text-sm font-black text-[#7048e8]">
                      كود الربط
                    </div>

                    <div className="mt-2 text-4xl font-black tracking-[0.25em] text-[#0B4D6B]">
                      {localAccessCode || "------"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyAccessCode}
                    className="mt-4 rounded-full bg-white/15 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/25"
                  >
                    نسخ الكود
                  </button>
                </div>
              </div>
            </section>

            {!proActive && (
              <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-[#F4E7A2] bg-gradient-to-l from-[#FFF8D9] to-[#FFFDF0] p-6 shadow-[0_16px_40px_rgba(216,180,60,0.12)]">
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <div className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#8A6A00]">
                      👑 برامج مميزة بانتظارك
                    </div>

                    <h2 className="text-3xl font-black text-[#0B4D6B]">
                      فعّل اشتراكك للوصول إلى برامج Pro
                    </h2>

                    <p className="mt-3 max-w-2xl font-bold leading-8 text-[#7A6B22]">
                      بعض البرامج تحتاج اشتراك Pro. يمكنك مشاهدة البرامج، لكن الدخول
                      إلى محتوى Pro يتطلب تفعيل الاشتراك.
                    </p>
                  </div>

                  <Link
                    href="/plans"
                    className="rounded-full bg-[#0B4D6B] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1"
                  >
                    مشاهدة الخطط والاشتراكات
                  </Link>
                </div>
              </section>
            )}

            <div className="grid gap-5 md:grid-cols-3">
              <div className="relative overflow-hidden rounded-[2rem] bg-[#0B4D6B] p-6 text-white shadow-[0_18px_40px_rgba(11,77,107,0.16)]">
                <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

                <div className="relative">
                  <div className="text-5xl">📚</div>

                  <div className="mt-5 text-4xl font-black">
                    {programs.length}
                  </div>

                  <div className="mt-2 font-bold text-white/70">
                    برامج متاحة
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-[#42BFA8] p-6 text-white shadow-[0_18px_40px_rgba(66,191,168,0.22)]">
                <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-white/15" />

                <div className="relative">
                  <div className="text-5xl">✅</div>

                  <div className="mt-5 text-4xl font-black">
                    {completedPrograms}
                  </div>

                  <div className="mt-2 font-bold text-white/80">
                    برامج مكتملة
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-[#FFF8D9] p-6 text-[#0B4D6B] shadow-[0_18px_40px_rgba(216,243,106,0.18)]">
                <div className="absolute left-5 top-5 text-7xl opacity-10">
                  ⚡
                </div>

                <div className="relative">
                  <div className="text-5xl">⚡</div>

                  <div className="mt-5 text-4xl font-black">
                    {displayXp}
                  </div>

                  <div className="mt-2 font-bold text-[#7A6B22]">
                    XP المكتسب
                  </div>
                </div>
              </div>
            </div>

            {lastAttempt && (
              <section className="mt-6 rounded-[2.5rem] border border-[#E6F1EE] bg-[#F9FFFD] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-[#42BFA8]">آخر نشاط</p>

                    <h2 className="mt-1 text-2xl font-black">
                      نتيجتك الأخيرة: {lastAttempt.score ?? 0} /{" "}
                      {lastAttempt.max_score ?? "-"}
                    </h2>

                    <p className="mt-2 font-bold text-[#6E7A99]">
                      استمر، كل محاولة تقرّبك من إنجاز جديد.
                    </p>
                  </div>

                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-black text-[#42BFA8] shadow-sm">
                    {lastAttempt.percentage ?? 0}%
                  </div>
                </div>
              </section>
            )}

            <section className="mt-10">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
                    برامج واعي
                  </div>

                  <h2 className="text-4xl font-black text-[#0B4D6B]">
                    جرّب برامجنا التفاعلية
                  </h2>
                </div>

                <Link
                  href="/child/programs"
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-[#0B4D6B] shadow-[0_8px_25px_rgba(0,0,0,0.05)] ring-1 ring-[#E6F1EE] transition-all duration-300 hover:-translate-y-1 hover:bg-[#42BFA8] hover:text-white"
                >
                  <span className="text-base font-black">
                    عرض كل البرامج
                  </span>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4FAF8] text-[#42BFA8] transition-all duration-300 group-hover:bg-white">
                    ←
                  </div>
                </Link>
              </div>

              {loading ? (
                <div className="rounded-[2.5rem] border border-[#E6F1EE] bg-white p-12 text-center font-black text-[#6E7A99]">
                  جاري تحميل البرامج...
                </div>
              ) : programs.length > 0 ? (
                <div
                  className={`grid gap-6 ${
                    programs.length === 1
                      ? "mx-auto max-w-[420px]"
                      : programs.length === 2
                      ? "mx-auto max-w-4xl md:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {programs.slice(0, 6).map((program) => {
                    const completed = isProgramCompleted(program.id);
                    const bestScore = getProgramBestScore(program.id);
                    const locked = program.access_type === "pro" && !proActive;

                    return (
                      <div
                        key={program.id}
                        className="group overflow-hidden rounded-[2rem] border border-[#DDEDEA] bg-[#F9FFFD] shadow-xl shadow-teal-50 transition hover:-translate-y-2"
                      >
                        <Link href={getProgramHref(program)}>
                          <div className="relative">
                            {program.image_url ? (
                              <img
                                src={getFileUrl(program.image_url)}
                                alt={program.title}
                                className={`h-44 w-full object-cover ${
                                  locked ? "opacity-75" : ""
                                }`}
                              />
                            ) : (
                              <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#42BFA8] to-[#D8F36A] text-7xl">
                                🧠
                              </div>
                            )}

                            {completed && (
                              <div className="absolute left-4 top-4 rounded-full bg-[#42BFA8] px-4 py-2 text-sm font-black text-white shadow-lg">
                                تم الانتهاء ✅
                              </div>
                            )}

                            {locked && (
                              <div className="absolute left-4 top-4 rounded-full bg-[#0B4D6B] px-4 py-2 text-sm font-black text-white shadow-lg">
                                Pro 🔒
                              </div>
                            )}

                            {bestScore !== null && (
                              <div className="absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[#0B4D6B] shadow-lg">
                                أفضل نتيجة {bestScore}%
                              </div>
                            )}

                            {locked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-[#0B4D6B]/35 backdrop-blur-[1px]">
                                <div className="rounded-2xl bg-white px-5 py-3 text-center font-black text-[#0B4D6B] shadow-xl">
                                  فعّل اشتراكك للدخول
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-6">
                            <div className="mb-4 flex flex-wrap gap-2">
                              {program.categories?.name && (
                                <span className="rounded-full bg-[#D9F5EE] px-4 py-2 text-sm font-black text-[#0B4D6B]">
                                  {program.categories.name}
                                </span>
                              )}

                              <span
                                className={`rounded-full px-4 py-2 text-sm font-black ${
                                  program.access_type === "pro"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {program.access_type === "pro"
                                  ? "👑 Pro"
                                  : "🟢 مجاني"}
                              </span>
                            </div>

                            <h3 className="text-2xl font-black text-[#0B4D6B]">
                              {program.title}
                            </h3>

                            {program.description && (
                              <p className="mt-3 line-clamp-2 leading-7 text-[#6E7A99]">
                                {program.description}
                              </p>
                            )}
                          </div>
                        </Link>

                        <div className="px-6 pb-6">
                          {locked ? (
                            <Link
                              href="/plans"
                              className="block rounded-full bg-[#0B4D6B] px-6 py-3 text-center font-black text-white transition hover:-translate-y-1"
                            >
                              فعّل اشتراكك
                            </Link>
                          ) : (
                            <Link
                              href={`/child/programs/${program.slug}`}
                              className="inline-flex rounded-full bg-[#42BFA8] px-6 py-3 font-black text-white transition group-hover:bg-[#0B4D6B]"
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
                <div className="rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-[#F9FFFD] p-12 text-center">
                  <h3 className="text-3xl font-black text-[#0B4D6B]">
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
