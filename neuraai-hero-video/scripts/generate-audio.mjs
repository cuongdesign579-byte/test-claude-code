// Synthesizes the soundtrack for the NeuraAI hero video: a 10 s, 120 BPM music bed
// plus the UI sound effects. Everything is generated from code (no third-party samples)
// and is deterministic, so re-running produces identical files.
// Usage: node scripts/generate-audio.mjs  ->  public/audio/music.wav, public/audio/sfx/*.wav
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'public/audio');
const SR = 48000;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- primitives

let seed = 0x2545f491;
const noise = () => {
  seed ^= seed << 13;
  seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  seed >>>= 0;
  return (seed / 4294967296) * 2 - 1;
};

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const mono = (sec) => new Float32Array(Math.ceil(sec * SR));

class Track {
  constructor(sec) {
    this.n = Math.ceil(sec * SR);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  /** Mix a mono signal in at `at` seconds with equal-power panning (-1 … 1). */
  add(sig, at = 0, gain = 1, pan = 0) {
    const s0 = Math.round(at * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < sig.length; i++) {
      const j = s0 + i;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += sig[i] * gl;
      this.R[j] += sig[i] * gr;
    }
    return this;
  }
  mix(track, gain = 1) {
    for (let i = 0; i < Math.min(this.n, track.n); i++) {
      this.L[i] += track.L[i] * gain;
      this.R[i] += track.R[i] * gain;
    }
    return this;
  }
  /** Multiply both channels by gainAt(seconds). */
  shape(gainAt) {
    for (let i = 0; i < this.n; i++) {
      const g = gainAt(i / SR);
      this.L[i] *= g;
      this.R[i] *= g;
    }
    return this;
  }
  rms() {
    let s = 0;
    for (let i = 0; i < this.n; i++) s += this.L[i] ** 2 + this.R[i] ** 2;
    return Math.sqrt(s / (2 * this.n));
  }
  normalize(peak) {
    let max = 1e-9;
    for (let i = 0; i < this.n; i++) max = Math.max(max, Math.abs(this.L[i]), Math.abs(this.R[i]));
    return this.shape(() => peak / max);
  }
}

class Biquad {
  x1 = 0;
  x2 = 0;
  y1 = 0;
  y2 = 0;
  set(type, freq, q = 0.707) {
    const w = (TAU * Math.min(Math.max(freq, 10), SR * 0.45)) / SR;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === 'lp') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
    else if (type === 'hp') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha]; // band-pass, 0 dB peak
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Run a time-varying filter over a track in place. */
const filterTrack = (track, type, freqAt, q = 0.707) => {
  const fl = new Biquad();
  const fr = new Biquad();
  for (let i = 0; i < track.n; i++) {
    if (i % 64 === 0) {
      const f = freqAt(i / SR);
      fl.set(type, f, q);
      fr.set(type, f, q);
    }
    track.L[i] = fl.run(track.L[i]);
    track.R[i] = fr.run(track.R[i]);
  }
  return track;
};

/** Filtered noise with a moving cutoff and an amplitude curve (both functions of 0…1 progress). */
const noiseSweep = (dur, type, freqAt, ampAt, q = 0.8) => {
  const out = mono(dur);
  const bq = new Biquad();
  for (let i = 0; i < out.length; i++) {
    const p = i / out.length;
    if (i % 32 === 0) bq.set(type, freqAt(p), q);
    out[i] = bq.run(noise()) * ampAt(p);
  }
  return out;
};

/** Freeverb-style reverb; returns only the wet signal, scaled to `level` × the input RMS. */
const reverb = (track, {room = 0.84, damp = 0.3, level = 1} = {}) => {
  const scale = SR / 44100;
  const input = new Float32Array(track.n);
  for (let i = 0; i < track.n; i++) input[i] = (track.L[i] + track.R[i]) * 0.5;
  const run = (spread) => {
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((l) => ({
      b: new Float32Array(Math.round((l + spread) * scale)),
      i: 0,
      s: 0,
    }));
    const aps = [556, 441, 341, 225].map((l) => ({b: new Float32Array(Math.round((l + spread) * scale)), i: 0}));
    const out = new Float32Array(track.n);
    for (let n = 0; n < track.n; n++) {
      const x = input[n] * 0.015;
      let y = 0;
      for (const c of combs) {
        const o = c.b[c.i];
        c.s = o * (1 - damp) + c.s * damp;
        c.b[c.i] = x + c.s * room;
        if (++c.i >= c.b.length) c.i = 0;
        y += o;
      }
      for (const a of aps) {
        const o = a.b[a.i];
        const v = o - y;
        a.b[a.i] = y + o * 0.5;
        if (++a.i >= a.b.length) a.i = 0;
        y = v;
      }
      out[n] = y;
    }
    return out;
  };
  const wet = new Track(track.n / SR);
  wet.n = track.n;
  wet.L = run(0);
  wet.R = run(23);
  const inRms = track.rms();
  const wetRms = wet.rms();
  return wet.shape(() => (wetRms > 0 ? (level * inRms) / wetRms : 0));
};

// ---------------------------------------------------------------- instruments

const SAW_SIZE = 4096;
const SAW = new Float32Array(SAW_SIZE + 1);
for (let h = 1; h <= 32; h++)
  for (let i = 0; i <= SAW_SIZE; i++) SAW[i] += Math.sin((TAU * h * i) / SAW_SIZE) / h;
const readSaw = (phase) => {
  const p = (phase - Math.floor(phase)) * SAW_SIZE;
  const i = p | 0;
  return SAW[i] + (SAW[i + 1] - SAW[i]) * (p - i);
};

/** Plucked-string tone: harmonics that decay faster the higher they are. */
const pluck = (f, {dur = 1.2, bright = 1, harmonics = 10, decay = 0.55} = {}) => {
  const out = mono(dur);
  for (let h = 1; h <= harmonics && f * h < SR * 0.45; h++) {
    const amp = h ** -1.3 * (h === 1 ? 1 : bright);
    const tau = decay / h ** 0.8;
    const fh = f * h;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] += amp * Math.sin(TAU * fh * t) * Math.exp(-t / tau);
    }
  }
  for (let i = 0; i < out.length; i++) out[i] *= Math.min(1, i / SR / 0.002);
  return out;
};

