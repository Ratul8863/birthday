"use client";

import { GiftCollection } from "@/components/birthday/GiftCollection";
import { GiftWheel } from "@/components/birthday/GiftWheel";
import { PrizeRevealModal } from "@/components/birthday/PrizeRevealModal";
import { useSlides } from "@/components/birthday/slide-nav";
import { useExperience } from "@/components/birthday/ExperienceContext";
import { useVaultLock } from "@/components/birthday/useVaultLock";
import { VaultWordForm } from "@/components/birthday/VaultWordForm";
import { useState, type FormEvent } from "react";
import { sfxNoteSend } from "@/lib/sfx";

export function GiftVault() {
  const {
    config,
    state,
    candlesBlown,
    spinState,
    token,
    refreshState,
    setActivePrize,
    setSpinState,
  } = useExperience();
  const { open: vaultOpen } = useVaultLock();
  const { next } = useSlides();
  const [rotation, setRotation] = useState(0);
  const [heldBack, setHeldBack] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [noteError, setNoteError] = useState("");
  const ready = candlesBlown || state.spinCount > 0 || state.completed;
  const spinningNow =
    spinState === "requesting" ||
    spinState === "spinning" ||
    spinState === "revealed" ||
    spinState === "collecting";
  const regularTotal = Math.max(1, state.maxSpins - 1);
  const regularLeft = Math.max(0, regularTotal - state.spinCount);
  const awaitingNote =
    vaultOpen && state.spinCount >= regularTotal && !state.noteSaved && !spinningNow;
  const specialReady = vaultOpen && state.noteSaved && !state.completed;
  const showWheel = (!vaultOpen || !state.completed || spinningNow) && !awaitingNote;
  const sender = config.sender?.name ?? "me";

  async function sendNote(event: FormEvent) {
    event.preventDefault();
    const note = draft.trim();
    if (note.length < 2) {
      setNoteError("Write a little more than that.");
      return;
    }
    setSending(true);
    setNoteError("");
    try {
      const res = await fetch(`/api/experience/${token}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNoteError(data.error ?? "Couldn’t send that.");
        return;
      }
      await refreshState();
      sfxNoteSend();
    } catch {
      setNoteError("Couldn’t send that.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section data-screen id="gifts" className="screen-section stage-dark">
      <div className="screen-body">
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="section-kicker justify-center">{awaitingNote ? "before the last one" : "give it a spin"}</p>
        <h2 className="font-display mt-3 w-full min-w-0 text-[clamp(1.7rem,5vw,3rem)] leading-[1.1]">
          {awaitingNote ? `Write ${sender} something` : "The wheel"}
          <span className="mt-1 block italic text-accent">
            {awaitingNote ? "then the special spin opens" : "stops where it stops"}
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-pearl/55">
          {ready
            ? awaitingNote
              ? "Five spins are done. Leave a note, and the last spin is yours."
              : specialReady
                ? `Alright, ${config.recipient.nickname || config.recipient.name}. This one’s the special spin.`
                : `Alright, ${config.recipient.nickname || config.recipient.name}. Five spins. Whatever sits under the pointer is yours.`
            : "Make your wish on the last screen first — then come back."}
        </p>
        {!awaitingNote ? (
          <div className="mx-auto mt-4 inline-flex rounded-xl border border-white/10 px-4 py-1.5 text-sm text-pearl/70">
            {specialReady
              ? "Special spin"
              : `${vaultOpen ? regularLeft : regularTotal} left of ${regularTotal}`}
          </div>
        ) : null}

        <div className={`mt-8 ${ready ? "" : "pointer-events-none opacity-40"}`}>
          {awaitingNote ? (
            <form onSubmit={(event) => void sendNote(event)} className="mx-auto max-w-sm text-left">
              <label htmlFor="spin-note" className="text-sm text-pearl/70">
                A note for {sender}
              </label>
              <textarea
                id="spin-note"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Say it however you want."
                className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-pearl outline-none placeholder:text-pearl/30 focus:border-amber/50"
              />
              {noteError ? <p className="mt-2 text-sm text-accent">{noteError}</p> : null}
              <button type="submit" className="btn-primary mt-4 w-full" disabled={sending}>
                {sending ? "Sending…" : "Send it"}
              </button>
            </form>
          ) : showWheel ? (
            <GiftWheel
              rotation={rotation}
              onRotationChange={setRotation}
              onSpinComplete={(gift) => {
                setActivePrize(gift);
                setSpinState("revealed");
              }}
              onSpinRefused={() => setHeldBack(true)}
            />
          ) : (
            <p className="text-sm text-pearl/70">That’s all six. Everything’s yours now.</p>
          )}
        </div>

        {!vaultOpen ? (
          <div className="mt-8">
            {heldBack ? (
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-pearl/70">
                You can spin it. Nothing stays until you say the word.
              </p>
            ) : (
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-pearl/70">
                Spin if you want. Keeping one needs the word.
              </p>
            )}
            <div className="mt-5">
              <VaultWordForm id="vault-word-spin" tone="pearl" />
            </div>
          </div>
        ) : null}

        <GiftCollection />
        {state.noteSaved ? <NoteOnce sender={sender} token={token} changesLeft={state.noteChangesLeft} onSaved={() => void refreshState()} /> : null}
        {!awaitingNote ? (
          <button type="button" className="btn-primary mt-8" onClick={next}>
            {state.completed ? "That’s everything" : "Skip to the ending"}
          </button>
        ) : null}
      </div>
      </div>
      <PrizeRevealModal />
    </section>
  );
}

function NoteOnce({
  sender,
  token,
  changesLeft,
  onSaved,
}: {
  sender: string;
  token: string;
  changesLeft: number;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reveal(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/experience/${token}/note/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "That’s not the one.");
        return;
      }
      setDraft(typeof data.note === "string" ? data.note : "");
      setUnlocked(true);
    } catch {
      setError("Couldn’t open that.");
    } finally {
      setBusy(false);
    }
  }

  async function saveChange(event: FormEvent) {
    event.preventDefault();
    const note = draft.trim();
    if (note.length < 2) {
      setError("Write a little more than that.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/experience/${token}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn’t save that.");
        return;
      }
      setUnlocked(false);
      setOpen(false);
      setPassword("");
      onSaved();
    } catch {
      setError("Couldn’t save that.");
    } finally {
      setBusy(false);
    }
  }

  if (changesLeft < 1) {
    return <p className="mx-auto mt-8 max-w-sm text-sm text-pearl/55">With {sender}. That one’s locked in.</p>;
  }

  return (
    <div className="mx-auto mt-8 max-w-sm text-left">
      <p className="text-center text-sm text-pearl/70">With {sender}. You can change it once.</p>
      {!open ? (
        <button type="button" className="btn-primary mt-4 w-full" onClick={() => setOpen(true)}>
          Change it
        </button>
      ) : !unlocked ? (
        <form onSubmit={(event) => void reveal(event)} className="mt-4">
          <label htmlFor="note-change-word" className="text-sm text-pearl/70">
            The word, then you can see it
          </label>
          <input
            id="note-change-word"
            type="password"
            value={password}
            autoComplete="off"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="the word"
            className="vault-word is-light mt-3"
          />
          {error ? <p className="mt-2 text-sm text-accent">{error}</p> : null}
          <button type="submit" className="btn-primary mt-4 w-full" disabled={busy}>
            {busy ? "Opening…" : "Show it"}
          </button>
        </form>
      ) : (
        <form onSubmit={(event) => void saveChange(event)} className="mt-4">
          <label htmlFor="note-change" className="text-sm text-pearl/70">
            One change. Then it stays.
          </label>
          <textarea
            id="note-change"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            maxLength={500}
            className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-pearl outline-none placeholder:text-pearl/30 focus:border-amber/50"
          />
          {error ? <p className="mt-2 text-sm text-accent">{error}</p> : null}
          <button type="submit" className="btn-primary mt-4 w-full" disabled={busy}>
            {busy ? "Saving…" : "Save the change"}
          </button>
        </form>
      )}
    </div>
  );
}
