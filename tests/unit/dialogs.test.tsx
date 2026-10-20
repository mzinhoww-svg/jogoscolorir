// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { ParentalGate } from '@/ui/components/ParentalGate';
import { I18nProvider } from '@/i18n';

afterEach(() => cleanup());

function Host() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button data-testid="opener" onClick={() => setOpen(true)}>
        open
      </button>
      {open && (
        <ConfirmDialog
          title="T"
          body="B"
          yes="Yes"
          no="No"
          onYes={() => setOpen(false)}
          onNo={() => setOpen(false)}
        />
      )}
    </>
  );
}

describe('ConfirmDialog focus management', () => {
  it('focuses into the dialog, traps Tab, cancels on Escape and restores focus', () => {
    render(<Host />);
    const opener = screen.getByTestId('opener');
    opener.focus();
    fireEvent.click(opener);
    const no = screen.getByTestId('confirm-no');
    const yes = screen.getByTestId('confirm-yes');
    expect(document.activeElement).toBe(no);
    // Tab from the last control wraps to the first; Shift+Tab from the first wraps to the last.
    yes.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(no);
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(yes);
    // Focus that escaped the dialog is pulled back in.
    opener.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(no);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('confirm-no')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

describe('ParentalGate focus management', () => {
  it('focuses the answer field, Escape cancels, focus returns to the opener', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const onCancel = vi.fn();
    const { unmount } = render(
      <I18nProvider lang="pt-BR" setLang={() => undefined}>
        <ParentalGate onPass={() => undefined} onCancel={onCancel} />
      </I18nProvider>,
    );
    expect(document.activeElement).toBe(screen.getByTestId('gate-input'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
