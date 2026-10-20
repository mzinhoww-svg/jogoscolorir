import { openDB, type IDBPDatabase } from 'idb';

export const DB_NAME = 'pinta-mundo';
export const DB_VERSION = 1;
export const STORE = 'artworks';

export type PintaDb = IDBPDatabase<unknown>;

let dbPromise: Promise<PintaDb> | null = null;

/** Drop the cached connection, but only if it is still the one that went bad. */
function forget(p: Promise<PintaDb>): void {
  if (dbPromise === p) dbPromise = null;
}

/** Drop the cached connection (closing it if possible) so the next call reopens. */
export function resetDb(): void {
  const p = dbPromise;
  dbPromise = null;
  p?.then((db) => db.close()).catch(() => undefined);
}

/** Lazily open the DB and cache the promise; on failure the cache is reset so a later call retries. */
export function getDb(): Promise<PintaDb> {
  if (dbPromise) return dbPromise;
  const p: Promise<PintaDb> = (async () => {
    if (typeof indexedDB === 'undefined' || indexedDB === null) {
      throw Object.assign(new Error('indexedDB unavailable'), { name: 'SecurityError' });
    }
    try {
      return (await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE))
            db.createObjectStore(STORE, { keyPath: 'pageId' });
        },
        // Browser killed the connection (e.g. storage cleared): reopen on the next call.
        terminated() {
          forget(p);
        },
        // Another tab wants to upgrade/delete: close ours and reopen lazily.
        blocking() {
          const cur = p;
          forget(cur);
          cur.then((db) => db.close()).catch(() => undefined);
        },
      })) as PintaDb;
    } catch (e) {
      // Any failure to open means storage is not usable (private mode, blocked, denied).
      throw Object.assign(new Error(e instanceof Error ? e.message : 'open failed'), {
        name: 'SecurityError',
      });
    }
  })();
  dbPromise = p;
  p.catch(() => forget(p));
  return p;
}

/** Test seam: drop the cached connection (closing it if open) so the next call re-opens. */
export function __resetDbForTests(): void {
  resetDb();
}

/** Test seam: inject a stand-in DB (e.g. one whose writes reject with QuotaExceededError). */
export function __setDbForTests(db: PintaDb): void {
  dbPromise = Promise.resolve(db);
}
