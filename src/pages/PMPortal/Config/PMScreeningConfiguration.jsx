// src/pages/PMPortal/Config/PMScreeningConfiguration.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// PM Portal → Configuration → Screening Rules. Fills the reserved, previously
// unbuilt `screening-rules` nav slot in NavB.jsx (route
// /pm-portal/config/screening) — the exact PM-side counterpart to UN Admin's
// own Screening Configuration screen. "Session 68" — see
// screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
// (Claude Project), new Section 18, for the full review/decisions this build
// follows. Summarized here:
//
// ONE SHARED SCREEN FOR INDEPENDENT PM AND ORG PM. There is no separate
// "Independent PM portal" vs "Org PM portal" in this codebase — both personas
// already share one PMPortal (NavB.jsx, this Config/ folder), exactly like
// the existing PMListingReadiness.jsx precedent branches on persona rather
// than being two files. This screen does the same: `useAuth().user
// .active_persona === 'ORGANIZATIONAL_PM'` drives the one small visible
// difference (an "Organization Account" vs "Independent Account" badge);
// per the 2026-11-12 decision, override scope is account-level only for both
// — no per-property/node picker, unlike Listing Readiness.
//
// "SEE DEFAULTS, THEN CUSTOMIZE WHERE ALLOWED." Per the explicit request,
// opening this screen shows UrbanNest Admin's current saved screening policy
// first; a PM may then override any field UrbanNest Admin has marked
// PM-overridable. 18th sitting — now backed by the real
// rules_engine.tenant_screening API (see pmScreeningConfigApi.js):
// "seeing UrbanNest Admin's defaults" is `apiGetUNAdminConfig(loc)`, which
// resolves server-side against UN Admin's own record for that exact city
// first, falling back to UN Admin's Default — the exact same two-level
// fallback this screen's own `loadUNAdminConfig()` used to compute from a
// parsed localStorage blob, now computed by pm_views.py's
// `_resolve_un_admin_record` instead. A PM's own customizations are stored
// separately, server-side, as this PM account's own `PMScreeningOverride`
// row per location — still a sparse diff keyed by field/row/criterion id,
// so a future UN Admin default change is picked up automatically for every
// field a PM never touched.
//
// "PROTECTED BY DEFAULT UNLESS EXPLICITLY FLAGGED." Per the 2026-11-12
// decision, a field/row/band with no explicit PM-override marker in UN
// Admin's own data is PROTECTED for PM editing — not a parsing/display gap,
// a direct consequence of this decision plus the current state of UN
// Admin's own pmOverride/pmOverrideAllowed/criteriaPermissions flags (most
// of which default to "No"/false/LOCKED). The result is a screen where most
// fields show read-only with a lock icon and only a handful are actually
// editable, until a UN Admin deliberately flips more flags to "Yes".
//
// 2026-11-12 FOLLOW-UP FIX: Co-Applicant Screening, Household Screening,
// Application Decision Workflow (all three Tab 2 tables), and two of Credit
// Risk's three tiers (Tab 1) previously had NO override path on this screen
// at all, regardless of each row/band's own `pmOverride` flag — they always
// rendered fully read-only (Credit Risk's Tier B was the one exception, but
// hardcoded as always-editable rather than driven by its own flag either).
// This was a real gap on this screen's side, not a reflection of UN Admin's
// data. Fixed: `tableRowState()`/`OverridableStatusCell` (table rows) and
// the generalized `bandState()` (bands) now read each row/band's own
// `pmOverride` flag directly, uniformly across all three tiers and all
// three tables — matching how Tab 1's fields and Tab 2's Section 01
// criteria already worked. See the Figma review doc's latest section for
// the full writeup, including the resulting behavior change on Credit Risk
// Tier B (no longer editable by default — now requires UN Admin to flag it
// `pmOverride: true`, same as every other tier).
//
// SCOPE SIMPLIFICATIONS (flagged, not silent): the Tab 2 Criterion drawer
// only exposes each criterion's single baseline THRESHOLD as PM-overridable
// — Method and Weightage are shown read-only even for ALLOWED/RESTRICTED
// criteria (rebalancing weight or changing scoring method felt like a
// bigger methodology call than one threshold number, and Weightage's
// cross-criterion 100%-sum constraint has no clean PM-local meaning without
// every other criterion's weight visible too). Guarantor Option's baseline
// (multiple sub-values inside CRITERIA_EXTRA_DEFAULTS) is shown read-only
// even though it's RESTRICTED, not LOCKED — editing several bundled values
// at once needs a richer per-field data model than this first pass builds.
// Both are called out again in the Figma review doc's Section 18 as open
// items worth a second look.
//
// 2026-11-13 ADDITION — "MY CITIES" PER-LOCATION OVERRIDES. Generalizes the
// Country/State/City layer added to UN Admin's own Screening Configuration
// screen (same Figma review doc, new section) to this screen: a PM adds the
// cities they operate in under "My Cities" (manual add/remove — there's no
// backend Property-city normalization to derive this from), and each city
// gets its own full, independent override diff — exactly like the existing
// account-wide "Default" diff below, just one level deeper. Resolution per
// city: `apiGetUNAdminConfig(activePMLocation)` first looks for UN Admin's
// OWN matching Country/State/City record (set on UN Admin's screen); if UN
// Admin hasn't configured that specific city, it falls back to UN Admin's
// Default — the same two-level fallback UN Admin's own screen uses for its
// locations, just resolved against whichever city the PM is currently
// viewing here, now computed server-side (pm_views.py's
// `_resolve_un_admin_record`) rather than read out of a parsed localStorage
// blob.
//
// 18th sitting — FULL API WIRING. This screen's `overrides` state now
// holds ONLY the currently active location's own bucket ({fields, rows,
// bands, criteria, coapp, household, decisionWorkflow}) — fetched fresh on
// every location switch via `apiGetPMOverride(activePMLocation)`, mirroring
// exactly how UN Admin's own screen re-reads "from storage" on every
// switch and silently discards any unsaved edits on the location being
// left. The old nested `overrides.locations[country][state][city]` tree
// this screen kept entirely in localStorage is gone — the backend IS that
// cache now, one row per location — which is what let `updateOverridesBucket`
// and every one of the *State() functions below (fieldState, rowState,
// bandState, tableRowState, criterionState) stay completely unchanged:
// they only ever read/write "whichever bucket is active right now" and
// never needed to know whether that meant a nested-tree lookup or a flat
// object.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';
import { useAuth } from '../../../context/AuthContext';
import {
  DEFAULT_SCREENING_CATEGORIES, CRITERIA_EXTRA_DEFAULTS, SECTION01_CRITERIA,
  PLATFORM_RULE_CALLOUT, CRITERIA_WEIGHTAGE_DEFAULTS, HOUSEHOLD_PIPELINE_STAGES,
  DEFAULT_COAPPLICANT_ROWS, DEFAULT_HOUSEHOLD_ROWS, DEFAULT_AI_GUARDRAIL_ROWS,
  AI_LIVE_EVAL_SAMPLE, APPLICATION_LIFECYCLE_STAGES, DEFAULT_DECISION_WORKFLOW_ROWS,
  LIFECYCLE_STATUS_GLOSSARY, DEFAULT_COMPLIANCE_SAFEGUARD_ROWS, AUDIT_TRAIL_ROWS,
  DATA_RETENTION_INFO, statesForCountry,
  // 2026-11-18 — added to sync Tab 1's 7 scenarioOutcomes/outcomeWeightage
  // sections and Tab 2 Section 01's rewritten (2026-11-17) Criterion
  // drawer into this screen. EVALUATION_OUTCOME_OPTIONS is the scenario
  // grids' outcome-pill catalogue; CRITERIA_EXTENDED_DEFAULTS is the new
  // per-criterion Supported Markets/Providers/Applicant Scope/Alternative
  // Documentation data the rewritten drawer reads; the rest are that
  // drawer's own dropdown/multiselect option catalogues.
  EVALUATION_OUTCOME_OPTIONS, CRITERIA_EXTENDED_DEFAULTS, MODE_OPTIONS, CATEGORY_OPTIONS,
  SCORE_TIER_OUTCOME_OPTIONS, IDENTITY_DOCUMENT_OPTIONS, RENT_BASELINE_TYPE_OPTIONS,
  ALTERNATIVE_DOCUMENT_OPTIONS, SUPPORTED_PROVIDER_OPTIONS, SUPPORTED_PROVIDERS_BY_CRITERION,
  APPLICANT_SCOPE_OPTIONS,
} from '../../UNAdminPortal/Configurations/Screening/mockTenantScreeningConfig';
import {
  C, F, Pill, SampleTag, Toggle, overlayStyle, modalBase, btnPrimary, btnCancel, fieldLabel, hintStyle,
  inputStyle, DropdownOrCustom, MultiSelectDropdown, noSpinnerClass, NoSpinnerStyle,
  ProtectedField, OverrideStatusBadge, SignoffPill,
} from './pmScreeningConfigTokens';
import { CustomDropdown } from '../../../components/ui';
import {
  apiGetUNAdminConfig, apiGetPMOverride, apiSavePMOverride, apiDeletePMOverride,
  apiListMyCities, apiAddMyCity, apiRemoveMyCity, apiListUNAdminLocations,
} from './pmScreeningConfigApi';

function defaultCriteriaPermissions() {
  const out = {};
  SECTION01_CRITERIA.forEach((c) => { out[c.id] = c.defaultPermission; });
  return out;
}

// 2026-11-18 — one default-builder per new per-criterion field UN Admin's
// 2026-11-17 drawer rewrite introduced (criteriaActive/Mode/Category/
// Requirement/WeightEligible) — same "seed from the criterion's own static
// field" pattern UNAdminScreeningConfiguration.jsx's own useState()
// initializers use, so this screen's shipped-defaults fallback starts
// identical to UN Admin's own before either side has saved anything.
function defaultCriteriaActive() {
  const out = {};
  SECTION01_CRITERIA.forEach((c) => { out[c.id] = true; });
  return out;
}
function defaultCriteriaWeightEligible() {
  const out = {};
  SECTION01_CRITERIA.forEach((c) => { out[c.id] = c.weightEligible !== false; });
  return out;
}
function defaultCriteriaMode() {
  const out = {};
  SECTION01_CRITERIA.forEach((c) => { out[c.id] = c.mode; });
  return out;
}
function defaultCriteriaCategory() {
  const out = {};
  SECTION01_CRITERIA.forEach((c) => { out[c.id] = c.category; });
  return out;
}
function defaultCriteriaRequirement() {
  const out = {};
  SECTION01_CRITERIA.forEach((c) => { out[c.id] = c.requirement; });
  return out;
}

// Shipped mock defaults — used only when UN Admin hasn't saved ANYTHING at
// all yet (apiGetUNAdminConfig 404s even for Default), same "nothing live
// yet" case loadUNAdminConfig()'s own `fallback` object used to cover.
const UN_ADMIN_FALLBACK = {
  categories: DEFAULT_SCREENING_CATEGORIES,
  extra: CRITERIA_EXTRA_DEFAULTS,
  criteriaPermissions: defaultCriteriaPermissions(),
  criteriaWeightage: CRITERIA_WEIGHTAGE_DEFAULTS,
  // 2026-11-18 — criteriaMethod retired: UN Admin's 2026-11-17 drawer
  // rewrite dropped the old free-standing "Default Evaluation Method"
  // dropdown entirely in favor of the Mode/Category/Requirement trio
  // below, so nothing on this screen reads criteriaMethod any more.
  criteriaActive: defaultCriteriaActive(),
  criteriaWeightEligible: defaultCriteriaWeightEligible(),
  criteriaMode: defaultCriteriaMode(),
  criteriaCategory: defaultCriteriaCategory(),
  criteriaRequirement: defaultCriteriaRequirement(),
  criteriaExtended: CRITERIA_EXTENDED_DEFAULTS,
  coapplicantRows: DEFAULT_COAPPLICANT_ROWS,
  householdRows: DEFAULT_HOUSEHOLD_ROWS,
  aiGuardrailRows: DEFAULT_AI_GUARDRAIL_ROWS,
  decisionWorkflowRows: DEFAULT_DECISION_WORKFLOW_ROWS,
  complianceSafeguardRows: DEFAULT_COMPLIANCE_SAFEGUARD_ROWS,
  savedAt: null,
  isLive: false,
  resolvedFromLocation: false,
};

