import type { TimelineEvent } from '@domain/timeline';

export interface StoredActivity extends TimelineEvent {
  workspaceId: string;
}

export interface ActivityRepository {
  append(event: StoredActivity): Promise<void>;
  /** The most recent event for a document (used to coalesce edits). */
  latestForDoc(docId: string): Promise<StoredActivity | null>;
  touch(id: number, at: number, snippet: string): Promise<void>;
  listByWorkspace(workspaceId: string): Promise<StoredActivity[]>;
  deleteByDoc(docId: string): Promise<void>;
}
