// src/pages/ApplicationIntake/Stage3_PropertyDocuments.jsx
//
// Approach doc §2, Screen 4 ("Documents") — the real, functional document
// vault (ApplicantDocument: government ID, proof of income, employment
// verification, other).
//
// Session 56 — two changes: (1) the "Other Requested Document" upload now
// asks for a document label first (so the landlord/PM reviewing it knows
// what it is — an unlabeled "OTHER" upload was otherwise meaningless to
// them); (2) the Property-Specific Lifestyle & Logistics panel was made to
// only show the sub-sections (Pets / Vehicle & Parking / Storage) the
// listing's own real `ListingRentalTerms`/amenity data said applied.
//
// Session 56 follow-up (reverted) — that gating turned out to hide the
// whole panel for real test listings (e.g. one with no pets_allowed/
// parking_fee/other_fees populated on its ListingRentalTerms row), which
// the user flagged as the panel having disappeared entirely — not the
// intended effect. Per the user's explicit ask, all three sub-sections are
// unconditionally shown again, so a renter can always note pets/vehicle/
// storage needs regardless of whether the listing's own fee data happens
// to be populated. The one piece of the original enrichment worth keeping:
// each sub-section still leads with the listing's real fee facts (pet
// rent/deposit, parking fee) when the listing does have them — it just no
// longer gates the section's visibility on having them. The illustrative
// intake field below each one still carries the Sample tag — there is
// still no real building-inventory/allocation model behind that one field
// (Claude Project review doc §3.4).
//
// Session 58 — Pets and Parking (not Storage — not asked for) are now
// genuinely interactive when the listing's own real fee data says they
// apply: the applicant picks a real count and this multiplies it against
// the listing's real per-unit fee (pet rent/deposit, parking fee) — real
// arithmetic on real numbers, via <CountedAmenity>. When the listing
// doesn't say pets/parking apply, the sub-section falls back to the
// original always-visible illustrative-only field (still Sample-tagged),
// per the Session 56 follow-up above — this doesn't re-introduce the
// gating that was reverted, it only gates which variant of the
// sub-section (interactive vs. illustrative) is shown. The chosen count
// itself has no backing model anywhere (approach doc or real backend) —
// see ApplicationIntakeContext.jsx's setPropertyRequirements() for that
// gap note; it's stored local/localStorage-only, same as Dependents.

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationIntake } from './ApplicationIntakeContext';
import { ApplicationIntakeShell, StageFooterNav, FieldLabel, inputStyle, SectionHeading, Card } from './ApplicationIntakeShell';
import { C, F } from './applicationIntakeTokens';
import { SampleTag, SAMPLE_PROPERTY_LOGISTICS } from './sampleInstitutionalContent';
import { currencySymbol } from './applicationIntakeOptions';

const DOCUMENT_TYPES = [
  { type: 'GOVERNMENT_ID', label: 'Government-Issued Identification', required: true },
  { type: 'PROOF_OF_INCOME', label: 'Proof of Income', required: true },
  { type: 'EMPLOYMENT_VERIFICATION', label: 'Employment Verification', required: false },
  { type: 'OTHER', label: 'Other Requested Document', required: false, needsLabel: true },
];

