import type { DomainEvent } from '../shared/DomainEvent';

/**
 * Document lifecycle events. The search-index projector and (future) sync engine
 * subscribe to these rather than reaching into the aggregate.
 */
export interface DocumentCreated extends DomainEvent {
  name: 'document.created';
}

export interface DocumentContentChanged extends DomainEvent {
  name: 'document.content-changed';
}

export interface DocumentTitleChanged extends DomainEvent {
  name: 'document.title-changed';
  title: string;
}

export interface DocumentMoved extends DomainEvent {
  name: 'document.moved';
  parentId: string | null;
}

export interface DocumentArchived extends DomainEvent {
  name: 'document.archived';
}

export interface DocumentRestored extends DomainEvent {
  name: 'document.restored';
}

export type DocumentEvent =
  | DocumentCreated
  | DocumentContentChanged
  | DocumentTitleChanged
  | DocumentMoved
  | DocumentArchived
  | DocumentRestored;
