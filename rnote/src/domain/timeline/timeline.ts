/**
 * Timeline domain — pure grouping and statistics over the activity feed. The
 * Time Machine is reconstruction, not search: events roll up into month
 * chapters and day groups, newest first, with a light statistical digest that
 * works entirely offline.
 */
export type ActivityKind = 'created' | 'edited' | 'captured';

export interface TimelineEvent {
  id?: number;
  docId: string;
  at: number;
  kind: ActivityKind;
  title: string;
  snippet: string;
}

export interface DayGroup {
  key: string;
  date: number;
  events: TimelineEvent[];
}

export interface MonthChapter {
  key: string;
  label: string;
  start: number;
  total: number;
  days: DayGroup[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Roll events up into month chapters (newest first) of day groups (newest first). */
export function buildChapters(events: TimelineEvent[]): MonthChapter[] {
  const sorted = [...events].sort((a, b) => b.at - a.at);
  const chapters: MonthChapter[] = [];
  const byMonth = new Map<string, MonthChapter>();
  const byDay = new Map<string, DayGroup>();

  for (const event of sorted) {
    const date = new Date(event.at);
    const mKey = monthKey(date);
    let chapter = byMonth.get(mKey);
    if (!chapter) {
      chapter = {
        key: mKey,
        label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
        start: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
        total: 0,
        days: [],
      };
      byMonth.set(mKey, chapter);
      chapters.push(chapter);
    }
    chapter.total += 1;

    const dKey = dayKey(date);
    let day = byDay.get(dKey);
    if (!day) {
      day = { key: dKey, date: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(), events: [] };
      byDay.set(dKey, day);
      chapter.days.push(day);
    }
    day.events.push(event);
  }
  return chapters;
}

export interface TimelineStats {
  created: number;
  edited: number;
  captured: number;
  total: number;
  activeDays: number;
  busiestDay: string | null;
  perDay: Record<string, number>;
}

export function periodStats(events: TimelineEvent[]): TimelineStats {
  const perDay: Record<string, number> = {};
  let created = 0;
  let edited = 0;
  let captured = 0;
  for (const event of events) {
    if (event.kind === 'created') created += 1;
    else if (event.kind === 'edited') edited += 1;
    else captured += 1;
    const key = dayKey(new Date(event.at));
    perDay[key] = (perDay[key] ?? 0) + 1;
  }
  let busiestDay: string | null = null;
  let max = 0;
  for (const [key, count] of Object.entries(perDay)) {
    if (count > max) {
      max = count;
      busiestDay = key;
    }
  }
  return {
    created,
    edited,
    captured,
    total: events.length,
    activeDays: Object.keys(perDay).length,
    busiestDay,
    perDay,
  };
}