// Adapts apiGetUNAdminConfig()'s response ({id, country, state, city, data,
// is_submitted, saved_at, resolved_from_location, ...}) into the exact flat
// shape this screen's render code has always consumed (what
// loadUNAdminConfig() used to return) — the per-field `|| fallback.x`
// defaulting it used to do is preserved here too, in case UN Admin's own
// `data` blob is missing a key a newer build of this screen expects.
function unAdminRecordFromApi(apiRecord) {
  if (!apiRecord) return null;
  const d = apiRecord.data || {};
  return {
    categories: d.categories || UN_ADMIN_FALLBACK.categories,
    extra: d.extra || UN_ADMIN_FALLBACK.extra,
    criteriaPermissions: d.criteriaPermissions || UN_ADMIN_FALLBACK.criteriaPermissions,
    criteriaWeightage: d.criteriaWeightage || UN_ADMIN_FALLBACK.criteriaWeightage,
    criteriaActive: d.criteriaActive || UN_ADMIN_FALLBACK.criteriaActive,
    criteriaWeightEligible: d.criteriaWeightEligible || UN_ADMIN_FALLBACK.criteriaWeightEligible,
    criteriaMode: d.criteriaMode || UN_ADMIN_FALLBACK.criteriaMode,
    criteriaCategory: d.criteriaCategory || UN_ADMIN_FALLBACK.criteriaCategory,
    criteriaRequirement: d.criteriaRequirement || UN_ADMIN_FALLBACK.criteriaRequirement,
    criteriaExtended: d.criteriaExtendedConfig || UN_ADMIN_FALLBACK.criteriaExtended,
    coapplicantRows: d.coapplicantRows || UN_ADMIN_FALLBACK.coapplicantRows,
    householdRows: d.householdRows || UN_ADMIN_FALLBACK.householdRows,
    aiGuardrailRows: d.aiGuardrailRows || UN_ADMIN_FALLBACK.aiGuardrailRows,
    decisionWorkflowRows: d.decisionWorkflowRows || UN_ADMIN_FALLBACK.decisionWorkflowRows,
    complianceSafeguardRows: d.complianceSafeguardRows || UN_ADMIN_FALLBACK.complianceSafeguardRows,
    savedAt: apiRecord.saved_at || null,
    isLive: true,
    resolvedFromLocation: !!apiRecord.resolved_from_location,
  };
}

// The one override-bucket shape every *State() function below reads/writes
// — unchanged from what `overrides`/`activeBucket` always held, just no
// longer nested under a nested locations tree (see header note above).
// 2026-11-18 — `scenarioRows` added for the 7 Tab 1 scenarioOutcomes
// sections' own Active/Inactive override (see `tableRowState` reuse below);
// row ids are already globally unique (identity_sc_01, income_sc_01, …) so
// one flat bucket, same shape `coapp`/`household`/`decisionWorkflow` use,
// is enough — no per-category nesting needed.
const EMPTY_OVERRIDE_BUCKET = { fields: {}, rows: {}, bands: {}, criteria: {}, coapp: {}, household: {}, decisionWorkflow: {}, scenarioRows: {} };

function overrideBucketFromApi(apiRecord) {
  if (!apiRecord) return { ...EMPTY_OVERRIDE_BUCKET };
  return { ...EMPTY_OVERRIDE_BUCKET, ...(apiRecord.data || {}) };
}

// true/'ALLOWED' → ALLOWED, 'RESTRICTED' → RESTRICTED, everything else
// (false, undefined, null, 'LOCKED') → LOCKED. Protected by default unless
// explicitly flagged, per the 2026-11-12 decision.
function permissionFor(explicit) {
  if (explicit === true || explicit === 'ALLOWED') return 'ALLOWED';
  if (explicit === 'RESTRICTED') return 'RESTRICTED';
  return 'LOCKED';
}

function formatFieldDisplay(field, value) {
  if (field.type === 'multiselect') return Array.isArray(value) ? value.join(', ') : String(value ?? '');
  if (field.type === 'toggle') return value ? 'Yes' : 'No';
  if (field.type === 'select') {
    const opt = (field.options || []).find((o) => o.value === value);
    return opt ? opt.label : String(value ?? '');
  }
  const suffix = field.suffix ? ` ${field.suffix}` : '';
  return `${value ?? ''}${suffix}`;
}

