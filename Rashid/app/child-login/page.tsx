"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export default function ChildLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "صباح الخير" : "مساء الخير";
  }, []);

  async function handleChildLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/child-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalizeUsername(username),
          access_code: accessCode,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        alert(json.message || "بيانات الدخول غير صحيحة");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: json.email,
        password: json.access_code,
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      setLoading(false);
      alert(error.message || "حدث خطأ غير متوقع");
    }
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[var(--rashid-color-f5fbff)] text-[var(--rashid-color-14224a)]">
      <style>{`
        @keyframes authFloatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes authFloatX { 0%,100%{transform:translateX(0) rotate(0)} 50%{transform:translateX(12px) rotate(5deg)} }
        @keyframes authFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .auth-float-y{animation:authFloatY 5s ease-in-out infinite}
        .auth-float-x{animation:authFloatX 6s ease-in-out infinite}
        .auth-fade-up{animation:authFadeUp .75s ease both}
        .auth-glass{background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(255,255,255,.68));border:1px solid rgba(255,255,255,.82);box-shadow:0 30px 90px rgba(20,34,74,.16);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .auth-input{height:58px;width:100%;border-radius:22px;border:1px solid rgba(14,159,170,.18);background:rgba(255,255,255,.92);padding:0 54px 0 18px;font-weight:800;outline:none;color:var(--rashid-color-14224a);box-shadow:0 10px 28px rgba(20,34,74,.06);transition:.2s ease}
        .auth-input:focus{border-color:rgba(14,159,170,.65);box-shadow:0 0 0 5px rgba(25,198,212,.12),0 14px 34px rgba(20,34,74,.08)}
      `}</style>

      <div className="absolute inset-0">
        <img src="/images/rashid-hero-bg.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-white/68 via-white/36 to-white/64" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[var(--rashid-color-f5fbff)] to-transparent" />
      </div>

      <div className="absolute right-[7%] top-[18%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-y">⭐</div>
      <div className="absolute left-[10%] top-[24%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-x">🎮</div>
      <div className="absolute bottom-[18%] right-[14%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-x">📚</div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_.86fr]">
        <section className="hidden lg:block auth-fade-up">
          <div className="relative overflow-hidden rounded-[46px] auth-glass p-10">
            <Link href="/" className="inline-flex">
              <img src="/images/logo-horrizental.png" alt="راشد" className="h-24 w-auto drop-shadow-xl" />
            </Link>

            <div className="mt-10 inline-flex rounded-full bg-white/80 px-5 py-2 text-sm font-black text-[var(--rashid-color-0e9faa)] shadow-lg">
              دخول الطفل بالكود ✨
            </div>

            <h1 className="mt-7 max-w-2xl text-6xl font-black leading-[1.18] tracking-[-.03em] text-[var(--rashid-color-101b3d)]">
              {greeting}
              <br />
              جاهز نكمل
              <span className="text-[var(--rashid-color-0e9faa)]"> رحلة راشد؟</span>
            </h1>

            <p className="mt-6 max-w-xl text-xl font-bold leading-10 text-[var(--rashid-color-40506f)]">
              أدخل اسم المستخدم وكود الدخول الذي أعطاه لك ولي الأمر، وابدأ برامجك وألعابك بأمان.
            </p>
          </div>
        </section>

        <section className="auth-fade-up">
          <form onSubmit={handleChildLogin} className="relative mx-auto max-w-[520px] overflow-hidden rounded-[42px] auth-glass p-6 md:p-9">
            <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[var(--rashid-color-19c6d4)]/20 blur-3xl" />
            <div className="absolute -bottom-20 right-8 h-44 w-44 rounded-full bg-[var(--rashid-color-ffd54a)]/20 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 text-center">
                <Link href="/">
                  <img src="/images/logo-horrizental.png" alt="راشد" className="mx-auto mb-5 h-20 w-auto transition hover:scale-105" />
                </Link>

                <div className="mx-auto mb-4 inline-flex rounded-full bg-[var(--rashid-color-e9fbfc)] px-5 py-2 text-sm font-black text-[var(--rashid-color-0e9faa)]">
                  دخول الطفل
                </div>

                <h2 className="text-4xl font-black text-[var(--rashid-color-101b3d)] md:text-5xl">أهلاً يا بطل</h2>
                <p className="mt-4 text-lg font-bold leading-8 text-[var(--rashid-color-566681)]">اكتب بيانات الدخول التي أنشأها ولي الأمر.</p>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block font-black text-[var(--rashid-color-14224a)]">اسم المستخدم</span>
                  <div className="relative">
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl">🧒</span>
                    <input required value={username} onChange={(e) => setUsername(normalizeUsername(e.target.value))} placeholder="sami-7" className="auth-input lowercase" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block font-black text-[var(--rashid-color-14224a)]">كود الدخول</span>
                  <div className="relative">
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl">🔑</span>
                    <input required value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} placeholder="ABC123" className="auth-input uppercase tracking-[.18em]" />
                  </div>
                </label>

                <button disabled={loading} className="w-full rounded-full bg-gradient-to-r from-[var(--rashid-color-19c6d4)] to-[var(--rashid-color-0e9faa)] py-4 text-lg font-black text-white shadow-xl shadow-[var(--rashid-color-19c6d4)]/25 transition hover:-translate-y-1 disabled:opacity-50">
                  {loading ? "جاري الدخول..." : "ادخل إلى حسابي"}
                </button>

                <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm font-black">
                  <Link href="/login" className="text-[var(--rashid-color-0e9faa)] hover:text-[var(--rashid-color-087985)]">دخول ولي الأمر</Link>
                  <Link href="/register" className="text-[var(--rashid-color-8b5cf6)] hover:text-[var(--rashid-color-6847f5)]">إنشاء حساب ولي أمر</Link>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
