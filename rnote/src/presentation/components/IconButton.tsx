import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label — required because the button has no visible text. */
  label: string;
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-muted-foreground',
        'transition-colors duration-[var(--duration-fast)] hover:text-foreground',
        'hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
