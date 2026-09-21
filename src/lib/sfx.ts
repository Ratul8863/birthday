"use client";

let shared: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!shared || shared.state === "closed") shared = new Ctx();
  if (shared.state === "suspended") void shared.resume();
  return shared;
}

export function unlockSfx() {
  const c = ctx();
  if (c && c.state === "suspended") void c.resume();
}

function tone(
  freq: number,
  type: OscillatorType,
  vol: number,
  attack: number,
  decay: number,
  detune = 0,
) {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (detune) osc.detune.setValueAtTime(detune, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + attack + decay + 0.02);
}

function noise(dur: number, vol: number, highpass = 800) {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = (1 - i / len) ** 2;
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = highpass;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(hp);
  hp.connect(g);
  g.connect(c.destination);
  src.start(now);
}

/* ── Gate pull creak: rising pitch as the cord stretches ── */
export function sfxGatePull() {
  tone(120, "sawtooth", 0.04, 0.01, 0.15);
}

/* ── Gate snap: the cord releases and whooshes upward ── */
export function sfxGateSnap() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
  g.gain.setValueAtTime(0.14, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.37);
  noise(0.08, 0.12, 2000);
}

/* ── Confetti sparkle burst ── */
export function sfxConfetti() {
  tone(1200, "sine", 0.06, 0.005, 0.12);
  setTimeout(() => tone(1600, "sine", 0.05, 0.005, 0.1), 40);
  setTimeout(() => tone(2000, "sine", 0.04, 0.005, 0.08), 80);
}

/* ── Big reveal: "Happy Birthday" splash ── */
export function sfxReveal() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  [392, 523, 659].forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now + i * 0.12);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.45);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.47);
  });
}

/* ── Slide transition: smooth swoosh ── */
export function sfxSlideTransition() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const len = Math.floor(c.sampleRate * 0.25);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.sin(t * Math.PI) * 0.6;
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(600, now);
  bp.frequency.linearRampToValueAtTime(2200, now + 0.15);
  bp.frequency.linearRampToValueAtTime(400, now + 0.25);
  bp.Q.value = 1.2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.08, now);
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(now);
}

/* ── Seal break: wax crack ── */
export function sfxSealBreak() {
  noise(0.06, 0.18, 1800);
  tone(320, "square", 0.06, 0.005, 0.08);
  setTimeout(() => noise(0.04, 0.1, 2400), 30);
}

/* ── Letter unfold: paper rustle ── */
export function sfxLetterUnfold() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const dur = 0.35;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.sin(t * Math.PI) * 0.4;
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3000;
  const g = c.createGain();
  g.gain.setValueAtTime(0.09, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(hp);
  hp.connect(g);
  g.connect(c.destination);
  src.start(now);
}

/* ── Card toss / swipe: whoosh ── */
export function sfxCardToss() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const len = Math.floor(c.sampleRate * 0.18);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(800, now);
  bp.frequency.exponentialRampToValueAtTime(3000, now + 0.09);
  bp.frequency.exponentialRampToValueAtTime(500, now + 0.18);
  bp.Q.value = 2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.1, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(now);
}

/* ── Lantern light: soft warm chime ── */
export function sfxLanternLight() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const notes = [523, 659];
  notes.forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now + i * 0.06);
    g.gain.setValueAtTime(0, now + i * 0.06);
    g.gain.linearRampToValueAtTime(0.07, now + i * 0.06 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.35);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.37);
  });
}

/* ── Lantern note reveal: soft paper sound ── */
export function sfxNoteReveal() {
  noise(0.12, 0.06, 3200);
  tone(440, "sine", 0.03, 0.01, 0.18);
}

/* ── Candle ignition: match strike + tiny flame ── */
export function sfxCandleLight() {
  noise(0.05, 0.08, 4000);
  tone(880, "sine", 0.04, 0.005, 0.15);
}

/* ── Wish complete: the ring fills – warm glow chord ── */
export function sfxWishComplete() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  [330, 415, 523].forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.06 - i * 0.01, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.72);
  });
}

