// src/pages/ApplicationIntake/Stage4_ReviewConsentSubmit.jsx
//
// Approach doc §2, Screen 4 ("Documents, Review & Consent") — consolidated
// review + the real consent set the doc actually asks for (accuracy
// attestation, background/credit screening authorization, privacy
// consent, optional electronic communication consent). The credit/
// background screening "live engine" panel, the e-signature capture box's
// biometric/crypto styling, and the fee/waiver ledger are sample content
// (sampleInstitutionalContent.js) — the typed name field itself is stored
// as a real part of the accuracy attestation, it just isn't a
// cryptographically bound legal signature (see that file's SAMPLE_ESIGN
// note and the hard rule in the Claude Project review doc §4).

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationIntake } from './ApplicationIntakeContext';
import { ApplicationIntakeShell, StageFooterNav, SectionHeading, Card } from './ApplicationIntakeShell';
import { C, F } from './applicationIntakeTokens';
import { SampleCard, SampleTag, SAMPLE_SCREENING, SAMPLE_ESIGN, SAMPLE_FEE_LEDGER } from './sampleInstitutionalContent';
import { currencySymbol, additionalIncomeSourceLabel } from './applicationIntakeOptions';

const CONSENTS = [
  { type: 'ACCURACY_ATTESTATION', label: 'Truth & Accuracy Attestation', text: 'I declare that all statements, disclosures, and uploaded documents provided in this application are true, accurate, and complete.', required: true },
  { type: 'BACKGROUND_SCREENING_AUTH', label: 'Background & Credit Screening Authorization', text: 'I authorize the applicable landlord/property manager to conduct background and credit screening as permitted by law.', required: true },
  { type: 'PRIVACY_CONSENT', label: 'Privacy & Data Processing Consent', text: 'I consent to UrbanNest processing my personal information for the purpose of this rental application.', required: true },
  { type: 'ELECTRONIC_COMMUNICATION_CONSENT', label: 'Electronic Communication Consent', text: 'I agree to receive application-related communications electronically.', required: false },
];

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px dashed ${C.cardBorder}`, fontFamily: F.body, fontSize: 12.5 }}>
      <span style={{ color: C.textSecondary }}>{label}</span>
      <span style={{ color: C.textPrimary, fontWeight: 700, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

export default function Stage4_ReviewConsentSubmit() {
  const navigate = useNavigate();
  const { applicant, application, basePath, setConsent, submitApplicantSection, listingSummary } = useApplicationIntake();
  const [typedName, setTypedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setError(null);
    if (!typedName.trim()) {
      setError('Please type your full legal name to confirm your submission.');
      document.getElementById('ai-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      await submitApplicantSection();
      navigate(`/marketplace/application/${application?.id || 'draft'}/status`, {
        state: { application, applicant, listingSummary },
      });
    } catch (e) {
      setError(e.message || 'Could not submit your application right now. Please try again.');
      document.getElementById('ai-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setSubmitting(false);
    }
  }

  const allRequiredGranted = CONSENTS.filter((c) => c.required).every((c) => applicant.consents[c.type] === 'GRANTED');
  const currency = currencySymbol(listingSummary?.country);
  const addressLine = [applicant.addressStreet1, applicant.addressStreet2].filter(Boolean).join(', ');
  const addressCityStateZip = [applicant.addressCity, applicant.addressState, applicant.addressZip].filter(Boolean).join(', ');
  const fullAddress = [addressLine, addressCityStateZip].filter(Boolean).join(' · ');
  const additionalIncomeTotal = (applicant.employment.additionalIncome || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Session 58 — real pet/parking counts picked in Stage 3
  // (CountedAmenity), multiplied against the listing's real per-unit fee.
  const numberOfPets = application?.propertyRequirements?.numberOfPets || 0;
  const numberOfParkingSpots = application?.propertyRequirements?.numberOfParkingSpots || 0;
  const petMonthlyTotal = numberOfPets > 0 && listingSummary?.petRent != null ? numberOfPets * listingSummary.petRent : null;
  const parkingMonthlyTotal = numberOfParkingSpots > 0 && listingSummary?.parkingFeeAmount != null ? numberOfParkingSpots * listingSummary.parkingFeeAmount : null;

  return (
    <ApplicationIntakeShell activeStage={4}>
      <SectionHeading title="Review, Consent &amp; Submit" subtitle="Carefully review your information, then provide consent to submit." />

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Primary Applicant & Household Structure
        </div>
        <ReviewRow label="Full Legal Name" value={`${applicant.legalFirstName} ${applicant.legalMiddleName} ${applicant.legalLastName}`.replace(/\s+/g, ' ').trim()} />
        <ReviewRow label="Date of Birth" value={applicant.dateOfBirth} />
        <ReviewRow label="Email" value={applicant.email} />
        <ReviewRow label="Phone" value={applicant.phone} />
        <ReviewRow label="Current Address" value={fullAddress} />
        <ReviewRow label="Desired Move-In Date" value={applicant.desiredMoveInDate} />
        <ReviewRow label="Co-Applicants" value={(application?.coApplicants || []).map((c) => c.fullName).join(', ') || 'None'} />
        <ReviewRow label="Dependents" value={(application?.dependents || []).map((d) => d.fullName).join(', ') || 'None'} />
      </Card>

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Rental, Financial &amp; Income Verification
        </div>
        <ReviewRow label="Rental History Entries" value={applicant.rentalHistory.length} />
        <ReviewRow label="Employment Status" value={applicant.employment.employmentStatus} />
        <ReviewRow label="Employer" value={applicant.employment.employerName} />
        <ReviewRow label="Monthly Income" value={applicant.employment.incomeAmount ? `${currency}${applicant.employment.incomeAmount}` : null} />
        <ReviewRow
          label="Additional Income"
          value={(applicant.employment.additionalIncome || []).length
            ? `${currency}${additionalIncomeTotal}/mo (${applicant.employment.additionalIncome.map((e) => additionalIncomeSourceLabel(e.source)).join(', ')})`
            : null}
        />
        <ReviewRow label="Documents Uploaded" value={`${applicant.documents.length} of 4`} />
        {listingSummary?.petsAllowed && (
          <ReviewRow
            label="Pets"
            value={numberOfPets > 0 ? `${numberOfPets}${petMonthlyTotal != null ? ` (${currency}${petMonthlyTotal}/mo)` : ''}` : 'None'}
          />
        )}
        {listingSummary?.parkingAvailable && (
          <ReviewRow
            label="Parking Spots"
            value={numberOfParkingSpots > 0 ? `${numberOfParkingSpots}${parkingMonthlyTotal != null ? ` (${currency}${parkingMonthlyTotal}/mo)` : ''}` : 'None'}
          />
        )}
      </Card>

      <SampleCard tagLabel="Sample — no real screening vendor integration">
        <Card>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Background &amp; Credit Screening
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginBottom: 6 }}>
            Illustrative bureaus: {SAMPLE_SCREENING.bureaus.join(', ')} · <SampleTag label={SAMPLE_SCREENING.tierLabel} />
          </div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>{SAMPLE_SCREENING.description}</div>
        </Card>
      </SampleCard>

      <SampleCard tagLabel="Sample — no real charge is made">
        <Card>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Application Fee Settlement
          </div>
          {SAMPLE_FEE_LEDGER.lineItems.map((li) => (
            <ReviewRow key={li.label} label={li.label} value={`${li.amount < 0 ? '-' : ''}${currency}${Math.abs(li.amount)}`} />
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontFamily: F.body, fontSize: 13, fontWeight: 800 }}>
            <span>Net Due Today</span><span>{SAMPLE_FEE_LEDGER.netDueLabel}</span>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 6 }}>{SAMPLE_FEE_LEDGER.description}</div>
        </Card>
      </SampleCard>

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Regulatory Consents &amp; Attestation
        </div>
        {CONSENTS.map((c) => (
          <label key={c.type} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px dashed ${C.cardBorder}`, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={applicant.consents[c.type] === 'GRANTED'}
              onChange={(e) => setConsent(c.type, e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>
                {c.label}{c.required && <span style={{ color: C.danger }}> *</span>}
              </div>
              <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>{c.text}</div>
            </div>
          </label>
        ))}
      </Card>

      <SampleCard tagLabel="Sample — not a legally binding signature">
        <Card>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Signature Capture
          </div>
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginBottom: 10 }}>{SAMPLE_ESIGN.description}</div>
          <label style={{ display: 'block', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textSecondary, marginBottom: 5 }}>
            Type your full legal name to confirm
          </label>
          <input
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Full legal name"
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, fontFamily: F.serif, fontSize: 18, color: C.textPrimary }}
          />
        </Card>
      </SampleCard>

      {error && (
        <div id="ai-form-error" style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <StageFooterNav
        onBack={() => navigate(`${basePath}/stage-3`)}
        onNext={handleSubmit}
        nextDisabled={!allRequiredGranted}
        nextLoading={submitting}
        nextLabel="Submit Official Application"
      />
    </ApplicationIntakeShell>
  );
}
