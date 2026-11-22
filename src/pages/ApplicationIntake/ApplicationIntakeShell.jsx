// src/pages/ApplicationIntake/ApplicationIntakeShell.jsx
//
// Shared header + stepper + listing-summary sidebar for all four
// Application Intake stages, plus the submitted/status screen. Visually
// follows the Figma's institutional framing (navy header, "RENTER PORTAL"
// badge, compliance badges) per the user's decision — see
// applicationIntakeTokens.js's own header. The security badges and brand
// line are sample content (sampleInstitutionalContent.js); everything
// else here (listing summary, stage progress, save state, user identity)
// is real.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApplicationIntake } from './ApplicationIntakeContext';
import { C, F, RADIUS, SHADOW } from './applicationIntakeTokens';
import { SampleTag, SAMPLE_BRAND_LINE, SAMPLE_SECURITY_BADGES } from './sampleInstitutionalContent';

// Session 56 — vertical stepper redesign (replaces the old horizontal pill
// row) follows the same structural pattern already used elsewhere in this
// app for a multi-step form — pages/IndependentPM/IndependentPM_Step1.jsx's
// own `VerticalStepper` (dot + connector line, label + one-line
// description, done/active/upcoming states) — per the user's explicit
// request to follow that design philosophy here too. Colors/type stay this
// surface's own institutional navy/serif tokens rather than borrowing the
// PM page's blue palette; only the layout shape is reused.
const STAGES = [
  { n: 1, label: 'Applicant & Household', sub: 'Who’s applying, and who else will live here' },
  { n: 2, label: 'Rental & Financial History', sub: 'Past residences, employment, and income' },
  { n: 3, label: 'Property Requirements & Documents', sub: 'Required uploads and property-specific details' },
  { n: 4, label: 'Review, Consent & Submit', sub: 'Confirm everything and send your section in' },
];

