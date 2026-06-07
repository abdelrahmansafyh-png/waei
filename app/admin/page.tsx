"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const cards = [
  {
    title: "إدارة الاشتراكات",
    desc: "إضافة وتعديل خطط الأسعار والمميزات",
    href: "/admin/plans",
  },
  {
    title: "إدارة البرامج",
    desc: "إضافة البرامج والتصنيفات والمحتوى",
    href: "/admin/programs",
  },
  {
    title: "إدارة البانرات",
    desc: "التحكم ببانرات الصفحة الرئيسية",
    href: "/admin/banners",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const admin = localStorage.getItem("waei_admin");
    if (!admin) router.push("/admin/login");
  }, [router]);

  function logout() {
    localStorage.removeItem("waei_admin");
    router.push("/admin/login");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4FAF8]">
      <header className="border-b border-[#DDEDEA] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="واعي" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-black text-[#0B4D6B]">
                لوحة تحكم واعي
              </h1>
              <p className="text-sm text-[#6E7A99]">
                إدارة المحتوى والبرامج والاشتراكات
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="rounded-full bg-red-50 px-6 py-3 font-bold text-red-600"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h2 className="text-4xl font-black text-[#0B4D6B]">
            أهلاً بك 👋
          </h2>
          <p className="mt-3 text-[#6E7A99]">
            اختر القسم الذي تريد إدارته.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[2rem] bg-white p-8 shadow-xl shadow-teal-50 transition hover:-translate-y-2"
            >
              <h3 className="text-2xl font-black text-[#0B4D6B]">
                {card.title}
              </h3>
              <p className="mt-4 leading-7 text-[#6E7A99]">
                {card.desc}
              </p>
              <div className="mt-8 inline-flex rounded-full bg-[#42BFA8] px-5 py-3 font-black text-white">
                فتح القسم
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}