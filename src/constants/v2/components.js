// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Design System v2 · Reusable component styles
// Built only from v2 tokens. Spread these into inline styles, then add the
// page-specific bits (position, grid area…) on top:
//
//   import { UI2, TONES2 } from '../../constants/v2';
//   <div style={UI2.card}>
//   <div style={UI2.iconBox(SZ2.icon.md, TONES2.success)}>
//   <span style={UI2.pill(TONES2.warning)}>Next 30 days</span>
//   <button style={UI2.btn.success}>Save</button>
// ─────────────────────────────────────────────────────────────────────────────

import { C2, G2, R2, SH2, TONES2 } from './colors';
import { F2, FS2, FW2, LH2, LS2, T2 } from './fonts';
import { SP2, SZ2, MOTION2, LAYOUT2, pad } from './layout';

const center = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

const btnBase = {
  ...center,
  gap: SP2.sm,
  minHeight: SZ2.control.md,
  padding: pad(SP2.sm, SP2.lg),
  border: 'none',
  borderRadius: R2.button,
  fontFamily: F2.body,
  fontSize: FS2.base,
  fontWeight: FW2.semibold,
  lineHeight: LH2.heading,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `filter ${MOTION2.fast}, background ${MOTION2.fast}`,
};

// Icon glyph size that fits a given box size
const glyphFor = (size) => (size >= SZ2.icon.lg ? FS2.xxl : size >= SZ2.icon.md ? FS2.xl : size >= SZ2.icon.sm ? FS2.lg : FS2.base);

