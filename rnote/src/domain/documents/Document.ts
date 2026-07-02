import { AggregateRoot } from '../shared/AggregateRoot';
import { createId, type UniqueId } from '../shared/Id';
import { ok, err, type Result, domainError } from '../shared/Result';
import type { Clock } from '../shared/Clock';
import type { WorkspaceId } from '../workspace/Workspace';
import { DocumentContent } from './DocumentContent';
import type { DocumentTitleChanged, DocumentMoved } from './events';

export type DocumentId = UniqueId<'Document'>;

export const TITLE_MAX_LENGTH = 200;
export const DEFAULT_ICON = '';

export interface DocumentProps {
  workspaceId: WorkspaceId;
  parentId: DocumentId | null;
  title: string;
  icon: string;
  content: DocumentContent;
  position: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateDocumentInput {
  workspaceId: WorkspaceId;
  parentId?: DocumentId | null;
  title?: string;
  icon?: string;
  content?: DocumentContent;
  position?: number;
}

/**
 * Document — the central aggregate of RNOTE. A page of blocks that can nest
 * under another page to form the workspace tree. It owns its content and guards
 * its own invariants (title length, no self-parenting); anything requiring
 * knowledge of *other* documents (cycle detection across the tree) is the
 * application layer's job.
 */
export class Document extends AggregateRoot<DocumentId> {
  private constructor(
    id: DocumentId,
    private props: DocumentProps,
  ) {
    super(id);
  }

  static create(input: CreateDocumentInput, clock: Clock): Result<Document> {
    const title = (input.title ?? '').trim();
    if (title.length > TITLE_MAX_LENGTH) {
      return err(
        domainError('document.title-too-long', `Title exceeds ${TITLE_MAX_LENGTH} characters.`),
      );
    }

    const now = clock.now();
    const id = createId<'Document'>();
    const doc = new Document(id, {
      workspaceId: input.workspaceId,
      parentId: input.parentId ?? null,
      title,
      icon: input.icon ?? DEFAULT_ICON,
      content: input.content ?? DocumentContent.empty(),
      position: input.position ?? now,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
    doc.raise({ name: 'document.created', aggregateId: id, occurredAt: now });
    return ok(doc);
  }

  /** Reconstitute from persistence without running creation side effects. */
  static rehydrate(id: DocumentId, props: DocumentProps): Document {
    return new Document(id, props);
  }

  // ── Reads ────────────────────────────────────────────────────────────────
  get workspaceId(): WorkspaceId {
    return this.props.workspaceId;
  }
  get parentId(): DocumentId | null {
    return this.props.parentId;
  }
  get title(): string {
    return this.props.title;
  }
  /** A never-empty label for the UI. */
  get displayTitle(): string {
    return this.props.title.trim() || 'Untitled';
  }
  get icon(): string {
    return this.props.icon;
  }
  get content(): DocumentContent {
    return this.props.content;
  }
  get position(): number {
    return this.props.position;
  }
  get isArchived(): boolean {
    return this.props.isArchived;
  }
  get createdAt(): number {
    return this.props.createdAt;
  }
  get updatedAt(): number {
    return this.props.updatedAt;
  }

  // ── Behaviour ──────────────────────────────────────────────────────────────
  rename(title: string, clock: Clock): Result<void> {
    const next = title.trim();
    if (next.length > TITLE_MAX_LENGTH) {
      return err(
        domainError('document.title-too-long', `Title exceeds ${TITLE_MAX_LENGTH} characters.`),
      );
    }
    if (next === this.props.title) return ok(undefined);
    this.props.title = next;
    this.touch(clock);
    const event: DocumentTitleChanged = {
      name: 'document.title-changed',
      aggregateId: this.id,
      occurredAt: this.props.updatedAt,
      title: next,
    };
    this.raise(event);
    return ok(undefined);
  }

  changeIcon(icon: string, clock: Clock): void {
    if (icon === this.props.icon) return;
    this.props.icon = icon;
    this.touch(clock);
  }

  replaceContent(content: DocumentContent, clock: Clock): void {
    if (content.equals(this.props.content)) return;
    this.props.content = content;
    this.touch(clock);
    this.raise({
      name: 'document.content-changed',
      aggregateId: this.id,
      occurredAt: this.props.updatedAt,
    });
  }

  moveTo(parentId: DocumentId | null, position: number, clock: Clock): Result<void> {
    if (parentId !== null && parentId === this.id) {
      return err(domainError('document.self-parent', 'A document cannot be its own parent.'));
    }
    this.props.parentId = parentId;
    this.props.position = position;
    this.touch(clock);
    const event: DocumentMoved = {
      name: 'document.moved',
      aggregateId: this.id,
      occurredAt: this.props.updatedAt,
      parentId,
    };
    this.raise(event);
    return ok(undefined);
  }

  reorder(position: number, clock: Clock): void {
    if (position === this.props.position) return;
    this.props.position = position;
    this.touch(clock);
  }

  archive(clock: Clock): void {
    if (this.props.isArchived) return;
    this.props.isArchived = true;
    this.touch(clock);
    this.raise({ name: 'document.archived', aggregateId: this.id, occurredAt: this.props.updatedAt });
  }

  restore(clock: Clock): void {
    if (!this.props.isArchived) return;
    this.props.isArchived = false;
    this.touch(clock);
    this.raise({ name: 'document.restored', aggregateId: this.id, occurredAt: this.props.updatedAt });
  }

  private touch(clock: Clock): void {
    this.props.updatedAt = clock.now();
  }

  /** A plain snapshot for mappers/persistence — never share `props` by reference. */
  toSnapshot(): DocumentProps & { id: DocumentId } {
    return { id: this.id, ...this.props };
  }
}
