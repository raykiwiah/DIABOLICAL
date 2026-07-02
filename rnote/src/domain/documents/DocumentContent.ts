import { ok, err, type Result, domainError } from '../shared/Result';
import {
  type RichDoc,
  emptyDoc,
  isRichDoc,
  extractText,
  isEmptyDoc,
  countWords,
} from '../blocks/RichContent';

/**
 * DocumentContent — an immutable value object wrapping a document's block tree.
 *
 * It guards the invariant that content is always a valid `doc` node and exposes
 * read models the rest of the system needs (plain text for search, word count,
 * emptiness) without leaking the raw structure everywhere.
 */
export class DocumentContent {
  private constructor(private readonly doc: RichDoc) {}

  static empty(): DocumentContent {
    return new DocumentContent(emptyDoc());
  }

  static fromJSON(value: unknown): Result<DocumentContent> {
    if (!isRichDoc(value)) {
      return err(
        domainError('content.invalid', 'Content must be a ProseMirror `doc` node.'),
      );
    }
    return ok(new DocumentContent(value));
  }

  /** Trusted rehydration from persistence (already validated on the way in). */
  static rehydrate(doc: RichDoc): DocumentContent {
    return new DocumentContent(doc);
  }

  toJSON(): RichDoc {
    return this.doc;
  }

  toPlainText(): string {
    return extractText(this.doc).replace(/\n{2,}/g, '\n').trim();
  }

  /** A short single-line preview for list rows and search results. */
  preview(maxLength = 140): string {
    const text = this.toPlainText().replace(/\n/g, ' · ');
    return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
  }

  isEmpty(): boolean {
    return isEmptyDoc(this.doc);
  }

  wordCount(): number {
    return countWords(this.doc);
  }

  equals(other: DocumentContent): boolean {
    return JSON.stringify(this.doc) === JSON.stringify(other.doc);
  }
}
