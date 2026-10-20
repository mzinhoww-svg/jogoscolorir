/** Original, simple rounded icons (24×24, thick strokes). Decorative: always aria-hidden. */
export type IconName =
  | 'marker'
  | 'pencil'
  | 'brush'
  | 'bucket'
  | 'spray'
  | 'shine'
  | 'pattern'
  | 'undo'
  | 'redo'
  | 'trash'
  | 'check'
  | 'download'
  | 'back'
  | 'gallery'
  | 'lock'
  | 'soundOn'
  | 'soundOff'
  | 'play'
  | 'backspace'
  | 'sparkle';

const P: Record<IconName, JSX.Element> = {
  marker: (
    <>
      <path d="M14.5 4.5l5 5L10 19H5v-5z" />
      <path d="M12 7l5 5" />
      <path d="M5 19l-1.5 1.5" />
    </>
  ),
  pencil: (
    <>
      <path d="M16 3.5l4.5 4.5L8.5 20H4v-4.5z" />
      <path d="M4 15.5L8.5 20" />
      <path d="M13.5 6l4.5 4.5" />
    </>
  ),
  brush: (
    <>
      <path d="M20 4c-3 1.5-7 5.5-9 8.5l1.5 1.5c3-2 7-6 8.5-9z" />
      <path d="M10 13.5c-2.5 0-4 1.5-4 3.5 0 1.5-1 2.5-2.5 3 3.5 1 8 0 8-4.5" />
    </>
  ),
  bucket: (
    <>
      <path d="M4 10l7-7 8 8-7 7z" />
      <path d="M4 10h15" />
      <path d="M20 15c0 0 1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3z" />
    </>
  ),
  spray: (
    <>
      <rect x="6" y="9" width="8" height="12" rx="2.5" />
      <path d="M8 9V6h4v3" />
      <path d="M16 4.5h.01M19 3h.01M19 6.5h.01M21.5 4.5h.01M17.5 8.5h.01" />
    </>
  ),
  shine: (
    <>
      <path d="M12 3l2 5.5L19.5 10 14 12l-2 5.5L10 12 4.5 10 10 8.5z" />
      <path d="M19 16v4M17 18h4" />
    </>
  ),
  pattern: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M3.5 12h17M12 3.5v17" />
    </>
  ),
  undo: (
    <>
      <path d="M9 7L4.5 11.5 9 16" />
      <path d="M5 11.5h9a5 5 0 0 1 0 10h-2" />
    </>
  ),
  redo: (
    <>
      <path d="M15 7l4.5 4.5L15 16" />
      <path d="M19 11.5h-9a5 5 0 0 0 0 10h2" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10.5 11v5M13.5 11v5" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M5 19.5h14" />
    </>
  ),
  back: (
    <>
      <path d="M14.5 5L7.5 12l7 7" />
    </>
  ),
  gallery: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  soundOn: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5z" />,
  backspace: (
    <>
      <path d="M9 5.5h10.5a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3 12z" />
      <path d="M12 9.5l5 5M17 9.5l-5 5" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8z" />,
};

export function Icon(props: { name: IconName; size?: number; className?: string }) {
  const s = props.size ?? 28;
  return (
    <svg
      className={props.className}
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[props.name]}
    </svg>
  );
}
