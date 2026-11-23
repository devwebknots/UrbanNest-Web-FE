import React from 'react';
import { C2, G2, R2, SH2, TONES2, ACCENT2, F2, T2, SP2, SZ2, LAYOUT2, pad, UI2 } from '../../constants';

// ─── KpiStrip (Design System v2) ─────────────────────────────────────────────
// Four KPIs in ONE light container, separated by hairlines — not four boxes.
// Each column: glyph · label · context pill / big value · context / progress bar.
//
//   (◎) New leases          [This month]
//   8   of 84 units
//   ▬▬▬▬▬▬▬▬────────────────
//
// Each KPI has its own colour from the harmonised ACCENT2 set (teal · blue · violet · rose —
// matched softness, so they sit together calmly) for its glyph and progress bar. Pills are neutral;
// STATUS is a small dot inside the pill (statusTone, TONES2), e.g. green "On-track", red "Priority: 2".
//
//   <KpiStrip items={[
//     { accent: ACCENT2.teal, icon: 'ti-file-text', label: 'New leases', pill: 'This month', value: 8, sub: 'of 84 units', pct: 9.5 },
//     { accent: ACCENT2.blue, icon: 'ti-wallet', label: 'Rent collected', pill: 'Behind', statusTone: TONES2.error, value: '94.2%', pct: 94.2 },
//   ]} />
//
// Item: { accent (ACCENT2 entry, default blue), icon, label, pill, statusTone (TONES2 → status dot in the pill), value (node), sub,
//         pct (0–100 → progress bar; omit for none) }
// Responsive (utilities.css .un2-kpi-strip): 4 columns → 2 × 2 (≤ 1024px) → 1 column (≤ 600px).

const S = {
  strip: {
    fontFamily: F2.body, background: G2.glass, border: 'none', borderRadius: R2.xxl,   // container standard: no border, minimal SH2.glass shadow
    boxShadow: SH2.glass, overflow: 'hidden',
  },
  item:  { minWidth: 0, padding: pad(SP2.xl, LAYOUT2.cardX), display: 'flex', flexDirection: 'column' },
  head:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: SP2.sm },
  label: { ...UI2.row(SP2.sm), minWidth: 0, ...T2.kpiLabel },
  pill:  { ...UI2.pill(TONES2.neutral), padding: pad(SP2.xxs, SP2.sm), color: C2.textSecondary, background: C2.surfaceMuted },
  dot:   (t) => UI2.statusDot(t),   // red / green dots use their gradient
  body:  { display: 'flex', alignItems: 'baseline', gap: SP2.sm, marginTop: SP2.md, minWidth: 0 },
  value: { ...T2.kpiValue, whiteSpace: 'nowrap' },   // standard KPI figure — 20px / 400
  sub:   { ...UI2.text.caption, ...UI2.truncate, minWidth: 0 },
  icon:  (a) => ({ ...UI2.iconBox(SZ2.icon.sm, { soft: a.soft, strong: a.fg }, { round: true }) }),
  track: (a) => ({ ...UI2.progressTrack, height: SZ2.progress - SP2.xxs, marginTop: SP2.lg, background: a.soft }),
  fill:  (a) => ({ height: '100%', borderRadius: R2.pill, background: `linear-gradient(90deg, ${a.bar[0]} 0%, ${a.bar[1]} 100%)` }),
};

export default function KpiStrip({ items = [] }) {
  return (
    <section className="un2-kpi-strip" style={S.strip}>
      {items.map((k, i) => {
        const a = k.accent || ACCENT2.blue;
        const pct = k.pct == null ? null : Math.max(0, Math.min(100, Number(k.pct) || 0));
        return (
          <div key={k.label} className="un2-row-hover" style={S.item}>
            <div style={S.head}>
              <span style={S.label}>
                <span style={S.icon(a)}><i className={`ti ${k.icon}`} aria-hidden="true" /></span>
                <span style={UI2.truncate}>{k.label}</span>
              </span>
              {k.pill && (
                <span style={S.pill}>
                  {k.statusTone && <span style={S.dot(k.statusTone)} aria-hidden="true" />}
                  {k.pill}
                </span>
              )}
            </div>
            <div style={S.body}>
              <span style={S.value}>{k.value}</span>
              {k.sub && <span style={S.sub} title={typeof k.sub === 'string' ? k.sub : undefined}>{k.sub}</span>}
            </div>
            {pct != null && (
              <div style={S.track(a)}>
                <div className="un2-grow-x" style={{ ...S.fill(a), width: `${pct}%`, '--un2-delay': `${0.4 + i * 0.08}s` }} />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
