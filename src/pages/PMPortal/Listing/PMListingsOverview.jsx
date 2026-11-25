// src/pages/PMPortal/Listing/PMListingsOverview.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — PM Portal "Listings Overview" dashboard.
// Nav: Marketing → Listings ('/pm-portal/marketing/listings').
//
// Session 47 — FE-first build (design still in flux; user iterates on this
// directly), then revised same session per the user's own detailed layout
// feedback: filter icon + slide-out panel (using the real CustomDropdown
// component, not native selects — matches the app's Design System §9
// standard), dark-navy buttons instead of teal, redesigned/shorter stat
// tiles, a donut Portfolio Coverage chart beside Listing Performance,
// Needs Attention + Active Listings side by side (Active Listings' Pause
// replaced by a View → Listing Summary modal with a disabled Cancel Ad),
// a 3-column row (Opportunities / Not Ready / Draft Listings placeholder),
// and Ready to List moved to its own row at the very end with a
// lighter-border List button.
//
// Same session, second revision — "See All" overflow pattern: every list/
// table section caps its default row count (CAPS below) and, only once the
// real item count exceeds that cap, shows a "See All (N)" link in the
// section header. Clicking it opens a large scrollable popup (SeeAllModal)
// with the section's full, unpaginated list — sized per content type, not
// one fixed width: ~40% of the screen for card/list sections (Needs
// Attention, Opportunities, Not Ready), ~58% for the wide table sections
// (Active Listings, Ready to List) so rows don't wrap. Each section's
// capped in-page view and its popup share the same render function
// (NeedsAttentionRow / ActiveListingsTable / OpportunitiesList /
// NotReadyList / ReadyToListTable below) so the two can't drift apart.
//
// Same session, third revision — stat tiles ~20% shorter again; search bar
// background white; the Filters control is plain icon+text (no button
// chrome); Opportunities' List button anchored to the bottom-left of its
// card regardless of text height; "Create Listing" no longer double-plussed
// (icon + text, one "+" total). Ready to List rows now have checkboxes
// (selectedReadyIds, shared by the capped view and its "See All" popup) —
// "List Selected" only enables when every checked row belongs to the SAME
// property (mixed-property selections disable it, per the user's explicit
// rule) and, when enabled, navigates to that property's page — the same
// real Multi-Unit entry point (PMUnitSelection.jsx, LST-12) the
// Opportunities cards already use, not a fake bulk submission.
//
// Same session, fourth revision — two fixes plus Draft Listings' first real
// build. "List Selected" bulk-list rule tightened: needs MORE THAN ONE
// checked row (not one), still all from the same property. Opportunities'
// List button re-anchored to the bottom-RIGHT of its card (was bottom-left).
// Draft Listings replaced its "not currently available" placeholder with a
// real matrix (DraftListingsMatrix/DRAFT_LISTINGS/draftGroups below), built
// from a wireframe reviewed and approved by the user first (published as a
// Design canvas Artifact this session) — grouped by property, one row per
// in-progress wizard draft, Type distinguishing Individual vs. Multi-Unit
// bundle drafts, a 4-dot Progress indicator naming the exact step reached,
// and Resume navigating to that property's page. Per the wireframe's own
// width note, it's now its own full-width section (like Ready to List)
// rather than staying in the 3-column row, which is now 2 columns
// (Opportunities / Not Ready).
//
// Same session, fifth revision — Draft Listings repositioned back into the
// 3-column row alongside Opportunities/Not Ready (was full-width after the
// fourth revision); its matrix dropped the Last Edited column to fit the
// narrower 1/3 width (Type/Unit(s)/Progress/Resume, 4 columns instead of 5).
//
// Same session, sixth revision — Opportunities rebuilt from a card list into
// a compact checkbox matrix (Property + Ready X/Y per row, wireframed and
// approved first — Design canvas Artifact), with a single "List" button
// moved into the section header instead of one per card; it enables only
// when exactly ONE property is checked (still only one real navigation
// target — no bulk-list backend endpoint exists, LST-1). The freed width
// goes to Draft Listings: the row is now unequal thirds (Opportunities
// ~300px, Not Ready ~330px, Draft Listings fills the remainder, ~45%)
// instead of three equal columns.
//
// Same session, seventh revision — LST-19 real backend wiring. Every "live"
// section (stat tiles, Portfolio Coverage, Ready to List, Opportunities,
// Active Listings, Not Ready, and Draft Listings — all 7, not just the
// original "core 5" LST-19 scoped, per the user's explicit request to cover
// everything this session) now fetches from a single new read-only rollup,
// GET /listings/pm-overview/ (getPMListingsOverview in listingApi.js — see
// that endpoint's own docstring in the backend, listings/views.py, for the
// full response-shape/design writeup). Per the user's explicit instruction,
// each of those sections falls back INDEPENDENTLY to this file's own
// MOCK_UNITS/MOCK_PROPERTIES/DRAFT_LISTINGS content, wrapped in the same
// <SampleCard>/<SampleTag> watermark already used elsewhere in this file,
// whenever the real backend has zero rows for that specific category — not
// only when the whole dataset is empty. A sample-sourced section's primary
// action (List/Resume/View →) is also swapped to a disabled <DeadEndButton>
// (same convention as Cancel Ad / the stubbed Not-Ready cards), since a
// mock property/unit id has no real record behind it to navigate to.
//
// Known trade-off, called out rather than silently decided: this means a
// section can show sample content even while OTHER sections on the same
// page are showing real data (e.g. real Active Listings alongside a sample
// Opportunities card, if no real property currently has 2+ ready units) —
// per-section "zero real rows" and "genuinely nothing to show" aren't
// distinguished. See claude/UrbanNest_ActiveBacklog.md's LST-19 entry for
// the full writeup, including the other known gaps this revision leaves
// open (LST-22's draft-step heuristic, the hardcoded "Expiring (30d)" stat,
// and the T-2 seed-script gap that means every unit's readiness reads null
// — triggering this same sample fallback — until it's run).
//
// See claude/Listings_Overview_Design_Review.md §7 for the locked
// live-vs-sample convention this file follows:
//   - "Live" sections (stat tiles minus trend%, Portfolio Coverage donut,
//     Ready to List, Property Listing Opportunities, Active Listings core
//     columns, Not Ready cards for real rule categories, the Expiring
//     Needs-Attention card, and Draft Listings) now render real backend
//     data when available, falling back to realistic mock data (watermarked
//     sample, per above) when the backend has none yet.
//   - "Sample" sections (Listing Performance, stat-tile trend/sample tag,
//     Cancel Ad, the stubbed-rule Not Ready cards, 3 of 4 Needs Attention
//     cards) stay exactly as they were — full-color with a "Sample Data"
//     watermark (<SampleCard>/<SampleTag>) and dead-end actions via
//     <DeadEndButton> — no backend exists (or ever will, for the 4 stubbed
//     rule categories — see the backend docstring) for these.
//
// Same session, eighth revision — two fixes prompted by the user's first
// live click-through against a real logged-in Org PM account (testuser35):
// (1) Portfolio Coverage's donut total could silently exceed the sum of its
// 4 segments, because a unit whose readiness engine has never run comes
// back with readiness: null — none of Active/Ready Pipeline/Blocked/
// Ineligible match null. Added a 5th "Not Evaluated" segment (computeCoverage)
// so the math always reconciles instead of looking broken. (2) The user
// asked for a countdown ("ticking clock") on a listing's remaining days,
// based on its promotion plan. Traced this to a real, already-existing
// backend field — Listing.expires_at, written at publish time in
// listing_publish() as now() + plan.duration_days — that pm-overview simply
// wasn't returning yet. Extended the endpoint to include expiresAt and
// promotionPlan per unit (see the backend docstring), added CountdownBadge/
// daysUntil/countdownConfig (danger/amber/blue three-tier urgency banding,
// same status-color convention as everything else here) and wired it into
// both the Active Listings table (new "Expires" column) and the Listing
// Summary modal (new "Time Remaining" row). As a direct side effect, the
// "Expiring (30d)" stat tile is no longer the hardcoded `2` flagged as a
// known gap in the seventh revision above — it's now a real filter over the
// same expiresAt data. The rest of the Listing Summary modal (deposit,
// description, amenities, photo count, lead contact, showing settings,
// compliance checklist) still has no backend source at all and stays
// illustrative — only Promotion Plan/Time Remaining prefer real data now.
//
// Session 2026-11-25 — DESIGN SYSTEM v2 REDESIGN (layout from Downloads/image 146.png; every style is ours).
// Same data / fallbacks / rules / actions as the revisions above — only the presentation changed:
//   PMPageShell (NavPM + PM top bar) · wave backdrop · Breadcrumb · T2.heroHeading + T2.lead header,
//   Export Inventory (soft, unavailable) + Create Listing (brand) · list toolbar (UI2.toolbar: search ·
//   Options ▸ Property / Status / Type / Channel / Portfolio — replaces the slide-out filter panel, same filters)
//   HeroStats (Active · Ready to List · Not Ready · Draft · Expiring (30d))
//   panel │ Portfolio Coverage (SegmentDonut, blue ramp) │ Listing Performance (StatGroup + LineChart)
//   panel │ Needs Attention (ListRow) │ Active Listings (DataTable)
//   panel │ Opportunities (DataTable + Checkbox) │ Not Ready (ListRow) │ Draft Listings (DataTable)
//   Ready to List (DataTable + Checkbox, List Selected) · PageFooter
//   Pop-ups = ui/Modal (Listing Summary with ModalSections · every "See All" list).
//   Sample-sourced sections carry the v2 "Sample" pill (UI2.pill, title explains) instead of the amber tag;
//   unavailable actions = UI2.btnOff + a title tooltip (same explanations as before).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PMPageShell, Breadcrumb, PageFooter, ImageBackdrop } from '../../../components/layout';
import {
  HeroStats, StatGroup, DataTable, ListRow, EmptyState, TextLink, FilterMenu, ActionTray, Checkbox,
  LineChart, SegmentDonut, rampColor, segmentMidpoints, Modal, ModalSection,
} from '../../../components/ui';
import {
  C2, TONES2, ACCENT2, STATUS2, accentTone, FS2, SP2, SZ2, LAYOUT2, T2, UI2, pad,
} from '../../../constants';
import { getPMListingsOverview } from '../../Landlord/Listing/listingApi';
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';   // soft blue wave lines (same art as Approvals / Create Listing)

