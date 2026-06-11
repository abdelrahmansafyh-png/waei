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
  categories?: {
    name: string;
  } | null;
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

export default async function LandingPage() {
  const banners = await getBanners();
  const programs = await getPrograms();
  const plans = await getPlans();
  const user = await getCurrentUser();

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4FAF8] text-[#0B4D6B]">
      <style>{`
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: .35; transform: scale(1); }
          50% { opacity: .6; transform: scale(1.08); }
        }
        .float-soft { animation: floatSoft 4.5s ease-in-out infinite; }
        .pulse-soft { animation: pulseSoft 5s ease-in-out infinite; }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-[#DDEDEA] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="واعي" className="h-20 w-auto" />
            <div>
              <h1 className="text-3xl font-black">واعي</h1>
              <p className="text-sm font-medium text-[#2D9B87]">
                وعي · انتباه · عمق · ينمو
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-9 text-base font-bold md:flex">
            <a href="#how">منهجية واعي</a>
            <a href="#programs">البرامج</a>
            <a href="#plans">الاشتراكات</a>
            <a href="#contact">تواصل معنا</a>
          </nav>

          <LandingAuthActions />
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0B4D6B]">
        <div className="absolute -bottom-36 -right-20 h-96 w-96 rounded-full border-[55px] border-[#42BFA8]/10 pulse-soft" />
        <div className="absolute bottom-10 right-20 h-56 w-56 rounded-full border-[35px] border-[#42BFA8]/10 pulse-soft" />
        <div className="absolute left-24 top-24 h-48 w-48 rounded-full bg-[#42BFA8]/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <div className="relative z-10">
            <div className="mb-8 inline-flex rounded-full border border-[#D8F36A]/40 bg-white/10 px-6 py-2 text-lg font-bold text-[#D8F36A]">
              منصة واعي للطفل والأسرة
            </div>

            <h2 className="max-w-2xl text-5xl font-black leading-[1.25] text-white md:text-7xl">
              نساعد طفلك يكبر بثقة و
              <span className="text-[#D8F36A]"> نفسية سليمة</span>
            </h2>

            <p className="mt-8 max-w-xl text-xl leading-10 text-white/75">
              جلسات وبرامج تفاعلية مصممة بعناية لمساعدة الطفل على بناء وعيه
              بنفسه، وتنمية تركيزه ومهاراته بطريقة ممتعة.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="rounded-full bg-[#42BFA8] px-9 py-4 text-lg font-black text-white shadow-xl transition hover:-translate-y-1"
              >
                {user ? "اذهب للوحة التحكم" : "ابدأ الآن"}
              </Link>

              <a
                href="#how"
                className="rounded-full border border-white/35 bg-white/10 px-9 py-4 text-lg font-black text-white transition hover:bg-white hover:text-[#0B4D6B]"
              >
                تعرف على المنصة
              </a>
            </div>
          </div>

          <div className="relative z-10">
            <div className="float-soft mx-auto max-w-md rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur">
              <h3 className="mb-8 text-center text-3xl font-black text-white">
                منهجية واعي
              </h3>
              <p className="mb-8 text-center text-xl text-white/70">
                وعي · انتباه · عمق · ينمو
              </p>

              <div className="flex items-center justify-center gap-4">
                {[
                  ["و", "#2A6BB0"],
                  ["ا", "#42BFA8"],
                  ["ع", "#5AAD32"],
                  ["ي", "#D8F36A"],
                ].map(([letter, color]) => (
                  <div
                    key={letter}
                    className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black shadow-xl"
                    style={{
                      backgroundColor: color,
                      color: letter === "ي" ? "#0B4D6B" : "white",
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeBannersSlider banners={banners} />

      <section
        id="how"
        dir="rtl"
        className="relative overflow-hidden bg-[#0d4f6b] py-12 md:py-14"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.06),transparent_30%)]" />
        <div className="absolute -left-20 -top-24 h-80 w-80 rounded-full border border-white/5" />
        <div className="absolute -right-16 -bottom-24 h-72 w-72 rounded-full border border-white/5" />

        <div className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-12 px-6 lg:px-8">
          <div className="w-full max-w-[470px] text-right text-white">
            <p className="mb-3 text-xl font-bold text-[#5fd0a4]">
              منهجية واعي
            </p>

            <h2 className="text-3xl font-extrabold leading-[1.35] md:text-4xl">
              منهجية متكاملة لنمو
              <br />
              طفلك من الداخل للخارج
            </h2>

            <div className="my-5 h-1 w-12 rounded-full bg-[#5fd0a4]" />

            <p className="text-base font-semibold leading-8 text-white/90">
              تعتمد على أربع ركائز أساسية تساعد الطفل على بناء
              <br className="hidden md:block" />
              وعي ذاتي قوي، وتنمية مهاراته، وتحقيق أفضل نسخة منه.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-4 gap-4" dir="rtl">
            {[
              {
                letter: "و",
                title: "وعي",
                desc: "تبني الوعي الذاتي لدى الطفل بمشاعره وأفكاره",
                color: "bg-[#2d82b7]",
                card: "from-[#f7fbff] to-[#eef7ff]",
              },
              {
                letter: "ا",
                title: "انتباه",
                desc: "تنمي الانتباه والتركيز من خلال أنشطة ممتعة",
                color: "bg-[#37b79e]",
                card: "from-[#f3fffb] to-[#e8fbf7]",
              },
              {
                letter: "ع",
                title: "عمق",
                desc: "تعمق الفهم والإدراك بمحتوى مناسب لعمر الطفل",
                color: "bg-[#4ab66d]",
                card: "from-[#f6fff8] to-[#ecfff1]",
              },
              {
                letter: "ي",
                title: "ينمو",
                desc: "تحقق النمو والازدهار بنتائج قابلة للقياس.",
                color: "bg-[#ffc107]",
                card: "from-[#fff8dc] to-[#fff2bd]",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`min-h-[215px] rounded-[22px] bg-gradient-to-br ${item.card} px-6 py-6 text-center shadow-[0_16px_35px_rgba(0,0,0,0.18)]`}
              >
                <div
                  className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${item.color} text-2xl font-extrabold text-white shadow-lg`}
                >
                  {item.letter}
                </div>

                <h3 className="mb-3 text-2xl font-extrabold text-[#26364a]">
                  {item.title}
                </h3>

                <p className="mx-auto max-w-[140px] text-sm font-semibold leading-7 text-[#1f2937]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="programs" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
                برامج واعي
              </div>

              <h2 className="text-5xl font-black text-[#0B4D6B]">
                جرّب برامجنا التفاعلية
              </h2>
            </div>

            <Link
              href="/programs"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-[#0B4D6B] shadow-[0_8px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#42BFA8] hover:bg-[#42BFA8] hover:text-white"
            >
              <span className="text-base font-black">عرض كل البرامج</span>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4FAF8] text-[#42BFA8] transition-all duration-300 group-hover:bg-white group-hover:text-[#42BFA8]">
                ←
              </div>
            </Link>
          </div>

          {programs.length > 0 ? (
            <div
              className={`grid gap-6 ${
                programs.length === 1
                  ? "mx-auto max-w-[420px]"
                  : programs.length === 2
                  ? "mx-auto max-w-4xl md:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {programs.slice(0, 6).map((program) => (
                <Link
                  key={program.id}
                  href={`/child/programs/${program.slug}`}
                  className="overflow-hidden rounded-[2rem] border border-[#DDEDEA] bg-[#F9FFFD] shadow-xl shadow-teal-50 transition hover:-translate-y-2"
                >
                  {program.image_url ? (
                    <img
                      src={getFileUrl(program.image_url)}
                      alt={program.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-[#42BFA8] to-[#D8F36A]" />
                  )}

                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {program.categories?.name && (
                        <span className="rounded-full bg-[#D9F5EE] px-4 py-2 text-sm font-black text-[#0B4D6B]">
                          {program.categories.name}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-black ${
                          program.access_type === "pro"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {program.access_type === "pro" ? "👑 Pro" : "🟢 مجاني"}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-[#0B4D6B]">
                      {program.title}
                    </h3>

                    {program.description && (
                      <p className="mt-3 line-clamp-2 leading-7 text-[#6E7A99]">
                        {program.description}
                      </p>
                    )}

                    <div className="mt-6 inline-flex rounded-full bg-[#42BFA8] px-6 py-3 font-black text-white">
                      {program.access_type === "pro"
                        ? "مشاهدة التفاصيل"
                        : "جرّب الآن"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-[#F9FFFD] p-12 text-center">
              <h3 className="text-3xl font-black text-[#0B4D6B]">
                لا توجد برامج منشورة حاليًا
              </h3>
            </div>
          )}
        </div>
      </section>

      <section id="plans" className="bg-[#F4FAF8] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div className="mb-5 inline-flex rounded-full bg-[#D9F5EE] px-5 py-2 font-black text-[#0B4D6B]">
              خطط الاشتراك
            </div>

            <h2 className="text-5xl font-black">
              اختر الخطة المناسبة لطفلك
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-9 text-[#6E7A99]">
              خطط مرنة للأطفال، ويتم تعديل الأسعار والمميزات من لوحة التحكم.
            </p>
          </div>

          {plans.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-[2.5rem] p-8 shadow-xl transition hover:-translate-y-2 ${
                    plan.is_featured
                      ? "bg-[#0B4D6B] text-white"
                      : "bg-white text-[#0B4D6B]"
                  }`}
                >
                  {plan.is_featured && (
                    <div className="mb-5 inline-flex rounded-full bg-[#D8F36A] px-4 py-2 text-sm font-black text-[#0B4D6B]">
                      الأكثر اختيارًا
                    </div>
                  )}

                  <h3 className="text-3xl font-black">{plan.name}</h3>

                  {plan.description && (
                    <p
                      className={`mt-3 leading-7 ${
                        plan.is_featured ? "text-white/70" : "text-[#6E7A99]"
                      }`}
                    >
                      {plan.description}
                    </p>
                  )}

                  <div className="mt-7 flex items-end gap-2">
                    <span className="text-5xl font-black">{plan.price}</span>

                    {plan.currency && (
                      <span
                        className={
                          plan.is_featured ? "text-white/60" : "text-[#6E7A99]"
                        }
                      >
                        {plan.currency}
                        {plan.period ? ` / ${plan.period}` : ""}
                      </span>
                    )}
                  </div>

                  <div className="mt-8 space-y-4">
                    {plan.features?.map((feature, index) => (
                      <div
                        key={`${feature}-${index}`}
                        className="flex items-center gap-3 font-bold"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            plan.is_featured
                              ? "bg-white/15 text-[#D8F36A]"
                              : "bg-[#D9F5EE] text-[#42BFA8]"
                          }`}
                        >
                          ✓
                        </span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={user ? "/dashboard" : "/register"}
                    className={`mt-9 block w-full rounded-full py-4 text-center font-black ${
                      plan.is_featured
                        ? "bg-[#D8F36A] text-[#0B4D6B]"
                        : "bg-[#42BFA8] text-white"
                    }`}
                  >
                    {user ? "إدارة الاشتراك" : "ابدأ الآن"}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-[2.5rem] border-2 border-dashed border-[#DDEDEA] bg-white p-12 text-center">
              <h3 className="text-3xl font-black">لا توجد خطط مفعّلة حاليًا</h3>
              <p className="mt-4 text-[#6E7A99]">
                عند إضافة خطط من لوحة الإدارة ستظهر هنا تلقائيًا.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        id="contact"
        className="bg-[#0B4D6B] px-6 py-24 text-center text-white"
      >
        <h2 className="text-5xl font-black">ابدأ رحلة طفلك اليوم 🌱</h2>

        <p className="mx-auto mt-5 max-w-2xl text-xl leading-9 text-white/70">
          انضم للأسر والمراكز التي تبني جيلًا واعيًا ومتوازنًا.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href={user ? "/dashboard" : "/register"}
            className="rounded-full bg-[#D8F36A] px-9 py-4 text-lg font-black text-[#0B4D6B]"
          >
            {user ? "لوحة التحكم" : "إنشاء حساب"}
          </Link>

          {!user && (
            // <Link
            //   href="/login"
            //   className="rounded-full border border-white/30 px-9 py-4 text-lg font-black text-white"
            // >
            //   تسجيل الدخول
            // </Link>

            <LandingAuthActions />
            
          )}
        </div>
      </section>

      <footer className="bg-[#07384D] px-6 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="واعي" className="h-16 w-auto" />
              <h3 className="text-2xl font-black">واعي</h3>
            </div>

            <p className="mt-4 leading-8 text-white/60">
              منصة تربوية صحية هادفة للأطفال، تبني جيلًا واعيًا ومتوازنًا.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-black">المنصة</h4>
            <p className="mb-3 text-white/55">من نحن</p>
            <p className="mb-3 text-white/55">البرامج</p>
            <p className="mb-3 text-white/55">منهجية واعي</p>
          </div>

          <div>
            <h4 className="mb-4 font-black">الحسابات</h4>
            <p className="mb-3 text-white/55">ولي الأمر</p>
            <p className="mb-3 text-white/55">الطفل</p>
            <p className="mb-3 text-white/55">الأدمن</p>
          </div>

          <div>
            <h4 className="mb-4 font-black">تواصل معنا</h4>
            <p className="mb-3 text-white/55">info@waei.health</p>
            <p className="mb-3 text-white/55">waeihealth@</p>
            <p className="mb-3 text-white/55">+974 5030 6611</p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-white/40">
          © 2026 منصة واعي — جميع الحقوق محفوظة
        </div>
      </footer>
    </main>
  );
}