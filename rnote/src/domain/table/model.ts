import type { RichDoc } from '../blocks/RichContent';

/**
 * Databases v1 — a "table" page: typed columns, rows of cells, pure operations.
 *
 * A table lives inside a normal document as a single `rnoteTable` block, so it
 * inherits the entire document pipeline (persistence, backup, trash, tree,
 * organization, timeline) without new storage. All operations here are pure and
 * immutable. Ephemeral view state (sort, filter) is presentation-only and never
 * persisted; the chosen layout (`view`) and board grouping (`groupBy`) are
 * saved-view preferences and live in the data, like the columns themselves.
 */
export type ColumnType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export type TableViewMode = 'table' | 'board';

export interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
  /** Choices for `select` columns. */
  options?: string[];
}

export type CellValue = string | number | boolean | null;

export interface TableRow {
  id: string;
  cells: Record<string, CellValue>;
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
  /** Saved layout; absent (older docs) means 'table'. */
  view?: TableViewMode;
  /** Board grouping column id — must reference a `select` column to apply. */
  groupBy?: string;
}

export const TABLE_BLOCK = 'rnoteTable';

let counter = 0;
function uid(prefix: string): string {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

/** A sensible starter table: Name · Status · Done. */
export function createTable(): TableData {
  const name: TableColumn = { id: uid('c'), name: 'Name', type: 'text' };
  const status: TableColumn = {
    id: uid('c'),
    name: 'Status',
    type: 'select',
    options: ['Todo', 'Doing', 'Done'],
  };
  const done: TableColumn = { id: uid('c'), name: 'Done', type: 'checkbox' };
  return {
    columns: [name, status, done],
    rows: [emptyRow([name, status, done]), emptyRow([name, status, done]), emptyRow([name, status, done])],
  };
}

function emptyRow(columns: TableColumn[]): TableRow {
  const cells: Record<string, CellValue> = {};
  for (const col of columns) cells[col.id] = col.type === 'checkbox' ? false : null;
  return { id: uid('r'), cells };
}

// ── Operations (immutable) ──────────────────────────────────────────────────
export function addRow(table: TableData): TableData {
  return { ...table, rows: [...table.rows, emptyRow(table.columns)] };
}

export function removeRow(table: TableData, rowId: string): TableData {
  return { ...table, rows: table.rows.filter((r) => r.id !== rowId) };
}

export function updateCell(table: TableData, rowId: string, columnId: string, value: CellValue): TableData {
  return {
    ...table,
    rows: table.rows.map((r) =>
      r.id === rowId ? { ...r, cells: { ...r.cells, [columnId]: value } } : r,
    ),
  };
}

export function addColumn(table: TableData, name: string, type: ColumnType): TableData {
  const column: TableColumn = {
    id: uid('c'),
    name: name.trim() || 'Column',
    type,
    ...(type === 'select' ? { options: [] } : {}),
  };
  return {
    ...table,
    columns: [...table.columns, column],
    rows: table.rows.map((r) => ({
      ...r,
      cells: { ...r.cells, [column.id]: type === 'checkbox' ? false : null },
    })),
  };
}

export function renameColumn(table: TableData, columnId: string, name: string): TableData {
  const next = name.trim();
  if (!next) return table;
  return {
    ...table,
    columns: table.columns.map((c) => (c.id === columnId ? { ...c, name: next } : c)),
  };
}

export function setColumnType(table: TableData, columnId: string, type: ColumnType): TableData {
  return {
    ...table,
    columns: table.columns.map((c) =>
      c.id === columnId
        ? { ...c, type, options: type === 'select' ? (c.options ?? []) : c.options }
        : c,
    ),
  };
}

export function removeColumn(table: TableData, columnId: string): TableData {
  if (table.columns.length <= 1) return table; // never delete the last column
  return {
    ...table,
    columns: table.columns.filter((c) => c.id !== columnId),
    rows: table.rows.map((r) => {
      const cells = { ...r.cells };
      delete cells[columnId];
      return { ...r, cells };
    }),
  };
}

export function addSelectOption(table: TableData, columnId: string, option: string): TableData {
  const value = option.trim();
  if (!value) return table;
  return {
    ...table,
    columns: table.columns.map((c) => {
      if (c.id !== columnId || c.type !== 'select') return c;
      const options = c.options ?? [];
      return options.some((o) => o.toLowerCase() === value.toLowerCase())
        ? c
        : { ...c, options: [...options, value] };
    }),
  };
}

// ── Views (sort / filter — presentation-only, never persisted) ──────────────
export type SortDirection = 'asc' | 'desc';

export function sortRows(
  rows: TableRow[],
  column: TableColumn,
  direction: SortDirection,
): TableRow[] {
  const factor = direction === 'asc' ? 1 : -1;
  const isEmpty = (v: CellValue | undefined): boolean => v === null || v === undefined || v === '';
  return [...rows].sort((a, b) => {
    const av = a.cells[column.id];
    const bv = b.cells[column.id];
    // Empties sink to the bottom regardless of direction.
    if (isEmpty(av) && isEmpty(bv)) return 0;
    if (isEmpty(av)) return 1;
    if (isEmpty(bv)) return -1;
    return factor * compareCells(av!, bv!, column.type);
  });
}

function compareCells(a: CellValue, b: CellValue, type: ColumnType): number {
  if (type === 'number') return Number(a) - Number(b);
  if (type === 'checkbox') return Number(Boolean(b)) - Number(Boolean(a)); // checked first
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/** Case-insensitive "any cell contains" filter. */
export function filterRows(rows: TableRow[], query: string): TableRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    Object.values(r.cells).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q)),
  );
}

