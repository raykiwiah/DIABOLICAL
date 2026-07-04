import { parseIcs } from '@domain/calendar';
import type {
  CalendarRepository,
  StoredCalendarEvent,
} from '../ports/CalendarRepository';

const DAY_MS = 24 * 60 * 60 * 1000;
/** How far ahead we expand recurring events on each sync. */
const HORIZON_DAYS = 60;

/**
 * Bring-your-own-calendar. Parses ICS text (from a subscribed URL or an
 * uploaded file), expands recurrences inside a rolling horizon, and stores the
 * instances locally. Re-sync replaces a source's events wholesale.
 */
export class CalendarService {
  constructor(private readonly repo: CalendarRepository) {}

  async syncSource(sourceId: string, icsText: string): Promise<number> {
    const now = Date.now();
    const window = { from: now - DAY_MS, to: now + HORIZON_DAYS * DAY_MS };
    const events = parseIcs(icsText, window).map<StoredCalendarEvent>((e) => ({
      id: `${sourceId}:${e.uid}:${e.start}`,
      sourceId,
      uid: e.uid,
      title: e.title,
      location: e.location,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
    }));
    await this.repo.replaceForSource(sourceId, events);
    return events.length;
  }

  eventsBetween(from: number, to: number): Promise<StoredCalendarEvent[]> {
    return this.repo.listBetween(from, to);
  }

  forgetSource(sourceId: string): Promise<void> {
    return this.repo.deleteSource(sourceId);
  }
}
