/**
 * A minimal, structural description of a ProseMirror/Tiptap document.
 *
 * The domain does not depend on Tiptap; it only knows the shape of the JSON that
 * flows through it. Keeping these types here (rather than importing from Tiptap)
 * preserves the dependency rule: nothing in `domain/` imports a framework.
 */
export interface RichMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
}

export interface RichDoc extends RichNode {
  type: 'doc';
  content?: RichNode[];
}

/** The canonical empty document: a single empty paragraph. */
export function emptyDoc(): RichDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function isRichDoc(value: unknown): value is RichDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'doc'
  );
}

/**
 * Extract readable plain text from a document, inserting line breaks between
 * block-level nodes. Used to build the search index and previews. Pure and
 * recursion-safe for the shallow trees produced by the editor.
 */
export function extractText(node: RichNode): string {
  if (node.text) return node.text;
  if (!node.content || node.content.length === 0) return '';

  const blockLevel = node.type === 'doc' || /list|heading|paragraph|blockquote/i.test(node.type);
  const separator = blockLevel ? '\n' : '';
  return node.content.map(extractText).join(separator);
}

export function isEmptyDoc(doc: RichDoc): boolean {
  return extractText(doc).trim().length === 0;
}

export function countWords(doc: RichDoc): number {
  const text = extractText(doc).trim();
  if (text.length === 0) return 0;
  return text.split(/\s+/).length;
}
