const LAST_KEY = 'rnote.lastBackup';
const SNOOZE_KEY = 'rnote.backupSnooze';

const read = (key: string): number => {
  try {
    return Number(localStorage.getItem(key) ?? 0);
  } catch {
    return 0;
  }
};
const write = (key: string): void => {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
};

export const markBackedUp = (): void => write(LAST_KEY);
export const snoozeBackupNudge = (): void => write(SNOOZE_KEY);

const WEEK = 7 * 24 * 60 * 60 * 1000;
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

/** Nudge once a workspace has some content and hasn't been backed up recently. */
export function shouldNudgeBackup(pageCount: number): boolean {
  if (pageCount < 3) return false;
  const now = Date.now();
  if (now - read(SNOOZE_KEY) < THREE_DAYS) return false;
  const last = read(LAST_KEY);
  if (last && now - last < WEEK) return false;
  return true;
}
