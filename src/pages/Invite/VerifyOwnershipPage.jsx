// ─────────────────────────────────────────────
// UrbanNest — Verify Ownership Page
// Route: /verify-ownership?token=XXX
// Public — no auth required
//
// Scenario A (NEW_USER):          Registration + OTP + Done
// Scenario B (EXISTING_USER):     Registration (no password) + Done
// Scenario C (PENDING_LANDLORD):  Docs only (all fields locked) + Done
// Scenario D (EXISTING_LANDLORD): Registration (pre-filled, editable) + Done
// ─────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { C } from '../../constants/colors';
import { F } from '../../constants/fonts';
import { dotGridBg } from '../../constants/styles';

const API = 'http://localhost:8001/api';

const ICONS = {
  home:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  phone:    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  lock:     "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
  eyeOpen:  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
  eyeClose: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22",
  check:    "M20 6L9 17l-5-5",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  arrowL:   "M19 12H5M12 19l-7-7 7-7",
  upload:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  camera:   "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  laptop:   "M2 3h20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M1 20h22",
  trash:    "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  building: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  db:       "M12 2a9 3 0 1 0 0 6 9 3 0 0 0 0-6z M3 5v4a9 3 0 0 0 18 0V5 M3 13v4a9 3 0 0 0 18 0v-4",
  cert:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  hourglass: "M5 3h14 M5 21h14 M8 3v4l8 5-8 5v4",
  info:     "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8h.01 M12 12v4",
};

