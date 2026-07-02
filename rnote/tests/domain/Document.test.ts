import { describe, it, expect } from 'vitest';
import { Document, DocumentContent } from '@domain/documents';
import { idFrom } from '@domain/shared';
import type { WorkspaceId } from '@domain/workspace';
import type { RichDoc } from '@domain/blocks';
import { FakeClock } from '../support/fakes';

const ws = idFrom<'Workspace'>('ws-1') as WorkspaceId;
const clock = new FakeClock();

const makeDoc = (title?: string) => {
  const result = Document.create({ workspaceId: ws, title }, clock);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const richDoc = (text: string): RichDoc => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

describe('Document.create', () => {
  it('applies sensible defaults and raises a created event', () => {
    const doc = makeDoc();
    expect(doc.parentId).toBeNull();
    expect(doc.isArchived).toBe(false);
    expect(doc.displayTitle).toBe('Untitled');
    expect(doc.content.isEmpty()).toBe(true);
    expect(doc.domainEvents.map((e) => e.name)).toContain('document.created');
  });

  it('trims the title', () => {
    expect(makeDoc('  Hello  ').title).toBe('Hello');
  });

  it('rejects an over-long title', () => {
    const result = Document.create({ workspaceId: ws, title: 'x'.repeat(201) }, clock);
    expect(result.ok).toBe(false);
  });
});

describe('Document.rename', () => {
  it('updates the title and raises a single event', () => {
    const doc = makeDoc('Old');
    doc.pullEvents();
    const result = doc.rename('New', clock);
    expect(result.ok).toBe(true);
    expect(doc.title).toBe('New');
    expect(doc.pullEvents().map((e) => e.name)).toEqual(['document.title-changed']);
  });

  it('is a no-op when the title is unchanged', () => {
    const doc = makeDoc('Same');
    doc.pullEvents();
    doc.rename('Same', clock);
    expect(doc.pullEvents()).toHaveLength(0);
  });
});

describe('Document.replaceContent', () => {
  it('replaces content and raises a content-changed event', () => {
    const doc = makeDoc();
    doc.pullEvents();
    const content = DocumentContent.fromJSON(richDoc('hello world'));
    if (!content.ok) throw new Error('bad content');
    doc.replaceContent(content.value, clock);
    expect(doc.content.toPlainText()).toBe('hello world');
    expect(doc.pullEvents().map((e) => e.name)).toEqual(['document.content-changed']);
  });

  it('ignores identical content', () => {
    const doc = makeDoc();
    const same = DocumentContent.empty();
    doc.pullEvents();
    doc.replaceContent(same, clock);
    expect(doc.pullEvents()).toHaveLength(0);
  });
});

describe('Document.moveTo', () => {
  it('prevents a document from parenting itself', () => {
    const doc = makeDoc();
    const result = doc.moveTo(doc.id, 0, clock);
    expect(result.ok).toBe(false);
  });

  it('moves under a new parent', () => {
    const doc = makeDoc();
    const parent = makeDoc('Parent');
    const result = doc.moveTo(parent.id, 5, clock);
    expect(result.ok).toBe(true);
    expect(doc.parentId).toBe(parent.id);
    expect(doc.position).toBe(5);
  });
});

describe('Document archive lifecycle', () => {
  it('archives and restores, each once', () => {
    const doc = makeDoc();
    doc.pullEvents();
    doc.archive(clock);
    doc.archive(clock); // idempotent
    expect(doc.isArchived).toBe(true);
    expect(doc.pullEvents().map((e) => e.name)).toEqual(['document.archived']);

    doc.restore(clock);
    expect(doc.isArchived).toBe(false);
    expect(doc.pullEvents().map((e) => e.name)).toEqual(['document.restored']);
  });
});
