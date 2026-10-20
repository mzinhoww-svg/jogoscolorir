import { getDb, STORE } from './db';
import { ok, toError, type Result } from './result';

export interface ArtworkRecord {
  schema: 1;
  pageId: string;
  paint: Blob;
  thumb: Blob;
  createdAt: number;
  updatedAt: number;
  strokes: number;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBlob = (v: unknown): v is Blob => typeof Blob !== 'undefined' && v instanceof Blob;

/** Validate/convert a raw stored value. Schema 1 -> itself, schema 0 (legacy `paintPng`, no strokes) -> converted, else null. */
export function migrateRecord(raw: unknown): ArtworkRecord | null {
  if (!isObj(raw) || typeof raw.pageId !== 'string') return null;
  if (!isBlob(raw.thumb) || !isNum(raw.createdAt) || !isNum(raw.updatedAt)) return null;
  if (raw.schema === 1) {
    if (!isBlob(raw.paint) || !isNum(raw.strokes)) return null;
    return raw as unknown as ArtworkRecord;
  }
  if (raw.schema === 0) {
    if (!isBlob(raw.paintPng)) return null;
    return {
      schema: 1,
      pageId: raw.pageId,
      paint: raw.paintPng,
      thumb: raw.thumb,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      strokes: 0,
    };
  }
  return null;
}

async function run<T>(fn: (db: Awaited<ReturnType<typeof getDb>>) => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn(await getDb()));
  } catch (e) {
    return toError(e);
  }
}

export const saveArtwork = (rec: ArtworkRecord): Promise<Result<void>> =>
  run(async (db) => {
    await db.put(STORE, rec);
  });

export const loadArtwork = (pageId: string): Promise<Result<ArtworkRecord | null>> =>
  run(async (db) => migrateRecord(await db.get(STORE, pageId)));

export const listArtworks = (): Promise<Result<ArtworkRecord[]>> =>
  run(async (db) => {
    const all = (await db.getAll(STORE)) as unknown[];
    return all
      .map(migrateRecord)
      .filter((r): r is ArtworkRecord => r !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  });

export const deleteArtwork = (pageId: string): Promise<Result<void>> =>
  run(async (db) => {
    await db.delete(STORE, pageId);
  });

export const deleteAll = (): Promise<Result<void>> =>
  run(async (db) => {
    await db.clear(STORE);
  });
