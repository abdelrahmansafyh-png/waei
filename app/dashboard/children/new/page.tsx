
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ParentLayout from "@/components/parent/ParentLayout";

type Gender = "male" | "female";
type Mode = "create" | "link";

export default function NewChildPage() {
  const router = useRouter();

  const [parentProfile, setParentProfile] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("create");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState(7);
  const [gender, setGender] = useState<Gender>("male");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    loadParent();
  }, []);

  async function loadParent() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function createChild(e: React.FormEvent) {
    e.preventDefault();

    if (!parentProfile?.id) return;

    setLoading(true);

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
          nickname,
          age,
          gender,
          email,
          password,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        alert(json.message || "فشل إنشاء حساب الطفل");
        setLoading(false);
        return;
      }

      router.push("/dashboard/children");
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  }

  async function linkChild(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const token = await getToken();

      const res = await fetch("/api/parent/link-child", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          access_code: accessCode,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        alert(json.message || "فشل ربط حساب الطفل");
        setLoading(false);
        return;
      }

      router.push("/dashboard/children");
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  }

  return (
    <ParentLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard/children"
            className="inline-flex rounded-full bg-white px-6 py-4 font-black text-[#0B4D6B] shadow-sm"
          >
            ← رجوع للأبناء
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2.8rem] bg-white/95 p-8 shadow-[0_18px_45px_rgba(62,87,120,.13)]">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
              إضافة طفل
            </div>

            <h1 className="text-5xl font-black leading-[1.2] text-[#20294f]">
              كيف تريد إضافة الطفل؟ 👦
            </h1>

            <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-[#667085]">
              يمكنك إنشاء حساب جديد للطفل بإيميل وكلمة مرور، أو ربط حساب طفل موجود باستخدام كود الربط.
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded-[2rem] border-2 p-6 text-right transition ${
                mode === "create"
                  ? "border-[#42BFA8] bg-[#ECFBF7] shadow-lg"
                  : "border-[#E5EEF1] bg-white"
              }`}
            >
              <div className="text-5xl">🆕</div>
              <h2 className="mt-3 text-2xl font-black text-[#0B4D6B]">
                إنشاء حساب طفل جديد
              </h2>
              <p className="mt-2 font-bold leading-7 text-[#6E7A99]">
                أدخل بيانات الطفل والإيميل وكلمة المرور ليصبح له حساب مستقل.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("link")}
              className={`rounded-[2rem] border-2 p-6 text-right transition ${
                mode === "link"
                  ? "border-[#7048e8] bg-[#F3EFFF] shadow-lg"
                  : "border-[#E5EEF1] bg-white"
              }`}
            >
              <div className="text-5xl">🔗</div>
              <h2 className="mt-3 text-2xl font-black text-[#0B4D6B]">
                ربط حساب طفل موجود
              </h2>
              <p className="mt-2 font-bold leading-7 text-[#6E7A99]">
                أدخل كود الربط الذي يظهر في حساب الطفل.
              </p>
            </button>
          </div>

          {mode === "create" ? (
            <form onSubmit={createChild} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block font-black text-[#0B4D6B]">
                    اسم الطفل الكامل
                  </span>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: سامي محمد"
                    className="w-full rounded-2xl border border-[#DDEDEA] bg-[#FAFFFD] px-5 py-4 font-bold outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block font-black text-[#0B4D6B]">
                    الاسم المفضل
                  </span>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="مثال: سامي"
                    className="w-full rounded-2xl border border-[#DDEDEA] bg-[#FAFFFD] px-5 py-4 font-bold outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block font-black text-[#0B4D6B]">
                    إيميل الطفل
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="child@email.com"
                    className="w-full rounded-2xl border border-[#DDEDEA] bg-[#FAFFFD] px-5 py-4 font-bold outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block font-black text-[#0B4D6B]">
                    كلمة مرور الطفل
                  </span>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="w-full rounded-2xl border border-[#DDEDEA] bg-[#FAFFFD] px-5 py-4 font-bold outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                  />
                </label>
              </div>

              <div className="rounded-[2rem] border border-[#DDEDEA] bg-[#FAFFFD] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-black text-[#0B4D6B]">العمر</span>
                  <span className="rounded-full bg-[#F3EFFF] px-5 py-2 font-black text-[#7048e8]">
                    {age} سنوات
                  </span>
                </div>

                <input
                  type="range"
                  min={4}
                  max={14}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <span className="mb-3 block font-black text-[#0B4D6B]">
                  الجنس
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`rounded-[2rem] border-2 p-6 transition ${
                      gender === "male"
                        ? "border-[#42BFA8] bg-[#ECFBF7] shadow-lg"
                        : "border-[#E5EEF1] bg-white"
                    }`}
                  >
                    <div className="text-7xl">👦</div>
                    <div className="mt-3 text-xl font-black text-[#0B4D6B]">
                      ولد
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`rounded-[2rem] border-2 p-6 transition ${
                      gender === "female"
                        ? "border-[#FF8FB3] bg-[#FFF0F6] shadow-lg"
                        : "border-[#E5EEF1] bg-white"
                    }`}
                  >
                    <div className="text-7xl">👧</div>
                    <div className="mt-3 text-xl font-black text-[#0B4D6B]">
                      بنت
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid gap-3 pt-4 md:grid-cols-2">
                <Link
                  href="/dashboard/children"
                  className="rounded-full bg-[#F4FAF8] px-8 py-4 text-center font-black text-[#0B4D6B]"
                >
                  إلغاء
                </Link>

                <button
                  disabled={loading}
                  className="rounded-full bg-[#42BFA8] px-8 py-4 font-black text-white shadow-lg disabled:opacity-50"
                >
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب الطفل"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={linkChild} className="space-y-5">
              <div className="rounded-[2rem] bg-[#F3EFFF] p-6">
                <h2 className="text-2xl font-black text-[#0B4D6B]">
                  ربط حساب موجود 🔗
                </h2>

                <p className="mt-2 font-bold leading-8 text-[#6E7A99]">
                  اطلب من الطفل فتح حسابه ونسخ كود الربط، ثم أدخله هنا.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block font-black text-[#0B4D6B]">
                  كود الربط
                </span>

                <input
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="مثال: AB12CD"
                  className="w-full rounded-2xl border border-[#DDEDEA] bg-[#FAFFFD] px-5 py-4 text-center text-2xl font-black tracking-[0.3em] outline-none transition focus:border-[#7048e8] focus:ring-4 focus:ring-[#7048e8]/10"
                />
              </label>

              <div className="grid gap-3 pt-4 md:grid-cols-2">
                <Link
                  href="/dashboard/children"
                  className="rounded-full bg-[#F4FAF8] px-8 py-4 text-center font-black text-[#0B4D6B]"
                >
                  إلغاء
                </Link>

                <button
                  disabled={loading}
                  className="rounded-full bg-[#7048e8] px-8 py-4 font-black text-white shadow-lg disabled:opacity-50"
                >
                  {loading ? "جاري الربط..." : "ربط الطفل"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
