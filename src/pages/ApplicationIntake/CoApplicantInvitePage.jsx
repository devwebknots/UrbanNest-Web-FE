// src/pages/ApplicationIntake/CoApplicantInvitePage.jsx
//
// Approach doc §3/Step 4 — a Co-Applicant lands here from their invitation
// link. Mounted at /marketplace/application/invite/:token (see App.js).
// Validates the token against the real backend when it exists; falls back
// to a clear "can't verify this invitation right now" state rather than
// a fake success when it doesn't (no backend exists yet for this feature
// — see applicationIntakeApi.js's own header).

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from './applicationIntakeApi';
import { ApplicationIntakeProvider } from './ApplicationIntakeContext';
import { C, F, RADIUS, SHADOW } from './applicationIntakeTokens';
import Stage1_ApplicantHousehold from './Stage1_ApplicantHousehold';
import Stage2_RentalFinancial from './Stage2_RentalFinancial';
import Stage3_PropertyDocuments from './Stage3_PropertyDocuments';
import Stage4_ReviewConsentSubmit from './Stage4_ReviewConsentSubmit';

export default function CoApplicantInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    api.apiGetInvitationPreview(token)
      .then((data) => setPreview(data))
      .catch(() => setError('We could not verify this invitation right now. The backend for Application Intake invitations is not live yet in this build, or the link may have expired or been revoked.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || authLoading) {
    return <div style={{ padding: 60, textAlign: 'center', fontFamily: F.body, color: C.textSecondary }}>Checking your invitation…</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: 'center', fontFamily: F.body, color: C.textSecondary }}>
        Please sign in with the email this invitation was sent to, then return to this link.
        <div style={{ marginTop: 16 }}>
          <button onClick={() => navigate('/', { state: { postLoginRedirect: `/marketplace/application/invite/${token}` } })} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: F.body, fontWeight: 700, cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div style={{ padding: 60, textAlign: 'center', fontFamily: F.body, color: C.textSecondary, maxWidth: 480, margin: '0 auto' }}>
        {error || 'This invitation could not be found.'}
      </div>
    );
  }

  if (!started) {
    return (
      <div style={{ height: '100vh', overflowY: 'auto', background: C.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.raised, padding: 28, maxWidth: 440 }}>
          <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>
            You're invited to join a rental application.
          </div>
          <div style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
            <div><strong>Property:</strong> {preview.listingSummary?.propertyName}</div>
            <div><strong>Primary Applicant:</strong> {preview.primaryApplicantName}</div>
            <div><strong>Application ID:</strong> #{preview.applicationId}</div>
            <div><strong>Your role:</strong> Co-Applicant</div>
          </div>
          <button
            onClick={() => setStarted(true)}
            style={{ marginTop: 20, width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: C.navy, color: C.white, fontFamily: F.body, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            Continue Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <ApplicationIntakeProvider
      kind={preview.listingSummary?.kind}
      listingId={preview.listingSummary?.listingId}
      listingSummary={preview.listingSummary}
      invitationToken={token}
      basePath={`/marketplace/application/invite/${token}`}
    >
      <Routes>
        <Route index element={<Navigate to="stage-1" replace />} />
        <Route path="stage-1" element={<Stage1_ApplicantHousehold />} />
        <Route path="stage-2" element={<Stage2_RentalFinancial />} />
        <Route path="stage-3" element={<Stage3_PropertyDocuments />} />
        <Route path="stage-4" element={<Stage4_ReviewConsentSubmit />} />
      </Routes>
    </ApplicationIntakeProvider>
  );
}
