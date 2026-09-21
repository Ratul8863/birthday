"use client";

import { createContext, useContext } from "react";

export type SlideNav = {
  index: number;
  total: number;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
};

export const SlideContext = createContext<SlideNav | null>(null);

export function useSlides() {
  const ctx = useContext(SlideContext);
  if (!ctx) throw new Error("useSlides must be used inside the story deck");
  return ctx;
}
