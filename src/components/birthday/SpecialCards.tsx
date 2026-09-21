"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useSlides } from "@/components/birthday/slide-nav";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { VaultWordForm } from "@/components/birthday/VaultWordForm";
import { gsap } from "@/lib/motion";
import { sfxLanternLight, sfxNoteReveal } from "@/lib/sfx";

const DROPS = [14, 26, 10, 22];

export function SpecialCards() {
  const { config, reducedMotion } = useExperience();
  const { open: vaultOpen } = useVaultLock();
  const { next } = useSlides();
  const cards = config.specialCards;
  const [lit, setLit] = useState<boolean[]>(() => cards.map(() => false));
  const [reading, setReading] = useState<number | null>(null);
  const hangers = useRef<Array<HTMLDivElement | null>>([]);
  const sways = useRef<Array<HTMLDivElement | null>>([]);
  const shades = useRef<Array<HTMLSpanElement | null>>([]);
  const noteRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const reveal = useRef<gsap.core.Timeline | null>(null);
  const litCount = lit.filter(Boolean).length;
  const finished = litCount === cards.length && cards.length > 0;
  const card = reading === null ? null : cards[reading];

  useLayoutEffect(() => {
    const nodes = hangers.current.filter(Boolean) as HTMLDivElement[];
    const ropes = sways.current.filter(Boolean) as HTMLDivElement[];
    if (nodes.length === 0) return;
    gsap.set(ropes, { transformOrigin: "top center" });
    if (reducedMotion) {
      gsap.set(nodes, { y: 0, opacity: 1 });
      gsap.set(ropes, { rotation: 0 });
      return;
    }
    const intro = gsap.fromTo(
      nodes,
      { y: -36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" },
    );
    const sway = ropes.map((node, index) =>
      gsap.to(node, {
        rotation: index % 2 === 0 ? 2.2 : -2.2,
        duration: 2.4 + index * 0.18,
        delay: 0.55,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }),
    );
    return () => {
      intro.kill();
      sway.forEach((tween) => tween.kill());
    };
  }, [cards.length, reducedMotion]);

  useLayoutEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    const opacity = 0.22 + litCount * 0.18;
    if (reducedMotion) {
      gsap.set(glow, { opacity });
      return;
    }
    gsap.to(glow, { opacity, duration: 0.7, ease: "power2.out" });
  }, [litCount, reducedMotion]);

  function choose(index: number) {
    if (!vaultOpen) return;
    if (reading === index) return;
    const shade = shades.current[index];
    const note = noteRef.current;
    const first = !lit[index];

    setLit((prev) => {
      if (prev[index]) return prev;
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
    setReading(index);
    if (first) sfxLanternLight();
    else sfxNoteReveal();

    if (reducedMotion || !note) return;

    reveal.current?.kill();
    shades.current.forEach((node) => {
      if (node) gsap.set(node, { scale: 1 });
    });
    const tl = gsap.timeline();
    reveal.current = tl;

    if (shade && first) {
      tl.fromTo(shade, { scale: 0.9 }, { scale: 1.06, duration: 0.18, ease: "power2.out" }).to(shade, {
        scale: 1,
        duration: 0.4,
        ease: "elastic.out(1, 0.55)",
      });
    }

    tl.fromTo(
      note,
      { opacity: 0, y: -18, scaleY: 0.8 },
      {
        opacity: 1,
        y: 0,
        scaleY: 1,
        duration: 0.42,
        ease: "power3.out",
        transformOrigin: "top center",
      },
      0,
    );
  }

  return (
    <section data-screen id="special" className="screen-section stage-dark">
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 36%, rgba(201,162,39,0.9), rgba(196,92,74,0.18) 36%, transparent 68%)",
        }}
      />

      <div className="screen-body">
        <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
          <p className="section-kicker justify-center">still unsaid</p>
          <h2 className="font-display mt-3 w-full min-w-0 max-w-full text-[clamp(1.7rem,6vw,3rem)] leading-none text-pearl">
            {finished ? "The whole string’s lit" : litCount === 0 ? "They’re still dark" : "Leave them glowing"}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-pearl/55">
            {finished
              ? "That’s the list. Short on purpose."
              : litCount === 0
                ? "I wrote these down because I’d never just say them. They’re dark until you want them."
                : `${litCount} lit. ${cards.length - litCount} still keeping quiet.`}
          </p>

          <div className="relative mt-8 w-full">
            <div className="absolute inset-x-3 top-0 h-px bg-pearl/25" />
            <div className="grid grid-cols-4 gap-1 px-1">
              {cards.map((item, index) => {
                const on = lit[index];
                const active = reading === index;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => choose(index)}
                    aria-pressed={on}
                    aria-label={
                      vaultOpen && on ? `Read “${item.title}” again` : `Light lantern ${index + 1}`
                    }
                    className="flex min-w-0 flex-col items-center"
                  >
                    <div
                      ref={(node) => {
                        hangers.current[index] = node;
                      }}
                      className="flex w-full flex-col items-center"
                      style={{ paddingTop: DROPS[index % DROPS.length] }}
                    >
                      <div
                        ref={(node) => {
                          sways.current[index] = node;
                        }}
                        className="flex w-full flex-col items-center"
                      >
                        <span className="block w-px bg-pearl/40" style={{ height: 16 + (index % 2) * 6 }} />
                        <span
                          ref={(node) => {
                            shades.current[index] = node;
                          }}
                          className="relative block w-full"
                        >
                          <svg viewBox="0 0 88 128" className="block h-auto w-full overflow-visible" aria-hidden>
                            <defs>
                              <filter id={`lantern-glow-${index}`} x="-40%" y="-30%" width="180%" height="170%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feMerge>
                                  <feMergeNode in="blur" />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                              <radialGradient id={`lantern-paper-${index}`} cx="50%" cy="42%" r="62%">
                                <stop offset="0%" stopColor={on ? "#fff6df" : "#6b5344"} />
                                <stop offset="55%" stopColor={on ? "#f0d7a2" : "#4a382d"} />
                                <stop offset="100%" stopColor={on ? "#e2b15f" : "#2e241e"} />
                              </radialGradient>
                            </defs>
                            <g filter={on ? `url(#lantern-glow-${index})` : undefined}>
                              <rect x="31" y="2" width="26" height="7" rx="3.5" fill={on ? "#c9a227" : "#8d7362"} />
                              <path
                                d="M24 12c-12 16-14 48-6 78 6 10 46 10 52 0 8-30 6-62-6-78-10-6-30-6-40 0z"
                                fill={`url(#lantern-paper-${index})`}
                                stroke={active ? "#c9a227" : on ? "rgba(255,236,196,0.7)" : "rgba(247,245,242,0.16)"}
                                strokeWidth={active ? 2 : 1}
                              />
                              <path d="M20 36h48" stroke={on ? "rgba(22,22,26,0.14)" : "rgba(247,245,242,0.14)"} />
                              <path d="M18 54h52" stroke={on ? "rgba(22,22,26,0.14)" : "rgba(247,245,242,0.14)"} />
                              <path d="M20 72h48" stroke={on ? "rgba(22,22,26,0.14)" : "rgba(247,245,242,0.14)"} />
                              <text
                                x="44"
                                y="60"
                                textAnchor="middle"
                                fill={on ? "#16161a" : "#f7f5f2"}
                                fontSize="16"
                                className="font-display"
                              >
                                {String(index + 1).padStart(2, "0")}
                              </text>
                              {on ? (
                                <g className="animate-flicker" style={{ transformOrigin: "44px 82px" }}>
                                  <ellipse cx="44" cy="84" rx="5" ry="11" fill="#c45c4a" />
                                  <ellipse cx="44" cy="82" rx="3" ry="8" fill="#c9a227" />
                                  <ellipse cx="44" cy="80" rx="1.4" ry="4.5" fill="#fff7ea" />
                                </g>
                              ) : null}
                              <rect x="34" y="96" width="20" height="6" rx="3" fill={on ? "#a89070" : "#6d584a"} />
                              <line
                                x1="44"
                                y1="102"
                                x2="44"
                                y2="118"
                                stroke={on ? "#c45c4a" : "rgba(247,245,242,0.28)"}
                                strokeWidth="1.4"
                              />
                              <circle cx="44" cy="121" r="2.6" fill={on ? "#c45c4a" : "rgba(247,245,242,0.35)"} />
                            </g>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={noteRef}
            className="mt-6 w-full origin-top rounded-[1.35rem] bg-[#f6efe4] px-5 py-5 text-left text-ink shadow-[0_24px_50px_rgba(0,0,0,0.32)] ring-1 ring-amber/30"
            style={{ minHeight: "9.5rem" }}
          >
            {vaultOpen && card && reading !== null ? (
              <>
                <p className="text-[11px] tracking-[0.18em] text-accent uppercase">
                  {String(reading + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-2 text-[clamp(1.6rem,5vw,2.15rem)] leading-tight">{card.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-ink/65">{card.text}</p>
              </>
            ) : !vaultOpen ? (
              <div className="flex min-h-28 flex-col items-center justify-center text-center">
                <p className="text-sm text-ink/55">These lines stay shut until you say the word.</p>
                <div className="mt-5 w-full">
                  <VaultWordForm id="vault-word-lanterns" />
                </div>
              </div>
            ) : (
              <p className="flex min-h-28 items-center justify-center text-center text-sm text-ink/45">
                Tap a lantern. Any of them.
              </p>
            )}
          </div>

          <div className="pt-8">
            {vaultOpen && finished ? (
              <button type="button" className="btn-primary" onClick={next}>
                Pop the balloons
              </button>
            ) : vaultOpen ? (
              <p className="text-sm text-pearl/40">
                {reading === null ? "The room stays dark until you start." : "Light the rest whenever you feel like it."}
              </p>
            ) : (
              <button type="button" className="text-sm font-medium text-pearl/45" onClick={next}>
                Pop the balloons
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
