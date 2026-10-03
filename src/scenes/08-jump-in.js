// Scene 8: The Boss leans out of the driver's window. "Hey Guys! Jump In!"
(function (TS) {
  const { seg, el, set, lerp, motion, toStage } = TS;
  TS.scenes['jump-in'] = {
    build(root, cfg, item) {
      const S = TS.sets.parkingLot(root, { horizon: 640, buildings: [
        { x: -300, y: 640, w: 900, h: 140, doors: 2, windows: 2 },
        { x: 1100, y: 642, w: 900, h: 200, wall: '#a79a86', roof: '#8a7d6c', doors: 1, windows: 1 },
      ] });
      const car = TS.car.side(S.layers.actors.g);
      const boss = TS.makePuppet(car.driver, 'boss');
      item.s = { S, car, boss };
      item.anchors = { boss: () => toStage(boss.mouthG, 0, 12) };
    },
    render(t, cfg, item) {
      const { S, car, boss } = item.s;
      S.sky.update(t + 100);
      const push = seg(t, 0, 3.4, 'inOut');
      TS.bg.camera(S.list, { x: lerp(1000, 930, push), y: 540, zoom: lerp(1, 1.06, push) });
      car.pose({ x: 1370, y: 1350, s: 3.2, rock: Math.sin(t * 30) * 0.12 });
      const lean = seg(t, 0.05, 0.4, 'backOut');
      const talk = motion.talk(t, cfg.dialogue[0], 1);
      const wave = Math.sin(t * 7) * 10;
      boss.pose({
        x: lerp(400, 320, lean), y: 30, s: 0.75, shadow: false, lean: lerp(0, -8, lean),
        armL: { a: lerp(20, 88, lean) + wave * 0.3, b: lerp(0, 8, lean) + wave, hand: 'open' },
        armR: { a: 15, b: -60 },
        head: { tilt: -4, turn: -0.45, lookX: -0.8, mouth: talk ? 'talk' : 'grin', open: talk || 0.55, raise: 0.6, blink: motion.blink(t, 6) },
      });
    },
  };
})(window.TS);
