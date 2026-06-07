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
    <main dir="rtl" className="min-h-screen bg-white text-[#0B4D6B]">
      <div className="flex min-h-screen">
        <ChildSidebar profile={profile} activeHref={activeHref} />

        <div className="min-w-0 flex min-h-screen flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <ChildFooter />
        </div>
      </div>
    </main>
  );
}