/** FM bell / chime. */
const bell = (f, {dur = 0.9, ratio = 3.5, index = 2, decay = 0.35} = {}) => {
  const out = mono(dur);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const idx = index * Math.exp(-t / (decay * 0.4));
    out[i] = Math.sin(TAU * f * t + idx * Math.sin(TAU * f * ratio * t)) * Math.min(1, t / 0.001) * Math.exp(-t / decay);
  }
  return out;
};

/** Soft wooden mallet (marimba-like). */
const marimba = (f) => {
  const out = mono(0.7);
  const lp = new Biquad().set('lp', 3000);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] =
      (Math.sin(TAU * f * t) * Math.exp(-t / 0.26) +
        0.3 * Math.sin(TAU * 4 * f * t) * Math.exp(-t / 0.045) +
        0.08 * Math.sin(TAU * 9.9 * f * t) * Math.exp(-t / 0.018)) *
        Math.min(1, t / 0.0015) +
      lp.run(noise()) * 0.25 * Math.exp(-t / 0.004);
  }
  return out;
};

const kick = () => {
  const out = mono(0.45);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (45 + 85 * Math.exp(-t / 0.045)) / SR;
    const body = Math.sin(TAU * ph) * Math.exp(-t / 0.26) * Math.min(1, t / 0.0015);
    out[i] = Math.tanh(1.4 * body + noise() * 0.3 * Math.exp(-t / 0.003));
  }
  return out;
};

const clap = () => {
  const out = mono(0.4);
  const bp = new Biquad().set('bp', 1400, 0.9);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let env = Math.exp(-Math.max(0, t - 0.022) / 0.11);
    for (const b of [0, 0.011, 0.022]) if (t >= b && t < b + 0.011) env = Math.max(env, Math.exp(-(t - b) / 0.004));
    out[i] = bp.run(noise()) * env * 2.2;
  }
  return out;
};

