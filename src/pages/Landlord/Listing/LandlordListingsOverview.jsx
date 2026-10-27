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
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavF from '../../../components/layout/NavF';
import { C, F } from '../landlordTokens';
import { getPMListingsOverview } from './listingApi';

// ── Style tokens — local to this page, same convention as LandlordDashboard
// .jsx's own `S` object (not shared/exported there either). ──────────────
const S = {
  shell:   { display: 'flex', height: '100vh', fontFamily: F.sans, background: C.pageBg, overflow: 'hidden' },
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:  { background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  topbarTitle: { fontSize: 14, fontWeight: 600, color: C.txtPrimary, letterSpacing: 0.1 },
  content: { flex: 1, overflowY: 'auto', padding: '20px 24px 32px' },
  errBanner: { background: C.redLight, color: C.red, padding: '12px 18px', borderRadius: 8, fontSize: 13, marginBottom: 16 },

  pageHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  pageTitle:   { fontSize: 20, fontWeight: 700, color: C.txtPrimary, marginBottom: 3 },
  pageSub:     { fontSize: 12.5, color: C.txtMuted },
  createBtn:   { background: C.blue, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 15px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: F.sans },

  // Session 48 — row narrowed to 60% container width (40% shorter
  // horizontally, user ask), cards stay 4 equal columns within that.
  statRow:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20, width: '60%' },
  // Session 48 — status cards ~40% shorter (user ask): vertical padding
  // 13px → 8px, value/label font sizes and spacing scaled down to match,
  // same "shrink padding + type scale together" approach PMListingsOverview
  // used for its own stat-tile height passes.
  statCard: (accent) => ({ background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: '8px 16px' }),
  statNum:  { fontSize: 18, fontWeight: 700, color: C.txtPrimary, lineHeight: 1, marginBottom: 2 },
  statLbl:  { fontSize: 10, color: C.txtSec },

  card:      { background: C.cardBg, border: `1px solid ${C.cardBdr}`, borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
  cardHdr:   { padding: '14px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: C.txtPrimary, flex: 1 },
  cardBody:  { padding: '4px 18px 14px' },
  // Session 48 — Ready to List / Not Ready / Drafts moved into one row
  // (user ask: "positioning ... in the same line itself"), replacing the
  // prior twoCol (Ready to List + Not Ready) / full-width Drafts split.
  threeCol:  { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 },

  empty: { padding: '18px 0', fontSize: 12.5, color: C.txtMuted, textAlign: 'center' },

  th: { textAlign: 'left', padding: '8px 6px', fontFamily: F.sans, fontSize: 10.5, fontWeight: 700, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 6px', fontFamily: F.sans, fontSize: 12.5, color: C.txtSec, borderTop: `1px solid ${C.cardBdr}` },
  tdStrong: { padding: '10px 6px', fontFamily: F.sans, fontSize: 12.5, color: C.txtPrimary, fontWeight: 600, borderTop: `1px solid ${C.cardBdr}` },

  rowLink: { background: 'none', border: 'none', padding: 0, fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: C.blue, cursor: 'pointer' },
  pill: (bg, col) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: bg, color: col, fontFamily: F.sans, whiteSpace: 'nowrap' }),

  draftRow:   { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderTop: `1px solid ${C.cardBdr}` },
  draftDot:   { width: 6, height: 6, borderRadius: '50%', background: C.blue, flexShrink: 0 },
  draftMain:  { flex: 1, minWidth: 0 },
  draftTitle: { fontSize: 12.5, fontWeight: 600, color: C.txtPrimary },
  draftSub:   { fontSize: 11, color: C.txtMuted, marginTop: 1 },

  // ── Listing Activity matrix (Session 48) — a 40%/60% row, matrix on the
  // left, styled as a table matching Active Listings' own (S.th/S.td/
  // S.tdStrong, reused as-is rather than a bespoke card-row layout — user's
  // explicit ask, "display it the same way as Active Listings"). sampleBadge
  // follows PMListingsOverview's established "full-color content + a small
  // corner tag" sample-data convention, not a greyed-out treatment. ───────
  matrixRow:   { display: 'grid', gridTemplateColumns: '40% 60%', gap: 20, marginBottom: 20 },
  sampleBadge: { marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99, background: C.amberLight, color: C.amber, fontFamily: F.sans, whiteSpace: 'nowrap' },
};

// ── Readiness display config (Landlord palette equivalent of PM's
// READINESS_CFG). No stub-category handling needed here at all — those
// only ever appear inside a unit's real not-ready reason text below, which
// is opaque to this file either way. ─────────────────────────────────────
const READINESS_CFG = {
  LIST_READY:          { label: 'Ready',          bg: C.greenLight, color: C.greenDark },
  READY_WITH_WARNINGS: { label: 'Ready (warn)',   bg: C.amberLight, color: C.amber },
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
    <span style={S.pill(cfg.bg, cfg.color)}>
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

// ── Small shared bits ────────────────────────────────────────────────────
function SectionCard({ title, icon, count, badge, children }) {
  return (
    <div style={S.card}>
      <div style={S.cardHdr}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 15, color: C.blue }} />}
        <span style={S.cardTitle}>{title}{typeof count === 'number' ? ` (${count})` : ''}</span>
        {badge}
      </div>
      <div style={S.cardBody}>{children}</div>
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div style={S.statCard(accent)}>
      <div style={S.statNum}>{value}</div>
      <div style={S.statLbl}>{label}</div>
    </div>
  );
}

