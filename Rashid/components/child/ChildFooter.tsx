"use client";

import Link from "next/link";

export default function ChildFooter() {
  return (
    <footer dir="rtl" className="relative z-10 hidden px-5 py-6 text-[var(--rashid-color-14224a)] lg:block">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[1.8rem] bg-white/82 px-6 py-5 text-sm font-bold text-[var(--rashid-color-566681)] shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/logo-horrizental.png" alt="راشد" className="h-9 w-auto" />
          <span>© 2026 راشد — تجربة آمنة وممتعة للأطفال</span>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard" className="hover:text-[var(--rashid-color-0e9faa)]">الرئيسية</Link>
          <Link href="/child/programs" className="hover:text-[var(--rashid-color-0e9faa)]">البرامج</Link>
          <Link href="/plans" className="hover:text-[var(--rashid-color-0e9faa)]">الاشتراكات</Link>
        </div>
      </div>
    </footer>
  );
}
