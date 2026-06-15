"use client";

import { useMemo, useState } from "react";
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
    if (hour < 12) return "صباح الخير";
    if (hour < 18) return "مساء الخير";
    return "مساء الخير";
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
      className="relative min-h-screen overflow-hidden bg-[#F5FBFF] text-[#14224A]"
    >
      <style>{`
        @keyframes authFloatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes authFloatX {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(12px) rotate(5deg); }
        }
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-float-y { animation: authFloatY 5s ease-in-out infinite; }
        .auth-float-x { animation: authFloatX 6s ease-in-out infinite; }
        .auth-fade-up { animation: authFadeUp .75s ease both; }
        .auth-glass {
          background: linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.68));
          border: 1px solid rgba(255,255,255,.82);
          box-shadow: 0 30px 90px rgba(20,34,74,.16);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .auth-input {
          height: 58px;
          width: 100%;
          border-radius: 22px;
          border: 1px solid rgba(14,159,170,.18);
          background: rgba(255,255,255,.92);
          padding: 0 54px 0 18px;
          font-weight: 800;
          outline: none;
          color: #14224A;
          box-shadow: 0 10px 28px rgba(20,34,74,.06);
          transition: .2s ease;
        }
        .auth-input:focus {
          border-color: rgba(14,159,170,.65);
          box-shadow: 0 0 0 5px rgba(25,198,212,.12), 0 14px 34px rgba(20,34,74,.08);
        }
      `}</style>

      <div className="absolute inset-0">
        <img
          src="/images/rashid-hero-bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-white/68 via-white/36 to-white/64" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F5FBFF] to-transparent" />
      </div>

      <div className="absolute right-[7%] top-[18%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-y">
        ⭐
      </div>
      <div className="absolute left-[10%] top-[24%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-x">
        🎮
      </div>
      <div className="absolute bottom-[18%] right-[14%] hidden rounded-full bg-white/80 px-5 py-3 text-2xl shadow-xl backdrop-blur md:block auth-float-x">
        📚
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_.86fr]">
        <section className="hidden lg:block auth-fade-up">
          <div className="relative overflow-hidden rounded-[46px] auth-glass p-10">
            <Link href="/" className="inline-flex">
              <img
                src="/images/logo-horrizental.png"
                alt="راشد"
                className="h-24 w-auto drop-shadow-xl"
              />
            </Link>

            <div className="mt-10 inline-flex rounded-full bg-white/80 px-5 py-2 text-sm font-black text-[#0E9FAA] shadow-lg">
              منصة تعليمية تفاعلية للأطفال ✨
            </div>

            <h1 className="mt-7 max-w-2xl text-6xl font-black leading-[1.18] tracking-[-.03em] text-[#101B3D]">
              {greeting}
              <br />
              أهلاً بعودتك إلى
              <span className="text-[#0E9FAA]"> راشد</span>
            </h1>

            <p className="mt-6 max-w-xl text-xl font-bold leading-10 text-[#40506F]">
              تابع رحلة الطفل، البرامج، الألعاب والقصص التفاعلية من مكان واحد
              بطريقة آمنة ومرحة.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                ["🎮", "ألعاب تعليمية"],
                ["🎭", "قصص تفاعلية"],
                ["🏆", "تقدم وتحفيز"],
              ].map(([icon, title]) => (
                <div
                  key={title}
                  className="rounded-[28px] bg-white/78 p-5 text-center shadow-xl"
                >
                  <div className="text-4xl">{icon}</div>
                  <div className="mt-3 text-base font-black text-[#14224A]">
                    {title}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[32px] bg-gradient-to-r from-[#19C6D4]/15 to-[#FFD54A]/20 p-6">
              <h3 className="text-2xl font-black text-[#14224A]">
                كل نشاط داخل راشد مصمم ليدعم الطفل
              </h3>
              <p className="mt-3 font-bold leading-8 text-[#40506F]">
                تعلم باللعب، قياس للتقدم، وبيئة مناسبة لأولياء الأمور والأطفال.
              </p>
            </div>
          </div>
        </section>

        <section className="auth-fade-up">
          <form
            onSubmit={handleLogin}
            className="relative mx-auto max-w-[520px] overflow-hidden rounded-[42px] auth-glass p-6 md:p-9"
          >
            <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#19C6D4]/20 blur-3xl" />
            <div className="absolute -bottom-20 right-8 h-44 w-44 rounded-full bg-[#FFD54A]/20 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 text-center">
                <Link href="/">
                  <img
                    src="/images/logo-horrizental.png"
                    alt="راشد"
                    className="mx-auto mb-5 h-20 w-auto transition hover:scale-105"
                  />
                </Link>

                <div className="mx-auto mb-4 inline-flex rounded-full bg-[#E9FBFC] px-5 py-2 text-sm font-black text-[#0E9FAA]">
                  أهلاً بك من جديد
                </div>

                <h2 className="text-4xl font-black text-[#101B3D] md:text-5xl">
                  تسجيل الدخول
                </h2>

                <p className="mt-4 text-lg font-bold leading-8 text-[#566681]">
                  ادخل لحسابك وتابع رحلة التعلم واللعب.
                </p>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block font-black text-[#14224A]">
                    البريد الإلكتروني
                  </span>
                  <div className="relative">
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl">
                      📧
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="auth-input"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block font-black text-[#14224A]">
                    كلمة المرور
                  </span>
                  <div className="relative">
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl">
                      🔒
                    </span>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input"
                    />
                  </div>
                </label>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    className="font-black text-[#0E9FAA] transition hover:text-[#087985]"
                  >
                    نسيت كلمة المرور؟
                  </button>

                  <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#566681] shadow-sm">
                    آمن ومحمي 🔐
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="mt-3 w-full rounded-full bg-gradient-to-r from-[#19C6D4] to-[#0E9FAA] py-4 text-lg font-black text-white shadow-xl shadow-[#19C6D4]/25 transition hover:-translate-y-1 disabled:opacity-50"
                >
                  {loading ? "جاري تسجيل الدخول..." : "الدخول إلى راشد"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="w-full rounded-full border border-[#19C6D4]/25 bg-white/80 py-4 text-lg font-black text-[#0E9FAA] shadow-lg transition hover:-translate-y-1"
                >
                  إنشاء حساب جديد
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 rounded-[24px] bg-white/70 p-4 shadow-sm">
                <div className="text-3xl">🌟</div>
                <p className="font-black text-[#14224A]">
                  تعلم، العب، واكتشف مع راشد
                </p>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
