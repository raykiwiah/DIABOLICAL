import { useEffect, type RefObject } from 'react';

/** Invoke `handler` when a pointer or focus event lands outside `ref`. */
export function useOnClickOutside(
  ref: RefObject<HTMLElement>,
  handler: () => void,
  active = true,
): void {
  useEffect(() => {
    if (!active) return;
    const listener = (event: MouseEvent | TouchEvent): void => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, active]);
}
