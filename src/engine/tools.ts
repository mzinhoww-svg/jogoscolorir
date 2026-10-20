import { mixHex, rgba } from './color';
import { makePattern, type PatternId } from './patterns';

export type ToolId = 'marker' | 'pencil' | 'brush' | 'bucket' | 'spray' | 'shine' | 'pattern';
export type Size = 's' | 'm' | 'l';

export const TOOLS: ToolId[] = ['marker', 'pencil', 'brush', 'bucket', 'spray', 'shine', 'pattern'];
export const TOOL_SIZES: Record<Size, number> = { s: 14, m: 28, l: 48 };
const WIDTH_MULT: Record<ToolId, number> = {
  marker: 1,
  pencil: 0.45,
  brush: 1.2,
  bucket: 1,
  spray: 1.6,
  shine: 1,
  pattern: 1,
};

export function toolWidth(tool: ToolId, size: Size): number {
  return TOOL_SIZES[size] * WIDTH_MULT[tool];
}

/** 24 kid-friendly colours. */
export const COLORS: string[] = [
  '#2B2340',
  '#FFFFFF',
  '#8A8FA3',
  '#C9CDD8',
  '#E8423F',
  '#FF7A8A',
  '#FF9F43',
  '#FFD43B',
  '#FFF3A3',
  '#A9E34B',
  '#2F9E44',
  '#38D9A9',
  '#66D9EF',
  '#3A7BE0',
  '#1C3D8C',
  '#9775FA',
  '#6A3FB5',
  '#F06BD6',
  '#8B5A2B',
  '#5C3A1E',
  '#C68B59',
  '#F6D7B8',
  '#E0AC82',
  '#8D5524',
];

export interface Shine {
  id: string;
  stops: string[];
}
export const SHINES: Shine[] = [
  { id: 'gold', stops: ['#8A5A00', '#FFD43B', '#FFF6C2', '#E0A100', '#8A5A00'] },
  { id: 'silver', stops: ['#6E7380', '#E9ECF2', '#FFFFFF', '#AEB4C0', '#6E7380'] },
  { id: 'rainbow', stops: ['#E8423F', '#FF9F43', '#FFD43B', '#2F9E44', '#3A7BE0', '#9775FA'] },
  { id: 'pink', stops: ['#B83280', '#FF8CC6', '#FFE3F1', '#F06BD6', '#B83280'] },
  { id: 'ice', stops: ['#1C6FA8', '#8FD3FF', '#F0FBFF', '#66D9EF', '#1C6FA8'] },
  { id: 'emerald', stops: ['#0B6B3A', '#38D9A9', '#D3FFEF', '#2F9E44', '#0B6B3A'] },
];

export interface Brush {
  tool: ToolId;
  color: string;
  shine: string;
  pattern: PatternId;
  size: Size;
}

/** p = pen pressure 0..1, or a negative value when pressure is unknown (mouse/touch). */
export interface StrokePoint {
  x: number;
  y: number;
  p: number;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StampOptions {
  /** Pre-built pattern for the pattern tool (anchored at the canvas origin). */
  pattern?: CanvasPattern;
}

function walk(
  from: StrokePoint,
  to: StrokePoint,
  step: number,
  fn: (x: number, y: number, t: number) => void,
): void {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  const n = Math.max(1, Math.ceil(d / Math.max(0.5, step)));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    fn(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, t);
  }
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const k = s * 0.22;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + k, y - k, x + s, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + s);
  ctx.quadraticCurveTo(x - k, y + k, x - s, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - s);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws one stroke segment for `brush` onto ctx (the scratch layer, page coordinates).
 * A segment with from === to is a dot. Deterministic for a given rng sequence.
 */
export function stampSegment(
  ctx: CanvasRenderingContext2D,
  brush: Brush,
  from: StrokePoint,
  to: StrokePoint,
  rng: () => number,
  opts: StampOptions = {},
): void {
  const w = toolWidth(brush.tool, brush.size);
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  switch (brush.tool) {
    case 'marker':
    case 'pattern': {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = w;
      ctx.strokeStyle =
        brush.tool === 'pattern'
          ? (opts.pattern ?? makePattern(ctx, brush.pattern, brush.color))
          : brush.color;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x + (dist === 0 ? 0.01 : 0), to.y);
      ctx.stroke();
      break;
    }
    case 'pencil': {
      const pr = to.p >= 0 ? 0.4 + to.p * 0.8 : 1;
      const r = (w / 2) * Math.min(1.2, pr);
      walk(from, to, 1.5, (x, y) => {
        const dots = Math.ceil(r * 0.9);
        for (let i = 0; i < dots; i++) {
          const a = rng() * Math.PI * 2;
          const rr = Math.sqrt(rng()) * r;
          const s = 0.7 + rng() * 0.9;
          ctx.globalAlpha = (0.35 + rng() * 0.45) * (to.p >= 0 ? Math.min(1, 0.5 + to.p) : 1);
          ctx.fillStyle = brush.color;
          ctx.fillRect(x + Math.cos(a) * rr - s / 2, y + Math.sin(a) * rr - s / 2, s, s);
        }
      });
      break;
    }
    case 'brush': {
      const mod = to.p >= 0 ? 0.4 + to.p * 0.9 : Math.max(0.6, Math.min(1.2, 1.25 - dist / 60));
      const r = (w / 2) * mod;
      walk(from, to, r * 0.3, (x, y) => {
        const j = (rng() - 0.5) * 0.16;
        const c = j >= 0 ? mixHex(brush.color, '#FFFFFF', j) : mixHex(brush.color, '#000000', -j);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(c, 0.35));
        g.addColorStop(0.6, rgba(c, 0.22));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'spray': {
      const r = w / 2;
      const n = Math.ceil(dist * 0.9) + 8;
      ctx.fillStyle = brush.color;
      for (let i = 0; i < n; i++) {
        const t = rng();
        const cx = from.x + (to.x - from.x) * t;
        const cy = from.y + (to.y - from.y) * t;
        const a = rng() * Math.PI * 2;
        const rr = Math.sqrt(rng()) * r;
        const s = 1 + rng() * 1.5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'shine': {
      const shine = SHINES.find((s) => s.id === brush.shine) ?? SHINES[0]!;
      const r = w / 2;
      walk(from, to, r * 0.5, (x, y) => {
        const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
        shine.stops.forEach((c, i) => g.addColorStop(i / (shine.stops.length - 1), c));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        if (rng() < 0.35) {
          ctx.fillStyle = '#FFFFFF';
          const a = rng() * Math.PI * 2;
          const rr = rng() * r;
          sparkle(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 3 + rng() * 6);
        }
      });
      break;
    }
    case 'bucket':
      break;
  }
  ctx.restore();
}
