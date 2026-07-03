import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Check, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../state/workspace';
import { Kbd } from '../components/Kbd';

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Frictionless capture — jot a thought from anywhere (⌘⇧N). It appends to a
 * single "Inbox" page and stays open for rapid entry, never navigating away.
 */
export function QuickCapture({ open, onClose }: QuickCaptureProps): JSX.Element | null {
  const quickCapture = useWorkspace((s) => s.quickCapture);
  const openToday = useWorkspace((s) => s.openToday);
  const [value, setValue] = useState('');
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setCount(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (): Promise<void> => {
    const text = value.trim();
    if (!text) return;
    setValue('');
    await quickCapture(text);
    setCount((c) => c + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Quick capture"
    >
      <motion.div
        className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="rn-panel relative w-full max-w-[560px] overflow-hidden shadow-lg"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <Zap size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Quick capture</span>
          {count > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-success">
              <Check size={13} /> {count} added to Inbox
            </span>
          )}
        </div>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={3}
          placeholder="What's on your mind? Press Enter to capture."
          className="w-full resize-none bg-transparent px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-subtle"
        />
        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-subtle">
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> capture
          </span>
          <span className="flex items-center gap-1">
            <Kbd>⇧↵</Kbd> new line
          </span>
          <span className="flex items-center gap-1">
            <Kbd>esc</Kbd> close
          </span>
          <button
            type="button"
            onClick={() => {
              void openToday();
              onClose();
            }}
            className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Today&apos;s note <ArrowRight size={12} />
          </button>
        </div>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center"
          >
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              Captured ✓
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
