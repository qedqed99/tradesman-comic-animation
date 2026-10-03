// Scene 11: Lunch is Korean BBQ after all. Sizzle, smiles, THE END.
(function (TS) {
  const { seg, el, set, lerp, motion, rng } = TS;
  TS.scenes['bbq'] = {
    build(root, cfg, item) {
      const cam = el('g', {}, root);
      // warm restaurant wall with wood slats, posters and red lanterns
      el('rect', { x: -400, y: -400, width: 2720, height: 1900, fill: '#6b3b2a' }, cam);
      for (let i = 0; i < 26; i++) el('rect', { x: -400 + i * 110, y: -400, width: 8, height: 1900, fill: '#572e21' }, cam);
      el('rect', { x: -400, y: 520, width: 2720, height: 30, fill: '#4a271b' }, cam);
      [[140, 170, '#d9c49a'], [1560, 150, '#e1cfa6'], [1780, 260, '#cfb98c']].forEach(([x, y, c], i) => {
        el('rect', { x, y, width: 170, height: 230, fill: c, stroke: '#1d1a17', 'stroke-width': 5 }, cam);
        el('circle', { cx: x + 85, cy: y + 90, r: 46, fill: i === 1 ? '#c0392b' : '#2e6fbf', opacity: 0.8 }, cam);
        el('rect', { x: x + 25, y: y + 160, width: 120, height: 14, fill: '#1d1a17', opacity: 0.6 }, cam);
        el('rect', { x: x + 40, y: y + 186, width: 90, height: 10, fill: '#1d1a17', opacity: 0.4 }, cam);
      });
      const lanterns = [260, 700, 1220, 1660].map((x, i) => {
        const g = el('g', {}, cam);
        el('path', { d: 'M0,-300 L0,-40', stroke: '#1d1a17', 'stroke-width': 4 }, g);
        el('ellipse', { cx: 0, cy: 30, rx: 120, ry: 110, fill: '#ffb347', opacity: 0.18 }, g);
        el('ellipse', { cx: 0, cy: 30, rx: 62, ry: 74, fill: '#d63a2a', stroke: '#1d1a17', 'stroke-width': 5 }, g);
        for (const k of [-30, 0, 30]) el('path', { d: `M${k},-40 Q${k * 1.6},30 ${k},100`, stroke: '#a82a1d', 'stroke-width': 3, fill: 'none' }, g);
        el('rect', { x: -30, y: -48, width: 60, height: 14, fill: '#2a2120' }, g);
        el('rect', { x: -30, y: 98, width: 60, height: 14, fill: '#2a2120' }, g);
        return { g, x, y: 70 + (i % 2) * 40, o: i };
      });
      // the gang, behind the table
      const boss = TS.makePuppet(cam, 'boss');
      const noah = TS.makePuppet(cam, 'noah');
      const lu = TS.makePuppet(cam, 'lu');
      const stickN = TS.props.chopsticks(noah.hand.R);
      const stickL = TS.props.chopsticks(lu.hand.L);
      set(stickL.g, { transform: 'scale(-1 1)' });
      const bottle = el('g', {}, boss.hand.R);
      el('path', { d: 'M-12,10 L-12,-50 Q-12,-62 -5,-70 L-5,-92 L5,-92 L5,-70 Q12,-62 12,-50 L12,10Z', fill: '#2f8a4a', stroke: '#1d1a17', 'stroke-width': 3.5, opacity: 0.95 }, bottle);
      // table + grill
      el('path', { d: 'M-200,700 L2120,700 L2120,1300 L-200,1300Z', fill: '#8a5a36', stroke: '#1d1a17', 'stroke-width': 6 }, cam);
      el('path', { d: 'M-200,700 L2120,700 L2120,760 L-200,760Z', fill: '#a8754a' }, cam);
      for (let i = 0; i < 8; i++) el('path', { d: `M-200,${800 + i * 40} Q960,${790 + i * 42} 2120,${800 + i * 40}`, stroke: '#7a4c2c', 'stroke-width': 3, fill: 'none' }, cam);
      el('ellipse', { cx: 960, cy: 740, rx: 290, ry: 88, fill: '#2b2b2b', stroke: '#1d1a17', 'stroke-width': 6 }, cam);
      el('ellipse', { cx: 960, cy: 735, rx: 250, ry: 70, fill: '#4a4a4a' }, cam);
      el('ellipse', { cx: 960, cy: 735, rx: 200, ry: 50, fill: '#e8742c', opacity: 0.35 }, cam);
      let grate = '';
      for (let i = -9; i <= 9; i++) grate += `M${960 + i * 25},${735 - 70 * Math.sqrt(1 - Math.pow(i / 10, 2))} L${960 + i * 25},${735 + 70 * Math.sqrt(1 - Math.pow(i / 10, 2))}`;
      el('path', { d: grate, stroke: '#8d8d8d', 'stroke-width': 4 }, cam);
      const r = rng(23);
      const meat = Array.from({ length: 7 }, (_, i) => {
        const m = el('path', { d: 'M-50,-12 Q0,-22 50,-12 Q55,0 50,12 Q0,20 -50,12 Q-55,0 -50,-12Z', fill: i % 2 ? '#b5523a' : '#9c4330', stroke: '#5c2318', 'stroke-width': 3 }, cam);
        el('path', { d: 'M-40,-4 Q0,-12 40,-4', stroke: '#f0d2b8', 'stroke-width': 3, fill: 'none' }, cam).remove();
        return { m, x: 790 + i * 55 + r() * 10, y: 715 + (i % 3) * 18, rot: -15 + r() * 30, o: r() * 6 };
      });
      // side dishes (banchan)
      [[420, 790, '#d8432a'], [560, 840, '#7fa65a'], [1360, 790, '#f2c94c'], [1500, 845, '#e8e1cf'], [300, 870, '#c96f3b'], [1630, 880, '#7fa65a']].forEach(([x, y, c]) => {
        el('ellipse', { cx: x, cy: y, rx: 70, ry: 26, fill: '#f4f1e6', stroke: '#1d1a17', 'stroke-width': 4 }, cam);
        el('ellipse', { cx: x, cy: y - 4, rx: 50, ry: 15, fill: c }, cam);
      });
      const smoke = TS.bg.puffs(el('g', {}, cam), { n: 12, seed: 9, color: '#f3efe6', x: 960, y: 700, spreadX: 300, rise: 230, size: 38, period: 2.2 });
      // end card
      const card = el('g', { opacity: 0 }, root);
      el('rect', { width: 1920, height: 1080, fill: '#16130f', opacity: 0.55 }, card);
      const title = el('text', { x: 960, y: 560, 'text-anchor': 'middle', fill: '#f4f1e6', stroke: '#1d1a17', 'stroke-width': 14, 'paint-order': 'stroke', style: 'font-family:Bangers, Impact, sans-serif;font-size:190px;letter-spacing:8px' }, card);
      title.textContent = 'THE TRADESMAN';
      const sub = el('text', { x: 960, y: 680, 'text-anchor': 'middle', fill: '#ffd23f', stroke: '#1d1a17', 'stroke-width': 10, 'paint-order': 'stroke', style: 'font-family:Bangers, Impact, sans-serif;font-size:90px;letter-spacing:6px' }, card);
      sub.textContent = 'THE END';
      item.s = { cam, boss, noah, lu, meat, smoke, lanterns, card };
    },
    render(t, cfg, item) {
      const { cam, boss, noah, lu, meat, smoke, lanterns, card } = item.s;
      const z = 1.06 - t * 0.012;
      set(cam, { transform: `translate(960 540) scale(${z}) translate(-960 -560)` });
      lanterns.forEach(L => set(L.g, { transform: `translate(${L.x} ${L.y}) rotate(${Math.sin(t * 1.5 + L.o) * 3})` }));
      const chew = Math.abs(Math.sin(t * 7));
      boss.pose({ x: 470, y: 960, s: 1.25, shadow: false, lean: 3,
        armL: { a: 30, b: -60 }, armR: { a: 135 + Math.sin(t * 4) * 6, b: 25 },
        head: { tilt: -4, turn: 0.3, mouth: 'grin', open: 0.55 + chew * 0.1, raise: 0.4 } });
      noah.pose({ x: 960, y: 820, s: 1.3, shadow: false, bob: Math.abs(Math.sin(t * 5)) * 8,
        armL: { a: 20, b: -70 }, armR: { a: 110 + Math.sin(t * 5) * 10, b: 40 },
        head: { tilt: Math.sin(t * 5) * 4, mouth: 'grin', open: 0.7, eyes: 'happy' } });
      lu.pose({ x: 1450, y: 960, s: 1.25, shadow: false, lean: -3,
        armL: { a: 100 + Math.sin(t * 3 + 1) * 8, b: 50 }, armR: { a: 30, b: -60 },
        head: { tilt: 4, turn: -0.3, mouth: 'smile', eyes: t % 2.6 > 1.6 ? 'happy' : 'normal', raise: 0.4, blink: motion.blink(t, 5) } });
      meat.forEach(M => set(M.m, { transform: `translate(${M.x} ${M.y + Math.sin(t * 20 + M.o) * 1.5}) rotate(${M.rot}) scale(${1 - Math.sin(t * 13 + M.o) * 0.03} 1)` }));
      smoke.update(t, 0.45);
      const end = (cfg.sfx.find(s => s.sound === 'tada') || { at: 3.4 }).at;
      const c = seg(t, end - 0.2, end + 0.4, 'out');
      set(card, { opacity: c.toFixed(3), transform: `translate(960 540) scale(${(0.9 + c * 0.1).toFixed(3)}) translate(-960 -540)` });
    },
  };
})(window.TS);
