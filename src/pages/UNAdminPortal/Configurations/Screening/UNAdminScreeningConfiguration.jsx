// src/pages/UNAdminPortal/Configurations/Screening/UNAdminScreeningConfiguration.jsx
//
// UN Admin Portal → Configurations → Screening Config
// (NavE.jsx's existing, previously-unbuilt `config-screening` nav slot —
// `/admin-portal/config/screening`. No nav change was needed: this id and
// route were already reserved, just never had a page behind them.)
//
// Built from a reviewed Figma ("Application Screening Configuration") — see
// screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
// in the Claude Project for the full evaluation this implements, including
// why this lives here rather than under a new nav structure, and why
// "Applications" in this feature's own domain (tenant rental applications)
// is unrelated to the existing, different `operations-applications` screen
// (PM/Org-PM onboarding review).
//
// REAL vs SAMPLE (applied uniformly across all 7 sections, per the review):
// every numeric/toggle/text POLICY VALUE a UN Admin sets is real, editable,
// and saved to the real backend (18th sitting — rules_engine.tenant_screening,
// mounted at /api/admin/screening-config/; see screeningConfigApi.js for the
// FE wiring). Every named VENDOR/
// ENGINE/compliance-gateway claim (Socure, Persona, Plaid, Argyle,
// TransUnion, LexisNexis, "ALL SCREENING GATEWAYS OPERATIONAL", audit
// signatures, the version/release tag) is amber Sample-tagged — none of
// those integrations exist, and nothing here is yet read by a real
// screening engine (ApplicantScreening is still a manual status field per
// the Application Intake backend plan).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  C, F, Pill, SampleTag, DeadEndButton, Toggle,
  SampleOverlayBanner, PermissionRadioGroup, DropdownOrCustom, MultiSelectDropdown,
  NoSpinnerStyle, noSpinnerClass,
  overlayStyle, modalBase, btnPrimary, btnCancel, fieldLabel, hintStyle, inputStyle,
} from './screeningConfigTokens';
import {
  POLICY_META_DEFAULTS, DEFAULT_SCREENING_CATEGORIES, computePolicyStats,
  CRITERIA_EXTRA_DEFAULTS, SECTION01_CRITERIA, PLATFORM_RULE_CALLOUT,
  CRITERIA_WEIGHTAGE_DEFAULTS,
  HOUSEHOLD_PIPELINE_STAGES, DEFAULT_COAPPLICANT_ROWS, DEFAULT_HOUSEHOLD_ROWS,
  DEFAULT_AI_GUARDRAIL_ROWS, AI_LIVE_EVAL_SAMPLE,
  APPLICATION_LIFECYCLE_STAGES, DEFAULT_DECISION_WORKFLOW_ROWS,
  LIFECYCLE_STATUS_GLOSSARY,
  DEFAULT_COMPLIANCE_SAFEGUARD_ROWS, AUDIT_TRAIL_ROWS, DATA_RETENTION_INFO,
  statesForCountry,
  // Session 73 — Evaluation Outcome & Weightage / scenario-grid rendering,
  // plus the new drawer fields (Supported Markets/Providers/Applicant
  // Scope, embedded Alternative Documentation, Rent Baseline Type,
  // Employment default documents, Identity approved documents).
  EVALUATION_OUTCOME_OPTIONS, CRITERIA_EXTENDED_DEFAULTS,
  RENT_BASELINE_TYPE_OPTIONS, IDENTITY_DOCUMENT_OPTIONS,
  SUPPORTED_PROVIDER_OPTIONS, APPLICANT_SCOPE_OPTIONS,
  ALTERNATIVE_DOCUMENT_OPTIONS,
  // 2026-11-17 — Credit Check drawer unprotect pass: Mode/Category
  // dropdown catalogues, the Score Tiers "Evaluation Outcome" dropdown
  // catalogue, and Credit Check's own capability-matrix-filtered
  // Supported Providers list.
  MODE_OPTIONS, CATEGORY_OPTIONS, SCORE_TIER_OUTCOME_OPTIONS,
  SUPPORTED_PROVIDERS_BY_CRITERION,
} from './mockTenantScreeningConfig';
import { CustomDropdown } from '../../../../components/ui';

// 18th sitting — real backend now exists (rules_engine.tenant_screening,
// mounted at /api/admin/screening-config/ — see screeningConfigApi.js).
// This screen no longer reads/writes localStorage at all: every location is
// its own row server-side (ScreeningConfigRecord), fetched/saved via the
// functions imported below. `recordFromApi`/`toDataPayload` adapt between
// the API's {data, is_submitted, saved_at} shape and this screen's existing
// flat record shape ({categories, extra, ..., isSubmitted, savedAt}) —
// everything downstream of that (applyRecordToState, extractDefaultRecord,
// every table/field handler) is untouched, since the flat shape itself
// didn't change, only where it comes from.
import {
  apiGetScreeningConfig, apiSaveScreeningConfig, apiDeleteScreeningConfigLocation,
  apiListScreeningConfigLocations,
} from './screeningConfigApi';

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

// 2026-11-18 — storage key for the Screening Rules tab's collapse/expand
// UI state (see the `collapsedSectionIds` state below for why this is a
// separate, clearly-scoped key rather than anything near the real
// screening-config save pipeline).
const SCREENING_RULES_COLLAPSE_STORAGE_KEY = 'un_screening_rules_collapsed_sections';

// Backend record → this screen's flat shape. `data` holds everything except
// is_submitted/saved_at, which are their own DB columns (not nested) — see
// admin_views.py's ScreeningConfigDetailView docstring.
function recordFromApi(apiRecord) {
  if (!apiRecord) return null;
  return { ...(apiRecord.data || {}), isSubmitted: apiRecord.is_submitted || false, savedAt: apiRecord.saved_at || null };
}

// This screen's flat shape → the API's `data` payload (strips isSubmitted/
// savedAt, which PUT sends as their own top-level fields instead).
function toDataPayload(record) {
  const { isSubmitted, savedAt, ...data } = record || {};
  return data;
}

// Rebuilds the "Default" record from a fetched flat record (or null),
// falling back to the shipped mock defaults field-by-field exactly like
// each useState initializer below already does — the single source of
// truth both the initial mount AND a new location's clone-from-Default draw
// from, so the two paths can never drift apart. (Name/shape unchanged from
// before this rewiring pass — only its caller's source of `stored` changed,
// from a parsed localStorage blob to a fetched API record.)
function extractDefaultRecord(stored) {
  const permDefaults = {};
  SECTION01_CRITERIA.forEach((c) => { permDefaults[c.id] = c.defaultPermission; });
  const activeDefaults = {};
  SECTION01_CRITERIA.forEach((c) => { activeDefaults[c.id] = true; });
  const weightEligibleDefaults = {};
  SECTION01_CRITERIA.forEach((c) => { weightEligibleDefaults[c.id] = c.weightEligible !== false; });
  // 2026-11-17 — Mode / Category / Requirement are now real, editable,
  // per-criterion state (previously read-only off the static criterion.*
  // fields) — so far only unprotected in CriterionDrawer's UI for Credit
  // Check specifically (per explicit request), but every criterion gets a
  // default here so the plumbing is uniform and ready if the others are
  // unprotected later too.
  const modeDefaults = {};
  SECTION01_CRITERIA.forEach((c) => { modeDefaults[c.id] = c.mode; });
  const categoryDefaults = {};
  SECTION01_CRITERIA.forEach((c) => { categoryDefaults[c.id] = c.category; });
  const requirementDefaults = {};
  SECTION01_CRITERIA.forEach((c) => { requirementDefaults[c.id] = c.requirement; });
  return {
    categories: stored?.categories ? deepClone(stored.categories) : deepClone(DEFAULT_SCREENING_CATEGORIES),
    extra: stored?.extra ? { ...deepClone(CRITERIA_EXTRA_DEFAULTS), ...stored.extra } : deepClone(CRITERIA_EXTRA_DEFAULTS),
    criteriaPermissions: stored?.criteriaPermissions ? { ...permDefaults, ...stored.criteriaPermissions } : permDefaults,
    criteriaActive: stored?.criteriaActive ? { ...activeDefaults, ...stored.criteriaActive } : activeDefaults,
    criteriaWeightage: stored?.criteriaWeightage ? { ...CRITERIA_WEIGHTAGE_DEFAULTS, ...stored.criteriaWeightage } : { ...CRITERIA_WEIGHTAGE_DEFAULTS },
    criteriaWeightEligible: stored?.criteriaWeightEligible ? { ...weightEligibleDefaults, ...stored.criteriaWeightEligible } : weightEligibleDefaults,
    criteriaMode: stored?.criteriaMode ? { ...modeDefaults, ...stored.criteriaMode } : modeDefaults,
    criteriaCategory: stored?.criteriaCategory ? { ...categoryDefaults, ...stored.criteriaCategory } : categoryDefaults,
    criteriaRequirement: stored?.criteriaRequirement ? { ...requirementDefaults, ...stored.criteriaRequirement } : requirementDefaults,
    criteriaExtendedConfig: stored?.criteriaExtendedConfig ? { ...deepClone(CRITERIA_EXTENDED_DEFAULTS), ...stored.criteriaExtendedConfig } : deepClone(CRITERIA_EXTENDED_DEFAULTS),
    coapplicantRows: stored?.coapplicantRows ? deepClone(stored.coapplicantRows) : deepClone(DEFAULT_COAPPLICANT_ROWS).map((r) => ({ ...r, active: true })),
    householdRows: stored?.householdRows ? deepClone(stored.householdRows) : deepClone(DEFAULT_HOUSEHOLD_ROWS).map((r) => ({ ...r, active: true })),
    aiGuardrailRows: stored?.aiGuardrailRows ? deepClone(stored.aiGuardrailRows) : deepClone(DEFAULT_AI_GUARDRAIL_ROWS),
    decisionWorkflowRows: stored?.decisionWorkflowRows ? deepClone(stored.decisionWorkflowRows) : deepClone(DEFAULT_DECISION_WORKFLOW_ROWS).map((r) => ({ ...r, active: true })),
    complianceSafeguardRows: stored?.complianceSafeguardRows ? deepClone(stored.complianceSafeguardRows) : deepClone(DEFAULT_COMPLIANCE_SAFEGUARD_ROWS).map((r) => ({ ...r, active: true })),
    targetMarketJurisdiction: stored?.targetMarketJurisdiction || 'US',
    // A freshly-cloned location always starts unsubmitted/editable, even if
    // Default happens to be submitted right now — submission is per-record.
    isSubmitted: false,
    savedAt: null,
  };
}

// ─── Small shared pieces ──────────────────────────────────────────────────────

function LockBadge() {
  return (
    <span title="Locked — PMs cannot override this value" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: C.textTertiary, fontSize: 10.5 }}>
      <i className="ti ti-lock" style={{ fontSize: 11 }} /> Locked
    </span>
  );
}

function SectionCard({ children, style }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}

// 2026-11-18 — generic collapse/expand wrapper for a section's header
// content. Deliberately does NOT reach into SectionHeading's own markup —
// it just wraps whatever header JSX a Tab 1 section renderer already
// builds (a plain SectionHeading, or SectionHeading plus a sibling badge
// row, as ScenarioOutcomesSection has) in a clickable row with a chevron,
// so every section's existing header layout stays untouched regardless of
// its shape. Only passed `onToggle` by the Tab 1 ("Screening Rules")
// section renderers below — Tab 2/3's own SectionCard+SectionHeading call
// sites are untouched and keep their current non-collapsible look.
function CollapsibleSectionHeader({ collapsed, onToggle, children }) {
  return (
    <div
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      role="button"
      tabIndex={0}
      aria-expanded={!collapsed}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
    >
      <i
        className={`ti ti-chevron-${collapsed ? 'right' : 'down'}`}
        style={{ fontSize: 16, color: C.textTertiary, flexShrink: 0, marginTop: 8 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function SectionHeading({ number, title, subtitle, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.pageBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
          {String(number).padStart(2, '0')}
        </div>
        <div>
          <div style={{ fontFamily: F.headline, fontSize: 17, fontWeight: 700, color: C.textPrimary }}>{title}</div>
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>
      {badge}
    </div>
  );
}

// Generic editable field — handles text / number / date / toggle / readonly /
// select. `onPatch` (Session 63) merges arbitrary extra keys into the field
// — used by the PM Override mini-control below, which a field opts into by
// setting `pmOverrideAllowed` (plus `pmMin`/`pmMax` if bounds apply).
function EditableField({ field, onChange, onPatch }) {
  const disabled = !!field.locked;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
        <span style={{ ...fieldLabel, ...(field.labelNoWrap ? { whiteSpace: 'nowrap' } : {}) }}>{field.label}</span>
        {/* Session 64: fields that set `lockToggle` get a real interactive
            Locked/Unlocked switch here instead of the plain static
            LockBadge every other locked field on this screen still uses —
            flipping it calls onPatch({ locked }), which also re-enables/
            disables the field's own input below via `disabled` above. */}
        {field.lockToggle ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Toggle value={!!field.locked} onChange={(v) => onPatch && onPatch({ locked: v })} />
            <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: field.locked ? C.textTertiary : C.green, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {field.locked ? 'Locked' : 'Unlocked'}
            </span>
          </span>
        ) : (
          field.locked && <LockBadge />
        )}
        {field.sample && <SampleTag />}
      </div>

      {field.type === 'toggle' ? (
        <Toggle value={!!field.value} disabled={disabled} onChange={(v) => onChange(v)} />
      ) : field.type === 'readonly' ? (
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary, fontWeight: 600 }}>{field.value}</div>
      ) : field.type === 'select' ? (
        <DropdownOrCustom
          options={field.options || []}
          value={field.value}
          disabled={disabled}
          onChange={onChange}
        />
      ) : field.type === 'multiselect' ? (
        <MultiSelectDropdown
          options={field.options || []}
          value={field.value}
          disabled={disabled}
          onChange={onChange}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            value={field.value}
            step={field.step || undefined}
            disabled={disabled}
            className={field.type === 'number' ? noSpinnerClass : undefined}
            onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
            style={{ ...inputStyle(disabled), maxWidth: field.type === 'date' ? 160 : undefined }}
          />
          {/* Session 63: suffix no longer forced to nowrap — a long suffix
              (e.g. Criminal Background's lookback text) now wraps within
              the grid cell instead of overflowing past it. */}
          {field.suffix && <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>{field.suffix}</span>}
        </div>
      )}

      {field.pmOverrideAllowed !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...fieldLabel, marginBottom: 0 }}>PM Override</span>
            <Toggle value={!!field.pmOverrideAllowed} onChange={(v) => onPatch({ pmOverrideAllowed: v })} />
            <Pill bg={field.pmOverrideAllowed ? C.greenBg : C.neutral} color={field.pmOverrideAllowed ? C.green : C.textTertiary}>{field.pmOverrideAllowed ? 'Yes' : 'No'}</Pill>
          </div>
          {/* Session 64: this min/max pair had no label of its own — fixed
              by giving it the same "PM Override Bounds" caption the
              Completeness Rules table column (and the Criterion drawers)
              already use for the identical concept. */}
          {field.pmOverrideAllowed && field.pmMin != null && field.pmMax != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ ...fieldLabel, marginBottom: 0 }}>PM Override Bounds</span>
              <input type="number" value={field.pmMin} className={noSpinnerClass} onChange={(e) => onPatch({ pmMin: Number(e.target.value) })} style={{ ...inputStyle(), width: 58 }} />
              <span style={{ fontSize: 11, color: C.textTertiary }}>to</span>
              <input type="number" value={field.pmMax} className={noSpinnerClass} onChange={(e) => onPatch({ pmMax: Number(e.target.value) })} style={{ ...inputStyle(), width: 58 }} />
              {field.pmUnit && <span style={{ fontSize: 11, color: C.textSecondary }}>{field.pmUnit}</span>}
            </div>
          )}
        </div>
      )}
      {field.hint && <div style={hintStyle}>{field.hint}</div>}
    </div>
  );
}

function FieldGrid({ fields, onFieldChange, onFieldPatch }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
      {fields.map((f) => (
        <EditableField key={f.id} field={f} onChange={(v) => onFieldChange(f.id, v)} onPatch={onFieldPatch ? (patch) => onFieldPatch(f.id, patch) : undefined} />
      ))}
    </div>
  );
}

// ─── Section renderers (one per `kind`) ───────────────────────────────────────

function FieldsSection({ category, onFieldChange, onFieldPatch, collapsed, onToggleCollapse }) {
  return (
    <SectionCard>
      <CollapsibleSectionHeader collapsed={collapsed} onToggle={onToggleCollapse}>
        <SectionHeading
          number={category.sectionNumber}
          title={category.title}
          subtitle={category.subtitle}
          badge={category.vendorBadgeLabel ? (
            <Pill bg={C.blueBg} color={C.blue}>
              {category.vendorBadgeLabel}
              {category.vendorBadgeSample && <SampleTag style={{ marginLeft: 6 }} />}
            </Pill>
          ) : category.complianceBadgeLabel ? (
            <Pill bg={C.greenBg} color={C.green}>
              <i className="ti ti-shield-check" style={{ fontSize: 12, marginRight: 3 }} />
              {category.complianceBadgeLabel}
              <SampleTag style={{ marginLeft: 6 }} />
            </Pill>
          ) : null}
        />
      </CollapsibleSectionHeader>
      {!collapsed && <FieldGrid fields={category.fields} onFieldChange={onFieldChange} onFieldPatch={onFieldPatch} />}
    </SectionCard>
  );
}

