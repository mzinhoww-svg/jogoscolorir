import type { ArtworkRecord } from '@/persistence/artworks';
import { saveArtwork } from '@/persistence/artworks';
import type { Result } from '@/persistence/result';

export interface Snapshot {
  paint: Blob;
  thumb: Blob;
  createdAt: number;
  updatedAt: number;
  strokes: number;
}
type Persist = (rec: ArtworkRecord) => Promise<Result<void>>;

/**
 * Owns unsaved artwork snapshots independently of any screen: the newest snapshot per page
 * is kept until it is persisted; failures stay queued and are retried by flush().
 */
export function createSaveQueue(persist: Persist) {
  const pending = new Map<string, Snapshot>();
  const inflight = new Map<string, Promise<boolean>>();
  const failed = new Set<string>();
  const encoding = new Map<string, Promise<unknown>>();

  function flush(pageId: string): Promise<boolean> {
    const running = inflight.get(pageId);
    if (running)
      return running.then(() => (pending.has(pageId) ? flush(pageId) : !failed.has(pageId)));
    const snap = pending.get(pageId);
    if (!snap) return Promise.resolve(true);
    const run = (async () => {
      let ok = false;
      try {
        const r = await persist({ schema: 1, pageId, ...snap });
        ok = r.ok;
      } catch {
        ok = false;
      }
      inflight.delete(pageId);
      if (ok) {
        failed.delete(pageId);
        if (pending.get(pageId) === snap) pending.delete(pageId);
        else if (pending.has(pageId)) return flush(pageId); // newer snapshot arrived meanwhile
        return true;
      }
      failed.add(pageId);
      return false;
    })();
    inflight.set(pageId, run);
    return run;
  }

  return {
    /** Queue the newest snapshot for a page (replacing older unsaved ones) and persist it. */
    enqueue(pageId: string, snap: Snapshot): Promise<boolean> {
      const cur = pending.get(pageId);
      if (!cur || cur.updatedAt <= snap.updatedAt) pending.set(pageId, snap);
      return flush(pageId);
    },
    /** Same as enqueue, for a snapshot still being encoded; latest() waits for it. */
    enqueueAsync(pageId: string, snap: Promise<Snapshot>): Promise<boolean> {
      const p = snap.then(
        (s) => this.enqueue(pageId, s),
        () => false,
      );
      encoding.set(pageId, p);
      void p.finally(() => {
        if (encoding.get(pageId) === p) encoding.delete(pageId);
      });
      return p;
    },
    /** Newest unsaved snapshot for a page, waiting for any snapshot still being encoded. */
    async latest(pageId: string): Promise<Snapshot | undefined> {
      while (encoding.has(pageId)) await encoding.get(pageId);
      return pending.get(pageId);
    },
    flush,
    async flushAll(): Promise<boolean> {
      while (encoding.size) await Promise.all([...encoding.values()]);
      const ids = [...new Set([...pending.keys(), ...inflight.keys()])];
      const rs = await Promise.all(ids.map(flush));
      return rs.every(Boolean);
    },
    /** Unsaved snapshot for a page, if any (preferred over the DB copy on reopen). */
    get: (pageId: string): Snapshot | undefined => pending.get(pageId),
    hasPending: (): boolean => pending.size > 0,
    hasFailed: (): boolean => failed.size > 0,
    /** True when nothing is unsaved, failed, in flight or still being encoded. */
    isClean: (): boolean =>
      pending.size === 0 && failed.size === 0 && inflight.size === 0 && encoding.size === 0,
  };
}

export type SaveQueue = ReturnType<typeof createSaveQueue>;
export const saveQueue: SaveQueue = createSaveQueue(saveArtwork);
