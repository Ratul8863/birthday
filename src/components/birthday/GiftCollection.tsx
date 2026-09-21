"use client";

import { useExperience } from "@/components/birthday/ExperienceContext";
import { useVaultLock } from "@/components/birthday/useVaultLock";

export function GiftCollection() {
  const { config, state, spinState } = useExperience();
  const { open: vaultOpen } = useVaultLock();
  const showSpecial = vaultOpen && (state.noteSaved || state.spinCount >= config.spinner.maxSpins);
  const slotCount = showSpecial ? config.spinner.maxSpins : Math.max(1, config.spinner.maxSpins - 1);
  const landed = !vaultOpen
    ? []
    : spinState === "spinning"
      ? state.wonGifts.slice(0, -1)
      : state.wonGifts;
  const slots = Array.from({ length: slotCount }, (_, i) => landed[i] ?? null);

  return (
    <div className="mx-auto mt-12 max-w-xl">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-pearl/40">
        What you’ve got so far
      </p>
      <ul className="mt-4 flex flex-wrap justify-center gap-3">
        {slots.map((gift, i) => {
          const specialSlot = showSpecial && i === slots.length - 1;
          return (
          <li
            key={gift?.id ?? `empty-${i}`}
            className="flex w-16 flex-col items-center gap-1.5 text-center"
            aria-label={gift ? gift.label : specialSlot ? "Special spin" : `Gift slot ${i + 1}`}
          >
            <span
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border"
              style={{
                background: gift ? "#2a1814" : "rgba(255,255,255,0.03)",
                borderColor: gift || specialSlot ? "rgba(231,197,106,0.7)" : "rgba(255,255,255,0.08)",
              }}
            >
              {gift?.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gift.imageSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-pearl/30">{specialSlot ? "★" : "·"}</span>
              )}
            </span>
            <span className={`text-[10px] font-semibold leading-tight ${gift ? "text-pearl" : "text-pearl/25"}`}>
              {gift ? (gift.shortLabel ?? gift.label) : specialSlot ? "special" : "·"}
            </span>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
