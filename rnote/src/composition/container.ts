import { DocumentService } from '@application/documents/DocumentService';
import { WorkspaceService } from '@application/workspace/WorkspaceService';
import type { SearchIndexPort } from '@application/ports/SearchIndex';
import { getDatabase } from '@infrastructure/persistence/dexie/database';
import { DexieDocumentRepository } from '@infrastructure/persistence/dexie/DexieDocumentRepository';
import { DexieWorkspaceRepository } from '@infrastructure/persistence/dexie/DexieWorkspaceRepository';
import { FlexSearchIndex } from '@infrastructure/search/FlexSearchIndex';
import { SystemClock } from '@infrastructure/time/SystemClock';

/**
 * The composition root — the *only* module that knows both the ports and their
 * concrete implementations. Wiring lives here so every other layer stays
 * dependency-inverted and testable. Swapping IndexedDB for SQLite/Tauri, or the
 * search engine, is a one-line change confined to this file.
 */
export interface Container {
  documents: DocumentService;
  workspaces: WorkspaceService;
  search: SearchIndexPort;
}

export function createContainer(): Container {
  const db = getDatabase();
  const clock = new SystemClock();

  const documentRepository = new DexieDocumentRepository(db);
  const workspaceRepository = new DexieWorkspaceRepository(db);
  const search = new FlexSearchIndex();

  return {
    documents: new DocumentService(documentRepository, search, clock),
    workspaces: new WorkspaceService(workspaceRepository, clock),
    search,
  };
}

/** App-wide singleton container for the running client. */
export const container: Container = createContainer();
