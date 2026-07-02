import { Sun, Moon } from 'lucide-react';
import { usePreferences, type ModeName } from '../state/preferences';
import { IconButton } from './IconButton';
import { cn } from '../lib/cn';

/** Compact controls for the two presentation axes: theme and personality mode. */
export function ThemeModeControls(): JSX.Element {
  const theme = usePreferences((s) => s.theme);
  const mode = usePreferences((s) => s.mode);
  const toggleTheme = usePreferences((s) => s.toggleTheme);
  const setMode = usePreferences((s) => s.setMode);

  return (
    <div className="flex items-center justify-between">
      <div
        role="radiogroup"
        aria-label="Mode"
        className="flex items-center rounded-md border border-border bg-background p-0.5"
      >
        {(['millennial', 'genz'] as ModeName[]).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-medium transition-colors',
              mode === m
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'genz' ? 'Gen Z' : 'Millennial'}
          </button>
        ))}
      </div>

      <IconButton
        label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </IconButton>
    </div>
  );
}
