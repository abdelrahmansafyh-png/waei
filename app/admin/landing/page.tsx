"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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

const defaultItems: LandingItem[] = [
  { section: "hero", item_key: "main", icon: "🌟", title: "تعلّم، العب، واكتشف", subtitle: "مع راشد", description: "منصة تفاعلية تساعد الأطفال على بناء صحة نفسية إيجابية وتنمية القيم والمهارات الحياتية من خلال القصص والألعاب والأنشطة والتجارب التفاعلية الممتعة.", button_text: "ابدأ اللعب الآن", button_link: "/register", image_url: "/images/logo.png", color_class: null, sort_order: 1, is_active: true },
  { section: "hero", item_key: "badge", icon: "🌟", title: "منصة تعليمية تفاعلية للأطفال", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "hero", item_key: "secondary_button", icon: "▷", title: null, subtitle: null, description: null, button_text: "تعرف على المنهجية", button_link: "#methodology", image_url: null, color_class: null, sort_order: 3, is_active: true },

  { section: "hero_feature", item_key: "games", icon: "🎮", title: "ألعاب تعليمية", subtitle: null, description: "ألعاب تفاعلية تنمي التفكير والذكاء.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "hero_feature", item_key: "safe", icon: "🎥", title: "برامج آمنة", subtitle: null, description: "محتوى هادف وممتع بجودة عالية.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "hero_feature", item_key: "stories", icon: "📖", title: "قصص تربوية", subtitle: null, description: "قصص ممتعة تغرس القيم وتنمي الخيال.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 3, is_active: true },
  { section: "hero_feature", item_key: "progress", icon: "⭐", title: "تقدم وتحفيز", subtitle: null, description: "نظام نقاط وشارات يحفّز الطفل على التعلم.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 4, is_active: true },

  { section: "methodology_header", item_key: "main", icon: null, title: "منهجية راشد", subtitle: "منهجية تبني المهارة والقيمة بطريقة ممتعة", description: "في راشد لا نقدم محتوى جامد؛ بل رحلة تفاعلية تجمع اللعب، القصة، التدريب، والمتابعة حتى يتعلم الطفل بسعادة وثقة.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "methodology", item_key: "journey", icon: "🧭", title: "رحلة تعلم موجهة", subtitle: null, description: "يبدأ كل برنامج بهدف واضح ومهارة محددة، ضمن مسار تعليمي متدرج يناسب عمر الطفل واحتياجاته.", button_text: null, button_link: null, image_url: null, color_class: "from-[#19C6D4] to-[#0F9EB2]", sort_order: 1, is_active: true },
  { section: "methodology", item_key: "stories", icon: "📖", title: "قصص ومواقف تفاعلية", subtitle: null, description: "يخوض الطفل مواقف واقعية وقصصًا تفاعلية، يختار فيها كيف يتصرف ليتعلم من نتائج قراراته.", button_text: null, button_link: null, image_url: null, color_class: "from-[#8B5CF6] to-[#6847F5]", sort_order: 2, is_active: true },
  { section: "methodology", item_key: "games", icon: "🎮", title: "ألعاب وتحديات تعليمية", subtitle: null, description: "أنشطة وألعاب تفاعلية تساعد الطفل على اكتساب المهارات بطريقة ممتعة ومشوقة.", button_text: null, button_link: null, image_url: null, color_class: "from-[#6ED46E] to-[#3AAE55]", sort_order: 3, is_active: true },
  { section: "methodology", item_key: "daily", icon: "🚀", title: "تطبيق في الحياة اليومية", subtitle: null, description: "تدريبات عملية تساعد الطفل على تحويل ما تعلمه إلى سلوك يومي دائم.", button_text: null, button_link: null, image_url: null, color_class: "from-[#FFD54A] to-[#F59E0B]", sort_order: 4, is_active: true },

  { section: "parents_header", item_key: "main", icon: null, title: "لماذا يختار الآباء راشد؟", subtitle: "تجربة تعليمية مختلفة لطفلك", description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "parent_feature", item_key: "practice", icon: "🌱", title: "تعلم بالممارسة", subtitle: null, description: "يطبق الطفل ما يتعلمه عبر أنشطة وتجارب تفاعلية.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "parent_feature", item_key: "path", icon: "🛤️", title: "مسار متدرج", subtitle: null, description: "محتوى مصمم ليناسب عمر الطفل ومستواه في كل مرحلة.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "parent_feature", item_key: "rewards", icon: "🏆", title: "تحفيز ومكافآت", subtitle: null, description: "نظام نقاط وإنجازات يحفز الطفل على الاستمرار والتقدم.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 3, is_active: true },
  { section: "parent_feature", item_key: "family", icon: "👨‍👩‍👧", title: "مشاركة الأسرة", subtitle: null, description: "متابعة تقدم الطفل ودعمه في رحلته التعليمية.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 4, is_active: true },

  { section: "stories_header", item_key: "main", icon: null, title: "القصص والألعاب", subtitle: "كل نشاط داخل راشد مصمم ليعلّم الطفل قرارًا أو مهارة", description: "القصص التفاعلية تجعل الطفل يعيش الموقف، والألعاب تحول التدريب إلى تجربة ممتعة قابلة للقياس والمتابعة.", button_text: null, button_link: null, image_url: "/images/gamestory.png", color_class: null, sort_order: 1, is_active: true },
  { section: "story_feature", item_key: "decision", icon: "🎭", title: "قصص بقرارات", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  { section: "story_feature", item_key: "skills", icon: "🧩", title: "ألعاب مهارات", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 2, is_active: true },
  { section: "story_feature", item_key: "audio", icon: "🔊", title: "أصوات موجهة", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 3, is_active: true },
  { section: "story_feature", item_key: "results", icon: "🏆", title: "نتائج وتقدم", subtitle: null, description: null, button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 4, is_active: true },

  { section: "plans_header", item_key: "main", icon: null, title: "خطط الاشتراك", subtitle: "اختر الخطة المناسبة لطفلك", description: "خطط مرنة للأطفال، ويتم تعديل الأسعار والمميزات من لوحة التحكم.", button_text: null, button_link: null, image_url: null, color_class: null, sort_order: 1, is_active: true },
  // { section: "cta", item_key: "main", icon: null, title: "ابدأ رحلة طفلك مع راشد اليوم", subtitle: null, description: "انضم لمنصة تجمع بين التعلم والمرح والمتابعة في مكان واحد.", button_text: "إنشاء حساب", button_link: "/register", image_url: "/images/logo-horrizental.png", color_class: null, sort_order: 1, is_active: true },
  { section: "footer", item_key: "main", icon: null, title: "منصة تعليمية تفاعلية آمنة للأطفال، تبني المهارات والقيم بطريقة ممتعة.", subtitle: "© 2026 منصة راشد — جميع الحقوق محفوظة", description: "info@rashid.app\n@rashid\n+974 5030 6611", button_text: null, button_link: null, image_url: "/images/logo-horrizental.png", color_class: null, sort_order: 1, is_active: true },
];

const sectionLabels: Record<string, string> = {
  hero: "قسم البداية",
  hero_feature: "مميزات البداية",
  methodology_header: "عنوان المنهجية",
  methodology: "بطاقات المنهجية",
  parents_header: "عنوان مميزات الآباء",
  parent_feature: "مميزات الآباء",
  stories_header: "قسم القصص والألعاب",
  story_feature: "مميزات القصص والألعاب",
  plans_header: "عنوان الاشتراكات",
  cta: "دعوة التسجيل",
  footer: "الفوتر",
};

const sectionHelp: Record<string, string> = {
  hero: "قسم البداية: العنوان الرئيسي، الشارة، والأزرار.",
  hero_feature: "الكروت الأربعة أسفل البداية. عدّل الأيقونة أو اختر صورة من الجهاز بدلها.",
  methodology_header: "عنوان ووصف قسم المنهجية.",
  methodology: "بطاقات المنهجية. عدّل الأيقونة أو اختر صورة من الجهاز بدلها.",
  parents_header: "عنوان قسم لماذا يختار الآباء راشد.",
  parent_feature: "بطاقات مميزات الآباء. يمكن استخدام أيقونة أو صورة صغيرة.",
  stories_header: "عنوان ووصف وصورة قسم القصص والألعاب.",
  story_feature: "الكروت الصغيرة داخل قسم القصص والألعاب. يمكن استخدام أيقونة أو صورة صغيرة.",
  plans_header: "عنوان قسم الاشتراكات. الخطط نفسها تأتي من جدول الاشتراكات.",
  // cta: "قسم الدعوة للتسجيل أسفل الصفحة.",
  footer: "نصوص وصورة الفوتر.",
};

const cardSections = new Set(["hero_feature", "methodology", "parent_feature", "story_feature"]);
const imageSections = new Set(["hero", "stories_header", "cta", "footer"]);
const buttonSections = new Set(["hero", "programs_header", "cta"]);
const linkSections = new Set(["nav", "hero", "programs_header", "cta"]);
const descriptionSections = new Set(["hero", "hero_feature", "methodology_header", "methodology", "parent_feature", "stories_header", "plans_header", "cta", "footer"]);
const subtitleSections = new Set(["hero", "methodology_header", "parents_header", "programs_header", "stories_header", "plans_header", "footer"]);

function fieldValue(value: string | null | undefined) {
  return value || "";
}

function getMediaType(item: LandingItem) {
  return item.image_url ? "image" : "icon";
}

function imageSrc(path: string | null | undefined) {
  if (!path) return "";
  return path.startsWith("http") || path.startsWith("/images") ? path : `${process.env.NEXT_PUBLIC_FILES_URL || ""}${path}`;
}

export default function AdminLandingPage() {
  const [items, setItems] = useState<LandingItem[]>(defaultItems);
  const [activeSection, setActiveSection] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dbError, setDbError] = useState("");
  const [uploadingKey, setUploadingKey] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setDbError("");

    const { data, error } = await supabase
      .from("landing_content")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setDbError("جدول landing_content غير موجود أو الصلاحيات غير مفعلة. نفّذ ملف SQL المرفق أولًا.");
      setItems(defaultItems);
      setLoading(false);
      return;
    }

    const savedMap = new Map<string, LandingItem>();
    (data || []).forEach((item: any) => savedMap.set(`${item.section}.${item.item_key}`, item));

    setItems(
      defaultItems.map((item) => ({
        ...item,
        ...(savedMap.get(`${item.section}.${item.item_key}`) || {}),
      }))
    );
    setLoading(false);
  }

  function updateItem(index: number, key: keyof LandingItem, value: any) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  }

  function setMediaType(index: number, type: "icon" | "image") {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        image_url: type === "icon" ? null : copy[index].image_url,
        icon: type === "image" ? copy[index].icon || "" : copy[index].icon,
      };
      return copy;
    });
  }

  async function uploadImage(index: number, file: File | null) {
    if (!file) return;

    const item = items[index];
    const key = `${item.section}.${item.item_key}`;
    setUploadingKey(key);
    setMessage("");
    setDbError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "landing");

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setDbError(json.message || "فشل رفع الصورة.");
        setUploadingKey("");
        return;
      }

      updateItem(index, "image_url", json.path || json.url);
      updateItem(index, "icon", null);
      setMessage("تم رفع الصورة. اضغط حفظ كل التعديلات لتثبيتها.");
    } catch (error: any) {
      setDbError(error?.message || "فشل رفع الصورة.");
    }

    setUploadingKey("");
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    setDbError("");

    const payload = items.map(({ id, ...item }) => ({
      ...item,
      icon: item.icon || null,
      title: item.title || null,
      subtitle: item.subtitle || null,
      description: item.description || null,
      button_text: item.button_text || null,
      button_link: item.button_link || null,
      image_url: item.image_url || null,
      color_class: item.color_class || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("landing_content")
      .upsert(payload, { onConflict: "section,item_key" });

    if (error) {
      setDbError(error.message);
      setSaving(false);
      return;
    }

    setMessage("تم حفظ إعدادات الصفحة الرئيسية.");
    setSaving(false);
    loadItems();
  }

  const sections = useMemo(() => Array.from(new Set(defaultItems.map((item) => item.section))), []);
  const visibleItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.section === activeSection)
    .sort((a, b) => (a.item.sort_order || 0) - (b.item.sort_order || 0));

  function canUseMedia(item: LandingItem) {
    return cardSections.has(item.section) || imageSections.has(item.section) || item.section === "hero";
  }

  return (
    <section dir="rtl">
      <div className="mb-8 rounded-[2rem] bg-gradient-to-l from-[#0B4D6B] to-[#42BFA8] p-8 text-white shadow-lg">
        <h2 className="text-4xl font-black">إعدادات الصفحة الرئيسية</h2>
        <p className="mt-3 text-white/80">تحكم فقط بالعناصر الظاهرة فعليًا في الصفحة الرئيسية.</p>
      </div>

      {dbError && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 font-bold leading-8 text-red-700">
          {dbError}
          <div className="mt-2 text-sm">الملف المطلوب: <code>supabase/landing_content.sql</code></div>
        </div>
      )}

      {message && <div className="mb-6 rounded-3xl bg-green-50 p-5 font-black text-green-700">{message}</div>}

      <div className="mb-6 flex flex-wrap gap-2 rounded-[2rem] bg-white p-4 shadow-lg">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`rounded-full px-5 py-3 text-sm font-black transition ${
              activeSection === section ? "bg-[#0B4D6B] text-white" : "bg-[#F5FAF8] text-[#0B4D6B]"
            }`}
          >
            {sectionLabels[section] || section}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-[2rem] bg-[#F5FAF8] p-5 font-bold leading-8 text-[#0B4D6B]">
        {sectionHelp[activeSection]}
      </div>

      {loading ? (
        <div className="rounded-[2rem] bg-white p-10 text-center text-xl font-black text-[#0B4D6B] shadow-lg">جاري التحميل...</div>
      ) : (
        <div className="space-y-5">
          {visibleItems.map(({ item, index }) => {
            const mediaType = getMediaType(item);
            const itemKey = `${item.section}.${item.item_key}`;
            const showMediaControls = canUseMedia(item);
            const showSubtitle = subtitleSections.has(item.section);
            const showDescription = descriptionSections.has(item.section);
            const showButton = buttonSections.has(item.section);
            const showLink = linkSections.has(item.section);

            return (
              <div key={itemKey} className="rounded-[2rem] bg-white p-6 shadow-lg">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E4EFEA] pb-4">
                  <div>
                    <div className="text-xs font-black text-[#42BFA8]">{itemKey}</div>
                    <h3 className="mt-1 text-2xl font-black text-[#0B4D6B]">{item.title || item.button_text || item.item_key}</h3>
                  </div>

                  <label className="flex items-center gap-2 rounded-full bg-[#F5FAF8] px-4 py-2 font-black text-[#0B4D6B]">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(e) => updateItem(index, "is_active", e.target.checked)}
                    />
                    مفعّل
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {showMediaControls && (
                    <div className="rounded-2xl border border-[#E4EFEA] bg-[#F9FFFD] p-4 md:col-span-2">
                      <div className="mb-3 font-black text-[#0B4D6B]">الأيقونة / الصورة الصغيرة</div>
                      <div className="mb-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setMediaType(index, "icon")}
                          className={`rounded-full px-5 py-2 font-black ${mediaType === "icon" ? "bg-[#0B4D6B] text-white" : "bg-white text-[#0B4D6B]"}`}
                        >
                          أيقونة
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaType(index, "image")}
                          className={`rounded-full px-5 py-2 font-black ${mediaType === "image" ? "bg-[#0B4D6B] text-white" : "bg-white text-[#0B4D6B]"}`}
                        >
                          صورة
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[90px_1fr] md:items-center">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow">
                          {item.image_url ? (
                            <img src={imageSrc(item.image_url)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl">{item.icon || "🖼️"}</span>
                          )}
                        </div>

                        <div className="grid gap-3">
                          <label className="block">
                            <span className="mb-2 block font-black text-[#0B4D6B]">الأيقونة</span>
                            <input
                              className="w-full rounded-2xl border border-[#E4EFEA] p-3"
                              value={fieldValue(item.icon)}
                              onChange={(e) => {
                                updateItem(index, "icon", e.target.value);
                                if (e.target.value) updateItem(index, "image_url", null);
                              }}
                              placeholder="مثال: 🎮"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block font-black text-[#0B4D6B]">اختيار صورة من الجهاز بدل الأيقونة</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => uploadImage(index, e.target.files?.[0] || null)}
                              className="w-full rounded-2xl border border-[#E4EFEA] bg-white p-3"
                            />
                          </label>

                          {item.image_url && (
                            <button
                              type="button"
                              onClick={() => updateItem(index, "image_url", null)}
                              className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600"
                            >
                              حذف الصورة والرجوع للأيقونة
                            </button>
                          )}

                          {uploadingKey === itemKey && <div className="text-sm font-black text-[#42BFA8]">جاري رفع الصورة...</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* <label className="block">
                    <span className="mb-2 block font-black text-[#0B4D6B]">الترتيب</span>
                    <input type="number" className="w-full rounded-2xl border border-[#E4EFEA] p-3" value={item.sort_order || 0} onChange={(e) => updateItem(index, "sort_order", Number(e.target.value))} />
                  </label> */}

                  <label className="block md:col-span-2">
                    <span className="mb-2 block font-black text-[#0B4D6B]">العنوان</span>
                    <input className="w-full rounded-2xl border border-[#E4EFEA] p-3" value={fieldValue(item.title)} onChange={(e) => updateItem(index, "title", e.target.value)} />
                  </label>

                  {showSubtitle && (
                    <label className="block md:col-span-2">
                      <span className="mb-2 block font-black text-[#0B4D6B]">العنوان الفرعي</span>
                      <input className="w-full rounded-2xl border border-[#E4EFEA] p-3" value={fieldValue(item.subtitle)} onChange={(e) => updateItem(index, "subtitle", e.target.value)} />
                    </label>
                  )}

                  {showDescription && (
                    <label className="block md:col-span-2">
                      <span className="mb-2 block font-black text-[#0B4D6B]">الوصف</span>
                      <textarea rows={4} className="w-full rounded-2xl border border-[#E4EFEA] p-3" value={fieldValue(item.description)} onChange={(e) => updateItem(index, "description", e.target.value)} />
                    </label>
                  )}

                  {/* {showButton && (
                    <label className="block">
                      <span className="mb-2 block font-black text-[#0B4D6B]">نص الزر</span>
                      <input className="w-full rounded-2xl border border-[#E4EFEA] p-3" value={fieldValue(item.button_text)} onChange={(e) => updateItem(index, "button_text", e.target.value)} />
                    </label>
                  )} */}

                  {/* {showLink && (
                    <label className="block">
                      <span className="mb-2 block font-black text-[#0B4D6B]">الرابط</span>
                      <input className="w-full rounded-2xl border border-[#E4EFEA] p-3" value={fieldValue(item.button_link)} onChange={(e) => updateItem(index, "button_link", e.target.value)} placeholder="#programs أو /register" />
                    </label>
                  )} */}
                </div>
              </div>
            );
          })}

          <div className="sticky bottom-4 z-20 flex justify-end">
            <button
              onClick={saveAll}
              disabled={saving}
              className="rounded-full bg-[#42BFA8] px-9 py-4 text-lg font-black text-white shadow-xl disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ كل التعديلات"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
