"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  { href: "/admin", label: "الرئيسية", icon: "🏠" },
  { href: "/admin/programs", label: "البرامج", icon: "📚" },
  { href: "/admin/plans", label: "الاشتراكات", icon: "💳" },
  { href: "/admin/banners", label: "البانرات", icon: "📢" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    const admin = localStorage.getItem("rashid_admin");
    if (!admin) router.replace("/admin/login");
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;

  function logout() {
    localStorage.removeItem("rashid_admin");
    router.replace("/admin/login");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F5FAF8] text-[#0B4D6B]">
      <aside className="fixed right-0 top-0 z-50 hidden h-screen w-72 flex-col border-l border-[#E4EFEA] bg-white p-5 shadow-xl lg:flex">
        <div className="mb-8 rounded-3xl bg-[#F5FAF8] p-4">
          <img src="/images/logo.png" alt="راشد" className="mb-3 h-14 w-auto" />
          <div className="text-xl font-black">لوحة راشد</div>
          <div className="mt-1 text-xs font-bold text-[#6E7A99]">إدارة المنصة</div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition",
                  active
                    ? "bg-[#0B4D6B] text-white"
                    : "text-[#0B4D6B] hover:bg-[#F5FAF8]",
                ].join(" ")}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2">
          <Link
            href="/"
            className="block rounded-2xl bg-[#F5FAF8] px-4 py-3 text-center text-sm font-black text-[#0B4D6B]"
          >
            عرض الموقع
          </Link>
          <button
            onClick={logout}
            className="w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-[#E4EFEA] bg-white/95 px-4 py-4 shadow-sm backdrop-blur lg:mr-72 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black text-[#42BFA8]">لوحة الإدارة</div>
            <h1 className="mt-1 text-2xl font-black text-[#0B4D6B]">
              {navItems.find((item) =>
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
              )?.label || "الأدمن"}
            </h1>
          </div>

          <button
            onClick={logout}
            className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600 lg:hidden"
          >
            خروج
          </button>
        </div>

        <nav className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl bg-[#F5FAF8] px-3 py-2 text-center text-xs font-black text-[#0B4D6B]"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="p-4 lg:mr-72 lg:p-8">
        {children}
      </main>
    </div>
  );
}
