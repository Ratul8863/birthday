import { birthdayConfig } from "@/lib/birthday-config";

const DEFAULT_TO = "ratulroy8863@gmail.com";

export async function sendNoteEmail(note: string, changed: boolean) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.NOTE_EMAIL_TO?.trim() || DEFAULT_TO;
  const from = process.env.RESEND_FROM?.trim() || "Sumaiya <onboarding@resend.dev>";
  const who = birthdayConfig.recipient.fullName || birthdayConfig.recipient.name;

  if (!apiKey) {
    console.error("RESEND_API_KEY is missing. The note was saved, but no email was sent.");
    return { ok: false as const, error: "missing-key" };
  }

  const subject = changed ? `${who} changed her note` : `${who} wrote you a note`;
  const text = `${who} left this before the last spin.\n\n${note}\n`;

  try {
    const first = await postEmail(apiKey, { from, to: [to], subject, text });
    if (first.ok) return { ok: true as const };

    const fallback = testingInbox(first.detail);
    if (first.status === 403 && fallback && fallback.toLowerCase() !== to.toLowerCase()) {
      const second = await postEmail(apiKey, {
        from,
        to: [fallback],
        subject,
        text: `This landed here because the Resend test sender can only deliver to ${fallback} until a domain is verified.\n\n${text}`,
      });
      if (second.ok) return { ok: true as const };
      console.error("Resend could not send the note.", second.status, second.detail);
      return { ok: false as const, error: "send-failed" };
    }

    console.error("Resend could not send the note.", first.status, first.detail);
    return { ok: false as const, error: "send-failed" };
  } catch (err) {
    console.error("Resend could not send the note.", err);
    return { ok: false as const, error: "send-failed" };
  }
}

function testingInbox(detail: string) {
  const match = detail.match(/your own email address \(([^)]+)\)/i);
  return match?.[1]?.trim() || null;
}

async function postEmail(
  apiKey: string,
  payload: { from: string; to: string[]; subject: string; text: string },
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true as const, status: res.status, detail: "" };
  return { ok: false as const, status: res.status, detail: await res.text() };
}
