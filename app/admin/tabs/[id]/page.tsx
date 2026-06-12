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
  { value: "interactive_story", label: "قصة تفاعلية", icon: "🎭" },
];

function getContentTypesForTab(tabType?: string) {
  if (tabType === "interactive_stories") {
    return [{ value: "interactive_story", label: "قصة تفاعلية", icon: "🎭" }];
  }

  if (tabType === "games") {
    return contentTypes.filter((type) => type.value !== "interactive_story");
  }

  return contentTypes;
}

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
  {
    id: "maze_quiz",
    name: "المتاهة",
  },
  {
    id: "fishing_game",
    name: "لعبة الصيد",
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
  const [formOpen, setFormOpen] = useState(false);
  const [templateId, setTemplateId] = useState("balloon_plane");
  const [templateMeta, setTemplateMeta] = useState({
    title: "",
    question: "",
    questionAudio: "",
    instruction: "",
    targetCategory: "correct",
    targetCount: "5",
    maxAttempts: "5",
  });

  const [templateItems, setTemplateItems] = useState<any[]>([
    { text: "", image: "", category: "correct", audio: "" },
  ]);

  const [templatePraiseSounds, setTemplatePraiseSounds] = useState<any[]>([
    { text: "أحسنت", audio: "" },
    { text: "رائع", audio: "" },
  ]);

  const [templateQuestions, setTemplateQuestions] = useState<any[]>([
    {
      q: "",
      image: "",
      answers: [
        { text: "", image: "", correct: true },
        { text: "", image: "", correct: false },
        { text: "", image: "", correct: false },
        { text: "", image: "", correct: false },
      ],
    },
  ]);

  const [storyDescription, setStoryDescription] = useState("");
  const [storyScenes, setStoryScenes] = useState<any[]>([
    {
      title: "المشهد 1",
      videoUrl: "",
      question: "",
      answers: [
        {
          text: "",
          isCorrect: true,
          feedbackVideoUrl: "",
          nextQuestionIndex: "end",
        },
        {
          text: "",
          isCorrect: false,
          feedbackVideoUrl: "",
          nextQuestionIndex: "end",
        },
      ],
    },
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

    if ((tabData as TabInfo)?.type === "interactive_stories") {
      setForm((prev) => ({ ...prev, content_type: "interactive_story" }));
    }

    setLoading(false);
  }

  function normalizeLoadedGameToForm(game: any, fallbackTemplateId?: string) {
    if (!game) return;

    if (Array.isArray(game)) {
      setTemplateId(fallbackTemplateId || "maze_quiz");

      setTemplateMeta({
        title: "",
        question: "",
        questionAudio: "",
        instruction: "",
        targetCategory: "correct",
        targetCount: "5",
        maxAttempts: "5",
      });

      setTemplateQuestions(
        game.length
          ? game.map((q: any) => ({
              q: q.q || q.question || q.text || "",
              image: q.image || "",
              answers: Array.isArray(q.answers)
                ? q.answers.map((a: any) => ({
                    text: a.text || a.label || "",
                    image: a.image || "",
                    correct: Boolean(a.correct),
                  }))
                : [
                    { text: "", image: "", correct: true },
                    { text: "", image: "", correct: false },
                    { text: "", image: "", correct: false },
                    { text: "", image: "", correct: false },
                  ],
            }))
          : [
              {
                q: "",
                image: "",
                answers: [
                  { text: "", image: "", correct: true },
                  { text: "", image: "", correct: false },
                  { text: "", image: "", correct: false },
                  { text: "", image: "", correct: false },
                ],
              },
            ],
      );

      return;
    }

    if (Array.isArray(game.questions)) {
      setTemplateId(fallbackTemplateId || "maze_quiz");

      setTemplateMeta({
        title: game.title || "",
        question: "",
        questionAudio: "",
        instruction: "",
        targetCategory: "correct",
        targetCount: "5",
        maxAttempts: "5",
      });

      setTemplateQuestions(
        game.questions.length
          ? game.questions.map((q: any) => ({
              q: q.q || q.question || q.text || "",
              image: q.image || "",
              answers: Array.isArray(q.answers)
                ? q.answers.map((a: any) => ({
                    text: a.text || a.label || "",
                    image: a.image || "",
                    correct: Boolean(a.correct),
                  }))
                : [
                    { text: "", image: "", correct: true },
                    { text: "", image: "", correct: false },
                    { text: "", image: "", correct: false },
                    { text: "", image: "", correct: false },
                  ],
            }))
          : [
              {
                q: "",
                image: "",
                answers: [
                  { text: "", image: "", correct: true },
                  { text: "", image: "", correct: false },
                  { text: "", image: "", correct: false },
                  { text: "", image: "", correct: false },
                ],
              },
            ],
      );

      return;
    }

    if (game.levels && Array.isArray(game.levels) && game.levels[0]) {
      const level = game.levels[0];

      setTemplateId(fallbackTemplateId || "subway");

      setTemplateMeta({
        title: game.title || "",
        question: level.question || level.title || "",
        questionAudio: level.audio || "",
        instruction: "",
        targetCategory: level.targetCategory || level.target || "correct",
        targetCount: String(game.targetCount || 5),
        maxAttempts: String(game.maxAttempts || game.targetCount || 5),
      });

      setTemplateItems(
        Array.isArray(level.items) && level.items.length
          ? level.items.map((x: any) => ({
              text: x.text || x.label || "",
              image: x.image || "",
              category: x.category || x.type || "correct",
              audio: x.audio || "",
            }))
          : [{ text: "", image: "", category: "correct" }],
      );

      return;
    }

    if (Array.isArray(game.cards)) {
      setTemplateId(fallbackTemplateId || "drag_dynamic_kid");

      setTemplateMeta({
        title: game.title || "",
        question: "",
        questionAudio: "",
        instruction: game.instruction || "",
        targetCategory: "correct",
        targetCount: "5",
        maxAttempts: "5",
      });

      setTemplateItems(
        game.cards.length
          ? game.cards.map((x: any) => ({
              text: x.text || x.label || "",
              image: x.image || "",
              category: x.group || x.category || "correct",
              audio: x.audio || "",
            }))
          : [{ text: "", image: "", category: "correct" }],
      );

      return;
    }

    setTemplateId(fallbackTemplateId || "balloon_plane");

    setTemplateMeta({
      title: game.title || "",
      question: game.question || "",
      questionAudio: game.questionAudio || "",
      instruction: "",
      targetCategory: game.targetCategory || game.target || "correct",
      targetCount: String(game.targetCount || game.maxAttempts || 5),
      maxAttempts: String(game.maxAttempts || game.targetCount || 5),
    });

    if (fallbackTemplateId === "fishing_game" || game.praiseSounds) {
      setTemplatePraiseSounds(
        Array.isArray(game.praiseSounds) && game.praiseSounds.length
          ? game.praiseSounds.map((p: any) => ({
              text: p.text || "",
              audio: p.audio || "",
            }))
          : [
              { text: "أحسنت", audio: "" },
              { text: "رائع", audio: "" },
            ],
      );
    }

    setTemplateItems(
      Array.isArray(game.items) && game.items.length
        ? game.items.map((x: any) => ({
            text: x.text || x.label || "",
            image: x.image || "",
            category: x.category || x.type || "correct",
            audio: x.audio || "",
          }))
        : [{ text: "", image: "", category: "correct" }],
    );
  }

  async function loadGameDataForEdit(item: Content) {
    // 1) الأفضل: نقرأ البيانات المخزنة في body من قاعدة البيانات
    if (item.body) {
      try {
        const saved = JSON.parse(item.body);

        if (saved?.game_config) {
          normalizeLoadedGameToForm(
            saved.game_config,
            saved.template_id || saved.game_template_id,
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
        { cache: "no-store" },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        const questionsJsonUrl = gameJsonUrl.replace(
          /game\.json(?:\?.*)?$/,
          "questions.json",
        );

        const res2 = await fetch(
          `/api/read-game-json?url=${encodeURIComponent(questionsJsonUrl)}`,
          { cache: "no-store" },
        );

        const result2 = await res2.json();

        if (!res2.ok || !result2.success) {
          console.warn(
            "لم يتم العثور على game.json أو questions.json:",
            result?.message || gameJsonUrl,
          );
          return;
        }

        normalizeLoadedGameToForm(result2.game, "maze_quiz");
        return;
      }

      normalizeLoadedGameToForm(result.game);
    } catch (e) {
      console.warn("فشل تحميل بيانات اللعبة القديمة", e);
    }
  }

  function resetForm() {
    setEditingId(null);
    setFormOpen(false);
    setForm({
      ...emptyForm,
      content_type:
        tab?.type === "interactive_stories" ? "interactive_story" : "text",
    });
    setStoryDescription("");
    setStoryScenes([
      {
        title: "المشهد 1",
        videoUrl: "",
        question: "",
        answers: [
          {
            text: "",
            isCorrect: true,
            feedbackVideoUrl: "",
            nextQuestionIndex: "end",
          },
          {
            text: "",
            isCorrect: false,
            feedbackVideoUrl: "",
            nextQuestionIndex: "end",
          },
        ],
      },
    ]);
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

    if (item.content_type === "interactive_story" && item.body) {
      try {
        const saved = JSON.parse(item.body);
        setStoryDescription(saved?.story?.description || "");
        if (Array.isArray(saved?.editor_scenes) && saved.editor_scenes.length) {
          setStoryScenes(saved.editor_scenes);
        }
      } catch {}
    }

    setFormOpen(true);
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

  async function uploadTemplateAudio(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "game-audio");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "فشل رفع الصوت");
    }

    return result.path;
  }

  async function uploadStoryVideo(
    file: File,
    sceneIndex: number,
    answerIndex?: number,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "files");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "فشل رفع الفيديو");
    }

    const next = [...storyScenes];
    if (typeof answerIndex === "number") {
      next[sceneIndex].answers[answerIndex].feedbackVideoUrl = result.path;
    } else {
      next[sceneIndex].videoUrl = result.path;
    }
    setStoryScenes(next);
  }

  function buildInteractiveStoryJson() {
    const scenes: any[] = [];

    storyScenes.forEach((scene, sceneIndex) => {
      const sceneId = `scene_${sceneIndex + 1}`;

      scenes.push({
        id: sceneId,
        title: scene.title || `المشهد ${sceneIndex + 1}`,
        videoUrl: scene.videoUrl,
        story: scene.story || "",
        question: scene.question,
        points: 1,
        answers: scene.answers.map((answer: any, answerIndex: number) => ({
          text: answer.text,
          isCorrect: Boolean(answer.isCorrect),
          nextSceneId: `${sceneId}_answer_${answerIndex + 1}`,
          color: answer.isCorrect ? "good" : "bad",
        })),
      });

      scene.answers.forEach((answer: any, answerIndex: number) => {
        const feedbackScene: any = {
          id: `${sceneId}_answer_${answerIndex + 1}`,
          title: answer.isCorrect
            ? "نتيجة الاختيار الصحيح"
            : "نتيجة الاختيار الخاطئ",
          videoUrl: answer.feedbackVideoUrl,
        };

        if (answer.nextQuestionIndex === "end") {
          feedbackScene.end = true;
        } else {
          feedbackScene.autoNextSceneId = `scene_${Number(answer.nextQuestionIndex) + 1}`;
        }

        scenes.push(feedbackScene);
      });
    });

    return {
      title: form.title || "قصة تفاعلية",
      description: storyDescription || "شاهد المشهد واختر القرار المناسب.",
      footerText: "كل اختيار يفتح مسارًا مختلفًا.",
      startSceneId: "scene_1",
      maxScore: storyScenes.length,
      autoplay: true,
      endTitle: "انتهت القصة",
      endText: "رائع! شاهدت المواقف واتخذت قراراتك.",
      scenes,
    };
  }

  function getStaticStoryTemplateUrl(dataPath: string) {
    const base =
      process.env.NEXT_PUBLIC_INTERACTIVE_STORY_TEMPLATE_URL ||
      `${process.env.NEXT_PUBLIC_FILES_URL || ""}/game-templates/decision_theater/index.html`;

    return `${base}?data=${encodeURIComponent(dataPath)}&v=${Date.now()}`;
  }

  async function generateInteractiveStory() {
    if (!form.title.trim()) {
      alert("اكتب عنوان القصة أولاً");
      return;
    }

    for (const [sceneIndex, scene] of storyScenes.entries()) {
      if (!scene.videoUrl) {
        alert(`ارفع فيديو المشهد ${sceneIndex + 1}`);
        return;
      }

      if (!scene.question.trim()) {
        alert(`اكتب سؤال المشهد ${sceneIndex + 1}`);
        return;
      }

      for (const [answerIndex, answer] of scene.answers.entries()) {
        if (!answer.text.trim()) {
          alert(
            `اكتب نص الخيار ${answerIndex + 1} في المشهد ${sceneIndex + 1}`,
          );
          return;
        }

        if (!answer.feedbackVideoUrl) {
          alert(
            `ارفع فيديو نتيجة الخيار ${answerIndex + 1} في المشهد ${sceneIndex + 1}`,
          );
          return;
        }
      }
    }

    setUploading(true);

    try {
      const story = buildInteractiveStoryJson();
      const stableId =
        editingId ||
        `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch("/api/interactive-story-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stableId,
          story,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.message || "فشل حفظ بيانات القصة");
        setUploading(false);
        return;
      }

      const iframeUrl = getStaticStoryTemplateUrl(result.path);

      setForm((prev) => ({
        ...prev,
        iframe_url: iframeUrl,
        file_url: result.path,
        body: JSON.stringify({
          template_id: "interactive_story_static",
          data_path: result.path,
          data_url: result.url,
          template_url: iframeUrl,
          story,
          editor_scenes: storyScenes,
        }),
      }));
    } catch (e: any) {
      alert(e?.message || "حدث خطأ أثناء حفظ بيانات القصة");
    }

    setUploading(false);
  }

  function buildTemplateGameJson() {
    const parsed: any = {};

    parsed.title = templateMeta.title;

    if (templateId === "maze_quiz") {
      parsed.questions = templateQuestions.map((question) => ({
        type: question.image ? "image" : "text",
        q: question.q,
        image: question.image,
        audio: question.audio || "",
        answers: question.answers.map((answer: any) => ({
          type: answer.image ? "image" : "text",
          text: answer.text,
          image: answer.image,
          correct: Boolean(answer.correct),
          audio: answer.audio || "",
        })),
      }));

      return parsed;
    }

    if (templateId === "fishing_game") {
      const attempts = Number(
        templateMeta.maxAttempts || templateMeta.targetCount || 5,
      );
      parsed.question = templateMeta.question;
      parsed.questionAudio = templateMeta.questionAudio || "";
      parsed.targetCategory = templateMeta.targetCategory || "strength";
      parsed.maxAttempts = attempts;
      parsed.targetCount = attempts;

      parsed.praiseSounds = templatePraiseSounds
        .filter(
          (p) => String(p.text || "").trim() || String(p.audio || "").trim(),
        )
        .map((p) => ({
          text: p.text,
          audio: p.audio || "",
        }));

      parsed.items = templateItems.map((item) => ({
        text: item.text,
        image: item.image,
        category: item.category,
        audio: item.audio || "",
      }));

      return parsed;
    }

    if (templateId === "drag_dynamic_kid") {
      parsed.instruction = templateMeta.instruction;
      parsed.character = "images/character.png";

      const groups = Array.from(
        new Set(templateItems.map((x) => x.category).filter(Boolean)),
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
      parsed.questionAudio = templateMeta.questionAudio || "";
      parsed.targetCategory = templateMeta.targetCategory;
      parsed.totalBalloons = Number(templateMeta.targetCount || templateMeta.maxAttempts || 20);
      parsed.targetCount = Number(templateMeta.targetCount || templateMeta.maxAttempts || 20);
      parsed.maxAttempts = Number(templateMeta.maxAttempts || templateMeta.targetCount || 20);

      parsed.items = templateItems.map((item) => ({
        text: item.text,
        image: item.image,
        category: item.category,
        audio: item.audio || "",
      }));
    }

    return parsed;
  }

  function getPreviousGameFromBody() {
    if (!form.body) return null;

    try {
      const saved = JSON.parse(form.body);
      return saved?.game_config || saved?.game || null;
    } catch {
      return null;
    }
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

      const stableId =
        editingId ||
        `game-${templateId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const previousGame = getPreviousGameFromBody();

      const res = await fetch("/api/template-game-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stableId,
          template_id: templateId,
          game,
          previous_game: previousGame,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.message || "فشل حفظ بيانات اللعبة");
        setUploading(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        iframe_url: result.game_url,
        file_url: result.data_path,
        body: JSON.stringify({
          template_id: templateId,
          mode: "static_template",
          data_path: result.data_path,
          data_url: result.data_url,
          template_url: result.game_url,
          game_config: result.game || game,
        }),
      }));

      alert(result.message || "تم تجهيز اللعبة");
    } catch (e: any) {
      alert(e?.message || "حدث خطأ أثناء حفظ بيانات اللعبة");
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

    if (form.content_type === "interactive_story" && !form.iframe_url) {
      alert("احفظ بيانات القصة أولًا");
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

  const availableContentTypes = getContentTypesForTab(tab?.type);
  const selectedType =
    availableContentTypes.find((x) => x.value === form.content_type) ||
    contentTypes.find((x) => x.value === form.content_type);

  return (
    <main dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] bg-white p-6 shadow-lg">
          <h1 className="text-3xl font-black text-[#0B4D6B]">محتوى التاب</h1>

          <p className="mt-2 text-[#6E7A99]">
            {tab
              ? `${tab.title} — أضف المحتوى الذي سيظهر للطفل.`
              : "إدارة محتوى التاب"}
          </p>
        </div>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-5 shadow-lg">
            <div>
              <h2 className="text-2xl font-black text-[#0B4D6B]">
                المحتوى المضاف
              </h2>
              <p className="mt-1 text-sm font-bold text-[#6E7A99]">
                اعرض المحتوى هنا، والإضافة أو التعديل تتم من نافذة كبيرة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
              className="rounded-full bg-[#42BFA8] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1"
            >
              + إضافة محتوى
            </button>
          </div>

          {formOpen && (
            <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-[#062033]/70 p-4 backdrop-blur-sm">
              <section className="my-6 w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#DDEDEA] bg-white/95 p-6 backdrop-blur">
                  <div>
                    <h2 className="text-3xl font-black text-[#0B4D6B]">
                      {editingId ? "تعديل المحتوى" : "إضافة محتوى جديد"}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-[#6E7A99]">
                      نافذة واسعة لإدخال المحتوى بدون حشر.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full bg-red-50 px-5 py-3 font-black text-red-600"
                  >
                    إغلاق
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-6 rounded-[1.6rem] bg-gradient-to-l from-[#E8F7F3] to-[#F5FBFF] p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0B4D6B] text-2xl text-white">
                        {editingId ? "✏️" : "➕"}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[#0B4D6B]">
                          {editingId ? "تعديل المحتوى" : "إضافة محتوى جديد"}
                        </h2>
                        <p className="mt-1 text-sm font-bold text-[#6E7A99]">
                          اختر النوع ثم عبئ البيانات بهدوء.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={saveContent} className="space-y-5">
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
                        className="w-full appearance-none rounded-[1.4rem] border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] shadow-sm outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                      >
                        {availableContentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-[1.4rem] border border-[#DDEDEA] bg-[#F4FAF8] p-4 text-sm font-black text-[#0B4D6B]">
                      النوع المختار: {selectedType?.icon} {selectedType?.label}
                    </div>

                    <input
                      placeholder={
                        form.content_type === "interactive_story"
                          ? "اسم القصة"
                          : "عنوان اختياري"
                      }
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full rounded-[1.4rem] border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] shadow-sm outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                    />

                    {form.content_type === "text" && (
                      <textarea
                        placeholder="اكتب النص هنا"
                        value={form.body}
                        onChange={(e) =>
                          setForm({ ...form, body: e.target.value })
                        }
                        className="h-44 w-full rounded-[1.4rem] border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] shadow-sm outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
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
                          className="w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#42BFA8]/60 bg-white p-4 text-sm font-bold text-[#0B4D6B]"
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

                    {form.content_type === "interactive_story" && (
                      <div className="space-y-5 rounded-2xl border border-dashed border-[#42BFA8] bg-[#F4FAF8] p-5">
                        <div className="rounded-2xl bg-white p-4">
                          <label className="mb-3 block font-black text-[#0B4D6B]">
                            بيانات القصة التفاعلية
                          </label>

                          <textarea
                            placeholder="وصف قصير اختياري يظهر في شاشة البداية"
                            value={storyDescription}
                            onChange={(e) =>
                              setStoryDescription(e.target.value)
                            }
                            className="h-24 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                          />
                        </div>

                        <div className="space-y-4">
                          {storyScenes.map((scene, sceneIndex) => (
                            <div
                              key={sceneIndex}
                              className="rounded-2xl bg-white p-4 shadow-sm"
                            >
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="text-lg font-black text-[#0B4D6B]">
                                  🎬 المشهد {sceneIndex + 1}
                                </div>

                                {storyScenes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStoryScenes(
                                        storyScenes.filter(
                                          (_, i) => i !== sceneIndex,
                                        ),
                                      )
                                    }
                                    className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                                  >
                                    حذف المشهد
                                  </button>
                                )}
                              </div>

                              <input
                                placeholder="اسم داخلي للمشهد اختياري"
                                value={scene.title}
                                onChange={(e) => {
                                  const next = [...storyScenes];
                                  next[sceneIndex].title = e.target.value;
                                  setStoryScenes(next);
                                }}
                                className="mb-3 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                              />

                              <label className="mb-2 block text-sm font-black text-[#0B4D6B]">
                                فيديو المشهد
                              </label>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    setUploading(true);
                                    await uploadStoryVideo(file, sceneIndex);
                                  } catch (err: any) {
                                    alert(err?.message || "فشل رفع الفيديو");
                                  }
                                  setUploading(false);
                                }}
                                className="mb-3 w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#42BFA8]/60 bg-[#F4FAF8] p-4 text-sm font-bold text-[#0B4D6B]"
                              />

                              {scene.videoUrl && (
                                <p className="mb-3 break-all rounded-xl bg-[#F4FAF8] p-3 text-xs font-bold text-[#6E7A99]">
                                  {scene.videoUrl}
                                </p>
                              )}

                              <input
                                placeholder="السؤال بعد انتهاء الفيديو"
                                value={scene.question}
                                onChange={(e) => {
                                  const next = [...storyScenes];
                                  next[sceneIndex].question = e.target.value;
                                  setStoryScenes(next);
                                }}
                                className="mb-4 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                              />

                              <div className="space-y-3 rounded-2xl bg-[#F4FAF8] p-4">
                                <div className="font-black text-[#0B4D6B]">
                                  الخيارات ونتيجة كل خيار
                                </div>

                                {scene.answers.map(
                                  (answer: any, answerIndex: number) => (
                                    <div
                                      key={answerIndex}
                                      className="rounded-2xl border border-[#DDEDEA] bg-white p-3"
                                    >
                                      <input
                                        placeholder={`نص الخيار ${answerIndex + 1}`}
                                        value={answer.text}
                                        onChange={(e) => {
                                          const next = [...storyScenes];
                                          next[sceneIndex].answers[
                                            answerIndex
                                          ].text = e.target.value;
                                          setStoryScenes(next);
                                        }}
                                        className="mb-2 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                      />

                                      <label className="mb-3 flex items-center gap-2 text-sm font-black text-[#0B4D6B]">
                                        <input
                                          type="checkbox"
                                          checked={answer.isCorrect}
                                          onChange={(e) => {
                                            const next = [...storyScenes];
                                            next[sceneIndex].answers[
                                              answerIndex
                                            ].isCorrect = e.target.checked;
                                            setStoryScenes(next);
                                          }}
                                        />
                                        إجابة صحيحة
                                      </label>

                                      <label className="mb-2 block text-sm font-black text-[#0B4D6B]">
                                        فيديو نتيجة هذا الخيار
                                      </label>
                                      <input
                                        type="file"
                                        accept="video/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                            setUploading(true);
                                            await uploadStoryVideo(
                                              file,
                                              sceneIndex,
                                              answerIndex,
                                            );
                                          } catch (err: any) {
                                            alert(
                                              err?.message || "فشل رفع الفيديو",
                                            );
                                          }
                                          setUploading(false);
                                        }}
                                        className="mb-2 w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#42BFA8]/60 bg-[#F4FAF8] p-4 text-sm font-bold text-[#0B4D6B]"
                                      />

                                      {answer.feedbackVideoUrl && (
                                        <p className="mb-3 break-all rounded-xl bg-[#F4FAF8] p-3 text-xs font-bold text-[#6E7A99]">
                                          {answer.feedbackVideoUrl}
                                        </p>
                                      )}

                                      <select
                                        value={answer.nextQuestionIndex}
                                        onChange={(e) => {
                                          const next = [...storyScenes];
                                          next[sceneIndex].answers[
                                            answerIndex
                                          ].nextQuestionIndex = e.target.value;
                                          setStoryScenes(next);
                                        }}
                                        className="w-full rounded-xl border border-[#DDEDEA] bg-white p-3 font-bold text-[#0B4D6B]"
                                      >
                                        <option value="end">
                                          تنتهي القصة بعد فيديو النتيجة
                                        </option>
                                        {storyScenes.map((_, targetIndex) => (
                                          <option
                                            key={targetIndex}
                                            value={targetIndex}
                                          >
                                            الانتقال إلى المشهد{" "}
                                            {targetIndex + 1}
                                          </option>
                                        ))}
                                      </select>

                                      {scene.answers.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = [...storyScenes];
                                            next[sceneIndex].answers = next[
                                              sceneIndex
                                            ].answers.filter(
                                              (_: any, i: number) =>
                                                i !== answerIndex,
                                            );
                                            setStoryScenes(next);
                                          }}
                                          className="mt-3 rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                                        >
                                          حذف الخيار
                                        </button>
                                      )}
                                    </div>
                                  ),
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...storyScenes];
                                    next[sceneIndex].answers.push({
                                      text: "",
                                      isCorrect: false,
                                      feedbackVideoUrl: "",
                                      nextQuestionIndex: "end",
                                    });
                                    setStoryScenes(next);
                                  }}
                                  className="rounded-full bg-[#42BFA8] px-5 py-2 text-sm font-black text-white"
                                >
                                  + إضافة خيار
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setStoryScenes([
                              ...storyScenes,
                              {
                                title: `المشهد ${storyScenes.length + 1}`,
                                videoUrl: "",
                                question: "",
                                answers: [
                                  {
                                    text: "",
                                    isCorrect: true,
                                    feedbackVideoUrl: "",
                                    nextQuestionIndex: "end",
                                  },
                                  {
                                    text: "",
                                    isCorrect: false,
                                    feedbackVideoUrl: "",
                                    nextQuestionIndex: "end",
                                  },
                                ],
                              },
                            ])
                          }
                          className="w-full rounded-full bg-[#42BFA8] py-3 font-black text-white"
                        >
                          + إضافة مشهد جديد
                        </button>

                        <button
                          type="button"
                          disabled={uploading}
                          onClick={generateInteractiveStory}
                          className="w-full rounded-full bg-[#0B4D6B] py-3 font-black text-white disabled:opacity-50"
                        >
                          حفظ بيانات القصة وتجهيز الرابط
                        </button>

                        {uploading && (
                          <p className="rounded-xl bg-[#FFF7D8] p-3 font-bold text-[#9A6B00]">
                            جاري حفظ البيانات...
                          </p>
                        )}

                        {form.iframe_url && (
                          <div className="rounded-2xl bg-white p-4">
                            <div className="mb-3 text-sm font-black text-[#0B4D6B]">
                              تم تجهيز رابط القصة بنجاح 🎉
                            </div>
                            <p className="break-all text-xs text-[#6E7A99]">
                              {form.iframe_url}
                            </p>
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
                                questionAudio: "",
                                instruction: "",
                                targetCategory:
                                  e.target.value === "fishing_game"
                                    ? "strength"
                                    : "correct",
                                targetCount: "5",
                                maxAttempts: "5",
                              });
                              setTemplateItems([
                                {
                                  text: "",
                                  image: "",
                                  category:
                                    e.target.value === "fishing_game"
                                      ? "strength"
                                      : "correct",
                                  audio: "",
                                },
                              ]);
                              setTemplatePraiseSounds([
                                { text: "أحسنت", audio: "" },
                                { text: "رائع", audio: "" },
                              ]);
                              setTemplateQuestions([
                                {
                                  q: "",
                                  image: "",
                                  answers: [
                                    { text: "", image: "", correct: true },
                                    { text: "", image: "", correct: false },
                                    { text: "", image: "", correct: false },
                                    { text: "", image: "", correct: false },
                                  ],
                                },
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
                              className="mb-3 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                            />

                            {templateId !== "drag_dynamic_kid" &&
                            templateId !== "maze_quiz" ? (
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
                                  className="mb-3 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                />

                                {templateId !== "drag_dynamic_kid" && templateId !== "maze_quiz" && (
                                  <div className="mb-3 rounded-2xl bg-[#F4FAF8] p-3">
                                    <label className="mb-2 block text-sm font-black text-[#0B4D6B]">
                                      صوت السؤال
                                    </label>
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          setUploading(true);
                                          const path =
                                            await uploadTemplateAudio(file);
                                          setTemplateMeta({
                                            ...templateMeta,
                                            questionAudio: path,
                                          });
                                        } catch (err: any) {
                                          alert(
                                            err?.message ||
                                              "فشل رفع صوت السؤال",
                                          );
                                        }
                                        setUploading(false);
                                      }}
                                      className="w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#42BFA8]/60 bg-white p-4 text-sm font-bold text-[#0B4D6B]"
                                    />
                                    {templateMeta.questionAudio && (
                                      <p className="mt-2 break-all rounded-xl bg-white p-2 text-xs font-bold text-[#6E7A99]">
                                        {templateMeta.questionAudio}
                                      </p>
                                    )}
                                  </div>
                                )}

                                <input
                                  placeholder="التصنيف المطلوب"
                                  value={templateMeta.targetCategory}
                                  onChange={(e) =>
                                    setTemplateMeta({
                                      ...templateMeta,
                                      targetCategory: e.target.value,
                                    })
                                  }
                                  className="mb-3 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                />

                                {templateId === "fishing_game" && (
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="عدد المحاولات / الصيدات"
                                    value={templateMeta.maxAttempts}
                                    onChange={(e) =>
                                      setTemplateMeta({
                                        ...templateMeta,
                                        maxAttempts: e.target.value,
                                        targetCount: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                  />
                                )}
                              </>
                            ) : templateId === "drag_dynamic_kid" ? (
                              <textarea
                                placeholder="تعليمات اللعبة"
                                value={templateMeta.instruction}
                                onChange={(e) =>
                                  setTemplateMeta({
                                    ...templateMeta,
                                    instruction: e.target.value,
                                  })
                                }
                                className="h-28 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                              />
                            ) : null}
                          </div>

                          {templateId === "maze_quiz" && (
                            <div className="mb-4 rounded-2xl bg-[#F4FAF8] p-4">
                              <div className="mb-3 text-sm font-black text-[#0B4D6B]">
                                أسئلة المتاهة
                              </div>

                              <div className="space-y-4">
                                {templateQuestions.map((question, qIndex) => (
                                  <div
                                    key={qIndex}
                                    className="rounded-2xl border border-[#DDEDEA] bg-white p-4"
                                  >
                                    <input
                                      placeholder={`السؤال ${qIndex + 1}`}
                                      value={question.q}
                                      onChange={(e) => {
                                        const next = [...templateQuestions];
                                        next[qIndex].q = e.target.value;
                                        setTemplateQuestions(next);
                                      }}
                                      className="mb-3 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                    />

                                    <div className="space-y-2">
                                      {question.answers.map(
                                        (answer: any, aIndex: number) => (
                                          <div
                                            key={aIndex}
                                            className="grid gap-2 rounded-xl bg-[#F4FAF8] p-3 md:grid-cols-[1fr_auto]"
                                          >
                                            <input
                                              placeholder={`الإجابة ${aIndex + 1}`}
                                              value={answer.text}
                                              onChange={(e) => {
                                                const next = [
                                                  ...templateQuestions,
                                                ];
                                                next[qIndex].answers[
                                                  aIndex
                                                ].text = e.target.value;
                                                setTemplateQuestions(next);
                                              }}
                                              className="rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                            />

                                            <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-[#0B4D6B]">
                                              <input
                                                type="radio"
                                                name={`correct-${qIndex}`}
                                                checked={answer.correct}
                                                onChange={() => {
                                                  const next = [
                                                    ...templateQuestions,
                                                  ];
                                                  next[qIndex].answers = next[
                                                    qIndex
                                                  ].answers.map(
                                                    (a: any, i: number) => ({
                                                      ...a,
                                                      correct: i === aIndex,
                                                    }),
                                                  );
                                                  setTemplateQuestions(next);
                                                }}
                                              />
                                              صح
                                            </label>
                                          </div>
                                        ),
                                      )}
                                    </div>

                                    {templateQuestions.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTemplateQuestions(
                                            templateQuestions.filter(
                                              (_, i) => i !== qIndex,
                                            ),
                                          )
                                        }
                                        className="mt-3 rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                                      >
                                        حذف السؤال
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setTemplateQuestions([
                                    ...templateQuestions,
                                    {
                                      q: "",
                                      image: "",
                                      answers: [
                                        { text: "", image: "", correct: true },
                                        { text: "", image: "", correct: false },
                                        { text: "", image: "", correct: false },
                                        { text: "", image: "", correct: false },
                                      ],
                                    },
                                  ])
                                }
                                className="mt-3 rounded-full bg-[#42BFA8] px-5 py-2 text-sm font-black text-white"
                              >
                                + إضافة سؤال
                              </button>
                            </div>
                          )}

                          {templateId !== "maze_quiz" && (
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
                                      className="mb-2 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                    />

                                    <input
                                      placeholder={
                                        templateId === "drag_dynamic_kid"
                                          ? "اسم المجموعة / التصنيف"
                                          : "تصنيف العنصر"
                                      }
                                      value={item.category}
                                      onChange={(e) => {
                                        const next = [...templateItems];
                                        next[index].category = e.target.value;
                                        setTemplateItems(next);
                                      }}
                                      className="mb-2 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                    />

                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        try {
                                          setUploading(true);

                                          const path =
                                            await uploadTemplateImage(file);

                                          const next = [...templateItems];
                                          next[index].image = path;
                                          setTemplateItems(next);
                                        } catch (err: any) {
                                          alert(
                                            err?.message || "فشل رفع الصورة",
                                          );
                                        }

                                        setUploading(false);
                                      }}
                                      className="w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#42BFA8]/60 bg-[#F4FAF8] p-4 text-sm font-bold text-[#0B4D6B]"
                                    />

                                    {item.image && (
                                      <img
                                        src={getFileUrl(item.image)}
                                        alt=""
                                        className="mt-3 h-24 w-24 rounded-2xl object-cover"
                                      />
                                    )}

                                    {templateId !== "drag_dynamic_kid" && templateId !== "maze_quiz" && (
                                      <div className="mt-3 rounded-2xl bg-[#F4FAF8] p-3">
                                        <label className="mb-2 block text-sm font-black text-[#0B4D6B]">
                                          صوت هذا الخيار
                                        </label>
                                        <input
                                          type="file"
                                          accept="audio/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              setUploading(true);
                                              const path =
                                                await uploadTemplateAudio(file);
                                              const next = [...templateItems];
                                              next[index].audio = path;
                                              setTemplateItems(next);
                                            } catch (err: any) {
                                              alert(
                                                err?.message ||
                                                  "فشل رفع صوت الخيار",
                                              );
                                            }
                                            setUploading(false);
                                          }}
                                          className="w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#42BFA8]/60 bg-white p-4 text-sm font-bold text-[#0B4D6B]"
                                        />
                                        {item.audio && (
                                          <p className="mt-2 break-all rounded-xl bg-white p-2 text-xs font-bold text-[#6E7A99]">
                                            {item.audio}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {templateItems.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTemplateItems(
                                            templateItems.filter(
                                              (_, i) => i !== index,
                                            ),
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
                                      category:
                                        templateId === "fishing_game"
                                          ? "strength"
                                          : "correct",
                                      audio: "",
                                    },
                                  ])
                                }
                                className="mt-3 rounded-full bg-[#42BFA8] px-5 py-2 text-sm font-black text-white"
                              >
                                + إضافة عنصر
                              </button>
                            </div>
                          )}

                          {templateId === "fishing_game" && (
                            <div className="mb-4 rounded-2xl bg-[#FFF7E8] p-4">
                              <div className="mb-3 text-sm font-black text-[#0B4D6B]">
                                كلمات المدح وأصواتها
                              </div>
                              <div className="space-y-3">
                                {templatePraiseSounds.map((praise, index) => (
                                  <div
                                    key={index}
                                    className="rounded-2xl border border-[#F3D7A8] bg-white p-3"
                                  >
                                    <input
                                      placeholder="كلمة المدح مثل: أحسنت، رائع"
                                      value={praise.text}
                                      onChange={(e) => {
                                        const next = [...templatePraiseSounds];
                                        next[index].text = e.target.value;
                                        setTemplatePraiseSounds(next);
                                      }}
                                      className="mb-2 w-full rounded-[1.2rem] border border-[#DDEDEA] p-3 shadow-sm outline-none focus:border-[#42BFA8]"
                                    />
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          setUploading(true);
                                          const path =
                                            await uploadTemplateAudio(file);
                                          const next = [
                                            ...templatePraiseSounds,
                                          ];
                                          next[index].audio = path;
                                          setTemplatePraiseSounds(next);
                                        } catch (err: any) {
                                          alert(
                                            err?.message || "فشل رفع صوت المدح",
                                          );
                                        }
                                        setUploading(false);
                                      }}
                                      className="w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#F59E0B]/60 bg-[#FFF7E8] p-4 text-sm font-bold text-[#0B4D6B]"
                                    />
                                    {praise.audio && (
                                      <p className="mt-2 break-all rounded-xl bg-[#FFF7E8] p-2 text-xs font-bold text-[#6E7A99]">
                                        {praise.audio}
                                      </p>
                                    )}
                                    {templatePraiseSounds.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTemplatePraiseSounds(
                                            templatePraiseSounds.filter(
                                              (_, i) => i !== index,
                                            ),
                                          )
                                        }
                                        className="mt-3 rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                                      >
                                        حذف المدح
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setTemplatePraiseSounds([
                                    ...templatePraiseSounds,
                                    { text: "", audio: "" },
                                  ])
                                }
                                className="mt-3 rounded-full bg-[#F59E0B] px-5 py-2 text-sm font-black text-white"
                              >
                                + إضافة كلمة مدح
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={uploading}
                            onClick={generateTemplateGame}
                            className="mt-3 w-full rounded-full bg-[#0B4D6B] py-3 font-black text-white disabled:opacity-50"
                          >
                            حفظ بيانات اللعبة وتوليد الأصوات الجديدة فقط
                          </button>

                          <p className="mt-3 text-xs font-bold leading-6 text-[#6E7A99]">
                            ملاحظة: عند التعديل يتم إعادة استخدام الأصوات
                            القديمة إذا النص لم يتغير، ويتم توليد الصوت فقط
                            للكلمات/الجمل الجديدة.
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
                            className="w-full cursor-pointer rounded-[1.2rem] border-2 border-dashed border-[#42BFA8]/60 bg-[#F4FAF8] p-4 text-sm font-bold text-[#0B4D6B]"
                          />
                        </div>

                        {uploading && (
                          <p className="rounded-xl bg-[#FFF7D8] p-3 font-bold text-[#9A6B00]">
                            جاري حفظ البيانات وتوليد الناقص فقط...
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
                                setForm({
                                  ...form,
                                  iframe_url: "",
                                  file_url: "",
                                })
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
                        className="w-full rounded-[1.4rem] border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] shadow-sm outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                      />
                    )}

                    {form.content_type === "iframe" && (
                      <textarea
                        placeholder="رابط iframe أو embed URL"
                        value={form.iframe_url}
                        onChange={(e) =>
                          setForm({ ...form, iframe_url: e.target.value })
                        }
                        className="h-32 w-full rounded-[1.4rem] border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] shadow-sm outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                      />
                    )}

                    <input
                      type="number"
                      placeholder="الترتيب"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm({ ...form, sort_order: Number(e.target.value) })
                      }
                      className="w-full rounded-[1.4rem] border border-[#DDEDEA] bg-white px-4 py-4 text-[#0B4D6B] shadow-sm outline-none transition focus:border-[#42BFA8] focus:ring-4 focus:ring-[#42BFA8]/10"
                    />

                    <div className="sticky bottom-0 -mx-2 rounded-[1.5rem] bg-white/95 p-3 shadow-[0_-12px_30px_rgba(11,77,107,.08)] backdrop-blur">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="w-full rounded-full bg-[#42BFA8] py-4 font-black text-white shadow-lg disabled:opacity-50"
                      >
                        {editingId ? "حفظ التعديل" : "حفظ المحتوى"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="mt-3 w-full rounded-full bg-gray-100 py-4 font-black text-[#0B4D6B]"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </section>
            </div>
          )}

          <section>
            <div className="mb-5 flex items-center justify-between rounded-[1.6rem] bg-white p-5 shadow-lg">
              <div>
                <h2 className="text-2xl font-black text-[#0B4D6B]">
                  قائمة المحتوى
                </h2>
                <p className="mt-1 text-sm font-bold text-[#6E7A99]">
                  الكروت الموجودة داخل هذا التاب.
                </p>
              </div>
              <span className="rounded-full bg-[#D9F5EE] px-5 py-2 text-sm font-black text-[#0B4D6B]">
                {contents.length} عنصر
              </span>
            </div>

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
              <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                {contents.map((item) => {
                  const type = contentTypes.find(
                    (x) => x.value === item.content_type,
                  );

                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
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

                      {(item.content_type === "zip_game" ||
                        item.content_type === "interactive_story") && (
                        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-[#0B4D6B] to-[#42BFA8] text-6xl">
                          {item.content_type === "interactive_story"
                            ? "🎭"
                            : "🕹️"}
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

                        {item.body && item.content_type === "text" && (
                          <p className="mt-4 line-clamp-4 leading-8 text-[#6E7A99]">
                            {item.body}
                          </p>
                        )}

                        {(item.content_type === "zip_game" ||
                          item.content_type === "interactive_story") && (
                          <div className="mt-4 rounded-2xl bg-[#F4FAF8] p-4 text-sm font-black text-[#0B4D6B]">
                            {item.content_type === "interactive_story"
                              ? "قصة جاهزة للعرض داخل البرنامج"
                              : "لعبة جاهزة للعرض داخل البرنامج"}
                          </div>
                        )}

                        {item.youtube_url && (
                          <p className="mt-4 truncate rounded-xl bg-[#F4FAF8] p-3 text-xs text-[#6E7A99]">
                            {item.youtube_url}
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
          </section>
        </div>
      </div>
    </main>
  );
}
