
// ─────────────────────────────────────────────────────────────
// src/pages/PMPortal/RBAC/PMStaffSignupPage.jsx
//
// Public page — no nav, no auth required.
// Route: /pm-staff-signup?token=XXX
//
// Scenarios handled:
//   NEW_PERSON    → show full signup form (name + phone + password)
//   EXISTING_USER → show name only (pre-filled, read-only) + confirm button
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UNPopup from '../../../components/common/UNPopup';

// ── Color + Font constants (from UrbanNest Design System) ────
const C = {
  navy:        '#0F172A',
  navyMid:     '#1E293B',
  blue:        '#2563EB',
  blueDark:    '#1D4ED8',
  blueLight:   '#EFF6FF',
  gray50:      '#F8FAFC',
  gray100:     '#F1F5F9',
  gray200:     '#E2E8F0',
  gray400:     '#94A3B8',
  gray500:     '#64748B',
  gray700:     '#334155',
  gray900:     '#0F172A',
  white:       '#FFFFFF',
  green:       '#16A34A',
  greenLight:  '#DCFCE7',
  red:         '#DC2626',
  redLight:    '#FEF2F2',
  border:      '#E2E8F0',
};

const F = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ── Step constants ────────────────────────────────────────────
const STEP_LOADING  = 'LOADING';
const STEP_INVALID  = 'INVALID';
const STEP_FORM     = 'FORM';
const STEP_DONE     = 'DONE';


