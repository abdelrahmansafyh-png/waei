import asyncio
import json
import sys
from pathlib import Path
import edge_tts

# Usage: python scripts/generate_audio_edge.py /path/to/workdir [voice]
BASE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).parent.resolve()
VOICE = sys.argv[2] if len(sys.argv) > 2 else "ar-SA-HamedNeural"
TTS_FILE = BASE / "tts_items.json"

if not TTS_FILE.exists():
    raise SystemExit(f"tts_items.json not found: {TTS_FILE}")

items = json.loads(TTS_FILE.read_text(encoding="utf-8"))

# Important:
# Audio must be generated beside the active game.json, not always inside BASE/public/audio.
# Some templates have:
#   public/index.html + public/game.json + public/audio
# Others have:
#   index.html + game.json + audio
game_json_files = list(BASE.rglob("game.json"))

if game_json_files:
    GAME_DIR = game_json_files[0].parent
else:
    GAME_DIR = BASE

AUDIO = GAME_DIR / "audio"
AUDIO.mkdir(parents=True, exist_ok=True)

async def main():
    for item in items:
        text = str(item.get("text", "")).strip()
        file_name = str(item.get("file", "")).strip()

        if not text or not file_name:
            continue

        safe_file = Path(file_name).name
        out = AUDIO / safe_file

        if out.exists() and out.stat().st_size > 0:
            print("skip:", out.name)
            continue

        print("generate:", out.name, "=>", text)
        communicate = edge_tts.Communicate(text=text, voice=VOICE, rate="-8%")
        await communicate.save(str(out))

asyncio.run(main())
print("done:", AUDIO)