// ── Listing Activity matrix (Session 48, sample data — see file header).
// Deliberately the same table shape as ActiveListingsTable below — same
// S.th/S.td/S.tdStrong tokens, same row-per-unit structure — per the
// user's explicit ask to display/design it the same way. ─────────────────
function ListingActivityMatrix({ rows, propertyName }) {
  if (rows.length === 0) return <p style={S.empty}>No activity yet — this fills in once a listing goes live.</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>{['Property', 'Unit', 'Views', 'Save', 'Application', 'Trend'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map(u => {
          const a = _sampleActivityFor(u.id);
          const up = a.trendPct >= 0;
          return (
            <tr key={u.id}>
              <td style={S.tdStrong}>{propertyName(u.propertyId)}</td>
              <td style={S.td}>Unit {u.unit}</td>
              <td style={S.td}>{a.views}</td>
              <td style={S.td}>{a.saves}</td>
              <td style={S.td}>{a.applications}</td>
              <td style={S.td}>
                <span style={S.pill(up ? C.greenLight : C.redLight, up ? C.greenDark : C.red)}>
                  <i className={`ti ${up ? 'ti-trending-up' : 'ti-trending-down'}`} style={{ fontSize: 10.5 }} />
                  {up ? '+' : ''}{a.trendPct}%
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Active Listings ──────────────────────────────────────────────────────
function ActiveListingsTable({ rows, propertyName, onView }) {
  if (rows.length === 0) return <p style={S.empty}>No active listings yet. Published units will show up here with their promotion countdown.</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>{['Property', 'Unit', 'Published', 'Channel', 'Expires', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map(u => (
          <tr key={u.id}>
            <td style={S.tdStrong}>{propertyName(u.propertyId)}</td>
            <td style={S.td}>Unit {u.unit}</td>
            <td style={S.td}>{fmtDate(u.publishedDate)}</td>
            <td style={S.td}>{u.channel || '—'}</td>
            <td style={S.td}><CountdownBadge expiresAt={u.expiresAt} /></td>
            <td style={{ ...S.td, textAlign: 'right' }}>
              {/* Session 48 fix — was window.location.href to LandlordUnitDetailPage;
                  now opens ListingSummaryModal, matching PM/Org PM's "View". */}
              <button style={S.rowLink} onClick={() => onView(u)}>View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Ready to List ────────────────────────────────────────────────────────
function ReadyToListRows({ rows, propertyName }) {
  if (rows.length === 0) return <p style={S.empty}>Nothing waiting to be listed right now.</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>{['Property', 'Unit', 'Rent', 'Status', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map(u => {
          const cfg = READINESS_CFG[u.readiness] || READINESS_CFG.LIST_READY;
          return (
            <tr key={u.id}>
              <td style={S.tdStrong}>{propertyName(u.propertyId)}</td>
              <td style={S.td}>Unit {u.unit}</td>
              <td style={S.td}>{fmtRent(u.rent)}</td>
              <td style={S.td}><span style={S.pill(cfg.bg, cfg.color)}>{cfg.label}</span></td>
              <td style={{ ...S.td, textAlign: 'right' }}>
                <button
                  style={{ ...S.rowLink, textDecoration: 'none' }}
                  onClick={() => { window.location.href = `/landlord-portal/property/${u.propertyId}/unit/${u.id}/list/step-1`; }}
                >
                  List →
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Not Ready ─────────────────────────────────────────────────────────────
function NotReadyRows({ rows, propertyName }) {
  if (rows.length === 0) return <p style={S.empty}>Nothing's blocked — every unit is either live or ready.</p>;
  return (
    <div>
      {rows.map(u => (
        <div key={u.id} style={{ padding: '10px 4px', borderTop: `1px solid ${C.cardBdr}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.txtPrimary }}>{propertyName(u.propertyId)} · Unit {u.unit}</span>
            <button style={S.rowLink} onClick={() => { window.location.href = `/landlord-portal/property/${u.propertyId}/unit/${u.id}`; }}>View Unit →</button>
          </div>
          <div style={{ fontSize: 11.5, color: C.txtMuted, marginTop: 2 }}>
            {(u.notReadyReason || 'Not ready yet').replace(/^STUB:/, '')}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Drafts — one line per in-progress wizard submission, no property
// grouping/matrix (that's the PM-scale version of this same data). ───────
// Session 48 fix — "Resume" now routes back into the exact wizard step the
// draft was left on, via useNavigate() + router state (see file header for
// the full root-cause writeup: the wizard steps require location.state,
// which a plain window.location.href can't carry). Individual drafts
// (d.type === 'individual') carry d.listingId/d.unitId from the backend;
// multi-unit drafts (d.type === 'multi') carry d.propertyListingId. Both
// were added to pm_listings_overview's drafts payload for this fix — a
// draft from a build predating that change would fall back to the
// property page rather than crash, same as the old behavior.
function DraftRows({ drafts, propertyName, onResume }) {
  if (drafts.length === 0) return <p style={S.empty}>No listings in progress.</p>;
  return (
    <div>
      {drafts.map(d => (
        <div key={d.id} style={S.draftRow}>
          <span style={S.draftDot} />
          <div style={S.draftMain}>
            <div style={S.draftTitle}>{propertyName(d.propertyId)} · {d.unitLabel}</div>
            <div style={S.draftSub}>Step {d.step} of 4 — {d.stepLabel} · last edited {fmtDate(d.lastEdited)}</div>
          </div>
          <button
            style={{ ...S.rowLink, flexShrink: 0 }}
            onClick={() => onResume(d)}
          >
            Resume →
          </button>
        </div>
      ))}
    </div>
  );
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

// ── Page ──────────────────────────────────────────────────────────────────
export default function LandlordListingsOverview() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  // Session 48 — Active Listings "View" opens this instead of navigating away.
  const [viewingUnit, setViewingUnit] = useState(null);

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

  const properties = overview?.properties ?? [];
  const units      = overview?.units ?? [];
  const drafts     = overview?.drafts ?? [];

  const propertyName = (pid) => properties.find(p => p.id === pid)?.name || '—';

  const stats = computeStats(units, drafts);
  const activeListings = units.filter(isActiveListingUnit);
  const readyToList    = units.filter(isReadyToListUnit);
  const notReadyUnits  = units.filter(isNotReadyUnit);

  return (
    <div style={S.shell}>
      <NavF activePage="listings" />

      <div style={S.main}>
        <header style={S.topbar}>
          <div style={S.topbarTitle}>UrbanNest Landlord</div>
        </header>

        <main style={S.content}>
          {error && (
            <div style={S.errBanner}>
              <i className="ti ti-alert-circle" aria-hidden="true" /> Could not load your listings — {error}
            </div>
          )}

          <div style={S.pageHead}>
            <div>
              <div style={S.pageTitle}>Listings</div>
              <div style={S.pageSub}>What's live, what's ready, and what needs attention.</div>
            </div>
            <button style={S.createBtn} onClick={() => { window.location.href = '/landlord-portal/portfolio'; }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} />Create Listing
            </button>
          </div>

          {loading ? (
            <p style={{ fontSize: 12.5, color: C.txtMuted }}>Loading…</p>
          ) : (
            <>
              <div style={S.statRow}>
                <StatTile label="Active" value={stats.active} accent={C.green} />
                <StatTile label="Ready to List" value={stats.ready} accent={C.blue} />
                <StatTile label="Not Ready" value={stats.notReady} accent={C.red} />
                <StatTile label="Drafts in Progress" value={stats.draftsInProgress} accent={C.amber} />
              </div>

              <div style={S.matrixRow}>
                <SectionCard title="Listing Activity" icon="ti-chart-bar" badge={<span style={S.sampleBadge}>Sample Data</span>}>
                  <ListingActivityMatrix rows={activeListings} propertyName={propertyName} />
                </SectionCard>
                <SectionCard title="Active Listings" icon="ti-list-check" count={activeListings.length}>
                  <ActiveListingsTable rows={activeListings} propertyName={propertyName} onView={setViewingUnit} />
                </SectionCard>
              </div>

              <div style={S.threeCol}>
                <SectionCard title="Ready to List" icon="ti-clipboard-check" count={readyToList.length}>
                  <ReadyToListRows rows={readyToList} propertyName={propertyName} />
                </SectionCard>
                <SectionCard title="Not Ready" icon="ti-alert-triangle" count={notReadyUnits.length}>
                  <NotReadyRows rows={notReadyUnits} propertyName={propertyName} />
                </SectionCard>
                <SectionCard title="Drafts" icon="ti-file-text" count={drafts.length}>
                  <DraftRows
                    drafts={drafts}
                    propertyName={propertyName}
                    onResume={(d) => {
                      const { path, state } = _resumeTarget(d);
                      navigate(path, { state });
                    }}
                  />
                </SectionCard>
              </div>
            </>
          )}
        </main>
      </div>

      {viewingUnit && (
        <ListingSummaryModal
          unit={viewingUnit}
          propertyName={propertyName(viewingUnit.propertyId)}
          onClose={() => setViewingUnit(null)}
        />
      )}
    </div>
  );
}
