// ─────────────────────────────────────────────
// UrbanNest — Persona Select (route: /persona-select)
// Design System v2 (2026-11-24, layout from Downloads/image 20.png) — split screen:
//   LEFT   dusk house photo (full height, assets/personas/persona-hero.jpg) · twinkling stars · brand · "One account, / multiple roles." · rule ·
//          subtitle · three feature rows (same plain rows as the sign-up perks)
//   RIGHT  who's signed in + Sign out, then a white sheet whose rounded corner runs over the photo:
//          header · the PHOTO CARDS of the roles you hold + "Add a role" · the action row (selected role + main button)
//
// Flow: select → continue (nothing navigates on the first click):
//   · Click a card → light-blue ring + ✓ + one light sweep; the action row swaps to that role and its main button
//     ("Continue to Landlord Portal", "Reactivate profile", "Resume application" …). Double-click / Enter continues.
//   · "Add a role" → the cards fade out, then the WHITE SHEET itself grows over the whole page (its slanted, rounded
//     edge straightens as it travels); the roles you can still set up appear on it as compact photo cards. Cancel /
//     Esc → that view fades, the sheet shrinks back to its slanted place beside the photo and your cards return.
//   · Inactive profiles and a rejected PMS application still ask first (v2 Modal).
// The data loading (/auth/me, /admin/org-pms), switch-persona call and every navigation target are unchanged.
// ─────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ImageBackdrop, AUTH, introAt } from '../../components/layout';
import { Modal, CornerArt, Particles } from '../../components/ui';
import { C2, G2, SH2, TONES2, F2, FS2, FW2, LH2, LS2, R2, SP2, SZ2, BLUR2, OP2, LAYOUT2, T2, UI2, pad } from '../../constants';
import brandLogo from '../../assets/brand/urban-nest-logo.png';
import backdropArt from '../../assets/landlord/wizard-backdrop.jpg';
import heroArt from '../../assets/personas/persona-hero.jpg';   // dusk sky over a lit modern house (Downloads/image 130.png, 1800px, mirrored so the house sits bottom-left under the copy)
// role photos — renter / landlord / PMS company from the user's set (Downloads/Tenant.png, Landlord.png, PMS.png,
// resized to 1400px); the others reuse the app's own hero art
import imgRenter from '../../assets/personas/renter.jpg';
import imgLandlord from '../../assets/personas/landlord.jpg';
import imgPmsCompany from '../../assets/personas/pms-company.jpg';
import imgTenant from '../../assets/landlord/signup-hero.jpg';
import imgIndependentPm from '../../assets/landlord/dashboard-hero.jpg';
import imgAgent from '../../assets/landlord/login-hero.jpg';
import imgAdmin from '../../assets/landlord/portfolio-hero-sunset.jpg';
import imgStaff from '../../assets/landlord/services/lease-management.jpg';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api').replace(/\/api\/?$/, '');

// ─── Persona catalogue ─────────────────────────────────────────────────────────
// key · route (set-up flow for a role you don't hold yet) · portal (where it opens) — unchanged.
// img / pos = card photo + its framing · portalName / blurb = what the action row tells you.
const ALL_PERSONAS = [
  { key:'RENTER',            label:'Renter',            sub:'Main account',       icon:'ti-home',                img:imgRenter,        pos:'56% center', route:'/marketplace',                  portal:'/marketplace',
    portalName:'Marketplace',         blurb:'Browse verified homes, book tours and track your applications.' },
  { key:'TENANT',            label:'Tenant',            sub:'Active tenancy',     icon:'ti-key',                 img:imgTenant,        pos:'55% center', route:'/coming-soon',                  portal:'/coming-soon',
    portalName:'Tenant Portal',       blurb:'Your lease, rent payments and maintenance requests in one place.', soon:true },
  { key:'LANDLORD',          label:'Landlord',          sub:'Property owner',     icon:'ti-building',            img:imgLandlord,      pos:'56% center', route:'/landlord-registration/step-1', portal:'/landlord-portal/dashboard',
    portalName:'Landlord Portal',     blurb:'Run your portfolio — listings, units, rent collection and residents.' },
  { key:'INDEPENDENT_PM',    label:'Property Manager',  sub:'Independent PM',     icon:'ti-briefcase',           img:imgIndependentPm, pos:'60% center', route:'/pm-registration',              portal:'/pm-portal/dashboard/welcome',
    portalName:'PM Portal',           blurb:'Manage properties for your clients, from leasing to maintenance.' },
  { key:'ORGANIZATIONAL_PM', label:'PMS Company',       sub:'Organisational PM',  icon:'ti-building-skyscraper', img:imgPmsCompany,    pos:'64% center', route:'/org-onboarding/step-1',        portal:'/org-onboarding/step-1',
    portalName:'Organisation Portal', blurb:'Your property-management company — teams, portfolios and billing.' },
  { key:'REAL_ESTATE_AGENT', label:'Real Estate Agent', sub:'Agent portal',       icon:'ti-id-badge',            img:imgAgent,         pos:'62% center', route:'/coming-soon',                  portal:'/coming-soon',
    portalName:'Agent Portal',        blurb:'List on behalf of owners and follow your leads to signed leases.', soon:true },
  { key:'UN_ADMIN',          label:'UN Admin',          sub:'Lead administrator', icon:'ti-shield-lock',         img:imgAdmin,         pos:'50% center', route:'/admin-portal/dashboard',       portal:'/admin-portal/dashboard',
    portalName:'Admin Portal',        blurb:'Platform administration — approvals, screening and configuration.' },
  { key:'PM_STAFF',          label:'PM Staff',          sub:'Team member',        icon:'ti-user-cog',            img:imgStaff,         pos:'78% center', route:'/pm-portal/dashboard/welcome',  portal:'/pm-portal/dashboard/my-dashboard',
    portalName:'PM Workspace',        blurb:'Your assigned properties, tasks and team updates.' },
];

// Org PMS application status → chip · main-button label
const ORG_PMS_STATE = {
  DRAFT:     { label:'Draft',     tone:TONES2.neutral, cta:'Resume application' },
  PENDING:   { label:'In review', tone:TONES2.purple,  cta:'View application status' },
  APPROVED:  { label:'Active',    tone:TONES2.primary, cta:'Continue to Organisation Portal' },
  SUSPENDED: { label:'Suspended', tone:TONES2.error,   cta:'View account status' },
};

// left panel feature rows
const PERKS = [
  { icon: 'ti-layout-dashboard', text: 'Personalised dashboards' },
  { icon: 'ti-stack-2',          text: 'Role-based access' },
  { icon: 'ti-users-plus',       text: 'Add multiple roles' },
];