function DocumentSlot({ docType, label, required, needsLabel, document, onUpload, onRemove }) {
  const fileRef = useRef(null);
  const [otherLabel, setOtherLabel] = useState(document?.label || '');
  const blockedByLabel = needsLabel && !document && !otherLabel.trim();
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>
            {label}{required && <span style={{ color: C.danger }}> *</span>}
          </div>
          {document ? (
            <div style={{ fontFamily: F.body, fontSize: 11, color: C.success, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-circle-check" /> {document.label ? `${document.label} — ` : ''}{document.fileName}
            </div>
          ) : (
            <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>No file uploaded yet</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            ref={fileRef} type="file" style={{ display: 'none' }}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => { if (e.target.files[0]) onUpload(docType, e.target.files[0], otherLabel); e.target.value = ''; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={blockedByLabel}
            title={blockedByLabel ? 'Enter a document label first' : undefined}
            style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${C.cardBorder}`, background: blockedByLabel ? C.divider : C.inputBg, color: blockedByLabel ? C.textTertiary : C.textPrimary, fontFamily: F.body, fontSize: 11.5, fontWeight: 700, cursor: blockedByLabel ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
          >
            {document ? 'Replace' : 'Upload'}
          </button>
          {document && (
            <button onClick={() => onRemove(document.id)} style={{ padding: '7px 10px', borderRadius: 7, border: 'none', background: 'none', color: C.danger, fontFamily: F.body, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              Remove
            </button>
          )}
        </div>
      </div>
      {needsLabel && !document && (
        <div style={{ marginTop: 10 }}>
          <FieldLabel required>Document Label</FieldLabel>
          <input
            style={inputStyle}
            placeholder="e.g. Court Letter, Guarantor Statement, Visa Documentation…"
            value={otherLabel}
            onChange={(e) => setOtherLabel(e.target.value)}
          />
          <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 4 }}>
            So the landlord/property manager knows what this document is.
          </div>
        </div>
      )}
    </div>
  );
}

function LifestyleSubsection({ title, realFacts, illustrativePlaceholder }) {
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 12 }}>
      <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginBottom: realFacts ? 4 : 8 }}>{title}</div>
      {realFacts && <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginBottom: 8 }}>{realFacts}</div>}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: -2, right: 0 }}><SampleTag label="Sample field" /></div>
        <input disabled placeholder={illustrativePlaceholder} style={{ ...inputStyle, paddingRight: 110, color: C.textTertiary, cursor: 'not-allowed' }} />
      </div>
    </div>
  );
}

function NumberStepper({ value, onChange, max = 9 }) {
  const stepBtnStyle = {
    width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.cardBorder}`, background: C.inputBg,
    color: C.textPrimary, fontFamily: F.body, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} style={{ ...stepBtnStyle, opacity: value <= 0 ? 0.4 : 1, cursor: value <= 0 ? 'not-allowed' : 'pointer' }}>−</button>
      <span style={{ minWidth: 18, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 14, color: C.textPrimary }}>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} style={{ ...stepBtnStyle, opacity: value >= max ? 0.4 : 1, cursor: value >= max ? 'not-allowed' : 'pointer' }}>+</button>
    </div>
  );
}

// Real, interactive variant shown only when the listing's own fee data
// says this amenity applies (see Session 58 header note above) — a count
// the applicant picks, multiplied against the listing's real per-unit fee.
// The illustrative detail field (breed/weight, vehicle make/model) still
// renders underneath, unchanged and still Sample-tagged, since a count and
// a fee total don't replace that level of detail — they're additive.
function CountedAmenity({ title, realFacts, unitNoun, count, onCountChange, perUnitFee, perUnitFeeLabel, perUnitDeposit, currency, illustrativePlaceholder }) {
  const monthlyTotal = perUnitFee != null && count > 0 ? perUnitFee * count : null;
  const depositTotal = perUnitDeposit != null && count > 0 ? perUnitDeposit * count : null;
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 12 }}>
      <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>{title}</div>
      {realFacts && <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginBottom: 10 }}>{realFacts}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textSecondary }}>
          Number of {unitNoun}{count === 1 ? '' : 's'}
        </div>
        <NumberStepper value={count} onChange={onCountChange} />
      </div>

      {count > 0 && (monthlyTotal != null || depositTotal != null) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.cardBorder}`, fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>
          {monthlyTotal != null && (
            <div>
              {perUnitFeeLabel}: {currency}{perUnitFee}/mo &times; {count} = <strong style={{ color: C.textPrimary }}>{currency}{monthlyTotal}/mo</strong>
            </div>
          )}
          {depositTotal != null && (
            <div style={{ marginTop: monthlyTotal != null ? 4 : 0 }}>
              Deposit: {currency}{perUnitDeposit} &times; {count} = <strong style={{ color: C.textPrimary }}>{currency}{depositTotal}</strong>
            </div>
          )}
        </div>
      )}
      {count > 0 && monthlyTotal == null && depositTotal == null && (
        <div style={{ marginTop: 8, fontFamily: F.body, fontSize: 10.5, color: C.textTertiary }}>
          This listing doesn't specify a fee for this — confirm the amount with the listing agent.
        </div>
      )}

      {illustrativePlaceholder && (
        <div style={{ position: 'relative', marginTop: 10 }}>
          <div style={{ position: 'absolute', top: -2, right: 0 }}><SampleTag label="Sample field" /></div>
          <input disabled placeholder={illustrativePlaceholder} style={{ ...inputStyle, paddingRight: 110, color: C.textTertiary, cursor: 'not-allowed' }} />
        </div>
      )}
    </div>
  );
}

export default function Stage3_PropertyDocuments() {
  const navigate = useNavigate();
  const { applicant, application, basePath, listingSummary, addDocument, removeDocument, setPropertyRequirements } = useApplicationIntake();
  const [formError, setFormError] = useState(null);

  function docFor(type) {
    return applicant.documents.find((d) => d.documentType === type);
  }

  function validateAndContinue() {
    const requiredMissing = DOCUMENT_TYPES.filter((d) => d.required && !docFor(d.type));
    if (requiredMissing.length > 0) {
      setFormError(`Please upload: ${requiredMissing.map((d) => d.label).join(', ')}.`);
      document.getElementById('ai-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormError(null);
    navigate(`${basePath}/stage-4`);
  }

  const currency = currencySymbol(listingSummary?.country);
  // Real facts when the listing's own fee data has them — null (no line
  // shown, see LifestyleSubsection) otherwise. These three sub-sections
  // are always rendered regardless (see header comment above); this just
  // controls whether the "real fact" line under each title appears.
  const petRealFacts = listingSummary?.petsAllowed
    ? `This listing allows pets.${listingSummary.petRent != null ? ` Pet rent: ${currency}${listingSummary.petRent}/mo.` : ''}${listingSummary.petDeposit != null ? ` Pet deposit: ${currency}${listingSummary.petDeposit}.` : ''}`
    : null;
  const parkingRealFacts = listingSummary?.parkingAvailable
    ? `Parking is available at this listing.${listingSummary.parkingFeeAmount != null ? ` Parking fee: ${currency}${listingSummary.parkingFeeAmount}/mo.` : ''}`
    : null;
  const storageRealFacts = listingSummary?.storageAvailable
    ? `Storage is available at this listing.${listingSummary.storageFeeAmount != null ? ` Storage fee: ${currency}${listingSummary.storageFeeAmount}/mo.` : ''}`
    : null;

  // Session 58 — real counts, stored household-level (see
  // ApplicationIntakeContext.jsx's setPropertyRequirements()).
  const numberOfPets = application?.propertyRequirements?.numberOfPets || 0;
  const numberOfParkingSpots = application?.propertyRequirements?.numberOfParkingSpots || 0;

  return (
    <ApplicationIntakeShell activeStage={3}>
      <SectionHeading title="Property Requirements &amp; Supporting Documents" subtitle="Upload identity and income documentation, and review this property's lifestyle notes." />

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Verification Vault &amp; Documents
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DOCUMENT_TYPES.map((d) => (
            <DocumentSlot
              key={d.type}
              docType={d.type}
              label={d.label}
              required={d.required}
              needsLabel={d.needsLabel}
              document={docFor(d.type)}
              onUpload={(type, file, label) => addDocument(type, file, label)}
              onRemove={removeDocument}
            />
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Property-Specific Lifestyle &amp; Logistics
        </div>
        <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginBottom: 10 }}>
          {SAMPLE_PROPERTY_LOGISTICS.description}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listingSummary?.petsAllowed ? (
            <CountedAmenity
              title="Domestic Animals & Pets"
              realFacts={petRealFacts}
              unitNoun="pet"
              count={numberOfPets}
              onCountChange={(n) => setPropertyRequirements({ numberOfPets: n })}
              perUnitFee={listingSummary.petRent}
              perUnitFeeLabel="Pet rent"
              perUnitDeposit={listingSummary.petDeposit}
              currency={currency}
              illustrativePlaceholder="Pet type, breed & weight (illustrative — no pet-record model exists yet)"
            />
          ) : (
            <LifestyleSubsection
              title="Domestic Animals & Pets"
              realFacts={petRealFacts}
              illustrativePlaceholder="Pet type, breed & weight (illustrative — no pet-record model exists yet)"
            />
          )}

          {listingSummary?.parkingAvailable ? (
            <CountedAmenity
              title="Resident Vehicle & Parking"
              realFacts={parkingRealFacts}
              unitNoun="parking spot"
              count={numberOfParkingSpots}
              onCountChange={(n) => setPropertyRequirements({ numberOfParkingSpots: n })}
              perUnitFee={listingSummary.parkingFeeAmount}
              perUnitFeeLabel="Parking fee"
              currency={currency}
              illustrativePlaceholder="Vehicle make/model & plate (illustrative — no stall-assignment model exists yet)"
            />
          ) : (
            <LifestyleSubsection
              title="Resident Vehicle & Parking"
              realFacts={parkingRealFacts}
              illustrativePlaceholder="Vehicle make/model & plate (illustrative — no stall-assignment model exists yet)"
            />
          )}

          <LifestyleSubsection
            title="Storage Allocation"
            realFacts={storageRealFacts}
            illustrativePlaceholder="Storage needs (illustrative — no locker-assignment model exists yet)"
          />
        </div>
      </Card>

      {formError && (
        <div id="ai-form-error" style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
          {formError}
        </div>
      )}

      <StageFooterNav
        onBack={() => navigate(`${basePath}/stage-2`)}
        onNext={validateAndContinue}
        onSaveDraft={() => {}}
        nextLabel="Continue to Stage 4: Review, Consent & Submit"
      />
    </ApplicationIntakeShell>
  );
}
