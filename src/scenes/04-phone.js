// Scene 4: still running, Noah phones the Boss. "Boss! Boss! Lu is Being Helpful Again!"
(function (TS) {
  const { seg, el, set, lerp, motion, toStage } = TS;
  TS.scenes['phone'] = {
    build(root, cfg, item) {
      const S = TS.sets.parkingLot(root, { horizon: 610, scroll: true });
      const lu = TS.makePuppet(S.layers.actors.g, 'lu');
      const noah = TS.makePuppet(S.layers.actors.g, 'noah');
      const phone = TS.props.phone(noah.hand.R);
      set(phone.g, { transform: 'translate(-6 -6) rotate(-12)' });
      const lines = TS.bg.speedLines(el('g', {}, root), 21, 26);
      item.s = { S, lu, noah, lines };
      item.anchors = { noah: () => toStage(noah.mouthG, 0, 10) };
    },
    render(t, cfg, item) {
      const { S, lu, noah, lines } = item.s;
      S.sky.update(t + 60);
      S.scroller.update(-t * 1.7);
      TS.bg.camera(S.list, { x: 900 + Math.sin(t * 9) * 6, y: 500 + Math.abs(Math.sin(t * 10.7)) * 8, zoom: 1.25, rot: Math.sin(t * 7) * 0.5 });
      // Lu, small and far behind, still coming
      const ml = motion.stride(t, 3, 0.8);
      lu.pose({ x: 1330, y: 655, s: 0.18, lean: 5, ...ml, head: { mouth: 'grin', open: 0.5 } });
      const m = motion.stride(t, 3.4, 1);
      const talk = motion.talk(t, cfg.dialogue[0], 0.8);
      noah.pose({
        x: 780, y: 1500, s: 3.5, bob: m.bob * 0.8, lean: 3, armsFront: true,
        armL: m.armL, armR: { a: 135, b: 65 }, cape: { flap: 0.3, phase: m.cape.phase },
        head: { tilt: -4 + Math.sin(t * 10) * 2, turn: 0.15, lookX: 0.6, eyes: 'wide', worried: 1, raise: 0.6, mouth: talk ? 'talk' : 'scream', open: talk || 0.5 },
      });
      lines.update(t, 2400, 500, 0.7);
    },
  };
})(window.TS);
