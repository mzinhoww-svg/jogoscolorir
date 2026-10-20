// Renders a contact sheet of a theme's pages (outline + region tint) to artifacts/sheets/<theme>.png
// Usage: npx tsx scripts/sheet.ts <themeId>
import { createCanvas, Path2D as NapiPath2D } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
(globalThis as unknown as { Path2D: unknown }).Path2D ??= NapiPath2D;

const themeId = process.argv[2];
const { THEMES, renderOutline, rasterizeOutline } = await import('../src/catalog/index');
const { buildRegionMap } = await import('../src/engine/regions');
const theme = THEMES.find((t) => t.id === themeId);
if (!theme) throw new Error(`unknown theme ${themeId}`);
const cell = 300;
const cols = 5;
const rows = Math.ceil(theme.pages.length / cols) || 1;
const sheet = createCanvas(cols * cell, rows * (cell + 24));
const sctx = sheet.getContext('2d');
sctx.fillStyle = '#fff';
sctx.fillRect(0, 0, sheet.width, sheet.height);
theme.pages.forEach((page, i) => {
  const rgba = rasterizeOutline(page, cell, (w, h) => createCanvas(w, h));
  const map = buildRegionMap(rgba, cell, cell);
  const tint = createCanvas(cell, cell);
  const tctx = tint.getContext('2d');
  const img = tctx.createImageData(cell, cell);
  for (let p = 0; p < cell * cell; p++) {
    const l = map.labels[p]!;
    if (l === 0) continue;
    const h = (l * 137) % 360;
    const [r, g, b] = hsl(h, 0.6, 0.85);
    img.data[p * 4] = r; img.data[p * 4 + 1] = g; img.data[p * 4 + 2] = b; img.data[p * 4 + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  renderOutline(tctx as unknown as CanvasRenderingContext2D, page, cell);
  const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 24);
  sctx.drawImage(tint, x, y);
  sctx.fillStyle = '#000';
  sctx.font = '14px sans-serif';
  sctx.fillText(`${page.id}  regions:${map.count}`, x + 6, y + cell + 16);
});
mkdirSync('artifacts/sheets', { recursive: true });
writeFileSync(`artifacts/sheets/${themeId}.png`, sheet.toBuffer('image/png'));
console.log(`wrote artifacts/sheets/${themeId}.png (${theme.pages.length} pages)`);

function hsl(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
