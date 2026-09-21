import { birthdayConfig, getPublicGifts } from "@/lib/birthday-config";
import {
  getStoredExperience,
  saveStoredExperience,
  toPublicState,
  type StoredExperience,
} from "@/lib/experience-store";
import { readRemoteNote, seedRemoteNote, writeRemoteNote } from "@/lib/note-store";
import { sendNoteEmail } from "@/lib/send-note-email";
import type { GiftConfig, PublicGift, SpinnerMode } from "@/types/birthday";

function giftsByIdMap(): Map<string, PublicGift> {
  return new Map(getPublicGifts().map((g) => [g.id, g]));
}

function createInitial(token: string): StoredExperience {
  const now = new Date().toISOString();
  return {
    token,
    maxSpins: birthdayConfig.spinner.maxSpins,
    spinCount: 0,
    wonGiftIds: [],
    completed: false,
    mode: birthdayConfig.spinner.mode,
    guaranteedGiftIds: birthdayConfig.spinner.guaranteedGiftIds ?? [],
    spinningLockUntil: 0,
    note: null,
    noteWrites: 0,
    plan: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getOrCreateExperience(token: string) {
  let record = getStoredExperience(token);
  if (!record) {
    record = createInitial(token);
    saveStoredExperience(record);
  } else {
    record = reconcileRecord(record);
  }
  record = await hydrateNote(record);
  return toPublicState(record, giftsByIdMap());
}

async function hydrateNote(record: StoredExperience) {
  try {
    const remote = await readRemoteNote(record.token);
    if (remote) {
      const next = { ...record, note: remote.body, noteWrites: remote.writes };
      saveStoredExperience(next);
      return next;
    }
    if (record.note?.trim()) {
      await seedRemoteNote(record.token, record.note.trim(), record.noteWrites || 1);
    }
  } catch {
    return record;
  }
  return record;
}

function reconcileRecord(record: StoredExperience): StoredExperience {
  const guaranteed = birthdayConfig.spinner.guaranteedGiftIds ?? [];
  const giftIds = new Set(birthdayConfig.spinner.gifts.map((gift) => gift.id));
  const sameGuaranteed = record.guaranteedGiftIds.join("|") === guaranteed.join("|");
  const sameMax = record.maxSpins === birthdayConfig.spinner.maxSpins;
  const sameMode = record.mode === birthdayConfig.spinner.mode;
  const wonStillValid = record.wonGiftIds.every((id) => giftIds.has(id));
  if (sameGuaranteed && sameMax && sameMode && wonStillValid) return record;

  const reset = !wonStillValid || !sameGuaranteed || !sameMode;
  const spinCount = reset ? 0 : Math.min(record.spinCount, birthdayConfig.spinner.maxSpins);
  const next: StoredExperience = {
    ...record,
    maxSpins: birthdayConfig.spinner.maxSpins,
    mode: birthdayConfig.spinner.mode,
    guaranteedGiftIds: guaranteed,
    spinCount,
    wonGiftIds: reset ? [] : record.wonGiftIds,
    completed: spinCount >= birthdayConfig.spinner.maxSpins,
    lastSpinGiftId: reset ? undefined : record.lastSpinGiftId,
    lastIdempotencyKey: reset ? undefined : record.lastIdempotencyKey,
    spinningLockUntil: 0,
    note: reset ? null : (record.note ?? null),
    noteWrites: reset ? 0 : record.noteWrites || (record.note ? 1 : 0),
    updatedAt: new Date().toISOString(),
  };
  saveStoredExperience(next);
  return next;
}

export function getPublicConfig() {
  const { recipient, sender, hero, letter, memories, specialCards, balloons, audio, spinner, final } =
    birthdayConfig;

  return {
    recipient,
    sender,
    hero,
    letter,
    memories,
    specialCards,
    balloons,
    audio: { trackSrc: audio.trackSrc, initialVolume: audio.initialVolume },
    spinner: {
      maxSpins: spinner.maxSpins,
      mode: spinner.mode,
      gifts: getPublicGifts(),
    },
    final,
  };
}

function selectGift(
  mode: SpinnerMode,
  gifts: GiftConfig[],
  wonGiftIds: string[],
  guaranteedGiftIds: string[],
): GiftConfig {
  const won = new Set(wonGiftIds);

  if (mode === "guaranteed") {
    const remaining = guaranteedGiftIds
      .map((id) => gifts.find((g) => g.id === id))
      .filter((g): g is GiftConfig => g !== undefined && !won.has(g.id));
    if (remaining.length === 0) {
      throw new Error("No guaranteed gifts remaining");
    }
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    if (!pick) throw new Error("No guaranteed gifts remaining");
    return pick;
  }

  if (mode === "weighted") {
    const eligible = gifts.filter((g) => !won.has(g.id));
    if (eligible.length === 0) throw new Error("No gifts remaining");
    const total = eligible.reduce((sum, g) => sum + Math.max(0.01, g.weight ?? 1), 0);
    let roll = Math.random() * total;
    for (const gift of eligible) {
      roll -= Math.max(0.01, gift.weight ?? 1);
      if (roll <= 0) return gift;
    }
    return eligible[eligible.length - 1];
  }

  // random-unique
  const eligible = gifts.filter((g) => !won.has(g.id));
  if (eligible.length === 0) throw new Error("No gifts remaining");
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export type SpinResult =
  | { ok: true; gift: PublicGift; selectedIndex: number; state: ReturnType<typeof toPublicState> }
  | { ok: false; error: string; status: number; state?: ReturnType<typeof toPublicState> };

export async function performSpin(token: string, idempotencyKey?: string): Promise<SpinResult> {
  const record = await hydrateNote(reconcileRecord(getStoredExperience(token) ?? createInitial(token)));
  const now = Date.now();

  if (idempotencyKey && record.lastIdempotencyKey === idempotencyKey && record.lastSpinGiftId) {
    const gift = giftsByIdMap().get(record.lastSpinGiftId);
    const selectedIndex = birthdayConfig.spinner.gifts.findIndex((g) => g.id === record.lastSpinGiftId);
    if (gift && selectedIndex >= 0) {
      return {
        ok: true,
        gift,
        selectedIndex,
        state: toPublicState(record, giftsByIdMap()),
      };
    }
  }

  if (record.spinningLockUntil > now) {
    return {
      ok: false,
      error: "Spin already in progress",
      status: 409,
      state: toPublicState(record, giftsByIdMap()),
    };
  }

  if (record.completed || record.spinCount >= record.maxSpins) {
    record.completed = true;
    saveStoredExperience(record);
    return {
      ok: false,
      error: "No spins remaining",
      status: 400,
      state: toPublicState(record, giftsByIdMap()),
    };
  }

  const regularSpins = Math.max(1, record.maxSpins - 1);
  if (record.spinCount >= regularSpins && !record.note?.trim()) {
    return {
      ok: false,
      error: "Write a note first",
      status: 400,
      state: toPublicState(record, giftsByIdMap()),
    };
  }

  record.spinningLockUntil = now + 8000;

  try {
    const selected = selectGift(
      record.mode,
      birthdayConfig.spinner.gifts,
      record.wonGiftIds,
      record.guaranteedGiftIds,
    );
    const selectedIndex = birthdayConfig.spinner.gifts.findIndex((g) => g.id === selected.id);
    if (selectedIndex < 0) {
      throw new Error("Selected gift missing from wheel");
    }

    record.spinCount += 1;
    record.wonGiftIds = [...record.wonGiftIds, selected.id];
    record.completed = record.spinCount >= record.maxSpins;
    record.updatedAt = new Date().toISOString();
    record.lastIdempotencyKey = idempotencyKey;
    record.lastSpinGiftId = selected.id;
    record.spinningLockUntil = now + 2500;
    saveStoredExperience(record);

    const gift: PublicGift = {
      id: selected.id,
      label: selected.label,
      shortLabel: selected.shortLabel,
      description: selected.description,
      imageSrc: selected.imageSrc,
      color: selected.color,
    };

    return {
      ok: true,
      gift,
      selectedIndex,
      state: toPublicState(record, giftsByIdMap()),
    };
  } catch (err) {
    record.spinningLockUntil = 0;
    saveStoredExperience(record);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Spin failed",
      status: 500,
      state: toPublicState(record, giftsByIdMap()),
    };
  }
}

const EVENING_TIMES = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
];

export async function saveSpinNote(token: string, text: string) {
  const note = text.trim().slice(0, 500);
  if (note.length < 2) {
    return { ok: false as const, error: "Write a little more than that." };
  }
  const record = await hydrateNote(reconcileRecord(getStoredExperience(token) ?? createInitial(token)));
  const regularSpins = Math.max(1, record.maxSpins - 1);
  if (record.spinCount < regularSpins) {
    return { ok: false as const, error: "Finish the five spins first." };
  }

  const remote = await writeRemoteNote(token, note);
  if ("local" in remote) {
    const writes = record.noteWrites || (record.note ? 1 : 0);
    if (writes >= 2) {
      return { ok: false as const, error: "You already changed it once." };
    }
    record.noteWrites = writes + 1;
  } else if (!remote.ok) {
    return { ok: false as const, error: remote.error };
  } else {
    record.noteWrites = remote.writes;
  }

  record.note = note;
  record.updatedAt = new Date().toISOString();
  saveStoredExperience(record);
  await sendNoteEmail(note, record.noteWrites > 1);
  return { ok: true as const, state: toPublicState(record, giftsByIdMap()) };
}

export function saveDinnerPlan(token: string, restaurant: string, time: string) {
  const name = restaurant.trim().slice(0, 80);
  if (!name || !EVENING_TIMES.includes(time)) {
    return { ok: false as const, error: "Pick a place and a time after 5." };
  }
  const record = getStoredExperience(token) ?? createInitial(token);
  record.plan = { restaurant: name, time };
  record.updatedAt = new Date().toISOString();
  saveStoredExperience(record);
  return { ok: true as const, state: toPublicState(record, giftsByIdMap()) };
}
