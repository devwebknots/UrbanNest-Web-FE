// src/pages/Landlord/Listing/LandlordListingsOverview.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Landlord Portal — Listings dashboard. Built after the PM Portal's own
// 7-section Listings Overview (PMListingsOverview.jsx), but deliberately
// NOT a port of it — the user explicitly asked for something lean, scoped
// to what a self-managing Landlord (a handful of units, no staff) actually
// needs day to day, not what an Org PM triaging dozens/hundreds of units
// across a staff hierarchy needs. Three things were cut on purpose:
//
//   - Portfolio Coverage donut — a coverage-percentage breakdown only earns
//     its keep at PM scale. With a handful of units a Landlord can just
//     read the list.
//   - Opportunities (properties with 2+ ready units worth bundling into a
//     Multi-Unit listing) — a portfolio-optimization suggestion. A Landlord
//     already knows their own few units.
//   - Bulk "List Selected" / checkboxes — marginal value below a few dozen
//     rows; every row here just gets its own direct action instead.
//
// What's kept, in priority order a Landlord would actually check them:
// Active Listings (with the real promotion-plan countdown — the single
// most Landlord-relevant piece of this, since renewal is easy to forget),
// Ready to List (a nudge for units sitting un-published), Not Ready (why a
// unit can't list yet, in plain language), and Drafts (in-progress wizard
// submissions, one line each — no property-grouped matrix).
//
// Also unlike PMListingsOverview.jsx, this file has NO sample/mock-data
// fallback layer. That machinery existed there because Session 47 built
// the PM page against mock data first and had to migrate it onto a real
// backend later without breaking the six revisions of approved layout.
// This page was built directly against the real endpoint from day one, so
// an empty section here just renders a plain, honest empty state instead
// of watermarked placeholder content.
//
// Reuses GET /listings/pm-overview/ (getPMListingsOverview in this same
// folder's listingApi.js) as-is — that endpoint's name is a holdover from
// being built for the PM dashboard first, but its actual scoping
// (rbac.views._get_visible_creator_ids) was always portal-agnostic: a
// non-OrgPMS-staff user (which includes every Landlord) just gets
// [user.id], the same as a plain created_by=request.user filter. No
// backend change was needed to stand this page up. Renaming the endpoint
// to something portal-neutral is a reasonable future cleanup, not done
// here to avoid touching already-verified PM code for a cosmetic gain.
//
// Navigation mostly follows this portal's own existing convention (window
// .location.href, not react-router's useNavigate — see NavF.jsx /
// LandlordUnitDetailPage.jsx) rather than PMListingsOverview's, with two
// Session 48 exceptions below. "View Unit" on a not-ready unit still goes
// to the real, already-existing LandlordUnitDetailPage (/landlord-portal/
// property/:id/unit/:uid). "List" on a Ready to List unit jumps straight
// into that unit's wizard (step-1) since the exact unit is already known —
// no bundling question to resolve first, unlike PM's Opportunities flow.
//
// Session 48 fix — Resume/View. Two bugs reported from live testing:
//   1. "Resume" on a draft was landing on the property page instead of
//      back inside the wizard step it was left on. Root cause: the wizard
//      steps (ListingStep1_Property.jsx/ListingStep3_Promote.jsx for
//      individual, ListMultiStep1_Property.jsx/ListMultiStep3_Promote.jsx
//      for multi-unit) all read their target listingId/propertyListingId
//      from react-router location.state, NOT from a URL param — step 3+
//      has a hard guard that bounces if that state is missing. A plain
//      window.location.href (hard navigation) can't carry router state, so
//      "Resume" could only ever land on step 1 of a NEW listing, which the
//      property page then made look like a redirect. Fixed by switching
//      Resume specifically to useNavigate() with the correct step URL and
//      { listingId }/{ propertyListingId } state, branching on d.type —
//      pm_listings_overview's drafts payload was extended (Core Backend/
//      listings/views.py) to include listingId/unitId (individual) and
//      propertyListingId (multi) for exactly this.
//   2. "View" on an Active Listing opened LandlordUnitDetailPage instead
//      of a listing summary, unlike PM/Org PM's "View" which opens a
//      ListingSummaryModal. User's explicit choice ("Match PM exactly")
//      was full parity, not just a Landlord-flavored subset — so this page
//      now has its own ListingSummaryModal/buildSummaryDetails, ported
//      from PMListingsOverview.jsx's (same structure, same Step 1-4
//      sections, same illustrative fallback content for fields with no
//      backend source yet — deposit/description/amenities/photoCount/
//      leadContact/showingSettings/listingId/compliance — real values used
//      wherever this page's data already has them: rent, publishedDate,
//      availableDate, bedBath, sqft, channel, expiresAt, promotionPlan).
//      This is the one deliberate exception to the "no fabricated content"
//      line above — scoped to this modal only, per the user's own choice.
//
// Session 48 addition — Listing Activity matrix. User ask: a per-listing
// engagement panel (Views/Saves/Applications/trend) to the left of Active
// Listings, 40%/60% split. No real analytics pipeline exists anywhere in
// the backend yet (confirmed — this is the exact open question LST-20 in
// the backlog flags as unanswered: "how much of the Views/Leads/Showings/
// Applications/Leases pipeline is must-have for v1"), so — user's explicit
// choice — this renders sample data, same full-color-plus-watermark
// convention PMListingsOverview.jsx already established for its own
// sample sections (never greyed out, a visible "Sample Data" tag instead),
// just implemented locally here rather than importing that page's
// SampleCard/SampleTag machinery (this file deliberately has none of
// that — see the "No sample/mock-data fallback layer" paragraph above;
// this is the one deliberate, scoped exception to it, not a reversal of
// it). The numbers are seeded off each real unit's id (see
// _sampleActivityFor below) so they stay stable across reloads instead of
// re-randomizing on every render — a real number for a real listing, a
// fake statistic. Rows mirror activeListings exactly (same real units,
// same real Property/Unit labels) — no activity shows for a unit with no
// real active listing, matching Active Listings' own empty state.
//
// 2026-11-23 — REDESIGNED on Design System v2 (design: Downloads/image 84.png). Layout only came from the
// design; every style is a v2 token / shared v2 component:
//   PageShell (NavF + TopBar)
//   ListingsHero   same styles + height as the dashboard / portfolio heroes (pill · title · subtitle · one stat row),
//                  banner art (Downloads/image 85.png, text removed) as the container background ·
//                  Create Listing button under the stats (like the dashboard hero's buttons)
//   toolbar        TabBar underline (All · Active · Ready to List · Not Ready · Drafts, with counts) │
//                  search field (always shown) · ActionTray "Options" toggle sliding out Filter (property) · Sort: Latest
//   open table     (no card — sits on the page like Portfolio's My Properties) ONE DataTable for every listing state — Property / unit (photo · name · type │ unit) ·
//                  Rent · Status (status dot pill) · Published · Views · Saves · Applications · Trend · row action (small primary button)
//                  (Active → View · Ready → List · Not ready → View Unit · Draft → Resume — same actions as before)
// Data wiring is unchanged: GET /listings/pm-overview/, the same predicates, the same Resume router state
// and the same ListingSummaryModal (still on the old landlordTokens styles, like the other v2 pages' modals).
// Views / Saves / Applications / Trend stay SAMPLE figures for active listings (seeded per unit — see below).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../../components/layout';
import {
  ListingsHero, TabBar, ActionTray, DataTable, FilterMenu, EmptyState, CountUp,
} from '../../../components/ui';
import {
  C2, TONES2, ACCENT2, accentTone, F2, FS2, SP2, SZ2, LAYOUT2, UI2,
} from '../../../constants';
import { C, F } from '../landlordTokens';
import { getPMListingsOverview } from './listingApi';
import heroImage from '../../../assets/landlord/listings-hero.jpg';   // Downloads/image 85.png with its baked-in text removed
import propertyPlaceholder from '../../../assets/landlord/property-placeholder.jpg';

