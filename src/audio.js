// All sound is synthesized with the Web Audio API: no audio files, no samples.
// The same code drives live playback and the offline render that goes into the MP4.
(function (TS) {
  let noiseBuf = null;
  function noise(ctx) {
    if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate && noiseBuf._ctx === ctx) return noiseBuf;
    const r = TS.rng(99), len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
    noiseBuf._ctx = ctx;
    return noiseBuf;
  }
  function env(ctx, dest, t, peak, a, d) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(dest);
    return g;
  }
  function osc(ctx, type, f0, f1, t, dur, out) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (out) o.connect(out); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noiseHit(ctx, out, t, dur, type, f0, f1, q = 1) {
    const s = ctx.createBufferSource(); s.buffer = noise(ctx);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    s.connect(f); f.connect(out); s.start(t, (t * 7.31) % 1.5); s.stop(t + dur + 0.05);
  }

  // ---- sound library: name -> (ctx, out, time) ----------------------------------
  const SFX = {
    pop(ctx, out, t) { osc(ctx, 'sine', 700, 260, t, 0.09, env(ctx, out, t, 0.35, 0.005, 0.1)); },
    tick(ctx, out, t) {
      noiseHit(ctx, env(ctx, out, t, 0.5, 0.003, 0.06), t, 0.06, 'highpass', 3000, 5000);
      noiseHit(ctx, env(ctx, out, t + 0.07, 0.4, 0.003, 0.08), t + 0.07, 0.08, 'highpass', 2500, 4000);
    },
    huh(ctx, out, t) { const g = env(ctx, out, t, 0.28, 0.02, 0.35); osc(ctx, 'triangle', 380, 900, t, 0.35, g); },
    steps(ctx, out, t) { for (const k of [0, 0.27]) osc(ctx, 'sine', 120, 55, t + k, 0.09, env(ctx, out, t + k, 0.45, 0.004, 0.1)); },
    whoosh(ctx, out, t) { noiseHit(ctx, env(ctx, out, t, 0.45, 0.12, 0.35), t, 0.45, 'bandpass', 400, 3200, 2); },
    chime(ctx, out, t) { [784, 988, 1175].forEach((f, i) => osc(ctx, 'sine', f, f, t + i * 0.07, 0.5, env(ctx, out, t + i * 0.07, 0.16, 0.01, 0.5))); },
    sting(ctx, out, t) {
      [196, 233, 294, 392].forEach(f => osc(ctx, 'sawtooth', f, f * 0.98, t, 0.6, env(ctx, out, t, 0.09, 0.01, 0.6)));
      noiseHit(ctx, env(ctx, out, t, 0.4, 0.002, 0.25), t, 0.25, 'lowpass', 900, 200);
    },
    scream(ctx, out, t) {
      // cartoon slide-whistle panic with vibrato
      const g = env(ctx, out, t, 0.2, 0.05, 1.6);
      const o = osc(ctx, 'square', 520, 1300, t, 1.6, null);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 9; const lg = ctx.createGain(); lg.gain.value = 40;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 1.7);
      o.connect(lp); lp.connect(g);
    },
    plink(ctx, out, t) {
      [2350, 3530, 5100].forEach((f, i) => osc(ctx, 'sine', f, f * 0.995, t, 0.35, env(ctx, out, t, 0.14 / (i + 1), 0.002, 0.35 - i * 0.08)));
      noiseHit(ctx, env(ctx, out, t, 0.25, 0.001, 0.03), t, 0.03, 'highpass', 4000, 6000);
    },
    // phone dialing: two quick beeps
    ring(ctx, out, t) { for (const k of [0, 0.16]) osc(ctx, 'sine', 1320, 1320, t + k, 0.1, env(ctx, out, t + k, 0.18, 0.005, 0.1)); },
    // incoming call: classic double trill
    phonering(ctx, out, t) {
      for (const k of [0, 0.5]) for (let i = 0; i < 8; i++) {
        const f = i % 2 ? 1180 : 940, tt = t + k + i * 0.04;
        osc(ctx, 'square', f, f, tt, 0.04, env(ctx, out, tt, 0.06, 0.003, 0.04));
      }
    },
    // hot tub: a burst of bubbly blips over low rumble
    bubbles(ctx, out, t) {
      noiseHit(ctx, env(ctx, out, t, 0.25, 0.2, 1.4), t, 1.6, 'lowpass', 300, 200);
      const r = TS.rng(Math.floor(t * 100));
      for (let i = 0; i < 14; i++) { const k = t + r() * 1.5, f = 300 + r() * 500; osc(ctx, 'sine', f, f * 2.2, k, 0.06, env(ctx, out, k, 0.12, 0.004, 0.06)); }
    },
    // quick running footsteps for about a second
    run(ctx, out, t) { for (let k = 0; k < 7; k++) osc(ctx, 'sine', 140, 60, t + k * 0.15, 0.07, env(ctx, out, t + k * 0.15, 0.35, 0.003, 0.08)); },
    // tyre screech: squealing band of noise plus a wobbling whine
    screech(ctx, out, t) {
      const D = 2.3;
      noiseHit(ctx, env(ctx, out, t, 0.9, 0.04, D), t, D + 0.05, 'bandpass', 2700, 1700, 8);
      noiseHit(ctx, env(ctx, out, t, 0.45, 0.04, D), t, D + 0.05, 'bandpass', 1200, 900, 5);
      const g = env(ctx, out, t, 0.22, 0.04, D);
      const o = osc(ctx, 'sawtooth', 2000, 1400, t, D + 0.05, null);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 23; const lg = ctx.createGain(); lg.gain.value = 70;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + D + 0.1);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 3; o.connect(bp); bp.connect(g);
    },
    // big air horn: a minor-chord stack of buzzy saws, about 1.4 s
    honk(ctx, out, t) {
      const D = 1.4;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(out);
      const g = ctx.createGain(); g.connect(lp);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.06);
      g.gain.setValueAtTime(0.3, t + D - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
      for (const f of [233, 277, 349, 466]) { osc(ctx, 'sawtooth', f, f * 0.995, t, D, g); osc(ctx, 'sawtooth', f * 1.004, f, t, D, g); }
    },
    // record scratch for the "No!"
    scratch(ctx, out, t) {
      noiseHit(ctx, env(ctx, out, t, 0.45, 0.01, 0.12), t, 0.14, 'bandpass', 900, 2600, 4);
      noiseHit(ctx, env(ctx, out, t + 0.13, 0.35, 0.01, 0.16), t + 0.13, 0.18, 'bandpass', 2400, 700, 4);
    },
    sizzle(ctx, out, t) { noiseHit(ctx, env(ctx, out, t, 0.18, 0.3, 2.5), t, 2.8, 'highpass', 5000, 6500, 0.7); },
    tada(ctx, out, t) { [523, 659, 784, 1047].forEach((f, i) => osc(ctx, 'triangle', f, f, t + i * 0.09, 0.6, env(ctx, out, t + i * 0.09, 0.16, 0.01, 0.7))); },
  };

  // ---- background music: a bouncy procedural loop -------------------------------
  const MUSIC = {
    bouncy(ctx, out, from, to) {
      const bpm = 132, beat = 60 / bpm;
      const prog = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]]; // C G Am F
      const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
      const melody = [72, null, 76, 74, 72, null, 69, null, 71, null, 74, 72, 71, null, 67, null, 69, null, 72, 71, 69, null, 64, null, 65, 67, 69, 67, 65, null, 62, null];
      const first = Math.floor(from / beat);
      for (let b = first; b * beat < to; b++) {
        const t = b * beat - from;
        if (t < -0.01) continue;
        const ch = prog[Math.floor(b / 4) % 4];
        osc(ctx, 'triangle', mtof(ch[0] - 12), mtof(ch[0] - 12), t, beat * 0.8, env(ctx, out, t, 0.5, 0.01, beat * 0.7));
        // off-beat chord stabs
        ch.forEach(n => osc(ctx, 'square', mtof(n + 12), mtof(n + 12), t + beat / 2, 0.12, env(ctx, out, t + beat / 2, 0.035, 0.005, 0.12)));
        // kick + hat
        if (b % 2 === 0) osc(ctx, 'sine', 150, 45, t, 0.14, env(ctx, out, t, 0.6, 0.003, 0.15));
        noiseHit(ctx, env(ctx, out, t + beat / 2, 0.08, 0.002, 0.04), t + beat / 2, 0.04, 'highpass', 7000, 8000);
        // melody on eighths
        for (const h of [0, 1]) {
          const m = melody[(b * 2 + h) % melody.length];
          if (m) osc(ctx, 'triangle', mtof(m), mtof(m), t + h * beat / 2, beat * 0.45, env(ctx, out, t + h * beat / 2, 0.11, 0.01, beat * 0.42));
        }
      }
    },
  };

  // schedule every cue whose time is >= from, relative to ctx time `base`
  function schedule(ctx, dest, cues, music, from, to) {
    const sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(dest);
    const musicBus = ctx.createGain(); musicBus.gain.value = music ? music.volume : 0; musicBus.connect(dest);
    if (music && MUSIC[music.track]) MUSIC[music.track](ctx, musicBus, from, to);
    for (const c of cues) {
      if (c.t < from - 0.02 || c.t > to) continue;
      const fn = SFX[c.sound];
      if (!fn) { console.warn('unknown sound', c.sound); continue; }
      const g = ctx.createGain(); g.gain.value = c.gain == null ? 1 : c.gain; g.connect(sfxBus);
      fn(ctx, g, Math.max(0, c.t - from));
    }
  }

  // master bus: the browser's default compressor, then a soft clipper so loud effects
  // (screech, horn) get rounded off instead of distorting
  function master(ctx) {
    const comp = ctx.createDynamicsCompressor();
    const clip = ctx.createWaveShaper();
    const curve = new Float32Array(2048);
    for (let i = 0; i < curve.length; i++) { const x = (i / (curve.length - 1)) * 2 - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6) * 0.94; }
    clip.curve = curve;
    comp.connect(clip); clip.connect(ctx.destination);
    return comp;
  }

  // offline render -> base64 WAV (used by tools/render.mjs)
  async function renderWav(cues, music, from, to, sampleRate = 48000) {
    const ctx = new OfflineAudioContext(2, Math.ceil((to - from) * sampleRate), sampleRate);
    schedule(ctx, master(ctx), cues, music, from, to);
    const buf = await ctx.startRendering();
    const n = buf.length, ch = [buf.getChannelData(0), buf.getChannelData(1)];
    const out = new DataView(new ArrayBuffer(44 + n * 4));
    const str = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); str(8, 'WAVEfmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
    out.setUint32(24, sampleRate, true); out.setUint32(28, sampleRate * 4, true);
    out.setUint16(32, 4, true); out.setUint16(34, 16, true); str(36, 'data'); out.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < 2; c++, o += 2) out.setInt16(o, Math.max(-1, Math.min(1, ch[c][i])) * 32767, true);
    let bin = ''; const bytes = new Uint8Array(out.buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  TS.audio = { SFX, MUSIC, schedule, renderWav, master };
})(window.TS);
