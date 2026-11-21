import React from 'react';
import { C2, TONES2, FS2, FW2, LH2, LS2, T2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── InsightCard (Design System v2) ──────────────────────────────────────────
// Compact tinted insight / recommendation panel:
//   [icon] Title                                   ┌──────────┐
//   Short body copy (2–3 lines)                    │  visual  │
//   ACTION LABEL →                                 └──────────┘
// The visual (sparkline, illustration icon…) sits in its own column — never
// over the text. Put two side by side in a `un2-grid-2`.
//
//   <InsightCard tone={TONES2.success} icon="ti-trending-up" title="Rent Trend Analysis"
//                actionLabel="Review market comp" onAction={…}
//                visual={<Sparkline … />}>
//     Local market data suggests a 4.2% potential increase…
//   </InsightCard>

const S = {
  // Spacing rhythm: padding 16 / 20 · title → quote 8 · quote → action 12 · text ↔ visual 20
  card:   (t) => ({ ...UI2.tonePanel(t), padding: pad(SP2.lg, SP2.xl), display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'end', columnGap: SP2.xl, rowGap: SP2.md, fontFamily: UI2.card.fontFamily }),
  head:   { ...UI2.row(SP2.sm), marginBottom: SP2.sm },
  title:  { fontSize: FS2.base, fontWeight: FW2.semibold, lineHeight: LH2.heading, color: C2.textPrimary },
  // Description = a short recommendation (one sentence): Inter italic, in double quotes (T2.insight)
  body:   { ...T2.insight, color: C2.textSecondary, marginBottom: SP2.md },
  action: (col) => ({ ...UI2.btn.link, fontSize: FS2.xs, fontWeight: FW2.semibold, letterSpacing: LS2.wide, textTransform: 'uppercase', color: col }),
  visual: { width: SZ2.insightVisual.w, height: SZ2.insightVisual.h, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' },
};

export default function InsightCard({
  tone = TONES2.primary, icon, title, titleColor, children,
  actionLabel, onAction, visual,
}) {
  return (
    <div style={S.card(tone)}>
      <div style={{ minWidth: 0 }}>
        <div style={S.head}>
          {icon && (
            <div style={UI2.iconBox(SZ2.icon.xs, tone, { solid: true })}>
              <i className={`ti ${icon}`} style={{ fontSize: FS2.sm }} aria-hidden="true" />
            </div>
          )}
          <div style={{ ...S.title, ...(titleColor ? { color: titleColor } : {}) }}>{title}</div>
        </div>
        <div style={S.body}>&ldquo;{children}&rdquo;</div>
        {actionLabel && (
          <button type="button" className="un2-link-arrow" style={S.action(tone.fg)} onClick={onAction}>
            {actionLabel} <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        )}
      </div>
      {visual && <div style={S.visual}>{visual}</div>}
    </div>
  );
}