function Icon({ d, size = 16, color = C.textTertiary, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

const fieldLabel = {
  display: 'block', fontFamily: F.body, fontSize: 10, fontWeight: 700,
  color: C.textSecondary, textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 5,
};

const inputBase = (hasError = false, hasValue = false, locked = false) => ({
  width: '100%', boxSizing: 'border-box',
  height: 40, padding: '0 12px',
  fontFamily: F.body, fontSize: 13,
  color: locked ? C.textSecondary : C.textPrimary,
  background: locked ? '#F8FAFC' : (hasValue ? C.white : '#FAFBFC'),
  border: `1.5px solid ${hasError ? C.danger : 'rgba(0,0,0,0.08)'}`,
  borderRadius: 8, outline: 'none',
  cursor: locked ? 'not-allowed' : 'text',
  borderStyle: locked ? 'dashed' : 'solid',
});

// ─── Scenario config ──────────────────────────
// Central place defining behaviour per scenario
const SCENARIO_CONFIG = {
  NEW_USER: {
    badgeLabel: 'New registration',
    badgeBg: 'rgba(0,45,91,0.07)', badgeColor: C.primary,
    title: 'Create your account',
    subtitle: (propName) => <>Register to claim your ownership of <strong style={{ color: C.textPrimary }}>{propName}</strong>.</>,
    phoneLocked: false,
    showPassword: true,
    addrEditable: true,
    occupationLocked: false,
    allFieldsLocked: false,
    requiresOtp: true,
    ctaLabel: 'Continue to verification',
    stepperSteps: ['Registration', 'OTP', 'Done'],
  },
  EXISTING_USER: {
    badgeLabel: 'Existing account',
    badgeBg: 'rgba(22,163,74,0.08)', badgeColor: C.green,
    title: 'Verify your ownership',
    subtitle: (propName) => <>Complete your landlord profile and upload ownership documents for <strong style={{ color: C.textPrimary }}>{propName}</strong>.</>,
    phoneLocked: true,
    showPassword: false,
    addrEditable: true,
    occupationLocked: false,
    allFieldsLocked: false,
    requiresOtp: false,
    ctaLabel: 'Verify & Submit',
    stepperSteps: ['Registration', 'Done'],
  },
  PENDING_LANDLORD: {
    badgeLabel: 'Pending approval',
    badgeBg: '#FEF3C7', badgeColor: '#92400E',
    title: 'Submit ownership documents',
    subtitle: (propName) => <>Upload your ownership documents for <strong style={{ color: C.textPrimary }}>{propName}</strong>. Your profile details are locked while your landlord application is under review.</>,
    phoneLocked: true,
    showPassword: false,
    addrEditable: false,
    occupationLocked: true,
    allFieldsLocked: true,   // all personal + address fields locked
    requiresOtp: false,
    ctaLabel: 'Submit documents',
    stepperSteps: ['Registration', 'Done'],
  },
  EXISTING_LANDLORD: {
    badgeLabel: 'Existing landlord',
    badgeBg: '#FEF3C7', badgeColor: '#92400E',
    title: 'Add property ownership',
    subtitle: (propName) => <>Upload your ownership documents for <strong style={{ color: C.textPrimary }}>{propName}</strong>. Your details are pre-filled from your existing profile.</>,
    phoneLocked: true,
    showPassword: false,
    addrEditable: true,
    occupationLocked: false,
    allFieldsLocked: false,
    requiresOtp: false,
    ctaLabel: 'Verify & Submit',
    stepperSteps: ['Registration', 'Done'],
  },
};

// ─── Stepper ──────────────────────────────────
function Stepper({ step, scenario }) {
  const cfg   = SCENARIO_CONFIG[scenario] || SCENARIO_CONFIG.NEW_USER;
  const steps = cfg.stepperSteps;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0 12px', borderBottom: `1px solid rgba(0,0,0,0.06)`, flexShrink: 0 }}>
      {steps.map((label, i) => {
        const idx    = i + 1;
        const active = idx === step;
        const done   = idx < step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? C.green : active ? C.primary : 'rgba(0,0,0,0.06)',
                border: active ? `2px solid ${C.primary}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: F.body,
                color: (done || active) ? C.white : C.textTertiary,
                transition: 'all 0.2s',
              }}>
                {done ? <Icon d={ICONS.check} size={13} color={C.white} /> : idx}
              </div>
              <span style={{
                fontFamily: F.body, fontSize: 10, fontWeight: active ? 700 : 400,
                color: done ? C.green : active ? C.primary : C.textTertiary,
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 48, height: 1.5,
                background: done ? C.green : 'rgba(0,0,0,0.08)',
                margin: '0 6px', marginBottom: 14,
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Error Screen ─────────────────────────────
function ErrorScreen({ type, invite }) {
  const configs = {
    TOKEN_INVALID: {
      icon: ICONS.link, iconBg: '#FEF2F2', iconBorder: '#FECACA', iconColor: C.danger,
      title: 'Invalid invite link',
      message: "This invite link doesn't exist or has been removed. Please contact your property manager for a new invite.",
    },
    TOKEN_EXPIRED: {
      icon: ICONS.clock, iconBg: '#FEF3C7', iconBorder: '#FCD34D', iconColor: '#B45309',
      title: 'Invite link expired',
      message: `This invite link has expired${invite?.expires_at ? ` on ${new Date(invite.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}. Please ask your property manager to send a new invite.`,
    },
    TOKEN_ALREADY_USED: {
      icon: ICONS.check, iconBg: '#F0FDF4', iconBorder: '#BBF7D0', iconColor: C.green,
      title: 'Already submitted',
      message: "This invite has already been submitted and is under review. You'll receive an email once your PM approves your application.",
      cta: true,
    },
  };
  const cfg = configs[type] || configs.TOKEN_INVALID;
  return (
    <div style={{ ...dotGridBg, minHeight: '100vh' }}>
      <div style={{ background: C.white, borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.18)', width: 440, padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.home} size={14} color={C.white} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.primary }}>UrbanNest</span>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: cfg.iconBg, border: `1px solid ${cfg.iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon d={cfg.icon} size={24} color={cfg.iconColor} />
        </div>
        <h2 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: '0 0 10px' }}>{cfg.title}</h2>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, margin: '0 0 28px' }}>{cfg.message}</p>
        {cfg.cta && (
          <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 42, padding: '0 28px', borderRadius: 8, background: C.primary, color: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Log in to UrbanNest
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Password Strength ────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score  = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', C.danger, '#B45309', '#2563EB', C.green];
  return (
    <div style={{ marginTop: 5, marginBottom: 2 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : 'rgba(0,0,0,0.08)', transition: 'background 0.2s' }} />
        ))}
      </div>
      <p style={{ fontFamily: F.body, fontSize: 10, color: colors[score], margin: 0, fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
}

// ─── Locked field ─────────────────────────────
function LockedField({ label, value, icon }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={fieldLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input value={value || ''} readOnly style={{ ...inputBase(false, true, true), paddingLeft: icon ? 36 : 12 }} />
        {icon && (
          <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
            <Icon d={icon} size={13} color={C.textTertiary} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Document Upload Row ──────────────────────
function DocRow({ doc, file, onUpload, onRemove }) {
  const deviceRef = useRef();
  const cameraRef = useRef();
  const uploaded  = Boolean(file);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8,
      border: `1px solid ${uploaded ? '#BBF7D0' : 'rgba(0,0,0,0.06)'}`,
      background: uploaded ? '#F0FDF4' : '#FAFBFC',
      marginBottom: 8, transition: 'all 0.2s',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0, background: uploaded ? 'rgba(22,163,74,0.12)' : 'rgba(0,45,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon d={uploaded ? ICONS.check : ICONS.upload} size={14} color={uploaded ? C.green : C.primary} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{doc.name}</div>
        <div style={{ fontFamily: F.body, fontSize: 10, color: C.textTertiary }}>
          {uploaded ? file.name : `${doc.is_required ? 'Required' : 'Optional'} · PDF, JPG, PNG · Max 10MB`}
        </div>
      </div>
      {uploaded ? (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <Icon d={ICONS.trash} size={14} color={C.danger} />
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => deviceRef.current?.click()} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: `1px solid rgba(0,45,91,0.15)`, background: 'rgba(0,45,91,0.06)', fontFamily: F.body, fontSize: 10, fontWeight: 600, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon d={ICONS.laptop} size={11} color={C.primary} /> Device
          </button>
          <button onClick={() => cameraRef.current?.click()} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: `1px solid rgba(0,45,91,0.15)`, background: 'rgba(0,45,91,0.06)', fontFamily: F.body, fontSize: 10, fontWeight: 600, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon d={ICONS.camera} size={11} color={C.primary} /> Camera
          </button>
        </div>
      )}
      <input ref={deviceRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => e.target.files[0] && onUpload(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files[0] && onUpload(e.target.files[0])} />
    </div>
  );
}

// ─── OTP Input ────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');
  function handleKey(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }
  function handleChange(i, e) {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = v;
    const joined = next.join('').slice(0, 6);
    onChange(joined);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  }
  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  }
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 46, height: 54, textAlign: 'center',
            fontFamily: F.body, fontSize: 22, fontWeight: 700,
            color: digits[i] ? C.primary : C.textPrimary,
            background: digits[i] ? 'rgba(0,45,91,0.04)' : '#FAFBFC',
            border: `1.5px solid ${digits[i] ? C.primary : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 10, outline: 'none', transition: 'all 0.15s',
          }}
        />
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────
function SectionHeader({ num, label }) {
  return (
    <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ background: 'rgba(0,45,91,0.08)', color: C.primary, borderRadius: 4, padding: '1px 7px', fontSize: 10 }}>{num}</span>
      {label}
    </div>
  );
}

// ─── Step 3 — Under Review ────────────────────
function Step3UnderReview({ invite, userName, scenario }) {
  const isPending  = scenario === 'PENDING_LANDLORD';
  const isLandlord = scenario === 'EXISTING_LANDLORD';
  return (
    <div style={{ padding: '32px 40px', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Icon d={ICONS.check} size={26} color={C.green} />
      </div>
      <h2 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: '0 0 8px' }}>
        {isPending ? 'Documents submitted!' : 'Details submitted!'}
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
        {isPending
          ? <>Hi {userName}, your ownership documents for <strong style={{ color: C.primary }}>{invite?.property_name}</strong> have been submitted. Your PM will review and verify the ownership.</>
          : isLandlord
            ? <>Hi {userName}, your ownership application for <strong style={{ color: C.primary }}>{invite?.property_name}</strong> has been submitted. Your PM will review the documents.</>
            : <>Hi {userName}, your ownership details for <strong style={{ color: C.primary }}>{invite?.property_name}</strong> have been submitted. Your property manager will review and verify your application.</>
        }
      </p>

      {/* Summary */}
      <div style={{ background: '#FAFBFC', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Ownership summary</div>
        {[
          { label: 'Property', value: invite?.property_name },
          { label: 'Address',  value: invite?.property_address },
          invite?.unit_number && { label: 'Unit', value: `Unit ${invite.unit_number}` },
          { label: 'Role',     value: invite?.ownership_role?.replace(/_/g, ' ') },
          { label: 'Equity',   value: invite?.equity_pct ? `${invite.equity_pct}%` : '—' },
          { label: 'Status',   value: 'Under Review', valueColor: '#B45309' },
        ].filter(Boolean).map(({ label, value, valueColor }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary }}>{label}</span>
            <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: valueColor || C.textPrimary }}>{value}</span>
          </div>
        ))}
      </div>

      {/* What's next */}
      <div style={{ background: '#FAFBFC', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
        <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>What's next</div>
        {[
          { icon: ICONS.clock,    color: '#B45309', tag: 'Pending PM review',  text: 'Your PM will verify your documents and approve your ownership application.' },
          { icon: ICONS.mail,     color: C.primary, tag: 'Email notification', text: "You'll receive an email once your application is approved or if more info is needed." },
          { icon: ICONS.building, color: C.primary, tag: 'After approval',
            text: (isPending || isLandlord)
              ? 'The property will be added to your Owner Portal portfolio.'
              : 'Your Owner Portal will unlock — view property details, income reports, and set up your bank account.'
          },
        ].map(({ icon, color, tag, text }) => (
          <div key={tag} style={{ display: 'flex', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <Icon d={icon} size={16} color={color} style={{ marginTop: 2 }} />
            <div>
              <div style={{ display: 'inline-block', fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.primary, background: 'rgba(0,45,91,0.08)', borderRadius: 4, padding: '1px 6px', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tag}</div>
              <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginBottom: 12 }}>
        Download UrbanNest to track your application status
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {[
          { label: 'App Store',   icon: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z' },
          { label: 'Google Play', icon: 'M3 3l18 9-18 9V3z' },
        ].map(({ label, icon }) => (
          <button key={label} style={{ height: 42, padding: '0 20px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', background: C.white, fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={C.textPrimary}><path d={icon} /></svg>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────
export default function VerifyOwnershipPage() {
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token');

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [errorType, setErrorType]         = useState(null);
  const [invite, setInvite]               = useState(null);
  const [scenario, setScenario]           = useState(null);
  const [existingUser, setExistingUser]   = useState(null);
  const [step, setStep]                   = useState(1);

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', occupation: '',
    password: '', confirmPassword: '',
    street1: '', street2: '', city: '', state: '', zipCode: '', country: 'United States',
  });
  const [showPw, setShowPw]         = useState(false);
  const [showCPw, setShowCPw]       = useState(false);
  const [docFiles, setDocFiles]     = useState({});
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState('');
  const [otp, setOtp]               = useState('');
  const [otpError, setOtpError]     = useState('');
  const [resending, setResending]   = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [userName, setUserName]     = useState('');

  useEffect(() => {
    if (!token) { setErrorType('TOKEN_INVALID'); setLoadingInvite(false); return; }
    fetch(`${API}/invites/verify/?token=${token}`)
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) { setErrorType(data.error || 'TOKEN_INVALID'); setInvite(data); }
        else {
          setInvite(data);
          setScenario(data.scenario);
          const eu = data.existing_user;
          if (eu) {
            setForm(prev => ({
              ...prev,
              firstName:  eu.first_name  || '',
              lastName:   eu.last_name   || '',
              phone:      eu.phone       || '',
              occupation: eu.occupation  || '',
              street1:    eu.street1     || '',
              street2:    eu.street2     || '',
              city:       eu.city        || '',
              state:      eu.state       || '',
              zipCode:    eu.zip_code    || '',
              country:    eu.country     || 'United States',
            }));
            setExistingUser(eu);
          }
        }
      })
      .catch(() => setErrorType('TOKEN_INVALID'))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  if (loadingInvite) {
    return (
      <div style={{ ...dotGridBg, minHeight: '100vh' }}>
        <div style={{ background: C.white, borderRadius: 16, padding: '48px 40px', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.12)' }}>
          <div style={{ width: 32, height: 32, border: `2px solid rgba(0,45,91,0.15)`, borderTopColor: C.primary, borderRadius: '50%', animation: 'un-spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: 0 }}>Verifying your invite link…</p>
        </div>
      </div>
    );
  }

  if (errorType) return <ErrorScreen type={errorType} invite={invite} />;

  const cfg        = SCENARIO_CONFIG[scenario] || SCENARIO_CONFIG.NEW_USER;
  const isNew      = scenario === 'NEW_USER';
  const isPending  = scenario === 'PENDING_LANDLORD';
  const doneStep   = cfg.stepperSteps.length; // last step index

  async function handleStep1Submit() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.phone.trim())     e.phone     = 'Required';
    if (isNew) {
      if (!form.password)                    e.password        = 'Required';
      else if (form.password.length < 8)     e.password        = 'Min 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSubmitting(true);
    setApiError('');

    try {
      const body = { token };
      // Only send editable fields — locked fields come from existing user on backend
      if (isNew) {
        body.first_name = form.firstName.trim();
        body.last_name  = form.lastName.trim();
        body.phone      = form.phone.trim();
        body.password   = form.password;
      }
      if (!isPending) {
        // PENDING_LANDLORD — don't send any profile fields, docs only
        body.occupation = form.occupation.trim();
        body.street1    = form.street1.trim();
        body.street2    = form.street2.trim();
        body.city       = form.city.trim();
        body.state      = form.state.trim();
        body.zip_code   = form.zipCode.trim();
        body.country    = form.country.trim();
      }

      const res  = await fetch(`${API}/invites/accept/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message || 'Something went wrong. Please try again.'); return; }

      setUserName(form.firstName.trim() || existingUser?.first_name || '');

      if (data.requires_otp) {
        setStep(2);
      } else {
        if (data.tokens?.access) {
          localStorage.setItem('access_token',  data.tokens.access);
          localStorage.setItem('refresh_token', data.tokens.refresh);
        }
        setStep(doneStep);
      }
    } catch {
      setApiError('Unable to connect. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit() {
    if (otp.length < 6) { setOtpError('Please enter the full 6-digit code.'); return; }
    setOtpError('');
    setVerifying(true);
    try {
      const res  = await fetch(`${API}/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invite.owner_email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.detail || data.message || 'Incorrect code. Please try again.'); return; }
      localStorage.setItem('access_token',  data.tokens?.access  || data.access);
      localStorage.setItem('refresh_token', data.tokens?.refresh || data.refresh);
      setStep(doneStep);
    } catch {
      setOtpError('Unable to connect. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await fetch(`${API}/invites/accept/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, first_name: form.firstName, last_name: form.lastName, phone: form.phone, password: form.password }),
      });
    } finally { setResending(false); setOtp(''); setOtpError(''); }
  }

  const set = field => e => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes un-spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${C.textTertiary}; font-family: ${F.body}; }
        input:focus { background: ${C.white} !important; border-color: ${C.primary} !important; outline: none; }
      `}</style>

      <div style={{ ...dotGridBg, minHeight: '100vh', alignItems: 'center' }}>
        <div style={{ width: '75vw', maxWidth: 1000, background: C.white, borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', maxHeight: '90vh' }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ width: 300, minWidth: 300, flexShrink: 0, background: C.heroBg, padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={ICONS.home} size={14} color={C.white} />
                </div>
                <div>
                  <div style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: C.white, lineHeight: 1 }}>UrbanNest</div>
                  <div style={{ fontFamily: F.body, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</div>
                </div>
              </div>
              <h2 style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: C.white, lineHeight: 1.35, margin: '0 0 12px' }}>Verify your ownership</h2>
              <p style={{ fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 20px' }}>
                Complete your registration to claim your ownership stake and access your Owner Portal once approved.
              </p>

              {/* Invite card */}
              {invite && (
                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your invite</div>
                  <div style={{ fontFamily: F.headline, fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 3 }}>{invite.property_name}</div>
                  {invite.unit_number && <div style={{ fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>Unit {invite.unit_number}</div>}
                  <div style={{ fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>{invite.property_address}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[invite.ownership_role?.replace(/_/g, ' '), invite.equity_pct ? `${invite.equity_pct}%` : null].filter(Boolean).map(tag => (
                      <span key={tag} style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust badges */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
                {[
                  { icon: ICONS.shield,    label: 'Secure',   sub: 'Military-grade encryption' },
                  { icon: ICONS.db,        label: 'Vault',    sub: 'Data safely stored' },
                  { icon: ICONS.cert,      label: 'Verified', sub: 'Audited processes' },
                ].map(({ icon, label, sub }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon d={icon} size={13} color="rgba(255,255,255,0.6)" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{label}</div>
                      <div style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.6 }}>© 2026 UrbanNest. All rights reserved.</p>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <Stepper step={step} scenario={scenario} />

            <div style={{ flex: 1, overflowY: 'auto', padding: step === doneStep ? '0' : '28px 40px 32px', minHeight: 0 }}>

              {/* ══ STEP 1 — Registration ══ */}
              {step === 1 && (
                <div style={{ maxWidth: 480 }}>
                  {/* Title + scenario badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <h1 style={{ fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.primary, margin: 0 }}>{cfg.title}</h1>
                    <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 4, background: cfg.badgeBg, color: cfg.badgeColor, flexShrink: 0, marginTop: 4 }}>
                      {cfg.badgeLabel}
                    </span>
                  </div>
                  <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
                    {cfg.subtitle(invite?.property_name)}
                  </p>

                  {/* PENDING_LANDLORD info banner */}
                  {isPending && (
                    <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Icon d={ICONS.hourglass} size={15} color="#92400E" style={{ marginTop: 1 }} />
                      <div>
                        <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>Landlord application under review</div>
                        <div style={{ fontFamily: F.body, fontSize: 11, color: '#92400E', lineHeight: 1.5 }}>Your profile details are locked while your application is pending PM approval. You can still upload ownership documents for this property.</div>
                      </div>
                    </div>
                  )}

                  {apiError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: F.body, fontSize: 12, color: C.danger, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon d={ICONS.alert} size={14} color={C.danger} />
                      {apiError}
                    </div>
                  )}

                  {/* ── Section 01: Personal details ── */}
                  <SectionHeader num="01" label="Personal details" />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={fieldLabel}>First name</label>
                      <input value={form.firstName} readOnly style={inputBase(false, true, true)} />
                    </div>
                    <div>
                      <label style={fieldLabel}>Last name</label>
                      <input value={form.lastName} readOnly style={inputBase(false, true, true)} />
                    </div>
                  </div>

                  <LockedField label="Email address" value={invite?.owner_email} icon={ICONS.lock} />
                  <p style={{ fontFamily: F.body, fontSize: 10, color: C.textTertiary, margin: '-8px 0 12px' }}>Pre-filled from your invite — cannot be changed</p>

                  {/* Phone */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={fieldLabel}>Phone number *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        value={form.phone}
                        onChange={cfg.phoneLocked ? undefined : set('phone')}
                        readOnly={cfg.phoneLocked}
                        placeholder={cfg.phoneLocked ? '' : '+1 555 000 0000'}
                        style={{ ...inputBase(errors.phone, form.phone, cfg.phoneLocked), paddingLeft: 36 }}
                      />
                      <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
                        <Icon d={ICONS.phone} size={13} color={C.textTertiary} />
                      </div>
                    </div>
                    {errors.phone
                      ? <p style={{ fontFamily: F.body, fontSize: 11, color: C.danger, margin: '3px 0 0' }}>{errors.phone}</p>
                      : isNew && <p style={{ fontFamily: F.body, fontSize: 10, color: C.textTertiary, margin: '3px 0 0' }}>Include country code — used for OTP</p>
                    }
                  </div>

                  {/* Occupation */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={fieldLabel}>Occupation <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: C.textTertiary }}>(optional)</span></label>
                    <input
                      value={form.occupation}
                      onChange={cfg.occupationLocked ? undefined : set('occupation')}
                      readOnly={cfg.occupationLocked}
                      placeholder={cfg.occupationLocked ? '' : 'e.g. Architect, Developer, Investor'}
                      style={inputBase(false, form.occupation, cfg.occupationLocked)}
                    />
                  </div>

                  {/* Password — NEW_USER only */}
                  {cfg.showPassword && (
                    <>
                      <div style={{ marginBottom: 4 }}>
                        <label style={fieldLabel}>Password *</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 8 characters" style={{ ...inputBase(errors.password, form.password), paddingRight: 40 }} />
                          <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Icon d={showPw ? ICONS.eyeClose : ICONS.eyeOpen} size={15} color={C.textTertiary} />
                          </button>
                        </div>
                        <PasswordStrength password={form.password} />
                        {errors.password && <p style={{ fontFamily: F.body, fontSize: 11, color: C.danger, margin: '2px 0 0' }}>{errors.password}</p>}
                      </div>
                      <div style={{ marginBottom: 24 }}>
                        <label style={fieldLabel}>Confirm password *</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showCPw ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" style={{ ...inputBase(errors.confirmPassword, form.confirmPassword), paddingRight: 40 }} />
                          <button type="button" onClick={() => setShowCPw(p => !p)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Icon d={showCPw ? ICONS.eyeClose : ICONS.eyeOpen} size={15} color={C.textTertiary} />
                          </button>
                        </div>
                        {errors.confirmPassword && <p style={{ fontFamily: F.body, fontSize: 11, color: C.danger, margin: '3px 0 0' }}>{errors.confirmPassword}</p>}
                      </div>
                    </>
                  )}

                  {/* ── Section 02: Address ── */}
                  <SectionHeader num="02" label="Residential address" />

                  {isPending ? (
                    // PENDING_LANDLORD — all address fields locked
                    <>
                      <LockedField label="Street address 01" value={form.street1} />
                      {form.street2 && <LockedField label="Street address 02" value={form.street2} />}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <LockedField label="City" value={form.city} />
                        <LockedField label="State" value={form.state} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <LockedField label="Zip code" value={form.zipCode} />
                        <LockedField label="Country" value={form.country} />
                      </div>
                    </>
                  ) : (
                    // All other scenarios — editable address
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <label style={fieldLabel}>Street address 01 *</label>
                        <input value={form.street1} onChange={set('street1')} placeholder="Property number, street name" style={inputBase(errors.street1, form.street1)} />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={fieldLabel}>Street address 02 <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: C.textTertiary }}>(optional)</span></label>
                        <input value={form.street2} onChange={set('street2')} placeholder="Suite, floor, or apartment" style={inputBase(false, form.street2)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div><label style={fieldLabel}>City *</label><input value={form.city} onChange={set('city')} placeholder="City" style={inputBase(errors.city, form.city)} /></div>
                        <div><label style={fieldLabel}>State *</label><input value={form.state} onChange={set('state')} placeholder="State" style={inputBase(errors.state, form.state)} /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <div><label style={fieldLabel}>Zip code *</label><input value={form.zipCode} onChange={set('zipCode')} placeholder="000000" style={inputBase(errors.zipCode, form.zipCode)} /></div>
                        <div><label style={fieldLabel}>Country</label><input value={form.country} onChange={set('country')} style={inputBase(false, true)} /></div>
                      </div>
                    </>
                  )}

                  {/* ── Section 03: Documents ── */}
                  <SectionHeader num="03" label="Ownership documents" />
                  <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>
                    {isPending
                      ? 'Upload documents to verify your ownership of this specific property. Your existing profile will be used for this application.'
                      : 'Upload documents required by your property manager. Accepted: PDF, JPG, PNG · Max 10MB each.'
                    }
                  </p>

                  {[
                    { id: 1, name: 'Government ID / Driving License', is_required: true },
                    { id: 2, name: 'Passport',                        is_required: false },
                    { id: 3, name: 'Property Ownership Proof',        is_required: true },
                  ].map(doc => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      file={docFiles[doc.id]}
                      onUpload={file => setDocFiles(p => ({ ...p, [doc.id]: file }))}
                      onRemove={() => setDocFiles(p => { const n = { ...p }; delete n[doc.id]; return n; })}
                    />
                  ))}

                  {/* CTA */}
                  <button onClick={handleStep1Submit} disabled={submitting} style={{
                    width: '100%', height: 46, borderRadius: 8,
                    background: submitting ? C.textTertiary : C.primary,
                    color: C.white, border: 'none',
                    fontFamily: F.body, fontSize: 13, fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 24, transition: 'background 0.15s',
                  }}>
                    {submitting
                      ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, borderRadius: '50%', animation: 'un-spin 0.7s linear infinite' }} />Submitting…</>
                      : <>{cfg.ctaLabel} <Icon d={ICONS.arrow} size={16} color={C.white} /></>
                    }
                  </button>
                </div>
              )}

              {/* ══ STEP 2 — OTP (NEW_USER only) ══ */}
              {step === 2 && isNew && (
                <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', paddingTop: 8 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,45,91,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Icon d={ICONS.mail} size={26} color={C.primary} />
                  </div>
                  <h1 style={{ fontFamily: F.headline, fontSize: 24, fontWeight: 700, color: C.primary, margin: '0 0 8px' }}>Check your email</h1>
                  <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 4px', lineHeight: 1.6 }}>We sent a 6-digit verification code to</p>
                  <p style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: '0 0 4px' }}>{invite?.owner_email}</p>

                  <OtpInput value={otp} onChange={v => { setOtp(v); if (otpError) setOtpError(''); }} />

                  {otpError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: F.body, fontSize: 12, color: C.danger, textAlign: 'left', display: 'flex', gap: 8 }}>
                      <Icon d={ICONS.alert} size={14} color={C.danger} />
                      {otpError}
                    </div>
                  )}

                  <button onClick={handleOtpSubmit} disabled={verifying || otp.length < 6} style={{
                    width: '100%', height: 46, borderRadius: 8,
                    background: (verifying || otp.length < 6) ? C.textTertiary : C.primary,
                    color: C.white, border: 'none',
                    fontFamily: F.body, fontSize: 13, fontWeight: 700,
                    cursor: (verifying || otp.length < 6) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginBottom: 14, transition: 'background 0.15s',
                  }}>
                    {verifying
                      ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, borderRadius: '50%', animation: 'un-spin 0.7s linear infinite' }} />Verifying…</>
                      : <><Icon d={ICONS.check} size={16} color={C.white} /> Verify & complete registration</>
                    }
                  </button>

                  <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '0 0 20px' }}>
                    Didn't receive it?{' '}
                    <button onClick={handleResend} disabled={resending} style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {resending ? 'Sending…' : 'Resend code'}
                    </button>
                  </p>

                  <div style={{ background: '#FAFBFC', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', padding: '14px 16px', textAlign: 'left', marginBottom: 20 }}>
                    <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Registration summary</div>
                    {[
                      { label: 'Name',     value: `${form.firstName} ${form.lastName}` },
                      { label: 'Email',    value: invite?.owner_email },
                      { label: 'Property', value: invite?.property_name },
                      { label: 'Docs',     value: `${Object.keys(docFiles).length} uploaded` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <span style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary }}>{label}</span>
                        <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                    <Icon d={ICONS.arrowL} size={13} color={C.textSecondary} />
                    Back to registration
                  </button>
                </div>
              )}

              {/* ══ DONE SCREEN ══ */}
              {step === doneStep && <Step3UnderReview invite={invite} userName={userName} scenario={scenario} />}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
