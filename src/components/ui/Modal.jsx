import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, LS2, SP2, SZ2, ZI2, BLUR2, TONES2, pad, T2, UI2 } from '../../constants';
import brandLogo from '../../assets/brand/urban-nest-logo.png';
import defaultMedia from '../../assets/landlord/sidebar-building.jpg';

// ─── Modal (Design System v2) — THE standard pop-up (UrbanNest template) ─────
// Every v2 pop-up (forms, details, confirmations) uses this one component — never hand-build an overlay.
// Template (user design 2026-11-24): photo panel on the left with a curved white edge + blue swoosh, and on the
// right the UrbanNest logo, a big Playfair title, the subtitle, the content and the buttons.
//
//   ╭───────────────┬──────────────────────────────────────╮
//   │               (  [⌂] UrbanNest                   (×) │  BRAND — logo mark + wordmark (every modal)
//   │   building     ) Add New Property                     │  TITLE — Playfair FS2.xxl · subtitle T2.body
//   │   photo       (  Create a property and manage …       │
//   │               )                                       │
//   │   (media)    (    …content (scrolls on its own)…      │  BODY — ModalSection groups for long forms
//   │             ⌒⌒)                                       │
//   │  ⌒ blue swoosh  )            [Cancel] [Create …]      │  FOOTER — note / info left, buttons right
//   ╰───────────────┴──────────────────────────────────────╯
//
//   <Modal title="Add New Property" subtitle="Create a property and manage all your units in one place."
//          onClose={close} footer={<><button style={UI2.btn.soft}>Cancel</button><button style={UI2.btn.brand}>Create</button></>}>
//     …fields…
//   </Modal>
//
//   Long form:     <ModalSection icon="ti-home" title="Basics" hint="…"> …fields… </ModalSection> (divider between sections)
//   Own photo:     media={prop.main_image_url}  or  media={{ image, fallback, caption: <node on the photo> }}
//   No photo:      media={false}  (narrow dialogs — logo + title only)
//   Confirmation:  <Modal variant="confirm" icon="ti-refresh" tone={TONES2.primary} title="Reactivate profile?" footer={…}>
//                  → no photo, centred logo · icon · title · text, buttons share the width
//   Preview panel: aside={<…/>} asideTitle="Live preview" → extra soft panel on the right (hidden below 860px)
//
// Props: title · subtitle · eyebrow (small pill above the title) · icon + tone (confirm icon / no-media header)
//        size ('sm' 440 | 'md' 520 | 'lg' 760 = content width, SZ2.modal; the photo panel adds SZ2.modal.media) or width
//        variant ('default' | 'confirm') · media (default building photo | url | { image, fallback, caption } | false)
//        footer · note (red error, left of the buttons) · info (neutral ⓘ note) · brand (default true — logo row)
//        aside · asideTitle · asideHint · onClose · children
// Behaviour: portal on document.body · dimmed + blurred page · card rises in (un2-modal) · photo settles in ·
//            closes on ×, Esc and a click on the backdrop · page behind does not scroll · focus moves into the card.

