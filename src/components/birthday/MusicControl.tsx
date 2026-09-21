"use client";

import { useExperience } from "@/components/birthday/ExperienceContext";

export function MusicControl() {
  const { audioEnabled, audioPlaying, toggleMusic, phase } = useExperience();
  if (phase === "gate" && !audioEnabled) return null;

  return (
    <button
      type="button"
      onClick={() => void toggleMusic()}
      className="fixed bottom-6 right-5 z-50 rounded-xl border border-white/12 bg-void/85 px-3.5 py-2.5 text-xs font-medium text-pearl/80 backdrop-blur-md"
      aria-label={audioPlaying ? "Pause music" : "Play music"}
    >
      {audioPlaying ? "Pause" : "Play"}
    </button>
  );
}
