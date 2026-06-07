"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Role = "parent" | "child";
type Gender = "male" | "female";
type GuardianType = "father" | "mother" | "guardian";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("parent");

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState(7);
  const [gender, setGender] = useState<Gender>("male");
  const [guardianType, setGuardianType] = useState<GuardianType>("father");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      alert("فشل إنشاء الحساب");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      role,
      full_name: fullName,
      nickname: role === "child" ? nickname || fullName : null,
      age: role === "child" ? age : null,
      gender: role === "child" ? gender : null,
      guardian_type: role === "parent" ? guardianType : null,
      plan: "free",
    });

    setLoading(false);

    if (profileError) {
      alert(profileError.message);
      return;
    }
        router.push("/dashboard");

    // router.push("/check-email");
  }

  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#F2FBF8] relative">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#42BFA8]/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#7C5CFF]/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_1.1fr]">
        <section className="hidden lg:block">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-[#E7F8FF] to-[#E8FFF4] p-10 shadow-xl">
            <img src="/images/logo.png" alt="واعي" className="mb-8 h-28 w-auto" />

            <h1 className="text-5xl font-black leading-[1.25] text-[#0B4D6B]">
              أهلاً بك في واعي
            </h1>

            <p className="mt-5 max-w-md text-lg font-semibold leading-9 text-[#587086]">
              منصة تفاعلية تساعد الأطفال على تنمية وعيهم ومهاراتهم بطريقة آمنة وممتعة.
            </p>

            <div className="mt-10 rounded-[2rem] bg-white/70 p-6">
              <p className="mt-4 font-bold leading-8 text-[#0B4D6B]">
                سنبني تجربة مناسبة سواء كنت ولي أمر تريد متابعة أبنائك، أو طفل يريد التعلم واللعب.
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleRegister} className="rounded-[2.5rem] bg-white p-6 shadow-2xl md:p-9">
          <div className="mb-8 flex items-center justify-between">
            <img src="/images/logo.png" alt="واعي" className="h-16 w-auto" />

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full bg-[#F2FBF8] px-5 py-3 text-sm font-black text-[#0B4D6B]"
            >
              لدي حساب
            </button>
          </div>

          <div className="mb-7">
            <p className="text-sm font-black text-[#42BFA8]">الخطوة {step} من 2</p>
            <h2 className="mt-2 text-3xl font-black text-[#0B4D6B]">
              {step === 1 ? "من أنت؟" : role === "parent" ? "بيانات ولي الأمر" : "بيانات الطفل"}
            </h2>
          </div>

          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("parent")}
                className={`rounded-[2rem] border-2 p-6 text-center transition ${
                  role === "parent"
                    ? "border-[#42BFA8] bg-[#ECFBF7] shadow-lg"
                    : "border-[#E5EEF1] bg-white"
                }`}
              >
                <div className="text-6xl">👨‍👩‍👧</div>
                <h3 className="mt-4 text-2xl font-black text-[#0B4D6B]">ولي أمر</h3>
                <p className="mt-2 font-semibold leading-7 text-[#6E7A99]">
                  أريد متابعة أبنائي والاطلاع على تقدمهم.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole("child")}
                className={`rounded-[2rem] border-2 p-6 text-center transition ${
                  role === "child"
                    ? "border-[#7C5CFF] bg-[#F3EFFF] shadow-lg"
                    : "border-[#E5EEF1] bg-white"
                }`}
              >
                <div className="text-6xl">🧒</div>
                <h3 className="mt-4 text-2xl font-black text-[#0B4D6B]">طفل / طالب</h3>
                <p className="mt-2 font-semibold leading-7 text-[#6E7A99]">
                  أريد التعلم واللعب وتطوير مهاراتي.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="md:col-span-2 mt-3 rounded-full bg-[#42BFA8] py-4 font-black text-white shadow-lg"
              >
                التالي
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === "parent" ? "اسم ولي الأمر الكامل" : "اسم الطفل الكامل"}
                className="w-full rounded-2xl border border-[#DDEDEA] px-5 py-4 font-bold outline-none"
              />

              {role === "parent" && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["father", "أب", "👨"],
                    ["mother", "أم", "👩"],
                    ["guardian", "وصي", "🧑"],
                  ].map(([value, label, icon]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGuardianType(value as GuardianType)}
                      className={`rounded-2xl border-2 p-4 font-black ${
                        guardianType === value
                          ? "border-[#42BFA8] bg-[#ECFBF7] text-[#0B4D6B]"
                          : "border-[#E5EEF1]"
                      }`}
                    >
                      <div className="text-3xl">{icon}</div>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {role === "child" && (
                <>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="اسمك المفضل"
                    className="w-full rounded-2xl border border-[#DDEDEA] px-5 py-4 font-bold outline-none"
                  />

                  <div className="rounded-2xl border border-[#DDEDEA] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-black text-[#0B4D6B]">العمر</span>
                      <span className="rounded-full bg-[#F3EFFF] px-5 py-2 font-black text-[#7C5CFF]">
                        {age} سنوات
                      </span>
                    </div>

                    <input
                      type="range"
                      min={4}
                      max={12}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={`rounded-[2rem] border-2 p-5 ${
                        gender === "male"
                          ? "border-[#42BFA8] bg-[#ECFBF7]"
                          : "border-[#E5EEF1]"
                      }`}
                    >
                      <div className="text-6xl">👦</div>
                      <div className="mt-2 font-black text-[#0B4D6B]">ولد</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={`rounded-[2rem] border-2 p-5 ${
                        gender === "female"
                          ? "border-[#FF8FB3] bg-[#FFF0F6]"
                          : "border-[#E5EEF1]"
                      }`}
                    >
                      <div className="text-6xl">👧</div>
                      <div className="mt-2 font-black text-[#0B4D6B]">بنت</div>
                    </button>
                  </div>
                </>
              )}

              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="w-full rounded-2xl border border-[#DDEDEA] px-5 py-4 font-bold outline-none"
              />

              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full rounded-2xl border border-[#DDEDEA] px-5 py-4 font-bold outline-none"
              />

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full bg-[#F2FBF8] py-4 font-black text-[#0B4D6B]"
                >
                  رجوع
                </button>

                <button
                  disabled={loading}
                  className="rounded-full bg-[#42BFA8] py-4 font-black text-white shadow-lg disabled:opacity-50"
                >
                  {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}