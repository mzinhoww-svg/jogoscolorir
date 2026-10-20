export type PersistError = 'unavailable' | 'quota' | 'unknown';

export type Result<T> = { ok: true; value: T } | { ok: false; error: PersistError; detail?: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

/** Map any thrown value to a Result error. Never throws. */
export function toError(e: unknown): { ok: false; error: PersistError; detail?: string } {
  const name = typeof e === 'object' && e !== null && 'name' in e ? String((e as { name: unknown }).name) : '';
  const message = e instanceof Error ? e.message : undefined;
  let error: PersistError = 'unknown';
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') error = 'quota';
  else if (name === 'SecurityError' || name === 'InvalidStateError' || name === 'UnavailableError') {
    error = 'unavailable';
  }
  return message === undefined ? { ok: false, error } : { ok: false, error, detail: message };
}
