import type { Document, DocumentId } from '@domain/documents';
import type { WorkspaceId } from '@domain/workspace';
import type { DocumentRepository } from '@application/ports/DocumentRepository';
import type { RnoteDatabase } from './database';
import { ROOT_PARENT } from './records';
import { documentToRecord, recordToDocument } from './mappers';

/** IndexedDB-backed implementation of the DocumentRepository port. */
export class DexieDocumentRepository implements DocumentRepository {
  constructor(private readonly db: RnoteDatabase) {}

  async save(document: Document): Promise<void> {
    await this.db.documents.put(documentToRecord(document));
  }

  async findById(id: DocumentId): Promise<Document | null> {
    const record = await this.db.documents.get(id);
    return record ? recordToDocument(record) : null;
  }

  async findByWorkspace(
    workspaceId: WorkspaceId,
    options?: { includeArchived?: boolean },
  ): Promise<Document[]> {
    const records = options?.includeArchived
      ? await this.db.documents.where('workspaceId').equals(workspaceId).toArray()
      : await this.db.documents
          .where('[workspaceId+isArchived]')
          .equals([workspaceId, 0])
          .toArray();
    return records.map(recordToDocument);
  }

  async findChildren(workspaceId: WorkspaceId, parentId: DocumentId | null): Promise<Document[]> {
    const records = await this.db.documents
      .where('[workspaceId+parentId]')
      .equals([workspaceId, parentId ?? ROOT_PARENT])
      .toArray();
    return records.map(recordToDocument);
  }

  async delete(id: DocumentId): Promise<void> {
    await this.db.documents.delete(id);
  }

  async deleteMany(ids: readonly DocumentId[]): Promise<void> {
    await this.db.documents.bulkDelete([...ids]);
  }
}
