import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, AlertCircle, X } from 'lucide-react';
import { useAiAccount } from '../state/aiAccount';

type Flash = { kind: 'ok'; text: string } | { kind: 'error'; text: string } | null;

/**
 * Feedback for the OpenRouter sign-in round trip. Returning from the provider
 * lands mid-boot with Settings closed, so without this the outcome is
 * invisible — a success flashes briefly, a failure sticks until dismissed.
 */
export function AiConnectToast(): JSX.Element {
  const account = useAiAccount((s) => s.account);
  const justConnected = useAiAccount((s) => s.justConnected);
  const ackConnected = useAiAccount((s) => s.ackConnected);
  const status = useAiAccount((s) => s.status);
  const error = useAiAccount((s) => s.error);
  const [flash, setFlash] = useState<Flash>(null);

  // The exchange can complete before React mounts (it runs at boot), so we key
  // off the store's explicit justConnected flag instead of a state transition.
  useEffect(() => {
    if (justConnected && account) {
      setFlash({
        kind: 'ok',
        text: `AI connected${account.email ? ` as ${account.email}` : ''} — using your own OpenRouter credits.`,
      });
      ackConnected();
      const timer = window.setTimeout(() => setFlash(null), 4200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [justConnected, account, ackConnected]);

  useEffect(() => {
    // Errors stick until dismissed; connect-gating errors surface in Settings
    // instead, so only show exchange/callback failures here.
    if (status === 'error' && error) setFlash({ kind: 'error', text: error });
  }, [status, error]);

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.kind + flash.text}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-lg"
        >
          {flash.kind === 'ok' ? (
            <Sparkles size={15} className="shrink-0 text-success" />
          ) : (
            <AlertCircle size={15} className="shrink-0 text-danger" />
          )}
          <span className="text-foreground">{flash.text}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setFlash(null)}
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-subtle hover:bg-surface-hover hover:text-foreground"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
