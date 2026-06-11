"use client";

import ChildFooter from "./ChildFooter";
import ChildSidebar from "./ChildSidebar";

type ChildLayoutProps = {
  profile: any;
  activeHref?: string;
  children: React.ReactNode;
};

export default function ChildLayout({
  profile,
  activeHref = "/dashboard",
  children,
}: ChildLayoutProps) {
  return (
    <main dir="rtl" className="relative h-screen overflow-hidden text-[#211B4C]">
      {/* الخلفية الثابتة لكل شاشة الطفل */}
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/waei-child/backgrounds/castle-bg.png')",
          filter: "saturate(48%) brightness(1.18) ",
        }}
      />

      {/* طبقة تفتيح حتى تكون الواجهة أوضح */}
      <div className="pointer-events-none fixed inset-0 bg-white/42" />

      {/* لمسة بنفسجية خفيفة مناسبة للهوية */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-white/30 via-white/10 to-[#6E46E8]/12" />

      <div className="relative z-10 flex h-screen overflow-hidden">
        <ChildSidebar profile={profile} activeHref={activeHref} />

        {/* هذا هو الجزء الوحيد الذي يعمل Scroll */}
        <div className="min-w-0 flex h-screen flex-1 flex-col overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="flex-1">{children}</div>
          <ChildFooter />
        </div>
      </div>
    </main>
  );
}
