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
//
// Session 2026-11-25 — Design System v2: presentation moved onto the standard ui/Modal (size lg, no photo panel
// so the table gets the width) — readiness summary pills · DataTable (Checkbox · unit · specs · readiness
// status button) · the opened unit's readiness breakdown as a ModalSection under the table (tinted banner +
// rule rows) · footer info = selection summary, note = resume error, Resume Draft (soft) + List (brand).
// Every piece of logic above / below (loading, readiness gate, draft-group resume, routing) is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalSection, DataTable, EmptyState, Checkbox } from '../../../components/ui';
import { C2, TONES2, ACCENT2, accentTone, FS2, FW2, SP2, SZ2, UI2, pad } from '../../../constants';
import { getProperty, getPropertyUnits, getUnitReadiness } from './listingApi';
import { getPropertyListing, createUnitListing, deleteUnitListing } from './propertyListingApi';

// Readiness → label + tone (UI2.statusPill: dot + coloured word) + selection rules + banner text.
// Same states / rules / texts as before; colours are the v2 status tones (warnings = violet — no amber / yellow).
const STATUS_META = {
  LIST_READY: {
    label: 'List Ready', tone: TONES2.success, selectable: true,
    bannerText: 'All checks passed. This unit is ready to list.',
  },
  READY_WITH_WARNINGS: {
    label: 'Ready · Warnings', tone: accentTone(ACCENT2.violet), selectable: true,
    bannerText: 'This unit can be listed now. Warnings are optional improvements, not blockers.',
  },
  NOT_READY: {
    label: 'Not Ready', tone: TONES2.error, selectable: false,
    bannerText: 'One or more required checks failed. Resolve them to enable listing.',
  },
  NOT_ELIGIBLE: {
    label: 'Not Eligible', tone: TONES2.neutral, selectable: false,
    bannerText: "This unit fails an eligibility requirement and can't be listed until it's resolved.",
  },
  // Genuinely published (Listing.status === 'ACTIVE') — a real dead end from
  // this screen; managing/withdrawing a live listing is out of scope here.
  ALREADY_LISTED: {
    label: 'Already Listed', tone: TONES2.neutral, selectable: false,
    bannerText: 'This unit already has an active listing — remove it from that listing first.',
  },
  // DRAFT/PENDING_PAYMENT AND part of the multi-unit group the footer's "Resume Draft" button resumes.
  // Selectable — the checkbox adds/removes the unit from that draft.
  IN_DRAFT_GROUP: {
    label: 'In Draft', tone: TONES2.primary, selectable: true,
    bannerText: 'Part of your in-progress draft listing below. Uncheck to remove it, or leave it checked and hit Resume Draft.',
  },
  // DRAFT/PENDING_PAYMENT but NOT in the group being resumed — not selectable for a new pick, but clicking the
  // badge resumes that other draft directly (resumeDraft below).
  LISTING_DRAFT: {
    label: 'Draft · In Progress', tone: TONES2.primary, selectable: false, actionable: true,
    bannerText: "You already started a listing for this unit but haven't published it yet.",
  },
  // The readiness call itself failed — fails closed rather than treating an unreadable result as ready.
  UNKNOWN: {
    label: 'Unknown', tone: TONES2.neutral, selectable: false,
    bannerText: "This unit's readiness couldn't be checked right now — try reloading.",
  },
};

// Summary pills above the table (same four counts as before)
const SUMMARY = [
  { key: 'LIST_READY',          label: 'List Ready' },
  { key: 'READY_WITH_WARNINGS', label: 'Ready w/ Warnings' },
  { key: 'NOT_READY',           label: 'Not Ready' },
  { key: 'NOT_ELIGIBLE',        label: 'Not Eligible' },
];

// Layout only — every look comes from UI2 / the v2 components
const S = {
  body:      { ...UI2.stack(SP2.lg) },
  summary:   { display: 'flex', flexWrap: 'wrap', gap: SP2.sm },
  sumPill:   (tone) => ({ ...UI2.pill(tone), gap: SP2.sm, padding: pad(SP2.xs, SP2.md) }),
  sumCount:  { fontWeight: FW2.semibold },
  unitNo:    { ...UI2.text.rowTitle, fontWeight: FW2.semibold },
  // readiness status as a button (opens the breakdown / resumes a draft) — the standard status pill look
  badge:     (m, open) => ({ ...UI2.statusPill(m.tone), border: 'none', background: 'none', padding: 0, cursor: m.actionable || m.selectable !== undefined ? 'pointer' : 'default', textDecoration: open ? 'underline' : 'none', textUnderlineOffset: SP2.xs }),
  chevron:   (open) => ({ ...UI2.btnIcon, fontSize: FS2.xs, transform: open ? 'rotate(180deg)' : 'none' }),
  // breakdown under the table
  banner:    (tone) => ({ ...UI2.tonePanel(tone), padding: pad(SP2.md, SP2.lg), fontSize: FS2.sm, color: tone.fg }),
  rule:      (first) => ({ ...UI2.kvRow(first), justifyContent: 'flex-start', alignItems: 'flex-start', gap: SP2.sm }),
  ruleIcon:  (color) => ({ fontSize: FS2.lg, color, flexShrink: 0 }),
  ruleName:  { ...UI2.text.rowTitle, fontWeight: FW2.medium },
  ruleSev:   (blocking) => ({ ...UI2.tag(blocking ? TONES2.error : accentTone(ACCENT2.violet)), marginLeft: SP2.sm }),
  ruleText:  { ...UI2.text.meta },
  skeleton:  { ...UI2.stack(SP2.md) },
};

