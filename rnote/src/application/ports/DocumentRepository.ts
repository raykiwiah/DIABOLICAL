import type { Document, DocumentId } from '@domain/documents';
import type { WorkspaceId } from '@domain/workspace';

/**
 * Persistence boundary for documents (a "port" in hexagonal architecture).
 *
 * The application depends only on this interface; infrastructure supplies the
 * implementation (IndexedDB today, SQLite/Tauri or a cloud adapter tomorrow).
 * Swapping storage never touches domain or application code.
 */
export interface DocumentRepository {
  save(document: Document): Promise<void>;
  findById(id: DocumentId): Promise<Document | null>;
  findByWorkspace(
    workspaceId: WorkspaceId,
    options?: { includeArchived?: boolean },
  ): Promise<Document[]>;
  findChildren(workspaceId: WorkspaceId, parentId: DocumentId | null): Promise<Document[]>;
  delete(id: DocumentId): Promise<void>;
  deleteMany(ids: readonly DocumentId[]): Promise<void>;
}
