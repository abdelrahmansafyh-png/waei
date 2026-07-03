"use client";

import ChildFooter from "./ChildFooter";
import ChildSidebar from "./ChildSidebar";
import MobileChildNav from "./MobileChildNav";

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
    <main dir="rtl" className="relative h-[100dvh] overflow-hidden text-[var(--rashid-color-14224a)]">
      {/* خلفية راشد الجديدة لكل شاشات الطفل */}
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/rashid-hero-bg.png')",
          filter: "saturate(1.05) brightness(1.05)",
        }}
      />

      {/* طبقات تفتيح ناعمة حتى تبقى القراءة واضحة */}
      <div className="pointer-events-none fixed inset-0 bg-white/56" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-white/50 via-[var(--rashid-color-e9fbfc)]/26 to-[var(--rashid-color-19c6d4)]/14" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[var(--rashid-color-f5fbff)]/95 to-transparent" />

      <div className="relative z-10 flex h-[100dvh] overflow-hidden">
        <ChildSidebar profile={profile} activeHref={activeHref} />

        {/* هذا هو الجزء الوحيد الذي يعمل Scroll */}
        <div className="min-w-0 flex h-[100dvh] flex-1 flex-col overflow-y-auto overflow-x-hidden pb-24 scroll-smooth lg:pb-0">
          <div className="flex-1">{children}</div>
          <ChildFooter />
        </div>
      </div>

      <MobileChildNav profile={profile} activeHref={activeHref} />
    </main>
  );
}
