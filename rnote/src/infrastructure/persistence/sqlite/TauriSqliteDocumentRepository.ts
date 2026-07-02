import type { Document, DocumentId } from '@domain/documents';
import type { WorkspaceId } from '@domain/workspace';
import type { DocumentRepository } from '@application/ports/DocumentRepository';
import { ROOT_PARENT, type DocumentRecord } from '../dexie/records';
import { documentToRecord, recordToDocument } from '../dexie/mappers';
import { getSqliteDatabase, type DocumentRow } from './TauriSqliteDatabase';

/**
 * SQLite implementation of the DocumentRepository port for the Tauri desktop
 * build. It reuses the domain record mappers — only the storage mechanics differ
 * from the IndexedDB adapter, which is exactly what the ports abstraction buys.
 */
export class TauriSqliteDocumentRepository implements DocumentRepository {
  async save(document: Document): Promise<void> {
    const db = await getSqliteDatabase();
    const r = documentToRecord(document);
    await db.execute(
      `INSERT INTO documents
         (id, workspace_id, parent_id, title, icon, content, position, is_archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT(id) DO UPDATE SET
         workspace_id = $2, parent_id = $3, title = $4, icon = $5, content = $6,
         position = $7, is_archived = $8, created_at = $9, updated_at = $10`,
      [
        r.id,
        r.workspaceId,
        r.parentId,
        r.title,
        r.icon,
        JSON.stringify(r.content),
        r.position,
        r.isArchived,
        r.createdAt,
        r.updatedAt,
      ],
    );
  }

  async findById(id: DocumentId): Promise<Document | null> {
    const db = await getSqliteDatabase();
    const rows = await db.select<DocumentRow[]>(`SELECT * FROM documents WHERE id = $1`, [id]);
    const row = rows[0];
    return row ? recordToDocument(rowToRecord(row)) : null;
  }

  async findByWorkspace(
    workspaceId: WorkspaceId,
    options?: { includeArchived?: boolean },
  ): Promise<Document[]> {
    const db = await getSqliteDatabase();
    const sql = options?.includeArchived
      ? `SELECT * FROM documents WHERE workspace_id = $1`
      : `SELECT * FROM documents WHERE workspace_id = $1 AND is_archived = 0`;
    const rows = await db.select<DocumentRow[]>(sql, [workspaceId]);
    return rows.map((row) => recordToDocument(rowToRecord(row)));
  }

  async findChildren(workspaceId: WorkspaceId, parentId: DocumentId | null): Promise<Document[]> {
    const db = await getSqliteDatabase();
    const rows = await db.select<DocumentRow[]>(
      `SELECT * FROM documents WHERE workspace_id = $1 AND parent_id = $2`,
      [workspaceId, parentId ?? ROOT_PARENT],
    );
    return rows.map((row) => recordToDocument(rowToRecord(row)));
  }

  async delete(id: DocumentId): Promise<void> {
    const db = await getSqliteDatabase();
    await db.execute(`DELETE FROM documents WHERE id = $1`, [id]);
  }

  async deleteMany(ids: readonly DocumentId[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getSqliteDatabase();
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    await db.execute(`DELETE FROM documents WHERE id IN (${placeholders})`, [...ids]);
  }
}

function rowToRecord(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    parentId: row.parent_id,
    title: row.title,
    icon: row.icon,
    content: JSON.parse(row.content),
    position: row.position,
    isArchived: row.is_archived === 1 ? 1 : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