export const UI2 = {
  // ── Layout helpers ─────────────────────────────────────────────────────────
  center,
  row:        (gap = SP2.sm) => ({ display: 'flex', alignItems: 'center', gap }),
  rowBetween: (gap = SP2.md) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap }),
  stack:      (gap = SP2.sm) => ({ display: 'flex', flexDirection: 'column', gap }),
  truncate:   { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  // ── Surfaces ───────────────────────────────────────────────────────────────
  card: {
    background: C2.surface,
    border: `1px solid ${C2.cardBorder}`,
    borderRadius: R2.xxl,
    boxShadow: SH2.card,
    padding: pad(LAYOUT2.cardY, LAYOUT2.cardX),
  },
  darkCard: {
    background: G2.darkCard,
    color: C2.onDark.text,
    borderRadius: R2.xxl,
    boxShadow: SH2.dark,
    padding: pad(LAYOUT2.cardY, LAYOUT2.cardY),
  },
  toneCard: (t) => ({
    position: 'relative',
    overflow: 'hidden',
    background: G2.tone(t),
    border: `1px solid ${t.cardBorder}`,
    borderRadius: R2.xxl,
    boxShadow: SH2.card,
  }),
  tonePanel: (t) => ({
    position: 'relative',
    overflow: 'hidden',
    background: G2.panel(t),
    border: `1px solid ${t.panelBorder}`,
    borderRadius: R2.xl,
    padding: pad(LAYOUT2.cardY, LAYOUT2.cardX),
    boxShadow: SH2.tile,
  }),
  // White inner tile inside a card (list items, mini panels)
  tile: {
    background: C2.surface,
    border: `1px solid ${C2.cardBorder}`,
    borderRadius: R2.lg,
    boxShadow: SH2.tile,
  },
  listRow: { display: 'flex', alignItems: 'center', gap: LAYOUT2.rowGap, padding: pad(LAYOUT2.rowGap, SP2.xs), borderTop: `1px solid ${C2.border}` },

  // ── Card header ────────────────────────────────────────────────────────────
  cardHeader:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: LAYOUT2.rowGap, marginBottom: LAYOUT2.cardHeaderGap },
  cardTitle:    { ...T2.sectionTitle },
  cardSubtitle: { ...T2.cardSubtitle, marginTop: SP2.xxs },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    title:    { fontSize: FS2.base, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.heading },
    titleLg:  { fontSize: FS2.md, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.heading },
    body:     { ...T2.body },
    meta:     { fontSize: FS2.sm, color: C2.textMuted, lineHeight: LH2.body },
    label:    { fontSize: FS2.sm, color: C2.textSecondary, lineHeight: LH2.body },
    caption:  { ...T2.caption },
    stat:     { fontSize: FS2.lg, fontWeight: FW2.bold, color: C2.textPrimary, lineHeight: LH2.tight },
    statLg:   { ...T2.statValue },
    number:   { fontFamily: F2.heading, fontWeight: FW2.bold, color: C2.navyDeep, lineHeight: LH2.none },
    eyebrow:  { ...T2.eyebrow },
  },

  // ── Icon boxes / avatars ───────────────────────────────────────────────────
  // tone: a TONES2 entry, or { soft, strong } pair
  iconBox: (size = SZ2.icon.md, tone = TONES2.primary, { round = false, solid = false } = {}) => ({
    ...center,
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: round ? R2.round : (size >= SZ2.icon.md ? R2.lg : R2.md),
    background: solid ? tone.strong : tone.soft,
    color: solid ? C2.white : tone.strong,
    fontSize: glyphFor(size),
  }),
  avatar: (size = SZ2.icon.md, tone = TONES2.primary) => ({
    ...center,
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: R2.round,
    background: tone.soft,
    color: tone.fg,
    fontSize: size >= SZ2.icon.md ? FS2.sm : FS2.xs,
    fontWeight: FW2.semibold,
  }),

  // ── Pills / tags / badges ──────────────────────────────────────────────────
  pill: (tone = TONES2.neutral, { solid = false } = {}) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: SP2.xs,
    padding: pad(SP2.xs, SP2.md),
    borderRadius: R2.pill,
    background: solid ? tone.strong : tone.soft,
    color: solid ? C2.white : tone.fg,
    fontSize: FS2.xs,
    fontWeight: FW2.semibold,
    lineHeight: LH2.heading,
    whiteSpace: 'nowrap',
  }),
  tag: (tone = TONES2.neutral) => ({
    display: 'inline-block',
    padding: pad(SP2.xxs, SP2.sm),
    borderRadius: R2.xs,
    background: tone.soft,
    color: tone.fg,
    fontSize: FS2.xxs,
    fontWeight: FW2.bold,
    letterSpacing: LS2.wide,
    lineHeight: LH2.body,
  }),
  countBadge: {
    ...center,
    minWidth: SZ2.icon.xs,
    height: SZ2.icon.xs,
    padding: pad(0, SP2.sm),
    borderRadius: R2.pill,
    background: C2.warning,
    color: C2.navyDeep,
    fontSize: FS2.xs,
    fontWeight: FW2.bold,
  },
  dot: (color = C2.success) => ({ width: SZ2.dot, height: SZ2.dot, borderRadius: R2.round, background: color, flexShrink: 0 }),

  // ── Buttons ────────────────────────────────────────────────────────────────
  btn: {
    base:    btnBase,
    primary: { ...btnBase, background: G2.primaryButton, color: C2.white, boxShadow: SH2.primary },
    success: { ...btnBase, background: G2.successButton, color: C2.white, boxShadow: SH2.success },
    dark:    { ...btnBase, background: C2.black, color: C2.white, boxShadow: SH2.darkButton },
    outline: { ...btnBase, background: C2.white, color: C2.textPrimary, border: `1px solid ${C2.cardBorder}`, boxShadow: SH2.control },
    ghostOnDark: { ...btnBase, background: C2.onDark.surface, color: C2.white, border: `1px solid ${C2.onDark.border}`, backdropFilter: 'blur(6px)' },
    link: {
      display: 'inline-flex', alignItems: 'center', gap: SP2.xs, padding: 0, background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.semibold, color: C2.primary, whiteSpace: 'nowrap',
    },
    icon: (size = SZ2.control.md) => ({
      ...center, position: 'relative', width: size, height: size, flexShrink: 0, padding: 0,
      borderRadius: R2.round, border: 'none', background: 'transparent', color: C2.navyDeep, cursor: 'pointer', fontSize: FS2.xl,
    }),
    iconOutline: (size = SZ2.control.md) => ({
      ...center, width: size, height: size, flexShrink: 0, padding: 0,
      borderRadius: R2.button, border: `1px solid ${C2.cardBorder}`, background: C2.white, color: C2.textPrimary, cursor: 'pointer', fontSize: FS2.lg,
      boxShadow: SH2.control,
    }),
  },

  // ── Inputs ─────────────────────────────────────────────────────────────────
  // Pill search field wrapper (pair with className="un2-focus-ring")
  searchField: {
    display: 'flex', alignItems: 'center', gap: SP2.sm, height: SZ2.control.md, padding: pad(0, SP2.sm, 0, SP2.lg),
    background: C2.white, border: `1px solid ${C2.cardBorder}`, borderRadius: R2.pill, boxShadow: SH2.control,
  },

  // ── Misc ───────────────────────────────────────────────────────────────────
  progressTrack: { height: SZ2.progress, borderRadius: R2.pill, background: C2.surfaceMuted, overflow: 'hidden' },
  progressFill:  (pct, bg = G2.successButton) => ({ width: `${pct}%`, height: '100%', borderRadius: R2.pill, background: bg }),
  divider:       { height: 1, background: C2.border, border: 'none' },
  empty:         { padding: pad(SP2.xxl, SP2.sm), textAlign: 'center', color: C2.textMuted, fontSize: FS2.base },
  errorBanner:   {
    display: 'flex', alignItems: 'center', gap: SP2.sm, padding: pad(SP2.md, SP2.lg), borderRadius: R2.lg,
    background: C2.errorTint, border: `1px solid ${C2.errorLight}`, color: C2.errorDark, fontSize: FS2.base,
  },
  thumb: { width: SZ2.thumb.w, height: SZ2.thumb.h, borderRadius: R2.lg, objectFit: 'cover', display: 'block', boxShadow: SH2.md },
};