// 808-style metallic hat: six detuned square waves through a high-pass.
const hat = (decay) => {
  const out = mono(decay * 6);
  const hp = new Biquad().set('hp', 7200, 0.9);
  const freqs = [205.3, 304.4, 369.6, 522.7, 540, 800].map((f) => f * 1.7);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let s = 0;
    for (const f of freqs) s += Math.sin(TAU * f * t) > 0 ? 1 : -1;
    out[i] = hp.run(s / 6 + noise() * 0.4) * Math.exp(-t / decay);
  }
  return out;
};

const crash = () => {
  const out = mono(2.2);
  const hp = new Biquad().set('hp', 4500, 0.7);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = hp.run(noise()) * Math.exp(-t / 0.55) * Math.min(1, t / 0.004);
  }
  return out;
};

const boom = () => {
  const out = mono(1.2);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (34 + 30 * Math.exp(-t / 0.25)) / SR;
    out[i] = Math.sin(TAU * ph) * Math.exp(-t / 0.45) * Math.min(1, t / 0.004);
  }
  return out;
};

const bassNote = (f, dur, tau = 0.16) => {
  const out = mono(dur + 0.05);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / tau) * (t > dur ? Math.exp(-(t - dur) / 0.01) : 1);
    out[i] = Math.tanh(1.8 * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t))) * env;
  }
  return out;
};

// ---------------------------------------------------------------- music bed

