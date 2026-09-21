"use client";

import confetti from "canvas-confetti";
import { prefersReducedMotion } from "@/lib/motion";

const COLORS = ["#C45C4A", "#C9A227", "#F7F5F2", "#D4A59A"];

export function fireConfetti(opts?: confetti.Options) {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  confetti({
    particleCount: isMobile ? 55 : 100,
    spread: 68,
    origin: { y: 0.55 },
    colors: COLORS,
    disableForReducedMotion: true,
    ...opts,
  });
}

export function fireCelebration() {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  const end = Date.now() + 1200;
  const frame = () => {
    confetti({
      particleCount: 24,
      angle: 60,
      spread: 52,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
    });
    confetti({
      particleCount: 24,
      angle: 120,
      spread: 52,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
