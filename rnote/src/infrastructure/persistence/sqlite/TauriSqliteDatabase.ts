import type Database from '@tauri-apps/plugin-sql';

/**
 * Lazily-opened SQLite connection for the Tauri desktop build.
 *
 * `@tauri-apps/plugin-sql` is imported dynamically so it is never pulled into the
 * web bundle — the browser build code-splits it away and never executes it. The
 * schema mirrors the IndexedDB records (parent_id '' for roots, is_archived 0|1)
 * so the domain mappers are reused verbatim.
 */
let connection: Promise<Database> | null = null;

export function getSqliteDatabase(): Promise<Database> {
  if (!connection) {
    connection = (async () => {
      const { default: SqlDatabase } = await import('@tauri-apps/plugin-sql');
      const db = await SqlDatabase.load('sqlite:rnote.db');
      await migrate(db);
      return db;
    })();
  }
  return connection;
}

async function migrate(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      parent_id    TEXT NOT NULL DEFAULT '',
      title        TEXT NOT NULL DEFAULT '',
      icon         TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL,
      position     REAL NOT NULL,
      is_archived  INTEGER NOT NULL DEFAULT 0,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL
    );
  `);
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_documents_ws_parent ON documents(workspace_id, parent_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_documents_ws_archived ON documents(workspace_id, is_archived);`,
  );
}

/** The row shape returned by `SELECT * FROM documents`. */
export interface DocumentRow {
  id: string;
  workspace_id: string;
  parent_id: string;
  title: string;
  icon: string;
  content: string;
  position: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}
