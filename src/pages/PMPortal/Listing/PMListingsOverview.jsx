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
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';
import { CustomDropdown } from '../../../components/ui';
import { getPMListingsOverview } from '../../Landlord/Listing/listingApi';

const C = {
  primary:     '#002D5B',
  primaryHover:'#003d7a',
  primaryLight:'#EFF6FF',
  primaryBorderLight: '#B9CDE3',
  white:       '#FFFFFF',
  pageBg:      '#F8FAFC',
  cardBg:      '#FFFFFF',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  textPrimary: '#0F172A',
  textSec:     '#64748B',
  textTert:    '#94A3B8',
  success:     '#16A34A',
  successLight:'#F0FDF4',
  danger:      '#DC2626',
  dangerLight: '#FEF2F2',
  amber:       '#92400E',
  amberLight:  '#FEF3C7',
  blue:        '#1D4ED8',
  blueLight:   '#EFF6FF',
  sampleTag:   '#B45309',
  sampleTagBg: '#FFFBEB',
  sampleTagBdr:'#FDE68A',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ── Readiness → display config ──────────────────────────────────────────────
const READINESS_CFG = {
  LIST_READY:           { label: 'Ready',          bg: C.successLight, color: C.success, dot: C.success },
  READY_WITH_WARNINGS:  { label: 'Ready (warn)',    bg: C.amberLight,   color: C.amber,   dot: '#D97706'  },
  NOT_READY:            { label: 'Not Ready',       bg: C.dangerLight,  color: C.danger,  dot: C.danger   },
  NOT_ELIGIBLE:         { label: 'Not Eligible',    bg: '#F1F5F9',      color: C.textSec, dot: C.textTert },
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

// Draft Listings — approved matrix wireframe (see the published Design canvas
// from this session). One row per in-progress wizard draft, grouped by
// property. "Live" mock data (units/properties are real mock records) but
// step/type are invented for now — no backend concept of a wizard-progress
// checkpoint exists yet (see LST-22). Wizard step numbering: 1 Property &
// Unit, 2 Listing Details, 3 Promote, 4 Compliance & Publish (matches the
// real 4-step wizard both portals already use).
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
// LST-19 — pure derivation helpers, factored out so the exact same logic runs
// against real backend data (getPMListingsOverview) and against the MOCK_*
// fallback content, and the two can never quietly drift apart. Every one of
// these is byte-for-byte the computation this file already did inline
// against MOCK_UNITS/MOCK_PROPERTIES before this revision.
// ─────────────────────────────────────────────────────────────────────────────
// hasInProgressListing excludes a unit already mid-wizard (individual or
// Multi-Unit group, any DRAFT/PENDING_PAYMENT Listing) from Ready to List —
// readiness and "wizard already started" are independent signals; a unit
// can be genuinely LIST_READY per the rules engine while the user has
// already begun listing it, in which case it belongs in Drafts only, not
// re-offered here too. Found live, Session 48 (testuser35/Sarah Palin
// testing): Idex5 A1/A2/A3 — in progress — were showing under Ready to
// List. Backend field added the same session; MOCK_UNITS rows are never
// mid-wizard (`hasInProgressListing` undefined → falsy), so sample data is
// unaffected.
const isReadyToListUnit = (u) => u.status === 'DRAFT' && !u.hasInProgressListing && (u.readiness === 'LIST_READY' || u.readiness === 'READY_WITH_WARNINGS');
const isActiveListingUnit = (u) => u.readiness === 'ACTIVE';
const isNotReadyUnit = (u) => u.readiness === 'NOT_READY' || u.readiness === 'NOT_ELIGIBLE';

function computeStats(units) {
  return {
    active: units.filter(u => u.readiness === 'ACTIVE').length,
    ready: units.filter(isReadyToListUnit).length,
    notReady: units.filter(isNotReadyUnit).length,
    draft: units.filter(u => u.status === 'DRAFT').length,
    // No longer a hand-picked stand-in (was `2`, hardcoded, through the
    // LST-19 backend wiring pass) — now derived from the same real
    // expiresAt the countdown badge uses, once that landed. A unit only
    // has an expiresAt when it has an active listing, so this only ever
    // counts active units within 30 days of Listing.expires_at.
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
    // A unit the Listing Readiness rules engine hasn't evaluated yet has no
    // UnitReadinessSnapshot row, so the backend sends readiness: null — it's
    // none of the four states above but is still one of the visible units
    // counted in `total`. Without this bucket the four segments above could
    // silently under-sum `total` (e.g. a brand-new unit added before
    // compute_unit_readiness() has ever run on it) and the donut would look
    // wrong with no visible explanation. Every mock-data unit ships with a
    // readiness value, so this bucket is always 0 against sample data — it
    // only shows up against real backend data. Session 48, found live.
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared small components
// ─────────────────────────────────────────────────────────────────────────────

function SampleTag({ style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: C.sampleTagBg, border: `1px solid ${C.sampleTagBdr}`,
      fontFamily: F.body, fontSize: 9.5, fontWeight: 800, color: C.sampleTag,
      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
      ...style,
    }}>
      <i className="ti ti-flask" style={{ fontSize: 10 }} />
      Sample Data
    </span>
  );
}

function SampleCard({ children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>
        <SampleTag />
      </div>
      {children}
    </div>
  );
}

function ActionTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', fontFamily: F.body, fontSize: 10.5, fontWeight: 600, padding: '5px 9px', borderRadius: 5, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 400 }}>
          {text}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #0F172A' }} />
        </div>
      )}
    </div>
  );
}

function DeadEndButton({ label, icon, tooltip, style, small }) {
  return (
    <ActionTooltip text={tooltip}>
      <button disabled style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: small ? '5px 10px' : '7px 14px',
        background: '#F1F5F9', border: `1px solid ${C.border}`, borderRadius: 7,
        fontFamily: F.body, fontSize: small ? 11 : 12, fontWeight: 700,
        color: C.textTert, cursor: 'not-allowed',
        ...style,
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 13 }} />}
        {label}
      </button>
    </ActionTooltip>
  );
}

