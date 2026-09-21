"use client";

import { useCallback, useSyncExternalStore } from "react";

import { wordMatches } from "@/lib/vault-word";

const STORAGE_KEY = "chini-vault-open";
const UNLOCK_EVENT = "chini-vault-unlock";

function readOpen() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(UNLOCK_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(UNLOCK_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useVaultLock() {
  const open = useSyncExternalStore(subscribe, readOpen, () => false);

  const unlock = useCallback((attempt: string) => {
    if (!wordMatches(attempt)) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      return false;
    }
    window.dispatchEvent(new Event(UNLOCK_EVENT));
    return true;
  }, []);

  return { open, unlock };
}
