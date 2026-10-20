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
}

/** Flush unsaved drawings, then activate the new service worker. Returns whether it ran. */
export async function applyUpdate({
  hash,
  flush,
  updateSW,
  currentHash,
}: ApplyDeps): Promise<boolean> {
  if (!shouldApplyNow(hash)) return false;
  try {
    await flush();
  } catch {
    /* failed saves stay queued in IndexedDB-backed queue; still do not block the update */
  }
  // Re-check: the child may have opened a drawing while we were flushing.
  if (!shouldApplyNow(currentHash ? currentHash() : hash)) return false;
  await updateSW(true);
  return true;
}