const music = () => {
  const DUR = 10;
  // vi – IV – I – V – I (Imaj9) in C, one chord per 2-second bar at 120 BPM.
  const chords = [
    {t: 0, bass: 45, notes: [57, 60, 64, 67]}, // Am7
    {t: 2, bass: 41, notes: [57, 60, 64, 65]}, // Fmaj7
    {t: 4, bass: 48, notes: [55, 60, 64, 67]}, // C
    {t: 6, bass: 43, notes: [55, 59, 62, 67]}, // G
    {t: 8, bass: 48, notes: [55, 59, 64, 67, 74]}, // Cmaj9
  ];
  const kicks = [];
  for (let t = 2; t < 8; t += 0.5) kicks.push(t);
  kicks.push(8);
  // Sidechain: duck sustained parts right after each kick.
  const duck = (depth) => (t) => {
    let last = -1;
    for (const k of kicks) if (k <= t) last = k;
    return last < 0 ? 1 : 1 - depth * Math.exp(-(t - last) / 0.11);
  };

  // Pad: three detuned saws per note, low-pass opening during the intro.
  const pad = new Track(DUR);
  chords.forEach((c, ci) => {
    const start = ci === 0 ? 0 : c.t - 0.12;
    const end = ci < chords.length - 1 ? chords[ci + 1].t + 0.25 : DUR;
    const attack = ci === 0 ? 1.0 : 0.25;
    for (const note of c.notes)
      [-0.09, 0, 0.09].forEach((det, vi) => {
        const f = mtof(note + det);
        const sig = mono(end - start);
        let ph = 0;
        for (let i = 0; i < sig.length; i++) {
          const t = i / SR;
          ph += f / SR;
          const env = Math.min(1, t / attack) * Math.min(1, (end - start - t) / 0.3);
          sig[i] = readSaw(ph + vi / 3) * env;
        }
        pad.add(sig, start, 0.05, [-0.6, 0, 0.6][vi]);
      });
  });
  filterTrack(pad, 'lp', (t) => (t < 2 ? 450 * (3400 / 450) ** (t / 2) : t < 8 ? 3400 : 3400 - (t - 8) * 700), 0.8);
  pad.shape(duck(0.5));

  // Arp: plucked 8th notes through the chord tones, ping-pong delayed.
  const arp = new Track(DUR);
  const pattern = [0, 1, 2, 3, 1, 2, 3, 2];
  for (let k = 0; k < 32; k++) {
    const t = k * 0.25;
    const c = chords[Math.floor(t / 2)];
    const note = c.notes[pattern[k % 8]] + 12;
    const intro = Math.min(1, t / 2);
    arp.add(pluck(mtof(note), {bright: 0.35 + 0.65 * intro, dur: 0.9}), t, 0.13 * (0.45 + 0.55 * intro), k % 2 ? 0.35 : -0.35);
  }
  // Final flourish into the resolving chord.
  [72, 76, 79, 83, 86, 88, 91].forEach((n, i) => arp.add(pluck(mtof(n), {dur: i === 6 ? 2 : 1}), 8 + i * 0.125, 0.12, (i % 2 ? 1 : -1) * 0.3));
  const echo = new Track(DUR);
  {
    const d = Math.round(0.375 * SR);
    const fb = 0.35;
    const a = new Float32Array(arp.n);
    const b = new Float32Array(arp.n);
    for (let n = d; n < arp.n; n++) {
      a[n] = (arp.L[n - d] + arp.R[n - d]) * 0.5 + fb * b[n - d];
      b[n] = fb * a[n - d];
    }
    echo.L = a;
    echo.R = b;
  }
  arp.mix(echo, 0.3).shape(duck(0.25));

  // Bass: 8ths with octave jumps on the off-beats, from the drop until the final chord.
  const bass = new Track(DUR);
  for (let t = 2; t < 8; t += 0.25) {
    const c = chords[Math.floor(t / 2)];
    const off = Math.round(t * 4) % 2 === 1;
    bass.add(bassNote(mtof(c.bass - 12 + (off ? 12 : 0)), 0.22), t, off ? 0.17 : 0.2);
  }
  bass.add(bassNote(mtof(36), 1.8, 0.7), 8, 0.3);
  bass.shape(duck(0.6));

  // Drums.
  const drums = new Track(DUR);
  const k = kick();
  for (const t of kicks) drums.add(k, t, 0.42);
  const cl = clap();
  const claps = new Track(DUR);
  for (let t = 2.5; t < 8; t += 1) claps.add(cl, t, 0.3);
  [7.625, 7.75, 7.875].forEach((t, i) => claps.add(cl, t, 0.12 + 0.06 * i));
  const ch = hat(0.028);
  const oh = hat(0.11);
  for (let t = 1; t < 8; t += 0.125) {
    const step = Math.round(t * 8) % 4;
    if (t >= 2 && step === 2) continue; // open hat takes the off-beat
    const build = t < 2 ? (t - 1) * 0.7 : 1;
    drums.add(ch, t, 0.085 * build * [0.7, 0.45, 1, 0.45][step], 0.25);
  }
  for (let t = 2.25; t < 8; t += 0.5) drums.add(oh, t, 0.1, 0.2);
  const cr = crash();
  drums.add(cr, 2, 0.1, -0.2).add(cr, 8, 0.12, 0.2);
  const bm = boom();
  drums.add(bm, 2, 0.24).add(bm, 8, 0.28);

  // Risers into the drop and into the final chord.
  const fx = new Track(DUR);
  fx.add(noiseSweep(2, 'bp', (p) => 300 * (5200 / 300) ** p, (p) => p ** 2.2), 0, 0.22);
  fx.add(noiseSweep(1, 'bp', (p) => 1500 * (6000 / 1500) ** p, (p) => p ** 2), 7, 0.1, 0.2);

  const bus = new Track(DUR).mix(pad).mix(arp).mix(bass).mix(drums).mix(claps).mix(fx);
  const send = new Track(DUR).mix(pad, 0.5).mix(arp, 0.7).mix(claps, 1);
  bus.mix(reverb(send, {room: 0.86, damp: 0.35, level: 0.55}));

  // Gentle saturation as a limiter, fade the tail, then normalize.
  bus.shape((t) => Math.min(1, t / 0.01) * (t > 9.2 ? Math.max(0, (10 - t) / 0.8) ** 1.5 : 1));
  for (let i = 0; i < bus.n; i++) {
    bus.L[i] = Math.tanh(bus.L[i] * 1.6);
    bus.R[i] = Math.tanh(bus.R[i] * 1.6);
  }
  return bus.normalize(0.5);
};

// ---------------------------------------------------------------- sound effects

