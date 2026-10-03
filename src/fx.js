// Screen-space comic effects drawn above every scene: speech bubbles, sound-effect
// lettering, and scene transitions. All content comes from timeline.js.
(function (TS) {
  const { el, set, seg, clamp, tf, rng } = TS;
  const W = 1920, H = 1080;
  const SPEECH_FONT = '700 66px "Comic Neue", "Comic Sans MS", cursive';
  const INK = '#1d1a17';

  let measureCtx;
  function textWidth(s, font) {
    measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
    measureCtx.font = font;
    return measureCtx.measureText(s).width;
  }

  function burstPath(rx, ry, spikes, seed) {
    const r = rng(seed); let d = '';
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2;
      const k = i % 2 ? 0.86 : 1.08 + r() * 0.12;
      d += (i ? 'L' : 'M') + (Math.cos(a) * rx * k).toFixed(1) + ',' + (Math.sin(a) * ry * k).toFixed(1);
    }
    return d + 'Z';
  }

  function makeBubble(layer, line, idx) {
    const g = el('g', { class: 'bubble' }, layer);
    const lines = line.text.split('\n');
    const lh = 74;
    const tw = Math.max(...lines.map(s => textWidth(s, SPEECH_FONT)));
    const rx = tw / 2 * 1.2 + 44, ry = lines.length * lh / 2 * 1.25 + 34;
    const speakers = [].concat(line.who);
    const tails = speakers.map(() => el('path', { fill: '#fff', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g));
    const body = line.style === 'shout'
      ? el('path', { d: burstPath(rx * 1.08, ry * 1.15, 14, idx * 7 + 3), fill: '#fff', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g)
      : el('ellipse', { rx, ry, fill: '#fff', stroke: INK, 'stroke-width': 5 }, g);
    // white patch hides the tail's join with the body
    const cover = el('ellipse', { rx: rx - 4, ry: ry - 4, fill: '#fff' }, g);
    if (line.style === 'shout') cover.setAttribute('rx', rx * 0.9), cover.setAttribute('ry', ry * 0.9);
    const text = el('text', { 'text-anchor': 'middle', fill: INK, style: `font:${SPEECH_FONT}` }, g);
    const spans = lines.map((s, i) => {
      const sp = el('tspan', { x: 0, y: (i - (lines.length - 1) / 2) * lh + 23 }, text);
      sp.textContent = s;
      return sp;
    });
    return { g, tails, speakers, body, rx, ry, spans, lines };
  }

  function makeSfx(layer, s) {
    const g = el('g', { class: 'sfx' }, layer);
    const size = s.size || 140;
    const style = `font-family:Bangers, Impact, sans-serif;font-size:${size}px;letter-spacing:${size * 0.04}px`;
    if (s.burst) el('path', { d: burstPath(size * s.text.length * 0.32, size * 0.75, 16, s.text.length), fill: s.burst, stroke: INK, 'stroke-width': 6 }, g);
    const shadow = el('text', { 'text-anchor': 'middle', x: 8, y: size * 0.36 + 8, fill: INK, style }, g);
    const t = el('text', { 'text-anchor': 'middle', y: size * 0.36, fill: s.color || '#ffd23f', stroke: INK, 'stroke-width': size * 0.07, 'paint-order': 'stroke', 'stroke-linejoin': 'round', style }, g);
    shadow.textContent = t.textContent = s.text;
    return { g };
  }

  function createOverlay(svg) {
    const layer = el('g', { id: 'fx' }, svg);
    const bubbleLayer = el('g', {}, layer);
    const sfxLayer = el('g', {}, layer);
    const flash = el('rect', { width: W, height: H, fill: '#fff', opacity: 0, 'pointer-events': 'none' }, layer);
    let shown = null;

    function render(t, item) {
      if (shown !== item) {
        bubbleLayer.replaceChildren(); sfxLayer.replaceChildren();
        item._bubbles = (item.cfg.dialogue || []).map((d, i) => makeBubble(bubbleLayer, d, i));
        item._sfx = (item.cfg.sfx || []).filter(s => s.text).map(s => ({ s, ...makeSfx(sfxLayer, s) }));
        shown = item;
      }
      // speech bubbles
      (item.cfg.dialogue || []).forEach((d, i) => {
        const b = item._bubbles[i];
        const end = d.at + (d.dur || 2);
        if (t < d.at || t > end) { b.g.setAttribute('display', 'none'); return; }
        b.g.setAttribute('display', 'inline');
        const pin = seg(t, d.at, d.at + 0.22, 'backOut');
        const pout = seg(t, end - 0.15, end, 'in');
        const s = Math.max(0.001, pin * (1 - pout));
        const [x, y] = d.pos;
        const jig = d.style === 'shout' ? Math.sin(t * 60) * 4 : 0;
        set(b.g, { transform: tf(x + jig, y + Math.cos(t * 53) * jig, s) });
        // tail points at the speaker, using the scene's anchor function when it has one
        b.speakers.forEach((who, ti) => {
        const anchorFn = item.anchors && item.anchors[who];
        const a = anchorFn ? anchorFn() : { x: d.tail[0], y: d.tail[1] };
        const dx = (a.x - x) / s, dy = (a.y - y) / s;
        const ang = Math.atan2(dy / b.ry, dx / b.rx);
        const spread = 0.22;
        const p1 = [Math.cos(ang - spread) * b.rx * 0.9, Math.sin(ang - spread) * b.ry * 0.9];
        const p2 = [Math.cos(ang + spread) * b.rx * 0.9, Math.sin(ang + spread) * b.ry * 0.9];
        const dist = Math.hypot(dx, dy);
        const edge = Math.hypot(Math.cos(ang) * b.rx, Math.sin(ang) * b.ry);
        const reach = Math.min(dist - 50, edge + 140);
        const tip = [dx / dist * reach, dy / dist * reach];
        set(b.tails[ti], { d: `M${p1}L${tip}L${p2}Z` });
        });
        // typewriter reveal
        const total = d.text.replace(/\n/g, '').length;
        let shownChars = Math.floor(clamp((t - d.at - 0.08) / Math.max(0.25, total * 0.035)) * total);
        b.spans.forEach((sp, li) => {
          const full = b.lines[li];
          sp.textContent = full.slice(0, Math.max(0, shownChars));
          shownChars -= full.length;
        });
      });
      // sound-effect lettering
      for (const { s, g } of item._sfx) {
        const end = s.at + (s.dur || 1);
        if (t < s.at || t > end) { g.setAttribute('display', 'none'); continue; }
        g.setAttribute('display', 'inline');
        const pin = seg(t, s.at, s.at + 0.25, 'elastic');
        const pout = seg(t, end - 0.2, end, 'in');
        const shake = (s.shake || 0) * (1 - pout);
        set(g, {
          transform: tf(s.x + Math.sin(t * 71) * shake, s.y + Math.cos(t * 59) * shake, Math.max(0.001, pin * (1 + pout * 0.3)), s.rot || 0),
          opacity: 1 - pout,
        });
      }
      // transition in
      const tr = item.cfg.transition || 'cut';
      const p = seg(t, 0, tr === 'fade' ? 0.5 : 0.18, 'out');
      set(flash, {
        fill: tr === 'fade' ? '#000' : '#fff',
        opacity: tr === 'cut' ? 0 : (1 - p) * (tr === 'flash' ? 0.85 : 1),
      });
    }
    return { render };
  }

  TS.fx = { createOverlay, burstPath, INK };
})(window.TS);
