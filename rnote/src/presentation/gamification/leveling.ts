/**
 * Gamification core — pure, framework-free, fully unit-tested.
 *
 * XP accrues from real actions (creating pages, capturing thoughts, daily
 * check-ins). Levels follow a gentle triangular curve so early levels come
 * quickly and later ones ask a little more. All logic here is deterministic and
 * side-effect-free; persistence and presentation live elsewhere.
 */

/** XP a single level "band" is worth at its base (band N costs 100·N). */
const XP_STEP = 100;

/** Cumulative XP required to *reach* a level (level 1 = 0 XP). */
export function xpToReach(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return (XP_STEP * (l - 1) * l) / 2;
}

/** The level for a given total XP (>= 1). */
export function levelForXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = 1;
  while (xpToReach(level + 1) <= safe) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP accumulated within the current level band. */
  inLevel: number;
  /** Total XP the current level band spans. */
  span: number;
  /** Whole-number percentage [0..100] toward the next level. */
  pct: number;
  /** XP remaining until the next level. */
  toNext: number;
}

/** Break a total XP value into human-facing level progress. */
export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const base = xpToReach(level);
  const next = xpToReach(level + 1);
  const span = next - base;
  const inLevel = Math.max(0, xp) - base;
  const pct = span === 0 ? 0 : Math.min(100, Math.round((inLevel / span) * 100));
  return { level, inLevel, span, pct, toNext: Math.max(0, span - inLevel) };
}

/** The stats an achievement can be earned against. */
export interface StatsSnapshot {
  xp: number;
  level: number;
  streak: number;
  pages: number;
  captures: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** Earned when this predicate holds for the snapshot. */
  test: (s: StatsSnapshot) => boolean;
}

/** The full, ordered achievement set. Presentation-only surfaces read these. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-page', icon: '📝', title: 'First page', description: 'Create your first page', test: (s) => s.pages >= 1 },
  { id: 'capturer', icon: '⚡', title: 'Capturer', description: 'Quick-capture 10 thoughts', test: (s) => s.captures >= 10 },
  { id: 'prolific', icon: '📚', title: 'Prolific', description: 'Create 10 pages', test: (s) => s.pages >= 10 },
  { id: 'streak-3', icon: '🔥', title: 'On a roll', description: 'Keep a 3-day streak', test: (s) => s.streak >= 3 },
  { id: 'streak-7', icon: '🗓️', title: 'Committed', description: 'Keep a 7-day streak', test: (s) => s.streak >= 7 },
  { id: 'level-5', icon: '🌟', title: 'Rising star', description: 'Reach level 5', test: (s) => s.level >= 5 },
];

/** Ids newly unlocked by `snapshot`, excluding those in `already`. */
export function evaluateAchievements(snapshot: StatsSnapshot, already: readonly string[]): string[] {
  const owned = new Set(already);
  return ACHIEVEMENTS.filter((a) => !owned.has(a.id) && a.test(snapshot)).map((a) => a.id);
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Local calendar day as YYYY-MM-DD (used for streak math). */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole-day difference between two YYYY-MM-DD keys (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/**
 * Next streak given the previous active day and today. Same day keeps the
 * streak (no double count), consecutive day increments, any gap resets to 1.
 */
export function nextStreak(previousDay: string | null, today: string, currentStreak: number): number {
  if (previousDay === null) return 1;
  const gap = daysBetween(previousDay, today);
  if (gap <= 0) return Math.max(1, currentStreak);
  if (gap === 1) return currentStreak + 1;
  return 1;
}
