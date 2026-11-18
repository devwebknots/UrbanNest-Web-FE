import React, { useEffect, useRef, useState } from 'react';
import { C2, FS2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── DataTable (Design System v2) ────────────────────────────────────────────
// Light table inside a card: uppercase header, hairline rows, optional empty state.
// Column widths are relative (fr). Cells stay on one line (… when text is too long).
//
//   <DataTable
//     columns={[
//       { key: 'date', label: 'Date', width: 1 },
//       { key: 'cat', label: 'Category', optional: true },
//       { key: 'amount', label: 'Amount', fit: true, align: 'right',
//         render: r => <span style={{ color: … }}>{r.amount}</span> },
//     ]}
//     rows={rows} rowKey={r => r.id} minWidth={SZ2.tableMinCompact}
//     empty={<EmptyState icon="ti-users" text="No active tenants." />} />
//
// Column: { key, label, width (fr, default 1), align ('left'|'right'|'center'), render?(row, i),
//           fit?      true → column never shrinks below SZ2.tableFitCol (amounts, totals)
//           optional? true → dropped when the table has less room than minWidth }
// minWidth: room the full table needs (default SZ2.tableMin; SZ2.tableMinCompact for 3–4 columns).
//   Narrower than that → optional columns are dropped first (no sideways scroll); a table with
//   no optional columns scrolls sideways instead.

const S = {
  wrap:   { overflowX: 'auto' },
  grid:   (cols) => ({
    display: 'grid', gap: SP2.md, alignItems: 'center',
    // fit columns get a fixed minimum (same in every row, so columns line up); others may shrink to 0
    gridTemplateColumns: cols.map(c => `minmax(${c.fit ? SZ2.tableFitCol : 0}px, ${c.width || 1}fr)`).join(' '),
  }),
  head:   { padding: pad(SP2.sm, SP2.xs), borderBottom: `${SZ2.hairline}px solid ${C2.border}` },
  th:     { ...UI2.text.eyebrow, ...UI2.truncate, color: C2.textSecondary },
  row:    { padding: pad(SP2.sm, SP2.xs), borderBottom: `${SZ2.hairline}px solid ${C2.borderLight}` },
  td:     { ...UI2.truncate, fontSize: FS2.base, color: C2.textPrimary, minWidth: 0 },
};

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
  const grid = S.grid(cols);
  return (
    <div ref={ref} style={S.wrap}>
      <div style={{ minWidth: narrow ? 0 : minWidth }}>
        <div style={{ ...grid, ...S.head }} role="row">
          {cols.map(c => <span key={c.key} role="columnheader" style={{ ...S.th, textAlign: c.align || 'left' }}>{c.label}</span>)}
        </div>
        {rows.length === 0 && empty}
        {rows.map((r, i) => (
          <div key={rowKey ? rowKey(r, i) : i} className="un2-row-hover" style={{ ...grid, ...S.row, ...(i === rows.length - 1 ? { borderBottom: 'none' } : {}) }} role="row">
            {cols.map(c => (
              <div key={c.key} role="cell" style={{ ...S.td, textAlign: c.align || 'left' }}>
                {c.render ? c.render(r, i) : r[c.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
