// THE EDITABLE SCRIPT. Scene order, length, dialogue, sound effects and music live here.
// Times ("at", "dur") are seconds from the start of that scene.
// dialogue: who (noah | lu | boss), text ("\n" = line break), pos = bubble centre on the 1920x1080 frame,
//           style: 'shout' gives the spiky bubble.
// sfx:      sound = synthesized sound name (see src/audio.js), text = comic lettering (optional),
//           x/y/rot/size/color for the lettering, shake = jitter in px.
window.TIMELINE = {
  width: 1920, height: 1080, fps: 30,
  music: { track: 'bouncy', volume: 0.22 },
  scenes: [
    {
      id: 'checklist', duration: 4.8, transition: 'fade',
      dialogue: [
        { at: 0.5, dur: 2.1, who: 'noah', text: 'Done..\nCheck..', pos: [1430, 250] },
        { at: 3.15, dur: 1.6, who: 'noah', text: 'Huh?', pos: [1440, 330] },
      ],
      sfx: [
        { at: 1.05, sound: 'tick' },
        { at: 1.75, sound: 'tick' },
        { at: 2.85, sound: 'huh' },
      ],
    },
    {
      id: 'hey-noah', duration: 5.0, transition: 'cut',
      dialogue: [
        { at: 2.35, dur: 2.5, who: 'lu', text: 'Hey Noah!', pos: [560, 330] },
      ],
      sfx: [
        { at: 0.2, sound: 'steps' }, { at: 0.75, sound: 'steps' }, { at: 1.3, sound: 'steps' },
        { at: 1.95, sound: 'whoosh' },
        { at: 2.5, sound: 'chime' },
      ],
    },
    {
      id: 'run', duration: 5.6, transition: 'flash',
      dialogue: [
        { at: 1.05, dur: 2.6, who: 'noah', text: 'AAAAAHH!!', pos: [1250, 210], style: 'shout' },
      ],
      sfx: [
        { at: 0.05, sound: 'sting' },
        { at: 1.0, sound: 'scream' },
        { at: 2.05, sound: 'plink', text: 'PLINK', x: 1150, y: 690, rot: -8, size: 92, color: '#f4f1e6' },
        { at: 2.4, sound: 'plink', text: 'PLINK', x: 1360, y: 770, rot: 6, size: 112, color: '#f4f1e6' },
        { at: 2.75, sound: 'plink', text: 'PLINK', x: 1210, y: 890, rot: -4, size: 76, color: '#f4f1e6' },
        { at: 3.7, sound: 'whoosh', text: 'ZOOM!', x: 1500, y: 860, rot: -10, size: 190, shake: 6, dur: 1.4, burst: '#e84a2e' },
      ],
    },
  ],
};
