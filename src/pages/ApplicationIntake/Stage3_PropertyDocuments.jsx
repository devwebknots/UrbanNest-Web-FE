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
// Session 58 — Pets and Parking were briefly made "interactive counters"
// (a NumberStepper multiplying a count against the listing's real
// per-unit fee) with the actual pet/vehicle detail fields left as
// illustrative Sample-tagged placeholders underneath.
//
// [occupant-count/employment-dates/pets-vehicles request] — replaced that
// with the real thing: Pets and Vehicles are now each a yes/no question
// followed by a genuinely functional repeatable list (type/breed/weight
// per pet, type/brand per vehicle) — same repeatable-list convention
// Dependents/Co-Applicants/Rental History/Additional Income already use
// elsewhere in this form. The list's own length IS the count (see
// ApplicationIntakeContext.jsx's addPet/addVehicle for why there's no
// separately-typed count field to desync from it), so these fields are
// no longer illustrative/Sample-tagged — they're real applicant data with
// no backend model yet, the same documented gap as Dependents (see
// setPropertyRequirements()/addPet()/addVehicle() in
// ApplicationIntakeContext.jsx). Storage Allocation has been removed
// from the application entirely per that same request.

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationIntake } from './ApplicationIntakeContext';
import { useIntakeReferences } from './useIntakeReferences';
import { ApplicationIntakeShell, StageFooterNav, FieldLabel, inputStyle, SectionHeading, Card } from './ApplicationIntakeShell';
import { C, F } from './applicationIntakeTokens';
import { currencySymbol } from './applicationIntakeOptions';

// Session 55 — document slots, pet types and vehicle types come from the
// UN Dropdown table; which documents are required / need a label comes
// from the backend's rules (useIntakeReferences). Nothing hardcoded.

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


function PetRow({ pet, typeLabel, onRemove }) {
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 12, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <div>
        <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>{pet.petTypeLabel || typeLabel}{pet.breed ? ` · ${pet.breed}` : ''}</div>
        {pet.weight && <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>Approx. weight: {pet.weight}</div>}
      </div>
      {onRemove && <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontWeight: 700, fontFamily: F.body, fontSize: 11.5, cursor: 'pointer', padding: 0, flexShrink: 0 }}>Remove</button>}
    </div>
  );
}

function AddPetForm({ options, onAdd, onCancel }) {
  const [form, setForm] = useState({ petType: '', breed: '', weight: '' });
  function set(k) { return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) }; }
  return (
    <div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <FieldLabel required>Pet Type</FieldLabel>
          <select style={inputStyle} {...set('petType')}>
            <option value="">Select…</option>
            {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Breed</FieldLabel>
          <input style={inputStyle} {...set('breed')} />
        </div>
        <div>
          <FieldLabel>Weight (approx.)</FieldLabel>
          <input style={inputStyle} placeholder="e.g. 35 lbs" {...set('weight')} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={() => { if (!form.petType.trim()) return; onAdd(form); setForm({ petType: '', breed: '', weight: '' }); }}
          style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          Add Pet
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function VehicleRow({ vehicle, typeLabel, onRemove }) {
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 12, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <div>
        <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>{vehicle.vehicleTypeLabel || typeLabel}{vehicle.brand ? ` · ${vehicle.brand}` : ''}</div>
      </div>
      {onRemove && <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontWeight: 700, fontFamily: F.body, fontSize: 11.5, cursor: 'pointer', padding: 0, flexShrink: 0 }}>Remove</button>}
    </div>
  );
}

function AddVehicleForm({ options, onAdd, onCancel }) {
  const [form, setForm] = useState({ vehicleType: '', brand: '' });
  function set(k) { return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) }; }
  return (
    <div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <FieldLabel required>Vehicle Type</FieldLabel>
          <select style={inputStyle} {...set('vehicleType')}>
            <option value="">Select…</option>
            {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Brand</FieldLabel>
          <input style={inputStyle} placeholder="e.g. Toyota" {...set('brand')} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={() => { if (!form.vehicleType.trim()) return; onAdd(form); setForm({ vehicleType: '', brand: '' }); }}
          style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          Add Vehicle
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReadOnlyHousehold({ items, emptyText, render }) {
  return (
    <div>
      <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>
        Declared by the primary applicant for the household (read-only).
      </div>
      {items.length > 0 ? items.map(render) : (
        <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary }}>{emptyText}</div>
      )}
    </div>
  );
}

