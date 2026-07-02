/**
 * Base class for entities — objects defined by identity rather than attributes.
 * Two entities are equal iff they share the same id, regardless of their state.
 */
export abstract class Entity<TId extends string> {
  protected constructor(public readonly id: TId) {}

  equals(other?: Entity<TId> | null): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}
