// Scene 5: Meanwhile... the Boss in his hot tub takes the call. "I'll Take Care of It!!"
(function (TS) {
  const { seg, el, set, lerp, motion, toStage, rng } = TS;
  const WATER = 700; // waterline on screen
  TS.scenes['hot-tub'] = {
    build(root, cfg, item) {
      const svg = root.ownerSVGElement;
      TS.bg.defs(svg);
      const defs = svg.querySelector('defs');
      const dusk = el('linearGradient', { id: 'dusk', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: 0, 'stop-color': '#7fa3b6' }, dusk);
      el('stop', { offset: 0.6, 'stop-color': '#e7c095' }, dusk);
      el('stop', { offset: 1, 'stop-color': '#f0b98a' }, dusk);
      const clip = el('clipPath', { id: 'tubwater', clipPathUnits: 'userSpaceOnUse' }, defs);
      el('rect', { x: -5000, y: -5000, width: 10000, height: 5000 + WATER }, clip);

      const cam = el('g', {}, root);
      el('rect', { x: -400, y: -400, width: 2720, height: 1000, fill: 'url(#dusk)' }, cam);
      const clouds = TS.bg.sky(el('g', { opacity: 0.6 }, cam));
      cam.lastChild.querySelector('rect').remove(); // keep the dusk gradient, just the clouds
      // trees
      const r = rng(17);
      for (let i = 0; i < 16; i++) {
        const x = -300 + i * 170 + r() * 60, h = 300 + r() * 220;
        el('ellipse', { cx: x, cy: 560 - h * 0.45, rx: 120 + r() * 60, ry: h * 0.6, fill: i % 2 ? '#4f6b3e' : '#5d7a47', stroke: '#2f4027', 'stroke-width': 4 }, cam);
      }
      // stone patio
      el('rect', { x: -400, y: 560, width: 2720, height: 800, fill: '#a99f8e' }, cam);
      for (let i = 0; i < 12; i++) el('path', { d: `M${-300 + i * 220},560 L${-700 + i * 300},1300`, stroke: '#8b8172', 'stroke-width': 4 }, cam);
      for (let j = 0; j < 4; j++) el('path', { d: `M-400,${600 + j * j * 60} L2320,${600 + j * j * 60}`, stroke: '#8b8172', 'stroke-width': 4 }, cam);
      // tub back rim + water
      el('ellipse', { cx: 960, cy: WATER, rx: 860, ry: 230, fill: '#6a3f26', stroke: '#1d1a17', 'stroke-width': 6 }, cam);
      el('ellipse', { cx: 960, cy: WATER + 8, rx: 800, ry: 195, fill: '#4f9aa3', stroke: '#1d1a17', 'stroke-width': 4 }, cam);
      el('ellipse', { cx: 960, cy: WATER + 20, rx: 700, ry: 150, fill: '#6db5ba', opacity: 0.6 }, cam);
      // the Boss, cut off at the waterline
      const bossClip = el('g', { 'clip-path': 'url(#tubwater)' }, cam);
      const boss = TS.makePuppet(bossClip, 'bossTub');
      const phone = TS.props.phone(boss.hand.L);
      set(phone.g, { transform: 'translate(6 -6) rotate(12)' });
      // ripples + bubbles on the surface
      const ripples = [0, 1, 2].map(() => el('ellipse', { fill: 'none', stroke: '#e6f4f2', 'stroke-width': 4 }, cam));
      const bubbles = Array.from({ length: 26 }, () => ({ c: el('circle', { fill: 'none', stroke: '#eef8f6', 'stroke-width': 3 }, cam), x: 300 + r() * 1300, y: WATER - 60 + r() * 200, o: r(), s: 6 + r() * 12 }));
      // front of the tub (wooden staves) hides the rest
      el('path', { d: `M100,${WATER} A860,230 0 0,0 1820,${WATER} L1820,1200 L100,1200Z`, fill: '#7b4a2c', stroke: '#1d1a17', 'stroke-width': 6 }, cam);
      for (let i = 1; i < 18; i++) { const x = 100 + i * 95.5; el('path', { d: `M${x},${WATER + 230 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 960) / 860, 2)))} L${x},1200`, stroke: '#4e2c18', 'stroke-width': 5 }, cam); }
      el('path', { d: `M100,${WATER + 110} Q960,${WATER + 400} 1820,${WATER + 110}`, stroke: '#3a3a3a', 'stroke-width': 18, fill: 'none' }, cam);
      el('path', { d: `M140,${WATER} A820,205 0 0,0 1780,${WATER}`, stroke: '#a26a43', 'stroke-width': 26, fill: 'none' }, cam);
      const steam = TS.bg.puffs(el('g', {}, cam), { n: 10, seed: 3, color: '#ffffff', x: 960, y: WATER, spreadX: 1200, rise: 300, size: 50, period: 3 });
      item.s = { cam, boss, ripples, bubbles, steam, clouds };
      item.anchors = { boss: () => toStage(boss.mouthG, 0, 12) };
    },
    render(t, cfg, item) {
      const { cam, boss, ripples, bubbles, steam, clouds } = item.s;
      clouds.update(t);
      const z = 1 + t * 0.03;
      set(cam, { transform: `translate(960 540) scale(${z}) translate(-990 -540)` });
      const talk = motion.talk(t, cfg.dialogue[0], 1);
      const shout = t > cfg.dialogue[0].at;
      boss.pose({
        x: 1180, y: 1030, s: 1.62, shadow: false, armsFront: true, lean: Math.sin(t * 2) * 1.5,
        armL: { a: 120, b: 124 }, armR: { a: 55 + Math.sin(t * 3) * 4, b: -10 },
        head: { tilt: shout ? -6 : 3, turn: -0.25, mouth: talk ? 'talk' : (shout ? 'grin' : 'smile'), open: talk || 0.5, angry: shout ? 0.6 : 0, raise: shout ? 0 : 0.5 },
      });
      ripples.forEach((rp, i) => { const k = (t * 0.6 + i / 3) % 1; set(rp, { cx: 1180, cy: WATER + 10, rx: 120 + k * 260, ry: 26 + k * 60, opacity: (1 - k) * 0.8 }); });
      bubbles.forEach(b => { const k = (t * 0.9 + b.o) % 1; set(b.c, { cx: b.x + Math.sin(t * 3 + b.o * 9) * 6, cy: b.y - k * 40, r: b.s * (0.5 + k * 0.6), opacity: k < 0.9 ? 0.9 : (1 - k) * 9 }); });
      steam.update(t, 0.5);
    },
  };
})(window.TS);
