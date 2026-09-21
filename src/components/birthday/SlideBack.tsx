"use client";

import { useSlides } from "@/components/birthday/slide-nav";

export function SlideBack() {
  const { back } = useSlides();

  return (
    <button
      type="button"
      onClick={back}
      className="fixed left-4 top-4 z-50 min-h-11 rounded-xl border border-white/15 bg-[#111113]/80 px-3.5 text-sm font-medium text-[#f7f5f2] backdrop-blur-md"
      aria-label="Go back to the previous section"
    >
      Back
    </button>
  );
}
