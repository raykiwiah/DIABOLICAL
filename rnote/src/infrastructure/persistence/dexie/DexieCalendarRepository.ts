import type {
  CalendarRepository,
  StoredCalendarEvent,
} from '@application/ports/CalendarRepository';
import type { RnoteDatabase } from './database';
import type { CalendarEventRecord } from './records';

export class DexieCalendarRepository implements CalendarRepository {
  constructor(private readonly db: RnoteDatabase) {}

  async replaceForSource(sourceId: string, events: StoredCalendarEvent[]): Promise<void> {
    await this.db.transaction('rw', this.db.calendar_events, async () => {
      await this.db.calendar_events.where('sourceId').equals(sourceId).delete();
      await this.db.calendar_events.bulkPut(events.map(toRecord));
    });
  }

  async listBetween(from: number, to: number): Promise<StoredCalendarEvent[]> {
    const records = await this.db.calendar_events
      .where('start')
      .between(from, to, true, true)
      .toArray();
    return records.map(fromRecord);
  }

  async deleteSource(sourceId: string): Promise<void> {
    await this.db.calendar_events.where('sourceId').equals(sourceId).delete();
  }
}

function toRecord(e: StoredCalendarEvent): CalendarEventRecord {
  return { ...e, allDay: e.allDay ? 1 : 0 };
}

function fromRecord(r: CalendarEventRecord): StoredCalendarEvent {
  return { ...r, allDay: r.allDay === 1 };
}
