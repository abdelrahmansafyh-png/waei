"use client";

import Link from "next/link";

export default function ChildFooter() {
  return (
    <footer dir="rtl" className="border-t border-[#E6F1EE] bg-white px-5 py-6 text-[#0B4D6B]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-bold text-[#6E7A99] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="واعي" className="h-10 w-auto" />
          <span>© 2026 واعي — تجربة آمنة وممتعة للأطفال</span>
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
