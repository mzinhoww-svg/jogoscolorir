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
      isClean: () => true,
    });
    expect(ok).toBe(true);
    expect(order).toEqual(['flush', 'update']);
  });
  it('does nothing on the paint screen', async () => {
    const flush = vi.fn(async () => true);
    const updateSW = vi.fn(async () => {});
    expect(await applyUpdate({ hash: '#/pintar/x-01', flush, updateSW, isClean: () => true })).toBe(
      false,
    );
    expect(flush).not.toHaveBeenCalled();
    expect(updateSW).not.toHaveBeenCalled();
  });
  const run = (flush: () => Promise<boolean>, isClean: () => boolean) => {
    const updateSW = vi.fn(async () => {});
    const onBlocked = vi.fn();
    return applyUpdate({ hash: '#/', flush, updateSW, isClean, onBlocked }).then((ok) => ({
      ok,
      updateSW,
      onBlocked,
    }));
  };
  it('does not update when flush resolves false', async () => {
    const r = await run(
      async () => false,
      () => true,
    );
    expect(r.ok).toBe(false);
    expect(r.updateSW).not.toHaveBeenCalled();
    expect(r.onBlocked).toHaveBeenCalled();
  });
  it('does not update when flush throws', async () => {
    const r = await run(
      async () => {
        throw new Error('x');
      },
      () => true,
    );
    expect(r.updateSW).not.toHaveBeenCalled();
    expect(r.onBlocked).toHaveBeenCalled();
  });
  it('does not update when queue still has pending work', async () => {
    const r = await run(
      async () => true,
      () => false,
    );
    expect(r.updateSW).not.toHaveBeenCalled();
    expect(r.onBlocked).toHaveBeenCalled();
  });
  it('updates when all clean', async () => {
    const r = await run(
      async () => true,
      () => true,
    );
    expect(r.ok).toBe(true);
    expect(r.updateSW).toHaveBeenCalledWith(true);
    expect(r.onBlocked).not.toHaveBeenCalled();
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
      isClean: () => true,
    });
    expect(ok).toBe(false);
    expect(updateSW).not.toHaveBeenCalled();
  });
});
