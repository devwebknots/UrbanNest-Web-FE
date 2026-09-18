// src/pages/Landlord/Listing/LandlordUnitSelection.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Unit Selection / Readiness gate — the real "List Ready" gate for the
// "List Multi Units" entry button (backlog LST-8, replacing the old
// `units.length < 2` placeholder in LandlordPropertyDetailPage.jsx).
//
// Rendered as a MODAL (not a routed page) — same convention as
// LandlordPropertyDetailPage.jsx's own FilterModal/BulkAddServiceModal
// (S.overlay backdrop + centered card, backdrop click closes). Changed from
// an earlier full-page version after live testing: with only a handful of
// units, a full page read as mostly empty space. Takes `propId` + `onClose`
// as props instead of reading the route — LandlordPropertyDetailPage.jsx
// mounts/unmounts it via a `showUnitSelection` boolean rather than
// navigating to it, so there's no dedicated route for this screen in App.js.
//
// Shows every unit on this property with its real Listing Readiness result
// (A6's GET /properties/<pk>/units/<uid>/readiness/ engine — seeded rules
// from seed_readiness_rules.py) and lets the landlord choose which units to
// include, rather than the wizard assuming "all of them". Design approved
// against a reviewed wireframe (Design canvas artifact, "Unit Readiness —
// Wireframe") — colors/layout here use the real landlordTokens palette and
// real field names instead of that wireframe's illustrative mock data. The
// wireframe's side-sliding breakdown panel was replaced with an inline
// expand-in-place row (click the badge) once this became a modal — a modal
// on top of a modal is worse UX than a row that just grows.
//
// Draft-vs-Active handling (added after a live bug report): a unit that
// already has ANY Listing row — DRAFT/PENDING_PAYMENT/ACTIVE — used to show
// as a single dead-end "Already Listed" badge with no way back into a
// still-unpublished draft. properties/serializers.py's UnitListSerializer
// now exposes `active_listing_status` / `active_listing_id` /
// `active_property_listing_id` alongside the pre-existing `has_active_listing`
// boolean (which is untouched — ListMultiUnits.jsx's "Add Units" picker
// still filters on it exactly as before) so this screen can tell a genuinely
// published listing apart from the landlord's own unfinished draft and offer
// a real "Resume Draft →" action for the latter instead of a dead label.
//
// Routing on "List Selected Units →":
//  - exactly 1 unit checked → Individual Listing wizard, same entry point
//    LandlordUnitDetailPage's "List on Marketplace" button already uses
//    (/landlord-portal/property/:id/unit/:uid/list/step-1) — no router
//    state needed, that wizard resolves everything from the URL params.
//  - 2+ units checked → Multi-Unit wizard Step 1
//    (/landlord-portal/property/:id/list-multi/step-1), carrying the
//    selection forward as `preselectedUnitIds` router state. Step 1 still
//    creates/resumes the PropertyListing group itself (so the landlord can
//    still freely choose Rent/Sale there — that choice locks once the group
//    exists, so it must stay Step 1's call, not this screen's) and simply
//    relays `preselectedUnitIds` through to Step 2 unchanged; Step 2
//    auto-attaches them via createUnitListing() on load instead of making
//    the landlord re-pick the same units through "Add Units". See both
//    files' own header notes for the exact relay.
//
// Only List Ready / Ready-with-Warnings units are selectable (matches the
// wireframe's `selectable` flag) — since a checkbox can never be enabled for
// anything else, "N units checked" and "N ready units checked" are the same
// number, so — unlike the wireframe's own draft logic, which separately
// counted strict LIST_READY units and could under-count a warning-only
// selection — routing here just uses the plain selected count.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, F } from '../landlordTokens';
import { getProperty, getPropertyUnits, getUnitReadiness } from './listingApi';
import { getPropertyListing, createUnitListing, deleteUnitListing } from './propertyListingApi';

