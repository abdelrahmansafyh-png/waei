"use client";

import Link from "next/link";

export default function ChildFooter() {
  return (
    <footer dir="rtl" className="relative z-10 px-5 py-6 text-[#211B4C]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[1.8rem] bg-white/70 px-6 py-5 text-sm font-bold text-[#5F5A7B] shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="راشد" className="h-10 w-auto" />
          <span>© 2026 راشد — تجربة آمنة وممتعة للأطفال</span>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard" className="hover:text-[#42BFA8]">الرئيسية</Link>
          <Link href="/child/programs" className="hover:text-[#42BFA8]">البرامج</Link>
          <Link href="/plans" className="hover:text-[#42BFA8]">الاشتراكات</Link>
        </div>
      </div>
    </footer>
  );
}
