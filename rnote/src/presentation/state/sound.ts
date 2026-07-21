import { create } from 'zustand';

/**
 * Whether the optional Odysseus ambient soundscape is enabled. Off by default;
 * persisted locally. Actually starting/stopping audio is wired in AppShell,
 * gated on both this flag and the Odysseus skin.
 */
const SOUND_KEY = 'rnote.sound';

interface SoundState {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
}

export const useSound = create<SoundState>((set, get) => ({
  enabled: (() => {
    try {
      return localStorage.getItem(SOUND_KEY) === '1';
    } catch {
      return false;
    }
  })(),
  setEnabled: (value) => {
    try {
      localStorage.setItem(SOUND_KEY, value ? '1' : '0');
    } catch {
      /* private mode — session only */
    }
    set({ enabled: value });
  },
  toggle: () => get().setEnabled(!get().enabled),
}));
