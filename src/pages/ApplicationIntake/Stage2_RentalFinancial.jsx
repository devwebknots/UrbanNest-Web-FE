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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationIntake } from './ApplicationIntakeContext';
import { ApplicationIntakeShell, StageFooterNav, FieldLabel, inputStyle, SectionHeading, Card } from './ApplicationIntakeShell';
import { C, F, RADIUS } from './applicationIntakeTokens';
import { SampleCard, SampleTag, SAMPLE_PAYROLL, sampleUnderwritingLedger } from './sampleInstitutionalContent';
import {
  currencySymbol, TENANTSHIP_OPTIONS, tenantshipNeedsLandlordFields,
  ADDITIONAL_INCOME_SOURCES, additionalIncomeSourceLabel,
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

function tenantshipLabel(value) {
  return TENANTSHIP_OPTIONS.find((o) => o.value === value)?.label || null;
}

function RentalHistoryEntry({ entry, currency, onRemove }) {
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 12, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{addressLineFor(entry)}</div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
      </div>
      <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginTop: 4 }}>
        {tenantshipLabel(entry.tenantshipType) && `${tenantshipLabel(entry.tenantshipType)} · `}
        {entry.landlordName && `Landlord: ${entry.landlordName} · `}
        {entry.startDate} – {entry.endDate || 'Present'} · {currency}{entry.monthlyRent}/mo
      </div>
      {entry.reasonForLeaving && <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>Reason for leaving: {entry.reasonForLeaving}</div>}
    </div>
  );
}

function AddRentalHistoryForm({ currency, onAdd, onCancel }) {
  const [form, setForm] = useState({
    tenantshipType: '', landlordName: '', landlordContact: '',
    addressStreet1: '', addressStreet2: '', city: '', state: '', zip: '',
    startDate: '', endDate: '', monthlyRent: '', reasonForLeaving: '',
  });
  function set(k) { return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) }; }
  const showLandlordFields = tenantshipNeedsLandlordFields(form.tenantshipType);
  return (
    <div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>How did you hold this residence?</FieldLabel>
          <select style={inputStyle} {...set('tenantshipType')}>
            {TENANTSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          <FieldLabel>Monthly Rent</FieldLabel>
          <CurrencyInput prefix={currency} {...set('monthlyRent')} />
        </div>
        <div><FieldLabel>Reason for Leaving</FieldLabel><input style={inputStyle} {...set('reasonForLeaving')} /></div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={() => onAdd(showLandlordFields ? form : { ...form, landlordName: '', landlordContact: '' })}
          style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          Add Residence
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

function AdditionalIncomeRow({ entry, currency, onRemove }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px dashed ${C.cardBorder}` }}>
      <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary }}>{additionalIncomeSourceLabel(entry.source)}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>{currency}{entry.amount}/mo</span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
      </span>
    </div>
  );
}

function AddAdditionalIncomeForm({ currency, onAdd, onCancel }) {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 200px' }}>
        <FieldLabel>Source</FieldLabel>
        <select style={inputStyle} value={source} onChange={(e) => setSource(e.target.value)}>
          {ADDITIONAL_INCOME_SOURCES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div style={{ flex: '1 1 140px' }}>
        <FieldLabel>Monthly Amount</FieldLabel>
        <CurrencyInput prefix={currency} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <button
        onClick={() => { if (source && amount) { onAdd({ source, amount }); setSource(''); setAmount(''); } }}
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
    applicant, listingSummary, basePath, updateApplicantFields,
    addRentalHistoryEntry, removeRentalHistoryEntry, setEmployment,
    addAdditionalIncomeEntry, removeAdditionalIncomeEntry,
  } = useApplicationIntake();
  const [addingHistory, setAddingHistory] = useState(applicant.rentalHistory.length === 0);
  const [noHistory, setNoHistory] = useState(false);
  const [addingIncome, setAddingIncome] = useState(false);
  const [formError, setFormError] = useState(null);

  const currency = currencySymbol(listingSummary?.country);

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
    if (!applicant.employment.employmentStatus && !applicant.employment.employerName) {
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
              <RentalHistoryEntry key={entry.id} entry={entry} currency={currency} onRemove={() => removeRentalHistoryEntry(entry.id)} />
            ))}
            {addingHistory ? (
              <AddRentalHistoryForm
                currency={currency}
                onAdd={(form) => { addRentalHistoryEntry(form); setAddingHistory(false); }}
                onCancel={() => setAddingHistory(false)}
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
            <select style={inputStyle} value={applicant.employment.employmentStatus || ''} onChange={(e) => setEmployment({ employmentStatus: e.target.value })}>
              <option value="">Select…</option>
              <option value="EMPLOYED">Employed (W-2)</option>
              <option value="SELF_EMPLOYED">Self-Employed / 1099</option>
              <option value="RETIRED">Retired / Assets</option>
              <option value="STUDENT">Student / Guarantor</option>
            </select>
          </div>
          <div><FieldLabel>Employer / Business Name</FieldLabel><input style={inputStyle} {...empField('employerName')} /></div>
          <div><FieldLabel>Job Title</FieldLabel><input style={inputStyle} {...empField('jobTitle')} /></div>
          <div><FieldLabel>Employment Duration</FieldLabel><input style={inputStyle} placeholder="e.g. 2 years 3 months" {...empField('employmentDuration')} /></div>
          <div><FieldLabel>Employer Contact</FieldLabel><input style={inputStyle} {...empField('employerContact')} /></div>
          <div>
            <FieldLabel required>Monthly Income</FieldLabel>
            <CurrencyInput prefix={currency} {...empField('incomeAmount')} />
          </div>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${C.cardBorder}` }}>
          <FieldLabel>Additional Income Sources (optional)</FieldLabel>
          {(applicant.employment.additionalIncome || []).map((entry) => (
            <AdditionalIncomeRow key={entry.id} entry={entry} currency={currency} onRemove={() => removeAdditionalIncomeEntry(entry.id)} />
          ))}
          {addingIncome ? (
            <AddAdditionalIncomeForm
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
