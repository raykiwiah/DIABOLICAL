import type { RichDoc } from '@domain/blocks';

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

export const ROOT_PARENT = '';
