// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/catalog', () => ({ renderOutline: () => undefined }));

import { __outlineCacheKeys, OUTLINE_CACHE_MAX, outlineThumb } from '@/ui/components/Thumb';
import type { PageDef } from '@/catalog';

const ctxStub = { fillStyle: '', fillRect: () => undefined };
HTMLCanvasElement.prototype.getContext = (() => ctxStub) as never;
const page = (n: number) => ({ id: `p-${n}` }) as unknown as PageDef;

describe('outline thumbnail cache', () => {
  it('is capped at 40 entries and drops the least recently used', () => {
    expect(OUTLINE_CACHE_MAX).toBe(40);
    for (let i = 0; i < 40; i++) outlineThumb(page(i));
    outlineThumb(page(0)); // touch 0 so 1 becomes the oldest
    outlineThumb(page(40));
    const keys = __outlineCacheKeys();
    expect(keys).toHaveLength(40);
    expect(keys).toContain('p-0');
    expect(keys).not.toContain('p-1');
    for (let i = 41; i < 100; i++) outlineThumb(page(i));
    expect(__outlineCacheKeys()).toHaveLength(40);
  });
});
