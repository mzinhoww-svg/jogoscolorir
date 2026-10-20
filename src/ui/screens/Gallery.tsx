import { useCallback, useEffect, useState } from 'react';
import { getPage } from '@/catalog';
import { pageName, useT } from '@/i18n';
import { deleteArtwork, listArtworks, type ArtworkRecord } from '@/persistence/artworks';
import { navigate } from '@/ui/router';
import { useApp } from '@/ui/state/AppState';
import { BigButton, IconButton } from '@/ui/components/BigButton';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { Thumb } from '@/ui/components/Thumb';
import { TopBar } from '@/ui/components/TopBar';
import { compositeFromPaint, downloadBlob, exportName } from '@/ui/exportArt';

export function Gallery() {
  const { t, lang } = useT();
  const { showToast } = useApp();
  const [items, setItems] = useState<ArtworkRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const apply = useCallback((r: Awaited<ReturnType<typeof listArtworks>>) => {
    if (r.ok) {
      setItems([...r.value].sort((x, y) => y.updatedAt - x.updatedAt));
      setFailed(false);
    } else {
      setItems([]);
      setFailed(true);
    }
  }, []);
  const load = useCallback(() => listArtworks().then(apply), [apply]);
  useEffect(() => {
    let alive = true;
    void listArtworks().then((r) => {
      if (alive) apply(r);
    });
    return () => {
      alive = false;
    };
  }, [apply]);

  const doExport = async (a: ArtworkRecord) => {
    try {
      downloadBlob(await compositeFromPaint(a.pageId, a.paint), exportName(a.pageId));
    } catch {
      showToast(t('export.failed'), 'error');
    }
  };
  const doDelete = async () => {
    const id = toDelete;
    setToDelete(null);
    if (!id) return;
    const r = await deleteArtwork(id);
    if (!r.ok) showToast(t('error.generic'), 'error');
    await load();
  };

  const visible = (items ?? []).filter((a) => getPage(a.pageId));
  return (
    <div className="screen">
      <TopBar onBack={() => navigate('#/')} title={t('gallery.title')} />
      {failed && <p className="notice error">{t('gallery.loadFailed')}</p>}
      {items && visible.length === 0 && !failed && (
        <main className="empty">
          <svg viewBox="0 0 120 100" className="empty-art" aria-hidden="true">
            <rect
              x="14"
              y="14"
              width="92"
              height="72"
              rx="14"
              fill="#FFFFFF"
              stroke="#2B2340"
              strokeWidth="5"
            />
            <circle cx="44" cy="44" r="10" fill="#FFD43B" />
            <path
              d="M20 78l26-22 18 14 14-10 24 18"
              fill="none"
              stroke="#38D9A9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>{t('gallery.empty')}</p>
          <BigButton variant="primary" icon="play" onClick={() => navigate('#/temas')}>
            {t('gallery.start')}
          </BigButton>
        </main>
      )}
      {visible.length > 0 && (
        <main className="grid page-grid">
          {visible.map((a) => {
            const page = getPage(a.pageId)!;
            const name = pageName(lang, a.pageId);
            return (
              <div
                key={a.pageId}
                className="card gallery-card"
                data-testid={`gallery-item-${a.pageId}`}
              >
                <button
                  type="button"
                  className="gallery-open"
                  aria-label={t('page.open', { name })}
                  onClick={() => navigate(`#/pintar/${a.pageId}`)}
                >
                  <Thumb page={page} blob={a.thumb} label={t('a11y.thumb', { name })} />
                  <span className="card-title small">{name}</span>
                </button>
                <div className="gallery-actions">
                  <IconButton
                    testId="export"
                    icon="download"
                    label={t('gallery.export')}
                    onClick={() => void doExport(a)}
                  />
                  <IconButton
                    testId="delete"
                    icon="trash"
                    label={t('gallery.delete')}
                    className="danger"
                    onClick={() => setToDelete(a.pageId)}
                  />
                </div>
              </div>
            );
          })}
        </main>
      )}
      {toDelete && (
        <ConfirmDialog
          title={t('gallery.delete.title')}
          body={t('gallery.delete.body', { name: pageName(lang, toDelete) })}
          yes={t('gallery.delete.confirm')}
          no={t('gallery.delete.cancel')}
          danger
          onYes={() => void doDelete()}
          onNo={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
