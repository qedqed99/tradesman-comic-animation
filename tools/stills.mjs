// Quick look without a full render: node tools/stills.mjs out_dir 0.5 2.0 7.3 ...
// Writes one PNG per time (seconds into the film) plus a contact sheet.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [out = 'stills', ...times] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
await page.goto('file://' + root + '/' + (process.env.PAGE || 'index.html') + '?render');
await page.evaluate(() => window.TS.ready);
const files = [];
for (const t of times) {
  const info = await page.evaluate(t => window.TS.player.renderAt(t), +t);
  const f = path.join(out, `t${(+t).toFixed(2)}.png`);
  await page.screenshot({ path: f });
  files.push(f);
  console.log(t, info.scene, info.local.toFixed(2), f);
}
await browser.close();
if (files.length > 1) {
  const cols = Math.min(3, files.length);
  const args = files.flatMap(f => ['-i', f]);
  const rows = Math.ceil(files.length / cols);
  const layout = files.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  const scale = files.map((_, i) => `[${i}:v]scale=640:360[v${i}]`).join(';');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-filter_complex', `${scale};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, path.join(out, 'sheet.png')]);
  console.log('sheet', path.join(out, 'sheet.png'), rows, 'rows');
}
