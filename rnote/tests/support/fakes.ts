import type { Clock } from '@domain/shared';
import type { Document, DocumentId } from '@domain/documents';
import type { Workspace, WorkspaceId } from '@domain/workspace';
import type { DocumentRepository } from '@application/ports/DocumentRepository';
import type { WorkspaceRepository } from '@application/ports/WorkspaceRepository';

/** A deterministic clock that advances by 1ms each read unless frozen. */
export class FakeClock implements Clock {
  constructor(private time = 1_000) {}
  now(): number {
    return this.time++;
  }
  set(time: number): void {
    this.time = time;
  }
}

/** In-memory DocumentRepository mirroring the semantics of the Dexie adapter. */
export class InMemoryDocumentRepository implements DocumentRepository {
  private readonly store = new Map<string, Document>();

  async save(document: Document): Promise<void> {
    this.store.set(document.id, document);
  }

  async findById(id: DocumentId): Promise<Document | null> {
    return this.store.get(id) ?? null;
  }

  async findByWorkspace(
    workspaceId: WorkspaceId,
    options?: { includeArchived?: boolean },
  ): Promise<Document[]> {
    return [...this.store.values()].filter(
      (d) => d.workspaceId === workspaceId && (options?.includeArchived || !d.isArchived),
    );
  }

  async findChildren(workspaceId: WorkspaceId, parentId: DocumentId | null): Promise<Document[]> {
    return [...this.store.values()].filter(
      (d) => d.workspaceId === workspaceId && d.parentId === parentId,
    );
  }

  async delete(id: DocumentId): Promise<void> {
    this.store.delete(id);
  }

  async deleteMany(ids: readonly DocumentId[]): Promise<void> {
    for (const id of ids) this.store.delete(id);
  }

  get size(): number {
    return this.store.size;
  }
}

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly store = new Map<string, Workspace>();

  async save(workspace: Workspace): Promise<void> {
    this.store.set(workspace.id, workspace);
  }
  async findById(id: WorkspaceId): Promise<Workspace | null> {
    return this.store.get(id) ?? null;
  }
  async findFirst(): Promise<Workspace | null> {
    const all = [...this.store.values()].sort((a, b) => a.createdAt - b.createdAt);
    return all[0] ?? null;
  }
  async list(): Promise<Workspace[]> {
    return [...this.store.values()].sort((a, b) => a.createdAt - b.createdAt);
  }
}
