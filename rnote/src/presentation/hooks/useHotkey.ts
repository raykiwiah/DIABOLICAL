import { useEffect } from 'react';

export interface HotkeyOptions {
  /** Require ⌘ (mac) or Ctrl (win/linux). */
  meta?: boolean;
  shift?: boolean;
  /** Fire even while focus is in an input/textarea/contenteditable. */
  allowInEditable?: boolean;
}

const isEditable = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
};

/** Register a global keyboard shortcut for the lifetime of the component. */
export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const metaOk = options.meta ? event.metaKey || event.ctrlKey : true;
      const shiftOk = options.shift ? event.shiftKey : true;
      if (event.key.toLowerCase() !== key.toLowerCase() || !metaOk || !shiftOk) return;
      if (!options.allowInEditable && !(options.meta && (event.metaKey || event.ctrlKey))) {
        if (isEditable(event.target)) return;
      }
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, options.meta, options.shift, options.allowInEditable]);
}
