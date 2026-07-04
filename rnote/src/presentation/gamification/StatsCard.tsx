import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { useGameStats } from '../state/gameStats';
import { usePreferences } from '../state/preferences';
import { cn } from '../lib/cn';
import { ACHIEVEMENTS, levelProgress } from './leveling';

/** Animated integer that eases toward its target — numbers feel alive. */
function CountUp({ value }: { value: number }): JSX.Element {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    const duration = 650;
    let raf = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

/**
 * Progress widget for the Home dashboard. The numbers are identical in both
 * modes — only the presentation changes: Gen Z gets a vibrant, animated card
 * with a level ring and badge shelf; Millennial gets a single calm line.
 */
export function StatsCard(): JSX.Element {
  const xp = useGameStats((s) => s.xp);
  const streak = useGameStats((s) => s.streak);
  const earned = useGameStats((s) => s.achievements);
  const mode = usePreferences((s) => s.mode);
  const { level, pct, toNext } = levelProgress(xp);

  if (mode !== 'genz') {
    // Millennial: minimal, no motion, no ornament.
    return (
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Level {level}</span>
        <span aria-hidden>·</span>
        <span>{streak > 0 ? `${streak}-day streak` : 'No streak yet'}</span>
        <span aria-hidden>·</span>
        <span>{xp} XP</span>
        <span aria-hidden>·</span>
        <span>
          {earned.length} of {ACHIEVEMENTS.length} achievements
        </span>
      </div>
    );
  }

  const r = 26;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - pct / 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Your progress"
      className="mt-6 rn-panel overflow-hidden p-4"
    >
      <div className="flex items-center gap-4">
        {/* Level ring */}
        <div className="relative h-[68px] w-[68px] shrink-0">
          <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
            <circle cx="34" cy="34" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
            <motion.circle
              cx="34"
              cy="34"
              r={r}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashoffset }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wide text-subtle">Lvl</span>
            <span className="font-display text-lg font-bold leading-none text-foreground">{level}</span>
          </div>
        </div>

        {/* XP + next-level */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              <CountUp value={xp} /> XP
            </span>
            <span className="text-xs text-muted-foreground">{toNext} to next</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-hover">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg bg-surface-hover px-3 py-1.5">
          <Flame size={18} className={streak > 0 ? 'text-accent' : 'text-subtle'} />
          <span className="text-sm font-semibold text-foreground">{streak}</span>
          <span className="text-[10px] uppercase tracking-wide text-subtle">day{streak === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Achievement shelf */}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <Trophy size={14} className="shrink-0 text-muted-foreground" />
        <div className="flex flex-wrap gap-1.5">
          {ACHIEVEMENTS.map((a) => {
            const has = earned.includes(a.id);
            return (
              <span
                key={a.id}
                title={has ? `${a.title} — ${a.description}` : `Locked · ${a.description}`}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm transition',
                  has
                    ? 'border-primary/30 bg-primary/10'
                    : 'border-border bg-surface opacity-40 grayscale',
                )}
              >
                <span aria-hidden>{a.icon}</span>
                <span className="sr-only">{has ? `${a.title} unlocked` : `${a.title} locked`}</span>
              </span>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
