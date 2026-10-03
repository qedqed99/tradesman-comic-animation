// Scene 6: The chase. Lu reaches for Noah: "I Just... Wanna.... Help!!!!"
(function (TS) {
  const { seg, el, set, lerp, motion, toStage } = TS;
  TS.scenes['chase'] = {
    build(root, cfg, item) {
      const S = TS.sets.parkingLot(root, { horizon: 600, scroll: true, buildings: [
        { x: -500, y: 600, w: 900, h: 190, wall: '#c8b597', doors: 2, windows: 3 },
        { x: 1200, y: 602, w: 820, h: 150, doors: 2, windows: 2 },
      ] });
      const lu = TS.makePuppet(S.layers.actors.g, 'lu');
      const noah = TS.makePuppet(S.layers.actors.g, 'noah');
      const lines = TS.bg.speedLines(el('g', {}, root), 31, 30);
      item.s = { S, lu, noah, lines };
      item.anchors = { lu: () => toStage(lu.mouthG, 0, 10) };
    },
    render(t, cfg, item) {
      const { S, lu, noah, lines } = item.s;
      S.sky.update(t + 80);
      S.scroller.update(t * 1.9);
      TS.bg.camera(S.list, { x: 960 + Math.sin(t * 8) * 5, y: 540, zoom: 1, rot: Math.sin(t * 6) * 0.5 });
      // Lu gains a little, arm stretched toward Noah's shoulder
      const gain = seg(t, 0, 3.6, 'inOut');
      const ml = motion.stride(t + 0.13, 3.1, 1);
      const talk = motion.talk(t, cfg.dialogue[0], 0.9);
      const reach = Math.sin(t * 6) * 4;
      lu.pose({
        x: lerp(1260, 1120, gain), y: lerp(1230, 1290, gain), s: lerp(1.5, 1.62, gain), lean: -6, bob: ml.bob, legL: ml.legL, legR: ml.legR,
        armL: { a: 78 + reach, b: -4, hand: 'open' }, armR: ml.armR,
        head: { tilt: -6, turn: -0.35, lookX: -0.8, raise: 1.2, worried: 0.8, mouth: talk ? 'talk' : 'grit', open: talk || 0.4 },
      });
      const m = motion.stride(t, 3.4, 1);
      noah.pose({
        x: 640, y: 1380, s: 2.7, lean: 6, ...m, cape: { flap: 0.45, phase: m.cape.phase },
        head: { tilt: 4, turn: 0.2, lookX: 0.9, angry: 1, mouth: 'grit', open: 0.5 },
      });
      lines.update(t, 960, 560, 0.6);
    },
  };
})(window.TS);
