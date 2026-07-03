"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ChildLayout from "@/components/child/ChildLayout";
import { getChildAvatar, getChildName } from "@/components/child/childUtils";

type Program = {
  id: string;
  title: string;
  slug: string | null;
};

type CertificateRow = {
  program_id: string;
  program_title: string;
  elapsed_seconds: number;
  completed_at: string | null;
};

function formatDuration(seconds: number) {
  const total = Math.floor(seconds || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);

  if (h > 0) return `${h} ساعة ${m} دقيقة`;
  return `${m} دقيقة`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export default function ChildCertificatesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
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

    if (!profileData || profileData.role !== "child") {
      router.push("/dashboard");
      return;
    }

    setProfile(profileData);

    const { data: programProgressRows } = await supabase
      .from("child_program_progress")
      .select("program_id, elapsed_seconds, completed, updated_at")
      .eq("child_profile_id", profileData.id)
      .eq("completed", true)
      .order("updated_at", { ascending: false });

    const { data: finishAttemptsRows } = await supabase
      .from("game_attempts")
      .select("program_id, completed, percentage, created_at")
      .eq("child_profile_id", profileData.id)
      .eq("completed", true)
      .is("content_id", null)
      .gte("percentage", 100)
      .order("created_at", { ascending: false });

    const progressRows = programProgressRows || [];
    const attemptRows = finishAttemptsRows || [];

    const programIds = Array.from(
      new Set(
        [...progressRows, ...attemptRows]
          .map((row: any) => row.program_id)
          .filter(Boolean)
      )
    );

    let programs: Program[] = [];

    if (programIds.length) {
      const { data: programRows } = await supabase
        .from("programs")
        .select("id, title, slug")
        .in("id", programIds);

      programs = (programRows as Program[]) || [];
    }

    const progressMap = new Map<string, any>();
    progressRows.forEach((row: any) => {
      if (row.program_id) progressMap.set(row.program_id, row);
    });

    const attemptMap = new Map<string, any>();
    attemptRows.forEach((row: any) => {
      if (row.program_id && !attemptMap.has(row.program_id)) {
        attemptMap.set(row.program_id, row);
      }
    });

    const rows: CertificateRow[] = programIds.map((programId) => {
      const program = programs.find((item) => item.id === programId);
      const progress = progressMap.get(programId);
      const attempt = attemptMap.get(programId);

      return {
        program_id: programId,
        program_title: program?.title || "برنامج غير محدد",
        elapsed_seconds: Number(progress?.elapsed_seconds || 0),
        completed_at: progress?.updated_at || attempt?.created_at || null,
      };
    });

    setCertificates(rows);
    setLoading(false);
  }

  const childName = getChildName(profile);
  const childAvatar = getChildAvatar(profile);

  const totalTime = useMemo(
    () => certificates.reduce((sum, item) => sum + Number(item.elapsed_seconds || 0), 0),
    [certificates]
  );

  if (loading) {
    return (
      <ChildLayout profile={profile} activeHref="/dashboard/certificates">
        <div className="flex min-h-screen flex-1 items-center justify-center text-2xl font-black text-[var(--rashid-color-7050e8)]">
          جاري تحميل الشهادات...
        </div>
      </ChildLayout>
    );
  }

  return (
    <ChildLayout profile={profile} activeHref="/dashboard/certificates">
      <main className="min-h-screen flex-1 bg-cover bg-fixed bg-center px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-7 overflow-hidden rounded-[2.8rem] border border-white/40 bg-white/92 p-7 shadow-[0_22px_70px_rgba(62,87,120,.18)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-[var(--rashid-color-e8f8f3)] px-5 py-2 font-black text-[var(--rashid-color-0e9faa)]">
                  شهاداتي
                </div>
                <h1 className="text-4xl font-black leading-[1.2] text-[var(--rashid-color-20294f)] md:text-5xl">
                  شهادات البرامج المكتملة 🎓
                </h1>
                <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-[var(--rashid-color-667085)]">
                  هنا تظهر شهادات البرامج التي أنهيتها، مع وقت التعلم وتاريخ الإكمال.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-[2rem] bg-[var(--rashid-color-f9fffd)] p-4 shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white text-4xl shadow-sm">
                  {childAvatar}
                </div>
                <div>
                  <div className="text-xl font-black text-[var(--rashid-color-0b4d6b)]">{childName}</div>
                  <div className="mt-1 text-sm font-bold text-[var(--rashid-color-667085)]">
                    {certificates.length} شهادة · {formatDuration(totalTime)}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {certificates.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {certificates.map((certificate) => (
                <section
                  key={certificate.program_id}
                  className="relative overflow-hidden rounded-[2.4rem] border border-[var(--rashid-color-ddedea)] bg-white p-7 shadow-[0_18px_45px_rgba(62,87,120,.10)]"
                >
                  <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[var(--rashid-color-e8f8f3)]" />
                  <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-[var(--rashid-color-f3efff)]" />

                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div className="rounded-full bg-[var(--rashid-color-e8f8f3)] px-5 py-2 text-sm font-black text-[var(--rashid-color-0e9faa)]">
                        شهادة إتمام
                      </div>
                      <div className="text-4xl">🏆</div>
                    </div>

                    <div className="rounded-[2rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] bg-[var(--rashid-color-fafffd)] p-6 text-center">
                      <div className="text-sm font-black text-[var(--rashid-color-667085)]">تشهد منصة راشد أن</div>
                      <div className="mt-3 text-3xl font-black text-[var(--rashid-color-0b4d6b)]">{childName}</div>
                      <div className="mt-4 text-sm font-black text-[var(--rashid-color-667085)]">أكمل برنامج</div>
                      <div className="mt-2 text-2xl font-black text-[var(--rashid-color-7050e8)]">
                        {certificate.program_title}
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-4">
                          <div className="text-sm font-black text-[var(--rashid-color-667085)]">وقت التعلم</div>
                          <div className="mt-1 font-black text-[var(--rashid-color-0b4d6b)]">
                            {formatDuration(certificate.elapsed_seconds)}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white p-4">
                          <div className="text-sm font-black text-[var(--rashid-color-667085)]">تاريخ الإكمال</div>
                          <div className="mt-1 font-black text-[var(--rashid-color-0b4d6b)]">
                            {formatDate(certificate.completed_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/child/programs`}
                        className="rounded-full bg-[var(--rashid-color-0b4d6b)] px-6 py-3 font-black text-white"
                      >
                        الرجوع للبرامج
                      </Link>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-full bg-[var(--rashid-color-e8f8f3)] px-6 py-3 font-black text-[var(--rashid-color-0b4d6b)]"
                      >
                        طباعة الشهادة
                      </button>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] bg-white/92 p-12 text-center shadow-[0_18px_45px_rgba(62,87,120,.08)]">
              <div className="text-6xl">🎓</div>
              <h2 className="mt-5 text-3xl font-black text-[var(--rashid-color-0b4d6b)]">لا توجد شهادات بعد</h2>
              <p className="mx-auto mt-3 max-w-xl font-bold leading-8 text-[var(--rashid-color-667085)]">
                عند إنهاء برنامج كامل ستظهر شهادته هنا مع اسم البرنامج، وقت التعلم، وتاريخ الإكمال.
              </p>
              <Link
                href="/child/programs"
                className="mt-6 inline-flex rounded-full bg-[var(--rashid-color-7050e8)] px-8 py-4 font-black text-white"
              >
                الذهاب إلى البرامج
              </Link>
            </div>
          )}
        </div>
      </main>
    </ChildLayout>
  );
}
