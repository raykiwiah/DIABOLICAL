import type { RichDoc } from '@domain/blocks';
import type { DocumentOrganization } from '@domain/organization';

/**
 * Persistence records — the on-disk shape in IndexedDB. Deliberately decoupled
 * from domain entities so storage concerns (indexable types, migrations) never
 * bleed into the model.
 *
 * Notes:
 *  - `parentId` uses '' for root because IndexedDB cannot index `null`.
 *  - `isArchived` is 0|1 so it can participate in a compound index.
 */
export interface DocumentRecord {
  id: string;
  workspaceId: string;
  parentId: string;
  title: string;
  icon: string;
  content: RichDoc;
  position: number;
  isArchived: 0 | 1;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Derived organization metadata for a document, in its own table so writes never
 * clobber the document record and collections can query multiEntry indexes on
 * the label arrays. The top-level fields are the *resolved* labels (raw analysis
 * with user overrides applied); `raw` keeps the pre-override analysis and
 * `pinned`/`removed` the user's edits, so re-analysis never undoes a manual edit.
 */
export interface OrganizationRecord extends DocumentOrganization {
  docId: string;
  workspaceId: string;
  raw: DocumentOrganization;
  pinned: Record<string, string[]>;
  removed: Record<string, string[]>;
}

/**
 * Append-only activity feed powering the Time Machine. Derived from the normal
 * document lifecycle (no second write path); consecutive edits to one doc are
 * coalesced by the service so the log stays meaningful.
 */
export interface ActivityRecord {
  id?: number;
  workspaceId: string;
  docId: string;
  at: number;
  kind: 'created' | 'edited' | 'captured';
  title: string;
  snippet: string;
}

/** A calendar event instance imported from an ICS source (bring-your-own). */
export interface CalendarEventRecord {
  id: string; // `${sourceId}:${uid}:${start}`
  sourceId: string;
  uid: string;
  title: string;
  location: string;
  start: number;
  end: number;
  allDay: 0 | 1;
}

export const ROOT_PARENT = '';
