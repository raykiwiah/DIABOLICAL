import { AggregateRoot } from '../shared/AggregateRoot';
import { createId, type UniqueId } from '../shared/Id';
import { ok, err, type Result, domainError } from '../shared/Result';
import type { Clock } from '../shared/Clock';

export type WorkspaceId = UniqueId<'Workspace'>;

export const WORKSPACE_NAME_MAX_LENGTH = 80;

export interface WorkspaceProps {
  name: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Workspace — the top-level container that owns documents. Kept intentionally
 * small in Milestone 1; membership, sharing and per-workspace settings arrive in
 * later milestones without changing this aggregate's identity.
 */
export class Workspace extends AggregateRoot<WorkspaceId> {
  private constructor(
    id: WorkspaceId,
    private props: WorkspaceProps,
  ) {
    super(id);
  }

  static create(name: string, clock: Clock): Result<Workspace> {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return err(domainError('workspace.name-required', 'Workspace name is required.'));
    }
    if (trimmed.length > WORKSPACE_NAME_MAX_LENGTH) {
      return err(
        domainError(
          'workspace.name-too-long',
          `Name exceeds ${WORKSPACE_NAME_MAX_LENGTH} characters.`,
        ),
      );
    }
    const now = clock.now();
    return ok(
      new Workspace(createId<'Workspace'>(), { name: trimmed, createdAt: now, updatedAt: now }),
    );
  }

  static rehydrate(id: WorkspaceId, props: WorkspaceProps): Workspace {
    return new Workspace(id, props);
  }

  get name(): string {
    return this.props.name;
  }
  get createdAt(): number {
    return this.props.createdAt;
  }
  get updatedAt(): number {
    return this.props.updatedAt;
  }

  rename(name: string, clock: Clock): Result<void> {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return err(domainError('workspace.name-required', 'Workspace name is required.'));
    }
    this.props.name = trimmed;
    this.props.updatedAt = clock.now();
    return ok(undefined);
  }

  toSnapshot(): WorkspaceProps & { id: WorkspaceId } {
    return { id: this.id, ...this.props };
  }
}
