/** Lightweight cross-surface UI events (dispatched on `window`). */
export const OPEN_TEMPLATES_EVENT = 'rnote:new-from-template';

export function emit(name: string): void {
  window.dispatchEvent(new Event(name));
}
