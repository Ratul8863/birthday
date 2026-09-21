"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createAudioController, type AudioController } from "@/lib/audio";
import type {
  ExperiencePhase,
  ExperienceState,
  PublicGift,
  SpinState,
} from "@/types/birthday";
import type { getPublicConfig } from "@/lib/experience-service";

export type ExperienceConfig = ReturnType<typeof getPublicConfig>;
export type HeroVariation = ExperienceConfig["hero"][number];

function pickHeroVariation(total: number): number {
  const key = "birthday-hero-used";
  try {
    const raw = localStorage.getItem(key);
    const used: number[] = raw ? JSON.parse(raw) : [];
    const available = Array.from({ length: total }, (_, i) => i).filter(
      (i) => !used.includes(i),
    );
    if (available.length === 0) {
      const pick = Math.floor(Math.random() * total);
      localStorage.setItem(key, JSON.stringify([pick]));
      return pick;
    }
    const pick = available[Math.floor(Math.random() * available.length)];
    localStorage.setItem(key, JSON.stringify([...used, pick]));
    return pick;
  } catch {
    return Math.floor(Math.random() * total);
  }
}

type ExperienceContextValue = {
  token: string;
  config: ExperienceConfig;
  heroVariation: HeroVariation;
  state: ExperienceState;
  phase: ExperiencePhase;
  setPhase: (phase: ExperiencePhase) => void;
  spinState: SpinState;
  setSpinState: (s: SpinState) => void;
  activePrize: PublicGift | null;
  setActivePrize: (g: PublicGift | null) => void;
  audioPlaying: boolean;
  audioEnabled: boolean;
  reducedMotion: boolean;
  wishMade: boolean;
  setWishMade: (v: boolean) => void;
  candlesBlown: boolean;
  setCandlesBlown: (v: boolean) => void;
  startExperience: () => Promise<void>;
  toggleMusic: () => Promise<void>;
  setMusicVolumeFactor: (factor: number) => void;
  refreshState: () => Promise<void>;
  requestSpin: () => Promise<{ gift: PublicGift; selectedIndex: number } | null>;
  collectPrize: () => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used within ExperienceProvider");
  return ctx;
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

type ProviderProps = {
  token: string;
  initialConfig: ExperienceConfig;
  initialState: ExperienceState;
  children: ReactNode;
};

export function ExperienceProvider({
  token,
  initialConfig,
  initialState,
  children,
}: ProviderProps) {
  const [config] = useState(initialConfig);
  const [state, setState] = useState(initialState);
  const [phase, setPhase] = useState<ExperiencePhase>("gate");
  const [heroVariation] = useState<HeroVariation>(() => {
    if (initialConfig.hero.length <= 1) return initialConfig.hero[0];
    const idx = pickHeroVariation(initialConfig.hero.length);
    return initialConfig.hero[idx];
  });
  const [spinState, setSpinState] = useState<SpinState>("idle");
  const [activePrize, setActivePrize] = useState<PublicGift | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [wishMade, setWishMade] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const audioRef = useRef<AudioController | null>(null);
  const baseVolume = config.audio.initialVolume ?? 0.55;

  useEffect(() => {
    const controller = createAudioController(config.audio.trackSrc, baseVolume);
    audioRef.current = controller;
    return () => {
      controller.destroy();
      audioRef.current = null;
    };
  }, [config.audio.trackSrc, baseVolume]);

  const startExperience = useCallback(async () => {
    setAudioEnabled(true);
    const ok = await audioRef.current?.unlockAndPlay();
    setAudioPlaying(Boolean(ok));
    setPhase("reveal");
  }, []);

  const toggleMusic = useCallback(async () => {
    if (!audioRef.current) return;
    if (audioRef.current.isPlaying()) {
      audioRef.current.pause();
      setAudioPlaying(false);
      return;
    }
    const ok = await audioRef.current.play();
    setAudioPlaying(ok);
    if (ok) setAudioEnabled(true);
  }, []);

  const setMusicVolumeFactor = useCallback(
    (factor: number) => {
      if (!audioRef.current || !audioRef.current.isPlaying()) return;
      audioRef.current.setVolume(baseVolume * factor);
    },
    [baseVolume],
  );

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch(`/api/experience/${token}`);
      if (!res.ok) return;
      const data = await res.json();
      setState(data.state);
      if (data.state.completed) setPhase("completed");
    } catch {
      // keep local state
    }
  }, [token]);

  const spinLock = useRef(false);

  const requestSpin = useCallback(async () => {
    if (spinLock.current || spinState !== "idle" || state.remainingSpins <= 0) return null;
    spinLock.current = true;
    setSpinState("requesting");
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      const res = await fetch(`/api/experience/${token}/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        spinLock.current = false;
        if (data.state) setState(data.state);
        setSpinState("idle");
        return null;
      }
      setState(data.state);
      setActivePrize(data.gift);
      setSpinState("spinning");
      return { gift: data.gift as PublicGift, selectedIndex: data.selectedIndex as number };
    } catch {
      spinLock.current = false;
      setSpinState("idle");
      return null;
    }
  }, [spinState, state.remainingSpins, token]);

  const collectPrize = useCallback(() => {
    spinLock.current = false;
    const done = state.remainingSpins <= 0 || state.completed;
    setActivePrize(null);
    setSpinState("idle");
    if (done) setPhase("completed");
    void refreshState();
  }, [state.remainingSpins, state.completed, refreshState]);

  const value = useMemo<ExperienceContextValue>(
    () => ({
      token,
      config,
      heroVariation,
      state,
      phase,
      setPhase,
      spinState,
      setSpinState,
      activePrize,
      setActivePrize,
      audioPlaying,
      audioEnabled,
      reducedMotion,
      wishMade,
      setWishMade,
      candlesBlown,
      setCandlesBlown,
      startExperience,
      toggleMusic,
      setMusicVolumeFactor,
      refreshState,
      requestSpin,
      collectPrize,
    }),
    [
      token,
      config,
      heroVariation,
      state,
      phase,
      spinState,
      activePrize,
      audioPlaying,
      audioEnabled,
      reducedMotion,
      wishMade,
      candlesBlown,
      startExperience,
      toggleMusic,
      setMusicVolumeFactor,
      refreshState,
      requestSpin,
      collectPrize,
    ],
  );

  return (
    <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
  );
}
