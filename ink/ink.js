// Ballpoint look, after Keith Ross's Tiny Concert: the v1 film redrawn as black ballpoint lines on paper.
// Every colour becomes paper (light fills) or ink (dark fills, strokes); the lines "boil" (wobble differently
// every second frame, like redrawn frames); paper grain and a few smudges sit on top.
(function (TS) {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#1c1d24', PAPER = '#f3efe4', SHADE = 'url(#ink-hatch)';
  const BOIL_FPS = 12;   // how often the lines are "redrawn"
  const make = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };

  function lum(c) {
    if (!c || c === 'none' || c === 'transparent' || c.startsWith('url(')) return null;
    let m = c.match(/^#([0-9a-f]{3,8})$/i);
    let r, g, b;
    if (m) {
      let h = m[1]; if (h.length === 3) h = h.split('').map(x => x + x).join('');
      [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    } else if ((m = c.match(/rgba?\(([^)]+)\)/))) {
      [r, g, b] = m[1].split(',').map(parseFloat);
    } else if (c === 'black') return 0; else if (c === 'white') return 1; else return 0.5;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  const DONE = new Set([INK, PAPER, SHADE, 'none']);
  function recolor(node) {  // colours the scenes change while playing (mouths opening, flashes)
    for (const n of node.querySelectorAll('[data-ink][fill]')) {
      const f = n.getAttribute('fill');
      if (DONE.has(f) || f.startsWith('url(')) continue;
      const L = lum(f), tag = n.tagName;
      n.setAttribute('fill', tag === 'text' || tag === 'tspan' ? (L > 0.6 ? PAPER : INK) : L !== null && L < 0.16 ? INK : L !== null && L < 0.32 ? SHADE : PAPER);
    }
    for (const n of node.querySelectorAll('[data-ink][stroke]')) {
      const st = n.getAttribute('stroke');
      if (!DONE.has(st) && !st.startsWith('url(')) n.setAttribute('stroke', INK);
    }
  }

  function inkify(node) {
    for (const n of node.querySelectorAll('*:not([data-ink])')) {
      n.setAttribute('data-ink', '1');
      const tag = n.tagName;
      if (['defs', 'linearGradient', 'radialGradient', 'stop', 'filter', 'pattern', 'clipPath', 'mask'].includes(tag) || n.closest('defs')) continue;
      if (tag === 'g' || tag === 'svg') {
        if (n.getAttribute('fill')) n.setAttribute('fill', lum(n.getAttribute('fill')) !== null && lum(n.getAttribute('fill')) < 0.2 ? INK : PAPER);
        if (n.getAttribute('stroke') && n.getAttribute('stroke') !== 'none') n.setAttribute('stroke', INK);
        continue;
      }
      const fillAttr = n.getAttribute('fill') ?? (n.style.fill || null);
      const strokeAttr = n.getAttribute('stroke');
      const hasStroke = strokeAttr && strokeAttr !== 'none';
      if (fillAttr && fillAttr !== 'none') {
        const L = lum(fillAttr);
        if (tag === 'text' || tag === 'tspan') n.setAttribute('fill', L !== null && L > 0.6 ? PAPER : INK);
        else if (L !== null && L < 0.16) n.setAttribute('fill', INK);
        else if (L !== null && L < 0.32) n.setAttribute('fill', SHADE);
        else n.setAttribute('fill', PAPER);
        n.style.fill = '';
      }
      if (hasStroke) {
        n.setAttribute('stroke', INK);
        const w = parseFloat(n.getAttribute('stroke-width') || '1');
        n.setAttribute('stroke-width', Math.max(1.6, Math.min(w * 0.75, 7)));
        n.setAttribute('stroke-linecap', 'round'); n.setAttribute('stroke-linejoin', 'round');
      } else if (fillAttr && fillAttr !== 'none' && tag !== 'text' && tag !== 'tspan') {
        n.setAttribute('stroke', INK); n.setAttribute('stroke-width', 1.8); n.setAttribute('stroke-linejoin', 'round');
      }
    }
  }

  function setup(svg) {
    const defs = make('defs', {}, null); svg.insertBefore(defs, svg.firstChild);
    const hatch = make('pattern', { id: 'ink-hatch', width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, defs);
    make('rect', { width: 9, height: 9, fill: PAPER }, hatch);
    make('line', { x1: 0, y1: 0, x2: 0, y2: 9, stroke: INK, 'stroke-width': 2.2 }, hatch);
    const f = make('filter', { id: 'ink-boil', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    const turb = make('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.018', numOctaves: 2, seed: 1, result: 'n' }, f);
    make('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 7, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
    const g = make('filter', { id: 'ink-grain' }, defs);
    const gt = make('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 1, seed: 3 }, g);
    make('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.11  0 0 0 0 0.11  0 0 0 0 0.14  0 0 0 0.16 -0.02' }, g);
    make('rect', { width: 1920, height: 1080, fill: PAPER }, null);
    svg.insertBefore(make('rect', { width: 1920, height: 1080, fill: PAPER }, null), defs.nextSibling);
    const top = make('g', { 'pointer-events': 'none' }, svg);
    const grain = make('rect', { width: 1920, height: 1080, filter: 'url(#ink-grain)' }, top);
    const smudges = make('g', { opacity: 0.12 }, top);
    return { turb, gt, smudges, grain };
  }

  function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

  const create = TS.createPlayer;
  TS.createPlayer = function (svg, timeline) {
    const ink = setup(svg);
    const player = create(svg, timeline);
    for (const g of svg.children) if (g.tagName === 'g' && g !== ink.smudges.parentNode) g.setAttribute('filter', 'url(#ink-boil)');
    inkify(svg);
    const render = player.renderAt;
    let lastBoil = -1;
    player.renderAt = function (t) {
      const r = render(t);
      inkify(svg);  // bubbles and lettering created while playing
      recolor(svg);
      const b = Math.floor(t * BOIL_FPS);
      if (b !== lastBoil) {
        lastBoil = b;
        ink.turb.setAttribute('seed', 1 + (b % 3));    // three "redraws" in rotation, like a hand-drawn loop
        ink.gt.setAttribute('seed', 3 + (b % 3));
        const R = rng(Math.floor(t / 1.5) + 7);          // smudges move only now and then
        ink.smudges.replaceChildren();
        for (let i = 0; i < 4; i++) make('ellipse', { cx: R() * 1920, cy: R() * 1080, rx: 20 + R() * 60, ry: 8 + R() * 25, fill: INK, transform: `rotate(${R() * 180})` }, ink.smudges)
          .setAttribute('transform', '');
      }
      return r;
    };
    return player;
  };
})(window.TS);
