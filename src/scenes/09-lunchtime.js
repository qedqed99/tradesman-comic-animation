// Scenes 9 and 10: all three in the car. "LUNCHTIME!" "CHIPOTLE!" ... "No!"
(function (TS) {
  const { seg, el, set, lerp, motion, toStage } = TS;
  function build(root, cfg, item) {
    const S = TS.sets.carFront(root);
    item.s = S;
    item.anchors = { lu: () => toStage(S.lu.mouthG, 0, 10), noah: () => toStage(S.noah.mouthG, 0, 10), boss: () => toStage(S.boss.mouthG, 0, 12) };
  }
  function drive(t, S, cam) {
    S.sky.update(t + 120);
    S.road.update(t * 2.2);
    TS.bg.camera(S.list, cam);
    S.car.pose({ x: 960, y: 1210, s: 0.95, bounce: Math.abs(Math.sin(t * 9)) * 5 + Math.sin(t * 23) * 1.5 });
  }
  const seat = (S, who, extra) => ({ ...S.seats[who], shadow: false, ...extra });

  TS.scenes['lunchtime'] = {
    build,
    render(t, cfg, item) {
      const S = item.s;
      drive(t, S, { x: 960, y: 600, zoom: lerp(1.22, 1.3, seg(t, 0, 3.8)) });
      const [lunch, chip] = cfg.dialogue;
      const cheer = seg(t, lunch.at - 0.1, lunch.at + 0.25, 'backOut') * (1 - seg(t, lunch.at + 1.6, lunch.at + 2.0));
      const pump = Math.sin(t * 12) * 8 * cheer;
      const tl = motion.talk(t, lunch, 1);
      S.lu.pose(seat(S, 'lu', {
        armL: { a: lerp(15, 150, cheer) + pump, b: lerp(-40, -40, cheer) }, armR: { a: 15, b: -40 },
        head: { tilt: 3, turn: 0.2, mouth: tl ? 'talk' : 'smile', open: tl || 0.4, eyes: cheer > 0.5 ? 'happy' : 'normal', blink: motion.blink(t, 3) },
      }));
      S.noah.pose(seat(S, 'noah', {
        armL: { a: lerp(15, 160, cheer) - pump, b: -30 }, armR: { a: lerp(15, 160, cheer) + pump, b: -30 },
        head: { tilt: Math.sin(t * 8) * 3, mouth: tl || motion.talk(t, chip, 1) ? 'talk' : 'grin', open: tl || motion.talk(t, chip, 1) || 0.6, eyes: 'happy' },
      }));
      const tc = motion.talk(t, chip, 1) || tl;
      S.boss.pose(seat(S, 'boss', {
        armL: { a: 22, b: -95 }, armR: { a: 22, b: -95 },
        head: { tilt: t > chip.at ? -5 : 2, turn: -0.15, mouth: tc ? 'talk' : 'grin', open: tc || 0.5, raise: t > chip.at ? 1 : 0.3 },
      }));
    },
  };

  TS.scenes['no'] = {
    build,
    render(t, cfg, item) {
      const S = item.s;
      // tight on Lu and Noah
      drive(t, S, { x: lerp(820, 860, seg(t, 0, 2.6)), y: 470, zoom: 1.75 });
      const line = cfg.dialogue[0];
      const talk = motion.talk(t, line, 1);
      S.lu.pose(seat(S, 'lu', {
        armL: { a: 15, b: -50 }, armR: { a: 15, b: -50 },
        head: { tilt: -3, turn: 0.1, blink: 1, angry: 1, mouth: talk ? 'talk' : 'frown', open: talk || 0 },
      }));
      S.noah.pose(seat(S, 'noah', {
        armL: { a: 15, b: -40 }, armR: { a: 15, b: -40 },
        head: { tilt: 0, turn: -0.4, lookX: -1, eyes: 'wide', raise: 1, mouth: 'o', open: 0.5 },
      }));
      S.boss.pose(seat(S, 'boss', {
        armL: { a: 22, b: -95 }, armR: { a: 22, b: -95 },
        head: { tilt: 3, turn: -0.4, mouth: 'o', open: 0.5, raise: 1.2 },
      }));
    },
  };
})(window.TS);
