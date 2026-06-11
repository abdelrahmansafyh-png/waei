"use client";

import ChildFooter from "./ChildFooter";
import ChildSidebar from "./ChildSidebar";

type ChildLayoutProps = {
  profile: any;
  activeHref?: string;
  children: React.ReactNode;
};

export default function ChildLayout({ profile, activeHref = "/dashboard", children }: ChildLayoutProps) {
  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#8edcff] text-[#211B4C]">
      <div className="relative flex min-h-screen">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,.9),transparent_18%),radial-gradient(circle_at_35%_8%,rgba(255,255,255,.75),transparent_14%),linear-gradient(180deg,#4ab8ff_0%,#bdf4ff_42%,#dfffe9_100%)]" />
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-[42vh] bg-[radial-gradient(circle_at_15%_80%,rgba(64,191,126,.38),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(95,207,119,.30),transparent_32%)]" />

        <ChildSidebar profile={profile} activeHref={activeHref} />

        <div className="relative z-10 min-w-0 flex min-h-screen flex-1 flex-col lg:ml-0 lg:mr-0">
          <div className="flex-1">{children}</div>
          <ChildFooter />
        </div>
      </div>
    </main>
  );
}
