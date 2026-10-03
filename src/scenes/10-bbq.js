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
      const KO = "font-family:'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo','WenQuanYi Zen Hei',sans-serif;font-weight:700";
      const txt = (x, y, str, size, fill, parent = cam, extra = {}) => { const n = el('text', { x, y, 'text-anchor': 'middle', fill, style: `${KO};font-size:${size}px`, ...extra }, parent); n.textContent = str; return n; };
      // pig posters (the house speciality is pork belly)
      const pigPoster = (x, y, rot, bg, label, sub) => {
        const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` }, cam);
        el('rect', { x: -110, y: -150, width: 220, height: 300, fill: bg, stroke: '#1d1a17', 'stroke-width': 6 }, g);
        el('ellipse', { cx: 0, cy: 50, rx: 78, ry: 52, fill: '#f4a7b0', stroke: '#1d1a17', 'stroke-width': 4 }, g); // body
        [-40, 40].forEach(k => el('rect', { x: k - 9, y: 88, width: 18, height: 26, rx: 4, fill: '#f4a7b0', stroke: '#1d1a17', 'stroke-width': 4 }, g));
        el('path', { d: 'M78,40 q18,-8 10,10 q-8,14 8,12', fill: 'none', stroke: '#1d1a17', 'stroke-width': 4 }, g); // curly tail
        [-1, 1].forEach(k => el('path', { d: `M${k * 22},-78 L${k * 50},-104 L${k * 52},-66Z`, fill: '#f08f9c', stroke: '#1d1a17', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g));
        el('circle', { cx: 0, cy: -40, r: 50, fill: '#f6b3bb', stroke: '#1d1a17', 'stroke-width': 4 }, g);
        el('ellipse', { cx: 0, cy: -26, rx: 22, ry: 15, fill: '#ee8f9b', stroke: '#1d1a17', 'stroke-width': 3 }, g);
        [-7, 7].forEach(k => el('ellipse', { cx: k, cy: -26, rx: 3.5, ry: 5, fill: '#1d1a17' }, g));
        [-20, 20].forEach(k => el('circle', { cx: k, cy: -56, r: 5, fill: '#1d1a17' }, g));
        el('path', { d: 'M-12,-6 Q0,4 12,-6', stroke: '#1d1a17', 'stroke-width': 3, fill: 'none' }, g);
        txt(0, 132, label, 34, '#1d1a17', g);
        if (sub) txt(0, -116, sub, 26, '#c0392b', g);
      };
      pigPoster(150, 300, -3, '#f7e7b4', '삼겹살', 'PORK BELLY');
      pigPoster(1770, 320, 4, '#e8f0d8', '돼지갈비', '맛있다!');
      // menu board
      const menu = el('g', { transform: 'translate(960 150)' }, cam);
      el('rect', { x: -330, y: -110, width: 660, height: 230, rx: 10, fill: '#2b2420', stroke: '#c9a46a', 'stroke-width': 8 }, menu);
      txt(0, -58, '메뉴  MENU', 40, '#ffd23f', menu);
      [['삼겹살', 'Pork Belly'], ['갈비', 'Galbi'], ['불고기', 'Bulgogi'], ['소주', 'Soju']].forEach(([k, e], i) => {
        const x = i % 2 ? 160 : -160, y = 4 + Math.floor(i / 2) * 58;
        txt(x, y, k, 34, '#f4f1e6', menu);
        txt(x, y + 26, e, 20, '#c9b79a', menu);
      });
      // soju poster
      const soju = el('g', { transform: 'translate(1560 300) rotate(-2)' }, cam);
      el('rect', { x: -80, y: -120, width: 160, height: 240, fill: '#d9efe0', stroke: '#1d1a17', 'stroke-width': 5 }, soju);
      el('path', { d: 'M-18,70 L-18,-10 Q-18,-26 -8,-36 L-8,-80 L8,-80 L8,-36 Q18,-26 18,-10 L18,70Z', fill: '#2f8a4a', stroke: '#1d1a17', 'stroke-width': 4 }, soju);
      el('rect', { x: -18, y: 0, width: 36, height: 34, fill: '#f4f1e6' }, soju);
      txt(0, 104, '소주', 30, '#1d1a17', soju);
      const lanterns = [400, 580, 1340, 1520].map((x, i) => {
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
      // ceiling exhaust duct over the grill
      const duct = el('g', {}, cam);
      el('rect', { x: 915, y: -400, width: 90, height: 690, fill: '#b9bcbf', stroke: '#1d1a17', 'stroke-width': 5 }, duct);
      for (let k = 0; k < 7; k++) el('path', { d: `M915,${-360 + k * 90} L1005,${-360 + k * 90}`, stroke: '#7d8083', 'stroke-width': 5 }, duct);
      el('path', { d: 'M915,280 L880,330 L1040,330 L1005,280Z', fill: '#c9cccf', stroke: '#1d1a17', 'stroke-width': 5 }, duct);
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
      // banchan: kimchi, pickled radish, bean sprouts, ssamjang, japchae
      [[420, 790, '#d8432a'], [560, 845, '#f2e6a8'], [1360, 790, '#e8e1cf'], [1500, 845, '#8a5a2b'], [300, 875, '#c98a4b']].forEach(([x, y, c]) => {
        el('ellipse', { cx: x, cy: y, rx: 70, ry: 26, fill: '#f4f1e6', stroke: '#1d1a17', 'stroke-width': 4 }, cam);
        el('ellipse', { cx: x, cy: y - 4, rx: 50, ry: 15, fill: c }, cam);
      });
      // lettuce basket for wraps
      el('path', { d: 'M1560,900 L1760,900 L1735,960 L1585,960Z', fill: '#c9a46a', stroke: '#1d1a17', 'stroke-width': 4 }, cam);
      for (let k = 0; k < 5; k++) el('ellipse', { cx: 1590 + k * 40, cy: 892 - (k % 2) * 10, rx: 38, ry: 22, fill: k % 2 ? '#7fb35a' : '#94c96c', stroke: '#3f6b2a', 'stroke-width': 3 }, cam);
      // bubbling stone-pot stew
      el('ellipse', { cx: 1760, cy: 790, rx: 80, ry: 30, fill: '#2b2b2b', stroke: '#1d1a17', 'stroke-width': 4 }, cam);
      el('ellipse', { cx: 1760, cy: 784, rx: 64, ry: 20, fill: '#c0392b' }, cam);
      const stew = TS.bg.puffs(el('g', {}, cam), { n: 5, seed: 4, color: '#ffffff', x: 1760, y: 780, spreadX: 60, rise: 140, size: 22, period: 1.8 });
      // soju bottles + shot glasses
      [[650, 760], [1270, 760]].forEach(([x, y]) => {
        el('path', { d: `M${x - 16},${y} L${x - 16},${y - 70} Q${x - 16},${y - 84} ${x - 7},${y - 92} L${x - 7},${y - 120} L${x + 7},${y - 120} L${x + 7},${y - 92} Q${x + 16},${y - 84} ${x + 16},${y - 70} L${x + 16},${y}Z`, fill: '#2f8a4a', stroke: '#1d1a17', 'stroke-width': 4, opacity: 0.95 }, cam);
        el('rect', { x: x - 16, y: y - 60, width: 32, height: 26, fill: '#f4f1e6' }, cam);
        el('path', { d: `M${x + 30},${y - 30} L${x + 60},${y - 30} L${x + 56},${y} L${x + 34},${y}Z`, fill: '#e8f4f4', stroke: '#1d1a17', 'stroke-width': 3, opacity: 0.85 }, cam);
      });
      // metal chopsticks and spoons at each place
      [470, 960, 1450].forEach(x => {
        el('path', { d: `M${x - 40},1010 L${x + 50},990 M${x - 40},1022 L${x + 52},1004`, stroke: '#9ea2a6', 'stroke-width': 6, 'stroke-linecap': 'round' }, cam);
        el('ellipse', { cx: x - 60, cy: 1030, rx: 20, ry: 10, fill: '#b9bcbf', stroke: '#1d1a17', 'stroke-width': 3 }, cam);
        el('path', { d: `M${x - 42},1026 L${x + 40},1048`, stroke: '#9ea2a6', 'stroke-width': 6, 'stroke-linecap': 'round' }, cam);
      });
      const smoke = TS.bg.puffs(el('g', {}, cam), { n: 12, seed: 9, color: '#f3efe6', x: 960, y: 700, spreadX: 300, rise: 230, size: 38, period: 2.2 });
      // end card
      const card = el('g', { opacity: 0 }, root);
      el('rect', { width: 1920, height: 1080, fill: '#16130f', opacity: 0.55 }, card);
      const title = el('text', { x: 960, y: 560, 'text-anchor': 'middle', fill: '#f4f1e6', stroke: '#1d1a17', 'stroke-width': 14, 'paint-order': 'stroke', style: 'font-family:Bangers, Impact, sans-serif;font-size:170px;letter-spacing:7px' }, card);
      title.textContent = 'LIFE AT TRADESMAN';
      const sub = el('text', { x: 960, y: 680, 'text-anchor': 'middle', fill: '#ffd23f', stroke: '#1d1a17', 'stroke-width': 10, 'paint-order': 'stroke', style: 'font-family:Bangers, Impact, sans-serif;font-size:90px;letter-spacing:6px' }, card);
      sub.textContent = 'THE END';
      item.s = { cam, boss, noah, lu, meat, smoke, lanterns, card, stew };
    },
    render(t, cfg, item) {
      const { cam, boss, noah, lu, meat, smoke, lanterns, card, stew } = item.s;
      // start tight on the three of them, pull back quickly to the whole table
      const out = seg(t, 0.2, 2.2, 'out');
      const z = lerp(2.0, 1.0, out), cy = lerp(470, 560, out);
      set(cam, { transform: `translate(960 540) scale(${z.toFixed(4)}) translate(-960 ${(-cy).toFixed(1)})` });
      stew.update(t, 0.6);
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
