import { useState } from 'react';
import { LANGS, useT } from '@/i18n';
import { deleteAll } from '@/persistence/artworks';
import { navigate } from '@/ui/router';
import { useApp } from '@/ui/state/AppState';
import { BigButton } from '@/ui/components/BigButton';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { ParentalGate } from '@/ui/components/ParentalGate';
import { TopBar } from '@/ui/components/TopBar';

function Toggle(props: {
  testId: string;
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  const { t } = useT();
  return (
    <label className="setting-row">
      <span>{props.label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={props.on}
        data-testid={props.testId}
        className={`switch${props.on ? ' on' : ''}`}
        onClick={() => props.onChange(!props.on)}
      >
        <span className="switch-knob" />
        <span className="switch-text">{props.on ? t('settings.on') : t('settings.off')}</span>
      </button>
    </label>
  );
}

function ParentsArea() {
  const { t } = useT();
  const { prefs, updatePrefs, showToast, update } = useApp();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const wipe = async () => {
    setStep(0);
    const r = await deleteAll();
    showToast(r.ok ? t('deleteAll.done') : t('deleteAll.failed'), r.ok ? 'info' : 'error');
  };

  return (
    <main className="parents">
      <section className="card panel">
        <h2>{t('settings.language')}</h2>
        <div className="lang-row" role="group" aria-label={t('a11y.langPicker')}>
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              data-testid={`lang-${l}`}
              lang={l}
              aria-pressed={prefs.lang === l}
              className={`chip${prefs.lang === l ? ' active' : ''}`}
              onClick={() => updatePrefs({ lang: l })}
            >
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="card panel">
        <h2>{t('settings.title')}</h2>
        <Toggle
          testId="toggle-music"
          label={t('settings.music')}
          on={prefs.music}
          onChange={(v) => updatePrefs({ music: v })}
        />
        <Toggle
          testId="toggle-sfx"
          label={t('settings.sfx')}
          on={prefs.sfx}
          onChange={(v) => updatePrefs({ sfx: v })}
        />
        <label className="setting-row">
          <span>{t('settings.volume')}</span>
          <input
            type="range"
            data-testid="volume"
            min={0}
            max={100}
            step={5}
            value={Math.round(prefs.volume * 100)}
            aria-label={t('settings.volume')}
            onChange={(e) => updatePrefs({ volume: Number(e.target.value) / 100 })}
          />
        </label>
      </section>

      {update && (
        <section className="card panel">
          <p>{t('update.available')}</p>
          <BigButton testId="update-apply" variant="primary" onClick={update.apply}>
            {t('update.apply')}
          </BigButton>
        </section>
      )}

      <section className="card panel">
        <h2>{t('storage.title')}</h2>
        <p>{t('storage.body')}</p>
        <BigButton testId="delete-all" variant="danger" icon="trash" onClick={() => setStep(1)}>
          {t('deleteAll.button')}
        </BigButton>
      </section>

      <section className="card panel">
        <h2>{t('credits.title')}</h2>
        <p>{t('credits.body')}</p>
      </section>

      {step === 1 && (
        <ConfirmDialog
          title={t('deleteAll.confirm1.title')}
          body={t('deleteAll.confirm1.body')}
          yes={t('deleteAll.continue')}
          no={t('common.cancel')}
          danger
          onYes={() => setStep(2)}
          onNo={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <ConfirmDialog
          title={t('deleteAll.confirm2.title')}
          body={t('deleteAll.confirm2.body')}
          yes={t('deleteAll.confirm')}
          no={t('common.cancel')}
          danger
          onYes={() => void wipe()}
          onNo={() => setStep(0)}
        />
      )}
    </main>
  );
}

/** #/pais — the gate is shown on every entry (state is local to this mount). */
export function Parents() {
  const { t } = useT();
  const [passed, setPassed] = useState(false);
  return (
    <div className="screen">
      <TopBar
        onBack={() => navigate('#/')}
        title={passed ? t('parents.title') : undefined}
        mute={false}
      />
      {passed ? (
        <ParentsArea />
      ) : (
        <main className="gate-wrap">
          <ParentalGate onPass={() => setPassed(true)} onCancel={() => navigate('#/')} />
        </main>
      )}
    </div>
  );
}
