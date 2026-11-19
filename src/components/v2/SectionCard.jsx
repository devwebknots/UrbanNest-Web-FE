import React from 'react';
import { C2, G2, SH2, TONES2, SZ2, LAYOUT2, UI2 } from '../../constants/v2';

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
//   accentIcon true → small gradient-filled icon (feature sections, e.g. AI insights)
//   badge      node shown right after the title (e.g. a UI2.pill)
//   title, subtitle, action
//   variant    'light' (default) | 'dark' (navy card, white text)
//   as         element/tag, default 'div' (use 'section' for page sections)
//   decoration background art behind the content, e.g. <CardWave />
//              (card becomes position: relative + overflow: hidden)
//   centerBody true → the body fills the card under the header and its content is centred
//              vertically (empty states in a card stretched to its row's height)
//   style, className  (the card is always a width container: class un2-cq — see CQ2)

const S = {
  centerBody: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  action:     { flexShrink: 0 },
};

export function CardHeader({ icon, tone = TONES2.primary, plainIcon = false, accentIcon = false, title, badge, subtitle, action, dark = false }) {
  const iconTone = dark ? { soft: C2.onDark.surface, strong: C2.white } : tone;
  const iconStyle = accentIcon
    ? { ...UI2.iconBox(SZ2.icon.sm, TONES2.primary, { solid: true }), background: G2.primaryButton, boxShadow: SH2.primary }
    : { ...UI2.iconBox(SZ2.icon.md, iconTone), ...(plainIcon ? { background: 'transparent' } : {}) };
  // Title stays on one line (… if the card is very narrow) so it never slides under the action
  const titleEl = <div style={{ ...UI2.cardTitle, ...UI2.truncate, ...(dark ? { color: C2.white } : {}) }} title={typeof title === 'string' ? title : undefined}>{title}</div>;
  return (
    <div className="un2-card-head" style={{ ...UI2.cardHeader, ...(dark ? { borderBottomColor: C2.onDark.borderSoft } : {}) }}>
      <div style={{ ...UI2.row(LAYOUT2.rowGap), minWidth: 0, flex: 1 }}>
        {icon && (
          <div style={iconStyle}>
            <i className={`ti ${icon}`} aria-hidden="true" />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          {badge ? <div style={{ ...UI2.row(LAYOUT2.rowGap), minWidth: 0 }}>{titleEl}{badge}</div> : titleEl}
          {subtitle && <div style={{ ...UI2.cardSubtitle, ...(dark ? { color: C2.onDark.textMuted } : {}) }}>{subtitle}</div>}
        </div>
      </div>
      {action && <div style={S.action}>{action}</div>}
    </div>
  );
}

export default function SectionCard({
  icon, tone, plainIcon, accentIcon, title, badge, subtitle, action,
  variant = 'light', as: Tag = 'div', style, className, children, decoration, centerBody = false,
}) {
  const dark = variant === 'dark';
  const base = dark ? { ...UI2.darkCard, display: 'flex', flexDirection: 'column' } : UI2.card;
  // un2-cq: content inside can react to this card's width (un2-hide-narrow / -medium in utilities.css)
  const cls = ['un2-cq', className].filter(Boolean).join(' ');
  const content = (
    <>
      {title && (
        <CardHeader icon={icon} tone={tone} plainIcon={plainIcon} accentIcon={accentIcon} title={title} badge={badge} subtitle={subtitle} action={action} dark={dark} />
      )}
      {centerBody ? <div style={S.centerBody}>{children}</div> : children}
    </>
  );
  // centerBody: body fills the space under the header, content centred vertically
  if (centerBody && !decoration) {
    return (
      <Tag className={cls} style={{ ...base, display: 'flex', flexDirection: 'column', ...style }}>
        {content}
      </Tag>
    );
  }

  // decoration: background art (e.g. <CardWave />) drawn behind the content
  if (decoration) {
    return (
      <Tag className={cls} style={{ ...base, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
        {decoration}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>{content}</div>
      </Tag>
    );
  }

  return (
    <Tag className={cls} style={{ ...base, ...style }}>
      {content}
    </Tag>
  );
}
