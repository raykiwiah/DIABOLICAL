/**
 * Full-text search boundary. Implemented with FlexSearch in infrastructure, but
 * the application only knows this contract, so the engine is replaceable.
 */
export interface SearchEntry {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
}

export interface SearchHit {
  id: string;
  title: string;
  snippet: string;
}

export interface SearchIndexPort {
  upsert(entry: SearchEntry): void;
  remove(id: string): void;
  search(workspaceId: string, query: string, limit?: number): SearchHit[];
  clear(): void;
}
