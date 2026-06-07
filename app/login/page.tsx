"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "🌞 صباح الخير";
    if (hour < 18) return "✨ مساء الخير";
    return "🌙 مساء الخير";
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#F3FBF8]"
    >
      {/* blobs */}
      <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#42BFA8]/20 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-[#7C5CFF]/20 blur-3xl" />
      <div className="absolute left-1/3 top-0 h-52 w-52 rounded-full bg-[#D8F36A]/20 blur-3xl" />

      {/* floating emojis */}
     <div className="absolute right-10 top-20 animate-pulse rounded-full bg-white/90 p-3 shadow-2xl backdrop-blur">
        <img
            src="/images/logo.png"
            alt="واعي"
            className="h-16 w-16 object-contain"
        />
    </div>

      <div className="absolute left-16 top-32 animate-pulse rounded-full bg-white px-5 py-3 text-3xl shadow-xl">
        ⭐
      </div>

      <div className="absolute bottom-20 right-24 animate-bounce rounded-full bg-white px-5 py-3 text-3xl shadow-xl">
        🧠
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[1.1fr_.9fr]">
        {/* LEFT */}
        <section className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0B4D6B] via-[#12617F] to-[#2D9B87] p-10 text-white shadow-2xl">
            {/* circles */}
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full border border-white/10" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full border border-white/10" />

            {/* logo */}
            <div className="relative z-10">
              {/* <img
                src="/images/logo.png"
                alt="واعي"
                className="mb-8 h-28 w-auto rounded-3xl bg-white/10 p-2 backdrop-blur"
              /> */}

              <div className="mb-5 inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-black text-[#D8F36A] backdrop-blur">
                وعي · انتباه · عمق · ينمو
              </div>

              <h1 className="max-w-xl text-6xl font-black leading-[1.2]">
                {greeting}
                <br />
                أهلاً بعودتك إلى
                <span className="text-[#D8F36A]"> واعي</span>
              </h1>

              <p className="mt-6 max-w-lg text-xl leading-10 text-white/75">
                تابع البرامج، الأنشطة، ونتائج الطفل بطريقة ممتعة وآمنة تساعده
                على النمو والثقة بالنفس.
              </p>

              {/* cards */}
              <div className="mt-12 grid grid-cols-3 gap-4">
                {[
                  ["🧠", "وعي"],
                  ["🎯", "تركيز"],
                  ["🏆", "تقدم"],
                ].map(([icon, text]) => (
                  <div
                    key={text}
                    className="rounded-[2rem] bg-white/10 p-5 text-center backdrop-blur"
                  >
                    <div className="text-5xl">{icon}</div>

                    <div className="mt-3 text-lg font-black">
                      {text}
                    </div>
                  </div>
                ))}
              </div>

              {/* mascot */}
              <div className="mt-12 flex items-center gap-5 rounded-[2rem] bg-white/10 p-6 backdrop-blur">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-6xl shadow-xl">
                  <img
                    src="/images/logo.png"
                    alt="واعي"
                />
                </div>

                <div>
                  <h3 className="text-2xl font-black">
                    واعي رفيقك الذكي
                  </h3>

                  <p className="mt-2 leading-8 text-white/75">
                    يساعد الطفل على التعلم، اللعب، وبناء عادات صحية بطريقة ممتعة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <section>
          <form
            onSubmit={handleLogin}
            className="relative overflow-hidden rounded-[3rem] border border-white/50 bg-white/80 p-7 shadow-2xl backdrop-blur-xl md:p-10"
          >
            {/* form glow */}
            <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#42BFA8]/20 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 text-center">
                <Link href="/">
                  <img
                    src="/images/logo.png"
                    alt="واعي"
                    className="mx-auto mb-5 h-28 w-auto transition hover:scale-105"
                  />
                </Link>

                <h2 className="text-5xl font-black text-[#0B4D6B]">
                  تسجيل الدخول
                </h2>

                <p className="mt-4 text-lg font-semibold leading-8 text-[#6E7A99]">
                  سجّل دخولك للمتابعة في رحلتك التعليمية.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block font-black text-[#0B4D6B]">
                    البريد الإلكتروني
                  </label>

                  <div className="flex items-center rounded-2xl border border-[#DDEDEA] bg-white px-4 shadow-sm transition focus-within:border-[#42BFA8] focus-within:ring-4 focus-within:ring-[#42BFA8]/10">
                    <span className="text-2xl">📧</span>

                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="h-14 w-full bg-transparent px-4 font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-black text-[#0B4D6B]">
                    كلمة المرور
                  </label>

                  <div className="flex items-center rounded-2xl border border-[#DDEDEA] bg-white px-4 shadow-sm transition focus-within:border-[#42BFA8] focus-within:ring-4 focus-within:ring-[#42BFA8]/10">
                    <span className="text-2xl">🔒</span>

                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 w-full bg-transparent px-4 font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    className="font-bold text-[#2D9B87]"
                  >
                    نسيت كلمة المرور؟
                  </button>

                  <div className="text-sm font-semibold text-[#6E7A99]">
                    آمن ومحمي 🔐
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="mt-3 w-full rounded-full bg-gradient-to-r from-[#0B4D6B] to-[#2D9B87] py-4 text-lg font-black text-white shadow-xl transition hover:-translate-y-1 disabled:opacity-50"
                >
                  {loading ? "جاري تسجيل الدخول..." : "الدخول إلى واعي"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="w-full rounded-full bg-[#ECFBF7] py-4 text-lg font-black text-[#0B4D6B] transition hover:bg-[#D9F5EE]"
                >
                  إنشاء حساب جديد
                </button>
              </div>

              {/* bottom badge */}
              <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-[#F3FBF8] p-4">
                <div className="text-3xl">✨</div>

                <p className="font-bold text-[#0B4D6B]">
                  أكثر من مجرد منصة تعليمية للأطفال
                </p>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}