// Session 63: Enforcement Status is now a real editable dropdown (it was a
// read-only Pill before), and the Employment & Income row's PM Override
// Bounds cell is now a document-type dropdown instead of free text.
const ENFORCEMENT_OPTIONS = [
  { value: 'MANDATORY', label: 'Mandatory' },
  { value: 'CUSTOMISE', label: 'Customise' },
];
// Session 67 — Target Market Jurisdiction's new dropdown. Only these two
// markets exist as options today, per request.
const JURISDICTION_OPTIONS = [
  { value: 'US', label: 'US' },
  { value: 'India', label: 'India' },
];
const EMPLOYMENT_DOC_OPTIONS = [
  { value: 'W2', label: 'W-2' },
  { value: 'TaxReturns', label: 'Tax Returns' },
  { value: 'Paystubs', label: 'Pay Stubs' },
];
// 2026-11-17 — CriterionDrawer's own "Supported Markets" field (Section 01
// criteria, `criteriaExtendedConfig[id].supportedMarkets`) stores full
// country names ('United States', 'India') per the approved wireframe's own
// Add/Edit Criterion drawers — NOT the 'US'/'India' codes JURISDICTION_OPTIONS
// above uses for targetMarketJurisdiction / newLocCountry / statesForCountry()
// elsewhere on this screen. Kept as its own separate options list rather than
// changing JURISDICTION_OPTIONS itself, since those other 3 call sites depend
// on the 'US' code value.
const SUPPORTED_MARKET_OPTIONS = [
  { value: 'United States', label: 'United States' },
  { value: 'India', label: 'India' },
];

function CompletenessTable({ category, onRowChange, collapsed, onToggleCollapse }) {
  return (
    <SectionCard>
      <CollapsibleSectionHeader collapsed={collapsed} onToggle={onToggleCollapse}>
        <SectionHeading number={category.sectionNumber} title={category.title} subtitle={category.subtitle} />
      </CollapsibleSectionHeader>
      {!collapsed && (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
          <thead>
            <tr>
              {category.tableColumns.map((col) => (
                <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 700, color: C.textPrimary, verticalAlign: 'top' }}>
                  {row.module}
                  {row.sample && <SampleTag style={{ marginLeft: 8 }} />}
                  {row.hint && <div style={{ ...hintStyle, maxWidth: 260 }}>{row.hint}</div>}
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top', minWidth: 150 }}>
                  <div style={{ maxWidth: 160 }}>
                    <DropdownOrCustom options={ENFORCEMENT_OPTIONS} value={row.enforcement} disabled={!!row.locked} onChange={(v) => onRowChange(row.id, { enforcement: v })} />
                  </div>
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top', minWidth: 220 }}>
                  {typeof row.baseline === 'number' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <input type="number" value={row.baseline} className={noSpinnerClass} onChange={(e) => onRowChange(row.id, { baseline: Number(e.target.value) })} style={{ ...inputStyle(), width: 70 }} />
                      <span style={{ fontSize: 11.5, color: C.textSecondary }}>{row.baselineSuffix}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12.5, color: C.textPrimary }}>{row.baseline}</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                  {row.locked ? <LockBadge /> : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle value={!!row.pmOverrideAllowed} onChange={(v) => onRowChange(row.id, { pmOverrideAllowed: v })} />
                      <Pill bg={row.pmOverrideAllowed ? C.greenBg : C.neutral} color={row.pmOverrideAllowed ? C.green : C.textTertiary}>{row.pmOverrideAllowed ? 'Yes' : 'No'}</Pill>
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top', minWidth: 170 }}>
                  {row.locked ? (
                    <LockBadge />
                  ) : !row.pmOverrideAllowed ? (
                    <span style={{ fontSize: 12, color: C.textTertiary }}>—</span>
                  ) : row.pmOverrideDocType !== undefined ? (
                    <div style={{ maxWidth: 160 }}>
                      <DropdownOrCustom
                        options={EMPLOYMENT_DOC_OPTIONS}
                        value={row.pmOverrideDocType}
                        onChange={(v) => onRowChange(row.id, { pmOverrideDocType: v, baselineSuffix: v === 'Paystubs' ? 'months' : 'years' })}
                      />
                    </div>
                  ) : row.pmMin != null && row.pmMax != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <input type="number" value={row.pmMin} className={noSpinnerClass} onChange={(e) => onRowChange(row.id, { pmMin: Number(e.target.value) })} style={{ ...inputStyle(), width: 58 }} />
                      <span style={{ fontSize: 11, color: C.textTertiary }}>to</span>
                      <input type="number" value={row.pmMax} className={noSpinnerClass} onChange={(e) => onRowChange(row.id, { pmMax: Number(e.target.value) })} style={{ ...inputStyle(), width: 58 }} />
                      <span style={{ fontSize: 11, color: C.textSecondary }}>{row.pmUnit}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: C.textSecondary }}>{row.pmOverrideNote || '—'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </SectionCard>
  );
}

function CardsSection({ category, onFieldChange, onFieldPatch, collapsed, onToggleCollapse }) {
  return (
    <SectionCard>
      <CollapsibleSectionHeader collapsed={collapsed} onToggle={onToggleCollapse}>
        <SectionHeading
          number={category.sectionNumber}
          title={category.title}
          subtitle={category.subtitle}
          badge={category.primaryEngineLabel && (
            <Pill bg={C.blueBg} color={C.blue}>
              Primary engine: {category.primaryEngineLabel}
              {category.engineSample && <SampleTag style={{ marginLeft: 6 }} />}
            </Pill>
          )}
        />
      </CollapsibleSectionHeader>
      {!collapsed && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {category.cards.map((card) => (
          <div key={card.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, background: C.pageBg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap' }}>{card.title}</div>
              {card.sample && <SampleTag label="Sample" />}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>{card.body}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {card.fields.map((f) => (
                <EditableField key={f.id} field={f} onChange={(v) => onFieldChange(card.id, f.id, v)}
                  onPatch={onFieldPatch ? (patch) => onFieldPatch(card.id, f.id, patch) : undefined} />
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </SectionCard>
  );
}

function BandsSection({ category, onBandChange, onToggleChange, collapsed, onToggleCollapse }) {
  return (
    <SectionCard>
      <CollapsibleSectionHeader collapsed={collapsed} onToggle={onToggleCollapse}>
        <SectionHeading
          number={category.sectionNumber}
          title={category.title}
          subtitle={category.subtitle}
          badge={category.vendorBadgeLabel && (
            <Pill bg={C.blueBg} color={C.blue}>
              {category.vendorBadgeLabel}
              {category.vendorBadgeSample && <SampleTag style={{ marginLeft: 6 }} />}
            </Pill>
          )}
        />
      </CollapsibleSectionHeader>
      {!collapsed && (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: category.extraToggle ? 16 : 0 }}>
        {category.bands.map((band) => {
          const isRange = band.valueMin != null;
          return (
            <div key={band.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{band.label}</div>
              {isRange ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <input type="number" value={band.valueMin} className={noSpinnerClass} onChange={(e) => onBandChange(band.id, { valueMin: Number(e.target.value) })} style={{ ...inputStyle(), width: 66 }} />
                  <span style={{ fontSize: 13, color: C.textTertiary }}>—</span>
                  <input type="number" value={band.valueMax} className={noSpinnerClass} onChange={(e) => onBandChange(band.id, { valueMax: Number(e.target.value) })} style={{ ...inputStyle(), width: 66 }} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.primary }}>{band.comparator}</span>
                  <input type="number" value={band.value} className={noSpinnerClass} onChange={(e) => onBandChange(band.id, { value: Number(e.target.value) })} style={{ ...inputStyle(), width: 70, fontSize: 18, fontWeight: 700 }} />
                </div>
              )}
              {/* 2026-11-12: real PM Override Yes/No toggle added to every
                  tier, per request — plain toggle, no bounds editor (bands
                  don't have an established bounds pattern). */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}` }}>
                <span style={{ ...fieldLabel, marginBottom: 0 }}>PM Override</span>
                <Toggle value={!!band.pmOverride} onChange={(v) => onBandChange(band.id, { pmOverride: v })} />
                <Pill bg={band.pmOverride ? C.greenBg : C.neutral} color={band.pmOverride ? C.green : C.textTertiary}>{band.pmOverride ? 'Yes' : 'No'}</Pill>
              </div>
              <div style={{ ...hintStyle, marginTop: 0 }}>{band.note}</div>
            </div>
          );
        })}
      </div>
      {category.extraToggle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: `1px dashed ${C.border}` }}>
          <Toggle value={!!category.extraToggle.value} onChange={(v) => onToggleChange(v)} />
          <div>
            <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>{category.extraToggle.label}</div>
            <div style={hintStyle}>{category.extraToggle.note}</div>
          </div>
        </div>
      )}
      </>
      )}
    </SectionCard>
  );
}

// Session 73 — read-only renderers for the two new category `kind`s:
// 'scenarioOutcomes' (Credit Risk, Income & Financial, Rental History &
// Eviction, and the new Employment Verification Rules sections — a
// 3-column Scenario / Classification / Evaluation Outcome grid) and
// 'outcomeWeightage' (the new Evaluation Outcome & Weightage section — a
// 2-column Evaluation Outcome / Outcome Weightage % grid). Both resolve
// pill colors from the shared `C` palette via each option's own
// pillBg/pillColor keys — the same "no hardcoding" convention
// EVALUATION_OUTCOME_OPTIONS and every classificationOptions list already
// use in mockTenantScreeningConfig.js. These are display/documentation
// grids only, per the 2026-11-17 scoping decision — no evaluator logic
// executes against them yet; that is the future ScreeningRuleDefinition +
// evaluator_key engine, still pending the scoring-logic architecture the
// user is going to provide separately.
function OutcomePill({ code, options }) {
  const opt = options.find((o) => o.code === code);
  if (!opt) return <span style={{ fontSize: 11.5, color: C.textTertiary }}>{code}</span>;
  return <Pill bg={C[opt.pillBg] || C.neutral} color={C[opt.pillColor] || C.textSecondary}>{opt.label}</Pill>;
}

// 2026-11-18 — the Credit Risk & Bureau Parameters grid's first 3 Scenario
// cells used to be a hand-typed string ("Credit score ≥ 650", "Credit
// score 600–649", "Credit score below 600") that had already drifted out
// of sync with this section's own legacy `bands` (660 / 620–659 / <620)
// AND with Tab 2's Credit Check criterion `scoreTiers` (720 / 650–719 /
// ≤649) — three different numbers for the same three tiers. Per request,
// the Scenario text for a row that names a `tierId` is now generated from
// that live tier's own operator/valueMin/valueMax instead of being typed
// separately, so editing a tier's boundary in Tab 2's "Default Value —
// Score Tiers" box (the one real source of truth these tiers are stored
// against) updates this Scenario cell automatically — they can no longer
// disagree. Rows with no `tierId` (pending/missing/failed) keep their
// plain `scenario` string, since those aren't threshold-driven.
function formatScenarioFromTier(tier, prefix = 'Credit score') {
  if (!tier) return '';
  if (tier.operator === 'between') return `${prefix} ${tier.valueMin ?? ''}–${tier.valueMax ?? ''}`;
  if (tier.operator === '>=') return `${prefix} ≥ ${tier.valueMin}`;
  if (tier.operator === '>') return `${prefix} > ${tier.valueMin}`;
  if (tier.operator === '<=') return `${prefix} ≤ ${tier.valueMax ?? tier.valueMin}`;
  if (tier.operator === '<') return `${prefix} below ${tier.valueMax ?? tier.valueMin}`;
  if (tier.operator === '=') return `${prefix} = ${tier.valueMin}`;
  return prefix;
}

// 2026-11-17 — vendor badge + "⚗ SAMPLE / NO LIVE INTEGRATION" pill added
// to the section header (reusing category.vendorBadgeLabel/vendorBadgeSample,
// which already existed on the data but were never read by this
// component), and the generic footnote replaced with each section's own
// exact wireframe copy (category.footnote) — matching the approved
// wireframe (ScreeningRules_*.dc.html) exactly instead of one shared
// placeholder sentence.
function ScenarioOutcomesSection({ category, collapsed, onToggleCollapse, onRowChange, tiersById }) {
  return (
    <SectionCard>
      <CollapsibleSectionHeader collapsed={collapsed} onToggle={onToggleCollapse}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <SectionHeading number={category.sectionNumber} title={category.title} subtitle={category.subtitle} />
          {(category.vendorBadgeLabel || category.vendorBadgeSample) && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
              {category.vendorBadgeLabel && <Pill bg={C.blueBg} color={C.blue}>{category.vendorBadgeLabel}</Pill>}
              {category.vendorBadgeSample && <SampleTag label="⚗ SAMPLE / NO LIVE INTEGRATION" />}
            </div>
          )}
        </div>
      </CollapsibleSectionHeader>
      {!collapsed && (
      <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
          <thead>
            <tr>
              {/* 2026-11-18 — PM Override + Active/Inactive columns added
                  per request, to every scenarioOutcomes section (Identity &
                  Fraud Prevention, Income & Financial, Credit Risk & Bureau,
                  Rental History & Eviction, Criminal Background & Fair
                  Housing, Employment Verification Rules). Same Toggle+Pill
                  pattern Tab 2's Decision Workflow table already uses for
                  its own PM Override / Status columns. */}
              {['Scenario', category.classificationColumnLabel || 'Classification', 'Evaluation Outcome', 'PM Override', 'Active/Inactive'].map((col) => (
                <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.scenarioRows.map((row) => {
              const scenarioText = row.tierId && tiersById?.[row.tierId]
                ? formatScenarioFromTier(tiersById[row.tierId], row.scenarioPrefix)
                : row.scenario;
              return (
              <tr key={row.id}>
                <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textPrimary, maxWidth: 360 }}>{scenarioText}</td>
                <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}` }}><OutcomePill code={row.classificationCode} options={category.classificationOptions} /></td>
                <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}` }}><OutcomePill code={row.outcomeCode} options={EVALUATION_OUTCOME_OPTIONS} /></td>
                <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle value={!!row.pmOverride} onChange={(v) => onRowChange(row.id, { pmOverride: v })} />
                    <Pill bg={row.pmOverride ? C.greenBg : C.neutral} color={row.pmOverride ? C.green : C.textTertiary}>{row.pmOverride ? 'Yes' : 'No'}</Pill>
                  </div>
                </td>
                <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle value={!!row.active} onChange={(v) => onRowChange(row.id, { active: v })} />
                    <Pill bg={row.active ? C.greenBg : C.neutral} color={row.active ? C.green : C.textTertiary}>{row.active ? 'Active' : 'Not Active'}</Pill>
                  </div>
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

      {/* 2026-11-18 — optional, generic (any scenarioOutcomes category may
          set these, not just Criminal Background): a plain bulleted list of
          evaluation rules, and a visually-distinct mandatory-safeguards
          block. Added for Criminal Background & Fair Housing Guidance's
          "Important evaluation rules" + "Fair Housing Guidance – Phase 1"
          content — Fair Housing is deliberately NOT a second scenario grid
          or scoring criterion here, per the explicit request that it be a
          set of mandatory screening safeguards instead. */}
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
      </>
      )}
    </SectionCard>
  );
}

// 2026-11-17 — rewritten against the approved wireframe
// (ScreeningRules_EvaluationOutcome.dc.html) exactly: every row is now a
// colored pill (100%=green, 50%=amber, 0%=red, "Excluded"=gray — the exact
// label "Excluded", not "Excluded from Score"), a new blue info banner
// sits above the grid, the column header reads "Outcome Weightage (%)"
// (with parentheses), and the footnote is the wireframe's exact copy.
function OutcomeWeightageSection({ category, collapsed, onToggleCollapse }) {
  return (
    <SectionCard>
      <CollapsibleSectionHeader collapsed={collapsed} onToggle={onToggleCollapse}>
        <SectionHeading number={category.sectionNumber} title={category.title} subtitle={category.subtitle} />
      </CollapsibleSectionHeader>
      {!collapsed && (
      <>
      <div style={{ display: 'flex', gap: 8, background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: '10px 14px', margin: '14px 0 18px' }}>
        <span style={{ fontSize: 12.5, color: C.blue }}>ℹ These contribution percentages are platform-defined and apply uniformly across every criterion's weightage — they are not configured per criterion.</span>
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
          Rows are platform-fixed (no Add/Remove) — this reflects the real app's "Evaluation Outcome &amp; Score Contribution" structure, read-only by design. If a future requirement needs per-market or per-criterion overrides here, that would be a separate change to confirm before building.
        </span>
      </div>
      </>
      )}
    </SectionCard>
  );
}

// ─── Tab 2 ("Evaluation & Decisions") — Session 61, 2026-11-12 ────────────────
// See screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
// §8–9 for the review and the AskUserQuestion-confirmed decisions this
// implements: all 4 sections built now; Section 01's overlapping criteria
// edit the SAME real state Tab 1 holds (single source of truth — "drawer
// wins," three Tab 1 values were revised to match, see mockTenantScreening-
// Config.js); the "Live Evaluation Preview" demo card is built with a heavy
// full-card sample overlay.

function StageStrip({ stages }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 10, marginBottom: 18 }}>
      {stages.map((s, i) => (
        <div key={s.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 10px', background: C.pageBg, position: 'relative' }}>
          <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Stage {i + 1}</div>
          <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginBottom: 3 }}>{s.title}</div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textSecondary, lineHeight: 1.4 }}>{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

function EvaluationOrchestrationBanner() {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.primary}, #0B2545)`, color: C.white,
      borderRadius: 14, padding: '20px 24px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>
        <i className="ti ti-sitemap" /> Operational Purpose &amp; Underwriting Orchestration
      </div>
      <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Evaluation Logic, Decision Governance &amp; Policy Mesh</div>
      <div style={{ fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.75)', maxWidth: 680, lineHeight: 1.6, marginBottom: 16 }}>
        Defines the evaluation methodology across all screening criteria, governs co-applicant and household
        scoring logic, enforces AI explainability boundaries, and dictates end-to-end lease application lifecycle
        state progression.
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700 }}>Human-in-the-Loop Enforced</div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Governance Mode — fixed, no AI decisioning exists to turn loose</div>
        </div>
        <div>
          <div style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700 }}>Strictly Forbidden</div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Autonomous Approval — fixed governance stance</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700 }}>Tier-2 Verified Evidence</div>
            <SampleTag style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', color: C.white }} label="No real evidence-tier system" />
          </div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Adverse Action Model</div>
        </div>
      </div>
    </div>
  );
}

// 2026-11-17 — rewritten against the approved wireframe (Main.dc.html)
// EXACTLY: Title + monospace code header with the Tier pill top-right, the
// description, then exactly 4 rows in this order — Weight, PM
// Configurability, Category, Supported Markets (plain bold text, comma-
// joined — NOT pills) — then a footer with Toggle + "Section Status" on
// the left and, on the right, the Active pill, a divider, and 3 icon
// buttons (✎ Edit Criterion, ☰ View Rule Definitions, ▦ Manage Templates).
// Per the wireframe's own caption ("open via the pencil icon"), the card
// itself no longer opens the drawer on click — only the pencil icon does;
// the other two icons are inert placeholders (no real destination yet,
// same DeadEndButton convention used elsewhere on this screen).
function CriterionCard({ criterion, displayValue, extra, extended, weightEligible, active, weightage, permission, category, onOpen, onToggleActive }) {
  const body = criterion.cardBody(displayValue, extra);
  const markets = (extended?.supportedMarkets || []).join(', ');
  let pmPillBg = C.neutral, pmPillColor = C.textTertiary, pmLabel = permission;
  if (permission === 'ALLOWED') { pmPillBg = C.greenBg; pmPillColor = C.green; pmLabel = 'Allowed'; }
  else if (permission === 'RESTRICTED') { pmPillBg = C.amberBg; pmPillColor = C.amberText; pmLabel = 'Restricted'; }
  else if (permission === 'LOCKED') { pmPillBg = C.neutral; pmPillColor = C.textPrimary; pmLabel = '🔒 Locked'; }
  // 2026-11-18 — the card itself had no onClick: the only way to open the
  // drawer was the small pencil "Edit Criterion" icon at the bottom right,
  // which is easy to miss (per user report: "Only if click 'Edit', I am
  // able to expand the Individual Criteria sections"). The whole card is
  // now clickable, matching the PM Portal's own already-clickable card —
  // the Section Status toggle and the 3 icon buttons each stop propagation
  // so toggling Active or clicking an icon doesn't ALSO pop the drawer.
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: `1px solid ${C.pageBg}` }}>
        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textTertiary }}>Weight</span>
        {weightEligible === false ? (
          <Pill bg={C.neutral} color={C.textTertiary}>Not Weighted</Pill>
        ) : (
          <Pill bg={C.blueBg} color={C.blue}>{weightage}%</Pill>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: `1px solid ${C.pageBg}` }}>
        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textTertiary }}>PM Configurability</span>
        <Pill bg={pmPillBg} color={pmPillColor}>{pmLabel}</Pill>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: `1px solid ${C.pageBg}` }}>
        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textTertiary }}>Category</span>
        <Pill bg={C.neutral} color={C.textSecondary}>{category ?? criterion.category}</Pill>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: `1px solid ${C.pageBg}` }}>
        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textTertiary }}>Supported Markets</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{markets}</span>
      </div>

      <div style={{ flex: 1 }} />
      <div onClick={(e) => e.stopPropagation()} style={{ borderTop: `1px dashed ${C.border}`, marginTop: 14, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Toggle value={!!active} onChange={(v) => onToggleActive(criterion.id, v)} />
          <span style={{ fontSize: 13, color: C.textSecondary }}>Section Status</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill bg={active ? C.greenBg : C.neutral} color={active ? C.green : C.textTertiary}>{active ? 'Active' : 'Not Active'}</Pill>
          <span style={{ width: 1, height: 16, background: C.border }} />
          <button type="button" title="Edit Criterion" onClick={() => onOpen(criterion.id)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textSecondary, fontSize: 14, padding: 0 }}>
            <i className="ti ti-pencil" />
          </button>
          <button type="button" title="View Rule Definitions" onClick={() => {}}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textSecondary, fontSize: 14, padding: 0 }}>
            <i className="ti ti-list-details" />
          </button>
          <button type="button" title="Manage Templates" onClick={() => {}}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textSecondary, fontSize: 14, padding: 0 }}>
            <i className="ti ti-layout-grid" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Session 73 — AlternativeDocumentationNote is removed entirely. Alternative
