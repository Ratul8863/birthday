"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { useSlides } from "@/components/birthday/slide-nav";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { gsap } from "@/lib/motion";
import { sfxSealBreak, sfxLetterUnfold, sfxUnlock, sfxDeny } from "@/lib/sfx";

export function BirthdayLetter() {
  const { config, setMusicVolumeFactor, reducedMotion } = useExperience();
  const { open: vaultOpen, unlock } = useVaultLock();
  const { next } = useSlides();
  const sheetRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const lineRefs = useRef<Array<HTMLElement | null>>([]);
  const sealedHeight = useRef(0);
  const busy = useRef(false);
  const [opened, setOpened] = useState(false);
  const [asking, setAsking] = useState(false);
  const [word, setWord] = useState("");
  const [misses, setMisses] = useState(0);

  const [salutation, ...paragraphs] = config.letter.body;
  const dear = config.recipient.dearName || config.recipient.name;
  const shownName = vaultOpen ? dear : "****";
  const initial = vaultOpen ? dear.trim().slice(0, 1) || "•" : "•";

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || opened) return;
    if (reducedMotion) {
      gsap.set(sheet, { opacity: 1, y: 0, rotate: 0 });
      return;
    }
    const tween = gsap.fromTo(
      sheet,
      { y: 64, rotate: -8, opacity: 0 },
      { y: 0, rotate: -3.4, opacity: 1, duration: 1.05, ease: "power3.out" },
    );
    return () => {
      tween.kill();
    };
  }, [opened, reducedMotion]);

  useLayoutEffect(() => {
    if (!opened || !sheetRef.current) return;
    const sheet = sheetRef.current;
    const lines = lineRefs.current.filter((node): node is HTMLElement => Boolean(node));
    const endHeight = sheet.offsetHeight;

    sfxLetterUnfold();

    if (reducedMotion) {
      gsap.set(sheet, { rotate: 0, opacity: 1, height: "auto" });
      gsap.set(lines, { opacity: 1, y: 0 });
      if (railRef.current) gsap.set(railRef.current, { scaleY: 1 });
      if (ruleRef.current) gsap.set(ruleRef.current, { scaleX: 1 });
      return;
    }

    gsap.set(lines, { opacity: 0, y: 16 });
    if (railRef.current) gsap.set(railRef.current, { scaleY: 0, transformOrigin: "top" });
    if (ruleRef.current) gsap.set(ruleRef.current, { scaleX: 0, transformOrigin: "left" });
    sheet.style.overflow = "hidden";

    const tl = gsap.timeline({
      onComplete: () => {
        sheet.style.overflow = "";
        sheet.style.height = "auto";
      },
    });
    tl.fromTo(
      sheet,
      { height: sealedHeight.current || endHeight },
      { height: endHeight, duration: 0.7, ease: "power3.inOut" },
    );
    if (railRef.current) {
      tl.to(railRef.current, { scaleY: 1, duration: 0.8, ease: "power2.out" }, 0.15);
    }
    if (ruleRef.current) {
      tl.to(ruleRef.current, { scaleX: 1, duration: 0.45, ease: "power2.out" }, 0.85);
    }
    tl.to(
      lines,
      { opacity: 1, y: 0, duration: 0.48, stagger: 0.1, ease: "power2.out" },
      0.22,
    );

    return () => {
      tl.kill();
    };
  }, [opened, reducedMotion]);

  function requestSeal() {
    if (opened || busy.current) return;
    if (vaultOpen) {
      breakSeal();
      return;
    }
    setAsking(true);
  }

  function submitWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unlock(word)) {
      sfxUnlock();
      setAsking(false);
      breakSeal();
      return;
    }
    sfxDeny();
    setMisses((count) => count + 1);
  }

  function breakSeal() {
    if (opened || busy.current) return;
    busy.current = true;
    sfxSealBreak();
    setMusicVolumeFactor(0.85);
    sealedHeight.current = sheetRef.current?.offsetHeight ?? 0;

    if (reducedMotion || !sheetRef.current) {
      setOpened(true);
      return;
    }

    gsap.killTweensOf(sheetRef.current);
    const tl = gsap.timeline({ onComplete: () => setOpened(true) });
    tl.to(sealRef.current, { scale: 1.12, xPercent: -50, yPercent: -50, duration: 0.1, ease: "power2.out" })
      .to(sealRef.current, {
        scale: 1.7,
        opacity: 0,
        xPercent: -50,
        yPercent: -50,
        duration: 0.28,
        ease: "power2.in",
      })
      .to(sheetRef.current, { rotate: 0, duration: 0.55, ease: "power3.inOut" }, 0.08);
  }

  return (
    <section data-screen id="letter" className="screen-section letter-room">
      <div className="letter-lamp" aria-hidden />

      <div className="screen-body relative z-10 !pt-16 !pb-16">
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center">
          <div
            className="pointer-events-none mx-auto h-8 w-[68%] rounded-[100%] bg-black/50 blur-xl"
            aria-hidden
          />

          <div ref={sheetRef} className={`letter-sheet ${opened ? "is-open" : ""}`}>
            {opened ? (
              <div className="px-5 py-6 sm:px-10 sm:py-9">
                <div
                  ref={(node) => {
                    lineRefs.current[0] = node;
                  }}
                  className="flex items-baseline justify-between gap-4"
                >
                  <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-accent uppercase">
                    {config.letter.intro}
                  </p>
                  <p className="text-[0.68rem] font-medium tracking-[0.14em] text-ink/40 uppercase">
                    {config.recipient.birthday}
                  </p>
                </div>

                <div className="relative mt-5 pl-5">
                  <span ref={railRef} className="absolute top-1 bottom-1 left-0 w-px bg-accent/80" />

                  {salutation ? (
                    <h2
                      ref={(node) => { lineRefs.current[1] = node; }}
                      className="font-display max-w-full text-[clamp(2rem,7vw,3.5rem)] leading-none text-ink"
                    >
                      {salutation}
                    </h2>
                  ) : null}

                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={paragraph}
                      ref={(node) => { lineRefs.current[index + 2] = node; }}
                      className="mt-4 text-[15.5px] leading-7 text-ink/80"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {config.letter.signoff ? (
                    <div
                      ref={(node) => {
                        lineRefs.current[paragraphs.length + 2] = node;
                      }}
                      className="mt-6"
                    >
                      <p className="font-display text-[1.85rem] leading-none text-accent">
                        {config.letter.signoff}
                      </p>
                      <span ref={ruleRef} className="mt-2 block h-px w-16 origin-left bg-accent" />
                    </div>
                  ) : null}
                </div>

                <p
                  ref={(node) => { lineRefs.current[paragraphs.length + 3] = node; }}
                  className="mt-6 text-sm text-ink/50"
                >
                  Also — yeah, I got you stuff.
                </p>

                <button
                  ref={(node) => { lineRefs.current[paragraphs.length + 4] = node; }}
                  type="button"
                  className="btn-primary mt-6"
                  onClick={next}
                >
                  See the photos
                </button>
              </div>
            ) : (
              <div className="relative block w-full text-center">
                <div className="letter-flap" />
                <button
                  type="button"
                  ref={sealRef}
                  className={`letter-seal ${vaultOpen ? "" : "is-locked"}`}
                  onClick={requestSeal}
                  aria-label={vaultOpen ? `Open the letter for ${dear}` : "Tap the seal and say the word"}
                >
                  {vaultOpen ? initial : "tap"}
                </button>
                <div className="px-8 pt-8 pb-7">
                  <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-accent uppercase">
                    {config.letter.intro}
                  </p>
                  <p
                    className={`font-display mt-3 max-w-full text-[clamp(1.7rem,6vw,2.6rem)] leading-none text-ink ${vaultOpen ? "" : "tracking-[0.14em] sm:tracking-[0.28em]"}`}
                  >
                    {shownName}
                  </p>
                  <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-ink/55">
                    I wrote this, deleted it, then wrote it again.
                  </p>
                  {asking ? (
                    <form key={misses} onSubmit={submitWord} className={`mt-5 ${misses ? "vault-deny" : ""}`}>
                      <label htmlFor="vault-word" className="text-[0.72rem] font-semibold tracking-[0.16em] text-ink/70 uppercase">
                        Say the word
                      </label>
                      <input
                        id="vault-word"
                        type="password"
                        value={word}
                        autoComplete="off"
                        autoFocus
                        onChange={(event) => setWord(event.target.value)}
                        placeholder="the word"
                        className="vault-word mt-3"
                      />
                      {misses > 0 ? (
                        <p className="mt-3 text-sm text-accent" role="alert">
                          That’s not the one.
                        </p>
                      ) : null}
                      <button type="submit" className="btn-primary mt-5">
                        Open it
                      </button>
                    </form>
                  ) : vaultOpen ? (
                    <button type="button" onClick={requestSeal} className="btn-primary mt-5">
                      Open the letter
                    </button>
                  ) : (
                    <>
                      <p className="mx-auto mt-5 max-w-[16rem] text-sm leading-relaxed text-ink/70">
                        Tap the red seal. It’s locked until you say the word.
                      </p>
                      <button type="button" onClick={requestSeal} className="btn-primary mt-4">
                        Tap the seal
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {!opened ? (
            <button type="button" className="btn-ghost mx-auto mt-6" onClick={next}>
              Leave it for now
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
