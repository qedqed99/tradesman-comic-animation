// Small hand-held props.
(function (TS) {
  const { el, set, clamp } = TS;
  const INK = '#1d1a17';
  TS.props = {
    // Noah's work-order clipboard; origin = where the hand grips (bottom-left corner)
    clipboard(parent) {
      const g = el('g', {}, parent);
      el('rect', { x: 0, y: -100, width: 82, height: 104, rx: 5, fill: '#a9845a', stroke: INK, 'stroke-width': 4 }, g);
      el('rect', { x: 7, y: -90, width: 68, height: 88, fill: '#f6f1e3', stroke: INK, 'stroke-width': 2 }, g);
      el('rect', { x: 26, y: -106, width: 30, height: 14, rx: 3, fill: '#b9bdc2', stroke: INK, 'stroke-width': 3 }, g);
      const checks = [];
      for (let i = 0; i < 4; i++) {
        const y = -70 + i * 19;
        el('rect', { x: 14, y: y - 7, width: 10, height: 10, fill: 'none', stroke: '#6b6b6b', 'stroke-width': 2 }, g);
        el('path', { d: `M30,${y} L${64 - (i % 2) * 10},${y}`, stroke: '#9a9a9a', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        checks.push(el('path', { d: `M13,${y - 3} L18,${y + 3} L28,${y - 11}`, fill: 'none', stroke: '#2b52a8', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 30, 'stroke-dashoffset': 30 }, g));
      }
      return {
        g, checks,
        // progress per row 0..1
        setChecks(ps) { checks.forEach((c, i) => c.setAttribute('stroke-dashoffset', (30 * (1 - clamp(ps[i] || 0))).toFixed(1))); },
      };
    },
    pen(parent) {
      const g = el('g', {}, parent);
      el('path', { d: 'M0,0 L-10,-34', stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M0,0 L-10,-34', stroke: '#2b3f73', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      return { g };
    },
  };
})(window.TS);
