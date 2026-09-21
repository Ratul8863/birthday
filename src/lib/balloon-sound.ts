"use client";

let shared: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!shared || shared.state === "closed") shared = new Ctx();
  if (shared.state === "suspended") void shared.resume();
  return shared;
}

/** Short balloon burst: a crack of noise plus a falling thump. */
export function playBalloonPop() {
  const ctx = context();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.85, now);
  master.connect(ctx.destination);

  const dur = 0.085;
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const env = (1 - i / length) ** 2.4;
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 1400 + Math.random() * 700;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.72, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  noise.connect(highpass);
  highpass.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);

  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(210 + Math.random() * 70, now);
  body.frequency.exponentialRampToValueAtTime(55, now + 0.08);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.38, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  body.connect(bodyGain);
  bodyGain.connect(master);
  body.start(now);
  body.stop(now + 0.11);
}
