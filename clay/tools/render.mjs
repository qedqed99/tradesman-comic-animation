// Clay MP4: node clay/tools/render.mjs [out.mp4] [--fps 24] [--scale 1]
// Composites the Blender frames with the comic overlay in headless Chromium (same overlay code as v1),
// mixes the synth effects + music with the Kokoro dialogue track, and writes an MP4.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const clay = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const root = path.resolve(clay, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const fps = +opt('fps', 24), scale = +opt('scale', 1);
const out = path.resolve(args[0] || path.join(root, 'renders', 'clay-pilot.mp4'));
const tmp = fs.mkdtempSync('/tmp/clayrender-');

execFileSync('node', [path.join(clay, 'tools', 'manifest.mjs')], { stdio: 'inherit', cwd: '/tmp' });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto('file://' + clay + '/index.html?render');
await page.evaluate(() => window.TS.ready);
const info = await page.evaluate(() => ({ duration: TS.player.duration, items: TS.player.items.map(i => ({ id: i.cfg.id, start: i.start, end: i.end })) }));

// dialogue track: each scene's Kokoro wav, padded to the scene length, back to back
const vin = [], vf = [];
info.items.forEach((it, i) => {
  const w = path.join(clay, 'voices', it.id + '.wav');
  if (fs.existsSync(w)) vin.push('-i', w); else vin.push('-f', 'lavfi', '-t', String(it.end - it.start), '-i', 'anullsrc=r=24000:cl=mono');
  vf.push(`[${i}]apad,atrim=0:${(it.end - it.start).toFixed(3)},aresample=48000[v${i}]`);
});
execFileSync('ffmpeg', ['-v', 'error', '-y', ...vin, '-filter_complex',
  vf.join(';') + ';' + info.items.map((_, i) => `[v${i}]`).join('') + `concat=n=${info.items.length}:v=0:a=1`, path.join(clay, 'voices', 'all.wav')]);

// effects + music from the v1 synth (no "pop" per bubble: the voices replace it)
const wavB64 = await page.evaluate(d => TS.audio.renderWav(TS.player.audioCues().filter(c => c.sound !== 'pop'), TIMELINE.music, 0, d), info.duration);
fs.writeFileSync(path.join(tmp, 'sfx.wav'), Buffer.from(wavB64, 'base64'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(tmp, 'sfx.wav'), '-i', path.join(clay, 'voices', 'all.wav'), '-filter_complex',
  '[1]volume=2.2,pan=stereo|c0=c0|c1=c0[v];[0][v]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]', '-map', '[a]', path.join(tmp, 'mix.wav')]);

const frames = Math.round(info.duration * fps);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-i', path.join(tmp, 'mix.wav'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-vf', `scale=${Math.round(1920 * scale)}:${Math.round(1080 * scale)}`,
  '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const started = Date.now();
for (let f = 0; f < frames; f++) {
  await page.evaluate(async t => { TS.player.renderAt(t); const im = document.getElementById('clayframe'); if (im.getAttribute('src')) await im.decode().catch(() => {}); }, f / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg exit ' + c)) : res())));
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${out}  ${frames} frames, ${info.duration.toFixed(1)}s, composited in ${((Date.now() - started) / 1000).toFixed(1)}s`);
