import { useEffect } from 'react';
import { usePreferences } from '../state/preferences';

const INTERACTIVE = 'button, a[href], [role="button"], [role="radio"], [role="tab"], summary';

/**
 * Under the Odysseus skin, pressing an interactive element sends a soft ripple
 * across the surface — buttons ripple like water. The splash is a throwaway
 * element fixed at the pointer, so it never mutates or clips what was pressed.
 * Disabled entirely on other skins and when reduced motion is requested.
 */
export function useOdysseusRipple(): void {
  const skin = usePreferences((s) => s.skin);

  useEffect(() => {
    if (skin !== 'odysseus') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const onDown = (e: PointerEvent): void => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest(INTERACTIVE)) return;
      const ripple = document.createElement('span');
      ripple.className = 'rn-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      const cleanup = (): void => ripple.remove();
      ripple.addEventListener('animationend', cleanup);
      window.setTimeout(cleanup, 900);
    };

    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [skin]);
}
