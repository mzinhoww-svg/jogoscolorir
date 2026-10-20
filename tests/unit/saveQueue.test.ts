import { describe, expect, it } from 'vitest';
import { createSaveQueue, type Snapshot } from '@/ui/state/saveQueue';
import type { ArtworkRecord } from '@/persistence/artworks';
import type { Result } from '@/persistence/result';

const snap = (tag: string, t = 1): Snapshot => ({
  paint: new Blob([tag]),
  thumb: new Blob([tag]),
  createdAt: 1,
  updatedAt: t,
  strokes: t,
});

function fakeDb() {
  const saved = new Map<string, ArtworkRecord>();
  let failNext = 0;
  const calls: string[] = [];
  let gate: Promise<void> | null = null;
  const persist = async (rec: ArtworkRecord): Promise<Result<void>> => {
    calls.push(`${rec.pageId}:${rec.strokes}`);
    if (gate) await gate;
    if (failNext > 0) {
      failNext--;
      return { ok: false, error: 'quota' };
    }
    saved.set(rec.pageId, rec);
    return { ok: true, value: undefined };
  };
  return {
    persist,
    saved,
    calls,
    fail: (n: number) => (failNext = n),
    hold: () => {
      let release!: () => void;
      gate = new Promise((r) => (release = r));
      return () => {
        gate = null;
        release();
      };
    },
  };
}

describe('saveQueue', () => {
  it('persists and clears the pending snapshot', async () => {
    const db = fakeDb();
    const q = createSaveQueue(db.persist);
    expect(await q.enqueue('a-01', snap('x'))).toBe(true);
    expect(db.saved.get('a-01')?.strokes).toBe(1);
    expect(q.get('a-01')).toBeUndefined();
    expect(q.hasPending()).toBe(false);
  });

  it('keeps a failed snapshot and succeeds on retry', async () => {
    const db = fakeDb();
    const q = createSaveQueue(db.persist);
    db.fail(1);
    const s = snap('x');
    expect(await q.enqueue('a-01', s)).toBe(false);
    expect(q.get('a-01')).toBe(s);
    expect(q.hasFailed()).toBe(true);
    expect(await q.flushAll()).toBe(true);
    expect(db.saved.get('a-01')?.paint).toBe(s.paint);
    expect(q.get('a-01')).toBeUndefined();
    expect(q.hasFailed()).toBe(false);
  });

  it('newest snapshot wins when enqueued during an in-flight save', async () => {
    const db = fakeDb();
    const q = createSaveQueue(db.persist);
    const release = db.hold();
    const p1 = q.enqueue('a-01', snap('old', 1));
    const p2 = q.enqueue('a-01', snap('new', 2));
    release();
    expect(await p1).toBe(true);
    expect(await p2).toBe(true);
    expect(db.saved.get('a-01')?.strokes).toBe(2);
    expect(db.calls).toEqual(['a-01:1', 'a-01:2']);
    expect(q.hasPending()).toBe(false);
  });

  it('reopen reads the queued unsaved snapshot', async () => {
    const db = fakeDb();
    const q = createSaveQueue(db.persist);
    db.fail(5);
    const s = snap('unsaved', 3);
    await q.enqueue('a-02', s);
    expect(q.get('a-02')).toBe(s);
  });
});
