"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ParentLayout from "./ParentLayout";

type ChildProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  access_code: string | null;
  age: number | null;
  gender: string | null;
  plan: string | null;
  xp: number | null;
  created_at: string | null;
};

type ProgramSummary = {
  id: string;
  title: string;
  slug: string | null;
};

type ContentSummary = {
  id: string;
  title: string | null;
  content_type: string | null;
};

export default function ParentDashboard({ profile }: { profile: any }) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [programProgress, setProgramProgress] = useState<any[]>([]);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [attemptContents, setAttemptContents] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: childrenData, error: childrenError } = await supabase
      .from("profiles")
      .select("id, full_name, username, access_code, age, gender, plan, xp, created_at")
      .eq("parent_profile_id", profile.id)
      .eq("role", "child")
      .order("created_at", { ascending: false });

    if (childrenError) console.error("children query error:", childrenError);

    const childIds = (childrenData || []).map((child) => child.id);
    let attemptsData: any[] = [];
    let progressData: any[] = [];

    if (childIds.length) {
      const { data: attemptsRows, error: attemptsError } = await supabase
        .from("game_attempts")
        .select("*")
        .in("child_profile_id", childIds)
        .eq("completed", true)
        .order("created_at", { ascending: false });

      if (attemptsError) console.error("attempts query error:", attemptsError);
      attemptsData = attemptsRows || [];

      const { data: progressRows, error: progressError } = await supabase
        .from("child_program_progress")
        .select("*")
        .in("child_profile_id", childIds)
        .order("updated_at", { ascending: false });

      if (progressError) console.error("program progress query error:", progressError);
      progressData = progressRows || [];
    }

    const programIds = Array.from(
      new Set(
        [...attemptsData, ...progressData]
          .map((row) => row.program_id)
          .filter(Boolean)
      )
    );

    let programsData: ProgramSummary[] = [];
    let contentsData: ContentSummary[] = [];

    const contentIds = Array.from(
      new Set(attemptsData.map((row) => row.content_id).filter(Boolean))
    );

    if (contentIds.length) {
      const { data: contentRows, error: contentError } = await supabase
        .from("tab_contents")
        .select("id, title, content_type")
        .in("id", contentIds);

      if (contentError) console.error("attempt contents query error:", contentError);
      contentsData = (contentRows as ContentSummary[]) || [];
    }

    if (programIds.length) {
      const { data: programRows, error: programsError } = await supabase
        .from("programs")
        .select("id, title, slug")
        .in("id", programIds);

      if (programsError) console.error("programs query error:", programsError);
      programsData = (programRows as ProgramSummary[]) || [];
    }

    setChildren(childrenData || []);
    setAttempts(attemptsData);
    setProgramProgress(progressData);
    setPrograms(programsData);
    setAttemptContents(contentsData);
    setLoading(false);
  }

  const totalXp = useMemo(
    () => children.reduce((sum, child) => sum + (child.xp || 0), 0),
    [children]
  );

  const completedPrograms = useMemo(() => {
    const keys = new Set<string>();

    programProgress.forEach((row) => {
      if (row.completed === true && row.child_profile_id && row.program_id) {
        keys.add(`${row.child_profile_id}:${row.program_id}`);
      }
    });

    attempts.forEach((attempt) => {
      if (
        attempt.child_profile_id &&
        attempt.program_id &&
        attempt.completed &&
        attempt.content_id === null &&
        (attempt.percentage || 0) >= 100
      ) {
        keys.add(`${attempt.child_profile_id}:${attempt.program_id}`);
      }
    });

    return keys.size;
  }, [programProgress, attempts]);

  function formatDuration(seconds: number) {
    const total = Math.floor(seconds || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);

    if (h > 0) return `${h} ساعة ${m} دقيقة`;
    return `${m} دقيقة`;
  }


  const totalLearningTime = useMemo(
    () => formatDuration(programProgress.reduce((sum, row) => sum + (row.elapsed_seconds || 0), 0)),
    [programProgress]
  );

  const trackedContentTypes = ["game", "zip_game", "iframe", "interactive_story", "interactive_stories", "story"];

  function getAttemptContent(attempt: any) {
    return attemptContents.find((item) => item.id === attempt.content_id);
  }

  function isTrackedAttempt(attempt: any) {
    if (!attempt.content_id) return false;

    const content = getAttemptContent(attempt);
    if (!content) {
      return (attempt.max_score || 0) > 0 || (attempt.percentage || 0) > 0;
    }
    return trackedContentTypes.includes(String(content.content_type || ""));
  }

  const recentAttempts = attempts.filter(isTrackedAttempt).slice(0, 4);

  function getChildTime(childId: string) {
    const seconds = programProgress
      .filter((row) => row.child_profile_id === childId)
      .reduce((sum, row) => sum + (row.elapsed_seconds || 0), 0);

    return formatDuration(seconds);
  }

  function getChildCompletedPrograms(childId: string) {
    const programIds = new Set<string>();

    programProgress.forEach((row) => {
      if (row.child_profile_id === childId && row.completed === true && row.program_id) {
        programIds.add(row.program_id);
      }
    });

    attempts.forEach((attempt) => {
      if (
        attempt.child_profile_id === childId &&
        attempt.program_id &&
        attempt.completed &&
        attempt.content_id === null &&
        (attempt.percentage || 0) >= 100
      ) {
        programIds.add(attempt.program_id);
      }
    });

    return programIds.size;
  }

  function getChildName(childId: string) {
    const child = children.find((item) => item.id === childId);
    return child?.full_name || "طفل";
  }

  function getProgramTitle(programId: string | null) {
    if (!programId) return "برنامج غير محدد";
    const program = programs.find((item) => item.id === programId);
    return program?.title || "برنامج غير محدد";
  }

  function getAttemptTitle(attempt: any) {
    const content = getAttemptContent(attempt);
    return content?.title || "نشاط تفاعلي";
  }

  function getAttemptTypeLabel(attempt: any) {
    const type = String(getAttemptContent(attempt)?.content_type || "");
    if (type === "interactive_story" || type === "interactive_stories" || type === "story") return "قصة تفاعلية";
    if (type === "iframe") return "نشاط";
    return "لعبة تعليمية";
  }

  function getProgramTimeFor(childId: string, programId: string | null) {
    if (!programId) return "0 دقيقة";
    const row = programProgress.find(
      (item) => item.child_profile_id === childId && item.program_id === programId
    );
    return formatDuration(row?.elapsed_seconds || 0);
  }

  const recentAchievements = useMemo(() => {
    const rows = new Map<string, any>();

    programProgress.forEach((row) => {
      if (row.completed === true && row.child_profile_id && row.program_id) {
        rows.set(`${row.child_profile_id}:${row.program_id}`, {
          child_profile_id: row.child_profile_id,
          program_id: row.program_id,
          updated_at: row.updated_at,
        });
      }
    });

    attempts.forEach((attempt) => {
      if (
        attempt.child_profile_id &&
        attempt.program_id &&
        attempt.completed &&
        attempt.content_id === null &&
        (attempt.percentage || 0) >= 100
      ) {
        const key = `${attempt.child_profile_id}:${attempt.program_id}`;
        const current = rows.get(key);
        const currentTime = current?.updated_at ? new Date(current.updated_at).getTime() : 0;
        const attemptTime = attempt.created_at ? new Date(attempt.created_at).getTime() : 0;

        if (!current || attemptTime > currentTime) {
          rows.set(key, {
            child_profile_id: attempt.child_profile_id,
            program_id: attempt.program_id,
            updated_at: attempt.created_at,
          });
        }
      }
    });

    return Array.from(rows.values())
      .sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [programProgress, attempts]);

  return (
    <ParentLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0B4D6B] via-[#167A8F] to-[#42BFA8] p-7 text-white shadow-[0_24px_70px_rgba(11,77,107,.22)] md:p-9">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-[#FFD54A]/25 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-white/18 px-5 py-2 font-black text-white backdrop-blur">
                لوحة ولي الأمر 👨‍👩‍👧
              </div>
              <h1 className="text-4xl font-black leading-[1.25] md:text-5xl">
                أهلاً {profile.full_name || "بك"} 👋
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-white/82">
                من هنا تضيف أبناءك، تعطيهم بيانات الدخول، وتتابع التقدم والـ XP والوقت داخل برامج راشد.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/children/new" className="rounded-full bg-[#FFD54A] px-7 py-4 font-black text-[#14224A] shadow-xl transition hover:-translate-y-1">
                + إضافة طفل
              </Link>
              <Link href="/child-login" className="rounded-full bg-white/18 px-7 py-4 font-black text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/25">
                دخول الطفل
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-4">
          {[
            ["👦", "الأبناء", children.length, "طفل مسجل"],
            ["⚡", "إجمالي XP", totalXp, "نقاط مكتسبة"],
            ["✅", "برامج مكتملة", completedPrograms, "إنجازات"],
            ["⏱️", "وقت التعلم", totalLearningTime, "وقت التعلم"],
          ].map(([icon, title, value, label]) => (
            <div key={String(title)} className="rounded-[2rem] border border-[#E7F0F7] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5FBFF] text-3xl">{icon}</div>
                <div className="rounded-full bg-[#E8F8F3] px-3 py-1 text-xs font-black text-[#42BFA8]">{label}</div>
              </div>
              <div className="mt-5 text-4xl font-black text-[#0B4D6B]">{String(value)}</div>
              <div className="mt-2 font-black text-[#667085]">{title}</div>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">الأبناء</div>
              <h2 className="text-4xl font-black text-[#0B4D6B]">إدارة أبناءك</h2>
            </div>
            <Link href="/dashboard/children" className="rounded-full bg-white px-6 py-3 font-black text-[#0B4D6B] shadow-lg transition hover:-translate-y-1">
              عرض الكل
            </Link>
          </div>

          {loading ? (
            <div className="rounded-[2.5rem] bg-white/95 p-12 text-center text-2xl font-black text-[#7048e8] shadow-xl">جاري تحميل الأبناء...</div>
          ) : children.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {children.slice(0, 6).map((child) => {
                const timeText = getChildTime(child.id);
                const childCompleted = getChildCompletedPrograms(child.id);

                return (
                  <div key={child.id} className="group overflow-hidden rounded-[2.5rem] border border-[#DDEDEA] bg-[#F9FFFD] p-6 shadow-xl shadow-teal-50 transition hover:-translate-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-white text-5xl shadow-sm">{child.gender === "female" ? "👧" : "👦"}</div>
                        <div>
                          <h3 className="text-2xl font-black text-[#0B4D6B]">{child.full_name}</h3>
                          <p className="mt-1 font-bold text-[#6E7A99]">العمر: {child.age || "-"} سنوات</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-4 py-2 text-sm font-black ${child.plan === "pro" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {child.plan === "pro" ? "👑 Pro" : "🟢 Free"}
                      </span>
                    </div>

                    <div className="mt-5 rounded-[1.6rem] border border-[#DDEDEA] bg-white p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-black text-[#6E7A99]">اسم المستخدم</div>
                          <div className="mt-1 select-all font-black text-[#0B4D6B]">{child.username || "غير محدد"}</div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#6E7A99]">كود الدخول</div>
                          <div className="mt-1 select-all font-black tracking-[.16em] text-[#7048e8]">{child.access_code || "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-white p-4 text-center">
                        <div className="font-black text-[#0B4D6B]">⚡ {child.xp || 0}</div>
                        <div className="mt-1 text-xs font-bold text-[#6E7A99]">XP</div>
                      </div>
                      <div className="rounded-2xl bg-white p-4 text-center">
                        <div className="font-black text-[#0B4D6B]">✅ {childCompleted}</div>
                        <div className="mt-1 text-xs font-bold text-[#6E7A99]">برامج</div>
                      </div>
                      <div className="rounded-2xl bg-white p-4 text-center">
                        <div className="font-black text-[#0B4D6B]">⏱️ {timeText}</div>
                        <div className="mt-1 text-xs font-bold text-[#6E7A99]">وقت التعلم</div>
                      </div>
                    </div>

                    <Link href={`/dashboard/children/${child.id}`} className="mt-6 block rounded-full bg-[#0B4D6B] px-6 py-3 text-center font-black text-white transition group-hover:bg-[#42BFA8]">
                      عرض التفاصيل
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-white/95 p-12 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#F5FBFF] text-6xl">👦</div>
              <h3 className="mt-5 text-3xl font-black text-[#0B4D6B]">لا يوجد أبناء بعد</h3>
              <p className="mt-3 font-bold text-[#6E7A99]">ابدأ بإضافة أول طفل، وسيظهر له اسم مستخدم وكود دخول.</p>
              <Link href="/dashboard/children/new" className="mt-6 inline-flex rounded-full bg-[#42BFA8] px-8 py-4 font-black text-white">+ إضافة طفل</Link>
            </div>
          )}
        </section>
        {(!!recentAttempts.length || !!recentAchievements.length) && (
          <section className="grid gap-6 lg:grid-cols-2">
            {!!recentAchievements.length && (
              <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-3xl font-black text-[#0B4D6B]">آخر إنجازات الأبناء</h2>
                  <span className="rounded-full bg-[#E8F8F3] px-4 py-2 text-sm font-black text-[#42BFA8]">برامج مكتملة</span>
                </div>

                <div className="space-y-3">
                  {recentAchievements.map((row) => (
                    <Link
                      key={`${row.child_profile_id}-${row.program_id}-${row.updated_at}`}
                      href={`/dashboard/children/${row.child_profile_id}`}
                      className="block rounded-2xl bg-[#F9FFFD] p-4 transition hover:-translate-y-1 hover:bg-[#F1FFFB]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-[#0B4D6B]">{getChildName(row.child_profile_id)}</div>
                          <div className="mt-1 text-sm font-bold text-[#667085]">
                            أنجز برنامج: {getProgramTitle(row.program_id)}
                          </div>
                        </div>
                        <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">✅ مكتمل</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!!recentAttempts.length && (
              <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-3xl font-black text-[#0B4D6B]">آخر النشاطات</h2>
                  <span className="rounded-full bg-[#F3EFFF] px-4 py-2 text-sm font-black text-[#7048e8]">ألعاب وقصص</span>
                </div>

                <div className="space-y-3">
                  {recentAttempts.map((attempt) => (
                    <Link
                      key={attempt.id}
                      href={`/dashboard/children/${attempt.child_profile_id}`}
                      className="block rounded-2xl bg-[#F9FFFD] p-4 transition hover:-translate-y-1 hover:bg-[#F1FFFB]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-[#0B4D6B]">{getChildName(attempt.child_profile_id)}</div>
                          <div className="mt-1 text-sm font-bold text-[#667085]">
                            {getAttemptTypeLabel(attempt)}: {getAttemptTitle(attempt)}
                          </div>
                          <div className="mt-1 text-xs font-bold text-[#8A94AA]">
                            داخل: {getProgramTitle(attempt.program_id)}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {(attempt.max_score || 0) > 0 ? (
                            <div className="font-bold text-[#667085]">
                              {attempt.score || 0} / {attempt.max_score || 0}
                            </div>
                          ) : null}

                          <div className="rounded-full bg-[#E8F8F3] px-4 py-2 text-sm font-black text-[#42BFA8]">
                            ✅ تم النشاط
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </ParentLayout>
  );
}
