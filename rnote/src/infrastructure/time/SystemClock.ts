import type { Clock } from '@domain/shared';

/** The real wall clock. Tests substitute a deterministic fake. */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}
