import { useApp } from '@/ui/state/AppState';
import { useT } from '@/i18n';

export function Toast() {
  const { toast, dismissToast } = useApp();
  const { t } = useT();
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.kind}`}>
          <span>{toast.text}</span>
          <button
            type="button"
            className="toast-close"
            aria-label={t('nav.close')}
            onClick={dismissToast}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
