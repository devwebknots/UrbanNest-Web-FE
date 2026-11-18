// src/pages/ApplicationIntake/ApplicationSubmittedPage.jsx
//
// Figma screen 5 ("Application Submitted & Underwriting Initiated").
// Real content: application ref, household status, co-applicant list and
// statuses, submitted timestamp (approach doc §7 — Primary Applicant
// Dashboard / Co-Applicant Tracking). Sample content: the "Live
// Underwriting Track" stage tracker, audit hash, and cryptographic-seal
// framing — there is no live underwriting pipeline behind this (see
// sampleInstitutionalContent.js).

import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import * as api from './applicationIntakeApi';
import { C, F, RADIUS, SHADOW } from './applicationIntakeTokens';
import { SampleCard } from './sampleInstitutionalContent';
import { ListingAgentCard } from './ApplicationIntakeShell';

const HOUSEHOLD_STATUS_COPY = {
  DRAFT: 'Application created but not yet submitted.',
  IN_PROGRESS: 'Primary Applicant is completing information.',
  AWAITING_CO_APPLICANT: 'Your section is submitted. Waiting on one or more co-applicants.',
  READY_FOR_SCREENING: 'All required applicants have submitted. Ready for screening.',
  SCREENING_IN_PROGRESS: 'Screening is underway.',
  UNDER_REVIEW: 'The landlord/property manager is reviewing your application.',
  APPROVED: 'Your application has been approved.',
  REJECTED: 'Your application was not approved.',
  WITHDRAWN: 'This application has been withdrawn.',
};

export default function ApplicationSubmittedPage() {
  const { applicationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [application, setApplication] = useState(location.state?.application || null);
  const [applicant] = useState(location.state?.applicant || null);
  const [listingSummary] = useState(location.state?.listingSummary || null);
  const [loading, setLoading] = useState(!location.state?.application);

  useEffect(() => {
    if (application || applicationId === 'draft') { setLoading(false); return; }
    api.apiGetApplicationStatus(applicationId)
      .then((data) => setApplication(data))
      .catch(() => { /* backend not available — fall back to whatever we have */ })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', fontFamily: F.body, color: C.textSecondary }}>Loading your application status…</div>;
  }

  const status = application?.status || 'AWAITING_CO_APPLICANT';
  const coApplicants = application?.coApplicants || [];

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: C.pageBg, fontFamily: F.body }}>
      <div style={{ background: C.navy, color: C.white, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 700 }}>UrbanNest</span>
        <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.12)', padding: '3px 9px', borderRadius: 20 }}>
          Renter Portal
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px' }}>
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyDark})`, color: C.white, borderRadius: RADIUS.lg, padding: 26, marginBottom: 20 }}>
          <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.12)', display: 'inline-block', padding: '3px 10px', borderRadius: 20, marginBottom: 12 }}>
            Application Submitted
          </div>
          <div style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            Your application is in.
          </div>
          <div style={{ fontFamily: F.body, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', maxWidth: 560 }}>
            {listingSummary ? `Your section for ${listingSummary.propertyName || 'this listing'} has been received.` : 'Your section of this household application has been received.'}
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 18, flexWrap: 'wrap', fontFamily: F.body, fontSize: 12 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Application Ref</div>
              <div style={{ fontWeight: 800 }}>{application?.id ? `#UN-APP-${application.id}` : 'Pending backend confirmation'}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Submitted</div>
              <div style={{ fontWeight: 800 }}>{applicant?.submittedAt ? new Date(applicant.submittedAt).toLocaleString() : '—'}</div>
            </div>
          </div>
        </div>

        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: RADIUS.md, padding: 18, marginBottom: 16, boxShadow: SHADOW.card }}>
          <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Household Application Status
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{status.replace(/_/g, ' ')}</div>
          <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>{HOUSEHOLD_STATUS_COPY[status] || ''}</div>

          {coApplicants.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${C.cardBorder}` }}>
              <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textSecondary, marginBottom: 8 }}>Co-Applicant Progress</div>
              {coApplicants.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontFamily: F.body, fontSize: 12.5 }}>
                  <span style={{ color: C.textPrimary, fontWeight: 700 }}>{c.fullName}</span>
                  <span style={{ color: C.textSecondary }}>{c.applicantStatus || c.invitationStatus || 'Invitation sent'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <SampleCard tagLabel="Sample — no live underwriting pipeline exists">
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: RADIUS.md, padding: 18, marginBottom: 16, boxShadow: SHADOW.card }}>
            <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Live Underwriting Track
            </div>
            {[
              { label: 'Application Intake Received', done: true },
              { label: 'Verification Engine & Background Pipeline', done: false, active: true },
              { label: 'Property Underwriting Review', done: false },
              { label: 'Formal Decision', done: false },
            ].map((stage, i) => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: stage.done ? C.success : stage.active ? C.navy : C.inputBg,
                  color: stage.done || stage.active ? C.white : C.textTertiary, fontSize: 11, fontWeight: 700,
                }}>
                  {stage.done ? <i className="ti ti-check" /> : i + 1}
                </div>
                <span style={{ fontFamily: F.body, fontSize: 12.5, color: stage.done || stage.active ? C.textPrimary : C.textTertiary, fontWeight: stage.active ? 700 : 500 }}>
                  {stage.label}
                </span>
              </div>
            ))}
            <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.textTertiary, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.cardBorder}` }}>
              Screening in this build is manual and landlord-driven — this tracker is a sample illustration of what a future automated pipeline could show. Real status above ("Household Application Status") reflects this application's actual state.
            </div>
          </div>
        </SampleCard>

        <div style={{ maxWidth: 360 }}>
          <ListingAgentCard listingAgent={listingSummary?.listingAgent} listingKind={listingSummary?.kind} listingId={listingSummary?.listingId} />
        </div>

        <button
          onClick={() => navigate('/marketplace')}
          style={{ marginTop: 20, width: '100%', padding: '13px 0', borderRadius: 8, border: 'none', background: C.navy, color: C.white, fontFamily: F.body, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
        >
          Go to Marketplace
        </button>
      </div>
    </div>
  );
}
