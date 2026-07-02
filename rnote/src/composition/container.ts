import { DocumentService } from '@application/documents/DocumentService';
import { WorkspaceService } from '@application/workspace/WorkspaceService';
import type { SearchIndexPort } from '@application/ports/SearchIndex';
import type { DocumentRepository } from '@application/ports/DocumentRepository';
import type { WorkspaceRepository } from '@application/ports/WorkspaceRepository';
import { getDatabase } from '@infrastructure/persistence/dexie/database';
import { DexieDocumentRepository } from '@infrastructure/persistence/dexie/DexieDocumentRepository';
import { DexieWorkspaceRepository } from '@infrastructure/persistence/dexie/DexieWorkspaceRepository';
import { TauriSqliteDocumentRepository } from '@infrastructure/persistence/sqlite/TauriSqliteDocumentRepository';
import { TauriSqliteWorkspaceRepository } from '@infrastructure/persistence/sqlite/TauriSqliteWorkspaceRepository';
import { FlexSearchIndex } from '@infrastructure/search/FlexSearchIndex';
import { SystemClock } from '@infrastructure/time/SystemClock';
import { isTauri } from '@infrastructure/platform';

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
  const clock = new SystemClock();
  const search = new FlexSearchIndex();

  // Same ports, different adapter per platform: SQLite on the Tauri desktop
  // shell, IndexedDB in the browser. Nothing above this line changes.
  let documentRepository: DocumentRepository;
  let workspaceRepository: WorkspaceRepository;

  if (isTauri()) {
    documentRepository = new TauriSqliteDocumentRepository();
    workspaceRepository = new TauriSqliteWorkspaceRepository();
  } else {
    const db = getDatabase();
    documentRepository = new DexieDocumentRepository(db);
    workspaceRepository = new DexieWorkspaceRepository(db);
  }

  return {
    documents: new DocumentService(documentRepository, search, clock),
    workspaces: new WorkspaceService(workspaceRepository, clock),
    search,
  };
}

/** App-wide singleton container for the running client. */
export const container: Container = createContainer();
