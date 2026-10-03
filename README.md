# Life at Tradesman: animated short (built entirely in code)

Source comic: `source/tradesman-comic.jpg` (1072x8000, 15 panels).
No image editor, no AI image/video model: characters, sets, lettering, sound and music are all drawn or synthesized by the JavaScript here.

## How it works
- **Every frame is a pure function of time.** `TS.player.renderAt(t)` draws the film at second `t`. The browser preview and the MP4 render call the same function, so they always match.
- **SVG puppets** (`src/characters.js`): Noah, Lu and the Boss are front-facing rigs. A scene sets a pose object (arm angles, leg lift, head tilt, eyes, brows, mouth shape, cape flap) and the drawing follows. `TS.motion` has reusable walk/run cycles, blinking and mouth flaps for dialogue.
- **Sets** (`src/backgrounds.js`, `src/scenes/_sets.js`): sky, hills, warehouses and a perspective parking lot, with a parallax camera (`TS.bg.camera`).
- **Comic effects** (`src/fx.js`): speech bubbles (typewriter text, tail auto-aims at the speaker's mouth), sound-effect lettering, flash/fade transitions.
- **Sound** (`src/audio.js`): Web Audio synth for effects and a procedural music loop. The MP4 uses an offline render of the same code.

## Where to change things
| Want to change | Edit |
| --- | --- |
| Dialogue text, timing, bubble position, sound cues, lettering, scene length or order, music volume | `timeline.js` |
| What happens inside a scene (staging, poses, camera) | `src/scenes/NN-name.js` |
| How a character looks (colors, hair, glasses, proportions) | `TS.CAST` / `BODY` in `src/characters.js` |
| A new sound | `SFX` in `src/audio.js`, then cue it by name in `timeline.js` |

## Commands
```
node tools/stills.mjs <outdir> 1.2 5.0 9.8    # PNG stills + contact sheet at given seconds (~5 s)
node tools/render.mjs renders/out.mp4          # full MP4 1080p30 with sound (~4x real time)
node tools/render.mjs out.mp4 --scene run --scale 0.5   # one scene, half size
node tools/build.mjs                           # single-file player -> dist/tradesman-short.html
```
Open `index.html` in a browser for the live player (scrub bar, scene buttons, space = play, arrow keys = step a frame).

## Scenes (all 15 comic panels, about 60 s)
1. `checklist` Noah ticks his work order: "Done.. Check..", "Huh?"
2. `hey-noah` Lu walks across the lot and waves: "Hey Noah!"
3. `run` Noah screams and bolts, clipboard goes PLINK PLINK
4. `phone` Noah calls the Boss mid-run: "Boss! Boss! Lu is Being Helpful Again!"
5. `hot-tub` The Boss in his hot tub: "I'll Take Care of It!!"
6. `chase` Lu reaches for Noah: "I Just... Wanna.... Help!!!!"
7. `screech` The brown sedan skids in
8. `jump-in` The Boss leans out: "Hey Guys! Jump In!"
9. `lunchtime` "LUNCHTIME!" / "CHIPOTLE!"
10. `no` Lu: "No!"
11. `bbq` Korean BBQ, THE END
