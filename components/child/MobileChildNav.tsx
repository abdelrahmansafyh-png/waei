"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { childNavItems } from "./childNavItems";
import { getChildAvatar, getChildName, isProActive } from "./childUtils";
import { supabase } from "@/lib/supabase";

type MobileChildNavProps = {
  profile: any;
  activeHref?: string;
};

export default function MobileChildNav({ profile, activeHref = "/dashboard" }: MobileChildNavProps) {
  const router = useRouter();
  const childName = getChildName(profile);
  const childAvatar = getChildAvatar(profile);
  const proActive = isProActive(profile);
  const mainItems = childNavItems.filter((item) =>
    ["/dashboard", "/child/programs", "/dashboard/games", "/dashboard/leaderboard", "/plans"].includes(item.href)
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/78 px-3 py-2 shadow-[0_10px_30px_rgba(20,34,74,.08)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/78 px-2 py-1.5 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E6F9FF] text-2xl shadow-inner">
              {childAvatar}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-[#0E9FAA]">أهلًا يا</span>
              <span className="block max-w-[130px] truncate text-xl font-black leading-5 text-[#14224A]">{childName}</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={proActive ? "/dashboard/subscription" : "/plans"}
              className="rounded-full bg-[#FFEBA5] px-3 py-2 text-xs font-black text-[#8A6200] shadow-sm"
            >
              {proActive ? "👑 Pro" : "🟢 Free"}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#FF7AB6] text-lg text-white shadow-sm"
              aria-label="تسجيل خروج"
            >
              ⏻
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/86 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-16px_45px_rgba(20,34,74,.14)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1.5">
          {mainItems.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center rounded-2xl px-1.5 py-2 text-[11px] font-black transition ${
                  active
                    ? "bg-[#0E9FAA] text-white shadow-[0_8px_18px_rgba(14,159,170,.24)]"
                    : "bg-white/65 text-[#566681]"
                }`}
              >
                <span className={`mb-1 grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-white" : "bg-[#EAF7FF]"}`}>
                  <img src={item.icon} alt="" className="h-6 w-6 object-contain" />
                </span>
                <span className="truncate leading-4">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
