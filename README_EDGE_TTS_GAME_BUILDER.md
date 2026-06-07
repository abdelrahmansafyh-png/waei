# WAEI Template Game Builder + Edge TTS

هذه النسخة تضيف توليد ألعاب من Template داخل تبويب الألعاب.

## كيف يعمل؟

داخل لوحة واعي:

1. اختَر نوع المحتوى: لعبة ZIP.
2. اختَر Template: Balloon Plane أو Subway.
3. عدّل JSON الخاص باللعبة.
4. اضغط: توليد اللعبة + الصوت + الرفع.

النظام يعمل تلقائيًا:

- يجهز `game.json`.
- يولد `tts_items.json`.
- يشغل Edge TTS محليًا.
- ينشئ ملفات `audio/*.mp3`.
- يحقن bridge الخاص بواعِي.
- يرفع اللعبة على Hostinger عبر FTP.
- يرجع رابط iframe ويحفظه في المحتوى.

## مهم

Hostinger عندك لا يحتوي Python، لذلك توليد الصوت يجب أن يحدث على الجهاز/السيرفر الذي يشغل مشروع Next.js الخاص بلوحة واعي.

الإدمن لا يشغل أوامر عند كل لعبة. الأمر يحصل تلقائيًا بعد الضغط على زر التوليد.

لكن قبل أول استخدام فقط، على جهاز تشغيل واعي:

```bash
pip install edge-tts
```

أو:

```bash
python3 -m pip install edge-tts
```

## الملفات المضافة/المعدلة

- `app/api/template-game/route.ts`
- `app/admin/tabs/[id]/page.tsx`
- `scripts/generate_audio_edge.py`
- `scripts/requirements-edge-tts.txt`
- `game-templates/balloon_plane.zip`
- `game-templates/subway.zip`

## تغيير الصوت

يمكنك وضع هذا في `.env.local`:

```env
EDGE_TTS_VOICE=ar-SA-ZariyahNeural
```

أو اتركه كما هو ليستخدم:

```text
ar-SA-HamedNeural
```
