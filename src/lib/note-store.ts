export type SavedNote = {
  body: string;
  writes: number;
};

/** Notes stay on this server. The copy Ratul reads is the email. */
export async function readRemoteNote(_token: string): Promise<SavedNote | null> {
  return null;
}

export async function seedRemoteNote(_token: string, _body: string, _writes: number) {
  return;
}

export async function writeRemoteNote(
  _token: string,
  _body: string,
): Promise<
  | { ok: false; local: true }
  | { ok: true; writes: number }
  | { ok: false; error: string }
> {
  return { ok: false, local: true };
}
