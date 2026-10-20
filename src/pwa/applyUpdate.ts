/** Updating reloads the page, so it is never allowed while the child is painting. */
export function shouldApplyNow(hash: string): boolean {
  return !hash.startsWith('#/pintar');
}

export interface ApplyDeps {
  hash: string;
  flush: () => Promise<boolean>;
  updateSW: (reload?: boolean) => Promise<void>;
  /** Current hash, read again after flushing (defaults to the initial hash). */
  currentHash?: () => string;
  /** True when no unsaved drawing work remains (the queue is in memory only). */
  isClean: () => boolean;
  /** Called when the update is postponed because drawings are not saved yet. */
  onBlocked?: () => void;
}

/** Flush unsaved drawings, then activate the new service worker only if everything was saved. Returns whether it ran. */
export async function applyUpdate({
  hash,
  flush,
  updateSW,
  currentHash,
  isClean,
  onBlocked,
}: ApplyDeps): Promise<boolean> {
  if (!shouldApplyNow(hash)) return false;
  let saved = false;
  try {
    saved = await flush();
  } catch {
    saved = false;
  }
  // The save queue lives in memory: reloading with unsaved work would lose drawings.
  if (!saved || !isClean()) {
    onBlocked?.();
    return false;
  }
  // Re-check: the child may have opened a drawing while we were flushing.
  if (!shouldApplyNow(currentHash ? currentHash() : hash)) return false;
  await updateSW(true);
  return true;
}

/** Decision: an update that was blocked by unsaved work may be retried once we are off the paint screen and everything is saved. */
export function shouldRetryBlocked(blocked: boolean, hash: string, clean: boolean): boolean {
  return blocked && clean && shouldApplyNow(hash);
}

export interface BlockedRetryDeps {
  getHash: () => string;
  isClean: () => boolean;
  /** Re-run the apply (which flushes again and may block again). */
  apply: () => void;
}

/** Remembers a blocked update and retries it automatically when it becomes safe. */
export function createBlockedRetry({ getHash, isClean, apply }: BlockedRetryDeps) {
  let blocked = false;
  return {
    markBlocked(): void {
      blocked = true;
    },
    isBlocked: (): boolean => blocked,
    /** Call on route changes, visibility changes and periodically while blocked. Returns whether a retry started. */
    check(): boolean {
      if (!shouldRetryBlocked(blocked, getHash(), isClean())) return false;
      blocked = false; // a failed attempt calls markBlocked() again via onBlocked
      apply();
      return true;
    },
  };
}
