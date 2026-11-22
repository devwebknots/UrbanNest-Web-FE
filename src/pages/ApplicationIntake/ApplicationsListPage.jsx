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
// Session 55 — backed by the real GET /marketplace/application/mine/
// (application_intake backend), so applications started on any device
// appear here, including ones the user was invited to as a co-applicant.
// This browser's `un_application_draft:*` localStorage entries are only
// the offline fallback now. The Landlord/PM side has its own read-only
// endpoints (received/) — no UI consumes them yet.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { C, F, RADIUS, SHADOW } from './applicationIntakeTokens';
import * as api from './applicationIntakeApi';
import { useIntakeReferences } from './useIntakeReferences';

const DRAFT_KEY_PREFIX = 'un_application_draft:';

// Session 55 — status labels and their explanatory text come from the UN
// Reference tables (statusLabel / statusDescription on each application, or
// useIntakeReferences for local drafts); which statuses count as draft /
// closed comes from the backend's rules. Nothing hardcoded here.

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

function ApplicationCard({ row, refs, onClick }) {
  const { application, applicant } = row;
  const listingSummary = application?.listingSummary;
  const draftStatus = refs.rules.draftStatus;
  const status = application?.status || draftStatus;
  const isSubmitted = !!status && status !== draftStatus;
  const closed = (refs.rules.closedApplicationStatuses || []).includes(status);
  // A co-applicant's own section can still be open after the household has
  // been submitted by the primary applicant — show *their* status then.
  const isCoApplicant = !!applicant?.role && applicant.role !== refs.rules.primaryApplicantType;
  const mySectionOpen = isCoApplicant && !applicant?.submittedAt && isSubmitted && !closed;
  const statusLabel = application?.statusLabel || refs.statusLabel('STATUS', status);
  const statusCopy = mySectionOpen
    ? `${refs.statusLabel('APPLICANT_STATUS', applicant.status)} — ${refs.statusDescription('APPLICANT_STATUS', applicant.status)}`
    : (application?.statusDescription || refs.statusDescription('STATUS', status));

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
        {application?.applicationNumber && (
          <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginTop: 4, fontWeight: 700 }}>
            {application.applicationNumber}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: F.body, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
          color: isSubmitted && !mySectionOpen ? C.navy : C.warning, marginBottom: 4,
        }}>
          {statusLabel}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, maxWidth: 190 }}>
          {statusCopy}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 11, color: C.navy, fontWeight: 700, marginTop: 6 }}>
          {isSubmitted && !mySectionOpen ? 'View details →' : 'Continue application →'}
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
  const [fromServer, setFromServer] = useState(false);
  const refs = useIntakeReferences();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Same logged-out gate/destination convention as ApplicationIntakePage
      // and Book A Tour (ListingContactCard's handleBookTourClick).
      navigate('/', { state: { postLoginRedirect: '/marketplace/account/applications' } });
      return;
    }
    // Session 55 — the real "my applications" list (every device). Falls
    // back to this browser's local drafts only when the backend can't be
    // reached.
    let active = true;
    api.apiListMyApplications()
      .then((data) => {
        if (!active) return;
        setFromServer(true);
        setRows((data || []).map((r) => ({
          key: r.household_application.id,
          application: r.household_application,
          applicant: r.myApplicant,
          savedAt: Date.parse(r.household_application.updatedAt) || 0,
        })));
      })
      .catch((e) => {
        console.warn('[ApplicationsListPage] backend list unavailable — showing this device\'s drafts', e);
        if (active) { setFromServer(false); setRows(readLocalApplications()); }
      })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [user, authLoading, navigate]);

  function handleCardClick(row) {
    const { application, applicant } = row;
    const listingSummary = application?.listingSummary;
    const status = application?.status || refs.rules.draftStatus;
    const isSubmitted = !!status && status !== refs.rules.draftStatus;

    if (applicant?.role && applicant.role !== refs.rules.primaryApplicantType && !applicant?.submittedAt) {
      // Co-applicants continue through their invitation link (the apply
      // route would start a brand-new application of their own).
      return;
    }

    if (isSubmitted || applicant?.submittedAt) {
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
          {fromServer ? "Rental applications you've started, submitted or been invited to." : "Rental applications you've started or submitted from this device."}
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
            <ApplicationCard key={row.key} row={row} refs={refs} onClick={() => handleCardClick(row)} />
          ))
        )}
      </div>
    </div>
  );
}
