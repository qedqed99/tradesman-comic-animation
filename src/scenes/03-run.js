// Scene 3: Panic. Noah bolts, the clipboard goes flying, Lu jogs after him.
(function (TS) {
  const { seg, key, el, set, lerp, clamp, motion, toStage } = TS;
  const HZ = 560;
  // Noah's path toward camera (shot B), as pure functions of scene time
  const noahFeet = t => key(t, [[0.9, 750], [6.2, 2000, 'in']]);
  const noahX = t => key(t, [[0.9, 930], [6.2, 700, 'inOut']]);
  const noahS = t => TS.bg.depthScale(noahFeet(t), HZ, 300);

  TS.scenes['run'] = {
    build(root, cfg, item) {
      // shot A: reaction close-up
      const a = el('g', {}, root);
      const near = TS.sets.parkingLot(a, { horizon: 610 });
      const noahA = TS.makePuppet(near.layers.actors.g, 'noah');
      const clipA = TS.props.clipboard(noahA.hand.L);
      set(clipA.g, { transform: 'translate(-22 8) rotate(-7)' });
      clipA.setChecks([1, 1, 1, 0]);
      const linesA = TS.bg.speedLines(el('g', {}, a), 4, 30);
      // shot B: the run
      const b = el('g', {}, root);
      const wide = TS.sets.parkingLot(b, { horizon: HZ });
      const lu = TS.makePuppet(wide.layers.actors.g, 'lu');
      const flying = el('g', {}, wide.layers.actors.g);
      const clipB = TS.props.clipboard(flying);
      clipB.setChecks([1, 1, 1, 0]);
      const noah = TS.makePuppet(wide.layers.actors.g, 'noah');
      const linesB = TS.bg.speedLines(el('g', {}, b), 9, 34);
      item.s = { a, b, near, noahA, linesA, wide, lu, noah, flying, linesB };
      item.anchors = { noah: () => toStage(noah.mouthG, 0, 10) };
    },
    render(t, cfg, item) {
      const S = item.s;
      const shotB = t >= 0.9;
      S.a.setAttribute('display', shotB ? 'none' : 'inline');
      S.b.setAttribute('display', shotB ? 'inline' : 'none');
      if (!shotB) {
        S.near.sky.update(t + 45);
        const shake = Math.sin(t * 70) * 5 * seg(t, 0, 0.2);
        TS.bg.camera(S.near.list, { x: 840 + shake, y: 470, zoom: 1.4 + t * 0.15 });
        const scream = seg(t, 0.25, 0.75, 'out');
        S.noahA.pose({
          x: 760, y: 1460, s: 3.55, bob: 0,
          head: { tilt: -4 + Math.sin(t * 60) * 1.2, turn: 0.2, lookX: 0.5, eyes: 'wide', raise: 1.5, worried: 1, mouth: scream > 0.05 ? 'scream' : 'o', open: 0.5 + scream * 0.7 },
          armL: { a: 30, b: -95 }, armR: { a: 14, b: -60 },
        });
        S.linesA.update(t, 760, 470, seg(t, 0.1, 0.4));
        return;
      }
      // ---- shot B ----
      S.wide.sky.update(t + 45);
      TS.bg.camera(S.wide.list, { x: 960 + Math.sin(t * 23) * 4, y: 540 + Math.cos(t * 19) * 3, zoom: 1, rot: Math.sin(t * 17) * 0.4 });

      // Lu jogging after him in the distance
      const luOn = seg(t, 1.3, 1.8, 'out');
      const lf = key(t, [[1.3, 600], [6.2, 690, 'linear']]);
      const mL = motion.stride(t, 3.0, 0.8);
      S.lu.root.setAttribute('opacity', luOn.toFixed(2));
      S.lu.pose({ x: key(t, [[1.3, 1250], [6.2, 1120]]), y: lf, s: TS.bg.depthScale(lf, HZ, 440), lean: 5, ...mL,
        head: { mouth: 'grin', open: 0.5, raise: 0.8, blink: 0 } });

      // Noah running at the camera
      const s = noahS(t), fy = noahFeet(t), nx = noahX(t);
      const m = motion.stride(t, 3.4, 1);
      const line = cfg.dialogue[0];
      const talk = motion.talk(t, line, 0.5);
      const drop = 1.55;
      S.noah.pose({ x: nx, y: fy, s, lean: 3, ...m,
        head: { tilt: Math.sin(t * 21) * 2, eyes: 'wide', worried: 1, raise: 1, mouth: 'scream', open: talk ? 0.9 + talk * 0.2 : 0.7, blink: 0 } });

      // the clipboard: flies out of his hand, then bounces PLINK PLINK PLINK
      const plinks = cfg.sfx.filter(x => x.sound === 'plink').map(x => x.at);
      const sd = noahS(drop), x0 = noahX(drop) - 40 * sd, y0 = noahFeet(drop) - 150 * sd;
      const landX = x0 + 150, landY = noahFeet(drop) + 40;
      S.flying.setAttribute('display', t >= drop ? 'inline' : 'none');
      if (t >= drop) {
        let x, y, rot, flat;
        const [p1, p2, p3] = plinks;
        if (t < p1) { const p = (t - drop) / (p1 - drop); x = lerp(x0, landX, p); y = lerp(y0, landY, p * p) - Math.sin(p * Math.PI) * 120; rot = p * 400; flat = lerp(1, 0.45, p); }
        else {
          const hop = (a, b, h) => (t >= a && t < b ? Math.sin((t - a) / (b - a) * Math.PI) * h : 0);
          x = landX + clamp((t - p1) / (p3 - p1)) * 70;
          y = landY - hop(p1, p2, 70) - hop(p2, p3, 28);
          rot = 400 + clamp((t - p1) / (p3 - p1 + 0.3)) * 330;
          flat = 0.45;
        }
        set(S.flying, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(sd * 1.3).toFixed(3)} ${(sd * 1.3 * flat).toFixed(3)}) rotate(${(rot % 360).toFixed(1)}) translate(-41 50)` });
      }
      S.linesB.update(t, nx, fy - 160 * s, seg(t, 1.0, 1.6) * 0.8);
    },
  };
})(window.TS);