// ── Legacy style used only by the ListingSummaryModal / CountdownBadge below (old landlordTokens) ──
const M = {
  pill: (bg, col) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: bg, color: col, fontFamily: F.sans, whiteSpace: 'nowrap' }),
};


function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}
function fmtRent(r) {
  return r != null ? `$${Number(r).toLocaleString()}` : '—';
}

// ── Promotion-plan countdown — same design as PMListingsOverview's
// CountdownBadge (real Listing.expires_at, diffed against "now" on every
// render, three-tier danger/amber/blue urgency banding), re-themed to
// Landlord's tokens rather than imported (PM's version isn't exported, and
// the two pages use entirely different color systems — see landlordTokens
// .js vs. PM's own local C/F block). ─────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr); then.setHours(0, 0, 0, 0);
  const today = new Date();       today.setHours(0, 0, 0, 0);
  return Math.round((then - today) / 86400000);
}
function countdownConfig(days) {
  if (days === null) return null;
  if (days < 0)   return { bg: C.redLight, color: C.red, label: `Expired ${Math.abs(days)}d ago` };
  if (days === 0) return { bg: C.redLight, color: C.red, label: 'Expires today' };
  if (days <= 3)  return { bg: C.redLight, color: C.red, label: `${days}d left` };
  if (days <= 7)  return { bg: C.amberLight, color: C.amber, label: `${days}d left` };
  return { bg: C.blueLight, color: C.blueDark, label: `${days}d left` };
}
function CountdownBadge({ expiresAt }) {
  const cfg = countdownConfig(daysUntil(expiresAt));
  if (!cfg) return <span style={{ fontSize: 12.5, color: C.txtMuted }}>—</span>;
  return (
    <span style={M.pill(cfg.bg, cfg.color)}>
      <i className="ti ti-clock" style={{ fontSize: 10.5 }} />{cfg.label}
    </span>
  );
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ── Listing Summary modal (Session 48 — see file header's "View" note).
// Ported from PMListingsOverview.jsx's ActionTooltip/DeadEndButton/
// buildSummaryDetails/SummaryRow/CountdownSummaryRow/ListingSummaryModal,
// re-themed to this page's C/F tokens. Kept as a near-literal port rather
// than "simplified for Landlord" — the user's explicit ask was parity with
// PM's experience, not a leaner Landlord-scoped version of it. ────────────
function ActionTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', fontFamily: F.sans, fontSize: 10.5, fontWeight: 600, padding: '5px 9px', borderRadius: 5, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 400 }}>
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
        background: '#F1F5F9', border: `1px solid ${C.cardBdr}`, borderRadius: 7,
        fontFamily: F.sans, fontSize: small ? 11 : 12, fontWeight: 700,
        color: C.txtMuted, cursor: 'not-allowed',
        ...style,
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 13 }} />}
        {label}
      </button>
    </ActionTooltip>
  );
}

