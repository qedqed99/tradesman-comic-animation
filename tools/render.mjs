// Frame-accurate MP4 render: node tools/render.mjs [out.mp4] [--scene id] [--scale 0.5] [--fps 30] [--page ink/index.html]
// Steps the film one frame at a time in headless Chromium, pipes JPEG frames to ffmpeg,
// renders the soundtrack offline with the same Web Audio code, and muxes the two.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const scene = opt('scene', null), scale = +opt('scale', 1), fpsArg = opt('fps', null), pageArg = opt('page', 'index.html');
const out = path.resolve(args[0] || path.join(root, 'renders', 'tradesman.mp4'));
const tmp = fs.mkdtempSync('/tmp/tsrender-');

const browser = await chromium.launch();
const W = Math.round(1920 * scale), H = Math.round(1080 * scale);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto('file://' + root + '/' + pageArg + '?render');
await page.evaluate(() => window.TS.ready);
const info = await page.evaluate(() => ({ duration: TS.player.duration, fps: TIMELINE.fps, items: TS.player.items.map(i => ({ id: i.cfg.id, start: i.start, end: i.end })) }));
const fps = +(fpsArg || info.fps);
let t0 = 0, t1 = info.duration;
if (scene) { const it = info.items.find(i => i.id === scene); if (!it) throw new Error('no scene ' + scene); t0 = it.start; t1 = it.end; }
const frames = Math.round((t1 - t0) * fps);

// audio for the requested range
const wavB64 = await page.evaluate(([a, b]) => TS.audio.renderWav(TS.player.audioCues(), TIMELINE.music, a, b), [t0, t1]);
fs.writeFileSync(path.join(tmp, 'audio.wav'), Buffer.from(wavB64, 'base64'));

const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-i', path.join(tmp, 'audio.wav'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-vf', `scale=${W}:${H}`,
  '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const started = Date.now();
for (let f = 0; f < frames; f++) {
  await page.evaluate(t => TS.player.renderAt(t), t0 + f / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) process.stdout.write(`frame ${f}/${frames}\r`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg exit ' + c)) : res())));
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${out}  ${frames} frames, ${(t1 - t0).toFixed(1)}s, rendered in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', out]).toString().trim());
