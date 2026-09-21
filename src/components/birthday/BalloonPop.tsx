"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fireConfetti } from "@/components/birthday/confetti";
import { useSlides } from "@/components/birthday/slide-nav";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { playBalloonPop } from "@/lib/balloon-sound";
import { gsap } from "@/lib/motion";

const COLORS = ["#c45c4a", "#c9a227", "#d4a59a", "#e7d3c4", "#b54a3c", "#a89070"];

const AGE_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty-one",
  "twenty-two",
  "twenty-three",
  "twenty-four",
  "twenty-five",
  "twenty-six",
  "twenty-seven",
  "twenty-eight",
  "twenty-nine",
  "thirty",
];

const BOUQUET = [
  { left: "6%", top: "22%", rotate: -16, scale: 0.72, color: 0, delay: "0s" },
  { left: "20%", top: "8%", rotate: -8, scale: 0.86, color: 1, delay: "0.12s" },
  { left: "36%", top: "0%", rotate: -2, scale: 1, color: 4, delay: "0.05s" },
  { left: "52%", top: "6%", rotate: 6, scale: 0.9, color: 2, delay: "0.18s" },
  { left: "68%", top: "16%", rotate: 12, scale: 0.78, color: 5, delay: "0.08s" },
  { left: "28%", top: "38%", rotate: -10, scale: 0.62, color: 3, delay: "0.22s" },
  { left: "58%", top: "36%", rotate: 9, scale: 0.66, color: 1, delay: "0.16s" },
];

function mixWithBlack(hex: string, amount: number) {
  const n = hex.replace("#", "");
  const channel = (start: number) => Number.parseInt(n.slice(start, start + 2), 16);
  const mix = (value: number) => Math.round(value * (1 - amount));
  return `rgb(${mix(channel(0))}, ${mix(channel(2))}, ${mix(channel(4))})`;
}

function labelColor(hex: string) {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  const y = (r * 299 + g * 587 + b * 114) / 1000;
  return y > 168 ? "#1c1612" : "#ffffff";
}

function turnedLine(age: number) {
  const word = AGE_WORDS[age];
  return word ? `Turned ${word}` : `Turned ${age}`;
}

