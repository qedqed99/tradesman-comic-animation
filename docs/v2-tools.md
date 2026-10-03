# Version 2: tools for a claymation (or other style) remake

Researched 2026-10-03. Prices and product status change fast; anything marked *(unverified)* came from a single web source I could not confirm.

## What the video showed
"Claude Opus 5.5 Is INSANE at Motion Graphics" (RandomAI). I could only read the transcript through a summarizer, not verbatim.
- **Level 1:** Claude Code + **Remotion** (videos written as React code, previewed in Remotion Studio). Detailed prompts with reference videos, colors and timing matter a lot.
- **Level 2:** Claude as an "orchestrator" connected to outside tools over MCP: **Blender** (3D, via Blender MCP), image, voice and music generators, plus **HyperFrames** as a Remotion alternative.
- Higgsfield, ElevenLabs and DeepSeek were not named in what I could read.

## The tools, by what they would add here
| Tool | What it adds | Cost | Claude can drive it? |
| --- | --- | --- | --- |
| **Blender (bpy)** | Real 3D clay look: clay materials, fingerprint texture, stop-motion stepping. Characters stay identical in every shot because they're models. | Free | **Yes, tested in this container**: installs in ~15 s, 720p clay frame renders in ~10 s on CPU. |
| **Remotion** / **HyperFrames** | A nicer editing timeline and preview studio for the same code-video approach as v1. | Free for individuals | Yes (npm). Not much gain over what v1 already does. |
| **Kokoro TTS** | Free voices on CPU, 50+ preset voices. Decent, not actor-quality. | Free | Yes |
| **ElevenLabs** | The best realistic voices, plus sound effects and music. Could even clone the real guys' voices from recordings (with their OK). | ~$6–11/mo starter plans | Yes, API |
| **Kling 3.0** | AI video with character reference images ("Elements"); good for expressive characters. | ~$0.11 per second of video *(unverified)* | Yes, API (direct or via fal.ai / Higgsfield) |
| **Google Veo 3.1** | AI video rated strong for clay texture; clips up to 8 s with sound. | ~$0.10–0.40 per second *(unverified)* | Yes, API |
| **Flux + LoRA (fal.ai / Replicate)** | Train a tiny custom model on our three characters so every generated still looks like them. Best tool for consistency in AI stills. | Pay per use | Yes, API |
| **Higgsfield** | A storefront bundling many video models (Kling, Seedance, etc.) under one account; pay-per-use API reportedly launched Sept 2026 *(unverified)*. | Pay per use or subscription | Yes, API *(unverified)* |
| **DeepSeek** | Text-only AI (cheap writing/coding). Makes no images, video or voice. | Cheap | Adds little; Claude already does this job. |
| **Midjourney** | Beautiful stills with character reference, but no official API. | ~$10+/mo | Not reliably |

## Where AI video still struggles
Clips are 5–10 s, so a short is stitched from many shots. Characters drift between shots (glasses, beanie, cape details) even with references. Lip sync on cartoon or clay faces is weak. You can't precisely control timing, hands or action, so you reroll a lot. Some services restrict depicting real people; check terms since this comic is based on three real people.

## My recommendation
**Tier A, free, start here:** Blender claymation. I build simple clay puppets of Noah, Lu and the Boss, reuse this project's timeline file and script, render at 12 fps with stop-motion jitter, and add free Kokoro voices. Fully controllable and perfectly consistent; it will look like clean "CG clay", not hand-squished clay.

**Tier B, ~$40–120/month while active:** fal.ai (one account gives Flux LoRA, Kling and Veo) + ElevenLabs. Make clay-style key frames of each panel, animate them shot by shot with image-to-video, voice with ElevenLabs. Richer look, less control, more rerolls.

**Best practical mix:** Blender for the whole film, then try AI only on one or two hero shots (the hot tub, the BBQ) and ElevenLabs for voices, to see if the extra look is worth the cost.
