"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSlides } from "@/components/birthday/slide-nav";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { VaultWordForm } from "@/components/birthday/VaultWordForm";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { sfxCardToss } from "@/lib/sfx";

export function MemoryJourney() {
  const { config } = useExperience();
  const { open: vaultOpen } = useVaultLock();
  const { next } = useSlides();
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const busy = useRef(false);
  const photos = config.memories;
  const dear = config.recipient.dearName || config.recipient.name;
  const memory = photos[index];
  const done = index >= photos.length;

  function toss(dir: 1 | -1) {
    const el = cardRef.current;
    if (!el || busy.current) return;
    busy.current = true;
    sfxCardToss();
    const finish = () => {
      busy.current = false;
      setIndex((n) => n + 1);
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    gsap.to(el, {
      x: dir * 420,
      rotate: dir * 16,
      opacity: 0,
      duration: 0.38,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(el, { clearProps: "transform,opacity" });
        finish();
      },
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (busy.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, dx: 0 };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const el = cardRef.current;
    if (!start || !el || busy.current) return;
    const dx = event.clientX - start.x;
    start.dx = dx;
    gsap.set(el, { x: dx, rotate: dx / 22 });
  }

  function onPointerUp() {
    const dx = drag.current?.dx ?? 0;
    drag.current = null;
    if (Math.abs(dx) < 8) {
      toss(-1);
      return;
    }
    if (Math.abs(dx) > 72) {
      toss(dx > 0 ? 1 : -1);
      return;
    }
    const el = cardRef.current;
    if (!el) return;
    gsap.to(el, { x: 0, rotate: 0, duration: 0.35, ease: "power3.out" });
  }

  return (
    <section data-screen id="memories" className="screen-section stage-light">
      {!vaultOpen ? (
        <div className="screen-body flex flex-col items-center text-center">
          <p className="section-kicker justify-center">still covered</p>
          <h2 className="font-display mt-3 w-full min-w-0 text-[clamp(1.7rem,6vw,3rem)] text-ink">These stay shut</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink/55">
            The pictures stay covered until you say the word.
          </p>
          <div className="relative mx-auto mt-6 h-52 w-full max-w-[13.75rem]">
            <div
              aria-hidden
              className="absolute inset-x-3 top-4 h-full rounded-[1.15rem] bg-[#efe8dc] shadow-[0_10px_24px_rgba(22,22,26,0.06)]"
              style={{ transform: "rotate(-3deg)" }}
            />
            <div
              aria-hidden
              className="absolute inset-x-2 top-2 h-full rounded-[1.15rem] bg-[#f6f1e8] shadow-[0_10px_24px_rgba(22,22,26,0.06)]"
              style={{ transform: "rotate(2.4deg)" }}
            />
            <div className="relative flex h-full items-center justify-center rounded-[1.15rem] bg-[#faf7f2] shadow-[0_22px_40px_rgba(22,22,26,0.14)] ring-1 ring-ink/8">
              <p className="font-display text-2xl text-ink/35">Covered</p>
            </div>
          </div>
          <div className="mt-8">
            <VaultWordForm id="vault-word-photos" />
          </div>
          <button type="button" className="mt-4 text-sm font-medium text-ink/45" onClick={next}>
            Keep going
          </button>
        </div>
      ) : (
        <div className="screen-body flex flex-col items-center text-center">
        <p className="section-kicker justify-center">{done ? "that’s the stack" : "from the pile"}</p>
        <h2 className="font-display mt-3 w-full min-w-0 text-[clamp(1.7rem,6vw,3rem)] text-ink">
          {done ? `That’s the pile, ${dear}` : `${dear}, toss this one`}
        </h2>

        <div className="relative mx-auto mt-8 w-full max-w-[18.75rem]">
          {!done &&
            [2, 1].map((offset) => {
              const photo = photos[index + offset];
              if (!photo) return null;
              return (
                <div
                  key={photo.id}
                  aria-hidden
                  className="absolute inset-0 rounded-[1.15rem] bg-[#f3efe8] shadow-[0_10px_24px_rgba(22,22,26,0.06)]"
                  style={{
                    transform: `rotate(${offset === 1 ? 3 : -2.5}deg) scale(${offset === 1 ? 0.97 : 0.94})`,
                    transformOrigin: "center center",
                  }}
                />
              );
            })}

          {memory ? (
            <div
              key={memory.id}
              ref={cardRef}
              className="relative w-full cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="rounded-[1.15rem] bg-[#faf7f2] p-3 pb-4 shadow-[0_22px_40px_rgba(22,22,26,0.14)] ring-1 ring-ink/8">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-sand">
                  <Image
                    src={memory.src}
                    alt={memory.alt}
                    fill
                    sizes="300px"
                    className="pointer-events-none object-cover object-center"
                    draggable={false}
                  />
                </div>
                <p className="font-display mt-4 px-1 text-left text-[1.05rem] leading-snug text-ink/80">
                  {memory.caption}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-end justify-center">
              <button type="button" className="btn-primary" onClick={next}>
                There’s more
              </button>
            </div>
          )}
        </div>

        {!done ? <p className="mt-5 text-sm text-ink/40">Drag it off. Or just tap.</p> : null}
        </div>
      )}
    </section>
  );
}
