// Scenery built from code: sky, hills, warehouses and the parking lot from the comic.
(function (TS) {
  const { el, set, rng, lerp } = TS;
  const INK = '#1d1a17';
  const W = 1920, H = 1080;

  let defsDone = false;
  function defs(svg) {
    if (defsDone) return; defsDone = true;
    const d = el('defs', {}, svg);
    const sky = el('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: 0, 'stop-color': '#8fb9bd' }, sky);
    el('stop', { offset: 0.75, 'stop-color': '#c9dccb' }, sky);
    el('stop', { offset: 1, 'stop-color': '#dfe6cf' }, sky);
    const asphalt = el('linearGradient', { id: 'asphalt', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: 0, 'stop-color': '#6f7473' }, asphalt);
    el('stop', { offset: 1, 'stop-color': '#4a4e50' }, asphalt);
    const corr = el('pattern', { id: 'corrugated', width: 14, height: 10, patternUnits: 'userSpaceOnUse' }, d);
    el('rect', { width: 7, height: 10, fill: '#000', opacity: 0.07 }, corr);
    const door = el('pattern', { id: 'rolldoor', width: 10, height: 12, patternUnits: 'userSpaceOnUse' }, d);
    el('rect', { y: 9, width: 10, height: 3, fill: '#000', opacity: 0.13 }, door);
    const vig = el('radialGradient', { id: 'vignette', cx: 0.5, cy: 0.5, r: 0.75 }, d);
    el('stop', { offset: 0.6, 'stop-color': '#000', 'stop-opacity': 0 }, vig);
    el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.35 }, vig);
  }

  // A camera move over parallax layers. cam: {x, y, zoom, rot}; layer.f = 0 (fixed sky) .. 1 (ground plane)
  function camera(layers, cam) {
    for (const L of layers) {
      const z = 1 + (cam.zoom - 1) * L.f;
      const x = W / 2 + (cam.x - W / 2) * L.f, y = H / 2 + (cam.y - H / 2) * L.f;
      set(L.g, { transform: `translate(${W / 2} ${H / 2}) rotate(${(cam.rot || 0).toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-x).toFixed(1)} ${(-y).toFixed(1)})` });
    }
  }

  function sky(g) {
    defs(g.ownerSVGElement);
    el('rect', { x: -2000, y: -2000, width: W + 4000, height: H + 4000, fill: 'url(#sky)' }, g);
    const clouds = el('g', { opacity: 0.85 }, g);
    const r = rng(11);
    const list = [];
    for (let i = 0; i < 6; i++) {
      const c = el('g', {}, clouds);
      const n = 3 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) el('ellipse', { cx: k * 46 - n * 23, cy: -r() * 20, rx: 50 + r() * 30, ry: 22 + r() * 12, fill: '#f6f7ef' }, c);
      list.push({ c, x: r() * (W + 600) - 300, y: 80 + r() * 260, v: 6 + r() * 10, s: 0.6 + r() * 0.8 });
    }
    return { update(t) { list.forEach(o => set(o.c, { transform: `translate(${((o.x + t * o.v) % (W + 800)) - 400} ${o.y}) scale(${o.s})` })); } };
  }

  function hills(g, horizon) {
    el('path', { d: `M-1500,${horizon} L-1500,${horizon - 90} Q-800,${horizon - 230} -200,${horizon - 120} Q300,${horizon - 60} 700,${horizon - 170} Q1150,${horizon - 260} 1600,${horizon - 140} Q2300,${horizon - 60} 3400,${horizon - 160} L3400,${horizon}Z`, fill: '#9fb1b0' }, g);
    el('path', { d: `M-1500,${horizon} L-1500,${horizon - 50} Q-600,${horizon - 140} 100,${horizon - 70} Q600,${horizon - 20} 1100,${horizon - 100} Q1700,${horizon - 170} 2300,${horizon - 70} L3400,${horizon - 90} L3400,${horizon}Z`, fill: '#86999a' }, g);
    // tree line
    const r = rng(5); let d = `M-1500,${horizon + 4}`;
    for (let x = -1500; x <= 3400; x += 38) d += ` Q${x + 19},${horizon - 26 - r() * 30} ${x + 38},${horizon - 6 - r() * 10}`;
    el('path', { d: d + ` L3400,${horizon + 4}Z`, fill: '#6f8a5c' }, g);
  }

  // corrugated metal warehouse; x,y = bottom-left on the ground
  function warehouse(g, { x, y, w, h, wall = '#b9a789', roof = '#9a8a73', doors = 1, windows = 2, side = 0 }) {
    const b = el('g', {}, g);
    const roofH = h * 0.16;
    if (side) el('path', { d: `M${x + w},${y} L${x + w + side},${y - h * 0.08} L${x + w + side},${y - h - roofH * 0.4} L${x + w},${y - h}Z`, fill: shade(wall, -0.18), stroke: INK, 'stroke-width': 3 }, b);
    el('rect', { x, y: y - h, width: w, height: h, fill: wall, stroke: INK, 'stroke-width': 3 }, b);
    el('rect', { x, y: y - h, width: w, height: h, fill: 'url(#corrugated)' }, b);
    el('path', { d: `M${x - 10},${y - h} L${x + w * 0.5},${y - h - roofH} L${x + w + 10},${y - h}Z`, fill: roof, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, b);
    for (let i = 0; i < doors; i++) {
      const dw = Math.min(w * 0.22, h * 0.6), dx = x + w * (0.12 + i * 0.3);
      el('rect', { x: dx, y: y - h * 0.62, width: dw, height: h * 0.62, fill: shade(wall, -0.08), stroke: INK, 'stroke-width': 2.5 }, b);
      el('rect', { x: dx, y: y - h * 0.62, width: dw, height: h * 0.62, fill: 'url(#rolldoor)' }, b);
    }
    for (let i = 0; i < windows; i++) {
      const wx = x + w * (0.62 + i * 0.16);
      el('rect', { x: wx, y: y - h * 0.62, width: w * 0.1, height: h * 0.22, fill: '#4c6475', stroke: INK, 'stroke-width': 2.5 }, b);
      el('path', { d: `M${wx + w * 0.05},${y - h * 0.62} L${wx + w * 0.05},${y - h * 0.4}`, stroke: INK, 'stroke-width': 2 }, b);
    }
    return b;
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(Math.max(0, Math.min(255, v + v * k)));
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // perspective parking lot below the horizon, vanishing point at (vx, horizon)
  function lot(g, horizon, vx = W / 2) {
    el('rect', { x: -3000, y: horizon, width: W + 6000, height: 3000, fill: 'url(#asphalt)' }, g);
    const r = rng(3);
    for (let i = 0; i < 40; i++) el('ellipse', { cx: r() * W * 1.6 - W * 0.3, cy: horizon + 20 + r() * 900, rx: 30 + r() * 120, ry: 4 + r() * 10, fill: '#000', opacity: 0.05 + r() * 0.05 }, g);
    let d = '';
    const depthY = (z) => horizon + 620 / z;
    const rows = [1.0, 1.9, 3.4, 6.0, 11];
    for (const z of rows) {
      const y0 = depthY(z), y1 = depthY(z * 1.45);
      const k0 = (y0 - horizon) / 620, k1 = (y1 - horizon) / 620;
      d += `M${vx - 4000 * k0},${y0.toFixed(1)}L${vx + 4000 * k0},${y0.toFixed(1)}`;
      for (let s = -14; s <= 14; s++) {
        const X = s * 330;
        d += `M${(vx + X * k0).toFixed(1)},${y0.toFixed(1)}L${(vx + X * k1).toFixed(1)},${y1.toFixed(1)}`;
      }
    }
    el('path', { d, stroke: '#e9e5d8', 'stroke-width': 5, opacity: 0.75, fill: 'none', 'stroke-linecap': 'round' }, g);
  }
  // parking-lot stripes that stream toward the camera (tracking shots while running)
  function lotScroll(g, horizon, vx = W / 2) {
    el('rect', { x: -3000, y: horizon, width: W + 6000, height: 3000, fill: 'url(#asphalt)' }, g);
    const r = rng(8);
    for (let i = 0; i < 30; i++) el('ellipse', { cx: r() * W * 1.6 - W * 0.3, cy: horizon + 20 + r() * 900, rx: 30 + r() * 120, ry: 4 + r() * 10, fill: '#000', opacity: 0.05 }, g);
    const p = el('path', { stroke: '#e9e5d8', 'stroke-width': 5, opacity: 0.75, fill: 'none', 'stroke-linecap': 'round' }, g);
    return {
      update(offset) {
        const ph = offset - Math.floor(offset);
        let d = '';
        for (let k = 0; k < 9; k++) {
          const z = 0.5 * Math.pow(1.8, k - ph);
          const y0 = horizon + 620 / z, y1 = horizon + 620 / (z * 1.4);
          if (y1 > H + 400) continue;
          const k0 = (y0 - horizon) / 620, k1 = (y1 - horizon) / 620;
          d += `M${vx - 4000 * k0},${y0.toFixed(1)}L${vx + 4000 * k0},${y0.toFixed(1)}`;
          for (let s = -14; s <= 14; s++) d += `M${(vx + s * 330 * k0).toFixed(1)},${y0.toFixed(1)}L${(vx + s * 330 * k1).toFixed(1)},${y1.toFixed(1)}`;
        }
        p.setAttribute('d', d);
      },
    };
  }
  // a country road seen from the hood of a car; update(offset) moves the centre dashes
  function road(g, horizon, vx = W / 2) {
    el('rect', { x: -3000, y: horizon, width: W + 6000, height: 3000, fill: '#8fa66b' }, g);
    el('path', { d: `M${vx - 30},${horizon} L${vx + 30},${horizon} L${vx + 1600},${H + 600} L${vx - 1600},${H + 600}Z`, fill: '#5c6062' }, g);
    el('path', { d: `M${vx - 26},${horizon} L${vx - 1380},${H + 600} M${vx + 26},${horizon} L${vx + 1380},${H + 600}`, stroke: '#e9e5d8', 'stroke-width': 6, fill: 'none' }, g);
    const dash = el('path', { fill: '#f2c94c' }, g);
    return {
      update(offset) {
        let d = '';
        for (let k = 0; k < 10; k++) {
          const ph = offset - Math.floor(offset);
          const z0 = 0.35 * Math.pow(1.6, k - ph), z1 = z0 * 1.25;
          const y0 = horizon + 300 / z0, y1 = horizon + 300 / z1;
          const w0 = 3 + 14 / z0, w1 = 3 + 14 / z1;
          d += `M${vx - w0},${y0.toFixed(1)}L${vx + w0},${y0.toFixed(1)}L${vx + w1},${y1.toFixed(1)}L${vx - w1},${y1.toFixed(1)}Z`;
        }
        dash.setAttribute('d', d);
      },
    };
  }
  // drifting puffs of smoke / steam; returns update(t)
  function puffs(g, { n = 8, seed = 1, color = '#e9e6df', x = 0, y = 0, spreadX = 200, rise = 260, size = 40, period = 1.6 } = {}) {
    const r = rng(seed);
    const list = Array.from({ length: n }, () => ({ c: el('circle', { fill: color }, g), dx: (r() - 0.5) * spreadX, o: r(), s: 0.6 + r() * 0.8, sway: r() * 6 }));
    return {
      update(t, strength = 1, ox = x, oy = y) {
        list.forEach(P => {
          const k = ((t / period) + P.o) % 1;
          set(P.c, { cx: (ox + P.dx * (0.5 + k) + Math.sin(t * 2 + P.sway) * 12).toFixed(1), cy: (oy - k * rise).toFixed(1), r: (size * P.s * (0.4 + k)).toFixed(1), opacity: (Math.sin(k * Math.PI) * 0.75 * strength).toFixed(3) });
        });
      },
    };
  }
  // feet on the ground at screen y -> puppet scale (1.0 at y = horizon + k)
  const depthScale = (y, horizon, k = 440) => Math.max(0.02, (y - horizon) / k);

  // horizontal or radial speed streaks for action beats
  function speedLines(g, seed = 1, n = 26) {
    const r = rng(seed); const lines = [];
    for (let i = 0; i < n; i++) lines.push({ p: el('path', { stroke: '#fff', 'stroke-width': 3 + r() * 4, 'stroke-linecap': 'round', opacity: 0.55 }, g), a: r() * Math.PI * 2, r0: 420 + r() * 300, len: 180 + r() * 380, sp: 0.6 + r() });
    return {
      update(t, cx = W / 2, cy = H / 2, strength = 1) {
        lines.forEach(L => {
          const k = ((t * L.sp * 2.2) % 1);
          const r0 = L.r0 + k * 400, r1 = r0 + L.len;
          set(L.p, { d: `M${cx + Math.cos(L.a) * r0},${cy + Math.sin(L.a) * r0}L${cx + Math.cos(L.a) * r1},${cy + Math.sin(L.a) * r1}`, opacity: (0.55 * strength * Math.sin(k * Math.PI)).toFixed(3) });
        });
      },
    };
  }

  function vignette(g) { defs(g.ownerSVGElement); return el('rect', { width: W, height: H, fill: 'url(#vignette)', 'pointer-events': 'none' }, g); }

  TS.bg = { defs, camera, sky, hills, warehouse, lot, lotScroll, road, puffs, depthScale, speedLines, vignette, shade, W, H };
})(window.TS);