// promotionPlan/expiresAt/deposit/applicationFee: prefer the real values
// (this page's units already carry rent/securityDeposit/applicationFee
// straight from pm_listings_overview's own ListingRentalTerms/
// ListingSaleTerms read, Session 51 fix) — only true for a real active
// listing. Everything else here (description, amenities, photoCount,
// leadContact, showingSettings, listingId, compliance) has no backend
// source yet and stays illustrative regardless of data source — exact same
// scope/behavior as PM's own buildSummaryDetails. When there's no real
// expiresAt, fall back to publishedDate + the illustrative plan's 30 days
// so the countdown row still shows something instead of a dash.
//
// Session 51 live-testing fix (Idex 3 / units A1+A2) — `deposit` used to be
// fabricated client-side as `Math.round(u.rent * 1.5)`, never a real read of
// any stored field; `u.rent` itself used to be Unit.rent_amount, a separate
// Property/Unit-level asking-price field that can legitimately disagree with
// what was actually published. Both are now the real per-Listing
// ListingRentalTerms/ListingSaleTerms values the backend rollup resolves —
// the same row the public marketplace itself reads — so this modal can no
// longer show numbers that don't match what's actually live.
function buildSummaryDetails(u) {
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

function SummaryRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.cardBdr}`, gap: 12 }}>
      <span style={{ fontFamily: F.sans, fontSize: 12, color: C.txtSec, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: F.sans, fontSize: 12, color: C.txtPrimary, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// Same row layout as SummaryRow, but the value is the color-coded
// CountdownBadge instead of plain text.
function CountdownSummaryRow({ label, expiresAt }) {
  if (!expiresAt) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.cardBdr}`, gap: 12 }}>
      <span style={{ fontFamily: F.sans, fontSize: 12, color: C.txtSec, flexShrink: 0 }}>{label}</span>
      <CountdownBadge expiresAt={expiresAt} />
    </div>
  );
}

