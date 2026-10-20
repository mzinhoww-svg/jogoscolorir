import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { loadPrefs, savePrefs, type Prefs } from '@/persistence/prefs';
import { audio } from '@/audio/audio';

export type ToastKind = 'info' | 'error';
export interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}
export interface PwaUpdate {
  apply: () => void;
}

export interface AppStateValue {
  prefs: Prefs;
  updatePrefs: (p: Partial<Prefs>) => void;
  muted: boolean;
  toggleMute: () => void;
  toast: ToastMsg | null;
  showToast: (text: string, kind?: ToastKind) => void;
  dismissToast: () => void;
  /** PWA update slot (wired by Task 8); null = nothing to show. */
  update: PwaUpdate | null;
  setUpdate: (u: PwaUpdate | null) => void;
}

const Ctx = createContext<AppStateValue | null>(null);

export function initialPrefs(): Prefs {
  const p = loadPrefs();
  audio.setVolumes(p);
  return p;
}

export function AppStateProvider(props: { initial: Prefs; children?: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(props.initial);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [update, setUpdate] = useState<PwaUpdate | null>(null);
  const toastId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      audio.setVolumes(next);
      return next;
    });
  }, []);

  const muted = !prefs.music && !prefs.sfx;
  const toggleMute = useCallback(() => {
    setPrefs((prev) => {
      const isMuted = !prev.music && !prev.sfx;
      const next = { ...prev, music: isMuted, sfx: isMuted };
      savePrefs(next);
      audio.setVolumes(next);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((text: string, kind: ToastKind = 'info') => {
    clearTimeout(timer.current);
    setToast({ id: ++toastId.current, text, kind });
    timer.current = setTimeout(() => setToast(null), kind === 'error' ? 7000 : 3500);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      prefs,
      updatePrefs,
      muted,
      toggleMute,
      toast,
      showToast,
      dismissToast,
      update,
      setUpdate,
    }),
    [prefs, updatePrefs, muted, toggleMute, toast, showToast, dismissToast, update],
  );
  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}

export function useApp(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppStateProvider>');
  return v;
}
