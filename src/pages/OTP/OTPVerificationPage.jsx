import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8001";

const COLORS = {
  primary:      '#002D5B',
  secondary:    '#064E3B',
  neutral:      '#F1F5F9',
  pageBg:       '#F0F2F5',
  heroBg:       '#001f3f',
  border:       '#E2E8F0',
  borderMedium: '#CBD5E1',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  danger:       '#E53E3E',
  dangerLight:  '#FEF2F2',
  dangerBorder: '#FECACA',
  success:      '#16A34A',
  successLight: '#F0FDF4',
  successBorder:'#BBF7D0',
  white:        '#FFFFFF',
};

const FONTS = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const ICONS = {
  mail:   "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  phone:  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  check:  "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3",
  refresh:"M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  arrow:  "M5 12h14M12 5l7 7-7 7",
  back:   "M19 12H5M12 19l-7-7 7-7",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

function SvgIcon({ d, size = 16, color = COLORS.textTertiary, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `+*** ***-***-${digits.slice(-4)}`;
}

function useCountdown(seconds) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [active,   setActive]   = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(intervalRef.current); setActive(false); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const reset = () => { setTimeLeft(seconds); setActive(true); };
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  return { timeLeft, formatted: `${mm}:${ss}`, expired: !active && timeLeft === 0, reset };
}

function OtpBoxes({ value, onChange, disabled, hasError, verified }) {
  const refs = useRef([]);

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length === 6) {
      onChange(raw.split(''));
      refs.current[5]?.focus();
      return;
    }
    const digit = raw.slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) { refs.current[i - 1]?.focus(); }
      else {
        const next = [...value]; next[i] = '';
        onChange(next);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = Array(6).fill('');
      pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
      onChange(next);
      const focusIdx = Math.min(pasted.length, 5);
      refs.current[focusIdx]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled || verified}
          style={{
            width: 44, height: 52, textAlign: 'center',
            fontFamily: FONTS.body, fontSize: 22, fontWeight: 700,
            color: verified ? COLORS.success : hasError ? COLORS.danger : COLORS.textPrimary,
            background: verified ? COLORS.successLight : hasError ? COLORS.dangerLight : digit ? COLORS.white : COLORS.neutral,
            border: `2px solid ${
              verified ? COLORS.successBorder :
              hasError  ? COLORS.dangerBorder  :
              digit     ? COLORS.primary       :
              COLORS.border
            }`,
            borderRadius: 10, outline: 'none',
            cursor: disabled || verified ? 'default' : 'text',
            transition: 'all 0.15s',
            boxShadow: digit && !verified && !hasError ? '0 0 0 3px rgba(0,45,91,0.08)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

function OtpSection({ type, icon, label, maskedId, value, onChange,
  verified, error, timer, onResend, resending }) {

  const sectionBg  = verified ? COLORS.successLight : error ? COLORS.dangerLight : COLORS.white;
  const borderColor= verified ? COLORS.successBorder : error ? COLORS.dangerBorder : COLORS.border;
  const iconBg     = verified ? '#DCFCE7' : error ? '#FEE2E2' : COLORS.neutral;
  const iconColor  = verified ? COLORS.success : error ? COLORS.danger : COLORS.primary;

  return (
    <div style={{
      flex: 1, background: sectionBg,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 14, padding: '28px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 0, transition: 'all 0.2s',
    }}>
      {/* icon */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        {verified
          ? <SvgIcon d={ICONS.check} size={22} color={COLORS.success} />
          : <SvgIcon d={icon} size={20} color={iconColor} />
        }
      </div>

      {/* label */}
      <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
        {label}
      </p>

      {/* masked id */}
      <p style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 20px', textAlign: 'center' }}>
        {maskedId}
      </p>

      {/* OTP boxes */}
      <div style={{ marginBottom: 16, width: '100%' }}>
        <OtpBoxes value={value} onChange={onChange} verified={verified} hasError={!!error} />
      </div>

      {/* status row */}
      {verified ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SvgIcon d={ICONS.check} size={14} color={COLORS.success} />
          <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 700, color: COLORS.success }}>
            {label.split(' ')[0]} Verified
          </span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.danger, fontWeight: 600, margin: '0 0 6px' }}>
            {error}
          </p>
          {timer.expired ? (
            <button onClick={onResend} disabled={resending} style={{
              fontFamily: FONTS.body, fontSize: 12, fontWeight: 700,
              color: COLORS.primary, background: 'none', border: 'none',
              cursor: resending ? 'not-allowed' : 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto',
            }}>
              <SvgIcon d={ICONS.refresh} size={12} color={COLORS.primary} />
              {resending ? 'Sending…' : 'Resend Code'}
            </button>
          ) : (
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textTertiary, margin: 0 }}>
              Resend in <span style={{ fontWeight: 700, color: COLORS.textSecondary }}>{timer.formatted}</span>
            </p>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          {timer.expired ? (
            <button onClick={onResend} disabled={resending} style={{
              fontFamily: FONTS.body, fontSize: 12, fontWeight: 700,
              color: COLORS.primary, background: 'none', border: 'none',
              cursor: resending ? 'not-allowed' : 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto',
            }}>
              <SvgIcon d={ICONS.refresh} size={12} color={COLORS.primary} />
              {resending ? 'Sending…' : 'Resend Code'}
            </button>
          ) : (
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textTertiary, margin: 0 }}>
              Code expires in <span style={{ fontWeight: 700, color: COLORS.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{timer.formatted}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OTPVerificationPage({ email, phone, onVerified, onBack }) {
  const EXPIRY = 600;

  const [emailOtp,      setEmailOtp]      = useState(['','','','','','']);
  const [phoneOtp,      setPhoneOtp]      = useState(['','','','','','']);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailError,    setEmailError]    = useState('');
  const [phoneError,    setPhoneError]    = useState('');
  const [loading,       setLoading]       = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendingPhone, setResendingPhone] = useState(false);

  const emailTimer = useCountdown(EXPIRY);
  const phoneTimer = useCountdown(EXPIRY);

  const emailCode    = emailOtp.join('');
  const phoneCode    = phoneOtp.join('');
  const emailReady   = emailCode.length === 6 && !emailOtp.includes('');
  const phoneReady   = phoneCode.length === 6 && !phoneOtp.includes('');
  const canSubmit    = (emailReady || emailVerified) && (phoneReady || phoneVerified) && !loading;
  const bothVerified = emailVerified && phoneVerified;

  // Auto-navigate when both verified
  useEffect(() => {
    if (bothVerified) {
      const t = setTimeout(() => { if (onVerified) onVerified(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [bothVerified]);

  async function callVerifyOtp(type, identifier, code) {
    const body = type === 'EMAIL'
      ? { email: identifier, code, otp_type: 'EMAIL' }
      : { phone: identifier, code, otp_type: 'PHONE' };
    const res  = await fetch(`${API_BASE}/api/auth/verify-otp/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  async function handleVerify() {
    if (!canSubmit) return;
    setLoading(true);

    const tasks = [];
    if (!emailVerified && emailReady) tasks.push({ type: 'EMAIL', identifier: email, code: emailCode });
    if (!phoneVerified && phoneReady) tasks.push({ type: 'PHONE', identifier: phone, code: phoneCode });

    for (const task of tasks) {
      try {
        const { ok, data } = await callVerifyOtp(task.type, task.identifier, task.code);
        if (ok) {
          // Store tokens if returned
          const tokens = data.tokens || data;
          if (tokens.access)  localStorage.setItem('access_token',  tokens.access);
          if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh);
          if (task.type === 'EMAIL') { setEmailVerified(true); setEmailError(''); }
          else                       { setPhoneVerified(true); setPhoneError(''); }
        } else {
          const msg = data.detail || data.non_field_errors?.[0] || 'Incorrect code. Please try again.';
          if (task.type === 'EMAIL') { setEmailError(msg); setEmailOtp(['','','','','','']); }
          else                       { setPhoneError(msg); setPhoneOtp(['','','','','','']); }
        }
      } catch {
        const msg = 'Connection error. Please try again.';
        if (task.type === 'EMAIL') setEmailError(msg);
        else                       setPhoneError(msg);
      }
    }

    setLoading(false);
  }

  async function handleResend(type) {
    if (type === 'EMAIL') setResendingEmail(true);
    else                  setResendingPhone(true);
    try {
      await fetch(`${API_BASE}/api/auth/register/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, resend: true }),
      });
      if (type === 'EMAIL') { emailTimer.reset(); setEmailOtp(['','','','','','']); setEmailError(''); }
      else                  { phoneTimer.reset(); setPhoneOtp(['','','','','','']); setPhoneError(''); }
    } catch { /* silent */ }
    finally {
      if (type === 'EMAIL') setResendingEmail(false);
      else                  setResendingPhone(false);
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* backdrop */}
      <div style={{
        minHeight: '100vh', width: '100%',
        background: `${COLORS.pageBg} radial-gradient(circle, ${COLORS.borderMedium} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', boxSizing: 'border-box',
      }}>
        {/* modal */}
        <div style={{
          width: '75vw', maxWidth: 860,
          background: COLORS.white, borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}>

          {/* top bar */}
          <div style={{
            background: COLORS.heroBg, padding: '20px 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(44,123,229,0.15) 0%, transparent 60%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SvgIcon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" size={14} color={COLORS.white} />
              </div>
              <div>
                <div style={{ fontFamily: FONTS.headline, fontSize: 14, fontWeight: 700, color: COLORS.white, lineHeight: 1 }}>UrbanNest</div>
                <div style={{ fontFamily: FONTS.body, fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SvgIcon d={ICONS.shield} size={14} color='rgba(255,255,255,0.5)' />
              <span style={{ fontFamily: FONTS.body, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Secure Verification</span>
            </div>
          </div>

          {/* content */}
          <div style={{ padding: '40px 48px 44px' }}>

            {/* heading */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 700, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
                Step 2 of 2 — Verification
              </p>
              <h1 style={{ fontFamily: FONTS.headline, fontSize: 28, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 10px' }}>
                Verify your identity
              </h1>
              <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, margin: 0, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                We've sent 6-digit verification codes to your email and phone number. Enter both codes below to activate your account.
              </p>
            </div>

            {/* success banner */}
            {bothVerified && (
              <div style={{
                background: COLORS.successLight, border: `1.5px solid ${COLORS.successBorder}`,
                borderRadius: 10, padding: '14px 20px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <SvgIcon d={ICONS.check} size={18} color={COLORS.success} />
                <div>
                  <p style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, color: COLORS.success, margin: 0 }}>
                    Account verified successfully!
                  </p>
                  <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.success, margin: '2px 0 0', opacity: 0.8 }}>
                    Redirecting you to your account…
                  </p>
                </div>
              </div>
            )}

            {/* two OTP columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              <OtpSection
                type="EMAIL"
                icon={ICONS.mail}
                label="Email OTP"
                maskedId={maskEmail(email)}
                value={emailOtp}
                onChange={v => { setEmailOtp(v); if (emailError) setEmailError(''); }}
                verified={emailVerified}
                error={emailError}
                timer={emailTimer}
                onResend={() => handleResend('EMAIL')}
                resending={resendingEmail}
              />
              <OtpSection
                type="PHONE"
                icon={ICONS.phone}
                label="Phone OTP"
                maskedId={maskPhone(phone)}
                value={phoneOtp}
                onChange={v => { setPhoneOtp(v); if (phoneError) setPhoneError(''); }}
                verified={phoneVerified}
                error={phoneError}
                timer={phoneTimer}
                onResend={() => handleResend('PHONE')}
                resending={resendingPhone}
              />
            </div>

            {/* verify button */}
            {!bothVerified && (
              <button
                onClick={handleVerify}
                disabled={!canSubmit}
                style={{
                  width: '100%', height: 48,
                  background: canSubmit ? COLORS.primary : COLORS.borderMedium,
                  color: COLORS.white, border: 'none', borderRadius: 10,
                  fontFamily: FONTS.body, fontSize: 14, fontWeight: 700,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginBottom: 16, transition: 'background 0.15s',
                }}
              >
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: COLORS.white, borderRadius: '50%', animation: 'un-spin 0.7s linear infinite' }} />Verifying…</>
                ) : (
                  <>Verify &amp; Continue <SvgIcon d={ICONS.arrow} size={16} color={COLORS.white} /></>
                )}
              </button>
            )}

            {/* back link */}
            <div style={{ textAlign: 'center' }}>
              <button onClick={onBack} style={{
                fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0,
              }}>
                <SvgIcon d={ICONS.back} size={13} color={COLORS.textSecondary} />
                Back to Sign Up
              </button>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes un-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
