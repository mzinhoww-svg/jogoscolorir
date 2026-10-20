import { useEffect, useRef } from 'react';

export function ConfirmDialog(props: {
  title: string;
  body: string;
  yes: string;
  no: string;
  danger?: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  const noRef = useRef<HTMLButtonElement>(null);
  const { onNo } = props;
  useEffect(() => {
    noRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onNo();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onNo]);
  return (
    <div className="overlay" role="presentation">
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-t"
        aria-describedby="dlg-b"
      >
        <h2 id="dlg-t">{props.title}</h2>
        <p id="dlg-b">{props.body}</p>
        <div className="dialog-actions">
          <button
            type="button"
            ref={noRef}
            data-testid="confirm-no"
            className="btn btn-secondary"
            onClick={props.onNo}
          >
            <span className="btn-label">{props.no}</span>
          </button>
          <button
            type="button"
            data-testid="confirm-yes"
            className={`btn ${props.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={props.onYes}
          >
            <span className="btn-label">{props.yes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
