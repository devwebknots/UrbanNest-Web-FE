import React from 'react';
import { C2, TONES2, SZ2, LAYOUT2, UI2 } from '../../constants/v2';

// ─── SectionCard + CardHeader (Design System v2) ─────────────────────────────
// White (or dark) card with the standard header: icon box · title · subtitle,
// and an optional right-side action. Padding and header spacing come from
// LAYOUT2 — never add your own.
//
//   <SectionCard icon="ti-tool" title="Open Operations" subtitle="…"
//                action={<button style={UI2.btn.link}>View all</button>}>
//     …body…
//   </SectionCard>
//
// Props:
//   icon       tabler icon class (e.g. 'ti-tool')
//   tone       TONES2 entry for the icon box (default primary)
//   plainIcon  true → icon without the tinted box
//   title, subtitle, action
//   variant    'light' (default) | 'dark' (navy card, white text)
//   as         element/tag, default 'div' (use 'section' for page sections)
//   style, className

export function CardHeader({ icon, tone = TONES2.primary, plainIcon = false, title, subtitle, action, dark = false }) {
  const iconTone = dark ? { soft: C2.onDark.surface, strong: C2.white } : tone;
  return (
    <div style={UI2.cardHeader}>
      <div style={{ ...UI2.row(LAYOUT2.rowGap), minWidth: 0, flex: 1 }}>
        {icon && (
          <div style={{ ...UI2.iconBox(SZ2.icon.md, iconTone), ...(plainIcon ? { background: 'transparent' } : {}) }}>
            <i className={`ti ${icon}`} aria-hidden="true" />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...UI2.cardTitle, ...(dark ? { color: C2.white } : {}) }}>{title}</div>
          {subtitle && <div style={UI2.cardSubtitle}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function SectionCard({
  icon, tone, plainIcon, title, subtitle, action,
  variant = 'light', as: Tag = 'div', style, className, children,
}) {
  const dark = variant === 'dark';
  const base = dark ? { ...UI2.darkCard, display: 'flex', flexDirection: 'column' } : UI2.card;
  return (
    <Tag className={className} style={{ ...base, ...style }}>
      {title && (
        <CardHeader icon={icon} tone={tone} plainIcon={plainIcon} title={title} subtitle={subtitle} action={action} dark={dark} />
      )}
      {children}
    </Tag>
  );
}
