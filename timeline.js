// THE EDITABLE SCRIPT. Scene order, length, dialogue, sound effects and music live here.
// Times ("at", "dur") are seconds from the start of that scene.
// dialogue: who (noah | lu | boss, or a list for several speakers), text ("\n" = line break,
//           "{1}" = pause 1 second before the rest appears), pos = bubble centre on the 1920x1080 frame,
//           style: 'shout' gives the spiky bubble.
// sfx:      sound = synthesized sound name (see src/audio.js), gain = loudness (1 = normal),
//           text = comic lettering (optional), x/y/rot/size/color for the lettering, shake = jitter in px.
window.TIMELINE = {
  width: 1920, height: 1080, fps: 30,
  music: { track: 'bouncy', volume: 0.22 },
  scenes: [
    {
      id: 'checklist', duration: 6.2, transition: 'fade',
      dialogue: [
        { at: 1.5, dur: 2.6, who: 'noah', text: 'Done..{1}\nCheck..', pos: [1430, 250] },
        { at: 4.55, dur: 1.6, who: 'noah', text: 'Huh?', pos: [1440, 330] },
      ],
      sfx: [
        { at: 1.85, sound: 'tick' },
        { at: 3.1, sound: 'tick' },
        { at: 4.25, sound: 'huh' },
      ],
    },
    {
      id: 'hey-noah', duration: 5.6, transition: 'cut',
      dialogue: [
        { at: 2.35, dur: 3.1, who: 'lu', text: 'Hey Noah!', pos: [560, 330] },
      ],
      sfx: [
        { at: 0.2, sound: 'steps' }, { at: 0.75, sound: 'steps' }, { at: 1.3, sound: 'steps' },
        { at: 1.95, sound: 'whoosh' },
        { at: 2.5, sound: 'chime' },
      ],
    },
    {
      id: 'run', duration: 6.2, transition: 'flash',
      dialogue: [
        { at: 1.05, dur: 2.8, who: 'noah', text: 'AAAAAHH!!', pos: [1250, 210], style: 'shout' },
      ],
      sfx: [
        { at: 0.05, sound: 'sting' },
        { at: 1.0, sound: 'scream' },
        { at: 2.05, sound: 'plink', text: 'PLINK', x: 1150, y: 690, rot: -8, size: 92, color: '#f4f1e6' },
        { at: 2.4, sound: 'plink', text: 'PLINK', x: 1360, y: 770, rot: 6, size: 112, color: '#f4f1e6' },
        { at: 2.75, sound: 'plink', text: 'PLINK', x: 1210, y: 890, rot: -4, size: 76, color: '#f4f1e6' },
        { at: 3.9, sound: 'whoosh', text: 'ZOOM!', x: 1500, y: 860, rot: -10, size: 190, shake: 6, dur: 1.6, burst: '#e84a2e' },
      ],
    },
    {
      id: 'phone', duration: 5.6, transition: 'cut',
      dialogue: [
        { at: 0.45, dur: 5.0, who: 'noah', text: 'Boss! Boss!\nLu is Being{1}\n...{0.7}Helpful Again!', pos: [1450, 300] },
      ],
      sfx: [
        { at: 0.05, sound: 'ring' },
        { at: 0.2, sound: 'run' }, { at: 1.25, sound: 'run' }, { at: 2.3, sound: 'run' }, { at: 3.35, sound: 'run' }, { at: 4.4, sound: 'run' },
      ],
    },
    {
      id: 'hot-tub', duration: 6.8, transition: 'fade',
      dialogue: [
        { at: 4.25, dur: 2.45, who: 'boss', text: "I'll Take Care\nof It!!", pos: [560, 240] },
      ],
      sfx: [
        { at: 0.0, sound: 'bubbles' },
        { at: 0.25, text: 'BLUB BLUB', x: 360, y: 640, rot: -6, size: 84, color: '#bfe8ec', dur: 2.0 },
        { at: 1.1, sound: 'bubbles' },
        { at: 1.25, text: 'BLUB BLUB', x: 1640, y: 560, rot: 6, size: 84, color: '#bfe8ec', dur: 2.0 },
        { at: 2.6, sound: 'phonering', text: 'RING RING!', x: 520, y: 260, rot: -8, size: 100, shake: 4, dur: 1.0 },
        { at: 4.0, sound: 'bubbles' },
      ],
    },
    {
      id: 'chase', duration: 5.8, transition: 'flash',
      dialogue: [
        { at: 0.5, dur: 5.2, who: 'lu', text: 'I Just...{1}\nWanna....{1}\nHelp!!!!', pos: [1560, 240] },
      ],
      sfx: [
        { at: 0.0, sound: 'run' }, { at: 1.05, sound: 'run' }, { at: 2.1, sound: 'run' }, { at: 3.15, sound: 'run' }, { at: 4.2, sound: 'run' },
        { at: 0.1, sound: 'whoosh' },
      ],
    },
    {
      id: 'screech', duration: 4.4, transition: 'cut',
      dialogue: [],
      sfx: [
        { at: 0.0, sound: 'run' },
        { at: 1.3, sound: 'screech', gain: 1.6, text: 'SCREEEEEEEEEEEEECH', x: 1000, y: 330, rot: -5, size: 170, shake: 10, dur: 2.7, color: '#ffd23f' },
      ],
    },
    {
      id: 'jump-in', duration: 4.8, transition: 'cut',
      dialogue: [
        { at: 1.75, dur: 2.95, who: 'boss', text: 'Hey Guys!\nJump In!', pos: [1560, 220] },
      ],
      sfx: [
        { at: 0.1, sound: 'honk', gain: 1.4, text: 'HONNNK!', x: 330, y: 200, rot: -12, size: 140, shake: 7, dur: 1.5 },
      ],
    },
    {
      id: 'lunchtime', duration: 5.0, transition: 'fade',
      dialogue: [
        { at: 0.35, dur: 2.2, who: ['lu', 'noah', 'boss'], text: 'LUNCHTIME!', pos: [960, 140] },
        { at: 2.55, dur: 2.35, who: ['boss', 'noah'], text: 'CHIPOTLE!', pos: [1420, 210] },
      ],
      sfx: [
        { at: 0.35, sound: 'tada' },
      ],
    },
    {
      id: 'no', duration: 2.6, transition: 'cut',
      dialogue: [
        { at: 0.3, dur: 2.2, who: 'lu', text: 'No!', pos: [560, 190], style: 'shout' },
      ],
      sfx: [
        { at: 0.15, sound: 'scratch' },
      ],
    },
    {
      id: 'bbq', duration: 7.5, transition: 'fade',
      dialogue: [],
      sfx: [
        { at: 0.1, sound: 'sizzle' },
        { at: 2.3, sound: 'sizzle', text: 'SIZZLE!', x: 1300, y: 640, rot: 8, size: 120, dur: 2.0, shake: 3 },
        { at: 4.7, sound: 'tada' },
      ],
    },
  ],
};
