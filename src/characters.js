// Code-built cartoon puppets for the three real people in the comic.
// Each puppet is a front-facing SVG rig: change a pose object, the drawing follows.
// "L"/"R" always mean screen-left / screen-right.
(function (TS) {
  const { el, set, tf, clamp, lerp } = TS;
  const INK = '#1d1a17';
  const D2R = Math.PI / 180;

  // ---- the cast ----------------------------------------------------------
  const BODY = {
    kid:   { headRx: 54, headRy: 60, headY: -262, shY: -192, shX: 40, hipY: -100, hipX: 20, thigh: 50, shin: 48, upper: 46, fore: 42, limb: 25, waist: 38, eyeRx: 10.5, eyeRy: 14, mouthW: 15 },
    adult: { headRx: 44, headRy: 54, headY: -398, shY: -328, shX: 62, hipY: -185, hipX: 29, thigh: 92, shin: 90, upper: 76, fore: 70, limb: 30, waist: 52, eyeRx: 8.5, eyeRy: 9.5, mouthW: 18 },
  };
  TS.CAST = {
    noah: { body: 'kid', skin: '#f2c493', hair: 'messy', hairColor: '#6b4428', iris: '#5b3b20', shirt: '#4f7896', bottom: 'shorts', bottomColor: '#5f5c3d', shoes: '#8d5a2c', socks: '#efeadf', cape: '#d8432a', blush: true },
    lu:   { body: 'adult', skin: '#efbf8b', hair: 'spiky', hairColor: '#221c19', iris: '#3b2a1e', shirt: '#f5f1e6', logo: 'olympic', bottom: 'pants', bottomColor: '#212125', shoes: '#c4c7cb', glasses: '#5e4935', stubble: true },
    boss: { body: 'adult', skin: '#e4a974', hair: 'beanie', hairColor: '#2b2a29', iris: '#3b2a1e', shirt: '#4e7a45', bottom: 'pants', bottomColor: '#3b3a37', shoes: '#4a3a2c', sunglasses: true, beard: '#a39687' },
  };
  // the Boss off duty, in the hot tub
  TS.CAST.bossTub = { ...TS.CAST.boss, shirt: TS.CAST.boss.skin, shirtless: true, bottomColor: '#2f3a44' };

  // ---- shape helpers -----------------------------------------------------
  function limb(parent, color, w) {
    return { o: el('path', { fill: 'none', stroke: INK, 'stroke-width': w + 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent),
             f: el('path', { fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent) };
  }
  const setLimb = (l, d) => { l.o.setAttribute('d', d); l.f.setAttribute('d', d); };
  const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  function hairPath(style, rx, ry) {
    let pts = [];
    if (style === 'messy') {
      const n = 15;
      for (let i = 0; i <= n; i++) {
        const a = lerp(-12, 192, i / n) * D2R, k = i % 2 ? 1.13 + (i % 3) * 0.03 : 1.0;
        pts.push([Math.cos(a) * rx * k, -Math.sin(a) * ry * k - ry * 0.08]);
      }
      pts.push([-rx * 1.02, ry * 0.05]);
      const fringe = [[-0.9, -0.2], [-0.72, -0.42], [-0.55, -0.22], [-0.35, -0.5], [-0.15, -0.3], [0.05, -0.55], [0.25, -0.3], [0.45, -0.52], [0.62, -0.28], [0.8, -0.45], [0.96, -0.1]];
      fringe.forEach(([x, y]) => pts.push([x * rx, (y - 0.14) * ry]));
      pts.push([rx * 1.02, ry * 0.05]);
    } else if (style === 'spiky') {
      const n = 13;
      for (let i = 0; i <= n; i++) {
        const a = lerp(-5, 185, i / n) * D2R, k = i % 2 ? 1.16 : 1.04;
        pts.push([Math.cos(a) * rx * k, -Math.sin(a) * ry * k * 1.12 - ry * 0.05]);
      }
      pts.push([-rx * 1.0, -ry * 0.1]);
      [[-0.8, -0.55], [-0.55, -0.62], [-0.3, -0.78], [-0.05, -0.68], [0.2, -0.8], [0.45, -0.66], [0.7, -0.72], [0.9, -0.5]].forEach(([x, y]) => pts.push([x * rx, y * ry]));
      pts.push([rx * 1.0, -ry * 0.1]);
    }
    return 'M' + pts.map(P).join('L') + 'Z';
  }
  function headPath(rx, ry, jaw) {
    return `M${-rx},0 C${-rx},${-ry * 1.36} ${rx},${-ry * 1.36} ${rx},0 C${rx},${ry * 0.75} ${rx * jaw},${ry} 0,${ry} C${-rx * jaw},${ry} ${-rx},${ry * 0.75} ${-rx},0Z`;
  }
  function mouthShape(shape, open, w) {
    const o = clamp(open == null ? 0.6 : open, 0, 1.4);
    switch (shape) {
      case 'smile': return { d: `M${-w},0 Q0,${w * 0.9} ${w},0`, fill: 'none' };
      case 'flat':  return { d: `M${-w * 0.55},3 Q0,5 ${w * 0.55},3`, fill: 'none' };
      case 'frown': return { d: `M${-w * 0.6},8 Q0,-2 ${w * 0.6},8`, fill: 'none' };
      case 'o':     return { d: `M${-w * 0.35},4 A${w * 0.35},${w * 0.5 * o + 3} 0 1,0 ${w * 0.35},4 A${w * 0.35},${w * 0.5 * o + 3} 0 1,0 ${-w * 0.35},4Z`, fill: '#8a2d28' };
      case 'scream':return { d: `M${-w * 0.75},${w * 0.2} C${-w * 0.75},${-w * 0.5} ${w * 0.75},${-w * 0.5} ${w * 0.75},${w * 0.2} C${w * 0.8},${w * 1.6 * o} ${-w * 0.8},${w * 1.6 * o} ${-w * 0.75},${w * 0.2}Z`, fill: '#8a2d28' };
      case 'grit':  return { d: `M${-w},0 L${w},0 L${w * 0.85},${w * 0.7 * o + 6} L${-w * 0.85},${w * 0.7 * o + 6}Z`, fill: '#8a2d28', teeth: true };
      default:      return { d: `M${-w},0 Q0,${w * 0.15} ${w},0 Q${w * 0.8},${w * 1.4 * o} 0,${w * 1.45 * o} Q${-w * 0.8},${w * 1.4 * o} ${-w},0Z`, fill: '#8a2d28', teeth: o > 0.35 };
    }
  }

  // ---- puppet ------------------------------------------------------------
  function makePuppet(parent, who) {
    const c = TS.CAST[who], B = BODY[c.body];
    const root = el('g', { 'data-puppet': who }, parent);
    const shadow = el('ellipse', { rx: B.shX * 1.4, ry: 14, fill: '#000', opacity: 0.22 }, root);
    const body = el('g', {}, root);
    const capeG = el('g', {}, body);
    const legsG = el('g', {}, body);
    const upper = el('g', {}, body);   // everything that leans
    const torsoG = el('g', {}, upper);
    const armsG = el('g', {}, upper);
    const headG = el('g', {}, upper);

    // cape (behind everything)
    let capeP = c.cape ? el('path', { fill: c.cape, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, capeG) : null;
    let capeIn = c.cape ? el('path', { fill: '#a92f1d', opacity: 0.55 }, capeG) : null;

    // legs
    const legs = {};
    for (const side of ['L', 'R']) {
      const color = c.bottom === 'pants' ? c.bottomColor : c.skin;
      const g = el('g', {}, legsG);
      legs[side] = {
        g,
        leg: limb(g, color, B.limb),
        sock: c.socks ? limb(g, c.socks, B.limb - 2) : null,
        shoe: el('ellipse', { rx: B.limb * 0.95, ry: B.limb * 0.55, fill: c.shoes, stroke: INK, 'stroke-width': 4 }, g),
        shorts: c.bottom === 'shorts' ? limb(g, c.bottomColor, B.limb + 16) : null,
      };
    }
    const hipBlock = el('path', { fill: c.bottomColor, stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round',
      d: `M${-B.waist},${B.hipY - 18} L${B.waist},${B.hipY - 18} L${B.hipX + B.limb * 0.7},${B.hipY + 24} L${-B.hipX - B.limb * 0.7},${B.hipY + 24}Z` }, legsG);

    // torso
    const neckTop = B.headY + B.headRy * 0.7;
    el('rect', { x: -B.limb * 0.55, y: neckTop, width: B.limb * 1.1, height: B.shY - neckTop + 10, fill: c.skin, stroke: INK, 'stroke-width': 4 }, torsoG);
    const sw = B.shX + B.limb * 0.45;
    el('path', { fill: c.shirt, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round',
      d: `M${-sw},${B.shY + 22} Q${-sw},${B.shY - 6} ${-sw + 26},${B.shY - 8} L${sw - 26},${B.shY - 8} Q${sw},${B.shY - 6} ${sw},${B.shY + 22} L${B.waist + 4},${B.hipY - 4} L${-B.waist - 4},${B.hipY - 4}Z` }, torsoG);
    if (c.shirtless) {
      const pec = (s) => `M${s * 4},${B.shY + 38} Q${s * 26},${B.shY + 52} ${s * 46},${B.shY + 30}`;
      [-1, 1].forEach(s => el('path', { d: pec(s), fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6 }, torsoG));
      [-1, 1].forEach(s => el('circle', { cx: s * 28, cy: B.shY + 44, r: 3.5, fill: '#b9714b' }, torsoG));
      el('path', { d: `M-30,${B.shY + 105} Q0,${B.shY + 118} 30,${B.shY + 105}`, fill: 'none', stroke: INK, 'stroke-width': 3, opacity: 0.45 }, torsoG);
    } else
      el('path', { fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round', d: `M${-B.limb * 0.75},${B.shY - 7} Q0,${B.shY + 12} ${B.limb * 0.75},${B.shY - 7}` }, torsoG);
    if (c.logo === 'olympic') {
      const cols = ['#2e6fbf', '#f2b632', '#1d1a17', '#2f9a4c', '#d8392f'];
      const r = 10.5, cy = B.shY + 52;
      [[-24, 0], [-12, 9], [0, 0], [12, 9], [24, 0]].forEach(([x, y], i) => el('circle', { cx: x, cy: cy + y, r, fill: 'none', stroke: cols[[0, 1, 2, 3, 4][i]], 'stroke-width': 3.4 }, torsoG));
    }
    if (c.cape) // scarf knot of the cape around the neck
      el('path', { fill: c.cape, stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round',
        d: `M${-sw + 6},${B.shY - 2} Q0,${B.shY + 30} ${sw - 6},${B.shY - 2} Q${sw - 4},${B.shY - 20} ${sw - 20},${B.shY - 18} Q0,${B.shY + 6} ${-sw + 20},${B.shY - 18} Q${-sw + 4},${B.shY - 20} ${-sw + 6},${B.shY - 2}Z` }, torsoG);

    // arms + hands
    const arms = {}, hand = {};
    for (const side of ['L', 'R']) {
      const g = el('g', {}, armsG);
      const a = { g, arm: limb(g, c.skin, B.limb * 0.92), sleeve: limb(g, c.shirt, B.limb + 12) };
      a.hand = el('g', {}, g);           // positioned at the wrist, unrotated (props go here)
      a.handRot = el('g', {}, a.hand);   // rotated with the forearm
      const r = B.limb * 0.62;
      a.fist = el('circle', { r, cy: r * 0.4, fill: c.skin, stroke: INK, 'stroke-width': 4 }, a.handRot);
      a.open = el('g', { display: 'none' }, a.handRot);
      // open palm: fingers point along the forearm direction (local +y)
      for (let i = 0; i < 4; i++) {
        const fx = (i - 1.5) * r * 0.5;
        el('path', { d: `M${fx},${r * 0.6} L${fx * 1.3},${r * 2.6 - Math.abs(i - 1.5) * r * 0.35}`, stroke: INK, 'stroke-width': r * 0.48 + 7, 'stroke-linecap': 'round', fill: 'none' }, a.open);
        el('path', { d: `M${fx},${r * 0.6} L${fx * 1.3},${r * 2.6 - Math.abs(i - 1.5) * r * 0.35}`, stroke: c.skin, 'stroke-width': r * 0.48, 'stroke-linecap': 'round', fill: 'none' }, a.open);
      }
      el('ellipse', { rx: r * 1.05, ry: r * 0.95, cy: r * 0.45, fill: c.skin, stroke: INK, 'stroke-width': 4 }, a.open);
      a.thumb = el('path', { d: `M${r * 0.8},${r * 0.3} L${r * 1.6},${r * 0.9}`, stroke: c.skin, 'stroke-width': r * 0.48, 'stroke-linecap': 'round' }, a.open);
      arms[side] = a; hand[side] = a.hand;
    }

    // head
    const H = el('g', {}, headG);
    const { headRx: rx, headRy: ry } = B;
    const ears = [-1, 1].map(s => el('ellipse', { cx: s * rx * 0.97, cy: 4, rx: 10, ry: 15, fill: c.skin, stroke: INK, 'stroke-width': 4 }, H));
    el('path', { d: headPath(rx, ry, c.body === 'kid' ? 0.55 : 0.45), fill: c.skin, stroke: INK, 'stroke-width': 5 }, H);
    const face = el('g', {}, H);
    if (c.blush) [-1, 1].forEach(s => el('ellipse', { cx: s * rx * 0.55, cy: ry * 0.4, rx: 11, ry: 6, fill: '#e8897a', opacity: 0.35 }, face));
    if (c.stubble) el('path', { d: `M${-rx * 0.92},${ry * 0.2} Q${-rx * 0.6},${ry * 1.0} 0,${ry * 1.0} Q${rx * 0.6},${ry * 1.0} ${rx * 0.92},${ry * 0.2} Q${rx * 0.5},${ry * 0.55} 0,${ry * 0.42} Q${-rx * 0.5},${ry * 0.55} ${-rx * 0.92},${ry * 0.2}Z`, fill: '#3a2c22', opacity: 0.16 }, face);
    if (c.beard) {
      el('path', { d: `M${-rx * 0.98},${ry * 0.0} Q${-rx * 0.9},${ry * 1.15} 0,${ry * 1.12} Q${rx * 0.9},${ry * 1.15} ${rx * 0.98},${ry * 0.0} Q${rx * 0.7},${ry * 0.5} ${rx * 0.3},${ry * 0.36} Q0,${ry * 0.3} ${-rx * 0.3},${ry * 0.36} Q${-rx * 0.7},${ry * 0.5} ${-rx * 0.98},${ry * 0.0}Z`, fill: c.beard, stroke: INK, 'stroke-width': 3 }, face);
    }
    // eyes
    const eyeX = rx * (c.body === 'kid' ? 0.42 : 0.38), eyeY = c.body === 'kid' ? ry * 0.12 : -ry * 0.06;
    const eyes = [-1, 1].map(s => {
      const g = el('g', {}, face);
      const inner = el('g', {}, g);
      const white = el('ellipse', { rx: B.eyeRx, ry: B.eyeRy, fill: '#fff', stroke: INK, 'stroke-width': 1.5 }, inner);
      const iris = el('g', {}, inner);
      el('circle', { r: B.eyeRx * 0.72, fill: c.iris }, iris);
      el('circle', { r: B.eyeRx * 0.38, fill: '#140f0c' }, iris);
      el('circle', { r: B.eyeRx * 0.2, cx: -B.eyeRx * 0.25, cy: -B.eyeRy * 0.25, fill: '#fff' }, iris);
      const lid = el('path', { d: `M${-B.eyeRx - 3},${-B.eyeRy * 0.35} Q0,${-B.eyeRy * 1.35} ${B.eyeRx + 3},${-B.eyeRy * 0.35}`, fill: 'none', stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, inner);
      const happy = el('path', { d: `M${-B.eyeRx},3 Q0,${-B.eyeRy * 1.1} ${B.eyeRx},3`, fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', display: 'none' }, g);
      return { g, inner, white, iris, lid, happy, s };
    });
    const browG = el('g', {});  // appended after the hair so brows sit on top of the fringe
    const brows = [-1, 1].map(() => el('path', { fill: 'none', stroke: c.body === 'kid' ? '#3d2412' : INK, 'stroke-width': c.body === 'kid' ? 7 : 6.5, 'stroke-linecap': 'round' }, browG));
    el('path', { d: c.body === 'kid' ? `M-3,${ry * 0.33} Q2,${ry * 0.41} 6,${ry * 0.34}` : `M1,${-ry * 0.02} L-5,${ry * 0.3} Q1,${ry * 0.36} 7,${ry * 0.3}`, fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, face);
    if (c.beard) el('path', { d: `M${-rx * 0.42},${ry * 0.5} Q0,${ry * 0.3} ${rx * 0.42},${ry * 0.5} Q0,${ry * 0.42} ${-rx * 0.42},${ry * 0.5}Z`, fill: '#8f8275', stroke: INK, 'stroke-width': 2.5 }, face);
    const mouthG = el('g', { transform: `translate(0 ${ry * (c.body === 'kid' ? 0.56 : 0.56)})` }, face);
    const mouth = el('path', { stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mouthG);
    const teeth = el('path', { fill: '#fff' }, mouthG);
    if (c.glasses) {
      const gw = B.eyeRx * 2.6, gh = B.eyeRy * 2.4;
      [-1, 1].forEach(s => el('rect', { x: s * eyeX - gw / 2, y: eyeY - gh / 2, width: gw, height: gh, rx: 9, fill: '#fff', 'fill-opacity': 0.12, stroke: c.glasses, 'stroke-width': 4 }, face));
      el('path', { d: `M${-eyeX + gw / 2},${eyeY - 2} Q0,${eyeY - 8} ${eyeX - gw / 2},${eyeY - 2}`, fill: 'none', stroke: c.glasses, 'stroke-width': 4 }, face);
    }
    if (c.sunglasses) {
      const gw = B.eyeRx * 3.2, gh = B.eyeRy * 2.3;
      [-1, 1].forEach(s => {
        el('path', { d: `M${s * eyeX - gw / 2},${eyeY - gh / 2} L${s * eyeX + gw / 2},${eyeY - gh / 2} Q${s * eyeX + gw / 2},${eyeY + gh / 2} ${s * eyeX},${eyeY + gh / 2} Q${s * eyeX - gw / 2},${eyeY + gh / 2} ${s * eyeX - gw / 2},${eyeY - gh / 2}Z`, fill: '#141414', stroke: INK, 'stroke-width': 3 }, face);
        el('path', { d: `M${s * eyeX - gw * 0.3},${eyeY - gh * 0.25} L${s * eyeX - gw * 0.05},${eyeY - gh * 0.25}`, stroke: '#7d8a93', 'stroke-width': 3, 'stroke-linecap': 'round' }, face);
      });
      el('path', { d: `M${-eyeX + gw / 2},${eyeY - gh / 2 + 3} L${eyeX - gw / 2},${eyeY - gh / 2 + 3}`, stroke: '#141414', 'stroke-width': 5 }, face);
    }
    // hair on top
    if (c.hair === 'beanie') {
      [-1, 1].forEach(s => el('path', { d: `M${s * rx * 0.98},${-ry * 0.3} Q${s * rx * 1.05},${ry * 0.05} ${s * rx * 0.9},${ry * 0.12} L${s * rx * 0.86},${-ry * 0.3}Z`, fill: '#8d847b', stroke: INK, 'stroke-width': 3 }, H));
      el('path', { d: `M${-rx * 1.06},${-ry * 0.3} C${-rx * 1.15},${-ry * 1.7} ${rx * 1.15},${-ry * 1.7} ${rx * 1.06},${-ry * 0.3}Z`, fill: c.hairColor, stroke: INK, 'stroke-width': 5 }, H);
      el('path', { d: `M${-rx * 1.1},${-ry * 0.62} Q0,${-ry * 0.74} ${rx * 1.1},${-ry * 0.62} L${rx * 1.08},${-ry * 0.24} Q0,${-ry * 0.36} ${-rx * 1.08},${-ry * 0.24}Z`, fill: '#3a3937', stroke: INK, 'stroke-width': 4 }, H);
      for (let i = -6; i <= 6; i++) el('path', { d: `M${i * rx * 0.16},${-ry * 0.68} L${i * rx * 0.16},${-ry * 0.32}`, stroke: '#232221', 'stroke-width': 3 }, H);
    } else {
      el('path', { d: hairPath(c.hair, rx, ry), fill: c.hairColor, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, H);
    }

    H.appendChild(browG);

    // ---- pose application -------------------------------------------------
    const DEF = { x: 0, y: 0, s: 1, lean: 0, bob: 0, flip: 1,
      head: { tilt: 0, turn: 0, lookX: 0, lookY: 0, blink: 0, eyes: 'normal', raise: 0, angry: 0, mouth: 'smile', open: 0.6 },
      armL: { a: 12, b: 0, hand: 'fist' }, armR: { a: 12, b: 0, hand: 'fist' },
      legL: { lift: 0, out: 0 }, legR: { lift: 0, out: 0 }, cape: { flap: 0, phase: 0 } };
    let state = JSON.parse(JSON.stringify(DEF));

    function pose(p) {
      const st = {
        ...DEF, ...p,
        head: { ...DEF.head, ...(p.head || {}) },
        armL: { ...DEF.armL, ...(p.armL || {}) }, armR: { ...DEF.armR, ...(p.armR || {}) },
        legL: { ...DEF.legL, ...(p.legL || {}) }, legR: { ...DEF.legR, ...(p.legR || {}) },
        cape: { ...DEF.cape, ...(p.cape || {}) },
      };
      state = st;
      // hands-up gestures (phone to the ear) need the arms drawn over the head
      if (!!st.armsFront !== (armsG.nextSibling === null)) upper.appendChild(st.armsFront ? armsG : headG);
      shadow.setAttribute('display', st.shadow === false ? 'none' : 'inline');
      set(root, { transform: `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) scale(${(st.s * st.flip).toFixed(4)} ${st.s.toFixed(4)})` });
      set(body, { transform: `translate(0 ${(-st.bob).toFixed(1)})` });
      set(shadow, { transform: `scale(${(1 - st.bob / 300).toFixed(3)} 1)` });
      set(upper, { transform: `rotate(${st.lean.toFixed(2)} 0 ${B.hipY})` });

      // legs
      for (const side of ['L', 'R']) {
        const sx = side === 'L' ? -1 : 1, lp = st['leg' + side], L = legs[side];
        const hip = [sx * B.hipX, B.hipY];
        const lift = clamp(lp.lift, 0, 1);
        const knee = [hip[0] + sx * (4 + lift * 12) + lp.out * 0.5, hip[1] + B.thigh * lerp(1, 0.62, lift)];
        const foot = [hip[0] + lp.out, lerp(0, knee[1] + B.shin * 0.45, lift)];
        setLimb(L.leg, `M${P(hip)}L${P(knee)}L${P(foot)}`);
        if (L.sock) setLimb(L.sock, `M${P([lerp(knee[0], foot[0], 0.7), lerp(knee[1], foot[1], 0.7)])}L${P(foot)}`);
        if (L.shorts) setLimb(L.shorts, `M${P([hip[0], hip[1] - 8])}L${P([lerp(hip[0], knee[0], 0.62), lerp(hip[1], knee[1], 0.62)])}`);
        set(L.shoe, { cx: foot[0] + sx * 3, cy: foot[1] + 2, transform: `rotate(${(sx * 8)} ${foot[0]} ${foot[1]})`, ry: B.limb * lerp(0.55, 0.75, lift) });
      }

      // arms
      for (const side of ['L', 'R']) {
        const sx = side === 'L' ? -1 : 1, ap = st['arm' + side], A = arms[side];
        const sh = [sx * B.shX, B.shY + 10];
        const a1 = ap.a * D2R, a2 = (ap.a + ap.b) * D2R;
        const elb = [sh[0] + sx * Math.sin(a1) * B.upper, sh[1] + Math.cos(a1) * B.upper];
        const wr = [elb[0] + sx * Math.sin(a2) * B.fore, elb[1] + Math.cos(a2) * B.fore];
        setLimb(A.arm, `M${P(sh)}L${P(elb)}L${P(wr)}`);
        setLimb(A.sleeve, `M${P([sh[0] - sx * 4, sh[1] - 6])}L${P([lerp(sh[0], elb[0], 0.5), lerp(sh[1], elb[1], 0.5)])}`);
        set(A.hand, { transform: `translate(${P(wr)})` });
        set(A.handRot, { transform: `rotate(${(-sx * (ap.a + ap.b) + (ap.handRot || 0)).toFixed(1)})` });
        const open = ap.hand === 'open';
        A.open.setAttribute('display', open ? 'inline' : 'none');
        A.fist.setAttribute('display', open || ap.hand === 'none' ? 'none' : 'inline');
        set(A.thumb, { transform: `scale(${sx} 1)` });
      }
      // arm stacking: an arm reaching across the body draws in front
      // (both always in front of torso for this front rig)

      // cape
      if (capeP) {
        const f = clamp(st.cape.flap, 0, 1.2), ph = st.cape.phase;
        const top = B.shY - 6, w0 = B.shX + 8;
        const tipX = lerp(w0 + 18, w0 + 170, f), tipY = lerp(top + 175, top + 40, f);
        const wv = (k) => Math.sin(ph + k) * 18 * f;
        const midY = lerp(top + 190, top + 95, f);
        const d = `M${-w0},${top} Q${-tipX * 0.7},${top - 10 * f} ${-tipX},${tipY + wv(0)} Q${-tipX * 0.55},${midY + 20 + wv(1)} ${-tipX * 0.28},${midY + wv(1.6)} Q0,${midY + 30 + wv(2.2)} ${tipX * 0.28},${midY + wv(2.8)} Q${tipX * 0.55},${midY + 20 + wv(3.4)} ${tipX},${tipY + wv(4)} Q${tipX * 0.7},${top - 10 * f} ${w0},${top}Z`;
        capeP.setAttribute('d', d);
        capeIn.setAttribute('d', `M${-w0 * 0.6},${top + 10} Q0,${top + 40} ${w0 * 0.6},${top + 10} L${w0 * 0.5},${midY * 0.4 + top * 0.6} Q0,${midY * 0.5 + top * 0.5} ${-w0 * 0.5},${midY * 0.4 + top * 0.6}Z`);
      }

      // head
      const h = st.head;
      set(headG, { transform: `translate(0 ${B.headY}) rotate(${h.tilt.toFixed(2)} 0 ${B.headRy * 0.9})` });
      const fx = h.turn * rx * 0.3;
      set(face, { transform: `translate(${fx.toFixed(1)} ${(h.nod || 0).toFixed(1)})` });
      set(browG, { transform: `translate(${fx.toFixed(1)} ${(h.nod || 0).toFixed(1)})` });
      ears.forEach((e, i) => set(e, { cx: (i ? 1 : -1) * rx * 0.97 - h.turn * rx * 0.12 }));
      const wide = h.eyes === 'wide' ? 1.22 : 1;
      eyes.forEach(E => {
        const open = clamp(1 - h.blink, 0.06, 1);
        set(E.g, { transform: `translate(${E.s * eyeX} ${eyeY})` });
        set(E.inner, { transform: `scale(${wide} ${(open * wide).toFixed(3)})` });
        set(E.iris, { transform: `translate(${(h.lookX * B.eyeRx * 0.38).toFixed(2)} ${(h.lookY * B.eyeRy * 0.45).toFixed(2)}) scale(${h.eyes === 'wide' ? 0.75 : 1})` });
        E.lid.setAttribute('display', h.eyes === 'wide' ? 'none' : 'inline');
        E.white.setAttribute('stroke-width', h.eyes === 'wide' ? 3.5 : 1.5);
        const happy = h.eyes === 'happy';
        E.inner.setAttribute('display', happy ? 'none' : 'inline');
        E.happy.setAttribute('display', happy ? 'inline' : 'none');
      });
      brows.forEach((b, i) => {
        const s = i ? 1 : -1;
        const by = eyeY - B.eyeRy * 1.6 - h.raise * 5;
        const inner = [s * rx * 0.14, by + h.angry * 9 - (h.worried || 0) * 8];
        const outer = [s * rx * 0.58, by - 4 - h.angry * 3 + (h.worried || 0) * 4];
        b.setAttribute('d', `M${P(inner)}Q${P([s * rx * 0.36, by - 7])} ${P(outer)}`);
      });
      const m = mouthShape(h.mouth, h.open, B.mouthW);
      set(mouth, { d: m.d, fill: m.fill });
      teeth.setAttribute('d', m.teeth ? `M${-B.mouthW * 0.7},1 Q0,${B.mouthW * 0.05} ${B.mouthW * 0.7},1 L${B.mouthW * 0.62},${B.mouthW * 0.3} Q0,${B.mouthW * 0.36} ${-B.mouthW * 0.62},${B.mouthW * 0.3}Z` : '');
    }
    pose({});
    return { root, pose, hand, head: headG, mouthG, B, get state() { return state; } };
  }

  // ---- reusable motion cycles ------------------------------------------------
  TS.motion = {
    // front-view walk / run cycle at time t; speed in steps per second
    stride(t, speed, power = 1) {
      const ph = t * speed * Math.PI;
      const sL = Math.max(0, Math.sin(ph)), sR = Math.max(0, -Math.sin(ph));
      return {
        bob: Math.abs(Math.sin(ph)) * 14 * power,
        legL: { lift: sL * 0.75 * power, out: 0 }, legR: { lift: sR * 0.75 * power, out: 0 },
        armL: { a: 18 + sR * 30 * power, b: -70 * power - sR * 30 }, armR: { a: 18 + sL * 30 * power, b: -70 * power - sL * 30 },
        cape: { flap: power, phase: ph * 1.3 },
      };
    },
    // mouth flaps while a dialogue line is being "spoken"
    talk(t, line, extra = 1) {
      if (!line || t < line.at || t > line.at + (line.dur || 2)) return null;
      const lt = t - line.at;
      if (!TS.speech.parse(line).segs.some(([a, b]) => lt >= a - 0.05 && lt <= b + 0.2)) return null;
      return 0.25 + Math.abs(Math.sin((t - line.at) * 17)) * 0.75 * extra;
    },
    blink(t, seed = 0) {
      const period = 3.1 + (seed % 3) * 0.7, ph = (t + seed * 0.37) % period;
      return ph < 0.12 ? Math.sin(ph / 0.12 * Math.PI) : 0;
    },
  };

  TS.makePuppet = makePuppet;
})(window.TS);