// page-open timing (s): photo curtain → headline lines → copy · sheet → its rows → the cards are dealt in
const INTRO = { photo: 0.05, brand: 0.55, line: 0.7, lineStep: 0.16, copy: 1.05, perks: 1.2, sheet: 0.15, head: 0.45, deck: 0.7, action: 1.0 };
const SHEET_MS = 1400;  // full close (add view out · sheet shrinks · your cards back) — the add pick is cleared after it
const CARD = SZ2.personaCard;        // compact — "Roles you can add"
const CARD_LG = SZ2.personaCardLg;   // "Your workspaces" — a size up
const SPLIT = SZ2.personaSplit;
const TOP_H = SZ2.topbar + SP2.lg;   // top bar (who's signed in · Sign out) — the sheet surface starts right under it
const DECK_GAP = SP2.lg;    // "Your workspaces" (fluid thirds on the sheet)
const ADD_GAP = SP2.huge + SP2.sm;   // "Add a role" grid — 48px between columns (horizontal only)
const ADD_ROW_GAP = SP2.xxl;        // … and 24px between rows
const ADD_MAX_COLS = 3;   // add view: a 3-column grid (3 × 3 at most on screen) — fewer columns only if the window is too narrow (useAddCols)
const CARD_WIDE = SZ2.personaCardWide;   // "Add a role" grid — landscape cards, fluid width (rows stay short on low screens)
// width of one grid cell for c columns (gaps taken out), e.g. 3 → a third of the grid
const addCell = (c) => ({ width: `calc((100% - ${(c - 1) * ADD_GAP}px) / ${c})`, flexShrink: 0 });

