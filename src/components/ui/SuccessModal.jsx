import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { C2, G2, R2, SH2, F2, FS2, FW2, LH2, LS2, SP2, SZ2, ZI2, BLUR2, ACCENT2, pad, T2, UI2 } from '../../constants';
import { useModalChrome } from './Modal';
import brandLogo from '../../assets/brand/urban-nest-logo.png';

// ─── SuccessModal (Design System v2) — THE "it worked" pop-up ───────────────
// Celebration pop-up for completed actions (Pay & Publish, payment done, application sent…). Same scrim,
// rise-in and close behaviour as Modal (useModalChrome), but its own layout — a brand banner with a
// confetti burst and an animated check, then a receipt ticket of what just happened.
//
//   ╭──────────────────────────────────────────╮
//   │▓▓ navy brand gradient · confetti ·  (×) ▓│  BANNER — UrbanNest logo (white) · drifting light orbs
//   │▓▓ [⌂] UrbanNest        ◎◎((✓))◎◎       ▓│           check badge pops in with two pulse rings
//   │▓▓▓▓▓▓▓▓▓▓▓▓▓ curved bottom edge ▓▓▓▓▓▓▓▓▓│
//   │            Listing published!             │  TITLE — Playfair FS2.xxl · message T2.body
//   │     Unit 101 is now live on the market    │
//   │  ┌──────────────────────────────────────┐ │
//   │  │ [photo]  LL01 · Unit 101   ● LIVE     │ │  TICKET — photo · name · sub · status pill
//   │  ●- - - - - - - - - - - - - - - - - - - -● │           punched notches + dashed tear line
//   │  │ Plan                       Premium    │ │           detail rows (label · value)
//   │  │ Amount paid                 $49.00    │ │
//   │  │ Live until             Dec 24, 2026   │ │
//   │  └──────────────────────────────────────┘ │
//   │   [ View listing ]   [ Done → ]           │  ACTIONS — soft + brand, sharing the width
//   ╰──────────────────────────────────────────╯
//
//   <SuccessModal title="Listing published!" message="Unit 101 is now live on the marketplace."
//     item={{ image: coverUrl, fallback: placeholder, name: 'LL01 · Unit 101', sub: '2 Bedroom · $1,200/mo', status: 'Live' }}
//     details={[{ label: 'Plan', value: 'Premium (30 days)' }, { label: 'Amount paid', value: '$49.00', strong: true }]}
//     primary={{ label: 'Done', icon: 'ti-arrow-right', onClick: done }} secondary={{ label: 'View listing', onClick: view }}
//     onClose={done} />
//
// Props: title · message · icon (badge glyph, default 'ti-check') · item ({ image, fallback, name, sub, status })
//        details [{ label, value, strong? }] · primary / secondary ({ label, icon?, onClick }) · onClose
// Colours: brand navy banner, light-blue check, confetti in the calm ACCENT2 blue · teal · violet · rose set
// (never yellow / green). Motion stops for prefers-reduced-motion.

const CONFETTI = 48;   // pieces, spread evenly across the full banner width (index × 7 mod N — 7 is co-prime with 48); they fall ONCE
const SPARKLES = [{ x: 14, y: 30, s: 1 }, { x: 28, y: 62, s: 0.7 }, { x: 70, y: 24, s: 0.8 }, { x: 84, y: 58, s: 1 }, { x: 58, y: 14, s: 0.6 }, { x: 40, y: 18, s: 0.55 }];
const CONFETTI_COLORS = [C2.white, C2.skyOnDark, ACCENT2.teal.bar[1], ACCENT2.violet.bar[1], ACCENT2.rose.bar[1], C2.primaryLight];

