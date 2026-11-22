// src/pages/ApplicationIntake/Stage2_RentalFinancial.jsx
//
// Approach doc §2, Screens 2–3 ("Rental History" + "Employment & Income").
// Form fields are real. The payroll-verification badge and underwriting
// ledger shown alongside them are sample content (sampleInstitutionalContent.js)
// — see that file's header for why, and the hard rule that they must never
// look like a real decision.
//
// Session 56 changes: rental-history address split into real street1/2/
// city/state/zip components (was one free-text field); a new Tenantship
// selector (Own Home / Rented / Co-Tenant / etc. — applicationIntakeOptions.js)
// hides Landlord Name/Contact when the applicant owned the home, since
// there's no landlord to name; Monthly Rent/Monthly Income/Additional
// Income amounts are prefixed with the listing's own currency ($ or ₹ —
// see that same file's currencySymbol()); "Additional Income Sources" is
// now a real list of {source, amount} entries instead of one loose string.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationIntake } from './ApplicationIntakeContext';
import { useIntakeReferences } from './useIntakeReferences';
import { apiGetPrimaryResidence } from './applicationIntakeApi';
import { ApplicationIntakeShell, StageFooterNav, FieldLabel, inputStyle, SectionHeading, Card } from './ApplicationIntakeShell';
import { C, F, RADIUS } from './applicationIntakeTokens';
import { SampleCard, SampleTag, SAMPLE_PAYROLL, sampleUnderwritingLedger } from './sampleInstitutionalContent';
import {
  currencySymbol,
  employmentDurationLabel,
} from './applicationIntakeOptions';

function CurrencyInput({ prefix, ...rest }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontFamily: F.body, fontSize: 13, color: C.textTertiary, pointerEvents: 'none' }}>
        {prefix}
      </span>
      <input type="number" style={{ ...inputStyle, paddingLeft: 24 }} {...rest} />
    </div>
  );
}

function addressLineFor(entry) {
  const line1 = [entry.addressStreet1, entry.addressStreet2].filter(Boolean).join(', ');
  const line2 = [entry.city, entry.state, entry.zip].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(' · ') || 'Residence';
}

