import type { PageDef } from '@/catalog/types';
import { renderOutline } from '@/catalog/render';
import { buildRegionMap, regionAt, regionMask, type RegionMap } from './regions';
import { ctx2d, type AnyCanvas, type CanvasFactory } from './canvasFactory';
import { ViewTransform, type ClientRect } from './transform';
import { History, type HistoryRect } from './history';
import { mulberry32, stampSegment, toolWidth, type Brush, type StrokePoint } from './tools';
import { makePattern } from './patterns';

export const LOGICAL = 1000;
const TAP_SLOP = 6;
const MASK_CACHE = 6;

export type PointerLike = Pick<
  PointerEvent,
  'pointerId' | 'clientX' | 'clientY' | 'pressure' | 'pointerType' | 'isPrimary' | 'button'
> & { getCoalescedEvents?: () => PointerLike[] };

export interface SessionState {
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
}

export interface PaintSessionOptions {
  page: PageDef;
  canvas: HTMLCanvasElement | AnyCanvas;
  factory: CanvasFactory;
  onChange: (s: SessionState) => void;
  onCommit?: () => void;
  getRect?: () => ClientRect;
  dpr?: () => number;
  schedule?: (cb: () => void) => void;
}

interface Active {
  pointerId: number;
  label: number;
  last: StrokePoint;
  start: { x: number; y: number };
  moved: number;
  bbox: [number, number, number, number];
  rng: () => number;
  pattern?: CanvasPattern;
}

interface MaskInfo {
  label: number;
  canvas: AnyCanvas;
  rect: HistoryRect;
}

const DEFAULT_BRUSH: Brush = {
  tool: 'marker',
  color: '#E8423F',
  shine: 'gold',
  pattern: 'stripes',
  size: 'm',
};

/** Orchestrates layers, pointer gestures, tools, masking, history and export for one page. */
export class PaintSession {
  private opts: PaintSessionOptions;
  private display: AnyCanvas;
  private paint: AnyCanvas;
  private scratch: AnyCanvas;
  private outline: AnyCanvas;
  private regions: RegionMap;
  private history = new History();
  private brush: Brush = { ...DEFAULT_BRUSH };
  private active: Active | null = null;
  private mask: MaskInfo | null = null;
  private maskCache = new Map<number, MaskInfo>();
  /** Number of region masks built (cache misses); exposed for tests. */
  maskBuilds = 0;
  private transform: ViewTransform;
  private framePending = false;
  private dirty = false;
  private strokeSeed = 1;
  private disposed = false;

  constructor(opts: PaintSessionOptions) {
    this.opts = opts;
    this.display = opts.canvas as AnyCanvas;
    const f = opts.factory;
    this.paint = f.create(LOGICAL, LOGICAL);
    this.scratch = f.create(LOGICAL, LOGICAL);
    this.outline = f.create(LOGICAL, LOGICAL);
    const octx = ctx2d(this.outline);
    renderOutline(octx, opts.page, LOGICAL);
    this.regions = buildRegionMap(octx.getImageData(0, 0, LOGICAL, LOGICAL).data, LOGICAL, LOGICAL);
    this.transform = new ViewTransform(this.rect());
    this.resize();
  }

  // ---- environment ----
  private rect(): ClientRect {
    if (this.opts.getRect) return this.opts.getRect();
    return (this.opts.canvas as HTMLCanvasElement).getBoundingClientRect();
  }
  private dpr(): number {
    return this.opts.dpr
      ? this.opts.dpr()
      : typeof window !== 'undefined'
        ? window.devicePixelRatio || 1
        : 1;
  }
  private schedule(cb: () => void): void {
    if (this.opts.schedule) this.opts.schedule(cb);
    else requestAnimationFrame(cb);
  }

  get canUndo(): boolean {
    return this.history.canUndo;
  }
  get canRedo(): boolean {
    return this.history.canRedo;
  }
  get historySize(): number {
    return this.history.size;
  }
  get regionMap(): RegionMap {
    return this.regions;
  }

  private emit(): void {
    this.opts.onChange({ canUndo: this.canUndo, canRedo: this.canRedo, dirty: this.dirty });
  }

  setBrush(b: Partial<Brush>): void {
    this.brush = { ...this.brush, ...b };
  }
  getBrush(): Brush {
    return { ...this.brush };
  }

  /** Mark the current paint as persisted (dirty=false). */
  markClean(): void {
    this.dirty = false;
    this.emit();
  }

  // ---- rendering ----
  private requestRender(): void {
    if (this.framePending || this.disposed) return;
    this.framePending = true;
    this.schedule(() => {
      this.framePending = false;
      if (!this.disposed) this.renderNow();
    });
  }

