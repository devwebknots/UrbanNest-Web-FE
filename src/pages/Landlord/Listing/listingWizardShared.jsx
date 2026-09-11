// src/pages/Landlord/Listing/listingWizardShared.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Shared shell, stepper, section-head and style tokens for the Landlord
// "Create Listing" wizard (Property → Unit → Promote → Publish).
//
// Styled to match the REAL Landlord Portal pages (LandlordUnitDetailPage,
// LandlordDashboard, etc.) — Inter font + landlordTokens palette — not the
// original wireframe's Noto Serif / navy #002D5B look. Per Session 41
// decision: this wizard lives inside the Landlord Portal (launched from
// LandlordUnitDetailPage's "List on Marketplace" button) and should look
// native next to it rather than like a visually separate module.
//
// Layout/content/fields are unchanged from the frozen wireframes — only the
// color/font skin changed.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import NavF from '../../../components/layout/NavF';
import { C, F } from '../landlordTokens';

export const STEPS = [
  { n: 1, label: 'Property' },
  { n: 2, label: 'Unit' },
  { n: 3, label: 'Promote' },
  { n: 4, label: 'Publish' },
];

// Multi-Unit Listing wizard's own steps (Session 42/43) — same 4-step shape
// as STEPS above ("Unit" → "Listing" to match the List Multiple Units
// Figma's own label), shared between ListMultiStep1_Property.jsx and
// ListMultiUnits.jsx so the two screens can't drift out of sync.
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
  split:    { display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20, alignItems: 'start', paddingBottom: 18 },
  splitCol: { display: 'flex', flexDirection: 'column', gap: 18 },

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

  // Blue is the established accent hue in landlordTokens (nav border, links,
  // Add Service's primary button) — reusing blueLight/blueDark here instead
  // of the wireframe's unrelated indigo keeps this chip in the same family.
  btnAi: { display: 'inline-flex', alignItems: 'center', gap: 5, background: C.blueLight, color: C.blueDark, border: 'none', borderRadius: 14, padding: '4px 10px 4px 8px', fontSize: 11, fontWeight: 700, fontFamily: F.sans, cursor: 'pointer', flexShrink: 0 },

  // No border — matches the borderless pill treatment LandlordUnitDetailPage
  // already uses for its status pills (goodStandingPill, statusPill).
  badgeOverride: { fontSize: 10.5, fontWeight: 700, color: C.greenDark, background: C.greenLight, borderRadius: 12, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 },

  // Amenity grid — 2-up horizontal rows (icon chip + label), flat light
  // card per row. Selection is shown by dimming the whole row rather than
  // recoloring it, so the flat background/icon treatment stays identical
  // to the reference design regardless of selected state.
  // 1×3 layout — each card's footprint (padding/icon/gap) trimmed ~20%
  // from the previous 2-up sizing so three fit comfortably per row.
  amenityGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 },
  // 2-up variant for narrower half-width containers (e.g. Multi-Unit's
  // "Highlights & Amenities" field, which shares a grid2 row with another
  // field) — same tile/icon/label tokens, just 2 columns instead of 3.
  amenityGrid2: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 },
  amenityTile: (selected) => ({
    // Same flat treatment as LandlordUnitDetailPage's amenityItem/
    // serviceItem — bg '#f8f9fb', no border — rather than a new tile
    // style, so this reads as the same design language already used
    // elsewhere in the Landlord Portal. Fixed 49px height (border-box,
    // horizontal padding only) rather than letting the icon+padding
    // determine height, so every tile is exactly the same size.
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10,
    background: '#f8f9fb', borderRadius: 12, height: 49, padding: '0 13px',
    boxSizing: 'border-box', cursor: 'pointer', border: 'none',
    opacity: selected ? 1 : 0.5, transition: 'opacity 0.15s',
  }),
  // Exact bg/color pair LandlordUnitDetailPage's amenityIcon already uses
  // (S.amenityIcon there) — reusing it rather than inventing a new mint.
  amenityIcon: { width: 29, height: 29, borderRadius: 8, background: '#e8f5f0', color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 },
  amenityLabel:{ fontSize: 13, fontWeight: 550, color: C.txtPrimary, lineHeight: 1.3 },
  amenityTileAdd: { background: '#fff', border: `1.5px dashed ${C.cardBdr}`, color: C.txtSec },

  syncRow: { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cardBdr}` },
  checkbox: (on) => ({ width: 16, height: 16, borderRadius: 4, border: on ? 'none' : `1.5px solid ${C.cardBdr}`, background: on ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, cursor: 'pointer' }),
  cktext: { fontSize: 12.5, color: C.txtSec, fontWeight: 500 },

  // Same flat card treatment as the amenity tiles — uniform light
  // background/very light border for both states; the radio dot fill is
  // what actually communicates which one is selected.
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
  // The map itself is a one-off illustrative mockup with no equivalent
  // element elsewhere in the Landlord Portal to align to. The property pin
  // stays a distinct purple so it doesn't get lost among the generic
  // street pins; everything else here uses landlordTokens neutrals rather
  // than arbitrary slate/gray hex.
  mapPin:     (left, top, isProperty) => ({ position: 'absolute', top, left, width: isProperty ? 20 : 18, height: isProperty ? 24 : 22, color: isProperty ? '#7C3AED' : C.txtPrimary, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }),
  mapGoogle:  { position: 'absolute', bottom: 6, left: 8, fontSize: 11, fontWeight: 700, color: C.txtSec },
  mapStreetview: { position: 'absolute', bottom: 8, right: 8, width: 80, height: 48, borderRadius: 4, background: `linear-gradient(135deg, ${C.txtMuted}, ${C.txtSec})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: '#fff', fontSize: 8.5, fontWeight: 700, paddingBottom: 4 },
  // Same flat card look as the amenity tiles (10px corner radius, very
  // light border) — active state shown via icon/text color only, so the
  // card itself stays visually consistent whether active or not.
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

  // "NEW" badge next to a field label (e.g. Floor Plan Name) — reuses the
  // same blue pair as the AI Assist chip rather than a new color.
  lblNew: { background: C.blueLight, color: C.blueDark, borderRadius: 8, padding: '1px 6px', fontSize: 8.5, letterSpacing: 0.04, marginLeft: 6, textTransform: 'none', fontWeight: 700 },

  // Checkbox groups (Utilities Included / Paid by Tenant, etc.)
  ckRow:      { display: 'flex', flexWrap: 'wrap', gap: 16 },
  ckItem:     { display: 'flex', alignItems: 'center', gap: 7 },
  ckGroupLbl: { fontSize: 10.5, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'block' },

  addLink: { fontSize: 11, fontWeight: 700, color: C.blue, cursor: 'pointer', display: 'inline-block' },

  // Photo/video placeholder grids — same muted gradient formula as the map's
  // Street View tile (mapStreetview above), reused here instead of the
  // wireframe's own unrelated slate hex, so every illustrative placeholder
  // in this wizard draws from the same two neutrals.
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

  // Promotion Plan carousel — shows 3 plans at a time (PLAN_VISIBLE in
  // ListingStep3_Promote.jsx) with left/right arrows once there are more
  // than 3 plans (admin-configurable via PROMOTION_PLANS, so the count can
  // grow past 3). gap below (14) must match the "14" baked into planTrack's
  // translateX math and plan's flex-basis math.
  // alignItems: 'center' keeps the arrows vertically centered on the card
  // row rather than pinned to the top (their fixed 32px size means
  // 'stretch' has no effect and they default to the top of the row).
  planCarouselRow: { display: 'flex', alignItems: 'center', gap: 10 },
  // NOTE: overflowX:'hidden' + overflowY:'visible' looks like it should hide
  // horizontal overflow only, but per the CSS Overflow spec, when one axis
  // is non-visible the other computes to 'auto' instead of staying
  // 'visible' — so it still clips. Real fix: give the viewport enough
  // paddingTop to contain the "Most Popular" planTag's -10px offset, so
  // nothing actually overflows the box in the first place; a plain
  // overflow:'hidden' is then safe on both axes.
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

  // Plan-details modal
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
  // Sits as its own flex child at the end of a checkItem row (pushed to the
  // right edge, aligned with the title's top line) rather than stacked
  // below the title/sub text on the left.
  checkFix: { fontSize: 11.5, fontWeight: 700, color: C.red, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 12, marginTop: 1, cursor: 'pointer' },

  // FOOTER
  footer:     { position: 'sticky', bottom: 0, background: '#fff', borderTop: `1px solid ${C.cardBdr}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' },
  footerLeft: { fontSize: 12, color: C.txtMuted, marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: 1 },
  // Step 4's "Total Due Today" block — passed as ListingFooter's leftContent.
  footerTotalLbl: { fontSize: 10.5, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: 0.06 },
  footerTotalVal: { fontSize: 17, fontWeight: 700, color: C.txtPrimary },
  footerNote: { fontSize: 10.5, color: C.txtMuted, marginRight: 10, maxWidth: 220, lineHeight: 1.4 },
  // Standardized button height: 32px — matches LS.btnSm ("+Add Units" etc.)
  // across every Listing-wizard screen (Individual + Multi-Unit).
  btn:        { height: 32, padding: '0 20px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: F.sans, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid transparent', cursor: 'pointer' },
  btnPrimary: { background: C.blue, color: '#fff' },
  btnSecondary: { background: '#fff', color: C.txtPrimary, border: `1px solid ${C.cardBdr}` },
  btnDisabled: { background: C.stdBg, color: C.txtMuted, cursor: 'not-allowed' },

  // ── MULTI-UNIT — "List Multiple Units" screen (Session 42/43) ──────────
  // Common Listing Details card reuses `card`/`grid2`/`field`/`inp` etc.
  // above unchanged. These tokens are additive, only for the Unit Matrix
  // table and the per-unit Edit Specifics side panel.

  // Unit Matrix
  matrixTable: { width: '100%', borderCollapse: 'collapse' },
  matrixTh:    { textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 12px 10px', borderBottom: `1px solid ${C.cardBdr}` },
  matrixTr:    (selected) => ({ background: selected ? C.blueLight : 'transparent' }),
  matrixTd:    { padding: '12px', fontSize: 12.5, color: C.txtPrimary, borderBottom: `1px solid ${C.stdBg}`, verticalAlign: 'middle' },
  matrixUnitName: { fontSize: 13, fontWeight: 700, color: C.txtPrimary, whiteSpace: 'nowrap' },
  matrixUnitSub:  { fontSize: 11, color: C.txtMuted, marginTop: 1 },
  // Readiness pill per row — mirrors the portfolio dashboard's readiness
  // language (Ready / Needs Info / Draft), plus an "editing" state shown
  // whenever this row is the one currently open in the Edit Specifics panel
  // (a transient UI state, not a stored readiness value — see
  // ListMultiUnits.jsx).
  matrixStatus: (state) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700,
    borderRadius: 10, padding: '3px 9px',
    background: state === 'ready' ? C.greenLight : (state === 'needs_info' || state === 'editing') ? C.amberLight : C.stdBg,
    color: state === 'ready' ? C.greenDark : (state === 'needs_info' || state === 'editing') ? C.amber : C.txtMuted,
  }),
  // Currently unused (Unit Matrix rows use inline pencil/trash icon
  // buttons instead) but kept aligned to the 32px/10px button standard
  // in case it's reused later.
  matrixEditBtn: { height: 32, boxSizing: 'border-box', background: '#fff', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '0 12px', fontSize: 11.5, fontWeight: 700, color: C.blue, cursor: 'pointer', fontFamily: F.sans, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' },
  matrixOverrideDot: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: C.blueDark },

  // Per-unit "Edit Unit Specifics" panel — rendered INLINE below the Unit
  // Matrix (per the actual Figma layout), not as a slide-over/modal.
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

  // "Same as common details" override affordance — used at the top of each
  // section inside the Edit Specifics panel (Unit Details / Photos /
  // Fees & Policies) so it's always clear whether a unit is inheriting the
  // Common Listing Details or has its own override.
  overrideRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#f8f9fb', borderRadius: 8, padding: '10px 14px', marginBottom: 14 },
  overrideLbl:   { fontSize: 12, fontWeight: 600, color: C.txtSec, display: 'flex', alignItems: 'center', gap: 7 },
  overrideBadge: (isOverridden) => ({
    fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 8px',
    background: isOverridden ? C.blueLight : C.stdBg,
    color: isOverridden ? C.blueDark : C.txtMuted,
  }),

  // Left "NAVIGATION" rail + main content two-column layout (List Multiple
  // Units screen) — narrower/asymmetric on purpose, unlike LS.split's even
  // 1.55fr/1fr wizard-step layout above.
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

  // Card header row with title + action buttons (Common Listing Details /
  // Unit Matrix section headers) — a lighter-weight alternative to
  // SectionHead (no icon chip) for sections that need buttons up top.
  cardHdrRow:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  cardHdrTitle: { fontSize: 14.5, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  cardHdrNote:  { fontSize: 11.5, color: C.txtMuted, margin: '2px 0 0' },
  cardHdrActions: { display: 'flex', gap: 8, flexShrink: 0 },

  // Small button variants — same family as LS.btn/btnPrimary/btnSecondary
  // above but compact, for section-header actions (Add Bulk Items, Apply
  // Change, Filter, + Add Units) rather than the wizard footer.
  // Standardized button curve: 10px radius across all Listing-wizard
  // buttons (LS.btn, LS.btnSm, matrixEditBtn, planSelect) — was a 16px
  // true pill briefly, then locked to 10px as the single button standard.
  btnSm:            { height: 32, padding: '0 14px', borderRadius: 10, fontSize: 11.5, fontWeight: 700, fontFamily: F.sans, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSmOutline:     { background: '#fff', border: `1px solid ${C.cardBdr}`, color: C.txtSec },
  btnSmGreenOutline:{ background: '#fff', border: `1.5px solid ${C.teal}`, color: C.teal },
  btnSmGreenSolid:  { background: C.teal, border: 'none', color: '#fff' },
  // Solid navy pill — matches the reference "Location" button.
  btnSmNavySolid:   { background: C.navyDark, border: 'none', color: '#fff' },

  // Unit Matrix — inline-editable cell (Rent/Available Date on the row
  // currently open in the Edit Specifics panel below).
  matrixInlineInp: { height: 30, border: `1px solid ${C.cardBdr}`, borderRadius: 6, background: '#fff', fontSize: 12, padding: '0 8px', width: '100%', boxSizing: 'border-box', fontFamily: F.sans, color: C.txtPrimary },

  // Preview All Listings — small live-preview cards at the bottom of the
  // List Multiple Units screen, one per unit, with a lightweight (static —
  // arrows aren't wired to real multi-photo state yet) carousel affordance.
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

const initials = n => (n || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─── Stepper ────────────────────────────────────────────────────────────────
// `steps` is optional (defaults to the Individual-Unit STEPS) so the
// Multi-Unit flow can pass relabeled steps (e.g. "Units" instead of "Unit",
// "Publish All" instead of "Publish") without a parallel component — every
// existing caller that doesn't pass `steps` renders exactly as before.
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

// ─── Page shell — NavF + topbar + breadcrumb + page head + stepper ─────────
// `footer` is rendered as a flex sibling AFTER the scrollable <main> content,
// inside the same column as the topbar — this is what keeps it pinned to
// the bottom of the viewport without overlapping the scrolling area above
// it. Pass a <ListingFooter .../> element here, not as a separate sibling
// of <ListingPageShell> — a footer rendered outside this component's own
// flex column would stack below the full-height shell instead of pinning
// to the bottom of it.
export function ListingPageShell({
  propertyName, unitLabel, current, userLabel = 'Landlord', footer, children,
  pageSub = 'Define what is being offered and ensure information for prospects is correct.',
  title = 'Create Listing', steps,
}) {
  return (
    <div style={LS.shell}>
      <NavF activePage="properties" />
      <div style={LS.main}>
        <header style={LS.topbar}>
          <div style={LS.topTitle}>UrbanNest Landlord</div>
          <div style={LS.topRight}>
            <button style={LS.iconBtn} aria-label="Notifications"><i className="ti ti-bell" aria-hidden="true" /></button>
            <button style={LS.iconBtn} aria-label="Help"><i className="ti ti-help-circle" aria-hidden="true" /></button>
            <div style={LS.avatar}>{initials(userLabel)}</div>
          </div>
        </header>

        <main style={LS.content}>
          <div style={LS.bread}>
            <span style={LS.breadLink} onClick={() => window.location.href = '/landlord-portal/portfolio'}>Properties</span>
            <span style={LS.breadSep}>›</span>
            <span style={LS.breadLink} onClick={() => window.history.back()}>{propertyName}</span>
            <span style={LS.breadSep}>›</span>
            <span style={LS.breadCur}>{unitLabel}</span>
          </div>

          <div style={LS.pageHead}>
            <div>
              <h1 style={LS.pageTitle}>{title}</h1>
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

// ─── Footer — pinned to the bottom of the wizard column (see note above) ───
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
// No `onClick` means AI Assist isn't wired to anything yet for this field —
// render it visibly disabled with a tooltip rather than a button that looks
// clickable but silently does nothing.
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

// Shared Yes/No (or any 2+ value) radio pill button — used by Step 1's
// Listing Type, Step 2's Pet Policy/Parking Fee/Other Fees, and Step 3's
// Showing Method, HOA and Seller Financing toggles. Consumes LS.rp so any
// future sizing/weight change to the pill token applies everywhere at once.
export function RadioPillButton({ label, on, onClick }) {
  return (
    <div style={LS.rp(on)} onClick={onClick} role="radio" aria-checked={on}>
      <div style={LS.rdot(on)}>{on && <div style={LS.rdotInner} />}</div>{label}
    </div>
  );
}
