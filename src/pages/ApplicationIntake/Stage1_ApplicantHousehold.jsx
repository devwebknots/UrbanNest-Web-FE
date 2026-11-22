// src/pages/ApplicationIntake/Stage1_ApplicantHousehold.jsx
//
// Approach doc §2, Screen 1 ("Household & Personal Information") + §3
// (Co-Applicant Invitation Workflow). Everything on this screen is real,
// functional form state (ApplicationIntakeContext) — no sample content.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationIntake } from './ApplicationIntakeContext';
import { useIntakeReferences } from './useIntakeReferences';
import { ApplicationIntakeShell, StageFooterNav, FieldLabel, inputStyle, SectionHeading, Card } from './ApplicationIntakeShell';
import { C, F } from './applicationIntakeTokens';

function DependentRow({ dependent, relationshipLabel, onRemove }) {
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 12, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <div>
        <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>{dependent.fullName}</div>
        <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>
          {dependent.relationshipLabel || relationshipLabel}{dependent.dateOfBirth ? ` · Born ${dependent.dateOfBirth}` : ''}
        </div>
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontWeight: 700, fontFamily: F.body, fontSize: 11.5, cursor: 'pointer', padding: 0, flexShrink: 0 }}>Remove</button>
    </div>
  );
}

function CoApplicantRow({ coApplicant, invitationLabel, onResend, onRemove }) {
  // Colour is presentation only; the status text comes from UN Reference.
  const statusColor = {
    NOT_INVITED: C.textTertiary, SENT: C.info, ACCEPTED: C.success, EXPIRED: C.danger, REVOKED: C.textTertiary,
  }[coApplicant.invitationStatus] || C.textTertiary;
  return (
    <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 12, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>{coApplicant.fullName}</div>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textSecondary }}>{coApplicant.email}{coApplicant.phone ? ` · ${coApplicant.phone}` : ''}</div>
          {coApplicant.relationship && <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary }}>{coApplicant.relationship}</div>}
        </div>
        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {coApplicant.invitationStatusLabel || invitationLabel}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: F.body, fontSize: 11.5 }}>
        <button onClick={onResend} style={{ background: 'none', border: 'none', color: C.navy, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Resend Invite</button>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Remove</button>
      </div>
    </div>
  );
}

