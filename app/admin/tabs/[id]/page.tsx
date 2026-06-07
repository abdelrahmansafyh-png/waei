"use client";

import { use, useEffect, useState } from "react";
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
  { value: "text", label: "نص", icon: "📝" },
  { value: "image", label: "صورة", icon: "🖼️" },
  { value: "file", label: "ملف", icon: "📎" },
  { value: "video", label: "فيديو", icon: "🎬" },
  { value: "youtube", label: "يوتيوب", icon: "▶️" },
  { value: "iframe", label: "iframe / لعبة خارجية", icon: "🎮" },
  { value: "zip_game", label: "لعبة ZIP", icon: "🕹️" },
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


const GAME_TEMPLATES = [
  {
    id: "balloon_plane",
    name: "الطائرة والبالونات",
  },
  {
    id: "subway",
    name: "السيارات",
  },
  {
    id: "drag_dynamic_kid",
    name: "اسحب وصنّف",
  },
];


export default function TabContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tabId } = use(params);

  const [tab, setTab] = useState<TabInfo | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [templateId, setTemplateId] = useState("balloon_plane");
  const [templateMeta, setTemplateMeta] = useState({
    title: "",
    question: "",
    instruction: "",
    targetCategory: "correct",
  });

  const [templateItems, setTemplateItems] = useState<any[]>([
    { text: "", image: "", category: "correct" }
  ]);

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


  function normalizeLoadedGameToForm(game: any, fallbackTemplateId?: string) {
    if (!game) return;

    if (game.levels && Array.isArray(game.levels) && game.levels[0]) {
      const level = game.levels[0];

      setTemplateId(fallbackTemplateId || "subway");

      setTemplateMeta({
        title: game.title || "",
        question: level.question || level.title || "",
        instruction: "",
        targetCategory: level.targetCategory || level.target || "correct",
      });

      setTemplateItems(
        Array.isArray(level.items) && level.items.length
          ? level.items.map((x: any) => ({
              text: x.text || x.label || "",
              image: x.image || "",
              category: x.category || x.type || "correct",
            }))
          : [{ text: "", image: "", category: "correct" }]
      );

      return;
    }

    if (Array.isArray(game.cards)) {
      setTemplateId(fallbackTemplateId || "drag_dynamic_kid");

      setTemplateMeta({
        title: game.title || "",
        question: "",
        instruction: game.instruction || "",
        targetCategory: "correct",
      });

      setTemplateItems(
        game.cards.length
          ? game.cards.map((x: any) => ({
              text: x.text || x.label || "",
              image: x.image || "",
              category: x.group || x.category || "correct",
            }))
          : [{ text: "", image: "", category: "correct" }]
      );

      return;
    }

    setTemplateId(fallbackTemplateId || "balloon_plane");

    setTemplateMeta({
      title: game.title || "",
      question: game.question || "",
      instruction: "",
      targetCategory: game.targetCategory || game.target || "correct",
    });

    setTemplateItems(
      Array.isArray(game.items) && game.items.length
        ? game.items.map((x: any) => ({
            text: x.text || x.label || "",
            image: x.image || "",
            category: x.category || x.type || "correct",
          }))
        : [{ text: "", image: "", category: "correct" }]
    );
  }

  function getGameJsonUrlFromIframe(url: string) {
    if (!url) return "";

    const cleanUrl = url.split("?")[0].split("#")[0];

    if (cleanUrl.endsWith("/")) {
      return `${cleanUrl}game.json`;
    }

    if (cleanUrl.endsWith("index.html")) {
      return cleanUrl.replace(/index\.html$/, "game.json");
    }

    return `${cleanUrl.replace(/\/$/, "")}/game.json`;
  }

  async function loadGameDataForEdit(item: Content) {
    // 1) الأفضل: نقرأ البيانات المخزنة في body من قاعدة البيانات
    if (item.body) {
      try {
        const saved = JSON.parse(item.body);

        if (saved?.game_config) {
          normalizeLoadedGameToForm(
            saved.game_config,
            saved.template_id || saved.game_template_id
          );
          return;
        }

        if (saved?.template_id && saved?.game) {
          normalizeLoadedGameToForm(saved.game, saved.template_id);
          return;
        }
      } catch {
        // body قد يكون نص عادي، نكمل لمحاولة game.json
      }
    }

    // 2) fallback: نحاول نقرأ game.json من رابط اللعبة
    if (!item.iframe_url) return;

    try {
      const gameJsonUrl = getGameJsonUrlFromIframe(item.iframe_url);
      const res = await fetch(
        `/api/read-game-json?url=${encodeURIComponent(gameJsonUrl)}`,
        { cache: "no-store" }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        console.warn("لم يتم العثور على game.json:", result?.message || gameJsonUrl);
        return;
      }

      normalizeLoadedGameToForm(result.game);
    } catch (e) {
      console.warn("فشل تحميل بيانات اللعبة القديمة", e);
    }
  }


  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }


  function getGameJsonUrlFromIframe(url: string) {
    if (!url) return "";

    const cleanUrl = url.split("?")[0].split("#")[0];

    if (cleanUrl.endsWith("/")) {
      return `${cleanUrl}game.json`;
    }

    if (cleanUrl.endsWith("index.html")) {
      return cleanUrl.replace(/index\.html$/, "game.json");
    }

    return `${cleanUrl.replace(/\/$/, "")}/game.json`;
  }

  async function loadGameDataFromJsonUrl(item: Content) {
    if (!item.iframe_url) return;

    try {
      const gameJsonUrl = getGameJsonUrlFromIframe(item.iframe_url);
      const res = await fetch(gameJsonUrl, { cache: "no-store" });

      if (!res.ok) {
        console.warn("لم يتم العثور على game.json:", gameJsonUrl);
        return;
      }

      const game = await res.json();

      if (game.levels && Array.isArray(game.levels) && game.levels[0]) {
        const level = game.levels[0];

        setTemplateId("subway");

        setTemplateMeta({
          title: game.title || "",
          question: level.question || level.title || "",
          instruction: "",
          targetCategory: level.targetCategory || level.target || "correct",
        });

        setTemplateItems(
          Array.isArray(level.items) && level.items.length
            ? level.items.map((x: any) => ({
                text: x.text || x.label || "",
                image: x.image || "",
                category: x.category || x.type || "correct",
              }))
            : [{ text: "", image: "", category: "correct" }]
        );

        return;
      }

      if (Array.isArray(game.cards)) {
        setTemplateId("drag_dynamic_kid");

        setTemplateMeta({
          title: game.title || "",
          question: "",
          instruction: game.instruction || "",
          targetCategory: "correct",
        });

        setTemplateItems(
          game.cards.length
            ? game.cards.map((x: any) => ({
                text: x.text || x.label || "",
                image: x.image || "",
                category: x.group || x.category || "correct",
              }))
            : [{ text: "", image: "", category: "correct" }]
        );

        return;
      }

      setTemplateId("balloon_plane");

      setTemplateMeta({
        title: game.title || "",
        question: game.question || "",
        instruction: "",
        targetCategory: game.targetCategory || game.target || "correct",
      });

      setTemplateItems(
        Array.isArray(game.items) && game.items.length
          ? game.items.map((x: any) => ({
              text: x.text || x.label || "",
              image: x.image || "",
              category: x.category || x.type || "correct",
            }))
          : [{ text: "", image: "", category: "correct" }]
      );
    } catch (e) {
      console.warn("فشل تحميل بيانات اللعبة القديمة من game.json", e);
    }
  }


  async function startEdit(item: Content) {
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

    if (item.content_type === "zip_game") {
      await loadGameDataForEdit(item);
    }

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


  async function uploadTemplateImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "game-images");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "فشل رفع الصورة");
    }

    return result.path;
  }

  function buildTemplateGameJson() {
    const parsed: any = {};

    parsed.title = templateMeta.title;

    if (templateId === "drag_dynamic_kid") {
      parsed.instruction = templateMeta.instruction;
      parsed.character = "images/character.png";

      const groups = Array.from(
        new Set(templateItems.map((x) => x.category).filter(Boolean))
      );

      parsed.groups = groups.map((g) => ({
        id: g,
        title: g,
      }));

      parsed.cards = templateItems.map((item) => ({
        text: item.text,
        image: item.image,
        group: item.category,
      }));
    } else {
      parsed.question = templateMeta.question;
      parsed.targetCategory = templateMeta.targetCategory;

      parsed.items = templateItems.map((item) => ({
        text: item.text,
        image: item.image,
        category: item.category,
      }));
    }

    return parsed;
  }


  async function generateTemplateGame() {
    setUploading(true);

    try {
      let game;

      try {
        game = buildTemplateGameJson();
      } catch {
        alert("تأكد من تعبئة بيانات اللعبة بشكل صحيح.");
        setUploading(false);
        return;
      }

      const res = await fetch("/api/template-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          game,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.message || "فشل توليد اللعبة من التمبليت");
        setUploading(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        iframe_url: result.game_url,
        file_url: result.game_url,
        body: JSON.stringify({
          template_id: templateId,
          game_config: game,
        }),
      }));
    } catch (e: any) {
      alert(e?.message || "حدث خطأ أثناء توليد اللعبة");
    }

    setUploading(false);
  }

  async function uploadZipGame(file: File) {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      alert("ارفع ملف ZIP فقط");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-game", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.message || "فشل رفع اللعبة");
        setUploading(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        iframe_url: result.game_url,
        file_url: result.game_url,
      }));
    } catch {
      alert("حدث خطأ أثناء رفع اللعبة");
    }

    setUploading(false);
  }

  async function saveContent(e: React.FormEvent) {
    e.preventDefault();

    if (form.content_type === "zip_game" && !form.iframe_url) {
      alert("ارفع ملف اللعبة ZIP أولًا");
      return;
    }

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

  const selectedType = contentTypes.find((x) => x.value === form.content_type);

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4FAF8] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2.5rem] bg-[#0B4D6B] p-8 text-white shadow-xl">
          <h1 className="text-4xl font-black">محتوى التاب</h1>

          <p className="mt-3 text-white/70">
            {tab
              ? `${tab.title} — أضف المحتوى الذي سيظهر للطفل.`
              : "إدارة محتوى التاب"}
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[430px_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-black text-[#0B4D6B]">
              {editingId ? "تعديل محتوى" : "إضافة محتوى"}
            </h2>

            <form onSubmit={saveContent} className="space-y-4">
              <label className="block">
                <span className="mb-2 block font-black text-[#0B4D6B]">
                  نوع المحتوى
                </span>

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
                  className="w-full appearance-none rounded-2xl border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] outline-none focus:border-[#42BFA8]"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl bg-[#F4FAF8] p-4 text-sm font-bold text-[#6E7A99]">
                النوع المختار: {selectedType?.icon} {selectedType?.label}
              </div>

              <input
                placeholder="عنوان اختياري"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-2xl border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] outline-none focus:border-[#42BFA8]"
              />

              {form.content_type === "text" && (
                <textarea
                  placeholder="اكتب النص هنا"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="h-44 w-full rounded-2xl border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] outline-none focus:border-[#42BFA8]"
                />
              )}

              {["image", "file", "video"].includes(form.content_type) && (
                <div className="rounded-2xl border border-dashed border-[#42BFA8] bg-[#F4FAF8] p-5">
                  <label className="mb-3 block font-black text-[#0B4D6B]">
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
                    <p className="mt-3 font-bold text-[#42BFA8]">
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
                      ) : form.content_type === "video" ? (
                        <video
                          src={getFileUrl(form.file_url)}
                          controls
                          className="h-44 w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <p className="break-all rounded-xl bg-white p-3 text-xs text-[#6E7A99]">
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

              {form.content_type === "zip_game" && (
                <div className="space-y-5 rounded-2xl border border-dashed border-[#42BFA8] bg-[#F4FAF8] p-5">
                  <div className="rounded-2xl bg-white p-4">
                    <label className="mb-3 block font-black text-[#0B4D6B]">
                      إنشاء لعبة من Template
                    </label>

                    <select
                      value={templateId}
                      onChange={(e) => {
                        const nextTemplateId = e.target.value;
                        setTemplateId(nextTemplateId);
                        setTemplateMeta({
                          title: "",
                          question: "",
                          instruction: "",
                          targetCategory: "correct",
                        });
                        setTemplateItems([
                          { text: "", image: "", category: "correct" },
                        ]);
                      }}
                      className="mb-3 w-full rounded-xl border border-[#DDEDEA] bg-white p-3 font-bold text-[#0B4D6B]"
                    >
                      {GAME_TEMPLATES.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>

                    
                    
<div className="mb-4 rounded-2xl border border-[#DDEDEA] bg-white p-4">
                      <div className="mb-4 text-lg font-black text-[#0B4D6B]">
                        بيانات اللعبة
                      </div>

                      <input
                        placeholder="عنوان اللعبة"
                        value={templateMeta.title}
                        onChange={(e) =>
                          setTemplateMeta({
                            ...templateMeta,
                            title: e.target.value,
                          })
                        }
                        className="mb-3 w-full rounded-xl border border-[#DDEDEA] p-3"
                      />

                      {templateId !== "drag_dynamic_kid" ? (
                        <>
                          <input
                            placeholder="السؤال"
                            value={templateMeta.question}
                            onChange={(e) =>
                              setTemplateMeta({
                                ...templateMeta,
                                question: e.target.value,
                              })
                            }
                            className="mb-3 w-full rounded-xl border border-[#DDEDEA] p-3"
                          />

                          <input
                            placeholder="التصنيف المطلوب"
                            value={templateMeta.targetCategory}
                            onChange={(e) =>
                              setTemplateMeta({
                                ...templateMeta,
                                targetCategory: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-[#DDEDEA] p-3"
                          />
                        </>
                      ) : (
                        <textarea
                          placeholder="تعليمات اللعبة"
                          value={templateMeta.instruction}
                          onChange={(e) =>
                            setTemplateMeta({
                              ...templateMeta,
                              instruction: e.target.value,
                            })
                          }
                          className="h-28 w-full rounded-xl border border-[#DDEDEA] p-3"
                        />
                      )}
                    </div>

<div className="mb-4 rounded-2xl bg-[#F4FAF8] p-4">
                      <div className="mb-3 text-sm font-black text-[#0B4D6B]">
                        العناصر / الإجابات
                      </div>

                      <div className="space-y-3">
                        {templateItems.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-[#DDEDEA] bg-white p-3"
                          >
                            <input
                              placeholder="النص"
                              value={item.text}
                              onChange={(e) => {
                                const next = [...templateItems];
                                next[index].text = e.target.value;
                                setTemplateItems(next);
                              }}
                              className="mb-2 w-full rounded-xl border border-[#DDEDEA] p-3"
                            />

                            <input
                              placeholder={templateId === "drag_dynamic_kid" ? "اسم المجموعة / التصنيف" : "تصنيف العنصر"}
                              value={item.category}
                              onChange={(e) => {
                                const next = [...templateItems];
                                next[index].category = e.target.value;
                                setTemplateItems(next);
                              }}
                              className="mb-2 w-full rounded-xl border border-[#DDEDEA] p-3"
                            />

                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                try {
                                  setUploading(true);

                                  const path = await uploadTemplateImage(file);

                                  const next = [...templateItems];
                                  next[index].image = path;
                                  setTemplateItems(next);
                                } catch (err: any) {
                                  alert(err?.message || "فشل رفع الصورة");
                                }

                                setUploading(false);
                              }}
                              className="w-full rounded-xl bg-[#F4FAF8] p-3 text-sm"
                            />

                            {item.image && (
                              <img
                                src={getFileUrl(item.image)}
                                alt=""
                                className="mt-3 h-24 w-24 rounded-2xl object-cover"
                              />
                            )}

                            {templateItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setTemplateItems(
                                    templateItems.filter((_, i) => i !== index)
                                  )
                                }
                                className="mt-3 rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                              >
                                حذف العنصر
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setTemplateItems([
                            ...templateItems,
                            {
                              text: "",
                              image: "",
                              category: "correct",
                            },
                          ])
                        }
                        className="mt-3 rounded-full bg-[#42BFA8] px-5 py-2 text-sm font-black text-white"
                      >
                        + إضافة عنصر
                      </button>
                    </div>




                    <button
                      type="button"
                      disabled={uploading}
                      onClick={generateTemplateGame}
                      className="mt-3 w-full rounded-full bg-[#0B4D6B] py-3 font-black text-white disabled:opacity-50"
                    >
                      توليد اللعبة + الصوت + الرفع
                    </button>

                    <p className="mt-3 text-xs font-bold leading-6 text-[#6E7A99]">
                      ملاحظة: الصوت يتولد محليًا بـ Edge TTS على الجهاز/السيرفر الذي يشغّل لوحة واعي، ثم تُرفع ملفات MP3 جاهزة على Hostinger.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <label className="mb-3 block font-black text-[#0B4D6B]">
                      أو رفع لعبة ZIP جاهزة
                    </label>

                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadZipGame(file);
                      }}
                      className="w-full cursor-pointer rounded-xl bg-[#F4FAF8] p-3 text-sm"
                    />
                  </div>

                  {uploading && (
                    <p className="rounded-xl bg-[#FFF7D8] p-3 font-bold text-[#9A6B00]">
                      جاري تجهيز اللعبة...
                    </p>
                  )}

                  {form.iframe_url && (
                    <div className="rounded-2xl bg-white p-4">
                      <div className="mb-3 text-sm font-black text-[#0B4D6B]">
                        تم تجهيز اللعبة بنجاح 🎉
                      </div>

                      <p className="break-all text-xs text-[#6E7A99]">
                        {form.iframe_url}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setForm({ ...form, iframe_url: "", file_url: "" })
                        }
                        className="mt-3 rounded-full bg-red-50 px-5 py-2 text-sm font-black text-red-600"
                      >
                        إزالة اللعبة
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
                  className="w-full rounded-2xl border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] outline-none focus:border-[#42BFA8]"
                />
              )}

              {form.content_type === "iframe" && (
                <textarea
                  placeholder="رابط iframe أو embed URL"
                  value={form.iframe_url}
                  onChange={(e) =>
                    setForm({ ...form, iframe_url: e.target.value })
                  }
                  className="h-32 w-full rounded-2xl border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] outline-none focus:border-[#42BFA8]"
                />
              )}

              <input
                type="number"
                placeholder="الترتيب"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="w-full rounded-2xl border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] outline-none focus:border-[#42BFA8]"
              />

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-full bg-[#42BFA8] py-4 font-black text-white disabled:opacity-50"
              >
                {editingId ? "حفظ التعديل" : "حفظ المحتوى"}
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
            ) : contents.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-[#DDEDEA] bg-white p-12 text-center shadow-xl">
                <div className="text-5xl">📦</div>
                <h3 className="mt-5 text-3xl font-black text-[#0B4D6B]">
                  لا يوجد محتوى
                </h3>
                <p className="mt-3 text-[#6E7A99]">
                  أضف أول محتوى داخل هذا التاب.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {contents.map((item) => {
                  const type = contentTypes.find(
                    (x) => x.value === item.content_type
                  );

                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-[2rem] bg-white shadow-xl transition hover:-translate-y-2"
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

                      {item.content_type === "zip_game" && (
                        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-[#0B4D6B] to-[#42BFA8] text-6xl">
                          🕹️
                        </div>
                      )}

                      <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-full bg-[#D9F5EE] px-4 py-2 text-xs font-black text-[#0B4D6B]">
                            {type?.icon} {type?.label}
                          </span>

                          <span className="text-xs font-black text-[#6E7A99]">
                            #{item.sort_order}
                          </span>
                        </div>

                        <h2 className="text-2xl font-black text-[#0B4D6B]">
                          {item.title || "بدون عنوان"}
                        </h2>

                        {item.body && (
                          <p className="mt-4 line-clamp-4 leading-8 text-[#6E7A99]">
                            {item.body}
                          </p>
                        )}

                        {item.file_url && item.content_type !== "image" && (
                          <p className="mt-4 truncate rounded-xl bg-[#F4FAF8] p-3 text-xs text-[#6E7A99]">
                            {item.file_url}
                          </p>
                        )}

                        {item.youtube_url && (
                          <p className="mt-4 truncate rounded-xl bg-[#F4FAF8] p-3 text-xs text-[#6E7A99]">
                            {item.youtube_url}
                          </p>
                        )}

                        {item.iframe_url && (
                          <p className="mt-4 truncate rounded-xl bg-[#F4FAF8] p-3 text-xs text-[#6E7A99]">
                            {item.iframe_url}
                          </p>
                        )}

                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded-2xl bg-[#42BFA8] py-3 font-black text-white"
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
