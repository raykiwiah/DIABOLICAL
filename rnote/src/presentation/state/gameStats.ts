import { create } from 'zustand';
import {
  levelForXp,
  evaluateAchievements,
  achievementById,
  dayKey,
  nextStreak,
  type StatsSnapshot,
} from '../gamification/leveling';

/**
 * Local, private gamification progress. Accrues identically in both modes —
 * only the *presentation* differs (celebratory in Gen Z, calm/minimal in
 * Millennial). Persisted to localStorage; never leaves the device.
 */
const KEY = 'rnote.gameStats.v1';

export interface Celebration {
  kind: 'level' | 'achievement';
  icon: string;
  title: string;
  subtitle: string;
}

interface Persisted {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  pages: number;
  captures: number;
  achievements: string[];
}

interface GameStatsState extends Persisted {
  celebration: Celebration | null;
  /** Register a visit for today — advances (or resets) the daily streak. */
  checkIn: () => void;
  /** Record a rewarded action; awards XP and may unlock achievements. */
  recordAction: (action: 'page' | 'capture' | 'template') => void;
  dismissCelebration: () => void;
}

const EMPTY: Persisted = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  pages: 0,
  captures: 0,
  achievements: [],
};

const XP_AWARDS = { page: 10, template: 12, capture: 5, checkIn: 15 } as const;

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      ...EMPTY,
      ...parsed,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    };
  } catch {
    return EMPTY;
  }
}

function save(p: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* localStorage unavailable — progress simply won't persist this session. */
  }
}

function persistedOf(s: GameStatsState): Persisted {
  return {
    xp: s.xp,
    streak: s.streak,
    bestStreak: s.bestStreak,
    lastActiveDay: s.lastActiveDay,
    pages: s.pages,
    captures: s.captures,
    achievements: s.achievements,
  };
}

function snapshotOf(p: Persisted): StatsSnapshot {
  return { xp: p.xp, level: levelForXp(p.xp), streak: p.streak, pages: p.pages, captures: p.captures };
}

/** Apply a change + XP gain, persist, and derive any celebration to show. */
function commit(
  prev: Persisted,
  patch: Partial<Persisted>,
  xpGain: number,
): { next: Persisted; celebration: Celebration | null } {
  const prevLevel = levelForXp(prev.xp);
  const merged: Persisted = { ...prev, ...patch, xp: prev.xp + xpGain };
  const newLevel = levelForXp(merged.xp);
  const unlocked = evaluateAchievements(snapshotOf(merged), merged.achievements);
  const next: Persisted = { ...merged, achievements: [...merged.achievements, ...unlocked] };
  save(next);

  let celebration: Celebration | null = null;
  const firstUnlocked = unlocked[0];
  if (firstUnlocked) {
    const a = achievementById(firstUnlocked);
    if (a) celebration = { kind: 'achievement', icon: a.icon, title: 'Achievement unlocked', subtitle: a.title };
  } else if (newLevel > prevLevel) {
    celebration = { kind: 'level', icon: '🌟', title: `Level ${newLevel}!`, subtitle: 'Keep the momentum going' };
  }
  return { next, celebration };
}

export const useGameStats = create<GameStatsState>((set, get) => ({
  ...load(),
  celebration: null,

  checkIn: () => {
    const state = get();
    const today = dayKey(new Date());
    if (state.lastActiveDay === today) return; // already counted today
    const streak = nextStreak(state.lastActiveDay, today, state.streak);
    const bestStreak = Math.max(state.bestStreak, streak);
    const { next, celebration } = commit(
      persistedOf(state),
      { streak, bestStreak, lastActiveDay: today },
      XP_AWARDS.checkIn,
    );
    set({ ...next, celebration: celebration ?? state.celebration });
  },

  recordAction: (action) => {
    const state = get();
    const patch: Partial<Persisted> =
      action === 'capture' ? { captures: state.captures + 1 } : { pages: state.pages + 1 };
    const { next, celebration } = commit(persistedOf(state), patch, XP_AWARDS[action]);
    set({ ...next, celebration: celebration ?? state.celebration });
  },

  dismissCelebration: () => set({ celebration: null }),
}));
