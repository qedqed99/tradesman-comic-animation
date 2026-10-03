// Clay-only tweaks to timeline.js values (the 3D framing differs from the 2D version).
// overrides[sceneId].dialogue[index] = fields that replace that line's fields, e.g. { pos: [x, y] }.
window.CLAY = { overrides: {
  'checklist': { dialogue: { 1: { pos: [1660, 260] } } },
  'hey-noah': { dialogue: { 0: { pos: [420, 300] } } },
} };
