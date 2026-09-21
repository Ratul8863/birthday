"use client";

export type AudioController = {
  play: () => Promise<boolean>;
  pause: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isPlaying: () => boolean;
  unlockAndPlay: () => Promise<boolean>;
  destroy: () => void;
};

function createContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

export function createAudioController(
  src: string,
  initialVolume = 0.55,
): AudioController {
  const ctx = createContext();
  const gain = ctx?.createGain() ?? null;
  let volume = initialVolume;
  let playing = false;
  let userPaused = false;
  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let startedAt = 0;
  let offset = 0;
  let loadPromise: Promise<boolean> | null = null;

  if (gain && ctx) {
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    void load();
  }

  function rememberOffset() {
    if (!ctx || !buffer || !playing) return;
    const elapsed = ctx.currentTime - startedAt;
    offset = (offset + elapsed) % buffer.duration;
  }

  function stopSource() {
    if (!source) return;
    rememberOffset();
    try {
      source.stop();
    } catch {
      // already stopped
    }
    source.disconnect();
    source = null;
    playing = false;
  }

  function startSource(from: number) {
    if (!ctx || !gain || !buffer) return;
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    node.connect(gain);
    const startAt = buffer.duration > 0 ? from % buffer.duration : 0;
    offset = startAt;
    startedAt = ctx.currentTime;
    node.start(0, startAt);
    source = node;
    playing = true;
  }

  async function load(): Promise<boolean> {
    if (!ctx) return false;
    if (buffer) return true;
    if (!loadPromise) {
      loadPromise = (async () => {
        const res = await fetch(src);
        if (!res.ok) {
          loadPromise = null;
          return false;
        }
        const data = await res.arrayBuffer();
        buffer = await ctx.decodeAudioData(data);
        return true;
      })().catch(() => {
        loadPromise = null;
        return false;
      });
    }
    return loadPromise;
  }

  async function begin(fromStart: boolean, fadeSec: number): Promise<boolean> {
    if (!ctx || !gain) return false;
    userPaused = false;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }
    const ok = await load();
    if (!ok || !buffer || userPaused) return false;
    if (playing && source) return true;
    if (fromStart) offset = 0;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    startSource(offset);
    gain.gain.linearRampToValueAtTime(volume, now + fadeSec);
    return true;
  }

  return {
    play() {
      return begin(false, 0.25);
    },
    pause() {
      userPaused = true;
      if (ctx && gain) gain.gain.cancelScheduledValues(ctx.currentTime);
      stopSource();
    },
    setVolume(next) {
      volume = Math.min(1, Math.max(0, next));
      if (!ctx || !gain) return;
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.08);
    },
    getVolume() {
      return volume;
    },
    isPlaying() {
      return playing;
    },
    unlockAndPlay() {
      return begin(true, 0.8);
    },
    destroy() {
      userPaused = true;
      stopSource();
      void ctx?.close();
    },
  };
}
