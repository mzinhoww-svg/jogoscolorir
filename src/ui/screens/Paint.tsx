import { useCallback, useEffect, useRef, useState } from 'react';
import { getPage, THEMES } from '@/catalog';
import { PaintSession } from '@/engine/session';
import { browserCanvasFactory } from '@/engine/canvasFactory';
import { COLORS, SHINES, type Size, type ToolId } from '@/engine/tools';
import type { PatternId } from '@/engine/patterns';
import { loadArtwork } from '@/persistence/artworks';
import { saveQueue, type Snapshot } from '@/ui/state/saveQueue';
import { audio } from '@/audio/audio';
import { pageName, useT } from '@/i18n';
import { navigate } from '@/ui/router';
import { useApp } from '@/ui/state/AppState';
import { IconButton } from '@/ui/components/BigButton';
import { Icon } from '@/ui/components/Icon';
import { MuteButton } from '@/ui/components/TopBar';
import { Toolbar } from '@/ui/components/Toolbar';
import { Palette } from '@/ui/components/Palette';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { downloadBlob, exportName, prefersReducedMotion } from '@/ui/exportArt';

export const AUTOSAVE_MS = 700;
const DEFAULT_COLOR = COLORS[4] ?? '#E8423F';
const DEFAULT_SHINE = SHINES[0]?.id ?? 'gold';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

/** Timeouts that are cancelled when the paint screen unmounts. */
const fxTimers = new Set<ReturnType<typeof setTimeout>>();
function later(cb: () => void, ms: number): void {
  const id = setTimeout(() => {
    fxTimers.delete(id);
    cb();
  }, ms);
  fxTimers.add(id);
}

function celebrate(host: HTMLElement): void {
  if (prefersReducedMotion()) return;
  const colors = ['#FF6B5A', '#FFA94D', '#FFD43B', '#38D9A9', '#4DABF7', '#9775FA'];
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('span');
    s.style.left = `${5 + Math.random() * 90}%`;
    s.style.background = colors[i % colors.length] ?? '#FFD43B';
    s.style.animationDelay = `${Math.random() * 250}ms`;
    s.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    s.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    layer.appendChild(s);
  }
  host.appendChild(layer);
  later(() => layer.remove(), 1600);
}

function fillPulse(host: HTMLElement, x: number, y: number, color: string): void {
  if (prefersReducedMotion()) return;
  const d = document.createElement('div');
  d.className = 'fill-pulse';
  d.setAttribute('aria-hidden', 'true');
  d.style.left = `${x}px`;
  d.style.top = `${y}px`;
  d.style.background = color;
  host.appendChild(d);
  later(() => d.remove(), 320);
}

