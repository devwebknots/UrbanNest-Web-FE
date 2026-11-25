import React from 'react';
import { C2, TONES2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, pad, UI2 } from '../../constants';

// ─── HeroStats (Design System v2) ────────────────────────────────────────────
// The hero stats row of the Listings banner (ListingsHero renders exactly this) — one row of stats:
// round tinted icon box · caps label · KPI figure (+ optional note), split by hairlines (un2-phero-stats).
// Reuse it anywhere the same stats row is wanted (e.g. PM Approvals) — never copy its styles.
//
//   (📣) ACTIVE │ (◈) READY TO LIST │ (⚠) NOT READY │ (▤) DRAFTS IN PROGRESS
//        3      │      0            │      0        │      3
//
//   <HeroStats stats={[{ icon: 'ti-speakerphone', tone: TONES2.success, label: 'Active', value: 3 }]} />
//
// Props: stats [{ icon, tone (TONES2 / accentTone), label, value (node), note, noteTone }],
//        style (extra style on the row, e.g. ListingsHero's top margin under its subtitle)
// Responsive (utilities.css .un2-phero-stats): wraps; ≤ 600px 2 per row without dividers.

const S = {
  stat:   (first) => ({ ...UI2.row(SP2.md), padding: pad(0, SP2.xl), ...(first ? { paddingLeft: 0 } : {}) }),
  sLabel: { ...T2.eyebrow, color: C2.textSecondary, letterSpacing: LS2.wide },
  sValue: { ...T2.kpiValue, lineHeight: LH2.tight, marginTop: SP2.xxs },
  sNote:  { fontSize: FS2.xs, lineHeight: LH2.heading, color: C2.textMuted, marginTop: SP2.xxs },
};

export default function HeroStats({ stats = [], style }) {
  if (!stats.length) return null;
  return (
    <div className="un2-phero-stats" style={style}>
      {stats.map((s, i) => {
        const tone = s.tone || TONES2.primary;
        return (
          <div key={s.label} style={S.stat(i === 0)}>
            <div style={UI2.iconBox(SZ2.icon.lg, tone, { round: true })}><i className={`ti ${s.icon}`} aria-hidden="true" /></div>
            <div style={UI2.minWidth0}>
              <div style={S.sLabel}>{s.label}</div>
              <div style={S.sValue}>{s.value}</div>
              {s.note && <div style={{ ...S.sNote, ...(s.noteTone ? { color: s.noteTone.strong, fontWeight: FW2.medium } : {}) }}>{s.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
