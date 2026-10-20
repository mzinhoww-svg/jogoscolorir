import { useT } from '@/i18n';
import { useApp } from '@/ui/state/AppState';
import { navigate } from '@/ui/router';
import { BigButton } from '@/ui/components/BigButton';
import { Icon } from '@/ui/components/Icon';
import { TopBar } from '@/ui/components/TopBar';

function Logo() {
  return (
    <svg className="logo-art" viewBox="0 0 220 120" aria-hidden="true">
      <circle cx="60" cy="62" r="40" fill="#FFD43B" />
      <circle cx="112" cy="50" r="34" fill="#4DABF7" />
      <circle cx="158" cy="68" r="36" fill="#FF6B5A" />
      <circle cx="100" cy="88" r="26" fill="#38D9A9" />
      <path
        d="M30 96c30-24 64-30 92-14s56 10 72-12"
        fill="none"
        stroke="#2B2340"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M178 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#9775FA" />
    </svg>
  );
}

export function Home() {
  const { t } = useT();
  const { update } = useApp();
  return (
    <div className="screen home">
      <TopBar />
      <main className="home-main">
        <Logo />
        <h1 className="brand">{t('app.name')}</h1>
        <p className="tagline">{t('app.tagline')}</p>
        <BigButton
          testId="play"
          variant="primary"
          className="play-btn"
          icon="play"
          onClick={() => navigate('#/temas')}
        >
          {t('home.play')}
        </BigButton>
        {update && (
          <button
            type="button"
            data-testid="update-pill"
            className="update-pill"
            onClick={update.apply}
          >
            {t('update.pill')}
          </button>
        )}
        <BigButton testId="nav-gallery" icon="gallery" onClick={() => navigate('#/galeria')}>
          {t('home.gallery')}
        </BigButton>
      </main>
      <footer className="home-foot">
        <button
          type="button"
          data-testid="nav-parents"
          className="parents-link"
          onClick={() => navigate('#/pais')}
        >
          <Icon name="lock" size={22} />
          <span>{t('home.parents')}</span>
        </button>
      </footer>
    </div>
  );
}
