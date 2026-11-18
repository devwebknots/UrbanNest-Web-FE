import React from 'react';
import { C2, G2, R2, SH2, F2, FS2, FW2, SP2, SZ2, pad, UI2 } from '../../constants/v2';

// ─── TabBar (Design System v2) ───────────────────────────────────────────────
// Two looks, same API:
//   variant="pill"      — glass bar under a hero; active tab uses the dark-blue brand button gradient (G2.brandButton)
//                          (page-level sections: Overview · Units · Maintenance …)
//   variant="underline" — compact tabs inside a card (Chats · Notifications)
//
//   <TabBar value={tab} onChange={setTab}
//           tabs={[{ id: 'overview', label: 'Overview', icon: 'ti-home' }, …]} />
//
// Props: tabs [{ id, label, icon?, count? }], value, onChange, variant,
//        trailing (node at the right end, underline variant), ariaLabel
// Narrow screens: the pill bar scrolls sideways instead of wrapping.

const S = {
  pillBar: {
    display: 'flex', gap: SP2.xs, padding: SP2.xs, overflowX: 'auto',
    background: G2.glass, border: `1px solid ${C2.glassBorder}`, borderRadius: R2.xl, boxShadow: SH2.glass,
  },
  pill: (active) => ({
    ...UI2.center, gap: SP2.sm, flex: '1 0 auto', minHeight: SZ2.control.lg, padding: pad(0, SP2.lg),
    border: 'none', borderRadius: R2.lg, cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: F2.body, fontSize: FS2.base, fontWeight: active ? FW2.semibold : FW2.medium,
    background: active ? G2.brandButton : 'transparent',
    color: active ? C2.white : C2.textPrimary,
    boxShadow: active ? SH2.brandButton : 'none',
  }),
  lineBar: { display: 'flex', alignItems: 'center', gap: SP2.xs, borderBottom: `${SZ2.hairline}px solid ${C2.border}` },
  line: (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: SP2.sm,
    padding: pad(SP2.sm, SP2.md), marginBottom: -SZ2.hairline, border: 'none', background: 'none', cursor: 'pointer',
    borderBottom: `2px solid ${active ? C2.primary : 'transparent'}`,
    fontFamily: F2.body, fontSize: FS2.base, fontWeight: active ? FW2.semibold : FW2.regular,
    color: active ? C2.textPrimary : C2.textSecondary, whiteSpace: 'nowrap',
  }),
  icon:  { fontSize: FS2.lg },
  count: { ...UI2.pill(), padding: pad(0, SP2.sm) },
};

export default function TabBar({ tabs = [], value, onChange, variant = 'pill', trailing, ariaLabel = 'Sections' }) {
  const pill = variant === 'pill';
  return (
    <div role="tablist" aria-label={ariaLabel} className={pill ? 'un2-scroll-hidden' : undefined} style={pill ? S.pillBar : S.lineBar}>
      {tabs.map(t => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={pill && !active ? 'un2-row-hover' : undefined}
            style={pill ? S.pill(active) : S.line(active)}
            onClick={() => onChange && onChange(t.id)}
          >
            {t.icon && <i className={`ti ${t.icon}`} style={S.icon} aria-hidden="true" />}
            {t.label}
            {t.count != null && <span style={S.count}>{t.count}</span>}
          </button>
        );
      })}
      {trailing && <div style={{ marginLeft: 'auto', paddingBottom: pill ? 0 : SP2.xs }}>{trailing}</div>}
    </div>
  );
}
