import type { Workspace, WorkspaceId } from '@domain/workspace';

export interface WorkspaceRepository {
  save(workspace: Workspace): Promise<void>;
  findById(id: WorkspaceId): Promise<Workspace | null>;
  /** The first workspace by creation order — used to resolve a default on boot. */
  findFirst(): Promise<Workspace | null>;
  list(): Promise<Workspace[]>;
}
