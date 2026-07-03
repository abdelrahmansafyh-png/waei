"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFileUrl } from "@/lib/files";

type TabInfo = {
  id: string;
  title: string;
  type: string;
};

type Content = {
  id: string;
  content_type: string;
  title: string | null;
  body: string | null;
  file_url: string | null;
  youtube_url: string | null;
  iframe_url: string | null;
  sort_order: number;
};

const contentTypes = [
  { value: "text", label: "نص" },
  { value: "image", label: "صورة" },
  { value: "file", label: "ملف PDF / مرفق" },
  { value: "video", label: "فيديو" },
  { value: "youtube", label: "يوتيوب" },
  { value: "iframe", label: "iframe / لعبة خارجية" },
];

const emptyForm = {
  content_type: "text",
  title: "",
  body: "",
  file_url: "",
  youtube_url: "",
  iframe_url: "",
  sort_order: 0,
};

export default function TabContentPage({
  params,
}: {
  params: { id: string };
}) {
  const tabId = params.id;

  const [tab, setTab] = useState<TabInfo | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: tabData } = await supabase
      .from("program_tabs")
      .select("*")
      .eq("id", tabId)
      .single();

    const { data: contentsData, error } = await supabase
      .from("tab_contents")
      .select("*")
      .eq("tab_id", tabId)
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setTab(tabData as TabInfo);
    setContents((contentsData as Content[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(item: Content) {
    setEditingId(item.id);

    setForm({
      content_type: item.content_type || "text",
      title: item.title || "",
      body: item.body || "",
      file_url: item.file_url || "",
      youtube_url: item.youtube_url || "",
      iframe_url: item.iframe_url || "",
      sort_order: item.sort_order || 0,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadFile(file: File) {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "files");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.message || "فشل رفع الملف");
        setUploading(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        file_url: result.path,
      }));
    } catch {
      alert("حدث خطأ أثناء رفع الملف");
    }

    setUploading(false);
  }

  async function saveContent(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      tab_id: tabId,
      content_type: form.content_type,
      title: form.title || null,
      body: form.body || null,
      file_url: form.file_url || null,
      youtube_url: form.youtube_url || null,
      iframe_url: form.iframe_url || null,
      sort_order: Number(form.sort_order),
    };

    const { error } = editingId
      ? await supabase.from("tab_contents").update(payload).eq("id", editingId)
      : await supabase.from("tab_contents").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    fetchData();
  }

  async function deleteContent(id: string) {
    if (!confirm("هل تريد حذف هذا المحتوى؟")) return;

    const { error } = await supabase.from("tab_contents").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) resetForm();
    fetchData();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--rashid-color-f4faf8)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-[var(--rashid-color-0b4d6b)]">
            محتوى التاب
          </h1>

          <p className="mt-3 text-[var(--rashid-color-6e7a99)]">
            {tab ? `التاب: ${tab.title}` : "إدارة محتوى التاب"}
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[430px_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-black text-[var(--rashid-color-0b4d6b)]">
              {editingId ? "تعديل محتوى" : "إضافة محتوى"}
            </h2>

            <form onSubmit={saveContent} className="space-y-4">
              <select
                value={form.content_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content_type: e.target.value,
                    file_url: "",
                    youtube_url: "",
                    iframe_url: "",
                  })
                }
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none"
              >
                {contentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <input
                placeholder="عنوان اختياري"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none"
              />

              {form.content_type === "text" && (
                <textarea
                  placeholder="اكتب النص هنا"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="h-44 w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none"
                />
              )}

              {["image", "file", "video"].includes(form.content_type) && (
                <div className="rounded-2xl border border-dashed border-[var(--rashid-color-42bfa8)] bg-[var(--rashid-color-f4faf8)] p-5">
                  <label className="mb-3 block font-black text-[var(--rashid-color-0b4d6b)]">
                    رفع ملف من الجهاز
                  </label>

                  <input
                    type="file"
                    accept={
                      form.content_type === "image"
                        ? "image/*"
                        : form.content_type === "video"
                        ? "video/*"
                        : ".pdf,.doc,.docx,.ppt,.pptx,image/*"
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file);
                    }}
                    className="w-full cursor-pointer rounded-xl bg-white p-3 text-sm"
                  />

                  {uploading && (
                    <p className="mt-3 font-bold text-[var(--rashid-color-42bfa8)]">
                      جاري الرفع...
                    </p>
                  )}

                  {form.file_url && (
                    <div className="mt-4">
                      {form.content_type === "image" ? (
                        <img
                          src={getFileUrl(form.file_url)}
                          alt="preview"
                          className="h-44 w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <p className="break-all rounded-xl bg-white p-3 text-xs text-[var(--rashid-color-6e7a99)]">
                          {form.file_url}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, file_url: "" })}
                        className="mt-3 rounded-full bg-red-50 px-5 py-2 text-sm font-black text-red-600"
                      >
                        إزالة الملف
                      </button>
                    </div>
                  )}
                </div>
              )}

              {form.content_type === "youtube" && (
                <input
                  placeholder="رابط YouTube"
                  value={form.youtube_url}
                  onChange={(e) =>
                    setForm({ ...form, youtube_url: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none"
                />
              )}

              {form.content_type === "iframe" && (
                <textarea
                  placeholder="رابط iframe أو embed URL"
                  value={form.iframe_url}
                  onChange={(e) =>
                    setForm({ ...form, iframe_url: e.target.value })
                  }
                  className="h-32 w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none"
                />
              )}

              <input
                type="number"
                placeholder="الترتيب"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] px-4 py-4 outline-none"
              />

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-full bg-[var(--rashid-color-42bfa8)] py-4 font-black text-white disabled:opacity-50"
              >
                {editingId ? "حفظ التعديل" : "حفظ المحتوى"}
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

            {tab?.type === "games" && (
              <a
                href={`/admin/games/new?tab=${tabId}`}
                className="mt-5 block rounded-full bg-[var(--rashid-color-0b4d6b)] py-4 text-center font-black text-white"
              >
                إضافة لعبة داخل هذا التاب
              </a>
            )}
          </div>

          <div>
            {loading ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                جاري التحميل...
              </div>
            ) : contents.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                لا يوجد محتوى داخل هذا التاب
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {contents.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-[2rem] bg-white shadow-xl"
                  >
                    {item.content_type === "image" && item.file_url && (
                      <img
                        src={getFileUrl(item.file_url)}
                        alt={item.title || "image"}
                        className="h-44 w-full object-cover"
                      />
                    )}

                    {item.content_type === "video" && item.file_url && (
                      <video
                        src={getFileUrl(item.file_url)}
                        controls
                        className="h-44 w-full object-cover"
                      />
                    )}

                    <div className="p-6">
                      <span className="rounded-full bg-[var(--rashid-color-d9f5ee)] px-4 py-2 text-xs font-black text-[var(--rashid-color-0b4d6b)]">
                        {contentTypes.find((x) => x.value === item.content_type)
                          ?.label || item.content_type}
                      </span>

                      <h2 className="mt-5 text-2xl font-black text-[var(--rashid-color-0b4d6b)]">
                        {item.title || "بدون عنوان"}
                      </h2>

                      {item.body && (
                        <p className="mt-4 line-clamp-4 leading-8 text-[var(--rashid-color-6e7a99)]">
                          {item.body}
                        </p>
                      )}

                      {item.file_url && item.content_type !== "image" && (
                        <p className="mt-4 truncate rounded-xl bg-[var(--rashid-color-f4faf8)] p-3 text-xs text-[var(--rashid-color-6e7a99)]">
                          {item.file_url}
                        </p>
                      )}

                      {item.youtube_url && (
                        <p className="mt-4 truncate rounded-xl bg-[var(--rashid-color-f4faf8)] p-3 text-xs text-[var(--rashid-color-6e7a99)]">
                          {item.youtube_url}
                        </p>
                      )}

                      {item.iframe_url && (
                        <p className="mt-4 truncate rounded-xl bg-[var(--rashid-color-f4faf8)] p-3 text-xs text-[var(--rashid-color-6e7a99)]">
                          {item.iframe_url}
                        </p>
                      )}

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-2xl bg-[var(--rashid-color-42bfa8)] py-3 font-black text-white"
                        >
                          تعديل
                        </button>

                        <button
                          onClick={() => deleteContent(item.id)}
                          className="rounded-2xl bg-red-50 py-3 font-black text-red-600"
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