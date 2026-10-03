// Bundle index.html + scripts + fonts into one self-contained page: dist/tradesman-short.html
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
  `<script>/* ${src} */\n${fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`);
html = html.replace(/url\('(assets\/fonts\/[^']+\.woff2)'\)/g, (_, f) =>
  `url('data:font/woff2;base64,${fs.readFileSync(path.join(root, f)).toString('base64')}')`);
// the artifact host supplies the document skeleton
html = html.replace(/<!doctype html>\s*/i, '').replace(/<\/?html[^>]*>\s*/gi, '').replace(/<\/?head>\s*/gi, '')
  .replace(/<\/?body>\s*/gi, '').replace(/<meta [^>]*>\s*/gi, '');
const out = path.join(root, 'dist', 'tradesman-short.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(out, (html.length / 1024).toFixed(0) + ' KB');
