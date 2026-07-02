import type { Workspace, WorkspaceId } from '@domain/workspace';
import type { WorkspaceRepository } from '@application/ports/WorkspaceRepository';
import type { RnoteDatabase } from './database';
import { recordToWorkspace, workspaceToRecord } from './mappers';

export class DexieWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: RnoteDatabase) {}

  async save(workspace: Workspace): Promise<void> {
    await this.db.workspaces.put(workspaceToRecord(workspace));
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const record = await this.db.workspaces.get(id);
    return record ? recordToWorkspace(record) : null;
  }

  async findFirst(): Promise<Workspace | null> {
    const record = await this.db.workspaces.orderBy('createdAt').first();
    return record ? recordToWorkspace(record) : null;
  }

  async list(): Promise<Workspace[]> {
    const records = await this.db.workspaces.orderBy('createdAt').toArray();
    return records.map(recordToWorkspace);
  }
}
