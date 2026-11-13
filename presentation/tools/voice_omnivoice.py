"""Озвучка презентации движком VoiceStudio (OmniVoice), офлайн на CPU/GPU.

  PYTHONPATH=<путь к VoiceStudio> python presentation/tools/voice_omnivoice.py

1) Голос-референс создаётся по описанию (voice design), 2) все слайды
клонируются с него — один и тот же диктор на всём ролике.
Результат: presentation/audio/NN.wav, narration_full.wav, durations.json.
"""
import json, re, sys
from pathlib import Path
import numpy as np, soundfile as sf, torch
from omnivoice.models.omnivoice import OmniVoice
from omnivoice.utils.dtype import tts_dtype_name

HERE = Path(__file__).resolve().parents[1]
OUT = HERE / "audio"; OUT.mkdir(exist_ok=True)
VOICE = "male, middle-aged, low pitch"
SEED, PAUSE, GAP = 7, 0.35, 1.2   # сек: пауза между фразами / между слайдами

slides = json.loads((HERE / "slides.json").read_text())["slides"]
only = set(sys.argv[1:])
dev = "cuda" if torch.cuda.is_available() else "cpu"
torch.set_num_threads(max(1, torch.get_num_threads()))
model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map=dev, dtype=getattr(torch, tts_dtype_name(dev)))
SR = model.sampling_rate

ref_path = OUT / "voice_ref.wav"
ref_text = "Добрый день. Мы представляем проект крытого тренировочного манежа для футбольного клуба «Актобе»."
if not ref_path.exists():
    a = model.generate(text=ref_text, language="ru", instruct=VOICE, seed=SEED)[0]
    sf.write(ref_path, a.squeeze().float().cpu().numpy(), SR)
    print("ref voice ready", flush=True)

def phrases(t):
    parts = [p.strip() for p in re.findall(r"[^.!?]+[.!?]+", t)] or [t]
    out = []   # склеиваем короткие фразы, чтобы интонация была естественной
    for p in parts:
        if out and len(out[-1]) + len(p) < 140: out[-1] += " " + p
        else: out.append(p)
    return out

dur, full = {}, []
dpath = OUT / "durations.json"
if dpath.exists(): dur = json.loads(dpath.read_text())
for s in slides:
    sid = f"{s['n']:02d}"; f = OUT / f"{sid}.wav"
    if (not only or sid in only) and (only or not f.exists()):
        chunks = []
        for i, p in enumerate(phrases(s["tts"])):
            a = model.generate(text=p, language="ru", ref_audio=str(ref_path), ref_text=ref_text, seed=SEED + i)[0]
            chunks += [a.squeeze().float().cpu().numpy(), np.zeros(int(PAUSE * SR), dtype=np.float32)]
        y = np.concatenate(chunks[:-1]); y = y / max(1e-6, np.abs(y).max()) * 0.89
        sf.write(f, y, SR)
        print(f"slide {sid}: {len(y)/SR:.1f}s", flush=True)
    y, _ = sf.read(f, dtype="float32"); dur[sid] = round(len(y) / SR, 2)
    full += [y, np.zeros(int(GAP * SR), dtype=np.float32)]
    dpath.write_text(json.dumps(dur, indent=1))
sf.write(OUT / "narration_full.wav", np.concatenate(full), SR)
print("DONE total", round(sum(dur.values()), 1), "s", flush=True)
