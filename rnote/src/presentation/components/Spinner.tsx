import { cn } from '../lib/cn';

export function Spinner({ className }: { className?: string }): JSX.Element {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary',
        className,
      )}
    />
  );
}
