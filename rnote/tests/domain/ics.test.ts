import { describe, it, expect } from 'vitest';
import { parseIcs } from '@domain/calendar';

const WINDOW = {
  from: new Date(2026, 6, 1).getTime(), // Jul 1 2026 local
  to: new Date(2026, 7, 15).getTime(), // Aug 15 2026 local
};

const wrap = (body: string): string =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR\r\n`;

describe('parseIcs', () => {
  it('parses a timed event with folded summary and escaped text', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:abc-1',
        'DTSTART:20260704T090000',
        'DTEND:20260704T100000',
        'SUMMARY:Coffee with',
        '  Godwin\\, downtown',
        'LOCATION:Java House',
        'END:VEVENT',
      ].join('\r\n'),
    );
    const [ev] = parseIcs(ics, WINDOW);
    expect(ev).toBeDefined();
    expect(ev!.title).toBe('Coffee with Godwin, downtown');
    expect(ev!.location).toBe('Java House');
    expect(ev!.allDay).toBe(false);
    expect(new Date(ev!.start).getHours()).toBe(9);
    expect(ev!.end - ev!.start).toBe(60 * 60 * 1000);
  });

  it('parses all-day DATE events with a 1-day default duration', () => {
    const ics = wrap(
      ['BEGIN:VEVENT', 'UID:d1', 'DTSTART;VALUE=DATE:20260710', 'SUMMARY:Holiday', 'END:VEVENT'].join(
        '\r\n',
      ),
    );
    const [ev] = parseIcs(ics, WINDOW);
    expect(ev!.allDay).toBe(true);
    expect(ev!.end - ev!.start).toBe(24 * 60 * 60 * 1000);
  });

  it('treats UTC (Z) stamps as UTC', () => {
    const ics = wrap(
      ['BEGIN:VEVENT', 'UID:z1', 'DTSTART:20260704T060000Z', 'SUMMARY:UTC call', 'END:VEVENT'].join(
        '\r\n',
      ),
    );
    const [ev] = parseIcs(ics, WINDOW);
    expect(ev!.start).toBe(Date.UTC(2026, 6, 4, 6, 0, 0));
  });

  it('expands WEEKLY BYDAY recurrences inside the window and honours EXDATE', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:w1',
        'DTSTART:20260706T100000', // Monday Jul 6 2026
        'DTEND:20260706T103000',
        'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
        'EXDATE:20260708T100000', // skip Wed Jul 8
        'SUMMARY:Standup',
        'END:VEVENT',
      ].join('\r\n'),
    );
    const events = parseIcs(ics, { from: new Date(2026, 6, 6).getTime(), to: new Date(2026, 6, 19, 23).getTime() });
    const days = events.map((e) => new Date(e.start).toDateString());
    expect(days).toContain('Mon Jul 06 2026');
    expect(days).toContain('Mon Jul 13 2026');
    expect(days).toContain('Wed Jul 15 2026');
    expect(days).not.toContain('Wed Jul 08 2026'); // EXDATE
    expect(events.every((e) => e.title === 'Standup')).toBe(true);
  });

  it('honours COUNT on DAILY rules', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:c1',
        'DTSTART:20260701T080000',
        'RRULE:FREQ=DAILY;COUNT=3',
        'SUMMARY:Meds',
        'END:VEVENT',
      ].join('\r\n'),
    );
    const events = parseIcs(ics, WINDOW);
    expect(events).toHaveLength(3);
  });

  it('drops events outside the window and handles empty input', () => {
    const ics = wrap(
      ['BEGIN:VEVENT', 'UID:old', 'DTSTART:20200101T090000', 'SUMMARY:Ancient', 'END:VEVENT'].join(
        '\r\n',
      ),
    );
    expect(parseIcs(ics, WINDOW)).toHaveLength(0);
    expect(parseIcs('', WINDOW)).toHaveLength(0);
  });
});
