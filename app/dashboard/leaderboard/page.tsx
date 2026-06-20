"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParentLayout from "@/components/parent/ParentLayout";

type ChildRow = {
  id: string;
  full_name: string | null;
  gender: string | null;
  age: number | null;
  xp: number | null;
  plan: string | null;
};

function formatDuration(seconds: number) {
  const total = Math.floor(seconds || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);

  if (h > 0) return `${h} ساعة ${m} دقيقة`;
  return `${m} دقيقة`;
}

export default function ParentLeaderboardPage() {
  const router = useRouter();

  const [children, setChildren] = useState<ChildRow[]>([]);
  const [programProgress, setProgramProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"xp" | "completed" | "time">("xp");

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

    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("role", "parent")
      .maybeSingle();

    if (!parentProfile) {
      router.push("/dashboard");
      return;
    }

    const { data: childrenRows, error: childrenError } = await supabase
      .from("profiles")
      .select("id, full_name, gender, age, xp, plan")
      .eq("parent_profile_id", parentProfile.id)
      .eq("role", "child")
      .order("xp", { ascending: false });

    if (childrenError) console.error("children leaderboard error:", childrenError);

    const childIds = (childrenRows || []).map((child) => child.id);
    let progressRows: any[] = [];

    if (childIds.length) {
      const { data, error } = await supabase
        .from("child_program_progress")
        .select("child_profile_id, program_id, elapsed_seconds, completed, updated_at")
        .in("child_profile_id", childIds);

      if (error) console.error("leaderboard progress error:", error);
      progressRows = data || [];
    }

    setChildren((childrenRows as ChildRow[]) || []);
    setProgramProgress(progressRows);
    setLoading(false);
  }

  function childTimeSeconds(childId: string) {
    return programProgress
      .filter((row) => row.child_profile_id === childId)
      .reduce((sum, row) => sum + Number(row.elapsed_seconds || 0), 0);
  }

  function childCompletedPrograms(childId: string) {
    return programProgress.filter(
      (row) => row.child_profile_id === childId && row.completed === true
    ).length;
  }

  const leaderboard = useMemo(() => {
    return children
      .map((child) => ({
        ...child,
        total_time_seconds: childTimeSeconds(child.id),
        completed_programs: childCompletedPrograms(child.id),
      }))
      .sort((a, b) => {
        if (sortBy === "completed") {
          return b.completed_programs - a.completed_programs || (b.xp || 0) - (a.xp || 0);
        }

        if (sortBy === "time") {
          return b.total_time_seconds - a.total_time_seconds || (b.xp || 0) - (a.xp || 0);
        }

        return (b.xp || 0) - (a.xp || 0);
      });
  }, [children, programProgress, sortBy]);

  return (
    <ParentLayout>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0B4D6B] via-[#167A8F] to-[#42BFA8] p-8 text-white shadow-[0_24px_70px_rgba(11,77,107,.22)]">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white/18 px-5 py-2 font-black text-white backdrop-blur">
                لوحة الصدارة
              </div>
              <h1 className="text-4xl font-black md:text-5xl">🏆 ترتيب الأبناء</h1>
              <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-white/80">
                قارن التقدم بين الأطفال حسب XP، البرامج المكتملة، ووقت التعلم.
              </p>
            </div>

            <Link href="/dashboard/children" className="rounded-full bg-white/18 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/25">
              الأبناء
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap gap-3">
          {[
            ["xp", "⚡ حسب XP"],
            ["completed", "✅ حسب البرامج المكتملة"],
            ["time", "⏱️ حسب وقت التعلم"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key as "xp" | "completed" | "time")}
              className={`rounded-full px-5 py-3 font-black shadow-sm transition ${
                sortBy === key
                  ? "bg-[#42BFA8] text-white"
                  : "bg-white text-[#0B4D6B] hover:bg-[#ECFBF7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
          {loading ? (
            <div className="p-10 text-center text-2xl font-black text-[#7048e8]">جاري تحميل الترتيب...</div>
          ) : leaderboard.length ? (
            <div className="space-y-4">
              {leaderboard.map((child, index) => (
                <Link
                  key={child.id}
                  href={`/dashboard/children/${child.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] bg-[#F9FFFD] p-5 transition hover:-translate-y-1 hover:bg-[#F1FFFB]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl font-black ${
                      index === 0 ? "bg-[#FFD54A] text-[#5A3A00]" : index === 1 ? "bg-[#E6EEF3] text-[#0B4D6B]" : index === 2 ? "bg-[#FFE4C2] text-[#B75A00]" : "bg-white text-[#0B4D6B]"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-4xl">{child.gender === "female" ? "👧" : "👦"}</div>
                    <div>
                      <div className="text-xl font-black text-[#0B4D6B]">{child.full_name || "طفل"}</div>
                      <div className="mt-1 text-sm font-bold text-[#667085]">العمر: {child.age || "-"} سنوات</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="font-black text-[#0B4D6B]">⚡ {child.xp || 0}</div>
                      <div className="text-xs font-bold text-[#667085]">XP</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="font-black text-[#0B4D6B]">✅ {child.completed_programs}</div>
                      <div className="text-xs font-bold text-[#667085]">برامج</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="font-black text-[#0B4D6B]">⏱️ {formatDuration(child.total_time_seconds)}</div>
                      <div className="text-xs font-bold text-[#667085]">وقت</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border-2 border-dashed border-[#DDEDEA] p-10 text-center font-black text-[#667085]">
              لا يوجد أبناء لعرض لوحة الصدارة.
            </div>
          )}
        </section>
      </div>
    </ParentLayout>
  );
}
