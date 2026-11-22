// src/pages/ApplicationIntake/CoApplicantInvitePage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// A co-applicant lands here from their invitation link
// (/marketplace/application/invite/:token, see App.js).
//
// Session 55 — "Option B, no automatic login" (agreed). The link never signs
// anyone in; it only identifies the invitation. States, in order:
//   1. Invalid / expired / revoked link        → explain, nothing else
//   2. Signed out, account exists              → "Sign in to continue" (email
//                                                 pre-filled) → back here
//   3. Signed out, no account                  → pop-up "Create your
//      UrbanNest account to continue" → the normal sign-up (email pre-filled
//      and locked) → normal email/phone verification → back here
//   4. Signed in as someone else               → say so; "Sign out and
//                                                 continue as <invited email>"
//   5. Signed in as the invited person         → invitation card → Continue
//      → the intake flow in INVITATION MODE: it accepts the invitation on the
//        server first and never falls back to local drafts (see
//        ApplicationIntakeContext). If accepting fails, InviteFlowGate shows
//        why (wrong account, email not verified, network) and how to fix it.
// Sign-in, sign-up, verification and the Renter persona all reuse the
// existing screens/endpoints via `postLoginRedirect` — no second account flow.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from './applicationIntakeApi';
import { ApplicationIntakeProvider, useApplicationIntake } from './ApplicationIntakeContext';
import { C, F, RADIUS, SHADOW } from './applicationIntakeTokens';
import Stage1_ApplicantHousehold from './Stage1_ApplicantHousehold';
import Stage2_RentalFinancial from './Stage2_RentalFinancial';
import Stage3_PropertyDocuments from './Stage3_PropertyDocuments';
import Stage4_ReviewConsentSubmit from './Stage4_ReviewConsentSubmit';

