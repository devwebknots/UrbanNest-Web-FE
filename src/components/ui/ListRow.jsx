import React from 'react';
import { UI2 } from '../../constants';

// ─── ListRow (Design System v2) ──────────────────────────────────────────────
// One row in a card list: leading visual · title + meta · trailing slot (pushed right).
// Title and meta stay on one line (… when the card is narrow); the trailing slot never shrinks.
//
//   <ListRow
//     leading={<div style={UI2.iconBox(SZ2.icon.md, TONES2.primary)}><i className="ti ti-file-text" /></div>}
//     title="Lease Agreement - #402" meta="Updated 2 days ago · 1.2MB"
//     trailing={<button style={UI2.btn.icon(SZ2.control.sm)}>…</button>}
//   />
//
// Props:
//   leading, title (UI2.text.rowTitle), meta (UI2.text.meta), metaColor, trailing
//   variant  'divided' (default — hairline between rows) | 'hover' (same hairline between rows + row highlights on hover)
//   onClick, style

export default function ListRow({ leading, title, meta, metaColor, trailing, variant = 'divided', onClick, style }) {
  const hover = variant === 'hover';
  return (
    <div
      className={hover ? 'un2-row-hover un2-row-divided' : 'un2-row-divided'}
      style={{ ...(hover ? UI2.listRowHover : UI2.listRow), ...(onClick ? { cursor: 'pointer' } : {}), ...style }}
      onClick={onClick}
    >
      {leading}
      <div style={{ ...UI2.minWidth0, flex: 1 }}>
        <div style={{ ...UI2.text.rowTitle, ...UI2.truncate }}>{title}</div>
        {meta && <div style={{ ...UI2.text.meta, ...UI2.truncate, ...(metaColor ? { color: metaColor } : {}) }}>{meta}</div>}
      </div>
      {trailing && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>{trailing}</div>}
    </div>
  );
}
