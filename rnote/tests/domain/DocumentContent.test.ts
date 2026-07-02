import { describe, it, expect } from 'vitest';
import { DocumentContent } from '@domain/documents';
import type { RichDoc } from '@domain/blocks';

const doc: RichDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Hello brave new world' }] },
  ],
};

describe('DocumentContent', () => {
  it('treats a fresh doc as empty', () => {
    expect(DocumentContent.empty().isEmpty()).toBe(true);
    expect(DocumentContent.empty().wordCount()).toBe(0);
  });

  it('rejects non-doc JSON', () => {
    expect(DocumentContent.fromJSON({ type: 'paragraph' }).ok).toBe(false);
    expect(DocumentContent.fromJSON(null).ok).toBe(false);
  });

  it('extracts plain text across blocks', () => {
    const content = DocumentContent.fromJSON(doc);
    if (!content.ok) throw new Error('expected valid content');
    expect(content.value.toPlainText()).toBe('Title\nHello brave new world');
    expect(content.value.wordCount()).toBe(5);
    expect(content.value.isEmpty()).toBe(false);
  });

  it('builds a single-line preview', () => {
    const content = DocumentContent.fromJSON(doc);
    if (!content.ok) throw new Error('expected valid content');
    expect(content.value.preview()).toBe('Title · Hello brave new world');
  });

  it('compares by value', () => {
    const a = DocumentContent.fromJSON(doc);
    const b = DocumentContent.fromJSON(doc);
    if (!a.ok || !b.ok) throw new Error('expected valid content');
    expect(a.value.equals(b.value)).toBe(true);
    expect(a.value.equals(DocumentContent.empty())).toBe(false);
  });
});
