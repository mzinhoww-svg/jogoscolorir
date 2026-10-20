import type { Pen, PageDef, ThemeId } from './types';

/** Pen that accumulates a single Path2D (works in browsers and @napi-rs/canvas). */
export class PathPen implements Pen {
  readonly path2d = new Path2D();

  circle(cx: number, cy: number, r: number): void {
    this.path2d.moveTo(cx + r, cy);
    this.path2d.arc(cx, cy, r, 0, Math.PI * 2);
    this.path2d.closePath();
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0): void {
    this.path2d.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
    this.path2d.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    this.path2d.closePath();
  }
  rect(x: number, y: number, w: number, h: number): void {
    this.poly(
      [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      true,
    );
  }
  roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const k = Math.min(r, w / 2, h / 2);
    const p = this.path2d;
    p.moveTo(x + k, y);
    p.lineTo(x + w - k, y);
    p.arcTo(x + w, y, x + w, y + k, k);
    p.lineTo(x + w, y + h - k);
    p.arcTo(x + w, y + h, x + w - k, y + h, k);
    p.lineTo(x + k, y + h);
    p.arcTo(x, y + h, x, y + h - k, k);
    p.lineTo(x, y + k);
    p.arcTo(x, y, x + k, y, k);
    p.closePath();
  }
  poly(pts: [number, number][], closed = true): void {
    if (pts.length === 0) return;
    this.path2d.moveTo(pts[0]![0], pts[0]![1]);
    for (let i = 1; i < pts.length; i++) this.path2d.lineTo(pts[i]![0], pts[i]![1]);
    if (closed) this.path2d.closePath();
  }
  star(cx: number, cy: number, rOuter: number, rInner: number, points: number): void {
    const pts: [number, number][] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const a = -Math.PI / 2 + (i * Math.PI) / points;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    this.poly(pts, true);
  }
  heart(cx: number, cy: number, size: number): void {
    const s = size / 2;
    const p = this.path2d;
    p.moveTo(cx, cy + s * 0.9);
    p.bezierCurveTo(cx - s * 1.6, cy - s * 0.1, cx - s * 0.9, cy - s * 1.1, cx, cy - s * 0.3);
    p.bezierCurveTo(cx + s * 0.9, cy - s * 1.1, cx + s * 1.6, cy - s * 0.1, cx, cy + s * 0.9);
    p.closePath();
  }
  path(d: string): void {
    this.path2d.addPath(new Path2D(d));
  }
  line(x1: number, y1: number, x2: number, y2: number): void {
    this.poly(
      [
        [x1, y1],
        [x2, y2],
      ],
      false,
    );
  }
}

export function page(themeId: ThemeId, index: number, draw: (p: Pen) => void): PageDef {
  const nn = String(index).padStart(2, '0');
  return { id: `${themeId}-${nn}`, themeId, index, nameKey: `page.${themeId}-${nn}`, draw };
}
