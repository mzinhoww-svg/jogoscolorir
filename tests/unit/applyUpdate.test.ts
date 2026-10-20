import { describe, expect, it, vi } from 'vitest';
import { applyUpdate, shouldApplyNow } from '@/pwa/applyUpdate';

describe('shouldApplyNow', () => {
  it('refuses on paint routes only', () => {
    expect(shouldApplyNow('#/pintar/animals-01')).toBe(false);
    expect(shouldApplyNow('#/')).toBe(true);
    expect(shouldApplyNow('#/pais')).toBe(true);
    expect(shouldApplyNow('')).toBe(true);
  });
});

describe('applyUpdate', () => {
  it('flushes before updating', async () => {
    const order: string[] = [];
    const ok = await applyUpdate({
      hash: '#/pais',
      flush: async () => (order.push('flush'), true),
      updateSW: async () => void order.push('update'),
    });
    expect(ok).toBe(true);
    expect(order).toEqual(['flush', 'update']);
  });
  it('does nothing on the paint screen', async () => {
    const flush = vi.fn(async () => true);
    const updateSW = vi.fn(async () => {});
    expect(await applyUpdate({ hash: '#/pintar/x-01', flush, updateSW })).toBe(false);
    expect(flush).not.toHaveBeenCalled();
    expect(updateSW).not.toHaveBeenCalled();
  });
  it('still updates if flush throws', async () => {
    const updateSW = vi.fn(async () => {});
    await applyUpdate({
      hash: '#/',
      flush: async () => {
        throw new Error('x');
      },
      updateSW,
    });
    expect(updateSW).toHaveBeenCalledWith(true);
  });
});

describe('applyUpdate re-check', () => {
  it('aborts if the child opened a drawing during the flush', async () => {
    const updateSW = vi.fn(async () => {});
    const ok = await applyUpdate({
      hash: '#/',
      flush: async () => true,
      updateSW,
      currentHash: () => '#/pintar/animals-01',
    });
    expect(ok).toBe(false);
    expect(updateSW).not.toHaveBeenCalled();
  });
});
