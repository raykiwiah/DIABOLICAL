import type {
  ActivityRepository,
  StoredActivity,
} from '@application/ports/ActivityRepository';
import type { RnoteDatabase } from './database';
import type { ActivityRecord } from './records';

const MAX_AT = Number.MAX_SAFE_INTEGER;

/** IndexedDB-backed activity feed. */
export class DexieActivityRepository implements ActivityRepository {
  constructor(private readonly db: RnoteDatabase) {}

  async append(event: StoredActivity): Promise<void> {
    await this.db.activity.add(event as ActivityRecord);
  }

  async latestForDoc(docId: string): Promise<StoredActivity | null> {
    const events = await this.db.activity.where('docId').equals(docId).toArray();
    if (events.length === 0) return null;
    return events.reduce((a, b) => (a.at >= b.at ? a : b));
  }

  async touch(id: number, at: number, snippet: string): Promise<void> {
    await this.db.activity.update(id, { at, snippet });
  }

  async listByWorkspace(workspaceId: string): Promise<StoredActivity[]> {
    return this.db.activity
      .where('[workspaceId+at]')
      .between([workspaceId, 0], [workspaceId, MAX_AT], true, true)
      .toArray();
  }

  async deleteByDoc(docId: string): Promise<void> {
    await this.db.activity.where('docId').equals(docId).delete();
  }
}
