import type { ReactNode } from 'react';
import { useT } from '@/i18n';
import { useApp } from '@/ui/state/AppState';
import { IconButton } from './BigButton';

export function MuteButton() {
  const { muted, toggleMute } = useApp();
  const { t } = useT();
  return (
    <IconButton
      testId="mute"
      icon={muted ? 'soundOff' : 'soundOn'}
      label={muted ? t('paint.sound.on') : t('paint.sound.off')}
      aria-pressed={muted}
      onClick={toggleMute}
    />
  );
}

export function TopBar(props: {
  onBack?: () => void;
  title?: string;
  right?: ReactNode;
  mute?: boolean;
}) {
  const { t } = useT();
  return (
    <header className="topbar">
      {props.onBack && (
        <IconButton testId="back" icon="back" label={t('nav.back')} onClick={props.onBack} />
      )}
      {props.title && <h1 className="topbar-title">{props.title}</h1>}
      <div className="topbar-spacer" />
      {props.right}
      {props.mute !== false && <MuteButton />}
    </header>
  );
}