function FieldControl({ field, value, onChange }) {
  if (field.type === 'toggle') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Toggle value={!!value} onChange={onChange} />
        <span style={{ fontFamily: F.body, fontSize: 13, color: value ? C.green : C.textTertiary, fontWeight: 600 }}>{value ? 'Yes' : 'No'}</span>
      </div>
    );
  }
  if (field.type === 'select') return <DropdownOrCustom options={field.options || []} value={value} onChange={onChange} />;
  if (field.type === 'multiselect') return <MultiSelectDropdown options={field.options || []} value={value} onChange={onChange} />;
  if (field.type === 'number') {
    return (
      <input
        type="number" className={noSpinnerClass} style={inputStyle()}
        value={value ?? ''} min={field.pmMin} max={field.pmMax} step={field.step || 1}
        onChange={(e) => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
      />
    );
  }
  if (field.type === 'date') return <input type="date" style={inputStyle()} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  return <input style={inputStyle()} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

// ─── Section header + card shell (matches UN Admin's SectionCard look) ─────
function SectionCard({ title, subtitle, badge, children }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h3 style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 600, color: C.textPrimary, margin: '0 0 3px' }}>{title}</h3>
          {subtitle && <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: 0 }}>{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ─── Generic one-field-per-row renderer for Tab 1 "fields"-kind categories
// and card-level fields. One function handles both the protected and the
// editable branch, per `permissionFor`. ────────────────────────────────────
function PMField({ field, permission, value, overridden, onChange, onReset }) {
  const editable = permission === 'ALLOWED' || permission === 'RESTRICTED';
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
        <label style={{ ...fieldLabel, marginBottom: 0, whiteSpace: field.labelNoWrap ? 'nowrap' : 'normal' }}>
          {field.label}{field.sample && <SampleTag style={{ marginLeft: 8 }} />}
        </label>
        {editable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {permission === 'RESTRICTED' && <SignoffPill />}
            <OverrideStatusBadge customized={overridden} />
            {overridden && (
              <button onClick={onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-rotate" style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        )}
      </div>
      {editable
        ? <FieldControl field={field} value={value} onChange={onChange} />
        : <ProtectedField>{formatFieldDisplay(field, value)}</ProtectedField>}
      {field.hint && <div style={hintStyle}>{field.hint}</div>}
    </div>
  );
}

// ─── Generic table shell for every Tab 2/3 table on this screen. The grid
// itself is always just column headers + rows — it's "read-only" only in
// the sense that it has no built-in editing of its own; whether a given
// row/column cell is actually editable is up to what `renderRow` puts in
// it (see `OverridableStatusCell`, used by Co-Applicant/Household/Decision
// Workflow's own Status cell for any row UN Admin has flagged
// `pmOverride: true`). AI Guardrails and Compliance Safeguards have no
// PM-override concept in UN Admin's data at all, so those two stay fully
// read-only. Each caller supplies its own column headers and row renderer.
// ────────────────────────────────────────────────────────────────────────
function ReadOnlyTable({ columns, rows, renderRow }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '), gap: 10, padding: '9px 14px', background: C.neutral, borderBottom: `1px solid ${C.border}` }}>
        {columns.map((c) => <span key={c.label} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.textSecondary }}>{c.label}</span>)}
      </div>
      {rows.map((row, idx) => (
        <div key={row.id} style={{ display: 'grid', gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '), gap: 10, padding: '11px 14px', borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${C.border}`, alignItems: 'center', background: idx % 2 === 1 ? '#FAFBFC' : C.white }}>
          {renderRow(row)}
        </div>
      ))}
    </div>
  );
}

const LockedActionsPill = () => <Pill bg={C.neutral} color={C.textSecondary}><i className="ti ti-lock" style={{ fontSize: 10 }} />Set by UrbanNest Admin</Pill>;
const ActiveStatusPill = ({ active }) => active ? <Pill bg={C.greenBg} color={C.green}>Active</Pill> : <Pill bg={C.neutral} color={C.textSecondary}>Not Active</Pill>;

// 2026-11-12 follow-up: the "Status" cell for Co-Applicant/Household/
// Decision-Workflow table rows. Previously every row in these three tables
// rendered the plain, non-interactive ActiveStatusPill no matter what —
// `row.pmOverride` was tracked in UN Admin's own data (since Session 69)
// but nothing on this screen ever read it. Now: a row UN Admin has flagged
// `pmOverride: true` gets a real Toggle (+ its own numeric field, if it
// carries one) instead of the static pill; everything else is unchanged.
function OverridableStatusCell({ row, state, gated }) {
  // 2026-11-13 follow-up: `gated` (set by the Co-Applicant Screening master
  // switch — see `coappGateActive`) overrides everything else for this row,
  // same as UN Admin's own gate does — forced Not Active, no toggle/numeric
  // control shown at all, regardless of this row's own `pmOverride` flag or
  // any PM override already stored for it.
  if (gated) {
    return (
      <div>
        <ActiveStatusPill active={false} />
        <div style={{ ...hintStyle, marginTop: 4 }}>Requires Co-Applicant Screening to be Active</div>
      </div>
    );
  }
  if (!state.editable) return <ActiveStatusPill active={row.locked ? true : row.active !== false} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Toggle value={state.activeValue} onChange={state.onActiveChange} />
        <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 600, color: state.activeValue ? C.green : C.textTertiary }}>{state.activeValue ? 'Active' : 'Not Active'}</span>
      </div>
      {row.numericField && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="number" className={noSpinnerClass} style={{ ...inputStyle(), height: 30, maxWidth: 80, fontSize: 12 }}
            value={state.numericValue ?? ''} onChange={(e) => state.onNumericChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
          <span style={{ fontSize: 11, color: C.textTertiary }}>{row.numericField.suffix}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <OverrideStatusBadge customized={state.overridden} />
        {state.overridden && <button onClick={state.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, display: 'flex' }}><i className="ti ti-rotate" style={{ fontSize: 13 }} /></button>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Tab 1 — "Screening Rules"
// ════════════════════════════════════════════════════════════════════════
function FieldsSection({ category, getFieldState }) {
  return (
    <SectionCard title={`${category.sectionNumber}. ${category.title}`} subtitle={category.subtitle}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 24px' }}>
        {category.fields.map((field) => {
          const st = getFieldState(category.id, field);
          return <PMField key={field.id} field={field} {...st} />;
        })}
      </div>
    </SectionCard>
  );
}

function CompletenessTable({ category, getRowState }) {
  return (
    <SectionCard title={`${category.sectionNumber}. ${category.title}`} subtitle={category.subtitle}>
      <ReadOnlyTable
        columns={[{ label: 'Data Module', width: '1.6fr' }, { label: 'Admin Baseline Value', width: '1.3fr' }, { label: 'Your Override', width: '1.3fr' }]}
        rows={category.rows}
        renderRow={(row) => {
          const st = getRowState(row);
          const baselineText = `${row.baseline}${row.baselineSuffix ? ' ' + row.baselineSuffix : ''}`;
          return (
            <>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
                {row.module}{row.sample && <SampleTag style={{ marginLeft: 6 }} />}
              </span>
              <span style={{ fontSize: 12.5, color: C.textSecondary }}>{baselineText}</span>
              <div>
                {st.editable ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className={noSpinnerClass} style={{ ...inputStyle(), height: 34, maxWidth: 110 }}
                      value={st.value ?? ''} min={row.pmMin} max={row.pmMax}
                      onChange={(e) => st.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    {row.pmUnit && <span style={{ fontSize: 12, color: C.textTertiary }}>{row.pmUnit}</span>}
                    <OverrideStatusBadge customized={st.overridden} />
                    {st.overridden && <button onClick={st.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
                  </div>
                ) : <LockedActionsPill />}
              </div>
            </>
          );
        }}
      />
    </SectionCard>
  );
}

function CardsSection({ category, getFieldState }) {
  return (
    <SectionCard title={`${category.sectionNumber}. ${category.title}`} subtitle={category.subtitle}
      badge={category.primaryEngineLabel && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: C.textSecondary }}>{category.primaryEngineLabel}</span>{category.engineSample && <SampleTag />}</span>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {category.cards.map((card) => (
          <div key={card.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h4 style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary, margin: 0, whiteSpace: 'nowrap' }}>{card.title}</h4>
              {card.sample && <SampleTag />}
            </div>
            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '0 0 12px', lineHeight: 1.5 }}>{card.body}</p>
            {card.fields.map((field) => {
              const st = getFieldState(category.id, field);
              return <PMField key={field.id} field={field} {...st} />;
            })}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function BandsSection({ category, getBandState, extraToggleValue }) {
  return (
    <SectionCard title={`${category.sectionNumber}. ${category.title}`} subtitle={category.subtitle}
      badge={category.vendorBadgeLabel && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: C.textSecondary }}>{category.vendorBadgeLabel}</span>{category.vendorBadgeSample && <SampleTag />}</span>}>
      {category.bands.map((band) => {
        // 2026-11-12 follow-up: editability now follows each tier's OWN
        // `pmOverride` flag (every tier can carry one as of the Figma
        // review's 11th sitting) instead of being hardcoded to Tier B
        // ('conditional') only. Tier B is no longer special-cased — if its
        // own flag is off, it now shows protected like any other tier.
        const editable = band.pmOverride === true;
        const st = editable ? getBandState(band.id) : null;
        const isRange = band.valueMin !== undefined;
        const effective = editable && st.overridden ? { ...band, ...st.value } : band;
        return (
          <div key={band.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{band.label}</span>
              {editable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {band.pmPermission === 'RESTRICTED' && <SignoffPill />}
                  <OverrideStatusBadge customized={st.overridden} />
                  {st.overridden && <button onClick={st.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
                </div>
              )}
            </div>
            {editable ? (
              isRange ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" className={noSpinnerClass} style={{ ...inputStyle(), maxWidth: 110 }} value={effective.valueMin} onChange={(e) => st.onChange({ ...st.value, valueMin: parseFloat(e.target.value) || 0, valueMax: effective.valueMax })} />
                  <span style={{ color: C.textTertiary, fontSize: 13 }}>–</span>
                  <input type="number" className={noSpinnerClass} style={{ ...inputStyle(), maxWidth: 110 }} value={effective.valueMax} onChange={(e) => st.onChange({ valueMin: effective.valueMin, valueMax: parseFloat(e.target.value) || 0 })} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: C.textTertiary }}>{band.comparator}</span>
                  <input type="number" className={noSpinnerClass} style={{ ...inputStyle(), maxWidth: 110 }} value={effective.value} onChange={(e) => st.onChange({ value: parseFloat(e.target.value) || 0 })} />
                </div>
              )
            ) : (
              <ProtectedField>{band.comparator ? `${band.comparator} ${band.value}` : `${band.valueMin}–${band.valueMax}`}</ProtectedField>
            )}
            <div style={hintStyle}>{band.note}</div>
          </div>
        );
      })}
      {category.extraToggle && (
        <div>
          <label style={fieldLabel}>{category.extraToggle.label}</label>
          <ProtectedField>{extraToggleValue ? 'Yes' : 'No'}</ProtectedField>
          <div style={hintStyle}>{category.extraToggle.note}</div>
        </div>
      )}
    </SectionCard>
  );
}

// 2026-11-18 — PM-side mirror of UN Admin's OutcomePill (ScreeningConfig
// §27.18): same {code,label,pillBg,pillColor} lookup, just reading colors
// off this file's own token copy of `C` instead of importing the UN Admin
// one, matching every other primitive on this screen.
function OutcomePill({ code, options }) {
  const opt = (options || []).find((o) => o.code === code);
  if (!opt) return <span style={{ fontSize: 11.5, color: C.textTertiary }}>{code}</span>;
  return <Pill bg={C[opt.pillBg] || C.neutral} color={C[opt.pillColor] || C.textSecondary}>{opt.label}</Pill>;
}

// 2026-11-18 — PM-side counterpart to UN Admin's ScenarioOutcomesSection
// (identity_fraud, income_financial, credit_risk, rental_history_eviction,
// criminal_background, employment_verification_rules — all 6 Tab 1
// sections UN Admin rebuilt as Scenario/Classification/Evaluation Outcome
// grids this session, plus the newly-repositioned Evaluation Outcome &
// Weightage section ahead of them). The Scenario/Classification/Evaluation
// Outcome columns are UN Admin's own fixed platform rule text — never
// PM-editable, so they're just displayed — and the 5th column collapses to
// the same OverridableStatusCell every other Tab 2 table row already uses:
// a row UN Admin has flagged `pmOverride: true` gets a real Active/Not
// Active toggle (+ the usual Customized badge/reset), every other row
// stays the plain locked pill. "PM Override" itself is UN Admin's own
// authoring flag, not something a PM sets — so, unlike UN Admin's own
// table, this screen never shows a "PM Override" column at all.
function ScenarioOutcomesSection({ category, getRowState }) {
  return (
    <SectionCard title={`${category.sectionNumber}. ${category.title}`} subtitle={category.subtitle}
      badge={category.vendorBadgeLabel && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: C.textSecondary }}>{category.vendorBadgeLabel}</span>{category.vendorBadgeSample && <SampleTag />}</span>}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
          <thead>
            <tr>
              {['Scenario', category.classificationColumnLabel || 'Classification', 'Evaluation Outcome', 'Status'].map((col) => (
                <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.scenarioRows.map((row) => {
              const st = getRowState(row);
              return (
                <tr key={row.id}>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textPrimary, maxWidth: 360 }}>{row.scenario}</td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}` }}><OutcomePill code={row.classificationCode} options={category.classificationOptions} /></td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}` }}><OutcomePill code={row.outcomeCode} options={EVALUATION_OUTCOME_OPTIONS} /></td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                    <OverridableStatusCell row={row} state={st} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 14px', background: C.pageBg, borderRadius: 8 }}>
        <span style={{ color: C.textTertiary, fontSize: 13, flexShrink: 0 }}>i</span>
        <span style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{category.footnote}</span>
      </div>

      {category.evaluationRules && category.evaluationRules.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Important Evaluation Rules
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {category.evaluationRules.map((rule, i) => (
              <li key={i} style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      {category.mandatorySafeguards && category.mandatorySafeguards.length > 0 && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: C.greenBg, borderRadius: 8, border: `1px solid ${C.green}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <i className="ti ti-shield-check" style={{ fontSize: 13, color: C.green }} />
            <span style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fair Housing Guidance — Mandatory Screening Safeguards
            </span>
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {category.mandatorySafeguards.map((rule, i) => (
              <li key={i} style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{rule}</li>
            ))}
          </ol>
        </div>
      )}
    </SectionCard>
  );
}

// 2026-11-18 — PM-side mirror of UN Admin's OutcomeWeightageSection. This
// section's rows carry no `pmOverride` flag at all in UN Admin's own data
// (it's a platform-wide contribution table, not a per-field policy), so
// there is nothing for a PM to ever customize here — it's fully read-only
// by design, same as AI Guardrails/Compliance Safeguards elsewhere on this
// screen.
function OutcomeWeightageSection({ category }) {
  return (
    <SectionCard title={`${category.sectionNumber}. ${category.title}`} subtitle={category.subtitle} badge={<LockedActionsPill />}>
      <div style={{ display: 'flex', gap: 8, background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: '10px 14px', margin: '0 0 18px' }}>
        <span style={{ fontSize: 12.5, color: C.blue }}>ℹ These contribution percentages are platform-defined and apply uniformly across every criterion's weightage — they are not configured per criterion, and are not PM-overridable.</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
          <thead>
            <tr>
              {['Evaluation Outcome', 'Outcome Weightage (%)'].map((col) => (
                <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.outcomeWeightage.map((row) => {
              let pillBg = C.neutral;
              let pillColor = C.textTertiary;
              let label = 'Excluded';
              if (!row.excluded) {
                label = `${row.contributionPercent}%`;
                if (row.contributionPercent === 100) { pillBg = C.greenBg; pillColor = C.green; }
                else if (row.contributionPercent === 50) { pillBg = C.amberBg; pillColor = C.amberText; }
                else { pillBg = C.dangerBg; pillColor = C.danger; }
              }
              return (
                <tr key={row.outcomeCode}>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>
                    {(EVALUATION_OUTCOME_OPTIONS.find((o) => o.code === row.outcomeCode) || {}).label || row.outcomeCode}
                  </td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}` }}>
                    <Pill bg={pillBg} color={pillColor}>{label}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, padding: '10px 14px', background: C.pageBg, borderRadius: 8 }}>
        <span style={{ color: C.textTertiary, fontSize: 13, flexShrink: 0 }}>i</span>
        <span style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
          Rows are platform-fixed, read-only by design — set by UrbanNest Admin and applied uniformly across every account.
        </span>
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Tab 2 — "Evaluation & Decisions"
// ════════════════════════════════════════════════════════════════════════
function getCriterionBaselineRaw(criterion, unAdmin) {
  const { source } = criterion;
  if (!source) return null;
  if (source.kind === 'field') {
    const cat = unAdmin.categories.find((c) => c.id === source.categoryId);
    const list = cat?.fields || (cat?.cards || []).flatMap((c) => c.fields);
    const f = (list || []).find((x) => x.id === source.fieldId);
    return f ? f.value : null;
  }
  if (source.kind === 'band') {
    const cat = unAdmin.categories.find((c) => c.id === source.categoryId);
    return (cat?.bands || []).find((b) => b.id === source.bandId) || null;
  }
  if (source.kind === 'row') {
    const cat = unAdmin.categories.find((c) => c.id === source.categoryId);
    const row = (cat?.rows || []).find((r) => r.id === source.rowId);
    return row ? row.baseline : null;
  }
  if (source.kind === 'extra') return unAdmin.extra;
  return null;
}

// 2026-11-18 — UN Admin's 2026-11-17 rewrite of this section (Session 73)
// replaced the old 7-criteria/Method-dropdown design with 6 criteria, each
// with its own bespoke "Default Value" editor (Credit Check: Score Tiers;
// Income Verification: Baseline Type + Multiplier; Employment
// Verification: a Document Type/Count table; Rental History / Criminal
// Background: a single number; Identity Verification: a multi-select
// document list) — none of which match this screen's old CRITERION_EDIT_KIND
// shapes ('number_bounded'/'extra_tenure'/'band_pair'/'guarantor_multi'),
// and Guarantor Option is gone entirely. This mapping is rebuilt against
// the new shapes; 'number' covers Rental History and Criminal Background,
// which are still plain numeric fields.
const CRITERION_EDIT_KIND = {
  credit_criteria: 'score_tiers',
  income_qualification: 'income_baseline',
  employment_verification: 'employment_documents',
  rental_history: 'number',
  criminal_background: 'number',
  identity_verification: 'identity_documents',
};

// 2026-11-18 — card rewritten to match UN Admin's own new CriterionCard
// layout (Weight / PM Configurability / Category / Supported Markets rows,
// same four-row body) instead of the old single "Weight: X%" pill row, so
// a PM sees the same information UN Admin does before opening the drawer.
// Unlike UN Admin's card, there's no Section Status toggle or extra icon
// buttons here — Active/Not Active is a UN Admin scoring-methodology
// setting, not something a PM flips from this screen (see the drawer's own
// "Active for Your Account" note, carried over unchanged from the prior
// build), and "Manage Templates"/"View Rule Definitions" are admin-only,
// not-yet-wired affordances with no PM-side meaning.
function CriterionCard({ criterion, displayValue, extra, extended, weightEligible, active, weightage, permission, category, onOpen }) {
  const locked = permission === 'LOCKED';
  const body = criterion.cardBody(displayValue, extra);
  const markets = (extended?.supportedMarkets || []).join(', ');
  let pmPillBg = C.neutral, pmPillColor = C.textTertiary, pmLabel = permission;
  if (permission === 'ALLOWED') { pmPillBg = C.greenBg; pmPillColor = C.green; pmLabel = 'Allowed'; }
  else if (permission === 'RESTRICTED') { pmPillBg = C.amberBg; pmPillColor = C.amberText; pmLabel = 'Restricted'; }
  else if (permission === 'LOCKED') { pmPillBg = C.neutral; pmPillColor = C.textPrimary; pmLabel = '🔒 Locked'; }
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: `1px solid ${C.pageBg}` };
  const rowLabel = { fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textTertiary };
  return (
    <div onClick={() => onOpen(criterion.id)} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, background: C.white, opacity: active ? 1 : 0.7, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 16.5, fontWeight: 800, color: C.textPrimary }}>{criterion.title}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10.5, color: C.textTertiary, marginTop: 2 }}>{criterion.code}</div>
        </div>
        <Pill bg={C.neutral} color={C.textSecondary}>{criterion.tier}</Pill>
      </div>
      <div style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, margin: '4px 0 6px' }}>{body}</div>

      <div style={row}>
        <span style={rowLabel}>Weight</span>
        {weightEligible === false ? <Pill bg={C.neutral} color={C.textTertiary}>Not Weighted</Pill> : <Pill bg={C.blueBg} color={C.blue}>{weightage}%</Pill>}
      </div>
      <div style={row}>
        <span style={rowLabel}>PM Configurability</span>
        <Pill bg={pmPillBg} color={pmPillColor}>{pmLabel}</Pill>
      </div>
      <div style={row}>
        <span style={rowLabel}>Category</span>
        <Pill bg={C.neutral} color={C.textSecondary}>{category ?? criterion.category}</Pill>
      </div>
      <div style={row}>
        <span style={rowLabel}>Supported Markets</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{markets}</span>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: 14, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ActiveStatusPill active={active} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {permission === 'RESTRICTED' && <SignoffPill />}
          {locked ? <i className="ti ti-lock" style={{ fontSize: 13, color: C.textTertiary }} /> : <i className="ti ti-pencil" style={{ fontSize: 13, color: C.primary }} />}
        </div>
      </div>
    </div>
  );
}

