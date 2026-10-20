import { useEffect, useState } from 'react';
import { THEMES } from '@/catalog';
import { pageName, themeName, useT } from '@/i18n';
import { listArtworks } from '@/persistence/artworks';
import { navigate } from '@/ui/router';
import { Thumb } from '@/ui/components/Thumb';
import { TopBar } from '@/ui/components/TopBar';

export function ThemePages(props: { themeId: string }) {
  const { t, lang } = useT();
  const theme = THEMES.find((x) => x.id === props.themeId)!;
  const [thumbs, setThumbs] = useState<Map<string, Blob>>(new Map());
  useEffect(() => {
    let alive = true;
    void listArtworks().then((r) => {
      if (alive && r.ok) setThumbs(new Map(r.value.map((a) => [a.pageId, a.thumb])));
    });
    return () => {
      alive = false;
    };
  }, []);
  const tName = themeName(lang, theme.id);
  return (
    <div className="screen" style={{ ['--theme' as string]: theme.color }}>
      <TopBar onBack={() => navigate('#/temas')} title={tName} />
      <main className="grid page-grid" aria-label={t('theme.pages', { name: tName })}>
        {theme.pages.map((p) => {
          const name = pageName(lang, p.id);
          const blob = thumbs.get(p.id) ?? null;
          return (
            <button
              key={p.id}
              type="button"
              data-testid={`page-${p.id}`}
              className="card page-card"
              aria-label={t('page.open', { name })}
              onClick={() => navigate(`#/pintar/${p.id}`)}
            >
              <Thumb page={p} blob={blob} label={t('a11y.thumb', { name })} />
              {blob && <span className="badge">{t('page.continue')}</span>}
              <span className="card-title small">{name}</span>
            </button>
          );
        })}
      </main>
    </div>
  );
}
