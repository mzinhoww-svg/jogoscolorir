import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog focus management: moves focus into the container on open, calls onEscape on Escape,
 * optionally keeps Tab inside the container, and returns focus to the opener on close.
 */
export function useDialogFocus(
  container: RefObject<HTMLElement | null>,
  opts: { onEscape: () => void; trap: boolean; initial?: RefObject<HTMLElement | null> },
): void {
  const escape = useRef(opts.onEscape);
  useEffect(() => {
    escape.current = opts.onEscape;
  });
  const { trap, initial } = opts;
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = container.current;
    (initial?.current ?? root?.querySelector<HTMLElement>(FOCUSABLE) ?? root)?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        escape.current();
        return;
      }
      if (e.key !== 'Tab' || !trap || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      if (opener && opener.isConnected) opener.focus();
    };
  }, [container, trap, initial]);
}
