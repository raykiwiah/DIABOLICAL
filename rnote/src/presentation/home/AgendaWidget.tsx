import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, MapPin, Settings as SettingsIcon } from 'lucide-react';
import type { StoredCalendarEvent } from '@application/ports/CalendarRepository';
import { useCalendar } from '../state/calendar';
import { emit, OPEN_SETTINGS_EVENT } from '../lib/events';
import { cn } from '../lib/cn';

/**
 * Today's agenda from the user's connected calendars. Hidden entirely until a
 * calendar is connected; "up next" is highlighted and past events fade.
 */
export function AgendaWidget(): JSX.Element | null {
  const sources = useCalendar((s) => s.sources);
  const events = useCalendar((s) => s.events);
  const load = useCalendar((s) => s.load);

  useEffect(() => {
    if (sources.length > 0) void load();
  }, [sources.length, load]);

  const today = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    return events
      .filter((e) => e.start < dayEnd && e.end > dayStart)
      .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start - b.start)
      .slice(0, 6);
  }, [events]);

  if (sources.length === 0) return null;

  const now = Date.now();
  const nextId = today.find((e) => !e.allDay && e.end > now)?.id;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Today's agenda"
      className="mt-4 rn-panel p-4"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarClock size={15} className="text-primary" />
          Today&apos;s agenda
        </span>
        <button
          type="button"
          aria-label="Calendar settings"
          onClick={() => emit(OPEN_SETTINGS_EVENT)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-subtle transition hover:bg-surface-hover hover:text-foreground"
        >
          <SettingsIcon size={13} />
        </button>
      </div>

      {today.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled — the day is yours. ✨</p>
      ) : (
        <ul className="mt-2.5 space-y-1">
          {today.map((event, i) => (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <AgendaRow event={event} isNext={event.id === nextId} past={!event.allDay && event.end < now} />
            </motion.li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}

function AgendaRow({
  event,
  isNext,
  past,
}: {
  event: StoredCalendarEvent;
  isNext: boolean;
  past: boolean;
}): JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors',
        isNext && 'bg-primary/10 ring-1 ring-inset ring-primary/25',
        past && 'opacity-45',
      )}
    >
      <span className={cn('w-[74px] shrink-0 text-xs tabular-nums', isNext ? 'font-semibold text-primary' : 'text-muted-foreground')}>
        {event.allDay ? 'All day' : formatTime(event.start)}
      </span>
      <span className={cn('h-5 w-1 shrink-0 rounded-full', isNext ? 'bg-primary' : 'bg-border-strong')} />
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm', past ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {event.title}
        </span>
        {event.location && (
          <span className="flex items-center gap-1 truncate text-[11px] text-subtle">
            <MapPin size={10} /> {event.location}
          </span>
        )}
      </span>
      {isNext && (
        <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Up next
        </span>
      )}
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
