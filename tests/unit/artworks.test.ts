import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  deleteAll,
  deleteArtwork,
  listArtworks,
  loadArtwork,
  migrateRecord,
  saveArtwork,
  type ArtworkRecord,
} from '@/persistence/artworks';
import { __resetDbForTests, __setDbForTests, DB_NAME, getDb } from '@/persistence/db';

const blob = (s: string) => new Blob([s], { type: 'image/png' });
const rec = (pageId: string, updatedAt: number): ArtworkRecord => ({
  schema: 1,
  pageId,
  paint: blob('paint-' + pageId),
  thumb: blob('thumb-' + pageId),
  createdAt: 1,
  updatedAt,
  strokes: 3,
});

beforeEach(() => {
  (globalThis as { indexedDB: unknown }).indexedDB = new IDBFactory();
  __resetDbForTests();
});

describe('artworks round-trip', () => {
  it('saves and loads a record', async () => {
    const r = await saveArtwork(rec('animals-01', 10));
    expect(r.ok).toBe(true);
    const l = await loadArtwork('animals-01');
    expect(l.ok).toBe(true);
    if (l.ok) {
      expect(l.value?.pageId).toBe('animals-01');
      expect(l.value?.strokes).toBe(3);
      expect(l.value?.schema).toBe(1);
      expect(await l.value?.paint.text()).toBe('paint-animals-01');
    }
  });
  it('load of a missing page is ok:null', async () => {
    expect(await loadArtwork('nope-01')).toEqual({ ok: true, value: null });
  });
  it('lists by updatedAt desc', async () => {
    await saveArtwork(rec('a-01', 1));
    await saveArtwork(rec('a-02', 3));
    await saveArtwork(rec('a-03', 2));
    const l = await listArtworks();
    expect(l.ok && l.value.map((x) => x.pageId)).toEqual(['a-02', 'a-03', 'a-01']);
  });
  it('delete and deleteAll', async () => {
    await saveArtwork(rec('a-01', 1));
    await saveArtwork(rec('a-02', 2));
    expect((await deleteArtwork('a-01')).ok).toBe(true);
    const l1 = await listArtworks();
    expect(l1.ok && l1.value.length).toBe(1);
    expect((await deleteAll()).ok).toBe(true);
    const l2 = await listArtworks();
    expect(l2.ok && l2.value.length).toBe(0);
  });
});

describe('migration', () => {
  const putRaw = async (raw: unknown) => {
    const db = await getDb();
    await db.put('artworks', raw as ArtworkRecord);
  };
  it('migrateRecord schema 1 passes, schema 0 converts, others null', () => {
    const r = rec('a-01', 5);
    expect(migrateRecord(r)).toEqual(r);
    const legacy = {
      pageId: 'a-01',
      paintPng: blob('x'),
      thumb: blob('t'),
      createdAt: 1,
      updatedAt: 2,
    };
    const m = migrateRecord({ schema: 0, ...legacy });
    expect(m?.schema).toBe(1);
    expect(m?.paint).toBe(legacy.paintPng);
    expect(m?.strokes).toBe(0);
    expect(migrateRecord({ schema: 99, pageId: 'x' })).toBeNull();
    expect(migrateRecord(null)).toBeNull();
    expect(migrateRecord('str')).toBeNull();
    expect(migrateRecord({ schema: 1, pageId: 'a' })).toBeNull();
  });
  it('load/list skip invalid and migrate legacy records', async () => {
    await putRaw({ schema: 99, pageId: 'future-01' });
    await putRaw({
      schema: 0,
      pageId: 'old-01',
      paintPng: blob('x'),
      thumb: blob('t'),
      createdAt: 1,
      updatedAt: 9,
    });
    await saveArtwork(rec('ok-01', 5));
    const l = await listArtworks();
    expect(l.ok && l.value.map((x) => x.pageId)).toEqual(['old-01', 'ok-01']);
    expect(await loadArtwork('future-01')).toEqual({ ok: true, value: null });
    const old = await loadArtwork('old-01');
    expect(old.ok && old.value?.schema).toBe(1);
  });
});

describe('failures never throw', () => {
  it('indexedDB.open failing -> unavailable, then retry works', async () => {
    const good = indexedDB;
    (globalThis as { indexedDB: unknown }).indexedDB = {
      open() {
        const listeners: Record<string, (() => void)[]> = {};
        const req = {
          error: new DOMException('x', 'SecurityError'),
          addEventListener: (t: string, f: () => void) => (listeners[t] ??= []).push(f),
          removeEventListener: () => undefined,
        };
        queueMicrotask(() => listeners.error?.forEach((f) => f()));
        return req;
      },
    };
    __resetDbForTests();
    expect(await saveArtwork(rec('a-01', 1))).toMatchObject({ ok: false, error: 'unavailable' });
    expect(await listArtworks()).toMatchObject({ ok: false, error: 'unavailable' });
    (globalThis as { indexedDB: unknown }).indexedDB = good;
    expect((await saveArtwork(rec('a-01', 1))).ok).toBe(true);
  });
  it('indexedDB undefined -> unavailable', async () => {
    (globalThis as { indexedDB: unknown }).indexedDB = undefined;
    __resetDbForTests();
    expect(await loadArtwork('a-01')).toMatchObject({ ok: false, error: 'unavailable' });
  });
  const fakeDbThrowing = (e: unknown) =>
    ({
      put: () => Promise.reject(e),
      get: () => Promise.reject(e),
      getAll: () => Promise.reject(e),
      delete: () => Promise.reject(e),
      clear: () => Promise.reject(e),
    }) as never;
  it('QuotaExceededError -> quota', async () => {
    __setDbForTests(fakeDbThrowing(new DOMException('full', 'QuotaExceededError')));
    expect(await saveArtwork(rec('a-01', 1))).toMatchObject({ ok: false, error: 'quota' });
  });
  it('Firefox quota name -> quota', async () => {
    const e = Object.assign(new Error('q'), { name: 'NS_ERROR_DOM_QUOTA_REACHED' });
    __setDbForTests(fakeDbThrowing(e));
    expect(await saveArtwork(rec('a-01', 1))).toMatchObject({ ok: false, error: 'quota' });
  });
  it('InvalidStateError -> unavailable; other -> unknown', async () => {
    __setDbForTests(fakeDbThrowing(new DOMException('c', 'InvalidStateError')));
    expect(await loadArtwork('a')).toMatchObject({ ok: false, error: 'unavailable' });
    __setDbForTests(fakeDbThrowing(new Error('boom')));
    expect(await deleteAll()).toMatchObject({ ok: false, error: 'unknown' });
  });
  it('uses DB name pinta-mundo', () => {
    expect(DB_NAME).toBe('pinta-mundo');
  });
});
