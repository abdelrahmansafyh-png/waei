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
    <aside className="relative z-20 hidden h-screen w-[300px] shrink-0 overflow-hidden rounded-l-[2.5rem] bg-gradient-to-b from-[#4B2DB8] via-[#342087] to-[#24145F] px-5 py-6 text-white shadow-2xl lg:block">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-[#42BFA8]/20" />

      <Link href="/" className="relative mb-7 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/logo.png" alt="واعي" className="mx-auto h-20 w-auto brightness-0 invert" />
          <p className="-mt-2 text-sm font-black text-white/80">عالم الطفل</p>
        </div>
      </Link>

      <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1B7B9C] to-[#3DBB8E] p-5 text-center shadow-xl">
        <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white text-6xl shadow-xl">
          {childAvatar}
        </div>

        <h3 className="mt-4 text-3xl font-black">{childName}</h3>
        <p className="mt-2 text-sm font-bold leading-7 text-white/80">
          مستعد تكمل رحلة واعي اليوم؟
        </p>
      </div>

      <nav className="relative space-y-3">
        {childNavItems.map((item) => {
          const active = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 rounded-[1.4rem] px-4 py-4 text-lg font-black transition ${
                active
                  ? "bg-gradient-to-l from-[#FFD65A] to-[#FFF1A8] text-[#3A2777] shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-3xl shadow-md">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-5 rounded-[1.6rem] bg-white/10 p-4">
        <p className="text-xs font-black text-white/70">نوع الاشتراك</p>
        <Link
          href={proActive ? "/dashboard/subscription" : "/plans"}
          className="mt-2 inline-flex rounded-full bg-[#FFF1A8] px-4 py-2 text-sm font-black text-[#8A6200]"
        >
          {proActive ? "👑 Pro" : "🟢 Free"}
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[#DF4777] px-5 py-4 font-black text-white shadow-lg"
      >
        🚪 تسجيل خروج
      </button>
    </aside>
  );
}
