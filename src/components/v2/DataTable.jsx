import React from 'react';
import { C2, FS2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── DataTable (Design System v2) ────────────────────────────────────────────
// Light table inside a card: uppercase header, hairline rows, optional empty state.
// Column widths are relative (fr). Scrolls sideways on narrow screens.
//
//   <DataTable
//     columns={[
//       { key: 'date', label: 'Date', width: 1 },
//       { key: 'amount', label: 'Amount', width: 1, align: 'right',
//         render: r => <span style={{ color: … }}>{r.amount}</span> },
//     ]}
//     rows={rows} rowKey={r => r.id}
//     empty={<EmptyState icon="ti-users" text="No active tenants." />} />
//
// Column: { key, label, width (fr, default 1), align ('left'|'right'|'center'), render?(row, i) }
// minWidth: width before it scrolls sideways (default SZ2.tableMin; SZ2.tableMinCompact for 3–4 columns)

const S = {
  wrap:   { overflowX: 'auto' },
  grid:   (cols) => ({ display: 'grid', gridTemplateColumns: cols.map(c => `minmax(0, ${c.width || 1}fr)`).join(' '), gap: SP2.md, alignItems: 'center' }),
  head:   { padding: pad(SP2.sm, SP2.xs), borderBottom: `${SZ2.hairline}px solid ${C2.border}` },
  th:     { ...UI2.text.eyebrow, color: C2.textSecondary },
  row:    { padding: pad(SP2.sm, SP2.xs), borderBottom: `${SZ2.hairline}px solid ${C2.borderLight}` },
  td:     { fontSize: FS2.base, color: C2.textPrimary, minWidth: 0 },
};

export default function DataTable({ columns = [], rows = [], rowKey, empty, minWidth = SZ2.tableMin }) {
  const grid = S.grid(columns);
  return (
    <div style={S.wrap}>
      <div style={{ minWidth }}>
        <div style={{ ...grid, ...S.head }} role="row">
          {columns.map(c => <span key={c.key} role="columnheader" style={{ ...S.th, textAlign: c.align || 'left' }}>{c.label}</span>)}
        </div>
        {rows.length === 0 && empty}
        {rows.map((r, i) => (
          <div key={rowKey ? rowKey(r, i) : i} className="un2-row-hover" style={{ ...grid, ...S.row, ...(i === rows.length - 1 ? { borderBottom: 'none' } : {}) }} role="row">
            {columns.map(c => (
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
