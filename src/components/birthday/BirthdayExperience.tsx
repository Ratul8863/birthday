"use client";

import { BalloonPop } from "@/components/birthday/BalloonPop";
import { BirthdayLetter } from "@/components/birthday/BirthdayLetter";
import { BirthdayReveal } from "@/components/birthday/BirthdayReveal";
import {
  ExperienceProvider,
  type ExperienceConfig,
  useExperience,
} from "@/components/birthday/ExperienceContext";
import { ExperienceProgress } from "@/components/birthday/ExperienceProgress";
import { FinalCelebration } from "@/components/birthday/FinalCelebration";
import { GiftVault } from "@/components/birthday/GiftVault";
import { MemoryJourney } from "@/components/birthday/MemoryJourney";
import { MusicControl } from "@/components/birthday/MusicControl";
import { SlideBack } from "@/components/birthday/SlideBack";
import { SpecialCards } from "@/components/birthday/SpecialCards";
import { SlideContext, type SlideNav } from "@/components/birthday/slide-nav";
import { SurpriseGate } from "@/components/birthday/SurpriseGate";
import { WishCake } from "@/components/birthday/WishCake";
import { gsap, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { sfxSlideTransition } from "@/lib/sfx";
import type { ExperienceState } from "@/types/birthday";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Props = {
  token: string;
  initialConfig: ExperienceConfig;
  initialState: ExperienceState;
};

const SLIDES = [
  BirthdayLetter,
  MemoryJourney,
  SpecialCards,
  BalloonPop,
  WishCake,
  GiftVault,
  FinalCelebration,
] as const;

function ExperienceScreens() {
  const { phase, setPhase } = useExperience();
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const indexRef = useRef(0);
  const busy = useRef(false);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    registerGsap();
  }, []);

  useLayoutEffect(() => {
    if (prev === null) return;
    const incoming = layerRefs.current[index];
    const outgoing = layerRefs.current[prev];
    if (!incoming) {
      busy.current = false;
      setPrev(null);
      return;
    }

    gsap.set(incoming, { clipPath: "circle(0% at 50% 50%)", opacity: 1, y: 0 });
    if (outgoing) gsap.set(outgoing, { opacity: 1, y: 0, scale: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(incoming, { clearProps: "clipPath,opacity,transform" });
        if (outgoing) gsap.set(outgoing, { clearProps: "opacity,transform" });
        busy.current = false;
        setPrev(null);
      },
    });
    tl.to(incoming, {
      clipPath: "circle(150% at 50% 50%)",
      duration: 0.95,
      ease: "power4.inOut",
    });

    return () => {
      tl.kill();
    };
  }, [prev, index]);

  const travel = useCallback((target: number) => {
    const from = indexRef.current;
    const to = Math.max(0, Math.min(target, SLIDES.length - 1));
    if (to === from || busy.current) return;

    if (prefersReducedMotion()) {
      indexRef.current = to;
      setIndex(to);
      return;
    }

    busy.current = true;
    indexRef.current = to;
    sfxSlideTransition();
    setPrev(from);
    setIndex(to);
  }, []);

  const next = useCallback(() => {
    travel(indexRef.current + 1);
  }, [travel]);

  const back = useCallback(() => {
    if (indexRef.current === 0) {
      setPhase("gate");
      return;
    }
    travel(indexRef.current - 1);
  }, [travel, setPhase]);

  const goTo = useCallback(
    (target: number) => {
      travel(target);
    },
    [travel],
  );

  const nav = useMemo<SlideNav>(
    () => ({
      index,
      total: SLIDES.length,
      next,
      back,
      goTo,
      isFirst: index === 0,
      isLast: index >= SLIDES.length - 1,
    }),
    [index, next, back, goTo],
  );

  if (phase === "gate") {
    return (
      <div className="h-[100svh] overflow-hidden">
        <SurpriseGate />
      </div>
    );
  }

  if (phase === "reveal") {
    return (
      <div className="h-[100svh] overflow-hidden">
        <BirthdayReveal />
      </div>
    );
  }

  return (
    <SlideContext.Provider value={nav}>
      <div className="relative h-[100svh] overflow-hidden">
        {SLIDES.map((Slide, i) => {
          if (i !== index && i !== prev) return null;
          return (
            <div
              key={i}
              ref={(node) => {
                layerRefs.current[i] = node;
              }}
              className={`absolute inset-0 ${prev !== null ? "pointer-events-none" : ""}`}
              style={{ zIndex: i === index ? 2 : 1 }}
            >
              <Slide />
            </div>
          );
        })}
        <ExperienceProgress />
        <SlideBack />
      </div>
    </SlideContext.Provider>
  );
}

export function BirthdayExperience({ token, initialConfig, initialState }: Props) {
  return (
    <ExperienceProvider token={token} initialConfig={initialConfig} initialState={initialState}>
      <ExperienceScreens />
      <MusicControl />
    </ExperienceProvider>
  );
}