const S = {
  scrim: { position: 'fixed', inset: 0, zIndex: ZI2.modal, ...UI2.center, padding: SP2.xxl, background: G2.modalScrim, backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm },
  card:  { position: 'relative', display: 'flex', flexDirection: 'column', width: SZ2.success.w, maxWidth: '100%', maxHeight: SZ2.modal.maxH, overflow: 'hidden', outline: 'none', background: C2.white, borderRadius: R2.xxl, boxShadow: SH2.modal, fontFamily: F2.body },
  close: { ...UI2.btn.icon(SZ2.control.md), position: 'absolute', top: SP2.lg, right: SP2.lg, zIndex: 3, background: C2.onDark.surfaceHover, color: C2.white, border: `${SZ2.hairline}px solid ${C2.onDark.border}` },

  // banner
  banner:  { position: 'relative', flexShrink: 0, height: SZ2.success.banner, overflow: 'hidden', background: G2.successBanner },
  orb:     (i) => ({ position: 'absolute', borderRadius: R2.round, background: G2.successOrb, width: SZ2.success.orb[i], height: SZ2.success.orb[i], ...SUCCESS_ORB_POS[i] }),
  brand:   { position: 'absolute', top: SP2.lg, left: SP2.xl, ...UI2.row(SP2.sm), zIndex: 2 },
  logo:    { height: SZ2.icon.sm, width: 'auto', aspectRatio: SZ2.brandLogoRatio, display: 'block', filter: 'brightness(0) invert(1)' },
  word:    { fontFamily: F2.heading, fontSize: FS2.lg, fontWeight: FW2.semibold, letterSpacing: LS2.snug, color: C2.white, lineHeight: LH2.tight },
  // soft light halo behind the badge (breathes slowly)
  glow:    { position: 'absolute', left: '50%', bottom: -SZ2.success.glow / 2 + SZ2.success.badge / 2 + SP2.xs, width: SZ2.success.glow, height: SZ2.success.glow, marginLeft: -SZ2.success.glow / 2, borderRadius: R2.round, background: G2.successGlow, pointerEvents: 'none' },
  // two-layer city skyline along the bottom (back layer fainter)
  skyline: { position: 'absolute', left: 0, right: 0, bottom: SZ2.success.edge / 2, width: '100%', height: SZ2.success.skyline, display: 'block', pointerEvents: 'none' },
  sparkle: (p) => ({ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: SZ2.success.sparkle * p.s, height: SZ2.success.sparkle * p.s, color: C2.white, pointerEvents: 'none' }),
  badgeWrap: { position: 'absolute', left: '50%', bottom: SP2.xs, transform: 'translateX(-50%)', width: SZ2.success.badge, height: SZ2.success.badge, zIndex: 2 },
  ring:    { position: 'absolute', inset: 0, borderRadius: R2.round, border: `2px solid ${C2.onDark.border}` },
  badge:   { position: 'absolute', inset: 0, ...UI2.center, borderRadius: R2.round, background: C2.white, color: C2.primary, boxShadow: SH2.successBadge },
  tick:    { width: '50%', height: '50%' },
  edge:    { position: 'absolute', left: 0, right: 0, bottom: -1, width: '100%', height: SZ2.success.edge, display: 'block' },
  confetti: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 },
  bit:     (i) => ({
    position: 'absolute', top: -SP2.md, left: `${(((i * 7) % CONFETTI) + 0.5) / CONFETTI * 100}%`, width: i % 3 === 0 ? SP2.sm : SP2.xs + SP2.xxs, height: i % 3 === 0 ? SP2.xs : SP2.sm + SP2.xxs,
    borderRadius: i % 2 ? R2.round : SZ2.hairline, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    '--d': `${(i % 9) * 90}ms`, '--x': `${((i % 5) - 2) * 16}px`, '--r': `${(i % 2 ? 1 : -1) * (200 + i * 15)}deg`, '--t': `${2.6 + (i % 4) * 0.45}s`,
  }),

  // content
  body:    { ...UI2.stack(SP2.lg), alignItems: 'stretch', overflowY: 'auto', padding: pad(SP2.md, SP2.xxl, SP2.xxl) },
  titles:  { ...UI2.stack(SP2.xs), alignItems: 'center', textAlign: 'center' },
  title:   { ...T2.sectionTitle, fontSize: FS2.xxl, lineHeight: LH2.tight, color: C2.navyDeep, margin: 0 },
  msg:     { ...T2.body, color: C2.textSecondary, margin: 0, maxWidth: SZ2.success.msgMax },

  // ticket
  ticket:  { position: 'relative', borderRadius: R2.xl, background: C2.pageBg },
  tTop:    { ...UI2.row(SP2.md), padding: SP2.md },
  thumb:   { position: 'relative', flexShrink: 0, width: SZ2.icon.lg + SP2.md, height: SZ2.icon.lg + SP2.md, borderRadius: R2.lg, overflow: 'hidden', boxShadow: SH2.md, background: C2.surfaceMuted },
  tText:   { ...UI2.stack(SP2.xxs), flex: 1, minWidth: 0 },
  tName:   { ...UI2.text.titleLg, ...UI2.truncate },
  tSub:    { ...UI2.text.meta, ...UI2.truncate },
  status:  { ...UI2.pill(), ...UI2.row(SP2.xs), flexShrink: 0 },
  live:    { width: SP2.sm - SP2.xxs, height: SP2.sm - SP2.xxs, borderRadius: R2.round, background: C2.primary },
  tear:    { position: 'relative', height: 0, margin: pad(0, SP2.md), borderTop: `${SZ2.dashed}px dashed ${C2.cardBorder}` },
  notch:   (side) => ({ position: 'absolute', top: -SZ2.success.notch / 2, [side]: -(SP2.md + SZ2.success.notch / 2), width: SZ2.success.notch, height: SZ2.success.notch, borderRadius: R2.round, background: C2.white }),
  rows:    { ...UI2.stack(SP2.sm), padding: pad(SP2.md, SP2.lg, SP2.lg) },
  row:     { ...UI2.row(SP2.md), justifyContent: 'space-between', fontSize: FS2.base, lineHeight: LH2.heading },
  rLabel:  { color: C2.textSecondary },
  rValue:  (strong) => ({ color: C2.textPrimary, fontWeight: strong ? FW2.semibold : FW2.medium, textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...(strong ? { fontSize: FS2.md, color: C2.navyDeep } : {}) }),

  acts:    { ...UI2.row(SP2.sm) },
  btn:     (main) => ({ ...(main ? UI2.btn.brand : UI2.btn.soft), flex: '1 1 0', justifyContent: 'center', minHeight: SZ2.field }),
};

