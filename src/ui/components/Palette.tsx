import { useEffect, useRef } from 'react';
import { COLORS, SHINES, type ToolId } from '@/engine/tools';
import { makePattern, PATTERNS, type PatternId } from '@/engine/patterns';
import { useT } from '@/i18n';

function PatternSwatch(props: { id: PatternId; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = makePattern(ctx, props.id, props.color);
    ctx.fillRect(0, 0, c.width, c.height);
  }, [props.id, props.color]);
  return <canvas ref={ref} width={80} height={80} className="swatch-canvas" aria-hidden="true" />;
}

export function Palette(props: {
  tool: ToolId;
  color: string;
  shine: string;
  pattern: PatternId;
  onColor: (c: string) => void;
  onShine: (s: string) => void;
  onPattern: (p: PatternId) => void;
}) {
  const { t } = useT();
  return (
    <div className="palette" role="group" aria-label={t('paint.palette')}>
      {props.tool === 'shine'
        ? SHINES.map((s) => (
            <button
              key={s.id}
              type="button"
              data-testid={`shine-${s.id}`}
              className={`swatch${props.shine === s.id ? ' active' : ''}`}
              aria-pressed={props.shine === s.id}
              aria-label={t(`shine.${s.id}`)}
              title={t(`shine.${s.id}`)}
              style={{ background: `linear-gradient(135deg, ${s.stops.join(', ')})` }}
              onClick={() => props.onShine(s.id)}
            />
          ))
        : props.tool === 'pattern'
          ? PATTERNS.map((p) => (
              <button
                key={p}
                type="button"
                data-testid={`pattern-${p}`}
                className={`swatch${props.pattern === p ? ' active' : ''}`}
                aria-pressed={props.pattern === p}
                aria-label={t(`pattern.${p}`)}
                title={t(`pattern.${p}`)}
                onClick={() => props.onPattern(p)}
              >
                <PatternSwatch id={p} color={props.color} />
              </button>
            ))
          : null}
      {props.tool === 'pattern' && <div className="palette-sep" aria-hidden="true" />}
      {props.tool !== 'shine' &&
        COLORS.map((c, i) => (
          <button
            key={c}
            type="button"
            data-testid={`color-${i}`}
            className={`swatch${props.color === c ? ' active' : ''}`}
            aria-pressed={props.color === c}
            aria-label={t('a11y.color', { name: t(`color.${i}`) })}
            title={t(`color.${i}`)}
            style={{ background: c }}
            onClick={() => props.onColor(c)}
          />
        ))}
    </div>
  );
}
