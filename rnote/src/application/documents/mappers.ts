import type { Document } from '@domain/documents';
import type { DocumentDetail, DocumentSummary, DocumentTreeNode } from '../dto';

export function toSummary(doc: Document): DocumentSummary {
  return {
    id: doc.id,
    title: doc.displayTitle,
    icon: doc.icon,
    parentId: doc.parentId,
    position: doc.position,
    preview: doc.content.preview(),
    isArchived: doc.isArchived,
    updatedAt: doc.updatedAt,
  };
}

export function toDetail(doc: Document): DocumentDetail {
  return {
    id: doc.id,
    workspaceId: doc.workspaceId,
    parentId: doc.parentId,
    title: doc.title,
    icon: doc.icon,
    content: doc.content.toJSON(),
    wordCount: doc.content.wordCount(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Assemble a nested tree from a flat list of summaries. Siblings are ordered by
 * `position` then title. Orphans (whose parent is archived/missing) surface at
 * the root so nothing is ever hidden by a broken link.
 */
export function buildTree(summaries: readonly DocumentSummary[]): DocumentTreeNode[] {
  const nodes = new Map<string, DocumentTreeNode>();
  for (const summary of summaries) {
    nodes.set(summary.id, { ...summary, children: [] });
  }

  const roots: DocumentTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (list: DocumentTreeNode[]): void => {
    list.sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
    for (const child of list) sort(child.children);
  };
  sort(roots);
  return roots;
}
