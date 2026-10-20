import type { AnyCanvas } from './canvasFactory';
import { mixHex } from './color';

export type PatternId =
  'stripes' | 'dots' | 'checks' | 'hearts' | 'stars' | 'waves' | 'zigzag' | 'scales';
export const PATTERNS: PatternId[] = [
  'stripes',
  'dots',
  'checks',
  'hearts',
  'stars',
  'waves',
  'zigzag',
  'scales',
];

export const PATTERN_TILE = 40;

type TileFactory = (w: number, h: number) => AnyCanvas;

function defaultTile(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined')
    return new OffscreenCanvas(w, h) as unknown as AnyCanvas;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function star(t: CanvasRenderingContext2D, cx: number, cy: number, ro: number, ri: number): void {
  t.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    t.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  t.closePath();
  t.fill();
}

function heart(t: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  t.beginPath();
  t.moveTo(cx, cy + s * 0.45);
  t.bezierCurveTo(cx - s * 0.9, cy - s * 0.1, cx - s * 0.45, cy - s * 0.8, cx, cy - s * 0.3);
  t.bezierCurveTo(cx + s * 0.45, cy - s * 0.8, cx + s * 0.9, cy - s * 0.1, cx, cy + s * 0.45);
  t.closePath();
  t.fill();
}

/** Draw one motif tile: pale tint background, motif in the colour. Tiles repeat seamlessly. */
export function drawTile(t: CanvasRenderingContext2D, id: PatternId, color: string): void {
  const S = PATTERN_TILE;
  t.clearRect(0, 0, S, S);
  t.fillStyle = mixHex(color, '#FFFFFF', 0.78);
  t.fillRect(0, 0, S, S);
  t.fillStyle = color;
  t.strokeStyle = color;
  t.lineCap = 'round';
  t.lineJoin = 'round';
  switch (id) {
    case 'stripes':
      t.lineWidth = 9;
      t.lineCap = 'butt';
      for (const o of [-S, 0, S]) {
        t.beginPath();
        t.moveTo(o - 2, S + 2);
        t.lineTo(o + S + 2, -2);
        t.stroke();
      }
      break;
    case 'dots':
      for (const [x, y] of [
        [10, 10],
        [30, 30],
      ] as const) {
        t.beginPath();
        t.arc(x, y, 6, 0, Math.PI * 2);
        t.fill();
      }
      break;
    case 'checks':
      t.fillRect(0, 0, S / 2, S / 2);
      t.fillRect(S / 2, S / 2, S / 2, S / 2);
      break;
    case 'hearts':
      heart(t, 11, 12, 15);
      heart(t, 31, 32, 15);
      break;
    case 'stars':
      star(t, 11, 12, 8, 3.5);
      star(t, 31, 31, 8, 3.5);
      break;
    case 'waves':
      t.lineWidth = 5;
      for (const y of [10, 30]) {
        t.beginPath();
        t.moveTo(0, y);
        t.bezierCurveTo(S * 0.25, y - 8, S * 0.25, y - 8, S / 2, y);
        t.bezierCurveTo(S * 0.75, y + 8, S * 0.75, y + 8, S, y);
        t.stroke();
      }
      break;
    case 'zigzag':
      t.lineWidth = 5;
      t.lineJoin = 'miter';
      for (const y of [12, 32]) {
        t.beginPath();
        t.moveTo(-2, y + 2);
        t.lineTo(S * 0.25, y - 6);
        t.lineTo(S * 0.5, y + 6);
        t.lineTo(S * 0.75, y - 6);
        t.lineTo(S + 2, y + 2);
        t.stroke();
      }
      break;
    case 'scales':
      t.lineWidth = 3.5;
      for (const [x, y] of [
        [0, 0],
        [S, 0],
        [S / 2, S / 2],
        [0, S],
        [S, S],
      ] as const) {
        t.beginPath();
        t.arc(x, y + S / 2, S / 2 - 2, Math.PI, Math.PI * 2);
        t.stroke();
      }
      break;
  }
}

/**
 * CanvasPattern for `id` in `color`. Patterns are anchored to the canvas origin, i.e. page
 * coordinates on the 1000² layers, so adjacent strokes line up.
 */
export function makePattern(
  ctx: CanvasRenderingContext2D,
  id: PatternId,
  color: string,
  createTile: TileFactory = defaultTile,
): CanvasPattern {
  const tile = createTile(PATTERN_TILE, PATTERN_TILE);
  drawTile(tile.getContext('2d') as CanvasRenderingContext2D, id, color);
  const p = ctx.createPattern(tile as unknown as CanvasImageSource, 'repeat');
  if (!p) throw new Error('createPattern failed');
  return p;
}
