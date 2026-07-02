import FlexSearch from 'flexsearch';
import type { Document as FlexDocumentType } from 'flexsearch';
import type { SearchEntry, SearchHit, SearchIndexPort } from '@application/ports/SearchIndex';

// The FlexSearch ESM bundle only exposes a default export, while its type
// definitions expose named classes. Bind the value from the default and the
// type from the named export so both the compiler and the bundler are satisfied.
const FlexDocument = FlexSearch.Document;

interface IndexedDoc {
  id: string;
  title: string;
  body: string;
}

/**
 * FlexSearch-backed full-text index (client-side, in-memory).
 *
 * FlexSearch handles tokenisation/ranking; we keep a parallel `store` so we can
 * (a) filter hits to a workspace and (b) build snippets, without depending on
 * FlexSearch's document-store enrichment. The index is rebuilt from persistence
 * on boot via `DocumentService.reindexWorkspace`.
 */
export class FlexSearchIndex implements SearchIndexPort {
  private index: FlexDocumentType<IndexedDoc> = FlexSearchIndex.createIndex();
  private readonly store = new Map<string, SearchEntry>();

  private static createIndex(): FlexDocumentType<IndexedDoc> {
    return new FlexDocument<IndexedDoc>({
      document: { id: 'id', index: ['title', 'body'] },
      tokenize: 'forward',
    });
  }

  upsert(entry: SearchEntry): void {
    this.store.set(entry.id, entry);
    // `add` upserts in FlexSearch when the id already exists.
    this.index.add({ id: entry.id, title: entry.title, body: entry.body });
  }

  remove(id: string): void {
    this.store.delete(id);
    this.index.remove(id);
  }

  search(workspaceId: string, query: string, limit = 20): SearchHit[] {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];

    const groups = this.index.search(trimmed, limit * 4);
    const seen = new Set<string>();
    const hits: SearchHit[] = [];

    for (const group of groups) {
      for (const rawId of group.result) {
        const id = String(rawId);
        if (seen.has(id)) continue;
        seen.add(id);

        const entry = this.store.get(id);
        if (!entry || entry.workspaceId !== workspaceId) continue;

        hits.push({ id, title: entry.title, snippet: makeSnippet(entry.body, trimmed) });
        if (hits.length >= limit) return hits;
      }
    }
    return hits;
  }

  clear(): void {
    this.store.clear();
    this.index = FlexSearchIndex.createIndex();
  }
}

/** Build a compact, query-centred excerpt from a body of text. */
function makeSnippet(body: string, query: string, radius = 64): string {
  const clean = body.replace(/\s+/g, ' ').trim();
  if (clean.length === 0) return '';

  const token = query.split(/\s+/)[0]?.toLowerCase() ?? '';
  const at = token ? clean.toLowerCase().indexOf(token) : -1;
  if (at === -1) {
    return clean.length > radius * 2 ? `${clean.slice(0, radius * 2)}…` : clean;
  }

  const start = Math.max(0, at - radius);
  const end = Math.min(clean.length, at + token.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < clean.length ? '…' : '';
  return `${prefix}${clean.slice(start, end)}${suffix}`;
}
