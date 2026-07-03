"use client";

import Link from "next/link";

const cards = [
  {
    title: "البرامج",
    desc: "إدارة البرامج، التابات، المحتوى، الألعاب والقصص.",
    href: "/admin/programs",
    icon: "📚",
  },
  {
    title: "الاشتراكات",
    desc: "إدارة خطط الاشتراك والأسعار والمميزات.",
    href: "/admin/plans",
    icon: "💳",
  },
  {
    title: "البانرات",
    desc: "إدارة بانرات الصفحة الرئيسية.",
    href: "/admin/banners",
    icon: "📢",
  },
  {
    title: "اعدادات الصفحة الرئيسية",
    desc: "إدارة نصوص وأيقونات وأزرار اللاندنغ بيج.",
    href: "/admin/landing",
    icon: "🏡",
  },
];

export default function AdminDashboardPage() {
  return (
    <section dir="rtl">
      <div className="mb-8 rounded-[2rem] bg-gradient-to-l from-[var(--rashid-color-0b4d6b)] to-[var(--rashid-color-42bfa8)] p-8 text-white shadow-lg">
        <h2 className="text-4xl font-black">أهلاً بك 👋</h2>
        <p className="mt-3 text-white/80">اختر القسم الذي تريد إدارته.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {cards.map((card) => (
          <Link
            href={card.href}
            key={card.href}
            className="rounded-[2rem] bg-white p-7 shadow-lg transition hover:-translate-y-1"
          >
            <div className="mb-5 text-5xl">{card.icon}</div>
            <h3 className="text-2xl font-black text-[var(--rashid-color-0b4d6b)]">{card.title}</h3>
            <p className="mt-3 leading-7 text-[var(--rashid-color-6e7a99)]">{card.desc}</p>
            <div className="mt-6 inline-flex rounded-full bg-[var(--rashid-color-42bfa8)] px-5 py-3 text-sm font-black text-white">
              فتح
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
