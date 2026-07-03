"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Tab = {
  id: string;
  title: string;
  type: string;
  sort_order: number;
};

type Program = {
  id: string;
  title: string;
};

const tabTypes = [
  { value: "content", label: "محتوى نصي", icon: "📝" },
  { value: "games", label: "ألعاب", icon: "🎮" },
  { value: "interactive_stories", label: "قصص تفاعلية", icon: "🎭" },
  { value: "videos", label: "فيديوهات", icon: "🎬" },
  { value: "images", label: "صور", icon: "🖼️" },
  { value: "files", label: "ملفات", icon: "📎" },
  { value: "youtube", label: "يوتيوب", icon: "▶️" },
  
];

export default function ProgramTabsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: programId } = use(params);

  const [program, setProgram] = useState<Program | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("content");
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: programData } = await supabase
      .from("programs")
      .select("id,title")
      .eq("id", programId)
      .single();

    const { data, error } = await supabase
      .from("program_tabs")
      .select("*")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setProgram(programData as Program);
    setTabs((data as Tab[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setType("content");
    setSortOrder(0);
  }

  function startEdit(tab: Tab) {
    setEditingId(tab.id);
    setTitle(tab.title);
    setType(tab.type);
    setSortOrder(tab.sort_order || 0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveTab(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("اكتب اسم التاب");
      return;
    }

    const payload = {
      program_id: programId,
      title: title.trim(),
      type,
      sort_order: Number(sortOrder || tabs.length + 1),
    };

    const { error } = editingId
      ? await supabase.from("program_tabs").update(payload).eq("id", editingId)
      : await supabase.from("program_tabs").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    fetchData();
  }

  async function deleteTab(id: string) {
    if (!confirm("هل تريد حذف التاب؟ سيتم حذف المحتوى المرتبط به.")) return;

    const { error } = await supabase.from("program_tabs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    fetchData();
  }

  const selectedType = tabTypes.find((x) => x.value === type);

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--rashid-color-f4faf8)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2.5rem] bg-[var(--rashid-color-0b4d6b)] p-8 text-white shadow-xl">
          <a
            href="/admin/programs"
            className="mb-5 inline-flex rounded-full bg-white/10 px-5 py-2 font-black text-white"
          >
            رجوع للبرامج
          </a>

          <h1 className="text-4xl font-black">إدارة تابات البرنامج</h1>

          <p className="mt-3 text-white/70">
            {program?.title || "برنامج"} — أضف وعدّل التابات التي سيشاهدها الطفل.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[430px_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-black text-[var(--rashid-color-0b4d6b)]">
              {editingId ? "تعديل التاب" : "إضافة تاب جديد"}
            </h2>

            <form onSubmit={saveTab} className="space-y-4">
              <input
                placeholder="مثال: أهداف البرنامج"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] bg-white px-4 py-4 text-[var(--rashid-color-0b4d6b)] outline-none focus:border-[var(--rashid-color-42bfa8)]"
              />

              <div>
                <label className="mb-2 block font-black text-[var(--rashid-color-0b4d6b)]">
                  نوع التاب
                </label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-[var(--rashid-color-ddedea)] bg-white px-4 py-4 text-[var(--rashid-color-0b4d6b)] outline-none focus:border-[var(--rashid-color-42bfa8)]"
                >
                  {tabTypes.map((tab) => (
                    <option key={tab.value} value={tab.value}>
                      {tab.icon} {tab.label}
                    </option>
                  ))}
                </select>

                <div className="mt-3 rounded-2xl bg-[var(--rashid-color-f4faf8)] p-4 text-sm font-bold text-[var(--rashid-color-6e7a99)]">
                  النوع المختار: {selectedType?.icon} {selectedType?.label}
                </div>
              </div>

              <input
                type="number"
                placeholder="ترتيب التاب"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full rounded-2xl border border-[var(--rashid-color-ddedea)] bg-white px-4 py-4 text-[var(--rashid-color-0b4d6b)] outline-none focus:border-[var(--rashid-color-42bfa8)]"
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[var(--rashid-color-42bfa8)] py-4 font-black text-white transition hover:-translate-y-1"
              >
                {editingId ? "حفظ التعديل" : "إضافة التاب"}
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
            ) : tabs.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-[var(--rashid-color-ddedea)] bg-white p-12 text-center shadow-xl">
                <div className="text-5xl">🧩</div>

                <h3 className="mt-5 text-3xl font-black text-[var(--rashid-color-0b4d6b)]">
                  لا توجد تابات بعد
                </h3>

                <p className="mt-3 text-[var(--rashid-color-6e7a99)]">
                  ابدأ بإضافة تاب مثل: الأهداف، الأنشطة، الألعاب.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {tabs.map((tab) => {
                  const tabType = tabTypes.find((x) => x.value === tab.type);

                  return (
                    <div
                      key={tab.id}
                      className="group overflow-hidden rounded-[2rem] bg-white shadow-xl transition hover:-translate-y-2"
                    >
                      <div className="bg-gradient-to-br from-[var(--rashid-color-0b4d6b)] to-[var(--rashid-color-42bfa8)] p-6 text-white">
                        <div className="mb-6 flex items-center justify-between">
                          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-3xl">
                            {tabType?.icon || "🧩"}
                          </div>

                          <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-black">
                            #{tab.sort_order}
                          </span>
                        </div>

                        <h2 className="text-2xl font-black">{tab.title}</h2>

                        <p className="mt-2 text-white/70">
                          {tabType?.label || tab.type}
                        </p>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => startEdit(tab)}
                            className="rounded-2xl bg-[var(--rashid-color-42bfa8)] py-3 text-sm font-black text-white"
                          >
                            تعديل
                          </button>

                          <a
                            href={`/admin/tabs/${tab.id}`}
                            className="rounded-2xl bg-[var(--rashid-color-0b4d6b)] py-3 text-center text-sm font-black text-white"
                          >
                            المحتوى
                          </a>

                          <button
                            onClick={() => deleteTab(tab.id)}
                            className="rounded-2xl bg-red-50 py-3 text-sm font-black text-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}   