import { saveQueue } from '@/ui/state/saveQueue';
import { applyUpdate, createBlockedRetry } from './applyUpdate';
import type { PwaUpdate } from '@/ui/state/AppState';

interface Hooks {
  onBlocked: () => void;
  setUpdate: (u: PwaUpdate | null) => void;
  onOfflineReady: () => void;
}

let started = false;

/** Registers the service worker once. Never reloads by itself: the update waits for apply(). */
export async function registerPwa({ setUpdate, onOfflineReady, onBlocked }: Hooks): Promise<void> {
  if (started || !import.meta.env.PROD) return;
  started = true;
  const { registerSW } = await import('virtual:pwa-register');
  const apply = () => {
    void applyUpdate({
      hash: window.location.hash,
      flush: () => saveQueue.flushAll(),
      updateSW,
      isClean: () => saveQueue.isClean(),
      onBlocked: () => {
        retry.markBlocked();
        onBlocked();
      },
      currentHash: () => window.location.hash,
    });
  };
  const retry = createBlockedRetry({
    getHash: () => window.location.hash,
    isClean: () => saveQueue.isClean(),
    apply,
  });
  // A blocked update is retried when the child leaves the canvas or the saves catch up.
  window.addEventListener('hashchange', () => retry.check());
  document.addEventListener('visibilitychange', () => retry.check());
  window.setInterval(() => {
    if (retry.isBlocked()) retry.check();
  }, 2000);
  const updateSW = registerSW({
    onNeedRefresh() {
      setUpdate({ apply });
    },
    onOfflineReady,
  });
}
