
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const items = [
  { label: "الرئيسية", icon: "🏠", href: "/dashboard" },
  { label: "الأبناء", icon: "👨‍👩‍👧", href: "/dashboard/children" },
  { label: "التقارير", icon: "📊", href: "/dashboard/reports" },
  { label: "لوحة الصدارة", icon: "🏆", href: "/dashboard/leaderboard" },
  { label: "الاشتراكات", icon: "💳", href: "/plans" },
];

export default function ParentSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 overflow-y-auto border-l border-[var(--rashid-color-e6f1ee)] bg-white px-5 py-6 lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <img src="/images/logo.png" alt="راشد" className="h-16 w-auto" />
        <div>
          <h2 className="text-2xl font-black text-[var(--rashid-color-0b4d6b)]">راشد</h2>
          <p className="text-xs font-black text-[var(--rashid-color-42bfa8)]">لوحة ولي الأمر</p>
        </div>
      </Link>

      <nav className="space-y-2">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-4 font-black transition ${
                active
                  ? "bg-[var(--rashid-color-ecfbf7)] text-[var(--rashid-color-0b4d6b)] shadow-sm"
                  : "text-[var(--rashid-color-6e7a99)] hover:bg-[var(--rashid-color-f6fbf9)] hover:text-[var(--rashid-color-0b4d6b)]"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-4 font-black text-red-600 transition hover:bg-red-100"
      >
        🚪 تسجيل الخروج
      </button>
    </aside>
  );
}