const S = {
  // ── page (split screen) ──
  page:     { position: 'relative', zIndex: 0, height: '100vh', overflow: 'hidden', background: C2.pageBg, fontFamily: F2.body, color: C2.textPrimary,
              '--un2-ps-start': `${SPLIT.start}%`, '--un2-ps-top': `${TOP_H}px`, '--un2-ps-slant': `${SPLIT.slant}deg`, '--un2-ps-radius': `${R2.header * 2}px` },
  // the white sheet's SURFACE — one page-sized white layer. Resting: slid right to --un2-ps-start, down below the top bar,
  // leaning back from its bottom-left corner (slanted edge, big rounded top corner over the photo). "Add a role": it
  // grows over the whole page (un2-ps-surface in utilities.css). Only the surface moves — content sits on top of it.
  surfaceWrap: { position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' },
  surface:  { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: G2.glass, boxShadow: SH2.lg, transformOrigin: 'left bottom' },
  waveWrap: { position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' },
  // the wave art again, turned 180° → waves bottom-left too (same as the sign-in frame)
  waveLeft: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SZ2.imageBackdrop, opacity: OP2.backdrop, transform: 'rotate(180deg)',
    backgroundImage: `url(${backdropArt})`, backgroundSize: '100% auto', backgroundPosition: 'right top', backgroundRepeat: 'no-repeat',
    WebkitMaskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`, maskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`,
    WebkitMaskComposite: 'source-in', maskComposite: 'intersect',
  },

  // ── LEFT photo (like the design): one photo layer behind the left part of the page, solid on the left and fading
  //    out to the right (personaPhotoMask) so its sky melts into the page — no hard edge; the white sheet lies over it.
  //    The copy sits in the dark sky above the house.
  photoPanel: { position: 'absolute', top: 0, left: 0, bottom: 0, width: `${SPLIT.photo}%` },
  photoClip:  { position: 'absolute', inset: 0, overflow: 'hidden', background: C2.navyHero, color: C2.white, WebkitMaskImage: G2.personaPhotoMask, maskImage: G2.personaPhotoMask },
  photoImg:   { ...UI2.photoMedia, objectPosition: 'left bottom' },
  scrimTop:   { position: 'absolute', inset: 0, background: G2.authHeroScrim, pointerEvents: 'none' },
  scrimSide:  { position: 'absolute', inset: 0, background: G2.heroScrim, opacity: OP2.muted, pointerEvents: 'none' },
  // copy column = the part of the page left of the white sheet
  // copy column = the page left of the white sheet (start % of the PAGE — the panel itself is photo % wide)
  photoBody:  { position: 'absolute', top: 0, left: 0, bottom: 0, width: `${(SPLIT.start / SPLIT.photo) * 100}%`, ...UI2.stack(0), boxSizing: 'border-box', padding: pad(SP2.huge, SP2.huge + SP2.lg, SP2.huge, SP2.huge + SP2.lg), color: C2.white },
  brand:      { ...UI2.row(SP2.md) },
  logo:       { height: SZ2.icon.lg, width: 'auto', aspectRatio: SZ2.brandLogoRatio, display: 'block' },
  brandName:  { ...T2.brandTitle, display: 'block', lineHeight: LH2.tight, letterSpacing: LS2.snug },
  brandSub:   { ...T2.eyebrow, display: 'block', color: C2.onDark.textMuted, marginTop: SP2.xxs },
  title:      { ...T2.heroTitle, margin: pad(SP2.huge * 2, 0, 0) },
  rule:       { width: SP2.huge + SP2.lg, height: SZ2.hairline * 3, borderRadius: R2.pill, background: C2.white, margin: pad(SP2.xl, 0, SP2.xl) },
  copy:       { margin: 0, maxWidth: SZ2.authForm, fontSize: FS2.md, lineHeight: LH2.body, color: C2.onDark.textSoft },
  perks:      { ...UI2.stack(SP2.sm), alignItems: 'flex-start', marginTop: SP2.xxl },
  // feature rows = frosted glass tiles (icon box + label), like the design
  perk:       { ...UI2.row(SP2.md), padding: pad(SP2.xs, SP2.lg, SP2.xs, SP2.xs), borderRadius: R2.lg, background: C2.onDark.surface, backdropFilter: BLUR2.md, WebkitBackdropFilter: BLUR2.md },
  perkIcon:   { ...UI2.iconBox(SZ2.icon.md, { soft: C2.onDark.surfaceHover, strong: C2.white }) },
  perkText:   { ...UI2.text.title, color: C2.white, whiteSpace: 'nowrap' },

  // ── RIGHT: who's signed in + the white sheet ──
  right:      { position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' },
  topBar:     { ...UI2.row(SP2.md), justifyContent: 'flex-end', flexShrink: 0, height: TOP_H, boxSizing: 'border-box', padding: pad(0, LAYOUT2.pageX) },   // fixed height = where the sheet surface starts
  // account chip: ONE white pill on the light top area — TopBar's avatar (navy, white ring) · name / email · hairline · Sign out
  account:    { ...UI2.row(SP2.md), minWidth: 0, padding: pad(SP2.xs, SP2.xs, SP2.xs, SP2.xs), borderRadius: R2.pill, background: C2.white, boxShadow: SH2.control },
  whoText:    { ...UI2.stack(0), minWidth: 0, paddingRight: SP2.xs },
  whoName:    { ...UI2.text.title, lineHeight: LH2.heading, ...UI2.truncate },
  whoMail:    { ...T2.caption, ...UI2.truncate },
  avatar:     { ...UI2.avatar(SZ2.icon.md, { soft: C2.navyDeep, fg: C2.white }), boxShadow: SH2.avatarRing },   // same as the v2 TopBar avatar
  accountRule:{ width: SZ2.hairline, alignSelf: 'stretch', margin: pad(SP2.xs, 0), background: C2.border },
  signOut:    { ...UI2.btn.textLink, color: C2.textSecondary, padding: pad(0, SP2.md, 0, SP2.xs), minHeight: SZ2.control.sm },   // quiet text action inside the chip
  sheetWrap:  { position: 'relative', flex: 1, minHeight: 0, display: 'flex' },
  sheet:      {
    position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',   // header + action row stay put — only the cards scroll (S.deckScroll)
    padding: pad(SP2.huge + SP2.md, SP2.huge, 0, SPLIT.edgePad),   // left inset clears the slanted edge at the top · no bottom padding: the footer bar sits on the bottom edge
  },
  sheetCol:   (w) => ({ position: 'relative', ...UI2.stack(SP2.xxl), flex: 1, minHeight: 0, width: '100%', maxWidth: w }),
  // the card list takes ALL the height down to the sheet's bottom edge; the glass footer floats over its end, so the
  // list gets extra bottom room (footer height) — the last card can always scroll up clear of the footer.
  // padding = room for the selection ring + shadow
  deckScroll: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: pad(SP2.sm, SP2.sm, SZ2.footerBar + SP2.lg), margin: pad(-SP2.sm, -SP2.sm, 0) },
  // glass footer: floats over the bottom of the card list (takes no space of its own) — see-through frosted bar (same
  // glass as the wizard footer: BLUR2.bar, light top edge, soft upward shadow), full sheet width. Its left end stops
  // SP2.sm inside the sheet's slanted edge so it never pokes over the photo; its content lines up with the cards.
  actionInner: { flex: 1, minWidth: 0 },
  actionWrap: {
    position: 'absolute', bottom: 0, left: -(SPLIT.edgePad - SP2.sm), right: -SP2.huge, zIndex: 2, minHeight: SZ2.footerBar, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', padding: pad(SP2.sm, SP2.huge, SP2.sm, SPLIT.edgePad - SP2.sm),
    background: C2.barGlass, backdropFilter: BLUR2.bar, WebkitBackdropFilter: BLUR2.bar,
    borderTop: `${SZ2.hairline}px solid ${C2.barGlassEdge}`, boxShadow: SH2.barUp,
  },
  head:       { ...UI2.stack(SP2.sm), alignItems: 'flex-start' },
  eyebrow:    { ...UI2.pill(TONES2.primary) },
  h1:         { ...T2.pageHeroTitle, margin: 0 },
  lead:       { ...T2.pageHeroSub, margin: 0 },

  // ── decks ──
  deck:       { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: ADD_GAP, rowGap: ADD_ROW_GAP, width: '100%' },
  skel:       { display: 'block', width: '100%', aspectRatio: `${CARD_LG.w} / ${CARD_LG.h}`, borderRadius: R2.xxl },
  // "Your workspaces": always 3 per row, each a third of the sheet (fluid — fills the width, keeps the card's proportions)
  deckFluid:  { display: 'flex', flexWrap: 'wrap', gap: DECK_GAP, width: '100%' },
  cell:       { width: `calc((100% - ${DECK_GAP * 2}px) / 3)`, flexShrink: 0 },
  fluidBox:   (sz) => ({ width: '100%', height: 'auto', aspectRatio: `${sz.w} / ${sz.h}` }),

  // ── photo card ──
  card:     (on, sz) => ({
    display: 'block', width: sz.w, height: sz.h, padding: 0, border: 'none', borderRadius: R2.xxl, overflow: 'hidden', cursor: 'pointer',
    textAlign: 'left', fontFamily: F2.body, color: C2.white, background: C2.navyHero,
    boxShadow: on ? SH2.personaSelected : SH2.card, '--un2-persona-hover': SH2.personaHover,
  }),
  photo:    (pos) => ({ ...UI2.photoMedia, objectPosition: pos }),
  scrim:    { position: 'absolute', inset: 0, background: G2.personaScrim, pointerEvents: 'none' },
  top:      { ...UI2.rowBetween(SP2.sm), position: 'absolute', top: SP2.md, left: SP2.md, right: SP2.md, zIndex: 2 },
  chip:     { ...UI2.chipOnDark, minHeight: 0, padding: pad(SP2.xxs, SP2.sm), fontSize: FS2.xxs, fontWeight: FW2.semibold, gap: SP2.xs },
  chipDot:  (tone) => ({ ...UI2.statusDot(tone), boxShadow: `0 0 0 2px ${C2.onDark.surfaceHover}` }),
  // selection mark: empty frosted ring → light-blue ✓
  mark:     (on) => ({
    ...UI2.center, width: SZ2.icon.xs, height: SZ2.icon.xs, flexShrink: 0, boxSizing: 'border-box', borderRadius: R2.round,
    border: on ? 'none' : `2px solid ${C2.onDark.border}`, background: on ? G2.primaryButton : C2.onDark.surface,
    backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, color: C2.white, fontSize: FS2.xs, transition: 'background 0.2s ease',
  }),
  markIcon: { display: 'inline-block' },   // transform (pop) needs a box
  body:     { ...UI2.stack(SP2.xxs), position: 'absolute', left: SP2.md, right: SP2.md, bottom: SP2.md, zIndex: 2 },
  icon:     { ...UI2.iconBox(SZ2.icon.sm, { soft: C2.onDark.surfaceHover, strong: C2.white }), backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, marginBottom: SP2.xs },
  name:     { ...T2.sectionTitle, color: C2.white, ...UI2.truncate },
  sub:      { ...T2.caption, color: C2.onDark.textMuted, ...UI2.truncate },

  // ── "Add a role" card: white, fanned photo stack ──
  add:      (sz) => ({
    ...UI2.stack(SP2.sm), alignItems: 'center', justifyContent: 'center', width: sz.w, height: sz.h, padding: SP2.lg, boxSizing: 'border-box',
    // an empty "add" slot (the v2 add-tile language, like PhotoBento's "Add images"): soft blue panel tint + dashed
    // periwinkle outline + a clear lift, so it reads on the white sheet next to the photo cards
    border: `${SZ2.dashed}px dashed ${C2.periwinkle}`, borderRadius: R2.xxl, cursor: 'pointer', fontFamily: F2.body, textAlign: 'center',
    background: G2.panel(TONES2.primary), boxShadow: SH2.tile, '--un2-persona-hover': SH2.personaHover,
  }),
  fan:      (sz) => ({ position: 'relative', width: sz.fan * 2.5, height: sz.fan * 1.4, marginBottom: SP2.sm }),
  fanItem:  (i, n, sz) => ({
    position: 'absolute', left: '50%', top: 0, width: sz.fan, height: sz.fan * 1.3, marginLeft: -sz.fan / 2, borderRadius: R2.lg,
    overflow: 'hidden', boxShadow: SH2.lg, zIndex: i === Math.floor(n / 2) ? 2 : 1,
    '--r': `${(i - (n - 1) / 2) * 10}deg`, '--x': `${(i - (n - 1) / 2) * (sz.fan * 0.55)}px`,
  }),
  thumbImg: (pos) => ({ ...UI2.photoMedia, objectPosition: pos }),
  plus:     { ...UI2.iconBox(SZ2.icon.md, TONES2.primary, { round: true, solid: true }), boxShadow: SH2.primary },
  addName:  { ...T2.sectionTitle, marginTop: SP2.xxs },
  addSub:   { ...T2.label },   // a step darker than the muted meta line, so it stays readable on the tint

  // ── action row (selected role + main button) — light-blue tint panel, no border ──
  action:   (w, bare) => ({ ...UI2.row(SP2.md), width: '100%', maxWidth: w, boxSizing: 'border-box', ...(bare ? {} : { padding: pad(SP2.sm, SP2.sm, SP2.sm, SP2.md), borderRadius: R2.xl, background: C2.primaryWash }) }),   // bare = inside the footer bar (no tint panel)
  actThumb: { position: 'relative', width: CARD.barThumb, height: CARD.barThumb, flexShrink: 0, borderRadius: R2.md, overflow: 'hidden', boxShadow: SH2.md },
  actText:  { ...UI2.stack(SP2.xxs), flex: 1, minWidth: 0 },
  actName:  { ...UI2.text.titleLg, ...UI2.truncate },
  actMeta:  { ...T2.caption, color: C2.textSecondary, ...UI2.truncate },   // a step darker than the muted caption — readable on the glass footers
  actHint:  { ...UI2.row(SP2.sm), flex: 1, minWidth: 0, ...T2.label },
  cta:      { ...UI2.btn.brand, padding: pad(0, SP2.lg), flexShrink: 0 },
  cancel:   { ...UI2.btn.soft, flexShrink: 0 },

  // ── "Add a role" view — sits on the same white surface once it has grown over the page ──
  addSheet: { position: 'absolute', inset: 0, zIndex: 3, overflowY: 'auto' },
  addInner: { position: 'relative', zIndex: 0, display: 'flex', flexDirection: 'column', minHeight: '100%', boxSizing: 'border-box', padding: pad(SP2.lg, LAYOUT2.pageX, 0) },   // no bottom padding: the glass footer sits on the bottom edge
  addBg:    { position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', background: C2.pageBg, pointerEvents: 'none' },   // positioned itself: the fade wrapper would otherwise become the art's frame
  addBar:   { ...UI2.row(SP2.md), justifyContent: 'flex-start', width: '100%', height: TOP_H - SP2.lg, flexShrink: 0 },   // full width → logo at the top-LEFT corner, where the brand always sits
  // header shares the top bar's line: the pill sits level with Back / the logo (pulled up by the bar's height)
  addHead:  { ...UI2.stack(SP2.md), alignItems: 'center', textAlign: 'center', marginTop: -(TOP_H - SP2.lg + SZ2.icon.xs) / 2, padding: pad(0, 0, SP2.lg), pointerEvents: 'none' },   /* pill centred on the bar's line */   // pointerEvents none: never blocks the bar underneath
  addStack: (w) => ({ ...UI2.stack(SP2.huge), alignItems: 'center', width: '100%', maxWidth: w, margin: '0 auto', paddingBottom: SP2.huge }),
  // glass footer of the add view: sticks to the bottom of the screen (same glass as the workspace footer), full width;
  // marginTop auto keeps it on the bottom edge when the cards are few
  addFoot:  {
    position: 'sticky', bottom: 0, zIndex: 2, marginTop: 'auto', marginLeft: -LAYOUT2.pageX, marginRight: -LAYOUT2.pageX,
    minHeight: SZ2.footerBar, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: pad(SP2.sm, LAYOUT2.pageX),
    background: C2.backgroundGlass, backdropFilter: BLUR2.bar, WebkitBackdropFilter: BLUR2.bar,   // light tint: the blue waves behind it never wash out the text
    borderTop: `${SZ2.hairline}px solid ${C2.barGlassEdge}`, boxShadow: SH2.barUp,
  },
  addFootRow: (w) => ({ width: '100%', maxWidth: w, margin: '0 auto' }),   // lines up with the cards above

  // modals
  mIcon:    (tone) => ({ ...UI2.iconBox(SZ2.icon.lg, tone), marginBottom: SP2.md }),
  mText:    { ...T2.body, margin: 0 },
  mNote:    { ...UI2.tonePanel(TONES2.error), ...T2.label, color: C2.errorDark, padding: pad(SP2.md, SP2.lg), marginTop: SP2.md },
};

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

const initialsOf = (user, email) => {
  const n = [user?.first_name, user?.last_name].filter(Boolean).map(s => s[0]).join('');
  return (n || email.slice(0, 1) || 'U').toUpperCase();
};

// How many compact cards fit in a row of the add view at the current window width (max ADD_MAX_COLS) — updates on resize
function useAddCols() {
  const fit = () => Math.max(1, Math.min(ADD_MAX_COLS, Math.floor((Math.min(window.innerWidth - LAYOUT2.pageX * 2, CARD_WIDE.max) + ADD_GAP) / (CARD_WIDE.min + ADD_GAP))));
  const [cols, setCols] = useState(fit);
  useEffect(() => {
    const onResize = () => setCols(fit());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return cols;
}

// ─── One photo card ───────────────────────────────────────────────────────────
// item = its step in the view-switch choreography (un2-ps-item, --k) instead of the page-open deal-in
function PersonaCard({ p, info, on, index, base, out, disabled, onSelect, onOpen, size = CARD, tabbable = true, fluid = false, item, cell }) {   // cell = custom fluid cell (add grid)
  const wrap = item === undefined
    ? { className: `un2-deal${out ? ' is-out' : ''}`, style: { ...(fluid ? S.cell : {}), '--un2-i': index, '--un2-deal-base': `${base}s` } }
    : { className: 'un2-ps-item', style: { ...(cell || (fluid ? S.cell : {})), '--k': item } };
  return (
    <div className={wrap.className} style={wrap.style}>
      <button
        type="button" role="radio" aria-checked={on} aria-label={`${p.label} — ${info.status}`} disabled={disabled} tabIndex={tabbable ? 0 : -1}
        className={`un2-persona${on ? ' is-selected' : ''}`} style={{ ...S.card(on, size), ...(fluid ? S.fluidBox(size) : {}) }}
        onClick={onSelect} onDoubleClick={onOpen}
        onKeyDown={e => { if (e.key === 'Enter' && on) { e.preventDefault(); onOpen(); } }}
      >
        <img src={p.img} alt="" className="un2-persona-photo" style={S.photo(p.pos)} />
        <span style={S.scrim} aria-hidden="true" />
        <span style={S.top}>
          <span style={S.chip}>
            {info.isNew ? <i className="ti ti-sparkles" aria-hidden="true" /> : <span style={S.chipDot(info.tone)} />}
            {info.status}
          </span>
          <span style={S.mark(on)} aria-hidden="true">{on && <i className="ti ti-check un2-pop" style={S.markIcon} />}</span>
        </span>
        <span style={S.body}>
          <span style={S.icon}><i className={`ti ${p.icon}`} aria-hidden="true" /></span>
          <span style={S.name}>{p.label}</span>
          <span style={S.sub}>{p.sub}</span>
        </span>
      </button>
    </div>
  );
}

// ─── Action row: selected role + its main button ────────────────────────────────
function ActionRow({ width, persona, info, note, busy, onGo, onCancel, emptyHint, bare = false }) {
  const id = persona ? persona.key : 'none';
  return (
    <div style={S.action(width, bare)} aria-live="polite">
      {persona && info ? (
        <>
          <span key={`t-${id}`} className="un2-swap" style={S.actThumb}><img src={persona.img} alt="" style={S.thumbImg(persona.pos)} /></span>
          <span key={`x-${id}`} className="un2-swap" style={S.actText}>
            <span style={S.actName}>{persona.label}</span>
            <span style={S.actMeta} title={note}>{note}</span>
          </span>
        </>
      ) : (
        <span style={S.actHint}><i className="ti ti-hand-click" style={UI2.btnIcon} aria-hidden="true" /> {emptyHint}</span>
      )}
      {onCancel && <button type="button" className="un2-btn" style={S.cancel} onClick={onCancel}>Cancel</button>}
      <button type="button" className="un2-btn" style={{ ...S.cta, ...(busy || !info ? AUTH.busy : {}), ...(!info ? { cursor: 'not-allowed' } : {}) }} onClick={onGo} disabled={busy || !info}>
        {busy
          ? <><i className="ti ti-loader-2 un2-spin" style={UI2.btnIcon} aria-hidden="true" /> Opening…</>
          : info
            ? <span key={`c-${id}`} className="un2-swap" style={UI2.row(SP2.sm)}>{info.cta} <i className={`ti ${info.icon}`} style={UI2.btnIcon} aria-hidden="true" /></span>
            : 'Continue'}
      </button>
    </div>
  );
}

export default function PersonaSelectPage() {
  const navigate = useNavigate();

  const { refreshAuth } = useAuth();

  const activatePersona = async (personaKey) => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/api/auth/switch-persona/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ persona: personaKey }),
      });
      await refreshAuth(); // reload permissions with new active_persona
    } catch {
      // Non-blocking — navigate anyway
    }
  };

  const [user,                 setUser]                 = useState(null);
  const [activeKeys,           setActiveKeys]           = useState([]);
  const [inactiveKeys,         setInactiveKeys]         = useState([]);
  const [loading,              setLoading]              = useState(true);
  const [showAll,              setShowAll]              = useState(false);   // "Add a role" sheet open
  const [error,                setError]                = useState('');

  // ── Org PMS specific state ─────────────────────────────────────────────────
  // null = still loading, false = no record exists, object = latest OrgPMS record
  const [orgPmsRecord,         setOrgPmsRecord]         = useState(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showReactivateModal,  setShowReactivateModal]  = useState(false);
  const [pendingReactivateKey, setPendingReactivateKey] = useState(null);
  const [showRejectionModal,   setShowRejectionModal]   = useState(false);

  // ── Selection (select → continue) ─────────────────────────────────────────
  const [selected,  setSelected]  = useState(null);   // a role you hold: { key }
  const [addPick,   setAddPick]   = useState(null);   // a role picked in the add sheet: key
  const [busy,      setBusy]      = useState(false);
  const mounted = useRef(true);
  const closeTimer = useRef(null);
  const addCols = useAddCols();
  useEffect(() => () => { mounted.current = false; clearTimeout(closeTimer.current); }, []);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) { navigate('/'); return; }

      try {
        // ── Step 1: fetch user profile ──────────────────────────────────────
        const meRes = await fetch(`${API_BASE}/api/auth/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.status === 401) { localStorage.clear(); navigate('/'); return; }
        if (!meRes.ok) throw new Error('Failed to load profile');

        const data = await meRes.json();
        setUser(data);

        let keys = [];
        if (Array.isArray(data.active_personas)) {
          keys = data.active_personas;
        } else if (Array.isArray(data.personas)) {
          keys = data.personas.map(p => (typeof p === 'string' ? p : p.persona));
        }
        if (!keys.includes('UN_ADMIN')) {
          if (!keys.includes('RENTER')) keys = ['RENTER', ...keys];
        }
        setActiveKeys(keys);
        setInactiveKeys(Array.isArray(data.inactive_personas) ? data.inactive_personas : []);

        // ── Step 2: fetch OrgPMS record — skip entirely for UN_ADMIN ───────
        // Using the keys we just got from the API — 100% reliable, no race condition.
        if (keys.includes('UN_ADMIN')) {
          setOrgPmsRecord(false);
        } else {
          try {
            const orgRes = await fetch(`${API_BASE}/api/admin/org-pms/?mine=true`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (orgRes.ok) {
              const orgData = await orgRes.json();
              const list = Array.isArray(orgData) ? orgData : (orgData.results || []);
              setOrgPmsRecord(list[0] || false);
            } else {
              setOrgPmsRecord(false);
            }
          } catch {
            setOrgPmsRecord(false);
          }
        }

      } catch (err) {
        if (err.message !== 'Unauthorized') {
          setError('Could not load your profile.');
          setActiveKeys(['RENTER']);
          const decoded = decodeJWT(localStorage.getItem('access_token'));
          if (decoded) setUser({ email: decoded.email || decoded.username || '' });
          setOrgPmsRecord(false);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // ── Derived org PMS state ──────────────────────────────────────────────────
  const orgPmsStatus = orgPmsRecord ? orgPmsRecord.status : null;
  // Show the Org PMS persona card only for these statuses (not REJECTED, not null)
  const showOrgPmsCard = orgPmsRecord && ['DRAFT','PENDING','APPROVED','SUSPENDED'].includes(orgPmsStatus);
  // Suppress ORGANIZATIONAL_PM from "Add Persona" list if user has active application
  const orgPmsAvailableToAdd = !orgPmsRecord || orgPmsStatus === 'REJECTED';

  const handlePersonaClick = async (persona) => {
    if (persona.key === 'ORGANIZATIONAL_PM') {
      switch (orgPmsStatus) {
        case 'DRAFT':
          if (orgPmsRecord?.id) localStorage.setItem('org_pms_id', orgPmsRecord.id);
          navigate('/org-onboarding/step-1');
          break;
        case 'PENDING':
          navigate('/org-onboarding/pending');
          break;
        case 'APPROVED':
          await activatePersona('ORGANIZATIONAL_PM');
          navigate('/org-portal/dashboard/welcome');
          break;
        case 'SUSPENDED':
          navigate('/coming-soon');
          break;
        default:
          break;
      }
      return;
    }

    // ── All other personas ────────────────────────────────────
    if (activeKeys.includes(persona.key)) {
      switch (persona.key) {
        case 'INDEPENDENT_PM':
          await activatePersona('INDEPENDENT_PM');
          navigate('/pm-portal/dashboard/welcome');
          break;
        case 'PM_STAFF':
          await activatePersona('PM_STAFF');
          navigate('/pm-portal/dashboard/my-dashboard');
          break;
        case 'UN_ADMIN':
          await activatePersona('UN_ADMIN');
          navigate('/admin-portal/dashboard');
          break;
        case 'LANDLORD':
          navigate('/landlord-portal/dashboard');
          break;
        case 'TENANT':
          navigate('/coming-soon');
          break;
        case 'RENTER':
          // Session 51, Phase 3 — closes the loop the Marketplace
          // architecture doc flagged (no authenticated homepage variant to
          // land a Renter login on): the Marketplace homepage itself is
          // that variant now, so Renter goes there instead of the
          // /coming-soon placeholder every other not-yet-built persona
          // still uses.
          navigate('/marketplace');
          break;
        default:
          navigate('/coming-soon');
      }
    } else if (inactiveKeys.includes(persona.key)) {
      setPendingReactivateKey(persona.key);
      setShowReactivateModal(true);
    } else {
      navigate(persona.route);
    }
  };

  // ── When user picks a persona in the "Add a role" sheet ───────────────────
  const handleUnregisteredPersonaClick = (persona) => {
    if (persona.key === 'ORGANIZATIONAL_PM') {
      if (orgPmsStatus === 'REJECTED') {
        // Show rejection modal before starting fresh
        setShowRejectionModal(true);
      } else {
        // Truly new application — clear any stale org_pms_* keys and go to Step 1
        clearOrgPmsStorage();
        navigate('/org-onboarding/step-1');
      }
      return;
    }
    navigate(persona.route);
  };

  const clearOrgPmsStorage = () => {
    ['org_pms_id','org_pms_scenario','org_pms_country','org_pms_unit_count',
     'org_pms_integration_method','org_pms_plan_id','org_pms_billing_cycle',
     'org_pms_subscription_id','org_pms_selected_addons'].forEach(k => localStorage.removeItem(k));
  };

  const handleReactivateConfirm = () => {
    setShowReactivateModal(false);
    if (pendingReactivateKey === 'INDEPENDENT_PM') navigate('/pm-portal/profile/persona?mode=edit');
    if (pendingReactivateKey === 'LANDLORD') navigate('/landlord-registration/step-1');
    setPendingReactivateKey(null);
  };
  const handleReactivateCancel = () => { setShowReactivateModal(false); setPendingReactivateKey(null); };

  const handleRejectionConfirm = () => {
    setShowRejectionModal(false);
    clearOrgPmsStorage();
    navigate('/org-onboarding/step-1');
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/');
  };

  const displayEmail = user?.email || user?.username || '';
  const firstName    = user?.first_name || '';
  const fullName     = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

  // ── Lists ──────────────────────────────────────────────────────────────────
  // Registered personas (active/inactive from UserPersona) + the Org PMS application when it has one
  const registeredPersonas = ALL_PERSONAS.filter(p =>
    p.key !== 'ORGANIZATIONAL_PM' && (activeKeys.includes(p.key) || inactiveKeys.includes(p.key))
  );
  const myPersonas = [
    ...registeredPersonas,
    ...(showOrgPmsCard ? [ALL_PERSONAS.find(p => p.key === 'ORGANIZATIONAL_PM')] : []),
  ];
  // Unregistered personas available to add — suppress ORGANIZATIONAL_PM if already active
  const unregisteredPersonas = ALL_PERSONAS.filter(p => {
    if (p.key === 'ORGANIZATIONAL_PM') return orgPmsAvailableToAdd;
    return !activeKeys.includes(p.key) && !inactiveKeys.includes(p.key);
  });

  // ── Status chip / action-row wording for one persona ──────────────────────
  const describe = (group, p) => {
    if (group === 'add') {
      const rejected = p.key === 'ORGANIZATIONAL_PM' && orgPmsStatus === 'REJECTED';
      return {
        isNew: true, status: rejected ? 'Re-apply' : 'New role', tone: TONES2.primary,
        cta: rejected ? 'Start new application' : `Set up ${p.label}`, icon: rejected ? 'ti-plus' : 'ti-arrow-right',
        note: rejected ? 'Your previous application was rejected — you can apply again' : p.soon ? `The ${p.portalName} is coming soon` : p.blurb,
      };
    }
    if (p.key === 'ORGANIZATIONAL_PM') {
      const st = ORG_PMS_STATE[orgPmsStatus] || ORG_PMS_STATE.DRAFT;
      return { status: st.label, tone: st.tone, cta: st.cta, icon: 'ti-arrow-right', note: `${p.sub} · ${st.label}` };
    }
    if (inactiveKeys.includes(p.key) && !activeKeys.includes(p.key)) {
      return { status: 'Inactive', tone: TONES2.neutral, cta: 'Reactivate profile', icon: 'ti-refresh', note: "Paused — you'll review and resubmit your details" };
    }
    return {
      status: 'Active', tone: TONES2.primary, cta: `Continue to ${p.portalName}`, icon: 'ti-arrow-right',
      note: p.soon ? `The ${p.portalName} is coming soon` : p.blurb,
    };
  };

  // first load: preselect the active persona from the profile, else the first workspace
  useEffect(() => {
    if (loading || selected || !myPersonas.length) return;
    const current = myPersonas.find(p => p.key === user?.active_persona) || myPersonas[0];
    setSelected(current.key);
  }, [loading]);   // eslint-disable-line react-hooks/exhaustive-deps

  const selPersona = myPersonas.find(p => p.key === selected);
  const selInfo = selPersona ? describe('mine', selPersona) : null;
  const addPersona = unregisteredPersonas.find(p => p.key === addPick);
  const addInfo = addPersona ? describe('add', addPersona) : null;

  const proceed = async (group, persona) => {
    if (!persona || busy) return;
    if (group === 'add') setAddPick(persona.key); else setSelected(persona.key);
    setBusy(true);
    try {
      if (group === 'add') handleUnregisteredPersonaClick(persona);
      else await handlePersonaClick(persona);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  // ── "Add a role": the view is always mounted (hidden) — only CSS state changes, so nothing pops in or restarts ──
  const openAdd = () => {
    clearTimeout(closeTimer.current);
    setAddPick(null);
    setShowAll(true);
  };
  const closeAdd = () => {
    setShowAll(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => { if (mounted.current) setAddPick(null); }, SHEET_MS);   // clear the pick once it's out of sight
  };
  // Esc closes the sheet (not while a confirmation modal is open — the Modal handles its own Esc)
  useEffect(() => {
    if (!showAll || showReactivateModal || showRejectionModal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeAdd(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showAll, showReactivateModal, showRejectionModal]);   // eslint-disable-line react-hooks/exhaustive-deps

  const fanPersonas = unregisteredPersonas.slice(0, 3);
  const addWidth = CARD_WIDE.max;   // grid + footer width (fluid below it)

  return (
    <div className={`un2-ps${showAll ? ' is-away' : ''}`} style={S.page}>
      {/* backdrop: wave art top-right + bottom-left */}
      <div className="un2-intro-fade" style={introAt(0)}>
        <ImageBackdrop image={backdropArt} />
        <div style={S.waveWrap} aria-hidden="true"><div style={S.waveLeft} /></div>
      </div>

      {/* ═══ LEFT — photo panel ═══ */}
      <aside className="un2-hide-md" style={S.photoPanel}>
        <div className="un2-intro-curtain" style={{ ...S.photoClip, ...introAt(INTRO.photo) }}>
          <img src={heroArt} alt="" className="un2-intro-zoom" style={{ ...S.photoImg, ...introAt(INTRO.photo) }} />
          <div style={S.scrimTop} aria-hidden="true" />
          <div style={S.scrimSide} aria-hidden="true" />
          <Particles variant="stars" />
        </div>
        {/* copy — outside the faded photo layer, so it never fades with it */}
        <div style={S.photoBody}>
            <div className="un2-intro-up" style={{ ...S.brand, ...introAt(INTRO.brand) }}>
              <img src={brandLogo} alt="" style={S.logo} />
              <span>
                <span style={S.brandName}>UrbanNest</span>
                <span style={S.brandSub}>Platform</span>
              </span>
            </div>
            <h2 style={S.title}>
              {['One account,', 'multiple roles.'].map((line, i) => (
                <span key={line} className="un2-intro-line"><span style={introAt(INTRO.line + i * INTRO.lineStep)}>{line}</span></span>
              ))}
            </h2>
            <div className="un2-intro-up" style={{ ...S.rule, ...introAt(INTRO.copy) }} aria-hidden="true" />
            <p className="un2-intro-up" style={{ ...S.copy, ...introAt(INTRO.copy) }}>
              Manage your rentals, properties and profiles — all in one place.
            </p>
            <div style={S.perks}>
              {PERKS.map((p, i) => (
                <div key={p.text} className="un2-intro-up" style={{ ...S.perk, ...introAt(INTRO.perks + i * INTRO.lineStep) }}>
                  <span style={S.perkIcon}><i className={`ti ${p.icon}`} aria-hidden="true" /></span>
                  <span style={S.perkText}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>
      </aside>

      {/* ═══ The white sheet's surface — grows over the whole page for "Add a role", shrinks back after ═══ */}
      <div className="un2-intro-rise" style={{ ...S.surfaceWrap, ...introAt(INTRO.sheet) }} aria-hidden="true">
        <div className="un2-ps-surface" style={S.surface} />
      </div>

      {/* ═══ RIGHT — who's signed in + the white sheet ═══ */}
      <div className="un2-ps-right un2-ps-content" style={S.right} aria-hidden={showAll}>
        <div className="un2-ps-item" style={{ flexShrink: 0, '--k': 0 }}>
        <header className="un2-intro-up" style={{ ...S.topBar, ...introAt(INTRO.sheet) }}>
          <div style={S.account}>
            {loading
              ? <span className="un2-skel" style={{ ...UI2.skeleton(SZ2.icon.md, SZ2.icon.md), borderRadius: R2.round }} />
              : <span style={S.avatar} aria-hidden="true">{initialsOf(user, displayEmail)}</span>}
            <div style={S.whoText} className="un2-hide-md">
              <span style={S.whoName}>{loading ? ' ' : (fullName || displayEmail)}</span>
              {fullName && <span style={S.whoMail}>{displayEmail}</span>}
            </div>
            <span style={S.accountRule} aria-hidden="true" />
            <button type="button" className="un2-link" style={S.signOut} onClick={handleSignOut} tabIndex={showAll ? -1 : 0}>
              <i className="ti ti-logout" style={UI2.btnIcon} aria-hidden="true" /> Sign out
            </button>
          </div>
        </header>
        </div>

        <div style={S.sheetWrap}>
          <main style={S.sheet}>
            <div className="un2-ps-fade"><CornerArt /></div>
            <div style={S.sheetCol('100%')}>
              <div className="un2-ps-item" style={{ ...S.head, '--k': 1 }}>
                <span className="un2-intro-up" style={{ ...S.eyebrow, ...introAt(INTRO.head) }}>
                  <i className="ti ti-sparkles" aria-hidden="true" /> Welcome back{firstName ? `, ${firstName}` : ''}
                </span>
                <h1 className="un2-intro-up" style={{ ...S.h1, ...introAt(INTRO.head + 0.08) }}>Choose your workspace</h1>
                <p className="un2-intro-up" style={{ ...S.lead, ...introAt(INTRO.head + 0.16) }}>Select a role to continue to its dashboard — you can switch any time.</p>
              </div>

              {error && (
                <div style={UI2.errorBanner} role="alert">
                  <i className="ti ti-alert-circle" aria-hidden="true" /> {error}
                </div>
              )}

              <div className="un2-ps-item" style={{ ...S.deckScroll, '--k': 2 }}>
              {loading ? (
                <div style={S.deckFluid} aria-busy="true">
                  {[0, 1, 2].map(i => <span key={i} style={S.cell}><span className="un2-skel" style={S.skel} /></span>)}
                </div>
              ) : (
                <div role="radiogroup" aria-label="Your workspaces" className="un2-persona-deck" style={S.deckFluid}>
                  {myPersonas.map((p, i) => (
                    <PersonaCard
                      key={p.key} p={p} info={describe('mine', p)} on={selected === p.key} index={i} base={INTRO.deck}
                      disabled={busy} size={CARD_LG} tabbable={!showAll} fluid
                      onSelect={() => setSelected(p.key)} onOpen={() => proceed('mine', p)}
                    />
                  ))}

                  {unregisteredPersonas.length > 0 && (
                    <div className="un2-deal" style={{ ...S.cell, '--un2-i': myPersonas.length, '--un2-deal-base': `${INTRO.deck}s` }}>
                      <button
                        type="button" className="un2-persona un2-add" style={{ ...S.add(CARD_LG), ...S.fluidBox(CARD_LG) }} tabIndex={showAll ? -1 : 0}
                        onClick={openAdd} aria-expanded={showAll} aria-controls="persona-add-sheet" disabled={busy}
                      >
                        <span className="un2-fan" style={S.fan(CARD_LG)} aria-hidden="true">
                          {fanPersonas.map((p, i) => (
                            <span key={p.key} style={S.fanItem(i, fanPersonas.length, CARD_LG)}><img src={p.img} alt="" style={S.thumbImg(p.pos)} /></span>
                          ))}
                        </span>
                        <span style={S.plus}><i className="ti ti-plus un2-add-plus" aria-hidden="true" /></span>
                        <span style={S.addName}>Add a role</span>
                        <span style={S.addSub}>{unregisteredPersonas.length} {unregisteredPersonas.length === 1 ? 'role' : 'roles'} you can set up</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              </div>

              {!loading && (
                <div className="un2-ps-item" style={{ ...S.actionWrap, '--k': 3 }}>
                  <div className="un2-intro-up" style={{ ...S.actionInner, ...introAt(INTRO.action) }}>
                    <ActionRow
                      bare width="100%" persona={selPersona} info={selInfo} note={selInfo?.note} busy={busy && !showAll}
                      onGo={() => proceed('mine', selPersona)} emptyHint="Select a workspace to continue"
                    />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ═══ "Add a role" view — appears on the white surface once it covers the page ═══ */}
      <section
        id="persona-add-sheet" className="un2-ps-add" style={S.addSheet}
        role="dialog" aria-modal="true" aria-label="Add a role" aria-hidden={!showAll}
      >
        <div style={S.addInner}>
          {/* our page background (pageBg + the soft wave art top-right and bottom-left) — fades with the view, never moves */}
          <div className="un2-ps-fade" style={S.addBg} aria-hidden="true">
            <ImageBackdrop image={backdropArt} />
            <div style={S.waveWrap}><div style={S.waveLeft} /></div>
          </div>

          <div className="un2-ps-item" style={{ ...S.addBar, '--k': 0 }}>
            <div style={S.brand}>
              <img src={brandLogo} alt="" style={S.logo} />
              <span style={{ ...S.brandName, color: C2.navyDeep }}>UrbanNest</span>
            </div>
          </div>

          {!loading && (
            <>
              <div style={S.addHead}>
                <span className="un2-ps-item" style={{ ...S.eyebrow, '--k': 1 }}>
                  <i className="ti ti-users-plus" aria-hidden="true" /> Add a role
                </span>
                <h2 className="un2-ps-item" style={{ ...S.h1, '--k': 2 }}>Unlock a new role</h2>
                <p className="un2-ps-item" style={{ ...S.lead, '--k': 3 }}>Pick what else you do — we'll walk you through setting it up.</p>
              </div>

              <div style={S.addStack(addWidth)}>
                <div role="radiogroup" aria-label="Roles you can add" className="un2-persona-deck" style={S.deck}>
                  {unregisteredPersonas.map((p, i) => (
                    <PersonaCard
                      key={p.key} p={p} info={describe('add', p)} on={addPick === p.key} item={4 + i} size={CARD_WIDE} fluid cell={addCell(addCols)}
                      disabled={busy} tabbable={showAll}
                      onSelect={() => setAddPick(p.key)} onOpen={() => proceed('add', p)}
                    />
                  ))}
                </div>
              </div>

              {/* glass footer — pinned to the bottom of the screen, so Cancel / Set up are visible at first look;
                  the cards scroll underneath it */}
              <div className="un2-ps-item" style={{ ...S.addFoot, '--k': 4 + unregisteredPersonas.length }}>
                <div style={S.addFootRow(addWidth)}>
                  <ActionRow
                    bare width="100%" persona={addPersona} info={addInfo} note={addInfo?.note} busy={busy && showAll}
                    onGo={() => proceed('add', addPersona)} onCancel={closeAdd} emptyHint="Pick a role to see how to set it up"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Reactivate modal (inactive Landlord / Independent PM — existing logic) ── */}
      {showReactivateModal && (
        <Modal
          title="Reactivate profile?"
          onClose={handleReactivateCancel}
          footer={<>
            <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={handleReactivateCancel}>Cancel</button>
            <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={handleReactivateConfirm}>
              <i className="ti ti-refresh" style={UI2.btnIcon} aria-hidden="true" /> Yes, reactivate
            </button>
          </>}
        >
          <span style={S.mIcon(TONES2.primary)}><i className="ti ti-refresh" aria-hidden="true" /></span>
          <p style={S.mText}>
            Your {pendingReactivateKey === 'LANDLORD' ? 'Landlord' : 'Independent PM'} profile is currently inactive.
            Would you like to reactivate it? You'll need to review and resubmit your details.
          </p>
        </Modal>
      )}

      {/* ── Rejection modal (Organisational PMS application rejected) ── */}
      {showRejectionModal && (
        <Modal
          title="Previous application rejected"
          onClose={() => setShowRejectionModal(false)}
          footer={<>
            <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={() => setShowRejectionModal(false)}>Cancel</button>
            <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={handleRejectionConfirm}>
              <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Start new application
            </button>
          </>}
        >
          <span style={S.mIcon(TONES2.error)}><i className="ti ti-alert-circle" aria-hidden="true" /></span>
          <p style={S.mText}>
            Your previous Organizational PMS application was rejected. You can start a fresh new application — your previous submission will be kept on record.
          </p>
          <div style={S.mNote}>
            A new account number will be assigned to your re-application. Your existing personas (Renter, etc.) will not be affected.
          </div>
        </Modal>
      )}
    </div>
  );
}
