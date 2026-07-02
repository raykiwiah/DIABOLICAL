import { Workspace } from '@domain/workspace';
import { idFrom, type Clock, ok, err, type Result, domainError } from '@domain/shared';
import type { WorkspaceRepository } from '../ports/WorkspaceRepository';
import type { WorkspaceDto } from '../dto';

const toDto = (workspace: Workspace): WorkspaceDto => ({
  id: workspace.id,
  name: workspace.name,
  createdAt: workspace.createdAt,
});

export class WorkspaceService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Idempotently guarantee a workspace exists. On a fresh install this creates
   * the user's first workspace; on subsequent boots it returns the existing one.
   */
  async ensureDefault(name = 'My Life'): Promise<WorkspaceDto> {
    const existing = await this.workspaces.findFirst();
    if (existing) return toDto(existing);

    const created = Workspace.create(name, this.clock);
    if (!created.ok) {
      // The default name is always valid; a failure here is a programmer error.
      throw new Error(created.error.message);
    }
    await this.workspaces.save(created.value);
    return toDto(created.value);
  }

  async list(): Promise<WorkspaceDto[]> {
    const all = await this.workspaces.list();
    return all.map(toDto);
  }

  async rename(id: string, name: string): Promise<Result<WorkspaceDto>> {
    const workspace = await this.workspaces.findById(idFrom<'Workspace'>(id));
    if (!workspace) return err(domainError('workspace.not-found', 'Workspace not found.'));

    const renamed = workspace.rename(name, this.clock);
    if (!renamed.ok) return renamed;

    await this.workspaces.save(workspace);
    return ok(toDto(workspace));
  }
}
