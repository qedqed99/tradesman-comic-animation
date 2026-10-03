// Scene 7: SCREEEEECH. The Boss's brown sedan skids in.
(function (TS) {
  const { seg, key, el, set, lerp, motion, clamp } = TS;
  const HZ = 600;
  TS.scenes['screech'] = {
    build(root, cfg, item) {
      const S = TS.sets.parkingLot(root, { horizon: HZ });
      const skid = el('path', { stroke: '#1f1f1f', 'stroke-width': 16, opacity: 0.55, fill: 'none', 'stroke-linecap': 'round' }, S.layers.ground.g);
      const noah = TS.makePuppet(S.layers.actors.g, 'noah');
      const lu = TS.makePuppet(S.layers.actors.g, 'lu');
      const smoke = TS.bg.puffs(el('g', {}, S.layers.actors.g), { n: 14, seed: 5, color: '#e4e2dc', spreadX: 260, rise: 160, size: 60, period: 0.9 });
      const car = TS.car.side(S.layers.actors.g);
      item.s = { S, noah, lu, car, smoke, skid };
    },
    render(t, cfg, item) {
      const { S, noah, lu, car, smoke, skid } = item.s;
      const sc = (cfg.sfx.find(s => s.sound === 'screech') || { at: 0.3 }).at;
      S.sky.update(t + 90);
      // car: arrives ~1 s in from the right, brakes hard, skids to a stop at x=1180
      const enter = sc - 0.35, stop = sc + 1.5;
      const p = seg(t, enter, stop, 'out');
      const x = lerp(3000, 1180, p);
      const brake = seg(t, sc, stop, 'linear');
      const bounce = t > stop ? Math.sin((t - stop) * 14) * 3 * Math.exp(-(t - stop) * 4) : 0;
      const shake = t < stop ? Math.sin(t * 80) * 4 * brake : 0;
      TS.bg.camera(S.list, { x: 960 + shake, y: 540, zoom: 1, rot: shake * 0.1 });
      car.pose({ x, y: 930, s: 0.92, dist: 3000 - x, rock: t < stop ? -2.5 * brake : -bounce });
      const xs = lerp(3000, 1180, seg(sc, enter, stop, 'out'));
      skid.setAttribute('d', t > sc ? `M${x - 240},924 L${xs - 240},924 M${x + 250},924 L${xs + 250},924` : '');
      smoke.update(t, t < stop + 0.4 ? clamp(brake * 1.5) : Math.max(0, 1 - (t - stop - 0.4) * 2), x + 260, 900);
      // Noah and Lu skid to a halt on the left and stare
      const halt = seg(t, sc - 0.1, sc + 0.7, 'out');
      const mn = motion.stride(t, 3.4, 1 - halt), ml = motion.stride(t + 0.2, 3.1, 1 - halt);
      const look = seg(t, sc, sc + 0.4);
      noah.pose({ x: 380, y: lerp(820, 900, halt), s: TS.bg.depthScale(lerp(820, 900, halt), HZ, 300), lean: 6 * (1 - halt) - 6 * halt, ...mn,
        head: { turn: 0.6 * look, lookX: look, eyes: 'wide', raise: 1, mouth: 'o', open: 0.6 } });
      lu.pose({ x: 640, y: lerp(760, 820, halt), s: TS.bg.depthScale(lerp(760, 820, halt), HZ, 440), lean: -6 * halt, ...ml,
        head: { turn: 0.5 * look, lookX: look, eyes: 'wide', raise: 1, mouth: 'o', open: 0.6 } });
    },
  };
})(window.TS);