export default function Stage3_PropertyDocuments() {
  const navigate = useNavigate();
  const {
    applicant, application, basePath, listingSummary, addDocument, removeDocument,
    setPropertyRequirements, addPet, removePet, addVehicle, removeVehicle,
  } = useApplicationIntake();
  const refs = useIntakeReferences(application?.countryCode || listingSummary?.country);
  // Session 55 — pets & vehicles belong to the household and are recorded by
  // the primary applicant; a co-applicant sees them read-only.
  const isPrimary = applicant.role === refs.rules.primaryApplicantType;
  const requiredDocs = refs.rules.requiredDocumentTypes || [];
  const labelRequiredDocs = refs.rules.labelRequiredDocumentTypes || [];
  const documentSlots = refs.dropdown('DOCUMENT_TYPE').map((o) => ({
    type: o.code, label: o.label,
    required: requiredDocs.includes(o.code),
    needsLabel: labelRequiredDocs.includes(o.code),
  }));
  const [formError, setFormError] = useState(null);
  const [addingPet, setAddingPet] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);

  function docFor(type) {
    return applicant.documents.find((d) => d.documentType === type);
  }

  function validateAndContinue() {
    const requiredMissing = documentSlots.filter((d) => d.required && !docFor(d.type));
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

  // Pets/Vehicles: a yes/no flag plus a real repeatable list — the list's
  // own length IS the count. Stored on the primary applicant server-side
  // (ApplicantDetails PET / VEHICLE — see ApplicationIntakeContext.jsx).
  const hasPets = !!application?.propertyRequirements?.hasPets;
  const hasVehicles = !!application?.propertyRequirements?.hasVehicles;
  const pets = application?.propertyRequirements?.pets || [];
  const vehicles = application?.propertyRequirements?.vehicles || [];

  return (
    <ApplicationIntakeShell activeStage={3}>
      <SectionHeading title="Property Requirements &amp; Supporting Documents" subtitle="Upload identity and income documentation, and review this property's lifestyle notes." />

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Verification Vault &amp; Documents
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documentSlots.map((d) => (
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
          Property-Specific Requirements
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginBottom: petRealFacts ? 4 : 8 }}>Pets</div>
            {petRealFacts && <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginBottom: 8 }}>{petRealFacts}</div>}
            {!isPrimary && (
              <ReadOnlyHousehold
                items={pets}
                emptyText="The primary applicant hasn't declared any pets."
                render={(p) => <PetRow key={p.id} pet={p} typeLabel={refs.optionLabel('PET_TYPE', p.petType)} />}
              />
            )}
            {isPrimary && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasPets}
                onChange={(e) => setPropertyRequirements({ hasPets: e.target.checked })}
              />
              Do you have any pets?
            </label>
            )}

            {isPrimary && hasPets && (
              <div style={{ marginTop: 10 }}>
                {pets.length > 0 && (
                  <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>
                    {pets.length} pet{pets.length === 1 ? '' : 's'} added
                  </div>
                )}
                {pets.map((p) => (
                  <PetRow key={p.id} pet={p} typeLabel={refs.optionLabel('PET_TYPE', p.petType)} onRemove={() => removePet(p.id)} />
                ))}
                {addingPet ? (
                  <AddPetForm
                    options={refs.dropdown('PET_TYPE')}
                    onAdd={(data) => { addPet(data); setAddingPet(false); }}
                    onCancel={() => setAddingPet(false)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingPet(true)}
                    style={{ width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 8, border: `1px dashed ${C.cardBorder}`, background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add a Pet
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, marginBottom: parkingRealFacts ? 4 : 8 }}>Vehicles</div>
            {parkingRealFacts && <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary, marginBottom: 8 }}>{parkingRealFacts}</div>}
            {!isPrimary && (
              <ReadOnlyHousehold
                items={vehicles}
                emptyText="The primary applicant hasn't declared any vehicles."
                render={(v) => <VehicleRow key={v.id} vehicle={v} typeLabel={refs.optionLabel('VEHICLE_TYPE', v.vehicleType)} />}
              />
            )}
            {isPrimary && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasVehicles}
                onChange={(e) => setPropertyRequirements({ hasVehicles: e.target.checked })}
              />
              Do you have any vehicles?
            </label>
            )}

            {isPrimary && hasVehicles && (
              <div style={{ marginTop: 10 }}>
                {vehicles.length > 0 && (
                  <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>
                    {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} added
                  </div>
                )}
                {vehicles.map((v) => (
                  <VehicleRow key={v.id} vehicle={v} typeLabel={refs.optionLabel('VEHICLE_TYPE', v.vehicleType)} onRemove={() => removeVehicle(v.id)} />
                ))}
                {addingVehicle ? (
                  <AddVehicleForm
                    options={refs.dropdown('VEHICLE_TYPE')}
                    onAdd={(data) => { addVehicle(data); setAddingVehicle(false); }}
                    onCancel={() => setAddingVehicle(false)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingVehicle(true)}
                    style={{ width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 8, border: `1px dashed ${C.cardBorder}`, background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add a Vehicle
                  </button>
                )}
              </div>
            )}
          </div>

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
