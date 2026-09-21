"use client";

import { useSlides } from "@/components/birthday/slide-nav";

export function NextScreenControl() {
  const { next, isLast } = useSlides();
  if (isLast) return null;

  return (
    <button
      type="button"
      onClick={next}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/12 bg-[#111113]/90 px-5 py-3 text-sm font-medium text-[#f7f5f2] backdrop-blur-md"
      aria-label="Next slide"
    >
      Next
    </button>
  );
}