// Session 55 — every option list / label below comes from `refs`
// (useIntakeReferences: UN Dropdown table + backend rules), passed down from
// the stage component. Nothing hardcoded.
function SelectOptions({ options }) {
  return (
    <>
      <option value="">Select…</option>
      {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
    </>
  );
}

function RentalHistoryEntry({ entry, currency, refs, onRemove, onMarkCurrent }) {
  const residenceLabel = entry.tenantshipType ? refs.optionLabel('RESIDENCE_TYPE', entry.tenantshipType) : null;
  return (
    <div style={{ border: `1px solid ${entry.isCurrent ? C.navy : C.cardBorder}`, borderRadius: 10, padding: 12, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{addressLineFor(entry)}</div>
          {entry.isCurrent && (
            <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.navy, background: C.divider, padding: '2px 8px', borderRadius: 20 }}>
              Current Residence
            </span>
          )}
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Remove</button>
      </div>
      <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginTop: 4 }}>
        {residenceLabel && `${residenceLabel} · `}
        {entry.landlordName && `Landlord: ${entry.landlordName} · `}
        {entry.startDate} – {entry.endDate || 'Present'} · {currency}{entry.monthlyRent}/mo
      </div>
      {entry.reasonForLeaving && <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>Reason for leaving: {entry.reasonForLeaving}</div>}
      {!entry.isCurrent && (
        <button onClick={onMarkCurrent} style={{ marginTop: 8, background: 'none', border: 'none', color: C.navy, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
          Mark as current residence
        </button>
      )}
    </div>
  );
}

function AddRentalHistoryForm({ currency, refs, initial, onAdd, onCancel }) {
  const [form, setForm] = useState({
    tenantshipType: '', landlordName: '', landlordContact: '',
    addressStreet1: '', addressStreet2: '', city: '', state: '', zip: '',
    startDate: '', endDate: '', monthlyRent: '', reasonForLeaving: '', isCurrent: false,
    // Session 55 — `initial` pre-fills the form (e.g. copied from the primary
    // applicant's current residence); everything stays editable.
    ...(initial || {}),
  });
  const [addError, setAddError] = useState(null);
  function set(k) { return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) }; }
  // Residence types with no landlord (own home, living with family) come
  // from the backend's rules, not a local list.
  const showLandlordFields = !(refs.rules.noLandlordResidenceTypes || []).includes(form.tenantshipType);
  return (
    <div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} />
            This is my current residence
          </label>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>How did you hold this residence?</FieldLabel>
          <select style={inputStyle} {...set('tenantshipType')}>
            <SelectOptions options={refs.dropdown('RESIDENCE_TYPE')} />
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}><FieldLabel>Street Address 1</FieldLabel><input style={inputStyle} {...set('addressStreet1')} /></div>
        <div style={{ gridColumn: '1 / -1' }}><FieldLabel>Street Address 2</FieldLabel><input style={inputStyle} placeholder="Apt, suite, unit (optional)" {...set('addressStreet2')} /></div>
        <div><FieldLabel>City</FieldLabel><input style={inputStyle} {...set('city')} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><FieldLabel>State</FieldLabel><input style={inputStyle} {...set('state')} /></div>
          <div><FieldLabel>Zip</FieldLabel><input style={inputStyle} {...set('zip')} /></div>
        </div>
        {showLandlordFields && (
          <>
            <div><FieldLabel>Landlord Name</FieldLabel><input style={inputStyle} {...set('landlordName')} /></div>
            <div><FieldLabel>Landlord Contact</FieldLabel><input style={inputStyle} {...set('landlordContact')} /></div>
          </>
        )}
        <div><FieldLabel>Start Date</FieldLabel><input type="date" style={inputStyle} {...set('startDate')} /></div>
        <div><FieldLabel>End Date (blank if current)</FieldLabel><input type="date" style={inputStyle} {...set('endDate')} /></div>
        <div>
          <FieldLabel>Monthly Rent/Mortgage</FieldLabel>
          <CurrencyInput prefix={currency} {...set('monthlyRent')} />
        </div>
        <div><FieldLabel>Reason for Leaving</FieldLabel><input style={inputStyle} {...set('reasonForLeaving')} /></div>
      </div>
      {addError && <div style={{ fontFamily: F.body, fontSize: 12, color: C.danger, marginTop: 10 }}>{addError}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={() => {
            // Session 55 — same required fields the backend's RENTAL_HISTORY
            // validation enforces, checked here so an entry is never kept
            // locally but rejected remotely.
            const missing = ['tenantshipType', 'addressStreet1', 'city', 'state', 'zip', 'startDate'].filter((k) => !String(form[k] || '').trim());
            if (missing.length) { setAddError('Please fill in how you held the residence, its address and the start date.'); return; }
            if (form.isCurrent && form.endDate) { setAddError('A current residence cannot have an end date.'); return; }
            if (form.endDate && form.startDate && form.endDate < form.startDate) { setAddError('End date cannot be before the start date.'); return; }
            setAddError(null);
            onAdd(showLandlordFields ? form : { ...form, landlordName: '', landlordContact: '' });
          }}
          style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          Add Residence
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

function AdditionalIncomeRow({ entry, currency, refs, onRemove }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px dashed ${C.cardBorder}` }}>
      <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>{refs.optionLabel('ADDITIONAL_INCOME_SOURCE', entry.source)}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>
          {currency}{entry.amount} <span style={{ fontWeight: 500, color: C.textSecondary }}>({refs.optionLabel('ADDITIONAL_INCOME_FREQUENCY', entry.frequency)})</span>
        </span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
      </span>
    </div>
  );
}

function AddAdditionalIncomeForm({ currency, refs, onAdd, onCancel }) {
  const frequencies = refs.dropdown('ADDITIONAL_INCOME_FREQUENCY');
  const defaultFrequency = frequencies[0]?.code || '';
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState(defaultFrequency);
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 180px' }}>
        <FieldLabel>Source</FieldLabel>
        <select style={inputStyle} value={source} onChange={(e) => setSource(e.target.value)}>
          <SelectOptions options={refs.dropdown('ADDITIONAL_INCOME_SOURCE')} />
        </select>
      </div>
      <div style={{ flex: '1 1 120px' }}>
        <FieldLabel>Amount</FieldLabel>
        <CurrencyInput prefix={currency} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div style={{ flex: '1 1 140px' }}>
        <FieldLabel>Frequency</FieldLabel>
        <select style={inputStyle} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          {frequencies.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
        </select>
      </div>
      <button
        onClick={() => { if (source && amount && (frequency || defaultFrequency)) { onAdd({ source, amount, frequency: frequency || defaultFrequency }); setSource(''); setAmount(''); setFrequency(defaultFrequency); } }}
        style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: C.navy, color: C.white, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
      >
        Add
      </button>
      <button onClick={onCancel} style={{ padding: '9px 0', background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
    </div>
  );
}

export default function Stage2_RentalFinancial() {
  const navigate = useNavigate();
  const {
    applicant, application, listingSummary, basePath, updateApplicantFields, backendConnected,
    addRentalHistoryEntry, removeRentalHistoryEntry, setCurrentResidence, setEmployment,
    addAdditionalIncomeEntry, removeAdditionalIncomeEntry,
  } = useApplicationIntake();
  const refs = useIntakeReferences(application?.countryCode || listingSummary?.country);
  const [addingHistory, setAddingHistory] = useState(applicant.rentalHistory.length === 0);
  // Session 55 — opt-in copy of the primary applicant's current residence
  // (co-applicants only). Fetched read-only; clicking the button pre-fills
  // the add form, which the co-applicant can edit before saving it to their
  // own record (and remove afterwards like any other entry).
  const isPrimary = applicant.role === refs.rules.primaryApplicantType;
  const [primaryResidence, setPrimaryResidence] = useState(null);
  const [prefill, setPrefill] = useState(null);
  useEffect(() => {
    if (isPrimary || !backendConnected || !application?.id || !applicant.id) return undefined;
    let active = true;
    apiGetPrimaryResidence(application.id, applicant.id)
      .then((r) => { if (active) setPrimaryResidence(r?.residence || null); })
      .catch((e) => console.warn('[ApplicationIntake] could not load the primary applicant\'s residence', e));
    return () => { active = false; };
  }, [isPrimary, backendConnected, application?.id, applicant.id]);
  const hasOwnCurrent = applicant.rentalHistory.some((e) => e.isCurrent);
  function copyPrimaryResidence() {
    setPrefill({ ...primaryResidence, isCurrent: true, endDate: '' });
    setAddingHistory(true);
  }
  // Session 55 — persisted (ApplicationApplicant.has_no_rental_history)
  // instead of being page-local, so it survives a reload and counts at
  // submission.
  const noHistory = !!applicant.hasNoRentalHistory;
  const setNoHistory = (value) => updateApplicantFields({ hasNoRentalHistory: value });
  const [addingIncome, setAddingIncome] = useState(false);
  const [formError, setFormError] = useState(null);

  const currency = currencySymbol(listingSummary?.country);
  const employmentDuration = employmentDurationLabel(
    applicant.employment.employmentStartDate,
    applicant.employment.employmentEndDate,
  );

  function empField(name) {
    return {
      value: applicant.employment[name] || '',
      onChange: (e) => setEmployment({ [name]: e.target.value }),
    };
  }

  function validateAndContinue() {
    if (applicant.rentalHistory.length === 0 && !noHistory) {
      setFormError('Add at least one residence, or confirm you have no rental history.');
      document.getElementById('ai-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!(applicant.employment.status || applicant.employment.employmentStatus) && !applicant.employment.employerName) {
      setFormError('Please complete your employment & income information.');
      document.getElementById('ai-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormError(null);
    navigate(`${basePath}/stage-3`);
  }

  const ledger = sampleUnderwritingLedger({
    monthlyRent: listingSummary?.monthlyRentRaw,
    primaryMonthlyIncome: applicant.employment.incomeFrequency === 'ANNUAL'
      ? Number(applicant.employment.incomeAmount || 0) / 12
      : applicant.employment.incomeAmount,
  });

  return (
    <ApplicationIntakeShell
      activeStage={2}
      sidebarExtra={(
        <SampleCard tagLabel="Sample — illustrative only" style={{ background: C.cardBg, borderRadius: RADIUS.md, border: `1px solid ${C.cardBorder}`, padding: 14 }}>
          <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
            Underwriting Ledger
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Rent-to-Income</span><span style={{ fontWeight: 700, color: C.textPrimary }}>{ledger.rentToIncomeLabel}</span>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginBottom: 8 }}>{ledger.maxCapLabel}</div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, borderTop: `1px dashed ${C.cardBorder}`, paddingTop: 8 }}>{ledger.description}</div>
        </SampleCard>
      )}
    >
      <SectionHeading title="Rental & Financial History" subtitle="Document your past residences and your current income." />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Current &amp; Previous Rental History
          </div>
        </div>

        {noHistory ? (
          <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, marginTop: 8 }}>
            No prior rental history on file. <button onClick={() => setNoHistory(false)} style={{ background: 'none', border: 'none', color: C.navy, fontWeight: 700, cursor: 'pointer' }}>Undo</button>
          </div>
        ) : (
          <>
            {applicant.rentalHistory.map((entry) => (
              <RentalHistoryEntry
                refs={refs}
                key={entry.id} entry={entry} currency={currency}
                onRemove={() => removeRentalHistoryEntry(entry.id)}
                onMarkCurrent={() => setCurrentResidence(entry.id)}
              />
            ))}
            {!isPrimary && primaryResidence && !hasOwnCurrent && !prefill && (
              <button
                onClick={copyPrimaryResidence}
                style={{ marginTop: 10, width: '100%', padding: '10px 0', borderRadius: 8, border: `1px solid ${C.navy}`, background: 'none', color: C.navy, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Same as primary applicant's current residence
              </button>
            )}
            {addingHistory ? (
              <AddRentalHistoryForm
                key={prefill ? 'prefill' : 'blank'}
                refs={refs}
                currency={currency}
                initial={prefill}
                onAdd={(form) => { addRentalHistoryEntry(form); setAddingHistory(false); setPrefill(null); }}
                onCancel={() => { setAddingHistory(false); setPrefill(null); }}
              />
            ) : (
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={() => setAddingHistory(true)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px dashed ${C.cardBorder}`, background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  + Add Prior Residence
                </button>
                {applicant.rentalHistory.length === 0 && (
                  <button onClick={() => setNoHistory(true)} style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    I have no rental history
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Employment &amp; Income
          </div>
          <SampleTag label={SAMPLE_PAYROLL.statusLabel} />
        </div>
        <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginBottom: 12 }}>{SAMPLE_PAYROLL.description}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <FieldLabel required>Employment Status</FieldLabel>
            <select style={inputStyle} value={applicant.employment.status || applicant.employment.employmentStatus || ''} onChange={(e) => setEmployment({ status: e.target.value })}>
              <SelectOptions options={refs.dropdown('EMPLOYMENT_STATUS')} />
            </select>
          </div>
          <div><FieldLabel>Employer / Business Name</FieldLabel><input style={inputStyle} {...empField('employerName')} /></div>
          <div><FieldLabel>Job Title</FieldLabel><input style={inputStyle} {...empField('jobTitle')} /></div>
          <div><FieldLabel>Employment Start Date</FieldLabel><input type="date" style={inputStyle} {...empField('employmentStartDate')} /></div>
          <div>
            <FieldLabel>Employment End Date</FieldLabel>
            <input type="date" style={inputStyle} {...empField('employmentEndDate')} />
            <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 4 }}>Leave blank if this is your current employer.</div>
          </div>
          <div><FieldLabel>Employer Contact</FieldLabel><input style={inputStyle} {...empField('employerContact')} /></div>
          <div>
            <FieldLabel required>Monthly Income</FieldLabel>
            <CurrencyInput prefix={currency} {...empField('incomeAmount')} />
          </div>
          {employmentDuration && (
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldLabel>Employment Duration</FieldLabel>
              <div style={{ ...inputStyle, background: C.divider, color: C.textSecondary, cursor: 'not-allowed' }}>{employmentDuration}</div>
              <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 4 }}>Calculated from the start/end dates above.</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${C.cardBorder}` }}>
          <FieldLabel>Additional Income Sources (optional)</FieldLabel>
          {(applicant.employment.additionalIncome || []).map((entry) => (
            <AdditionalIncomeRow key={entry.id} entry={entry} currency={currency} refs={refs} onRemove={() => removeAdditionalIncomeEntry(entry.id)} />
          ))}
          {addingIncome ? (
            <AddAdditionalIncomeForm
              refs={refs}
              currency={currency}
              onAdd={(entry) => { addAdditionalIncomeEntry(entry); setAddingIncome(false); }}
              onCancel={() => setAddingIncome(false)}
            />
          ) : (
            <button
              onClick={() => setAddingIncome(true)}
              style={{ marginTop: 10, padding: '9px 16px', borderRadius: 8, border: `1px dashed ${C.cardBorder}`, background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Income Source
            </button>
          )}
        </div>
      </Card>

      {formError && (
        <div id="ai-form-error" style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
          {formError}
        </div>
      )}

      <StageFooterNav
        onBack={() => navigate(`${basePath}/stage-1`)}
        onNext={validateAndContinue}
        onSaveDraft={() => {}}
        nextLabel="Continue to Stage 3: Property Requirements & Documents"
      />
    </ApplicationIntakeShell>
  );
}