export default function PMStaffSignupPage() {
  const navigate  = useNavigate();
  const token     = new URLSearchParams(window.location.search).get('token');

  const [step,        setStep]        = useState(STEP_LOADING);
  const [inviteData,  setInviteData]  = useState(null);   // from verify endpoint
  const [scenario,    setScenario]    = useState(null);   // NEW_PERSON | EXISTING_USER
  const [errorMsg,    setErrorMsg]    = useState('');

  // Form fields
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [phone,       setPhone]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  // Popup
  const [popup, setPopup] = useState({ show: false, type: '', title: '', message: '' });

  const showPopup = (type, title, message) =>
    setPopup({ show: true, type, title, message });

  const closePopup = () =>
    setPopup(p => ({ ...p, show: false }));


  // ── On mount: verify token ──────────────────────────────────
  useEffect(() => {
    if (!token) {
      setErrorMsg('No invite token found in this link.');
      setStep(STEP_INVALID);
      return;
    }

    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/pm/staff-invites/verify/?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setErrorMsg(data.error);
          setStep(STEP_INVALID);
        } else {
          setInviteData(data);
          setScenario(data.scenario);
          setStep(STEP_FORM);
        }
      })
      .catch(() => {
        setErrorMsg('Something went wrong. Please try again or contact support.');
        setStep(STEP_INVALID);
      });
  }, [token]);


  // ── Submit handler ──────────────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (scenario === 'NEW_PERSON') {
      if (!firstName.trim())  return showPopup('error', 'Missing Field', 'Please enter your first name.');
      if (!lastName.trim())   return showPopup('error', 'Missing Field', 'Please enter your last name.');
      if (!phone.trim())      return showPopup('error', 'Missing Field', 'Please enter your phone number.');
      if (!password)          return showPopup('error', 'Missing Field', 'Please set a password.');
      if (password.length < 8) return showPopup('error', 'Weak Password', 'Password must be at least 8 characters.');
      if (password !== confirmPw) return showPopup('error', 'Password Mismatch', 'Passwords do not match.');
    }

    setSubmitting(true);

    const payload = {
      token,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      phone:      phone.trim(),
      password,
    };

    // For EXISTING_USER, backend uses existing user data — still send token
    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/pm/staff-invites/accept/`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      showPopup('error', 'Error', data.error || 'Something went wrong. Please try again.');
      return;
    }

    setStep(STEP_DONE);
  };


  // ── Render: Loading ─────────────────────────────────────────
  if (step === STEP_LOADING) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', color: C.gray500, padding: '60px 0' }}>
          <div style={{ fontSize: 14, fontFamily: F.sans }}>Verifying your invite link…</div>
        </div>
      </PageShell>
    );
  }

  // ── Render: Invalid / Expired ───────────────────────────────
  if (step === STEP_INVALID) {
    return (
      <PageShell>
        <div style={styles.card}>
          <div style={styles.logoBar}>
            <span style={styles.logoText}>UrbanNest</span>
          </div>
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <div style={{ ...styles.cardTitle, marginBottom: 8 }}>Invalid Invite Link</div>
            <div style={{ fontSize: 14, color: C.gray500, fontFamily: F.sans, lineHeight: 1.6 }}>
              {errorMsg}
            </div>
            <div style={{ marginTop: 24, fontSize: 13, color: C.gray400, fontFamily: F.sans }}>
              Contact your manager if you believe this is an error.
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Render: Done ────────────────────────────────────────────
  if (step === STEP_DONE) {
    return (
      <PageShell>
        <div style={styles.card}>
          <div style={styles.logoBar}>
            <span style={styles.logoText}>UrbanNest</span>
          </div>
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: C.greenLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 24,
            }}>✓</div>
            <div style={{ ...styles.cardTitle, color: C.green, marginBottom: 8 }}>
              You're all set!
            </div>
            <div style={{ fontSize: 14, color: C.gray500, fontFamily: F.sans, lineHeight: 1.7 }}>
              Your account has been activated. You can now log in to the UrbanNest PM Portal.
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{ ...styles.primaryBtn, marginTop: 28 }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Render: Form ────────────────────────────────────────────
  return (
    <PageShell>
      {popup.show && (
        <UNPopup
          type={popup.type}
          title={popup.title}
          message={popup.message}
          onClose={closePopup}
        />
      )}

      <div style={styles.card}>
        {/* Logo bar */}
        <div style={styles.logoBar}>
          <span style={styles.logoText}>UrbanNest</span>
        </div>

        {/* Invite context */}
        <div style={styles.contextBar}>
          <div style={{ fontSize: 13, color: C.gray500, fontFamily: F.sans, marginBottom: 4 }}>
            You've been invited to join
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: F.sans }}>
            {inviteData?.account_name}
          </div>
          <div style={{
            display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap',
          }}>
            <Tag label="Team" value={inviteData?.node_name} />
            <Tag label="Role" value={inviteData?.role_name} />
          </div>
        </div>

        {/* Form body */}
        <div style={{ padding: '28px 32px 32px' }}>
          <div style={styles.cardTitle}>
            {scenario === 'EXISTING_USER' ? 'Confirm & Activate' : 'Create Your Account'}
          </div>
          <div style={{ fontSize: 13, color: C.gray500, fontFamily: F.sans, marginBottom: 24, marginTop: 4 }}>
            {scenario === 'EXISTING_USER'
              ? `We found an existing UrbanNest account for ${inviteData?.email}. Click below to add the PM Staff access to your account.`
              : `Set up your UrbanNest account to accept this invitation.`
            }
          </div>

          {scenario === 'NEW_PERSON' && (
            <>
              <div style={styles.row}>
                <Field
                  label="First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane"
                />
                <Field
                  label="Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Smith"
                />
              </div>

              <Field
                label="Phone Number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                type="tel"
              />

              <div style={styles.divider} />

              <Field
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                type="password"
              />
              <Field
                label="Confirm Password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat password"
                type="password"
              />
            </>
          )}

          {/* Email display (always) */}
          <div style={styles.emailRow}>
            <span style={{ fontSize: 12, color: C.gray500, fontFamily: F.sans }}>Signing up as</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.sans }}>
              {inviteData?.email}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ ...styles.primaryBtn, marginTop: 24, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting
              ? 'Activating…'
              : scenario === 'EXISTING_USER'
                ? 'Activate PM Access'
                : 'Create Account & Join'
            }
          </button>
        </div>
      </div>
    </PageShell>
  );
}


// ── Sub-components ────────────────────────────────────────────

function PageShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: C.gray100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      fontFamily: F.sans,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: C.gray700,
        fontFamily: F.sans,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 40,
          padding: '0 12px',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          fontSize: 14,
          color: C.gray900,
          fontFamily: F.sans,
          background: C.white,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Tag({ label, value }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      background: C.blueLight,
      borderRadius: 20,
      fontSize: 12,
      fontFamily: F.sans,
    }}>
      <span style={{ color: C.gray500 }}>{label}:</span>
      <span style={{ color: C.blue, fontWeight: 600 }}>{value}</span>
    </div>
  );
}


// ── Styles ────────────────────────────────────────────────────
const styles = {
  card: {
    background:   C.white,
    borderRadius: 16,
    boxShadow:    '0 4px 24px rgba(0,0,0,0.08)',
    overflow:     'hidden',
  },
  logoBar: {
    background:    C.navy,
    padding:       '16px 32px',
    display:       'flex',
    alignItems:    'center',
  },
  logoText: {
    color:      C.white,
    fontSize:   18,
    fontWeight: 800,
    fontFamily: F.sans,
    letterSpacing: '-0.03em',
  },
  contextBar: {
    background:   C.gray50,
    borderBottom: `1px solid ${C.border}`,
    padding:      '20px 32px',
  },
  cardTitle: {
    fontSize:   20,
    fontWeight: 700,
    color:      C.navy,
    fontFamily: F.sans,
    marginBottom: 4,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  divider: {
    height:        1,
    background:    C.border,
    margin:        '20px 0',
  },
  emailRow: {
    display:       'flex',
    alignItems:    'center',
    justifyContent:'space-between',
    padding:       '10px 14px',
    background:    C.gray50,
    borderRadius:  8,
    border:        `1px solid ${C.border}`,
    marginTop:     8,
  },
  primaryBtn: {
    width:         '100%',
    height:        44,
    background:    C.blue,
    color:         C.white,
    border:        'none',
    borderRadius:  8,
    fontSize:      14,
    fontWeight:    600,
    fontFamily:    F.sans,
    cursor:        'pointer',
    transition:    'background 0.15s',
  },
};
