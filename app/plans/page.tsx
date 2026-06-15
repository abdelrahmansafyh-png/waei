
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParentLayout from "@/components/parent/ParentLayout";
import ChildLayout from "@/components/child/ChildLayout";

type Profile = {
  id: string;
  user_id?: string | null;
  role: "parent" | "child" | "admin";
  full_name?: string | null;
  nickname?: string | null;
  gender?: "male" | "female" | null;
  parent_profile_id?: string | null;
  parent_user_id?: string | null;
  plan?: string | null;
  pro_until?: string | null;
};

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  currency?: string | null;
  period?: string | null;
  features?: string[] | null;
  is_featured?: boolean | null;
  duration_days?: number | null;
  sort_order?: number | null;
};

export default function PlansPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) || null,
    [children, selectedChildId]
  );

  const targetAccount = profile?.role === "parent" ? selectedChild : profile;

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    if (!profileData) {
      router.push("/login");
      return;
    }

    setProfile(profileData);

    const { data: plansData, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (plansError) {
      alert(plansError.message);
    }

    setPlans((plansData || []) as Plan[]);

    if (profileData.role === "parent") {
      const { data: childrenData, error: childrenError } = await supabase
        .from("profiles")
        .select("*")
        .eq("parent_profile_id", profileData.id)
        .eq("role", "child")
        .order("created_at", { ascending: false });

      if (childrenError) {
        alert(childrenError.message);
      }

      const loadedChildren = (childrenData || []) as Profile[];
      setChildren(loadedChildren);

      if (loadedChildren.length) {
        const stillExists = loadedChildren.some(
          (child) => child.id === selectedChildId
        );

        setSelectedChildId(stillExists ? selectedChildId : loadedChildren[0].id);
      } else {
        setSelectedChildId("");
      }
    }

    setLoading(false);
  }

  function isFreePlan(plan: Plan) {
    const priceNumber = Number(String(plan?.price || "0").replace(/[^0-9.]/g, ""));

    return (
      priceNumber === 0 ||
      plan?.price === "0" ||
      plan?.name?.toLowerCase() === "free" ||
      plan?.name === "مجاني"
    );
  }

  function isProActive(account: Profile | null | undefined) {
    if (!account) return false;
    if (account.plan !== "pro") return false;
    if (!account.pro_until) return true;

    return new Date(account.pro_until) > new Date();
  }

  function isPlanActive(account: Profile | null | undefined, plan: Plan) {
    if (!account || !plan) return false;

    if (isFreePlan(plan)) return !isProActive(account);

    return isProActive(account);
  }

  async function activatePlan(plan: Plan) {
    if (isFreePlan(plan)) return;

    if (!profile) {
      alert("لم يتم تحميل بيانات الحساب");
      return;
    }

    const targetProfileId = profile.role === "parent" ? selectedChildId : profile.id;

    if (!targetProfileId) {
      alert("اختر الطفل أولاً");
      return;
    }

    setActivating(plan.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/subscriptions/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          plan_id: plan.id,
          target_profile_id: targetProfileId,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        alert(json.message || "فشل تفعيل الاشتراك");
        setActivating(null);
        return;
      }

      await loadData();
      alert("تم تفعيل الاشتراك بنجاح ✅");
    } catch (error: any) {
      alert(error?.message || "حدث خطأ أثناء التفعيل");
    } finally {
      setActivating(null);
    }
  }

  function Layout({ children: content }: { children: React.ReactNode }) {
    if (profile?.role === "child") {
      return (
        <ChildLayout profile={profile} activeHref="/plans">
          <section
            className="min-h-screen bg-cover bg-fixed bg-center px-4 py-6 md:px-8"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.42), rgba(255,255,255,.42)), url("/images/kids-soft-bg.png")',
            }}
          >
            {content}
          </section>
        </ChildLayout>
      );
    }

    return <ParentLayout>{content}</ParentLayout>;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="rounded-[2rem] bg-white px-8 py-6 text-2xl font-black text-[#0B4D6B] shadow-xl">
            جاري تحميل الخطط...
          </div>
        </div>
      </Layout>
    );
  }

  const targetIsPro = isProActive(targetAccount);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-[2.6rem] bg-white/95 p-7 shadow-[0_18px_45px_rgba(62,87,120,.10)]">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[#E8F8F3] px-5 py-2 font-black text-[#42BFA8]">
                الخطط والاشتراكات
              </div>

              <h1 className="text-4xl font-black leading-[1.3] text-[#20294f]">
                {profile?.role === "parent"
                  ? "إدارة اشتراك الأطفال"
                  : "ترقية حسابي"}
              </h1>

              <p className="mt-3 max-w-2xl text-base font-bold leading-8 text-[#667085]">
                {profile?.role === "parent"
                  ? "اختر الطفل، ثم فعّل الخطة المناسبة له. الاشتراك يُطبق على الطفل المحدد فقط."
                  : "يمكنك ترقية حسابك للوصول إلى جميع البرامج والمميزات الحصرية داخل راشد."}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#F4FAF8] px-6 py-5 text-center">
              <div className="text-sm font-black text-[#667085]">الحساب المحدد</div>
              <div className="mt-2 max-w-[240px] truncate text-2xl font-black text-[#0B4D6B]">
                {targetAccount?.nickname || targetAccount?.full_name || "—"}
              </div>
              <div
                className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-black ${
                  targetIsPro
                    ? "bg-[#FFF8D9] text-[#8A6A00]"
                    : "bg-[#ECFBF7] text-[#0B4D6B]"
                }`}
              >
                {targetIsPro ? "👑 Pro" : "🟢 Free"}
              </div>
            </div>
          </div>
        </header>

        {profile?.role === "parent" && (
          <section className="mb-7 rounded-[2.3rem] bg-white/95 p-5 shadow-[0_14px_35px_rgba(62,87,120,.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-[#0B4D6B]">الأطفال</h2>
              <span className="text-sm font-black text-[#667085]">
                اختر من تريد تفعيل الخطة له
              </span>
            </div>

            {children.length ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {children.map((child) => {
                  const selected = selectedChildId === child.id;
                  const childPro = isProActive(child);

                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`flex min-w-[245px] items-center gap-4 rounded-[1.8rem] border-2 p-4 text-right transition ${
                        selected
                          ? "border-[#42BFA8] bg-[#ECFBF7] shadow-[0_12px_30px_rgba(66,191,168,.16)]"
                          : "border-[#E5EEF1] bg-white hover:border-[#BFE9DF]"
                      }`}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-white text-3xl shadow-sm">
                        {child.gender === "female" ? "👧" : "👦"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-lg font-black text-[#0B4D6B]">
                          {child.nickname || child.full_name}
                        </div>

                        <div className="mt-1 text-xs font-black text-[#667085]">
                          {childPro ? "👑 Pro" : "🟢 Free"}
                          {childPro && child.pro_until
                            ? ` • ${new Date(child.pro_until).toLocaleDateString("ar")}`
                            : ""}
                        </div>
                      </div>

                      {selected && (
                        <div className="rounded-full bg-[#42BFA8] px-3 py-1 text-xs font-black text-white">
                          محدد
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#FFF8D9] p-5 font-black text-[#8A6A00]">
                لا يوجد أبناء بعد. أضف طفل أولاً من لوحة ولي الأمر.
              </div>
            )}
          </section>
        )}

        {!plans.length ? (
          <div className="rounded-[2.5rem] bg-white p-10 text-center text-2xl font-black shadow-xl">
            لا توجد خطط مفعلة حاليًا
          </div>
        ) : (
          <section className="grid gap-5">
            {plans.map((plan) => {
              const free = isFreePlan(plan);
              const active = isPlanActive(targetAccount, plan);
              const featured = !!plan.is_featured;
              const features = Array.isArray(plan.features) ? plan.features : [];

              return (
                <article
                  key={plan.id}
                  className={`overflow-hidden rounded-[2.4rem] border p-5 shadow-[0_14px_35px_rgba(62,87,120,.08)] transition hover:-translate-y-1 ${
                    featured
                      ? "border-[#42BFA8] bg-gradient-to-br from-[#0B4D6B] to-[#246F82] text-white"
                      : "border-[#E6F1EE] bg-white/95 text-[#0B4D6B]"
                  }`}
                >
                  <div className="grid gap-5 xl:grid-cols-[1.15fr_.95fr_240px] xl:items-center">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] text-3xl ${
                          featured ? "bg-white/15" : "bg-[#EEF8F4]"
                        }`}
                      >
                        {free ? "🟢" : "👑"}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-3xl font-black">{plan.name}</h3>
                          {featured && (
                            <span className="rounded-full bg-white/15 px-4 py-1 text-xs font-black">
                              مميزة
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-3 max-w-xl font-bold leading-8 ${
                            featured ? "text-white/75" : "text-[#667085]"
                          }`}
                        >
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`rounded-[1.8rem] p-4 ${
                        featured ? "bg-white/10" : "bg-[#F8FBFC]"
                      }`}
                    >
                      <div className="mb-3 text-sm font-black opacity-70">المميزات</div>
                      <div className="grid gap-2 text-sm font-bold sm:grid-cols-2 xl:grid-cols-1">
                        {features.slice(0, 6).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                                featured ? "bg-white/15" : "bg-[#E7F8F1]"
                              }`}
                            >
                              ✓
                            </span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-4 text-center">
                        <div className="text-5xl font-black leading-none">{plan.price}</div>
                        <div
                          className={`mt-2 text-sm font-black ${
                            featured ? "text-white/70" : "text-[#667085]"
                          }`}
                        >
                          {plan.currency || "ر.ق"} / {plan.period || "شهريًا"}
                        </div>
                      </div>

                      {active ? (
                        <div
                          className={`rounded-[1.6rem] p-4 text-center font-black ${
                            featured ? "bg-white/15" : "bg-[#EEF8F3]"
                          }`}
                        >
                          {free ? "الخطة المجانية مفعلة ✅" : "أنت مشترك 👑"}
                          {!free && targetAccount?.pro_until && (
                            <div className="mt-2 text-xs opacity-70">
                              حتى {new Date(targetAccount.pro_until).toLocaleDateString("ar")}
                            </div>
                          )}
                        </div>
                      ) : free ? (
                        <div className="rounded-[1.6rem] bg-[#F4FAF8] p-4 text-center font-black text-[#667085]">
                          متاحة دائمًا
                        </div>
                      ) : (
                        <button
                          onClick={() => activatePlan(plan)}
                          disabled={
                            activating === plan.id ||
                            (profile?.role === "parent" && !selectedChildId)
                          }
                          className={`w-full rounded-[1.6rem] py-4 font-black transition hover:-translate-y-1 disabled:opacity-50 ${
                            featured
                              ? "bg-white text-[#0B4D6B]"
                              : "bg-[#0B4D6B] text-white"
                          }`}
                        >
                          {activating === plan.id ? "جاري التفعيل..." : "تفعيل الخطة"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </Layout>
  );
}
