import { describe, it, expect } from 'vitest';
import {
  xpToReach,
  levelForXp,
  levelProgress,
  evaluateAchievements,
  nextStreak,
  daysBetween,
  dayKey,
  type StatsSnapshot,
} from '@presentation/gamification/leveling';

describe('leveling', () => {
  it('cumulative XP thresholds follow the triangular curve', () => {
    expect(xpToReach(1)).toBe(0);
    expect(xpToReach(2)).toBe(100);
    expect(xpToReach(3)).toBe(300);
    expect(xpToReach(4)).toBe(600);
    expect(xpToReach(5)).toBe(1000);
  });

  it('maps XP to the correct level (inclusive at thresholds)', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelForXp(1000)).toBe(5);
  });

  it('reports progress within the current level band', () => {
    const p = levelProgress(150); // level 2 band spans 100..300
    expect(p.level).toBe(2);
    expect(p.inLevel).toBe(50);
    expect(p.span).toBe(200);
    expect(p.pct).toBe(25);
    expect(p.toNext).toBe(150);
  });

  it('clamps negative XP gracefully', () => {
    expect(levelForXp(-50)).toBe(1);
    expect(levelProgress(-50).level).toBe(1);
  });
});

describe('achievements', () => {
  const base: StatsSnapshot = { xp: 0, level: 1, streak: 0, pages: 0, captures: 0 };

  it('unlocks first-page on the first page', () => {
    expect(evaluateAchievements({ ...base, pages: 1 }, [])).toContain('first-page');
  });

  it('does not re-award already-owned achievements', () => {
    const unlocked = evaluateAchievements({ ...base, pages: 1 }, ['first-page']);
    expect(unlocked).not.toContain('first-page');
  });

  it('awards streak and level milestones', () => {
    const got = evaluateAchievements({ ...base, streak: 7, level: 5, pages: 10, captures: 10 }, []);
    expect(got).toEqual(
      expect.arrayContaining(['streak-3', 'streak-7', 'level-5', 'prolific', 'capturer']),
    );
  });
});

describe('streaks', () => {
  it('starts at 1 with no history', () => {
    expect(nextStreak(null, '2026-07-03', 0)).toBe(1);
  });

  it('increments on a consecutive day', () => {
    expect(nextStreak('2026-07-02', '2026-07-03', 4)).toBe(5);
  });

  it('holds on the same day (no double count)', () => {
    expect(nextStreak('2026-07-03', '2026-07-03', 4)).toBe(4);
  });

  it('resets after a gap', () => {
    expect(nextStreak('2026-06-30', '2026-07-03', 9)).toBe(1);
  });

  it('computes whole-day differences and formats day keys', () => {
    expect(daysBetween('2026-07-01', '2026-07-03')).toBe(2);
    expect(dayKey(new Date('2026-07-03T09:30:00'))).toBe('2026-07-03');
  });
});
