// Tiny deterministic animation engine. Every frame is a pure function of time t,
// so the browser preview and the frame-by-frame MP4 render always match.
window.TS = window.TS || {};
(function (TS) {
  const NS = 'http://www.w3.org/2000/svg';

  // ---- math + easing ------------------------------------------------------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = {
    linear: p => p,
    in: p => p * p,
    out: p => 1 - (1 - p) * (1 - p),
    inOut: p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    backOut: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
    elastic: p => (p === 0 || p === 1 ? p : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
  };
  // progress of t through [a, b], eased
  const seg = (t, a, b, e = 'inOut') => ease[e](clamp((t - a) / (b - a)));
  // keyframes: [[time, value, easeIntoThisKey?], ...]; values may be numbers or {objects of numbers}
  function key(t, frames) {
    if (t <= frames[0][0]) return frames[0][1];
    for (let i = 1; i < frames.length; i++) {
      const [t1, v1, e] = frames[i];
      if (t <= t1) {
        const [t0, v0] = frames[i - 1];
        const p = ease[e || 'inOut'](clamp((t - t0) / (t1 - t0)));
        if (typeof v0 === 'number') return lerp(v0, v1, p);
        const o = {};
        for (const k in v0) o[k] = typeof v0[k] === 'number' ? lerp(v0[k], v1[k], p) : (p < 0.5 ? v0[k] : v1[k]);
        return o;
      }
    }
    return frames[frames.length - 1][1];
  }
  // deterministic pseudo-random
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ---- svg helpers -------------------------------------------------------
  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function set(n, attrs) { for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  const tf = (x = 0, y = 0, s = 1, r = 0) => `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(4)})`;

  // map an element's local point into stage (viewBox) coordinates
  function toStage(node, x = 0, y = 0) {
    const svg = node.ownerSVGElement;
    const m = svg.getScreenCTM().inverse().multiply(node.getScreenCTM());
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  }

  // ---- player ------------------------------------------------------------
  // Scenes register themselves: TS.scenes[id] = { build(root, cfg), render(t, cfg) }.
  // The timeline (timeline.js) decides order, durations, dialogue and sound cues.
  TS.scenes = TS.scenes || {};
  function createPlayer(svg, timeline) {
    const stage = el('g', { id: 'stage' }, svg);
    let t0 = 0;
    const items = timeline.scenes.map(cfg => {
      const mod = TS.scenes[cfg.id];
      if (!mod) throw new Error('No scene module for ' + cfg.id);
      const root = el('g', { 'data-scene': cfg.id, display: 'none' }, stage);
      const item = { cfg, mod, root, start: t0, end: t0 + cfg.duration };
      mod.build(root, cfg, item);
      t0 += cfg.duration;
      return item;
    });
    const duration = t0;
    const fx = TS.fx.createOverlay(svg);
    let current = null;
    function renderAt(t) {
      t = clamp(t, 0, duration - 1e-4);
      const item = items.find(i => t >= i.start && t < i.end) || items[items.length - 1];
      if (current !== item) {
        if (current) current.root.setAttribute('display', 'none');
        item.root.setAttribute('display', 'inline');
        current = item;
      }
      const lt = t - item.start;
      item.mod.render(lt, item.cfg, item);
      fx.render(lt, item);
      return { scene: item.cfg.id, local: lt };
    }
    // absolute audio cues for the whole film
    function audioCues() {
      const cues = [];
      for (const i of items) {
        for (const s of i.cfg.sfx || []) if (s.sound) cues.push({ t: i.start + s.at, sound: s.sound, gain: s.gain });
        for (const d of i.cfg.dialogue || []) cues.push({ t: i.start + d.at, sound: d.sound || 'pop' });
      }
      return cues.sort((a, b) => a.t - b.t);
    }
    return { renderAt, duration, items, audioCues };
  }

  Object.assign(TS, { clamp, lerp, ease, seg, key, rng, el, set, tf, toStage, createPlayer, NS });
})(window.TS);
