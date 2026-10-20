export interface RegionMap {
  width: number;
  height: number;
  /** 0 = line pixel; 1..count = region labels */
  labels: Int32Array;
  count: number;
  /** areas[label] = pixel count; areas[0] = line pixels */
  areas: Uint32Array;
}

export function buildRegionMap(rgba: Uint8ClampedArray, w: number, h: number): RegionMap {
  const n = w * h;
  const labels = new Int32Array(n);
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (rgba[i * 4 + 3]! >= 128) seen[i] = 2; // line
  const queue = new Int32Array(n);
  const areaList: number[] = [0];
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    count++;
    let head = 0;
    let tail = 0;
    queue[tail++] = s;
    seen[s] = 1;
    labels[s] = count;
    while (head < tail) {
      const p = queue[head++]!;
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0 && !seen[p - 1]) {
        seen[p - 1] = 1;
        labels[p - 1] = count;
        queue[tail++] = p - 1;
      }
      if (x < w - 1 && !seen[p + 1]) {
        seen[p + 1] = 1;
        labels[p + 1] = count;
        queue[tail++] = p + 1;
      }
      if (y > 0 && !seen[p - w]) {
        seen[p - w] = 1;
        labels[p - w] = count;
        queue[tail++] = p - w;
      }
      if (y < h - 1 && !seen[p + w]) {
        seen[p + w] = 1;
        labels[p + w] = count;
        queue[tail++] = p + w;
      }
    }
    areaList.push(tail);
  }
  const areas = new Uint32Array(count + 1);
  let lines = 0;
  for (let i = 0; i < n; i++) if (seen[i] === 2) lines++;
  areas[0] = lines;
  for (let k = 1; k <= count; k++) areas[k] = areaList[k]!;
  return { width: w, height: h, labels, count, areas };
}

/** Region under (x,y) (logical floats); nearest region within searchRadius if on a line; 0 if none. */
export function regionAt(map: RegionMap, x: number, y: number, searchRadius = 12): number {
  const { width: w, height: h, labels } = map;
  const px = Math.min(w - 1, Math.max(0, Math.floor(x)));
  const py = Math.min(h - 1, Math.max(0, Math.floor(y)));
  const direct = labels[py * w + px]!;
  if (direct !== 0) return direct;
  let best = 0;
  let bestD = Infinity;
  const r = Math.ceil(searchRadius);
  for (let dy = -r; dy <= r; dy++) {
    const yy = py + dy;
    if (yy < 0 || yy >= h) continue;
    for (let dx = -r; dx <= r; dx++) {
      const xx = px + dx;
      if (xx < 0 || xx >= w) continue;
      const d = dx * dx + dy * dy;
      if (d > searchRadius * searchRadius || d >= bestD) continue;
      const l = labels[yy * w + xx]!;
      if (l !== 0) {
        best = l;
        bestD = d;
      }
    }
  }
  return best;
}

/** 1 inside region; dilated by `dilate` px, expanding only into line pixels (label 0). */
export function regionMask(map: RegionMap, label: number, dilate = 2): Uint8Array {
  const { width: w, height: h, labels } = map;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) if (labels[i] === label) mask[i] = 1;
  for (let step = 0; step < dilate; step++) {
    const add: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (mask[p] || labels[p] !== 0) continue;
        if (
          (x > 0 && mask[p - 1]) ||
          (x < w - 1 && mask[p + 1]) ||
          (y > 0 && mask[p - w]) ||
          (y < h - 1 && mask[p + w])
        )
          add.push(p);
      }
    }
    for (const p of add) mask[p] = 1;
  }
  return mask;
}
