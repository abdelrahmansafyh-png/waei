"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";

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

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  button_text: "ابدأ الآن",
  button_link: "",
  open_in_new_tab: true,
  is_active: true,
  sort_order: 0,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setBanners((data as Banner[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(banner: Banner) {
    setEditingId(banner.id);

    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      image_url: banner.image_url || "",
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      open_in_new_tab: banner.open_in_new_tab ?? true,
      is_active: banner.is_active,
      sort_order: banner.sort_order || 0,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadImage(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("الملف يجب أن يكون صورة");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "banners");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "فشل رفع الصورة");
        setUploading(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        image_url: result.path,
      }));
    } catch {
      alert("حدث خطأ أثناء رفع الصورة");
    }

    setUploading(false);
  }

  async function saveBanner(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      image_url: form.image_url || null,
      button_text: form.button_text || null,
      button_link: form.button_link || null,
      open_in_new_tab: form.open_in_new_tab,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };

    const { error } = editingId
      ? await supabase
          .from("banners")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("banners").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    fetchBanners();
  }

  async function toggleActive(banner: Banner) {
    const { error } = await supabase
      .from("banners")
      .update({
        is_active: !banner.is_active,
      })
      .eq("id", banner.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchBanners();
  }

  async function deleteBanner(id: string) {
    if (!confirm("هل تريد حذف البانر؟")) return;

    const { error } = await supabase
      .from("banners")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    fetchBanners();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--rashid-color-f4faf8)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black text-[var(--rashid-color-0b4d6b)]">
              إدارة البانرات
            </h1>

            <p className="mt-3 text-[var(--rashid-color-6e7a99)]">
              يمكنك إضافة بانرات وربطها بأي صفحة أو رابط خارجي.
            </p>
          </div>

          <button
            onClick={resetForm}
            className="rounded-full bg-[var(--rashid-color-0b4d6b)] px-6 py-3 font-black text-white"
          >
            إضافة بانر جديد
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[430px_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-black text-[var(--rashid-color-0b4d6b)]">
              {editingId ? "تعديل البانر" : "إضافة بانر"}
            </h2>

            <form onSubmit={saveBanner} className="space-y-4">
              <input
                required
                placeholder="عنوان البانر"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none focus:border-[var(--rashid-color-42bfa8)]"
              />

              <input
                placeholder="عنوان فرعي"
                value={form.subtitle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subtitle: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none focus:border-[var(--rashid-color-42bfa8)]"
              />

              <textarea
                placeholder="الوصف"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="h-28 w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none focus:border-[var(--rashid-color-42bfa8)]"
              />

              <div className="rounded-2xl border border-dashed border-[var(--rashid-color-42bfa8)] bg-[var(--rashid-color-f4faf8)] p-5">
                <label className="mb-3 block font-black text-[var(--rashid-color-0b4d6b)]">
                  صورة البانر
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      uploadImage(file);
                    }
                  }}
                  className="w-full cursor-pointer rounded-xl bg-white p-3 text-sm"
                />

                {uploading && (
                  <p className="mt-3 font-bold text-[var(--rashid-color-42bfa8)]">
                    جاري رفع الصورة...
                  </p>
                )}

                {form.image_url && (
                  <div className="mt-4">
                    <div className="overflow-hidden rounded-2xl border border-[var(--rashid-color-ddedea)] bg-white">
                      <img
                        src={getFileUrl(form.image_url)}
                        alt="preview"
                        className="h-44 w-full object-cover"
                      />
                    </div>

                    <p className="mt-3 break-all rounded-xl bg-white p-3 text-xs text-[var(--rashid-color-6e7a99)]">
                      {form.image_url}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          image_url: "",
                        })
                      }
                      className="mt-3 rounded-full bg-red-50 px-5 py-2 text-sm font-black text-red-600"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="نص الزر"
                  value={form.button_text}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      button_text: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none focus:border-[var(--rashid-color-42bfa8)]"
                />

                <input
                  placeholder="الرابط"
                  value={form.button_link}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      button_link: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none focus:border-[var(--rashid-color-42bfa8)]"
                />
              </div>

              <input
                type="number"
                placeholder="الترتيب"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sort_order: Number(e.target.value),
                  })
                }
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none focus:border-[var(--rashid-color-42bfa8)]"
              />

              <label className="flex items-center gap-3 rounded-2xl bg-[var(--rashid-color-f4faf8)] p-4 font-bold">
                <input
                  type="checkbox"
                  checked={form.open_in_new_tab}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      open_in_new_tab: e.target.checked,
                    })
                  }
                />

                فتح الرابط في تبويب جديد
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-[var(--rashid-color-f4faf8)] p-4 font-bold">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_active: e.target.checked,
                    })
                  }
                />

                البانر مفعّل
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-full bg-[var(--rashid-color-42bfa8)] py-4 font-black text-white disabled:opacity-50"
              >
                {editingId ? "حفظ التعديل" : "حفظ البانر"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-full bg-gray-100 py-4 font-black text-[var(--rashid-color-0b4d6b)]"
                >
                  إلغاء التعديل
                </button>
              )}
            </form>
          </div>

          <div>
            {loading ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                جاري التحميل...
              </div>
            ) : banners.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                لا توجد بانرات
              </div>
            ) : (
              <div className="grid gap-6">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="overflow-hidden rounded-[2rem] bg-white shadow-xl"
                  >
                    {banner.image_url ? (
                      <img
                        src={getFileUrl(banner.image_url)}
                        alt={banner.title}
                        className="h-64 w-full object-cover"
                      />
                    ) : (
                      <div className="h-64 bg-gradient-to-br from-[var(--rashid-color-0b4d6b)] to-[var(--rashid-color-42bfa8)]" />
                    )}

                    <div className="p-8">
                      <div className="mb-4 flex items-center justify-between">
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-black ${
                            banner.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {banner.is_active ? "مفعّل" : "مخفي"}
                        </span>

                        <span className="text-sm font-black text-[var(--rashid-color-6e7a99)]">
                          ترتيب: {banner.sort_order}
                        </span>
                      </div>

                      {banner.subtitle && (
                        <div className="mb-3 inline-flex rounded-full bg-[var(--rashid-color-d9f5ee)] px-4 py-2 text-sm font-black text-[var(--rashid-color-0b4d6b)]">
                          {banner.subtitle}
                        </div>
                      )}

                      <h2 className="text-3xl font-black text-[var(--rashid-color-0b4d6b)]">
                        {banner.title}
                      </h2>

                      {banner.description && (
                        <p className="mt-4 leading-8 text-[var(--rashid-color-6e7a99)]">
                          {banner.description}
                        </p>
                      )}

                      {banner.button_link && (
                        <div className="mt-5 rounded-2xl bg-[var(--rashid-color-f4faf8)] p-4 text-sm">
                          <div className="font-black text-[var(--rashid-color-0b4d6b)]">
                            الرابط:
                          </div>

                          <div className="mt-2 break-all text-[var(--rashid-color-6e7a99)]">
                            {banner.button_link}
                          </div>

                          <div className="mt-2 text-xs font-bold text-[var(--rashid-color-42bfa8)]">
                            {banner.open_in_new_tab
                              ? "يفتح في تبويب جديد"
                              : "يفتح داخل الموقع"}
                          </div>
                        </div>
                      )}

                      <div className="mt-8 grid grid-cols-3 gap-3">
                        <button
                          onClick={() => startEdit(banner)}
                          className="rounded-full bg-[var(--rashid-color-42bfa8)] py-3 font-black text-white"
                        >
                          تعديل
                        </button>

                        <button
                          onClick={() => toggleActive(banner)}
                          className="rounded-full bg-yellow-100 py-3 font-black text-[var(--rashid-color-0b4d6b)]"
                        >
                          {banner.is_active ? "إخفاء" : "تفعيل"}
                        </button>

                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="rounded-full bg-red-50 py-3 font-black text-red-600"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}