// src/pages/PMPortal/Listing/pmListingWizardShared.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Shared shell, stepper, section-head and style tokens for the PM Portal
// "Create Listing" wizard (Property → Unit → Promote → Publish).
//
// Session 47 (Independent PM / Org PM Listing capability, first build
// slice). This file is a deliberate duplicate of
// ../../Landlord/Listing/listingWizardShared.jsx, not a persona-prop
// extension of it — the two portals' shells (NavB+PMTopBar here vs NavF
// there) are different enough that parametrizing one component would mean
// branching almost every line of ListingPageShell, whereas the wizard STEP
// content underneath (form fields, business logic, listingApi.js calls) is
// already portal-agnostic and is reused as-is, unduplicated. This mirrors
// the codebase's own existing precedent for this exact wizard — Multi-Unit
// (ListMultiStep1_Property.jsx etc.) is a parallel duplicate of the
// Individual-Unit steps, not a parametrized version of them.
//
// Styled to match the REAL PM Portal pages (NavB.jsx, PMTopBar.jsx,
// PMPropertiesPage.jsx) — Nunito Sans body / Noto Serif headline + navy
// #002D5B — via pmListingTokens.js. Per listingWizardShared.jsx's own
// comment, this is actually closer to the wizard's ORIGINAL frozen-
// wireframe skin than Landlord's Inter/landlordTokens reskin was.
//
// Layout/content/fields are unchanged from listingWizardShared.jsx — only
// the shell (NavB+PMTopBar instead of NavF+custom topbar, PM Portal
// breadcrumb targets instead of Landlord's) and the color/font skin
// changed. Keep this file's LS token object in sync with
// listingWizardShared.jsx's if the wireframe layout itself changes —
// they're meant to stay structurally identical, only reskinned.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';
import { C, F } from './pmListingTokens';

export const STEPS = [
  { n: 1, label: 'Property' },
  { n: 2, label: 'Unit' },
  { n: 3, label: 'Promote' },
  { n: 4, label: 'Publish' },
];

// Multi-Unit Listing wizard's own steps — same 4-step shape as STEPS above
// ("Unit" → "Listing") — kept here for parity with the Landlord file even
// though the PM Multi-Unit wizard isn't built yet (this session's first
// slice is Individual Unit only — see Session47_EndSummary.md).
export const MULTI_STEPS = [
  { n: 1, label: 'Property' },
  { n: 2, label: 'Listing' },
  { n: 3, label: 'Promote' },
  { n: 4, label: 'Publish' },
];