// 2026-11-18 — full rewrite to match UN Admin's own 2026-11-17 drawer
// rewrite (Session 73), field-for-field, with the same gating philosophy
// this screen has used from the start ("whatever UN Admin's own permission
// marks as not-LOCKED is editable here; everything else, including the
// permission choice and Active status themselves, is UN Admin's own call
// and only ever displayed"). `fieldsDisabled` is the exact same expression
// UN Admin's own drawer uses — `permission === 'LOCKED' || !active` — so a
// field reads as locked here in exactly the same cases it would read as
// locked (fixed, no Toggle/input) on UN Admin's own screen, per the
// explicit request that a PM-Override:No rule stay visible, just locked.
//
// Two fields are judgment calls, flagged here as in UN Admin's own file:
// - Weight Eligible stays read-only (never PM-editable) — it decides
//   whether this criterion counts toward the platform-wide 100% weightage
//   pool at all, a scoring-methodology decision this screen has always
//   treated as UN Admin's alone (see the pre-existing Weightage hint
//   below), not something one PM should silently opt out of.
// - Alternative Documentation's own Active/Inactive toggle is also
//   display-only (it's a scope decision bundled with the primary method,
//   same call as Weight Eligible) — but its accepted-documents list and
//   notes ARE separately PM-overridable, gated by their OWN flag,
//   `extended.altDoc.pmOverrideAllowed` (which UN Admin sets independently
//   of the main PM Customization Permission above, exactly as that field's
//   own hint text here says) AND the main `fieldsDisabled`/active gate.
function CriterionDrawer({
  criterion, permission, active, weightage, weightEligible, mode, category, requirement,
  extra, extended, raw,
  weightageState, modeState, categoryState, requirementState, baselineState,
  screeningMethodsState, supportedProviderState, applicantScopeState,
  altDocDocumentsState, altDocNotesState,
  onClose,
}) {
  const chipInputRef = useRef(null);
  const fieldsDisabled = permission === 'LOCKED' || !active;
  const editKind = CRITERION_EDIT_KIND[criterion.id];
  const baselineEditable = !fieldsDisabled && !!editKind;
  const weightageEditable = !fieldsDisabled;
  const altDoc = extended?.altDoc || {};
  const altDocEditable = !fieldsDisabled && !!altDoc.pmOverrideAllowed;

  const effectiveWeightage = weightageState.overridden ? weightageState.value : weightage;
  const effectiveMode = modeState.overridden ? modeState.value : mode;
  const effectiveCategory = categoryState.overridden ? categoryState.value : category;
  const effectiveRequirement = requirementState.overridden ? requirementState.value : requirement;
  const effectiveScreeningMethods = screeningMethodsState.overridden ? screeningMethodsState.value : (extended?.screeningMethods || []);
  const effectiveSupportedProvider = supportedProviderState.overridden ? supportedProviderState.value : extended?.supportedProvider;
  const effectiveApplicantScope = applicantScopeState.overridden ? applicantScopeState.value : (extended?.applicantScope || []);
  const effectiveAltDocDocuments = altDocDocumentsState.overridden ? altDocDocumentsState.value : (altDoc.documents || []);
  const effectiveAltDocNotes = altDocNotesState.overridden ? altDocNotesState.value : (altDoc.notes || '');

  const isCreditCheck = criterion.id === 'credit_criteria';
  const scopeOptions = extended?.scopeOptions || APPLICANT_SCOPE_OPTIONS;
  const segmentBase = { fontFamily: F.body, fontSize: 11.5, fontWeight: 700, borderRadius: 6, padding: '6px 10px', border: `1px solid ${C.border}` };
  const colHeader = { fontFamily: F.body, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.textTertiary };
  const tierColors = (tierName) => {
    if (tierName === 'Tier A') return { bg: C.greenBg, color: C.green };
    if (tierName === 'Tier B') return { bg: C.blueBg, color: C.blue };
    return { bg: C.dangerBg, color: C.danger };
  };

  // ── Default Value editor, one per criterion shape ──────────────────────
  let defaultValueEditor = null;
  let baselineText = null;
  if (editKind === 'score_tiers') {
    const tiers = baselineState.overridden ? baselineState.value : (extended?.scoreTiers || []);
    baselineText = tiers.map((t) => `${t.tier}: ${t.operator} ${t.valueMin ?? ''}${t.valueMax != null ? `–${t.valueMax}` : ''} (${t.label})`).join(' · ');
    defaultValueEditor = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 150px', gap: 8 }}>
          <span style={colHeader}>Tier</span><span style={colHeader}>Operator</span><span style={colHeader}>Score Range</span><span style={colHeader}>Evaluation Outcome</span>
        </div>
        {tiers.map((tier, i) => {
          const tc = tierColors(tier.tier);
          return (
            <div key={tier.id || i} style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 150px', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, textAlign: 'center', borderRadius: 7, padding: '7px 10px', background: tc.bg, color: tc.color }}>{tier.tier}</span>
              {baselineEditable ? (
                <DropdownOrCustom options={['>=', '<=', '=', 'between'].map((o) => ({ value: o, label: o }))} value={tier.operator}
                  onChange={(v) => baselineState.onChange(tiers.map((t, idx) => (idx === i ? { ...t, operator: v } : t)))} />
              ) : <span style={{ fontSize: 12.5, color: C.textSecondary }}>{tier.operator}</span>}
              {baselineEditable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" value={tier.valueMin ?? ''} className={noSpinnerClass} placeholder="From" style={{ ...inputStyle(), width: 70 }}
                    onChange={(e) => baselineState.onChange(tiers.map((t, idx) => (idx === i ? { ...t, valueMin: e.target.value === '' ? null : Number(e.target.value) } : t)))} />
                  <span style={{ color: C.textTertiary }}>–</span>
                  <input type="number" value={tier.valueMax ?? ''} className={noSpinnerClass} placeholder="To" style={{ ...inputStyle(), width: 70 }}
                    onChange={(e) => baselineState.onChange(tiers.map((t, idx) => (idx === i ? { ...t, valueMax: e.target.value === '' ? null : Number(e.target.value) } : t)))} />
                </div>
              ) : <span style={{ fontSize: 12.5, color: C.textSecondary }}>{tier.valueMin ?? ''}{tier.valueMax != null ? `–${tier.valueMax}` : ''}</span>}
              {baselineEditable ? (
                <DropdownOrCustom options={SCORE_TIER_OUTCOME_OPTIONS.map((o) => ({ value: o, label: o }))} value={tier.label}
                  onChange={(v) => baselineState.onChange(tiers.map((t, idx) => (idx === i ? { ...t, label: v } : t)))} />
              ) : <span style={{ fontSize: 12.5, color: C.textSecondary }}>{tier.label}</span>}
            </div>
          );
        })}
      </div>
    );
  } else if (editKind === 'income_baseline') {
    const baselineType = baselineState.overridden ? baselineState.value.type : extra.income_rent_baseline_type;
    const multiplier = baselineState.overridden ? baselineState.value.multiplier : raw;
    baselineText = criterion.formatBaseline ? criterion.formatBaseline(multiplier) : `${multiplier}×`;
    defaultValueEditor = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Baseline Type</div>
          {baselineEditable ? (
            <DropdownOrCustom options={RENT_BASELINE_TYPE_OPTIONS.map((o) => ({ value: o, label: o }))} value={baselineType}
              onChange={(v) => baselineState.onChange({ type: v, multiplier })} />
          ) : <ProtectedField>{baselineType}</ProtectedField>}
        </div>
        <div>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Multiplier</div>
          {baselineEditable ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" step="0.1" value={multiplier} className={noSpinnerClass} style={{ ...inputStyle(), width: 72 }}
                onChange={(e) => baselineState.onChange({ type: baselineType, multiplier: Number(e.target.value) })} />
              <span style={{ fontSize: 13, color: C.textSecondary }}>×</span>
            </div>
          ) : <ProtectedField>{multiplier}×</ProtectedField>}
        </div>
      </div>
    );
  } else if (editKind === 'employment_documents') {
    const docs = baselineState.overridden ? baselineState.value : (extra.employment_default_documents || []);
    baselineText = docs.map((d) => `${d.count}× ${d.docType}`).join(', ');
    defaultValueEditor = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 8 }}>
          <span style={colHeader}>Document Type</span><span style={colHeader}>Docs Required</span>
        </div>
        {docs.map((doc, i) => (
          baselineEditable ? (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 28px', gap: 8, alignItems: 'center' }}>
              <input value={doc.docType} placeholder="Document type" style={inputStyle()}
                onChange={(e) => baselineState.onChange(docs.map((d, idx) => (idx === i ? { ...d, docType: e.target.value } : d)))} />
              <input type="number" min="1" value={doc.count} className={noSpinnerClass} style={{ ...inputStyle(), textAlign: 'center' }}
                onChange={(e) => baselineState.onChange(docs.map((d, idx) => (idx === i ? { ...d, count: Number(e.target.value) } : d)))} />
              <button type="button" onClick={() => baselineState.onChange(docs.filter((_, idx) => idx !== i))}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 14 }}>×</button>
            </div>
          ) : (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: C.textPrimary }}>{doc.docType}</span>
              <span style={{ fontSize: 12.5, color: C.textSecondary, textAlign: 'center' }}>{doc.count}</span>
            </div>
          )
        ))}
        {baselineEditable && (
          <button type="button" onClick={() => baselineState.onChange([...docs, { docType: '', count: 1 }])} style={{ ...btnCancel, alignSelf: 'flex-start' }}>
            <i className="ti ti-plus" /> Add document type
          </button>
        )}
      </div>
    );
  } else if (editKind === 'identity_documents') {
    const docs = baselineState.overridden ? baselineState.value : (extra.identity_approved_documents || []);
    baselineText = docs.join(', ');
    defaultValueEditor = (
      <div>
        <div style={{ ...fieldLabel, marginBottom: 6 }}>Approved Documents</div>
        {baselineEditable ? (
          <MultiSelectDropdown options={IDENTITY_DOCUMENT_OPTIONS.map((o) => ({ value: o, label: o }))} value={docs} onChange={baselineState.onChange} />
        ) : <ProtectedField>{docs.join(', ')}</ProtectedField>}
        {extended?.approvedDocumentsCatalogueHint && <div style={{ ...hintStyle, marginTop: 6 }}>{extended.approvedDocumentsCatalogueHint}</div>}
      </div>
    );
  } else if (editKind === 'number') {
    const value = baselineState.overridden ? baselineState.value : raw;
    baselineText = String(value);
    defaultValueEditor = baselineEditable ? (
      <input type="number" className={noSpinnerClass} style={inputStyle()} value={value} onChange={(e) => baselineState.onChange(parseFloat(e.target.value) || 0)} />
    ) : <ProtectedField>{value}</ProtectedField>;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 12, padding: 26, width: '90%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h3 style={{ fontFamily: F.headline, fontSize: 19, fontWeight: 600, color: C.primary, margin: 0 }}>{criterion.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 18 }}><i className="ti ti-x" /></button>
        </div>
        <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 14 }}>{criterion.code}</div>
        <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, lineHeight: 1.6, margin: '0 0 16px' }}>{criterion.drawerSubtitle || criterion.overview}</p>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>PM Customization Permission (set by UrbanNest Admin)</label>
          <Pill bg={permission === 'LOCKED' ? C.neutral : permission === 'RESTRICTED' ? C.amberBg : C.greenBg} color={permission === 'LOCKED' ? C.textSecondary : permission === 'RESTRICTED' ? C.amberText : C.green}>
            {permission.charAt(0) + permission.slice(1).toLowerCase()}
          </Pill>
          {criterion.permissionNotes?.[permission] && <div style={hintStyle}>{criterion.permissionNotes[permission]}</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Active for Your Account</label>
          <ActiveStatusPill active={active} />
          <div style={hintStyle}>Whether this criterion counts toward evaluation at all is a UrbanNest Admin scoring-methodology setting, not PM-customizable.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Mode</div>
            {!fieldsDisabled ? (
              <DropdownOrCustom options={MODE_OPTIONS.map((o) => ({ value: o, label: o }))} value={effectiveMode} onChange={modeState.onChange} />
            ) : <ProtectedField>{effectiveMode}</ProtectedField>}
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Category</div>
            {!fieldsDisabled ? (
              <DropdownOrCustom options={CATEGORY_OPTIONS.map((o) => ({ value: o, label: o }))} value={effectiveCategory} onChange={categoryState.onChange} />
            ) : <ProtectedField>{effectiveCategory}</ProtectedField>}
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Requirement</div>
            {!fieldsDisabled ? (
              <div style={{ display: 'flex', gap: 6 }}>
                {['Mandatory', 'Optional'].map((opt) => (
                  <button key={opt} type="button" onClick={() => requirementState.onChange(opt)}
                    style={{ ...segmentBase, cursor: 'pointer', background: effectiveRequirement === opt ? C.textPrimary : C.white, color: effectiveRequirement === opt ? C.white : C.textTertiary }}>{opt}</button>
                ))}
              </div>
            ) : <ProtectedField>{effectiveRequirement}</ProtectedField>}
          </div>
        </div>

        <div style={{ marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: criterion.defaultValueIntro ? 4 : 10 }}>
            <span style={{ ...fieldLabel, marginBottom: 0 }}>{criterion.defaultValueBoxTitle}</span>
            {baselineEditable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {permission === 'RESTRICTED' && <SignoffPill />}
                <OverrideStatusBadge customized={baselineState.overridden} />
                {baselineState.overridden && <button onClick={baselineState.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
              </div>
            )}
          </div>
          {criterion.defaultValueIntro && <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '0 0 12px', lineHeight: 1.5 }}>{criterion.defaultValueIntro}</p>}
          {defaultValueEditor}
          {criterion.defaultValueFooterNote && <div style={{ ...hintStyle, marginTop: 8 }}>{criterion.defaultValueFooterNote}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Supported Markets</div>
            <ProtectedField note="Supported Markets are set by UrbanNest Admin.">{(extended?.supportedMarkets || []).join(', ')}</ProtectedField>
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Weight Eligible</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ActiveStatusPill active={!!weightEligible} />
            </div>
            <div style={hintStyle}>Whether this criterion counts toward the platform-wide weightage pool is a UrbanNest Admin scoring-methodology setting, not PM-customizable.</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...fieldLabel, marginBottom: 0 }}>Weight %</span>
              {weightageEligibleEditable(weightEligible) && weightageEditable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <OverrideStatusBadge customized={weightageState.overridden} />
                  {weightageState.overridden && <button onClick={weightageState.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
                </div>
              )}
            </div>
            {weightEligible ? (
              weightageEditable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" min="0" max="100" value={effectiveWeightage} className={noSpinnerClass} style={{ ...inputStyle(), width: 80 }}
                    onChange={(e) => weightageState.onChange(Number(e.target.value))} />
                  <span style={{ fontSize: 12, color: C.textSecondary }}>%</span>
                </div>
              ) : <ProtectedField note="Weightage is balanced across all criteria by UrbanNest Admin.">{effectiveWeightage}%</ProtectedField>
            ) : <div style={hintStyle}>{criterion.weightIneligibleHint}</div>}
            {weightEligible && weightageEditable && <div style={hintStyle}>Changing this doesn't automatically rebalance other criteria — UrbanNest Admin's platform-wide 100% rule isn't re-checked here.</div>}
          </div>
        </div>

        <div style={{ marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ ...fieldLabel, marginBottom: 10 }}>PM Customization Permission</div>
          <div style={hintStyle}>Set by UrbanNest Admin for this criterion — see the pill at the top of this drawer. Not editable from the PM Portal.</div>
          {extended?.lockedOnlyNote && <div style={{ ...hintStyle, marginTop: 10, color: C.amberText, fontStyle: 'italic' }}>{extended.lockedOnlyNote}</div>}
        </div>

        {(() => {
          const altActive = !!altDoc.active;
          return (
            <div style={{ marginBottom: 14, border: `1px solid ${altActive ? C.amberBorder : C.border}`, background: altActive ? C.amberBg : C.pageBg, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ ...fieldLabel, marginBottom: 0, color: altActive ? C.amberText : C.textSecondary }}>Alternative Documentation</span>
                <Pill bg={altActive ? C.greenBg : C.neutral} color={altActive ? C.green : C.textTertiary}>{altActive ? 'Active' : 'Inactive'}</Pill>
              </div>
              <p style={{ fontFamily: F.body, fontSize: 12, color: altActive ? C.amberText : C.textSecondary, margin: '0 0 12px', opacity: altActive ? 1 : 0.85 }}>
                {altActive
                  ? `When active, applicants may satisfy this criterion with one of the accepted documents below instead of the primary method above.${altDoc.activeExtraSentence ? ` ${altDoc.activeExtraSentence}` : ''}`
                  : (altDoc.notApplicableNote || 'Not active for this criterion — set by UrbanNest Admin.')}
              </p>
              {altActive ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ ...fieldLabel, marginBottom: 0 }}>Accepted Alternative Documents</span>
                    {altDocEditable && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <OverrideStatusBadge customized={altDocDocumentsState.overridden} />
                        {altDocDocumentsState.overridden && <button onClick={altDocDocumentsState.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
                      </div>
                    )}
                  </div>
                  {altDocEditable ? (
                    <MultiSelectDropdown options={ALTERNATIVE_DOCUMENT_OPTIONS.map((o) => ({ value: o, label: o }))} value={effectiveAltDocDocuments} onChange={altDocDocumentsState.onChange} />
                  ) : <ProtectedField note="Set by UrbanNest Admin for this criterion.">{effectiveAltDocDocuments.join(', ') || 'No alternative accepted'}</ProtectedField>}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ ...fieldLabel, marginBottom: 6 }}>Additional Notes / Conditions</div>
                    {altDocEditable ? (
                      <textarea value={effectiveAltDocNotes} onChange={(e) => altDocNotesState.onChange(e.target.value)} rows={2}
                        style={{ ...inputStyle(), width: '100%', resize: 'vertical', fontFamily: F.body, fontSize: 12.5 }} />
                    ) : <ProtectedField>{effectiveAltDocNotes || '—'}</ProtectedField>}
                  </div>
                  <div style={{ ...hintStyle, marginTop: 10 }}>
                    {altDoc.pmOverrideNote || (altDoc.pmOverrideAllowed
                      ? 'UrbanNest Admin has allowed PM customization for this section specifically — independent of the main PM Customization Permission above.'
                      : 'UrbanNest Admin has not allowed PM customization for this section — independent of the main PM Customization Permission above.')}
                  </div>
                  {altDoc.addHint && altDocEditable && <div style={{ ...hintStyle, marginTop: 4 }}>{altDoc.addHint}</div>}
                </>
              ) : (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', background: C.neutral, fontSize: 13, color: C.textTertiary }}>No alternative accepted</div>
              )}
            </div>
          );
        })()}

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ ...fieldLabel, marginBottom: 0 }}>Supported Screening Methods</span>
            {!fieldsDisabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <OverrideStatusBadge customized={screeningMethodsState.overridden} />
                {screeningMethodsState.overridden && <button onClick={screeningMethodsState.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: effectiveScreeningMethods.length ? 8 : 0 }}>
            {effectiveScreeningMethods.map((m, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.blueBg, color: C.blue, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>
                {m}
                {!fieldsDisabled && (
                  <button type="button" onClick={() => screeningMethodsState.onChange(effectiveScreeningMethods.filter((_, idx) => idx !== i))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.blue, fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                )}
              </span>
            ))}
          </div>
          {!fieldsDisabled && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input ref={chipInputRef} type="text" placeholder="Add a screening method…" style={{ ...inputStyle(), flex: 1 }} />
              <button type="button" onClick={() => {
                const v = (chipInputRef.current?.value || '').trim();
                if (v) { screeningMethodsState.onChange([...effectiveScreeningMethods, v]); if (chipInputRef.current) chipInputRef.current.value = ''; }
              }} style={btnCancel}>+ Add</button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ ...fieldLabel, marginBottom: 0 }}>Supported Providers</span>
            {!fieldsDisabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <OverrideStatusBadge customized={supportedProviderState.overridden} />
                {supportedProviderState.overridden && <button onClick={supportedProviderState.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
              </div>
            )}
          </div>
          {!fieldsDisabled ? (
            <DropdownOrCustom options={(SUPPORTED_PROVIDERS_BY_CRITERION[criterion.id] || SUPPORTED_PROVIDER_OPTIONS).map((o) => ({ value: o, label: o }))}
              value={effectiveSupportedProvider} onChange={supportedProviderState.onChange} />
          ) : <ProtectedField>{effectiveSupportedProvider}</ProtectedField>}
          <div style={hintStyle}>{extended?.supportedProvidersHint || "Options sourced from Partners → Tenant Screening's own catalogue."}</div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ ...fieldLabel, marginBottom: 0 }}>Applicable Applicant Scope</span>
            {!fieldsDisabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <OverrideStatusBadge customized={applicantScopeState.overridden} />
                {applicantScopeState.overridden && <button onClick={applicantScopeState.onReset} title="Reset to UrbanNest Default" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary }}><i className="ti ti-rotate" style={{ fontSize: 14 }} /></button>}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isCreditCheck ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8 }}>
            {scopeOptions.map((opt) => {
              const checked = effectiveApplicantScope.includes(opt);
              return (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.textPrimary, opacity: fieldsDisabled ? 0.6 : 1 }}>
                  <input type="checkbox" checked={checked} disabled={fieldsDisabled}
                    onChange={(e) => {
                      const next = e.target.checked ? [...effectiveApplicantScope, opt] : effectiveApplicantScope.filter((o) => o !== opt);
                      applicantScopeState.onChange(next);
                    }} />
                  {opt}
                </label>
              );
            })}
          </div>
          {extended?.scopeNote && <div style={{ ...hintStyle, marginTop: 8 }}>ℹ {extended.scopeNote}</div>}
        </div>

        <div style={{ ...hintStyle, marginTop: 10, fontStyle: 'italic' }}>{baselineText}</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={btnCancel}>Close</button>
        </div>
      </div>
    </div>
  );
}
// Tiny helper kept outside the component body (no closure needed) — the
// Weight % override badge/reset button should only ever show once there's
// actually a value to override, i.e. when this criterion is weight-eligible
// at all; mirrors the `weightEligible ?` branch right below it.
function weightageEligibleEditable(weightEligible) { return !!weightEligible; }

