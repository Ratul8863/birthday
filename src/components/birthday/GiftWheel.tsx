"use client";

import { useExperience } from "@/components/birthday/ExperienceContext";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { birthdayConfig } from "@/lib/birthday-config";
import { gsap } from "@/lib/motion";
import { playSpinLand, playSpinTick, unlockSpinSound } from "@/lib/spin-sound";
import { getIndexAtPointer, getSegmentAngle, getTargetRotation } from "@/lib/spinner";
import type { PublicGift } from "@/types/birthday";
import { useEffect, useId, useRef, useState } from "react";

type GiftWheelProps = {
  rotation: number;
  onRotationChange: (next: number) => void;
  onSpinComplete: (gift: PublicGift) => void;
  onSpinRefused: () => void;
};

const BULBS = 26;
const CX = 100;
const CY = 100;
const RIM = 97;

function wedgePoint(radius: number, degFromTop: number) {
  const rad = (degFromTop * Math.PI) / 180;
  return [CX + Math.sin(rad) * radius, CY - Math.cos(rad) * radius] as const;
}

function wedgePath(start: number, end: number) {
  const [x1, y1] = wedgePoint(RIM, start);
  const [x2, y2] = wedgePoint(RIM, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x1} ${y1} A ${RIM} ${RIM} 0 ${large} 1 ${x2} ${y2} Z`;
}

function inkFor(hex: string) {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  const y = (r * 299 + g * 587 + b * 114) / 1000;
  return y > 165 ? "#3A1814" : "#FFF8EE";
}

export function GiftWheel({ rotation, onRotationChange, onSpinComplete, onSpinRefused }: GiftWheelProps) {
  const { config, state, spinState, requestSpin, setSpinState, reducedMotion } = useExperience();
  const { open: vaultOpen } = useVaultLock();
  const wheelRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const lockedSpin = useRef(false);
  const [lockedSpinning, setLockedSpinning] = useState(false);
  const labelId = useId();
  const gifts = config.spinner.gifts;
  const segmentAngle = getSegmentAngle(gifts.length);
  const crowded = gifts.length > 8;
  const spinning = spinState === "spinning" || spinState === "requesting";
  const serverBusy = spinning || state.remainingSpins <= 0 || state.completed;
  const busy = vaultOpen ? serverBusy : lockedSpinning;
  const specialTurn =
    vaultOpen &&
    state.noteSaved &&
    (state.remainingSpins === 1 || (spinning && state.spinCount === state.maxSpins));
  const keptIds = vaultOpen
    ? new Set((spinning ? state.wonGifts.slice(0, -1) : state.wonGifts).map((gift) => gift.id))
    : new Set<string>();

  useEffect(() => {
    const wheel = wheelRef.current;
    const pointer = pointerRef.current;
    if (pointer) {
      gsap.set(pointer, { xPercent: -50, rotation: 0, transformOrigin: "50% 0%" });
    }
    return () => {
      if (wheel) gsap.killTweensOf(wheel);
      if (pointer) gsap.killTweensOf(pointer);
    };
  }, []);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel || spinState === "spinning" || lockedSpin.current) return;
    gsap.set(wheel, { rotate: rotation });
  }, [rotation, spinState]);

  function spinWheel(target: number, done: () => void) {
    const wheel = wheelRef.current;
    const pointer = pointerRef.current;
    if (!wheel) {
      done();
      return;
    }

    if (reducedMotion) {
      onRotationChange(target);
      gsap.set(wheel, { rotate: target });
      playSpinLand();
      done();
      return;
    }

    let lastIndex = getIndexAtPointer(Number(gsap.getProperty(wheel, "rotate")) || rotation, gifts.length);
    let lastTick = 0;

    gsap.to(wheel, {
      rotate: target,
      duration: 6.4,
      ease: "power3.out",
      onUpdate: () => {
        const current = Number(gsap.getProperty(wheel, "rotate"));
        const index = getIndexAtPointer(current, gifts.length);
        if (index === lastIndex || !pointer) return;
        const now = performance.now();
        const gap = now - lastTick;
        lastIndex = index;
        lastTick = now;
        if (gap > 28) playSpinTick(gap);
        if (gap < 120) return;
        gsap.fromTo(
          pointer,
          { rotation: -8, xPercent: -50 },
          { rotation: 0, xPercent: -50, duration: 0.24, ease: "power2.out", overwrite: "auto" },
        );
      },
      onComplete: () => {
        if (pointer) gsap.set(pointer, { rotation: 0, xPercent: -50 });
        playSpinLand();
        onRotationChange(target);
        done();
      },
    });
  }

  async function handleSpin() {
    if (busy) return;
    unlockSpinSound();

    if (!vaultOpen) {
      if (lockedSpin.current || gifts.length === 0) return;
      lockedSpin.current = true;
      setLockedSpinning(true);
      const winning = gifts
        .map((gift, index) => ({ index, id: gift.id }))
        .filter(({ id }) => birthdayConfig.spinner.guaranteedGiftIds?.includes(id));
      const pool = winning.length > 0 ? winning : gifts.map((_, index) => ({ index }));
      const selectedIndex = pool[Math.floor(Math.random() * pool.length)]?.index ?? 0;
      const turns = reducedMotion ? 2 : undefined;
      const target = getTargetRotation(rotation, selectedIndex, gifts.length, turns);
      spinWheel(target, () => {
        lockedSpin.current = false;
        setLockedSpinning(false);
        onSpinRefused();
      });
      return;
    }

    const result = await requestSpin();
    const wheel = wheelRef.current;
    if (!result || !wheel) return;

    const turns = reducedMotion ? 2 : undefined;
    const target = getTargetRotation(rotation, result.selectedIndex, gifts.length, turns);
    spinWheel(target, () => {
      setSpinState("revealed");
      onSpinComplete(result.gift);
    });
  }

  return (
    <div className={`wheel-stage ${spinning || lockedSpinning ? "is-spinning" : ""} ${specialTurn ? "is-special" : ""}`}>
      <div className="wheel-glow" aria-hidden />

      <div className="relative aspect-square">
        {Array.from({ length: BULBS }, (_, i) => {
          const turn = ((i + 0.5) / BULBS) * Math.PI * 2 - Math.PI / 2;
          const radius = 42;
          return (
            <span
              key={i}
              aria-hidden
              className="wheel-bulb"
              style={{
                left: `${50 + Math.cos(turn) * radius}%`,
                top: `${50 + Math.sin(turn) * radius}%`,
                animationDelay: `${(i * 0.07).toFixed(2)}s`,
              }}
            />
          );
        })}

        <div className="wheel-housing" aria-hidden />

        <div ref={pointerRef} className="wheel-pointer" aria-hidden>
          <svg viewBox="0 0 40 58" className="h-full w-full">
            <path d="M20 56 L5 18 Q20 26 35 18 Z" fill="#E7C56A" />
            <path d="M20 50 L9 20 Q20 26 31 20 Z" fill="#F6E7C1" />
            <circle cx="20" cy="14" r="9" fill="#D6513A" stroke="#E7C56A" strokeWidth="2.5" />
            <circle cx="17" cy="11" r="2.2" fill="#fff6e8" opacity="0.8" />
          </svg>
        </div>

        <div className="absolute inset-[12%]">
          <div
            ref={wheelRef}
            className="absolute inset-0"
            role="img"
            aria-labelledby={labelId}
          >
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
              {gifts.map((gift, i) => (
                <path
                  key={gift.id}
                  d={wedgePath(i * segmentAngle, (i + 1) * segmentAngle)}
                  fill={gift.color}
                />
              ))}
              {gifts.map((gift, i) => {
                const [x, y] = wedgePoint(RIM, i * segmentAngle);
                return (
                  <line
                    key={`${gift.id}-edge`}
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke="#F6E7C1"
                    strokeWidth="0.8"
                  />
                );
              })}
              <circle cx={CX} cy={CY} r={RIM - 0.4} fill="none" stroke="#F6E7C1" strokeWidth="2.6" />
              <circle cx={CX} cy={CY} r="36" fill="#1A0E0C" stroke="#E7C56A" strokeWidth="1.2" />
            </svg>

            {gifts.map((gift, i) => {
              const angle = i * segmentAngle + segmentAngle / 2;
              const rad = (angle * Math.PI) / 180;
              const face = gift.color;
              const kept = keptIds.has(gift.id);
              const ink = inkFor(face);
              return (
                <span
                  key={gift.id}
                  className="pointer-events-none absolute"
                  style={{
                    width: crowded ? "15%" : "20%",
                    left: `${50 + Math.sin(rad) * (crowded ? 37 : 33)}%`,
                    top: `${50 - Math.cos(rad) * (crowded ? 37 : 33)}%`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  <span className="relative block">
                    {gift.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={gift.imageSrc}
                        alt=""
                        className={`aspect-square w-full rounded-full object-cover ${kept ? "opacity-55 saturate-50" : ""}`}
                        style={{ boxShadow: `0 0 0 2px ${ink === "#3A1814" ? "#3A1814" : "#F6E7C1"}, 0 6px 12px rgba(58,24,20,0.28)` }}
                      />
                    ) : (
                      <span className="block aspect-square w-full rounded-full bg-black/20" />
                    )}
                    <span
                      className="absolute inset-x-0 bottom-0 rounded-b-full bg-linear-to-t from-black/80 via-black/40 to-transparent px-0.5 pt-[32%] pb-[12%] text-center leading-none font-semibold tracking-tight text-white"
                      style={{ fontSize: crowded ? "clamp(7px, 1.65vw, 10px)" : "clamp(10px, 2.2vw, 13px)" }}
                    >
                      {gift.shortLabel ?? gift.label}
                    </span>
                    {kept ? (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#E7C56A] text-[8px] font-bold text-[#3A1814]">
                        ✓
                      </span>
                    ) : null}
                  </span>
                </span>
              );
            })}
          </div>

          <div className="wheel-glass" aria-hidden />

          <button
            type="button"
            className="wheel-hub"
            disabled={busy}
            onClick={() => void handleSpin()}
            aria-label={specialTurn ? "Special spin" : "Spin the gift wheel"}
          >
            <span className="font-display text-[clamp(0.78rem,2.3vw,1.15rem)] leading-none text-[#F6E7C1]">
              {specialTurn ? "Special" : "Spin"}
            </span>
          </button>
        </div>
      </div>

      <p id={labelId} className="sr-only">
        Birthday gift wheel. {gifts.map((gift) => gift.label).join(", ")}.
      </p>
    </div>
  );
}
