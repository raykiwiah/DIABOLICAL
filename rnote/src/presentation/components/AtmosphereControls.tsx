import { Compass } from 'lucide-react';
import { usePreferences, type SkinName } from '../state/preferences';
import { cn } from '../lib/cn';

const SKINS: { id: SkinName; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'odysseus', label: 'Odysseus' },
];

/**
 * Compact switch between the Default and Odysseus atmospheres. Switching is
 * instant and purely presentational — no stored data is touched.
 */
export function AtmosphereControls(): JSX.Element {
  const skin = usePreferences((s) => s.skin);
  const setSkin = usePreferences((s) => s.setSkin);

  return (
    <div
      role="radiogroup"
      aria-label="Atmosphere"
      className="flex items-center rounded-md border border-border bg-background p-0.5"
    >
      {SKINS.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={skin === s.id}
          onClick={() => setSkin(s.id)}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            skin === s.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {s.id === 'odysseus' && <Compass size={11} />}
          {s.label}
        </button>
      ))}
    </div>
  );
}
