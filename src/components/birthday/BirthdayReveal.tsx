"use client";

import { useEffect, useRef } from "react";
import { fireConfetti } from "@/components/birthday/confetti";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { gsap } from "@/lib/motion";
import { sfxReveal, sfxConfetti } from "@/lib/sfx";

export function BirthdayReveal() {
  const { config, setPhase, reducedMotion } = useExperience();
  const rootRef = useRef<HTMLElement>(null);
  const happyRef = useRef<HTMLSpanElement>(null);
  const birthdayRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    fireConfetti({ origin: { y: 0.35 }, particleCount: 120, spread: 100 });
    sfxReveal();
    sfxConfetti();
    const burst = window.setTimeout(() => {
      fireConfetti({ origin: { y: 0.6 }, particleCount: 60 });
      sfxConfetti();
    }, 500);

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([happyRef.current, birthdayRef.current, nameRef.current], {
          opacity: 1,
          scale: 1,
        });
        const t = window.setTimeout(() => setPhase("story"), 900);
        return () => window.clearTimeout(t);
      }

      const tl = gsap.timeline({
        onComplete: () => window.setTimeout(() => setPhase("story"), 1100),
      });
      tl.fromTo(
        happyRef.current,
        { opacity: 0, scale: 0.6, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" },
      )
        .fromTo(
          birthdayRef.current,
          { opacity: 0, scale: 1.08 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" },
          "-=0.15",
        )
        .fromTo(
          nameRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" },
          "-=0.1",
        );
    }, rootRef);

    return () => {
      window.clearTimeout(burst);
      ctx.revert();
    };
  }, [reducedMotion, setPhase]);

  return (
    <section
      ref={rootRef}
      className="flex h-[100svh] w-full min-w-0 flex-col items-center justify-center overflow-hidden stage-dark px-5 text-center"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-pearl/40">surprise</p>
      <h1 className="font-display mt-4 w-full min-w-0 max-w-full text-[clamp(1.9rem,10vw,6.5rem)] leading-[0.9]">
        <span ref={happyRef} className="block opacity-0">
          Happy
        </span>
        <span ref={birthdayRef} className="block italic text-accent opacity-0">
          Birthday
        </span>
      </h1>
      <p ref={nameRef} className="font-display mt-6 w-full min-w-0 max-w-full text-[clamp(1.8rem,6vw,3.5rem)] text-pearl opacity-0">
        {config.recipient.name}
      </p>
      <p className="mt-3 text-base text-pearl/50">Got you.</p>
    </section>
  );
}
