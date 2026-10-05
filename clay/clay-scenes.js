// Clay version: each scene shows the Blender-rendered frame for time t (12 fps, stop-motion),
// and the usual comic overlay (bubbles, lettering, transitions) is drawn on top from timeline.js.
// Bubble tails aim at the mouth positions Blender exported (frames/<scene>/anchors.json -> manifest.js).
(function (TS) {
  const img = document.getElementById('clayframe');
  for (const [id, info] of Object.entries(window.CLAY.scenes)) {
    TS.scenes[id] = {
      build(root, cfg, item) {
        item.clay = info;
        item.anchors = {};
        for (const who of Object.keys(info.anchors[0] || {})) {
          item.anchors[who] = () => {
            const a = info.anchors[item.frame] || info.anchors[0];
            return { x: a[who][0], y: a[who][1] };
          };
        }
        if (id === 'bbq') {  // end card, same as the 2D version
          const { el } = TS;
          const card = el('g', { opacity: 0 }, root);
          el('rect', { width: 1920, height: 1080, fill: '#16130f', opacity: 0.55 }, card);
          const title = el('text', { x: 960, y: 560, 'text-anchor': 'middle', fill: '#f4f1e6', stroke: '#1d1a17', 'stroke-width': 14, 'paint-order': 'stroke', style: 'font-family:Bangers, Impact, sans-serif;font-size:170px;letter-spacing:7px' }, card);
          title.textContent = 'LIFE AT TRADESMAN';
          const sub = el('text', { x: 960, y: 680, 'text-anchor': 'middle', fill: '#ffd23f', stroke: '#1d1a17', 'stroke-width': 10, 'paint-order': 'stroke', style: 'font-family:Bangers, Impact, sans-serif;font-size:90px;letter-spacing:6px' }, card);
          sub.textContent = 'THE END';
          item.card = card;
        }
      },
      render(t, cfg, item) {
        item.frame = Math.min(info.frames - 1, Math.floor(t * window.CLAY.fps + 1e-6));
        const src = info.src ? info.src[item.frame] : `frames/${id}/${String(item.frame).padStart(4, '0')}.jpg`;
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        if (item.card) {
          const end = ((cfg.sfx || []).find(s => s.sound === 'tada') || { at: 3.4 }).at;
          const c = TS.seg(t, end - 0.2, end + 0.4, 'out');
          TS.set(item.card, { opacity: c.toFixed(3), transform: `translate(960 540) scale(${(0.9 + c * 0.1).toFixed(3)}) translate(-960 -540)` });
        }
      },
    };
  }
  // clay overrides of timeline values (e.g. bubble positions that suit the 3D framing)
  const keep = new Set(Object.keys(window.CLAY.scenes));
  window.TIMELINE.scenes = window.TIMELINE.scenes.filter(s => keep.has(s.id)).map(s => {
    const o = (window.CLAY.overrides || {})[s.id] || {};
    return { ...s, dialogue: (s.dialogue || []).map((d, i) => ({ ...d, ...(o.dialogue || {})[i] })) };
  });
})(window.TS);