const S = {
  scrim: { position: 'fixed', inset: 0, zIndex: ZI2.modal, ...UI2.center, padding: SP2.xxl, background: G2.modalScrim, backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm },
  card:  (w) => ({
    position: 'relative', display: 'flex', width: w, maxWidth: '100%', maxHeight: SZ2.modal.maxH,
    overflow: 'hidden', outline: 'none', background: C2.white, borderRadius: R2.xxl, boxShadow: SH2.modal, fontFamily: F2.body,
  }),
  close: { ...UI2.btn.icon(SZ2.control.md), position: 'absolute', top: SP2.lg, right: SP2.lg, zIndex: 3, color: C2.textSecondary, background: C2.surfaceMuted },

  // photo panel (left) — curved white edge + blue swoosh drawn by an SVG on its right / bottom
  media:     { position: 'relative', flexShrink: 0, width: SZ2.modal.media, overflow: 'hidden', background: C2.navyDeep },
  mediaImg:  { ...UI2.photoMedia },
  mediaTint: { position: 'absolute', inset: 0, background: G2.modalMedia, pointerEvents: 'none' },
  mediaEdge: { position: 'absolute', top: 0, right: -1, height: '100%', width: SZ2.modal.mediaCurve, pointerEvents: 'none' },
  caption:   { position: 'absolute', left: SP2.lg, right: SZ2.modal.mediaCurve, bottom: SP2.xl, zIndex: 1 },

  // content column
  main:  { display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0, minHeight: 0 },
  head:  (scrolled, confirm) => ({
    position: 'relative', flexShrink: 0, ...UI2.stack(SP2.sm), ...(confirm ? { alignItems: 'center', textAlign: 'center' } : {}),
    padding: confirm ? pad(SP2.xxl, SP2.xxl, 0) : pad(SP2.xxl, SP2.xxl + SZ2.control.md, SP2.lg, SP2.xxl),
    borderBottom: `${SZ2.hairline}px solid ${scrolled ? C2.divider : 'transparent'}`,
    boxShadow: scrolled ? SH2.modalHead : 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', zIndex: 1, background: C2.white,
  }),
  brand:    { ...UI2.row(SP2.sm), marginBottom: SP2.sm },
  logo:     { height: SZ2.icon.sm, width: 'auto', aspectRatio: SZ2.brandLogoRatio, display: 'block' },
  wordmark: { fontFamily: F2.heading, fontSize: FS2.lg, fontWeight: FW2.semibold, lineHeight: LH2.tight, letterSpacing: LS2.snug, color: C2.navy },
  wordAccent: { color: C2.primary },
  icon:  (tone, confirm) => ({ ...UI2.iconBox(confirm ? SZ2.icon.lg + SP2.sm : SZ2.icon.lg, tone), boxShadow: SH2.tile, ...(confirm ? {} : { marginBottom: SP2.xs }) }),
  eyebrow: { ...UI2.pill(), alignSelf: 'flex-start' },
  title: { ...T2.sectionTitle, fontSize: FS2.xxl, lineHeight: LH2.tight, color: C2.navyDeep, margin: 0 },
  sub:   { ...T2.body, color: C2.textSecondary, margin: 0 },

  body:  (confirm) => ({ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: confirm ? pad(SP2.md, SP2.xxl, SP2.xl) : pad(SP2.xs, SP2.xxl, SP2.xl), ...(confirm ? { textAlign: 'center' } : {}) }),
  foot:  { ...UI2.row(SP2.sm), flexShrink: 0, flexWrap: 'wrap', rowGap: SP2.sm, padding: pad(SP2.lg, SP2.xxl, SP2.xl), background: C2.white, borderTop: `${SZ2.hairline}px solid ${C2.divider}` },
  note:  { ...UI2.row(SP2.xs), flex: '1 1 auto', minWidth: 0, fontSize: FS2.sm, color: C2.errorDark },
  info:  { ...UI2.row(SP2.xs), flex: '1 1 auto', minWidth: 0, ...T2.label },
  acts:  (confirm) => ({ ...UI2.row(SP2.sm), marginLeft: 'auto', ...(confirm ? { flex: 1, marginLeft: 0 } : {}) }),

  // preview panel (aside, right)
  aside:      { ...UI2.stack(SP2.lg), flexShrink: 0, width: SZ2.modal.aside, boxSizing: 'border-box', overflowY: 'auto', margin: pad(SZ2.control.md + SP2.xl, SP2.lg, SP2.lg, 0), padding: SP2.xl, borderRadius: R2.xl, background: C2.pageBg },
  asideHead:  { ...UI2.stack(SP2.xxs) },
  asideTitle: { ...UI2.capsLabel, ...UI2.row(SP2.xs) },
  asideHint:  { ...UI2.text.meta },

  // ModalSection — spacing + divider live in .un2-modal-sec (utilities.css) so the first section needs no prop
  sec:      { ...UI2.stack(SP2.lg) },
  secHead:  { ...UI2.row(SP2.md) },
  secIcon:  { ...UI2.iconBox(SZ2.icon.md, TONES2.primary) },
  secText:  { ...UI2.stack(SP2.xxs), flex: 1, minWidth: 0 },
  secTitle: { ...UI2.text.titleLg, margin: 0 },
  secHint:  { ...UI2.text.meta, margin: 0 },
};

