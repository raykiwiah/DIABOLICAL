export interface StoredCalendarEvent {
  id: string;
  sourceId: string;
  uid: string;
  title: string;
  location: string;
  start: number;
  end: number;
  allDay: boolean;
}

export interface CalendarRepository {
  /** Replace every event belonging to a source (sync = full refresh). */
  replaceForSource(sourceId: string, events: StoredCalendarEvent[]): Promise<void>;
  listBetween(from: number, to: number): Promise<StoredCalendarEvent[]>;
  deleteSource(sourceId: string): Promise<void>;
}
