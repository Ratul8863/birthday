"use client";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    ctx = Ctx ? new Ctx() : null;
  }
  return ctx;
}

export function unlockSpinSound() {
  const context = audio();
  if (context && context.state === "suspended") {
    void context.resume();
  }
}

function click(frequency: number, gainValue: number, decay: number) {
  const context = audio();
  if (!context) return;
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.55), now + decay);
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(now);
  osc.stop(now + decay + 0.02);
}

/** Short peg click. Louder when the wheel is slowing down. */
export function playSpinTick(gapMs: number) {
  const slow = Math.min(1, Math.max(0, (gapMs - 40) / 220));
  click(520 - slow * 180, 0.045 + slow * 0.06, 0.035 + slow * 0.02);
}

/** Two quiet notes when the pointer settles. */
export function playSpinLand() {
  click(392, 0.07, 0.12);
  window.setTimeout(() => click(523, 0.08, 0.18), 90);
}
