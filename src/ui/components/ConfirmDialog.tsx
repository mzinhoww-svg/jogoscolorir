import { useRef } from 'react';
import { useDialogFocus } from './useDialogFocus';

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
  const dlgRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dlgRef, { onEscape: props.onNo, trap: true, initial: noRef });
  return (
    <div className="overlay" role="presentation">
      <div
        ref={dlgRef}
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