// ════════════════════════════════════════════════════════════════════════
// Main page
// ════════════════════════════════════════════════════════════════════════
export default function PMScreeningConfiguration() {
  const { user } = useAuth();
  const isOrgPM = user?.active_persona === 'ORGANIZATIONAL_PM';

  // Holds ONLY the currently active location's own bucket — see header
  // note above. Hydrated by the location-switch effect below, never read
  // from synchronously on mount (that effect covers Default too, since it
  // fires once with activePMLocation already === null).
  const [overrides, setOverrides] = useState(() => ({ ...EMPTY_OVERRIDE_BUCKET }));
  const [unAdmin, setUnAdmin] = useState(UN_ADMIN_FALLBACK);
  const [activeTab, setActiveTab] = useState('rules');
  const [openCriterionId, setOpenCriterionId] = useState(null);
  const [toast, setToast] = useState('');

  // 2026-11-13 — "My Cities" per-location scope (see header note above).
  const [activePMLocation, setActivePMLocation] = useState(null);
  const [myCitiesList, setMyCitiesList] = useState([]);
  const [addCityOpen, setAddCityOpen] = useState(false);
  const [newCityCountry, setNewCityCountry] = useState('US');
  const [newCityState, setNewCityState] = useState(statesForCountry('US')[0].name);
  const [newCityName, setNewCityName] = useState('');
  // 18th sitting follow-up — UN Admin's own configured locations, for the
  // "+ Add City" modal's City field (see below): a PM picks from cities UN
  // Admin has actually set up a record for, instead of free-typing one.
  const [unAdminLocations, setUnAdminLocations] = useState([]);

  // 18th sitting — fetch "My Cities" and UN Admin's configured locations
  // once at mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cities = await apiListMyCities();
        if (!cancelled) setMyCitiesList(cities.map((c) => ({ country: c.country, state: c.state, city: c.city })));
      } catch (err) {
        console.warn('[PMScreeningConfiguration] could not load My Cities', err);
      }
      try {
        const locs = await apiListUNAdminLocations();
        if (!cancelled) setUnAdminLocations(locs.map((l) => ({ country: l.country, state: l.state, city: l.city })));
      } catch (err) {
        console.warn('[PMScreeningConfiguration] could not load UN Admin locations', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 18th sitting follow-up — the main "My Cities" dropdown (below) lists
  // every city UN Admin has configured directly, merged with any city this
  // PM account has separately added that UN Admin hasn't configured (kept
  // so a previously-added "custom" city never silently disappears from the
  // list). Picking a UN-Admin city not yet in `myCitiesList` auto-adds it —
  // see the dropdown's onChange below — so there's no longer a required
  // "+ Add City" step for a city UN Admin has already set up; "+ Add City"
  // itself still exists for a city UN Admin hasn't configured at all.
  const myCitiesDropdownOptions = (() => {
    const seen = new Set();
    const merged = [];
    [...unAdminLocations, ...myCitiesList].forEach((loc) => {
      const key = `${loc.country}|${loc.state}|${loc.city}`;
      if (!seen.has(key)) { seen.add(key); merged.push(loc); }
    });
    return merged.sort((a, b) => `${a.city}, ${a.state}`.localeCompare(`${b.city}, ${b.state}`));
  })();

  // 18th sitting — whenever the active location changes (including the
  // initial mount, where it's Default/null), fetch UN Admin's effective
  // policy AND this PM account's own override bucket for that exact
  // location, fresh every time — same "re-read from storage on every
  // switch, unsaved edits on the location you're leaving are discarded"
  // behavior this screen always had, just backed by the real API now.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiRecord = await apiGetUNAdminConfig(activePMLocation);
        if (!cancelled) setUnAdmin(unAdminRecordFromApi(apiRecord) || UN_ADMIN_FALLBACK);
      } catch (err) {
        if (!cancelled) setUnAdmin(UN_ADMIN_FALLBACK);
        if (err.status !== 404) console.warn('[PMScreeningConfiguration] could not load UN Admin config', err);
      }
      try {
        const overrideRecord = await apiGetPMOverride(activePMLocation);
        if (!cancelled) setOverrides(overrideBucketFromApi(overrideRecord));
      } catch (err) {
        if (!cancelled) setOverrides({ ...EMPTY_OVERRIDE_BUCKET });
        if (err.status !== 404) console.warn('[PMScreeningConfiguration] could not load your customizations', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePMLocation]);

  // Whichever bucket is active right now — always just `overrides` itself,
  // since it only ever holds the active location's data (see header note).
  const activeBucket = overrides;

  // Applies a partial patch — from `updater(currentBucket)` — to the
  // active bucket. Every *State() function below (fieldState, rowState,
  // bandState, tableRowState, criterionState) reads from `activeBucket`
  // and writes through this — unchanged in shape from before the API
  // wiring; only the nested-tree branch this used to need for a specific
  // city is gone, since `overrides` is now always exactly one bucket.
  function updateOverridesBucket(updater) {
    setOverrides((prev) => ({ ...prev, ...updater(prev) }));
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  // ---- fields bucket (categoryId.fieldId) ----
  function fieldState(categoryId, field) {
    const permission = permissionFor(field.pmOverrideAllowed ?? field.pmPermission);
    const overridden = activeBucket.fields?.[categoryId]?.[field.id] !== undefined;
    const value = overridden ? activeBucket.fields[categoryId][field.id] : field.value;
    return {
      permission, value, overridden,
      onChange: (v) => updateOverridesBucket((bucket) => ({ fields: { ...bucket.fields, [categoryId]: { ...(bucket.fields?.[categoryId] || {}), [field.id]: v } } })),
      onReset: () => updateOverridesBucket((bucket) => {
        const nextFields = { ...bucket.fields };
        if (nextFields[categoryId]) { const c = { ...nextFields[categoryId] }; delete c[field.id]; nextFields[categoryId] = c; }
        return { fields: nextFields };
      }),
    };
  }

  // ---- completeness_rules rows bucket ----
  function rowState(row) {
    const editable = permissionFor(row.pmOverrideAllowed) === 'ALLOWED';
    const overridden = activeBucket.rows?.[row.id] !== undefined;
    const value = overridden ? activeBucket.rows[row.id] : row.baseline;
    return {
      editable, value, overridden,
      onChange: (v) => updateOverridesBucket((bucket) => ({ rows: { ...bucket.rows, [row.id]: v } })),
      onReset: () => updateOverridesBucket((bucket) => { const next = { ...bucket.rows }; delete next[row.id]; return { rows: next }; }),
    };
  }

  // ---- credit_risk bands — generic per-band bucket, any tier UN Admin has
  // flagged `pmOverride: true`, not just Tier B's old hardcoded special case.
  function bandState(bandId) {
    const overridden = activeBucket.bands?.[bandId] !== undefined;
    return {
      overridden, value: activeBucket.bands?.[bandId],
      onChange: (patch) => updateOverridesBucket((bucket) => ({ bands: { ...bucket.bands, [bandId]: patch } })),
      onReset: () => updateOverridesBucket((bucket) => { const next = { ...bucket.bands }; delete next[bandId]; return { bands: next }; }),
    };
  }

  // ---- generic bucket for Co-Applicant / Household / Decision Workflow
  // table rows — any row UN Admin has flagged `pmOverride: true` gets a
  // real Active/Not-Active toggle (and, where the row carries one, its own
  // numeric field) instead of the old blanket read-only rendering. ----
  function tableRowState(bucketName, row) {
    const editable = row.pmOverride === true;
    const stored = activeBucket[bucketName]?.[row.id];
    const overridden = stored !== undefined;
    const adminActive = row.locked ? true : row.active !== false;
    const activeValue = stored?.active !== undefined ? stored.active : adminActive;
    const numericValue = row.numericField
      ? (stored?.numeric !== undefined ? stored.numeric : row.numericField.value)
      : undefined;
    return {
      editable, overridden, activeValue, numericValue,
      onActiveChange: (v) => updateOverridesBucket((bucket) => ({ [bucketName]: { ...bucket[bucketName], [row.id]: { ...(bucket[bucketName]?.[row.id] || {}), active: v } } })),
      onNumericChange: (v) => updateOverridesBucket((bucket) => ({ [bucketName]: { ...bucket[bucketName], [row.id]: { ...(bucket[bucketName]?.[row.id] || {}), numeric: v } } })),
      onReset: () => updateOverridesBucket((bucket) => { const next = { ...bucket[bucketName] }; delete next[row.id]; return { [bucketName]: next }; }),
    };
  }

  // ---- Section 01 criteria override bucket — one function for baseline,
  // method, AND weightage now (Session 69), keyed by `key` under
  // activeBucket.criteria[id]. Previously this only ever handled `baseline`. ----
  function criterionState(criterionId, key = 'baseline') {
    const overridden = activeBucket.criteria?.[criterionId]?.[key] !== undefined;
    return {
      overridden, value: activeBucket.criteria?.[criterionId]?.[key],
      onChange: (v) => updateOverridesBucket((bucket) => ({ criteria: { ...bucket.criteria, [criterionId]: { ...(bucket.criteria?.[criterionId] || {}), [key]: v } } })),
      onReset: () => updateOverridesBucket((bucket) => {
        const nextCriteria = { ...bucket.criteria };
        if (nextCriteria[criterionId]) { const c = { ...nextCriteria[criterionId] }; delete c[key]; nextCriteria[criterionId] = c; }
        return { criteria: nextCriteria };
      }),
    };
  }

  async function handleSaveDraft() {
    try {
      await apiSavePMOverride(activePMLocation, overrides);
      showToast(activePMLocation ? `Saved — your customizations for ${activePMLocation.city}, ${activePMLocation.state} are stored.` : 'Saved — your customizations are stored for this account.');
    } catch (err) {
      showToast(err.message || 'Could not save.');
    }
  }

  // 2026-11-13 — clears every city's diff too, not just Default, but keeps
  // the My Cities list itself (removing a city on purpose is a separate
  // action — handleRemoveCity below — not a side effect of discarding
  // customizations). 18th sitting — each location is its own row now, so
  // "discard everything" is one DELETE per location (Default + every My
  // Cities entry) instead of one localStorage write.
  async function handleDiscardAll() {
    if (!window.confirm('Discard every customization — for Default and every city in My Cities — and revert to UrbanNest Admin defaults?')) return;
    try {
      await apiDeletePMOverride(null).catch((err) => { if (err.status !== 404) throw err; });
      for (const loc of myCitiesList) {
        // eslint-disable-next-line no-await-in-loop
        await apiDeletePMOverride(loc).catch((err) => { if (err.status !== 404) throw err; });
      }
      setOverrides({ ...EMPTY_OVERRIDE_BUCKET });
      showToast('Reverted to UrbanNest Admin defaults — for Default and every city.');
    } catch (err) {
      showToast(err.message || 'Could not discard customizations.');
    }
  }

  // ---- My Cities: add/remove persist immediately (a structural change to
  // scope, not a field edit) — mirrors UN Admin's own handleAddLocation/
  // handleDeleteLocation on its Screening Configuration screen. ----
  async function handleAddCity() {
    const country = newCityCountry.trim();
    const state = newCityState.trim();
    const city = newCityName.trim();
    if (!country || !state || !city) { showToast('Country, State, and City are all required.'); return; }
    if (myCitiesList.some((c) => c.country === country && c.state === state && c.city === city)) {
      showToast('That city is already in My Cities.');
      setAddCityOpen(false);
      return;
    }
    try {
      await apiAddMyCity({ country, state, city });
      setMyCitiesList([...myCitiesList, { country, state, city }]);
      setActivePMLocation({ country, state, city });
      setAddCityOpen(false);
      setNewCityState(statesForCountry(newCityCountry)[0].name);
      setNewCityName('');
      showToast(`Added ${city}, ${state} to My Cities.`);
    } catch (err) {
      showToast(err.message || 'Could not add city.');
    }
  }

  async function handleRemoveCity(loc) {
    if (!window.confirm(`Remove ${loc.city}, ${loc.state} from My Cities? Any customizations you made for this city will be deleted.`)) return;
    try {
      await apiRemoveMyCity(loc);
      setMyCitiesList(myCitiesList.filter((c) => !(c.country === loc.country && c.state === loc.state && c.city === loc.city)));
      if (activePMLocation && activePMLocation.country === loc.country && activePMLocation.state === loc.state && activePMLocation.city === loc.city) {
        setActivePMLocation(null);
      }
      showToast(`Removed ${loc.city}, ${loc.state} from My Cities.`);
    } catch (err) {
      showToast(err.message || 'Could not remove city.');
    }
  }

  const openCriterion = openCriterionId ? SECTION01_CRITERIA.find((c) => c.id === openCriterionId) : null;

  // 2026-11-13 follow-up: "Co-Applicant Screening" is the master switch for
  // its own table — mirrors UN Admin's own `coappGateActive` gate (Figma
  // review doc, 6th sitting §15.3). When this row's effective state (UN
  // Admin's own, or a PM override if UN Admin has flagged this row
  // `pmOverride: true`) is off, every OTHER row in this one table reads as
  // Not Active regardless of its own state/override — scoped to Co-Applicant
  // Screening's own table only, not Household, per the request.
  const coappScreeningRow = unAdmin.coapplicantRows.find((r) => r.id === 'coapp_screening');
  const coappGateActive = coappScreeningRow ? tableRowState('coapp', coappScreeningRow).activeValue : true;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>
      <NoSpinnerStyle />
      <NavB activeId="screening-rules" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <PMTopBar />
        <div style={{ flex: 1, minHeight: 0, padding: '28px 32px', overflowY: 'auto' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                Configuration <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
                <span style={{ color: C.textSecondary }}>Screening Rules</span>
              </div>
              <h1 style={{ fontFamily: F.headline, fontSize: 26, fontWeight: 500, color: C.primary, margin: '0 0 3px' }}>Screening Configuration</h1>
              <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: 0, maxWidth: 760 }}>
                Your account uses UrbanNest's platform screening policy by default. Fields marked <b>Customized</b> have been overridden for your account — everything else follows UrbanNest Admin's configuration automatically, including future changes.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={handleDiscardAll} style={{ ...btnCancel, height: 36 }}>Discard Customizations</button>
              <button onClick={handleSaveDraft} style={{ ...btnPrimary, height: 36 }}><i className="ti ti-device-floppy" /> Save</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 10, flexWrap: 'wrap' }}>
            <Pill bg={C.white} color={C.blue}><i className="ti ti-building" style={{ fontSize: 10 }} />{isOrgPM ? 'Organization Account' : 'Independent Account'}</Pill>
            <span style={{ fontSize: 11.5, color: C.textSecondary }}>
              {isOrgPM
                ? 'This override applies across your entire organization — not per property or branch.'
                : 'This override applies to your account.'}
              {' '}{!unAdmin.isLive && 'UrbanNest Admin has not published a saved policy yet — showing the platform’s shipped defaults.'}
            </span>
          </div>

          {/* 2026-11-13 — My Cities per-location scope. Sits above the tab
              strip so switching the active city swaps all 3 tabs at once,
              since they all read/write the one shared state block above. */}
          <SectionCard>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: C.textTertiary, textTransform: 'uppercase' }}>My Cities</span>
              <span style={{ fontSize: 12, color: C.textTertiary }}>{myCitiesList.length} cit{myCitiesList.length === 1 ? 'y' : 'ies'} added</span>
            </div>
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '0 0 12px', maxWidth: 820, lineHeight: 1.5 }}>
              Add the cities you operate in. Each city's settings resolve against UrbanNest Admin's configuration for that same city — or Admin's Default if Admin hasn't configured that city specifically — then you can customize anything Admin has marked PM-overridable, per city.
            </p>
            {/* 18th sitting — a single dropdown ("Default" + every city UN
                Admin has configured, merged with any city this PM account
                has separately added) in place of a pill per city, same
                change already shipped on UN Admin's own Screening
                Configuration screen: pills stop scaling once more than a
                handful of cities are added, while one dropdown stays the
                same size regardless of how many cities exist. A city's
                own ✕-to-remove pill control moves to a "Remove this city"
                link next to the "Editing: ..." banner below, since the
                dropdown itself has no natural place for it.
                18th sitting follow-up — picking a city here that isn't
                already in `myCitiesList` silently adds it first (see
                onChange) — there's no separate "add" step for a city UN
                Admin has already configured; see myCitiesDropdownOptions
                above. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div style={{ minWidth: 260 }}>
                <CustomDropdown
                  options={[
                    { value: '__DEFAULT__', label: 'Default' },
                    ...myCitiesDropdownOptions.map((loc) => ({ value: `${loc.country}|${loc.state}|${loc.city}`, label: `${loc.city}, ${loc.state}` })),
                  ]}
                  value={activePMLocation ? `${activePMLocation.country}|${activePMLocation.state}|${activePMLocation.city}` : '__DEFAULT__'}
                  onChange={async (v) => {
                    if (v === '__DEFAULT__') { setActivePMLocation(null); return; }
                    const [country, state, city] = v.split('|');
                    const alreadyMine = myCitiesList.some((c) => c.country === country && c.state === state && c.city === city);
                    if (!alreadyMine) {
                      try {
                        await apiAddMyCity({ country, state, city });
                        setMyCitiesList((prev) => [...prev, { country, state, city }]);
                      } catch (err) {
                        showToast(err.message || 'Could not add city.');
                        return;
                      }
                    }
                    setActivePMLocation({ country, state, city });
                  }}
                />
              </div>
              <button
                onClick={() => setAddCityOpen(true)}
                style={{
                  fontFamily: F.body, fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 999,
                  border: `1px dashed ${C.border}`, background: 'none', color: C.textSecondary,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                + Add City
              </button>
            </div>
            {activePMLocation ? (
              <div style={{ marginTop: 12, background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, color: C.blue, lineHeight: 1.5 }}>
                  <strong>Editing: {activePMLocation.city}, {activePMLocation.state}, {activePMLocation.country}</strong> —{' '}
                  {unAdmin.resolvedFromLocation
                    ? 'resolved against UrbanNest Admin’s own configuration for this city.'
                    : 'UrbanNest Admin hasn’t configured this city specifically, so this resolves against Admin’s Default.'}
                  {' '}Your customizations here apply only to applications in this city.
                </span>
                <button
                  onClick={() => handleRemoveCity(activePMLocation)}
                  style={{ background: 'none', border: 'none', color: C.blue, fontWeight: 600, fontSize: 12.5, textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }}
                >
                  Remove this city
                </button>
              </div>
            ) : (
              <div style={hintStyle}>Default applies to applications in any city not listed above.</div>
            )}
          </SectionCard>

          {addCityOpen && (
            <div style={overlayStyle} onClick={() => setAddCityOpen(false)}>
              <div style={{ ...modalBase, maxWidth: 420, textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>+ Add City</div>
                  <button onClick={() => setAddCityOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 16 }}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <span style={fieldLabel}>Country</span>
                    <DropdownOrCustom
                      options={[{ value: 'US', label: 'US' }, { value: 'India', label: 'India' }]}
                      value={newCityCountry}
                      onChange={(v) => { setNewCityCountry(v); setNewCityState(statesForCountry(v)[0].name); setNewCityName(''); }}
                    />
                  </div>
                  <div>
                    <span style={fieldLabel}>State</span>
                    {/* Stores the full state NAME (not the 2-letter code) as
                        the value — matches UN Admin's own "+ Add Location"
                        state dropdown and how every city added before this
                        dropdown existed is stored (e.g. "Arkansas", not
                        "AR"). */}
                    <DropdownOrCustom
                      options={statesForCountry(newCityCountry).map((s) => ({ value: s.name, label: s.name }))}
                      value={newCityState}
                      onChange={(v) => { setNewCityState(v); setNewCityName(''); }}
                      placeholder="Select a state…"
                    />
                  </div>
                  <div>
                    <span style={fieldLabel}>City</span>
                    {/* 18th sitting correction — back to plain free text,
                        matching UN Admin's own "+ Add Location" City field
                        exactly. This modal is ONLY for a city UN Admin
                        hasn't configured at all — a city PM-exclusive to
                        this account — now that the main "My Cities"
                        dropdown above already lists every UN-Admin-
                        configured city directly and auto-adds one on
                        selection (see myCitiesDropdownOptions / that
                        dropdown's onChange). A dropdown of UN Admin's
                        cities had no place here, since by definition this
                        form is for a city that ISN'T one of those. */}
                    <input value={newCityName} onChange={(e) => setNewCityName(e.target.value)} placeholder="e.g. Bentonville" style={inputStyle()} />
                  </div>
                  <div style={{ ...hintStyle, background: C.pageBg, padding: '10px 12px', borderRadius: 8, marginTop: 0 }}>
                    UrbanNest Admin hasn't configured this city, so it'll start from Admin's Default — you can then customize anything Admin has marked PM-overridable, same as your account-wide customizations today.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => setAddCityOpen(false)} style={btnCancel}>Cancel</button>
                    <button onClick={handleAddCity} style={{ ...btnPrimary, background: C.primary, color: C.white, border: 'none' }}>Add City</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
            {[['rules', 'Screening Rules'], ['decisions', 'Evaluation & Decisions'], ['audit', 'Compliance & Audit']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, padding: '10px 16px', border: 'none', background: 'none', color: activeTab === id ? C.primary : C.textTertiary, borderBottom: `2px solid ${activeTab === id ? C.primary : 'transparent'}`, marginBottom: -1, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'rules' && unAdmin.categories.map((cat) => {
            if (cat.kind === 'fields') return <FieldsSection key={cat.id} category={cat} getFieldState={fieldState} />;
            if (cat.kind === 'table') return <CompletenessTable key={cat.id} category={cat} getRowState={rowState} />;
            if (cat.kind === 'cards') return <CardsSection key={cat.id} category={cat} getFieldState={fieldState} />;
            if (cat.kind === 'bands') return <BandsSection key={cat.id} category={cat} getBandState={bandState} extraToggleValue={cat.extraToggle?.value} />;
            // 2026-11-18 — the 6 rebuilt scenario-outcome sections (Identity
            // & Fraud, Income & Financial, Credit Risk, Rental History &
            // Eviction, Criminal Background, Employment Verification) plus
            // the repositioned Evaluation Outcome & Weightage section.
            if (cat.kind === 'scenarioOutcomes') return <ScenarioOutcomesSection key={cat.id} category={cat} getRowState={(row) => tableRowState('scenarioRows', row)} />;
            if (cat.kind === 'outcomeWeightage') return <OutcomeWeightageSection key={cat.id} category={cat} />;
            return null;
          })}

          {activeTab === 'decisions' && (
            <>
              <SectionCard title="1. Screening Criteria Framework" subtitle="Click a criterion to view its evaluation parameters.">
                <div style={{ ...hintStyle, marginBottom: 12 }}>{PLATFORM_RULE_CALLOUT}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {SECTION01_CRITERIA.map((criterion) => {
                    const permission = permissionFor(unAdmin.criteriaPermissions[criterion.id]);
                    const adminWeightage = unAdmin.criteriaWeightage[criterion.id] ?? 0;
                    const weightage = activeBucket.criteria?.[criterion.id]?.weightage ?? adminWeightage;
                    const active = unAdmin.criteriaActive[criterion.id] !== false;
                    const weightEligible = unAdmin.criteriaWeightEligible[criterion.id] !== false;
                    const category = activeBucket.criteria?.[criterion.id]?.category ?? unAdmin.criteriaCategory[criterion.id];
                    const extended = unAdmin.criteriaExtended[criterion.id] || {};
                    const raw = getCriterionBaselineRaw(criterion, unAdmin);
                    const displayValue = raw;
                    return (
                      <CriterionCard key={criterion.id} criterion={criterion} displayValue={displayValue} extra={unAdmin.extra} extended={extended}
                        weightEligible={weightEligible} active={active} weightage={weightage} permission={permission} category={category}
                        onOpen={setOpenCriterionId} />
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="2. Co-Applicant Screening" subtitle="Follows UrbanNest Admin's configuration. Rows marked Customized have been overridden for your account.">
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {HOUSEHOLD_PIPELINE_STAGES.map((s) => <Pill key={s.id} bg={C.neutral} color={C.textSecondary}>{s.id}. {s.title}</Pill>)}
                </div>
                <ReadOnlyTable
                  columns={[{ label: 'Parameter', width: '1.4fr' }, { label: 'Rule', width: '2fr' }, { label: 'Status', width: '1.1fr' }]}
                  rows={unAdmin.coapplicantRows}
                  renderRow={(row) => {
                    const isGate = row.id === 'coapp_screening';
                    const st = tableRowState('coapp', row);
                    return (
                      <>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{row.parameter}</span>
                        <span style={{ fontSize: 12, color: C.textSecondary }}>{row.rule}</span>
                        <OverridableStatusCell row={row} state={st} gated={!isGate && !coappGateActive} />
                      </>
                    );
                  }}
                />
              </SectionCard>

              <SectionCard title="3. Household Screening" subtitle="Follows UrbanNest Admin's configuration. Rows marked Customized have been overridden for your account.">
                <ReadOnlyTable
                  columns={[{ label: 'Parameter', width: '1.4fr' }, { label: 'Rule', width: '2fr' }, { label: 'Status', width: '1.1fr' }]}
                  rows={unAdmin.householdRows}
                  renderRow={(row) => {
                    const st = tableRowState('household', row);
                    return (
                      <>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{row.parameter}</span>
                        <span style={{ fontSize: 12, color: C.textSecondary }}>{row.rule}</span>
                        <OverridableStatusCell row={row} state={st} />
                      </>
                    );
                  }}
                />
              </SectionCard>

              <SectionCard title="4. AI & Automated Decision Guardrails" subtitle="Configured by UrbanNest Admin — not PM-customizable." badge={<LockedActionsPill />}>
                <ReadOnlyTable
                  columns={[{ label: 'Capability', width: '1.4fr' }, { label: 'Directive', width: '2fr' }, { label: 'Status', width: '0.9fr' }]}
                  rows={DEFAULT_AI_GUARDRAIL_ROWS}
                  renderRow={(row) => (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{row.capability}</span>
                      <span style={{ fontSize: 12, color: C.textSecondary }}>{row.directive}</span>
                      <Pill bg={row.status === 'PROHIBITED' ? C.dangerBg : row.status === 'MANDATORY' ? C.blueBg : C.greenBg} color={row.status === 'PROHIBITED' ? C.danger : row.status === 'MANDATORY' ? C.blue : C.green}>{row.status}</Pill>
                    </>
                  )}
                />
                <div style={{ ...hintStyle, marginTop: 10, fontStyle: 'italic' }}>
                  Illustrative example only — no live model exists. Applicant "{AI_LIVE_EVAL_SAMPLE.applicantName}" ({AI_LIVE_EVAL_SAMPLE.applicationRef}) is fabricated demo content carried over from UrbanNest Admin's own screen.
                </div>
              </SectionCard>

              <SectionCard title="5. Application Decision Workflow" subtitle="Follows UrbanNest Admin's configuration. Rows marked Customized have been overridden for your account.">
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {APPLICATION_LIFECYCLE_STAGES.map((s) => <Pill key={s.id} bg={C.neutral} color={C.textSecondary}>{s.id}. {s.title}</Pill>)}
                </div>
                <ReadOnlyTable
                  columns={[{ label: 'Control', width: '1.3fr' }, { label: 'Definition', width: '2fr' }, { label: 'Outcomes', width: '1fr' }, { label: 'Status', width: '1.1fr' }]}
                  rows={unAdmin.decisionWorkflowRows}
                  renderRow={(row) => {
                    const st = tableRowState('decisionWorkflow', row);
                    return (
                      <>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{row.control}{row.sample && <SampleTag style={{ marginLeft: 6 }} />}</span>
                        <span style={{ fontSize: 12, color: C.textSecondary }}>{row.definition}</span>
                        <span style={{ fontSize: 12, color: C.textSecondary, whiteSpace: 'nowrap' }}>{row.outcomes}</span>
                        <OverridableStatusCell row={row} state={st} />
                      </>
                    );
                  }}
                />
                <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
                  {LIFECYCLE_STATUS_GLOSSARY.map((g) => (
                    <div key={g.term} style={{ fontSize: 11, color: C.textSecondary, maxWidth: 260 }}>
                      <b style={{ color: C.textPrimary }}>{g.term}{g.sample && <SampleTag style={{ marginLeft: 6 }} />}</b> — {g.def}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === 'audit' && (
            <>
              <SectionCard title="Compliance Safeguards" subtitle="Baseline regulatory standards maintained across all UrbanNest screening pipelines — not PM-customizable." badge={<LockedActionsPill />}>
                <ReadOnlyTable
                  columns={[{ label: 'Rule', width: '1.1fr' }, { label: 'Description', width: '2.2fr' }, { label: 'Status', width: '1fr' }, { label: 'Source', width: '0.9fr' }]}
                  rows={unAdmin.complianceSafeguardRows}
                  renderRow={(row) => (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{row.rule}</span>
                      <span style={{ fontSize: 12, color: C.textSecondary }}>{row.description}</span>
                      <Pill bg={C.greenBg} color={C.green}>{row.statusLabel}</Pill>
                      <span style={{ fontSize: 12, color: C.textSecondary }}>{row.source}</span>
                    </>
                  )}
                />
              </SectionCard>

              <SectionCard title="Audit Trail" subtitle="UrbanNest automatically records important screening activities and application decisions for future reference.">
                <ReadOnlyTable
                  columns={[{ label: 'Activity', width: '1.1fr' }, { label: 'What UrbanNest Records', width: '2.6fr' }, { label: 'Status', width: '0.9fr' }]}
                  rows={AUDIT_TRAIL_ROWS}
                  renderRow={(row) => (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{row.activity}</span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {row.recordsTags.map((t) => <Pill key={t} bg={C.neutral} color={C.textSecondary}>{t}</Pill>)}
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Pill bg={C.greenBg} color={C.green}>Enabled</Pill><SampleTag /></span>
                    </>
                  )}
                />
              </SectionCard>

              <SectionCard title="Data Retention" subtitle="Applicant information and screening records are retained according to UrbanNest's applicable market-specific retention policies.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div><label style={fieldLabel}>Retention Policy</label><div style={{ fontSize: 13, color: C.textPrimary }}>{DATA_RETENTION_INFO.retentionPolicy}</div></div>
                  <div><label style={fieldLabel}>Applicable Market</label><div style={{ fontSize: 13, color: C.textPrimary }}>{DATA_RETENTION_INFO.applicableMarket}</div></div>
                  <div><label style={fieldLabel}>Policy Status</label><div style={{ fontSize: 13, color: C.textPrimary }}>{DATA_RETENTION_INFO.policyStatus}</div></div>
                  <div><label style={fieldLabel}>Management</label><div style={{ fontSize: 13, color: C.textPrimary }}>{DATA_RETENTION_INFO.management}</div></div>
                </div>
              </SectionCard>
            </>
          )}

        </div>
      </div>

      {openCriterion && (
        <CriterionDrawer
          criterion={openCriterion}
          permission={permissionFor(unAdmin.criteriaPermissions[openCriterion.id])}
          active={unAdmin.criteriaActive[openCriterion.id] !== false}
          weightEligible={unAdmin.criteriaWeightEligible[openCriterion.id] !== false}
          weightage={unAdmin.criteriaWeightage[openCriterion.id] ?? 0}
          mode={unAdmin.criteriaMode[openCriterion.id]}
          category={unAdmin.criteriaCategory[openCriterion.id]}
          requirement={unAdmin.criteriaRequirement[openCriterion.id]}
          extra={unAdmin.extra}
          extended={unAdmin.criteriaExtended[openCriterion.id] || {}}
          raw={getCriterionBaselineRaw(openCriterion, unAdmin)}
          weightageState={criterionState(openCriterion.id, 'weightage')}
          modeState={criterionState(openCriterion.id, 'mode')}
          categoryState={criterionState(openCriterion.id, 'category')}
          requirementState={criterionState(openCriterion.id, 'requirement')}
          baselineState={criterionState(openCriterion.id, 'baseline')}
          screeningMethodsState={criterionState(openCriterion.id, 'screeningMethods')}
          supportedProviderState={criterionState(openCriterion.id, 'supportedProvider')}
          applicantScopeState={criterionState(openCriterion.id, 'applicantScope')}
          altDocDocumentsState={criterionState(openCriterion.id, 'altDocDocuments')}
          altDocNotesState={criterionState(openCriterion.id, 'altDocNotes')}
          onClose={() => setOpenCriterionId(null)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: C.primary, color: C.white, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontFamily: F.body, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
