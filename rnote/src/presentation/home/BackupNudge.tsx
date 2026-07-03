import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import type { DocumentTreeNode } from '@application/dto';
import { useWorkspace } from '../state/workspace';
import { downloadFile } from '../lib/files';
import { markBackedUp, snoozeBackupNudge, shouldNudgeBackup } from '../lib/backupState';

/** A gentle, dismissable reminder to export a backup (data lives in-browser). */
export function BackupNudge(): JSX.Element | null {
  const tree = useWorkspace((s) => s.tree);
  const buildBackup = useWorkspace((s) => s.buildBackup);
  const [visible, setVisible] = useState(false);

  const pageCount = useMemo(() => countNodes(tree), [tree]);

  useEffect(() => {
    setVisible(shouldNudgeBackup(pageCount));
  }, [pageCount]);

  if (!visible) return null;

  const doExport = async (): Promise<void> => {
    const backup = await buildBackup();
    downloadFile(
      `rnote-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
    );
    markBackedUp();
    setVisible(false);
  };

  const dismiss = (): void => {
    snoozeBackupNudge();
    setVisible(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 flex items-center gap-3 rounded-lg border border-border border-l-2 border-l-warning bg-surface p-3"
    >
      <ShieldAlert size={18} className="shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Back up your notes</p>
        <p className="text-xs text-muted-foreground">
          Everything lives in this browser. Export a backup so you never lose it.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void doExport()}
        className="h-8 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110"
      >
        Export
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-surface-hover hover:text-foreground"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

function countNodes(tree: DocumentTreeNode[]): number {
  let n = 0;
  const walk = (nodes: DocumentTreeNode[]): void => {
    for (const node of nodes) {
      n += 1;
      walk(node.children);
    }
  };
  walk(tree);
  return n;
}
