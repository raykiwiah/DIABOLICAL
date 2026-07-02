import Dexie, { type Table } from 'dexie';
import type { DocumentRecord, WorkspaceRecord } from './records';

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

  constructor(name = 'rnote') {
    super(name);
    this.version(1).stores({
      documents: 'id, workspaceId, updatedAt, [workspaceId+parentId], [workspaceId+isArchived]',
      workspaces: 'id, createdAt',
    });
  }
}

let singleton: RnoteDatabase | null = null;

/** Shared database instance for the running app. */
export function getDatabase(): RnoteDatabase {
  if (!singleton) singleton = new RnoteDatabase();
  return singleton;
}
