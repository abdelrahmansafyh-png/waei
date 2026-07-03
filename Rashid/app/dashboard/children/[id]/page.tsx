"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParentLayout from "@/components/parent/ParentLayout";

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

type ProgramContentStat = {
  program_id: string;
  title: string;
  total_contents: number;
  completed_contents: number;
  progress_percentage: number;
  elapsed_minutes: number;
  elapsed_seconds: number;
  completed: boolean;
  updated_at: string | null;
};

type ContentSummary = {
  id: string;
  title: string | null;
  content_type: string | null;
};

const trackedContentTypes = [
  "game",
  "zip_game",
  "iframe",
  "interactive_story",
  "interactive_stories",
  "story",
];

const requiredProgressTypes = [
  "content",
  "text",
  "image",
  "video",
  "youtube",
  "game",
  "zip_game",
  "iframe",
  "interactive_story",
  "interactive_stories",
  "story",
];

function hasRealValue(value: any) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function isRequiredProgressContent(content: any) {
  const type = String(content?.content_type || "").toLowerCase();

  if (["text", "content"].includes(type)) {
    return Boolean(String(content?.body || "").trim());
  }

  if (type === "image") {
    return Boolean(content?.file_url);
  }

  if (type === "video") {
    return Boolean(content?.file_url);
  }

  if (type === "youtube") {
    return Boolean(content?.youtube_url);
  }

  if (["game", "zip_game", "iframe", "story", "interactive_story", "interactive_stories"].includes(type)) {
    return Boolean(
      content?.iframe_url ||
      content?.game_url ||
      content?.game_folder
    );
  }

  return false;
}


