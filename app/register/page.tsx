
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type GuardianType = "father" | "mother" | "guardian";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [guardianType, setGuardianType] = useState<GuardianType>("father");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

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
      role: "parent",
      full_name: fullName,
      guardian_type: guardianType,
      plan: "free",
    });

    setLoading(false);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#F5FBFF] text-[#14224A]">
      <style>{`
        @keyframes authFloatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes authFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .auth-float-y{animation:authFloatY 5s ease-in-out infinite}
        .auth-fade-up{animation:authFadeUp .75s ease both}
        .auth-glass{background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(255,255,255,.68));border:1px solid rgba(255,255,255,.82);box-shadow:0 30px 90px rgba(20,34,74,.16);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .auth-input{height:58px;width:100%;border-radius:22px;border:1px solid rgba(14,159,170,.18);background:rgba(255,255,255,.92);padding:0 18px;font-weight:800;outline:none;color:#14224A;box-shadow:0 10px 28px rgba(20,34,74,.06);transition:.2s ease}
        .auth-input:focus{border-color:rgba(14,159,170,.65);box-shadow:0 0 0 5px rgba(25,198,212,.12),0 14px 34px rgba(20,34,74,.08)}
      `}</style>

      <div className="absolute inset-0">
        <img src="/images/rashid-hero-bg.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-white/70 via-white/40 to-white/70" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F5FBFF] to-transparent" />
      </div>

      <div className="absolute left-[8%] top-[20%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-y">📚</div>
      <div className="absolute right-[9%] bottom-[16%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-y">⭐</div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[.88fr_1fr]">
        <section className="hidden lg:block auth-fade-up">
          <div className="relative overflow-hidden rounded-[46px] auth-glass p-10">
            <Link href="/"><img src="/images/logo-horrizental.png" alt="راشد" className="h-24 w-auto drop-shadow-xl" /></Link>
            <div className="mt-10 inline-flex rounded-full bg-white/80 px-5 py-2 text-sm font-black text-[#0E9FAA] shadow-lg">حساب ولي الأمر أولًا 🌱</div>
            <h1 className="mt-7 text-6xl font-black leading-[1.2] tracking-[-.03em] text-[#101B3D]">
              أنشئ حسابك
              <br />
              وأضف أبناءك من
              <span className="text-[#0E9FAA]"> لوحة التحكم</span>
            </h1>
            <p className="mt-6 max-w-xl text-xl font-bold leading-10 text-[#40506F]">
              في راشد ولي الأمر هو من ينشئ حسابات الأطفال ويتابع تقدمهم، والطفل يدخل لاحقًا باسم مستخدم وكود دخول آمن.
            </p>
            <div className="mt-10 space-y-4">
              {[["👨‍👩‍👧", "حساب ولي أمر واحد لإدارة الأبناء"], ["🔐", "دخول الطفل بكود بسيط من ولي الأمر"], ["🏆", "متابعة XP والبرامج والشهادات"]].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-4 rounded-[26px] bg-white/76 p-5 shadow-lg">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#19C6D4] to-[#0E9FAA] text-3xl shadow-lg">{icon}</span>
                  <span className="text-lg font-black text-[#14224A]">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <form onSubmit={handleRegister} className="relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[42px] auth-glass p-6 md:p-9 auth-fade-up">
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#19C6D4]/20 blur-3xl" />
          <div className="absolute -bottom-20 right-8 h-44 w-44 rounded-full bg-[#FFD54A]/20 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link href="/"><img src="/images/logo-horrizental.png" alt="راشد" className="h-16 w-auto" /></Link>
              <button type="button" onClick={() => router.push("/login")} className="rounded-full bg-white/80 px-5 py-3 text-sm font-black text-[#0E9FAA] shadow-lg transition hover:-translate-y-1">لدي حساب</button>
            </div>

            <div className="mb-7">
              <p className="text-sm font-black text-[#0E9FAA]">تسجيل ولي أمر</p>
              <h2 className="mt-2 text-3xl font-black text-[#101B3D] md:text-4xl">بيانات ولي الأمر</h2>
              <p className="mt-3 font-bold leading-8 text-[#566681]">بعد إنشاء الحساب ستتمكن من إضافة الأطفال وإعطائهم اسم مستخدم وكود دخول.</p>
            </div>

            <div className="space-y-4">
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسم ولي الأمر الكامل" className="auth-input" />

              <div className="grid grid-cols-3 gap-3">
                {[["father", "أب", "👨"], ["mother", "أم", "👩"], ["guardian", "وصي", "🧑"]].map(([value, label, icon]) => (
                  <button key={value} type="button" onClick={() => setGuardianType(value as GuardianType)} className={`rounded-[24px] border-2 p-4 font-black transition ${guardianType === value ? "border-[#19C6D4] bg-[#E9FBFC] text-[#14224A] shadow-lg" : "border-white/70 bg-white/75 text-[#566681]"}`}>
                    <div className="text-3xl">{icon}</div>
                    {label}
                  </button>
                ))}
              </div>

              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="auth-input" />
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="auth-input" />

              <button disabled={loading} className="mt-3 w-full rounded-full bg-gradient-to-r from-[#19C6D4] to-[#0E9FAA] py-4 font-black text-white shadow-xl shadow-[#19C6D4]/25 transition hover:-translate-y-1 disabled:opacity-50">
                {loading ? "جاري الإنشاء..." : "إنشاء حساب ولي الأمر"}
              </button>

              <Link href="/child-login" className="block text-center font-black text-[#8B5CF6] transition hover:text-[#6847F5]">
                دخول الطفل باسم المستخدم والكود
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
