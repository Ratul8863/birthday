"use client";

import { useExperience } from "@/components/birthday/ExperienceContext";

const STEPS = ["Letter", "Photos", "Wish", "Gifts"] as const;

export function ExperienceProgress() {
  const { phase } = useExperience();
  if (phase === "gate" || phase === "reveal") return null;

  const active =
    phase === "story" ? 0 : phase === "cake" ? 2 : phase === "gifts" ? 3 : phase === "completed" ? 3 : 1;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-40 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/10 bg-void/50 px-2.5 py-1.5 backdrop-blur-md"
      aria-hidden
    >
      {STEPS.map((label, i) => (
        <span
          key={label}
          title={label}
          className={`h-1 w-5 rounded-full ${i <= active ? "bg-accent" : "bg-white/15"}`}
        />
      ))}
    </div>
  );
}
