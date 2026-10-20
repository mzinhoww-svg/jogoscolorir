import { TOOLS, type Size, type ToolId } from '@/engine/tools';
import { useT } from '@/i18n';
import { Icon } from './Icon';

const SIZES: Size[] = ['s', 'm', 'l'];

export function Toolbar(props: {
  tool: ToolId;
  size: Size;
  onTool: (t: ToolId) => void;
  onSize: (s: Size) => void;
}) {
  const { t } = useT();
  return (
    <div className="toolbar" role="toolbar" aria-label={t('paint.toolbar')}>
      <div className="tool-group">
        {TOOLS.map((id) => (
          <button
            key={id}
            type="button"
            data-testid={`tool-${id}`}
            className={`tool-btn${props.tool === id ? ' active' : ''}`}
            aria-pressed={props.tool === id}
            aria-label={t(`tool.${id}`)}
            title={t(`tool.${id}`)}
            onClick={() => props.onTool(id)}
          >
            <Icon name={id} size={30} />
          </button>
        ))}
      </div>
      {props.tool !== 'bucket' && (
        <div className="size-group" role="group" aria-label={t('paint.size')}>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`size-${s}`}
              className={`size-btn${props.size === s ? ' active' : ''}`}
              aria-pressed={props.size === s}
              aria-label={t(`paint.size.${s}`)}
              title={t(`paint.size.${s}`)}
              onClick={() => props.onSize(s)}
            >
              <span className={`size-dot size-dot-${s}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
