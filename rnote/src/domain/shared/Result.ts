/**
 * A functional Result type.
 *
 * Domain and application code never throws for *expected* failures (validation,
 * not-found, conflicts). Instead it returns `Result`, forcing callers to handle
 * both branches. Exceptions are reserved for truly exceptional, programmer-error
 * situations. This keeps control flow explicit and testable.
 */
export type Result<T, E = DomainError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok;

/** A structured, serialisable domain error. */
export interface DomainError {
  readonly code: string;
  readonly message: string;
}

export const domainError = (code: string, message: string): DomainError => ({
  code,
  message,
});
