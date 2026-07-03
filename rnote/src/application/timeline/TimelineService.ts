import type {
  ActivityRepository,
  StoredActivity,
} from '../ports/ActivityRepository';

const COALESCE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Records and reads the activity feed. Consecutive edits to the same document
 * within a short window are coalesced (the last event is moved forward) so the
 * timeline reads like a story, not a keystroke log.
 */
export class TimelineService {
  constructor(private readonly repo: ActivityRepository) {}

  async record(event: StoredActivity): Promise<void> {
    if (event.kind === 'edited') {
      const last = await this.repo.latestForDoc(event.docId);
      if (last?.id != null && last.kind === 'edited' && event.at - last.at < COALESCE_WINDOW_MS) {
        await this.repo.touch(last.id, event.at, event.snippet);
        return;
      }
    }
    await this.repo.append(event);
  }

  list(workspaceId: string): Promise<StoredActivity[]> {
    return this.repo.listByWorkspace(workspaceId);
  }

  forget(docId: string): Promise<void> {
    return this.repo.deleteByDoc(docId);
  }
}
