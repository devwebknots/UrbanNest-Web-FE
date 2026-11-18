// src/pages/ApplicationIntake/ApplicationsListPage.jsx
//
// Renter-facing "Applications" entry point (Session 59). The user asked,
// in effect: now that a Renter has submitted an application, how do they
// follow its status? Recommendation confirmed with the user: a new
// "Applications" item in MarketplaceHomePage's account-menu dropdown,
// placed right after Favorites, that opens a real routed page here —
// not a tab inside "Alerts & Communications". That surface is shaped for
// ephemeral, read-once notifications (Email/Notifications/Messages tabs,
// a reading pane); an application has real, ongoing multi-stage state
// (status, co-applicant progress, documents, consent) that deserves its
// own page the same way the Apply flow itself and the post-submit status
// page (ApplicationSubmittedPage) already are full routed pages, not
// modals.
//
// REAL ARCHITECTURE GAP — same FE-first posture as the rest of this
// module (see ApplicationIntakeContext.jsx's own header, and Dependents /
// Property Requirements below it for the same pattern). There is still
// no backend "list my applications" endpoint anywhere —
// applicationIntakeApi.js only has get-one-application-by-id calls
// (apiGetApplication / apiGetApplicationStatus) — because the PE-4
// intake-slice backend itself doesn't exist yet; everything today runs
// in local-draft mode (see ApplicationIntakeContext's `backendConnected`
// flag). So this page's list is built by scanning THIS BROWSER's own
// localStorage for every `un_application_draft:*` entry this Renter has
// started or submitted on this device — the exact same local-draft data
// Stages 1-4 already read/write, and the exact same "Saved to this
// device" honesty the rest of Application Intake already carries. This
// is a real list of this device's drafts, not a placeholder — but it has
// a real, known limit a backend list endpoint would remove: an
// application started on a different device/browser won't show up here.
// Flagged here and in the Claude Project doc, not silently left unsaid.
//
// Landlord/PM-side visibility into these same applications is a separate,
// larger gap (see the Claude Project doc) — that side genuinely can't
// show anything real without the PE-4 backend, since a landlord seeing
// what a Renter submitted is inherently cross-user, server-side data
// that one browser's localStorage can never honestly fake.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { C, F, RADIUS, SHADOW } from './applicationIntakeTokens';

const DRAFT_KEY_PREFIX = 'un_application_draft:';

const HOUSEHOLD_STATUS_COPY = {
  DRAFT: 'Not yet submitted',
  IN_PROGRESS: 'In progress — continue your application',
  AWAITING_CO_APPLICANT: 'Submitted — waiting on co-applicant(s)',
  READY_FOR_SCREENING: 'Submitted — ready for screening',
  SCREENING_IN_PROGRESS: 'Screening underway',
  UNDER_REVIEW: 'Under review by the landlord/property manager',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
  WITHDRAWN: 'Withdrawn',
};

// Any status past "the Primary Applicant's own section has been
// submitted" — matches submitApplicantSection()'s local-fallback branch
// in ApplicationIntakeContext.jsx.
const SUBMITTED_STATUSES = new Set([
  'AWAITING_CO_APPLICANT', 'READY_FOR_SCREENING', 'SCREENING_IN_PROGRESS',
  'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN',
]);

function readLocalApplications() {
  const rows = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(DRAFT_KEY_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.application) {
          rows.push({
            key,
            application: parsed.application,
            applicant: parsed.applicant,
            savedAt: parsed.savedAt || 0,
          });
        }
      } catch {
        // Skip a corrupt single entry rather than breaking the whole list.
      }
    }
  } catch (e) {
    console.warn('[ApplicationsListPage] could not read local drafts', e);
  }
  rows.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)); // most recently touched first
  return rows;
}

