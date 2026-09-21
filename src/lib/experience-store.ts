import fs from "node:fs";
import path from "node:path";
import type { PublicGift, SpinnerMode } from "@/types/birthday";

export type StoredExperience = {
  token: string;
  maxSpins: number;
  spinCount: number;
  wonGiftIds: string[];
  completed: boolean;
  mode: SpinnerMode;
  guaranteedGiftIds: string[];
  spinningLockUntil: number;
  lastIdempotencyKey?: string;
  lastSpinGiftId?: string;
  note: string | null;
  noteWrites: number;
  plan: { restaurant: string; time: string } | null;
  createdAt: string;
  updatedAt: string;
};

const globalStore = globalThis as typeof globalThis & {
  __birthdayStore?: Map<string, StoredExperience>;
};

const dataFile = path.join(process.cwd(), "data", "experiences.json");

function normalize(record: StoredExperience): StoredExperience {
  return {
    ...record,
    wonGiftIds: Array.isArray(record.wonGiftIds) ? record.wonGiftIds : [],
    guaranteedGiftIds: Array.isArray(record.guaranteedGiftIds) ? record.guaranteedGiftIds : [],
    note: record.note ?? null,
    noteWrites: record.noteWrites || (record.note ? 1 : 0),
    plan: record.plan ?? null,
    spinningLockUntil: 0,
  };
}

function readFileStore(): Map<string, StoredExperience> {
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    const parsed = JSON.parse(raw) as Record<string, StoredExperience>;
    return new Map(Object.entries(parsed).map(([token, record]) => [token, normalize(record)]));
  } catch {
    return new Map();
  }
}

function writeFileStore(map: Map<string, StoredExperience>) {
  const dir = path.dirname(dataFile);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(Object.fromEntries(map), null, 2));
}

function getMap() {
  if (!globalStore.__birthdayStore) {
    globalStore.__birthdayStore = readFileStore();
  }
  return globalStore.__birthdayStore;
}

export function getStoredExperience(token: string): StoredExperience | null {
  return getMap().get(token) ?? null;
}

export function saveStoredExperience(record: StoredExperience) {
  const map = getMap();
  map.set(record.token, record);
  writeFileStore(map);
}

export function toPublicState(
  record: StoredExperience,
  giftsById: Map<string, PublicGift>,
) {
  const wonGifts = record.wonGiftIds
    .map((id) => giftsById.get(id))
    .filter((g): g is PublicGift => Boolean(g));

  return {
    token: record.token,
    maxSpins: record.maxSpins,
    spinCount: record.spinCount,
    remainingSpins: Math.max(0, record.maxSpins - record.spinCount),
    wonGiftIds: record.wonGiftIds,
    wonGifts,
    completed: record.completed,
    mode: record.mode,
    note: null,
    noteSaved: Boolean(record.note?.trim()) || record.noteWrites > 0,
    noteChangesLeft: record.noteWrites === 1 ? 1 : 0,
    plan: record.plan ?? null,
  };
}
