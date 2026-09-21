"use client";

import { fireConfetti } from "@/components/birthday/confetti";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { useEffect } from "react";
import { sfxPrizeReveal, sfxCollect } from "@/lib/sfx";

export function PrizeRevealModal() {
  const { activePrize, spinState, collectPrize, reducedMotion, state } = useExperience();
  const specialWin = state.spinCount >= state.maxSpins && state.maxSpins > 0;
  const { open: vaultOpen } = useVaultLock();

  useEffect(() => {
    if (spinState === "revealed" && activePrize && !reducedMotion) {
      fireConfetti({ particleCount: specialWin ? 120 : 70, origin: { y: 0.45 } });
      sfxPrizeReveal();
    }
  }, [spinState, activePrize, reducedMotion, specialWin]);

  if (!vaultOpen || !activePrize || (spinState !== "revealed" && spinState !== "collecting")) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/75 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-[1.6rem] border border-white/10 bg-surface p-8 text-center text-pearl shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
        <div className="mx-auto h-px w-16 bg-gradient-to-r from-coral to-amber" />
        <p className="mt-5 text-[10px] font-semibold tracking-[0.24em] text-amber">
          {specialWin ? "THE SPECIAL ONE" : "CONGRATULATIONS"}
        </p>
        <div className="mx-auto mt-6 h-36 w-36 overflow-hidden rounded-full border-2 border-[#E7C56A] shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          {activePrize.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activePrize.imageSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-void">
              <span className="font-display text-2xl italic text-accent">
                {(activePrize.shortLabel ?? activePrize.label).slice(0, 1)}
              </span>
            </div>
          )}
        </div>
        <h3 id="prize-title" className="font-display mt-5 text-2xl font-medium">
          You won {activePrize.label}!
        </h3>
        <p className="mt-2 text-sm font-light text-pearl/60">
          {activePrize.description ?? "This one is yours."}
        </p>
        <button type="button" className="btn-primary mt-7 w-full" onClick={() => { sfxCollect(); collectPrize(); }}>
          Keep it
        </button>
      </div>
    </div>
  );
}
