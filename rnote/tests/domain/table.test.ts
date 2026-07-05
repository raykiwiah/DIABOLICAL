import { describe, it, expect } from 'vitest';
import {
  createTable,
  addRow,
  removeRow,
  updateCell,
  addColumn,
  renameColumn,
  removeColumn,
  setColumnType,
  addSelectOption,
  sortRows,
  filterRows,
  docFromTable,
  tableFromDoc,
  isTableDoc,
  setView,
  setGroupBy,
  boardColumn,
  primaryColumn,
  groupRows,
} from '@domain/table';

describe('table model', () => {
  it('creates a starter table with 3 typed columns and 3 empty rows', () => {
    const t = createTable();
    expect(t.columns.map((c) => c.type)).toEqual(['text', 'select', 'checkbox']);
    expect(t.rows).toHaveLength(3);
    expect(t.rows[0]!.cells[t.columns[2]!.id]).toBe(false); // checkbox default
  });

  it('adds/removes rows and updates cells immutably', () => {
    const t = createTable();
    const grown = addRow(t);
    expect(grown.rows).toHaveLength(4);
    expect(t.rows).toHaveLength(3); // original untouched

    const col = t.columns[0]!;
    const row = t.rows[0]!;
    const edited = updateCell(t, row.id, col.id, 'Buy milk');
    expect(edited.rows[0]!.cells[col.id]).toBe('Buy milk');
    expect(t.rows[0]!.cells[col.id]).toBeNull();

    const shrunk = removeRow(t, row.id);
    expect(shrunk.rows).toHaveLength(2);
  });

  it('adds, renames, retypes and removes columns (never the last one)', () => {
    let t = createTable();
    t = addColumn(t, 'Price', 'number');
    const price = t.columns[3]!;
    expect(price.type).toBe('number');
    expect(t.rows[0]!.cells[price.id]).toBeNull();

    t = renameColumn(t, price.id, 'Cost');
    expect(t.columns[3]!.name).toBe('Cost');

    t = setColumnType(t, price.id, 'text');
    expect(t.columns[3]!.type).toBe('text');

    t = removeColumn(t, price.id);
    expect(t.columns).toHaveLength(3);

    let solo: import('@domain/table').TableData = { columns: [t.columns[0]!], rows: [] };
    solo = removeColumn(solo, t.columns[0]!.id);
    expect(solo.columns).toHaveLength(1); // last column is protected
  });

  it('manages select options without case-duplicates', () => {
    let t = createTable();
    const status = t.columns[1]!;
    t = addSelectOption(t, status.id, 'Blocked');
    t = addSelectOption(t, status.id, 'blocked'); // dup, ignored
    expect(t.columns[1]!.options).toEqual(['Todo', 'Doing', 'Done', 'Blocked']);
  });

  it('sorts by type (numeric, natural text, checked-first) with empties last', () => {
    let t = createTable();
    t = addColumn(t, 'Price', 'number');
    const name = t.columns[0]!;
    const price = t.columns[3]!;
    const [r1, r2] = t.rows as [(typeof t.rows)[0], (typeof t.rows)[0]];
    t = updateCell(t, r1.id, name.id, 'item 10');
    t = updateCell(t, r2.id, name.id, 'item 2');
    t = updateCell(t, r1.id, price.id, 5);
    t = updateCell(t, r2.id, price.id, 50);

    const byName = sortRows(t.rows, name, 'asc').map((r) => r.cells[name.id]);
    expect(byName).toEqual(['item 2', 'item 10', null]); // natural sort, empty last

    const byPriceDesc = sortRows(t.rows, price, 'desc').map((r) => r.cells[price.id]);
    expect(byPriceDesc).toEqual([50, 5, null]);
  });

  it('filters across all cells, case-insensitively', () => {
    let t = createTable();
    const name = t.columns[0]!;
    t = updateCell(t, t.rows[0]!.id, name.id, 'Groceries run');
    t = updateCell(t, t.rows[1]!.id, name.id, 'Call landlord');
    expect(filterRows(t.rows, 'groc')).toHaveLength(1);
    expect(filterRows(t.rows, '')).toHaveLength(3);
  });

  it('round-trips through a document body', () => {
    const t = createTable();
    const doc = docFromTable(t);
    expect(isTableDoc(doc)).toBe(true);
    expect(tableFromDoc(doc)).toEqual(t);
    expect(isTableDoc({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(false);
  });

  it('persists view mode and grouping as saved-view preferences', () => {
    let t = createTable();
    expect(t.view).toBeUndefined(); // older docs default to table
    t = setView(t, 'board');
    t = setGroupBy(t, t.columns[1]!.id);
    const revived = tableFromDoc(docFromTable(t))!;
    expect(revived.view).toBe('board');
    expect(revived.groupBy).toBe(t.columns[1]!.id);
  });

  it('resolves the board column: saved groupBy, else first select, else null', () => {
    let t = createTable();
    const status = t.columns[1]!;
    expect(boardColumn(t)!.id).toBe(status.id); // no groupBy → first select

    t = addColumn(t, 'Priority', 'select');
    const priority = t.columns[3]!;
    t = setGroupBy(t, priority.id);
    expect(boardColumn(t)!.id).toBe(priority.id); // saved groupBy honored

    t = removeColumn(t, priority.id);
    expect(boardColumn(t)!.id).toBe(status.id); // stale groupBy falls back

    t = setColumnType(t, status.id, 'text');
    expect(boardColumn(t)).toBeNull(); // no select column left
  });

  it('picks the first text column as the card title column', () => {
    const t = createTable();
    expect(primaryColumn(t)!.name).toBe('Name');
    const noText: import('@domain/table').TableData = {
      columns: [{ id: 'c1', name: 'Done', type: 'checkbox' }],
      rows: [],
    };
    expect(primaryColumn(noText)!.id).toBe('c1'); // falls back to first column
    expect(primaryColumn({ columns: [], rows: [] })).toBeNull();
  });

  it('groups rows into one lane per option plus a trailing null lane', () => {
    let t = createTable();
    const status = t.columns[1]!;
    const [r1, r2, r3] = t.rows as [
      (typeof t.rows)[0],
      (typeof t.rows)[0],
      (typeof t.rows)[0],
    ];
    t = updateCell(t, r1.id, status.id, 'Doing');
    t = updateCell(t, r2.id, status.id, 'Todo');
    t = updateCell(t, r3.id, status.id, 'Retired'); // stale value, not an option

    const lanes = groupRows(t.rows, t.columns[1]!);
    expect(lanes.map((l) => l.option)).toEqual(['Todo', 'Doing', 'Done', null]);
    expect(lanes[0]!.rows.map((r) => r.id)).toEqual([r2.id]);
    expect(lanes[1]!.rows.map((r) => r.id)).toEqual([r1.id]);
    expect(lanes[2]!.rows).toHaveLength(0);
    expect(lanes[3]!.rows.map((r) => r.id)).toEqual([r3.id]); // stale → null lane
  });
});