// Redesigned stat tile — colored left border, icon chip, uppercase label,
// serif value + short subtitle, ~30% shorter than the original card.
// Padding/sizes below are ~20% shorter than the prior pass (itself already
// ~30% shorter than the original card) per the user's explicit request.
function StatTile({ label, value, subtitle, accent, tint, icon, samplePill }) {
  return (
    <div style={{ flex: 1, minWidth: 138, background: C.cardBg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${accent}`, borderRadius: 9, padding: '7px 12px 6px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ width: 16, height: 16, borderRadius: 5, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 9, color: accent }} />
        </div>
        {samplePill && (
          <ActionTooltip text="Trend requires a historical snapshot of these counts — not tracked yet. Illustrative only.">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 99, background: C.sampleTagBg, border: `1px solid ${C.sampleTagBdr}`, fontFamily: F.body, fontSize: 8.5, fontWeight: 800, color: C.sampleTag, cursor: 'help' }}>
              <i className="ti ti-flask" style={{ fontSize: 8 }} />+4.2%
            </span>
          </ActionTooltip>
        )}
      </div>
      <div style={{ fontFamily: F.body, fontSize: 8, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{value}</span>
        {subtitle && <span style={{ fontFamily: F.body, fontSize: 8.5, color: C.textTert }}>{subtitle}</span>}
      </div>
    </div>
  );
}

function ReadinessBadge({ code }) {
  const cfg = READINESS_CFG[code] || READINESS_CFG.NOT_ELIGIBLE;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: cfg.bg, fontFamily: F.body, fontSize: 11, fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function SectionCard({ title, icon, action, children, style }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', ...style }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <i className={`ti ${icon}`} style={{ fontSize: 15, color: C.primary }} />}
          <span style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}
function fmtRent(r) {
  return `$${r.toLocaleString()}`;
}
function fmtRelative(d) {
  const then = new Date(d); then.setHours(0, 0, 0, 0);
  const today = new Date();  today.setHours(0, 0, 0, 0);
  const days = Math.round((today - then) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

// ── Promotion plan countdown ("ticking clock" — added per user request,
// this revision). expiresAt comes straight from Listing.expires_at, which
// the backend already writes at publish time (listing_publish():
// timezone.now() + plan.duration_days) — nothing server-side needs to
// compute "days remaining" itself, the FE just diffs expiresAt against
// "now" on every render so the number is only ever as stale as the last
// render, not a value baked in at fetch time.
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

// Same three-tier urgency banding as everything else on this dashboard
// (danger/amber/blue, never a bespoke hue) — red once it's expired or
// closing in a window a PM would want to catch it in, amber inside a week
// out, blue otherwise. A null day count (no active listing / no plan
// purchased yet) renders as a plain dash, not a badge.
function countdownConfig(days) {
  if (days === null) return null;
  if (days < 0)   return { bg: C.dangerLight, color: C.danger, label: `Expired ${Math.abs(days)}d ago` };
  if (days === 0) return { bg: C.dangerLight, color: C.danger, label: 'Expires today' };
  if (days <= 3)  return { bg: C.dangerLight, color: C.danger, label: `${days}d left` };
  if (days <= 7)  return { bg: C.amberLight,  color: C.amber,  label: `${days}d left` };
  return { bg: C.blueLight, color: C.blue, label: `${days}d left` };
}

function CountdownBadge({ expiresAt }) {
  const cfg = countdownConfig(daysUntil(expiresAt));
  if (!cfg) return <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTert }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: cfg.bg, color: cfg.color, fontFamily: F.body, whiteSpace: 'nowrap',
    }}>
      <i className="ti ti-clock" style={{ fontSize: 10.5 }} />{cfg.label}
    </span>
  );
}

// ── Filter slide-out panel (right, ~30% width) ─────────────────────────────
function FilterPanel({ open, onClose, properties, propertyFilter, setPropertyFilter, statusFilter, setStatusFilter, typeFilter, setTypeFilter, channelFilter, setChannelFilter, onClear }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(15,23,42,0.35)' }} />
      <div style={{ width: '30%', minWidth: 320, maxWidth: 420, background: C.white, height: '100%', boxShadow: '-8px 0 32px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 15, color: C.primary }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 17, fontWeight: 700, color: C.textPrimary, flex: 1 }}>Filters</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTert, fontSize: 18, padding: 4 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Property</div>
            <CustomDropdown
              options={properties.map(p => ({ value: String(p.id), label: p.name }))}
              value={propertyFilter}
              onChange={setPropertyFilter}
              placeholder="All Properties"
            />
          </div>

          <div>
            <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Portfolio</div>
            <ActionTooltip text='No "Portfolio" grouping entity exists yet — open question in the design review. Filter is illustrative only.'>
              <div><CustomDropdown options={[]} value="" onChange={() => {}} placeholder="All Portfolios" disabled /></div>
            </ActionTooltip>
          </div>

          <div>
            <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</div>
            <CustomDropdown
              options={[{ value: 'DRAFT', label: 'Draft' }, { value: 'ACTIVE', label: 'Published' }]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Status"
            />
          </div>

          <div>
            <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Type</div>
            <CustomDropdown
              options={[{ value: 'individual', label: 'Individual' }, { value: 'multi', label: 'Multi-Unit' }]}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All Types"
            />
          </div>

          <div>
            <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Channel</div>
            <CustomDropdown
              options={CHANNELS.map(c => ({ value: c, label: c }))}
              value={channelFilter}
              onChange={setChannelFilter}
              placeholder="All Channels"
            />
          </div>
        </div>

        <div style={{ padding: '16px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
          <button onClick={onClear} style={{ flex: 1, height: 38, background: C.white, border: `1px solid ${C.borderMed}`, borderRadius: 8, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textSec, cursor: 'pointer' }}>
            Clear All
          </button>
          <button onClick={onClose} style={{ flex: 1, height: 38, background: C.primary, border: 'none', borderRadius: 8, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.white, cursor: 'pointer' }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Listing Summary modal (consolidates Steps 1–4) ─────────────────────────
function buildSummaryDetails(u) {
  // promotionPlan/expiresAt: prefer the real values (from Listing /
  // ListingPromotionPurchase, wired this revision) when the unit has them —
  // only true for a real active listing. Everything else in this modal
  // (deposit, description, amenities, photoCount, leadContact,
  // showingSettings, listingId, compliance) has no backend source at all
  // yet and stays illustrative regardless of data source — see the modal's
  // own note where it's rendered. When there's no real expiresAt (a mock
  // row, or a real active listing published before this field existed),
  // fall back to publishedDate + the illustrative plan's 30 days so the
  // countdown row still shows something instead of a bare dash.
  const promotionPlan = u.promotionPlan || 'Standard Boost — 30 days';
  const expiresAt = u.expiresAt || (u.publishedDate ? addDays(u.publishedDate, 30) : null);
  return {
    deposit: Math.round(u.rent * 1.5),
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

function SummaryRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
      <span style={{ fontFamily: F.body, fontSize: 12, color: C.textSec, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// Same row layout as SummaryRow, but the value is the color-coded
// CountdownBadge instead of plain text — the "ticking clock" for the
// promotion plan's remaining days.
function CountdownSummaryRow({ label, expiresAt }) {
  if (!expiresAt) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
      <span style={{ fontFamily: F.body, fontSize: 12, color: C.textSec, flexShrink: 0 }}>{label}</span>
      <CountdownBadge expiresAt={expiresAt} />
    </div>
  );
}

function ListingSummaryModal({ unit, propertyName, onClose }) {
  if (!unit) return null;
  const d = buildSummaryDetails(unit);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 14, width: 620, maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.white, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{propertyName} · Unit {unit.unit}</h2>
            <p style={{ margin: '3px 0 0', fontFamily: F.body, fontSize: 11.5, color: C.textTert }}>{d.listingId} · Published {fmtDate(unit.publishedDate)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTert, fontSize: 18 }}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: '18px 26px' }}>
          <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 6px' }}>Step 1 — Property &amp; Unit</div>
          <SummaryRow label="Property" value={propertyName} />
          <SummaryRow label="Unit" value={unit.unit} />
          <SummaryRow label="Bed / Bath" value={unit.bedBath} />
          <SummaryRow label="Square Footage" value={`${unit.sqft} sqft`} />

          <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Step 2 — Listing Details</div>
          <SummaryRow label="Rent" value={fmtRent(unit.rent)} />
          <SummaryRow label="Security Deposit" value={fmtRent(d.deposit)} />
          <SummaryRow label="Available From" value={fmtDate(unit.availableDate)} />
          <SummaryRow label="Photos" value={`${d.photoCount} uploaded`} />
          <p style={{ margin: '8px 0 0', fontFamily: F.body, fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>{d.description}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {d.amenities.map(a => (
              <span key={a} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: '#F1F5F9', color: C.textSec, fontFamily: F.body }}>{a}</span>
            ))}
          </div>

          <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Step 3 — Promote</div>
          <SummaryRow label="Distribution Channel" value={unit.channel} />
          <SummaryRow label="Promotion Plan" value={d.promotionPlan} />
          <CountdownSummaryRow label="Time Remaining" expiresAt={d.expiresAt} />
          <SummaryRow label="Lead Contact" value={d.leadContact} />
          <SummaryRow label="Showing Settings" value={d.showingSettings} />

          <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Step 4 — Compliance &amp; Publish</div>
          {d.compliance.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <i className="ti ti-circle-check" style={{ fontSize: 14, color: C.success }} />
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{c.label}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 26px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: C.white }}>
          <DeadEndButton label="Cancel Ad" icon="ti-ban" tooltip="No listing cancel/status-change endpoint exists in the backend yet — see design review §3.3." style={{ flex: 1, justifyContent: 'center' }} />
          <button onClick={onClose} style={{ flex: 1, height: 40, background: C.primary, border: 'none', borderRadius: 8, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.white, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── "See All" — expands a capped section into a large scrollable popup ─────
// Width is per content type, not a single fixed number: card/list sections
// read comfortably at ~40% of the screen, wide tables (many columns) get
// more room (~58%) so rows don't wrap. 40% is the floor, not a fixed value.
function SeeAllLink({ count, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
      See All ({count})<i className="ti ti-arrow-right" style={{ fontSize: 11 }} />
    </button>
  );
}

function SeeAllModal({ open, onClose, title, icon, count, widthPct = 40, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 550, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 14, width: `${widthPct}%`, minWidth: 440, maxWidth: 960, maxHeight: '86vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 26px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {icon && <i className={`ti ${icon}`} style={{ fontSize: 16, color: C.primary }} />}
          <h2 style={{ margin: 0, fontFamily: F.headline, fontSize: 17, fontWeight: 700, color: C.textPrimary, flex: 1 }}>
            {title}{typeof count === 'number' ? ` (${count})` : ''}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTert, fontSize: 18 }}><i className="ti ti-x" /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Reusable section-content renderers — shared between the capped in-page
// view and the full "See All" popup, so the two never drift out of sync ───
function NeedsAttentionRow({ item }) {
  const row = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', border: `1px solid ${C.border}`, borderRadius: 9, gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={`ti ${item.icon}`} style={{ fontSize: 15, color: item.live ? C.amber : C.textTert }} />
        <span style={{ fontFamily: F.body, fontSize: 12, color: C.textPrimary }}>{item.text}</span>
      </div>
      <DeadEndButton small label={item.actionLabel} icon={item.actionIcon} tooltip={item.tooltip} />
    </div>
  );
  return item.live ? row : <SampleCard>{row}</SampleCard>;
}

function ActiveListingsTable({ rows, propertyName, onView }) {
  if (rows.length === 0) {
    return <p style={{ margin: 0, fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>No active listings match the current filters.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {['Property', 'Unit', 'Published', 'Available', 'Channel', 'Expires', ''].map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(u => (
          <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
            <td style={{ padding: '9px 8px', fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>{propertyName(u.propertyId)}</td>
            <td style={{ padding: '9px 8px', fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>Unit {u.unit}</td>
            <td style={{ padding: '9px 8px', fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>{fmtDate(u.publishedDate)}</td>
            <td style={{ padding: '9px 8px', fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>{fmtDate(u.availableDate)}</td>
            <td style={{ padding: '9px 8px', fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>{u.channel || '—'}</td>
            <td style={{ padding: '9px 8px' }}><CountdownBadge expiresAt={u.expiresAt} /></td>
            <td style={{ padding: '9px 8px', textAlign: 'right' }}>
              <button onClick={() => onView(u)} style={{ background: 'none', border: 'none', padding: 0, fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary, textDecoration: 'underline', cursor: 'pointer' }}>
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Compact checkbox matrix (was a card list) — check a property, then use
// the single "List" button in the section header. Shared between the
// capped in-page view and the "See All" popup, same convention as
// ReadyToListTable/DraftListingsMatrix.
function OpportunitiesList({ items, selectedIds, onToggle }) {
  if (items.length === 0) {
    return <p style={{ margin: 0, fontFamily: F.body, fontSize: 12, color: C.textSec }}>No properties currently have 2+ units ready to bundle.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          <th style={{ width: 26, padding: '0 0 6px' }} />
          <th style={{ textAlign: 'left', padding: '0 0 6px', fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Property</th>
          <th style={{ textAlign: 'right', padding: '0 0 6px', fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ready</th>
        </tr>
      </thead>
      <tbody>
        {items.map(p => (
          <tr key={p.id} style={{ borderBottom: `1px solid #F1F5F9`, background: selectedIds.has(p.id) ? C.primaryLight : 'transparent' }}>
            <td style={{ padding: '9px 0' }}>
              <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => onToggle(p.id)}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: C.primary }} />
            </td>
            <td style={{ padding: '9px 0', fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{p.name}</td>
            <td style={{ padding: '9px 0', textAlign: 'right', fontFamily: F.body, fontSize: 11.5, color: C.textSec }}>{p.readyCount}/{p.unitCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NotReadyList({ items, propertyName, onView, sample }) {
  if (items.length === 0) {
    return <p style={{ margin: 0, fontFamily: F.body, fontSize: 12, color: C.textSec }}>No blocked units match the current filters.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(u => {
        const isStub = u.notReadyReason?.startsWith('STUB:');
        const reason = isStub ? u.notReadyReason.replace('STUB:', '') : u.notReadyReason;
        const cardBody = (
          <div style={{ padding: '11px 12px', border: `1px solid ${C.border}`, borderRadius: 9 }}>
            <p style={{ margin: '0 0 3px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>{propertyName(u.propertyId)} · Unit {u.unit}</p>
            <p style={{ margin: '0 0 8px', fontFamily: F.body, fontSize: 11, color: C.textSec }}>{reason}</p>
            {isStub
              ? <DeadEndButton small label="Schedule Vendor" icon="ti-tool" tooltip="Maintenance/Make-Ready/Inspection/Compliance rules are seeded as inactive stubs — no backing system exists yet. See design review §3.2." />
              : sample
                ? <DeadEndButton small label="View Unit" icon="ti-eye" tooltip="Sample data — no real backend record exists for this unit yet." />
                : <button onClick={() => onView(u.propertyId)}
                    style={{ padding: '5px 11px', background: C.white, border: `1px solid ${C.borderMed}`, borderRadius: 6, fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.textSec, cursor: 'pointer' }}>
                    View Unit →
                  </button>
            }
          </div>
        );
        // Only the individually-stubbed cards get their own SampleCard badge
        // here — when the WHOLE section is sample-sourced (sample===true),
        // the call site wraps the entire SectionCard in one SampleCard
        // instead, so a real (non-stub) row doesn't get double-badged.
        return isStub ? <SampleCard key={u.id}>{cardBody}</SampleCard> : <React.Fragment key={u.id}>{cardBody}</React.Fragment>;
      })}
    </div>
  );
}

function ReadyToListTable({ rows, propertyName, onList, selectedIds, onToggle, sample }) {
  if (rows.length === 0) {
    return <p style={{ margin: 0, fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>No units match the current filters.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          <th style={{ width: 30, padding: '6px 4px 6px 10px' }} />
          {['Property', 'Unit', 'Beds/Baths', 'Rent', 'Readiness', 'Available', ''].map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(u => (
          <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, background: selectedIds.has(u.id) ? C.primaryLight : 'transparent' }}>
            <td style={{ padding: '9px 4px 9px 10px' }}>
              <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => onToggle(u.id)}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: C.primary }} />
            </td>
            <td style={{ padding: '9px 10px', fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>{propertyName(u.propertyId)}</td>
            <td style={{ padding: '9px 10px', fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>Unit {u.unit}</td>
            <td style={{ padding: '9px 10px', fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>{u.bedBath}</td>
            <td style={{ padding: '9px 10px', fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, fontWeight: 600 }}>{fmtRent(u.rent)}</td>
            <td style={{ padding: '9px 10px' }}><ReadinessBadge code={u.readiness} /></td>
            <td style={{ padding: '9px 10px', fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>{fmtDate(u.availableDate)}</td>
            <td style={{ padding: '9px 10px', textAlign: 'right' }}>
              {sample
                ? <DeadEndButton small label="List" icon="ti-arrow-right" tooltip="Sample data — no real backend record exists for this unit yet." />
                : <button onClick={() => onList(u.propertyId)}
                    style={{ padding: '5px 12px', background: C.white, border: `1px solid ${C.primaryBorderLight}`, borderRadius: 6, fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
                    List →
                  </button>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Draft Listings — matrix (approved wireframe) ────────────────────────────
function ProgressDots({ step, total = 4 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < step ? C.primary : C.border }} />
      ))}
    </div>
  );
}

function DraftTypeBadge({ type, count }) {
  const isMulti = type === 'multi';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>
      <i className={`ti ${isMulti ? 'ti-stack-2' : 'ti-file-text'}`} style={{ fontSize: 13, color: isMulti ? C.blue : C.textSec }} />
      {isMulti ? `Multi-Unit (${count})` : 'Individual'}
    </span>
  );
}

function DraftListingsMatrix({ groups, onResume, sample }) {
  if (groups.length === 0) {
    return <p style={{ margin: 0, fontFamily: F.body, fontSize: 12.5, color: C.textSec }}>No listings currently in progress.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {['Type', 'Unit(s)', "Progress — where they left off", ''].map(h => (
            <th key={h} style={{ textAlign: h === '' ? 'right' : 'left', padding: h === '' ? '6px 10px 6px 10px' : '6px 10px', fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groups.map(g => (
          <React.Fragment key={g.id}>
            <tr style={{ background: C.pageBg }}>
              <td colSpan={4} style={{ padding: '7px 10px', fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                {g.name} <span style={{ color: C.textSec, fontWeight: 600 }}>&nbsp;·&nbsp; {g.drafts.length} draft{g.drafts.length !== 1 ? 's' : ''}</span>
              </td>
            </tr>
            {g.drafts.map(d => (
              <tr key={d.id} style={{ borderBottom: `1px solid #F1F5F9` }}>
                <td style={{ padding: '10px' }}><DraftTypeBadge type={d.type} count={d.unitLabel.split(',').length} /></td>
                <td style={{ padding: '10px', fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>{d.unitLabel}</td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ProgressDots step={d.step} />
                    <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSec }}>Step {d.step} of 4 — {d.stepLabel}</span>
                  </div>
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  {sample
                    ? <DeadEndButton small label="Resume" icon="ti-arrow-right" tooltip="Sample data — no real backend record exists for this draft yet." />
                    : <button onClick={() => onResume(d.propertyId)}
                        style={{ padding: '5px 12px', background: C.white, border: `1px solid ${C.primaryBorderLight}`, borderRadius: 6, fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>
                        Resume →
                      </button>
                  }
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function PMListingsOverview() {
  const navigate = useNavigate();

  // ── LST-19 backend fetch ───────────────────────────────────────────────────
  // Fires once on mount. `overview` stays null while in flight (and every
  // section below already treats "no real rows yet" as the sample-fallback
  // trigger — see the per-section usingSample* flags — so the very first
  // render, before this resolves, simply shows the file's existing sample
  // content everywhere, then swaps in real data section-by-section as soon
  // as this lands). A fetch failure is treated the same as an empty
  // response, not a separate error state — this is a dashboard, and the
  // approved fallback content is a perfectly good degraded experience.
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

  const [filterOpen,     setFilterOpen]     = useState(false);
  const [propertyFilter, setPropertyFilter] = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [typeFilter,     setTypeFilter]     = useState('');
  const [channelFilter,  setChannelFilter]  = useState('');
  const [searchText,     setSearchText]     = useState('');
  const [summaryUnit,    setSummaryUnit]    = useState(null);
  const [seeAllSection,  setSeeAllSection]  = useState(null); // 'needsAttention' | 'activeListings' | 'opportunities' | 'notReady' | 'draftListings' | 'readyToList' | null
  const [selectedReadyIds, setSelectedReadyIds] = useState(() => new Set()); // Ready to List row checkboxes — shared by the capped view and its "See All" popup
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState(() => new Set()); // Opportunities matrix checkboxes (property ids) — shared the same way

  // Combined lookup — tries the real (fetched) property list first, then the
  // mock one. Real DB ids and this file's own mock ids (101-104) don't
  // collide in practice, so one function safely covers every section
  // regardless of whether that particular section is showing real or
  // sample-fallback rows, without threading a separate resolver through
  // each one.
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

  // ── Stat tiles + Portfolio Coverage (live) — these two are simple
  // aggregates over the SAME full unit set (not independently query-able),
  // so they fall back to sample together, as one unit, rather than per-tile.
  const usingSampleStats = realUnits.length === 0;
  const statsSourceUnits = usingSampleStats ? MOCK_UNITS : realUnits;
  const stats = computeStats(statsSourceUnits);
  const coverage = computeCoverage(statsSourceUnits);

  const coverageSegments = [
    { key: 'active',       name: 'Active',         n: coverage.active,       color: C.success },
    { key: 'pipeline',     name: 'Ready Pipeline',  n: coverage.pipeline,     color: C.blue },
    { key: 'blocked',      name: 'Blocked',         n: coverage.blocked,      color: C.danger },
    { key: 'ineligible',   name: 'Ineligible',      n: coverage.ineligible,   color: '#CBD5E1' },
    // Distinct, darker slate than Ineligible's gray above — "not yet
    // evaluated" and "evaluated and ineligible" are different states and
    // shouldn't read as the same color. See computeCoverage's own comment.
    { key: 'notEvaluated', name: 'Not Evaluated',  n: coverage.notEvaluated, color: C.textSec },
  ];
  const pieData = coverageSegments.filter(s => s.n > 0).map(s => ({ name: s.name, value: s.n, color: s.color }));

  // ── Property Listing Opportunities (live) — properties with 2+ ready units.
  // Falls back independently: real backend can have units/properties but
  // zero properties currently qualifying (a perfectly normal, non-empty
  // portfolio state) — see this file's header comment for that trade-off.
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
  // Rule: List enables only with exactly ONE property checked — each row is
  // already one property, and List still has only one real destination (that
  // property's Multi-Unit entry point); no bulk-list backend endpoint exists
  // (LST-1), so 2+ checked properties leave it disabled rather than guessing
  // which one to open.
  const canListOpportunity = !usingSampleOpportunities && selectedOpportunityIds.size === 1;
  const opportunityListTooltip = usingSampleOpportunities
    ? 'Sample data — no real property record to open yet.'
    : selectedOpportunityIds.size === 0
      ? 'Check a property to enable List.'
      : selectedOpportunityIds.size > 1
        ? 'Only one property at a time — no bulk-list endpoint yet. Uncheck down to one to continue.'
        : `Continue to Multi-Unit Listing for ${opportunities.find(o => o.id === [...selectedOpportunityIds][0])?.name || propertyName([...selectedOpportunityIds][0])}.`;

  // ── Ready to List table (live) — falls back independently of the other
  // filter-sensitive sections below. The "does the real backend have any"
  // check runs against the UNFILTERED real unit set, so the user's own
  // property/status/channel/search filters narrowing a real result to zero
  // never gets mistaken for "no real data" (see file header trade-off note).
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
  // Rule: bulk-list only enables with MORE THAN ONE checked row, all from the SAME
  // property. A single checked row, zero checked rows, or a mix of properties all
  // leave it disabled.
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

  // ── Active Listings table (live core cols) — same independent-fallback
  // pattern as Ready to List above.
  const usingSampleActiveListings = !realUnits.some(isActiveListingUnit);
  const activeListings = filterUnitsBy(usingSampleActiveListings ? MOCK_UNITS : realUnits, propertyName, filterOpts).filter(isActiveListingUnit);

  // ── Not Ready to List (live for real rule categories, sample for stub
  // categories AND for this whole section when the real backend has no
  // NOT_READY/NOT_ELIGIBLE units at all — two independent, stacked reasons
  // a card can end up watermarked here).
  const usingSampleNotReady = !realUnits.some(isNotReadyUnit);
  const notReadyUnits = filterUnitsBy(usingSampleNotReady ? MOCK_UNITS : realUnits, propertyName, filterOpts).filter(isNotReadyUnit);

  // ── Draft Listings matrix (live) — independent fallback, its own data
  // source (drafts[], not units[]) per the backend's own docstring.
  const usingSampleDrafts = realDrafts.length === 0;
  const draftGroups = groupDraftsByProperty(usingSampleDrafts ? DRAFT_LISTINGS : realDrafts, usingSampleDrafts ? MOCK_PROPERTIES : realProperties);
  const draftListingsTotal = usingSampleDrafts ? DRAFT_LISTINGS.length : realDrafts.length;

  const chartData = [
    { day: 'Mon', views: 120 }, { day: 'Tue', views: 180 }, { day: 'Wed', views: 90 },
    { day: 'Thu', views: 210 }, { day: 'Fri', views: 260 }, { day: 'Sat', views: 140 }, { day: 'Sun', views: 170 },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.pageBg, fontFamily: F.body, overflow: 'hidden' }}>
      <NavB activeId="marketing" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <PMTopBar />

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Breadcrumb + heading + header actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontFamily: F.body, fontSize: 11, color: C.textTert }}>PM Portal / Marketing / Listings</p>
              <h1 style={{ margin: '0 0 4px', fontFamily: F.headline, fontSize: 26, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>Listings</h1>
              <p style={{ margin: 0, fontFamily: F.body, fontSize: 13, color: C.textSec }}>Everything you can list, everything already listed, and what's blocking the rest</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DeadEndButton label="Export Inventory" icon="ti-download" tooltip="No export endpoint exists yet — this is a planned feature." />
              <button
                onClick={() => navigate('/pm-portal/properties')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: C.primary, border: 'none', borderRadius: 7, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.white, cursor: 'pointer' }}
              >
                <i className="ti ti-plus" style={{ fontSize: 13 }} />Create Listing
              </button>
            </div>
          </div>

          {/* Search + filter icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.borderMed}`, borderRadius: 7, padding: '0 10px', height: 34, background: C.white, flex: 1, maxWidth: 340 }}>
              <i className="ti ti-search" style={{ fontSize: 13, color: C.textTert, flexShrink: 0 }} />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search property or unit..."
                style={{ border: 'none', background: 'transparent', fontSize: 12, color: C.textPrimary, outline: 'none', width: '100%', fontFamily: F.body }} />
            </div>
            {/* Plain icon + text — deliberately not styled as a button (no border/fill) */}
            <button onClick={() => setFilterOpen(true)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 4px', background: 'none', border: 'none', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textSec, cursor: 'pointer' }}>
              <i className="ti ti-adjustments-horizontal" style={{ fontSize: 15 }} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.primary, color: C.white, fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>
              )}
            </button>
          </div>

          <FilterPanel
            open={filterOpen} onClose={() => setFilterOpen(false)} properties={realProperties.length > 0 ? realProperties : MOCK_PROPERTIES}
            propertyFilter={propertyFilter} setPropertyFilter={setPropertyFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            channelFilter={channelFilter} setChannelFilter={setChannelFilter}
            onClear={clearFilters}
          />

          {summaryUnit && (
            <ListingSummaryModal unit={summaryUnit} propertyName={propertyName(summaryUnit.propertyId)} onClose={() => setSummaryUnit(null)} />
          )}

          {/* Stat tiles — falls back to sample together with Portfolio
              Coverage (usingSampleStats) since both are aggregates over the
              same full unit set. */}
          {usingSampleStats ? (
            <SampleCard style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <StatTile label="Active" value={stats.active} subtitle="live listings" accent={C.success} tint={C.successLight} icon="ti-circle-check" />
                <StatTile label="Ready to List" value={stats.ready} subtitle={`across ${opportunities.length + 1} props`} accent={C.blue} tint={C.blueLight} icon="ti-clipboard-check" samplePill />
                <StatTile label="Not Ready" value={stats.notReady} subtitle="blocked" accent={C.danger} tint={C.dangerLight} icon="ti-alert-triangle" />
                <StatTile label="Draft" value={stats.draft} subtitle="unpublished" accent={C.textSec} tint="#F1F5F9" icon="ti-file-text" />
                <StatTile label="Expiring (30d)" value={stats.expiring} subtitle="next 30 days" accent={C.amber} tint={C.amberLight} icon="ti-clock-hour-4" />
              </div>
            </SampleCard>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <StatTile label="Active" value={stats.active} subtitle="live listings" accent={C.success} tint={C.successLight} icon="ti-circle-check" />
              <StatTile label="Ready to List" value={stats.ready} subtitle={`across ${opportunities.length + 1} props`} accent={C.blue} tint={C.blueLight} icon="ti-clipboard-check" samplePill />
              <StatTile label="Not Ready" value={stats.notReady} subtitle="blocked" accent={C.danger} tint={C.dangerLight} icon="ti-alert-triangle" />
              <StatTile label="Draft" value={stats.draft} subtitle="unpublished" accent={C.textSec} tint="#F1F5F9" icon="ti-file-text" />
              <StatTile label="Expiring (30d)" value={stats.expiring} subtitle="next 30 days" accent={C.amber} tint={C.amberLight} icon="ti-clock-hour-4" />
            </div>
          )}

          {/* Portfolio Coverage (30%) + Listing Performance (70%) */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>
            {usingSampleStats ? (
              <SampleCard style={{ flex: '0 0 30%' }}>
                <SectionCard title="Portfolio Coverage" icon="ti-chart-donut-3" style={{ marginBottom: 0, height: '100%' }}>
                  <div style={{ position: 'relative', height: 150, marginBottom: 14 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={2} stroke="none">
                          {pieData.map(seg => <Cell key={seg.name} fill={seg.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{coverage.total}</div>
                      <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Total</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {coverageSegments.map(seg => (
                      <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSec, flexShrink: 0, width: 78 }}>{seg.name}</span>
                        <span style={{ flex: 1, height: 5, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: `${coverage.total ? (seg.n / coverage.total) * 100 : 0}%`, background: seg.color, borderRadius: 99 }} />
                        </span>
                        <span style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textPrimary, width: 18, textAlign: 'right' }}>{seg.n}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </SampleCard>
            ) : (
            <SectionCard title="Portfolio Coverage" icon="ti-chart-donut-3" style={{ flex: '0 0 30%', marginBottom: 0 }}>
              <div style={{ position: 'relative', height: 150, marginBottom: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={2} stroke="none">
                      {pieData.map(seg => <Cell key={seg.name} fill={seg.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{coverage.total}</div>
                  <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Total</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {coverageSegments.map(seg => (
                  <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSec, flexShrink: 0, width: 78 }}>{seg.name}</span>
                    <span style={{ flex: 1, height: 5, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${coverage.total ? (seg.n / coverage.total) * 100 : 0}%`, background: seg.color, borderRadius: 99 }} />
                    </span>
                    <span style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textPrimary, width: 18, textAlign: 'right' }}>{seg.n}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            )}

            <SampleCard style={{ flex: '1 1 70%' }}>
              <SectionCard title="Listing Performance" icon="ti-chart-line" style={{ marginBottom: 0, height: '100%' }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
                  {[
                    ['Views', 1284], ['Unique Views', 947], ['Leads', 38],
                    ['Showings', 14], ['Applications', 6], ['Leases', 2],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ margin: '0 0 3px', fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                      <p style={{ margin: 0, fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{val.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div style={{ height: 118 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="day" tick={{ fontFamily: F.body, fontSize: 10, fill: C.textTert }} axisLine={{ stroke: C.border }} tickLine={false} />
                      <YAxis tick={{ fontFamily: F.body, fontSize: 10, fill: C.textTert }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontFamily: F.body, fontSize: 12, borderRadius: 7, border: `1px solid ${C.border}` }} />
                      <Line type="monotone" dataKey="views" stroke={C.primary} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ margin: '10px 0 0', fontFamily: F.body, fontSize: 11, color: C.textTert, fontStyle: 'italic' }}>
                  No view/lead/showing/application tracking exists in the backend yet — see design review §3.1. This entire section is illustrative.
                </p>
              </SectionCard>
            </SampleCard>
          </div>

          {/* Needs Attention (40%) + Active Listings (60%) */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>
            <SectionCard
              title="Needs Attention"
              icon="ti-bell-ringing"
              action={NEEDS_ATTENTION_ITEMS.length > CAPS.needsAttention
                ? <SeeAllLink count={NEEDS_ATTENTION_ITEMS.length} onClick={() => setSeeAllSection('needsAttention')} /> : null}
              style={{ flex: '0 0 40%', marginBottom: 0 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {NEEDS_ATTENTION_ITEMS.slice(0, CAPS.needsAttention).map(item => <NeedsAttentionRow key={item.key} item={item} />)}
              </div>
            </SectionCard>

            {usingSampleActiveListings ? (
              <SampleCard style={{ flex: '1 1 60%' }}>
                <SectionCard
                  title={`Active Listings (${activeListings.length})`}
                  icon="ti-list-check"
                  action={activeListings.length > CAPS.activeListings
                    ? <SeeAllLink count={activeListings.length} onClick={() => setSeeAllSection('activeListings')} /> : null}
                  style={{ marginBottom: 0, height: '100%' }}
                >
                  <ActiveListingsTable rows={activeListings.slice(0, CAPS.activeListings)} propertyName={propertyName} onView={setSummaryUnit} />
                </SectionCard>
              </SampleCard>
            ) : (
              <SectionCard
                title={`Active Listings (${activeListings.length})`}
                icon="ti-list-check"
                action={activeListings.length > CAPS.activeListings
                  ? <SeeAllLink count={activeListings.length} onClick={() => setSeeAllSection('activeListings')} /> : null}
                style={{ flex: '1 1 60%', marginBottom: 0 }}
              >
                <ActiveListingsTable rows={activeListings.slice(0, CAPS.activeListings)} propertyName={propertyName} onView={setSummaryUnit} />
              </SectionCard>
            )}
          </div>

          {/* Opportunities / Not Ready / Draft Listings — unequal thirds:
              Opportunities and Not Ready are fixed-width, Draft Listings
              fills whatever's left (~45%), per the approved wireframe. */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>
            {(() => {
              const opportunitiesCard = (
                <SectionCard
                  title={`Opportunities (${opportunities.length})`}
                  icon="ti-building-community"
                  action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {opportunities.length > CAPS.opportunities && <SeeAllLink count={opportunities.length} onClick={() => setSeeAllSection('opportunities')} />}
                      <ActionTooltip text={opportunityListTooltip}>
                        <button
                          disabled={!canListOpportunity}
                          onClick={() => canListOpportunity && navigate(`/pm-portal/properties/${[...selectedOpportunityIds][0]}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                            background: canListOpportunity ? C.primary : '#F1F5F9',
                            border: `1px solid ${canListOpportunity ? C.primary : C.border}`,
                            borderRadius: 6, fontFamily: F.body, fontSize: 11, fontWeight: 700,
                            color: canListOpportunity ? C.white : C.textTert,
                            cursor: canListOpportunity ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <i className="ti ti-layout-grid" style={{ fontSize: 12 }} />List
                        </button>
                      </ActionTooltip>
                    </div>
                  }
                  style={{ marginBottom: 0, height: '100%' }}
                >
                  <OpportunitiesList items={opportunities.slice(0, CAPS.opportunities)} selectedIds={selectedOpportunityIds} onToggle={toggleOpportunitySelection} />
                </SectionCard>
              );
              return usingSampleOpportunities
                ? <SampleCard style={{ flex: '0 0 300px' }}>{opportunitiesCard}</SampleCard>
                : <div style={{ flex: '0 0 300px' }}>{opportunitiesCard}</div>;
            })()}

            {(() => {
              const notReadyCard = (
                <SectionCard
                  title={`Not Ready (${notReadyUnits.length})`}
                  icon="ti-alert-triangle"
                  action={notReadyUnits.length > CAPS.notReady
                    ? <SeeAllLink count={notReadyUnits.length} onClick={() => setSeeAllSection('notReady')} /> : null}
                  style={{ marginBottom: 0, height: '100%' }}
                >
                  <NotReadyList items={notReadyUnits.slice(0, CAPS.notReady)} propertyName={propertyName} onView={pid => navigate(`/pm-portal/properties/${pid}`)} sample={usingSampleNotReady} />
                </SectionCard>
              );
              return usingSampleNotReady
                ? <SampleCard style={{ flex: '0 0 330px' }}>{notReadyCard}</SampleCard>
                : <div style={{ flex: '0 0 330px' }}>{notReadyCard}</div>;
            })()}

            {(() => {
              const draftCard = (
                <SectionCard
                  title="Draft Listings"
                  icon="ti-file-text"
                  action={draftGroups.length > CAPS.draftListings
                    ? <SeeAllLink count={draftListingsTotal} onClick={() => setSeeAllSection('draftListings')} /> : null}
                  style={{ marginBottom: 0, height: '100%' }}
                >
                  <DraftListingsMatrix groups={draftGroups.slice(0, CAPS.draftListings)} onResume={pid => navigate(`/pm-portal/properties/${pid}`)} sample={usingSampleDrafts} />
                </SectionCard>
              );
              return usingSampleDrafts
                ? <SampleCard style={{ flex: '1 1 auto', minWidth: 0 }}>{draftCard}</SampleCard>
                : <div style={{ flex: '1 1 auto', minWidth: 0 }}>{draftCard}</div>;
            })()}
          </div>

          {/* Ready to List — last, full width */}
          {(() => {
            const readyToListCard = (
              <SectionCard
                title={`Ready to List (${readyToList.length})`}
                icon="ti-clipboard-check"
                action={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {readyToList.length > CAPS.readyToList && <SeeAllLink count={readyToList.length} onClick={() => setSeeAllSection('readyToList')} />}
                    <ActionTooltip text={bulkListTooltip}>
                      <button
                        disabled={!canBulkList}
                        onClick={() => canBulkList && navigate(`/pm-portal/properties/${[...selectedReadyPropertyIds][0]}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                          background: canBulkList ? C.primary : '#F1F5F9',
                          border: `1px solid ${canBulkList ? C.primary : C.border}`,
                          borderRadius: 7, fontFamily: F.body, fontSize: 11, fontWeight: 700,
                          color: canBulkList ? C.white : C.textTert,
                          cursor: canBulkList ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <i className="ti ti-stack-2" style={{ fontSize: 12 }} />
                        List Selected{selectedReadyUnits.length > 0 ? ` (${selectedReadyUnits.length})` : ''}
                      </button>
                    </ActionTooltip>
                  </div>
                }
              >
                <ReadyToListTable
                  rows={readyToList.slice(0, CAPS.readyToList)} propertyName={propertyName}
                  onList={pid => navigate(`/pm-portal/properties/${pid}`)}
                  selectedIds={selectedReadyIds} onToggle={toggleReadySelection}
                  sample={usingSampleReadyToList}
                />
              </SectionCard>
            );
            return usingSampleReadyToList ? <SampleCard>{readyToListCard}</SampleCard> : readyToListCard;
          })()}

        </div>
      </div>

      {/* "See All" popups — full, unpaginated list per section, scrolled vertically */}
      <SeeAllModal open={seeAllSection === 'needsAttention'} onClose={() => setSeeAllSection(null)} title="Needs Attention" icon="ti-bell-ringing" count={NEEDS_ATTENTION_ITEMS.length} widthPct={40}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {NEEDS_ATTENTION_ITEMS.map(item => <NeedsAttentionRow key={item.key} item={item} />)}
        </div>
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'activeListings'} onClose={() => setSeeAllSection(null)} title="Active Listings" icon="ti-list-check" count={activeListings.length} widthPct={58}>
        <ActiveListingsTable rows={activeListings} propertyName={propertyName} onView={setSummaryUnit} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'opportunities'} onClose={() => setSeeAllSection(null)} title="Property Listing Opportunities" icon="ti-building-community" count={opportunities.length} widthPct={40}>
        <OpportunitiesList items={opportunities} selectedIds={selectedOpportunityIds} onToggle={toggleOpportunitySelection} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'notReady'} onClose={() => setSeeAllSection(null)} title="Not Ready to List" icon="ti-alert-triangle" count={notReadyUnits.length} widthPct={40}>
        <NotReadyList items={notReadyUnits} propertyName={propertyName} onView={pid => navigate(`/pm-portal/properties/${pid}`)} sample={usingSampleNotReady} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'draftListings'} onClose={() => setSeeAllSection(null)} title="Draft Listings" icon="ti-file-text" count={draftListingsTotal} widthPct={58}>
        <DraftListingsMatrix groups={draftGroups} onResume={pid => navigate(`/pm-portal/properties/${pid}`)} sample={usingSampleDrafts} />
      </SeeAllModal>

      <SeeAllModal open={seeAllSection === 'readyToList'} onClose={() => setSeeAllSection(null)} title="Ready to List" icon="ti-clipboard-check" count={readyToList.length} widthPct={58}>
        <ReadyToListTable
          rows={readyToList} propertyName={propertyName}
          onList={pid => navigate(`/pm-portal/properties/${pid}`)}
          selectedIds={selectedReadyIds} onToggle={toggleReadySelection}
          sample={usingSampleReadyToList}
        />
      </SeeAllModal>
    </div>
  );
}
