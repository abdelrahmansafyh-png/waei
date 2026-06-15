"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { childNavItems } from "./childNavItems";
import { getChildAvatar, getChildName, isProActive } from "./childUtils";
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
    <aside className="relative z-20 hidden h-screen w-[300px] shrink-0 overflow-y-auto overflow-x-hidden rounded-l-[2.7rem] border-r border-white/20 bg-gradient-to-b from-[#5132c9]/95 via-[#33218c]/95 to-[#21115f]/95 px-5 py-6 text-white shadow-[0_25px_80px_rgba(20,12,80,.45)] backdrop-blur-xl lg:block">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-sm" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-[#42BFA8]/25 blur-md" />

      <Link href="/" className="relative mb-7 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/logo.png" alt="راشد" className="mx-auto h-20 w-auto brightness-0 invert" />
          <p className="-mt-2 text-sm font-black text-white/85">عالم الطفل</p>
        </div>
      </Link>

      <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-[#2178c8]/80 to-[#28c58e]/80 p-5 text-center shadow-xl">
        <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-white/15" />
        <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-white shadow-xl ring-4 ring-white/30">
          <span className="text-6xl">{childAvatar}</span>
        </div>

        <h3 className="mt-4 text-3xl font-black">{childName}</h3>
        <p className="mt-2 text-sm font-bold leading-7 text-white/85">
          مستعد تكمل رحلة راشد اليوم؟
        </p>
      </div>

      <nav className="relative space-y-3 pb-4">
        {childNavItems.map((item) => {
          const active = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-4 rounded-[1.4rem] border px-4 py-3.5 text-lg font-black transition hover:-translate-y-0.5 ${
                active
                  ? "border-white/50 bg-gradient-to-l from-[#FFD65A] to-[#FFF1A8] text-[#342072] shadow-[0_14px_26px_rgba(255,214,90,.25)]"
                  : "border-white/10 bg-white/10 text-white hover:bg-white/16"
              }`}
            >
              <span className="grid h-14 w-14 place-items-center rounded-[1.2rem] bg-white/95 p-1.5 shadow-lg">
                <img src={item.icon} alt="" className="h-11 w-11 object-contain" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-5 rounded-[1.6rem] border border-white/10 bg-white/10 p-4">
        <p className="text-xs font-black text-white/70">نوع الاشتراك</p>
        <Link
          href={proActive ? "/dashboard/subscription" : "/plans"}
          className="mt-2 inline-flex rounded-full bg-[#FFF1A8] px-4 py-2 text-sm font-black text-[#8A6200] shadow-md"
        >
          {proActive ? "👑 Pro" : "🟢 Free"}
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="relative mt-4 flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-[#df4777] px-5 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5"
      >
        <img src="/images/waei-child/icons/logout-3d.svg" alt="" className="h-9 w-9" />
        تسجيل خروج
      </button>
    </aside>
  );
}