const pageStyle = { minHeight: '100vh', background: C.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: F.body };
const cardStyle = { background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.raised, padding: 28, maxWidth: 460, width: '100%' };
const titleStyle = { fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10 };
const bodyStyle = { fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 };
const primaryBtn = { marginTop: 20, width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: C.navy, color: C.white, fontFamily: F.body, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' };
const secondaryBtn = { marginTop: 10, width: '100%', padding: '11px 0', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: 'none', color: C.navy, fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer' };

function Centered({ children }) {
  return <div style={pageStyle}><div style={cardStyle}>{children}</div></div>;
}

function unitText(summary) {
  if (!summary) return '';
  return summary.unitNumber ? `Unit ${summary.unitNumber}` : (summary.unitLabel || '');
}

function InvitationSummary({ preview }) {
  const s = preview.listingSummary || {};
  return (
    <div style={bodyStyle}>
      <div><strong>Property:</strong> {s.propertyName}</div>
      {unitText(s) && <div><strong>Unit:</strong> {unitText(s)}</div>}
      {s.address && <div><strong>Address:</strong> {s.address}</div>}
      <div><strong>Primary Applicant:</strong> {preview.primaryApplicantName}</div>
      <div><strong>Application ID:</strong> {preview.applicationId}</div>
      <div><strong>Your role:</strong> {preview.roleLabel}</div>
    </div>
  );
}

// Inside the provider: hold the stages until the server has accepted the
// invitation; show the reason (and a way forward) if it didn't.
function InviteFlowGate({ token, invitedEmail, children }) {
  const { loading, fatalError, retryJoin } = useApplicationIntake();
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const invitePath = `/marketplace/application/invite/${token}`;

  if (loading && !fatalError) {
    return <Centered><div style={bodyStyle}>Joining the application…</div></Centered>;
  }
  if (fatalError) {
    return (
      <Centered>
        <div style={titleStyle}>We couldn't open this application</div>
        <div style={bodyStyle}>{fatalError.message}</div>
        {fatalError.code === 'network' && (
          <button onClick={retryJoin} style={primaryBtn}>Try again</button>
        )}
        {fatalError.code === 'wrong_account' && (
          <button
            onClick={() => { clearAuth(); navigate(invitePath, { replace: true }); }}
            style={primaryBtn}
          >
            Sign out and continue as {invitedEmail}
          </button>
        )}
        {fatalError.code === 'email_not_verified' && (
          <button
            onClick={() => navigate('/verify-otp', { state: { email: user?.email, phone: user?.phone, postLoginRedirect: invitePath } })}
            style={primaryBtn}
          >
            Verify my email
          </button>
        )}
      </Centered>
    );
  }
  return children;
}

export default function CoApplicantInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, authLoading, clearAuth } = useAuth();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);

  const invitePath = `/marketplace/application/invite/${token}`;

  useEffect(() => {
    setLoading(true);
    api.apiGetInvitationPreview(token)
      .then((data) => { setPreview(data); setError(null); })
      .catch((e) => setError(
        e.status
          ? (e.message || 'This invitation link is not valid.')
          : "We couldn't reach UrbanNest to check this invitation. Check your connection and reload the page.",
      ))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || authLoading) {
    return <Centered><div style={bodyStyle}>Checking your invitation…</div></Centered>;
  }

  // 1. invalid / expired / revoked / unreachable
  if (error || !preview) {
    return (
      <Centered>
        <div style={titleStyle}>This invitation can't be used</div>
        <div style={bodyStyle}>{error || 'This invitation could not be found.'}</div>
        <div style={{ ...bodyStyle, marginTop: 10 }}>If you still need to join, ask the primary applicant to resend the invitation.</div>
      </Centered>
    );
  }

  const invitedEmail = preview.invitedEmail;
  const signedInEmail = (user?.email || '').toLowerCase();
  const matches = !!user && signedInEmail === (invitedEmail || '').toLowerCase();
  const goSignIn = () => navigate('/', { state: { postLoginRedirect: invitePath, prefillEmail: invitedEmail } });
  const goSignUp = () => navigate('/signup', { state: { postLoginRedirect: invitePath, prefillEmail: invitedEmail, lockEmail: true } });

  // 2 & 3. signed out
  if (!user) {
    return (
      <Centered>
        <div style={titleStyle}>You're invited to join a rental application.</div>
        <InvitationSummary preview={preview} />
        <div style={{ ...bodyStyle, marginTop: 14 }}>
          This invitation is for <strong>{invitedEmail}</strong>.{' '}
          {preview.accountExists
            ? 'Sign in with that account to continue.'
            : 'You need an UrbanNest account with that email address to continue.'}
        </div>
        {preview.accountExists ? (
          <button onClick={goSignIn} style={primaryBtn}>Sign in to continue</button>
        ) : (
          <>
            <button onClick={() => setShowCreatePrompt(true)} style={primaryBtn}>Continue</button>
            <button onClick={goSignIn} style={secondaryBtn}>I already have an account</button>
          </>
        )}
        {showCreatePrompt && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
            <div style={cardStyle}>
              <div style={titleStyle}>Create your UrbanNest account to continue</div>
              <div style={bodyStyle}>
                Create a free account with <strong>{invitedEmail}</strong> and verify it. You'll come straight back to this application afterwards.
              </div>
              <button onClick={goSignUp} style={primaryBtn}>Create account</button>
              <button onClick={() => setShowCreatePrompt(false)} style={secondaryBtn}>Cancel</button>
            </div>
          </div>
        )}
      </Centered>
    );
  }

  // 4. signed in as someone else
  if (!matches) {
    return (
      <Centered>
        <div style={titleStyle}>You're signed in with a different account</div>
        <InvitationSummary preview={preview} />
        <div style={{ ...bodyStyle, marginTop: 14 }}>
          You're signed in as <strong>{user.email}</strong>, but this invitation is for <strong>{invitedEmail}</strong>.
          Only that account can join this application.
        </div>
        <button onClick={() => { clearAuth(); }} style={primaryBtn}>
          Sign out and continue as {invitedEmail}
        </button>
      </Centered>
    );
  }

  // 5. the invited person
  if (!started) {
    return (
      <Centered>
        <div style={titleStyle}>You're invited to join a rental application.</div>
        <InvitationSummary preview={preview} />
        <button onClick={() => setStarted(true)} style={primaryBtn}>Continue Application</button>
      </Centered>
    );
  }

  return (
    <ApplicationIntakeProvider
      kind={preview.listingSummary?.kind}
      listingId={preview.listingSummary?.listingId}
      listingSummary={preview.listingSummary}
      invitationToken={token}
      basePath={invitePath}
    >
      <InviteFlowGate token={token} invitedEmail={invitedEmail}>
        <Routes>
          <Route index element={<Navigate to="stage-1" replace />} />
          <Route path="stage-1" element={<Stage1_ApplicantHousehold />} />
          <Route path="stage-2" element={<Stage2_RentalFinancial />} />
          <Route path="stage-3" element={<Stage3_PropertyDocuments />} />
          <Route path="stage-4" element={<Stage4_ReviewConsentSubmit />} />
        </Routes>
      </InviteFlowGate>
    </ApplicationIntakeProvider>
  );
}
