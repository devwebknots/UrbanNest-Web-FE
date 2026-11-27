import React from 'react';
import { C2, TONES2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, UI2 } from '../../constants';

// ─── HeroStats (Design System v2) ────────────────────────────────────────────
// THE hero stats row — single source for ProfileHero (Dashboard), WaveHero (Portfolio), ListingsHero, PM Approvals,
// PM Listings — one row of stats:
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
//        className (responsive row class — default un2-phero-stats; WaveHero passes un2-whero-stats;
//                   'un2-phero-stats un2-phero-stats-fill' = all stats in ONE row, equal widths, labels wrap — PM Services)
//        size  'md' (default — the big row: 40 icon · 20 figure) | 'sm' = MINI version for tight spaces (e.g. beside /
//              under a page title): 32 icon · 16 figure · 10 note · tighter gaps. Same look otherwise (user 2026-11-27).
// Responsive (utilities.css .un2-phero-stats): wraps; ≤ 600px 2 per row without dividers.

// MINI = the same row scaled down: every size steps down one notch; colours, weights, dividers, layout unchanged
const MINI = { icon: SZ2.icon.md, gap: SP2.sm, side: SP2.lg, note: FS2.xxs };

const S = {
  // sides written as longhands (no padding shorthand + paddingLeft override) so the FIRST stat starts exactly on the
  // content line (its icon aligns with the title / tabs above); every other stat keeps the side padding
  stat:   (first, sm) => ({ ...UI2.row(sm ? MINI.gap : SP2.md), paddingTop: 0, paddingBottom: 0, paddingRight: sm ? MINI.side : SP2.xl, paddingLeft: first ? 0 : (sm ? MINI.side : SP2.xl) }),
  sLabel: { ...T2.eyebrow, color: C2.textSecondary, letterSpacing: LS2.wide },
  sValue: { ...T2.kpiValue, lineHeight: LH2.tight, marginTop: SP2.xxs },
  sValueSm: { ...T2.cardFigure, lineHeight: LH2.tight, marginTop: SP2.xxs },   // mini row: the standard small figure (16 · 400)
  sNote:  { fontSize: FS2.xs, lineHeight: LH2.heading, color: C2.textMuted, marginTop: SP2.xxs },
};

export default function HeroStats({ stats = [], style, className = 'un2-phero-stats', size = 'md' }) {
  const sm = size === 'sm';
  if (!stats.length) return null;
  return (
    <div className={className} style={style}>
      {stats.map((s, i) => {
        const tone = s.tone || TONES2.primary;
        return (
          <div key={s.label} style={S.stat(i === 0, sm)}>
            <div style={UI2.iconBox(sm ? MINI.icon : SZ2.icon.lg, tone, { round: true })}><i className={`ti ${s.icon}`} aria-hidden="true" /></div>
            <div style={UI2.minWidth0}>
              <div style={S.sLabel}>{s.label}</div>
              <div style={sm ? S.sValueSm : S.sValue}>{s.value}</div>
              {s.note && <div style={{ ...S.sNote, ...(sm ? { fontSize: MINI.note } : {}), ...(s.noteTone ? { color: s.noteTone.strong, fontWeight: FW2.medium } : {}) }}>{s.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
