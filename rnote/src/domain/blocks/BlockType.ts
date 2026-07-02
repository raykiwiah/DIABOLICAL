/**
 * The vocabulary of blocks RNOTE understands.
 *
 * This is the domain's canonical list — the editor (presentation) maps these to
 * ProseMirror nodes, and future features (block databases, transforms) reason
 * over the same enum. Adding a block type starts here.
 */
export const BLOCK_TYPES = [
  'paragraph',
  'heading1',
  'heading2',
  'heading3',
  'bulletList',
  'orderedList',
  'taskList',
  'quote',
  'code',
  'divider',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export function isBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(value);
}
