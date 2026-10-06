// Clay-only changes to timeline.js (the 2D version stays as it was). Used by the player, voices.py and render.py.
// overrides[sceneId]:
//   duration             new scene length
//   dialogue[index]      fields that replace that line's fields, e.g. { pos: [x, y] } or { at: 5.3, text: 'Huh!!??' }
//   addDialogue          extra lines appended after the 2D ones
//   sfx[index], addSfx   the same for sound effects
// Clay-only dialogue fields (read by voices.py): say = what the voice speaks when it differs from the bubble,
// rise = pitch glide up across the line (1.3 = ends 30% higher), fx: 'scream' = stretched, distorted scream.
window.CLAY = { overrides: {
  'checklist': {
    duration: 7.0,
    dialogue: { 1: { at: 5.35, text: 'Huh!!??', say: 'Huh?', rise: 1.9, pos: [1660, 260] } },
    sfx: { 2: { at: 5.05 } },
  },
  'hey-noah': { dialogue: { 0: { pos: [420, 300] } } },
  'run': { dialogue: { 0: { fx: 'scream', say: 'Aaaaah!' } } },
  'hot-tub': { addDialogue: [{ at: 3.5, dur: 0.75, who: 'boss', text: 'Hmm?', say: 'Hmm?', rise: 1.2, pos: [560, 260] }] },
  'jump-in': { dialogue: { 0: { text: 'Hey Guys!{0.9}\nJump In!', dur: 2.95 } } },
  'lunchtime': { dialogue: { 0: { text: 'LUNCH TIME!' } } },
} };

window.CLAY.apply = function (tl) {
  const ov = window.CLAY.overrides || {};
  const patch = (list, by, add) => (list || []).map((x, i) => ({ ...x, ...((by || {})[i] || {}) })).concat(add || []);
  return { ...tl, scenes: tl.scenes.map(s => {
    const o = ov[s.id] || {};
    return { ...s, duration: o.duration || s.duration, dialogue: patch(s.dialogue, o.dialogue, o.addDialogue), sfx: patch(s.sfx, o.sfx, o.addSfx) };
  }) };
};
