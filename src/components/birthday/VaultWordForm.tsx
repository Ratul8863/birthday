"use client";

import { useState, type FormEvent } from "react";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { sfxUnlock, sfxDeny } from "@/lib/sfx";

type VaultWordFormProps = {
  id: string;
  tone?: "ink" | "pearl";
};

export function VaultWordForm({ id, tone = "ink" }: VaultWordFormProps) {
  const { unlock } = useVaultLock();
  const [word, setWord] = useState("");
  const [misses, setMisses] = useState(0);
  const light = tone === "pearl";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unlock(word)) { sfxUnlock(); return; }
    sfxDeny();
    setMisses((count) => count + 1);
  }

  return (
    <form
      key={misses}
      onSubmit={submit}
      className={`mx-auto w-full max-w-xs ${misses ? "vault-deny" : ""}`}
    >
      <label
        htmlFor={id}
        className={`text-[0.65rem] font-semibold tracking-[0.22em] uppercase ${light ? "text-pearl/45" : "text-ink/45"}`}
      >
        Say the word
      </label>
      <input
        id={id}
        type="password"
        value={word}
        autoComplete="off"
        onChange={(event) => setWord(event.target.value)}
        placeholder="the word"
        className={`vault-word mt-3 ${light ? "is-light" : ""}`}
      />
      {misses > 0 ? (
        <p className="mt-3 text-sm text-accent" role="alert">
          That’s not the one.
        </p>
      ) : null}
      <button type="submit" className="btn-primary mt-5">
        Open it
      </button>
    </form>
  );
}