export function Paint(props: { pageId: string }) {
  const { pageId } = props;
  const page = getPage(pageId)!;
  const themeId = page.themeId;
  const { t, lang } = useT();
  const { showToast } = useApp();

  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<PaintSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const needsSaveRef = useRef(false);
  const mountedRef = useRef(false);
  const createdAtRef = useRef<number | null>(null);
  const strokesRef = useRef(0);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const brushRef = useRef({ tool: 'marker' as ToolId, color: DEFAULT_COLOR });

  const [tool, setTool] = useState<ToolId>('marker');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [shine, setShine] = useState(DEFAULT_SHINE);
  const [pattern, setPattern] = useState<PatternId>('stripes');
  const [size, setSize] = useState<Size>('m');
  const [hist, setHist] = useState({ canUndo: false, canRedo: false });
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  /** Save now. Exports are snapshotted synchronously, so this is safe right before dispose. */
  /** Synchronous snapshot of the current pixels (safe right before dispose). */
  const snapshot = useCallback((session: PaintSession): Promise<Snapshot> => {
    const pPaint = session.exportPaintPNG();
    const pThumb = session.exportCompositePNG(256);
    const now = Date.now();
    if (createdAtRef.current === null) createdAtRef.current = now;
    const createdAt = createdAtRef.current;
    const strokes = strokesRef.current;
    needsSaveRef.current = false;
    return Promise.all([pPaint, pThumb]).then(([paint, thumb]) => ({
      paint,
      thumb,
      createdAt,
      updatedAt: now,
      strokes,
    }));
  }, []);

  const saveNow = useCallback((): Promise<boolean> => {
    clearTimeout(timerRef.current);
    const s = sessionRef.current;
    if (!s) return Promise.resolve(!needsSaveRef.current && !saveQueue.get(pageId));
    if (mountedRef.current) setStatus('saving');
    const p = needsSaveRef.current
      ? saveQueue.enqueueAsync(pageId, snapshot(s))
      : saveQueue.flush(pageId);
    return p.then((ok) => {
      if (mountedRef.current) {
        setStatus(ok ? 'saved' : 'failed');
        if (ok && !needsSaveRef.current) sessionRef.current?.markClean();
        if (!ok) audio.play('error');
      }
      return ok;
    });
  }, [pageId, snapshot]);

  const scheduleSave = useCallback(() => {
    needsSaveRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void saveNow(), AUTOSAVE_MS);
  }, [saveNow]);

  // ---- session lifecycle ----
  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = stageRef.current!;
    const frame = frameRef.current!;
    canvas.removeAttribute('data-ready');
    const session = new PaintSession({
      page,
      canvas,
      factory: browserCanvasFactory,
      onChange: (st) =>
        setHist((h) =>
          h.canUndo === st.canUndo && h.canRedo === st.canRedo
            ? h
            : { canUndo: st.canUndo, canRedo: st.canRedo },
        ),
      onCommit: () => {
        strokesRef.current++;
        const b = brushRef.current;
        if (b.tool === 'bucket' && downRef.current) {
          fillPulse(frame, downRef.current.x, downRef.current.y, b.color);
          audio.play('fill');
        }
        scheduleSave();
      },
    });
    sessionRef.current = session;
    let alive = true;

    const fit = () => {
      const r = stage.getBoundingClientRect();
      const side = Math.max(1, Math.floor(Math.min(r.width, r.height)));
      frame.style.width = `${side}px`;
      frame.style.height = `${side}px`;
      session.resize();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    const onOrient = () =>
      setTimeout(() => {
        if (alive) fit();
      }, 120);
    window.addEventListener('orientationchange', onOrient);

    // Pointer wiring: native events straight to the session, no React state per move.
    const down = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      downRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      session.pointerDown(e);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* best effort */
      }
      e.preventDefault();
    };
    const move = (e: PointerEvent) => session.pointerMove(e);
    const up = (e: PointerEvent) => session.pointerUp(e);
    const cancel = (e: PointerEvent) => session.pointerCancel(e);
    const lost = (e: PointerEvent) => session.lostPointerCapture(e);
    const noMenu = (e: Event) => e.preventDefault();
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', lost);
    canvas.addEventListener('contextmenu', noMenu);

    // Reopen: draw the saved paint, then mark ready.
    void (async () => {
      // Unsaved snapshots in the queue win over the DB copy; try to persist them first.
      await saveQueue.latest(pageId);
      await saveQueue.flush(pageId);
      const queued = saveQueue.get(pageId);
      const r = queued ? null : await loadArtwork(pageId);
      if (!alive) return;
      const rec = queued ?? (r && r.ok ? r.value : null);
      if (queued) {
        needsSaveRef.current = false;
        setStatus('failed');
      }
      if (rec) {
        createdAtRef.current = rec.createdAt;
        strokesRef.current = rec.strokes;
        try {
          const bmp = await createImageBitmap(rec.paint);
          if (!alive) return;
          session.loadPaint(bmp);
          bmp.close?.();
        } catch {
          /* unreadable paint: start blank */
        }
      }
      if (!alive) return;
      session.renderNow();
      canvas.setAttribute('data-ready', 'true');
    })();

    const onHidden = () => {
      if (document.visibilityState === 'hidden') void saveNow();
    };
    const onPageHide = () => {
      void saveNow();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);

    mountedRef.current = true;
    return () => {
      alive = false;
      mountedRef.current = false;
      for (const id of fxTimers) clearTimeout(id);
      fxTimers.clear();
      ro.disconnect();
      window.removeEventListener('orientationchange', onOrient);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', lost);
      canvas.removeEventListener('contextmenu', noMenu);
      // Leaving the paint screen (e.g. browser back): save immediately, warn on failure.
      // Leaving (e.g. browser back): snapshot BEFORE dispose; the queue owns the save from here.
      clearTimeout(timerRef.current);
      const p = needsSaveRef.current
        ? saveQueue.enqueueAsync(pageId, snapshot(session))
        : saveQueue.get(pageId)
          ? saveQueue.flush(pageId)
          : null;
      void p?.then((ok) => {
        if (!ok) showToast(t('save.failed'), 'error');
      });
      sessionRef.current = null;
      session.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  useEffect(() => {
    brushRef.current = { tool, color };
    sessionRef.current?.setBrush({ tool, color, shine, pattern, size });
  }, [tool, color, shine, pattern, size]);

  // ---- actions ----
  const pickTool = (id: ToolId) => {
    setTool(id);
    audio.play('click');
  };
  const pickColor = (c: string) => {
    setColor(c);
    audio.play('color');
  };
  const pickShine = (s: string) => {
    setShine(s);
    audio.play('shine');
  };
  const undo = () => {
    sessionRef.current?.undo();
    audio.play('click');
    scheduleSave();
  };
  const redo = () => {
    sessionRef.current?.redo();
    audio.play('click');
    scheduleSave();
  };
  const doClear = () => {
    setConfirmClear(false);
    sessionRef.current?.clear();
    scheduleSave();
  };
  const done = async () => {
    const ok = await saveNow();
    if (ok && frameRef.current) {
      audio.play('celebrate');
      celebrate(frameRef.current);
    }
  };
  const doExport = async () => {
    const s = sessionRef.current;
    if (!s) return;
    try {
      downloadBlob(await s.exportCompositePNG(1000), exportName(pageId));
    } catch {
      showToast(t('export.failed'), 'error');
    }
  };
  const back = async () => {
    const target = `#/tema/${themeId}`;
    if (needsSaveRef.current || saveQueue.get(pageId)) {
      const ok = await saveNow();
      if (!ok) {
        setConfirmLeave(true);
        return;
      }
    }
    navigate(target);
  };

  const name = pageName(lang, pageId);
  const themeColor = THEMES.find((x) => x.id === themeId)?.color ?? '#FFA94D';
  const statusText =
    status === 'saving'
      ? t('save.saving')
      : status === 'saved'
        ? t('save.saved')
        : status === 'failed'
          ? t('save.failed')
          : '';

  return (
    <div className="screen paint" style={{ ['--theme' as string]: themeColor }}>
      <header className="topbar paint-top">
        <IconButton testId="back" icon="back" label={t('paint.back')} onClick={() => void back()} />
        <h1 className="topbar-title paint-title">{name}</h1>
        <div className="topbar-spacer" />
        <IconButton
          testId="undo"
          icon="undo"
          label={t('paint.undo')}
          disabled={!hist.canUndo}
          onClick={undo}
        />
        <IconButton
          testId="redo"
          icon="redo"
          label={t('paint.redo')}
          disabled={!hist.canRedo}
          onClick={redo}
        />
        <IconButton
          testId="clear"
          icon="trash"
          label={t('paint.clear')}
          onClick={() => setConfirmClear(true)}
        />
        <MuteButton />
        <button
          type="button"
          data-testid="done"
          className="btn btn-primary done-btn"
          aria-label={t('paint.done')}
          onClick={() => void done()}
        >
          <Icon name="check" />
          <span className="btn-label">{t('paint.done')}</span>
        </button>
      </header>

      <div className="paint-body">
        <aside className="paint-tools">
          <Toolbar tool={tool} size={size} onTool={pickTool} onSize={setSize} />
          <IconButton
            testId="export"
            icon="download"
            label={t('paint.export')}
            className="export-btn"
            onClick={() => void doExport()}
          />
        </aside>
        <div className="paint-stage" ref={stageRef}>
          <div className="paint-frame" ref={frameRef}>
            <canvas
              ref={canvasRef}
              data-testid="paint-canvas"
              className="paint-canvas"
              aria-label={t('paint.canvas')}
            />
            <div
              data-testid="save-status"
              data-status={status}
              className={`save-status save-${status}`}
              role="status"
              aria-live="polite"
            >
              {statusText}
            </div>
          </div>
        </div>
        <aside className="paint-palette">
          <Palette
            tool={tool}
            color={color}
            shine={shine}
            pattern={pattern}
            onColor={pickColor}
            onShine={pickShine}
            onPattern={(p) => {
              setPattern(p);
              audio.play('click');
            }}
          />
        </aside>
      </div>

      {status === 'failed' && (
        <div className="save-warning" role="alert">
          <p>
            <strong>{t('save.failed')}</strong> {t('save.failed.help')}
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => void saveNow()}>
            <span className="btn-label">{t('save.retry')}</span>
          </button>
        </div>
      )}

      {confirmClear && (
        <ConfirmDialog
          title={t('clear.title')}
          body={t('clear.body')}
          yes={t('clear.confirm')}
          no={t('clear.cancel')}
          danger
          onYes={doClear}
          onNo={() => setConfirmClear(false)}
        />
      )}
      {confirmLeave && (
        <ConfirmDialog
          title={t('save.leave.title')}
          body={t('save.leave.body')}
          yes={t('save.leave.go')}
          no={t('save.leave.stay')}
          danger
          onYes={() => {
            setConfirmLeave(false);
            navigate(`#/tema/${themeId}`);
          }}
          onNo={() => setConfirmLeave(false)}
        />
      )}
    </div>
  );
}
