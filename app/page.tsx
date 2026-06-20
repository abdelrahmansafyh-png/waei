import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";
import HomeBannersSlider from "@/components/HomeBannersSlider";
import LandingAuthActions from "@/components/LandingAuthActions";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  open_in_new_tab: boolean;
  is_active: boolean;
  sort_order: number;
};

type Program = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  age_range: string | null;
  access_type: string | null;
  is_published: boolean;
  sort_order: number;
  categories?: { name: string } | null;
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string | null;
  period: string | null;
  features: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

async function getBanners(): Promise<Banner[]> {
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data as Banner[]) || [];
}

async function getPrograms(): Promise<Program[]> {
  const { data } = await supabase
    .from("programs")
    .select("*, categories(name)")
    .eq("is_published", true)
    .or("is_deleted.is.null,is_deleted.eq.false")
    .order("sort_order", { ascending: true });

  return (data as Program[]) || [];
}

async function getPlans(): Promise<Plan[]> {
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data as Plan[]) || [];
}

async function getCurrentUser() {
  const cookieStore = await cookies();

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  return user;
}

const methodology = [
  {
    icon: "🧭",
    title: "رحلة تعلم موجهة",
    desc: "يبدأ كل برنامج بهدف واضح ومهارة محددة، ضمن مسار تعليمي متدرج يناسب عمر الطفل واحتياجاته.",
    color: "from-[#19C6D4] to-[#0F9EB2]",
  },
  {
    icon: "📖",
    title: "قصص ومواقف تفاعلية",
    desc: "يخوض الطفل مواقف واقعية وقصصًا تفاعلية، يختار فيها كيف يتصرف ليتعلم من نتائج قراراته.",
    color: "from-[#8B5CF6] to-[#6847F5]",
  },
  {
    icon: "🎮",
    title: "ألعاب وتحديات تعليمية",
    desc: "أنشطة وألعاب تفاعلية تساعد الطفل على اكتساب المهارات بطريقة ممتعة ومشوقة.",
    color: "from-[#6ED46E] to-[#3AAE55]",
  },
  {
    icon: "🚀",
    title: "تطبيق في الحياة اليومية",
    desc: "تدريبات عملية تساعد الطفل على تحويل ما تعلمه إلى سلوك يومي دائم.",
    color: "from-[#FFD54A] to-[#F59E0B]",
  },
];

