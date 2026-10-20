import { useEffect, useRef, useState } from 'react';
import { useDialogFocus } from './useDialogFocus';
import { useT } from '@/i18n';
import { createGate } from '@/ui/parentalGate';
import { Icon } from './Icon';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/** Arithmetic gate; calls onPass once answered correctly. */
export function ParentalGate(props: { onPass: () => void; onCancel: () => void }) {
  const { t } = useT();
  const [gate] = useState(createGate);
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // In-page gate (not modal): focus the answer field, Escape cancels, focus returns on close.
  useDialogFocus(sectionRef, { onEscape: props.onCancel, trap: false, initial: inputRef });
  const [challenge, setChallenge] = useState(gate.challenge);
  const [input, setInput] = useState('');
  const [error, setError] = useState<'wrong' | 'locked' | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (error !== 'locked') return;
    const tick = () => {
      const ms = gate.remainingMs();
      setRemaining(Math.ceil(ms / 1000));
      if (ms <= 0) setError(null);
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [error, gate]);

  const locked = error === 'locked';
  const press = (n: number) => {
    if (locked) return;
    setInput((v) => (v.length >= 2 ? v : v + String(n)));
  };
  const submit = () => {
    if (locked || input === '') return;
    const r = gate.submit(input);
    setInput('');
    setChallenge(gate.challenge);
    if (r === 'ok') props.onPass();
    else {
      setRemaining(Math.ceil(gate.remainingMs() / 1000));
      setError(r);
    }
  };

  const words = {
    a: t(`num.${challenge.a}`),
    b: t(`num.${challenge.b}`),
  };

  return (
    <section ref={sectionRef} className="gate card" aria-labelledby="gate-title">
      <div className="gate-head">
        <Icon name="lock" size={34} />
        <h1 id="gate-title">{t('gate.title')}</h1>
      </div>
      <p className="gate-prompt">{t('gate.prompt', words)}</p>
      <form
        className="gate-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          data-testid="gate-input"
          className="gate-input"
          inputMode="numeric"
          autoComplete="off"
          aria-label={t('gate.answer')}
          value={input}
          disabled={locked}
          maxLength={2}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
        />
        <div className="keypad" role="group" aria-label={t('a11y.keypad')}>
          {KEYS.map((n) => (
            <button
              key={n}
              type="button"
              data-testid={`gate-key-${n}`}
              className="key"
              disabled={locked}
              aria-label={t('a11y.digit', { n })}
              onClick={() => press(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="key key-del"
            disabled={locked}
            aria-label={t('gate.delete')}
            onClick={() => setInput((v) => v.slice(0, -1))}
          >
            <Icon name="backspace" />
          </button>
        </div>
        {error && (
          <p data-testid="gate-error" className="gate-error" role="alert">
            {locked ? t('gate.wait', { s: remaining }) : t('gate.wrong')}
          </p>
        )}
        <div className="gate-actions">
          <button type="button" className="btn btn-secondary" onClick={props.onCancel}>
            <span className="btn-label">{t('common.cancel')}</span>
          </button>
          <button
            type="submit"
            data-testid="gate-submit"
            className="btn btn-primary"
            disabled={locked || input === ''}
          >
            <span className="btn-label">{t('gate.submit')}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