export default function Stage1_ApplicantHousehold() {
  const navigate = useNavigate();
  const {
    applicant, application, basePath, updateApplicantFields,
    addCoApplicant, removeCoApplicant, resendInvitation,
    addDependent, removeDependent,
  } = useApplicationIntake();
  // Session 55 — relationship options (UN Dropdown) and invitation status
  // labels (UN Reference); nothing hardcoded.
  const refs = useIntakeReferences(application?.countryCode);
  const relationshipOptions = refs.dropdown('DEPENDENT_RELATIONSHIP');
  const isPrimary = applicant.role === refs.rules.primaryApplicantType;
  const [addingCoApplicant, setAddingCoApplicant] = useState(false);
  const [coForm, setCoForm] = useState({ fullName: '', email: '', phone: '', relationship: '' });
  const [addingDependent, setAddingDependent] = useState(false);
  const [depForm, setDepForm] = useState({ fullName: '', relationship: '', dateOfBirth: '' });
  const [formError, setFormError] = useState(null);

  function field(name) {
    return {
      value: applicant[name] || '',
      onChange: (e) => updateApplicantFields({ [name]: e.target.value }),
    };
  }

  function handleAddCoApplicant() {
    if (!coForm.fullName.trim() || !coForm.email.trim()) {
      setFormError('Co-applicant full name and email are required.');
      return;
    }
    addCoApplicant(coForm).catch((e) => setFormError(e.message || 'Could not add this co-applicant.'));
    setCoForm({ fullName: '', email: '', phone: '', relationship: '' });
    setAddingCoApplicant(false);
    setFormError(null);
  }

  function handleAddDependent() {
    if (!depForm.fullName.trim() || !depForm.relationship.trim()) {
      setFormError('Dependent full name and relationship are required.');
      return;
    }
    addDependent(depForm);
    setDepForm({ fullName: '', relationship: '', dateOfBirth: '' });
    setAddingDependent(false);
    setFormError(null);
  }

  function validateAndContinue() {
    const FIELD_LABELS = {
      legalFirstName: 'Legal First Name', legalLastName: 'Legal Last Name', dateOfBirth: 'Date of Birth',
      email: 'Email Address', phone: 'Mobile Phone',
      addressStreet1: 'Street Address 1', addressCity: 'City', addressState: 'State', addressZip: 'Zip Code',
      desiredMoveInDate: 'Desired Move-In Date',
    };
    // The move-in date belongs to the household and is set by the primary
    // applicant; a co-applicant only sees it.
    const required = Object.keys(FIELD_LABELS).filter((f) => isPrimary || f !== 'desiredMoveInDate');
    const missing = required.filter((f) => !applicant[f]);
    if (missing.length > 0) {
      setFormError(`Please complete: ${missing.map((f) => FIELD_LABELS[f]).join(', ')}.`);
      document.getElementById('ai-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormError(null);
    navigate(`${basePath}/stage-2`);
  }

  const coApplicants = application?.coApplicants || [];
  const dependents = application?.dependents || [];

  // Protected/auto-calculated per request. Session 55 — matches the
  // backend's computed RentalApplication.occupant_count exactly: 1 primary
  // + co-applicants who have ACCEPTED their invitation + dependents. Never
  // stored (numbering standard §1.3), so it is display-only here.
  // Recomputed on every render from the live lists (the server's
  // occupantCount is only a snapshot from page load, so it went stale as
  // soon as a dependent was added).
  const acceptedCoApplicants = coApplicants.filter((c) => c.invitationStatus === refs.rules.acceptedInvitationStatus).length;
  const pendingCoApplicants = coApplicants.length - acceptedCoApplicants;
  const occupantCount = 1 + acceptedCoApplicants + dependents.length;

  return (
    <ApplicationIntakeShell activeStage={1}>
      <SectionHeading title="Applicant & Household Information" subtitle="Tell us who's applying and who will live at this unit." />

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {applicant.roleLabel ? `${applicant.roleLabel} Identity` : 'Your Identity'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <FieldLabel required>Legal First Name</FieldLabel>
            <input style={inputStyle} {...field('legalFirstName')} />
          </div>
          <div>
            <FieldLabel>Middle Name</FieldLabel>
            <input style={inputStyle} {...field('legalMiddleName')} />
          </div>
          <div>
            <FieldLabel required>Legal Last Name</FieldLabel>
            <input style={inputStyle} {...field('legalLastName')} />
          </div>
          <div>
            <FieldLabel required>Date of Birth</FieldLabel>
            <input type="date" style={inputStyle} {...field('dateOfBirth')} />
          </div>
          <div>
            <FieldLabel required>Email Address</FieldLabel>
            <input type="email" style={inputStyle} {...field('email')} />
          </div>
          <div>
            <FieldLabel required>Mobile Phone</FieldLabel>
            <input style={inputStyle} {...field('phone')} />
          </div>
          <div>
            <FieldLabel required>Street Address 1</FieldLabel>
            <input style={inputStyle} {...field('addressStreet1')} />
          </div>
          <div>
            <FieldLabel>Street Address 2</FieldLabel>
            <input style={inputStyle} placeholder="Apt, suite, unit (optional)" {...field('addressStreet2')} />
          </div>
          <div>
            <FieldLabel required>City</FieldLabel>
            <input style={inputStyle} {...field('addressCity')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <FieldLabel required>State</FieldLabel>
              <input style={inputStyle} {...field('addressState')} />
            </div>
            <div>
              <FieldLabel required>Zip Code</FieldLabel>
              <input style={inputStyle} {...field('addressZip')} />
            </div>
          </div>
          <div>
            <FieldLabel required={isPrimary}>Desired Move-In Date</FieldLabel>
            {isPrimary ? (
              <input type="date" style={inputStyle} {...field('desiredMoveInDate')} />
            ) : (
              <>
                <input
                  type="date" disabled value={applicant.desiredMoveInDate || ''}
                  style={{ ...inputStyle, background: C.divider, color: C.textSecondary, cursor: 'not-allowed' }}
                />
                <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 4 }}>
                  Set by the primary applicant for the whole household.
                </div>
              </>
            )}
          </div>
          <div>
            <FieldLabel>Number of Occupants</FieldLabel>
            <input
              type="number" disabled value={occupantCount}
              style={{ ...inputStyle, background: C.divider, color: C.textSecondary, cursor: 'not-allowed' }}
            />
            <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 4 }}>
              Automatically calculated — you + {acceptedCoApplicants} co-applicant{acceptedCoApplicants === 1 ? '' : 's'} who accepted + {dependents.length} dependent{dependents.length === 1 ? '' : 's'}.
              {pendingCoApplicants > 0 && ` ${pendingCoApplicants} invited co-applicant${pendingCoApplicants === 1 ? '' : 's'} will be counted once they accept.`}
            </div>
          </div>
        </div>
      </Card>

      {isPrimary && (
      <>
      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Household Composition
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, marginBottom: 12 }}>
          Will anyone else be applying with you? Each co-applicant authenticates and completes their own section independently — submitting your section does not submit theirs.
        </div>

        {coApplicants.map((c) => (
          <CoApplicantRow
            key={c.id}
            coApplicant={c}
            invitationLabel={refs.statusLabel('INVITATION_STATUS', c.invitationStatus)}
            onResend={() => resendInvitation(c.id)}
            onRemove={() => removeCoApplicant(c.id)}
          />
        ))}

        {addingCoApplicant ? (
          <div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <FieldLabel required>Co-Applicant Full Name</FieldLabel>
                <input style={inputStyle} value={coForm.fullName} onChange={(e) => setCoForm({ ...coForm, fullName: e.target.value })} />
              </div>
              <div>
                <FieldLabel required>Co-Applicant Email</FieldLabel>
                <input type="email" style={inputStyle} value={coForm.email} onChange={(e) => setCoForm({ ...coForm, email: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Co-Applicant Phone (optional)</FieldLabel>
                <input style={inputStyle} value={coForm.phone} onChange={(e) => setCoForm({ ...coForm, phone: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Relationship (optional)</FieldLabel>
                <input style={inputStyle} value={coForm.relationship} onChange={(e) => setCoForm({ ...coForm, relationship: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={handleAddCoApplicant} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Send Co-Applicant Invitation
              </button>
              <button onClick={() => setAddingCoApplicant(false)} style={{ background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCoApplicant(true)}
            style={{ width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 8, border: `1px dashed ${C.cardBorder}`, background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Another Adult Co-Applicant
          </button>
        )}
      </Card>

      <Card>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Dependents
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, marginBottom: 12 }}>
          Anyone else who will live at this unit but is not applying — a child or other family member, for example. Dependents don't complete a section of their own.
        </div>

        {dependents.map((d) => (
          <DependentRow key={d.id} dependent={d} relationshipLabel={refs.optionLabel('DEPENDENT_RELATIONSHIP', d.relationship)} onRemove={() => removeDependent(d.id)} />
        ))}

        {addingDependent ? (
          <div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <input style={inputStyle} value={depForm.fullName} onChange={(e) => setDepForm({ ...depForm, fullName: e.target.value })} />
              </div>
              <div>
                <FieldLabel required>Relationship</FieldLabel>
                <select style={inputStyle} value={depForm.relationship} onChange={(e) => setDepForm({ ...depForm, relationship: e.target.value })}>
                  <option value="">Select…</option>
                  {relationshipOptions.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Date of Birth (optional)</FieldLabel>
                <input type="date" style={inputStyle} value={depForm.dateOfBirth} onChange={(e) => setDepForm({ ...depForm, dateOfBirth: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={handleAddDependent} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Add Dependent
              </button>
              <button onClick={() => setAddingDependent(false)} style={{ background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingDependent(true)}
            style={{ width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 8, border: `1px dashed ${C.cardBorder}`, background: C.inputBg, color: C.textSecondary, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
          >
            + Add a Dependent
          </button>
        )}
      </Card>
      </>
      )}

      {formError && (
        <div id="ai-form-error" style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
          {formError}
        </div>
      )}

      <StageFooterNav
        onNext={validateAndContinue}
        onSaveDraft={() => {}}
        nextLabel="Continue to Stage 2: Rental & Financial History"
      />
    </ApplicationIntakeShell>
  );
}
