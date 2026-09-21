"use client";

import { fireCelebration } from "@/components/birthday/confetti";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { useSlides } from "@/components/birthday/slide-nav";
import { gsap } from "@/lib/motion";
import { sfxCelebration, sfxSealStamp, sfxConfetti } from "@/lib/sfx";
import type { PublicGift } from "@/types/birthday";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const TIMES = [
  ["17:00", "5:00"],
  ["17:30", "5:30"],
  ["18:00", "6:00"],
  ["18:30", "6:30"],
  ["19:00", "7:00"],
  ["19:30", "7:30"],
  ["20:00", "8:00"],
  ["20:30", "8:30"],
  ["21:00", "9:00"],
  ["21:30", "9:30"],
  ["22:00", "10:00"],
  ["22:30", "10:30"],
] as const;

const TILTS = [-2.4, 1.8, -1.2, 2.2, -1.7];

function labelFor(time: string) {
  const short = TIMES.find(([value]) => value === time)?.[1] ?? time;
  return `${short} PM`;
}

function inkOn(hex: string) {
  const n = hex.replace("#", "");
  if (n.length < 6) return "#1c1612";
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  const y = (r * 299 + g * 587 + b * 114) / 1000;
  return y > 168 ? "#1c1612" : "#fffaf6";
}

function GiftFace({ gift }: { gift: PublicGift }) {
  const [broken, setBroken] = useState(false);
  if (gift.imageSrc && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={gift.imageSrc} alt="" onError={() => setBroken(true)} />
    );
  }
  return <span style={{ color: inkOn(gift.color) }}>{gift.shortLabel ?? gift.label}</span>;
}

