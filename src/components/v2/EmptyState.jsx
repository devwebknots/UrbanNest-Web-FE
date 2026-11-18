import React from 'react';
import { FS2, ILLUS2, LAYOUT2, SZ2, UI2 } from '../../constants/v2';

// ─── EmptyState (Design System v2) ───────────────────────────────────────────
// Centred illustration + message for an empty card body.
//
//   <EmptyState illustration="people" text="No active tenants." />
//   <EmptyState icon="ti-file-off" text="No documents yet." />
//
// For a one-line note without art use UI2.empty (centred) or UI2.emptyInline (left).
//
// Props: illustration ('people' or any node) · icon (tabler class, used when no
//        illustration) · text · children (e.g. a button under the text)

const ILLUSTRATIONS = {
  people: (
    <svg width="140" height="74" viewBox="0 0 140 74" aria-hidden="true">
      <circle cx="36" cy="26" r="11" fill={ILLUS2.personBack} /><path d="M14 66c0-14 10-22 22-22s22 8 22 22z" fill={ILLUS2.personBackBody} />
      <circle cx="104" cy="26" r="11" fill={ILLUS2.personBack} /><path d="M82 66c0-14 10-22 22-22s22 8 22 22z" fill={ILLUS2.personBackBody} />
      <circle cx="70" cy="18" r="14" fill={ILLUS2.personFront} /><path d="M42 70c0-18 12-28 28-28s28 10 28 28z" fill={ILLUS2.personFrontBody} />
    </svg>
  ),
};

export default function EmptyState({ illustration, icon, text, children }) {
  const art = typeof illustration === 'string' ? ILLUSTRATIONS[illustration] : illustration;
  return (
    <div style={{ ...UI2.center, ...UI2.stack(LAYOUT2.rowGap), minHeight: SZ2.emptyMin }}>
      {art || (icon && (
        <div style={UI2.iconBox(SZ2.icon.lg, undefined, { round: true })}><i className={`ti ${icon}`} aria-hidden="true" /></div>
      ))}
      {text && <div style={{ ...UI2.text.label, fontSize: FS2.md }}>{text}</div>}
      {children}
    </div>
  );
}