// soft light orbs drifting in the banner (positions only — sizes in SZ2.success.orb)
const SUCCESS_ORB_POS = [
  { top: -SP2.huge, left: -SP2.xxl },
  { top: SP2.lg, right: -SP2.xxxl },
  { bottom: -SP2.huge, left: '38%' },
];

export default function SuccessModal({
  title, message, icon = 'ti-check', item, details = [], primary, secondary, onClose,
}) {
  const cardRef = useRef(null);
  useModalChrome(onClose, cardRef);

  return createPortal(
    <div className="un2-modal-scrim" style={S.scrim} onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={cardRef} tabIndex={-1} className="un2-modal" style={S.card} role="alertdialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <button type="button" className="un2-btn" style={S.close} onClick={onClose} aria-label="Close"><i className="ti ti-x" aria-hidden="true" /></button>

        {/* ── banner ── */}
        <div style={S.banner}>
          {SUCCESS_ORB_POS.map((_, i) => <span key={i} className="un2-success-orb" style={{ ...S.orb(i), '--k': i }} aria-hidden="true" />)}
          <span className="un2-success-glow" style={S.glow} aria-hidden="true" />
          <svg style={S.skyline} viewBox="0 0 440 60" preserveAspectRatio="none" aria-hidden="true">
            <path fill={C2.onDark.surfaceSoft} d="M0 60 V34 H22 V22 H40 V30 H58 V14 H78 V26 H96 V38 H120 V18 H136 V8 H152 V20 H170 V32 H196 V24 H214 V12 H232 V28 H252 V36 H276 V20 H292 V10 H310 V24 H330 V34 H352 V16 H370 V26 H390 V20 H410 V32 H440 V60 Z" />
            <path fill={C2.onDark.surface} d="M0 60 V44 H30 V36 H52 V46 H74 V32 H98 V42 H128 V30 H146 V40 H176 V46 H204 V34 H226 V42 H258 V30 H280 V44 H306 V36 H334 V46 H360 V32 H384 V42 H410 V38 H440 V60 Z" />
          </svg>
          {SPARKLES.map((p, i) => (
            <svg key={i} className="un2-success-sparkle" style={{ ...S.sparkle(p), '--k': i }} viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 0 C12.8 7 17 11.2 24 12 C17 12.8 12.8 17 12 24 C11.2 17 7 12.8 0 12 C7 11.2 11.2 7 12 0 Z" />
            </svg>
          ))}
          <div style={S.confetti} aria-hidden="true">
            {Array.from({ length: CONFETTI }, (_, i) => <span key={i} className="un2-confetti" style={S.bit(i)} />)}
          </div>
          <div style={S.brand}>
            <img src={brandLogo} alt="" style={S.logo} />
            <span style={S.word}>UrbanNest</span>
          </div>
          <svg style={S.edge} viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40 V22 C 110 2, 290 2, 400 22 V40 Z" fill={C2.white} />
          </svg>
          <div style={S.badgeWrap} aria-hidden="true">
            <span className="un2-success-ring" style={S.ring} />
            <span className="un2-success-ring is-late" style={S.ring} />
            <span className="un2-success-badge" style={S.badge}>
              {icon === 'ti-check' ? (
                <svg className="un2-success-tick" style={S.tick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
                </svg>
              ) : <i className={`ti ${icon}`} style={{ fontSize: FS2.display }} />}
            </span>
          </div>
        </div>

        {/* ── content ── */}
        <div style={S.body}>
          <div className="un2-success-rise" style={{ ...S.titles, '--k': 0 }}>
            {title && <h2 style={S.title}>{title}</h2>}
            {message && <p style={S.msg}>{message}</p>}
          </div>

          {(item || details.length > 0) && (
            <div className="un2-success-rise" style={{ ...S.ticket, '--k': 1 }}>
              {item && (
                <div style={S.tTop}>
                  {(item.image || item.fallback) && (
                    <span style={S.thumb}>
                      <img src={item.image || item.fallback} alt="" style={UI2.photoMedia}
                        onError={e => { if (item.fallback && e.currentTarget.src !== item.fallback) e.currentTarget.src = item.fallback; }} />
                    </span>
                  )}
                  <div style={S.tText}>
                    {item.name && <span style={S.tName}>{item.name}</span>}
                    {item.sub && <span style={S.tSub}>{item.sub}</span>}
                  </div>
                  {item.status && <span style={S.status}><span className="un2-live-dot" style={S.live} />{item.status}</span>}
                </div>
              )}
              {item && details.length > 0 && (
                <div style={S.tear} aria-hidden="true"><span style={S.notch('left')} /><span style={S.notch('right')} /></div>
              )}
              {details.length > 0 && (
                <div style={S.rows}>
                  {details.map(d => (
                    <div key={d.label} style={S.row}>
                      <span style={S.rLabel}>{d.label}</span>
                      <span style={S.rValue(d.strong)}>{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(primary || secondary) && (
            <div className="un2-success-rise" style={{ ...S.acts, '--k': 2 }}>
              {secondary && (
                <button type="button" className="un2-btn" style={S.btn(false)} onClick={secondary.onClick}>
                  {secondary.icon && <i className={`ti ${secondary.icon}`} style={UI2.btnIcon} aria-hidden="true" />}{secondary.label}
                </button>
              )}
              {primary && (
                <button type="button" className="un2-btn" style={S.btn(true)} onClick={primary.onClick}>
                  {primary.label}{primary.icon && <i className={`ti ${primary.icon}`} style={UI2.btnIcon} aria-hidden="true" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
