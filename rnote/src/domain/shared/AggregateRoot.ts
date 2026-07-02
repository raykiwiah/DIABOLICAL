import { Entity } from './Entity';
import type { DomainEvent } from './DomainEvent';

/**
 * An aggregate root is the entry point to a cluster of objects treated as a
 * single unit for data changes. It records domain events raised during a
 * transaction; the application layer pulls and dispatches them after persisting.
 */
export abstract class AggregateRoot<TId extends string> extends Entity<TId> {
  private _events: DomainEvent[] = [];

  protected raise(event: DomainEvent): void {
    this._events.push(event);
  }

  get domainEvents(): readonly DomainEvent[] {
    return this._events;
  }

  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }
}
