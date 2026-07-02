import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { cn } from '../lib/cn';

const EMOJIS = [
  '📄', '📝', '📌', '📚', '💡', '✅', '🎯', '🚀', '🔥', '⭐',
  '❤️', '🧠', '💰', '📊', '📈', '🗓️', '⏰', '🎨', '🎵', '🍿',
  '🏋️', '🥗', '✈️', '🏠', '🙏', '🌙', '☀️', '🌱', '🐳', '🦋',
  '☕', '🎮', '📷', '🔒', '⚡', '🌈',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change page icon"
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-xl text-4xl leading-none',
          'transition-colors hover:bg-surface-hover',
          !value && 'text-2xl text-subtle',
        )}
      >
        {value || '＋'}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="rn-panel absolute left-0 top-16 z-40 w-[280px] p-2"
        >
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-subtle">
              Icon
            </span>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-xl hover:bg-surface-hover"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
