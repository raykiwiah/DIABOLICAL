import { Document, DocumentContent, type DocumentProps } from '@domain/documents';
import { Workspace } from '@domain/workspace';
import { idFrom } from '@domain/shared';
import { ROOT_PARENT, type DocumentRecord, type WorkspaceRecord } from './records';

export function documentToRecord(document: Document): DocumentRecord {
  const s = document.toSnapshot();
  return {
    id: s.id,
    workspaceId: s.workspaceId,
    parentId: s.parentId ?? ROOT_PARENT,
    title: s.title,
    icon: s.icon,
    content: s.content.toJSON(),
    position: s.position,
    isArchived: s.isArchived ? 1 : 0,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function recordToDocument(record: DocumentRecord): Document {
  const props: DocumentProps = {
    workspaceId: idFrom<'Workspace'>(record.workspaceId),
    parentId: record.parentId === ROOT_PARENT ? null : idFrom<'Document'>(record.parentId),
    title: record.title,
    icon: record.icon,
    content: DocumentContent.rehydrate(record.content),
    position: record.position,
    isArchived: record.isArchived === 1,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  return Document.rehydrate(idFrom<'Document'>(record.id), props);
}

export function workspaceToRecord(workspace: Workspace): WorkspaceRecord {
  const s = workspace.toSnapshot();
  return { id: s.id, name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt };
}

export function recordToWorkspace(record: WorkspaceRecord): Workspace {
  return Workspace.rehydrate(idFrom<'Workspace'>(record.id), {
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
