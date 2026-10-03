// Scene 1: Noah ticks off his work order in the empty lot... then hears something.
(function (TS) {
  const { seg, key, el, set, lerp, motion, toStage } = TS;
  TS.scenes['checklist'] = {
    build(root, cfg, item) {
      const set_ = TS.sets.parkingLot(root, { horizon: 610 });
      const noah = TS.makePuppet(set_.layers.actors.g, 'noah');
      const clip = TS.props.clipboard(noah.hand.L);
      set(clip.g, { transform: 'translate(-38 58) rotate(-12) scale(0.86)' });
      const pen = TS.props.pen(noah.hand.R);
      item.s = { set: set_, noah, clip, pen };
      item.anchors = { noah: () => toStage(noah.mouthG, 0, 10) };
    },
    render(t, cfg, item) {
      const { set: S, noah, clip, pen } = item.s;
      const ticks = cfg.sfx.filter(s => s.sound === 'tick').map(s => s.at);
      const huh = (cfg.sfx.find(s => s.sound === 'huh') || { at: 2.85 }).at;
      S.sky.update(t + 40);

      // camera: slow drift, then a snap zoom onto Noah's face when he hears something
      const snap = seg(t, huh, huh + 0.3, 'backOut');
      TS.bg.camera(S.list, {
        x: lerp(960 - t * 6, 840, snap), y: lerp(560, 470, snap),
        zoom: lerp(1 + t * 0.012, 1.4, snap),
      });

      const startled = t >= huh;
      const scribble = Math.sin(t * 38) * 3;
      // pen goes to the row being ticked
      const row = ticks.findIndex(a => t < a + 0.25);
      const rowY = row < 0 ? 3 : row + 1;
      const writing = !startled && row >= 0 && t > ticks[row] - 0.35;
      const line = cfg.dialogue[startled ? 1 : 0];
      const talk = motion.talk(t, line);
      const jump = Math.sin(seg(t, huh, huh + 0.28, 'linear') * Math.PI) * 26;
      noah.pose({
        x: 760, y: 1460, s: 3.55, bob: jump,
        head: startled
          ? { tilt: -5, turn: 0.35, lookX: 0.95, lookY: -0.1, eyes: 'wide', raise: 1.2, mouth: talk ? 'o' : 'o', open: talk || 0.5, blink: 0 }
          : { tilt: 6, nod: 9, turn: -0.15, lookX: -0.3, lookY: 1, raise: -0.4, mouth: talk ? 'talk' : 'flat', open: (talk || 0) * 0.55, blink: Math.max(0.38, motion.blink(t, 2)) },
        armL: { a: 32 + (startled ? 6 : 0), b: -100 + (startled ? 18 * snap : 0) },
        armR: startled ? { a: lerp(15, 14, snap), b: lerp(-91, -60, snap) }
                       : { a: 15 + (writing ? scribble * 0.4 : 0), b: -91 + rowY * 5 + (writing ? scribble : 0) },
      });
      set(pen.g, { transform: `rotate(${startled ? 30 : 0})` });
      // the two checks are drawn on the beat of the tick sounds; row 0 is already done
      clip.setChecks([1, ...ticks.map(a => seg(t, a - 0.25, a, 'out')), 0]);
    },
  };
})(window.TS);
