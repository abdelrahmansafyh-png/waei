"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParentLayout from "@/components/parent/ParentLayout";

type ChildProfile = {
  id: string;
  full_name: string | null;
  gender: string | null;
  age: number | null;
  xp: number | null;
};

type ProgramSummary = {
  id: string;
  title: string;
};

type ContentSummary = {
  id: string;
  title: string | null;
  content_type: string | null;
};

function formatDuration(seconds: number) {
  const total = Math.floor(seconds || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);

  if (h > 0) return `${h} ساعة ${m} دقيقة`;
  return `${m} دقيقة`;
}

function activityLabel(type: string | null | undefined) {
  const value = String(type || "").toLowerCase();

  if (["story", "interactive_story", "interactive_stories"].includes(value)) return "قصص تفاعلية";
  if (value === "iframe") return "أنشطة";
  if (["video", "youtube"].includes(value)) return "فيديوهات";
  return "ألعاب تعليمية";
}

export default function ParentReportsPage() {
  const router = useRouter();

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [programProgress, setProgramProgress] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [contents, setContents] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "week" | "month" | "custom">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
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

    const { data: childrenRows } = await supabase
      .from("profiles")
      .select("id, full_name, gender, age, xp")
      .eq("parent_profile_id", parentProfile.id)
      .eq("role", "child")
      .order("created_at", { ascending: false });

    const childIds = (childrenRows || []).map((child) => child.id);

    let progressRows: any[] = [];
    let attemptRows: any[] = [];

    if (childIds.length) {
      const { data: progressData } = await supabase
        .from("child_program_progress")
        .select("*")
        .in("child_profile_id", childIds)
        .order("updated_at", { ascending: false });

      const { data: attemptsData } = await supabase
        .from("game_attempts")
        .select("*")
        .in("child_profile_id", childIds)
        .eq("completed", true)
        .order("created_at", { ascending: false });

      progressRows = progressData || [];
      attemptRows = attemptsData || [];
    }

    const programIds = Array.from(
      new Set([...progressRows, ...attemptRows].map((row) => row.program_id).filter(Boolean))
    );

    const contentIds = Array.from(
      new Set(attemptRows.map((row) => row.content_id).filter(Boolean))
    );

    let programsData: ProgramSummary[] = [];
    let contentsData: ContentSummary[] = [];

    if (programIds.length) {
      const { data } = await supabase
        .from("programs")
        .select("id, title")
        .in("id", programIds);

      programsData = (data as ProgramSummary[]) || [];
    }

    if (contentIds.length) {
      const { data } = await supabase
        .from("tab_contents")
        .select("id, title, content_type")
        .in("id", contentIds);

      contentsData = (data as ContentSummary[]) || [];
    }

    setChildren((childrenRows as ChildProfile[]) || []);
    setProgramProgress(progressRows);
    setAttempts(attemptRows);
    setPrograms(programsData);
    setContents(contentsData);
    setLoading(false);
  }

  function getProgramTitle(programId: string | null) {
    if (!programId) return "برنامج غير محدد";
    return programs.find((program) => program.id === programId)?.title || "برنامج غير محدد";
  }

  function getContent(contentId: string | null) {
    if (!contentId) return null;
    return contents.find((content) => content.id === contentId) || null;
  }

  function getDateRange() {
    const now = new Date();
    const startOfDay = (date: Date) => {
      const next = new Date(date);
      next.setHours(0, 0, 0, 0);
      return next;
    };

    if (dateFilter === "today") {
      return { from: startOfDay(now), to: now };
    }

    if (dateFilter === "yesterday") {
      const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
      const to = startOfDay(now);
      return { from, to };
    }

    if (dateFilter === "week") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { from, to: now };
    }

    if (dateFilter === "month") {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      return { from, to: now };
    }

    if (dateFilter === "custom" && fromDate && toDate) {
      const from = new Date(`${fromDate}T00:00:00`);
      const to = new Date(`${toDate}T23:59:59`);
      return { from, to };
    }

    return null;
  }

  function isInsideRange(value: string | null | undefined, range: { from: Date; to: Date } | null) {
    if (!range) return true;
    if (!value) return false;

    const date = new Date(value);
    return date >= range.from && date <= range.to;
  }

  const filteredAttempts = useMemo(() => {
    const range = getDateRange();
    return attempts.filter((attempt) => isInsideRange(attempt.created_at, range));
  }, [attempts, dateFilter, fromDate, toDate]);

  const filteredProgramProgress = useMemo(() => {
    const range = getDateRange();
    return programProgress.filter((row) => isInsideRange(row.updated_at, range));
  }, [programProgress, dateFilter, fromDate, toDate]);

  const childReports = useMemo(() => {
    return children.map((child) => {
      const childProgress = filteredProgramProgress.filter((row) => row.child_profile_id === child.id);
      const childAttempts = filteredAttempts.filter((row) => row.child_profile_id === child.id);

      const totalSeconds = childProgress.reduce((sum, row) => sum + Number(row.elapsed_seconds || 0), 0);
      const mostWorked = [...childProgress].sort((a, b) => Number(b.elapsed_seconds || 0) - Number(a.elapsed_seconds || 0))[0] || null;
      const lastAttempt = childAttempts[0] || null;

      const scoredAttempts = childAttempts.filter(
        (attempt) => Number(attempt.max_score || 0) > 0
      );

      const totalScore = scoredAttempts.reduce(
        (sum, attempt) => sum + Number(attempt.score || 0),
        0
      );

      const totalMaxScore = scoredAttempts.reduce(
        (sum, attempt) => sum + Number(attempt.max_score || 0),
        0
      );

      const averageScore =
        totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : null;

      const strengthText =
        averageScore === null
          ? "لا توجد نتائج كافية بعد"
          : averageScore >= 80
          ? "دقة عالية وتفاعل ممتاز"
          : averageScore >= 50
          ? "تفاعل جيد ويحتاج متابعة"
          : "يحتاج دعمًا وممارسة أكثر";

      return {
        child,
        totalSeconds,
        mostWorkedTitle: mostWorked ? getProgramTitle(mostWorked.program_id) : "لا توجد بيانات",
        activityPoints: averageScore !== null ? `${averageScore}/100` : "لا توجد نتائج بعد",
        rawScoreText: totalMaxScore > 0 ? `${totalScore} من ${totalMaxScore}` : "ابدأ لعبة أو قصة لعرض النتيجة",
        lastActivity: lastAttempt ? (getContent(lastAttempt.content_id)?.title || "نشاط تفاعلي") : "لا يوجد نشاط",
        lastProgram: lastAttempt ? getProgramTitle(lastAttempt.program_id) : "لا يوجد برنامج",
        strengthText,
        averageScore,
      };
    });
  }, [children, filteredProgramProgress, filteredAttempts, programs, contents]);

  return (
    <ParentLayout>
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="overflow-hidden rounded-[3rem] bg-gradient-to-br from-[var(--rashid-color-0b4d6b)] via-[var(--rashid-color-167a8f)] to-[var(--rashid-color-42bfa8)] p-8 text-white shadow-[0_24px_70px_rgba(11,77,107,.22)]">
          <div className="mb-3 inline-flex rounded-full bg-white/18 px-5 py-2 font-black text-white backdrop-blur">
            التقارير
          </div>
          <h1 className="text-4xl font-black md:text-5xl">📊 تقارير الأطفال</h1>
          <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-white/80">
            ملخص سريع لكل طفل: وقت التعلم، نتائج الأنشطة، آخر نشاط، وتقدم البرامج.
          </p>
        </header>

        <section className="rounded-[2.2rem] bg-white p-5 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
          <div className="mb-4 text-lg font-black text-[var(--rashid-color-0b4d6b)]">فلترة التقرير حسب التاريخ</div>

          <div className="flex flex-wrap gap-3">
            {[
              ["all", "كل الوقت"],
              ["today", "اليوم"],
              ["yesterday", "أمس"],
              ["week", "آخر 7 أيام"],
              ["month", "آخر 30 يوم"],
              ["custom", "تاريخ مخصص"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDateFilter(value as typeof dateFilter)}
                className={`rounded-full px-5 py-3 text-sm font-black transition ${
                  dateFilter === value
                    ? "bg-[var(--rashid-color-42bfa8)] text-white shadow-lg"
                    : "bg-[var(--rashid-color-f5fbff)] text-[var(--rashid-color-0b4d6b)] hover:bg-[var(--rashid-color-e8f8f3)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {dateFilter === "custom" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[var(--rashid-color-667085)]">من تاريخ</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] bg-white px-4 py-3 font-bold text-[var(--rashid-color-0b4d6b)] outline-none focus:border-[var(--rashid-color-42bfa8)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[var(--rashid-color-667085)]">إلى تاريخ</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] bg-white px-4 py-3 font-bold text-[var(--rashid-color-0b4d6b)] outline-none focus:border-[var(--rashid-color-42bfa8)]"
                />
              </label>
            </div>
          ) : null}
        </section>

        {loading ? (
          <div className="rounded-[2.5rem] bg-white p-12 text-center text-2xl font-black text-[var(--rashid-color-7048e8)] shadow-xl">
            جاري تحميل التقارير...
          </div>
        ) : childReports.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {childReports.map((report) => (
              <Link
                key={report.child.id}
                href={`/dashboard/children/${report.child.id}`}
                className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)] transition hover:-translate-y-1"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--rashid-color-f5fbff)] text-4xl">
                      {report.child.gender === "female" ? "👧" : "👦"}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[var(--rashid-color-0b4d6b)]">{report.child.full_name || "طفل"}</h2>
                      <p className="mt-1 font-bold text-[var(--rashid-color-667085)]">XP: {report.child.xp || 0}</p>
                    </div>
                  </div>

                  <div className="rounded-full bg-[var(--rashid-color-e8f8f3)] px-4 py-2 text-sm font-black text-[var(--rashid-color-42bfa8)]">
                    {formatDuration(report.totalSeconds)}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--rashid-color-f9fffd)] p-4">
                    <div className="text-sm font-black text-[var(--rashid-color-42bfa8)]">أكثر برنامج</div>
                    <div className="mt-1 font-black text-[var(--rashid-color-0b4d6b)]">{report.mostWorkedTitle}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--rashid-color-f5fbff)] p-4">
                    <div className="text-sm font-black text-[var(--rashid-color-42bfa8)]">نتائج الأنشطة</div>
                    <div className="mt-1 font-black text-[var(--rashid-color-0b4d6b)]">{report.activityPoints}</div>
                    <div className="mt-1 text-xs font-bold text-[var(--rashid-color-667085)]">{report.rawScoreText}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--rashid-color-fff9e8)] p-4">
                    <div className="text-sm font-black text-[var(--rashid-color-b75a00)]">ملخص الأداء</div>
                    <div className="mt-1 font-black text-[var(--rashid-color-0b4d6b)]">{report.strengthText}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--rashid-color-f3efff)] p-4">
                    <div className="text-sm font-black text-[var(--rashid-color-7048e8)]">آخر نشاط</div>
                    <div className="mt-1 font-black text-[var(--rashid-color-0b4d6b)]">{report.lastActivity}</div>
                    <div className="mt-1 text-xs font-bold text-[var(--rashid-color-667085)]">داخل: {report.lastProgram}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[2.5rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] bg-white p-12 text-center">
            <h3 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">لا توجد بيانات بعد</h3>
            <p className="mt-3 font-bold text-[var(--rashid-color-667085)]">أضف طفلًا وابدأ برنامجًا حتى تظهر التقارير.</p>
          </div>
        )}
      </div>
    </ParentLayout>
  );
}
