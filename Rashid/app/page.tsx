import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";
import HomeBannersSlider from "@/components/HomeBannersSlider";
import LandingAuthActions from "@/components/LandingAuthActions";
import LandingSimpleCardsSlider from "@/components/LandingSimpleCardsSlider";

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

type LandingItem = {
  id?: string;
  section: string;
  item_key: string;
  icon: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
  color_class: string | null;
  sort_order: number;
  is_active: boolean;
};

type LandingMap = Record<string, LandingItem>;

const defaults: LandingItem[] = [
  { section: "nav", item_key: "home", icon: null, title: "الرئيسية", subtitle: null, description: null, button_text: null, button_link: "#home", image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "nav", item_key: "methodology", icon: null, title: "المنهجية", subtitle: null, description: null, button_text: null, button_link: "#methodology", image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "nav", item_key: "programs", icon: null, title: "البرامج", subtitle: null, description: null, button_text: null, button_link: "#programs", image_url: null, color_class: null, sort_order: 3, is_active: true },
  { section: "nav", item_key: "stories", icon: null, title: "القصص والألعاب", subtitle: null, description: null, button_text: null, button_link: "#stories", image_url: null, color_class: null, sort_order: 4, is_active: true },
  { section: "nav", item_key: "plans", icon: null, title: "الاشتراكات", subtitle: null, description: null, button_text: null, button_link: "#plans", image_url: null, color_class: null, sort_order: 5, is_active: true },

  { section: "hero", item_key: "main", icon: "🌟", title: "تعلّم، العب، واكتشف", subtitle: "مع راشد", description: "منصة تفاعلية تساعد الأطفال على بناء صحة نفسية إيجابية وتنمية القيم والمهارات الحياتية من خلال القصص والألعاب والأنشطة والتجارب التفاعلية الممتعة.", button_text: "ابدأ اللعب الآن", button_link: "/register", image_url: "/images/logo.png", color_class: null, sort_order: 1, is_active: true },
  { section: "hero", item_key: "badge", icon: "🌟", title: "منصة تعليمية تفاعلية للأطفال", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "hero", item_key: "secondary_button", icon: "▷", title: null, subtitle: null, description: null, button_text: "تعرف على المنهجية", button_link: "#methodology", image_url: null, color_class: null, sort_order: 3, is_active: true },

  { section: "hero_feature", item_key: "games", icon: "🎮", title: "ألعاب تعليمية", subtitle: null, description: "ألعاب تفاعلية تنمي التفكير والذكاء.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "hero_feature", item_key: "safe", icon: "🎥", title: "برامج آمنة", subtitle: null, description: "محتوى هادف وممتع بجودة عالية.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "hero_feature", item_key: "stories", icon: "📖", title: "قصص تربوية", subtitle: null, description: "قصص ممتعة تغرس القيم وتنمي الخيال.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 3, is_active: true },
  { section: "hero_feature", item_key: "progress", icon: "⭐", title: "تقدم وتحفيز", subtitle: null, description: "نظام نقاط وشارات يحفّز الطفل على التعلم.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 4, is_active: true },

  { section: "methodology_header", item_key: "main", icon: null, title: "منهجية راشد", subtitle: "منهجية تبني المهارة والقيمة بطريقة ممتعة", description: "في راشد لا نقدم محتوى جامد؛ بل رحلة تفاعلية تجمع اللعب، القصة، التدريب، والمتابعة حتى يتعلم الطفل بسعادة وثقة.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "methodology", item_key: "journey", icon: "🧭", title: "رحلة تعلم موجهة", subtitle: null, description: "يبدأ كل برنامج بهدف واضح ومهارة محددة، ضمن مسار تعليمي متدرج يناسب عمر الطفل واحتياجاته.", button_text: null, button_link: null, image_url: null, color_class: "from-[var(--rashid-color-19c6d4)] to-[var(--rashid-color-0f9eb2)]", sort_order: 1, is_active: true },
  { section: "methodology", item_key: "stories", icon: "📖", title: "قصص ومواقف تفاعلية", subtitle: null, description: "يخوض الطفل مواقف واقعية وقصصًا تفاعلية، يختار فيها كيف يتصرف ليتعلم من نتائج قراراته.", button_text: null, button_link: null, image_url: null, color_class: "from-[var(--rashid-color-8b5cf6)] to-[var(--rashid-color-6847f5)]", sort_order: 2, is_active: true },
  { section: "methodology", item_key: "games", icon: "🎮", title: "ألعاب وتحديات تعليمية", subtitle: null, description: "أنشطة وألعاب تفاعلية تساعد الطفل على اكتساب المهارات بطريقة ممتعة ومشوقة.", button_text: null, button_link: null, image_url: null, color_class: "from-[var(--rashid-color-6ed46e)] to-[var(--rashid-color-3aae55)]", sort_order: 3, is_active: true },
  { section: "methodology", item_key: "daily", icon: "🚀", title: "تطبيق في الحياة اليومية", subtitle: null, description: "تدريبات عملية تساعد الطفل على تحويل ما تعلمه إلى سلوك يومي دائم.", button_text: null, button_link: null, image_url: null, color_class: "from-[var(--rashid-color-ffd54a)] to-[var(--rashid-color-f59e0b)]", sort_order: 4, is_active: true },

  { section: "parents_header", item_key: "main", icon: null, title: "لماذا يختار الآباء راشد؟", subtitle: "تجربة تعليمية مختلفة لطفلك", description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "parent_feature", item_key: "practice", icon: "🌱", title: "تعلم بالممارسة", subtitle: null, description: "يطبق الطفل ما يتعلمه عبر أنشطة وتجارب تفاعلية.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "parent_feature", item_key: "path", icon: "🛤️", title: "مسار متدرج", subtitle: null, description: "محتوى مصمم ليناسب عمر الطفل ومستواه في كل مرحلة.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "parent_feature", item_key: "rewards", icon: "🏆", title: "تحفيز ومكافآت", subtitle: null, description: "نظام نقاط وإنجازات يحفز الطفل على الاستمرار والتقدم.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 3, is_active: true },
  { section: "parent_feature", item_key: "family", icon: "👨‍👩‍👧", title: "مشاركة الأسرة", subtitle: null, description: "متابعة تقدم الطفل ودعمه في رحلته التعليمية.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 4, is_active: true },

  { section: "programs_header", item_key: "main", icon: null, title: "برامج راشد", subtitle: "جرّب برامجنا التفاعلية", description: null, button_text: "عرض كل البرامج", button_link: "/child/programs", image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "stories_header", item_key: "main", icon: null, title: "القصص والألعاب", subtitle: "كل نشاط داخل راشد مصمم ليعلّم الطفل قرارًا أو مهارة", description: "القصص التفاعلية تجعل الطفل يعيش الموقف، والألعاب تحول التدريب إلى تجربة ممتعة قابلة للقياس والمتابعة.", button_text: null, button_link: null, image_url: "/images/gamestory.png", color_class: null, sort_order: 1, is_active: true },
  { section: "story_feature", item_key: "decision", icon: "🎭", title: "قصص بقرارات", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "story_feature", item_key: "skills", icon: "🧩", title: "ألعاب مهارات", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "story_feature", item_key: "audio", icon: "🔊", title: "أصوات موجهة", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 3, is_active: true },
  { section: "story_feature", item_key: "results", icon: "🏆", title: "نتائج وتقدم", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 4, is_active: true },

  { section: "plans_header", item_key: "main", icon: null, title: "خطط الاشتراك", subtitle: "اختر الخطة المناسبة لطفلك", description: "خطط مرنة للأطفال، ويتم تعديل الأسعار والمميزات من لوحة التحكم.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "cta", item_key: "main", icon: null, title: "ابدأ رحلة طفلك مع راشد اليوم", subtitle: null, description: "انضم لمنصة تجمع بين التعلم والمرح والمتابعة في مكان واحد.", button_text: "إنشاء حساب", button_link: "/register", image_url: "/images/logo-horrizental.png", color_class: null, sort_order: 1, is_active: true },
  { section: "footer", item_key: "main", icon: null, title: "منصة تعليمية تفاعلية آمنة للأطفال، تبني المهارات والقيم بطريقة ممتعة.", subtitle: "© 2026 منصة راشد — جميع الحقوق محفوظة", description: "info@rashid.app\n@rashid\n+974 5030 6611", button_text: null, button_link: null, image_url: "/images/logo-horrizental.png", color_class: null, sort_order: 1, is_active: true },
];

function defaultMap(): LandingMap {
  return defaults.reduce((acc, item) => {
    acc[`${item.section}.${item.item_key}`] = item;
    return acc;
  }, {} as LandingMap);
}

async function getLandingContent(): Promise<LandingMap> {
  const map = defaultMap();

  const { data, error } = await supabase
    .from("landing_content")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return map;

  (data as LandingItem[]).forEach((item) => {
    map[`${item.section}.${item.item_key}`] = {
      ...map[`${item.section}.${item.item_key}`],
      ...item,
    };
  });

  return map;
}

function landingItem(map: LandingMap, section: string, key = "main") {
  return map[`${section}.${key}`] || defaultMap()[`${section}.${key}`];
}

function landingItems(map: LandingMap, section: string) {
  return Object.values(map)
    .filter((item) => item.section === section && item.is_active !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}


function landingMediaSrc(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/images")) return path;
  return getFileUrl(path);
}

function LandingIcon({ item, className = "", imageClassName = "" }: { item: LandingItem; className?: string; imageClassName?: string }) {
  if (item.image_url) {
    return (
      <img
        src={landingMediaSrc(item.image_url)}
        alt={item.title || ""}
        className={imageClassName || `${className} object-cover`}
      />
    );
  }

  return <span className={className}>{item.icon}</span>;
}

function text(value: string | null | undefined, fallback = "") {
  return value || fallback;
}

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

export default async function LandingPage() {
  const banners = await getBanners();
  const programs = await getPrograms();
  const plans = await getPlans();
  const landing = await getLandingContent();
  const user = await getCurrentUser();

  const hero = landingItem(landing, "hero");
  const heroBadge = landingItem(landing, "hero", "badge");
  const heroSecondButton = landingItem(landing, "hero", "secondary_button");
  const methodologyHeader = landingItem(landing, "methodology_header");
  const parentsHeader = landingItem(landing, "parents_header");
  const programsHeader = landingItem(landing, "programs_header");
  const storiesHeader = landingItem(landing, "stories_header");
  const plansHeader = landingItem(landing, "plans_header");
  const cta = landingItem(landing, "cta");
  const footer = landingItem(landing, "footer");
  const footerLines = (footer.description || "").split("\n").filter(Boolean);

  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[var(--rashid-color-f5fbff)] text-[var(--rashid-color-14224a)]">
      <style>{`
        @keyframes floatY { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-14px) } }
        @keyframes floatX { 0%,100%{ transform: translateX(0) rotate(0deg) } 50%{ transform: translateX(10px) rotate(4deg) } }
        @keyframes shimmer { 0%{ opacity:.35; transform: scale(.95) } 50%{ opacity:.8; transform: scale(1.08) } 100%{ opacity:.35; transform: scale(.95) } }
        @keyframes slideUp { from{ opacity:0; transform: translateY(24px) } to{ opacity:1; transform: translateY(0) } }
        .rashid-float-y{ animation: floatY 5s ease-in-out infinite; }
        .rashid-float-x{ animation: floatX 6s ease-in-out infinite; }
        .rashid-shimmer{ animation: shimmer 4s ease-in-out infinite; }
        .rashid-slide-up{ animation: slideUp .8s ease both; }
        .rashid-hero-card{ position: relative; border: 1px solid rgba(255,255,255,.82); background: linear-gradient(135deg, rgba(255,255,255,.88), rgba(255,255,255,.58)); box-shadow: 0 28px 80px rgba(20,34,74,.16); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 42px; padding: clamp(22px, 4vw, 44px); }
        .rashid-hero-title{ color:var(--rashid-color-101b3d); letter-spacing:-.03em; text-shadow: 0 3px 0 rgba(255,255,255,.85), 0 16px 35px rgba(20,34,74,.16); }
        .rashid-hero-word{ color:var(--rashid-color-0e9faa); text-shadow: 0 3px 0 rgba(255,255,255,.92), 0 14px 30px rgba(14,159,170,.20); -webkit-text-stroke: 1px rgba(255,255,255,.78); }
        .rashid-hero-desc{ color:var(--rashid-color-203154); text-shadow: 0 2px 0 rgba(255,255,255,.8); }
        @media (max-width: 768px){ .rashid-hero-card{ border-radius: 32px; } .rashid-hero-title{ letter-spacing:-.015em; } }
      `}</style>

      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-[0_18px_55px_rgba(18,34,74,.10)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo-horrizental.png" alt="راشد" className="h-14 w-auto object-contain" />
          </Link>

          <nav className="hidden items-center gap-8 text-base font-black text-[var(--rashid-color-14224a)] md:flex">
            {landingItems(landing, "nav").map((item) => (
              <a key={item.item_key} className="transition hover:text-[var(--rashid-color-12afc0)]" href={item.button_link || "#home"}>{item.title}</a>
            ))}
          </nav>

          <LandingAuthActions />
        </div>
      </header>

      <section id="home" className="relative min-h-[850px] overflow-hidden pt-28">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/rashid-hero-bg.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-[var(--rashid-color-f5fbff)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[var(--rashid-color-f5fbff)] to-transparent" />

        <div className="rashid-shimmer absolute left-[10%] top-[22%] h-3 w-3 rounded-full bg-white shadow-[0_0_30px_12px_rgba(255,255,255,.65)]" />
        <div className="rashid-shimmer absolute right-[22%] top-[18%] h-2 w-2 rounded-full bg-white shadow-[0_0_22px_10px_rgba(255,255,255,.6)]" />
        <div className="rashid-float-x absolute left-[18%] top-[28%] hidden rounded-3xl bg-white/80 px-5 py-3 text-3xl shadow-xl md:block">📘</div>
        <div className="rashid-float-y absolute left-[44%] top-[28%] hidden rounded-full bg-white/80 px-5 py-4 text-3xl shadow-xl md:block">⭐</div>
        <div className="rashid-float-x absolute left-[36%] top-[68%] hidden rounded-full bg-white/80 px-5 py-4 text-3xl shadow-xl md:block">🎵</div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 pb-24 pt-16 lg:grid-cols-[.95fr_1.05fr]">
          <div className="rashid-slide-up rashid-hero-card max-w-2xl pt-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-5 py-2 text-sm font-black text-[var(--rashid-color-0e9faa)] shadow-lg backdrop-blur">
              <LandingIcon item={heroBadge} className="text-lg" imageClassName="h-6 w-6 rounded-full object-cover" />
              <span>{heroBadge.title}</span>
            </div>

            <h1 className="rashid-hero-title text-5xl font-black leading-[1.22] md:text-7xl">
              {hero.title}
              <br />
              <span className="rashid-hero-word inline-block">{hero.subtitle}</span>
            </h1>

            <p className="rashid-hero-desc mt-7 max-w-xl text-xl font-bold leading-10">{hero.description}</p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={user ? "/dashboard" : text(hero.button_link, "/register")} className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-[var(--rashid-color-19c6d4)] to-[var(--rashid-color-0e9faa)] px-8 py-4 text-lg font-black text-white shadow-[0_15px_35px_rgba(17,187,203,.35)] transition hover:-translate-y-1">
                <span>{hero.icon || "🎮"}</span>
                <span>{user ? "اذهب للوحة التحكم" : hero.button_text}</span>
              </Link>

              <a href={heroSecondButton.button_link || "#methodology"} className="inline-flex items-center gap-3 rounded-full border border-[var(--rashid-color-11bbcb)]/30 bg-white/80 px-8 py-4 text-lg font-black text-[var(--rashid-color-0b8398)] shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-white">
                <span>{heroSecondButton.icon}</span>
                <span>{heroSecondButton.button_text}</span>
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[520px] lg:block">
            <img src={landingMediaSrc(hero.image_url) || "/images/logo.png"} alt="راشد" className="rashid-float-y absolute left-0 right-0 top-[18%] mx-auto w-[560px] max-w-full object-contain drop-shadow-[0_25px_35px_rgba(18,34,74,.18)]" />
          </div>
        </div>

        <div className="relative mx-auto -mt-12 max-w-6xl px-6">
          <div className="grid gap-4 rounded-[2.2rem] border border-white/70 bg-white/85 p-5 shadow-[0_25px_70px_rgba(18,34,74,.12)] backdrop-blur-xl md:grid-cols-4">
            {landingItems(landing, "hero_feature").map((item) => (
              <div key={item.item_key} className="flex items-start gap-4 rounded-[1.6rem] p-4 transition hover:bg-[var(--rashid-color-f2feff)]">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--rashid-color-19c6d4)] to-[var(--rashid-color-0e9faa)] text-3xl text-white shadow-lg"><LandingIcon item={item} className="text-3xl" imageClassName="h-full w-full object-cover" /></div>
                <div>
                  <h3 className="text-xl font-black text-[var(--rashid-color-14224a)]">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[var(--rashid-color-526079)]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeBannersSlider banners={banners} />

      <section id="methodology" className="relative overflow-hidden bg-[var(--rashid-color-f5fbff)] px-6 py-24">
        <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-[var(--rashid-color-19c6d4)]/10 blur-3xl" />
        <div className="absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-[var(--rashid-color-ffd54a)]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[var(--rashid-color-0e9faa)] shadow-lg">{methodologyHeader.title}</div>
            <h2 className="text-4xl font-black leading-[1.3] text-[var(--rashid-color-14224a)] md:text-6xl">{methodologyHeader.subtitle}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-9 text-[var(--rashid-color-526079)]">{methodologyHeader.description}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {landingItems(landing, "methodology").map((item) => (
              <div key={item.item_key} className="group rounded-[2rem] border border-white bg-white p-6 shadow-[0_18px_45px_rgba(18,34,74,.08)] transition hover:-translate-y-2">
                <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] bg-white shadow">
                  <LandingIcon
                    item={item}
                    className="text-6xl"
                    imageClassName="h-full w-full object-cover"
                  />
                </div>  

                <h3 className="text-2xl font-black text-[var(--rashid-color-14224a)] text-center">{item.title}</h3>
                <p className="mt-4 text-base font-semibold leading-8 text-[var(--rashid-color-526079)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full bg-[var(--rashid-color-e8fbfd)] px-5 py-2 text-sm font-black text-[var(--rashid-color-0e9faa)] shadow-lg">{parentsHeader.title}</div>
            <h2 className="text-4xl font-black text-[var(--rashid-color-14224a)] md:text-6xl">{parentsHeader.subtitle}</h2>
          </div>
        </div>

        <LandingSimpleCardsSlider items={landingItems(landing, "parent_feature")} />
      </section>

      <section id="programs" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-[var(--rashid-color-e8fbfd)] px-5 py-2 font-black text-[var(--rashid-color-0e9faa)]">{programsHeader.title}</div>
              <h2 className="text-4xl font-black text-[var(--rashid-color-14224a)] md:text-5xl">{programsHeader.subtitle}</h2>
            </div>
            <Link href={programsHeader.button_link || "/child/programs"} className="group inline-flex items-center gap-3 rounded-full bg-[var(--rashid-color-f5fbff)] px-7 py-4 text-[var(--rashid-color-14224a)] shadow-lg transition hover:-translate-y-1 hover:bg-[var(--rashid-color-19c6d4)] hover:text-white"><span className="text-base font-black">{programsHeader.button_text}</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--rashid-color-0e9faa)]">←</span></Link>
          </div>

          {programs.length > 0 ? (
            <div className={`grid gap-6 ${programs.length === 1 ? "mx-auto max-w-[420px]" : programs.length === 2 ? "mx-auto max-w-4xl md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {programs.slice(0, 6).map((program) => (
                <Link key={program.id} href={`/child/programs/${program.slug}`} className="overflow-hidden rounded-[2rem] border border-[var(--rashid-color-e7f0f7)] bg-white shadow-[0_18px_45px_rgba(18,34,74,.08)] transition hover:-translate-y-2">
                  {program.image_url ? <img src={getFileUrl(program.image_url)} alt={program.title} className="h- w-full object-cover" /> : <div className="h-44 bg-gradient-to-br from-[var(--rashid-color-19c6d4)] via-[var(--rashid-color-8b5cf6)] to-[var(--rashid-color-ffd54a)]" />}
                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap gap-2">{program.categories?.name && <span className="rounded-full bg-[var(--rashid-color-e8fbfd)] px-4 py-2 text-sm font-black text-[var(--rashid-color-0e9faa)]">{program.categories.name}</span>}<span className={`rounded-full px-4 py-2 text-sm font-black ${program.access_type === "pro" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{program.access_type === "pro" ? "👑 Pro" : "🟢 مجاني"}</span></div>
                    <h3 className="text-2xl font-black text-[var(--rashid-color-14224a)]">{program.title}</h3>
                    {program.description && <p className="mt-3 line-clamp-2 leading-7 text-[var(--rashid-color-526079)]">{program.description}</p>}
                    <div className="mt-6 inline-flex rounded-full bg-[var(--rashid-color-19c6d4)] px-6 py-3 font-black text-white">{program.access_type === "pro" ? "مشاهدة التفاصيل" : "جرّب الآن"}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : <div className="rounded-[2.5rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] bg-[var(--rashid-color-f9fffd)] p-12 text-center"><h3 className="text-3xl font-black text-[var(--rashid-color-14224a)]">لا توجد برامج منشورة حاليًا</h3></div>}
        </div>
      </section>

      <section id="stories" className="bg-[var(--rashid-color-f5fbff)] px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_60px_rgba(18,34,74,.08)]"><img src={landingMediaSrc(storiesHeader.image_url) || "/images/gamestory.png"} alt="عالم راشد" className="h-80 w-full rounded-[2rem] object-cover" /></div>
          <div>
            <div className="mb-5 inline-flex rounded-full bg-white px-5 py-2 font-black text-[var(--rashid-color-8b5cf6)] shadow-lg">{storiesHeader.title}</div>
            <h2 className="text-4xl font-black leading-[1.35] text-[var(--rashid-color-14224a)] md:text-5xl">{storiesHeader.subtitle}</h2>
            <p className="mt-6 text-lg font-semibold leading-9 text-[var(--rashid-color-526079)]">{storiesHeader.description}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {landingItems(landing, "story_feature").map((item) => <div key={item.item_key} className="rounded-2xl bg-white p-5 text-lg font-black text-[var(--rashid-color-14224a)] shadow-lg"><span className="ml-2 inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl align-middle"><LandingIcon item={item} className="text-2xl" imageClassName="h-full w-full object-cover" /></span>{item.title}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div className="mb-5 inline-flex rounded-full bg-[var(--rashid-color-e8fbfd)] px-5 py-2 font-black text-[var(--rashid-color-0e9faa)]">{plansHeader.title}</div>
            <h2 className="text-4xl font-black text-[var(--rashid-color-14224a)] md:text-5xl">{plansHeader.subtitle}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-9 text-[var(--rashid-color-526079)]">{plansHeader.description}</p>
          </div>

          {plans.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className={`rounded-[2.5rem] p-8 shadow-xl transition hover:-translate-y-2 ${plan.is_featured ? "bg-[var(--rashid-color-14224a)] text-white" : "bg-[var(--rashid-color-f5fbff)] text-[var(--rashid-color-14224a)]"}`}>
                  {plan.is_featured && <div className="mb-5 inline-flex rounded-full bg-[var(--rashid-color-ffd54a)] px-4 py-2 text-sm font-black text-[var(--rashid-color-14224a)]">الأكثر اختيارًا</div>}
                  <h3 className="text-3xl font-black">{plan.name}</h3>
                  {plan.description && <p className={`mt-3 leading-7 ${plan.is_featured ? "text-white/70" : "text-[var(--rashid-color-526079)]"}`}>{plan.description}</p>}
                  <div className="mt-7 flex items-end gap-2"><span className="text-5xl font-black">{plan.price}</span>{plan.currency && <span className={plan.is_featured ? "text-white/60" : "text-[var(--rashid-color-526079)]"}>{plan.currency}{plan.period ? ` / ${plan.period}` : ""}</span>}</div>
                  <div className="mt-8 space-y-4">{plan.features?.map((feature, index) => <div key={`${feature}-${index}`} className="flex items-center gap-3 font-bold"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${plan.is_featured ? "bg-white/15 text-[var(--rashid-color-ffd54a)]" : "bg-white text-[var(--rashid-color-19c6d4)]"}`}>✓</span>{feature}</div>)}</div>
                  <Link href={user ? "/dashboard" : "/register"} className={`mt-9 block w-full rounded-full py-4 text-center font-black ${plan.is_featured ? "bg-[var(--rashid-color-ffd54a)] text-[var(--rashid-color-14224a)]" : "bg-[var(--rashid-color-19c6d4)] text-white"}`}>{user ? "إدارة الاشتراك" : "ابدأ الآن"}</Link>
                </div>
              ))}
            </div>
          ) : <div className="mx-auto max-w-3xl rounded-[2.5rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] bg-[var(--rashid-color-f5fbff)] p-12 text-center"><h3 className="text-3xl font-black">لا توجد خطط مفعّلة حاليًا</h3><p className="mt-4 text-[var(--rashid-color-526079)]">عند إضافة خطط من لوحة الإدارة ستظهر هنا تلقائيًا.</p></div>}
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24 text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/rashid-hero-bg.png')" }} />
        <div className="absolute inset-0 bg-[var(--rashid-color-14224a)]/60 backdrop-blur-[1px]" />
        <div className="relative mx-auto max-w-4xl">
          <img src={landingMediaSrc(cta.image_url) || "/images/logo-horrizental.png"} alt="راشد" className="mx-auto mb-8 h-24 w-auto" />
          <h2 className="text-4xl font-black md:text-6xl">{cta.title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-9 text-white/80">{cta.description}</p>
          <div className="mt-10 flex justify-center gap-4"><Link href={user ? "/dashboard" : text(cta.button_link, "/register")} className="rounded-full bg-[var(--rashid-color-ffd54a)] px-9 py-4 text-lg font-black text-[var(--rashid-color-14224a)]">{user ? "لوحة التحكم" : cta.button_text}</Link></div>
        </div>
      </section>

      <footer className="bg-[var(--rashid-color-101b3d)] px-6 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div><img src={landingMediaSrc(footer.image_url) || "/images/logo-horrizental.png"} alt="راشد" className="mb-4 h-16 w-auto" /><p className="leading-8 text-white/60">{footer.title}</p></div>
          <div><h4 className="mb-4 font-black">المنصة</h4><p className="mb-3 text-white/55">عن راشد</p><p className="mb-3 text-white/55">البرامج</p><p className="mb-3 text-white/55">منهجية راشد</p></div>
          <div><h4 className="mb-4 font-black">الحسابات</h4><p className="mb-3 text-white/55">ولي الأمر</p><p className="mb-3 text-white/55">الطفل</p><p className="mb-3 text-white/55">الإدارة</p></div>
          <div><h4 className="mb-4 font-black">تواصل معنا</h4>{footerLines.map((line) => <p key={line} className="mb-3 text-white/55">{line}</p>)}</div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-white/40">{footer.subtitle}</div>
      </footer>
    </main>
  );
}
