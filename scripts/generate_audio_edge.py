import asyncio
import json
import sys
from pathlib import Path
import edge_tts

# Usage: python scripts/generate_audio_edge.py /path/to/workdir [voice]
BASE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).parent.resolve()
VOICE = sys.argv[2] if len(sys.argv) > 2 else "ar-SA-HamedNeural"
TTS_FILE = BASE / "tts_items.json"

items = []
if TTS_FILE.exists():
    items = json.loads(TTS_FILE.read_text(encoding="utf-8"))

game_json_files = list(BASE.rglob("game.json"))
GAME_DIR = game_json_files[0].parent if game_json_files else BASE

AUDIO = GAME_DIR / "audio"
AUDIO.mkdir(parents=True, exist_ok=True)

praise_items = [
    {"text":"رائع", "file":"praise_0.mp3"},
    {"text":"أحسنت", "file":"praise_1.mp3"},
    {"text":"ممتاز", "file":"praise_2.mp3"},
    {"text":"بطل", "file":"praise_3.mp3"},
    {"text":"مذهل", "file":"praise_4.mp3"},
    {"text":"أبدعت", "file":"praise_5.mp3"},
]

async def save_audio(text: str, file_name: str):
    text = str(text or "").strip()
    file_name = str(file_name or "").strip()
    if not text or not file_name:
        return

    safe_file = Path(file_name).name
    out = AUDIO / safe_file

    if out.exists() and out.stat().st_size > 0:
        print("skip:", out.name)
        return

    print("generate:", out.name, "=>", text)
    communicate = edge_tts.Communicate(text=text, voice=VOICE, rate="-8%")
    await communicate.save(str(out))

async def main():
    for item in items:
        await save_audio(item.get("text", ""), item.get("file", ""))

    for item in praise_items:
        await save_audio(item["text"], item["file"])

asyncio.run(main())
print("done:", AUDIO)
