import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ChevronRight, Plus, MoreHorizontal, Trash2, PenLine, FileText } from 'lucide-react';
import type { DocumentTreeNode } from '@application/dto';
import { useWorkspace } from '../state/workspace';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { cn } from '../lib/cn';

// Shared across sibling tree items for the duration of a drag. A module-level
// ref is the reliable way to read the dragged id during `dragover` (the
// DataTransfer payload is not readable there for security reasons).
let draggedId: string | null = null;

type DropZone = 'before' | 'after' | 'inside' | null;

interface DocTreeItemProps {
  node: DocumentTreeNode;
  depth: number;
}

export function DocTreeItem({ node, depth }: DocTreeItemProps): JSX.Element {
  const activeId = useWorkspace((s) => s.activeId);
  const expanded = useWorkspace((s) => s.expanded[node.id] ?? false);
  const open = useWorkspace((s) => s.open);
  const toggleExpanded = useWorkspace((s) => s.toggleExpanded);
  const createDocument = useWorkspace((s) => s.createDocument);
  const rename = useWorkspace((s) => s.rename);
  const archive = useWorkspace((s) => s.archive);
  const move = useWorkspace((s) => s.move);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [dropZone, setDropZone] = useState<DropZone>(null);
  const [dragging, setDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const hasChildren = node.children.length > 0;
  const isActive = activeId === node.id;

  const commitRename = (): void => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== node.title) rename(node.id, next);
    else setDraft(node.title);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    if (!draggedId || draggedId === node.id) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDropZone(y < rect.height * 0.28 ? 'before' : y > rect.height * 0.72 ? 'after' : 'inside');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const id = draggedId;
    const zone = dropZone;
    draggedId = null;
    setDropZone(null);
    if (!id || id === node.id || !zone) return;
    // Positions are ordering keys; a half-step lands the item just before/after
    // the target. Cross-tree cycles are rejected by the move use case.
    if (zone === 'inside') {
      void move(id, node.id, Date.now());
      if (!expanded) toggleExpanded(node.id);
    } else if (zone === 'before') {
      void move(id, node.parentId, node.position - 0.5);
    } else {
      void move(id, node.parentId, node.position + 0.5);
    }
  };

  return (
    <div>
      <div
        draggable={!editing}
        onDragStart={(e) => {
          draggedId = node.id;
          setDragging(true);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', node.id);
        }}
        onDragEnd={() => {
          draggedId = null;
          setDragging(false);
          setDropZone(null);
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropZone(null)}
        onDrop={handleDrop}
        className={cn(
          'group/item relative flex items-center gap-1 rounded-md pr-1 text-sm',
          'transition-colors',
          isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-surface-hover',
          dropZone === 'inside' && 'ring-2 ring-inset ring-primary/50',
          dragging && 'opacity-40',
        )}
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        {dropZone === 'before' && (
          <span className="pointer-events-none absolute inset-x-1 -top-px h-0.5 rounded-full bg-primary" />
        )}
        {dropZone === 'after' && (
          <span className="pointer-events-none absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" />
        )}
        <button
          type="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={() => toggleExpanded(node.id)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtle',
            'hover:bg-border/60',
            !hasChildren && 'invisible',
          )}
        >
          <ChevronRight
            size={14}
            className={cn('transition-transform', expanded && 'rotate-90')}
          />
        </button>

        <button
          type="button"
          onClick={() => open(node.id)}
          onDoubleClick={() => {
            setDraft(node.title);
            setEditing(true);
          }}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
        >
          <span className="w-4 shrink-0 text-center text-[15px] leading-none">
            {node.icon || <FileText size={14} className="mx-auto text-subtle" strokeWidth={1.75} />}
          </span>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setDraft(node.title);
                  setEditing(false);
                }
              }}
              className="min-w-0 flex-1 rounded bg-surface px-1 py-0 text-sm text-foreground outline-none ring-1 ring-primary"
            />
          ) : (
            <span className="truncate">{node.title}</span>
          )}
        </button>

        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/item:opacity-100">
          <button
            type="button"
            aria-label="Add subpage"
            onClick={() => createDocument(node.id)}
            className="flex h-6 w-6 items-center justify-center rounded text-subtle hover:bg-border/60 hover:text-foreground"
          >
            <Plus size={15} />
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="Page actions"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded text-subtle hover:bg-border/60 hover:text-foreground"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="rn-panel absolute right-0 top-7 z-40 w-44 p-1 text-sm">
                <MenuButton
                  icon={<PenLine size={14} />}
                  label="Rename"
                  onClick={() => {
                    setMenuOpen(false);
                    setDraft(node.title);
                    setEditing(true);
                  }}
                />
                <MenuButton
                  icon={<Plus size={14} />}
                  label="Add subpage"
                  onClick={() => {
                    setMenuOpen(false);
                    createDocument(node.id);
                  }}
                />
                <MenuButton
                  icon={<Trash2 size={14} />}
                  label="Move to Trash"
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    archive(node.id);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded &&
        node.children.map((child) => (
          <DocTreeItem key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  danger?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left',
        danger ? 'text-danger hover:bg-danger/10' : 'text-foreground hover:bg-surface-hover',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