const withSpace = (track, level) => track.mix(reverb(track, {room: 0.8, damp: 0.4, level}));

const sfx = {
  // Airy swell for the opening camera move.
  'whoosh-in': () => {
    const t = new Track(1.8);
    const sig = noiseSweep(1.6, 'bp', (p) => (p < 0.55 ? 300 * (2400 / 300) ** (p / 0.55) : 2400 * (900 / 2400) ** ((p - 0.55) / 0.45)), (p) => Math.sin(Math.PI * p) ** 1.5, 0.7);
    for (let i = 0; i < sig.length; i++) {
      const p = i / sig.length;
      t.add([sig[i]], i / SR, 1, -0.6 + 1.2 * p);
    }
    return withSpace(t, 0.4).normalize(0.22);
  },
  // ✨ popping in.
  pop: () => {
    const out = mono(0.25);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      ph += (520 + 680 * (1 - Math.exp(-t / 0.018))) / SR;
      out[i] = Math.sin(TAU * ph) * Math.min(1, t / 0.002) * Math.exp(-t / 0.05);
    }
    return withSpace(new Track(0.6).add(out), 0.25).normalize(0.38);
  },
  'twinkle-1': () => withSpace(new Track(1.2).add(bell(mtof(96), {decay: 0.3, ratio: 2.76}), 0, 1, -0.4), 0.6).normalize(0.15),
  'twinkle-2': () => withSpace(new Track(1.2).add(bell(mtof(100), {decay: 0.25, ratio: 2.76}), 0, 1, 0.4), 0.6).normalize(0.12),
  'twinkle-3': () => withSpace(new Track(1.2).add(bell(mtof(103), {decay: 0.22, ratio: 2.76}), 0, 1, -0.2), 0.6).normalize(0.1),
  // Light sweep across the headline: a rising pentatonic glissando of chimes over airy noise.
  shine: () => {
    const t = new Track(2.2);
    [84, 86, 88, 91, 93, 96, 98, 100, 103, 105].forEach((n, i) =>
      t.add(bell(mtof(n), {decay: 0.45, ratio: 2.01, index: 0.8}), i * 0.085, 0.4 + 0.6 * Math.sin((Math.PI * (i + 1)) / 11), -0.7 + i * 0.15),
    );
    t.add(noiseSweep(1.1, 'hp', (p) => 3500 * (9000 / 3500) ** p, (p) => Math.sin(Math.PI * p)), 0, 0.12);
    return withSpace(t, 0.7).normalize(0.45);
  },
  'swish-soft': () => withSpace(new Track(0.9).add(noiseSweep(0.6, 'bp', (p) => 2500 * (7000 / 2500) ** p, (p) => Math.sin(Math.PI * p) ** 2, 1.2)), 0.3).normalize(0.16),
  'hint-swipe': () => {
    const t = new Track(0.6).add(noiseSweep(0.35, 'bp', (p) => 3000 * (7500 / 3000) ** p, (p) => Math.sin(Math.PI * p) ** 2, 1.4), 0, 1, -0.3);
    return t.normalize(0.11);
  },
  // "10% discount!" highlight.
  coin: () => {
    const t = new Track(1.2);
    t.add(bell(mtof(83), {decay: 0.12, ratio: 1, index: 0.6}), 0, 0.7);
    t.add(bell(mtof(88), {decay: 0.4, ratio: 1, index: 0.6}), 0.075, 1);
    return withSpace(t, 0.4).normalize(0.32);
  },
  'cursor-swoosh': () => {
    const t = new Track(0.8);
    const sig = noiseSweep(0.5, 'bp', (p) => 1800 * (500 / 1800) ** p, (p) => Math.sin(Math.PI * p) ** 1.4, 0.9);
    for (let i = 0; i < sig.length; i++) t.add([sig[i]], i / SR, 1, 0.7 - 0.6 * (i / sig.length));
    return t.normalize(0.14);
  },
  hover: () => {
    const out = mono(0.12);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] = Math.sin(TAU * 1700 * t) * Math.exp(-t / 0.014) * Math.min(1, t / 0.0008);
    }
    return new Track(0.12).add(out).normalize(0.22);
  },
  // Mouse button down + up.
  click: () => {
    const t = new Track(0.25);
    const hp = new Biquad().set('hp', 2000);
    for (const [at, g] of [
      [0, 1],
      [0.05, 0.6],
    ]) {
      const out = mono(0.05);
      for (let i = 0; i < out.length; i++) {
        const s = i / SR;
        out[i] = hp.run(noise()) * 0.6 * Math.exp(-s / 0.002) + Math.sin(TAU * 3100 * s) * 0.3 * Math.exp(-s / 0.005) + Math.sin(TAU * 620 * s) * 0.4 * Math.exp(-s / 0.008);
      }
      t.add(out, at, g, 0.15);
    }
    return t.normalize(0.4);
  },
  // Confirmation after clicking "Purchase now": bright C-major arpeggio + soft thump.
  success: () => {
    const t = new Track(1.8);
    [84, 88, 91, 96].forEach((n, i) => t.add(bell(mtof(n), {decay: 0.5, ratio: 2, index: 0.9}), i * 0.06, 0.6 + i * 0.1, -0.3 + i * 0.2));
    const thump = mono(0.3);
    for (let i = 0; i < thump.length; i++) {
      const s = i / SR;
      thump[i] = Math.sin(TAU * (70 + 40 * Math.exp(-s / 0.03)) * s) * Math.exp(-s / 0.09);
    }
    t.add(thump, 0, 0.8);
    return withSpace(t, 0.6).normalize(0.38);
  },
  sparkle: () => {
    const t = new Track(1.8);
    [103, 98, 100, 96, 93, 91].forEach((n, i) => t.add(bell(mtof(n), {decay: 0.3, ratio: 2.76, index: 1.2}), i * 0.07, 0.5 + 0.1 * (i % 2), (i % 2 ? 1 : -1) * 0.5));
    t.add(noiseSweep(0.8, 'hp', (p) => 6000 + 3000 * p, (p) => Math.sin(Math.PI * p)), 0, 0.06);
    return withSpace(t, 0.7).normalize(0.28);
  },
};

