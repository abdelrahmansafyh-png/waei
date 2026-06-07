
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParentLayout from "@/components/parent/ParentLayout";

export default function ParentChildrenPage() {
  const router = useRouter();

  const [children, setChildren] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("profile query error:", profileError);
    }

    if (!profileData || profileData.role !== "parent") {
      router.push("/dashboard");
      return;
    }

    const { data: childrenData, error: childrenError } = await supabase
      .from("profiles")
      .select("*")
      .eq("parent_profile_id", profileData.id)
      .eq("role", "child")
      .order("created_at", { ascending: false });

    if (childrenError) {
      console.error("children query error:", childrenError);
    }

    const childIds = (childrenData || []).map((child) => child.id);

    let attemptsData: any[] = [];

    if (childIds.length) {
      const { data, error } = await supabase
        .from("game_attempts")
        .select("*")
        .in("child_profile_id", childIds)
        .eq("completed", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("attempts query error:", error);
      }

      attemptsData = data || [];
    }

    setChildren(childrenData || []);
    setAttempts(attemptsData);
    setLoading(false);
  }

  const totalXp = useMemo(
    () => children.reduce((sum, child) => sum + (child.xp || 0), 0),
    [children]
  );

  const completedPrograms = useMemo(() => {
    const ids = new Set(
      attempts
        .filter((attempt) => attempt.program_id)
        .map((attempt) => `${attempt.child_profile_id}-${attempt.program_id}`)
    );

    return ids.size;
  }, [attempts]);

  function childMinutes(childId: string) {
    return Math.round(
      attempts
        .filter((attempt) => attempt.child_profile_id === childId)
        .reduce((sum, attempt) => sum + (attempt.duration_seconds || 0), 0) / 60
    );
  }

  function childCompletedPrograms(childId: string) {
    const ids = new Set(
      attempts
        .filter((attempt) => attempt.child_profile_id === childId && attempt.program_id)
        .map((attempt) => attempt.program_id)
    );

    return ids.size;
  }

  return (
    <ParentLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-[2.8rem] bg-white/95 p-7 shadow-[0_18px_45px_rgba(62,87,120,.13)]">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
                إدارة الأبناء
              </div>

              <h1 className="text-5xl font-black leading-[1.2] text-[#20294f]">
                أبنائي 👨‍👩‍👧
              </h1>

              <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-[#667085]">
                أضف أبناءك وتابع XP، البرامج المكتملة، ووقت التعلم لكل طفل.
              </p>
            </div>

            <Link
              href="/dashboard/children/new"
              className="rounded-full bg-[#42BFA8] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1"
            >
              + إضافة طفل
            </Link>
          </div>
        </header>

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_45px_rgba(62,87,120,.08)]">
            <div className="text-5xl">👨‍👩‍👧</div>
            <div className="mt-4 text-4xl font-black text-[#0B4D6B]">
              {children.length}
            </div>
            <div className="mt-2 font-bold text-[#6E7A99]">عدد الأبناء</div>
          </div>

          <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_45px_rgba(62,87,120,.08)]">
            <div className="text-5xl">⚡</div>
            <div className="mt-4 text-4xl font-black text-[#0B4D6B]">
              {totalXp}
            </div>
            <div className="mt-2 font-bold text-[#6E7A99]">إجمالي XP</div>
          </div>

          <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_45px_rgba(62,87,120,.08)]">
            <div className="text-5xl">📚</div>
            <div className="mt-4 text-4xl font-black text-[#0B4D6B]">
              {completedPrograms}
            </div>
            <div className="mt-2 font-bold text-[#6E7A99]">برامج مكتملة</div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2.5rem] bg-white/95 p-12 text-center text-2xl font-black text-[#7048e8] shadow-xl">
            جاري تحميل الأبناء...
          </div>
        ) : children.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => {
              const minutes = childMinutes(child.id);
              const completed = childCompletedPrograms(child.id);

              return (
                <Link
                  key={child.id}
                  href={`/dashboard/children/${child.id}`}
                  className="group overflow-hidden rounded-[2.3rem] border border-[#DDEDEA] bg-[#F9FFFD] p-6 shadow-xl shadow-teal-50 transition hover:-translate-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-white text-5xl shadow-sm">
                      {child.gender === "female" ? "👧" : "👦"}
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        child.plan === "pro"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {child.plan === "pro" ? "👑 Pro" : "🟢 Free"}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#0B4D6B]">
                    {child.nickname || child.full_name}
                  </h3>

                  <p className="mt-2 font-bold text-[#6E7A99]">
                    العمر: {child.age || "-"} سنوات
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white p-4 text-center">
                      <div className="font-black text-[#0B4D6B]">
                        ⚡ {child.xp || 0}
                      </div>
                      <div className="mt-1 text-xs font-bold text-[#6E7A99]">
                        XP
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-center">
                      <div className="font-black text-[#0B4D6B]">
                        📚 {completed}
                      </div>
                      <div className="mt-1 text-xs font-bold text-[#6E7A99]">
                        برامج
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-center">
                      <div className="font-black text-[#0B4D6B]">
                        ⏱️ {minutes}
                      </div>
                      <div className="mt-1 text-xs font-bold text-[#6E7A99]">
                        دقيقة
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-full bg-[#0B4D6B] px-6 py-3 text-center font-black text-white transition group-hover:bg-[#42BFA8]">
                    عرض التفاصيل
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-white/95 p-12 text-center">
            <h3 className="text-3xl font-black text-[#0B4D6B]">
              لا يوجد أبناء بعد
            </h3>

            <p className="mt-3 font-bold text-[#6E7A99]">
              ابدأ بإضافة أول طفل لعرض النتائج والتقدم.
            </p>

            <Link
              href="/dashboard/children/new"
              className="mt-6 inline-flex rounded-full bg-[#42BFA8] px-8 py-4 font-black text-white"
            >
              + إضافة طفل
            </Link>
          </div>
        )}
      </div>
    </ParentLayout>
  );
}