function VerticalStepper({ activeStage }) {
  return (
    <div style={{ width: 230, minWidth: 230, flexShrink: 0, padding: '4px 18px 4px 0' }}>
      {STAGES.map((s, idx) => {
        const active = s.n === activeStage;
        const done = s.n < activeStage;
        return (
          <div key={s.n} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 11, height: 11, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                background: active || done ? C.navy : 'transparent',
                border: `2px solid ${active || done ? C.navy : C.inputBorder}`,
              }} />
              {idx < STAGES.length - 1 && (
                <div style={{
                  width: 1.5, flex: 1, minHeight: 46, margin: '4px 0',
                  background: done ? C.navy : C.inputBorder, opacity: done ? 1 : 0.5,
                }} />
              )}
            </div>
            <div style={{ paddingBottom: idx < STAGES.length - 1 ? 20 : 0 }}>
              <div style={{
                fontFamily: F.serif, fontSize: 13.5, lineHeight: 1.3, marginBottom: 3,
                fontWeight: active ? 700 : 500,
                color: active ? C.textPrimary : done ? C.textSecondary : C.textTertiary,
              }}>
                {done && <i className="ti ti-circle-check-filled" style={{ color: C.success, fontSize: 12, marginRight: 5 }} />}
                {s.label}
              </div>
              <div style={{ fontFamily: F.body, fontSize: 11, lineHeight: 1.45, color: active ? C.textSecondary : C.textTertiary }}>
                {s.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Real Listing Agent card — replaces the old sample "Intake Concierge"
// (Claire Sinclair) block. Same contact shape Marketplace's own
// ListingContactCard already renders ({name, email, phone, photoUrl, role,
// orgName} — see marketplaceDetailShared.jsx / ListingDetailPage.jsx's
// `data.leadContact`), reused here because this IS that same listing's
// contact — logically the same person a renter would reach via "Contact"
// on the listing itself, not a separate sample case manager.
//
// Session 56 follow-up — restyled to match the real card the user
// screenshotted (role shown as a pill badge next to the name, a dotted
// divider, then a row of round action icons) rather than the two flat
// Email/Call link-buttons this used before. Kept deliberately real, not
// cosmetic-only:
//   - "Apply" was dropped entirely (not just disabled) — per the user's
//     follow-up ask, once the renter is already inside this listing's
//     Apply flow, re-entering it isn't a real action worth a slot here
//     (unlike Marketplace's own ListingContactCard, where Apply is the
//     entry point and the button earns its place).
//   - "Book Tour" is a real navigation back to the listing's own detail
//     page, where the real Book-A-Tour flow already lives
//     (marketplaceDetailShared.jsx's BookTourModal isn't exported for
//     reuse, so this surface doesn't duplicate that modal — it sends the
//     renter to the one real copy of it instead of faking a second one).
//   - "Email" is its own exclusive action (mailto only) in Apply's old
//     slot, and "Message" now covers phone (tel only) rather than the
//     mail-or-tel fallback it briefly was — the user asked for Email back
//     as its own dedicated option, so the two no longer share one button.
export function ListingAgentCard({ listingAgent, listingKind, listingId }) {
  const navigate = useNavigate();
  if (!listingAgent || !listingAgent.name) {
    return (
      <div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: RADIUS.md, padding: '14px', fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, textAlign: 'center' }}>
        No listing contact has been provided for this listing yet.
      </div>
    );
  }
  const initials = listingAgent.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
  const roleLabel = listingAgent.orgName || (listingAgent.role === 'AGENT' ? 'Independent Agent' : 'Landlord');
  const mailHref = listingAgent.email ? `mailto:${listingAgent.email}` : null;
  const telHref = listingAgent.phone ? `tel:${listingAgent.phone.replace(/[^\d+]/g, '')}` : null;

  const actionBtnStyle = { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 2, textDecoration: 'none' };
  const activeCircleStyle = { width: 44, height: 44, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const disabledCircleStyle = { width: 44, height: 44, borderRadius: '50%', background: C.inputBg, border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 };

  return (
    <div style={{ background: C.cardBg, borderRadius: RADIUS.md, border: `1px solid ${C.cardBorder}`, padding: 16, boxShadow: SHADOW.card }}>
      <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 14 }}>
        Listing Agent
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {listingAgent.photoUrl ? (
          <img src={listingAgent.photoUrl} alt={listingAgent.name} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}`, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: C.navy, border: `2px solid ${C.gold}`, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: F.body, fontSize: 16, flexShrink: 0 }}>
            {initials}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.body, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{listingAgent.name}</div>
          <div style={{
            display: 'inline-block', marginTop: 5, fontFamily: F.body, fontSize: 9.5, fontWeight: 800,
            letterSpacing: '0.04em', textTransform: 'uppercase', color: C.textSecondary,
            background: C.inputBg, padding: '3px 9px', borderRadius: 20,
          }}>
            {roleLabel}
          </div>
          <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: F.body, fontSize: 12, color: C.textSecondary }}>
            {mailHref && (
              <a href={mailHref} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}>
                <i className="ti ti-mail" style={{ fontSize: 13, flexShrink: 0 }} /> {listingAgent.email}
              </a>
            )}
            {telHref && (
              <a href={telHref} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-phone" style={{ fontSize: 13, flexShrink: 0 }} /> {listingAgent.phone}
              </a>
            )}
            {!mailHref && !telHref && <span>No phone or email on file.</span>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `2px dotted ${C.cardBorder}`, margin: '16px 0 14px' }} />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 26 }}>
        {mailHref ? (
          <a href={mailHref} title={`Email ${listingAgent.name}`} aria-label="Email" style={actionBtnStyle}>
            <span style={activeCircleStyle}><i className="ti ti-mail" style={{ fontSize: 16, color: C.white }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textPrimary }}>Email</span>
          </a>
        ) : (
          <button disabled title="No email on file" aria-label="Email" style={{ ...actionBtnStyle, cursor: 'not-allowed' }}>
            <span style={disabledCircleStyle}><i className="ti ti-mail" style={{ fontSize: 16, color: C.textTertiary }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary }}>Email</span>
          </button>
        )}

        <button
          onClick={() => listingId && navigate(`/marketplace/${listingKind === 'property-listing' ? 'property-listing' : 'listing'}/${listingId}`)}
          disabled={!listingId}
          title="View this listing to book a tour"
          aria-label="Book Tour"
          style={{ ...actionBtnStyle, cursor: listingId ? 'pointer' : 'not-allowed' }}
        >
          <span style={listingId ? activeCircleStyle : disabledCircleStyle}>
            <i className="ti ti-calendar" style={{ fontSize: 16, color: listingId ? C.white : C.textTertiary }} />
          </span>
          <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: listingId ? C.textPrimary : C.textTertiary }}>Book Tour</span>
        </button>

        {telHref ? (
          <a href={telHref} title={`Call ${listingAgent.name}`} aria-label="Message" style={actionBtnStyle}>
            <span style={activeCircleStyle}><i className="ti ti-message-circle" style={{ fontSize: 16, color: C.white }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textPrimary }}>Message</span>
          </a>
        ) : (
          <button disabled title="No phone on file" aria-label="Message" style={{ ...actionBtnStyle, cursor: 'not-allowed' }}>
            <span style={disabledCircleStyle}><i className="ti ti-message-circle" style={{ fontSize: 16, color: C.textTertiary }} /></span>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary }}>Message</span>
          </button>
        )}
      </div>
    </div>
  );
}

function SavedIndicator() {
  const { backendConnected, lastSavedAt } = useApplicationIntake();
  if (!lastSavedAt) return null;
  const secondsAgo = Math.max(0, Math.round((Date.now() - lastSavedAt) / 1000));
  const label = secondsAgo < 5 ? 'just now' : secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.round(secondsAgo / 60)}m ago`;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
      {backendConnected ? `Saved ${label}` : `Saved to this device ${label}`}
    </span>
  );
}

// Session 55 — invitation mode never saves locally, so a failed save must
// be visible: the renter re-enters the change once the connection is back.
function SaveErrorBanner() {
  const { saveError, clearSaveError } = useApplicationIntake();
  if (!saveError) return null;
  return (
    <div role="alert" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', color: C.danger, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontFamily: F.body, fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
      <span>{saveError} Your last change was not saved — please enter it again.</span>
      <button onClick={clearSaveError} style={{ background: 'none', border: 'none', color: C.danger, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Dismiss</button>
    </div>
  );
}

export function ApplicationIntakeShell({ activeStage, children, sidebarExtra }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listingSummary, application, applicant } = useApplicationIntake();

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: C.pageBg, fontFamily: F.body }}>
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div style={{ background: C.navy, color: C.white, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 700 }}>UrbanNest</span>
          <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.12)', padding: '3px 9px', borderRadius: 20 }}>
            Renter Portal
          </span>
          {SAMPLE_SECURITY_BADGES.map((b) => (
            <span key={b} style={{ display: 'none' }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SavedIndicator />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700 }}>{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Applicant'}</div>
            <div style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{applicant?.roleLabel || ''}</div>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.1)', color: C.white, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '7px 14px', fontFamily: F.body, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Save &amp; Exit
          </button>
        </div>
      </div>

      {/* ── Compliance badge strip (sample, clearly marked) ──────────────── */}
      <div style={{ background: C.navyLight, padding: '5px 28px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{SAMPLE_BRAND_LINE}</span>
        {SAMPLE_SECURITY_BADGES.map((b) => (
          <span key={b} style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-shield-lock" style={{ fontSize: 11 }} /> {b}
          </span>
        ))}
        <SampleTag style={{ marginLeft: 4 }} label="Sample compliance badges" />
      </div>

      {/* ── Page title + application reference ──────────────────────────
          Replaces the old flat "listing context strip" — the application
          reference/stage count moves up here, next to the page title,
          same spot the vertical-stepper reference page (IndependentPM_
          Step1.jsx) puts its own title block, above the stepper+form row. */}
      <div style={{ padding: '22px 28px 0', background: C.pageBg }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
              Rental Application{listingSummary ? ` — ${listingSummary.propertyName}` : ''}
            </div>
            {listingSummary && (
              <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, marginTop: 3 }}>
                {listingSummary.address} {listingSummary.rentLabel ? `· ${listingSummary.rentLabel}` : ''}
              </div>
            )}
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, whiteSpace: 'nowrap' }}>
            {application?.applicationNumber ? `Application Ref ${application.applicationNumber}` : 'Draft not yet submitted'} · Stage {activeStage} of 4
          </div>
        </div>
        <div style={{ borderBottom: `1px solid ${C.cardBorder}`, marginTop: 16 }} />
      </div>

      {/* ── Body: vertical stepper · form · listing/agent sidebar ───────── */}
      <div style={{ maxWidth: 1260, margin: '0 auto', padding: '24px 20px 60px', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <VerticalStepper activeStage={activeStage} />

        <div style={{ flex: '2 1 480px', minWidth: 320 }}>
          <SaveErrorBanner />
          {children}
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {listingSummary && (
            <div style={{ background: C.cardBg, borderRadius: RADIUS.md, border: `1px solid ${C.cardBorder}`, overflow: 'hidden', boxShadow: SHADOW.card }}>
              {listingSummary.photoUrl && (
                <div style={{ height: 130, background: `url(${listingSummary.photoUrl}) center/cover` }} />
              )}
              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{listingSummary.unitLabel || listingSummary.propertyName}</div>
                <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{listingSummary.address}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.cardBorder}`, fontFamily: F.body, fontSize: 12 }}>
                  <div>
                    <div style={{ color: C.textTertiary, fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Monthly Rent</div>
                    <div style={{ fontWeight: 800, color: C.textPrimary }}>{listingSummary.rentLabel}</div>
                  </div>
                  {listingSummary.leaseTerm && (
                    <div>
                      <div style={{ color: C.textTertiary, fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Lease Term</div>
                      <div style={{ fontWeight: 800, color: C.textPrimary }}>{listingSummary.leaseTerm}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {sidebarExtra}

          <ListingAgentCard listingAgent={listingSummary?.listingAgent} listingKind={listingSummary?.kind} listingId={listingSummary?.listingId} />
        </div>
      </div>
    </div>
  );
}

export function StageFooterNav({ onBack, onNext, backLabel = 'Back', nextLabel = 'Continue', nextDisabled, nextLoading, onSaveDraft }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, flexWrap: 'wrap', gap: 10 }}>
      <div>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.textSecondary, fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-arrow-left" /> {backLabel}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {onSaveDraft && (
          <button onClick={onSaveDraft} style={{ background: 'none', border: `1px solid ${C.cardBorder}`, color: C.textSecondary, borderRadius: 8, padding: '10px 16px', fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Save as Draft
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          style={{
            background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '11px 22px',
            fontFamily: F.body, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            cursor: nextDisabled || nextLoading ? 'default' : 'pointer', opacity: nextDisabled ? 0.5 : nextLoading ? 0.7 : 1,
          }}
        >
          {nextLoading ? 'Working…' : nextLabel} {!nextLoading && <i className="ti ti-arrow-right" />}
        </button>
      </div>
    </div>
  );
}

export function FieldLabel({ children, required }) {
  return (
    <label style={{ display: 'block', fontFamily: F.body, fontSize: 11.5, fontWeight: 700, color: C.textSecondary, marginBottom: 5 }}>
      {children}{required && <span style={{ color: C.danger }}> *</span>}
    </label>
  );
}

export const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8,
  border: `1px solid ${C.inputBorder}`, background: C.inputBg, fontFamily: F.body, fontSize: 13, color: C.textPrimary,
};

export function SectionHeading({ title, subtitle, badge }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{title}</div>
        {badge}
      </div>
      {subtitle && <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: RADIUS.md, padding: 18, marginBottom: 16, boxShadow: SHADOW.card, ...style }}>
      {children}
    </div>
  );
}
