import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CloudOff, Wifi } from 'lucide-react';
import { useConnectivity } from '../state/connectivity';

/**
 * A quiet status toast for the *automatic* side of connectivity: when the user
 * prefers Online but the device drops the connection, we surface a persistent
 * "you're offline, work still saves" note, and a brief "back online" when it
 * returns. Choosing Offline yourself is a steady state and stays silent.
 */
export function ConnectivityToast(): JSX.Element {
  const autoOffline = useConnectivity((s) => s.autoOffline);
  const [reconnected, setReconnected] = useState(false);
  const wasAutoOffline = useRef(autoOffline);

  useEffect(() => {
    if (wasAutoOffline.current && !autoOffline) {
      // Forced-offline -> online: celebrate the reconnect, then fade out.
      setReconnected(true);
      const timer = window.setTimeout(() => setReconnected(false), 2600);
      wasAutoOffline.current = autoOffline;
      return () => window.clearTimeout(timer);
    }
    wasAutoOffline.current = autoOffline;
    return undefined;
  }, [autoOffline]);

  const show = autoOffline || reconnected;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={autoOffline ? 'offline' : 'online'}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-lg"
        >
          {autoOffline ? (
            <>
              <CloudOff size={16} className="shrink-0 text-warning" />
              <span className="text-foreground">
                You’re offline — RNOTE switched to local-only.{' '}
                <span className="text-subtle">Everything keeps saving.</span>
              </span>
            </>
          ) : (
            <>
              <Wifi size={16} className="shrink-0 text-success" />
              <span className="text-foreground">Back online.</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