// Documentation is retired as a standalone criterion/note (per the
// 2026-11-17 decision); its concept now lives only as the embedded
// "Alternative Documentation" section inside every criterion's own drawer
// below (see CriterionDrawer's altDoc block), matching the final wireframe.

// The "Edit Criterion" drawer — one real editing surface per Section 01
// item, rewritten 2026-11-17 field-for-field against the approved
// wireframe's 6 Add/Edit Criterion drawers (Credit Check, Income
// Verification, Employment Verification, Criminal Background Check,
// Identity Verification, Rental History). Each criterion still edits the
// SAME real state Tab 1's own section displays where `criterion.source`
// points there ({kind:'field'} / {kind:'row'}); criteria whose wireframe
// "Default Value" box has no Tab 1 equivalent ({kind:'extra'}) store it in
// `extra` / `extended.scoreTiers` instead. Guarantor Option and the old
// `band`-kind baseline editor are both gone — the wireframe's 6-card grid
// has no Guarantor card, and Credit Check's Score Tiers box now lives in
// `extended.scoreTiers`, not Tab 1's legacy credit_risk.bands.
function CriterionDrawer({
  criterion, categories, extra, extended, permission, onPermissionChange,
  active, weightage, weightEligible, onWeightEligibleChange,
  mode, onModeChange, category, onCategoryChange, requirement, onRequirementChange,
  onFieldChange, onRowChange, onExtraChange, onClose,
  onActiveChange, onWeightageChange,
  onExtendedChange, onAltDocChange,
}) {
  // Supported Screening Methods chip editor's "add" text box is read via
  // ref (not React state) so it never needs resetting when the open
  // criterion changes — this component instance is reused across opens
  // (see the always-mounted <CriterionDrawer> call site), so a stateful
  // input would otherwise carry stale text from the previously open
  // criterion into the next one.
  const chipInputRef = useRef(null);

  if (!criterion) return null;

  // 2026-11-17 — originally gated Mode/Category/Requirement-unprotecting
  // and the Weight % column for Credit Check only; both were generalized
  // to all 6 drawers later the same day (see the sections below), so this
  // flag now only scopes the one layout change that's still Credit-Check
  // specific: Applicable Applicant Scope's 3-across grid (§11).
  const isCreditCheck = criterion.id === 'credit_criteria';

  const cat = (id) => categories.find((c) => c.id === id);
  // Session 65 — "if Not Active, all fields should be protected" extends
  // this same disabled check (previously just permission === 'LOCKED')
  // across every baseline editor and the permission list below.
  const fieldsDisabled = permission === 'LOCKED' || !active;

  // `displayValue` is the same shape CriterionCard's own cardBody(displayValue, extra)
  // call uses — one real source read, consistent between the card and this
  // drawer (single source of truth).
  let displayValue = null;
  if (criterion.source.kind === 'field') {
    const c = cat(criterion.source.categoryId);
    const f = c?.fields.find((x) => x.id === criterion.source.fieldId);
    displayValue = f?.value;
  } else if (criterion.source.kind === 'row') {
    const c = cat(criterion.source.categoryId);
    const r = c?.rows.find((x) => x.id === criterion.source.rowId);
    displayValue = r;
  } else {
    displayValue = extra;
  }

  // 2026-11-17 rewrite #2 — one criterion-specific "Default Value" box per
  // the approved wireframe: each of the 6 criteria shows a DIFFERENT box
  // here (Score Tiers / Rent Baseline / Required Documents / Lookback
  // Ceiling / Approved ID Documents / Lookback Period), each with its own
  // literal title, intro paragraph (where the wireframe has one), column
  // headers, and footer note — not a shared generic editor. The field's
  // own highlighted note box (Income only) is built separately below.
  let defaultValueEditor = null;
  let incomeNoteBox = null;
  const OPERATOR_OPTIONS = ['>=', '<=', '=', 'between'];
  const tierColors = (tierName) => {
    if (tierName === 'Tier A') return { bg: C.greenBg, color: C.green };
    if (tierName === 'Tier B') return { bg: C.blueBg, color: C.blue };
    return { bg: C.dangerBg, color: C.danger };
  };
  const colHeader = { fontFamily: F.body, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.textTertiary };

  if (criterion.id === 'credit_criteria') {
    const tiers = extended?.scoreTiers || [];
    // 2026-11-17 — a) "Score" relabeled "Score Range"; b) every tier now
    // gets its own From/To range inputs, not just "between" rows (the
    // Operator dropdown stays, now purely descriptive of how From/To
    // should be read — ">=" with only From filled in means "From and
    // above", "<=" with only To filled in means "To and below"); c) a
    // new "Evaluation Outcome" column replaces the old free-text Result
    // label, which is now d) a dropdown over SCORE_TIER_OUTCOME_OPTIONS.
    defaultValueEditor = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 150px 28px', gap: 8 }}>
          <span style={colHeader}>Tier</span>
          <span style={colHeader}>Operator</span>
          <span style={colHeader}>Score Range</span>
          <span style={colHeader}>Evaluation Outcome</span>
          <span />
        </div>
        {tiers.map((tier, i) => {
          const tc = tierColors(tier.tier);
          return (
            <div key={tier.id || i} style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 150px 28px', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, textAlign: 'center', borderRadius: 7, padding: '7px 10px', background: tc.bg, color: tc.color }}>{tier.tier}</span>
              <DropdownOrCustom
                options={OPERATOR_OPTIONS.map((o) => ({ value: o, label: o }))}
                value={tier.operator}
                disabled={fieldsDisabled}
                onChange={(v) => onExtendedChange(criterion.id, { scoreTiers: tiers.map((t, idx) => (idx === i ? { ...t, operator: v } : t)) })}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <input type="number" value={tier.valueMin ?? ''} disabled={fieldsDisabled} className={noSpinnerClass} placeholder="From"
                  onChange={(e) => onExtendedChange(criterion.id, { scoreTiers: tiers.map((t, idx) => (idx === i ? { ...t, valueMin: e.target.value === '' ? null : Number(e.target.value) } : t)) })}
                  style={{ ...inputStyle(fieldsDisabled), width: 70 }} />
                <span style={{ color: C.textTertiary }}>–</span>
                <input type="number" value={tier.valueMax ?? ''} disabled={fieldsDisabled} className={noSpinnerClass} placeholder="To"
                  onChange={(e) => onExtendedChange(criterion.id, { scoreTiers: tiers.map((t, idx) => (idx === i ? { ...t, valueMax: e.target.value === '' ? null : Number(e.target.value) } : t)) })}
                  style={{ ...inputStyle(fieldsDisabled), width: 70 }} />
              </div>
              <DropdownOrCustom
                options={SCORE_TIER_OUTCOME_OPTIONS.map((o) => ({ value: o, label: o }))}
                value={tier.label}
                disabled={fieldsDisabled}
                onChange={(v) => onExtendedChange(criterion.id, { scoreTiers: tiers.map((t, idx) => (idx === i ? { ...t, label: v } : t)) })}
              />
              {!fieldsDisabled && tiers.length > 1 ? (
                <button type="button" onClick={() => onExtendedChange(criterion.id, { scoreTiers: tiers.filter((_, idx) => idx !== i) })}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 13 }}>✕</button>
              ) : <span />}
            </div>
          );
        })}
        {!fieldsDisabled && (
          <button type="button"
            onClick={() => onExtendedChange(criterion.id, { scoreTiers: [...tiers, { id: `tier_${tiers.length + 1}`, tier: `Tier ${String.fromCharCode(65 + tiers.length)}`, operator: '>=', valueMin: null, valueMax: null, label: SCORE_TIER_OUTCOME_OPTIONS[0] }] })}
            style={{ ...btnCancel, alignSelf: 'flex-start' }}>
            <i className="ti ti-plus" /> Add Tier
          </button>
        )}
      </div>
    );
  } else if (criterion.id === 'income_qualification') {
    defaultValueEditor = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Baseline Type</div>
          <DropdownOrCustom
            options={RENT_BASELINE_TYPE_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={extra.income_rent_baseline_type}
            disabled={fieldsDisabled}
            onChange={(v) => onExtraChange('income_rent_baseline_type', v)}
          />
          <div style={hintStyle}>Other option: Annual Rent Baseline.</div>
        </div>
        <div>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Multiplier</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" step="0.1" value={displayValue} disabled={fieldsDisabled} className={noSpinnerClass}
              onChange={(e) => onFieldChange(criterion.source.categoryId, criterion.source.fieldId, Number(e.target.value))}
              style={{ ...inputStyle(fieldsDisabled), width: 72 }} />
            <span style={{ fontSize: 13, color: C.textSecondary }}>×</span>
          </div>
        </div>
      </div>
    );
    incomeNoteBox = (
      <div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', marginTop: 12, fontSize: 12, color: '#334155' }}>
        {criterion.formatBaseline(displayValue)}
      </div>
    );
  } else if (criterion.id === 'employment_verification') {
    const docs = extra.employment_default_documents || [];
    defaultValueEditor = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 28px', gap: 8 }}>
          <span style={colHeader}>Document Type</span>
          <span style={colHeader}>Docs Required</span>
          <span />
        </div>
        {docs.map((doc, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 28px', gap: 8, alignItems: 'center' }}>
            <input value={doc.docType} disabled={fieldsDisabled} placeholder="Document type"
              onChange={(e) => {
                const next = docs.map((d, idx) => (idx === i ? { ...d, docType: e.target.value } : d));
                onExtraChange('employment_default_documents', next);
              }}
              style={{ ...inputStyle(fieldsDisabled) }} />
            <input type="number" min="1" value={doc.count} disabled={fieldsDisabled} className={noSpinnerClass}
              onChange={(e) => {
                const next = docs.map((d, idx) => (idx === i ? { ...d, count: Number(e.target.value) } : d));
                onExtraChange('employment_default_documents', next);
              }}
              style={{ ...inputStyle(fieldsDisabled), textAlign: 'center' }} />
            {!fieldsDisabled ? (
              <button type="button" onClick={() => onExtraChange('employment_default_documents', docs.filter((_, idx) => idx !== i))}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 14 }}>×</button>
            ) : <span />}
          </div>
        ))}
        {!fieldsDisabled && (
          <button type="button" onClick={() => onExtraChange('employment_default_documents', [...docs, { docType: '', count: 1 }])}
            style={{ ...btnCancel, alignSelf: 'flex-start' }}>
            <i className="ti ti-plus" /> Add document type
          </button>
        )}
      </div>
    );
  } else if (criterion.id === 'criminal_background') {
    defaultValueEditor = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#334155' }}>UN Admin default:</label>
        <input type="number" value={displayValue} disabled={fieldsDisabled} className={noSpinnerClass}
          onChange={(e) => onFieldChange(criterion.source.categoryId, criterion.source.fieldId, Number(e.target.value))}
          style={{ ...inputStyle(fieldsDisabled), width: 72 }} />
        <span style={{ fontSize: 12, color: C.textSecondary }}>years maximum lookback</span>
      </div>
    );
  } else if (criterion.id === 'identity_verification') {
    // Judgment call carried over from the prior build: this criterion's
    // approved-document list has no Tab 1 equivalent to edit it through,
    // so it's disabled only by `!active`, not the generic `fieldsDisabled`
    // — LOCKED here means "no PM override," not "frozen for UN Admin too."
    defaultValueEditor = (
      <div>
        <div style={{ ...fieldLabel, marginBottom: 6 }}>Approved Documents</div>
        <MultiSelectDropdown
          options={IDENTITY_DOCUMENT_OPTIONS.map((o) => ({ value: o, label: o }))}
          value={extra.identity_approved_documents || []}
          disabled={!active}
          onChange={(v) => onExtraChange('identity_approved_documents', v)}
        />
        {extended?.approvedDocumentsCatalogueHint && (
          <div style={{ ...hintStyle, marginTop: 8 }}>{extended.approvedDocumentsCatalogueHint}</div>
        )}
      </div>
    );
  } else if (criterion.id === 'rental_history') {
    defaultValueEditor = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#334155' }}>UN Admin default:</label>
        <input type="number" value={displayValue?.baseline} disabled={fieldsDisabled} className={noSpinnerClass}
          onChange={(e) => onRowChange(criterion.source.categoryId, criterion.source.rowId, { baseline: Number(e.target.value) })}
          style={{ ...inputStyle(fieldsDisabled), width: 72 }} />
        <span style={{ fontSize: 12, color: C.textSecondary }}>months of rental history required</span>
      </div>
    );
  }

  const ALL_PERMISSION_OPTIONS = ['ALLOWED', 'RESTRICTED', 'LOCKED'];
  const screeningMethods = extended?.screeningMethods || [];
  const scopeOptions = extended?.scopeOptions || APPLICANT_SCOPE_OPTIONS;
  const applicantScope = extended?.applicantScope || [];
  const segmentBase = { fontFamily: F.body, fontSize: 11.5, fontWeight: 700, borderRadius: 6, padding: '6px 10px', border: `1px solid ${C.border}` };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalBase, maxWidth: 756, textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.04em' }}>
            Criterion Configuration · {criterion.code}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontFamily: F.headline, fontSize: 19, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>Edit Criterion — {criterion.title}</div>
        <div style={{ fontSize: 11.5, color: C.textSecondary, marginBottom: 16 }}>
          {criterion.drawerSubtitle}
        </div>

        {/* 1. Criterion Status — first, before any other field, per the wireframe. */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={fieldLabel}>Criterion Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Toggle value={!!active} onChange={(v) => onActiveChange(criterion.id, v)} />
            <Pill bg={active ? C.greenBg : C.neutral} color={active ? C.green : C.textTertiary}>{active ? 'Active' : 'Not Active'}</Pill>
          </div>
        </div>
        {!active && (
          <div style={{ ...hintStyle, marginTop: 0, marginBottom: 12, color: C.amberText }}>
            This criterion is Not Active — every field below is protected until it's switched back on.
          </div>
        )}

        <div style={{ marginBottom: 14 }}><SampleTag label="⚗ Sample Data" /></div>

        {/* 2. Name / Key */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Criterion Name</div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', background: C.pageBg, fontSize: 12.5, fontWeight: 600, color: C.textPrimary }}>{criterion.title}</div>
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Unique Criterion Key</div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', background: C.pageBg, fontFamily: 'monospace', fontSize: 12, color: C.textTertiary }}>{criterion.code}</div>
          </div>
        </div>

        {/* 3. Description — the drawer's own literal copy, which the
            wireframe shows differently from the Tab 2 card's cardBody text
            for Income Verification specifically. */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Description</div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, background: C.white, fontFamily: F.body, fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
            {criterion.drawerDescription(extra)}
          </div>
        </div>

        {/* 4. Mode / Category / Requirement — real, unprotected editable
            controls for every one of the 6 drawers (first unlocked for
            Credit Check only; generalized to all 6 on 2026-11-17 per
            explicit request). Still subject to fieldsDisabled, same as
            every other field in this drawer — "unprotected" means it's no
            longer a permanently read-only box, not that it bypasses Not
            Active/Locked (e.g. Criminal Background / Identity Verification
            stay non-interactive here until PM Customization Permission
            below is switched away from Locked). */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Mode</div>
            <DropdownOrCustom
              options={MODE_OPTIONS.map((o) => ({ value: o, label: o }))}
              value={mode}
              disabled={fieldsDisabled}
              onChange={(v) => onModeChange(criterion.id, v)}
            />
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Category</div>
            <DropdownOrCustom
              options={CATEGORY_OPTIONS.map((o) => ({ value: o, label: o }))}
              value={category}
              disabled={fieldsDisabled}
              onChange={(v) => onCategoryChange(criterion.id, v)}
            />
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Requirement</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" disabled={fieldsDisabled} onClick={() => onRequirementChange(criterion.id, 'Mandatory')}
                style={{ ...segmentBase, cursor: fieldsDisabled ? 'not-allowed' : 'pointer', background: requirement === 'Mandatory' ? C.textPrimary : C.white, color: requirement === 'Mandatory' ? C.white : C.textTertiary }}>Mandatory</button>
              <button type="button" disabled={fieldsDisabled} onClick={() => onRequirementChange(criterion.id, 'Optional')}
                style={{ ...segmentBase, cursor: fieldsDisabled ? 'not-allowed' : 'pointer', background: requirement === 'Optional' ? C.textPrimary : C.white, color: requirement === 'Optional' ? C.white : C.textTertiary }}>Optional</button>
            </div>
          </div>
        </div>

        {/* 5. Default Value — one criterion-specific box per the wireframe;
            no baselineTag pill — none of the 6 drawers show one next to
            this title, so it's no longer rendered here. */}
        <div style={{ marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ ...fieldLabel, marginBottom: criterion.defaultValueIntro ? 4 : 10 }}>{criterion.defaultValueBoxTitle}</div>
          {criterion.defaultValueIntro && (
            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, margin: '0 0 12px', lineHeight: 1.5 }}>{criterion.defaultValueIntro}</p>
          )}
          {defaultValueEditor}
          {incomeNoteBox}
          {criterion.defaultValueFooterNote && (
            <div style={{ ...hintStyle, marginTop: 8 }}>{criterion.defaultValueFooterNote}</div>
          )}
        </div>

        {/* 6. Supported Markets + Weight Eligible + a third, explicitly
            labeled "Weight %" column — generalized to all 6 drawers on
            2026-11-17 (first unlocked for Credit Check only). Weight %
            shows the ineligibility hint instead of an input when this
            criterion isn't weight-eligible (Criminal Background /
            Identity Verification are gate checks and never are). */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Supported Markets</div>
            <MultiSelectDropdown
              options={SUPPORTED_MARKET_OPTIONS}
              value={extended?.supportedMarkets || []}
              disabled={fieldsDisabled}
              onChange={(v) => onExtendedChange(criterion.id, { supportedMarkets: v })}
            />
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Weight Eligible</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Toggle value={!!weightEligible} disabled={!active} onChange={(v) => onWeightEligibleChange(criterion.id, v)} />
              <span style={{ fontSize: 12.5, color: C.textSecondary }}>{weightEligible ? 'Yes' : 'No — not weight-eligible'}</span>
            </div>
          </div>
          <div>
            <div style={{ ...fieldLabel, marginBottom: 6 }}>Weight %</div>
            {weightEligible ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min="0" max="100" value={weightage} disabled={!active} className={noSpinnerClass}
                  onChange={(e) => onWeightageChange(criterion.id, Number(e.target.value))}
                  style={{ ...inputStyle(!active), width: 80 }} />
                <span style={{ fontSize: 12, color: C.textSecondary }}>%</span>
              </div>
            ) : (
              <div style={hintStyle}>{criterion.weightIneligibleHint}</div>
            )}
          </div>
        </div>

        {/* 7. PM Customization Permission — all 3 options always shown,
            dimmed when not offered for this criterion, per the wireframe.
            No "PM Override: Yes/No" summary pill — none of the 6 drawers
            show one next to this title, so it's no longer rendered. */}
        <div style={{ marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ ...fieldLabel, marginBottom: 10 }}>PM Customization Permission</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ALL_PERMISSION_OPTIONS.map((opt) => {
              const offered = criterion.permissionOptions.includes(opt);
              const optDisabled = !active || !offered;
              // Wireframe wording: a Locked-only criterion (Criminal
              // Background, Identity Verification) says "(Selected — only
              // option)" since Allowed/Restricted are genuinely not
              // offered; every other criterion's selected option just
              // says "(Selected)".
              const selectedSuffix = criterion.permissionOptions.length === 1 ? '(Selected — only option)' : '(Selected)';
              return (
                <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: optDisabled ? 'default' : 'pointer', opacity: offered ? 1 : 0.4 }}>
                  <input type="radio" checked={permission === opt} disabled={optDisabled} onChange={() => onPermissionChange(criterion.id, opt)} style={{ marginTop: 3 }} />
                  <div>
                    <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>
                      {opt.charAt(0) + opt.slice(1).toLowerCase()}
                      {permission === opt && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: C.primary }}>{selectedSuffix}</span>}
                    </div>
                    {criterion.permissionNotes?.[opt] && <div style={{ ...hintStyle, marginTop: 2 }}>{criterion.permissionNotes[opt]}</div>}
                  </div>
                </label>
              );
            })}
          </div>
          {extended?.lockedOnlyNote && (
            <div style={{ ...hintStyle, marginTop: 10, color: C.amberText, fontStyle: 'italic' }}>{extended.lockedOnlyNote}</div>
          )}
        </div>

        {/* 8. Alternative Documentation — amber/active vs. neutral/inactive
            per the wireframe (not just dimmed-in-place): when inactive, the
            accepted-documents field collapses to a plain "No alternative
            accepted" placeholder and the PM Override / Notes row disappears
            entirely rather than just dimming, matching all 6 drawers. */}
        {(() => {
          const altActive = !!extended?.altDoc?.active;
          return (
            <div style={{
              marginBottom: 14,
              border: `1px solid ${altActive ? '#FCD34D' : C.border}`,
              background: altActive ? '#FFFBEB' : C.pageBg,
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ ...fieldLabel, marginBottom: 0, color: altActive ? C.amberText : C.textSecondary }}>Alternative Documentation</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle value={altActive} disabled={fieldsDisabled} onChange={(v) => onAltDocChange(criterion.id, { active: v })} />
                  <Pill bg={altActive ? C.greenBg : C.neutral} color={altActive ? C.green : C.textTertiary}>{altActive ? 'Active' : 'Inactive'}</Pill>
                </div>
              </div>
              <p style={{ fontFamily: F.body, fontSize: 12, color: altActive ? C.amberText : C.textSecondary, margin: '0 0 12px', opacity: altActive ? 1 : 0.85 }}>
                {altActive
                  ? `When active, applicants may satisfy this criterion with one of the accepted documents below instead of the primary method above.${extended?.altDoc?.activeExtraSentence ? ` ${extended.altDoc.activeExtraSentence}` : ''}`
                  : 'When active, applicants may satisfy this criterion with an accepted document instead of the primary method above.'}
              </p>

              {altActive ? (
                <>
                  <div style={{ ...fieldLabel, marginBottom: 6 }}>Accepted Alternative Documents</div>
                  <MultiSelectDropdown
                    options={ALTERNATIVE_DOCUMENT_OPTIONS.map((o) => ({ value: o, label: o }))}
                    value={extended?.altDoc?.documents || []}
                    disabled={fieldsDisabled}
                    onChange={(v) => onAltDocChange(criterion.id, { documents: v })}
                  />
                  {!fieldsDisabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: C.white, border: '1px solid #FCD34D', color: C.amberText }}>+ Add a new document type</span>
                      {extended?.altDoc?.addHint && <span style={{ fontSize: 11, color: C.amberText, opacity: 0.8 }}>{extended.altDoc.addHint}</span>}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
                    <div>
                      <div style={{ ...fieldLabel, marginBottom: 6 }}>PM Override (this section only)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Toggle value={!!extended?.altDoc?.pmOverrideAllowed} disabled={fieldsDisabled} onChange={(v) => onAltDocChange(criterion.id, { pmOverrideAllowed: v })} />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: extended?.altDoc?.pmOverrideAllowed ? C.green : C.textTertiary }}>{extended?.altDoc?.pmOverrideAllowed ? 'Allowed' : 'Not Allowed'}</span>
                      </div>
                      {extended?.altDoc?.pmOverrideNote && (
                        <div style={{ fontSize: 11, color: C.amberText, marginTop: 4, lineHeight: 1.5 }}>{extended.altDoc.pmOverrideNote}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ ...fieldLabel, marginBottom: 6 }}>Additional Notes / Conditions</div>
                      <textarea value={extended?.altDoc?.notes || ''} disabled={fieldsDisabled}
                        onChange={(e) => onAltDocChange(criterion.id, { notes: e.target.value })}
                        rows={2} style={{ ...inputStyle(fieldsDisabled), width: '100%', resize: 'vertical', fontFamily: F.body, fontSize: 12.5 }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ ...fieldLabel, marginBottom: 6 }}>Accepted Alternative Documents</div>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', background: C.neutral, fontSize: 13, color: C.textTertiary }}>No alternative accepted</div>
                  {extended?.altDoc?.notApplicableNote && (
                    <div style={{ ...hintStyle, marginTop: 10, fontStyle: 'italic' }}>{extended.altDoc.notApplicableNote}</div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* 9. Supported Screening Methods — removable chips + free-text add. */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Supported Screening Methods</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: screeningMethods.length ? 8 : 0 }}>
            {screeningMethods.map((m, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.blueBg, color: C.blue, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>
                {m}
                {!fieldsDisabled && (
                  <button type="button" onClick={() => onExtendedChange(criterion.id, { screeningMethods: screeningMethods.filter((_, idx) => idx !== i) })}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.blue, fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                )}
              </span>
            ))}
          </div>
          {!fieldsDisabled && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input ref={chipInputRef} type="text" placeholder="Add a screening method…" style={{ ...inputStyle(false), flex: 1 }} />
              <button type="button" onClick={() => {
                const v = (chipInputRef.current?.value || '').trim();
                if (v) {
                  onExtendedChange(criterion.id, { screeningMethods: [...screeningMethods, v] });
                  if (chipInputRef.current) chipInputRef.current.value = '';
                }
              }} style={btnCancel}>+ Add</button>
            </div>
          )}
        </div>

        {/* 10. Supported Providers — single-select, filtered to the
            partners whose own Capability Matrix record actually lists
            this criterion (plus the always-available Manual Verification
            fallback), per the real Partner → Tenant Screening →
            Capability Matrix data — generalized on 2026-11-17 from a
            Credit-Check-only filter to all 6 drawers, each via its own
            entry in SUPPORTED_PROVIDERS_BY_CRITERION. Falls back to the
            universal SUPPORTED_PROVIDER_OPTIONS list only if a criterion
            id has no matrix entry. */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Supported Providers</div>
          <DropdownOrCustom
            options={(SUPPORTED_PROVIDERS_BY_CRITERION[criterion.id] || SUPPORTED_PROVIDER_OPTIONS).map((o) => ({ value: o, label: o }))}
            value={extended?.supportedProvider}
            disabled={fieldsDisabled}
            onChange={(v) => onExtendedChange(criterion.id, { supportedProvider: v })}
          />
          <div style={hintStyle}>{extended?.supportedProvidersHint || "Options sourced from Partners → Tenant Screening's own catalogue."}</div>
        </div>

        {/* 11. Applicable Applicant Scope — checkbox grid filtered to this
            criterion's own offered subset, with the wireframe's own
            explainer note for why some options are withheld. Credit
            Check only: all 3 of its scope options sit on one line. */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Applicable Applicant Scope</div>
          <div style={{ display: 'grid', gridTemplateColumns: isCreditCheck ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8 }}>
            {scopeOptions.map((opt) => {
              const checked = applicantScope.includes(opt);
              return (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.textPrimary, opacity: fieldsDisabled ? 0.6 : 1 }}>
                  <input type="checkbox" checked={checked} disabled={fieldsDisabled}
                    onChange={(e) => {
                      const next = e.target.checked ? [...applicantScope, opt] : applicantScope.filter((o) => o !== opt);
                      onExtendedChange(criterion.id, { applicantScope: next });
                    }} />
                  {opt}
                </label>
              );
            })}
          </div>
          {extended?.scopeNote && (
            <div style={{ ...hintStyle, marginTop: 8 }}>ℹ {extended.scopeNote}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={onClose} style={btnPrimary}>💾 Save Changes</button>
        </div>
        <div style={{ ...hintStyle, textAlign: 'center', marginTop: 10 }}>
          Version Staging · {POLICY_META_DEFAULTS.versionTag} validation — saved to this device with the rest of this screen's config.
        </div>
      </div>
    </div>
  );
}

// Session 65 — Co-Applicant Screening's own row (`coapp_screening`) is the
// gate every other row here (and every row in the new HouseholdTable below)
// depends on: `gateActive` is that row's own `active` value, computed by
// the parent. The gate row itself is never affected by its own gate
// (isGate check below), so it's always independently controllable.
// Enforcement is now a real Mandatory/Custom dropdown (reusing the exact
// ENFORCEMENT_OPTIONS control Session 63 built for the Completeness Rules
// table, "Custom" spelled the same way that control already uses), PM
// Override is a new Yes/No toggle, and Status collapses to a plain
// Active/Not Active pill (replacing the old free-text status strings) per
// request.
function CoapplicantTable({ rows, gateActive, onToggleActive, onEnforcementChange, onPMOverrideChange, onNumericChange }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
        <thead>
          <tr>
            {['Parameter', 'Rule Definition', 'Enforcement', 'PM Override', 'Status'].map((col) => (
              <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isGate = row.id === 'coapp_screening';
            const gatedOff = !isGate && !gateActive;
            const effectiveActive = isGate ? !!row.active : (!!gateActive && (row.locked ? true : !!row.active));
            const rowDisabled = row.locked || gatedOff;
            return (
              <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: gatedOff ? 0.55 : 1 }}>
                <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 700, color: C.textPrimary, verticalAlign: 'top', minWidth: 170 }}>
                  {row.parameter}
                  {gatedOff && <div style={{ ...hintStyle, marginTop: 4 }}>Requires Co-Applicant Screening to be Active</div>}
                </td>
                <td style={{ padding: '12px 10px', fontSize: 12, color: C.textSecondary, verticalAlign: 'top', lineHeight: 1.5, minWidth: 260 }}>
                  {row.rule}
                  {row.numericField && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span style={{ fontSize: 10.5, color: C.textTertiary, textTransform: 'uppercase', fontWeight: 700 }}>{row.numericField.label}:</span>
                      <input type="number" value={row.numericField.value} disabled={rowDisabled} className={noSpinnerClass} onChange={(e) => onNumericChange(row.id, Number(e.target.value))} style={{ ...inputStyle(rowDisabled), width: 60 }} />
                      <span style={{ fontSize: 11, color: C.textSecondary }}>{row.numericField.suffix}</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top', minWidth: 150 }}>
                  <div style={{ maxWidth: 150 }}>
                    <DropdownOrCustom options={ENFORCEMENT_OPTIONS} value={row.enforcement} disabled={rowDisabled} onChange={(v) => onEnforcementChange(row.id, v)} />
                  </div>
                  <div style={{ ...hintStyle, marginTop: 4 }}>{row.enforcementLabel}</div>
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                  {row.locked ? <LockBadge /> : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle value={!!row.pmOverride} disabled={rowDisabled} onChange={(v) => onPMOverrideChange(row.id, v)} />
                      <Pill bg={row.pmOverride ? C.greenBg : C.neutral} color={row.pmOverride ? C.green : C.textTertiary}>{row.pmOverride ? 'Yes' : 'No'}</Pill>
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                  {row.locked ? (
                    <Pill bg={effectiveActive ? C.greenBg : C.neutral} color={effectiveActive ? C.green : C.textTertiary}>{effectiveActive ? 'Active' : 'Not Active'}</Pill>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Toggle value={!!row.active} disabled={gatedOff} onChange={(v) => onToggleActive(row.id, v)} />
                      <Pill bg={effectiveActive ? C.greenBg : C.neutral} color={effectiveActive ? C.green : C.textTertiary}>{effectiveActive ? 'Active' : 'Not Active'}</Pill>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Session 65 — new Household Screening section (split out of the former
// combined Co-Applicant & Household table). Column shape intentionally
// unchanged from before (Enforcement stays the original free-text Pill,
// Status stays a Toggle+Pill) — only the a/b/c column changes were asked
// for the Co-Applicant section specifically. The one thing that IS new
// here is the gate: every row (locked or not) is only ever shown/editable
// as Active when Co-Applicant Screening itself is Active.
// 2026-11-12: added a "PM Override" Yes/No column, per request — same
// Toggle+Pill / LockBadge-for-locked-rows convention CoapplicantTable's
// own PM Override column already uses.
function HouseholdTable({ rows, gateActive, onToggle, onPMOverrideChange, onNumericChange }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
        <thead>
          <tr>
            {['Parameter', 'Rule Definition', 'Enforcement', 'PM Override', 'Status'].map((col) => (
              <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}` }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const gatedOff = !gateActive;
            const effectiveActive = !!gateActive && (row.locked ? true : !!row.active);
            const rowDisabled = row.locked || gatedOff;
            return (
              <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: gatedOff ? 0.55 : 1 }}>
                <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 700, color: C.textPrimary, verticalAlign: 'top', minWidth: 170 }}>
                  {row.parameter}
                  {gatedOff && <div style={{ ...hintStyle, marginTop: 4 }}>Requires Co-Applicant Screening to be Active</div>}
                </td>
                <td style={{ padding: '12px 10px', fontSize: 12, color: C.textSecondary, verticalAlign: 'top', lineHeight: 1.5, minWidth: 260 }}>
                  {row.rule}
                  {row.numericField && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span style={{ fontSize: 10.5, color: C.textTertiary, textTransform: 'uppercase', fontWeight: 700 }}>{row.numericField.label}:</span>
                      <input type="number" value={row.numericField.value} disabled={rowDisabled} className={noSpinnerClass} onChange={(e) => onNumericChange(row.id, Number(e.target.value))} style={{ ...inputStyle(rowDisabled), width: 60 }} />
                      <span style={{ fontSize: 11, color: C.textSecondary }}>{row.numericField.suffix}</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top' }}><Pill bg={C.blueBg} color={C.blue}>{row.enforcementLabel}</Pill></td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                  {row.locked ? <LockBadge /> : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle value={!!row.pmOverride} disabled={rowDisabled} onChange={(v) => onPMOverrideChange(row.id, v)} />
                      <Pill bg={row.pmOverride ? C.greenBg : C.neutral} color={row.pmOverride ? C.green : C.textTertiary}>{row.pmOverride ? 'Yes' : 'No'}</Pill>
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                  {row.locked ? (
                    <Pill bg={effectiveActive ? C.greenBg : C.neutral} color={effectiveActive ? C.green : C.textTertiary}>{effectiveActive ? 'Active' : 'Not Active'}</Pill>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Toggle value={!!row.active} disabled={gatedOff} onChange={(v) => onToggle(row.id, v)} />
                      <Pill bg={effectiveActive ? C.greenBg : C.neutral} color={effectiveActive ? C.green : C.textTertiary}>{effectiveActive ? 'Active' : 'Not Active'}</Pill>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AIGuardrailTable({ rows, onToggle }) {
  const statusStyle = (s) => (s === 'PERMITTED' ? { bg: C.greenBg, color: C.green } : s === 'PROHIBITED' ? { bg: C.dangerBg, color: C.danger } : { bg: C.blueBg, color: C.blue });
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
        <thead>
          <tr>
            {['Capability / Boundary', 'Classification', 'Operational Directive', 'Policy Status'].map((col) => (
              <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}` }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const st = statusStyle(row.status);
            return (
              <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '10px', fontSize: 12.5, fontWeight: 700, color: C.textPrimary, verticalAlign: 'top' }}>{row.capability}</td>
                <td style={{ padding: '10px', fontSize: 11.5, color: C.textSecondary, verticalAlign: 'top' }}>{row.classification}</td>
                <td style={{ padding: '10px', fontSize: 11.5, color: C.textSecondary, verticalAlign: 'top', lineHeight: 1.5, minWidth: 240 }}>{row.directive}</td>
                <td style={{ padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!row.locked && <Toggle value={!!row.enabled} onChange={(v) => onToggle(row.id, v)} />}
                    {row.locked && <LockBadge />}
                    <Pill bg={st.bg} color={st.color}>{row.status.charAt(0) + row.status.slice(1).toLowerCase()}</Pill>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AILiveEvalPreviewCard() {
  const d = AI_LIVE_EVAL_SAMPLE;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', background: C.white }}>
      <SampleOverlayBanner />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Evaluation Preview</span>
          <Pill bg={C.greenBg} color={C.green}>Audited</Pill>
        </div>
        <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>Applicant: {d.applicantName}</div>
        <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 12 }}>Application {d.applicationRef} · {d.propertyLabel}</div>
        {[['Income Verification', d.incomeLine], ['ResidentScore 4.0', d.creditLine], ['Rental History', d.historyLine]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.textSecondary }}>{k}</span><span style={{ fontWeight: 700, color: C.textPrimary }}>{v}</span>
          </div>
        ))}
        <div style={{ margin: '12px 0' }}>
          <div style={{ fontSize: 10.5, color: C.textTertiary, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Recommendation</div>
          <Pill bg={C.greenBg} color={C.green}>{d.recommendation}</Pill>
        </div>
        <div style={{ background: C.pageBg, borderRadius: 7, padding: 10, fontSize: 11, color: C.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>
          <span style={{ fontWeight: 700, color: C.textPrimary }}>Explainability Statement: </span>{d.explainability}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.textTertiary }}>
          <span>Model: {d.modelName}</span><span>Confidence: {d.confidence}</span>
        </div>
      </div>
    </div>
  );
}

// Session 66 — (1) new PM Override Yes/No column (same Toggle+Pill /
// LockBadge convention as CoapplicantTable's own PM Override column);
// (2) Applicable Outcomes' Pill now forced to a single line
// (`whiteSpace: 'nowrap'` on its cell — inherited by the Pill's text);
// (3) Policy Definition's line-height tightened (1.5 → 1.4) to go with
// the shortened `definition` strings in the mock data, both aimed at
// reducing each row's rendered height; (4) Status no longer reads the old
// free-text `row.status` for an unlocked row — it now always shows a
// computed Active/Not Active pill off `row.active` (still a LockBadge +
// the fixed ENFORCED pill for the 3 rows that stay locked), the same
// pattern CoapplicantTable/HouseholdTable already use, so Second-Level
// Approval and Decision Change Authorization (newly unlocked) render the
// same way every other toggleable row here does.
function DecisionWorkflowTable({ rows, onToggle, onPMOverrideChange, onNumericChange }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
        <thead>
          <tr>
            {['Decision Control', 'Policy Definition', 'Applicable Outcomes', 'PM Override', 'Status'].map((col) => (
              <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 700, color: C.textPrimary, verticalAlign: 'top', minWidth: 170 }}>{row.control}</td>
              <td style={{ padding: '12px 10px', fontSize: 12, color: C.textSecondary, verticalAlign: 'top', lineHeight: 1.4, minWidth: 260 }}>
                {row.definition}
                {row.sample && <SampleTag style={{ marginLeft: 8 }} label="No notice-dispatch system exists" />}
                {row.numericField && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 10.5, color: C.textTertiary, textTransform: 'uppercase', fontWeight: 700 }}>{row.numericField.label}:</span>
                    <input type="number" value={row.numericField.value} className={noSpinnerClass} onChange={(e) => onNumericChange(row.id, Number(e.target.value))} style={{ ...inputStyle(), width: 60 }} />
                    <span style={{ fontSize: 11, color: C.textSecondary }}>{row.numericField.suffix}</span>
                  </div>
                )}
              </td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top', whiteSpace: 'nowrap' }}><Pill bg={C.blueBg} color={C.blue}>{row.outcomes}</Pill></td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                {row.locked ? <LockBadge /> : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle value={!!row.pmOverride} onChange={(v) => onPMOverrideChange(row.id, v)} />
                    <Pill bg={row.pmOverride ? C.greenBg : C.neutral} color={row.pmOverride ? C.green : C.textTertiary}>{row.pmOverride ? 'Yes' : 'No'}</Pill>
                  </div>
                )}
              </td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                {row.locked ? (
                  <Pill bg={C.greenBg} color={C.green}>{row.status}</Pill>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Toggle value={!!row.active} onChange={(v) => onToggle(row.id, v)} />
                    <Pill bg={row.active ? C.greenBg : C.neutral} color={row.active ? C.green : C.textTertiary}>{row.active ? 'Active' : 'Not Active'}</Pill>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LifecycleGlossary({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${C.border}` }}>
      {items.map((it) => (
        <div key={it.term}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.textPrimary }}>{it.term}</span>
            {it.sample && <SampleTag />}
          </div>
          <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.5 }}>{it.def}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab 3 ("Compliance & Audit") — Session 61, 2026-11-12 ───────────────────
// See screening-configuration/UrbanNest_ScreeningConfiguration_Figma_Review.md
// §11 for the review. Lowest-risk tab built so far: no named vendors, no
// fabricated applicant/AI output. The one real/sample line: Compliance
// Safeguards and Data Retention are real governance stances (locked, since
// the Figma shows no PM override for any of them); the Audit Trail table's
// "Enabled" status and "View Audit History" link are sample — no audit-log
// pipeline exists — while the list of what it WOULD record is real spec.

// Session 66 — Actions converted from a fixed read-only lock badge to a
// real Active/Not Active toggle. "If Active then it is considered as
// Locked" is read literally: an Active row shows the Toggle+Pill AND the
// LockBadge together (locked is a direct consequence of being Active,
// not an independent flag any more); Not Active drops the lock badge.
// Status's own "Mandatory / Enabled" pill is left as fixed display text
// per the request's scope (Actions only) — flagged in the project doc in
// case Status is meant to track this toggle too.
function ComplianceSafeguardsTable({ rows, onToggle }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
        <thead>
          <tr>
            {['Rule', 'Description', 'Status', 'Source', 'Actions'].map((col) => (
              <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}` }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 700, color: C.textPrimary, verticalAlign: 'top', minWidth: 150 }}>{row.rule}</td>
              <td style={{ padding: '12px 10px', fontSize: 12, color: C.textSecondary, verticalAlign: 'top', lineHeight: 1.5, minWidth: 280 }}>{row.description}</td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                <Pill bg={C.greenBg} color={C.green}><i className="ti ti-lock" style={{ fontSize: 10, marginRight: 3 }} />{row.statusLabel}</Pill>
              </td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top' }}><span style={{ fontSize: 12, color: C.textSecondary }}>{row.source}</span></td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle value={!!row.active} onChange={(v) => onToggle(row.id, v)} />
                  <Pill bg={row.active ? C.greenBg : C.neutral} color={row.active ? C.green : C.textTertiary}>{row.active ? 'Active' : 'Not Active'}</Pill>
                  {row.active && <LockBadge />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTrailTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body }}>
        <thead>
          <tr>
            {['Activity', 'What UrbanNest Records', 'Status'].map((col) => (
              <th key={col} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', borderBottom: `1px solid ${C.border}` }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 700, color: C.textPrimary, verticalAlign: 'top', minWidth: 160 }}>{row.activity}</td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top', minWidth: 320 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {row.recordsTags.map((t) => (
                    <span key={t} style={{ fontFamily: F.body, fontSize: 11, color: C.textSecondary, background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 8px' }}>{t}</span>
                  ))}
                </div>
              </td>
              <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pill bg={C.greenBg} color={C.green}><i className="ti ti-check" style={{ fontSize: 10, marginRight: 3 }} />Enabled</Pill>
                  <SampleTag label="No audit-log pipeline exists yet" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 14 }}>
        <DeadEndButton small label="View Audit History" icon="ti-external-link" tooltip="No audit-log endpoint exists yet — nothing is actually being recorded." />
      </div>
    </div>
  );
}

function DataRetentionCard({ info }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, background: C.pageBg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 18 }}>
        <div>
          <div style={fieldLabel}>Retention Policy</div>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{info.retentionPolicy}</div>
        </div>
        <div>
          <div style={fieldLabel}>Applicable Market</div>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-world" style={{ fontSize: 13, color: C.textSecondary }} />{info.applicableMarket}
          </div>
        </div>
        <div>
          <div style={fieldLabel}>Policy Status</div>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-point-filled" style={{ fontSize: 14 }} />{info.policyStatus}
          </div>
        </div>
        <div>
          <div style={fieldLabel}>Management</div>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{info.management}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Tier Policy Inheritance banner ──────────────────────────────────────

function InheritanceBanner({ stats }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.primary}, #0B2545)`, color: C.white,
      borderRadius: 14, padding: '20px 24px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>
        <i className="ti ti-stack-2" /> Multi-Tier Policy Inheritance Model
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontFamily: F.headline, fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
        <span>UN Admin Default Policy</span>
        <i className="ti ti-arrow-right" style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }} />
        <span>Property Manager (PM) Config</span>
        <i className="ti ti-arrow-right" style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }} />
        <span>Property-Specific Policy</span>
      </div>
      <div style={{ fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.75)', maxWidth: 680, lineHeight: 1.6, marginBottom: 16 }}>
        Configurations set here form the baseline minimum compliance thresholds across the network.
        Property Managers may tighten scoring or income ratios within permitted upper bounds, but statutory
        Fair Housing, FCRA dispute windows, and bifurcated criminal-review order are strictly locked.
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: F.headline, fontSize: 20, fontWeight: 700 }}>{stats.mandatorySafeguardsLocked}</div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Mandatory Safeguards Locked</div>
        </div>
        <div>
          <div style={{ fontFamily: F.headline, fontSize: 20, fontWeight: 700 }}>{stats.permittedPMOverrideBounds}</div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Permitted PM Overrides</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: F.headline, fontSize: 20, fontWeight: 700 }}>SHA-256</div>
            <SampleTag style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', color: C.white }} label="No real audit signing" />
          </div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Audit Signature</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function UNAdminScreeningConfiguration() {
  const [categories, setCategories] = useState(() => deepClone(DEFAULT_SCREENING_CATEGORIES));

  // 2026-11-18 — collapse/expand state for the 9 Screening Rules (Tab 1)
  // sections, added per request ("the screening rules tab is too long").
  // This is PURE UI VIEW-STATE, unrelated to the real screening-config
  // record above (`categories`/`extra`/etc., saved server-side via
  // screeningConfigApi.js) — it is never read by handleSave, never part
  // of the API payload, and reset here has no effect on any real policy
  // value. Persisted separately, per-browser, in its own localStorage key
  // (not the config-save pipeline the note at this file's top explicitly
  // says no longer uses localStorage — that note is about the real config
  // data; this is just "which accordion did this admin leave open").
  // Default (confirmed via AskUserQuestion): every section starts
  // COLLAPSED, so the tab is short the moment it's opened, and an admin
  // expands only the section(s) they need — not the previous "everything
  // open" look.
  const [collapsedSectionIds, setCollapsedSectionIds] = useState(() => {
    try {
      const raw = localStorage.getItem(SCREENING_RULES_COLLAPSE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall through to the default below.
    }
    return new Set(DEFAULT_SCREENING_CATEGORIES.map((c) => c.id));
  });
  useEffect(() => {
    try {
      localStorage.setItem(SCREENING_RULES_COLLAPSE_STORAGE_KEY, JSON.stringify(Array.from(collapsedSectionIds)));
    } catch {
      // ignore — nothing real breaks if this view-state preference can't be saved.
    }
  }, [collapsedSectionIds]);
  const toggleSectionCollapsed = (id) => {
    setCollapsedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const collapseAllSections = () => setCollapsedSectionIds(new Set(categories.map((c) => c.id)));
  const expandAllSections = () => setCollapsedSectionIds(new Set());
  const allSectionsCollapsed = categories.length > 0 && categories.every((c) => collapsedSectionIds.has(c.id));

  // Tab 2 state — Session 61. `extra` holds the handful of fields Tab 1
  // never had (Guarantor Option, employment tenure). `criteriaPermissions`
  // is the new 3-state "PM Customization Permission" per Section 01
  // criterion. The three row sets are Sections 02/03/04's own real,
  // editable enforcement state. All persisted in the same server-side
  // record as `categories`, so one Save Draft covers the whole screen.
  const [extra, setExtra] = useState(() => deepClone(CRITERIA_EXTRA_DEFAULTS));
  const [criteriaPermissions, setCriteriaPermissions] = useState(() => {
    const defaults = {};
    SECTION01_CRITERIA.forEach((c) => { defaults[c.id] = c.defaultPermission; });
    return defaults;
  });
  // Session 65 — per-criterion Active/Not Active + Weightage (%), and the
  // selected value of the new 2-value "Default Evaluation Method" dropdown
  // for the 5 criteria that have one. All three persist alongside the rest
  // of Tab 2's state in the same server-side record.
  const [criteriaActive, setCriteriaActive] = useState(() => {
    const defaults = {};
    SECTION01_CRITERIA.forEach((c) => { defaults[c.id] = true; });
    return defaults;
  });
  const [criteriaWeightage, setCriteriaWeightage] = useState(() => ({ ...CRITERIA_WEIGHTAGE_DEFAULTS }));
  // 2026-11-17 — Weight Eligible is now a live, editable per-criterion
  // toggle (not a fixed property of the criterion definition), matching
  // the approved wireframe's drawer, where every criterion's "Weight
  // Eligible" row is a real Yes/No toggle, not a static label. Defaults
  // from each criterion's own `weightEligible` so starting behavior is
  // unchanged until a UN Admin actually flips one.
  const [criteriaWeightEligible, setCriteriaWeightEligible] = useState(() => {
    const defaults = {};
    SECTION01_CRITERIA.forEach((c) => { defaults[c.id] = c.weightEligible !== false; });
    return defaults;
  });
  // 2026-11-17 — Mode / Category / Requirement, now real per-criterion
  // state (previously read straight off the static criterion.mode /
  // .category / .requirement fields with no editing path at all). Request
  // was to unprotect these specifically for Credit Check's drawer; the
  // state itself is seeded for every criterion so the same plumbing can
  // cover the rest later without another state-shape change.
  const [criteriaMode, setCriteriaMode] = useState(() => {
    const defaults = {};
    SECTION01_CRITERIA.forEach((c) => { defaults[c.id] = c.mode; });
    return defaults;
  });
  const [criteriaCategory, setCriteriaCategory] = useState(() => {
    const defaults = {};
    SECTION01_CRITERIA.forEach((c) => { defaults[c.id] = c.category; });
    return defaults;
  });
  const [criteriaRequirement, setCriteriaRequirement] = useState(() => {
    const defaults = {};
    SECTION01_CRITERIA.forEach((c) => { defaults[c.id] = c.requirement; });
    return defaults;
  });
  // Session 73 — Supported Markets / Supported Providers / Applicant Scope
  // + embedded Alternative Documentation, one entry per Section 01
  // criterion, keyed by criterion id. See CRITERIA_EXTENDED_DEFAULTS for
  // the shipped-mock defaults and the drawer rewrite for how each field
  // is edited.
  const [criteriaExtendedConfig, setCriteriaExtendedConfig] = useState(() => deepClone(CRITERIA_EXTENDED_DEFAULTS));
  const [coapplicantRows, setCoapplicantRows] = useState(() => deepClone(DEFAULT_COAPPLICANT_ROWS).map((r) => ({ ...r, active: true })));
  // Session 65 — Household Screening, split out of the former combined
  // Co-Applicant & Household section (see DEFAULT_HOUSEHOLD_ROWS).
  const [householdRows, setHouseholdRows] = useState(() => deepClone(DEFAULT_HOUSEHOLD_ROWS).map((r) => ({ ...r, active: true })));
  const [aiGuardrailRows, setAiGuardrailRows] = useState(() => deepClone(DEFAULT_AI_GUARDRAIL_ROWS));
  const [decisionWorkflowRows, setDecisionWorkflowRows] = useState(() => deepClone(DEFAULT_DECISION_WORKFLOW_ROWS).map((r) => ({ ...r, active: true })));
  // Session 66 — Compliance Safeguards (Tab 3) Actions column converted
  // from a fixed read-only lock badge to a real Active/Not Active toggle.
  // "If Active then it is considered as Locked" — an Active row shows the
  // same LockBadge the old static `locked:true` rows always showed;
  // switching it to Not Active drops the lock badge.
  const [complianceSafeguardRows, setComplianceSafeguardRows] = useState(() => deepClone(DEFAULT_COMPLIANCE_SAFEGUARD_ROWS).map((r) => ({ ...r, active: true })));
  const [openCriterionId, setOpenCriterionId] = useState(null);
  // Session 67 — Target Market Jurisdiction, converted from a static
  // display string to a real editable dropdown (US/India).
  const [targetMarketJurisdiction, setTargetMarketJurisdiction] = useState('US');
  // Session 67 — once Submitted, every field across all 3 tabs (plus this
  // Jurisdiction dropdown) is protected/locked; Edit unlocks it again. See
  // handleSubmitForReview/handleEdit below and the locking wrapper around
  // the tab content further down in the render.
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [savedAt, setSavedAt] = useState(null);
  // 2026-11-13 — Country/State/City location overrides (record-level, see
  // the helpers above). `activeLocation` null = viewing/editing Default;
  // otherwise every field/table/drawer on this screen is driven by that
  // location's own independent record instead. `locationsIndex` is just the
  // flat list of added locations for the switcher pills — recomputed after
  // add/delete, not on every unrelated save.
  const [activeLocation, setActiveLocation] = useState(null);
  const [locationsIndex, setLocationsIndex] = useState([]);
  // 18th sitting — every piece of state above starts at its shipped-mock-
  // defaults value (same as the old "nothing stored yet" branch) and gets
  // overwritten exactly once by this mount effect, via the SAME
  // applyRecordToState() every location switch/add/delete already uses
  // below — one hydration path for "apply a fetched record", not two that
  // could drift apart.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let defaultRecord = null;
      try {
        defaultRecord = await apiGetScreeningConfig(null);
      } catch (err) {
        if (err.status !== 404) console.warn('[ScreeningConfiguration] could not load saved config', err);
      }
      if (!cancelled) applyRecordToState(defaultRecord ? recordFromApi(defaultRecord) : null);
      try {
        const locs = await apiListScreeningConfigLocations();
        if (!cancelled) setLocationsIndex(locs.map((l) => ({ country: l.country, state: l.state, city: l.city })));
      } catch (err) {
        console.warn('[ScreeningConfiguration] could not load locations list', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [newLocCountry, setNewLocCountry] = useState('US');
  // Pre-selected to the new country's first state rather than '' — '' never
  // matches a DropdownOrCustom option, which would otherwise default this
  // field into its free-text "Custom…" mode on open instead of showing a
  // clean dropdown placeholder.
  const [newLocState, setNewLocState] = useState(statesForCountry('US')[0].name);
  const [newLocCity, setNewLocCity] = useState('');
  const [toast, setToast] = useState('');
  // Session 65 — distinguishes a blocked-save/error toast (red) from the
  // normal confirmation toast (primary blue), and gives the longer error
  // message more time on screen before it auto-dismisses.
  const [toastError, setToastError] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');

  const stats = useMemo(() => computePolicyStats(categories), [categories]);

  // Session 65 — Co-Applicant Screening's own Active state is the gate the
  // rest of Section 02 (both the Co-Applicant and new Household sections)
  // depends on.
  const coappGateActive = coapplicantRows.find((r) => r.id === 'coapp_screening')?.active !== false;

  // Session 65 — the live running total behind the "weightage must sum to
  // 100% across Active criteria" Save Draft gate (see handleSaveDraft).
  // Session 73 — explicitly skips weightEligible:false criteria (only
  // Identity Verification today) rather than relying on its weightage
  // defaulting to 0 — it's a gate/pass-fail check, excluded from the pool
  // by definition, not a 0-weighted one.
  const activeWeightageSum = useMemo(
    () => SECTION01_CRITERIA.reduce((sum, c) => (
      criteriaWeightEligible[c.id] === false ? sum : sum + (criteriaActive[c.id] ? (Number(criteriaWeightage[c.id]) || 0) : 0)
    ), 0),
    [criteriaActive, criteriaWeightage, criteriaWeightEligible]
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => { setToast(''); setToastError(false); }, toastError ? 4000 : 2200);
    return () => clearTimeout(t);
  }, [toast, toastError]);

  function updateCategory(categoryId, updater) {
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? updater(cat) : cat)));
  }

  function handleFieldChange(categoryId, fieldId, value) {
    updateCategory(categoryId, (cat) => ({
      ...cat,
      fields: cat.fields.map((f) => (f.id === fieldId ? { ...f, value } : f)),
    }));
  }

  // Session 63 — merges arbitrary extra keys into a `fields`-kind field,
  // used by EditableField's PM Override mini-control (pmOverrideAllowed /
  // pmMin / pmMax), mirroring the existing handleRowChange patch pattern.
  function handleFieldPatch(categoryId, fieldId, patch) {
    updateCategory(categoryId, (cat) => ({
      ...cat,
      fields: cat.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
    }));
  }

  function handleCardFieldChange(categoryId, cardId, fieldId, value) {
    updateCategory(categoryId, (cat) => ({
      ...cat,
      cards: cat.cards.map((card) => (
        card.id === cardId
          ? { ...card, fields: card.fields.map((f) => (f.id === fieldId ? { ...f, value } : f)) }
          : card
      )),
    }));
  }

  // 2026-11-13 bugfix: the card-fields equivalent of `handleFieldPatch`
  // above — was missing entirely, so `CardsSection` never had anything to
  // pass as `EditableField`'s `onPatch`, and clicking a PM Override toggle
  // on a `cards`-kind field (e.g. Government ID Verification's Allowed
  // Types / Max Expiration Buffer, added this sitting) threw "onPatch is
  // not a function" — every prior PM-Override field lived in a
  // `fields`-kind category (Income & Financial, Rental History), which is
  // why this gap was never hit before now.
  function handleCardFieldPatch(categoryId, cardId, fieldId, patch) {
    updateCategory(categoryId, (cat) => ({
      ...cat,
      cards: cat.cards.map((card) => (
        card.id === cardId
          ? { ...card, fields: card.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
          : card
      )),
    }));
  }

  function handleRowChange(categoryId, rowId, patch) {
    updateCategory(categoryId, (cat) => ({
      ...cat,
      rows: cat.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    }));
  }

  function handleBandChange(categoryId, bandId, patch) {
    updateCategory(categoryId, (cat) => ({
      ...cat,
      bands: cat.bands.map((b) => (b.id === bandId ? { ...b, ...patch } : b)),
    }));
  }

  function handleExtraToggleChange(categoryId, value) {
    updateCategory(categoryId, (cat) => ({ ...cat, extraToggle: { ...cat.extraToggle, value } }));
  }

  // 2026-11-18 — PM Override (Yes/No) + Active/Inactive per scenario row,
  // added to every `scenarioOutcomes`-kind section per request. Same
  // immutable-patch pattern as handleRowChange/handleBandChange above.
  function handleScenarioRowChange(categoryId, rowId, patch) {
    updateCategory(categoryId, (cat) => ({
      ...cat,
      scenarioRows: cat.scenarioRows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    }));
  }

  // ─── Tab 2 handlers ──────────────────────────────────────────────────────
  function handleExtraChange(key, value) {
    setExtra((prev) => ({ ...prev, [key]: value }));
  }
  function handlePermissionChange(criterionId, value) {
    setCriteriaPermissions((prev) => ({ ...prev, [criterionId]: value }));
  }
  // Session 65 — Section Status / Weightage / Default Evaluation Method,
  // one handler each, shared by the card, the note, and the drawer.
  function handleCriterionActiveToggle(criterionId, value) {
    setCriteriaActive((prev) => ({ ...prev, [criterionId]: value }));
  }
  function handleCriterionWeightageChange(criterionId, value) {
    setCriteriaWeightage((prev) => ({ ...prev, [criterionId]: value }));
  }
  function handleCriterionWeightEligibleChange(criterionId, value) {
    setCriteriaWeightEligible((prev) => ({ ...prev, [criterionId]: value }));
  }
  // 2026-11-17 — Mode / Category / Requirement, unprotected for Credit
  // Check's drawer specifically (see CriterionDrawer's own id check).
  function handleCriterionModeChange(criterionId, value) {
    setCriteriaMode((prev) => ({ ...prev, [criterionId]: value }));
  }
  function handleCriterionCategoryChange(criterionId, value) {
    setCriteriaCategory((prev) => ({ ...prev, [criterionId]: value }));
  }
  function handleCriterionRequirementChange(criterionId, value) {
    setCriteriaRequirement((prev) => ({ ...prev, [criterionId]: value }));
  }
  // Session 73 — Supported Markets/Providers/Applicant Scope (shallow
  // merge) and the nested Alternative Documentation patch (merges into
  // that criterion's own `altDoc` sub-object specifically).
  function handleCriterionExtendedChange(criterionId, patch) {
    setCriteriaExtendedConfig((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], ...patch },
    }));
  }
  function handleCriterionAltDocChange(criterionId, patch) {
    setCriteriaExtendedConfig((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], altDoc: { ...prev[criterionId]?.altDoc, ...patch } },
    }));
  }
  function handleCoapplicantActiveToggle(rowId, value) {
    setCoapplicantRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, active: value } : r)));
  }
  function handleCoapplicantEnforcementChange(rowId, value) {
    setCoapplicantRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, enforcement: value } : r)));
  }
  function handleCoapplicantPMOverrideChange(rowId, value) {
    setCoapplicantRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, pmOverride: value } : r)));
  }
  function handleCoapplicantNumeric(rowId, value) {
    setCoapplicantRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, numericField: { ...r.numericField, value } } : r)));
  }
  function handleHouseholdToggle(rowId, value) {
    setHouseholdRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, active: value } : r)));
  }
  function handleHouseholdPMOverride(rowId, value) {
    setHouseholdRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, pmOverride: value } : r)));
  }
  function handleHouseholdNumeric(rowId, value) {
    setHouseholdRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, numericField: { ...r.numericField, value } } : r)));
  }
  function handleAIGuardrailToggle(rowId, value) {
    setAiGuardrailRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, enabled: value } : r)));
  }
  function handleDecisionWorkflowToggle(rowId, value) {
    setDecisionWorkflowRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, active: value } : r)));
  }
  function handleDecisionWorkflowPMOverride(rowId, value) {
    setDecisionWorkflowRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, pmOverride: value } : r)));
  }
  function handleDecisionWorkflowNumeric(rowId, value) {
    setDecisionWorkflowRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, numericField: { ...r.numericField, value } } : r)));
  }
  function handleComplianceSafeguardToggle(rowId, value) {
    setComplianceSafeguardRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, active: value } : r)));
  }

  // 2026-11-13 — swaps every piece of this screen's state over to `record`
  // (or the shipped defaults, field-by-field, mirroring each useState
  // initializer's own merge logic above) in one shot. Used both for the
  // initial mount's equivalent logic (inlined in the useState calls) and
  // for switching the active location — reading straight from storage each
  // time, same as a page refresh would, rather than keeping a separate
  // in-memory copy per location: switching away from unsaved edits discards
  // them, exactly like navigating away from any other unsaved field today.
  function applyRecordToState(record) {
    const permDefaults = {};
    SECTION01_CRITERIA.forEach((c) => { permDefaults[c.id] = c.defaultPermission; });
    const activeDefaults = {};
    SECTION01_CRITERIA.forEach((c) => { activeDefaults[c.id] = true; });
    const weightEligibleDefaults = {};
    SECTION01_CRITERIA.forEach((c) => { weightEligibleDefaults[c.id] = c.weightEligible !== false; });
    const modeDefaults = {};
    SECTION01_CRITERIA.forEach((c) => { modeDefaults[c.id] = c.mode; });
    const categoryDefaults = {};
    SECTION01_CRITERIA.forEach((c) => { categoryDefaults[c.id] = c.category; });
    const requirementDefaults = {};
    SECTION01_CRITERIA.forEach((c) => { requirementDefaults[c.id] = c.requirement; });

    setCategories(record?.categories ? deepClone(record.categories) : deepClone(DEFAULT_SCREENING_CATEGORIES));
    setExtra(record?.extra ? { ...deepClone(CRITERIA_EXTRA_DEFAULTS), ...record.extra } : deepClone(CRITERIA_EXTRA_DEFAULTS));
    setCriteriaPermissions(record?.criteriaPermissions ? { ...permDefaults, ...record.criteriaPermissions } : permDefaults);
    setCriteriaActive(record?.criteriaActive ? { ...activeDefaults, ...record.criteriaActive } : activeDefaults);
    setCriteriaWeightage(record?.criteriaWeightage ? { ...CRITERIA_WEIGHTAGE_DEFAULTS, ...record.criteriaWeightage } : { ...CRITERIA_WEIGHTAGE_DEFAULTS });
    setCriteriaWeightEligible(record?.criteriaWeightEligible ? { ...weightEligibleDefaults, ...record.criteriaWeightEligible } : weightEligibleDefaults);
    setCriteriaMode(record?.criteriaMode ? { ...modeDefaults, ...record.criteriaMode } : modeDefaults);
    setCriteriaCategory(record?.criteriaCategory ? { ...categoryDefaults, ...record.criteriaCategory } : categoryDefaults);
    setCriteriaRequirement(record?.criteriaRequirement ? { ...requirementDefaults, ...record.criteriaRequirement } : requirementDefaults);
    setCriteriaExtendedConfig(record?.criteriaExtendedConfig ? { ...deepClone(CRITERIA_EXTENDED_DEFAULTS), ...record.criteriaExtendedConfig } : deepClone(CRITERIA_EXTENDED_DEFAULTS));
    setCoapplicantRows(record?.coapplicantRows ? deepClone(record.coapplicantRows) : deepClone(DEFAULT_COAPPLICANT_ROWS).map((r) => ({ ...r, active: true })));
    setHouseholdRows(record?.householdRows ? deepClone(record.householdRows) : deepClone(DEFAULT_HOUSEHOLD_ROWS).map((r) => ({ ...r, active: true })));
    setAiGuardrailRows(record?.aiGuardrailRows ? deepClone(record.aiGuardrailRows) : deepClone(DEFAULT_AI_GUARDRAIL_ROWS));
    setDecisionWorkflowRows(record?.decisionWorkflowRows ? deepClone(record.decisionWorkflowRows) : deepClone(DEFAULT_DECISION_WORKFLOW_ROWS).map((r) => ({ ...r, active: true })));
    setComplianceSafeguardRows(record?.complianceSafeguardRows ? deepClone(record.complianceSafeguardRows) : deepClone(DEFAULT_COMPLIANCE_SAFEGUARD_ROWS).map((r) => ({ ...r, active: true })));
    setTargetMarketJurisdiction(record?.targetMarketJurisdiction || 'US');
    setIsSubmitted(record?.isSubmitted || false);
    setSavedAt(record?.savedAt || null);
    setOpenCriterionId(null);
  }

  async function handleSelectLocation(loc) {
    let record = null;
    try {
      record = await apiGetScreeningConfig(loc);
    } catch (err) {
      if (err.status === 404 && loc) {
        // No record saved yet for this specific city — fall back to
        // Default's own saved record (not raw mock constants), the same
        // fallback chain getLocationRecord()||extractDefaultRecord() used
        // to implement against localStorage.
        try {
          record = await apiGetScreeningConfig(null);
        } catch (err2) {
          if (err2.status !== 404) console.warn('[ScreeningConfiguration] could not load Default config', err2);
        }
      } else if (err.status !== 404) {
        console.warn('[ScreeningConfiguration] could not load location config', err);
      }
    }
    applyRecordToState(record ? recordFromApi(record) : null);
    setActiveLocation(loc);
    setToastError(false);
    setToast(loc ? `Editing: ${loc.city}, ${loc.state}, ${loc.country}` : 'Editing: Default');
  }

  async function handleAddLocation() {
    const country = newLocCountry.trim();
    const state = newLocState.trim();
    const city = newLocCity.trim();
    if (!country || !state || !city) {
      setToastError(true);
      setToast('Country, State, and City are all required to add a location.');
      return;
    }
    if (locationsIndex.some((l) => l.country === country && l.state === state && l.city === city)) {
      setToastError(true);
      setToast(`${city}, ${state}, ${country} already exists.`);
      return;
    }
    let defaultRecord = null;
    try {
      defaultRecord = await apiGetScreeningConfig(null);
    } catch (err) {
      if (err.status !== 404) console.warn('[ScreeningConfiguration] could not load Default config', err);
    }
    const clonedRecord = extractDefaultRecord(recordFromApi(defaultRecord));
    try {
      await apiSaveScreeningConfig({ country, state, city }, { data: toDataPayload(clonedRecord), isSubmitted: false });
    } catch (err) {
      console.warn('[ScreeningConfiguration] could not persist new location', err);
      setToastError(true);
      setToast(err.message || 'Could not add location');
      return;
    }
    setLocationsIndex([...locationsIndex, { country, state, city }]);
    applyRecordToState(clonedRecord);
    setActiveLocation({ country, state, city });
    setAddLocationOpen(false);
    setNewLocState('');
    setNewLocCity('');
    setToastError(false);
    setToast(`Added ${city}, ${state}, ${country} — cloned from Default. Now editing this location.`);
  }

  async function handleDeleteLocation(loc) {
    if (!window.confirm(`Delete the saved configuration for ${loc.city}, ${loc.state}, ${loc.country}? This cannot be undone.`)) return;
    try {
      await apiDeleteScreeningConfigLocation(loc);
    } catch (err) {
      console.warn('[ScreeningConfiguration] could not delete location', err);
      setToastError(true);
      setToast(err.message || 'Could not delete location');
      return;
    }
    setLocationsIndex(locationsIndex.filter((l) => !(l.country === loc.country && l.state === loc.state && l.city === loc.city)));
    const wasActive = activeLocation && activeLocation.country === loc.country && activeLocation.state === loc.state && activeLocation.city === loc.city;
    if (wasActive) {
      let defaultRecord = null;
      try {
        defaultRecord = await apiGetScreeningConfig(null);
      } catch (err) {
        if (err.status !== 404) console.warn('[ScreeningConfiguration] could not load Default config', err);
      }
      applyRecordToState(extractDefaultRecord(recordFromApi(defaultRecord)));
      setActiveLocation(null);
    }
    setToastError(false);
    setToast(`Deleted ${loc.city}, ${loc.state}, ${loc.country}.`);
  }

  // Session 65 — "the total/sum weightage of the selected [Active] section
  // should be 100%. Else system should not allow SAVE." Checked here,
  // ahead of every other Save Draft step, against the same
  // activeWeightageSum shown live under Section 01's heading, so what the
  // admin sees matches exactly what blocks the save.
  async function handleSaveDraft() {
    const roundedSum = Math.round(activeWeightageSum * 100) / 100;
    if (roundedSum !== 100) {
      setToastError(true);
      setToast(`Cannot save — Active Screening Criteria weightage must total 100% (currently ${roundedSum}%).`);
      return;
    }
    const data = {
      categories, extra, criteriaPermissions, criteriaActive, criteriaWeightage, criteriaWeightEligible, criteriaMode, criteriaCategory, criteriaRequirement, criteriaExtendedConfig,
      coapplicantRows, householdRows, aiGuardrailRows, decisionWorkflowRows, complianceSafeguardRows,
      targetMarketJurisdiction,
    };
    try {
      // 2026-11-13 — saves to the active location's own record when one is
      // selected, leaving Default and every other location untouched;
      // saves the Default record exactly as before when none is selected
      // (activeLocation === null, resolved server-side to the Default row).
      const saved = await apiSaveScreeningConfig(activeLocation, { data, isSubmitted });
      setSavedAt(saved.saved_at);
      setToastError(false);
      setToast(activeLocation ? `Saved ${activeLocation.city}, ${activeLocation.state}` : 'Saved');
    } catch (err) {
      console.warn('[ScreeningConfiguration] could not save config', err);
      setToastError(true);
      setToast(err.message || 'Could not save');
    }
  }

  // Session 67 — "Submit for Review" is now a real, working action (not a
  // DeadEndButton): since this screen has no backend yet, "submitted" is a
  // frontend-only locked state, the same kind of real-but-local action
  // Save Draft already is. Reuses the identical 100%-weightage gate Save
  // Draft checks, since submitting an incomplete config for review makes
  // no more sense than saving one. Closes any open Criterion drawer first
  // (setOpenCriterionId(null)) so a modal can't be left stuck open once
  // the locking wrapper below makes it unclickable.
  async function handleSubmitForReview() {
    const roundedSum = Math.round(activeWeightageSum * 100) / 100;
    if (roundedSum !== 100) {
      setToastError(true);
      setToast(`Cannot submit — Active Screening Criteria weightage must total 100% (currently ${roundedSum}%).`);
      return;
    }
    setOpenCriterionId(null);
    const data = {
      categories, extra, criteriaPermissions, criteriaActive, criteriaWeightage, criteriaWeightEligible, criteriaMode, criteriaCategory, criteriaRequirement, criteriaExtendedConfig,
      coapplicantRows, householdRows, aiGuardrailRows, decisionWorkflowRows, complianceSafeguardRows,
      targetMarketJurisdiction,
    };
    try {
      const saved = await apiSaveScreeningConfig(activeLocation, { data, isSubmitted: true });
      setSavedAt(saved.saved_at);
      setIsSubmitted(true);
      setToastError(false);
      setToast(activeLocation
        ? `Submitted ${activeLocation.city}, ${activeLocation.state} for review — locked. Click Edit to make changes.`
        : 'Submitted for review — every field is now locked. Click Edit to make changes.');
    } catch (err) {
      console.warn('[ScreeningConfiguration] could not submit config', err);
      setToastError(true);
      setToast(err.message || 'Could not submit');
    }
  }

  // Session 67 — unlocks a Submitted config back to editable. Reversible
  // and non-destructive (it only flips the lock flag, nothing is lost), so
  // unlike Submit/Save it doesn't need the weightage gate or a confirm.
  // 18th sitting — deliberately does NOT re-save whatever is currently live
  // in the form (same as the pre-API version, which only ever patched
  // `isSubmitted` on the stored blob, never the live in-memory field
  // values): admin_views.py's PUT only touches `data`/`saved_at` when a
  // `data` key is actually sent, and this call omits it entirely.
  async function handleEdit() {
    setIsSubmitted(false);
    try {
      await apiSaveScreeningConfig(activeLocation, { isSubmitted: false });
    } catch (err) {
      console.warn('[ScreeningConfiguration] could not persist unlocked state', err);
    }
    setToastError(false);
    setToast('Unlocked for editing');
  }

  return (
    <div style={{ fontFamily: F.body }}>
      <NoSpinnerStyle />
      {/* Session 67 — "Reset to Defaults" removed per request; Save Draft /
          Submit for Review (now a real action, not a DeadEndButton — see
          handleSubmitForReview) moved into their own top row alongside the
          breadcrumb, with no flexWrap, so they stay pinned to the extreme
          right of the page regardless of how the title block below wraps.
          Once submitted, this row swaps to a locked-status pill + a real
          Edit button that unlocks the whole screen again (handleEdit). */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 14 }}>
        <div style={{ fontSize: 12, color: C.textTertiary, display: 'flex', alignItems: 'center', gap: 5 }}>
          Configuration
          <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
          <span style={{ color: C.textSecondary }}>Screening Configuration</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isSubmitted ? (
            <>
              <Pill bg={C.amberBg} color={C.amberText}>
                <i className="ti ti-lock" style={{ fontSize: 11, marginRight: 3 }} /> Submitted — Locked
              </Pill>
              <button onClick={handleEdit} style={{ ...btnPrimary, height: 32, background: C.primary, color: C.white, border: 'none' }}>
                <i className="ti ti-pencil" /> Edit
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSaveDraft} style={{ ...btnPrimary, height: 32, background: C.white, color: C.primary, border: `1px solid ${C.border}` }}>
                <i className="ti ti-device-floppy" /> Save Draft
              </button>
              <button onClick={handleSubmitForReview} style={{ ...btnPrimary, height: 32, background: C.primary, color: C.white, border: 'none' }}>
                <i className="ti ti-send" /> Submit for Review
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <Pill bg={C.greenBg} color={C.green}>
              <i className="ti ti-circle-check" style={{ fontSize: 11, marginRight: 3 }} /> {POLICY_META_DEFAULTS.versionTag} · {POLICY_META_DEFAULTS.releaseStage}
            </Pill>
            <SampleTag label="No real versioning/release pipeline" />
            <span style={{ fontSize: 11.5, color: C.textTertiary }}>
              {savedAt ? `Saved · ${new Date(savedAt).toLocaleString()}` : 'Not yet saved'}
            </span>
            <DeadEndButton small label="View Version History" icon="ti-history" tooltip="No policy-version history endpoint exists yet." />
          </div>
          <div style={{ fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.textPrimary }}>Application Screening Configuration</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2, maxWidth: 640 }}>
            Manage default screening policies, qualification criteria, verification requirements, and compliance restrictions across UrbanNest markets.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pill bg={C.greenBg} color={C.green}>
              <i className="ti ti-shield-check" style={{ fontSize: 11, marginRight: 3 }} />
              {POLICY_META_DEFAULTS.complianceScope.join(' · ')} Compliant
            </Pill>
            <SampleTag label="Policy label, not a legal certification" />
          </div>
        </div>
      </div>

      {/* Jurisdiction / manifest strip */}
      <SectionCard>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          <div>
            <span style={fieldLabel}>Target Market Jurisdiction</span>
            {/* Session 67 — converted from a read-only free-text display to
                a real editable dropdown, per request. Only US/India exist as
                options today; a real market/jurisdiction reference table
                would back this list once this screen has a backend. Locked
                once the config is Submitted, same as every other field. */}
            <DropdownOrCustom
              options={JURISDICTION_OPTIONS}
              value={targetMarketJurisdiction}
              disabled={isSubmitted}
              onChange={setTargetMarketJurisdiction}
            />
            <div style={hintStyle}>Hardcoded to US/India today — no real market/jurisdiction reference table exists for this policy type yet.</div>
          </div>
          <div>
            <span style={fieldLabel}>Active Policy Manifest</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={POLICY_META_DEFAULTS.activePolicyManifest} readOnly style={inputStyle(true)} />
              <Pill bg={C.blueBg} color={C.blue}>Live & Enforced</Pill>
            </div>
            <div style={hintStyle}>Cosmetic label — "inherited by N properties" isn't computed from any real listing count yet.</div>
          </div>
        </div>
      </SectionCard>

      <InheritanceBanner stats={stats} />

      {/* 2026-11-13 — Country/State/City configuration scope. Sits above the
          tab strip so switching location swaps all 3 tabs at once, since
          they all read/write the one shared state block above. */}
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: C.textTertiary, textTransform: 'uppercase' }}>Configuration Scope</span>
          <span style={{ fontSize: 12, color: C.textTertiary }}>{locationsIndex.length} location{locationsIndex.length === 1 ? '' : 's'} configured</span>
        </div>
        {/* 18th sitting — a single dropdown ("Default" + every added
            location as "City, State") in place of a pill per location:
            pills stop scaling once more than a handful of locations are
            added (the stated concern — up to 20 records would overflow
            this card), while one dropdown stays exactly the same size
            regardless of how many locations exist. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ minWidth: 260 }}>
            <CustomDropdown
              options={[
                { value: '__DEFAULT__', label: 'Default' },
                ...[...locationsIndex]
                  .sort((a, b) => `${a.city}, ${a.state}`.localeCompare(`${b.city}, ${b.state}`))
                  .map((loc) => ({ value: `${loc.country}|${loc.state}|${loc.city}`, label: `${loc.city}, ${loc.state}` })),
              ]}
              value={activeLocation ? `${activeLocation.country}|${activeLocation.state}|${activeLocation.city}` : '__DEFAULT__'}
              onChange={(v) => {
                if (v === '__DEFAULT__') { handleSelectLocation(null); return; }
                const [country, state, city] = v.split('|');
                handleSelectLocation({ country, state, city });
              }}
            />
          </div>
          <button
            onClick={() => setAddLocationOpen(true)}
            style={{
              fontFamily: F.body, fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 999,
              border: `1px dashed ${C.border}`, background: 'none', color: C.textSecondary,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            + Add Location
          </button>
        </div>
        {activeLocation ? (
          <div style={{ marginTop: 12, background: C.blueBg, border: `1px solid ${C.blue}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: C.blue }}>
              <strong>Editing: {activeLocation.city}, {activeLocation.state}, {activeLocation.country}</strong> — a full, independent copy of this entire configuration. Applications outside this city still use Default.
            </span>
            <button
              onClick={() => handleDeleteLocation(activeLocation)}
              style={{ background: 'none', border: 'none', color: C.blue, fontWeight: 600, fontSize: 12.5, textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }}
            >
              Delete this location
            </button>
          </div>
        ) : (
          <div style={hintStyle}>Default applies to every application outside the locations above — no real backend "falls back" logic exists yet; this screen only manages the configuration data itself.</div>
        )}
      </SectionCard>

      {addLocationOpen && (
        <div style={overlayStyle} onClick={() => setAddLocationOpen(false)}>
          <div style={{ ...modalBase, maxWidth: 420, textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>+ Add Location</div>
              <button onClick={() => setAddLocationOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={fieldLabel}>Country</span>
                <DropdownOrCustom
                  options={JURISDICTION_OPTIONS}
                  value={newLocCountry}
                  onChange={(v) => { setNewLocCountry(v); setNewLocState(statesForCountry(v)[0].name); }}
                />
              </div>
              <div>
                <span style={fieldLabel}>State</span>
                {/* Stores the full state NAME (not the 2-letter code) as the
                    value — matches how every location saved before this
                    dropdown existed is stored (e.g. "Arkansas", not "AR"),
                    so old and new locations stay consistently labeled. */}
                <DropdownOrCustom
                  options={statesForCountry(newLocCountry).map((s) => ({ value: s.name, label: s.name }))}
                  value={newLocState}
                  onChange={setNewLocState}
                  placeholder="Select a state…"
                />
              </div>
              <div>
                <span style={fieldLabel}>City</span>
                <input value={newLocCity} onChange={(e) => setNewLocCity(e.target.value)} placeholder="e.g. Bentonville" style={inputStyle()} />
              </div>
              <div style={{ ...hintStyle, background: C.pageBg, padding: '10px 12px', borderRadius: 8, marginTop: 0 }}>
                This creates a full, independent copy of your Default configuration for this location. You can then edit anything that should differ here — nothing elsewhere changes.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setAddLocationOpen(false)} style={btnCancel}>Cancel</button>
                <button onClick={handleAddLocation} style={{ ...btnPrimary, background: C.primary, color: C.white, border: 'none' }}>Add Location</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: 'auto' }}>
        {[
          { id: 'rules', label: '1. Screening Rules', count: 9 },
          { id: 'decisions', label: '2. Evaluation & Decisions', count: 4 },
          { id: 'audit', label: '3. Compliance & Audit', count: 3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: F.body, fontSize: 13, fontWeight: 500,
              padding: '10px 20px', border: 'none', background: 'none',
              color: activeTab === tab.id ? C.primary : C.textTertiary,
              borderBottom: `2px solid ${activeTab === tab.id ? C.primary : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {tab.label} <span style={{ fontSize: 10.5, color: C.textTertiary }}>({tab.count} sections)</span>
          </button>
        ))}
      </div>

      {/* Session 67 — "every field will be protected/locked across tabs"
          once Submitted. Rather than threading a new disabled prop through
          every field/table/drawer component on this screen (there are a
          dozen-plus), the tab strip above stays live so the submitted
          config can still be browsed tab-by-tab, and this one wrapper
          disables every control inside whichever tab panel is showing —
          pointer-events blocks every click/keystroke, the dimmed opacity
          makes the locked state visually obvious. The Target Market
          Jurisdiction dropdown above the tab strip is locked separately via
          its own `disabled={isSubmitted}` prop, since it isn't inside this
          wrapper. */}
      <div style={isSubmitted ? { pointerEvents: 'none', opacity: 0.6 } : undefined}>
      {activeTab === 'audit' && (
        <>
          <SectionCard>
            <SectionHeading number={1} title="Compliance Safeguards" subtitle="UrbanNest maintains essential safeguards to ensure applicant screening and approval decisions follow applicable regulatory requirements." badge={<Pill bg={C.greenBg} color={C.green}><i className="ti ti-shield-check" style={{ fontSize: 11, marginRight: 3 }} />{complianceSafeguardRows.filter((r) => r.active).length} Active Safeguards</Pill>} />
            <ComplianceSafeguardsTable rows={complianceSafeguardRows} onToggle={handleComplianceSafeguardToggle} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, padding: '10px 12px', background: C.pageBg, borderRadius: 8 }}>
              <i className="ti ti-info-circle" style={{ color: C.textTertiary, fontSize: 14, flexShrink: 0, marginTop: 1 }} />
              <span style={{ ...hintStyle, marginTop: 0 }}>These safeguards represent baseline regulatory standards maintained across all UrbanNest screening pipelines.</span>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeading number={2} title="Audit Trail" subtitle="UrbanNest automatically records important screening activities and application decisions for future reference." />
            <AuditTrailTable rows={AUDIT_TRAIL_ROWS} />
          </SectionCard>

          <SectionCard>
            <SectionHeading number={3} title="Data Retention" subtitle="Applicant information and screening records are retained according to UrbanNest's applicable market-specific retention policies." />
            <DataRetentionCard info={DATA_RETENTION_INFO} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, padding: '10px 12px', background: C.pageBg, borderRadius: 8 }}>
              <i className="ti ti-map-pin" style={{ color: C.textTertiary, fontSize: 14, flexShrink: 0, marginTop: 1 }} />
              <span style={{ ...hintStyle, marginTop: 0 }}>Retention requirements are determined centrally by UrbanNest based on applicable legal requirements, jurisdiction statutes of limitation, and consumer reporting record categories.</span>
            </div>
          </SectionCard>
        </>
      )}

      {activeTab === 'rules' && (
        <>
          {/* 2026-11-18 — Collapse All / Expand All shortcut, per request,
              alongside each section's own clickable header/chevron below. */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={allSectionsCollapsed ? expandAllSections : collapseAllSections}
              style={{ ...btnCancel, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12 }}
            >
              <i className={`ti ti-${allSectionsCollapsed ? 'arrows-maximize' : 'arrows-minimize'}`} style={{ fontSize: 14 }} />
              {allSectionsCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
          </div>

          {categories.map((cat) => {
            const collapsed = collapsedSectionIds.has(cat.id);
            const onToggleCollapse = () => toggleSectionCollapsed(cat.id);
            if (cat.kind === 'fields') return <FieldsSection key={cat.id} category={cat} onFieldChange={(fid, v) => handleFieldChange(cat.id, fid, v)} onFieldPatch={(fid, patch) => handleFieldPatch(cat.id, fid, patch)} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />;
            if (cat.kind === 'table') return <CompletenessTable key={cat.id} category={cat} onRowChange={(rid, patch) => handleRowChange(cat.id, rid, patch)} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />;
            if (cat.kind === 'cards') return <CardsSection key={cat.id} category={cat} onFieldChange={(cardId, fid, v) => handleCardFieldChange(cat.id, cardId, fid, v)} onFieldPatch={(cardId, fid, patch) => handleCardFieldPatch(cat.id, cardId, fid, patch)} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />;
            if (cat.kind === 'bands') return (
              <BandsSection
                key={cat.id}
                category={cat}
                onBandChange={(bid, patch) => handleBandChange(cat.id, bid, patch)}
                onToggleChange={(v) => handleExtraToggleChange(cat.id, v)}
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
              />
            );
            // Session 73 — new read-only kinds added for the 4 scenario-grid
            // sections (Credit Risk, Income & Financial, Rental History &
            // Eviction, Employment Verification Rules) and the new Evaluation
            // Outcome & Weightage section.
            if (cat.kind === 'scenarioOutcomes') {
              // 2026-11-18 — only Credit Risk & Bureau Parameters has
              // tier-driven Scenario rows today (see formatScenarioFromTier's
              // own comment); tiersById stays undefined for every other
              // scenarioOutcomes category, which is exactly what makes
              // ScenarioOutcomesSection fall back to each row's plain
              // `scenario` string for them.
              const tiersById = cat.id === 'credit_risk'
                ? Object.fromEntries((criteriaExtendedConfig.credit_criteria?.scoreTiers || []).map((t) => [t.id, t]))
                : undefined;
              return <ScenarioOutcomesSection key={cat.id} category={cat} collapsed={collapsed} onToggleCollapse={onToggleCollapse} onRowChange={(rid, patch) => handleScenarioRowChange(cat.id, rid, patch)} tiersById={tiersById} />;
            }
            if (cat.kind === 'outcomeWeightage') return <OutcomeWeightageSection key={cat.id} category={cat} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />;
            return null;
          })}
        </>
      )}

      {activeTab === 'decisions' && (
        <>
          <EvaluationOrchestrationBanner />

          <SectionCard>
            {/* 2026-11-17 — rewritten against the approved wireframe
                (Main.dc.html) exactly: title+subtitle on the left (no
                badge pill — not part of the wireframe), a "+ Add
                Criterion" button on the right (inert — adding a genuinely
                new criterion type needs its own evaluator/baseline wiring,
                a larger backend change than this pass covers), the Sample
                Data tag, the Platform Rule banner with the wireframe's own
                copy, and a plain (not boxed) weightage summary line in the
                wireframe's exact wording. */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <SectionHeading number={1} title="Screening Criteria Framework" subtitle="6 criteria modules evaluated. Mode, Requirement and Supported Methods moved into Edit/View — the card now shows only what's needed to scan the list at a glance. Alternative Documentation is configured from the Add/Edit screen." />
              <DeadEndButton
                label="Add Criterion" icon="ti-plus"
                tooltip="Adding a genuinely new criterion needs its own evaluator and baseline wiring — a backend change to confirm before building, not part of this pass."
                style={{ background: C.primary, border: 'none', color: C.white, flexShrink: 0, fontWeight: 700, opacity: 1 }}
              />
            </div>
            <div style={{ margin: '10px 0 16px' }}><SampleTag label="Sample Data" /></div>
            <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 10, display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: C.blue }}>ℹ Platform Rule: {PLATFORM_RULE_CALLOUT}</span>
            </div>
            {/* Session 65 — live running total behind the "Save Draft is
                blocked unless Active criteria's Weightage sums to 100%"
                rule, so the admin sees exactly what has to change before a
                save will succeed. Wireframe shows this as a plain inline
                line (no box) — kept the amber/warning color when not at
                100% rather than always showing a green checkmark, since
                that's the real, honest state of this screen's Save gate. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: activeWeightageSum === 100 ? C.green : C.amberText, fontSize: 12.5, fontWeight: 700, marginBottom: 22 }}>
              {activeWeightageSum === 100 ? '✓' : '⚠'} Active Criteria Weightage: <span style={{ color: C.textPrimary, fontWeight: 800 }}>{activeWeightageSum}%</span> of 100% allocated across weight-eligible criteria · {activeWeightageSum === 100 ? 'ready to save.' : 'must total 100% before this screen can be saved.'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {SECTION01_CRITERIA.map((criterion) => {
                let val;
                if (criterion.source.kind === 'field') val = categories.find((c) => c.id === criterion.source.categoryId)?.fields.find((f) => f.id === criterion.source.fieldId)?.value;
                else if (criterion.source.kind === 'row') val = categories.find((c) => c.id === criterion.source.categoryId)?.rows.find((r) => r.id === criterion.source.rowId);
                else val = extra;
                return (
                  <CriterionCard
                    key={criterion.id} criterion={criterion} displayValue={val} extra={extra}
                    extended={criteriaExtendedConfig[criterion.id]}
                    weightEligible={criteriaWeightEligible[criterion.id]}
                    active={criteriaActive[criterion.id]} weightage={criteriaWeightage[criterion.id] ?? 0}
                    permission={criteriaPermissions[criterion.id]}
                    category={criteriaCategory[criterion.id]}
                    onOpen={setOpenCriterionId} onToggleActive={handleCriterionActiveToggle}
                  />
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: C.textTertiary, marginTop: 22, maxWidth: 900, lineHeight: 1.6 }}>
              Card now shows: Name/Key, Category pill (top-right), Weight, PM Configurability, Category, Supported Markets, and the status footer — four rows total, same compactness as the shipped card. Mode, Requirement, Supported Methods and Alternative Documentation all moved to the Add/Edit screen — open via the pencil icon.
            </p>
          </SectionCard>

          {/* Session 65 — split out of the former combined "Co-Applicant &
              Household Screening" section per request; renumbered 2/3, so
              AI Guardrails and Decision Workflow (previously 3/4) are now
              4/5. */}
          <SectionCard>
            <SectionHeading number={2} title="Co-Applicant Screening" subtitle="Individual co-applicant verification parameters, enforcement, and PM override — gates Household Screening below" badge={<Pill bg={C.greenBg} color={C.green}>Multi-Applicant Mesh</Pill>} />
            <StageStrip stages={HOUSEHOLD_PIPELINE_STAGES} />
            <CoapplicantTable
              rows={coapplicantRows} gateActive={coappGateActive}
              onToggleActive={handleCoapplicantActiveToggle}
              onEnforcementChange={handleCoapplicantEnforcementChange}
              onPMOverrideChange={handleCoapplicantPMOverrideChange}
              onNumericChange={handleCoapplicantNumeric}
            />
          </SectionCard>

          <SectionCard>
            <SectionHeading number={3} title="Household Screening" subtitle="Aggregate household-level income, history, and occupancy evaluation — Active only while Co-Applicant Screening is Active" badge={<Pill bg={C.greenBg} color={C.green}>Household Aggregate</Pill>} />
            <HouseholdTable rows={householdRows} gateActive={coappGateActive} onToggle={handleHouseholdToggle} onPMOverrideChange={handleHouseholdPMOverride} onNumericChange={handleHouseholdNumeric} />
          </SectionCard>

          <SectionCard>
            <SectionHeading number={4} title="AI & Automated Decision Guardrails" subtitle="Platform transparency, explainability guardrails, and prohibited automated actions" badge={<Pill bg={C.greenBg} color={C.green}><i className="ti ti-shield-lock" style={{ fontSize: 11, marginRight: 3 }} />Zero Autonomous Action</Pill>} />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(220px, 1fr)', gap: 18, alignItems: 'start' }}>
              <AIGuardrailTable rows={aiGuardrailRows} onToggle={handleAIGuardrailToggle} />
              <AILiveEvalPreviewCard />
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeading number={5} title="Application Decision Workflow" subtitle="End-to-end lifecycle progression stages, governance controls, and state transitions" badge={<Pill bg={C.greenBg} color={C.green}>Governed Workflow</Pill>} />
            <StageStrip stages={APPLICATION_LIFECYCLE_STAGES} />
            <DecisionWorkflowTable rows={decisionWorkflowRows} onToggle={handleDecisionWorkflowToggle} onPMOverrideChange={handleDecisionWorkflowPMOverride} onNumericChange={handleDecisionWorkflowNumeric} />
            <LifecycleGlossary items={LIFECYCLE_STATUS_GLOSSARY} />
          </SectionCard>

          <CriterionDrawer
            criterion={SECTION01_CRITERIA.find((c) => c.id === openCriterionId)}
            categories={categories}
            extra={extra}
            extended={criteriaExtendedConfig[openCriterionId]}
            permission={criteriaPermissions[openCriterionId]}
            onPermissionChange={handlePermissionChange}
            active={criteriaActive[openCriterionId]}
            weightage={criteriaWeightage[openCriterionId] ?? 0}
            weightEligible={criteriaWeightEligible[openCriterionId]}
            onWeightEligibleChange={handleCriterionWeightEligibleChange}
            mode={criteriaMode[openCriterionId]}
            onModeChange={handleCriterionModeChange}
            category={criteriaCategory[openCriterionId]}
            onCategoryChange={handleCriterionCategoryChange}
            requirement={criteriaRequirement[openCriterionId]}
            onRequirementChange={handleCriterionRequirementChange}
            onFieldChange={handleFieldChange}
            onRowChange={handleRowChange}
            onExtraChange={handleExtraChange}
            onActiveChange={handleCriterionActiveToggle}
            onWeightageChange={handleCriterionWeightageChange}
            onExtendedChange={handleCriterionExtendedChange}
            onAltDocChange={handleCriterionAltDocChange}
            onClose={() => setOpenCriterionId(null)}
          />
        </>
      )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: toastError ? C.danger : C.primary, color: C.white, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontFamily: F.body, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', maxWidth: 360 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
