import { nanoid } from 'nanoid';

/**
 * Branded identifiers.
 *
 * A raw `string` id is easy to mix up (passing a WorkspaceId where a DocumentId
 * belongs). Branding makes each id nominally distinct at compile time while
 * remaining a plain string at runtime — zero cost, maximum safety.
 */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type UniqueId<B extends string> = Brand<string, B>;

/** Length chosen for ~unguessable ids without being unwieldy in URLs. */
const ID_LENGTH = 16;

export function createId<B extends string>(): UniqueId<B> {
  return nanoid(ID_LENGTH) as UniqueId<B>;
}

/** Rehydrate an id from a persisted / external string. */
export function idFrom<B extends string>(value: string): UniqueId<B> {
  return value as UniqueId<B>;
}