// ── Board (kanban) — group rows by a select column ──────────────────────────
export function setView(table: TableData, view: TableViewMode): TableData {
  return { ...table, view };
}

export function setGroupBy(table: TableData, columnId: string): TableData {
  return { ...table, groupBy: columnId };
}

/**
 * The select column the board groups by: the saved `groupBy` when it still
 * points at a select column, else the first select column, else null (the
 * board then shows its "needs a select column" empty state).
 */
export function boardColumn(table: TableData): TableColumn | null {
  const saved = table.columns.find((c) => c.id === table.groupBy && c.type === 'select');
  if (saved) return saved;
  return table.columns.find((c) => c.type === 'select') ?? null;
}

/** The column used as a card's title: the first text column, else the first column. */
export function primaryColumn(table: TableData): TableColumn | null {
  return table.columns.find((c) => c.type === 'text') ?? table.columns[0] ?? null;
}

export interface BoardLane {
  /** The select option, or null for the "no value / stale value" lane. */
  option: string | null;
  rows: TableRow[];
}

/**
 * One lane per select option (in option order) plus a trailing null lane for
 * rows whose cell is empty or no longer matches an option. Every row lands in
 * exactly one lane. Moving a card is just `updateCell(row, column, option)`.
 */
export function groupRows(rows: TableRow[], column: TableColumn): BoardLane[] {
  const options = column.options ?? [];
  const byOption = new Map<string, TableRow[]>(options.map((o) => [o, []]));
  const ungrouped: TableRow[] = [];
  for (const row of rows) {
    const value = row.cells[column.id];
    const lane = typeof value === 'string' ? byOption.get(value) : undefined;
    if (lane) lane.push(row);
    else ungrouped.push(row);
  }
  return [
    ...options.map((option) => ({ option, rows: byOption.get(option) ?? [] })),
    { option: null, rows: ungrouped },
  ];
}

// ── Document embedding ──────────────────────────────────────────────────────────────────
/** Wrap table data as a document body (a single rnoteTable block). */
export function docFromTable(table: TableData): RichDoc {
  return { type: 'doc', content: [{ type: TABLE_BLOCK, attrs: { data: table } }] };
}

/** Extract table data when the document is a table page, else null. */
export function tableFromDoc(doc: RichDoc): TableData | null {
  const block = doc.content?.[0];
  if (!block || block.type !== TABLE_BLOCK) return null;
  const data = (block.attrs as { data?: TableData } | undefined)?.data;
  if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) return null;
  return data;
}

export function isTableDoc(doc: RichDoc): boolean {
  return tableFromDoc(doc) !== null;
}
