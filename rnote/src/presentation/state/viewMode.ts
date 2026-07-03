import { create } from 'zustand';

/**
 * Presentation-only reading surfaces for the document editor.
 *
 * - `focus`   — immersive writing: hides the sidebar, topbar and FAB so only
 *               the page remains. Still fully editable.
 * - `reading` — distraction-free reading: the editor becomes read-only with
 *               relaxed typography (larger type, looser leading).
 *
 * The two are independent and compose (focus + reading = immersive reading).
 * Kept out of `useWorkspace` because it is pure view state with no persistence
 * or domain meaning.
 */
interface ViewModeState {
  focus: boolean;
  reading: boolean;
  toggleFocus: () => void;
  toggleReading: () => void;
  /** Leave both surfaces (used by the Escape key and on navigating Home). */
  exit: () => void;
}

export const useViewMode = create<ViewModeState>((set) => ({
  focus: false,
  reading: false,
  toggleFocus: () => set((s) => ({ focus: !s.focus })),
  toggleReading: () => set((s) => ({ reading: !s.reading })),
  exit: () => set({ focus: false, reading: false }),
}));