const STATUS_META = {
  LIST_READY: {
    label: 'List Ready', dot: C.green, bg: C.greenLight, color: C.greenDark, selectable: true,
    bannerBg: C.greenLight, bannerColor: C.greenDark,
    bannerText: 'All checks passed. This unit is ready to list.',
  },
  READY_WITH_WARNINGS: {
    label: 'Ready · Warnings', dot: C.amber, bg: C.amberLight, color: C.amber, selectable: true,
    bannerBg: C.amberLight, bannerColor: C.amber,
    bannerText: 'This unit can be listed now. Warnings are optional improvements, not blockers.',
  },
  NOT_READY: {
    label: 'Not Ready', dot: C.red, bg: C.redLight, color: C.red, selectable: false,
    bannerBg: C.redLight, bannerColor: C.red,
    bannerText: 'One or more required checks failed. Resolve them to enable listing.',
  },
  NOT_ELIGIBLE: {
    label: 'Not Eligible', dot: C.txtMuted, bg: C.stdBg, color: C.stdTx, selectable: false,
    bannerBg: C.stdBg, bannerColor: C.stdTx,
    bannerText: "This unit fails an eligibility requirement and can't be listed until it's resolved.",
  },
  // Genuinely published (Listing.status === 'ACTIVE') — a real dead end from
  // this screen; managing/withdrawing a live listing is out of scope here.
  ALREADY_LISTED: {
    label: 'Already Listed', dot: C.txtMuted, bg: C.stdBg, color: C.stdTx, selectable: false,
    bannerBg: C.stdBg, bannerColor: C.stdTx,
    bannerText: 'This unit already has an active listing — remove it from that listing first.',
  },
  // Listing.status is DRAFT/PENDING_PAYMENT AND it's part of a multi-unit
  // group (active_property_listing_id set) that the whole "Resume" footer
  // button below is currently resuming. Selectable — the checkbox is how
  // the landlord adds/removes this unit from the draft — and the badge
  // itself does nothing (no per-row Resume; see the external Resume
  // button in the footer instead).
  IN_DRAFT_GROUP: {
    label: 'In Draft', dot: C.blue, bg: C.blueLight, color: C.blueDark, selectable: true,
    bannerBg: C.blueLight, bannerColor: C.blueDark,
    bannerText: 'Part of your in-progress draft listing below. Uncheck to remove it, or leave it checked and hit Resume Draft.',
  },
  // Listing.status is DRAFT/PENDING_PAYMENT but NOT part of the group this
  // screen is resuming (either an ungrouped single-unit draft, or a group
  // draft for a *different* PropertyListing than the one being resumed
  // here) — the landlord's own unfinished attempt, not a dead end, but not
  // something this screen's checkboxes/Resume button can reconcile. Not
  // selectable for a NEW pick here (it's already committed to its own
  // draft), but clicking it resumes that other draft directly instead of
  // just sitting there disabled — see resumeDraft() below.
  LISTING_DRAFT: {
    label: 'Draft · In Progress', dot: C.blue, bg: C.blueLight, color: C.blueDark, selectable: false, actionable: true,
    bannerBg: C.blueLight, bannerColor: C.blueDark,
    bannerText: "You already started a listing for this unit but haven't published it yet.",
  },
  // The readiness call itself failed (network/5xx) — fails closed rather
  // than silently treating an unreadable result as ready.
  UNKNOWN: {
    label: 'Unknown', dot: C.txtMuted, bg: C.stdBg, color: C.stdTx, selectable: false,
    bannerBg: C.stdBg, bannerColor: C.stdTx,
    bannerText: "This unit's readiness couldn't be checked right now — try reloading.",
  },
};

