"use client";

import Link from "next/link";
import { childNavItems } from "./childNavItems";
import { getChildAvatar, getChildName, isProActive } from "./childUtils";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ChildSidebarProps = {
  profile: any;
  activeHref?: string;
};

export default function ChildSidebar({ profile, activeHref = "/dashboard" }: ChildSidebarProps) {
  const childName = getChildName(profile);
  const childAvatar = getChildAvatar(profile);
  const proActive = isProActive(profile);
  const router = useRouter();

  async function handleLogout() {
  await supabase.auth.signOut();
  router.push("/login");
}
  return (
    <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 overflow-y-auto border-l border-[#E6F1EE] bg-white px-5 py-6 lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <img src="/images/logo.png" alt="واعي" className="h-16 w-auto" />
        <div>
          <h2 className="text-2xl font-black text-[#0B4D6B]">واعي</h2>
          <p className="text-xs font-black text-[#42BFA8]">عالم الطفل</p>
        </div>
      </Link>

      <div className="relative mb-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0B4D6B] to-[#2D9B87] p-5 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-14 -right-10 h-36 w-36 rounded-full bg-[#D8F36A]/15" />
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-white text-5xl shadow-xl">
            {childAvatar}
          </div>
          <h3 className="mt-4 text-2xl font-black">{childName}</h3>
          <p className="mt-2 text-sm font-bold leading-7 text-white/75">
            مستعد نكمل رحلة واعي اليوم؟
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-[1.6rem] border border-[#E6F1EE] bg-[#F9FFFD] p-4">
        <p className="text-xs font-black text-[#6E7A99]">نوع الاشتراك</p>
        <div
          className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-black ${
            proActive
              ? "bg-[#FFF8D9] text-[#8A6A00]"
              : "bg-[#ECFBF7] text-[#0B4D6B]"
          }`}
        >
          {proActive ? "👑 Pro" : "🟢 Free"}
        </div>

        {!proActive && (
          <Link
            href="/plans"
            className="mt-4 block rounded-full bg-[#0B4D6B] py-3 text-center text-sm font-black text-white"
          >
            تفعيل الاشتراك
          </Link>
        )}
      </div>

      <nav className="space-y-2">
        {childNavItems.map((item) => {
          const active = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-4 font-black transition ${
                active
                  ? "bg-[#ECFBF7] text-[#0B4D6B] shadow-sm"
                  : "text-[#6E7A99] hover:bg-[#F6FBF9] hover:text-[#0B4D6B]"
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

      <div className="mt-8 rounded-[2rem] bg-[#FFF8D9] p-5">
        <div className="text-4xl">⚡</div>
        <h3 className="mt-3 font-black text-[#0B4D6B]">XP الطفل</h3>
        <p className="mt-2 text-sm font-bold leading-7 text-[#7A6B22]">
          اجمع XP بإكمال البرامج والألعاب لتظهر في لوحة الصدارة.
        </p>
      </div>
      <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-4 font-black text-red-600 transition hover:bg-red-100"
        >
          🚪 تسجيل الخروج
      </button>
    </aside>
  );
}
