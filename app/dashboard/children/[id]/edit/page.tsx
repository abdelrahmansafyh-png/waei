"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParentLayout from "@/components/parent/ParentLayout";

type Gender = "male" | "female";

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export default function EditChildPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const childId = params.id;

  const [loading, setLoading] = useState(true);

const trackedContentTypes = [
  "game",
  "zip_game",
  "iframe",
  "interactive_story",
  "interactive_stories",
  "story"
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
  "story"
];

  const [saving, setSaving] = useState(false);
  const [child, setChild] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState(7);
  const [gender, setGender] = useState<Gender>("male");
  const [regenerateCode, setRegenerateCode] = useState(false);

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

    const { data: childData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", childId)
      .eq("role", "child")
      .eq("parent_profile_id", parentProfile.id)
      .maybeSingle();

    if (!childData) {
      alert("لم يتم العثور على الطفل");
      router.push("/dashboard/children");
      return;
    }

    setChild(childData);
    setFullName(childData.full_name || "");
    setUsername(childData.username || "");
    setAge(childData.age || 7);
    setGender(childData.gender === "female" ? "female" : "male");
    setLoading(false);
  }

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function saveChild(e: React.FormEvent) {
    e.preventDefault();

    const cleanUsername = normalizeUsername(username);

    if (!fullName.trim()) {
      alert("اسم الطفل مطلوب");
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      alert("اسم المستخدم يجب أن يكون 3 أحرف على الأقل وبالإنجليزية أو الأرقام");
      return;
    }

    setSaving(true);

    try {
      const token = await getToken();
      const res = await fetch("/api/parent/update-child", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          child_id: childId,
          full_name: fullName,
          username: cleanUsername,
          age,
          gender,
          regenerate_code: regenerateCode,
        }),
      });

      const json = await res.json();
      setSaving(false);

      if (!json.success) {
        alert(json.message || "فشل تعديل بيانات الطفل");
        return;
      }

      router.push(`/dashboard/children/${childId}`);
    } catch (error: any) {
      setSaving(false);
      alert(error?.message || "حدث خطأ غير متوقع");
    }
  }

  if (loading) {
    return (
      <ParentLayout>
        <div className="rounded-[2.5rem] bg-white p-12 text-center text-2xl font-black text-[#7048e8] shadow-xl">
          جاري تحميل بيانات الطفل...
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/dashboard/children/${childId}`} className="inline-flex rounded-full bg-white px-6 py-4 font-black text-[#0B4D6B] shadow-sm">
            ← رجوع للتفاصيل
          </Link>
          <Link href="/dashboard/children" className="inline-flex rounded-full bg-[#F3EFFF] px-6 py-4 font-black text-[#7048e8] shadow-sm">
            كل الأبناء
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2.8rem] bg-white/95 p-7 shadow-[0_18px_45px_rgba(62,87,120,.13)] md:p-9">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
              تعديل بيانات الطفل
            </div>
            <h1 className="text-4xl font-black leading-[1.25] text-[#20294f] md:text-5xl">
              تعديل حساب {child?.full_name || "الطفل"}
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-[#667085]">
              يمكنك تعديل الاسم والعمر وبيانات الدخول. إذا غيرت كود الدخول، أعطه للطفل من جديد.
            </p>
          </div>

          <form onSubmit={saveChild} className="space-y-5">
            <label className="block">
              <span className="mb-2 block font-black text-[#0B4D6B]">اسم الطفل الكامل</span>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: سامي محمد" className="w-full rounded-2xl border border-[#DDEDEA] bg-[#FAFFFD] px-5 py-4 font-bold outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10" />
            </label>

            <label className="block">
              <span className="mb-2 block font-black text-[#0B4D6B]">اسم المستخدم للطفل</span>
              <input required value={username} onChange={(e) => setUsername(normalizeUsername(e.target.value))} placeholder="مثال: sami-7" className="w-full rounded-2xl border border-[#DDEDEA] bg-[#FAFFFD] px-5 py-4 font-bold lowercase outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10" />
            </label>

            <div className="block rounded-[2rem] border border-[#DDEDEA] bg-[#FAFFFD] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="font-black text-[#0B4D6B]">العمر</span>
                <span className="rounded-full bg-[#ECFBF7] px-5 py-2 text-lg font-black text-[#0B4D6B]">{age} سنوات</span>
              </div>

              <input
                type="range"
                min={5}
                max={9}
                step={1}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full cursor-pointer accent-[#42BFA8]"
              />

              <div className="mt-3 flex justify-between text-sm font-black text-[#6E7A99]">
                {[5, 6, 7, 8, 9].map((year) => (
                  <span key={year}>{year}</span>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-3 block font-black text-[#0B4D6B]">الجنس</span>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setGender("male")} className={`rounded-[2rem] border-2 p-6 transition ${gender === "male" ? "border-[#42BFA8] bg-[#ECFBF7] shadow-lg" : "border-[#E5EEF1] bg-white"}`}>
                  <div className="text-7xl">👦</div>
                  <div className="mt-3 text-xl font-black text-[#0B4D6B]">ولد</div>
                </button>
                <button type="button" onClick={() => setGender("female")} className={`rounded-[2rem] border-2 p-6 transition ${gender === "female" ? "border-[#FF8FB3] bg-[#FFF0F6] shadow-lg" : "border-[#E5EEF1] bg-white"}`}>
                  <div className="text-7xl">👧</div>
                  <div className="mt-3 text-xl font-black text-[#0B4D6B]">بنت</div>
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[2rem] border border-[#DDEDEA] bg-[#FAFFFD] p-5">
              <div>
                <div className="font-black text-[#0B4D6B]">توليد كود دخول جديد</div>
                <p className="mt-1 text-sm font-bold text-[#667085]">استخدمها فقط إذا نسي الطفل الكود القديم.</p>
              </div>
              <input type="checkbox" checked={regenerateCode} onChange={(e) => setRegenerateCode(e.target.checked)} className="h-6 w-6" />
            </label>

            <div className="grid gap-3 pt-4 md:grid-cols-2">
              <Link href={`/dashboard/children/${childId}`} className="rounded-full bg-[#F4FAF8] px-8 py-4 text-center font-black text-[#0B4D6B]">إلغاء</Link>
              <button disabled={saving} className="rounded-full bg-[#42BFA8] px-8 py-4 font-black text-white shadow-lg disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ParentLayout>
  );
}
