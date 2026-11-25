// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Design System v2 · Reusable component styles
// VERSION 2 shared styles — the v1 equivalent in this folder is styles.js (older screens).
// Built only from v2 tokens. Spread these into inline styles, then add the
// page-specific bits (position, grid area…) on top:
//
//   import { UI2, TONES2 } from '../../constants';
//   <div style={UI2.card}>
//   <div style={UI2.iconBox(SZ2.icon.md, TONES2.success)}>
//   <span style={UI2.pill(TONES2.warning)}>Next 30 days</span>
//   <button style={UI2.btn.success}>Save</button>
// ─────────────────────────────────────────────────────────────────────────────

import { C2, G2, R2, SH2, TONES2, ACCENT2 } from './colors';
import { F2, FS2, FW2, LH2, LS2, T2 } from './fonts';
import { SP2, SZ2, MOTION2, LAYOUT2, BLUR2, OP2, pad } from './layout';

// Feature / service / amenity chip icons cycle through this harmonised set (no yellow)
const CHIP_ICON_ACCENTS = [ACCENT2.blue, ACCENT2.teal, ACCENT2.violet, ACCENT2.rose];

const center = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
const rowBetween = (gap = SP2.md) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap });
const row = (gap = SP2.sm) => ({ display: 'flex', alignItems: 'center', gap });
const hairline = `1px solid ${C2.borderLight}`;
// Small caps label used as a card's heading when it has no icon header ("RENT COLLECTION")
const capsLabel = { ...T2.eyebrow, fontSize: FS2.xs, color: C2.textSecondary, letterSpacing: LS2.wide };

// Layer blur behind frosted-glass surfaces
const GLASS_BLUR = BLUR2.glass;

const btnBase = {
  ...center,
  gap: SP2.sm,
  minHeight: SZ2.control.md,
  padding: pad(SP2.xs, SP2.md),
  border: 'none',
  borderRadius: R2.button,
  fontFamily: F2.body,
  fontSize: FS2.base,
  fontWeight: FW2.medium,
  lineHeight: LH2.heading,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `filter ${MOTION2.fast}, background ${MOTION2.fast}`,
};
// Soft (secondary) button — light blue fill, navy text. Defined once: UI2.btn.soft + UI2.toolbar.button
const btnSoft = { ...btnBase, background: C2.chipBlue, color: C2.navy };

// Pill search field wrapper — defined once here so UI2.searchField and UI2.toolbar.search share it
const searchField = {
  display: 'flex', alignItems: 'center', gap: SP2.sm, height: SZ2.control.md, padding: pad(0, SP2.sm, 0, SP2.lg),
  background: C2.white, border: `1px solid ${C2.cardBorder}`, borderRadius: R2.pill, boxShadow: SH2.control,
};
// The bare text input inside a search field (top bars, list toolbars)
const searchInput = { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: F2.body, fontSize: FS2.base, color: C2.textPrimary };

// Icon glyph size that fits a given box size
const glyphFor =(size) => (size >= SZ2.icon.lg ? FS2.xxl : size >= SZ2.icon.md ? FS2.xl : size >= SZ2.icon.sm ? FS2.lg : FS2.base);