// ── Readiness → status tone (UI2.statusPill: dot + coloured word). No yellow. ──
const READINESS_CFG = {
  LIST_READY:          { label: 'Ready',        tone: TONES2.success },
  READY_WITH_WARNINGS: { label: 'Ready (warn)', tone: accentTone(ACCENT2.violet) },
  NOT_READY:           { label: 'Not Ready',    tone: TONES2.error },
  NOT_ELIGIBLE:        { label: 'Not Eligible', tone: TONES2.neutral },
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — see file header. Shape mirrors what Engine 1's readiness
// endpoint + Listing/PropertyListing fields already provide.
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PROPERTIES = [
  { id: 101, name: 'Willowbrook Apartments', totalUnits: 6 },
  { id: 102, name: 'Cedar Heights',          totalUnits: 4 },
  { id: 103, name: 'Riverside Commons',      totalUnits: 5 },
  { id: 104, name: 'Maple Court Duplex',     totalUnits: 2 },
];

// expiresAt/promotionPlan: added for the countdown feature (see
// CountdownBadge below) — only meaningful for the 4 rows whose readiness is
// 'ACTIVE' (a real active listing has a real plan + expiry; everything else
// is null, same as the real backend only sets these when active_listing
// exists). Two of the four (ids 6, 15) are deliberately inside the 30-day
// window so the "Expiring (30d)" stat tile still reads 2 against sample
// data, matching what it showed before this was wired to something real.
const MOCK_UNITS = [
  { id: 1, unit: '101', propertyId: 101, bedBath: '2bd / 1ba', sqft: 850,  rent: 1650, readiness: 'LIST_READY',          status: 'ACTIVE',  channel: 'Marketplace',  publishedDate: '2026-08-02', availableDate: '2026-08-05', notReadyReason: null, expiresAt: null,         promotionPlan: null },
  { id: 2, unit: '102', propertyId: 101, bedBath: '2bd / 1ba', sqft: 860,  rent: 1675, readiness: 'LIST_READY',          status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: '2026-10-01', notReadyReason: null, expiresAt: null,         promotionPlan: null },
  { id: 3, unit: '103', propertyId: 101, bedBath: '1bd / 1ba', sqft: 620,  rent: 1250, readiness: 'READY_WITH_WARNINGS', status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: '2026-10-15', notReadyReason: 'Minimum 5 Media Assets — only 3 photos uploaded', expiresAt: null, promotionPlan: null },
  { id: 4, unit: '104', propertyId: 101, bedBath: '2bd / 2ba', sqft: 910,  rent: 1800, readiness: 'NOT_READY',           status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: null,         notReadyReason: 'STUB:Maintenance — Active Emergency Work Order Gate', expiresAt: null, promotionPlan: null },
  { id: 5, unit: '105', propertyId: 101, bedBath: '1bd / 1ba', sqft: 610,  rent: 1225, readiness: 'LIST_READY',          status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: '2026-09-28', notReadyReason: null, expiresAt: null,         promotionPlan: null },
  { id: 6, unit: '106', propertyId: 101, bedBath: '2bd / 1ba', sqft: 845,  rent: 1660, readiness: 'ACTIVE',              status: 'ACTIVE',  channel: 'Zillow',       publishedDate: '2026-07-20', availableDate: '2026-07-22', notReadyReason: null, expiresAt: '2026-10-17', promotionPlan: 'Standard Boost — 30 days' },

  { id: 7, unit: 'A',   propertyId: 102, bedBath: '3bd / 2ba', sqft: 1200, rent: 2450, readiness: 'LIST_READY',          status: 'ACTIVE',  channel: 'Marketplace',  publishedDate: '2026-06-15', availableDate: '2026-06-18', notReadyReason: null, expiresAt: null,         promotionPlan: null },
  { id: 8, unit: 'B',   propertyId: 102, bedBath: '3bd / 2ba', sqft: 1210, rent: 2475, readiness: 'LIST_READY',          status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: '2026-09-25', notReadyReason: null, expiresAt: null,         promotionPlan: null },
  { id: 9, unit: 'C',   propertyId: 102, bedBath: '2bd / 1ba', sqft: 900,  rent: 1950, readiness: 'NOT_READY',           status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: null,         notReadyReason: 'STUB:Make-Ready — Turnover checklist incomplete', expiresAt: null, promotionPlan: null },
  { id: 10, unit: 'D',  propertyId: 102, bedBath: '2bd / 1ba', sqft: 895,  rent: 1925, readiness: 'READY_WITH_WARNINGS', status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: '2026-10-10', notReadyReason: 'Minimum 5 Media Assets — only 2 photos uploaded', expiresAt: null, promotionPlan: null },

  { id: 11, unit: '1',  propertyId: 103, bedBath: '1bd / 1ba', sqft: 590,  rent: 1150, readiness: 'ACTIVE',              status: 'ACTIVE',  channel: 'Apartments.com', publishedDate: '2026-05-30', availableDate: '2026-06-01', notReadyReason: null, expiresAt: '2026-11-06', promotionPlan: 'Premium Placement — 60 days' },
  { id: 12, unit: '2',  propertyId: 103, bedBath: '1bd / 1ba', sqft: 595,  rent: 1175, readiness: 'NOT_ELIGIBLE',        status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: null,         notReadyReason: 'STUB:Inspection — No inspection record on file', expiresAt: null, promotionPlan: null },
  { id: 13, unit: '3',  propertyId: 103, bedBath: '2bd / 2ba', sqft: 980,  rent: 1875, readiness: 'LIST_READY',          status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: '2026-09-30', notReadyReason: null, expiresAt: null,         promotionPlan: null },
  { id: 14, unit: '4',  propertyId: 103, bedBath: '2bd / 2ba', sqft: 975,  rent: 1850, readiness: 'NOT_READY',           status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: null,         notReadyReason: 'STUB:Compliance — Lead paint disclosure missing', expiresAt: null, promotionPlan: null },
  { id: 15, unit: '5',  propertyId: 103, bedBath: '3bd / 2ba', sqft: 1150, rent: 2200, readiness: 'ACTIVE',              status: 'ACTIVE',  channel: 'Marketplace',  publishedDate: '2026-08-28', availableDate: '2026-08-30', notReadyReason: null, expiresAt: '2026-09-27', promotionPlan: 'Standard Boost — 30 days' },

  { id: 16, unit: '1',  propertyId: 104, bedBath: '2bd / 1ba', sqft: 800,  rent: 1550, readiness: 'LIST_READY',          status: 'DRAFT',   channel: null,           publishedDate: null,         availableDate: '2026-10-05', notReadyReason: null, expiresAt: null,         promotionPlan: null },
  { id: 17, unit: '2',  propertyId: 104, bedBath: '2bd / 1ba', sqft: 805,  rent: 1575, readiness: 'ACTIVE',              status: 'ACTIVE',  channel: 'Zillow',       publishedDate: '2026-09-01', availableDate: '2026-09-03', notReadyReason: null, expiresAt: '2026-11-21', promotionPlan: 'Quick List — 45 days' },
];

const CHANNELS = ['Marketplace', 'Zillow', 'Apartments.com'];

// How many items each section shows before offering "See All". A section's
// "See All" link only renders when its real count exceeds its cap — for a
// small portfolio nothing changes visually from a page with no cap at all.
const CAPS = { needsAttention: 3, activeListings: 5, opportunities: 4, notReady: 4, draftListings: 3, readyToList: 5 };

// Draft Listings — approved matrix wireframe. One row per in-progress wizard
// draft, grouped by property. Wizard step numbering: 1 Property & Unit,
// 2 Listing Details, 3 Promote, 4 Compliance & Publish (see LST-22).
const DRAFT_LISTINGS = [
  { id: 'd1', propertyId: 101, type: 'individual', unitLabel: 'Unit 102',   step: 2, stepLabel: 'Listing Details',          lastEdited: '2026-09-19' },
  { id: 'd2', propertyId: 101, type: 'individual', unitLabel: 'Unit 103',   step: 1, stepLabel: 'Property & Unit',          lastEdited: '2026-09-17' },
  { id: 'd3', propertyId: 102, type: 'multi',      unitLabel: 'Units B, D', step: 3, stepLabel: 'Promote',                  lastEdited: '2026-09-21' },
  { id: 'd4', propertyId: 103, type: 'individual', unitLabel: 'Unit 3',     step: 4, stepLabel: 'Compliance & Publish',     lastEdited: '2026-09-21' },
  { id: 'd5', propertyId: 104, type: 'individual', unitLabel: 'Unit 1',     step: 1, stepLabel: 'Property & Unit',          lastEdited: '2026-09-22' },
];

// Needs Attention feed — one live item (expiring soon, derived from real
// data) + sample items standing in for subsystems (pricing, seeker activity,
// readiness-change alerts) that don't exist in the backend yet.
const NEEDS_ATTENTION_ITEMS = [
  { key: 'expiring', live: true,  icon: 'ti-clock-hour-4', text: 'Willowbrook · Unit 106 — expiring in 12 days', actionLabel: 'Extend', actionIcon: 'ti-calendar-plus', tooltip: 'No renewal/extend flow exists yet — no status-change endpoint is built. See design review §3.3.' },
  { key: 'na1',      live: false, icon: 'ti-tag',          text: 'Cedar Heights · Unit A — pricing override mismatch', actionLabel: 'View', actionIcon: 'ti-eye', tooltip: "This feed item describes a subsystem that doesn't exist in the backend yet. Illustrative only." },
  { key: 'na2',      live: false, icon: 'ti-eye-off',      text: 'Riverside Commons · Unit 1 — low seeker activity', actionLabel: 'View', actionIcon: 'ti-eye', tooltip: "This feed item describes a subsystem that doesn't exist in the backend yet. Illustrative only." },
  { key: 'na3',      live: false, icon: 'ti-refresh',      text: 'Maple Court · Unit 1 — readiness score changed', actionLabel: 'View', actionIcon: 'ti-eye', tooltip: "This feed item describes a subsystem that doesn't exist in the backend yet. Illustrative only." },
];

// ─────────────────────────────────────────────────────────────────────────────
// LST-19 — pure derivation helpers (unchanged), shared by real backend data and
// the MOCK_* fallback so the two can never drift apart.
// ─────────────────────────────────────────────────────────────────────────────
// hasInProgressListing excludes a unit already mid-wizard from Ready to List
// (Session 48, found live — see the revision notes above).
const isReadyToListUnit = (u) => u.status === 'DRAFT' && !u.hasInProgressListing && (u.readiness === 'LIST_READY' || u.readiness === 'READY_WITH_WARNINGS');
const isActiveListingUnit = (u) => u.readiness === 'ACTIVE';
const isNotReadyUnit = (u) => u.readiness === 'NOT_READY' || u.readiness === 'NOT_ELIGIBLE';

function computeStats(units) {
  return {
    active: units.filter(u => u.readiness === 'ACTIVE').length,
    ready: units.filter(isReadyToListUnit).length,
    notReady: units.filter(isNotReadyUnit).length,
    draft: units.filter(u => u.status === 'DRAFT').length,
    // Derived from the same real expiresAt the countdown uses — only active
    // units within 30 days of Listing.expires_at.
    expiring: units.filter(u => {
      const days = daysUntil(u.expiresAt);
      return days !== null && days >= 0 && days <= 30;
    }).length,
  };
}

function computeCoverage(units) {
  return {
    total: units.length,
    active: units.filter(u => u.readiness === 'ACTIVE').length,
    pipeline: units.filter(isReadyToListUnit).length,
    blocked: units.filter(u => u.readiness === 'NOT_READY').length,
    ineligible: units.filter(u => u.readiness === 'NOT_ELIGIBLE').length,
    // readiness: null (rules engine never ran on the unit) — keeps the segments
    // summing to `total` (Session 48, found live).
    notEvaluated: units.filter(u => u.readiness == null).length,
  };
}

function computeOpportunities(units, properties) {
  return properties.map(p => {
    const pUnits = units.filter(u => u.propertyId === p.id);
    const ready = pUnits.filter(isReadyToListUnit);
    const listed = pUnits.filter(isActiveListingUnit);
    return { ...p, unitCount: pUnits.length, readyCount: ready.length, listedCount: listed.length, readyUnitIds: ready.map(u => u.id) };
  }).filter(p => p.readyCount >= 2);
}

function filterUnitsBy(units, propertyNameFn, { propertyFilter, channelFilter, statusFilter, searchText }) {
  return units.filter(u => {
    if (propertyFilter && String(u.propertyId) !== propertyFilter) return false;
    if (channelFilter && u.channel !== channelFilter) return false;
    if (statusFilter === 'DRAFT' && u.status !== 'DRAFT') return false;
    if (statusFilter === 'ACTIVE' && u.status !== 'ACTIVE') return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!(`${propertyNameFn(u.propertyId)} ${u.unit}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });
}

function groupDraftsByProperty(drafts, properties) {
  return properties
    .map(p => ({ id: p.id, name: p.name, drafts: drafts.filter(d => d.propertyId === p.id) }))
    .filter(g => g.drafts.length > 0);
}

// Session 49 fix — Resume lands back inside the exact wizard step (router state
// carries listingId / propertyListingId); falls back to the property page.
function _resumeTarget(d) {
  if (d.type === 'individual' && d.listingId != null && d.unitId != null) {
    return {
      path: `/pm-portal/properties/${d.propertyId}/units/${d.unitId}/list/step-${d.step}`,
      state: { listingId: d.listingId },
    };
  }
  if (d.type === 'multi' && d.propertyListingId != null) {
    return {
      path: `/pm-portal/properties/${d.propertyId}/list-multi/step-${d.step}`,
      state: { propertyListingId: d.propertyListingId },
    };
  }
  return { path: `/pm-portal/properties/${d.propertyId}`, state: undefined };
}

// ── Formatting (unchanged) ──────────────────────────────────────────────────
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}
// Session 51 — null-safe (application_fee is a genuinely nullable DB field).
function fmtRent(r) {
  return r != null ? `$${Number(r).toLocaleString()}` : '—';
}

// ── Promotion plan countdown ("ticking clock") — expiresAt = Listing.expires_at ──
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr); then.setHours(0, 0, 0, 0);
  const today = new Date();       today.setHours(0, 0, 0, 0);
  return Math.round((then - today) / 86400000);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// Same three-tier urgency banding as before (expired / ≤3 days = red, ≤7 days = violet — was amber, no yellow
// in v2 — otherwise blue). A null day count (no active listing / no plan yet) renders as a plain dash.
function countdownConfig(days) {
  if (days === null) return null;
  if (days < 0)   return { tone: TONES2.error, label: `Expired ${Math.abs(days)}d ago` };
  if (days === 0) return { tone: TONES2.error, label: 'Expires today' };
  if (days <= 3)  return { tone: TONES2.error, label: `${days}d left` };
  if (days <= 7)  return { tone: accentTone(ACCENT2.violet), label: `${days}d left` };
  return { tone: TONES2.primary, label: `${days}d left` };
}

// ── Page-specific layout only — every look comes from UI2 / T2 / the v2 components ──
const S = {
  // header
  headBlock: UI2.pageHead.block,   // header block spacing — shared with PM Approvals (UI2.pageHead)
  toolsGap:  UI2.pageHead.next,
  statsGap:  UI2.pageHead.stats,
  headRow:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP2.lg, flexWrap: 'wrap' },
  head:      { ...UI2.stack(SP2.xs), minWidth: 0 },
  title:     { ...T2.heroHeading, margin: 0 },          // = Portfolio / Approvals page heading
  sub:       { ...T2.lead, margin: 0 },                  // = Portfolio / Approvals subtitle
  headActions: { ...UI2.row(SP2.sm), flexWrap: 'wrap' },
  // toolbar row under the header (search · Options ▸ filters) — UI2.toolbar, left-aligned like the design
  toolsRow:  { ...UI2.toolbar.tools, marginLeft: 0, justifyContent: 'flex-start' },
  searchIcon: UI2.toolbar.searchIcon,
  input:     UI2.searchInput,
  menuWrap:  UI2.toolbar.menuWrap,
  toolBtn:   UI2.toolbar.button,
  // stats row (HeroStats) + sample pill
  statsRow:  { ...UI2.rowBetween(SP2.md), alignItems: 'flex-start', flexWrap: 'wrap' },
  // panels: one card, divided columns
  panel:     { ...UI2.card },
  col:       { ...UI2.stack(SP2.lg), minWidth: 0 },
  colTop:    { ...UI2.rowBetween(SP2.sm), minHeight: SZ2.control.sm, flexWrap: 'wrap' },
  colTitle:  { ...UI2.cardTitle, ...UI2.truncate },
  colActions:{ ...UI2.row(SP2.md), flexShrink: 0 },
  rangePill: { ...UI2.pill(TONES2.neutral), color: C2.textSecondary, background: C2.surfaceMuted },   // = Approvals trend range
  // Portfolio Coverage
  coverage:  { display: 'flex', alignItems: 'center', gap: SP2.xl, flexWrap: 'wrap' },
  legend:    { ...UI2.stack(SP2.sm), flex: 1, minWidth: SZ2.searchSm / 2 },
  legendDot: (color) => ({ ...UI2.dot(color) }),
  // Listing Performance
  chartBox:  { position: 'relative', height: SZ2.chart },
  note:      { ...UI2.text.meta },
  // rows / cells
  rowIcon:   (tone) => UI2.iconBox(SZ2.icon.md, tone),
  smallBtn:  { ...UI2.btn.soft, ...UI2.btnSm },
  rowBtn:    { ...UI2.btn.brand, ...UI2.btnSmStd },      // = Listings row action (List / Resume)
  dash:      { color: C2.textMuted },
  dots:      { ...UI2.row(SP2.xxs) },
  dot:       (on) => ({ ...UI2.dot(on ? C2.primary : C2.border) }),
  group:     { ...UI2.text.titleLg, color: C2.primary },
  groupHead: { padding: pad(SP2.sm, SP2.xs, 0) },       // property heading above its drafts — same side inset as UI2.listRow (SP2.xs), so it lines up with the row icons
  metaLine:  { display: 'inline-flex', alignItems: 'center', gap: SP2.sm, flexWrap: 'wrap' },   // description · Sample pill on one line
  stepLine:  { display: 'inline-flex', alignItems: 'center', gap: SP2.sm, flexWrap: 'wrap' },   // ●●○○ Step 2 of 4 — …
  // Ready to List — open section (= Approvals "All Pending Approvals")
  section:   { ...UI2.stack(LAYOUT2.sectionGap), minWidth: 0, paddingTop: SP2.sm },
  secHead:   { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap' },
  secTitleRow: { ...UI2.row(SP2.sm), minWidth: 0 },
  secTitle:  { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  // modal bits
  info:      (first) => UI2.kvRow(first),
  infoVal:   { ...UI2.kvVal, wordBreak: 'break-word' },
  chips:     { display: 'flex', flexWrap: 'wrap', gap: SP2.xs, marginTop: SP2.sm },
  check:     { ...UI2.checkBadge },
  checkRow:  (first) => ({ ...UI2.kvRow(first), justifyContent: 'flex-start', gap: SP2.sm }),
  desc:      { ...UI2.text.label, marginTop: SP2.sm },
};

// ── Small shared bits ───────────────────────────────────────────────────────
const Dash = () => <span style={S.dash}>—</span>;

// The v2 "Sample" marker (same pill as the Landlord unit page) — the title explains why
function SamplePill({ title = 'Sample data — no real backend data for this yet.' }) {
  return <span style={UI2.pill()} title={title}>Sample</span>;
}

// Unavailable action — soft button, greyed (UI2.btnOff), with the reason as its tooltip.
// onArt: the button sits on the page artwork (header over the wave backdrop) → white button with grey text
// (UI2.btn.light + UI2.btnOffOnArt) so it stays visible instead of fading into the art.
function OffButton({ label, icon, tooltip, brand = false, small = true, onArt = false }) {
  const base = brand ? { ...UI2.btn.brand, ...UI2.btnSmStd } : (small ? S.smallBtn : UI2.btn.soft);
  const look = onArt ? { ...UI2.btn.light, ...UI2.btnOffOnArt } : { ...base, ...UI2.btnOff };
  return (
    <span title={tooltip} style={{ display: 'inline-flex' }}>
      <button type="button" disabled style={look}>
        {icon && <i className={`ti ${icon}`} style={UI2.btnIcon} aria-hidden="true" />}{label}
      </button>
    </span>
  );
}

// Row action for narrow list columns — the shared small round tinted icon button (UI2.btn.rowIcon, same as the
// Approvals table / unit page eye). The label becomes its tooltip; off = grey + disabled, tooltip says why.
function RowAction({ icon, label, tooltip, onClick, tone = TONES2.primary, on = true }) {
  return (
    <span title={on ? label : `${label} — ${tooltip}`} style={{ display: 'inline-flex' }}>
      <button type="button" style={UI2.btn.rowIcon(tone, on)} disabled={!on} onClick={on ? onClick : undefined} aria-label={label}>
        <i className={`ti ${icon}`} aria-hidden="true" />
      </button>
    </span>
  );
}

function ReadinessBadge({ code }) {
  const cfg = READINESS_CFG[code] || READINESS_CFG.NOT_ELIGIBLE;
  return <span style={UI2.statusPill(cfg.tone)}><span style={UI2.statusDot(cfg.tone)} />{cfg.label}</span>;
}

function CountdownBadge({ expiresAt }) {
  const cfg = countdownConfig(daysUntil(expiresAt));
  if (!cfg) return <Dash />;
  return (
    <span style={UI2.statusPill(cfg.tone)}>
      <i className="ti ti-clock" style={UI2.btnIcon} aria-hidden="true" />{cfg.label}
    </span>
  );
}

// Column header inside a panel: icon · title (+ sample pill) │ actions — same pattern as the Approvals panel
function ColHead({ icon, title, sample, sampleTitle, children }) {
  return (
    <div style={S.colTop}>
      <div style={UI2.colHead}>
        <i className={`ti ${icon}`} style={UI2.colIcon} aria-hidden="true" />
        <span style={S.colTitle}>{title}</span>
        {sample && <SamplePill title={sampleTitle} />}
      </div>
      {children && <div style={S.colActions}>{children}</div>}
    </div>
  );
}

const SeeAll = ({ count, onClick }) => <TextLink size="xs" onClick={onClick}>See All ({count})</TextLink>;

// ── Listing Summary pop-up (consolidates Steps 1–4) ─────────────────────────
function buildSummaryDetails(u) {
  // Promotion Plan / Time Remaining / deposit / application fee prefer real values (Session 51 fix — the real
  // per-Listing ListingRentalTerms / ListingSaleTerms read). Description, amenities, photo count, lead contact,
  // showing settings, listing id and compliance have no backend source yet and stay illustrative.
  const promotionPlan = u.promotionPlan || 'Standard Boost — 30 days';
  const expiresAt = u.expiresAt || (u.publishedDate ? addDays(u.publishedDate, 30) : null);
  return {
    deposit: u.securityDeposit != null ? u.securityDeposit : null,
    applicationFee: u.applicationFee != null ? u.applicationFee : null,
    description: 'Bright, well-maintained unit close to transit and shopping. Freshly painted with updated fixtures throughout.',
    amenities: ['In-unit Laundry', 'Central AC', 'Parking Included', 'Pet Friendly'],
    photoCount: 6,
    promotionPlan,
    expiresAt,
    leadContact: 'Front Desk · leasing@urbannest.com',
    showingSettings: 'By appointment only',
    listingId: `LST-${1000 + u.id}`,
    compliance: [
      { label: 'Minimum photos (5)', passed: true },
      { label: 'Security deposit set', passed: true },
      { label: 'Rent amount set', passed: true },
      { label: 'Lease terms configured', passed: true },
    ],
  };
}

function InfoRows({ rows }) {
  return rows.filter(([, v]) => v || v === 0).map(([label, value], i) => (
    <div key={label} style={S.info(i === 0)}>
      <span>{label}</span>
      <span style={S.infoVal}>{value}</span>
    </div>
  ));
}

function ListingSummaryModal({ unit, propertyName, onClose }) {
  if (!unit) return null;
  const d = buildSummaryDetails(unit);
  return (
    <Modal
      size="lg"
      eyebrow="Active listing"
      title={`${propertyName} · Unit ${unit.unit}`}
      subtitle={`${d.listingId} · Published ${fmtDate(unit.publishedDate)}`}
      onClose={onClose}
      footer={(
        <>
          <OffButton small={false} label="Cancel Ad" icon="ti-ban" tooltip="No listing cancel/status-change endpoint exists in the backend yet — see design review §3.3." />
          <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={onClose}>Close</button>
        </>
      )}
    >
      <ModalSection icon="ti-building" title="Step 1 — Property & Unit">
        <InfoRows rows={[
          ['Property', propertyName],
          ['Unit', unit.unit],
          ['Bed / Bath', unit.bedBath],
          ['Square Footage', unit.sqft != null ? `${unit.sqft} sqft` : null],
        ]} />
      </ModalSection>
      <ModalSection icon="ti-file-description" title="Step 2 — Listing Details">
        <InfoRows rows={[
          ['Rent', fmtRent(unit.rent)],
          ['Security Deposit', fmtRent(d.deposit)],
          ['Application Fee', fmtRent(d.applicationFee)],
          ['Available From', fmtDate(unit.availableDate)],
          ['Photos', `${d.photoCount} uploaded`],
        ]} />
        <div style={S.desc}>{d.description}</div>
        <div style={S.chips}>{d.amenities.map(a => <span key={a} style={UI2.pill(TONES2.neutral)}>{a}</span>)}</div>
      </ModalSection>
      <ModalSection icon="ti-speakerphone" title="Step 3 — Promote">
        <InfoRows rows={[
          ['Distribution Channel', unit.channel],
          ['Promotion Plan', d.promotionPlan],
          ['Time Remaining', d.expiresAt ? <CountdownBadge expiresAt={d.expiresAt} /> : null],
          ['Lead Contact', d.leadContact],
          ['Showing Settings', d.showingSettings],
        ]} />
      </ModalSection>
      <ModalSection icon="ti-shield-check" title="Step 4 — Compliance & Publish">
        {d.compliance.map((c, i) => (
          <div key={c.label} style={S.checkRow(i === 0)}>
            <span style={S.check}><i className="ti ti-check" aria-hidden="true" /></span>
            <span style={{ color: C2.textPrimary }}>{c.label}</span>
          </div>
        ))}
      </ModalSection>
    </Modal>
  );
}

// ── "See All" pop-up — the full, unpaginated list of one section (standard v2 Modal) ──
function SeeAllModal({ open, onClose, title, icon, count, children }) {
  if (!open) return null;
  return (
    <Modal
      size="lg" media={false} icon={icon}
      title={`${title}${typeof count === 'number' ? ` (${count})` : ''}`}
      onClose={onClose}
      footer={<button type="button" className="un2-btn" style={UI2.btn.brand} onClick={onClose}>Done</button>}
    >
      {children}
    </Modal>
  );
}

// ── Section-content renderers — shared by the capped in-page view and the "See All" pop-up ──
function NeedsAttentionList({ items }) {
  return items.map(item => {
    const [title, meta] = item.text.split(' — ');
    return (
      <ListRow wrap
        key={item.key}
        leading={<span style={S.rowIcon(item.live ? TONES2.error : TONES2.neutral)}><i className={`ti ${item.icon}`} aria-hidden="true" /></span>}
        title={title}
        // Sample pill rides on the description line → the right side is only the small round button,
        // so the title keeps the width to stay on one line
        meta={item.live ? meta : <span style={S.metaLine}>{meta}<SamplePill title="This feed item describes a subsystem that doesn't exist in the backend yet." /></span>}
        trailing={<RowAction on={false} icon={item.actionIcon} label={item.actionLabel} tooltip={item.tooltip} />}
      />
    );
  });
}

function ActiveListingsTable({ rows, propertyName, onView }) {
  return (
    <DataTable
      columns={[
        // Property + Unit in ONE column ("LL01 · Unit 013") so the whole table fits its panel column — no sideways scroll
        { key: 'property', label: 'Property · Unit', type: 'primary', width: 1.3, render: u => `${propertyName(u.propertyId)} · Unit ${u.unit}` },
        { key: 'published', label: 'Published', type: 'secondary', fit: true, render: u => fmtDate(u.publishedDate) },
        { key: 'available', label: 'Available', type: 'secondary', fit: true, render: u => fmtDate(u.availableDate) },
        { key: 'channel', label: 'Channel', type: 'text', render: u => u.channel || <Dash /> },
        { key: 'expires', label: 'Expires', type: 'status', fit: true, render: u => <CountdownBadge expiresAt={u.expiresAt} /> },
        { key: 'view', label: 'Actions', fit: true, render: u => <RowAction icon="ti-eye" label="View listing summary" onClick={() => onView(u)} /> },   // shared round eye (UI2.btn.rowIcon)
      ]}
      rows={rows}
      rowKey={u => u.id}
      empty={<EmptyState icon="ti-speakerphone" text="No active listings match the current filters." />}
    />
  );
}

// Opportunities — ListRow list (fits a narrow column, no sideways scroll): check ONE property, then "List"
// in the section header. Title = property · meta = how many units are ready.
function OpportunitiesList({ items, selectedIds, onToggle }) {
  if (items.length === 0) return <EmptyState icon="ti-building-community" text="No properties currently have 2+ units ready to bundle." />;
  return items.map(p => (
    <ListRow wrap
      key={p.id}
      leading={<Checkbox checked={selectedIds.has(p.id)} onChange={() => onToggle(p.id)} />}
      title={p.name}
      meta={`${p.readyCount}/${p.unitCount} units ready`}
    />
  ));
}

function NotReadyList({ items, propertyName, onView, sample }) {
  if (items.length === 0) return <EmptyState icon="ti-circle-check" text="No blocked units match the current filters." />;
  return items.map(u => {
    const isStub = u.notReadyReason?.startsWith('STUB:');
    const reason = isStub ? u.notReadyReason.replace('STUB:', '') : u.notReadyReason;
    let action;
    if (isStub) action = <RowAction on={false} icon="ti-calendar-event" label="Schedule Vendor" tooltip="Maintenance/Make-Ready/Inspection/Compliance rules are seeded as inactive stubs — no backing system exists yet. See design review §3.2." />;
    else if (sample) action = <RowAction on={false} icon="ti-eye" label="View Unit" tooltip="Sample data — no real backend record exists for this unit yet." />;
    else action = <RowAction icon="ti-eye" label="View Unit" onClick={() => onView(u.propertyId)} />;
    return (
      <ListRow wrap
        key={u.id}
        leading={<span style={S.rowIcon(TONES2.error)}><i className="ti ti-alert-triangle" aria-hidden="true" /></span>}
        title={`${propertyName(u.propertyId)} · Unit ${u.unit}`}
        // per-row Sample pill only when the section itself shows real data (else the header pill already says it);
        // it rides on the description line so the right side stays just the small round button
        meta={isStub && !sample ? <span style={S.metaLine}>{reason}<SamplePill title="This rule category is an inactive stub — illustrative only." /></span> : reason}
        trailing={action}
      />
    );
  });
}

function ReadyToListTable({ rows, propertyName, onList, selectedIds, onToggle, sample }) {
  return (
    <DataTable
      columns={[
        { key: 'pick', label: '', fit: true, render: u => <Checkbox checked={selectedIds.has(u.id)} onChange={() => onToggle(u.id)} /> },
        { key: 'property', label: 'Property', type: 'primary', width: 1.4, render: u => propertyName(u.propertyId) },
        { key: 'unit', label: 'Unit', type: 'secondary', fit: true, render: u => `Unit ${u.unit}` },
        { key: 'beds', label: 'Beds/Baths', type: 'secondary', fit: true, render: u => u.bedBath || <Dash /> },
        { key: 'rent', label: 'Rent', type: 'amount', align: 'left', fit: true, render: u => fmtRent(u.rent) },
        { key: 'readiness', label: 'Readiness', type: 'status', fit: true, render: u => <ReadinessBadge code={u.readiness} /> },
        { key: 'available', label: 'Available', type: 'secondary', fit: true, render: u => fmtDate(u.availableDate) },
        { key: 'action', label: 'Actions', fit: true,
          render: u => (sample
            ? <OffButton brand label="List" tooltip="Sample data — no real backend record exists for this unit yet." />
            : <button type="button" className="un2-btn" style={S.rowBtn} onClick={() => onList(u.propertyId)}>List</button>) },
      ]}
      rows={rows}
      rowKey={u => u.id}
      empty={<EmptyState icon="ti-clipboard-check" text="No units match the current filters." />}
    />
  );
}

// Draft Listings matrix — property group rows, then one row per in-progress wizard draft
function ProgressDots({ step, total = 4 }) {
  return (
    <span style={S.dots} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => <span key={i} style={S.dot(i < step)} />)}
    </span>
  );
}

// Draft Listings — grouped ListRow list (fits a narrow column, no sideways scroll):
//   Property · N drafts
//   [type icon]  Unit 102 · Individual            ●●○○  (→)
//                Step 2 of 4 — Listing Details
function DraftListingsList({ groups, onResume, sample }) {
  if (groups.length === 0) return <EmptyState icon="ti-file-text" text="No listings currently in progress." />;
  return groups.map(g => (
    <div key={g.id}>
      <div style={S.groupHead}>
        <span style={S.group}>{g.name}</span> <span style={UI2.text.meta}>· {g.drafts.length} draft{g.drafts.length !== 1 ? 's' : ''}</span>
      </div>
      {g.drafts.map(d => {
        const multi = d.type === 'multi';
        return (
          <ListRow wrap
            key={d.id}
            leading={<span style={S.rowIcon(multi ? TONES2.primary : TONES2.neutral)}><i className={`ti ${multi ? 'ti-stack-2' : 'ti-file-text'}`} aria-hidden="true" /></span>}
            title={`${d.unitLabel} · ${multi ? `Multi-Unit (${d.unitLabel.split(',').length})` : 'Individual'}`}
            // progress dots sit WITH the step text (no gap across the row); only the Resume button stays on the right
            meta={<span style={S.stepLine}><ProgressDots step={d.step} />Step {d.step} of 4 — {d.stepLabel}</span>}
            trailing={sample
              ? <RowAction on={false} icon="ti-arrow-right" label="Resume" tooltip="Sample data — no real backend record exists for this draft yet." />
              : <RowAction icon="ti-arrow-right" label="Resume" onClick={() => onResume(d)} />}
          />
        );
      })}
    </div>
  ));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function PMListingsOverview() {
  const navigate = useNavigate();

  // ── LST-19 backend fetch (unchanged) — a failure falls back to the sample content, same as an empty response ──
  const [overview, setOverview] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getPMListingsOverview()
      .then(data => { if (!cancelled) setOverview(data); })
      .catch(err => {
        console.error('PMListingsOverview: getPMListingsOverview() failed — falling back to sample data.', err);
        if (!cancelled) setOverview({ properties: [], units: [], drafts: [] });
      });
    return () => { cancelled = true; };
  }, []);

  const realProperties = overview?.properties ?? [];
  const realUnits = overview?.units ?? [];
  const realDrafts = overview?.drafts ?? [];

  const [propertyFilter, setPropertyFilter] = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [typeFilter,     setTypeFilter]     = useState('');
  const [channelFilter,  setChannelFilter]  = useState('');
  const [searchText,     setSearchText]     = useState('');
  const [summaryUnit,    setSummaryUnit]    = useState(null);
  const [seeAllSection,  setSeeAllSection]  = useState(null); // 'needsAttention' | 'activeListings' | 'opportunities' | 'notReady' | 'draftListings' | 'readyToList' | null
  const [selectedReadyIds, setSelectedReadyIds] = useState(() => new Set());
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState(() => new Set());

  // Combined lookup — real property list first, then the mock one (ids never collide).
  const propertyName = (pid) => {
    const real = realProperties.find(p => p.id === pid);
    if (real) return real.name;
    return MOCK_PROPERTIES.find(p => p.id === pid)?.name || '—';
  };

  const filterOpts = { propertyFilter, channelFilter, statusFilter, searchText };
  const activeFilterCount = [propertyFilter, statusFilter, typeFilter, channelFilter].filter(Boolean).length;

  const clearFilters = () => {
    setPropertyFilter(''); setStatusFilter(''); setTypeFilter(''); setChannelFilter('');
  };

  // ── Stats + Portfolio Coverage (live) — fall back to sample together (same full unit set) ──
  const usingSampleStats = realUnits.length === 0;
  const statsSourceUnits = usingSampleStats ? MOCK_UNITS : realUnits;
  const stats = computeStats(statsSourceUnits);
  const coverage = computeCoverage(statsSourceUnits);

  const coverageSegments = [
    { key: 'active',       label: 'Active',         value: coverage.active },
    { key: 'pipeline',     label: 'Ready Pipeline', value: coverage.pipeline },
    { key: 'blocked',      label: 'Blocked',        value: coverage.blocked },
    { key: 'ineligible',   label: 'Ineligible',     value: coverage.ineligible },
    { key: 'notEvaluated', label: 'Not Evaluated',  value: coverage.notEvaluated },
  ];
  // Ring = one blue gradient (STATUS2.ramp, same as Approvals' Status Breakdown); each legend dot = its part's shade
  const coverageMids = segmentMidpoints(coverageSegments);
  let midIdx = 0;
  const coverageLegend = coverageSegments.map(s => ({ ...s, color: s.value > 0 ? rampColor(STATUS2.ramp, coverageMids[midIdx++]) : C2.border }));

  // ── Opportunities (live) — properties with 2+ ready units, independent fallback ──
  const realOpportunities = computeOpportunities(realUnits, realProperties);
  const usingSampleOpportunities = realOpportunities.length === 0;
  const opportunities = usingSampleOpportunities ? computeOpportunities(MOCK_UNITS, MOCK_PROPERTIES) : realOpportunities;

  const toggleOpportunitySelection = (id) => {
    setSelectedOpportunityIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  // Rule: List enables only with exactly ONE property checked (no bulk-list endpoint, LST-1).
  const canListOpportunity = !usingSampleOpportunities && selectedOpportunityIds.size === 1;
  const opportunityListTooltip = usingSampleOpportunities
    ? 'Sample data — no real property record to open yet.'
    : selectedOpportunityIds.size === 0
      ? 'Check a property to enable List.'
      : selectedOpportunityIds.size > 1
        ? 'Only one property at a time — no bulk-list endpoint yet. Uncheck down to one to continue.'
        : `Continue to Multi-Unit Listing for ${opportunities.find(o => o.id === [...selectedOpportunityIds][0])?.name || propertyName([...selectedOpportunityIds][0])}.`;

  // ── Ready to List (live) — "any real data" is checked against the UNFILTERED real set ──
  const usingSampleReadyToList = !realUnits.some(isReadyToListUnit);
  const readyToList = filterUnitsBy(usingSampleReadyToList ? MOCK_UNITS : realUnits, propertyName, filterOpts).filter(isReadyToListUnit);

  const toggleReadySelection = (id) => {
    setSelectedReadyIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectedReadyUnits = readyToList.filter(u => selectedReadyIds.has(u.id));
  const selectedReadyPropertyIds = new Set(selectedReadyUnits.map(u => u.propertyId));
  // Rule: bulk-list needs MORE THAN ONE checked row, all from the SAME property.
  const canBulkList = !usingSampleReadyToList && selectedReadyUnits.length > 1 && selectedReadyPropertyIds.size === 1;
  const bulkListTooltip = usingSampleReadyToList
    ? 'Sample data — no real backend record exists for these units yet.'
    : selectedReadyUnits.length === 0
      ? 'Select two or more Ready to List units from the same property to enable bulk listing.'
      : selectedReadyPropertyIds.size > 1
        ? 'Selected units span more than one property — select units from a single property to list them together.'
        : selectedReadyUnits.length === 1
          ? 'Select at least one more unit from the same property to enable bulk listing.'
          : `Continue to Multi-Unit Listing for ${propertyName([...selectedReadyPropertyIds][0])}.`;

  // ── Active Listings (live core cols) — independent fallback ──
  const usingSampleActiveListings = !realUnits.some(isActiveListingUnit);
  const activeListings = filterUnitsBy(usingSampleActiveListings ? MOCK_UNITS : realUnits, propertyName, filterOpts).filter(isActiveListingUnit);

  // ── Not Ready (live for real rule categories, sample for stubs / an empty backend) ──
  const usingSampleNotReady = !realUnits.some(isNotReadyUnit);
  const notReadyUnits = filterUnitsBy(usingSampleNotReady ? MOCK_UNITS : realUnits, propertyName, filterOpts).filter(isNotReadyUnit);

  // ── Draft Listings (live) — its own data source (drafts[]) ──
  const usingSampleDrafts = realDrafts.length === 0;
  const draftGroups = groupDraftsByProperty(usingSampleDrafts ? DRAFT_LISTINGS : realDrafts, usingSampleDrafts ? MOCK_PROPERTIES : realProperties);
  const draftListingsTotal = usingSampleDrafts ? DRAFT_LISTINGS.length : realDrafts.length;

  // Listing Performance — illustrative only (no view/lead/showing/application tracking yet, design review §3.1)
  const chartData = [
    { day: 'Mon', views: 120 }, { day: 'Tue', views: 180 }, { day: 'Wed', views: 90 },
    { day: 'Thu', views: 210 }, { day: 'Fri', views: 260 }, { day: 'Sat', views: 140 }, { day: 'Sun', views: 170 },
  ];
  const PERFORMANCE = [
    ['Views', 1284], ['Unique Views', 947], ['Leads', 38],
    ['Showings', 14], ['Applications', 6], ['Leases', 2],
  ];

  const resumeDraft = (d) => { const { path, state } = _resumeTarget(d); navigate(path, { state }); };

  // ── Summary stats — the shared HeroStats row (same as Listings hero / Approvals) ──
  const STATS = [
    { tone: TONES2.success,               icon: 'ti-circle-check',    label: 'Active',         value: stats.active,   note: 'live listings' },
    { tone: TONES2.primary,               icon: 'ti-clipboard-check', label: 'Ready to List',  value: stats.ready,    note: `across ${opportunities.length + 1} props` /* + ` · +4.2% (sample trend)` — illustrative trend (old amber "+4.2%" pill), commented out for now */ },
    { tone: TONES2.error,                 icon: 'ti-alert-triangle',  label: 'Not Ready',      value: stats.notReady, note: 'blocked' },
    { tone: accentTone(ACCENT2.violet),   icon: 'ti-file-text',       label: 'Draft',          value: stats.draft,    note: 'unpublished' },
    { tone: accentTone(ACCENT2.rose),     icon: 'ti-clock-hour-4',    label: 'Expiring (30d)', value: stats.expiring, note: 'next 30 days' },
  ];

  // ── Filters (same five as the old slide-out panel) — standard list toolbar: search · Options ▸ menus ──
  const filterProperties = (realProperties.length > 0 ? realProperties : MOCK_PROPERTIES).map(p => ({ value: String(p.id), label: p.name }));
  const STATUS_OPTIONS = [{ value: 'DRAFT', label: 'Draft' }, { value: 'ACTIVE', label: 'Published' }];
  const TYPE_OPTIONS = [{ value: 'individual', label: 'Individual' }, { value: 'multi', label: 'Multi-Unit' }];
  const CHANNEL_OPTIONS = CHANNELS.map(c => ({ value: c, label: c }));
  const labelOf = (opts, v, all) => opts.find(o => o.value === v)?.label || all;
  const menuTrigger = (icon, text, active) => (open) => (
    <>
      <i className={`ti ${icon}`} style={UI2.btnIcon} aria-hidden="true" />
      <span className="un2-hide-narrow">{text}</span>
      {active && <span style={UI2.statusDot(TONES2.primary)} aria-hidden="true" />}
      <i className="ti ti-chevron-down" style={{ ...UI2.btnIcon, transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
    </>
  );
  const filterMenu = (title, all, icon, options, value, set) => (
    <div style={S.menuWrap}>
      <FilterMenu
        title={title} allLabel={all} ariaLabel={`Filter by ${title.toLowerCase()}`} itemIcon={icon} allIcon="ti-list"
        options={options} value={value || null} onChange={v => set(v || '')}
        triggerStyle={S.toolBtn} trigger={menuTrigger(icon, labelOf(options, value, all), !!value)}
      />
    </div>
  );

  return (
    <PMPageShell activeId="listings" animate backdrop={<ImageBackdrop image={backdropArt} />}>
      <Breadcrumb items={[
        { label: 'PM Portal', href: '/pm-portal/dashboard/my-dashboard' },
        { label: 'Marketing' },
        { label: 'Listings' },
      ]} />

      {/* ── Header block (= Approvals): title · subtitle │ Export · Create, toolbar SP2.xl below, stats SP2.xxl below ── */}
      <section style={S.headBlock}>
        <div style={S.headRow}>
          <div style={S.head}>
            <h1 style={S.title}>Listings</h1>
            <p style={S.sub}>Everything you can list, everything already listed, and what's blocking the rest.</p>
          </div>
          <div style={S.headActions}>
            <OffButton onArt small={false} label="Export Inventory" icon="ti-download" tooltip="No export endpoint exists yet — this is a planned feature." />
            <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => navigate('/pm-portal/properties')}>
              <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Create Listing
            </button>
          </div>
        </div>

        {/* Search, then the "Options" toggle — the filters slide out between them (same ActionTray toolbar as
            Listings / Approvals). Property · Status · Type · Channel · Portfolio = the old filter panel's fields. */}
        <div className="un2-tray-tools" style={{ ...S.toolsRow, ...S.toolsGap }}>
          <label className="un2-focus-ring un2-tray-search" style={UI2.toolbar.search}>
            <i className="ti ti-search" style={S.searchIcon} aria-hidden="true" />
            <input
              style={S.input}
              type="search"
              placeholder="Search property or unit…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              aria-label="Search property or unit"
            />
          </label>
          <ActionTray compact label="Options">
            {filterMenu('Property', 'All properties', 'ti-building', filterProperties, propertyFilter, setPropertyFilter)}
            {filterMenu('Status', 'All status', 'ti-circle-dot', STATUS_OPTIONS, statusFilter, setStatusFilter)}
            {filterMenu('Type', 'All types', 'ti-stack-2', TYPE_OPTIONS, typeFilter, setTypeFilter)}
            {filterMenu('Channel', 'All channels', 'ti-speakerphone', CHANNEL_OPTIONS, channelFilter, setChannelFilter)}
            <OffButton small={false} label="All portfolios" icon="ti-folders" tooltip='No "Portfolio" grouping entity exists yet — open question in the design review. Filter is illustrative only.' />
            {activeFilterCount > 0 && <TextLink arrow={false} onClick={clearFilters}>Clear all</TextLink>}
          </ActionTray>
        </div>

        {/* Summary stats (live; sample together with Portfolio Coverage when the backend has no units) */}
        <div style={{ ...S.statsRow, ...S.statsGap }}>
          <HeroStats stats={STATS} />
          {usingSampleStats && <SamplePill title="No units from the backend yet — these counts are sample data." />}
        </div>
      </section>

      {/* ── Portfolio Coverage │ Listing Performance — one panel, divided columns ── */}
      <section style={S.panel}>
        <div className="un2-cols un2-cols-2-wide-last">
          <div style={S.col}>
            <ColHead icon="ti-chart-donut-3" title="Portfolio Coverage" sample={usingSampleStats} sampleTitle="No units from the backend yet — sample coverage." />
            <div style={S.coverage}>
              <SegmentDonut segments={coverageSegments} ramp={STATUS2.ramp} value={coverage.total} label="Total" />
              <div style={S.legend}>
                {coverageLegend.map(s => (
                  <div key={s.key} style={UI2.legendRow}>
                    <span style={UI2.legendKey}><span style={S.legendDot(s.color)} aria-hidden="true" />{s.label}</span>
                    <span style={UI2.legendVal}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={S.col}>
            <ColHead icon="ti-chart-line" title="Listing Performance" sample sampleTitle="No view/lead/showing/application tracking exists in the backend yet — see design review §3.1.">
              <span style={S.rangePill}><i className="ti ti-calendar" aria-hidden="true" /> Last 7 days</span>
            </ColHead>
            <StatGroup fill items={PERFORMANCE.map(([label, val]) => ({ label, value: val.toLocaleString() }))} />
            <div style={S.chartBox}>
              <LineChart labels={chartData.map(d => d.day)} values={chartData.map(d => d.views)} formatValue={v => `${v} views`} emptyMax={260} ariaLabel="Listing views — last 7 days (sample)" />
            </div>
            <div style={S.note}>No view/lead/showing/application tracking exists in the backend yet — see design review §3.1. This entire section is illustrative.</div>
          </div>
        </div>
      </section>

      {/* ── Needs Attention │ Active Listings ── */}
      <section style={S.panel}>
        <div className="un2-cols un2-cols-2-wide-last-lg">   {/* wider table side (1 : 2.5) so Active Listings fits without scrolling */}
          <div style={S.col}>
            <ColHead icon="ti-bell-ringing" title="Needs Attention">
              {NEEDS_ATTENTION_ITEMS.length > CAPS.needsAttention && <SeeAll count={NEEDS_ATTENTION_ITEMS.length} onClick={() => setSeeAllSection('needsAttention')} />}
            </ColHead>
            <div><NeedsAttentionList items={NEEDS_ATTENTION_ITEMS.slice(0, CAPS.needsAttention)} /></div>
          </div>

          <div style={S.col}>
            <ColHead icon="ti-list-check" title={`Active Listings (${activeListings.length})`} sample={usingSampleActiveListings} sampleTitle="No active listings from the backend yet — sample rows.">
              {activeListings.length > CAPS.activeListings && <SeeAll count={activeListings.length} onClick={() => setSeeAllSection('activeListings')} />}
            </ColHead>
            <ActiveListingsTable rows={activeListings.slice(0, CAPS.activeListings)} propertyName={propertyName} onView={setSummaryUnit} />
          </div>
        </div>
      </section>

      {/* ── Opportunities │ Not Ready │ Draft Listings ── */}
      <section style={S.panel}>
        <div className="un2-cols un2-cols-3-wide-last">
          <div style={S.col}>
            <ColHead icon="ti-building-community" title={`Opportunities (${opportunities.length})`} sample={usingSampleOpportunities} sampleTitle="No real property currently has 2+ ready units — sample rows.">
              {opportunities.length > CAPS.opportunities && <SeeAll count={opportunities.length} onClick={() => setSeeAllSection('opportunities')} />}
              <span title={opportunityListTooltip} style={{ display: 'inline-flex' }}>
                <button
                  type="button" className="un2-btn" disabled={!canListOpportunity}
                  style={{ ...S.smallBtn, ...(canListOpportunity ? {} : UI2.btnOff) }}
                  onClick={() => canListOpportunity && navigate(`/pm-portal/properties/${[...selectedOpportunityIds][0]}`)}
                >
                  <i className="ti ti-layout-grid" style={UI2.btnIcon} aria-hidden="true" /> List
                </button>
              </span>
            </ColHead>
            <div><OpportunitiesList items={opportunities.slice(0, CAPS.opportunities)} selectedIds={selectedOpportunityIds} onToggle={toggleOpportunitySelection} /></div>
          </div>

          <div style={S.col}>
            <ColHead icon="ti-alert-triangle" title={`Not Ready (${notReadyUnits.length})`} sample={usingSampleNotReady} sampleTitle="No blocked units from the backend yet — sample rows.">
              {notReadyUnits.length > CAPS.notReady && <SeeAll count={notReadyUnits.length} onClick={() => setSeeAllSection('notReady')} />}
            </ColHead>
            <div><NotReadyList items={notReadyUnits.slice(0, CAPS.notReady)} propertyName={propertyName} onView={pid => navigate(`/pm-portal/properties/${pid}`)} sample={usingSampleNotReady} /></div>
          </div>

          <div style={S.col}>
            <ColHead icon="ti-file-text" title="Draft Listings" sample={usingSampleDrafts} sampleTitle="No in-progress drafts from the backend yet — sample rows.">
              {draftGroups.length > CAPS.draftListings && <SeeAll count={draftListingsTotal} onClick={() => setSeeAllSection('draftListings')} />}
            </ColHead>
            <div><DraftListingsList groups={draftGroups.slice(0, CAPS.draftListings)} onResume={resumeDraft} sample={usingSampleDrafts} /></div>
          </div>
        </div>
      </section>

      {/* ── Ready to List — open section, full width (= Approvals "All Pending Approvals") ── */}
      <section className="un2-cq" style={S.section}>
        <div style={S.secHead}>
          <div style={S.secTitleRow}>
            <h2 style={S.secTitle}>Ready to List ({readyToList.length})</h2>
            {usingSampleReadyToList && <SamplePill title="No ready-to-list units from the backend yet — sample rows." />}
          </div>
          <div style={S.colActions}>
            {readyToList.length > CAPS.readyToList && <SeeAll count={readyToList.length} onClick={() => setSeeAllSection('readyToList')} />}
            <span title={bulkListTooltip} style={{ display: 'inline-flex' }}>
              <button
                type="button" className="un2-btn" disabled={!canBulkList}
                style={{ ...UI2.btn.brand, ...(canBulkList ? {} : UI2.btnOff) }}
                onClick={() => canBulkList && navigate(`/pm-portal/properties/${[...selectedReadyPropertyIds][0]}`)}
              >
                <i className="ti ti-stack-2" style={UI2.btnIcon} aria-hidden="true" />
                List Selected{selectedReadyUnits.length > 0 ? ` (${selectedReadyUnits.length})` : ''}
              </button>
            </span>
          </div>
        </div>
        {/* white card behind the table: rows sit on white, hover shows the light-blue band */}
        <div style={S.panel}>
          <ReadyToListTable
            rows={readyToList.slice(0, CAPS.readyToList)} propertyName={propertyName}
            onList={pid => navigate(`/pm-portal/properties/${pid}`)}
            selectedIds={selectedReadyIds} onToggle={toggleReadySelection}
            sample={usingSampleReadyToList}
          />
        </div>
      </section>

      <PageFooter />

      {/* ── Pop-ups ── */}
      {summaryUnit && (
        <ListingSummaryModal unit={summaryUnit} propertyName={propertyName(summaryUnit.propertyId)} onClose={() => setSummaryUnit(null)} />
      )}

      <SeeAllModal open={seeAllSection === 'needsAttention'} onClose={() => setSeeAllSection(null)} title="Needs Attention" icon="ti-bell-ringing" count={NEEDS_ATTENTION_ITEMS.length}>
        <NeedsAttentionList items={NEEDS_ATTENTION_ITEMS} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'activeListings'} onClose={() => setSeeAllSection(null)} title="Active Listings" icon="ti-list-check" count={activeListings.length}>
        <ActiveListingsTable rows={activeListings} propertyName={propertyName} onView={setSummaryUnit} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'opportunities'} onClose={() => setSeeAllSection(null)} title="Property Listing Opportunities" icon="ti-building-community" count={opportunities.length}>
        <OpportunitiesList items={opportunities} selectedIds={selectedOpportunityIds} onToggle={toggleOpportunitySelection} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'notReady'} onClose={() => setSeeAllSection(null)} title="Not Ready to List" icon="ti-alert-triangle" count={notReadyUnits.length}>
        <NotReadyList items={notReadyUnits} propertyName={propertyName} onView={pid => navigate(`/pm-portal/properties/${pid}`)} sample={usingSampleNotReady} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'draftListings'} onClose={() => setSeeAllSection(null)} title="Draft Listings" icon="ti-file-text" count={draftListingsTotal}>
        <DraftListingsList groups={draftGroups} onResume={resumeDraft} sample={usingSampleDrafts} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'readyToList'} onClose={() => setSeeAllSection(null)} title="Ready to List" icon="ti-clipboard-check" count={readyToList.length}>
        <ReadyToListTable
          rows={readyToList} propertyName={propertyName}
          onList={pid => navigate(`/pm-portal/properties/${pid}`)}
          selectedIds={selectedReadyIds} onToggle={toggleReadySelection}
          sample={usingSampleReadyToList}
        />
      </SeeAllModal>
    </PMPageShell>
  );
}
