import { Workspace, type WorkspaceId } from '@domain/workspace';
import { idFrom } from '@domain/shared';
import type { WorkspaceRepository } from '@application/ports/WorkspaceRepository';
import { getSqliteDatabase, type WorkspaceRow } from './TauriSqliteDatabase';

export class TauriSqliteWorkspaceRepository implements WorkspaceRepository {
  async save(workspace: Workspace): Promise<void> {
    const db = await getSqliteDatabase();
    const s = workspace.toSnapshot();
    await db.execute(
      `INSERT INTO workspaces (id, name, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(id) DO UPDATE SET name = $2, created_at = $3, updated_at = $4`,
      [s.id, s.name, s.createdAt, s.updatedAt],
    );
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const db = await getSqliteDatabase();
    const rows = await db.select<WorkspaceRow[]>(`SELECT * FROM workspaces WHERE id = $1`, [id]);
    return rows[0] ? toWorkspace(rows[0]) : null;
  }

  async findFirst(): Promise<Workspace | null> {
    const db = await getSqliteDatabase();
    const rows = await db.select<WorkspaceRow[]>(
      `SELECT * FROM workspaces ORDER BY created_at ASC LIMIT 1`,
    );
    return rows[0] ? toWorkspace(rows[0]) : null;
  }

  async list(): Promise<Workspace[]> {
    const db = await getSqliteDatabase();
    const rows = await db.select<WorkspaceRow[]>(
      `SELECT * FROM workspaces ORDER BY created_at ASC`,
    );
    return rows.map(toWorkspace);
  }
}

function toWorkspace(row: WorkspaceRow): Workspace {
  return Workspace.rehydrate(idFrom<'Workspace'>(row.id), {
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