export default async function LandingPage() {
  const banners = await getBanners();
  const programs = await getPrograms();
  const plans = await getPlans();
  const user = await getCurrentUser();

  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#F5FBFF] text-[#14224A]">
      <style>{`
        @keyframes floatY { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-14px) } }
        @keyframes floatX { 0%,100%{ transform: translateX(0) rotate(0deg) } 50%{ transform: translateX(10px) rotate(4deg) } }
        @keyframes shimmer { 0%{ opacity:.35; transform: scale(.95) } 50%{ opacity:.8; transform: scale(1.08) } 100%{ opacity:.35; transform: scale(.95) } }
        @keyframes slideUp { from{ opacity:0; transform: translateY(24px) } to{ opacity:1; transform: translateY(0) } }
        .rashid-float-y{ animation: floatY 5s ease-in-out infinite; }
        .rashid-float-x{ animation: floatX 6s ease-in-out infinite; }
        .rashid-shimmer{ animation: shimmer 4s ease-in-out infinite; }
        .rashid-slide-up{ animation: slideUp .8s ease both; }
        .rashid-hero-card{
          position: relative;
          border: 1px solid rgba(255,255,255,.82);
          background: linear-gradient(135deg, rgba(255,255,255,.88), rgba(255,255,255,.58));
          box-shadow: 0 28px 80px rgba(20,34,74,.16);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 42px;
          padding: clamp(22px, 4vw, 44px);
        }
        .rashid-hero-title{
          color:#101B3D;
          letter-spacing:-.03em;
          text-shadow: 0 3px 0 rgba(255,255,255,.85), 0 16px 35px rgba(20,34,74,.16);
        }
        .rashid-hero-word{
          color:#0E9FAA;
          text-shadow: 0 3px 0 rgba(255,255,255,.92), 0 14px 30px rgba(14,159,170,.20);
          -webkit-text-stroke: 1px rgba(255,255,255,.78);
        }
        .rashid-hero-desc{
          color:#203154;
          text-shadow: 0 2px 0 rgba(255,255,255,.8);
        }
        @media (max-width: 768px){
          .rashid-hero-card{ border-radius: 32px; }
          .rashid-hero-title{ letter-spacing:-.015em; }
        }
      `}</style>

      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-[0_18px_55px_rgba(18,34,74,.10)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo-horrizental.png" alt="راشد" className="h-14 w-auto object-contain" />
          </Link>

          <nav className="hidden items-center gap-8 text-base font-black text-[#14224A] md:flex">
            <a className="transition hover:text-[#12AFC0]" href="#home">الرئيسية</a>
            <a className="transition hover:text-[#12AFC0]" href="#methodology">المنهجية</a>
            <a className="transition hover:text-[#12AFC0]" href="#programs">البرامج</a>
            <a className="transition hover:text-[#12AFC0]" href="#stories">القصص والألعاب</a>
            <a className="transition hover:text-[#12AFC0]" href="#plans">الاشتراكات</a>
          </nav>

          <LandingAuthActions />
        </div>
      </header>

      <section id="home" className="relative min-h-[850px] overflow-hidden pt-28">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/rashid-hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-[#F5FBFF]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#F5FBFF] to-transparent" />

        <div className="rashid-shimmer absolute left-[10%] top-[22%] h-3 w-3 rounded-full bg-white shadow-[0_0_30px_12px_rgba(255,255,255,.65)]" />
        <div className="rashid-shimmer absolute right-[22%] top-[18%] h-2 w-2 rounded-full bg-white shadow-[0_0_22px_10px_rgba(255,255,255,.6)]" />
        <div className="rashid-float-x absolute left-[18%] top-[28%] hidden rounded-3xl bg-white/80 px-5 py-3 text-3xl shadow-xl md:block">📘</div>
        <div className="rashid-float-y absolute left-[44%] top-[28%] hidden rounded-full bg-white/80 px-5 py-4 text-3xl shadow-xl md:block">⭐</div>
        <div className="rashid-float-x absolute left-[36%] top-[68%] hidden rounded-full bg-white/80 px-5 py-4 text-3xl shadow-xl md:block">🎵</div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 pb-24 pt-16 lg:grid-cols-[.95fr_1.05fr]">
          <div className="rashid-slide-up rashid-hero-card max-w-2xl pt-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-5 py-2 text-sm font-black text-[#0E9FAA] shadow-lg backdrop-blur">
              <span>🌟</span>
              <span>منصة تعليمية تفاعلية للأطفال</span>
            </div>

            <h1 className="rashid-hero-title text-5xl font-black leading-[1.22] md:text-7xl">
              تعلّم، العب، واكتشف
              <br />
              <span className="rashid-hero-word inline-block">
                مع راشد
              </span>
            </h1>

            <p className="rashid-hero-desc mt-7 max-w-xl text-xl font-bold leading-10">
             منصة تفاعلية تساعد الأطفال على بناء صحة نفسية إيجابية وتنمية القيم والمهارات الحياتية من خلال القصص والألعاب والانشطة والتجارب التفاعلية الممتعة.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-[#19C6D4] to-[#0E9FAA] px-8 py-4 text-lg font-black text-white shadow-[0_15px_35px_rgba(17,187,203,.35)] transition hover:-translate-y-1"
              >
                <span>🎮</span>
                <span>{user ? "اذهب للوحة التحكم" : "ابدأ اللعب الآن"}</span>
              </Link>

              <a
                href="#methodology"
                className="inline-flex items-center gap-3 rounded-full border border-[#11BBCB]/30 bg-white/80 px-8 py-4 text-lg font-black text-[#0B8398] shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-white"
              >
                <span>▷</span>
                <span>تعرف على المنهجية</span>
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[520px] lg:block">
            <img
              src="/images/logo.png"
              alt="راشد"
              className="rashid-float-y absolute left-0 right-0 top-[18%] mx-auto w-[560px] max-w-full object-contain drop-shadow-[0_25px_35px_rgba(18,34,74,.18)]"
            />
          </div>
        </div>

        <div className="relative mx-auto -mt-12 max-w-6xl px-6">
          <div className="grid gap-4 rounded-[2.2rem] border border-white/70 bg-white/85 p-5 shadow-[0_25px_70px_rgba(18,34,74,.12)] backdrop-blur-xl md:grid-cols-4">
            {[
              ["🎮", "ألعاب تعليمية", "ألعاب تفاعلية تنمي التفكير والذكاء."],
              ["🎥", "برامج آمنة", "محتوى هادف وممتع بجودة عالية."],
              ["📖", "قصص تربوية", "قصص ممتعة تغرس القيم وتنمي الخيال."],
              ["⭐", "تقدم وتحفيز", "نظام نقاط وشارات يحفّز الطفل على التعلم."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-4 rounded-[1.6rem] p-4 transition hover:bg-[#F2FEFF]">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#19C6D4] to-[#0E9FAA] text-3xl text-white shadow-lg">
                  {icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#14224A]">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[#526079]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeBannersSlider banners={banners} />

      <section id="methodology" className="relative overflow-hidden bg-[#F5FBFF] px-6 py-24">
        <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#19C6D4]/10 blur-3xl" />
        <div className="absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-[#FFD54A]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#0E9FAA] shadow-lg">
              منهجية راشد
            </div>
            <h2 className="text-4xl font-black leading-[1.3] text-[#14224A] md:text-6xl">
              منهجية تبني المهارة والقيمة بطريقة ممتعة
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-9 text-[#526079]">
              في راشد لا نقدم محتوى جامد؛ بل رحلة تفاعلية تجمع اللعب، القصة، التدريب، والمتابعة حتى يتعلم الطفل بسعادة وثقة.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {methodology.map((item) => (
              <div key={item.title} className="group rounded-[2rem] border border-white bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)] transition hover:-translate-y-2">
                <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-3xl text-white shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black text-[#14224A]">{item.title}</h3>
                <p className="mt-4 text-base font-semibold leading-8 text-[#526079]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full bg-[#E8FBFD] px-5 py-2 text-sm font-black text-[#0E9FAA] shadow-lg">
              لماذا يختار الآباء راشد؟
            </div>

            <h2 className="text-4xl font-black text-[#14224A] md:text-6xl">
              تجربة تعليمية مختلفة لطفلك
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["🌱", "تعلم بالممارسة", "يطبق الطفل ما يتعلمه عبر أنشطة وتجارب تفاعلية."],
              ["🛤️", "مسار متدرج", "محتوى مصمم ليناسب عمر الطفل ومستواه في كل مرحلة."],
              ["🏆", "تحفيز ومكافآت", "نظام نقاط وإنجازات يحفز الطفل على الاستمرار والتقدم."],
              ["👨‍👩‍👧", "مشاركة الأسرة", "متابعة تقدم الطفل ودعمه في رحلته التعليمية."],
            ].map(([icon, title, desc]) => (
              <div
                key={title}
                className="rounded-[2rem] border border-[#E7F0F7] bg-[#F8FCFF] p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)]"
              >
                <div className="mb-4 text-4xl">{icon}</div>
                <h3 className="text-2xl font-black text-[#14224A]">{title}</h3>
                <p className="mt-4 leading-8 text-[#526079]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="programs" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-[#E8FBFD] px-5 py-2 font-black text-[#0E9FAA]">
                برامج راشد
              </div>
              <h2 className="text-4xl font-black text-[#14224A] md:text-5xl">جرّب برامجنا التفاعلية</h2>
            </div>

            <Link href="/child/programs" className="group inline-flex items-center gap-3 rounded-full bg-[#F5FBFF] px-7 py-4 text-[#14224A] shadow-lg transition hover:-translate-y-1 hover:bg-[#19C6D4] hover:text-white">
              <span className="text-base font-black">عرض كل البرامج</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0E9FAA]">←</span>
            </Link>
          </div>

          {programs.length > 0 ? (
            <div className={`grid gap-6 ${programs.length === 1 ? "mx-auto max-w-[420px]" : programs.length === 2 ? "mx-auto max-w-4xl md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {programs.slice(0, 6).map((program) => (
                <Link key={program.id} href={`/child/programs/${program.slug}`} className="overflow-hidden rounded-[2rem] border border-[#E7F0F7] bg-white shadow-[0_18px_45px_rgba(18,34,74,.08)] transition hover:-translate-y-2">
                  {program.image_url ? (
                    <img src={getFileUrl(program.image_url)} alt={program.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-[#19C6D4] via-[#8B5CF6] to-[#FFD54A]" />
                  )}

                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {program.categories?.name && <span className="rounded-full bg-[#E8FBFD] px-4 py-2 text-sm font-black text-[#0E9FAA]">{program.categories.name}</span>}
                      <span className={`rounded-full px-4 py-2 text-sm font-black ${program.access_type === "pro" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {program.access_type === "pro" ? "👑 Pro" : "🟢 مجاني"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-[#14224A]">{program.title}</h3>
                    {program.description && <p className="mt-3 line-clamp-2 leading-7 text-[#526079]">{program.description}</p>}
                    <div className="mt-6 inline-flex rounded-full bg-[#19C6D4] px-6 py-3 font-black text-white">
                      {program.access_type === "pro" ? "مشاهدة التفاصيل" : "جرّب الآن"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-[#F9FFFD] p-12 text-center">
              <h3 className="text-3xl font-black text-[#14224A]">لا توجد برامج منشورة حاليًا</h3>
            </div>
          )}
        </div>
      </section>

      <section id="stories" className="bg-[#F5FBFF] px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_60px_rgba(18,34,74,.08)]">
            <img src="/images/gamestory.png" alt="عالم راشد" className="h-80 w-full rounded-[2rem] object-cover" />
          </div>
          <div>
            <div className="mb-5 inline-flex rounded-full bg-white px-5 py-2 font-black text-[#8B5CF6] shadow-lg">القصص والألعاب</div>
            <h2 className="text-4xl font-black leading-[1.35] text-[#14224A] md:text-5xl">كل نشاط داخل راشد مصمم ليعلّم الطفل قرارًا أو مهارة</h2>
            <p className="mt-6 text-lg font-semibold leading-9 text-[#526079]">
              القصص التفاعلية تجعل الطفل يعيش الموقف، والألعاب تحول التدريب إلى تجربة ممتعة قابلة للقياس والمتابعة.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[["🎭", "قصص بقرارات"], ["🧩", "ألعاب مهارات"], ["🔊", "أصوات موجهة"], ["🏆", "نتائج وتقدم"]].map(([icon, title]) => (
                <div key={title} className="rounded-2xl bg-white p-5 text-lg font-black text-[#14224A] shadow-lg"><span className="ml-2">{icon}</span>{title}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div className="mb-5 inline-flex rounded-full bg-[#E8FBFD] px-5 py-2 font-black text-[#0E9FAA]">خطط الاشتراك</div>
            <h2 className="text-4xl font-black text-[#14224A] md:text-5xl">اختر الخطة المناسبة لطفلك</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-9 text-[#526079]">خطط مرنة للأطفال، ويتم تعديل الأسعار والمميزات من لوحة التحكم.</p>
          </div>

          {plans.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className={`rounded-[2.5rem] p-8 shadow-xl transition hover:-translate-y-2 ${plan.is_featured ? "bg-[#14224A] text-white" : "bg-[#F5FBFF] text-[#14224A]"}`}>
                  {plan.is_featured && <div className="mb-5 inline-flex rounded-full bg-[#FFD54A] px-4 py-2 text-sm font-black text-[#14224A]">الأكثر اختيارًا</div>}
                  <h3 className="text-3xl font-black">{plan.name}</h3>
                  {plan.description && <p className={`mt-3 leading-7 ${plan.is_featured ? "text-white/70" : "text-[#526079]"}`}>{plan.description}</p>}
                  <div className="mt-7 flex items-end gap-2"><span className="text-5xl font-black">{plan.price}</span>{plan.currency && <span className={plan.is_featured ? "text-white/60" : "text-[#526079]"}>{plan.currency}{plan.period ? ` / ${plan.period}` : ""}</span>}</div>
                  <div className="mt-8 space-y-4">{plan.features?.map((feature, index) => <div key={`${feature}-${index}`} className="flex items-center gap-3 font-bold"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${plan.is_featured ? "bg-white/15 text-[#FFD54A]" : "bg-white text-[#19C6D4]"}`}>✓</span>{feature}</div>)}</div>
                  <Link href={user ? "/dashboard" : "/register"} className={`mt-9 block w-full rounded-full py-4 text-center font-black ${plan.is_featured ? "bg-[#FFD54A] text-[#14224A]" : "bg-[#19C6D4] text-white"}`}>{user ? "إدارة الاشتراك" : "ابدأ الآن"}</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-[#F5FBFF] p-12 text-center"><h3 className="text-3xl font-black">لا توجد خطط مفعّلة حاليًا</h3><p className="mt-4 text-[#526079]">عند إضافة خطط من لوحة الإدارة ستظهر هنا تلقائيًا.</p></div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24 text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/rashid-hero-bg.png')" }} />
        <div className="absolute inset-0 bg-[#14224A]/60 backdrop-blur-[1px]" />
        <div className="relative mx-auto max-w-4xl">
          <img src="/images/logo-horrizental.png" alt="راشد" className="mx-auto mb-8 h-24 w-auto" />
          <h2 className="text-4xl font-black md:text-6xl">ابدأ رحلة طفلك مع راشد اليوم</h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-9 text-white/80">انضم لمنصة تجمع بين التعلم والمرح والمتابعة الذكية في مكان واحد.</p>
          <div className="mt-10 flex justify-center gap-4"><Link href={user ? "/dashboard" : "/register"} className="rounded-full bg-[#FFD54A] px-9 py-4 text-lg font-black text-[#14224A]">{user ? "لوحة التحكم" : "إنشاء حساب"}</Link></div>
        </div>
      </section>

      <footer className="bg-[#101B3D] px-6 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <img src="/images/logo-horrizental.png" alt="راشد" className="mb-4 h-16 w-auto" />
            <p className="leading-8 text-white/60">منصة تعليمية تفاعلية آمنة للأطفال، تبني المهارات والقيم بطريقة ممتعة.</p>
          </div>
          <div><h4 className="mb-4 font-black">المنصة</h4><p className="mb-3 text-white/55">عن راشد</p><p className="mb-3 text-white/55">البرامج</p><p className="mb-3 text-white/55">منهجية راشد</p></div>
          <div><h4 className="mb-4 font-black">الحسابات</h4><p className="mb-3 text-white/55">ولي الأمر</p><p className="mb-3 text-white/55">الطفل</p><p className="mb-3 text-white/55">الإدارة</p></div>
          <div><h4 className="mb-4 font-black">تواصل معنا</h4><p className="mb-3 text-white/55">info@rashid.app</p><p className="mb-3 text-white/55">@rashid</p><p className="mb-3 text-white/55">+974 5030 6611</p></div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-white/40">© 2026 منصة راشد — جميع الحقوق محفوظة</div>
      </footer>
    </main>
  );
}
