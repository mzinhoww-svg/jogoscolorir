import { describe, it, expect } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { buildRegionMap, regionAt, regionMask } from '@/engine/regions';

function ring(): { rgba: Uint8ClampedArray; w: number; h: number } {
  const w = 200;
  const h = 200;
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.strokeStyle = '#2B2340';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(100, 100, 40, 0, Math.PI * 2);
  ctx.stroke();
  return { rgba: new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data), w, h };
}

describe('regions', () => {
  const { rgba, w, h } = ring();
  const map = buildRegionMap(rgba, w, h);

  it('ring yields 3 regions (outside, ring, hole)', () => {
    expect(map.count).toBe(3);
    expect(map.areas.length).toBe(4);
    const outside = regionAt(map, 2, 2);
    const band = regionAt(map, 100, 100 - 60);
    const hole = regionAt(map, 100, 100);
    expect(new Set([outside, band, hole]).size).toBe(3);
    expect([outside, band, hole].every((l) => l >= 1)).toBe(true);
  });

  it('areas sum to total pixels', () => {
    let sum = 0;
    for (const a of map.areas) sum += a;
    expect(sum).toBe(w * h);
  });

  it('filling the ring mask does not touch the hole or outside', () => {
    const band = regionAt(map, 100, 40);
    const hole = regionAt(map, 100, 100);
    const outside = regionAt(map, 2, 2);
    const mask = regionMask(map, band);
    for (let i = 0; i < w * h; i++) {
      if (map.labels[i] === hole || map.labels[i] === outside) expect(mask[i]).toBe(0);
      if (map.labels[i] === band) expect(mask[i]).toBe(1);
    }
  });

  it('regionAt on a line returns a neighbouring region', () => {
    // outer circle line at x=20 (r=80 around 100)
    let lx = -1;
    for (let x = 0; x < 100; x++)
      if (map.labels[100 * w + x] === 0) {
        lx = x;
        break;
      }
    expect(lx).toBeGreaterThan(0);
    const l = regionAt(map, lx + 0.5, 100.5);
    expect(l).toBeGreaterThan(0);
  });

  it('regionAt returns 0 when nothing within radius', () => {
    const rg = new Uint8ClampedArray(30 * 30 * 4);
    for (let i = 3; i < rg.length; i += 4) rg[i] = 255; // all line
    const m = buildRegionMap(rg, 30, 30);
    expect(m.count).toBe(0);
    expect(regionAt(m, 15, 15)).toBe(0);
  });

  it('dilation covers exactly +2 px into line pixels, never other regions', () => {
    const base = regionMask(map, regionAt(map, 100, 100), 0);
    const mask = regionMask(map, regionAt(map, 100, 100), 2);
    let extra = 0;
    for (let i = 0; i < w * h; i++) {
      if (base[i]) expect(mask[i]).toBe(1);
      else if (mask[i]) {
        extra++;
        expect(map.labels[i]).toBe(0);
      }
    }
    expect(extra).toBeGreaterThan(0);
    // pixel on row 100 just beyond the hole edge: 1px out and 2px out covered, 3px out not
    let edge = 100;
    while (base[100 * w + edge]) edge++;
    expect(mask[100 * w + edge]).toBe(1);
    expect(mask[100 * w + edge + 1]).toBe(1);
    expect(mask[100 * w + edge + 2]).toBe(0);
  });
});