function ListingSummaryModal({ unit, propertyName, onClose }) {
  if (!unit) return null;
  const d = buildSummaryDetails(unit);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.cardBg, borderRadius: 14, width: 620, maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.cardBdr}`, position: 'sticky', top: 0, background: C.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: F.sans, fontSize: 18, fontWeight: 700, color: C.txtPrimary }}>{propertyName} · Unit {unit.unit}</h2>
            <p style={{ margin: '3px 0 0', fontFamily: F.sans, fontSize: 11.5, color: C.txtMuted }}>{d.listingId} · Published {fmtDate(unit.publishedDate)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.txtMuted, fontSize: 18 }}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: '18px 26px' }}>
          <div style={{ fontFamily: F.sans, fontSize: 10.5, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 6px' }}>Step 1 — Property &amp; Unit</div>
          <SummaryRow label="Property" value={propertyName} />
          <SummaryRow label="Unit" value={unit.unit} />
          <SummaryRow label="Bed / Bath" value={unit.bedBath} />
          <SummaryRow label="Square Footage" value={unit.sqft != null ? `${unit.sqft} sqft` : null} />

          <div style={{ fontFamily: F.sans, fontSize: 10.5, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Step 2 — Listing Details</div>
          <SummaryRow label="Rent" value={fmtRent(unit.rent)} />
          <SummaryRow label="Security Deposit" value={fmtRent(d.deposit)} />
          <SummaryRow label="Application Fee" value={fmtRent(d.applicationFee)} />
          <SummaryRow label="Available From" value={fmtDate(unit.availableDate)} />
          <SummaryRow label="Photos" value={`${d.photoCount} uploaded`} />
          <p style={{ margin: '8px 0 0', fontFamily: F.sans, fontSize: 12, color: C.txtSec, lineHeight: 1.6 }}>{d.description}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {d.amenities.map(a => (
              <span key={a} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: '#F1F5F9', color: C.txtSec, fontFamily: F.sans }}>{a}</span>
            ))}
          </div>

          <div style={{ fontFamily: F.sans, fontSize: 10.5, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Step 3 — Promote</div>
          <SummaryRow label="Distribution Channel" value={unit.channel} />
          <SummaryRow label="Promotion Plan" value={d.promotionPlan} />
          <CountdownSummaryRow label="Time Remaining" expiresAt={d.expiresAt} />
          <SummaryRow label="Lead Contact" value={d.leadContact} />
          <SummaryRow label="Showing Settings" value={d.showingSettings} />

          <div style={{ fontFamily: F.sans, fontSize: 10.5, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Step 4 — Compliance &amp; Publish</div>
          {d.compliance.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <i className="ti ti-circle-check" style={{ fontSize: 14, color: C.green }} />
              <span style={{ fontFamily: F.sans, fontSize: 12, color: C.txtPrimary }}>{c.label}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 26px', borderTop: `1px solid ${C.cardBdr}`, display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: C.cardBg }}>
          <DeadEndButton label="Cancel Ad" icon="ti-ban" tooltip="No listing cancel/status-change endpoint exists in the backend yet." style={{ flex: 1, justifyContent: 'center' }} />
          <button onClick={onClose} style={{ flex: 1, height: 40, background: C.blue, border: 'none', borderRadius: 8, fontFamily: F.sans, fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Listing Activity — sample engagement numbers (Session 48, see the file
// header's own note on why this is sample-data-by-design). Seeded off the
// real unit id via a plain deterministic hash (not Math.random()) so a
// given listing shows the same numbers on every reload instead of
// re-rolling each render — a real listing, a stable-but-fake statistic. ──
function _seeded01(seed) {
  const x = Math.sin(seed * 999.73) * 10000;
  return x - Math.floor(x);
}
function _sampleActivityFor(unitId) {
  const r1 = _seeded01(unitId * 1.1);
  const r2 = _seeded01(unitId * 2.3);
  const r3 = _seeded01(unitId * 3.7);
  const r4 = _seeded01(unitId * 4.9);
  return {
    views: Math.round(40 + r1 * 260),
    saves: Math.round(2 + r2 * 28),
    applications: Math.round(r3 * 8),
    // Skewed positive (most live listings trend up), still allows a
    // realistic dip: roughly -28% to +52%.
    trendPct: Math.round((r4 - 0.35) * 80),
  };
}

// ── Pure helpers over the raw `units` array — same predicates as
// PMListingsOverview's (isReadyToListUnit/isActiveListingUnit/
// isNotReadyUnit), redefined locally rather than imported since neither
// file exports them and the two pages' data shapes/scope are otherwise
// identical (both consume the same pm-overview response). ───────────────
// hasInProgressListing excludes a unit already mid-wizard from Ready to
// List — see PMListingsOverview.jsx's identical fix (same session) for the
// full rationale; found live against this same account (Sarah Palin,
// Idex5 A1/A2/A3).
const isReadyToListUnit = (u) => u.status === 'DRAFT' && !u.hasInProgressListing && (u.readiness === 'LIST_READY' || u.readiness === 'READY_WITH_WARNINGS');
const isActiveListingUnit = (u) => u.readiness === 'ACTIVE';
const isNotReadyUnit = (u) => u.readiness === 'NOT_READY' || u.readiness === 'NOT_ELIGIBLE';

function computeStats(units, drafts) {
  return {
    active: units.filter(isActiveListingUnit).length,
    ready: units.filter(isReadyToListUnit).length,
    notReady: units.filter(isNotReadyUnit).length,
    // Unpublished units (mirrors PM's own stat-tile definition — "no active
    // listing right now", not the same count as drafts.length below, which
    // is specifically in-progress wizard submissions; a unit can be
    // DRAFT-status with no wizard ever started on it).
    unpublished: units.filter(u => u.status === 'DRAFT').length,
    draftsInProgress: drafts.length,
  };
}

// Builds the wizard step URL + router state for a given draft, branching
// on d.type. Falls back to the property page (old behavior) if the
// backend fields this needs aren't present — e.g. a draft fetched before
// the Session 48 payload fix, or a genuinely malformed row — rather than
// navigating into a wizard step that will just bounce on its own missing-
// state guard.
function _resumeTarget(d) {
  if (d.type === 'individual' && d.listingId != null && d.unitId != null) {
    return {
      path: `/landlord-portal/property/${d.propertyId}/unit/${d.unitId}/list/step-${d.step}`,
      state: { listingId: d.listingId },
    };
  }
  if (d.type === 'multi' && d.propertyListingId != null) {
    return {
      path: `/landlord-portal/property/${d.propertyId}/list-multi/step-${d.step}`,
      state: { propertyListingId: d.propertyListingId },
    };
  }
  return { path: `/landlord-portal/property/${d.propertyId}`, state: undefined };
}

// ── Status per listing kind (v2 tones — no yellow: drafts use the violet accent) ──
const KIND = {
  active:   { label: 'Active',    tone: TONES2.success },
  ready:    { label: 'Ready',     tone: TONES2.primary },
  notReady: { label: 'Not ready', tone: TONES2.error },
  draft:    { label: 'Draft',     tone: accentTone(ACCENT2.violet) },
};

const SORTS = [
  { value: 'latest',    label: 'Latest' },
  { value: 'rentHigh',  label: 'Rent: high to low' },
  { value: 'rentLow',   label: 'Rent: low to high' },
  { value: 'property',  label: 'Property A–Z' },
];

const ts = (d) => (d ? new Date(d).getTime() : 0);

// ── Page-specific layout (tokens only) ──────────────────────────────────────
const S = {
  // Tabs left · search / filter / sort right, on one line (wraps under on narrow widths)
  toolbar:   { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: SP2.md, flexWrap: 'wrap', marginBottom: LAYOUT2.cardHeaderGap },
  tabsWrap:  { flex: '1 1 auto', minWidth: 0 },
  search:    { ...UI2.searchField, width: SZ2.searchSm, maxWidth: '100%' },
  searchIcon:{ fontSize: FS2.lg, color: C2.textSecondary },
  input:     { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: F2.body, fontSize: FS2.base, color: C2.textPrimary },
  toolBtn:   { ...UI2.btn.soft },
  tableWrap: { minWidth: 0 },   // open section: no card background / shadow around the table
  rowBtn:    { ...UI2.btn.brand, ...UI2.btnSmStd },   // row action — standard small primary button (same width in every row)
  tools:     { ...UI2.row(LAYOUT2.inlineGap), marginLeft: 'auto', justifyContent: 'flex-end', flexWrap: 'wrap' },   // stays on the right, also when it wraps under the tabs
  menuWrap:  { flexShrink: 0 },      // FilterMenu with a custom trigger spans its parent — this keeps it button-sized   // Filter / Sort — secondary (soft) buttons on a light surface
  // Property / unit cell: photo · name + type │ "Unit" + number
  unitCell:  { ...UI2.row(SP2.md), minWidth: 0 },
  thumb:     { ...UI2.thumb, width: SZ2.assetThumb.w, height: SZ2.assetThumb.h, flexShrink: 0 },
  nameCol:   { flex: 1, minWidth: 0 },   // fills the cell → the Unit block sits at the same x in every row
  name:      { ...UI2.text.rowTitle, ...UI2.truncate },
  type:      { ...UI2.text.meta, ...UI2.truncate },
  // fixed width (same in every row) → the divider and "Unit" sit at the same x whatever the unit number
  unitCol:   { width: SZ2.tableFitCol, boxSizing: 'border-box', paddingLeft: SP2.md, borderLeft: `${SZ2.hairline}px solid ${C2.divider}`, flexShrink: 0, minWidth: 0 },
  unitLabel: { ...UI2.text.meta },
  unitNo:    { ...UI2.text.rowTitle, ...UI2.truncate },
  metric:    { ...UI2.row(SP2.xs), color: C2.textPrimary },
  metricIcon:{ fontSize: FS2.lg, color: C2.textSecondary },
  dash:      { color: C2.textMuted },
  trend:     (up) => UI2.delta(up),   // standard delta: coloured arrow + figure, no box
};

// ── Small cells ─────────────────────────────────────────────────────────────
const Dash = () => <span style={S.dash}>—</span>;

function Metric({ icon, value }) {
  return (
    <span style={S.metric}>
      <i className={`ti ${icon}`} style={S.metricIcon} aria-hidden="true" />{value}
    </span>
  );
}

function StatusCell({ row }) {
  const k = KIND[row.kind];
  return (
    <span style={UI2.statusPill(k.tone)} title={row.reason || undefined}>
      <span style={UI2.statusDot(k.tone)} />{k.label}
    </span>
  );
}

function UnitCell({ row }) {
  return (
    <div style={S.unitCell}>
      <img
        src={row.photo || propertyPlaceholder}
        alt=""
        style={S.thumb}
        onError={e => { if (e.currentTarget.src !== propertyPlaceholder) e.currentTarget.src = propertyPlaceholder; }}
      />
      <div style={S.nameCol}>
        <div style={S.name} title={row.propertyName}>{row.propertyName}</div>
        <div style={S.type}>{row.propertyType}</div>
      </div>
      <div style={S.unitCol}>
        <div style={S.unitLabel}>Unit</div>
        <div style={S.unitNo}>{row.unitNo}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function LandlordListingsOverview() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  // Active Listings "View" opens this instead of navigating away (Session 48).
  const [viewingUnit, setViewingUnit] = useState(null);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [propFilter, setPropFilter] = useState(null);   // property id (null = all)
  const [sort, setSort]         = useState('latest');

  useEffect(() => {
    let cancelled = false;
    getPMListingsOverview()
      .then(data => { if (!cancelled) { setOverview(data); setLoading(false); } })
      .catch(err => {
        console.error('LandlordListingsOverview: getPMListingsOverview() failed.', err);
        if (!cancelled) { setError(err.message || 'Could not load your listings.'); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  const properties = useMemo(() => overview?.properties ?? [], [overview]);
  const units      = useMemo(() => overview?.units ?? [], [overview]);
  const drafts     = useMemo(() => overview?.drafts ?? [], [overview]);

  const propertyName = (pid) => properties.find(p => p.id === pid)?.name || '—';

  const stats = computeStats(units, drafts);

  // Every listing state as ONE row shape for the table
  const rows = useMemo(() => {
    const base = (pid) => {
      const p = properties.find(x => x.id === pid) || {};
      return {
        propertyId: pid,
        propertyName: p.name || '—',
        propertyType: p.type || p.propertyType || p.property_type || 'Property',
        photo: p.photo || p.coverPhoto || p.cover_photo || p.image || null,
      };
    };
    const unitRow = (kind, u, extra = {}) => ({
      ...base(u.propertyId), key: `${kind}-${u.id}`, kind, unit: u, unitNo: u.unit, rent: u.rent,
      date: u.publishedDate || null, sortDate: ts(u.publishedDate || u.availableDate), ...extra,
    });
    return [
      ...units.filter(isActiveListingUnit).map(u => unitRow('active', u, { activity: _sampleActivityFor(u.id) })),
      ...units.filter(isReadyToListUnit).map(u => unitRow('ready', u)),
      ...units.filter(isNotReadyUnit).map(u => unitRow('notReady', u, { reason: (u.notReadyReason || 'Not ready yet').replace(/^STUB:/, '') })),
      ...drafts.map(d => ({
        ...base(d.propertyId), key: `draft-${d.id}`, kind: 'draft', draft: d,
        unitNo: (d.unitLabel || '—').replace(/^Unit\s*/i, ''), rent: d.rent ?? null,
        date: null, step: `Step ${d.step} of 4`, sortDate: ts(d.lastEdited),
      })),
    ];
  }, [units, drafts, properties]);

  const TABS = [
    { id: 'all',      label: 'All Listings' },
    { id: 'active',   label: `Active (${stats.active})` },
    { id: 'ready',    label: `Ready to List (${stats.ready})` },
    { id: 'notReady', label: `Not Ready (${stats.notReady})` },
    { id: 'draft',    label: `Drafts (${stats.draftsInProgress})` },
  ];

  const q = search.trim().toLowerCase();
  const shown = rows
    .filter(r => tab === 'all' || r.kind === tab)
    .filter(r => propFilter == null || r.propertyId === propFilter)
    .filter(r => !q || `${r.propertyName} ${r.propertyType} unit ${r.unitNo}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'rentHigh') return (b.rent ?? -1) - (a.rent ?? -1);
      if (sort === 'rentLow')  return (a.rent ?? Infinity) - (b.rent ?? Infinity);
      if (sort === 'property') return a.propertyName.localeCompare(b.propertyName);
      return b.sortDate - a.sortDate;
    });

  const resume = (d) => { const { path, state } = _resumeTarget(d); navigate(path, { state }); };
  // Row action — the same one-click actions the page had before the redesign:
  // Active → View (listing summary) · Ready → List (wizard step 1) · Not ready → View Unit · Draft → Resume
  const actionFor = (r) => {
    if (r.kind === 'active') return { label: 'View', onClick: () => setViewingUnit(r.unit) };
    if (r.kind === 'ready') return { label: 'List', onClick: () => { window.location.href = `/landlord-portal/property/${r.propertyId}/unit/${r.unit.id}/list/step-1`; } };
    if (r.kind === 'notReady') return { label: 'View Unit', onClick: () => { window.location.href = `/landlord-portal/property/${r.propertyId}/unit/${r.unit.id}`; } };
    return { label: 'Resume', onClick: () => resume(r.draft) };
  };

  // Column widths (fr of the spare width) follow the content: wide property cell, mid-size rent / status / date,
  // narrow counters — every column left-aligned so each heading sits straight above its values with even gaps.
  const COLUMNS = [
    { key: 'unit',   label: 'Property / unit', type: 'primary', width: 1.8, render: r => <UnitCell row={r} /> },
    { key: 'rent',   label: 'Rent',      type: 'amount', align: 'left', width: 0.9, fit: true, render: r => (r.rent != null ? fmtRent(r.rent) : <Dash />) },
    { key: 'status', label: 'Status',    type: 'status', width: 0.9, fit: true, render: r => <StatusCell row={r} /> },
    { key: 'pub',    label: 'Published', type: 'secondary', width: 1.1, fit: true,
      render: r => (r.date ? <Metric icon="ti-calendar" value={fmtDate(r.date)} /> : r.step ? r.step : <Dash />) },
    { key: 'views',  label: 'Views',     type: 'text', width: 0.7, fit: true, render: r => (r.activity ? <Metric icon="ti-eye" value={r.activity.views} /> : <Dash />) },
    { key: 'saves',  label: 'Saves',     type: 'text', width: 0.7, fit: true, render: r => (r.activity ? <Metric icon="ti-bookmark" value={r.activity.saves} /> : <Dash />) },
    { key: 'apps',   label: 'Applications', type: 'text', width: 0.9, fit: true, render: r => (r.activity ? <Metric icon="ti-users" value={r.activity.applications} /> : <Dash />) },
    { key: 'trend',  label: 'Trend',     type: 'status', width: 0.7, fit: true,
      render: r => {
        if (!r.activity) return <Dash />;
        const up = r.activity.trendPct >= 0;
        return (
          <span style={S.trend(up)}>
            <i className={`ti ${up ? 'ti-arrow-up-right' : 'ti-arrow-down-right'}`} aria-hidden="true" />
            {up ? '+' : ''}{r.activity.trendPct}%
          </span>
        );
      } },
    { key: 'action', label: '', type: 'status', render: r => { const a = actionFor(r); return <button type="button" className="un2-btn" style={S.rowBtn} onClick={a.onClick}>{a.label}</button>; } },
  ];

  const HERO_STATS = [
    { icon: 'ti-speakerphone',     label: 'Active',             value: loading ? '—' : <CountUp value={stats.active} />, tone: TONES2.success },
    { icon: 'ti-stack-2',          label: 'Ready to List',      value: loading ? '—' : <CountUp value={stats.ready} />, tone: TONES2.primary },
    { icon: 'ti-alert-triangle',   label: 'Not Ready',          value: loading ? '—' : <CountUp value={stats.notReady} />, tone: TONES2.error },
    { icon: 'ti-file-text',        label: 'Drafts in Progress', value: loading ? '—' : <CountUp value={stats.draftsInProgress} />, tone: accentTone(ACCENT2.violet) },
  ];

  const propertyOptions = properties.map(p => ({ value: p.id, label: p.name }));
  const sortLabel = SORTS.find(s => s.value === sort)?.label || 'Latest';
  const filtered = !!q || propFilter != null || tab !== 'all';

  return (
    <PageShell
      animate
      activePage="listings"
      title="UrbanNest Landlord"
      searchPlaceholder="Search properties, units, tenants…"
    >
      {/* ── HERO: ListingsHero — same styles + height as the dashboard / portfolio heroes, banner art as background ── */}
      <ListingsHero
        eyebrow="Listings Overview"
        title="Listings"
        subtitle="What's live, what's ready, and what needs attention."
        image={heroImage}
        stats={HERO_STATS}
        actions={(
          // Create Listing — the page's CTA before the redesign, same route (pick a property → unit);
          // placed like the dashboard hero's buttons (row under the stats, standard brand button)
          <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => { window.location.href = '/landlord-portal/portfolio'; }}>
            <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Create Listing
          </button>
        )}
      />

      {error && (
        <div style={UI2.errorBanner}>
          <i className="ti ti-alert-circle" aria-hidden="true" /> Could not load your listings — {error}
        </div>
      )}

      {/* ── LISTINGS: tabs │ search · property filter · sort, then one table ── */}
      <section className="un2-cq">
        <div style={S.toolbar}>
          <div style={S.tabsWrap}>
            <TabBar variant="underline" ariaLabel="Listing filters" value={tab} onChange={setTab} tabs={TABS} />
          </div>
          {/* Search box, then the "Options" toggle on its right — Filter + Sort slide out between them
              (same ActionTray as the property / unit detail headers; compact = soft toggle on a light surface) */}
          {/* un2-tray-tools / un2-tray-search (utilities.css): the search field slides away while Options is open */}
          <div className="un2-tray-tools" style={S.tools}>
            <label className="un2-focus-ring un2-tray-search" style={S.search}>
              <i className="ti ti-search" style={S.searchIcon} aria-hidden="true" />
              <input
                style={S.input}
                type="search"
                placeholder="Search listings…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search listings"
              />
            </label>
            <ActionTray compact label="Options">
              <div style={S.menuWrap}>
                <FilterMenu
                  title="Filter by property" allLabel="All properties" ariaLabel="Filter listings by property"
                  options={propertyOptions} value={propFilter} onChange={setPropFilter}
                  triggerStyle={S.toolBtn}
                  trigger={
                    <>
                      <i className="ti ti-filter" style={UI2.btnIcon} aria-hidden="true" />
                      <span className="un2-hide-narrow">Filter</span>
                      {propFilter != null && <span style={UI2.statusDot(TONES2.primary)} aria-hidden="true" />}
                    </>
                  }
                />
              </div>
              <div style={S.menuWrap}>
                <FilterMenu
                  title="Sort by" ariaLabel="Sort listings" showAll={false}
                  options={SORTS} value={sort} onChange={v => setSort(v || 'latest')}
                  triggerStyle={S.toolBtn}
                  trigger={open => (
                    <>
                      <i className="ti ti-arrows-sort" style={UI2.btnIcon} aria-hidden="true" />
                      <span className="un2-hide-narrow">Sort: {sortLabel}</span>
                      <i className="ti ti-chevron-down" style={{ ...UI2.btnIcon, transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
                    </>
                  )}
                />
              </div>
            </ActionTray>
          </div>
        </div>

        <div style={S.tableWrap}>
          {loading ? (
            <div style={UI2.stack(SP2.md)}>
              {[0, 1, 2].map(i => <div key={i} className="un2-skel" style={UI2.skeleton('100%', SZ2.assetThumb.h)} />)}
            </div>
          ) : (
            <DataTable
              columns={COLUMNS}
              rows={shown}
              rowKey={r => r.key}
              empty={
                <EmptyState
                  icon="ti-speakerphone"
                  title={filtered ? 'No listings match' : 'No listings yet'}
                  text={filtered ? 'Try another tab, search or filter.' : 'Add a property and its units to start listing them.'}
                >
                  {!filtered && (
                    <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => navigate('/landlord-portal/portfolio')}>
                      <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Create listing
                    </button>
                  )}
                </EmptyState>
              }
            />
          )}
        </div>
      </section>

      {viewingUnit && (
        <ListingSummaryModal
          unit={viewingUnit}
          propertyName={propertyName(viewingUnit.propertyId)}
          onClose={() => setViewingUnit(null)}
        />
      )}
    </PageShell>
  );
}
