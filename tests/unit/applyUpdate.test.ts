import { describe, expect, it, vi } from 'vitest';
import {
  applyUpdate,
  createBlockedRetry,
  shouldApplyNow,
  shouldRetryBlocked,
} from '@/pwa/applyUpdate';

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

describe('blocked update retry', () => {
  it('shouldRetryBlocked needs blocked, clean and not on the paint screen', () => {
    expect(shouldRetryBlocked(true, '#/', true)).toBe(true);
    expect(shouldRetryBlocked(true, '#/pintar/x-01', true)).toBe(false);
    expect(shouldRetryBlocked(true, '#/', false)).toBe(false);
    expect(shouldRetryBlocked(false, '#/', true)).toBe(false);
  });
  it('retries once when the queue becomes clean off the paint screen', () => {
    let hash = '#/pintar/x-01';
    let clean = false;
    const apply = vi.fn();
    const r = createBlockedRetry({ getHash: () => hash, isClean: () => clean, apply });
    expect(r.check()).toBe(false); // nothing blocked yet
    r.markBlocked();
    expect(r.check()).toBe(false); // still painting and dirty
    hash = '#/';
    expect(r.check()).toBe(false); // left the canvas but not saved yet
    clean = true;
    expect(r.check()).toBe(true);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(r.check()).toBe(false); // not retried again unless blocked again
    r.markBlocked();
    expect(r.check()).toBe(true);
    expect(apply).toHaveBeenCalledTimes(2);
  });
});
