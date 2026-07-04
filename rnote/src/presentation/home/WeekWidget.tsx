import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';
import type { DocumentTreeNode } from '@application/dto';
import { periodStats } from '@domain/timeline';
import { useTimeline } from '../state/timeline';
import { useOrganization } from '../state/organization';
import { useWorkspace } from '../state/workspace';
import { buildCollections, collectionIcon } from '../lib/collections';
import { Chip } from '../components/Chip';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** "This week" — a compact activity strip + the collections you touched most. */
export function WeekWidget(): JSX.Element | null {
  const events = useTimeline((s) => s.events);
  const load = useTimeline((s) => s.load);
  const byId = useOrganization((s) => s.byId);
  const tree = useWorkspace((s) => s.tree);
  const workspaceId = useWorkspace((s) => s.workspaceId);
  const openCollection = useWorkspace((s) => s.openCollection);
  const openTimeline = useWorkspace((s) => s.openTimeline);

  // Refresh on every mount (events are written elsewhere without touching this
  // store's cache, so a stale/empty load must not stick).
  useEffect(() => {
    if (workspaceId) void load(workspaceId);
  }, [workspaceId, load]);

  const days = useMemo(() => lastSevenDays(), []);
  const weekEvents = useMemo(() => {
    const since = Date.now() - WEEK_MS;
    return events.filter((e) => e.at >= since);
  }, [events]);
  const stats = useMemo(() => periodStats(weekEvents), [weekEvents]);

  const topCollections = useMemo(() => {
    const updatedAtById = new Map(flatten(tree).map((n) => [n.id, n.updatedAt]));
    return buildCollections('category', Object.values(byId), updatedAtById).slice(0, 4);
  }, [byId, tree]);

  if (weekEvents.length === 0 && topCollections.length === 0) return null;

  const maxPerDay = Math.max(1, ...days.map((d) => stats.perDay[d.key] ?? 0));

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 rn-panel p-4"
    >
      <button
        type="button"
        onClick={openTimeline}
        className="group flex w-full items-center justify-between"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingUp size={15} className="text-primary" />
          This week
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground transition group-hover:text-foreground">
          {stats.total} {stats.total === 1 ? 'event' : 'events'}
          <ArrowRight size={13} />
        </span>
      </button>

      <div className="mt-3 flex items-end gap-1.5">
        {days.map((d) => {
          const count = stats.perDay[d.key] ?? 0;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded bg-gradient-to-t from-primary/40 to-accent/60"
                style={{ height: `${6 + (count / maxPerDay) * 34}px` }}
                title={`${count} on ${d.label}`}
              />
              <span className="text-[10px] text-subtle">{d.label}</span>
            </div>
          );
        })}
      </div>

      {topCollections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topCollections.map((c) => (
            <Chip
              key={c.label}
              icon={collectionIcon('category', c.label)}
              label={`${c.label} · ${c.count}`}
              onClick={() => openCollection('category', c.label)}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function lastSevenDays(): Array<{ key: string; label: string }> {
  const out: Array<{ key: string; label: string }> = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'narrow' }) });
  }
  return out;
}

function flatten(tree: DocumentTreeNode[]): DocumentTreeNode[] {
  const out: DocumentTreeNode[] = [];
  const walk = (nodes: DocumentTreeNode[]): void => {
    for (const node of nodes) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(tree);
  return out;
}
