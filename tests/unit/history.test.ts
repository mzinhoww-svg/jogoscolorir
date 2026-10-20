import { describe, it, expect } from 'vitest';
import { History, type HistoryEntry } from '@/engine/history';

function fake(w: number, h: number): ImageData {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
    colorSpace: 'srgb',
  } as ImageData;
}
function entry(tag: number, w = 10, h = 10): HistoryEntry {
  const e = { rect: { x: tag, y: 0, w, h }, before: fake(w, h), after: fake(w, h) };
  return e;
}

describe('History', () => {
  it('undo/redo walk the stack', () => {
    const h = new History();
    expect(h.canUndo).toBe(false);
    h.push(entry(1));
    h.push(entry(2));
    expect(h.undo()?.rect.x).toBe(2);
    expect(h.canRedo).toBe(true);
    expect(h.redo()?.rect.x).toBe(2);
    expect(h.redo()).toBeNull();
    expect(h.undo()?.rect.x).toBe(2);
    expect(h.undo()?.rect.x).toBe(1);
    expect(h.undo()).toBeNull();
  });
  it('push after undo clears redo', () => {
    const h = new History();
    h.push(entry(1));
    h.undo();
    h.push(entry(3));
    expect(h.canRedo).toBe(false);
    expect(h.undo()?.rect.x).toBe(3);
  });
  it('drops oldest beyond 40 entries', () => {
    const h = new History();
    for (let i = 0; i < 45; i++) h.push(entry(i));
    expect(h.size).toBe(40);
    let last: HistoryEntry | null = null;
    while (h.canUndo) last = h.undo();
    expect(last?.rect.x).toBe(5);
  });
  it('drops oldest beyond the byte budget', () => {
    const h = new History({ maxBytes: 2 * 100 * 100 * 4 * 3 });
    for (let i = 0; i < 5; i++) h.push(entry(i, 100, 100));
    expect(h.size).toBe(3);
    expect(h.bytes).toBeLessThanOrEqual(2 * 100 * 100 * 4 * 3);
  });
  it('defaults to 40 / 120 MB', () => {
    expect(History.MAX_ENTRIES).toBe(40);
    expect(History.MAX_BYTES).toBe(120 * 1024 * 1024);
  });
  it('clear empties both stacks', () => {
    const h = new History();
    h.push(entry(1));
    h.push(entry(2));
    h.undo();
    h.clear();
    expect(h.canUndo || h.canRedo).toBe(false);
    expect(h.bytes).toBe(0);
  });
});
