import React from 'react';
import { C2, TONES2, F2, FS2, FW2, LH2, LS2, SP2, pad, UI2 } from '../../constants';

// ─── DetailHeader (Design System v2) ─────────────────────────────────────────
// Open header for a detail page (property, unit…) — no box. A two-row grid (utilities.css .un2-detail-*):
//
//   row 1   LL01  [✎ Edit]                                 (▦) Total units │ ◔ Occupancy │ …   ← aside sits on
//   row 2   ⌖ 1391 Overcup Oak Ln, Centerton, US  [Apartment Complex]                        the title line
//   (the type pill sits on the address line so the title keeps its full width)
//
//   <DetailHeader title="LL01" badge="Apartment Complex" meta="1391 Overcup Oak Ln" metaIcon="ti-map-pin"
//                 action={<button style={{ ...UI2.btn.soft, ...UI2.btnSm }}>Edit</button>}
//                 aside={<StatGroup items={…} />} />
//
// Props: title (node), badge (text), badgeTone (TONES2, default success), action, meta, metaIcon, aside
// Above phones: the title line never wraps (title shortens with … — full text on hover) and the aside is
// centred on the title line, in a straight line with the pill / action. ≤ 860px: title · meta · aside
// stack. ≤ 600px the title line may wrap.

const S = {
  bar:   { fontFamily: F2.body },
  row:   { ...UI2.row(SP2.md), flexWrap: 'nowrap', rowGap: SP2.sm, minWidth: 0 },
  title: { fontFamily: F2.heading, fontSize: FS2.xxxl, fontWeight: FW2.semibold, lineHeight: LH2.snug, letterSpacing: LS2.tight, color: C2.navyDeep, margin: 0, minWidth: 0, ...UI2.truncate },
  badge: { padding: pad(SP2.xs, SP2.md), flexShrink: 0 },
  action:{ flexShrink: 0, display: 'flex' },
  meta:  { ...UI2.row(SP2.md), flexWrap: 'wrap', rowGap: SP2.xs, ...UI2.text.label, marginTop: SP2.sm },
  addr:  { ...UI2.row(SP2.xs), minWidth: 0 },
};

export default function DetailHeader({ title, badge, badgeTone = TONES2.success, action, meta, metaIcon = 'ti-map-pin', aside }) {
  return (
    <section className="un2-detail-header" style={S.bar}>
      <div className="un2-detail-title" style={S.row}>
        <h1 style={S.title} title={typeof title === 'string' ? title : undefined}>{title}</h1>
        {action && <div style={S.action}>{action}</div>}
      </div>
      {(meta || badge) && (
        <div className="un2-detail-meta" style={S.meta}>
          {meta && (
            <span style={S.addr}>
              {metaIcon && <i className={`ti ${metaIcon}`} aria-hidden="true" />}
              <span>{meta}</span>
            </span>
          )}
          {badge && <span style={{ ...UI2.pill(badgeTone), ...S.badge }}>{badge}</span>}
        </div>
      )}
      {aside && <div className="un2-detail-aside">{aside}</div>}
    </section>
  );
}
