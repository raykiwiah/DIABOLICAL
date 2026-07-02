import type { RichDoc } from '@domain/blocks';

/**
 * Read models returned to the presentation layer. The UI never touches domain
 * entities directly — it consumes these plain, serialisable shapes. This keeps
 * React ignorant of domain internals and makes the boundary explicit.
 */
export interface DocumentSummary {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  position: number;
  preview: string;
  isArchived: boolean;
  updatedAt: number;
}

export interface DocumentTreeNode extends DocumentSummary {
  children: DocumentTreeNode[];
}

export interface DocumentDetail {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string;
  content: RichDoc;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  createdAt: number;
}