export function FinalCelebration() {
  const { token, config, state, setMusicVolumeFactor, reducedMotion, setPhase } = useExperience();
  const { open: vaultOpen } = useVaultLock();
  const { goTo } = useSlides();
  const rootRef = useRef<HTMLElement>(null);
  const giftsRef = useRef<HTMLUListElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const [celebrated, setCelebrated] = useState(false);
  const [restaurant, setRestaurant] = useState(state.plan?.restaurant ?? "");
  const [time, setTime] = useState(state.plan?.time ?? "19:00");
  const [saved, setSaved] = useState(state.plan);
  const [editing, setEditing] = useState(!state.plan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.completed) setPhase("completed");
  }, [setPhase, state.completed]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pieces = root.querySelectorAll("[data-rise]");
    if (reducedMotion) {
      gsap.set(pieces, { autoAlpha: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pieces,
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.09, ease: "power3.out" },
      );
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const seal = sealRef.current;
    if (!seal || editing || !saved) return;
    sfxSealStamp();
    if (reducedMotion) {
      gsap.set(seal, { autoAlpha: 1, scale: 1, rotation: -8 });
      return;
    }
    gsap.fromTo(
      seal,
      { autoAlpha: 0, scale: 0.35, rotation: -24 },
      { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.55, ease: "back.out(1.8)" },
    );
  }, [editing, reducedMotion, saved]);

  function celebrate() {
    setCelebrated(true);
    setMusicVolumeFactor(1);
    sfxCelebration();
    if (!reducedMotion) {
      fireCelebration();
      const list = giftsRef.current;
      if (list) {
        list.classList.remove("is-hop");
        void list.offsetWidth;
        list.classList.add("is-hop");
      }
    }
    if (state.completed) setPhase("completed");
  }

  function replay() {
    goTo(0);
  }

  async function savePlan() {
    const name = restaurant.trim();
    if (!name) {
      setError("Tell me the place first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/experience/${token}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant: name, time }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn’t save that.");
        return;
      }
      setSaved(data.state.plan);
      setEditing(false);
      if (!reducedMotion) { fireCelebration(); sfxConfetti(); }
    } catch {
      setError("Couldn’t save that.");
    } finally {
      setSaving(false);
    }
  }

  const showForm = editing || !saved;

  return (
    <section ref={rootRef} data-screen id="final" className="screen-section finale">
      <div className="screen-body text-center">
        <div className="mx-auto w-full max-w-lg">
          <div data-rise>
            <p className="section-kicker justify-center">that’s a wrap</p>
            <h2 className="font-display mt-4 w-full min-w-0 text-[clamp(1.85rem,6vw,3.6rem)] leading-[1.05]">
              {config.final.headline}
            </h2>
            <div className="mx-auto mt-5 max-w-md space-y-2.5">
              {config.final.body.map((line) => (
                <p key={line} className="text-sm leading-relaxed text-pearl/60 sm:text-base">
                  {line}
                </p>
              ))}
            </div>
            <p className="finale-name font-display mt-8 w-full min-w-0 text-[clamp(1.45rem,4.5vw,2.5rem)] italic text-accent">
              Happy birthday, {config.recipient.name}.
            </p>
            <p className="mt-3 text-sm text-pearl/50">{config.final.closing}</p>
          </div>

          {vaultOpen && state.wonGifts.length > 0 ? (
            <div data-rise className="finale-table">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pearl/40">
                On the table
              </p>
              <ul ref={giftsRef} className="finale-gifts">
                {state.wonGifts.map((gift, index) => (
                  <li
                    key={gift.id}
                    className="finale-gift"
                    style={{
                      ["--tilt" as string]: `${TILTS[index % TILTS.length]}deg`,
                      ["--delay" as string]: `${index * 0.07}s`,
                    }}
                  >
                    <span className="finale-gift-face" style={{ background: gift.color }}>
                      <GiftFace gift={gift} />
                    </span>
                    <span className="finale-gift-label">{gift.label}</span>
                    {gift.description ? <span className="finale-gift-note">{gift.description}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showForm ? (
            <form
              data-rise
              className="finale-card"
              onSubmit={(event) => {
                event.preventDefault();
                void savePlan();
              }}
            >
              <p className="finale-card-kicker">Tomorrow evening</p>
              <h3 className="font-display">Where should we eat?</h3>
              <p className="finale-card-note">After five. You name the place. I’ll be there.</p>

              <fieldset className="mt-5 border-0 p-0">
                <legend className="text-[11px] font-semibold tracking-[0.14em] text-[#1c1612]/55 uppercase">
                  Time
                </legend>
                <div className="finale-times" role="radiogroup" aria-label="Time">
                  {TIMES.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={time === value}
                      className={`finale-time${time === value ? " is-on" : ""}`}
                      onClick={() => setTime(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 block text-[11px] font-semibold tracking-[0.14em] text-[#1c1612]/55 uppercase" htmlFor="restaurant">
                Restaurant
              </label>
              <input
                id="restaurant"
                value={restaurant}
                onChange={(event) => setRestaurant(event.target.value)}
                placeholder="The place"
                maxLength={80}
                className="finale-place"
              />

              <button type="submit" className="btn-primary mt-5 w-full" disabled={saving}>
                {saving ? "Setting it…" : "Set the table"}
              </button>
              {error ? <p className="mt-3 text-sm text-[#9a3324]">{error}</p> : null}
            </form>
          ) : saved ? (
            <article data-rise className="finale-card" aria-live="polite">
              <div ref={sealRef} className="finale-seal" aria-hidden>
                set
              </div>
              <p className="finale-card-kicker">It’s a date</p>
              <h3 className="font-display pr-20">{saved.restaurant}</h3>
              <p className="finale-when">{labelFor(saved.time)}</p>
              <p className="finale-card-note">Tomorrow. I’ll be there.</p>
              <button type="button" className="finale-change" onClick={() => setEditing(true)}>
                Change it
              </button>
            </article>
          ) : null}

          <div data-rise className="mt-10 flex flex-col items-center gap-3">
            <button type="button" className="btn-primary finale-encore min-w-[200px]" onClick={celebrate}>
              One more silly moment
            </button>
            {celebrated ? <p className="text-sm text-pearl/60">Okay yeah — that was cute.</p> : null}
            <button type="button" className="btn-ghost" onClick={replay}>
              Start over from the top
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