// Rule result glyph — passed ✓ (green, real success) · warning △ (violet) · blocking ✕ (red)
function RuleIcon({ passed, severity }) {
  if (passed) return <i className="ti ti-circle-check" style={S.ruleIcon(TONES2.success.strong)} aria-hidden="true" />;
  if (severity === 'WARNING') return <i className="ti ti-alert-triangle" style={S.ruleIcon(ACCENT2.violet.fg)} aria-hidden="true" />;
  return <i className="ti ti-circle-x" style={S.ruleIcon(C2.errorDark)} aria-hidden="true" />;
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


  const openUnit = rows.find(r => r.id === openUnitId);
  const openMeta = openUnit ? (STATUS_META[openUnit.overall] || STATUS_META.UNKNOWN) : null;
  const canList = freshSelectedCount > 0;

  const COLUMNS = [
    { key: 'pick', label: '', fit: true,
      render: u => {
        const meta = STATUS_META[u.overall] || STATUS_META.UNKNOWN;
        return <Checkbox checked={!!selected[u.id]} disabled={!meta.selectable} onChange={() => toggle(u)} />;
      } },
    { key: 'unit', label: 'Unit', type: 'primary', fit: true, render: u => <span style={S.unitNo}>{u.unit_number}</span> },
    { key: 'specs', label: 'Beds / Baths', type: 'secondary', fit: true, render: u => `${u.total_rooms ?? '—'} bd / ${u.total_baths ?? '—'} ba` },
    { key: 'plan', label: 'Floor plan', type: 'secondary', fit: true, render: u => u.floor_plan_name || '—' },
    { key: 'area', label: 'Carpet area', type: 'secondary', fit: true, render: u => (u.carpet_area ? `${u.carpet_area} sqft` : '—') },
    { key: 'occ', label: 'Occupancy', type: 'secondary', fit: true, render: u => u.occupancy_status || u.status || '—' },
    { key: 'ready', label: 'Readiness', type: 'status', fit: true, align: 'right',
      render: u => {
        const meta = STATUS_META[u.overall] || STATUS_META.UNKNOWN;
        const open = openUnitId === u.id;
        const expandable = !meta.actionable && u.overall !== 'ALREADY_LISTED';
        return (
          <button type="button" style={S.badge(meta, open)} onClick={() => handleBadgeClick(u)}
            title={meta.actionable ? 'Resume this draft' : expandable ? 'Show the readiness checks' : meta.bannerText}>
            <span style={UI2.statusDot(meta.tone)} />{meta.label}
            {meta.actionable && ' · Resume →'}
            {expandable && <i className="ti ti-chevron-down" style={S.chevron(open)} aria-hidden="true" />}
          </button>
        );
      } },
  ];

  return (
    <Modal
      size="lg" media={false} icon="ti-list-check"
      title="Units for Listing"
      subtitle="Choose which units to include — only List Ready units can be selected."
      onClose={onClose}
      note={resumeError || undefined}
      info={footerMsg}
      footer={<>
        {resumeGroupId && (
          <button type="button" className="un2-btn" style={{ ...UI2.btn.soft, ...(resolvingResume ? UI2.btnOff : {}) }} onClick={handleResume} disabled={resolvingResume}>
            {resolvingResume ? 'Updating draft…' : <>Resume Draft <i className="ti ti-arrow-right" style={UI2.btnIcon} aria-hidden="true" /></>}
          </button>
        )}
        <button type="button" className="un2-btn" style={{ ...UI2.btn.brand, ...(canList ? {} : UI2.btnOff) }} onClick={handleListSelected} disabled={!canList}>
          {canList ? ctaLabel.replace(/ →$/, '') : 'List Selected Units'}
          <i className="ti ti-arrow-right" style={UI2.btnIcon} aria-hidden="true" />
        </button>
      </>}
    >
      {loading && (
        <div style={S.skeleton}>
          {[0, 1, 2].map(i => <div key={i} className="un2-skel" style={UI2.skeleton('100%', SZ2.field)} />)}
        </div>
      )}
      {!loading && loadError && <EmptyState icon="ti-alert-circle" text={loadError} />}

      {!loading && !loadError && (
        <div style={S.body}>
          {/* readiness summary — same four counts as before */}
          <div style={S.summary}>
            {SUMMARY.map(s => {
              const tone = STATUS_META[s.key].tone;
              return (
                <span key={s.key} style={S.sumPill(tone)}>
                  <span style={UI2.statusDot(tone)} />
                  <span style={S.sumCount}>{counts[s.key] || 0}</span>{s.label}
                </span>
              );
            })}
          </div>

          <DataTable
            columns={COLUMNS}
            rows={rows}
            rowKey={u => u.id}
            empty={<EmptyState icon="ti-home" text="This property has no units yet." />}
          />

          {/* the opened unit's readiness breakdown (was an expand-in-place row) */}
          {openUnit && openMeta && (
            <ModalSection icon="ti-checklist" title={`Readiness — Unit ${openUnit.unit_number}`} hint={openMeta.label}>
              <div style={S.banner(openMeta.tone)}>
                {openUnit.readinessError ? `Couldn't load readiness: ${openUnit.readinessError}` : openMeta.bannerText}
              </div>
              {openUnit.rules.map((rule, i) => (
                <div key={rule.code || i} style={S.rule(i === 0)}>
                  <RuleIcon passed={rule.passed} severity={rule.severity} />
                  <div style={UI2.minWidth0}>
                    <span style={S.ruleName}>{rule.name}</span>
                    <span style={S.ruleSev(rule.severity === 'BLOCKING')}>{rule.severity === 'BLOCKING' ? 'Blocking' : 'Warning'}</span>
                    {rule.detail_reason && <div style={S.ruleText}>{rule.detail_reason}</div>}
                  </div>
                </div>
              ))}
            </ModalSection>
          )}
        </div>
      )}
    </Modal>
  );
}
