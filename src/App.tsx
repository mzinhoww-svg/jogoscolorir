import { useCallback, useEffect, useState } from 'react';
import { I18nProvider, type Lang } from '@/i18n';
import { audio } from '@/audio/audio';
import { AppStateProvider, initialPrefs, useApp } from '@/ui/state/AppState';
import { useRoute } from '@/ui/router';
import { Toast } from '@/ui/components/Toast';
import { Home } from '@/ui/screens/Home';
import { Themes } from '@/ui/screens/Themes';
import { ThemePages } from '@/ui/screens/ThemePages';
import { Paint } from '@/ui/screens/Paint';
import { Gallery } from '@/ui/screens/Gallery';
import { Parents } from '@/ui/screens/Parents';

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

function Shell() {
  const { prefs, updatePrefs } = useApp();
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
