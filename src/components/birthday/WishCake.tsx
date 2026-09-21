"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { fireConfetti } from "@/components/birthday/confetti";
import { useSlides } from "@/components/birthday/slide-nav";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { gsap } from "@/lib/motion";
import { sfxCandleLight, sfxWishComplete, sfxBlowCandles, sfxCakeSlice, sfxConfetti, sfxCountdownTick, playHappyBirthday } from "@/lib/sfx";

const HOLD_SECONDS = 8;
const RING = 96;
const RING_LENGTH = 2 * Math.PI * RING;
const CANDLES = [122, 146, 170];

const EMBERS = [
  { left: "18%", delay: "0s", duration: "3.8s" },
  { left: "32%", delay: "1.1s", duration: "4.4s" },
  { left: "47%", delay: "0.4s", duration: "3.5s" },
  { left: "63%", delay: "1.6s", duration: "4.1s" },
  { left: "76%", delay: "0.7s", duration: "3.9s" },
  { left: "24%", delay: "2s", duration: "4.6s" },
];

function litCountFor(progress: number) {
  if (progress > 0.7) return 3;
  if (progress > 0.4) return 2;
  if (progress > 0.12) return 1;
  return 0;
}

export function WishCake() {
  const uid = useId().replace(/:/g, "");
  const {
    config,
    setPhase,
    reducedMotion,
    wishMade,
    setWishMade,
    candlesBlown,
    setCandlesBlown,
    setMusicVolumeFactor,
  } = useExperience();
  const { next } = useSlides();
  const [holding, setHolding] = useState(false);
  const [lit, setLit] = useState(wishMade && !candlesBlown ? 3 : 0);
  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [showCut, setShowCut] = useState(false);
  const [cut, setCut] = useState(false);
  const [cutting, setCutting] = useState(false);
  const [gusting, setGusting] = useState(false);

  const roomRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const sliceRef = useRef<HTMLDivElement>(null);
  const knifeRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLSpanElement>(null);
  const hold = useRef<gsap.core.Tween | null>(null);
  const wished = useRef(wishMade);
  const litRef = useRef(lit);
  const secondsRef = useRef(HOLD_SECONDS);
  const blowLock = useRef(false);
  const hbdRef = useRef<{ stop: () => void } | null>(null);

  const who = config.recipient.nickname || config.recipient.name;
  const beat = !wishMade ? "hold" : !candlesBlown ? "blow" : !cut ? "slice" : "done";

  useEffect(() => {
    setPhase("cake");
  }, [setPhase]);

  useLayoutEffect(() => {
    const room = roomRef.current;
    if (room) room.style.setProperty("--wish", candlesBlown ? "0.12" : wishMade ? "1" : "0");
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = wishMade ? "0" : String(RING_LENGTH);
    }
    if (bloomRef.current) gsap.set(bloomRef.current, { xPercent: -50, yPercent: -50 });
    // Mount only. Hold, blow, and the seal update the room after this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || reducedMotion) return;
    const tween = gsap.fromTo(
      stage,
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.95, ease: "power3.out" },
    );
    return () => {
      tween.kill();
    };
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      hold.current?.kill();
      hbdRef.current?.stop();
    };
  }, []);

  function pulse(pattern: number | number[]) {
    if (reducedMotion || typeof navigator === "undefined" || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }

  function startHold(event: PointerEvent<HTMLButtonElement>) {
    if (wished.current) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* pointer already released */
    }
    hold.current?.kill();
    const room = roomRef.current;
    if (room) {
      gsap.killTweensOf(room);
      gsap.set(room, { "--wish": 0 });
    }
    if (ringRef.current) {
      gsap.killTweensOf(ringRef.current);
      gsap.set(ringRef.current, { strokeDashoffset: RING_LENGTH });
    }

    litRef.current = 0;
    secondsRef.current = HOLD_SECONDS;
    setLit(0);
    setSeconds(HOLD_SECONDS);
    setHolding(true);

    const proxy = { value: 0 };
    hold.current = gsap.to(proxy, {
      value: 1,
      duration: reducedMotion ? 1.2 : HOLD_SECONDS,
      ease: "none",
      onUpdate: () => {
        const value = proxy.value;
        room?.style.setProperty("--wish", String(value));
        if (ringRef.current) {
          ringRef.current.style.strokeDashoffset = String(RING_LENGTH * (1 - value));
        }
        const nextLit = litCountFor(value);
        if (nextLit !== litRef.current) {
          litRef.current = nextLit;
          setLit(nextLit);
          if (nextLit > 0) { pulse(8); sfxCandleLight(); }
        }
        const nextSeconds = Math.max(1, Math.ceil((1 - value) * HOLD_SECONDS));
        if (nextSeconds !== secondsRef.current) {
          secondsRef.current = nextSeconds;
          setSeconds(nextSeconds);
          sfxCountdownTick();
        }
      },
      onComplete: () => {
        wished.current = true;
        blowLock.current = true;
        sfxWishComplete();
        window.setTimeout(() => {
          blowLock.current = false;
        }, 650);
        room?.style.setProperty("--wish", "1");
        if (ringRef.current) ringRef.current.style.strokeDashoffset = "0";
        litRef.current = 3;
        setLit(3);
        setHolding(false);
        setWishMade(true);
        setMusicVolumeFactor(0.7);
        pulse([12, 40, 18]);
        const bloom = bloomRef.current;
        if (bloom && !reducedMotion) {
          gsap.fromTo(
            bloom,
            { scale: 0.35, opacity: 0.8, xPercent: -50, yPercent: -50 },
            { scale: 2.1, opacity: 0, xPercent: -50, yPercent: -50, duration: 0.95, ease: "power2.out" },
          );
        }
      },
    });
  }

  function endHold() {
    if (wished.current) return;
    hold.current?.kill();
    hold.current = null;
    litRef.current = 0;
    secondsRef.current = HOLD_SECONDS;
    setHolding(false);
    setLit(0);
    setSeconds(HOLD_SECONDS);
    const room = roomRef.current;
    if (room) gsap.to(room, { "--wish": 0, duration: 0.45, ease: "power2.out" });
    if (ringRef.current) {
      gsap.to(ringRef.current, { strokeDashoffset: RING_LENGTH, duration: 0.45, ease: "power2.out" });
    }
  }

  function blowCandles() {
    if (!wishMade || candlesBlown || gusting || blowLock.current) return;
    setGusting(true);
    sfxBlowCandles();
    if (reducedMotion) {
      setCandlesBlown(true);
      setGusting(false);
      setMusicVolumeFactor(1);
      roomRef.current?.style.setProperty("--wish", "0.12");
      return;
    }
    const room = roomRef.current;
    if (room) gsap.to(room, { "--wish": 0.12, duration: 0.9, ease: "power2.inOut", delay: 0.25 });
    window.setTimeout(() => {
      setCandlesBlown(true);
      setGusting(false);
      setMusicVolumeFactor(1);
      sfxConfetti();
      fireConfetti({
        origin: { y: 0.46 },
        particleCount: 26,
        spread: 36,
        startVelocity: 18,
        scalar: 0.7,
        colors: ["#F3D27A", "#F7F5F2", "#E7C4A8", "#D6513A"],
      });
    }, 620);
  }

  function cutCake() {
    if (!candlesBlown || cut || cutting) return;
    setCutting(true);
    setShowCut(true);
    sfxCakeSlice();
    hbdRef.current = playHappyBirthday((factor) => setMusicVolumeFactor(factor));
    const slice = sliceRef.current;
    if (!slice || reducedMotion) {
      setCut(true);
      setCutting(false);
      return;
    }
    const shift = window.innerWidth < 420 ? 48 : 72;
    gsap.set(slice, { transformOrigin: "62% 86%" });
    const tl = gsap.timeline({
      onComplete: () => {
        setCut(true);
        setCutting(false);
      },
    });
    const knife = knifeRef.current;
    if (knife) {
      tl.fromTo(
        knife,
        { x: -78, opacity: 0, rotation: -18 },
        { x: 18, opacity: 1, rotation: -8, duration: 0.28, ease: "power2.in" },
      ).to(knife, { x: 96, opacity: 0, duration: 0.22, ease: "power2.in" });
    }
    tl.to(slice, { x: shift, y: 10, rotation: 13, duration: 0.82, ease: "power3.out" }, "-=0.02");
    const frame = slice.parentElement;
    if (frame) tl.to(frame, { x: -2, duration: 0.04, repeat: 5, yoyo: true }, 0.18);
  }

  return (
    <section ref={roomRef} data-screen id="wish" className="screen-section wish-room">
      <div className="wish-glow" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {EMBERS.map((ember) => (
          <span
            key={ember.left + ember.delay}
            className="hero-ember"
            style={{
              left: ember.left,
              animationDelay: ember.delay,
              animationDuration: ember.duration,
            }}
          />
        ))}
      </div>
      <span
        ref={bloomRef}
        className="pointer-events-none absolute left-1/2 top-[46%] z-1 h-72 w-72 rounded-full opacity-0"
        style={{ background: "radial-gradient(circle, rgba(255,220,160,0.75), transparent 68%)" }}
      />

      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-choc`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a56b3c" />
            <stop offset="100%" stopColor="#4a2814" />
          </linearGradient>
          <linearGradient id={`${uid}-cream`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff9f4" />
            <stop offset="100%" stopColor="#f0d2bf" />
          </linearGradient>
          <linearGradient id={`${uid}-frost`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6b0a0" />
            <stop offset="55%" stopColor="#e36b55" />
            <stop offset="100%" stopColor="#c44732" />
          </linearGradient>
          <linearGradient id={`${uid}-flame`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#d6513a" />
            <stop offset="45%" stopColor="#ffb347" />
            <stop offset="100%" stopColor="#fff6d0" />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
      </svg>

      <div className="screen-body relative z-10 flex flex-col items-center justify-center text-center">
        <div key={beat} className="wish-line">
          <p className="section-kicker justify-center">
            {beat === "hold" ? "lights down" : beat === "blow" ? "wish kept" : beat === "slice" ? "all quiet" : "yours"}
          </p>
          <h2 className="font-display mt-3 w-full min-w-0 max-w-full text-[clamp(1.55rem,5.6vw,2.7rem)] leading-[1.12]">
            {beat === "hold" ? (
              <>
                Close your eyes, {who}.
                <span className="mt-1 block text-[0.72em] italic text-amber">Hold the cake. Don’t let go.</span>
              </>
            ) : beat === "blow" ? (
              <>
                It’s yours now.
                <span className="mt-1 block text-[0.72em] italic text-amber">Blow them out.</span>
              </>
            ) : beat === "slice" ? (
              <>
                The room went quiet.
                <span className="mt-1 block text-[0.72em] italic text-amber">Cut yourself a slice.</span>
              </>
            ) : (
              <>
                That’s your piece.
                <span className="mt-1 block text-[0.72em] italic text-amber">Gifts whenever you’re ready.</span>
              </>
            )}
          </h2>
        </div>

        <div ref={stageRef} className="relative mx-auto mt-5 aspect-square w-full max-w-[20.5rem] sm:mt-7">
          <svg
            className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700 ${candlesBlown ? "opacity-0" : "opacity-100"} ${holding || wishMade ? "" : "wish-invite"}`}
            viewBox="0 0 220 220"
            aria-hidden
          >
            <circle cx="110" cy="110" r={RING} fill="none" stroke="rgba(253,252,251,0.12)" strokeWidth="3" />
            <circle
              ref={ringRef}
              cx="110"
              cy="110"
              r={RING}
              fill="none"
              stroke="#e7c56a"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              transform="rotate(-90 110 110)"
              style={{ filter: "drop-shadow(0 0 8px rgba(231,197,106,0.9))" }}
            />
          </svg>

          <div className="wish-cake absolute inset-[13%] grid place-items-center">
            <div className="relative w-full">
              {wishMade && !candlesBlown ? <span className="wish-wind" aria-hidden /> : null}
              <CakeStage
                uid={uid}
                sliceRef={sliceRef}
                knifeRef={knifeRef}
                lit={gusting ? lit : candlesBlown ? 0 : lit}
                gusting={gusting}
                showCut={showCut}
                cut={cut}
                smoked={candlesBlown}
              />
            </div>
          </div>

          {!wishMade && holding ? (
            <p className="pointer-events-none absolute bottom-[7%] left-1/2 z-20 -translate-x-1/2 font-display text-2xl text-[#f3d27a]">
              {seconds}
            </p>
          ) : null}

          {!wishMade ? (
            <button
              type="button"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onContextMenu={(event) => event.preventDefault()}
              className="absolute inset-0 z-10 cursor-pointer touch-none border-0 bg-transparent select-none"
              aria-label={`Press and hold the cake for ${HOLD_SECONDS} seconds to make a wish`}
            />
          ) : !candlesBlown ? (
            <button
              type="button"
              onClick={blowCandles}
              className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent"
              aria-label="Blow out the candles"
            />
          ) : null}
        </div>

        <div className="mt-2 flex min-h-16 flex-col items-center sm:mt-4">
          {!wishMade ? (
            <p className="max-w-xs text-sm text-pearl/50">
              {holding ? "Stay with it. The candles are catching." : "Eight seconds. Lift your finger and the dark comes back."}
            </p>
          ) : !candlesBlown ? (
            <p className="max-w-xs text-sm text-pearl/55">Tap the cake. One breath is enough.</p>
          ) : !cut ? (
            <button type="button" className="wish-action" onClick={cutCake} disabled={cutting}>
              <KnifeMark />
              {cutting ? "Cutting…" : "Take the knife"}
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={next}>
              Open the gifts
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function KnifeMark() {
  return (
    <svg viewBox="0 0 28 14" className="mr-2 h-3.5 w-7" aria-hidden>
      <path d="M1 7 L18 3.5 L18 10.5 Z" fill="#f4efe8" />
      <path d="M18 4.2 h7.5 a2.6 2.6 0 0 1 0 5.2 H18z" fill="#6b3e22" />
    </svg>
  );
}

function CakeStage({
  uid,
  sliceRef,
  knifeRef,
  lit,
  gusting,
  showCut,
  cut,
  smoked,
}: {
  uid: string;
  sliceRef: RefObject<HTMLDivElement | null>;
  knifeRef: RefObject<HTMLDivElement | null>;
  lit: number;
  gusting: boolean;
  showCut: boolean;
  cut: boolean;
  smoked: boolean;
}) {
  return (
    <div className="relative aspect-320/260 w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 260" aria-hidden>
        <ellipse cx="160" cy="236" rx="126" ry="14" fill="#000" opacity="0.45" />
        <ellipse cx="160" cy="226" rx="118" ry="16" fill="#3a2418" />
        <ellipse cx="160" cy="220" rx="102" ry="11" fill="#e6d5c6" />
        <ellipse cx="160" cy="218" rx="88" ry="7" fill="#f7f1ea" />
      </svg>
      <div className="absolute inset-0" style={{ clipPath: "inset(0 38% 0 0)" }}>
        <CakeLayers uid={uid} showCandles lit={lit} gusting={gusting} showCut={showCut} face="left" />
      </div>
      <div ref={sliceRef} className="absolute inset-0" style={{ clipPath: "inset(0 0 0 62%)" }}>
        <CakeLayers uid={uid} showCandles={false} lit={0} gusting={false} showCut={showCut} face="right" />
      </div>
      <div ref={knifeRef} className="pointer-events-none absolute top-[34%] left-[8%] opacity-0" aria-hidden>
        <svg viewBox="0 0 120 36" className="w-28">
          <path d="M4 18 L78 8 L78 28 Z" fill="#f4efe8" />
          <path d="M76 11 h30 a7 7 0 0 1 0 14 H76z" fill="#5c3318" />
          <circle cx="96" cy="18" r="1.7" fill="#e7c56a" />
        </svg>
      </div>
      {smoked
        ? CANDLES.map((x, i) => (
            <span
              key={x}
              className="wish-smoke"
              style={{ left: `${(x / 320) * 100}%`, top: "18%", animationDelay: `${i * 0.18}s` }}
            />
          ))
        : null}
      {cut ? (
        <>
          <span className="absolute bottom-[17%] left-[58%] h-1.5 w-1.5 rounded-full bg-[#f0d2bf]" />
          <span className="absolute bottom-[14%] left-[66%] h-1 w-1 rounded-full bg-[#e7c56a]" />
          <span className="absolute bottom-[19%] left-[71%] h-1 w-1 rounded-full bg-[#c47a62]" />
        </>
      ) : null}
    </div>
  );
}

function CakeLayers({
  uid,
  showCandles,
  lit,
  gusting,
  showCut,
  face,
}: {
  uid: string;
  showCandles: boolean;
  lit: number;
  gusting: boolean;
  showCut: boolean;
  face: "left" | "right";
}) {
  return (
    <svg className="h-full w-full" viewBox="0 0 320 260" aria-hidden>
      <path
        d="M74 168c0-12 32-22 86-22s86 10 86 22v34c0 16-36 26-86 26s-86-10-86-26z"
        fill={`url(#${uid}-choc)`}
      />
      <ellipse cx="160" cy="168" rx="86" ry="16" fill="#c4895a" />
      <ellipse cx="160" cy="166" rx="70" ry="8" fill="#e7c4a2" opacity="0.35" />

      <path
        d="M90 126c0-12 28-20 70-20s70 8 70 20v40c0 14-30 24-70 24s-70-10-70-24z"
        fill={`url(#${uid}-cream)`}
      />
      <ellipse cx="160" cy="126" rx="70" ry="14" fill="#fff9f4" />
      <ellipse cx="160" cy="146" rx="62" ry="9" fill="none" stroke="#d9aa1a" strokeWidth="2.4" />

      <path
        d="M106 90c0-11 22-18 54-18s54 7 54 18v34c0 13-22 22-54 22s-54-9-54-22z"
        fill={`url(#${uid}-frost)`}
      />
      <ellipse cx="160" cy="90" rx="54" ry="12" fill="#f7b2a4" />
      <ellipse cx="146" cy="86" rx="20" ry="4.5" fill="#fff" opacity="0.28" />
      <path d="M124 90c-1 12 5 16 5 16s6-5 5-16" fill="#c44732" />
      <path d="M188 88c0 14 6 18 6 18s6-6 5-18" fill="#c44732" />
      <path d="M156 92c0 9 3 12 3 12s4-4 3-12" fill="#e07a68" />
      <circle cx="138" cy="86" r="3.2" fill="#fff6ee" />
      <circle cx="168" cy="82" r="2.4" fill="#e7c56a" />
      <circle cx="182" cy="90" r="2.8" fill="#fff" />
      <circle cx="150" cy="80" r="2.2" fill="#d6513a" />
      <circle cx="124" cy="84" r="5" fill="#9b2340" />
      <circle cx="122" cy="82" r="1.4" fill="#fff" opacity="0.7" />

      {showCut && face === "left" ? (
        <rect x="188" y="72" width="12" height="154" fill="#2a160e" opacity="0.5" />
      ) : null}
      {showCut && face === "right" ? (
        <rect x="198" y="72" width="10" height="154" fill="#3b2116" opacity="0.55" />
      ) : null}

      {showCandles
        ? CANDLES.map((x, index) => {
            const burning = index < lit;
            return (
              <g key={x}>
                {burning ? (
                  <ellipse
                    cx={x}
                    cy="78"
                    rx="16"
                    ry="8"
                    fill="#ffb35a"
                    opacity="0.35"
                    filter={`url(#${uid}-soft)`}
                  />
                ) : null}
                <rect x={x - 4} y="52" width="8" height="30" rx="2" fill="#fff6ea" />
                <rect x={x - 4} y="70" width="8" height="4" fill="#f0d2bf" opacity="0.7" />
                <rect x={x - 0.6} y="46" width="1.2" height="8" fill="#3a2a22" />
                {burning ? (
                  <g className={gusting ? "wish-flame is-gust" : "wish-flame"} style={{ animationDelay: `${index * 0.14}s` }}>
                    <path
                      d={`M${x} 50 C${x - 7} 40 ${x - 4} 26 ${x} 18 C${x + 5} 28 ${x + 8} 40 ${x} 50`}
                      fill={`url(#${uid}-flame)`}
                    />
                    <path
                      d={`M${x} 46 C${x - 2.5} 40 ${x - 1} 32 ${x} 28 C${x + 1.6} 34 ${x + 2.4} 40 ${x} 46`}
                      fill="#fff6d0"
                      opacity="0.9"
                    />
                  </g>
                ) : null}
              </g>
            );
          })
        : null}
    </svg>
  );
}