export default function ChildDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const childId = params.id;

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [programProgress, setProgramProgress] = useState<any[]>([]);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [programStats, setProgramStats] = useState<ProgramContentStat[]>([]);
  const [attemptContents, setAttemptContents] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChild();
  }, [childId]);

  async function loadChild() {
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
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "parent")
      .maybeSingle();

    if (!parentProfile) {
      router.push("/dashboard");
      return;
    }

    const { data: childData, error: childError } = await supabase
      .from("profiles")
      .select("id, full_name, username, access_code, age, gender, plan, xp, created_at")
      .eq("id", childId)
      .eq("role", "child")
      .eq("parent_profile_id", parentProfile.id)
      .maybeSingle();

    if (childError) console.error(childError);

    if (!childData) {
      alert("لم يتم العثور على الطفل");
      router.push("/dashboard/children");
      return;
    }

    const { data: attemptsRows } = await supabase
      .from("game_attempts")
      .select("*")
      .eq("child_profile_id", childId)
      .eq("completed", true)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: progressRows } = await supabase
      .from("child_program_progress")
      .select("*")
      .eq("child_profile_id", childId)
      .order("updated_at", { ascending: false });

    const contentIds = Array.from(
      new Set((attemptsRows || []).map((row: any) => row.content_id).filter(Boolean))
    );

    let contentsData: ContentSummary[] = [];

    if (contentIds.length) {
      const { data: contentRows } = await supabase
        .from("tab_contents")
        .select("id, title, content_type")
        .in("id", contentIds);

      contentsData = (contentRows as ContentSummary[]) || [];
    }

    const programIds = Array.from(
      new Set(
        [...(attemptsRows || []), ...(progressRows || [])]
          .map((row: any) => row.program_id)
          .filter(Boolean)
      )
    );

    let programsData: ProgramSummary[] = [];

    if (programIds.length) {
      const { data: programRows } = await supabase
        .from("programs")
        .select("id, title, slug")
        .in("id", programIds);

      programsData = (programRows as ProgramSummary[]) || [];
    }

    let programStatsData: ProgramContentStat[] = [];

    if (programIds.length) {
      const { data: tabsRows } = await supabase
        .from("program_tabs")
        .select("id, program_id")
        .in("program_id", programIds);

      const tabs = (tabsRows || []) as any[];
      const tabIds = tabs.map((tab) => tab.id).filter(Boolean);

      let tabContentsRows: any[] = [];
      let completedContentRows: any[] = [];
      let completedAttemptRows: any[] = [];

      if (tabIds.length) {
        const { data: contentsRows } = await supabase
          .from("tab_contents")
          .select("id, tab_id, content_type, body, file_url, youtube_url, iframe_url, game_url, game_folder")
          .in("tab_id", tabIds);

        tabContentsRows = contentsRows || [];

        const allContentIds = tabContentsRows.map((content) => content.id).filter(Boolean);

        if (allContentIds.length) {
          const { data: completedRows } = await supabase
            .from("child_content_progress")
            .select("content_id, program_id, completed")
            .eq("child_profile_id", childId)
            .eq("completed", true)
            .in("content_id", allContentIds);

          const { data: completedAttempts } = await supabase
            .from("game_attempts")
            .select("content_id, program_id, completed")
            .eq("child_profile_id", childId)
            .eq("completed", true)
            .in("content_id", allContentIds);

          completedContentRows = completedRows || [];
          completedAttemptRows = completedAttempts || [];
        }
      }

      const tabProgramMap = new Map<string, string>();
      tabs.forEach((tab) => {
        if (tab.id && tab.program_id) tabProgramMap.set(tab.id, tab.program_id);
      });

      // Progress logic:
      // - Normal lesson tabs (text/image/video/youtube/content) count once per tab,
      //   even if the tab has multiple text/content rows.
      // - Sub-items inside grouped tabs (games/stories/activities/iframe) count one by one.
      //   Example: "ألعاب البرنامج" is NOT counted as a parent tab; each game inside it is counted.
      const multiItemProgressTypes = [
        "game",
        "zip_game",
        "iframe",
        "story",
        "interactive_story",
        "interactive_stories",
      ];

      const requiredStepIdsByProgram = new Map<string, Set<string>>();
      const requiredContentToStepMap = new Map<string, { stepId: string; programId: string }>();

      tabContentsRows.forEach((content) => {
        const tabId = content.tab_id;
        const programId = tabProgramMap.get(tabId);
        const type = String(content?.content_type || "").toLowerCase();

        if (!programId || !tabId || !isRequiredProgressContent(content)) return;

        const stepId = multiItemProgressTypes.includes(type)
          ? content.id
          : tabId;

        if (!requiredStepIdsByProgram.has(programId)) {
          requiredStepIdsByProgram.set(programId, new Set<string>());
        }

        requiredStepIdsByProgram.get(programId)!.add(stepId);
        requiredContentToStepMap.set(content.id, { stepId, programId });
      });

      const completedStepIdsByProgram = new Map<string, Set<string>>();

      const addCompletedContent = (row: any) => {
        if (!row.content_id) return;

        const mapped = requiredContentToStepMap.get(row.content_id);
        if (!mapped) return;

        if (!completedStepIdsByProgram.has(mapped.programId)) {
          completedStepIdsByProgram.set(mapped.programId, new Set<string>());
        }

        // If any content inside a normal lesson tab is completed, that tab step is completed.
        // For games/stories/iframe, each item has its own stepId, so each one is counted separately.
        completedStepIdsByProgram.get(mapped.programId)!.add(mapped.stepId);
      };

      completedContentRows.forEach(addCompletedContent);
      completedAttemptRows.forEach(addCompletedContent);

      programStatsData = programIds.map((programId) => {
        const program = programsData.find((item) => item.id === programId);
        const progressRow = (progressRows || []).find((row: any) => row.program_id === programId);
        const total = requiredStepIdsByProgram.get(programId)?.size || 0;
        const completedCount = completedStepIdsByProgram.get(programId)?.size || 0;
        const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        const isCompleted =
          Boolean(progressRow?.completed) ||
          (total > 0 && completedCount >= total);

        return {
          program_id: programId,
          title: program?.title || "برنامج غير محدد",
          total_contents: total,
          completed_contents: isCompleted ? total : completedCount,
          progress_percentage: isCompleted ? 100 : percentage,
          elapsed_minutes: Math.round((progressRow?.elapsed_seconds || 0) / 60),
          elapsed_seconds: Number(progressRow?.elapsed_seconds || 0),
          completed: isCompleted,
          updated_at: progressRow?.updated_at || null,
        };
      }).sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });
    }

    setChild(childData);
    setAttempts(attemptsRows || []);
    setProgramProgress(progressRows || []);
    setPrograms(programsData);
    setProgramStats(programStatsData);
    setAttemptContents(contentsData);
    setLoading(false);
  }

  const minutes = useMemo(
    () => Math.round(programProgress.reduce((sum, row) => sum + (row.elapsed_seconds || 0), 0) / 60),
    [programProgress]
  );

  const completedPrograms = useMemo(
    () => programStats.filter((row) => row.completed === true).length,
    [programStats]
  );

  function formatDuration(seconds: number) {
    const total = Math.floor(seconds || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);

    if (h > 0) return `${h} ساعة ${m} دقيقة`;
    return `${m} دقيقة`;
  }


  const completedProgramRows = useMemo(
    () => programStats.filter((row) => row.completed === true),
    [programStats]
  );

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

  const trackedAttempts = useMemo(
    () => attempts.filter(isTrackedAttempt),
    [attempts, attemptContents]
  );

  function getProgramTitle(programId: string | null) {
    if (!programId) return "برنامج غير محدد";
    const program = programs.find((item) => item.id === programId);
    return program?.title || "برنامج غير محدد";
  }

  function getAttemptTitle(attempt: any) {
    const content = getAttemptContent(attempt);
    return content?.title || "نشاط تفاعلي";
  }

  function getRawContentTypeLabel(typeValue: string | null | undefined) {
    const type = String(typeValue || "").toLowerCase();

    if (type === "interactive_story" || type === "interactive_stories" || type === "story") {
      return "قصص تفاعلية";
    }

    if (type === "iframe") {
      return "أنشطة";
    }

    if (type === "youtube" || type === "video") {
      return "فيديوهات";
    }

    return "ألعاب تعليمية";
  }

  function getAttemptTypeLabel(attempt: any) {
    const type = String(getAttemptContent(attempt)?.content_type || "");
    if (type === "interactive_story" || type === "interactive_stories" || type === "story") return "قصة تفاعلية";
    if (type === "iframe") return "نشاط";
    return "لعبة تعليمية";
  }

  function getProgramMinutes(programId: string | null) {
    if (!programId) return 0;
    const row = programProgress.find((item) => item.program_id === programId);
    return Math.round((row?.elapsed_seconds || 0) / 60);
  }


  const mostWorkedProgram = useMemo(() => {
    const worked = [...programStats]
      .filter((program) => (program.elapsed_seconds || 0) > 0)
      .sort((a, b) => (b.elapsed_seconds || 0) - (a.elapsed_seconds || 0));

    return worked[0] || null;
  }, [programStats]);

  const accuracyStats = useMemo(() => {
    const scoredAttempts = trackedAttempts.filter(
      (attempt) => Number(attempt.max_score || 0) > 0
    );

    const score = scoredAttempts.reduce(
      (sum, attempt) => sum + Number(attempt.score || 0),
      0
    );

    const maxScore = scoredAttempts.reduce(
      (sum, attempt) => sum + Number(attempt.max_score || 0),
      0
    );

    const percent =
      maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

    return {
      score,
      maxScore,
      percent,
      pointsText: percent !== null ? `${percent}/100` : "لا توجد نتائج بعد",
      rawText: maxScore > 0 ? `${score} من ${maxScore}` : "ابدأ لعبة أو قصة لعرض النتيجة",
    };
  }, [trackedAttempts]);

  const averageScore = accuracyStats.percent;

  const strengthText = useMemo(() => {
    if (averageScore === null && !trackedAttempts.length) {
      return "ابدأ الأنشطة حتى تظهر ملخص الأداء.";
    }

    if ((averageScore || 0) >= 80) {
      return "دقة عالية في الإجابات وتفاعل ممتاز.";
    }

    if ((averageScore || 0) >= 50) {
      return "تفاعل جيد مع حاجة لمزيد من التدريب.";
    }

    if (trackedAttempts.length >= 3) {
      return "استمرارية جيدة تحتاج دعمًا إضافيًا.";
    }

    return "تفاعل مبكر جيد، ويحتاج المزيد من المحاولات.";
  }, [averageScore, trackedAttempts.length]);

  const lastTrackedAttempt = trackedAttempts[0] || null;


  if (loading) {
    return (
      <ParentLayout>
        <div className="rounded-[2.5rem] bg-white p-12 text-center text-2xl font-black text-[var(--rashid-color-7048e8)] shadow-xl">
          جاري تحميل تفاصيل الطفل...
        </div>
      </ParentLayout>
    );
  }

  if (!child) return null;

  return (
    <ParentLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard/children" className="rounded-full bg-white px-6 py-4 font-black text-[var(--rashid-color-0b4d6b)] shadow-sm">
            ← رجوع للأبناء
          </Link>
          <Link href={`/dashboard/children/${child.id}/edit`} className="rounded-full bg-[var(--rashid-color-42bfa8)] px-7 py-4 font-black text-white shadow-lg transition hover:-translate-y-1">
            تعديل بيانات الطفل
          </Link>
        </div>

        <header className="overflow-hidden rounded-[3rem] bg-gradient-to-br from-[var(--rashid-color-0b4d6b)] via-[var(--rashid-color-167a8f)] to-[var(--rashid-color-42bfa8)] p-8 text-white shadow-[0_24px_70px_rgba(11,77,107,.22)]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/18 text-6xl backdrop-blur">
                {child.gender === "female" ? "👧" : "👦"}
              </div>
              <div>
                <div className="mb-3 inline-flex rounded-full bg-white/18 px-5 py-2 font-black text-white backdrop-blur">تفاصيل الطفل</div>
                <h1 className="text-4xl font-black md:text-5xl">{child.full_name}</h1>
                <p className="mt-3 text-lg font-bold text-white/80">العمر: {child.age || "-"} سنوات</p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white/15 p-5 backdrop-blur">
              <div className="text-sm font-black text-white/70">حالة الاشتراك</div>
              <div className="mt-2 text-2xl font-black">{child.plan === "pro" ? "👑 Pro" : "🟢 Free"}</div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-4">
          {[
            ["⚡", "XP", child.xp || 0],
            ["✅", "برامج مكتملة", completedPrograms],
            ["⏱️", "وقت التعلم",   formatDuration(programStats.reduce((sum, p) => sum + (p.elapsed_seconds || 0), 0))],
            ["🎮", "محاولات الألعاب", trackedAttempts.length],
          ].map(([icon, title, value]) => (
            <div key={String(title)} className="rounded-[2rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
              <div className="text-4xl">{icon}</div>
              <div className="mt-4 text-3xl font-black text-[var(--rashid-color-0b4d6b)]">{String(value)}</div>
              <div className="mt-2 font-black text-[var(--rashid-color-667085)]">{title}</div>
            </div>
          ))}
        </section>

        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[var(--rashid-color-e8f8f3)] px-5 py-2 text-sm font-black text-[var(--rashid-color-42bfa8)]">
                تقرير الطفل
              </div>
              <h2 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">ملخص رحلة {child.full_name}</h2>
            </div>
            <div className="rounded-full bg-[var(--rashid-color-f3efff)] px-5 py-2 text-sm font-black text-[var(--rashid-color-7048e8)]">
              ملخص التقرير
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[1.7rem] bg-[var(--rashid-color-f9fffd)] p-5">
              <div className="text-3xl">📘</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-42bfa8)]">أكثر برنامج اشتغل عليه</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-0b4d6b)]">
                {mostWorkedProgram?.title || "لا توجد بيانات بعد"}
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--rashid-color-667085)]">
                {mostWorkedProgram ? formatDuration(mostWorkedProgram.elapsed_seconds) : "ابدأ برنامجًا لعرض الوقت"}
              </div>
            </div>

            <div className="rounded-[1.7rem] bg-[var(--rashid-color-f5fbff)] p-5">
              <div className="text-3xl">🎯</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-42bfa8)]">نتائج الأنشطة</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-0b4d6b)]">{accuracyStats.pointsText}</div>
              <div className="mt-2 text-sm font-bold text-[var(--rashid-color-667085)]">{accuracyStats.rawText}</div>
            </div>

            <div className="rounded-[1.7rem] bg-[var(--rashid-color-fff9e8)] p-5">
              <div className="text-3xl">⏱️</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-b75a00)]">مجموع وقت التعلم</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-0b4d6b)]">
                {formatDuration(programStats.reduce((sum, program) => sum + (program.elapsed_seconds || 0), 0))}
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--rashid-color-667085)]">من كل البرامج</div>
            </div>

            <div className="rounded-[1.7rem] bg-[var(--rashid-color-f3efff)] p-5">
              <div className="text-3xl">💪</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-7048e8)]">ملخص الأداء</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-0b4d6b)]">{strengthText}</div>
              <div className="mt-2 text-sm font-bold text-[var(--rashid-color-667085)]">
                {averageScore !== null ? `متوسط النتائج: ${averageScore}%` : "لا توجد نتائج كافية"}
              </div>
            </div>

            <div className="rounded-[1.7rem] bg-[var(--rashid-color-ecfbf7)] p-5 md:col-span-2">
              <div className="text-3xl">📍</div>
              <div className="mt-3 text-sm font-black text-[var(--rashid-color-42bfa8)]">آخر نشاط</div>
              <div className="mt-1 text-xl font-black text-[var(--rashid-color-0b4d6b)]">
                {lastTrackedAttempt ? `${getAttemptTypeLabel(lastTrackedAttempt)}: ${getAttemptTitle(lastTrackedAttempt)}` : "لا توجد نشاطات بعد"}
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--rashid-color-667085)]">
                {lastTrackedAttempt ? `داخل: ${getProgramTitle(lastTrackedAttempt.program_id)}` : "سيظهر آخر نشاط بعد بدء اللعب"}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
              <h2 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">بيانات الدخول</h2>
              <p className="mt-3 font-bold leading-7 text-[var(--rashid-color-667085)]">أعط هذه البيانات للطفل ليدخل من تبويب الطفل في صفحة الدخول.</p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[1.7rem] bg-[var(--rashid-color-f5fbff)] p-5">
                  <div className="text-sm font-black text-[var(--rashid-color-667085)]">اسم المستخدم</div>
                  <div className="mt-2 select-all text-2xl font-black text-[var(--rashid-color-0b4d6b)]">{child.username || "غير محدد"}</div>
                </div>
                <div className="rounded-[1.7rem] bg-[var(--rashid-color-f3efff)] p-5">
                  <div className="text-sm font-black text-[var(--rashid-color-667085)]">كود الدخول</div>
                  <div className="mt-2 select-all text-3xl font-black tracking-[.18em] text-[var(--rashid-color-7048e8)]">{child.access_code || "-"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
              <h2 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">تقدم الطفل داخل البرامج</h2>
              <p className="mt-3 font-bold leading-7 text-[var(--rashid-color-667085)]">
                هنا يظهر كل برنامج دخله الطفل، نسبة تقدمه الحالية، والوقت الذي قضاه داخله.
              </p>

              {programStats.length ? (
                <div className="mt-5 space-y-4">
                  {programStats.map((program) => (
                    <div key={program.program_id} className="rounded-[1.7rem] bg-[var(--rashid-color-f9fffd)] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-[var(--rashid-color-42bfa8)]">دخل برنامج</div>
                          <div className="mt-1 text-xl font-black text-[var(--rashid-color-0b4d6b)]">{program.title}</div>
                          <div className="mt-2 text-sm font-bold text-[var(--rashid-color-667085)]">
                            مكتمل {program.completed ? program.total_contents : program.completed_contents} من {program.total_contents}{program.elapsed_seconds > 0 ? ` · الوقت: ${formatDuration(program.elapsed_seconds)}` : ""}
                          </div>
                        </div>

                        <div className={`rounded-full px-4 py-2 text-sm font-black ${program.completed ? "bg-green-100 text-green-700" : "bg-[var(--rashid-color-e8f8f3)] text-[var(--rashid-color-42bfa8)]"}`}>
                          {program.completed ? "✅ مكتمل" : `${program.progress_percentage}%`}
                        </div>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--rashid-color-e6eef3)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-[var(--rashid-color-42bfa8)] to-[var(--rashid-color-19c6d4)]"
                          style={{ width: `${program.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[2rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] p-8 text-center font-black text-[var(--rashid-color-667085)]">
                  لم يدخل الطفل أي برنامج بعد
                </div>
              )}
            </div>

            <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
              <h2 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">البرامج التي أنجزها</h2>

              {completedProgramRows.length ? (
                <div className="mt-5 space-y-3">
                  {completedProgramRows.map((row) => (
                    <div key={`${row.program_id}-${row.updated_at}`} className="rounded-2xl bg-[var(--rashid-color-f9fffd)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-black text-[var(--rashid-color-0b4d6b)]">{getProgramTitle(row.program_id)}</div>
                        <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">✅ مكتمل</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[2rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] p-8 text-center font-black text-[var(--rashid-color-667085)]">
                  لم ينهِ أي برنامج بعد
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]">
            <h2 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">آخر النشاطات</h2>
            {trackedAttempts.length ? (
              <div className="mt-5 space-y-3">
                {trackedAttempts.map((attempt) => (
                  <div key={attempt.id} className="rounded-2xl bg-[var(--rashid-color-f9fffd)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-black text-[var(--rashid-color-0b4d6b)]">{getAttemptTypeLabel(attempt)}</div>
                        <div className="mt-1 text-sm font-bold text-[var(--rashid-color-667085)]">
                          {getAttemptTitle(attempt)}
                        </div>
                        <div className="mt-1 text-xs font-bold text-[var(--rashid-color-8a94aa)]">
                          داخل: {getProgramTitle(attempt.program_id)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {(attempt.max_score || 0) > 0 ? (
                          <div className="font-bold text-[var(--rashid-color-667085)]">{attempt.score || 0} / {attempt.max_score || 0}</div>
                        ) : null}
                        <div className="rounded-full bg-[var(--rashid-color-e8f8f3)] px-4 py-2 text-sm font-black text-[var(--rashid-color-42bfa8)]">✅ تم النشاط</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[2rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] p-8 text-center font-black text-[var(--rashid-color-667085)]">
                لا توجد نشاطات بعد
              </div>
            )}
          </div>
        </section>
      </div>
    </ParentLayout>
  );
}
