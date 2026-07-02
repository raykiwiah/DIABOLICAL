import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** A keyboard-key affordance, e.g. ⌘ K. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1.5',
        'border border-border bg-surface-hover font-mono text-[11px] font-medium',
        'text-muted-foreground shadow-xs',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
