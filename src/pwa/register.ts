import { saveQueue } from '@/ui/state/saveQueue';
import { applyUpdate } from './applyUpdate';
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
  const updateSW = registerSW({
    onNeedRefresh() {
      setUpdate({
        apply: () => {
          void applyUpdate({
            hash: window.location.hash,
            flush: () => saveQueue.flushAll(),
            updateSW,
            isClean: () => saveQueue.isClean(),
            onBlocked,
            currentHash: () => window.location.hash,
          });
        },
      });
    },
    onOfflineReady,
  });
}
