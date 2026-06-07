"use client";

import { useRouter } from "next/navigation";

export default function CheckEmailPage() {
  const router = useRouter();

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4FAF8] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#D9F5EE] text-4xl">
          📩
        </div>

        <h1 className="text-3xl font-black text-[#0B4D6B]">
          تحقق من بريدك الإلكتروني
        </h1>

        <p className="mt-4 leading-8 text-[#6E7A99]">
          أرسلنا لك رابط تفعيل الحساب. افتح بريدك الإلكتروني واضغط على رابط التفعيل، ثم ارجع وسجّل الدخول.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="mt-7 w-full rounded-full bg-[#42BFA8] py-4 font-black text-white"
        >
          الذهاب لتسجيل الدخول
        </button>
      </div>
    </main>
  );
}