// Headline words: ascending C-major pentatonic mallet hits.
[72, 74, 76, 79, 81, 84].forEach((n, i) => {
  sfx[`word-${i + 1}`] = () => withSpace(new Track(1).add(marimba(mtof(n)), 0, 1, -0.35 + i * 0.14), 0.35).normalize(0.24);
});
// Buttons springing in: a quick rising "bloop" with a soft body.
[
  ['button-1', 520],
  ['button-2', 700],
].forEach(([name, f]) => {
  sfx[name] = () => {
    const out = mono(0.3);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      ph += (f * (0.65 + 0.45 * (1 - Math.exp(-t / 0.025)))) / SR;
      out[i] = Math.sin(TAU * ph) * Math.min(1, t / 0.002) * Math.exp(-t / 0.07) + Math.sin(TAU * 140 * t) * 0.5 * Math.exp(-t / 0.04);
    }
    return withSpace(new Track(0.7).add(out, 0, 1, name === 'button-1' ? -0.15 : 0.2), 0.25).normalize(0.38);
  };
});
// Logos: soft plucks rising through the C chord.
[76, 79, 81, 84, 86].forEach((n, i) => {
  sfx[`logo-${i + 1}`] = () => withSpace(new Track(1).add(pluck(mtof(n), {dur: 0.6, decay: 0.25, harmonics: 6}), 0, 1, -0.6 + i * 0.3), 0.3).normalize(0.28);
});

// ---------------------------------------------------------------- output

const writeWav = (path, track) => {
  const data = Buffer.alloc(track.n * 4);
  for (let i = 0; i < track.n; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, track.L[i])) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, track.R[i])) * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // stereo
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
};

mkdirSync(join(OUT, 'sfx'), {recursive: true});
writeWav(join(OUT, 'music.wav'), music());
for (const [name, make] of Object.entries(sfx)) writeWav(join(OUT, 'sfx', `${name}.wav`), make());
console.log(`Wrote music.wav and ${Object.keys(sfx).length} sound effects to public/audio`);