/* ── Blow candles: wind gust ── */
export function sfxBlowCandles() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const dur = 0.5;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = t < 0.15 ? t / 0.15 : (1 - t) / 0.85;
    data[i] = (Math.random() * 2 - 1) * env * 0.7;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(400, now);
  bp.frequency.linearRampToValueAtTime(1200, now + 0.15);
  bp.frequency.linearRampToValueAtTime(300, now + dur);
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(now);
}

/* ── Cake slice: knife cut ── */
export function sfxCakeSlice() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
  g.gain.setValueAtTime(0.07, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.24);
  noise(0.12, 0.06, 1200);
}

/* ── Prize reveal fanfare ── */
export function sfxPrizeReveal() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    const delay = i * 0.08;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now + delay);
    g.gain.setValueAtTime(0, now + delay);
    g.gain.linearRampToValueAtTime(0.07, now + delay + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.4);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.42);
  });
  setTimeout(() => noise(0.05, 0.05, 3000), 200);
}

/* ── Prize collect: satisfying cha-ching ── */
export function sfxCollect() {
  tone(880, "sine", 0.07, 0.005, 0.1);
  setTimeout(() => tone(1320, "sine", 0.06, 0.005, 0.2), 60);
}

/* ── Celebration: party cheer ── */
export function sfxCelebration() {
  sfxConfetti();
  setTimeout(() => {
    tone(523, "square", 0.04, 0.005, 0.12);
    tone(659, "square", 0.035, 0.005, 0.12);
  }, 100);
  setTimeout(() => tone(784, "square", 0.04, 0.005, 0.18), 200);
}

/* ── Seal stamp: thud on paper ── */
export function sfxSealStamp() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
  g.gain.setValueAtTime(0.12, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.16);
  noise(0.04, 0.08, 1500);
}

/* ── Vault unlock: click + sparkle ── */
export function sfxUnlock() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const click = c.createOscillator();
  const cg = c.createGain();
  click.type = "square";
  click.frequency.setValueAtTime(1600, now);
  cg.gain.setValueAtTime(0.08, now);
  cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  click.connect(cg);
  cg.connect(c.destination);
  click.start(now);
  click.stop(now + 0.05);
  setTimeout(() => {
    tone(880, "sine", 0.06, 0.005, 0.15);
    setTimeout(() => tone(1320, "sine", 0.05, 0.005, 0.2), 60);
  }, 30);
}

/* ── Wrong answer: dull buzz ── */
export function sfxDeny() {
  tone(180, "square", 0.06, 0.01, 0.12);
  setTimeout(() => tone(140, "square", 0.05, 0.01, 0.15), 80);
}

/* ── Countdown tick: during the 8-second hold ── */
export function sfxCountdownTick() {
  tone(660, "sine", 0.04, 0.003, 0.06);
}

/* ── Soft button tap: universal small click ── */
export function sfxTap() {
  tone(800, "sine", 0.03, 0.003, 0.04);
}

/* ── Note send: whoosh up ── */
export function sfxNoteSend() {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}

/* ═══════════════════════════════════════════════════════════
   Happy Birthday song + clapping — plays when cake is cut.
   Fully synthesized, no audio files.
   ═══════════════════════════════════════════════════════════ */

type HBDHandle = { stop: () => void };
let activeHBD: HBDHandle | null = null;

const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23;
const G4 = 392.00, A4 = 440.00, Bb4 = 466.16, C5 = 523.25;

type NoteEntry = [freq: number, start: number, dur: number];

const BPM = 140;
const BEAT = 60 / BPM;

function b(beats: number) { return beats * BEAT; }

