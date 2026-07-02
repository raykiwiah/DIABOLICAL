import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useWorkspace } from '../state/workspace';
import { TEMPLATES } from './templates';

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
}

/** A gallery of starting points; picking one seeds a new page and opens it. */
export function TemplatePicker({ open, onClose }: TemplatePickerProps): JSX.Element | null {
  const createFromTemplate = useWorkspace((s) => s.createFromTemplate);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a template"
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
        className="rn-panel relative w-full max-w-[640px] overflow-hidden shadow-lg"
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">New page from template</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface-hover hover:text-foreground"
          >
            <X size={16} />
          </button>
        </header>

        <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                void createFromTemplate(template);
                onClose();
              }}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition hover:border-primary/40 hover:bg-surface-hover hover:shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                {template.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {template.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {template.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
