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
      },
      render(t, cfg, item) {
        item.frame = Math.min(info.frames - 1, Math.floor(t * window.CLAY.fps + 1e-6));
        const src = info.src ? info.src[item.frame] : `frames/${id}/${String(item.frame).padStart(4, '0')}.jpg`;
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
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
