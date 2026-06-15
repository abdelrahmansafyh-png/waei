"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@rashid.app");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    setLoading(false);

    if (error || !data) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    localStorage.setItem("rashid_admin", JSON.stringify(data));
    router.push("/admin");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4FAF8] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <img src="/images/logo.png" alt="راشد" className="mx-auto h-24 w-auto" />
          <h1 className="mt-4 text-3xl font-black text-[#0B4D6B]">
            دخول الأدمن
          </h1>
          <p className="mt-2 text-[#6E7A99]">
            لوحة تحكم منصة راشد
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block font-bold text-[#0B4D6B]">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rashid.app"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-[#0B4D6B]">
              كلمة المرور
            </label>
            <input
              type="password"
              className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#42BFA8] py-4 font-black text-white transition hover:-translate-y-1 disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </main>
  );
}