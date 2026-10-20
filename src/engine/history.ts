export interface HistoryRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface HistoryEntry {
  rect: HistoryRect;
  before: ImageData;
  after: ImageData;
}

const cost = (e: HistoryEntry): number => 2 * e.rect.w * e.rect.h * 4;

/** Pure undo/redo stack with entry-count and byte budgets; oldest entries are dropped first. */
export class History {
  static readonly MAX_ENTRIES = 40;
  static readonly MAX_BYTES = 120 * 1024 * 1024;

  private done: HistoryEntry[] = [];
  private undone: HistoryEntry[] = [];
  private total = 0;
  private readonly maxEntries: number;
  private readonly maxBytes: number;

  constructor(opts: { maxEntries?: number; maxBytes?: number } = {}) {
    this.maxEntries = opts.maxEntries ?? History.MAX_ENTRIES;
    this.maxBytes = opts.maxBytes ?? History.MAX_BYTES;
  }

  get canUndo(): boolean {
    return this.done.length > 0;
  }
  get canRedo(): boolean {
    return this.undone.length > 0;
  }
  get size(): number {
    return this.done.length;
  }
  get bytes(): number {
    return this.total;
  }

  push(e: HistoryEntry): void {
    for (const r of this.undone) this.total -= cost(r);
    this.undone = [];
    this.done.push(e);
    this.total += cost(e);
    while (
      this.done.length > this.maxEntries ||
      (this.total > this.maxBytes && this.done.length > 1)
    ) {
      this.total -= cost(this.done.shift()!);
    }
  }

  undo(): HistoryEntry | null {
    const e = this.done.pop();
    if (!e) return null;
    this.undone.push(e);
    return e;
  }

  redo(): HistoryEntry | null {
    const e = this.undone.pop();
    if (!e) return null;
    this.done.push(e);
    return e;
  }

  clear(): void {
    this.done = [];
    this.undone = [];
    this.total = 0;
  }
}