function ApplicationCard({ row, onClick }) {
  const { application } = row;
  const listingSummary = application?.listingSummary;
  const status = application?.status || 'DRAFT';
  const statusCopy = HOUSEHOLD_STATUS_COPY[status] || status.replace(/_/g, ' ');
  const isSubmitted = SUBMITTED_STATUSES.has(status);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 14, alignItems: 'center',
        background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: RADIUS.md,
        padding: 14, marginBottom: 12, boxShadow: SHADOW.card, cursor: 'pointer',
      }}
    >
      <div style={{
        width: 72, height: 72, borderRadius: RADIUS.sm, overflow: 'hidden', flexShrink: 0,
        background: C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {listingSummary?.photoUrl ? (
          <img src={listingSummary.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <i className="ti ti-building" style={{ fontSize: 24, color: C.textTertiary }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
          {listingSummary?.propertyName || 'Listing'}
        </div>
        {listingSummary?.address && (
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
            {listingSummary.address}
          </div>
        )}
        {listingSummary?.rentLabel && (
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
            {listingSummary.rentLabel}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
          color: isSubmitted ? C.navy : C.warning, marginBottom: 4,
        }}>
          {isSubmitted ? 'Submitted' : 'Draft'}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, maxWidth: 190 }}>
          {statusCopy}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 11, color: C.navy, fontWeight: 700, marginTop: 6 }}>
          {isSubmitted ? 'View details →' : 'Continue application →'}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsListPage() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Same logged-out gate/destination convention as ApplicationIntakePage
      // and Book A Tour (ListingContactCard's handleBookTourClick).
      navigate('/', { state: { postLoginRedirect: '/marketplace/account/applications' } });
      return;
    }
    setRows(readLocalApplications());
    setLoaded(true);
  }, [user, authLoading, navigate]);

  function handleCardClick(row) {
    const { application, applicant } = row;
    const listingSummary = application?.listingSummary;
    const status = application?.status || 'DRAFT';

    if (SUBMITTED_STATUSES.has(status)) {
      // Reuse ApplicationSubmittedPage as the detail/status view — same
      // route + state shape Stage4's own handleSubmit() already uses, so
      // this is the exact same screen a Renter saw right after submitting.
      navigate(`/marketplace/application/${application?.id || 'draft'}/status`, {
        state: { application, applicant, listingSummary },
      });
      return;
    }

    // Not yet submitted — send them back into the apply flow, where
    // ApplicationIntakeContext's own bootstrap effect resumes this exact
    // local draft (approach doc §10, Scenario H).
    const kind = application?.listingKind || listingSummary?.kind;
    const listingId = application?.listingId || listingSummary?.listingId;
    if (kind && listingId) {
      navigate(`/marketplace/${kind}/${listingId}/apply`);
    }
  }

  if (authLoading || !loaded) {
    return <div style={{ padding: 60, textAlign: 'center', fontFamily: F.body, color: C.textSecondary }}>Loading your applications…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, fontFamily: F.body }}>
      <div style={{ background: C.navy, color: C.white, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 700 }}>UrbanNest</span>
        <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.12)', padding: '3px 9px', borderRadius: 20 }}>
          Renter Portal
        </span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 60px' }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
          Your Applications
        </div>
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>
          Rental applications you've started or submitted from this device.
        </div>

        {rows.length === 0 ? (
          <div style={{ background: C.cardBg, border: `1px dashed ${C.cardBorder}`, borderRadius: RADIUS.md, padding: 40, textAlign: 'center' }}>
            <div style={{ fontFamily: F.body, fontSize: 13.5, color: C.textSecondary, marginBottom: 14 }}>
              You haven't started an application yet.
            </div>
            <button
              onClick={() => navigate('/marketplace')}
              style={{ padding: '11px 22px', borderRadius: 8, border: 'none', background: C.navy, color: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Browse Listings
            </button>
          </div>
        ) : (
          rows.map((row) => (
            <ApplicationCard key={row.key} row={row} onClick={() => handleCardClick(row)} />
          ))
        )}
      </div>
    </div>
  );
}