const S = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, boxSizing: 'border-box' },
  modalBox: {
    background: '#fff', borderRadius: 14, width: 'min(900px, 100%)', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: F.sans,
    boxShadow: '0 24px 60px rgba(13,27,46,0.28)',
  },
  modalHdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 26px 16px', borderBottom: `1px solid ${C.cardBdr}`, flexShrink: 0, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: C.txtPrimary, margin: 0 },
  modalSub: { fontSize: 12.5, color: C.txtSec, margin: '4px 0 0' },
  modalClose: { background: 'none', border: 'none', fontSize: 22, color: C.txtMuted, cursor: 'pointer', lineHeight: 1, padding: 2, flexShrink: 0 },

  stats: { display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 26px 0', flexShrink: 0 },
  statChip: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '7px 12px' },
  statDot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }),
  statNum: { fontSize: 13, fontWeight: 700, color: C.txtPrimary },
  statLbl: { fontSize: 11.5, color: C.txtSec },

  body: { flex: 1, overflowY: 'auto', padding: '16px 26px' },
  centerMsg: { padding: '40px 0', textAlign: 'center', color: C.txtSec, fontSize: 13 },
  table: { border: `1px solid ${C.cardBdr}`, borderRadius: 10, overflow: 'hidden' },
  rowGrid: { display: 'grid', gridTemplateColumns: '40px 82px 1fr 120px 100px 130px 190px', alignItems: 'center', columnGap: 10 },
  thRow: { padding: '10px 16px', background: '#f8fafc', borderBottom: `1px solid ${C.cardBdr}` },
  th: { fontSize: 10, fontWeight: 700, color: C.txtSec, textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { padding: '12px 16px', borderBottom: `1px solid ${C.stdBg}` },
  unitNum: { fontSize: 13.5, fontWeight: 700, color: C.txtPrimary },
  specs: { fontSize: 12.5, color: C.txtSec },
  occ: { fontSize: 12.5, color: C.txtSec },
  badge: (m) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, background: m.bg, color: m.color, border: 'none', borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 700, cursor: (m.selectable === undefined && !m.actionable) ? 'default' : 'pointer', width: 'fit-content', fontFamily: F.sans }),
  checkbox: { width: 16, height: 16 },

  detail: (m) => ({ background: m.bannerBg, color: m.bannerColor, borderRadius: 8, padding: '10px 14px', margin: '0 16px 12px', fontSize: 12, lineHeight: 1.5 }),
  ruleRow: { display: 'flex', gap: 9, padding: '8px 0', borderBottom: `1px solid rgba(0,0,0,0.06)` },
  ruleName: { fontSize: 12.5, fontWeight: 600 },
  ruleSev: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.04, textTransform: 'uppercase', border: '1px solid currentColor', opacity: 0.6, borderRadius: 5, padding: '1px 6px', marginLeft: 7 },
  ruleDetail: { fontSize: 11.5, marginTop: 2, opacity: 0.85 },
  resumeLink: { fontSize: 11.5, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', marginLeft: 6 },

  footer: { flexShrink: 0, borderTop: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px', gap: 12 },
  footerMsg: { fontSize: 12.5, color: C.txtSec },
  footerBtns: { display: 'flex', alignItems: 'center', gap: 10 },
  // Height/radius match the rest of the Listing wizard's standardized
  // footer buttons (LS.btn in listingWizardShared.jsx — 32px / 10px radius,
  // locked across every Individual + Multi-Unit screen), so this modal's
  // footer doesn't look subtly off next to the screens it hands off to.
  // Border is always a real 1px (transparent when a variant doesn't want one
  // visible) rather than 'none' on some variants and a thicker colored one
  // on others — there's no global box-sizing:border-box reset in this app,
  // so a variant-only border changes that button's total rendered height
  // (the same reason listingWizardShared.jsx's LS.btn carries a permanent
  // `1px solid transparent`). Keeping it uniform here is what makes this
  // modal's Resume/List buttons come out exactly 32px tall, flush with
  // every other Listing-wizard footer button instead of a pixel taller.
  btn: { height: 32, padding: '0 18px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: F.sans, border: '1px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnPrimary: { background: C.blue, color: '#fff' },
  btnDisabled: { background: C.cardBdr, color: '#fff', cursor: 'not-allowed' },
  btnOutline: { background: '#fff', color: C.blueDark, border: `1px solid ${C.blue}` },
  btnOutlineDisabled: { background: '#fff', color: C.txtMuted, border: `1px solid ${C.cardBdr}`, cursor: 'not-allowed' },
  resumeError: { fontSize: 11.5, color: C.red, marginTop: 6 },
};

function RuleIcon({ passed, severity }) {
  const color = passed ? C.greenDark : severity === 'WARNING' ? C.amber : C.red;
  if (passed) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" />
      </svg>
    );
  }
  if (severity === 'WARNING') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
        <path d="M12 3l9 16H3L12 3z" /><path d="M12 10v4" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

export default function LandlordUnitSelection({ propId, onClose }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const [openUnitId, setOpenUnitId] = useState(null);

  // Resume-mode state — set when this property already has an in-progress
  // multi-unit draft (a grouped Listing in DRAFT/PENDING_PAYMENT). See the
  // header note above for why the whole group is reconciled through one
  // external "Resume Draft →" button instead of per-row Resume badges.
  const [resumeGroupId, setResumeGroupId] = useState(null);
  const [resumeListingType, setResumeListingType] = useState(null);
  const [originalDraftIds, setOriginalDraftIds] = useState([]);
  const [resolvingResume, setResolvingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [, units] = await Promise.all([
          getProperty(propId),
          getPropertyUnits(propId),
        ]);
        if (cancelled) return;

        // One readiness call per unit that isn't already committed to some
        // Listing (draft or active) — an accepted N+1 tradeoff for a
        // property's realistic unit count, same convention already used by
        // ListMultiUnits.jsx's per-row fetches.
        const enriched = await Promise.all((units || []).map(async (u) => {
          if (u.active_listing_status === 'ACTIVE') {
            return { ...u, overall: 'ALREADY_LISTED', rules: [] };
          }
          if (u.active_listing_status === 'DRAFT' || u.active_listing_status === 'PENDING_PAYMENT') {
            // Provisionally LISTING_DRAFT — reclassified to IN_DRAFT_GROUP
            // just below once we know which group (if any) is "the" one
            // this screen resumes. A single unit can't tell that on its own.
            return { ...u, overall: 'LISTING_DRAFT', rules: [] };
          }
          try {
            const r = await getUnitReadiness(propId, u.id);
            return { ...u, overall: r.overall_result, rules: r.rules || [] };
          } catch (e) {
            return { ...u, overall: 'UNKNOWN', rules: [], readinessError: e.message };
          }
        }));
        if (cancelled) return;

        // A property only ever has one in-flight multi-unit draft at a time
        // in practice (Multi-Unit Step 1 resumes/creates a single DRAFT
        // PropertyListing per property — see ListMultiStep1_Property.jsx),
        // so take whichever grouped draft unit we see first as "the" group
        // this screen offers to resume. A draft unit with a DIFFERENT (or
        // no) property_listing id is left as plain LISTING_DRAFT — still
        // actionable via its own per-row Resume, just not something this
        // screen's checkboxes/Resume button can reconcile.
        let groupId = null;
        for (const u of enriched) {
          if (u.overall === 'LISTING_DRAFT' && u.active_property_listing_id) {
            groupId = u.active_property_listing_id;
            break;
          }
        }

        const finalRows = enriched.map(u => (
          groupId && u.overall === 'LISTING_DRAFT' && u.active_property_listing_id === groupId
            ? { ...u, overall: 'IN_DRAFT_GROUP' }
            : u
        ));

        setRows(finalRows);
        setResumeGroupId(groupId);

        if (groupId) {
          const draftIds = finalRows.filter(u => u.overall === 'IN_DRAFT_GROUP').map(u => u.id);
          setOriginalDraftIds(draftIds);
          // Pre-check every unit already in the draft — unchecking one and
          // hitting Resume is how the landlord removes it.
          setSelected(prev => {
            const next = { ...prev };
            draftIds.forEach(id => { next[id] = true; });
            return next;
          });

          try {
            const group = await getPropertyListing(groupId);
            if (!cancelled) setResumeListingType(group.listing_type);
          } catch (e) {
            if (!cancelled) setResumeError("Couldn't load this draft's details — try reopening this screen.");
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Could not load this property's units.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [propId]);

  const toggle = (unit) => {
    const meta = STATUS_META[unit.overall] || STATUS_META.UNKNOWN;
    if (!meta.selectable) return;
    setSelected(prev => ({ ...prev, [unit.id]: !prev[unit.id] }));
  };

  const selectedIds = Object.keys(selected).filter(id => selected[id]).map(Number);

  // The "List Selected Units →" fresh-listing flow only ever acts on units
  // NOT already part of the draft group being resumed — a unit already in
  // that group has a Listing row already; it's added/removed from the
  // group via the Resume Draft button below, never re-submitted here.
  // When there's no resumable group at all (the common case), every row's
  // overall is something other than 'IN_DRAFT_GROUP', so this is simply
  // equivalent to the plain selectedIds/selectedCount from before.
  const freshSelectedIds = selectedIds.filter(id => {
    const row = rows.find(r => r.id === id);
    return row && row.overall !== 'IN_DRAFT_GROUP';
  });
  const freshSelectedCount = freshSelectedIds.length;
  const freshSelectedUnits = rows.filter(r => freshSelectedIds.includes(r.id));

  const counts = rows.reduce((acc, r) => {
    acc[r.overall] = (acc[r.overall] || 0) + 1;
    return acc;
  }, {});

  let footerMsg = 'Select one or more ready units to continue.';
  if (resumeGroupId) {
    const inDraftChecked = rows.filter(r => r.overall === 'IN_DRAFT_GROUP' && selected[r.id]).length;
    footerMsg = `${inDraftChecked} unit${inDraftChecked === 1 ? '' : 's'} in your draft`;
    if (freshSelectedCount > 0) {
      footerMsg += ` · ${freshSelectedCount} new unit${freshSelectedCount === 1 ? '' : 's'} selected`;
    }
  } else if (freshSelectedCount === 1) {
    footerMsg = `Unit ${freshSelectedUnits[0].unit_number} selected.`;
  } else if (freshSelectedCount > 1) {
    footerMsg = `${freshSelectedCount} units selected.`;
  }

  const ctaLabel = freshSelectedCount === 1
    ? `List Unit ${freshSelectedUnits[0]?.unit_number ?? ''} →`
    : 'List Together as Multi-Unit →';

  // Resumes the landlord's own unfinished draft for this unit instead of
  // starting a new one. Individual wizard's Step 1 (ListingStep1_Property.jsx)
  // only reads `listingId` from router state — with no fallback lookup of
  // its own (unlike the Multi-Unit wizard's Step 1) — so it MUST be passed
  // here, or Continue would create a second, duplicate Listing for a unit
  // that already has one.
  const resumeDraft = (unit) => {
    if (unit.active_property_listing_id) {
      navigate(`/landlord-portal/property/${propId}/list-multi/step-1`, {
        state: { propertyListingId: unit.active_property_listing_id },
      });
    } else if (unit.active_listing_id) {
      navigate(`/landlord-portal/property/${propId}/unit/${unit.id}/list/step-1`, {
        state: { listingId: unit.active_listing_id },
      });
    }
  };

  const handleBadgeClick = (unit) => {
    const meta = STATUS_META[unit.overall] || STATUS_META.UNKNOWN;
    if (meta.actionable) {
      resumeDraft(unit);
      return;
    }
    if (unit.overall === 'ALREADY_LISTED') return; // nothing actionable from here
    setOpenUnitId(prev => (prev === unit.id ? null : unit.id));
  };

  const handleListSelected = () => {
    if (freshSelectedCount === 0) return;
    onClose();
    if (freshSelectedCount === 1) {
      navigate(`/landlord-portal/property/${propId}/unit/${freshSelectedIds[0]}/list/step-1`);
      return;
    }
    navigate(`/landlord-portal/property/${propId}/list-multi/step-1`, {
      state: { preselectedUnitIds: freshSelectedIds },
    });
  };

  // Reconciles the draft group against the current checkbox state, then
  // continues straight into the wizard at Step 2 — deliberately skipping
  // Step 1 (which only exists to let the landlord pick Rent/Sale and
  // create/resume the group itself; both are already settled once a group
  // exists) and deliberately NOT passing `preselectedUnitIds`, so
  // ListMultiUnits.jsx's own auto-attach-on-load effect stays inert and
  // doesn't try to re-add units this reconciliation already handled.
  const handleResume = async () => {
    if (resolvingResume) return;
    setResumeError('');

    const toRemove = originalDraftIds.filter(id => !selected[id]);
    const toAdd = freshSelectedIds;
    const remainingCount = originalDraftIds.length - toRemove.length + toAdd.length;

    if (remainingCount === 0) {
      setResumeError('A draft listing needs at least one unit — check at least one unit before continuing.');
      return;
    }
    if (toAdd.length > 0 && !resumeListingType) {
      setResumeError("Still loading this draft's details — try again in a moment.");
      return;
    }

    setResolvingResume(true);
    try {
      await Promise.all([
        ...toRemove.map(id => {
          const row = rows.find(r => r.id === id);
          return row?.active_listing_id ? deleteUnitListing(row.active_listing_id) : Promise.resolve();
        }),
        ...toAdd.map(id => createUnitListing({
          unit: id,
          listing_type: resumeListingType,
          property_listing: resumeGroupId,
        })),
      ]);

      onClose();
      navigate(`/landlord-portal/property/${propId}/list-multi/step-2`, {
        state: { propertyListingId: resumeGroupId },
      });
    } catch (e) {
      setResumeError(e.message || "Couldn't update the draft — try again.");
      setResolvingResume(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose} role="presentation">
      <div style={S.modalBox} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="unit-selection-title">
        <div style={S.modalHdr}>
          <div>
            <h2 id="unit-selection-title" style={S.modalTitle}>Units for Listing</h2>
            <p style={S.modalSub}>Choose which units to include — only List Ready units can be selected.</p>
          </div>
          <button style={S.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>

        {loading && <div style={S.centerMsg}>Loading units…</div>}
        {!loading && loadError && (
          <div style={S.centerMsg}>{loadError}</div>
        )}

        {!loading && !loadError && (
          <>
            <div style={S.stats}>
              <div style={S.statChip}><span style={S.statDot(C.green)} /><span style={S.statNum}>{counts.LIST_READY || 0}</span><span style={S.statLbl}>List Ready</span></div>
              <div style={S.statChip}><span style={S.statDot(C.amber)} /><span style={S.statNum}>{counts.READY_WITH_WARNINGS || 0}</span><span style={S.statLbl}>Ready w/ Warnings</span></div>
              <div style={S.statChip}><span style={S.statDot(C.red)} /><span style={S.statNum}>{counts.NOT_READY || 0}</span><span style={S.statLbl}>Not Ready</span></div>
              <div style={S.statChip}><span style={S.statDot(C.txtMuted)} /><span style={S.statNum}>{counts.NOT_ELIGIBLE || 0}</span><span style={S.statLbl}>Not Eligible</span></div>
            </div>

            <div style={S.body}>
              <div style={S.table}>
                <div style={{ ...S.rowGrid, ...S.thRow }}>
                  <span />
                  <span style={S.th}>Unit</span>
                  <span style={S.th}>Beds / Baths</span>
                  <span style={S.th}>Floor Plan</span>
                  <span style={S.th}>Carpet Area</span>
                  <span style={S.th}>Occupancy</span>
                  <span style={S.th}>Readiness</span>
                </div>

                {rows.map(u => {
                  const meta = STATUS_META[u.overall] || STATUS_META.UNKNOWN;
                  const isOpen = openUnitId === u.id;
                  return (
                    <div key={u.id}>
                      <div style={{ ...S.rowGrid, ...S.tr, opacity: meta.selectable ? 1 : 0.82 }}>
                        <input
                          type="checkbox"
                          style={S.checkbox}
                          checked={!!selected[u.id]}
                          disabled={!meta.selectable}
                          onChange={() => toggle(u)}
                          aria-label={`Select unit ${u.unit_number}`}
                        />
                        <span style={S.unitNum}>{u.unit_number}</span>
                        <span style={S.specs}>{u.total_rooms ?? '—'} bd / {u.total_baths ?? '—'} ba</span>
                        <span style={S.specs}>{u.floor_plan_name || '—'}</span>
                        <span style={S.specs}>{u.carpet_area ? `${u.carpet_area} sqft` : '—'}</span>
                        <span style={S.occ}>{u.occupancy_status || u.status || '—'}</span>
                        <button style={S.badge(meta)} onClick={() => handleBadgeClick(u)}>
                          <span style={S.statDot(meta.dot)} />{meta.label}
                          {meta.actionable && <span style={{ marginLeft: 2 }}>· Resume →</span>}
                        </button>
                      </div>

                      {isOpen && (
                        <div style={S.detail(meta)}>
                          <div style={{ marginBottom: u.rules.length ? 8 : 0 }}>
                            {u.readinessError ? `Couldn't load readiness: ${u.readinessError}` : meta.bannerText}
                          </div>
                          {u.rules.map((rule, i) => (
                            <div key={rule.code || i} style={S.ruleRow}>
                              <RuleIcon passed={rule.passed} severity={rule.severity} />
                              <div style={{ flex: 1 }}>
                                <span style={S.ruleName}>{rule.name}</span>
                                <span style={S.ruleSev}>{rule.severity === 'BLOCKING' ? 'Blocking' : 'Warning'}</span>
                                {rule.detail_reason && <div style={S.ruleDetail}>{rule.detail_reason}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {rows.length === 0 && (
                  <div style={{ padding: 20, fontSize: 12.5, color: C.txtMuted }}>This property has no units yet.</div>
                )}
              </div>
            </div>
          </>
        )}

        <div style={S.footer}>
          <div>
            <span style={S.footerMsg}>{footerMsg}</span>
            {resumeError && <div style={S.resumeError}>{resumeError}</div>}
          </div>
          <div style={S.footerBtns}>
            {resumeGroupId && (
              <button
                style={{ ...S.btn, ...(resolvingResume ? S.btnOutlineDisabled : S.btnOutline) }}
                onClick={handleResume}
                disabled={resolvingResume}
              >
                {resolvingResume ? 'Updating draft…' : 'Resume Draft →'}
              </button>
            )}
            <button
              style={{ ...S.btn, ...(freshSelectedCount === 0 ? S.btnDisabled : S.btnPrimary) }}
              onClick={handleListSelected}
              disabled={freshSelectedCount === 0}
            >
              {freshSelectedCount === 0 ? 'List Selected Units →' : ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