  renderNow(): void {
    const ctx = ctx2d(this.display);
    const W = this.display.width;
    const H = this.display.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.paint as unknown as CanvasImageSource, 0, 0, W, H);
    if (this.active) ctx.drawImage(this.scratch as unknown as CanvasImageSource, 0, 0, W, H);
    ctx.drawImage(this.outline as unknown as CanvasImageSource, 0, 0, W, H);
    ctx.restore();
  }

  resize(): void {
    const r = this.rect();
    this.transform = new ViewTransform(r, LOGICAL);
    const { width, height } = ViewTransform.backingSize(r, this.dpr());
    if (this.display.width !== width) this.display.width = width;
    if (this.display.height !== height) this.display.height = height;
    this.renderNow();
  }

  // ---- masks ----
  private maskFor(label: number): MaskInfo {
    const hit = this.maskCache.get(label);
    if (hit) {
      this.maskCache.delete(label);
      this.maskCache.set(label, hit);
      this.mask = hit;
      return hit;
    }
    this.maskBuilds++;
    const m = regionMask(this.regions, label, 2);
    let c: AnyCanvas;
    if (this.maskCache.size >= MASK_CACHE) {
      const oldest = this.maskCache.keys().next().value as number;
      c = this.maskCache.get(oldest)!.canvas;
      this.maskCache.delete(oldest);
      ctx2d(c).clearRect(0, 0, LOGICAL, LOGICAL);
    } else c = this.opts.factory.create(LOGICAL, LOGICAL);
    const ctx = ctx2d(c);
    const img = ctx.createImageData(LOGICAL, LOGICAL);
    let x0 = LOGICAL;
    let y0 = LOGICAL;
    let x1 = -1;
    let y1 = -1;
    for (let i = 0; i < m.length; i++) {
      if (!m[i]) continue;
      img.data[i * 4 + 3] = 255;
      const x = i % LOGICAL;
      const y = (i - x) / LOGICAL;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    ctx.putImageData(img, 0, 0);
    this.mask = { label, canvas: c, rect: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } };
    this.maskCache.set(label, this.mask);
    return this.mask;
  }

  private applyMask(x0: number, y0: number, x1: number, y1: number): void {
    if (!this.mask) return;
    const ctx = ctx2d(this.scratch);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(this.mask.canvas as unknown as CanvasImageSource, 0, 0);
    ctx.restore();
  }

  private fillRegion(style: string | CanvasPattern): void {
    if (!this.mask) return;
    const ctx = ctx2d(this.scratch);
    const r = this.mask.rect;
    ctx.save();
    ctx.clearRect(0, 0, LOGICAL, LOGICAL);
    ctx.drawImage(this.mask.canvas as unknown as CanvasImageSource, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = style;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
    if (this.active) this.active.bbox = [r.x, r.y, r.x + r.w, r.y + r.h];
  }

  // ---- pointer gestures ----
  private point(e: PointerLike): StrokePoint {
    const { x, y } = this.transform.toLogical(e.clientX, e.clientY);
    // Some styluses report pressure 0 at down/hover: treat p<=0 as unknown (speed-based width).
    return { x, y, p: e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : -1 };
  }

  pointerDown(e: PointerLike): void {
    if (this.active || this.disposed) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.transform = new ViewTransform(this.rect(), LOGICAL);
    const pt = this.point(e);
    const label = regionAt(this.regions, pt.x, pt.y, 12);
    if (label === 0) return;
    this.maskFor(label);
    const seed = this.strokeSeed++;
    this.active = {
      pointerId: e.pointerId,
      label,
      last: pt,
      start: { x: pt.x, y: pt.y },
      moved: 0,
      bbox: [Infinity, Infinity, -Infinity, -Infinity],
      rng: mulberry32(seed * 2654435761),
    };
    try {
      (this.opts.canvas as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    ctx2d(this.scratch).clearRect(0, 0, LOGICAL, LOGICAL);
    const b = this.brush;
    if (b.tool === 'bucket') {
      this.fillRegion(b.color);
    } else {
      if (b.tool === 'pattern') {
        this.active.pattern = makePattern(
          ctx2d(this.scratch),
          b.pattern,
          b.color,
          this.opts.factory.create,
        );
      }
      this.segment(pt, pt);
    }
    this.requestRender();
  }

  private segment(from: StrokePoint, to: StrokePoint): void {
    const a = this.active!;
    const ctx = ctx2d(this.scratch);
    stampSegment(ctx, this.brush, from, to, a.rng, { pattern: a.pattern });
    const pad = toolWidth(this.brush.tool, this.brush.size) + 12;
    const x0 = Math.max(0, Math.floor(Math.min(from.x, to.x) - pad));
    const y0 = Math.max(0, Math.floor(Math.min(from.y, to.y) - pad));
    const x1 = Math.min(LOGICAL, Math.ceil(Math.max(from.x, to.x) + pad));
    const y1 = Math.min(LOGICAL, Math.ceil(Math.max(from.y, to.y) + pad));
    if (x1 <= x0 || y1 <= y0) return;
    this.applyMask(x0, y0, x1, y1);
    a.bbox = [
      Math.min(a.bbox[0], x0),
      Math.min(a.bbox[1], y0),
      Math.max(a.bbox[2], x1),
      Math.max(a.bbox[3], y1),
    ];
  }

  pointerMove(e: PointerLike): void {
    const a = this.active;
    if (!a || e.pointerId !== a.pointerId) return;
    if (this.brush.tool === 'bucket') return;
    const events = e.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e]) {
      const pt = this.point(ev);
      a.moved = Math.max(a.moved, Math.hypot(pt.x - a.start.x, pt.y - a.start.y));
      this.segment(a.last, pt);
      a.last = pt;
    }
    this.requestRender();
  }

  pointerUp(e: PointerLike): void {
    const a = this.active;
    if (!a || e.pointerId !== a.pointerId) return;
    if (this.brush.tool === 'pattern' && a.moved < TAP_SLOP && a.pattern)
      this.fillRegion(a.pattern);
    this.commit();
  }

  /** pointercancel / lostpointercapture: finish the stroke as completed (never discarded). */
  pointerCancel(e: PointerLike): void {
    const a = this.active;
    if (!a || e.pointerId !== a.pointerId) return;
    this.commit();
  }
  lostPointerCapture(e: PointerLike): void {
    this.pointerCancel(e);
  }

  private commit(): void {
    const a = this.active!;
    const m = this.mask!.rect;
    const x0 = Math.max(a.bbox[0], m.x);
    const y0 = Math.max(a.bbox[1], m.y);
    const x1 = Math.min(a.bbox[2], m.x + m.w);
    const y1 = Math.min(a.bbox[3], m.y + m.h);
    this.active = null;
    if (x1 > x0 && y1 > y0) {
      const rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      const pctx = ctx2d(this.paint);
      const before = pctx.getImageData(rect.x, rect.y, rect.w, rect.h);
      pctx.drawImage(this.scratch as unknown as CanvasImageSource, 0, 0);
      const after = pctx.getImageData(rect.x, rect.y, rect.w, rect.h);
      this.history.push({ rect, before, after });
      this.dirty = true;
    }
    ctx2d(this.scratch).clearRect(0, 0, LOGICAL, LOGICAL);
    this.renderNow();
    this.emit();
    this.opts.onCommit?.();
  }

  // ---- history ----
  undo(): void {
    if (this.active) return;
    const e = this.history.undo();
    if (!e) return;
    ctx2d(this.paint).putImageData(e.before, e.rect.x, e.rect.y);
    this.dirty = true;
    this.requestRender();
    this.emit();
  }

  redo(): void {
    if (this.active) return;
    const e = this.history.redo();
    if (!e) return;
    ctx2d(this.paint).putImageData(e.after, e.rect.x, e.rect.y);
    this.dirty = true;
    this.requestRender();
    this.emit();
  }

  clear(): void {
    if (this.active) return;
    const pctx = ctx2d(this.paint);
    const before = pctx.getImageData(0, 0, LOGICAL, LOGICAL);
    pctx.clearRect(0, 0, LOGICAL, LOGICAL);
    const after = pctx.getImageData(0, 0, LOGICAL, LOGICAL);
    this.history.push({ rect: { x: 0, y: 0, w: LOGICAL, h: LOGICAL }, before, after });
    this.dirty = true;
    this.requestRender();
    this.emit();
  }

  /** Replace the paint layer (null = blank) and reset history. */
  loadPaint(img: ImageBitmap | HTMLImageElement | AnyCanvas | null): void {
    this.active = null;
    const pctx = ctx2d(this.paint);
    pctx.clearRect(0, 0, LOGICAL, LOGICAL);
    if (img) pctx.drawImage(img as CanvasImageSource, 0, 0, LOGICAL, LOGICAL);
    ctx2d(this.scratch).clearRect(0, 0, LOGICAL, LOGICAL);
    this.history.clear();
    this.dirty = false;
    this.requestRender();
    this.emit();
  }

  getPaintImageData(): ImageData {
    return ctx2d(this.paint).getImageData(0, 0, LOGICAL, LOGICAL);
  }

  exportPaintPNG(): Promise<Blob> {
    return this.opts.factory.toPNG(this.paint);
  }

  exportCompositePNG(size: number): Promise<Blob> {
    const c = this.opts.factory.create(size, size);
    const ctx = ctx2d(c);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(this.paint as unknown as CanvasImageSource, 0, 0, size, size);
    renderOutline(ctx, this.opts.page, size);
    return this.opts.factory.toPNG(c);
  }

  dispose(): void {
    this.disposed = true;
    this.active = null;
    this.mask = null;
    this.maskCache.clear();
    this.history.clear();
    for (const c of [this.paint, this.scratch, this.outline]) {
      c.width = 1;
      c.height = 1;
    }
  }
}
