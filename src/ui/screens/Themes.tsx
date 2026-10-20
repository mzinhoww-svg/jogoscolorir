import { useEffect, useState } from 'react';
import { THEMES } from '@/catalog';
import { themeName, useT } from '@/i18n';
import { listArtworks } from '@/persistence/artworks';
import { navigate } from '@/ui/router';
import { Thumb } from '@/ui/components/Thumb';
import { TopBar } from '@/ui/components/TopBar';

export function useSavedIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    void listArtworks().then((r) => {
      if (alive && r.ok) setIds(new Set(r.value.map((a) => a.pageId)));
    });
    return () => {
      alive = false;
    };
  }, []);
  return ids;
}

export function Themes() {
  const { t, lang } = useT();
  const saved = useSavedIds();
  return (
    <div className="screen">
      <TopBar onBack={() => navigate('#/')} title={t('themes.title')} />
      <main className="grid theme-grid">
        {THEMES.map((th) => {
          const done = th.pages.filter((p) => saved.has(p.id)).length;
          const name = themeName(lang, th.id);
          return (
            <button
              key={th.id}
              type="button"
              data-testid={`theme-${th.id}`}
              className="card theme-card"
              style={{ ['--theme' as string]: th.color }}
              onClick={() => navigate(`#/tema/${th.id}`)}
            >
              <span className="theme-thumb">
                {th.pages[0] && <Thumb page={th.pages[0]} label={t('a11y.thumb', { name })} />}
              </span>
              <span className="card-title">{name}</span>
              <span className="progress">
                {t('theme.progress', { done, total: th.pages.length || 15 })}
              </span>
            </button>
          );
        })}
      </main>
    </div>
  );
}
