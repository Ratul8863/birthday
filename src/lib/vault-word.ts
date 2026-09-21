const VAULT_WORD = "babee";

export function wordMatches(attempt: string) {
  return attempt.trim().toLowerCase() === VAULT_WORD;
}
