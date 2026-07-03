import { create } from 'zustand';
import { container } from '@/composition/container';
import type { StoredActivity } from '@application/ports/ActivityRepository';
import type { ActivityKind } from '@domain/timeline';

const service = container.timeline;

interface RecordArgs {
  workspaceId: string;
  docId: string;
  kind: ActivityKind;
  title: string;
  snippet: string;
}

interface TimelineState {
  events: StoredActivity[];
  loaded: boolean;
  load: (workspaceId: string) => Promise<void>;
  /** Persist an activity event (does not reload — the view refreshes on open). */
  record: (args: RecordArgs) => Promise<void>;
  forget: (docId: string) => void;
}

export const useTimeline = create<TimelineState>((set) => ({
  events: [],
  loaded: false,

  load: async (workspaceId) => {
    set({ events: await service.list(workspaceId), loaded: true });
  },

  record: async ({ workspaceId, docId, kind, title, snippet }) => {
    await service.record({
      workspaceId,
      docId,
      at: Date.now(),
      kind,
      title: title || 'Untitled',
      snippet: snippet.trim().slice(0, 140),
    });
  },

  forget: (docId) => {
    void service.forget(docId);
    set((s) => ({ events: s.events.filter((e) => e.docId !== docId) }));
  },
}));
