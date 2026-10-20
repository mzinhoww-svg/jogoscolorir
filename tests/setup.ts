import 'fake-indexeddb/auto';
import { Path2D as NapiPath2D } from '@napi-rs/canvas';

// Node has no Path2D; the catalog's Pen uses it (browsers provide it natively).
if (typeof globalThis.Path2D === 'undefined') {
  (globalThis as unknown as { Path2D: unknown }).Path2D = NapiPath2D;
}
