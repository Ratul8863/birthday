"use client";

import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import { fireConfetti } from "@/components/birthday/confetti";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { gsap } from "@/lib/motion";
import { sfxGatePull, sfxGateSnap, sfxConfetti, unlockSfx } from "@/lib/sfx";

function FitLine({
  text,
  className,
  max,
  min,
}: {
  text: string;
  className?: string;
  max: number;
  min: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const fit = () => {
      const available = parent.clientWidth;
      if (available <= 0) return;
      let size = max;
      el.style.fontSize = `${size}px`;
      let guard = 0;
      while (el.scrollWidth > available && size > min && guard < 12) {
        const next = Math.max(min, (size * available) / el.scrollWidth - 0.5);
        if (next >= size - 0.1) break;
        size = next;
        el.style.fontSize = `${size}px`;
        guard += 1;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    document.fonts?.ready.then(fit).catch(() => undefined);
    document.fonts?.addEventListener("loadingdone", fit);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", fit);
    };
  }, [text, max, min]);

  return (
    <span ref={ref} className={`block whitespace-nowrap ${className ?? ""}`}>
      {text}
    </span>
  );
}

export function SurpriseGate() {
  const { config, startExperience, reducedMotion } = useExperience();
  const [opening, setOpening] = useState(false);
  const [pullDist, setPullDist] = useState(0);

  const orbRef = useRef<HTMLDivElement>(null);
  const cordRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullRef = useRef(0);
  const pullingRef = useRef(false);
  const openingRef = useRef(false);
  const openRef = useRef<(() => void) | null>(null);
  const maxPull = 96;

  const triggerOpen = useCallback(async () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    sfxGateSnap();

    const tl = gsap.timeline();
    
    // Snapping effect
    tl.to(orbRef.current, {
      y: 18,
      duration: 0.1,
      ease: "power2.in"
    })
    .to(orbRef.current, {
      y: -window.innerHeight,
      opacity: 0,
      scale: 0.5,
      duration: 0.6,
      ease: "power4.in"
    }, "+=0.05")
    .to(cordRef.current, {
      height: 0,
      duration: 0.4,
      ease: "power4.in"
    }, "-=0.4");

    fireConfetti({ 
      particleCount: reducedMotion ? 0 : 150, 
      origin: { y: 0.8 }, 
      spread: 120,
      colors: ['#d9aa1a', '#fdfcfb', '#d6513a']
    });
    sfxConfetti();

    await new Promise(r => setTimeout(r, 800));
    await startExperience();
  }, [reducedMotion, startExperience]);

  useEffect(() => {
    openRef.current = () => {
      void triggerOpen();
    };
  }, [triggerOpen]);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    const springBack = () => {
      const obj = { val: pullRef.current };
      gsap.to(obj, {
        val: 0,
        duration: 0.45,
        ease: "power2.out",
        onUpdate: () => {
          pullRef.current = obj.val;
          setPullDist(obj.val);
        },
      });
    };

    const onDown = (event: PointerEvent) => {
      if (openingRef.current || event.button > 0) return;
      unlockSfx();
      pullingRef.current = true;
      startY.current = event.clientY;
      orb.setPointerCapture(event.pointerId);
    };

    const onMove = (event: PointerEvent) => {
      if (!pullingRef.current || openingRef.current) return;
      const dist = Math.max(0, Math.min(event.clientY - startY.current, maxPull));
      pullRef.current = dist;
      setPullDist(dist);
      if (dist > 10 && dist % 18 < 2) sfxGatePull();
      if (dist >= maxPull * 0.9) void openRef.current?.();
    };

    const onUp = (event: PointerEvent) => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (orb.hasPointerCapture(event.pointerId)) orb.releasePointerCapture(event.pointerId);
      if (openingRef.current) return;
      if (pullRef.current < 18) {
        void openRef.current?.();
        return;
      }
      springBack();
    };

    orb.addEventListener("pointerdown", onDown);
    orb.addEventListener("pointermove", onMove);
    orb.addEventListener("pointerup", onUp);
    orb.addEventListener("pointercancel", onUp);

    return () => {
      orb.removeEventListener("pointerdown", onDown);
      orb.removeEventListener("pointermove", onMove);
      orb.removeEventListener("pointerup", onUp);
      orb.removeEventListener("pointercancel", onUp);
    };
  }, [maxPull]);

  return (
    <section className="relative flex h-[100svh] min-h-0 flex-col items-center overflow-hidden stage-dark px-5 text-center select-none sm:px-6">
      {/* Dynamic Glow */}
      <div 
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ 
          background: `radial-gradient(circle at 50% ${42 + pullDist/4}%, rgba(217, 170, 26, ${0.1 + (pullDist/maxPull) * 0.3}), transparent 70%)`,
          opacity: opening ? 0 : 1
        }} 
      />

      <div className="relative z-20 flex w-full min-w-0 max-w-md shrink-0 flex-col items-center pt-[max(1.25rem,7svh)]">
        <p className="section-kicker mb-3 max-w-full opacity-50 sm:mb-4">pull to ignite</p>
        <h1 className="font-display w-full min-w-0 text-pearl transition-all duration-500"
            style={{ opacity: 1 - (pullDist/maxPull) * 0.5, transform: `translateY(${-pullDist/3}px)` }}>
          <FitLine text={`Hey ${config.recipient.name}.`} max={56} min={22} className="leading-[1.05]" />
          <FitLine text="Something is waiting." max={42} min={18} className="mt-1.5 italic leading-[1.1] text-accent sm:mt-2" />
        </h1>
        <p className="mt-4 max-w-[18rem] text-sm font-medium leading-relaxed text-pearl/80 sm:mt-6"
           style={{ opacity: 1 - (pullDist/maxPull) }}>
          Tap the handle, or pull it down.
        </p>
      </div>

      {/* Cord lives only under the copy, so the string never cuts the headline. */}
      <div
        ref={orbRef}
        className="relative z-10 flex min-h-0 w-full flex-1 touch-none cursor-grab flex-col items-center pt-4 active:cursor-grabbing group sm:pt-8"
        role="button"
        tabIndex={0}
        aria-label="Tap the handle or pull it down to begin"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void triggerOpen();
          }
        }}
      >
        <div 
          ref={cordRef}
          className="w-[3px] min-h-8 flex-1 origin-top bg-gradient-to-b from-pearl/50 via-amber/80 to-amber"
        />
        
        <div className="pointer-events-none relative shrink-0">
          {/* Outer Glow */}
          <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 w-32 h-32 rounded-full bg-amber/35 blur-2xl opacity-80" 
               style={{ transform: `translate(-50%, -50%) scale(${1 + (pullDist/maxPull)})` }} />
          
          {/* Bulb Body */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber to-warm shadow-[0_0_40px_rgba(217,170,26,0.4)] flex items-center justify-center border border-white/20 transition-transform group-hover:scale-110 active:scale-95">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_15px_white]" />
            </div>
          </div>
          
          {/* Filament Detail */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-4 h-6 bg-gradient-to-b from-amber to-warm/80 rounded-t-sm" />
        </div>
        <div
          aria-hidden
          className="w-px min-h-12 shrink"
          style={{ flexBasis: `${72 + maxPull - pullDist}px`, flexGrow: 0 }}
        />
      </div>

      {/* Pull Progress indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber transition-all duration-100"
          style={{ width: `${(pullDist/maxPull) * 100}%` }}
        />
      </div>
      
      {/* Background Textures */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
    </section>
  );
}