const MELODY: NoteEntry[] = [
  // "Happy birthday to you"
  [C4,  b(0),    b(0.75)],
  [C4,  b(0.75), b(0.25)],
  [D4,  b(1),    b(1)],
  [C4,  b(2),    b(1)],
  [F4,  b(3),    b(1)],
  [E4,  b(4),    b(2)],
  // "Happy birthday to you"
  [C4,  b(6),    b(0.75)],
  [C4,  b(6.75), b(0.25)],
  [D4,  b(7),    b(1)],
  [C4,  b(8),    b(1)],
  [G4,  b(9),    b(1)],
  [F4,  b(10),   b(2)],
  // "Happy birthday dear …"
  [C4,  b(12),   b(0.75)],
  [C4,  b(12.75),b(0.25)],
  [C5,  b(13),   b(1)],
  [A4,  b(14),   b(1)],
  [F4,  b(15),   b(0.75)],
  [E4,  b(15.75),b(0.25)],
  [D4,  b(16),   b(2)],
  // "Happy birthday to you"
  [Bb4, b(18),   b(0.75)],
  [Bb4, b(18.75),b(0.25)],
  [A4,  b(19),   b(1)],
  [F4,  b(20),   b(1)],
  [G4,  b(21),   b(1)],
  [F4,  b(22),   b(2)],
];

const HARMONY: NoteEntry[] = [
  [F4 / 2, b(0),  b(6)],
  [C4 / 2, b(6),  b(6)],
  [F4 / 2, b(12), b(4)],
  [Bb4 / 2, b(16), b(2)],
  [C4,     b(18), b(4)],
  [F4 / 2, b(22), b(2)],
];

const CLAP_BEATS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

function scheduleNote(
  c: AudioContext,
  master: GainNode,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.015);
  g.gain.setValueAtTime(vol, start + dur - 0.03);
  g.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.01);
  return osc;
}

function scheduleClap(c: AudioContext, master: GainNode, time: number) {
  const dur = 0.06;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = (1 - i / len) ** 3;
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800 + Math.random() * 600;
  bp.Q.value = 1.5;
  const g = c.createGain();
  g.gain.setValueAtTime(0.22, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(time);
  return src;
}

/**
 * Play a full synthesized "Happy Birthday" melody with clapping.
 * Returns a handle to stop it early if needed.
 * `onDuckMusic` is called with a volume factor: 0.15 when song starts,
 * 1.0 when it finishes, so the BG music ducks.
 */
export function playHappyBirthday(
  onDuckMusic?: (factor: number) => void,
): HBDHandle {
  if (activeHBD) activeHBD.stop();

  const c = ctx();
  if (!c) {
    const handle: HBDHandle = { stop: () => {} };
    activeHBD = handle;
    return handle;
  }

  onDuckMusic?.(0.15);

  const master = c.createGain();
  master.gain.setValueAtTime(0.55, c.currentTime);
  master.connect(c.destination);

  const now = c.currentTime + 0.1;
  const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];

  for (const [freq, start, dur] of MELODY) {
    sources.push(scheduleNote(c, master, freq, now + start, dur, "sine", 0.18));
    sources.push(scheduleNote(c, master, freq, now + start, dur, "triangle", 0.06));
  }

  for (const [freq, start, dur] of HARMONY) {
    sources.push(scheduleNote(c, master, freq, now + start, dur, "triangle", 0.07));
  }

  for (const beat of CLAP_BEATS) {
    sources.push(scheduleClap(c, master, now + b(beat)));
    sources.push(scheduleClap(c, master, now + b(beat + 0.5)));
  }

  const totalDuration = b(24) + 0.5;
  const fadeTimer = window.setTimeout(() => {
    const t = c.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 0.5);
  }, (totalDuration - 0.5) * 1000);

  const restoreTimer = window.setTimeout(() => {
    onDuckMusic?.(1.0);
    activeHBD = null;
  }, totalDuration * 1000);

  function stop() {
    window.clearTimeout(fadeTimer);
    window.clearTimeout(restoreTimer);
    if (!c) return;
    const t = c.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 0.3);
    setTimeout(() => {
      for (const s of sources) {
        try { s.stop(); } catch { /* already stopped */ }
      }
      master.disconnect();
    }, 350);
    onDuckMusic?.(1.0);
    if (activeHBD === handle) activeHBD = null;
  }

  const handle: HBDHandle = { stop };
  activeHBD = handle;
  return handle;
}
