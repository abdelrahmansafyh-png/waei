
import ParentSidebar from "./ParentSidebar";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-[#0B4D6B]">
      <div className="flex">
        <ParentSidebar />

        <section
          className="min-h-screen flex-1 bg-cover bg-fixed bg-center px-4 py-6 md:px-8"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.42), rgba(255,255,255,.42)), url("/images/kids-soft-bg.png")',
          }}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
