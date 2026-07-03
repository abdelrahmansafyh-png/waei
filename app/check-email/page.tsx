"use client";

import { useRouter } from "next/navigation";

export default function CheckEmailPage() {
  const router = useRouter();

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--rashid-color-f4faf8)] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--rashid-color-d9f5ee)] text-4xl">
          📩
        </div>

        <h1 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">
          تحقق من بريدك الإلكتروني
        </h1>

        <p className="mt-4 leading-8 text-[var(--rashid-color-6e7a99)]">
          أرسلنا لك رابط تفعيل الحساب. افتح بريدك الإلكتروني واضغط على رابط التفعيل، ثم ارجع وسجّل الدخول.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="mt-7 w-full rounded-full bg-[var(--rashid-color-42bfa8)] py-4 font-black text-white"
        >
          الذهاب لتسجيل الدخول
        </button>
      </div>
    </main>
  );
}