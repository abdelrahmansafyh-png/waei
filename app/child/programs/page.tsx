"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  is_published: boolean;
  sort_order: number;
  categories?: { name: string } | null;
};

type Attempt = {
  id: string;
  program_id: string | null;
  completed: boolean;
  percentage: number | null;
  created_at: string;
};



export default function ChildProgramsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  const proActive = isProActive(profile);
  const childName = getChildName(profile);
  const childAvatar = getChildAvatar(profile);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
      .maybeSingle();

    if (!profileData) {
      router.push("/login");
      return;
    }

    setProfile(profileData);

    const { data: programsData } = await supabase
      .from("programs")
      .select("*, categories(name)")
      .eq("is_published", true)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .order("sort_order", { ascending: true });

    const { data: attemptsData } = await supabase
      .from("game_attempts")
      .select("id,program_id,completed,percentage,created_at")
      .eq("child_profile_id", profileData.id)
      .eq("completed", true)
      .order("created_at", { ascending: false });

    setPrograms((programsData as Program[]) || []);
    setAttempts((attemptsData as Attempt[]) || []);
    setLoading(false);
  }

  function isProgramCompleted(programId: string) {
    return attempts.some((a) => a.program_id === programId && a.completed);
  }

  function getBestScore(programId: string) {
    const scores = attempts
      .filter((a) => a.program_id === programId)
      .map((a) => a.percentage || 0)
      .filter((v) => v > 0);

    if (!scores.length) return null;
    return Math.max(...scores);
  }

  const completedCount = useMemo(
    () => programs.filter((p) => isProgramCompleted(p.id)).length,
    [programs, attempts]
  );

  return (
    <ChildLayout profile={profile} activeHref="/child/programs">
        <section
          className="min-h-screen flex-1 bg-cover bg-fixed bg-center px-4 py-6 md:px-8"
          
        >
          <div className="mx-auto max-w-7xl">
            <header className="mb-8 rounded-[2.8rem] border border-white/40 bg-white/88 p-7 shadow-[0_22px_70px_rgba(62,87,120,.18)] backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
                    برامج واعي 🗺️
                  </div>

                  <h1 className="text-5xl font-black leading-[1.2] text-[#20294f]">
                    اختر برنامجك التفاعلي 🌱
                  </h1>

                  <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-[#667085]">
                    ابدأ من أي برنامج، وكل برنامج تنهيه سيتم تسجيله في إنجازاتك.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-[30px] bg-[#F9FFFD] px-5 py-4 shadow-sm">
                  <div className="text-4xl">{childAvatar}</div>
                  <div>
                    <div className="text-xl font-black">{childName}</div>
                    <div className="font-black text-[#f5a800]">
                      ✅ {completedCount} مكتملة
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {!proActive && (
              <section className="mb-8 rounded-[2.5rem] border border-[#F4E7A2] bg-[#FFF8D9]/95 p-6 shadow-[0_16px_40px_rgba(216,180,60,0.12)]">
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <h2 className="text-3xl font-black text-[#0B4D6B]">
                      فعّل اشتراكك للوصول إلى برامج Pro 👑
                    </h2>
                    <p className="mt-3 max-w-2xl font-bold leading-8 text-[#7A6B22]">
                      البرامج المجانية متاحة الآن، أما برامج Pro تحتاج تفعيل الاشتراك.
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

            {loading ? (
              <div className="rounded-[2.5rem] bg-white p-12 text-center text-2xl font-black text-[#7048e8] shadow-xl">
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
                {programs.map((program) => {
                  const completed = isProgramCompleted(program.id);
                  const bestScore = getBestScore(program.id);
                  const locked = program.access_type === "pro" && !proActive;

                  return (
                    <div
                      key={program.id}
                      className="group overflow-hidden rounded-[2rem] border border-white/55 bg-white/92 shadow-xl transition hover:-translate-y-2"
                    >
                      <Link href={locked ? "/plans" : `/child/programs/${program.slug}`}>
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
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0B4D6B]/35 backdrop-blur-[1px]">
                              <div className="rounded-2xl bg-white px-5 py-3 text-center font-black text-[#0B4D6B] shadow-xl">
                                فعّل اشتراكك للدخول 🔒
                              </div>
                            </div>
                          )}

                          {bestScore !== null && (
                            <div className="absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[#0B4D6B] shadow-lg">
                              أفضل نتيجة {bestScore}%
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

                            {program.age_range && (
                              <span className="rounded-full bg-[#F3EFFF] px-4 py-2 text-sm font-black text-[#7048e8]">
                                عمر {program.age_range}
                              </span>
                            )}

                            <span
                              className={`rounded-full px-4 py-2 text-sm font-black ${
                                program.access_type === "pro"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {program.access_type === "pro" ? "👑 Pro" : "🟢 مجاني"}
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
              <div className="rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-white/95 p-12 text-center">
                <h3 className="text-3xl font-black text-[#0B4D6B]">
                  لا توجد برامج منشورة حاليًا
                </h3>
              </div>
            )}
          </div>
        </section>
    </ChildLayout>
  );
}
