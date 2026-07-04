/**
 * Minimal, dependency-free ICS (RFC 5545) parser for bring-your-own-calendar.
 *
 * Scope (documented, pragmatic v1):
 *  - VEVENT with SUMMARY / LOCATION / UID / DTSTART / DTEND / DURATION-less
 *  - DATE values → all-day; DATE-TIME `…Z` → UTC; floating / TZID → treated as
 *    the device's local wall-clock time (correct for the overwhelmingly common
 *    "my own calendar on my own device" case; full VTIMEZONE math is out of
 *    scope for a client-only app).
 *  - RRULE subset: FREQ=DAILY|WEEKLY|MONTHLY, INTERVAL, COUNT, UNTIL, BYDAY
 *    (weekly), expanded inside the caller's horizon window; EXDATE honoured.
 * Pure domain: no fetch, no storage, fully unit-tested.
 */
export interface CalendarEvent {
  uid: string;
  title: string;
  location: string;
  start: number;
  end: number;
  allDay: boolean;
}

interface RawProp {
  name: string;
  params: Record<string, string>;
  value: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INSTANCES_PER_EVENT = 200;

export interface ExpandWindow {
  from: number;
  to: number;
}

export function parseIcs(text: string, window: ExpandWindow): CalendarEvent[] {
  const lines = unfold(text);
  const events: CalendarEvent[] = [];
  let current: RawProp[] | null = null;

  for (const line of lines) {
    if (/^BEGIN:VEVENT/i.test(line)) {
      current = [];
      continue;
    }
    if (/^END:VEVENT/i.test(line)) {
      if (current) events.push(...eventFromProps(current, window));
      current = null;
      continue;
    }
    if (current) {
      const prop = parseLine(line);
      if (prop) current.push(prop);
    }
  }
  return events.sort((a, b) => a.start - b.start);
}

/** RFC 5545 line unfolding: a line starting with space/tab continues the previous. */
function unfold(text: string): string[] {
  const raw = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else if (line.length > 0) {
      out.push(line);
    }
  }
  return out;
}

function parseLine(line: string): RawProp | null {
  const colon = findUnquotedColon(line);
  if (colon === -1) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name = '', ...paramParts] = head.split(';');
  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const eq = part.indexOf('=');
    if (eq > 0) params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value };
}

function findUnquotedColon(line: string): number {
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ':' && !inQuotes) return i;
  }
  return -1;
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

interface ParsedStamp {
  time: number;
  allDay: boolean;
}

function parseStamp(prop: RawProp): ParsedStamp | null {
  const value = prop.value.trim();
  // All-day DATE (either declared or shaped like one).
  if (prop.params.VALUE === 'DATE' || /^\d{8}$/.test(value)) {
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
    if (!m) return null;
    return { time: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime(), allDay: true };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(value);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4], m[5], m[6] ?? '00'].map(Number);
  const time = m[7]
    ? Date.UTC(y!, mo! - 1, d, h, mi, s)
    : new Date(y!, mo! - 1, d, h, mi, s).getTime();
  return { time, allDay: false };
}

function eventFromProps(props: RawProp[], window: ExpandWindow): CalendarEvent[] {
  const get = (name: string): RawProp | undefined => props.find((p) => p.name === name);
  const startProp = get('DTSTART');
  if (!startProp) return [];
  const start = parseStamp(startProp);
  if (!start) return [];

  const endProp = get('DTEND');
  const end = endProp ? parseStamp(endProp) : null;
  const duration = end
    ? Math.max(0, end.time - start.time)
    : start.allDay
      ? DAY_MS
      : 60 * 60 * 1000;

  const base: Omit<CalendarEvent, 'start' | 'end'> = {
    uid: get('UID')?.value ?? `${start.time}-${get('SUMMARY')?.value ?? ''}`,
    title: unescapeText(get('SUMMARY')?.value ?? '(no title)'),
    location: unescapeText(get('LOCATION')?.value ?? ''),
    allDay: start.allDay,
  };

  const exdates = new Set(
    props
      .filter((p) => p.name === 'EXDATE')
      .flatMap((p) => p.value.split(','))
      .map((v) => parseStamp({ name: 'EXDATE', params: {}, value: v.trim() })?.time)
      .filter((t): t is number => typeof t === 'number'),
  );

  const rrule = get('RRULE')?.value;
  const starts = rrule
    ? expandRrule(rrule, start.time, window)
    : start.time >= window.from && start.time <= window.to
      ? [start.time]
      : [];

  return starts
    .filter((t) => !exdates.has(t))
    .map((t) => ({ ...base, start: t, end: t + duration }));
}

const WEEKDAYS: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/** Expand a supported RRULE inside the window (bounded). */
function expandRrule(rule: string, dtstart: number, window: ExpandWindow): number[] {
  const parts: Record<string, string> = {};
  for (const kv of rule.split(';')) {
    const eq = kv.indexOf('=');
    if (eq > 0) parts[kv.slice(0, eq).toUpperCase()] = kv.slice(eq + 1);
  }
  const freq = parts.FREQ?.toUpperCase();
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY') {
    // Unsupported recurrence — surface the seed instance if it's in range.
    return dtstart >= window.from && dtstart <= window.to ? [dtstart] : [];
  }
  const interval = Math.max(1, Number(parts.INTERVAL ?? '1') || 1);
  const count = parts.COUNT ? Number(parts.COUNT) : Infinity;
  const until = parts.UNTIL
    ? (parseStamp({ name: 'UNTIL', params: {}, value: parts.UNTIL })?.time ?? Infinity)
    : Infinity;
  const byday = (parts.BYDAY ?? '')
    .split(',')
    .map((d) => WEEKDAYS[d.trim().toUpperCase()])
    .filter((d): d is number => typeof d === 'number');

  const out: number[] = [];
  const seed = new Date(dtstart);
  let produced = 0;

  if (freq === 'WEEKLY' && byday.length > 0) {
    // Walk day by day from the seed; emit days whose weekday matches, honouring
    // the week interval relative to the seed's week.
    const seedWeekStart = startOfWeek(seed).getTime();
    for (let t = dtstart, guard = 0; t <= until && produced < count && guard < 731; guard += 1) {
      const date = new Date(t);
      const weeksFromSeed = Math.round((startOfWeek(date).getTime() - seedWeekStart) / (7 * DAY_MS));
      if (weeksFromSeed % interval === 0 && byday.includes(date.getDay())) {
        produced += 1;
        if (t >= window.from && t <= window.to) out.push(t);
      }
      if (t > window.to || out.length >= MAX_INSTANCES_PER_EVENT) break;
      t += DAY_MS;
    }
    return out;
  }

  const stepMonths = freq === 'MONTHLY';
  const stepMs = freq === 'DAILY' ? interval * DAY_MS : 7 * interval * DAY_MS;
  let t = dtstart;
  for (let guard = 0; guard < 400; guard += 1) {
    if (t > until || produced >= count) break;
    produced += 1;
    if (t >= window.from && t <= window.to) out.push(t);
    if (t > window.to || out.length >= MAX_INSTANCES_PER_EVENT) break;
    if (stepMonths) {
      const d = new Date(t);
      d.setMonth(d.getMonth() + interval);
      t = d.getTime();
    } else {
      t += stepMs;
    }
  }
  return out;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}
