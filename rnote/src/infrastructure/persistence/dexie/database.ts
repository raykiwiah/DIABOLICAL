import Dexie, { type Table } from 'dexie';
import type {
  DocumentRecord,
  WorkspaceRecord,
  OrganizationRecord,
  ActivityRecord,
  CalendarEventRecord,
} from './records';

/**
 * The local-first store. IndexedDB via Dexie is the Milestone 1 storage engine;
 * a Tauri/SQLite adapter will implement the same repository ports later without
 * changing this file's consumers.
 *
 * Compound indexes power the two hot queries:
 *   [workspaceId+parentId]  → children of a page (tree building)
 *   [workspaceId+isArchived] → a workspace's active documents
 */
export class RnoteDatabase extends Dexie {
  documents!: Table<DocumentRecord, string>;
  workspaces!: Table<WorkspaceRecord, string>;
  organizations!: Table<OrganizationRecord, string>;
  activity!: Table<ActivityRecord, number>;
  calendar_events!: Table<CalendarEventRecord, string>;

  constructor(name = 'rnote') {
    super(name);
    this.version(1).stores({
      documents: 'id, workspaceId, updatedAt, [workspaceId+parentId], [workspaceId+isArchived]',
      workspaces: 'id, createdAt',
    });
    // v2 — auto-organization. New table only; existing documents are untouched
    // and get an organization record lazily on first analysis (no data migration
    // needed). MultiEntry (*) indexes power Smart Collection queries.
    this.version(2).stores({
      organizations:
        'docId, workspaceId, intent, contentHash, *categories, *projects, *people, *places, *tags',
    });
    // v3 — Time Machine activity feed. Auto-increment id; [workspaceId+at] powers
    // chronological range queries; docId indexed for coalescing + cleanup.
    this.version(3).stores({
      activity: '++id, docId, [workspaceId+at]',
    });
    // v4 — bring-your-own-calendar (ICS). Events are replace-on-sync per source.
    this.version(4).stores({
      calendar_events: 'id, sourceId, start',
    });
  }
}

let singleton: RnoteDatabase | null = null;

/** Shared database instance for the running app. */
export function getDatabase(): RnoteDatabase {
  if (!singleton) singleton = new RnoteDatabase();
  return singleton;
}