// Curved right edge of the photo panel: white sweeps in from the right, a brand-blue line rides the curve,
// and a soft blue swoosh fills the bottom-left corner (the template's look).
function MediaEdge() {
  return (
    <svg style={S.mediaEdge} viewBox="0 0 80 400" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="un2-modal-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C2.primaryLight} stopOpacity="0" />
          <stop offset="0.55" stopColor={C2.primaryLight} stopOpacity="0.55" />
          <stop offset="1" stopColor={C2.primary} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d="M80 0 H58 C 20 110, 74 250, 30 400 H80 Z" fill={C2.white} />
      <path d="M58 0 C 20 110, 74 250, 30 400" fill="none" stroke="url(#un2-modal-edge)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const WIDTH = (size) => SZ2.modal[size] || SZ2.modal.md;

export default function Modal({
  title, subtitle, icon, tone = TONES2.primary, eyebrow, size = 'md', width, variant = 'default',
  media, brand = true, footer, note, info, aside, asideTitle, asideHint, onClose, children,
}) {
  const cardRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const confirm = variant === 'confirm';

  // photo panel: default building photo · url · { image, fallback, caption } · false = none (never on confirm / aside)
  const m = confirm || aside || media === false ? null
    : (media && typeof media === 'object') ? media
    : { image: media || defaultMedia };

  // Esc closes · page behind stays still · focus moves into the card (and back when it closes)
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cardRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = prevOverflow; prevFocus?.focus?.({ preventScroll: true }); };
  }, []);

  const contentW = width || WIDTH(aside ? 'lg' : size);
  const cardW = contentW + (m ? SZ2.modal.media : 0) + (aside ? SZ2.modal.aside : 0);
  const showIcon = icon && (confirm || !brand);

  return createPortal(
    <div className="un2-modal-scrim" style={S.scrim} onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div
        ref={cardRef} tabIndex={-1} className="un2-modal" style={S.card(cardW)}
        role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}
      >
        <button type="button" className="un2-btn" style={S.close} onClick={onClose} aria-label="Close"><i className="ti ti-x" aria-hidden="true" /></button>

        {m && (
          <div className="un2-modal-media" style={S.media}>
            <img
              src={m.image || m.fallback || defaultMedia} alt="" className="un2-modal-media-img" style={S.mediaImg}
              onError={e => { const fb = m.fallback || defaultMedia; if (e.currentTarget.src !== fb) e.currentTarget.src = fb; }}
            />
            <span style={S.mediaTint} aria-hidden="true" />
            {m.caption && <div style={S.caption}>{m.caption}</div>}
            <MediaEdge />
          </div>
        )}

        <div style={S.main}>
          <div style={S.head(scrolled, confirm)}>
            {brand && (
              <div style={S.brand}>
                <img src={brandLogo} alt="" style={S.logo} />
                <span style={S.wordmark}>Urban<span style={S.wordAccent}>Nest</span></span>
              </div>
            )}
            {showIcon && <span style={S.icon(tone, confirm)} aria-hidden="true"><i className={`ti ${icon}`} /></span>}
            {eyebrow && <span style={S.eyebrow}>{eyebrow}</span>}
            {title && <h2 style={S.title}>{title}</h2>}
            {subtitle && <p style={S.sub}>{subtitle}</p>}
          </div>

          <div style={S.body(confirm)} onScroll={e => setScrolled(e.currentTarget.scrollTop > 0)}>
            {children}
          </div>

          {(footer || note || info) && (
            <div style={S.foot}>
              {note && <span style={S.note} role="alert"><i className="ti ti-alert-circle" aria-hidden="true" />{note}</span>}
              {!note && info && <span style={S.info}><i className="ti ti-info-circle" style={UI2.btnIcon} aria-hidden="true" />{info}</span>}
              {footer && <div className={confirm ? 'un2-modal-acts-fill' : undefined} style={S.acts(confirm)}>{footer}</div>}
            </div>
          )}
        </div>

        {aside && (
          <aside className="un2-modal-aside" style={S.aside}>
            {(asideTitle || asideHint) && (
              <div style={S.asideHead}>
                {asideTitle && <span style={S.asideTitle}><i className="ti ti-eye" style={UI2.btnIcon} aria-hidden="true" /> {asideTitle}</span>}
                {asideHint && <span style={S.asideHint}>{asideHint}</span>}
              </div>
            )}
            {aside}
          </aside>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── ModalSection — a titled group inside a long Modal form ──────────────────
//   <ModalSection icon="ti-map-pin" title="Address" hint="Where the property is" action={<span style={UI2.pill()}>3</span>}>
//     <Grid layout="two" as="div">…FormFields…</Grid>
//   </ModalSection>
// First section sits right under the header; the rest get a faint divider above them (.un2-modal-sec).
export function ModalSection({ icon, title, hint, action, children }) {
  return (
    <section className="un2-modal-sec" style={S.sec}>
      {(title || icon) && (
        <div style={S.secHead}>
          {icon && <span style={S.secIcon} aria-hidden="true"><i className={`ti ${icon}`} /></span>}
          <div style={S.secText}>
            {title && <h3 style={S.secTitle}>{title}</h3>}
            {hint && <p style={S.secHint}>{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
