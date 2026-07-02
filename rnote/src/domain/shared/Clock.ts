/**
 * Time is an injected dependency, never read directly from `Date.now()` inside
 * the domain. This makes every time-dependent behaviour deterministic in tests.
 */
export interface Clock {
  now(): number;
}
