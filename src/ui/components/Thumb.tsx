import { useEffect, useMemo, useRef } from 'react';
import type { PageDef } from '@/catalog';
import { renderOutline } from '@/catalog';

const THUMB_PX = 256;
/** Outline thumbnails, rendered once per page and kept for the app's lifetime. */
const outlineCache = new Map<string, HTMLCanvasElement>();

function outlineThumb(page: PageDef): HTMLCanvasElement | null {
  const hit = outlineCache.get(page.id);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = THUMB_PX;
  c.height = THUMB_PX;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, THUMB_PX, THUMB_PX);
  renderOutline(ctx, page, THUMB_PX);
  outlineCache.set(page.id, c);
  return c;
}

/** Thumbnail: the saved artwork thumb if given, else the cached outline. */
export function Thumb(props: { page: PageDef; blob?: Blob | null; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { blob, page } = props;
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  useEffect(() => {
    if (blob) return;
    const c = ref.current;
    const src = outlineThumb(page);
    const ctx = c?.getContext('2d');
    if (!c || !src || !ctx) return;
    ctx.drawImage(src, 0, 0, c.width, c.height);
  }, [page, blob]);

  if (blob && url) return <img className="thumb" src={url} alt={props.label} draggable={false} />;
  return (
    <canvas
      ref={ref}
      className="thumb"
      width={THUMB_PX}
      height={THUMB_PX}
      role="img"
      aria-label={props.label}
    />
  );
}
