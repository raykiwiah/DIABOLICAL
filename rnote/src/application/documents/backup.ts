import type { Document } from '@domain/documents';
import type { RichDoc } from '@domain/blocks';

/** A single document in a portable backup. Ids are workspace-relative. */
export interface BackupDocument {
  id: string;
  parentId: string | null;
  title: string;
  icon: string;
  content: RichDoc;
  position: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

/** The on-disk backup envelope. Versioned so future imports can migrate. */
export interface WorkspaceBackup {
  format: 'rnote.backup';
  version: 1;
  exportedAt: number;
  workspaceName: string;
  documents: BackupDocument[];
}

export function toBackupDocument(document: Document): BackupDocument {
  return {
    id: document.id,
    parentId: document.parentId,
    title: document.title,
    icon: document.icon,
    content: document.content.toJSON(),
    position: document.position,
    isArchived: document.isArchived,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function isWorkspaceBackup(value: unknown): value is WorkspaceBackup {
  const v = value as Partial<WorkspaceBackup> | null;
  return (
    typeof v === 'object' &&
    v !== null &&
    v.format === 'rnote.backup' &&
    Array.isArray(v.documents)
  );
}
