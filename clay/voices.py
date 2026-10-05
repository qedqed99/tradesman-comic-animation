# Speak the dialogue of timeline.js with Kokoro (free, offline TTS) and write lip-sync envelopes.
#   /opt/voice/bin/python clay/voices.py checklist hey-noah       # voice those scenes
#   /opt/voice/bin/python clay/voices.py --audition               # sample every candidate voice per character
# Output: clay/voices/<scene>.wav (the whole scene's dialogue track, silent between lines)
#         clay/voices/<scene>.json (mouth-open envelope per line, read by blender/render.py)
import sys, os, json, re, subprocess, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'clay', 'voices')
SR = 24000
ENV_RATE = 24  # envelope samples per second

# Who sounds like what. voice = Kokoro preset, speed = talking speed, pitch = shift factor
# (1.0 = as is; above 1 raises the voice, which is how Noah gets a kid-like voice).
CAST = {
    'noah': dict(voice='af_bella', speed=1.05, pitch=1.18),
    'lu':   dict(voice='am_eric', speed=1.0, pitch=1.0),
    'boss': dict(voice='am_adam', speed=0.95, pitch=0.97),
}
AUDITION = {
    'noah': ['af_heart', 'af_sky', 'af_nicole', 'am_liam', 'af_bella'],
    'lu':   ['am_puck', 'am_echo', 'am_eric', 'am_liam', 'am_michael'],
    'boss': ['am_onyx', 'am_santa', 'am_fenrir', 'bm_george', 'am_adam'],
}

def timeline():
    js = "global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.TIMELINE))"
    return json.loads(subprocess.check_output(['node', '-e', js, os.path.join(ROOT, 'timeline.js')], cwd='/tmp'))

def parse(text):
    """Same rules as TS.speech.parse in src/fx.js: segments split by {n} pauses, with start times."""
    parts = re.split(r'\{([\d.]+)\}', text)
    visible = len(''.join(parts[::2]).replace('\n', ''))
    per = max(0.035, 0.25 / max(1, visible))
    t, segs = 0.08, []
    for i, p in enumerate(parts):
        if i % 2:
            t += float(p); continue
        start = t
        t += per * len(p.replace('\n', ''))
        if p.replace('\n', '').strip():
            segs.append((start, p))
    return segs

def speakable(s):
    s = s.replace('\n', ' ').strip()
    s = re.sub(r'\.{2,}', '.', s)          # "Done.." -> "Done."
    s = re.sub(r'!{2,}', '!', s)
    s = s.strip(' .') or None
    if s and s[-1] not in '!?': s += '.'
    return s

_k = None
def say(text, who, voice=None):
    global _k
    _k = _k or Kokoro('/opt/voice/models/kokoro-v1.0.onnx', '/opt/voice/models/voices-v1.0.bin')
    c = dict(CAST[who]); c['voice'] = voice or c['voice']
    a, sr = _k.create(text, voice=c['voice'], speed=c['speed'], lang='en-us')
    a = trim(a)
    if abs(c['pitch'] - 1) > 1e-3:
        with tempfile.TemporaryDirectory() as d:
            sf.write(d + '/a.wav', a, sr)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', d + '/a.wav', '-af', f"rubberband=pitch={c['pitch']}", d + '/b.wav'], check=True)
            a, sr = sf.read(d + '/b.wav', dtype='float32')
    return a

def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    return a[max(0, idx[0] - 240): idx[-1] + 2400] if len(idx) else a

def envelope(a):
    hop = SR // ENV_RATE
    n = len(a) // hop + 1
    e = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) if len(a[i * hop:(i + 1) * hop]) else 0 for i in range(n)])
    e = e / (e.max() or 1)
    return [round(float(x), 3) for x in np.clip((e - 0.08) / 0.6, 0, 1)]

def voice_scene(cfg):
    track = np.zeros(int(cfg['duration'] * SR) + SR, dtype=np.float32)
    meta = {}
    for idx, d in enumerate(cfg.get('dialogue', [])):
        whos = d['who'] if isinstance(d['who'], list) else [d['who']]
        line = np.zeros(0, dtype=np.float32)
        for start, text in parse(d['text']):
            s = speakable(text)
            if not s: continue
            mix = None
            for w in whos:
                a = say(s, w)
                mix = a if mix is None else np.pad(mix, (0, max(0, len(a) - len(mix)))) + np.pad(a, (0, max(0, len(mix) - len(a))))
            mix = mix / max(1, len(whos) ** 0.5)
            at = int(start * SR)
            if len(line) < at: line = np.pad(line, (0, at - len(line)))
            line = np.concatenate([line[:at], mix]) if len(line) <= at else np.concatenate([line, mix])
        o = int(d['at'] * SR)
        end = min(len(track), o + len(line))
        track[o:end] += line[:end - o]
        meta[str(idx)] = {'who': whos, 'rate': ENV_RATE, 'offset': 0, 'len': round(len(line) / SR, 2), 'env': envelope(line)}
        over = d['at'] + len(line) / SR - (d['at'] + d['dur'])
        print(f"  {cfg['id']}[{idx}] {d['text']!r}: {len(line) / SR:.2f}s" + (f"  (runs {over:.2f}s past the bubble)" if over > 0 else ''))
    track = track[:int(cfg['duration'] * SR)]
    sf.write(os.path.join(OUT, cfg['id'] + '.wav'), track, SR)
    json.dump(meta, open(os.path.join(OUT, cfg['id'] + '.json'), 'w'))

def audition():
    lines = {'noah': 'Done. Check. Huh?', 'lu': 'Hey Noah! I just wanna help!', 'boss': "I'll take care of it! Hey guys, jump in!"}
    parts = []
    for who, voices in AUDITION.items():
        for v in voices:
            a = say(lines[who], who, v)
            parts += [a, np.zeros(int(SR * 0.7), dtype=np.float32)]
            print(f'{who}: {v}')
    sf.write(os.path.join(OUT, 'audition.wav'), np.concatenate(parts), SR)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    if '--audition' in sys.argv:
        audition(); sys.exit()
    tl = timeline()
    for sid in sys.argv[1:]:
        voice_scene(next(s for s in tl['scenes'] if s['id'] == sid))
