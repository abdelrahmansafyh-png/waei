"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";

type Category = {
  id: string;
  name: string;
};

type Program = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  age_range: string | null;
  is_published: boolean;
  sort_order: number;
  category_id: string | null;
  access_type: string;
  is_deleted?: boolean | null;
  deleted_at?: string | null;
  categories?: {
    name: string;
  } | null;
};

const emptyForm = {
  title: "",
  category_id: "",
  new_category: "",
  description: "",
  image_url: "",
  age_range: "5-9 سنوات",
  access_type: "free",
  is_published: false,
  sort_order: 0,
};

function generateSlug(title: string) {
  const random = Math.floor(1000 + Math.random() * 9000);

  const cleaned = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

  return `${cleaned || "program"}-${random}`;
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: programsData, error: programsError } = await supabase
      .from("programs")
      .select("*, categories(name)")
      .or("is_deleted.is.null,is_deleted.eq.false")
      .order("sort_order", { ascending: true });

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (programsError || categoriesError) {
      alert(programsError?.message || categoriesError?.message);
      setLoading(false);
      return;
    }

    setPrograms((programsData as Program[]) || []);
    setCategories((categoriesData as Category[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(program: Program) {
    setEditingId(program.id);

    setForm({
      title: program.title || "",
      category_id: program.category_id || "",
      new_category: "",
      description: program.description || "",
      image_url: program.image_url || "",
      age_range: program.age_range || "",
      access_type: program.access_type || "free",
      is_published: program.is_published,
      sort_order: program.sort_order || 0,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("الملف يجب أن يكون صورة");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "programs");

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

  async function getCategoryId() {
    if (form.new_category.trim()) {
      const name = form.new_category.trim();

      const { data: existing } = await supabase
        .from("categories")
        .select("*")
        .eq("name", name)
        .maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("categories")
        .insert({ name })
        .select()
        .single();

      if (error) {
        alert(error.message);
        return null;
      }

      return data.id;
    }

    return form.category_id || null;
  }

  async function saveProgram(e: React.FormEvent) {
    e.preventDefault();

    const categoryId = await getCategoryId();

    const payload = {
      title: form.title,

      slug: editingId
        ? programs.find((p) => p.id === editingId)?.slug
        : generateSlug(form.title),

      category_id: categoryId,
      description: form.description || null,
      image_url: form.image_url || null,
      age_range: form.age_range || null,
      access_type: form.access_type,
      is_published: form.is_published,
      sort_order: Number(form.sort_order),
    };

    const { error } = editingId
      ? await supabase
          .from("programs")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("programs").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    fetchData();
  }

  async function togglePublish(program: Program) {
    const { error } = await supabase
      .from("programs")
      .update({
        is_published: !program.is_published,
      })
      .eq("id", program.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchData();
  }

  async function deleteProgram(id: string) {
    const ok = confirm(
      "هل تريد إخفاء هذا البرنامج؟ لن يتم حذف بيانات الأطفال أو النتائج المرتبطة به."
    );

    if (!ok) return;

    const { error } = await supabase
      .from("programs")
      .update({
        is_published: false,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    fetchData();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4FAF8] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black text-[#0B4D6B]">
              إدارة البرامج
            </h1>

            <p className="mt-3 text-[#6E7A99]">
              إضافة البرامج، الصور، التصنيفات، والفئات العمرية.
            </p>
          </div>

          <button
            onClick={resetForm}
            className="rounded-full bg-[#0B4D6B] px-6 py-3 font-black text-white"
          >
            إضافة برنامج جديد
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[430px_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-black text-[#0B4D6B]">
              {editingId ? "تعديل البرنامج" : "إضافة برنامج"}
            </h2>

            <form onSubmit={saveProgram} className="space-y-4">
              <input
                required
                placeholder="اسم البرنامج"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              />

              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value,
                    new_category: "",
                  })
                }
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              >
                <option value="">اختر تصنيف موجود</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                placeholder="أو اكتب تصنيف جديد"
                value={form.new_category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    new_category: e.target.value,
                    category_id: "",
                  })
                }
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              />

              <textarea
                placeholder="وصف البرنامج"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="h-32 w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              />

              <input
                placeholder="العمر المناسب"
                value={form.age_range}
                onChange={(e) =>
                  setForm({
                    ...form,
                    age_range: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              />

              <select
                value={form.access_type}
                onChange={(e) =>
                    setForm({
                    ...form,
                    access_type: e.target.value,
                    })
                }
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
                >
                <option value="free">🟢 مجاني</option>
                <option value="pro">👑 Pro</option>
            </select>

              <div className="rounded-2xl border border-dashed border-[#42BFA8] bg-[#F4FAF8] p-5">
                <label className="mb-3 block font-black text-[#0B4D6B]">
                  صورة البرنامج
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
                  <p className="mt-3 font-bold text-[#42BFA8]">
                    جاري رفع الصورة...
                  </p>
                )}

                {form.image_url && (
                  <div className="mt-4">
                    <div className="overflow-hidden rounded-2xl border border-[#DDEDEA] bg-white">
                      <img
                        src={getFileUrl(form.image_url)}
                        alt="preview"
                        className="h-44 w-full object-cover"
                      />
                    </div>

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
                className="w-full rounded-2xl border border-[#DDEDEA] px-4 py-4 outline-none focus:border-[#42BFA8]"
              />

              <label className="flex items-center gap-3 rounded-2xl bg-[#F4FAF8] p-4 font-bold">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_published: e.target.checked,
                    })
                  }
                />

                نشر البرنامج
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-full bg-[#42BFA8] py-4 font-black text-white disabled:opacity-50"
              >
                {editingId ? "حفظ التعديل" : "حفظ البرنامج"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-full bg-gray-100 py-4 font-black text-[#0B4D6B]"
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
            ) : programs.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                لا توجد برامج
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
                {programs.map((program) => (
                  <div
                    key={program.id}
                    className="overflow-hidden rounded-[2rem] bg-white shadow-xl transition hover:-translate-y-2"
                  >
                    {program.image_url ? (
                      <img
                        src={getFileUrl(program.image_url)}
                        alt={program.title}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="h-64 bg-gradient-to-br from-[#0B4D6B] to-[#42BFA8]" />
                    )}

                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-black ${
                            program.is_published
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {program.is_published ? "منشور" : "مسودة"}
                        </span>

                        <span className="text-sm font-black text-[#6E7A99]">
                          ترتيب: {program.sort_order}
                        </span>
                      </div>

                      {program.categories?.name && (
                        <div className="mb-3 inline-flex rounded-full bg-[#D9F5EE] px-4 py-2 text-sm font-black text-[#0B4D6B]">
                          {program.categories.name}
                        </div>
                      )}
                      
                      <div
                        className={`mb-3 inline-flex rounded-full px-4 py-2 text-sm font-black ${
                            program.access_type === "pro"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                        >
                        {program.access_type === "pro" ? "👑 Pro" : "🟢 مجاني"}
                    </div>


                      <h2 className="text-3xl font-black text-[#0B4D6B]">
                        {program.title}
                      </h2>

                     
                      {program.age_range && (
                        <p className="mt-3 font-bold text-[#0B4D6B]">
                          العمر: {program.age_range}
                        </p>
                      )}

                      {program.description && (
                        <p className="mt-4 leading-8 text-[#6E7A99]">
                          {program.description}
                        </p>
                      )}

                      <div className="mt-8 grid grid-cols-2 gap-2 xl:grid-cols-3">
                        <button
                          onClick={() => startEdit(program)}
                          className="rounded-2xl bg-[#42BFA8] py-3 text-sm font-black text-white transition hover:scale-[1.03]"
                        >
                          تعديل
                        </button>

                        <button
                          onClick={() => togglePublish(program)}
                          className="rounded-full bg-yellow-100 py-3 font-black text-[#0B4D6B]"
                        >
                          {program.is_published ? "إخفاء" : "نشر"}
                        </button>

                        <a
                          href={`/admin/programs/${program.id}/tabs`}
                          className="rounded-full bg-[#0B4D6B] py-3 text-center font-black text-white"
                        >
                          التابات
                        </a>

                        <a
                        href={`/admin/programs/${program.id}/preview`}
                        className="rounded-2xl bg-[#D8F36A] py-3 text-center text-sm font-black text-[#0B4D6B]"
                        >
                        معاينة
                        </a>

                        <button
                          onClick={() => deleteProgram(program.id)}
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