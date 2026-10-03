// The Boss's brown sedan, side-on and head-on.
(function (TS) {
  const { el, set } = TS;
  const INK = '#1d1a17';
  const BODY = '#7a4b2f', DARK = '#5a3420', TRIM = '#3b2a20';

  // Side view, facing left. Origin = ground under the middle of the car; ~900 long.
  // Returns groups so a passenger can sit between the cabin and the door panel.
  function side(parent) {
    const g = el('g', {}, parent);
    const inner = el('g', { transform: 'translate(-450 0)' }, g);
    const lean = el('g', {}, inner);  // body rocks on its springs
    const cabin = el('g', {}, lean);
    el('path', { d: 'M215,-210 L300,-296 L590,-296 L640,-210Z', fill: '#2a2623' }, cabin);
    const seat = el('g', {}, lean);   // passengers go here
    const bodyD = 'M20,-60 L880,-60 Q902,-62 900,-92 L895,-168 Q890,-190 860,-195 L715,-207 L605,-300 Q590,-314 562,-314 L330,-314 Q300,-314 284,-300 L188,-212 L60,-196 Q15,-188 10,-160 L5,-95 Q5,-60 20,-60Z';
    const winF = 'M212,-214 L302,-292 L432,-292 L432,-214Z';
    const winR = 'M448,-214 L448,-292 L560,-292 Q575,-292 588,-280 L652,-214Z';
    const shell = el('g', {}, lean);
    el('path', { d: bodyD + winF + winR, 'fill-rule': 'evenodd', fill: BODY, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, shell);
    el('path', { d: winR, fill: '#9cc0c8', opacity: 0.45 }, shell);
    el('path', { d: 'M470,-282 L520,-282 L480,-226 L455,-226Z', fill: '#fff', opacity: 0.25 }, shell);
    el('path', { d: 'M20,-120 L890,-128', stroke: DARK, 'stroke-width': 6, fill: 'none' }, shell);
    el('path', { d: 'M440,-214 L440,-62 M660,-210 L668,-62', stroke: TRIM, 'stroke-width': 4, fill: 'none' }, shell);
    el('rect', { x: 370, y: -175, width: 46, height: 10, rx: 4, fill: TRIM }, shell);
    el('rect', { x: 600, y: -175, width: 46, height: 10, rx: 4, fill: TRIM }, shell);
    el('path', { d: 'M8,-150 L40,-155 L42,-128 L8,-126Z', fill: '#f4ecc8', stroke: INK, 'stroke-width': 3 }, shell);
    el('path', { d: 'M893,-160 L870,-162 L868,-132 L896,-130Z', fill: '#c0392b', stroke: INK, 'stroke-width': 3 }, shell);
    el('path', { d: 'M195,-212 L170,-230 L150,-226 L160,-206Z', fill: DARK, stroke: INK, 'stroke-width': 3 }, shell); // mirror
    el('rect', { x: 0, y: -90, width: 60, height: 26, rx: 8, fill: '#3a3a3a', stroke: INK, 'stroke-width': 3 }, shell);
    el('rect', { x: 850, y: -90, width: 58, height: 26, rx: 8, fill: '#3a3a3a', stroke: INK, 'stroke-width': 3 }, shell);
    // a driver leaning out of the window: drawn over the body, clipped at the door line
    const above = el('g', {}, lean);
    const clipId = 'doorline' + (side.n = (side.n || 0) + 1);
    const cp = el('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, el('defs', {}, above));
    el('rect', { x: -3000, y: -3000, width: 7000, height: 3000 - 196 }, cp);
    const driver = el('g', { 'clip-path': `url(#${clipId})` }, above);
    const wheels = [190, 720].map(x => {
      el('path', { d: `M${x - 92},-60 A92,92 0 0,1 ${x + 92},-60Z`, fill: '#1e1b19' }, lean);
      const w = el('g', { transform: `translate(${x} -70)` }, inner);
      el('circle', { r: 70, fill: '#2a2a2a', stroke: INK, 'stroke-width': 5 }, w);
      const hub = el('g', {}, w);
      el('circle', { r: 36, fill: '#b9bcbf', stroke: INK, 'stroke-width': 3 }, hub);
      for (let i = 0; i < 5; i++) el('path', { d: `M0,0 L${Math.cos(i * 1.2566) * 30},${Math.sin(i * 1.2566) * 30}`, stroke: '#6f7275', 'stroke-width': 7 }, hub);
      return hub;
    });
    return {
      g, seat, driver,
      // x, y = ground point; dist = distance travelled (spins wheels); rock = body pitch in degrees
      pose({ x, y, s = 1, dist = 0, rock = 0, flip = 1 }) {
        set(g, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s * flip).toFixed(4)} ${s.toFixed(4)})` });
        set(lean, { transform: `rotate(${rock.toFixed(2)} 450 -60)` });
        wheels.forEach(h => set(h, { transform: `rotate(${(-dist / 70 * 57.3).toFixed(1)})` }));
      },
    };
  }

  // Head-on view. Origin = ground at the centre; ~1300 wide. Passengers go in .seat,
  // which is drawn behind the windscreen and hood.
  function front(parent) {
    const g = el('g', {}, parent);
    el('path', { d: 'M-500,-470 L-430,-770 Q-420,-800 -380,-802 L380,-802 Q420,-800 430,-770 L500,-470Z', fill: BODY, stroke: INK, 'stroke-width': 6 }, g);
    el('path', { d: 'M-445,-480 L-385,-748 L385,-748 L445,-480Z', fill: '#3a302a' }, g);
    el('path', { d: 'M-300,-480 L-300,-640 Q-300,-700 -240,-700 L-150,-700 Q-110,-700 -110,-640 L-110,-480Z M110,-480 L110,-640 Q110,-700 170,-700 L250,-700 Q300,-700 300,-640 L300,-480Z', fill: '#8a6a4a', stroke: INK, 'stroke-width': 4 }, g); // seats
    const seat = el('g', {}, g);
    const fr = el('g', {}, g);
    el('path', { d: 'M-445,-480 L-385,-748 L385,-748 L445,-480Z', fill: '#bfe0e6', opacity: 0.16 }, fr);
    el('path', { d: 'M-330,-740 L-250,-740 L-390,-490 L-430,-490Z M-200,-740 L-170,-740 L-310,-490 L-340,-490Z', fill: '#fff', opacity: 0.22 }, fr);
    el('path', { d: 'M-445,-480 L-385,-748 L385,-748 L445,-480Z', fill: 'none', stroke: BODY, 'stroke-width': 26, 'stroke-linejoin': 'round' }, fr);
    el('path', { d: 'M-445,-480 L-385,-748 L385,-748 L445,-480Z', fill: 'none', stroke: INK, 'stroke-width': 5 }, fr);
    const wheel = el('g', { transform: 'translate(250 -470)' }, fr);
    el('ellipse', { rx: 120, ry: 34, fill: 'none', stroke: INK, 'stroke-width': 22 }, wheel);
    el('ellipse', { rx: 120, ry: 34, fill: 'none', stroke: '#33302d', 'stroke-width': 14 }, wheel);
    el('path', { d: 'M-640,-430 Q-600,-490 -470,-492 L470,-492 Q600,-490 640,-430 L670,-220 L-670,-220Z', fill: BODY, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, fr);
    el('path', { d: 'M-470,-480 Q0,-440 470,-480', stroke: DARK, 'stroke-width': 5, fill: 'none' }, fr);
    el('path', { d: 'M-250,-350 L250,-350 Q270,-350 270,-330 L262,-250 Q260,-232 240,-232 L-240,-232 Q-260,-232 -262,-250 L-270,-330 Q-270,-350 -250,-350Z', fill: '#2b2522', stroke: '#b3a58c', 'stroke-width': 8 }, fr);
    for (let i = 0; i < 5; i++) el('path', { d: `M-240,${-330 + i * 20} L240,${-330 + i * 20}`, stroke: '#4a403a', 'stroke-width': 6 }, fr);
    [-1, 1].forEach(s => {
      el('path', { d: `M${s * 600},-400 Q${s * 440},-410 ${s * 330},-360 L${s * 345},-300 Q${s * 480},-290 ${s * 640},-310Z`, fill: '#f4ecc8', stroke: INK, 'stroke-width': 5 }, fr);
      el('path', { d: `M${s * 560},-380 L${s * 520},-320 M${s * 520},-385 L${s * 480},-325`, stroke: '#fff', 'stroke-width': 5 }, fr);
    });
    el('path', { d: 'M-690,-220 L690,-220 Q700,-220 698,-200 L690,-120 Q688,-100 668,-100 L-668,-100 Q-688,-100 -690,-120 L-698,-200 Q-700,-220 -690,-220Z', fill: DARK, stroke: INK, 'stroke-width': 6 }, fr);
    el('rect', { x: -120, y: -200, width: 240, height: 70, rx: 6, fill: '#efe8d2', stroke: INK, 'stroke-width': 4 }, fr);
    [-1, 1].forEach(s => el('rect', { x: s > 0 ? 520 : -640, y: -110, width: 120, height: 110, rx: 14, fill: '#232323', stroke: INK, 'stroke-width': 5 }, fr));
    return {
      g, seat,
      pose({ x, y, s = 1, bounce = 0 }) { set(g, { transform: `translate(${x.toFixed(1)} ${(y - bounce).toFixed(1)}) scale(${s.toFixed(4)})` }); },
    };
  }

  TS.car = { side, front };

  // a phone for the hand
  TS.props.phone = function (parent) {
    const g = el('g', {}, parent);
    el('rect', { x: -14, y: -50, width: 28, height: 54, rx: 6, fill: '#2a2d33', stroke: INK, 'stroke-width': 3 }, g);
    el('rect', { x: -10, y: -45, width: 20, height: 40, rx: 3, fill: '#7fb4d8' }, g);
    return { g };
  };
  TS.props.chopsticks = function (parent) {
    const g = el('g', {}, parent);
    el('path', { d: 'M-4,6 L-26,-70 M6,6 L-10,-72', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M-4,6 L-26,-70 M6,6 L-10,-72', stroke: '#c9a46a', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    return { g };
  };
})(window.TS);