export const UI2 = {
  // ── Layout helpers ─────────────────────────────────────────────────────────
  center,
  row,
  rowBetween,
  stack:      (gap = SP2.sm) => ({ display: 'flex', flexDirection: 'column', gap }),
  truncate:   { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  // ── Surfaces ───────────────────────────────────────────────────────────────
  // Light container = pure white card (G2.glass), NO border, minimal soft shadow (SH2.glass)
  card: {
    fontFamily: F2.body,
    background: G2.glass,
    border: 'none',
    borderRadius: R2.xxl,
    boxShadow: SH2.glass,
    backdropFilter: GLASS_BLUR,
    WebkitBackdropFilter: GLASS_BLUR,
    padding: pad(LAYOUT2.cardY, LAYOUT2.cardX),
  },
  // Dark frosted glass over a photo (sidebar promo copy). Pair with a mask to feather its top.
  darkGlass: {
    background: G2.sidebarPromoGlass,
    backdropFilter: GLASS_BLUR,
    WebkitBackdropFilter: GLASS_BLUR,
  },
  darkCard: {
    fontFamily: F2.body,
    background: G2.darkCard,
    color: C2.onDark.text,
    borderRadius: R2.xxl,
    boxShadow: SH2.dark,
    padding: pad(LAYOUT2.cardY, LAYOUT2.cardY),
  },
  toneCard: (t) => ({
    fontFamily: F2.body,
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
    border: 'none',                 // inner boxes never have a border — the tint groups them
    borderRadius: R2.xl,
    padding: pad(LAYOUT2.cardY, LAYOUT2.cardX),
    boxShadow: 'none',
  }),
  // Inner light-tint tile inside a card (list items, mini panels)
  tile: {
    fontFamily: F2.body,
    background: G2.glassTile,
    border: 'none',                 // no border / hairline ring — soft lift only
    borderRadius: R2.lg,
    boxShadow: SH2.tile,
  },
  listRow: { display: 'flex', alignItems: 'center', gap: LAYOUT2.rowGap, padding: pad(LAYOUT2.rowY, SP2.xs) },   // divider only BETWEEN rows: pair with className="un2-row-divided"

  // ── Card header ────────────────────────────────────────────────────────────
  // Card header = its own zone: title + quiet subtitle, closed by a hairline so it never reads as
  // part of the list below (the first row's own top border is hidden — .un2-card-head + * in utilities.css).
  cardHeader:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: LAYOUT2.rowGap, paddingBottom: LAYOUT2.cardHeaderGap, marginBottom: SP2.sm, borderBottom: `1px solid ${C2.borderLight}` },
  cardTitle:    { ...T2.sectionTitle },
  cardSubtitle: { ...T2.cardSubtitle, marginTop: SP2.xxs },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    title:    { fontSize: FS2.base, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.heading },
    // List item title (ListRow) — regular weight (400); pair with UI2.text.meta for its description line
    rowTitle: { fontSize: FS2.base, fontWeight: FW2.regular, color: C2.textPrimary, lineHeight: LH2.heading },   // 400 — every list / item row title
    titleLg:  { fontSize: FS2.md, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.heading },
    titleXl:  { fontFamily: F2.body, fontSize: FS2.lg, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.heading },   // Inter 16 semibold — prominent item title (e.g. distribution channel name)
    body:     { ...T2.body },
    // Sub text / description under an item title (list rows, tiles, unit & property cards, addresses):
    // Playfair, 11px, muted grey — the ONE style for every description line. Use it, don't restyle per page.
    meta:     { fontFamily: F2.heading, fontWeight: FW2.regular, fontSize: FS2.xs, color: C2.textMuted, lineHeight: LH2.body },
    label:    { fontSize: FS2.sm, color: C2.textSecondary, lineHeight: LH2.body },
    caption:  { ...T2.caption },
    stat:     { fontSize: FS2.lg, fontWeight: FW2.semibold, color: C2.textPrimary, lineHeight: LH2.tight },
    figure:   { ...T2.figure },
    statLg:   { ...T2.statValue },
    // Numbers are always Inter: semibold here (<= 20px); big display numbers use figure / FW2.light
    number:   { fontFamily: F2.body, fontWeight: FW2.semibold, color: C2.navyDeep, lineHeight: LH2.none },
    lead:     { ...T2.lead },
    quote:    { ...T2.quote },
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
    background: solid ? (tone.soft ? G2.toneFill(tone) : tone.strong) : tone.soft,
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
    background: solid ? (tone.soft ? G2.toneFill(tone) : tone.strong) : tone.soft,
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
    fontWeight: FW2.semibold,
    letterSpacing: LS2.wide,
    lineHeight: LH2.body,
  }),
  countBadge: {
    ...center,
    minWidth: SZ2.icon.xs,
    height: SZ2.icon.xs,
    padding: pad(0, SP2.sm),
    borderRadius: R2.pill,
    background: C2.white,          // white pill on the navy sidebar (no yellow in the UI)
    color: C2.navyDeep,
    fontSize: FS2.xs,
    fontWeight: FW2.semibold,
  },
  dot: (color = C2.success) => ({ width: SZ2.dot, height: SZ2.dot, borderRadius: R2.round, background: color, flexShrink: 0 }),
  // Status dot coloured by a tone — red / green use their gradient (G2.toneFill)
  statusDot: (tone = TONES2.success) => ({ width: SZ2.dot, height: SZ2.dot, borderRadius: R2.round, background: G2.toneFill(tone), flexShrink: 0 }),

  // ── Buttons ────────────────────────────────────────────────────────────────
  // App buttons — same four styles as the mobile app (components/Button.tsx).
  // Use these for every new screen:
  //   brand → main action (navy gradient, white text)
  //   soft  → secondary action (light blue fill, navy text)
  //   light → any action on a dark / photo background (white fill, navy text)
  //   RULE: on light / white surfaces the secondary action is ALWAYS soft — never a white button
  //         (light / outline). White buttons are only for dark or photo backgrounds.
  //   textLink → inline navy text action with arrow
  // The older primary / success / dark / outline styles stay for existing pages.
  btn: {
    base:    btnBase,
    brand:   { ...btnBase, background: G2.brandButton, color: C2.white, boxShadow: SH2.brandButton },
    soft:    btnSoft,
    light:   { ...btnBase, background: C2.white, color: C2.navy, boxShadow: SH2.lightButton },
    textLink: {
      display: 'inline-flex', alignItems: 'center', gap: SP2.xs, padding: 0, background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, color: C2.navy, whiteSpace: 'nowrap',
    },
    primary: { ...btnBase, background: G2.primaryButton, color: C2.white, boxShadow: SH2.primary },
    success: { ...btnBase, background: G2.successButton, color: C2.white, boxShadow: SH2.success },
    danger:  { ...btnBase, background: G2.errorButton, color: C2.white, boxShadow: SH2.error },     // destructive action (red gradient)
    dark:    { ...btnBase, background: C2.black, color: C2.white, boxShadow: SH2.darkButton },
    outline: { ...btnBase, background: C2.white, color: C2.textPrimary, border: `1px solid ${C2.cardBorder}`, boxShadow: SH2.control },
    // Tinted secondary action with meaning (no border — buttons are never outlined): UI2.btn.outlineTone(TONES2.success)
    outlineTone: (t = TONES2.primary) => ({ ...btnBase, background: t.soft, color: t.fg }),
    ghostOnDark: { ...btnBase, background: C2.onDark.surface, color: C2.white, border: `1px solid ${C2.onDark.border}`, backdropFilter: BLUR2.md, WebkitBackdropFilter: BLUR2.md },
    link: {
      display: 'inline-flex', alignItems: 'center', gap: SP2.xs, padding: 0, background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, color: C2.primary, whiteSpace: 'nowrap',
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

  // Size modifier — spread AFTER a button style: { ...UI2.btn.outline, ...UI2.btnSm }
  btnSm: { minHeight: SZ2.control.sm, padding: pad(0, SP2.md), fontSize: FS2.sm, gap: SP2.xs },

  // STANDARD SMALL BUTTON — fixed width so a column of row actions (View · List · View Unit · Resume) all match.
  // Spread after a button colour: { ...UI2.btn.brand, ...UI2.btnSmStd }  (primary small button = brand colour)
  btnSmStd: { minHeight: SZ2.control.sm, width: SZ2.btnSm.w, padding: pad(0, SP2.sm), fontSize: FS2.sm, gap: SP2.xs, justifyContent: 'center' },

  // STANDARD COMPACT CONTROL SIZE — every compact control shares it (same box size, same text size):
  //   compact inputs (FIELD2.inputSm) · choice / amenity tiles (ChoiceTile) · any future compact chip-row control
  //   { ...UI2.<style>, ...UI2.compact }   — size only (height · side padding · text), never colours
  compact:     { minHeight: SZ2.control.md, padding: pad(0, SP2.sm), fontSize: FS2.sm },   // 34 high · 8 side padding · 12 text
  compactIcon: { fontSize: FS2.md },                                                         // 14 — leading icon inside a compact control

  // STANDARD SELECTED-TICK BADGE — the round ✓ in the corner of a selected photo / media tile (same 18px as the
  // Checkbox box, light primary-blue gradient, white 11px ✓). Position it per use (absolute top-right).
  checkBadge:  { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: SZ2.check, height: SZ2.check, borderRadius: R2.round, background: G2.primaryButton, color: C2.white, fontSize: FS2.xs, flexShrink: 0 },

  // Small bordered "label value" chip, e.g. Occupancy 92%
  metricChip: {
    display: 'inline-flex', alignItems: 'center', gap: SP2.xs, padding: pad(SP2.xs, SP2.sm),
    borderRadius: R2.pill, background: C2.background, border: `1px solid ${C2.cardBorder}`,
    fontSize: FS2.xs, color: C2.textSecondary, lineHeight: LH2.heading, whiteSpace: 'nowrap',
  },

  // ── Inputs ─────────────────────────────────────────────────────────────────
  // Pill search field wrapper (pair with className="un2-focus-ring")
  searchField,
  // Its text input (no box of its own) — every search box: top bars + list toolbars
  searchInput,

  // ── List toolbar (Listings is the reference) — single source for every "search · Options ▸ filters" toolbar ──
  //   <div className="un2-tray-tools" style={UI2.toolbar.tools}>
  //     <label className="un2-focus-ring un2-tray-search" style={UI2.toolbar.search}>
  //       <i className="ti ti-search" style={UI2.toolbar.searchIcon} /> <input style={UI2.searchInput} … />
  //     </label>
  //     <ActionTray compact label="Options">
  //       <div style={UI2.toolbar.menuWrap}><FilterMenu triggerStyle={UI2.toolbar.button} … /></div> …
  //     </ActionTray>
  //   </div>
  toolbar: {
    tools:      { ...row(LAYOUT2.inlineGap), marginLeft: 'auto', justifyContent: 'flex-end', flexWrap: 'wrap' },   // stays on the right, also when it wraps
    search:     { ...searchField, width: SZ2.searchSm, maxWidth: '100%' },   // compact search box
    searchIcon: { fontSize: FS2.lg, color: C2.textSecondary },
    menuWrap:   { flexShrink: 0 },   // FilterMenu with a custom trigger spans its parent — this keeps it button-sized
    button:     btnSoft,   // the soft (secondary) button — Filter / Sort triggers on a light surface
  },

  // ── Misc ───────────────────────────────────────────────────────────────────
  progressTrack: { height: SZ2.progress, borderRadius: R2.pill, background: C2.surfaceMuted, overflow: 'hidden' },
  progressFill:  (pct, bg = G2.successBar) => ({ width: `${pct}%`, height: '100%', borderRadius: R2.pill, background: bg }),
  divider:       { height: SZ2.hairline, background: C2.border, border: 'none' },
  empty:         { padding: pad(SP2.xxl, SP2.sm), textAlign: 'center', color: C2.textMuted, fontSize: FS2.base },
  // Left-aligned one-line empty note at the top of a card body ("No open tickets.")
  emptyInline:   { padding: pad(SP2.xs, 0, SP2.md), textAlign: 'left', color: C2.textMuted, fontSize: FS2.base },
  // Hover list row (avatar + name + meta + trailing pill). Pair with className="un2-row-hover".
  listRowHover:  { display: 'flex', alignItems: 'center', gap: LAYOUT2.rowGap, padding: pad(LAYOUT2.rowY, SP2.sm), borderRadius: R2.md },
  // Loading placeholder block. Pair with className="un2-skel".
  skeleton: (width, height, { onDark = false } = {}) => ({
    display: 'inline-block', width, height, ...(onDark ? { opacity: OP2.faint } : {}),
  }),

  // Recessed panel inside a card (expanded thread, inline form)
  inset: { background: C2.background, border: 'none', borderRadius: R2.lg, padding: SP2.md },

  // ── Filter chips (segmented choices above a list) ─────────────────────────
  //   <button style={UI2.filterChip(active)}>Vacant (1)</button>
  filterChip: (active = false) => ({
    ...center, minHeight: SZ2.control.sm, padding: pad(0, SP2.md), borderRadius: R2.button, cursor: 'pointer',   // same radius as every button
    border: `1px solid ${active ? 'transparent' : C2.cardBorder}`,   // selected = brand gradient (same as UI2.btn.brand)
    background: active ? G2.brandButton : C2.white,
    color: active ? C2.white : C2.textPrimary,
    boxShadow: active ? SH2.brandButton : SH2.control,
    fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, whiteSpace: 'nowrap',
  }),
  // Glass chip on a dark / photo background (hero amenities)
  chipOnDark: {
    display: 'inline-flex', alignItems: 'center', gap: SP2.xs, minHeight: SZ2.control.sm, padding: pad(0, SP2.md),
    borderRadius: R2.button, border: `1px solid ${C2.onDark.border}`, background: C2.onDark.surface, color: C2.white,
    fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, whiteSpace: 'nowrap',
    backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm,
  },

  // ── Form fields ────────────────────────────────────────────────────────────
  // Pair with className="un2-focus-ring" on a wrapper for the focus glow.
  input: {
    width: '100%', height: SZ2.control.md, padding: pad(0, SP2.md), boxSizing: 'border-box',
    border: `1px solid ${C2.cardBorder}`, borderRadius: R2.md, background: C2.white, outline: 'none',
    fontFamily: F2.body, fontSize: FS2.base, color: C2.textPrimary,
  },
  select: {
    width: '100%', height: SZ2.control.md, padding: pad(0, SP2.sm), boxSizing: 'border-box', cursor: 'pointer',
    border: `1px solid ${C2.cardBorder}`, borderRadius: R2.md, background: C2.white, outline: 'none',
    fontFamily: F2.body, fontSize: FS2.base, color: C2.textPrimary,
  },

  // ── Chat bubbles ───────────────────────────────────────────────────────────
  //   mine = true → right-aligned blue bubble; false → left white bubble
  bubble: (mine = false) => ({
    maxWidth: '80%', padding: pad(SP2.sm, SP2.md), fontSize: FS2.sm, lineHeight: LH2.body,
    alignSelf: mine ? 'flex-end' : 'flex-start',
    background: mine ? C2.primarySoft : C2.white,
    color: mine ? C2.primaryDark : C2.textPrimary,
    border: mine ? 'none' : `1px solid ${C2.border}`,
    borderRadius: mine ? pad(R2.lg, R2.lg, R2.xs, R2.lg) : pad(R2.lg, R2.lg, R2.lg, R2.xs),
  }),

  // ── Icons ──────────────────────────────────────────────────────────────────
  btnIcon:  { fontSize: FS2.md },                                  // leading icon inside a button
  chevron:  { fontSize: FS2.xl, color: C2.textSecondary },         // "go to" chevron on cards / rows
  minWidth0:{ minWidth: 0 },                                       // let a flex child truncate
  // Limit text to N lines with an ellipsis
  clamp: (lines = 2) => ({ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
  errorBanner:   {
    display: 'flex', alignItems: 'center', gap: SP2.sm, padding: pad(SP2.md, SP2.lg), borderRadius: R2.lg,
    background: C2.errorTint, border: `1px solid ${C2.errorLight}`, color: C2.errorDark, fontSize: FS2.base,
  },
  thumb: { width: SZ2.thumb.w, height: SZ2.thumb.h, borderRadius: R2.lg, objectFit: 'cover', display: 'block', boxShadow: SH2.md },

  // ── Photo tiles + upload slots (PhotoBento gallery, floor plans) ──────────
  //   <div className="un2-zoom" style={UI2.photoTile}><img style={UI2.photoMedia} /></div>
  //   <button className="un2-raise" style={UI2.addTile(busy)}><i style={UI2.addTileIcon} /> Add images</button>
  // The add tile is the ONE place a dashed outline is used — it marks an empty upload slot, not a container.
  photoTile:   { position: 'relative', overflow: 'hidden', borderRadius: R2.xl, background: C2.surfaceMuted, boxShadow: SH2.md, minHeight: 0 },
  photoMedia:  { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  addTile: (busy = false) => ({
    ...center, flexDirection: 'column', gap: SP2.xs, width: '100%', height: '100%', minHeight: 0, padding: 0, boxSizing: 'border-box',
    borderRadius: R2.xl, border: `${SZ2.dashed}px dashed ${C2.cardBorder}`, background: C2.primaryWash,
    color: C2.textSecondary, fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, lineHeight: LH2.heading,
    cursor: busy ? 'progress' : 'pointer',
  }),
  addTileIcon: { fontSize: FS2.xxl, color: C2.primary },
  // "+N photos" overlay on the last gallery tile: navy scrim + white count (PhotoBento `more`)
  photoMore:      { ...center, flexDirection: 'column', gap: SP2.xxs, position: 'absolute', inset: 0, background: G2.photoMore, color: C2.white, fontFamily: F2.body, pointerEvents: 'none' },
  photoMoreCount: { ...T2.figureMd, color: C2.white },
  photoMoreText:  { fontSize: FS2.sm, fontWeight: FW2.medium, lineHeight: LH2.heading },
  // Small round "×" on a photo (remove) — light button rule: white fill on photos
  photoRemove: { ...center, position: 'absolute', top: SP2.xs, right: SP2.xs, width: SZ2.icon.xs, height: SZ2.icon.xs, padding: 0, border: 'none', borderRadius: R2.round, background: C2.white, color: C2.navyDeep, boxShadow: SH2.lightButton, fontSize: FS2.sm, cursor: 'pointer' },
  // Round light arrow on a photo (gallery ‹ ›): position left / right with UI2.photoArrow('left')
  photoArrow: (side = 'left') => ({ ...center, position: 'absolute', top: '50%', [side]: SP2.md, transform: 'translateY(-50%)', width: SZ2.control.md, height: SZ2.control.md, padding: 0, border: 'none', borderRadius: R2.round, background: C2.white, color: C2.navyDeep, boxShadow: SH2.lightButton, fontSize: FS2.lg, cursor: 'pointer' }),

  // ── Tables (DataTable) — one style per column TYPE, used by every table ────
  table: {
    // Layout (Stripe / Linear / Airbnb-host pattern): header = soft rounded grey band, no underline ·
    // rows ~44px tall with faint separators + hover tint · cell padding = header padding so text lines up
    headBand:  { background: C2.background, borderRadius: R2.md, padding: pad(SP2.sm, SP2.md) },
    rowPad:    pad(LAYOUT2.rowY, SP2.md),   // row height = LAYOUT2.rowY (same as list / label-value rows)
    rule:      C2.divider,        // line between rows — same barely-visible divider as list rows
    ruleLight: C2.divider,
    // ONE size + ONE weight for every cell (13px Regular) — names, dates, categories and amounts alike.
    // Only colour differs (grey for secondary, green / red sign colour on amounts via UI2.signColor).
    // Header is LARGER than the content (14px Medium vs 13px Regular cells) so the two are clearly distinct.
    th:        { fontFamily: F2.body, fontSize: FS2.md, fontWeight: FW2.medium, lineHeight: LH2.heading, color: C2.textSecondary, whiteSpace: 'nowrap' },   // header 14px Medium — LARGER than the 13px cells
    cell:      { minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: F2.body, lineHeight: LH2.heading },
    primary:   { fontSize: FS2.base, fontWeight: FW2.regular, color: C2.textPrimary },                                         // main entity
    secondary: { fontSize: FS2.base, fontWeight: FW2.regular, color: C2.textSecondary, fontVariantNumeric: 'tabular-nums' },  // dates, refs
    text:      { fontSize: FS2.base, fontWeight: FW2.regular, color: C2.textPrimary },                                       // plain values — identical to primary
    amount:    { fontSize: FS2.base, fontWeight: FW2.regular, color: C2.textPrimary, fontVariantNumeric: 'tabular-nums' },   // money — same size + weight as all cells
    status:    { overflow: 'visible', fontSize: FS2.base, fontWeight: FW2.regular, color: C2.textPrimary },                       // pill / dot+word rendered by the column — never clipped; anything plain inside gets the standard 13px cell text
  },

  // ── Dashboard card patterns (Landlord Dashboard is the reference) ──────────
  //   <SectionCard style={UI2.cardFill}>                         body is a column → footer pins to the bottom
  //     <div style={UI2.labelRow}><span style={UI2.capsLabel}>Rent collection</span>
  //                               <span style={UI2.context}><i className="ti ti-calendar" /> This month</span></div>
  //     …  <div style={UI2.subhead}>Recent payments</div>  …
  //     <div style={UI2.cardFoot}>Last month <span style={UI2.strong}>$412,800</span>
  //                               <span style={UI2.delta(true)}>+3.8% MoM</span></div>
  //   </SectionCard>
  cardFill:  { display: 'flex', flexDirection: 'column' },
  // Quick actions grid: <ActionTile plain> (icon over label) in a 2 × 2 grid
  //   <div style={UI2.quickActions}> <ActionTile plain …/> ×4 </div>   (2 columns · rows SP2.lg apart)
  // paddingTop / paddingBottom SP2.md = a list row's own padding (UI2.listRowHover), so the icons sit the same
  // distance from the header line and the card bottom as the rows of a list card (e.g. Recent Unit Activities)
  quickActions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: SP2.lg, rowGap: SP2.lg, alignItems: 'start', paddingTop: SP2.md, paddingBottom: SP2.md },
  capsLabel,
  labelRow:  { ...rowBetween(), flexWrap: 'wrap', rowGap: SP2.xs, marginBottom: SP2.lg },        // caps label · context on the right
  context:   { display: 'flex', alignItems: 'center', gap: SP2.xs, ...T2.caption },               // small grey "icon + text" (This month, Target 96%)
  subhead:   { ...capsLabel, margin: pad(SP2.xl, 0, SP2.xs) },                                    // caps sub-section title inside a card body
  cardFoot:  { ...rowBetween(), flexWrap: 'wrap', rowGap: SP2.xs, marginTop: 'auto', paddingTop: SP2.md, borderTop: hairline, ...T2.label },
  strong:    { fontWeight: FW2.semibold, color: C2.textPrimary },                                 // emphasised value inside a sentence
  delta:     (up = true) => ({ display: 'inline-flex', alignItems: 'center', gap: SP2.xxs, fontWeight: FW2.semibold, color: up ? C2.successStrong : C2.errorDark }),
  // Status in tables / lists: coloured dot + coloured word, NO box / background — ● Active / ● Overdue.
  //   <span style={UI2.statusPill(TONES2.success)}><span style={UI2.statusDot(TONES2.success)} />Collected</span>
  statusPill: (tone = TONES2.success) => ({ display: 'inline-flex', alignItems: 'center', gap: SP2.sm, padding: 0, background: 'none', color: tone.fg, fontFamily: F2.body, fontSize: FS2.base, fontWeight: FW2.regular, lineHeight: LH2.heading, whiteSpace: 'nowrap' }),   // same 13px Regular as table cells
  // Colour-only sign for amounts inside tables / text (no size or weight change): UI2.signColor(isPositive)
  signColor: (positive = true) => ({ color: positive ? C2.successStrong : C2.errorDark }),
  amount:    (positive = true) => ({ fontSize: FS2.base, fontWeight: FW2.semibold, color: positive ? C2.successStrong : C2.errorDark }),
  // Legend: ● key ………… value  (charts, rings)
  legendRow: { ...rowBetween(), fontSize: FS2.sm, color: C2.textSecondary, lineHeight: LH2.heading },
  // Label ……… value row in a details list (unit / lease facts): LAYOUT2.rowY padding, hairline between rows
  //   rows.map((r, i) => <div style={UI2.kvRow(i === 0)}><span>{r.lbl}</span><span style={UI2.kvVal}>{r.val}</span></div>)
  kvRow: (first = false) => ({ ...rowBetween(), fontSize: FS2.sm, color: C2.textSecondary, lineHeight: LH2.heading, padding: pad(LAYOUT2.rowY, 0), ...(first ? {} : { borderTop: `1px solid ${C2.divider}` }) }),
  kvVal: { ...rowBetween(SP2.sm), justifyContent: 'flex-end', fontWeight: FW2.semibold, color: C2.textPrimary, textAlign: 'right', minWidth: 0 },
  legendKey: { display: 'flex', alignItems: 'center', gap: SP2.sm },
  legendVal: { fontWeight: FW2.semibold, color: C2.textPrimary },
  // List item marked by a coloured left rule instead of a box (tickets by priority): UI2.accentItem(TONES2.error)
  accentItem: (tone = TONES2.primary) => ({ padding: pad(SP2.xxs, 0, SP2.xxs, SP2.md), borderLeft: `${SZ2.accentBar}px solid ${tone.strong}`, marginTop: SP2.lg }),
  // Section heading INSIDE a divided panel column (un2-cols): plain icon + Playfair title, no box
  colHead:   { display: 'flex', alignItems: 'center', gap: SP2.sm, minWidth: 0 },
  colIcon:   { fontSize: FS2.xl, color: C2.primary, flexShrink: 0 },
  // Feature chip — ONE standard for features, services, amenities: neutral grey chip + dark text,
  // only the icon is coloured: <span style={UI2.featureChip()}><i style={UI2.featureChipIcon(i)} /> WiFi</span>
  // (the tone argument is ignored — chips are never colour-filled)
  featureChip: () => ({
    display: 'inline-flex', alignItems: 'center', gap: SP2.sm, padding: pad(SP2.xs, SP2.md), borderRadius: R2.md,
    background: TONES2.neutral.soft, color: TONES2.neutral.fg, fontFamily: F2.body, fontSize: FS2.sm, fontWeight: FW2.medium, lineHeight: LH2.heading, whiteSpace: 'nowrap',
  }),
  // Icon colour inside a feature chip — cycles blue · teal · violet · rose by index
  featureChipIcon: (i = 0) => ({ color: CHIP_ICON_ACCENTS[i % CHIP_ICON_ACCENTS.length].fg }),
  // Borderless tinted row at the bottom of a card (feature teaser / shortcut)
  tintRow:   { display: 'flex', alignItems: 'center', gap: SP2.md, padding: SP2.md, borderRadius: R2.lg, background: C2.primaryWash },
};
