
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ParentLayout from "@/components/parent/ParentLayout";

type Gender = "male" | "female";

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export default function NewChildPage() {
  const router = useRouter();
  const [parentProfile, setParentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [createdChild, setCreatedChild] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState(7);
  const [gender, setGender] = useState<Gender>("male");

  useEffect(() => {
    loadParent();
  }, []);

  async function loadParent() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data || data.role !== "parent") {
      router.push("/dashboard");
      return;
    }

    setParentProfile(data);
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  }

  async function createChild(e: React.FormEvent) {
    e.preventDefault();
    if (!parentProfile?.id) return;

    const cleanUsername = normalizeUsername(username);
    if (!cleanUsername || cleanUsername.length < 3) {
      alert("اسم المستخدم يجب أن يكون 3 أحرف على الأقل وبالإنجليزية أو الأرقام");
      return;
    }

    setLoading(true);
    setCreatedChild(null);

    try {
      const token = await getToken();
      const res = await fetch("/api/parent/create-child", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          username: cleanUsername,
          age,
          gender,
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (!json.success) {
        alert(json.message || "فشل إنشاء حساب الطفل");
        return;
      }

      setCreatedChild(json.child);
    } catch (error: any) {
      setLoading(false);
      alert(error.message || "حدث خطأ غير متوقع");
    }
  }

  return (
    <ParentLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard/children" className="inline-flex rounded-full bg-white px-6 py-4 font-black text-[var(--rashid-color-0b4d6b)] shadow-sm">
            ← رجوع للأبناء
          </Link>
          <Link href="/child-login" className="inline-flex rounded-full bg-[var(--rashid-color-f3efff)] px-6 py-4 font-black text-[var(--rashid-color-7048e8)] shadow-sm">
            صفحة دخول الطفل
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2.8rem] bg-white/95 p-7 shadow-[0_18px_45px_rgba(62,87,120,.13)] md:p-9">
          <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[var(--rashid-color-e8f8f3)] px-5 py-2 font-black text-[var(--rashid-color-42bfa8)]">
                إضافة طفل
              </div>
              <h1 className="text-4xl font-black leading-[1.25] text-[var(--rashid-color-20294f)] md:text-5xl">
                أنشئ حساب الطفل من حساب ولي الأمر 👦
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-[var(--rashid-color-667085)]">
                الطفل لا يسجل بنفسه. أنت تنشئ له اسم مستخدم وكود دخول، وبعدها يدخل من صفحة الطفل بدون بريد إلكتروني.
              </p>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-[var(--rashid-color-e8f8f3)] to-[var(--rashid-color-f3efff)] p-6">
              <h2 className="text-2xl font-black text-[var(--rashid-color-0b4d6b)]">بيانات دخول الطفل</h2>
              <div className="mt-4 space-y-3 font-bold leading-7 text-[var(--rashid-color-526079)]">
                <p>1. ولي الأمر يضيف الطفل.</p>
                <p>2. النظام يعطي اسم مستخدم وكود دخول.</p>
                <p>3. الطفل يدخل من صفحة دخول الطفل فقط.</p>
              </div>
            </div>
          </div>

          {createdChild ? (
            <div className="rounded-[2.5rem] border border-[var(--rashid-color-ddedea)] bg-[var(--rashid-color-fafffd)] p-7 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-6xl shadow-lg">
                {createdChild.gender === "female" ? "👧" : "👦"}
              </div>
              <h2 className="mt-5 text-3xl font-black text-[var(--rashid-color-0b4d6b)]">تم إنشاء حساب الطفل بنجاح</h2>
              <p className="mt-3 font-bold text-[var(--rashid-color-6e7a99)]">احفظ بيانات الدخول التالية أو أرسلها لولي الأمر.</p>

              <div className="mx-auto mt-7 grid max-w-2xl gap-4 md:grid-cols-2">
                <div className="rounded-[2rem] bg-white p-5 shadow-sm">
                  <div className="text-sm font-black text-[var(--rashid-color-6e7a99)]">اسم المستخدم</div>
                  <div className="mt-2 select-all text-3xl font-black text-[var(--rashid-color-0b4d6b)]">{createdChild.username}</div>
                </div>
                <div className="rounded-[2rem] bg-white p-5 shadow-sm">
                  <div className="text-sm font-black text-[var(--rashid-color-6e7a99)]">كود الدخول</div>
                  <div className="mt-2 select-all text-3xl font-black tracking-[.18em] text-[var(--rashid-color-7048e8)]">{createdChild.access_code}</div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button onClick={() => { setCreatedChild(null); setFullName(""); setUsername(""); }} className="rounded-full bg-[var(--rashid-color-42bfa8)] px-8 py-4 font-black text-white shadow-lg">
                  إضافة طفل آخر
                </button>
                <Link href="/dashboard/children" className="rounded-full bg-[var(--rashid-color-0b4d6b)] px-8 py-4 font-black text-white shadow-lg">
                  عرض الأبناء
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={createChild} className="space-y-5">
              <label className="block">
                <span className="mb-2 block font-black text-[var(--rashid-color-0b4d6b)]">اسم الطفل الكامل</span>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: سامي محمد" className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] bg-[var(--rashid-color-fafffd)] px-5 py-4 font-bold outline-none transition focus:border-[var(--rashid-color-42bfa8)] focus:ring-4 focus:ring-[var(--rashid-color-42bfa8)]/10" />
              </label>

              <label className="block">
                <span className="mb-2 block font-black text-[var(--rashid-color-0b4d6b)]">اسم المستخدم للطفل</span>
                <input required value={username} onChange={(e) => setUsername(normalizeUsername(e.target.value))} placeholder="مثال: sami-7" className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] bg-[var(--rashid-color-fafffd)] px-5 py-4 font-bold lowercase outline-none transition focus:border-[var(--rashid-color-42bfa8)] focus:ring-4 focus:ring-[var(--rashid-color-42bfa8)]/10" />
                <p className="mt-2 text-sm font-bold text-[var(--rashid-color-6e7a99)]">استخدم حروف إنجليزية وأرقام فقط. مثال: rashid123</p>
              </label>

              <div className="block rounded-[2rem] border border-[var(--rashid-color-ddedea)] bg-[var(--rashid-color-fafffd)] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="font-black text-[var(--rashid-color-0b4d6b)]">العمر</span>
                  <span className="rounded-full bg-[var(--rashid-color-ecfbf7)] px-5 py-2 text-lg font-black text-[var(--rashid-color-0b4d6b)]">{age} سنوات</span>
                </div>

                <input
                  type="range"
                  min={5}
                  max={9}
                  step={1}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[var(--rashid-color-42bfa8)]"
                />

                <div className="mt-3 flex justify-between text-sm font-black text-[var(--rashid-color-6e7a99)]">
                  {[5, 6, 7, 8, 9].map((year) => (
                    <span key={year}>{year}</span>
                  ))}
                </div>

                <p className="mt-3 text-sm font-bold text-[var(--rashid-color-6e7a99)]">المنصة مخصصة حاليًا للأعمار من 5 إلى 9 سنوات.</p>
              </div>

              <div>
                <span className="mb-3 block font-black text-[var(--rashid-color-0b4d6b)]">الجنس</span>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setGender("male")} className={`rounded-[2rem] border-2 p-6 transition ${gender === "male" ? "border-[var(--rashid-color-42bfa8)] bg-[var(--rashid-color-ecfbf7)] shadow-lg" : "border-[var(--rashid-color-e5eef1)] bg-white"}`}>
                    <div className="text-7xl">👦</div>
                    <div className="mt-3 text-xl font-black text-[var(--rashid-color-0b4d6b)]">ولد</div>
                  </button>
                  <button type="button" onClick={() => setGender("female")} className={`rounded-[2rem] border-2 p-6 transition ${gender === "female" ? "border-[var(--rashid-color-ff8fb3)] bg-[var(--rashid-color-fff0f6)] shadow-lg" : "border-[var(--rashid-color-e5eef1)] bg-white"}`}>
                    <div className="text-7xl">👧</div>
                    <div className="mt-3 text-xl font-black text-[var(--rashid-color-0b4d6b)]">بنت</div>
                  </button>
                </div>
              </div>

              <div className="grid gap-3 pt-4 md:grid-cols-2">
                <Link href="/dashboard/children" className="rounded-full bg-[var(--rashid-color-f4faf8)] px-8 py-4 text-center font-black text-[var(--rashid-color-0b4d6b)]">إلغاء</Link>
                <button disabled={loading} className="rounded-full bg-[var(--rashid-color-42bfa8)] px-8 py-4 font-black text-white shadow-lg disabled:opacity-50">
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب الطفل"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
