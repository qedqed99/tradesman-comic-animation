// Collect frame counts + bubble anchors of every rendered clay scene into frames/manifest.js
import fs from 'node:fs'; import path from 'node:path';
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'frames');
const scenes = {}; let fps = 12;
for (const id of fs.readdirSync(dir)) {
  const a = path.join(dir, id, 'anchors.json');
  if (!fs.existsSync(a)) continue;
  const j = JSON.parse(fs.readFileSync(a, 'utf8')); fps = j.fps;
  const frames = fs.readdirSync(path.join(dir, id)).filter(f => f.endsWith('.jpg')).length;
  scenes[id] = { frames, anchors: j.frames.slice(0, frames) };
}
const order = ['checklist', 'hey-noah', 'run', 'phone', 'hot-tub', 'chase', 'screech', 'jump-in', 'lunchtime', 'no', 'bbq'];
const sorted = Object.fromEntries(order.filter(k => scenes[k]).map(k => [k, scenes[k]]));
fs.writeFileSync(path.join(dir, 'manifest.js'), `window.CLAY = Object.assign(window.CLAY || {}, ${JSON.stringify({ fps, scenes: sorted })});\n`);
console.log(Object.entries(sorted).map(([k, v]) => `${k}: ${v.frames} frames`).join(', '));
