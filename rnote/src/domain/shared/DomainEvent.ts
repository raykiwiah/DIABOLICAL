/**
 * Something meaningful that happened in the domain. Events are how aggregates
 * communicate side effects (e.g. "reindex this document for search") without
 * depending on infrastructure — the application layer dispatches them.
 */
export interface DomainEvent {
  readonly name: string;
  readonly aggregateId: string;
  readonly occurredAt: number;
}