function BalloonShape({
  color,
  label,
  className,
}: {
  color: string;
  label?: string;
  className?: string;
}) {
  const raw = useId();
  const id = raw.replace(/:/g, "");

  return (
    <span className={`relative block ${className ?? ""}`}>
      <svg viewBox="0 0 88 148" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id={`${id}-body`} cx="50%" cy="46%" r="72%">
            <stop offset="0%" stopColor={color} />
            <stop offset="82%" stopColor={color} />
            <stop offset="100%" stopColor={mixWithBlack(color, 0.1)} />
          </radialGradient>
        </defs>
        <path
          d="M44 86 C46 102 38 112 42 124 C48 132 40 140 44 146"
          fill="none"
          stroke="rgba(253,252,251,0.45)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <ellipse cx="44" cy="46" rx="30" ry="38" fill={`url(#${id}-body)`} />
        <path d="M38 82 L44 92 L50 82 Z" fill={mixWithBlack(color, 0.08)} />
      </svg>
      {label ? (
        <span
          className="pointer-events-none absolute left-1/2 top-[27%] -translate-x-1/2 font-display text-[1.35rem] leading-none"
          style={{ color: labelColor(color) }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

export function BalloonPop() {
  const { config, reducedMotion } = useExperience();
  const { next } = useSlides();
  const copy = config.balloons;
  const name = config.recipient.nickname || config.recipient.name;
  const total = config.recipient.age ?? 23;
  const [round, setRound] = useState(0);
  const [count, setCount] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const balloonRef = useRef<HTMLButtonElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const fly = useRef<gsap.core.Tween | null>(null);
  const intro = useRef<gsap.core.Tween | null>(null);
  const busy = useRef(false);
  const done = count >= total;
  const color = COLORS[round % COLORS.length];
  const progress = total > 0 ? count / total : 0;
  const hint =
    count === 0 ? copy.startHint : count >= total - 3 ? copy.endHint : copy.midHint;

  useEffect(() => {
    if (done) return;
    const el = balloonRef.current;
    const area = areaRef.current;
    if (!el || !area) return;

    const maxX = Math.max(8, area.clientWidth - 96);
    const maxY = Math.max(8, area.clientHeight - 150);
    const edge = round % 4;
    const landX = 8 + (((round * 53) % 100) / 100) * (maxX - 8);
    const landY = 8 + (((round * 29) % 100) / 100) * (maxY - 8);
    const from =
      edge === 0
        ? { x: -110, y: landY }
        : edge === 1
          ? { x: area.clientWidth + 40, y: landY }
          : edge === 2
            ? { x: landX, y: -150 }
            : { x: landX, y: area.clientHeight + 40 };

    busy.current = false;
    gsap.set(el, { scale: 1, opacity: 0, x: from.x, y: from.y, rotation: 0 });

    if (reducedMotion) {
      gsap.set(el, { opacity: 1, x: landX, y: landY });
      return;
    }

    const wander = () => {
      fly.current = gsap.to(el, {
        x: gsap.utils.random(0, maxX),
        y: gsap.utils.random(0, maxY),
        rotation: gsap.utils.random(-7, 7),
        duration: gsap.utils.random(1.5, 2.5),
        ease: "sine.inOut",
        onComplete: wander,
      });
    };

    intro.current = gsap.to(el, {
      x: landX,
      y: landY,
      opacity: 1,
      rotation: gsap.utils.random(-4, 4),
      duration: 0.55,
      ease: "power2.out",
      onComplete: wander,
    });

    return () => {
      intro.current?.kill();
      fly.current?.kill();
    };
  }, [round, done, reducedMotion]);

  function pop() {
    const el = balloonRef.current;
    const area = areaRef.current;
    const burst = burstRef.current;
    if (!el || !area || busy.current || done) return;
    busy.current = true;
    intro.current?.kill();
    fly.current?.kill();
    playBalloonPop();

    const areaBox = area.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const x = box.left - areaBox.left + box.width / 2;
    const y = box.top - areaBox.top + box.height / 2;
    const nextCount = count + 1;

    fireConfetti({
      particleCount: reducedMotion ? 0 : 42,
      spread: 86,
      startVelocity: 34,
      scalar: 0.9,
      colors: [color, "#F7F5F2", "#C9A227", "#fff4ea"],
      origin: {
        x: (box.left + box.width / 2) / window.innerWidth,
        y: (box.top + box.height / 2) / window.innerHeight,
      },
    });

    if (burst) {
      gsap.set(burst, { x, y, scale: 0.15, opacity: 1 });
      gsap
        .timeline()
        .to(burst, { scale: 3.2, opacity: 0, duration: 0.48, ease: "power2.out" })
        .to(burst.querySelector(".inner-glow"), { scale: 4, opacity: 0, duration: 0.36 }, 0);
    }

    gsap
      .timeline({
        onComplete: () => {
          setCount(nextCount);
          if (nextCount < total) setRound(nextCount);
        },
      })
      .to(el, { scale: 1.55, duration: 0.06, ease: "power2.out" })
      .to(el, { scale: 2.2, opacity: 0, duration: 0.14, ease: "power3.in" });
  }

  return (
    <section data-screen id="balloons" className="screen-section stage-dark">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[46%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(214,81,58,0.16),rgba(217,170,26,0.05)_42%,transparent_70%)]" />
      </div>

      <div className="screen-body relative z-10 flex flex-col">
        <div className="text-center">
          <p className="section-kicker justify-center">{done ? copy.doneKicker : copy.kicker}</p>
          <h2 className={`font-display mt-3 w-full min-w-0 leading-[0.95] ${done ? "text-[clamp(1.55rem,6.4vw,3.2rem)]" : "text-[clamp(2.4rem,9vw,4.2rem)]"}`}>
            {done ? turnedLine(total) : count}
          </h2>
          {done ? (
            <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed text-pearl/70">
              {name}, {total} pops. {copy.doneBody}
            </p>
          ) : (
            <p className="mt-2 text-sm tracking-[0.16em] text-pearl/45 uppercase">
              {count} / {total}
            </p>
          )}
          {!done ? (
            <div
              className="mx-auto mt-3 h-1 w-36 overflow-hidden rounded-full bg-pearl/10"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${count} of ${total} balloons popped`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-warm transition-[width] duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          ) : null}
        </div>

        <div ref={areaRef} className="relative mt-3 min-h-[42svh] flex-1 overflow-hidden">
          <div
            ref={burstRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-20 opacity-0"
          >
            <span className="absolute h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warm/50" />
            <span className="inner-glow absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-md" />
            <span className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pearl" />
          </div>

          {done ? (
            <div className="absolute inset-x-0 top-[6%] mx-auto h-64 w-full max-w-md sm:h-80 sm:max-w-lg">
              {BOUQUET.map((piece) => (
                <span
                  key={`${piece.left}-${piece.top}`}
                  className="balloon-bob absolute"
                  style={{
                    left: piece.left,
                    top: piece.top,
                    animationDelay: piece.delay,
                    transform: `rotate(${piece.rotate}deg) scale(${piece.scale})`,
                  }}
                >
                  <BalloonShape color={COLORS[piece.color]} className="h-32 w-20 sm:h-40 sm:w-24" />
                </span>
              ))}
            </div>
          ) : (
            <button
              ref={balloonRef}
              type="button"
              onClick={pop}
              aria-label={`Pop balloon ${count + 1} of ${total}`}
              className="absolute left-0 top-0 z-10 touch-manipulation opacity-0"
            >
              <BalloonShape color={color} label={String(count + 1)} className="h-40 w-[6.1rem]" />
            </button>
          )}
        </div>

        <div className="pt-2 text-center">
          {done ? (
            <button type="button" className="btn-primary" onClick={next}>
              {copy.cta}
            </button>
          ) : (
            <p className="text-sm text-pearl/55">{hint}</p>
          )}
        </div>
      </div>
    </section>
  );
}
