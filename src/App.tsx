import { useCallback, useEffect, useState } from 'react';
import { I18nProvider, type Lang } from '@/i18n';
import { audio } from '@/audio/audio';
import { AppStateProvider, initialPrefs, useApp } from '@/ui/state/AppState';
import { useRoute } from '@/ui/router';
import { Toast } from '@/ui/components/Toast';
import { saveQueue } from '@/ui/state/saveQueue';
import { t } from '@/i18n';
import { Home } from '@/ui/screens/Home';
import { Themes } from '@/ui/screens/Themes';
import { ThemePages } from '@/ui/screens/ThemePages';
import { Paint } from '@/ui/screens/Paint';
import { Gallery } from '@/ui/screens/Gallery';
import { Parents } from '@/ui/screens/Parents';
import { registerPwa } from '@/pwa/register';

function Screens() {
  const route = useRoute();
  switch (route.name) {
    case 'themes':
      return <Themes />;
    case 'theme':
      return <ThemePages key={route.themeId} themeId={route.themeId} />;
    case 'paint':
      return <Paint key={route.pageId} pageId={route.pageId} />;
    case 'gallery':
      return <Gallery />;
    case 'parents':
      return <Parents />;
    default:
      return <Home />;
  }
}

/** Retry queued unsaved drawings on interaction, reconnect and when the app becomes visible. */
function useSaveRetry(lang: Lang, showToast: (m: string, k?: 'info' | 'error') => void) {
  useEffect(() => {
    let last = 0;
    const retry = () => {
      const now = Date.now();
      if (!saveQueue.hasPending() || now - last < 3000) return;
      last = now;
      void saveQueue.flushAll().then((ok) => {
        if (!ok) showToast(t(lang, 'save.failed'), 'error');
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') retry();
    };
    window.addEventListener('pointerdown', retry);
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pointerdown', retry);
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [lang, showToast]);
}

function Shell() {
  const { prefs, updatePrefs, showToast, setUpdate } = useApp();
  useSaveRetry(prefs.lang, showToast);
  const lang = prefs.lang;
  useEffect(() => {
    void registerPwa({
      setUpdate,
      onOfflineReady: () => showToast(t(lang, 'pwa.offlineReady')),
      onBlocked: () => showToast(t(lang, 'update.waitSave'), 'error'),
    });
    // register once; later language changes only affect the toast text of this first call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setLang = useCallback((l: Lang) => updatePrefs({ lang: l }), [updatePrefs]);
  useEffect(() => {
    document.documentElement.lang = prefs.lang;
  }, [prefs.lang]);
  return (
    <I18nProvider lang={prefs.lang} setLang={setLang}>
      <Screens />
      <Toast />
    </I18nProvider>
  );
}

export function App() {
  const [initial] = useState(initialPrefs);
  useEffect(() => {
    // WebAudio may only start from a user gesture.
    const unlock = () => {
      audio.unlock();
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
  }, []);
  return (
    <AppStateProvider initial={initial}>
      <Shell />
    </AppStateProvider>
  );
}
