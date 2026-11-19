import React, { useEffect, useRef, useState } from 'react';
import { R2, SP2, SZ2, UI2 } from '../../constants/v2';

// ─── DataTable (Design System v2) ────────────────────────────────────────────
// Clean table inside a card (Stripe / Linear / Airbnb-host pattern): the header is a soft rounded grey
// band (14px Medium, sentence case — LARGER than the 13px Regular cells), rows are ~44px with faint separators
// and a hover tint, header and cells share the same side padding so every column lines up.
// Every cell is styled by its column TYPE (UI2.table.*), so the same kind of data looks the same
// in every table — never style cells per page:
//
//   type        style (UI2.table.*)                                   use for
//   primary     Inter 13 Regular · dark                               the row's main entity (name)
//   secondary   Inter 13 Regular · grey · tabular digits              dates, unit numbers, references
//   text        Inter 13 Regular · dark (default, = primary)             categories, plain values
//   amount      Inter 13 Regular · tabular digits · right-aligned     money — colour the sign with UI2.signColor()
//   status      no text style — render a pill / tag                   Active, Overdue …
//
//   <DataTable
//     columns={[
//       { key: 'date', label: 'Date', type: 'secondary', width: 0.7 },
//       { key: 'cat',  label: 'Category', optional: true },
//       { key: 'who',  label: 'Tenant / vendor', type: 'primary', width: 1.4 },
//       { key: 'amt',  label: 'Amount', type: 'amount', fit: true, render: r => <span style={UI2.signColor(r.pos)}>{r.amt}</span> },
//     ]}
//     rows={rows} rowKey={r => r.id} minWidth={SZ2.tableMinCompact}
//     empty={<EmptyState icon="ti-users" text="No active tenants." />} />
//
// Column: { key, label (keep it short — headers never truncate), type, width (fr, default 1),
//           align ('left'|'right'|'center' — amount defaults to right), render?(row, i),
//           fit?      true → column is never narrower than its content (status pills, dates, amounts,
//                     actions) — nothing in it is ever cut; it still shares free space by width
//           optional? true → dropped when the table has less room than minWidth }
// minWidth: room the full table needs (default SZ2.tableMin; SZ2.tableMinCompact for 3–4 columns).
//   Narrower than that → optional columns are dropped first (no sideways scroll); a table with
//   no optional columns scrolls sideways instead.

const S = {
  wrap:   { overflowX: 'auto' },
  // ONE column grid for the whole table; header + rows are subgrids of it, so a column is the same
  // width in every row (fit columns size to their widest cell across ALL rows — never cut, never misaligned)
  table:  (cols) => ({
    display: 'grid', columnGap: SP2.lg, alignItems: 'center',
    gridTemplateColumns: cols.map(c => `minmax(${c.fit ? 'max-content' : '0px'}, ${c.width || 1}fr)`).join(' '),
  }),
  line:   { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'subgrid', alignItems: 'center' },
  // header = soft rounded band (no underline); rows use the same side padding so text lines up under it
  head:   { ...UI2.table.headBand, marginBottom: SP2.xs },
  row:    { padding: UI2.table.rowPad, borderBottom: `${SZ2.hairline}px solid ${UI2.table.rule}`, borderRadius: R2.md },
};

const cellStyle = (type) => UI2.table[type] || UI2.table.text;
const alignOf = (c) => c.align || (c.type === 'amount' ? 'right' : 'left');

export default function DataTable({ columns = [], rows = [], rowKey, empty, minWidth = SZ2.tableMin }) {
  const ref = useRef(null);
  const [narrow, setNarrow] = useState(false);
  const hasOptional = columns.some(c => c.optional);

  // Watch the table's own width (not the screen) — drop optional columns when it's too tight
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasOptional || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < minWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasOptional, minWidth]);

  const cols = narrow ? columns.filter(c => !c.optional) : columns;

  return (
    <div ref={ref} style={S.wrap}>
      <div role="table" style={{ ...S.table(cols), minWidth: narrow ? 0 : minWidth }}>
        <div style={{ ...S.line, ...S.head }} role="row">
          {cols.map(c => <span key={c.key} role="columnheader" style={{ ...UI2.table.th, textAlign: alignOf(c) }}>{c.label}</span>)}
        </div>
        {rows.length === 0 && <div style={{ gridColumn: '1 / -1' }}>{empty}</div>}
        {rows.map((r, i) => (
          <div key={rowKey ? rowKey(r, i) : i} className="un2-row-hover" style={{ ...S.line, ...S.row, ...(i === rows.length - 1 ? { borderBottom: 'none' } : {}) }} role="row">
            {cols.map(c => (
              <div key={c.key} role="cell" style={{ ...UI2.table.cell, ...cellStyle(c.type), textAlign: alignOf(c) }}>
                {c.render ? c.render(r, i) : r[c.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
