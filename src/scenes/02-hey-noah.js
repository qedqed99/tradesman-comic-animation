// Scene 2: Lu strolls across the lot, then a big friendly wave: "Hey Noah!"
(function (TS) {
  const { seg, key, el, set, lerp, motion, toStage } = TS;
  TS.scenes['hey-noah'] = {
    build(root, cfg, item) {
      // shot A: wide, Lu far away walking in
      const a = el('g', {}, root);
      const wide = TS.sets.parkingLot(a, { horizon: 560, buildings: [
        { x: -300, y: 560, w: 700, h: 150, doors: 2, windows: 1 },
        { x: 520, y: 562, w: 360, h: 180, wall: '#a79a86', roof: '#8a7d6c', doors: 1, windows: 0, side: 50 },
        { x: 1180, y: 560, w: 420, h: 110, wall: '#d2bf9e', doors: 1, windows: 2 },
        { x: 1700, y: 560, w: 500, h: 140, doors: 2, windows: 1 },
      ] });
      const luFar = TS.makePuppet(wide.layers.actors.g, 'lu');
      // shot B: close-up wave
      const b = el('g', {}, root);
      const close = TS.sets.parkingLot(b, { horizon: 700, buildings: [
        { x: 1450, y: 700, w: 700, h: 260, wall: '#b9a789', doors: 1, windows: 1 },
        { x: -500, y: 700, w: 600, h: 160, wall: '#c8b597', doors: 1, windows: 2 },
      ] });
      const lu = TS.makePuppet(close.layers.actors.g, 'lu');
      item.s = { a, b, wide, close, luFar, lu };
      item.anchors = { lu: () => toStage(lu.mouthG, 0, 8) };
    },
    render(t, cfg, item) {
      const { a, b, wide, close, luFar, lu } = item.s;
      const cut = (cfg.sfx.find(s => s.sound === 'whoosh') || { at: 1.95 }).at;
      const shotB = t >= cut;
      a.setAttribute('display', shotB ? 'none' : 'inline');
      b.setAttribute('display', shotB ? 'inline' : 'none');
      if (!shotB) {
        wide.sky.update(t + 10);
        TS.bg.camera(wide.list, { x: 960, y: 540, zoom: 1 + t * 0.02 });
        const fy = key(t, [[0, 665], [cut, 775, 'linear']]);
        luFar.pose({ x: 720 + t * 18, y: fy, s: TS.bg.depthScale(fy, 560, 440), ...walk(t),
          head: { mouth: 'smile', lookY: 0, blink: motion.blink(t, 1) } });
        return;
      }
      const lt = t - cut;
      close.sky.update(t + 10);
      const slide = seg(lt, 0, 0.35, 'backOut');
      TS.bg.camera(close.list, { x: lerp(1060, 960, slide), y: 540, zoom: 1.02 });
      const w = lt * 11;
      const line = cfg.dialogue[0];
      const talk = motion.talk(t, line);
      lu.pose({
        x: lerp(1560, 1190, slide), y: 1500, s: 2.7, bob: Math.abs(Math.sin(w / 2)) * 6,
        lean: Math.sin(w) * 1.5,
        head: { tilt: Math.sin(w) * 2.5, turn: -0.1, lookX: -0.25, raise: 0.6, mouth: 'grin', open: talk || 0.55, blink: motion.blink(lt, 4) },
        armL: { a: lerp(30, 150, seg(lt, 0.05, 0.35, 'backOut')) + Math.sin(w) * 12, b: 22 + Math.sin(w + 1.2) * 22, hand: 'open' },
        armR: { a: 8, b: -8 },
      });
    },
  };
  function walk(t) {
    const m = TS.motion.stride(t, 2.2, 0.5);
    return { bob: m.bob * 0.6, legL: m.legL, legR: m.legR, armL: { a: 10 + m.legR.lift * 25, b: -10 }, armR: { a: 10 + m.legL.lift * 25, b: -10 } };
  }
})(window.TS);
