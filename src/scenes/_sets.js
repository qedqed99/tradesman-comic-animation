// Reusable "sets" that scenes dress and point a camera at.
(function (TS) {
  const { el } = TS;
  TS.sets = {
    // The warehouse parking lot from the comic. Returns parallax layers + a group for actors.
    parkingLot(root, { horizon = 600, buildings } = {}) {
      const layers = {
        sky: { g: el('g', {}, root), f: 0.1 },
        hills: { g: el('g', {}, root), f: 0.3 },
        bld: { g: el('g', {}, root), f: 0.65 },
        ground: { g: el('g', {}, root), f: 1 },
        actors: { g: el('g', {}, root), f: 1 },
      };
      const sky = TS.bg.sky(layers.sky.g);
      TS.bg.hills(layers.hills.g, horizon);
      (buildings || [
        { x: -420, y: horizon, w: 820, h: 150, doors: 3, windows: 1 },
        { x: 640, y: horizon + 4, w: 380, h: 92, wall: '#c8b597', doors: 1, windows: 2 },
        { x: 1300, y: horizon + 6, w: 560, h: 178, wall: '#a79a86', roof: '#8a7d6c', doors: 1, windows: 1, side: 60 },
        { x: 2000, y: horizon, w: 600, h: 120, doors: 2, windows: 1 },
      ]).forEach(b => TS.bg.warehouse(layers.bld.g, b));
      TS.bg.lot(layers.ground.g, horizon);
      return { layers, list: Object.values(layers), sky, horizon };
    },
  };
})(window.TS);