// ─── Shared style tokens ───────────────────────────────────────────────────
export const LS = {
  shell:   { display: 'flex', height: '100vh', fontFamily: F.sans, background: C.pageBg, overflow: 'hidden' },
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:  { background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  topTitle:{ fontSize: 14, fontWeight: 550, color: C.txtPrimary },
  topRight:{ display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtSec, cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 16 },
  avatar:  { width: 32, height: 32, borderRadius: '50%', background: C.navBg, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1, overflowY: 'auto', padding: '0 0 28px' },

  bread:    { padding: '12px 28px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 },
  breadLink:{ color: C.blue, cursor: 'pointer', fontWeight: 500 },
  breadSep: { color: C.txtMuted },
  breadCur: { color: C.txtPrimary },

  pageHead: { padding: '14px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 },
  pageTitle:{ fontSize: 24, fontWeight: 700, color: C.txtPrimary, letterSpacing: -0.3, margin: '0 0 4px' },
  pageSub:  { fontSize: 12.5, color: C.txtSec, margin: 0, maxWidth: 520, lineHeight: 1.5 },
  statusPill: { display: 'flex', alignItems: 'center', gap: 6, background: C.stdBg, border: `1px solid ${C.cardBdr}`, borderRadius: 20, padding: '6px 14px', fontSize: 11.5, fontWeight: 600, color: C.txtSec, whiteSpace: 'nowrap', flexShrink: 0 },
  statusDot: { width: 7, height: 7, borderRadius: '50%', background: C.txtMuted },

  // STEPPER
  stepper:      { display: 'flex', alignItems: 'center', maxWidth: '54%', margin: '18px 28px 20px', padding: '2px 0' },
  step:         { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  stepCircle:   (state) => ({
    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
    background: state === 'done' ? C.green : state === 'current' ? C.blue : '#fff',
    color: state === 'todo' ? C.txtMuted : '#fff',
    border: state === 'todo' ? `1.5px solid ${C.cardBdr}` : 'none',
  }),
  stepLabel: (state) => ({
    fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
    color: state === 'done' ? C.greenDark : state === 'current' ? C.txtPrimary : C.txtMuted,
  }),
  stepLine: { flex: 1, height: 2, background: C.cardBdr, margin: '0 16px' },

  // LAYOUT
  sw:       { padding: '0 28px' },
  // Session 49 fix, ported from the Landlord wizard's listingWizardShared.jsx
  // (same bug, never carried over here) — was '1.55fr 1fr' with no
  // minmax(), so a grid track's default automatic minimum size (content's
  // min-content width, not 0) could win over the fr share whenever a card
  // held non-shrinking content (e.g. the "Already Paid" tile's single-line
  // text row) — the left column would grow past its fr share to fit that
  // content, pushing the whole page wider than the viewport and introducing
  // a horizontal scrollbar. minmax(0, Nfr) clamps each track to its fr
  // share and forces inner content to wrap/shrink instead. 7fr:3fr matches
  // the Landlord wizard's locked 70%/30% split (was ~60.8%/39.2% before).
  split:    { display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: 20, alignItems: 'start', paddingBottom: 18 },
  // minWidth: 0 lets this flex column actually shrink to its grid track's
  // clamped width instead of being pushed wide by a non-shrinking child —
  // part of the same fix as `split` above.
  splitCol: { display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 },

  card: { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '20px 22px' },

  secHead:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  secIcon:  (bg, color) => ({ width: 28, height: 28, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }),
  secTitle: { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  secNote:  { fontSize: 11.5, color: C.txtMuted, margin: '2px 0 0' },

  hr:   { height: 1, background: C.cardBdr, margin: '18px 0' },
  hint: { fontSize: 11, color: C.txtMuted, marginTop: 2 },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldFull: { gridColumn: '1 / -1' },
  lbl:  { fontSize: 10.5, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  lblRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },

  // Read-only display box (data pulled from Property/Unit record)
  inpStatic:    { height: 38, border: `1px solid ${C.cardBdr}`, borderRadius: 6, background: '#f8f9fb', fontSize: 13, padding: '0 12px', color: C.txtPrimary, display: 'flex', alignItems: 'center', boxSizing: 'border-box' },
  inpStaticPh:  { color: C.txtMuted },
  // Editable input/select — same box, live border on focus
  inp: { width: '100%', height: 38, border: `1px solid ${C.cardBdr}`, borderRadius: 6, background: '#fff', fontSize: 13, padding: '0 12px', color: C.txtPrimary, fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' },
  txtarea: { width: '100%', minHeight: 72, border: `1px solid ${C.cardBdr}`, borderRadius: 6, background: '#fff', fontSize: 13, padding: '10px 12px', color: C.txtPrimary, lineHeight: 1.5, fontFamily: F.sans, outline: 'none', resize: 'vertical', boxSizing: 'border-box' },

  // Blue is PM Portal's own accent hue here (NavB/PMTopBar primary) —
  // reusing blueLight/blueDark keeps this chip in the same family as the
  // rest of PM Portal rather than an unrelated indigo.
  btnAi: { display: 'inline-flex', alignItems: 'center', gap: 5, background: C.blueLight, color: C.blueDark, border: 'none', borderRadius: 14, padding: '4px 10px 4px 8px', fontSize: 11, fontWeight: 700, fontFamily: F.sans, cursor: 'pointer', flexShrink: 0 },

  badgeOverride: { fontSize: 10.5, fontWeight: 700, color: C.greenDark, background: C.greenLight, borderRadius: 12, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 },

  amenityGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 },
  amenityGrid2: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 },
  amenityTile: (selected) => ({
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10,
    background: '#f8f9fb', borderRadius: 12, height: 49, padding: '0 13px',
    boxSizing: 'border-box', cursor: 'pointer', border: 'none',
    opacity: selected ? 1 : 0.5, transition: 'opacity 0.15s',
  }),
  amenityIcon: { width: 29, height: 29, borderRadius: 8, background: '#e8f5f0', color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 },
  amenityLabel:{ fontSize: 13, fontWeight: 550, color: C.txtPrimary, lineHeight: 1.3 },
  amenityTileAdd: { background: '#fff', border: `1.5px dashed ${C.cardBdr}`, color: C.txtSec },

  syncRow: { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cardBdr}` },
  checkbox: (on) => ({ width: 16, height: 16, borderRadius: 4, border: on ? 'none' : `1.5px solid ${C.cardBdr}`, background: on ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, cursor: 'pointer' }),
  cktext: { fontSize: 12.5, color: C.txtSec, fontWeight: 500 },

  radiopill: { display: 'flex', gap: 10 },
  rp: (on) => ({ height: 33, padding: '0 20px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 550, border: `1px solid ${C.cardBdr}`, background: '#f8f9fb', color: on ? C.txtPrimary : C.txtSec, cursor: 'pointer', boxSizing: 'border-box' }),
  rdot: (on) => ({ width: 15, height: 15, borderRadius: '50%', border: `1.5px solid ${on ? C.green : C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  rdotInner: { width: 7, height: 7, borderRadius: '50%', background: C.green },

  rowBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  toggle: (on) => ({ width: 38, height: 21, borderRadius: 11, padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer', background: on ? C.green : C.cardBdr, justifyContent: on ? 'flex-end' : 'flex-start' }),
  toggleKnob: { width: 17, height: 17, borderRadius: '50%', background: '#fff' },

  mapHeading: { fontSize: 15.5, fontWeight: 700, color: C.txtPrimary, margin: '0 0 10px' },
  mapSubhead: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary, margin: '0 0 4px' },
  mapDesc:    { fontSize: 11.5, color: C.txtSec, margin: '0 0 12px', lineHeight: 1.5 },
  mapBox:     { position: 'relative', borderRadius: 8, overflow: 'hidden', height: 180, background: 'linear-gradient(135deg,#EFEBE2,#E4EFE7 55%,#DCEBF7)', border: `1px solid ${C.cardBdr}` },
  mapPin:     (left, top, isProperty) => ({ position: 'absolute', top, left, width: isProperty ? 20 : 18, height: isProperty ? 24 : 22, color: isProperty ? '#7C3AED' : C.txtPrimary, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }),
  mapGoogle:  { position: 'absolute', bottom: 6, left: 8, fontSize: 11, fontWeight: 700, color: C.txtSec },
  mapStreetview: { position: 'absolute', bottom: 8, right: 8, width: 80, height: 48, borderRadius: 4, background: `linear-gradient(135deg, ${C.txtMuted}, ${C.txtSec})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: '#fff', fontSize: 8.5, fontWeight: 700, paddingBottom: 4 },
  mappills:   { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  mappill:    (active) => ({ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 700, color: active ? C.teal : C.txtSec, background: '#f8f9fb', whiteSpace: 'nowrap', cursor: 'pointer' }),

  poiGroup:    { marginBottom: 14 },
  poiGroupLbl: { fontSize: 10.5, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
  poiItem:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 10px', background: '#f8f9fb', borderRadius: 8, marginBottom: 6 },
  poiName:     { fontSize: 12, fontWeight: 550, color: C.txtPrimary },
  poiNameSub:  { display: 'block', fontSize: 10.5, fontWeight: 500, color: C.txtMuted, marginTop: 1 },
  poiDist:     { fontSize: 11, fontWeight: 700, color: C.greenDark, background: C.greenLight, borderRadius: 10, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 },

  chiprow: { minHeight: 38, border: `1px solid ${C.cardBdr}`, borderRadius: 6, background: '#f8f9fb', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '6px 10px' },
  chip:    { background: C.blueLight, color: C.blueDark, fontSize: 11.5, fontWeight: 600, borderRadius: 14, padding: '4px 8px 4px 10px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'default' },
  chipPh:  { fontSize: 12.5, color: C.txtMuted },

  lblNew: { background: C.blueLight, color: C.blueDark, borderRadius: 8, padding: '1px 6px', fontSize: 8.5, letterSpacing: 0.04, marginLeft: 6, textTransform: 'none', fontWeight: 700 },

  ckRow:      { display: 'flex', flexWrap: 'wrap', gap: 16 },
  ckItem:     { display: 'flex', alignItems: 'center', gap: 7 },
  ckGroupLbl: { fontSize: 10.5, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'block' },

  addLink: { fontSize: 11, fontWeight: 700, color: C.blue, cursor: 'pointer', display: 'inline-block' },

  photoGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 },
  photoTile:  (selected) => ({ position: 'relative', borderRadius: 8, aspectRatio: '4/3', background: `linear-gradient(135deg, ${C.txtMuted}, ${C.txtSec})`, border: `2px solid ${selected ? C.green : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }),
  photoCheck: { position: 'absolute', top: 6, right: 6, width: 17, height: 17, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uploadTile: { border: `1.5px dashed ${C.cardBdr}`, borderRadius: 8, aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: C.txtMuted, fontSize: 9.5, textAlign: 'center', cursor: 'pointer' },
  videoGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 },
  videoThumb: { position: 'relative', borderRadius: 8, aspectRatio: '4/3', background: `linear-gradient(135deg, ${C.txtPrimary}, ${C.navBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // ── STEP 3 — Promote ──────────────────────────────────────────────
  channelList: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 },
  channelRow: (enabled) => ({
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12,
    borderRadius: 8, background: '#f8f9fb', border: 'none',
    opacity: enabled ? 1 : 0.65,
  }),
  channelRowIcon: (enabled) => ({
    width: 30, height: 30, borderRadius: 8,
    background: enabled ? C.blueLight : C.stdBg, color: enabled ? C.blue : C.txtSec,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14,
  }),
  channelRowName: { fontSize: 13, fontWeight: 550, color: C.txtPrimary, display: 'flex', alignItems: 'center', gap: 8 },
  channelRowDesc: { fontSize: 11.5, color: C.txtMuted, marginTop: 1, lineHeight: 1.4 },
  badgeSoon: { fontSize: 9, fontWeight: 700, color: C.amber, background: C.amberLight, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 0.04, whiteSpace: 'nowrap' },

  planCarouselRow: { display: 'flex', alignItems: 'center', gap: 10 },
  planViewport: { flex: 1, minWidth: 0, overflow: 'hidden', paddingTop: 14 },
  planTrack: (index) => ({
    display: 'flex', gap: 14, transition: 'transform 0.25s ease',
    transform: `translateX(calc(${-index} * (100% + 14px) / 3))`,
  }),
  planArrow: (active) => ({
    width: 32, height: 32, borderRadius: '50%', border: `1px solid ${C.cardBdr}`,
    background: '#fff', color: active ? C.txtPrimary : C.txtMuted,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    fontSize: 14, cursor: active ? 'pointer' : 'not-allowed',
  }),
  plan: (selected) => ({
    border: `1.5px solid ${selected ? C.blue : C.cardBdr}`, borderRadius: 10, padding: 18,
    display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box',
    boxShadow: selected ? `0 0 0 3px ${C.blueLight}` : 'none', cursor: 'pointer',
    flex: '0 0 calc((100% - 28px) / 3)',
  }),
  planTag: { position: 'absolute', top: -10, left: 16, background: C.blue, color: '#fff', fontSize: 9.5, fontWeight: 700, borderRadius: 10, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 0.04, whiteSpace: 'nowrap' },
  planHeadRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, margin: '6px 0 2px' },
  planName: { fontSize: 15, fontWeight: 700, color: C.txtPrimary, margin: 0, fontFamily: F.sans },
  planDetails: { fontSize: 10.5, fontWeight: 700, color: C.blue, flexShrink: 0, cursor: 'pointer' },
  planPrice: { fontSize: 22, fontWeight: 700, color: C.txtPrimary, marginBottom: 2 },
  planPriceSub: { fontSize: 11, fontWeight: 600, color: C.txtMuted },
  planDesc: { fontSize: 11, color: C.txtMuted, marginBottom: 14 },
  planFeat: { display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1, marginBottom: 14 },
  planFeatItem: { display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: C.txtPrimary },
  planSelect: (selected) => ({
    height: 32, borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    border: `1.5px solid ${selected ? C.blue : C.cardBdr}`, color: selected ? '#fff' : C.txtSec, background: selected ? C.blue : 'transparent', cursor: 'pointer',
  }),
  costbar:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fb', borderRadius: 8, padding: '12px 16px', marginTop: 16 },
  costbarL:  { fontSize: 12.5, color: C.txtSec, fontWeight: 600 },
  costbarR:  { fontSize: 16, fontWeight: 700, color: C.txtPrimary },
  costbarRSub: { fontSize: 11, fontWeight: 600, color: C.txtMuted },

  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modalCard:  { width: 400, background: '#fff', borderRadius: 12, padding: 26, boxShadow: '0 24px 60px rgba(0,0,0,0.28)', position: 'relative', boxSizing: 'border-box' },
  modalClose: { position: 'absolute', top: 16, right: 16, width: 26, height: 26, borderRadius: '50%', background: C.stdBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtSec, flexShrink: 0, cursor: 'pointer', border: 'none' },
  modalTag:   { display: 'inline-block', background: C.blue, color: '#fff', fontSize: 9.5, fontWeight: 700, borderRadius: 10, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 0.04, marginBottom: 10 },
  modalTitle: { fontSize: 19, fontWeight: 700, color: C.txtPrimary, margin: '0 0 2px', fontFamily: F.sans },
  modalPrice: { fontSize: 22, fontWeight: 700, color: C.txtPrimary, marginBottom: 14 },
  modalSecLbl: { fontSize: 10.5, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5, margin: '16px 0 10px', display: 'block' },
  modalFine:  { fontSize: 11.5, color: C.txtSec, lineHeight: 1.6, background: '#f8f9fb', borderRadius: 8, padding: '12px 14px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 },

  // ── STEP 4 — Publish ──────────────────────────────────────────────
  editLink: { fontSize: 11.5, fontWeight: 700, color: C.blue, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' },

  previewWrap: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  previewCard: { width: 260, flexShrink: 0, border: `1px solid ${C.cardBdr}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  previewImg: { height: 150, background: `linear-gradient(135deg, ${C.txtMuted}, ${C.txtSec})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  previewBadge: { position: 'absolute', top: 10, left: 10, background: C.blue, color: '#fff', fontSize: 9.5, fontWeight: 700, borderRadius: 10, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 0.04 },
  previewBody: { padding: '14px 16px' },
  previewPrice: { fontSize: 16, fontWeight: 700, color: C.txtPrimary },
  previewPriceSub: { fontSize: 11, fontWeight: 600, color: C.txtMuted },
  previewTitle: { fontSize: 12.5, fontWeight: 700, color: C.txtPrimary, margin: '4px 0 3px' },
  previewAddr: { fontSize: 11, color: C.txtSec, marginBottom: 10, lineHeight: 1.5 },
  previewMeta: { display: 'flex', gap: 10, fontSize: 11, color: C.txtPrimary, fontWeight: 600, borderTop: `1px solid ${C.cardBdr}`, paddingTop: 10, flexWrap: 'wrap' },
  previewMetaItem: { display: 'flex', alignItems: 'center', gap: 4 },

  summaryCols: (single) => ({ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: single ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: single ? 0 : '14px 24px', alignContent: 'start' }),
  summaryRow: (isLast) => ({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: isLast ? 'none' : `1px solid ${C.stdBg}` }),
  summaryLbl: { fontSize: 12, color: C.txtSec, fontWeight: 600 },
  summaryVal: (muted) => ({ fontSize: 12.5, color: muted ? C.txtMuted : C.txtPrimary, fontWeight: 550, textAlign: 'right' }),
  channelTag: (on) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: on ? C.greenDark : C.txtMuted, background: on ? C.greenLight : C.stdBg, borderRadius: 10, padding: '2px 9px' }),

  checkList: { display: 'flex', flexDirection: 'column', gap: 2 },
  checkItem: (isLast) => ({ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 0', borderBottom: isLast ? 'none' : `1px solid ${C.stdBg}` }),
  checkIcon: (status) => ({ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, background: status === 'ok' ? C.green : C.amberLight, color: status === 'ok' ? '#fff' : C.amber, fontSize: 10 }),
  checkTitle: (status) => ({ fontSize: 12.5, fontWeight: 700, color: status === 'warn' ? C.amber : C.txtPrimary }),
  checkSub: { fontSize: 11, color: C.txtMuted, marginTop: 2, lineHeight: 1.4 },
  checkFix: { fontSize: 11.5, fontWeight: 700, color: C.red, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 12, marginTop: 1, cursor: 'pointer' },

  // FOOTER
  footer:     { position: 'sticky', bottom: 0, background: '#fff', borderTop: `1px solid ${C.cardBdr}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' },
  footerLeft: { fontSize: 12, color: C.txtMuted, marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: 1 },
  footerTotalLbl: { fontSize: 10.5, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: 0.06 },
  footerTotalVal: { fontSize: 17, fontWeight: 700, color: C.txtPrimary },
  footerNote: { fontSize: 10.5, color: C.txtMuted, marginRight: 10, maxWidth: 220, lineHeight: 1.4 },
  btn:        { height: 32, padding: '0 20px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: F.sans, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid transparent', cursor: 'pointer' },
  btnPrimary: { background: C.blue, color: '#fff' },
  btnSecondary: { background: '#fff', color: C.txtPrimary, border: `1px solid ${C.cardBdr}` },
  btnDisabled: { background: C.stdBg, color: C.txtMuted, cursor: 'not-allowed' },

  // ── MULTI-UNIT (kept for parity — not wired up this slice) ─────────────
  matrixTable: { width: '100%', borderCollapse: 'collapse' },
  matrixTh:    { textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 12px 10px', borderBottom: `1px solid ${C.cardBdr}` },
  matrixTr:    (selected) => ({ background: selected ? C.blueLight : 'transparent' }),
  matrixTd:    { padding: '12px', fontSize: 12.5, color: C.txtPrimary, borderBottom: `1px solid ${C.stdBg}`, verticalAlign: 'middle' },
  matrixUnitName: { fontSize: 13, fontWeight: 700, color: C.txtPrimary, whiteSpace: 'nowrap' },
  matrixUnitSub:  { fontSize: 11, color: C.txtMuted, marginTop: 1 },
  matrixStatus: (state) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700,
    borderRadius: 10, padding: '3px 9px',
    background: state === 'ready' ? C.greenLight : (state === 'needs_info' || state === 'editing') ? C.amberLight : C.stdBg,
    color: state === 'ready' ? C.greenDark : (state === 'needs_info' || state === 'editing') ? C.amber : C.txtMuted,
  }),
  matrixEditBtn: { height: 32, boxSizing: 'border-box', background: '#fff', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '0 12px', fontSize: 11.5, fontWeight: 700, color: C.blue, cursor: 'pointer', fontFamily: F.sans, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' },
  matrixOverrideDot: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: C.blueDark },

  specCard:     { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: '20px 22px' },
  specHdr:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  specTitle:    { fontSize: 15.5, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  specSub:      { fontSize: 11.5, color: C.txtMuted, margin: '2px 0 0' },
  specTabBar:   { display: 'flex', gap: 4, borderBottom: `1px solid ${C.cardBdr}`, marginBottom: 18 },
  specTab:      (active) => ({
    padding: '0 4px 11px', marginRight: 20, fontSize: 12.5, fontWeight: 700, fontFamily: F.sans,
    color: active ? C.blue : C.txtMuted, background: 'transparent', border: 'none', cursor: 'pointer',
    borderBottom: `2px solid ${active ? C.blue : 'transparent'}`,
  }),
  specBody:     { display: 'flex', flexDirection: 'column', gap: 4 },

  overrideRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#f8f9fb', borderRadius: 8, padding: '10px 14px', marginBottom: 14 },
  overrideLbl:   { fontSize: 12, fontWeight: 600, color: C.txtSec, display: 'flex', alignItems: 'center', gap: 7 },
  overrideBadge: (isOverridden) => ({
    fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 8px',
    background: isOverridden ? C.blueLight : C.stdBg,
    color: isOverridden ? C.blueDark : C.txtMuted,
  }),

  railLayout: { display: 'flex', gap: 28, alignItems: 'flex-start', paddingBottom: 24 },
  railCol:    { width: 220, flexShrink: 0, position: 'sticky', top: 0 },
  mainCol:    { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 },
  railLabel:  { fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  railItem:   (active) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 7,
    fontSize: 12.5, fontWeight: active ? 700 : 550, color: active ? C.greenDark : C.txtSec,
    background: active ? C.greenLight : 'transparent', cursor: 'pointer', marginBottom: 2,
  }),
  railUnitItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 7,
    fontSize: 12.5, fontWeight: active ? 700 : 550, color: C.txtPrimary, cursor: 'pointer', marginBottom: 2,
    borderLeft: `2px solid ${active ? C.txtPrimary : 'transparent'}`,
    background: active ? '#f8f9fb' : 'transparent',
  }),
  railDivider: { height: 1, background: C.cardBdr, margin: '10px 0' },
  railSectionLbl: { fontSize: 10, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: 0.6, margin: '14px 0 4px', padding: '0 10px' },

  cardHdrRow:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  cardHdrTitle: { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  cardHdrNote:  { fontSize: 11.5, color: C.txtMuted, margin: '2px 0 0' },
  cardHdrActions: { display: 'flex', gap: 8, flexShrink: 0 },

  btnSm:            { height: 32, padding: '0 14px', borderRadius: 10, fontSize: 11.5, fontWeight: 700, fontFamily: F.sans, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSmOutline:     { background: '#fff', border: `1px solid ${C.cardBdr}`, color: C.txtSec },
  btnSmGreenOutline:{ background: '#fff', border: `1.5px solid ${C.teal}`, color: C.teal },
  btnSmGreenSolid:  { background: C.teal, border: 'none', color: '#fff' },
  btnSmNavySolid:   { background: C.navyDark, border: 'none', color: '#fff' },

  matrixInlineInp: { height: 30, border: `1px solid ${C.cardBdr}`, borderRadius: 6, background: '#fff', fontSize: 12, padding: '0 8px', width: '100%', boxSizing: 'border-box', fontFamily: F.sans, color: C.txtPrimary },

  previewGrid2:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  previewCard2:    (selected) => ({
    border: `1.5px solid ${selected ? C.teal : C.cardBdr}`, borderRadius: 10, overflow: 'hidden', background: '#fff',
    boxShadow: selected ? `0 0 0 3px ${C.greenLight}` : 'none',
  }),
  previewMetaRow2: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '10px 12px 0' },
  previewName2:    { fontSize: 13, fontWeight: 700, color: C.txtPrimary },
  previewSpecs2:   { fontSize: 10.5, color: C.txtMuted, fontWeight: 600, whiteSpace: 'nowrap' },
  previewImgWrap2: { position: 'relative', height: 140, margin: '8px 12px 0', borderRadius: 6, overflow: 'hidden', background: `linear-gradient(135deg, ${C.txtMuted}, ${C.txtSec})` },
  previewArrow2:   (side) => ({
    position: 'absolute', top: '50%', [side]: 6, transform: 'translateY(-50%)',
    width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.txtPrimary, fontSize: 11, cursor: 'pointer',
  }),
  previewDesc2:    { fontSize: 11, color: C.txtSec, lineHeight: 1.4, padding: '8px 12px 12px' },
};

// ─── Stepper ────────────────────────────────────────────────────────────────
export function ListingStepper({ current, steps = STEPS }) {
  return (
    <div style={LS.stepper}>
      {steps.map((step, idx) => {
        const state = step.n < current ? 'done' : step.n === current ? 'current' : 'todo';
        return (
          <React.Fragment key={step.n}>
            <div style={LS.step}>
              <div style={LS.stepCircle(state)}>
                {state === 'done' ? <i className="ti ti-check" aria-hidden="true" /> : step.n}
              </div>
              <div style={LS.stepLabel(state)}>{step.label}</div>
            </div>
            {idx < steps.length - 1 && <div style={LS.stepLine} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Section head (icon + title + note) ────────────────────────────────────
export function SectionHead({ icon, bg, color, title, note, action }) {
  return (
    <div style={LS.secHead}>
      <div style={LS.secIcon(bg, color)}><i className={`ti ${icon}`} aria-hidden="true" /></div>
      <div>
        <p style={LS.secTitle}>{title}</p>
        {note && <p style={LS.secNote}>{note}</p>}
      </div>
      {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
    </div>
  );
}

// ─── Page shell — NavB + PMTopBar + breadcrumb + page head + stepper ───────
// `footer` is rendered as a flex sibling AFTER the scrollable <main> content
// (see listingWizardShared.jsx's own note on why — same layout mechanics,
// unchanged here).
//
// `breadcrumbRoot` (new vs. the Landlord version, which hardcodes "Properties"
// → /landlord-portal/portfolio) lets each PM Portal entry point into this
// wizard point the root crumb at wherever it was launched from — defaults to
// the Properties list, since this slice's entry point is PMUnitDetailPage's
// "List on Marketplace" button. When the Marketing → Listings dashboard is
// built, that entry point should pass breadcrumbRoot={{ label: 'Listings',
// href: '/pm-portal/marketing/listings' }} instead.
export function ListingPageShell({
  propertyName, unitLabel, current, footer, children,
  pageSub = 'Define what is being offered and ensure information for prospects is correct.',
  title = 'Create Listing', steps,
  breadcrumbRoot = { label: 'Properties', href: '/pm-portal/properties' },
}) {
  return (
    <div style={LS.shell}>
      <NavB activeId="listings" />
      <div style={LS.main}>
        <PMTopBar showSearch={false} />

        <main style={LS.content}>
          <div style={LS.bread}>
            <span style={LS.breadLink} onClick={() => window.location.href = breadcrumbRoot.href}>{breadcrumbRoot.label}</span>
            <span style={LS.breadSep}>›</span>
            <span style={LS.breadLink} onClick={() => window.history.back()}>{propertyName}</span>
            <span style={LS.breadSep}>›</span>
            <span style={LS.breadCur}>{unitLabel}</span>
          </div>

          <div style={LS.pageHead}>
            <div>
              <h1 style={{ ...LS.pageTitle, fontFamily: F.headline }}>{title}</h1>
              <p style={LS.pageSub}>{pageSub}</p>
            </div>
            <div style={LS.statusPill}><span style={LS.statusDot} />Listing Status: Draft</div>
          </div>

          <ListingStepper current={current} steps={steps} />

          <div style={LS.sw}>
            {children}
          </div>
        </main>

        {footer}
      </div>
    </div>
  );
}

// ─── Footer — pinned to the bottom of the wizard column ────────────────────
export function ListingFooter({
  current, onBack, onSaveExit, onContinue, continueLabel = 'Continue →', leftContent,
  noteContent, continueDisabled = false,
}) {
  return (
    <div style={LS.footer}>
      <div style={LS.footerLeft}>{leftContent || `Step ${current} of 4`}</div>
      {noteContent && <span style={LS.footerNote}>{noteContent}</span>}
      {onBack && <button style={{ ...LS.btn, ...LS.btnSecondary }} onClick={onBack}>← Back</button>}
      {onSaveExit && <button style={{ ...LS.btn, ...LS.btnSecondary }} onClick={onSaveExit}>Save &amp; Exit</button>}
      {onContinue && (
        <button
          style={{ ...LS.btn, ...LS.btnPrimary, ...(continueDisabled ? LS.btnDisabled : {}) }}
          onClick={continueDisabled ? undefined : onContinue}
          disabled={continueDisabled}
        >
          {continueLabel}
        </button>
      )}
    </div>
  );
}

// ─── Small reusable bits ────────────────────────────────────────────────────
export function AiAssistButton({ onClick, label = 'AI Assist' }) {
  if (!onClick) {
    return (
      <button
        type="button"
        style={{ ...LS.btnAi, opacity: 0.5, cursor: 'not-allowed' }}
        disabled
        title="AI Assist isn't available yet — coming soon"
      >
        <i className="ti ti-sparkles" style={{ fontSize: 11 }} aria-hidden="true" />{label}
      </button>
    );
  }
  return (
    <button type="button" style={LS.btnAi} onClick={onClick}>
      <i className="ti ti-sparkles" style={{ fontSize: 11 }} aria-hidden="true" />{label}
    </button>
  );
}

export function Checkbox({ checked, onChange }) {
  return (
    <div style={LS.checkbox(checked)} onClick={onChange} role="checkbox" aria-checked={checked}>
      {checked && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff' }} aria-hidden="true" />}
    </div>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <div style={LS.toggle(on)} onClick={onChange} role="switch" aria-checked={on}>
      <div style={LS.toggleKnob} />
    </div>
  );
}

export function RadioPillButton({ label, on, onClick }) {
  return (
    <div style={LS.rp(on)} onClick={onClick} role="radio" aria-checked={on}>
      <div style={LS.rdot(on)}>{on && <div style={LS.rdotInner} />}</div>{label}
    </div>
  );
}
