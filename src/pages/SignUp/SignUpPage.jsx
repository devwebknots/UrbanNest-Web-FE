import { useState } from "react";

const API_BASE = "http://192.168.0.64:8001";

const COLORS = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  secondary:     '#064E3B',
  tertiary:      '#B45309',
  neutral:       '#F1F5F9',
  pageBg:        '#F0F2F5',
  navBg:         '#1a2332',
  heroBg:        '#001f3f',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  danger:        '#E53E3E',
  white:         '#FFFFFF',
  success:       '#16A34A',
};

const FONTS = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

function SvgIcon({ d, size = 18, color = COLORS.textTertiary, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

function FieldLabel({ text }) {
  return (
    <label style={{
      display: 'block', fontFamily: FONTS.body, fontSize: 10, fontWeight: 700,
      color: COLORS.textSecondary, textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: 6,
    }}>{text}</label>
  );
}

const EYE_OPEN  = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0";
const EYE_CLOSE = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22";
const CHECK     = "M20 6L9 17l-5-5";
const PERSON    = "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z";
const MAIL      = "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6";
const PHONE     = "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z";
const LOCK      = "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4";
const GOOGLE    = "M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z";
const APPLE     = "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z";

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', COLORS.danger, COLORS.tertiary, '#2563EB', COLORS.success];
  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : COLORS.border,
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <p style={{ fontFamily: FONTS.body, fontSize: 10, color: colors[score], margin: 0, fontWeight: 600 }}>
        {labels[score]}
      </p>
    </div>
  );
}

export default function SignUpPage({ onNavigateToLogin, onNavigateToOTP }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms]           = useState(false);
  const [errors, setErrors]                         = useState({});
  const [loading, setLoading]                       = useState(false);
  const [apiError, setApiError]                     = useState('');

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  function validate() {
    const e = {};
    if (!form.firstName.trim())  e.firstName = 'First name is required';
    if (!form.lastName.trim())   e.lastName  = 'Last name is required';
    if (!form.email.trim())      e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone.trim())      e.phone     = 'Phone number is required';
    else if (!/^\+?[\d\s\-()]{7,}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.password)          e.password  = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword)   e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreedToTerms)          e.terms     = 'You must agree to the Terms & Conditions';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name:  form.lastName.trim(),
          email:      form.email.trim().toLowerCase(),
          phone:      form.phone.trim(),
          password:   form.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onNavigateToOTP) {
          onNavigateToOTP({ email: form.email.trim().toLowerCase(), phone: form.phone.trim() });
        }
      } else {
        if (data.email)            setErrors(prev => ({ ...prev, email: data.email[0] }));
        if (data.phone)            setErrors(prev => ({ ...prev, phone: data.phone[0] }));
        if (data.password)         setErrors(prev => ({ ...prev, password: data.password[0] }));
        if (data.detail)           setApiError(data.detail);
        if (data.non_field_errors) setApiError(data.non_field_errors[0]);
      }
    } catch {
      setApiError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError, hasValue) => ({
    width: '100%', boxSizing: 'border-box',
    height: 42, padding: '0 14px',
    fontFamily: FONTS.body, fontSize: 13, color: COLORS.textPrimary,
    background: hasValue ? COLORS.white : COLORS.neutral,
    border: `1.5px solid ${hasError ? COLORS.danger : COLORS.border}`,
    borderRadius: 8, outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  });

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
          width: '75vw', maxWidth: 960,
          background: COLORS.white, borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
          overflow: 'hidden', display: 'flex',
        }}>

          {/* LEFT PANEL */}
          <div style={{
            width: 300, minWidth: 300, flexShrink: 0,
            background: COLORS.heroBg,
            padding: '40px 36px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(44,123,229,0.15) 0%, transparent 60%)',
          }}>
            {/* logo */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SvgIcon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" size={16} color={COLORS.white} />
                </div>
                <div>
                  <div style={{ fontFamily: FONTS.headline, fontSize: 16, fontWeight: 700, color: COLORS.white, lineHeight: 1 }}>UrbanNest</div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</div>
                </div>
              </div>
              <h2 style={{ fontFamily: FONTS.headline, fontSize: 26, fontWeight: 700, color: COLORS.white, lineHeight: 1.3, margin: '0 0 14px' }}>
                Join the smarter way to manage property.
              </h2>
              <p style={{ fontFamily: FONTS.body, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>
                Create your free account and discover curated listings, seamless leasing, and a platform built for modern renters.
              </p>
            </div>

            {/* perks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: 'Free to join — no hidden fees' },
                { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",    text: 'Verified listings only' },
                { icon: "M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7", text: 'Digital lease signing' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SvgIcon d={icon} size={14} color='rgba(255,255,255,0.7)' />
                  </div>
                  <span style={{ fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{text}</span>
                </div>
              ))}
            </div>

            <p style={{ fontFamily: FONTS.body, fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 }}>
              By creating an account you agree to UrbanNest's Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* RIGHT PANEL — reduced top/bottom padding to fit everything */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 44px 28px' }}>

            {/* header */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 700, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
                Step 1 of 2 — Account Details
              </p>
              <h1 style={{ fontFamily: FONTS.headline, fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 4px' }}>
                Create your account
              </h1>
              <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, margin: 0 }}>
                Already have an account?{' '}
                <button onClick={onNavigateToLogin} style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, color: COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  Sign in
                </button>
              </p>
            </div>

            {/* api error */}
            {apiError && (
              <div style={{ background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: FONTS.body, fontSize: 12, color: COLORS.danger }}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <FieldLabel text="First Name *" />
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <SvgIcon d={PERSON} size={14} color={COLORS.textTertiary} />
                    </div>
                    <input type="text" placeholder="John" value={form.firstName} onChange={set('firstName')} autoComplete="given-name"
                      style={{ ...inputStyle(errors.firstName, form.firstName), paddingLeft: 34 }} />
                  </div>
                  {errors.firstName && <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger, margin: '3px 0 0' }}>{errors.firstName}</p>}
                </div>
                <div>
                  <FieldLabel text="Last Name *" />
                  <input type="text" placeholder="Doe" value={form.lastName} onChange={set('lastName')} autoComplete="family-name"
                    style={inputStyle(errors.lastName, form.lastName)} />
                  {errors.lastName && <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger, margin: '3px 0 0' }}>{errors.lastName}</p>}
                </div>
              </div>

              {/* email */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel text="Email Address *" />
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <SvgIcon d={MAIL} size={14} color={COLORS.textTertiary} />
                  </div>
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} autoComplete="email"
                    style={{ ...inputStyle(errors.email, form.email), paddingLeft: 34 }} />
                </div>
                {errors.email && <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger, margin: '3px 0 0' }}>{errors.email}</p>}
              </div>

              {/* phone */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel text="Phone Number *" />
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <SvgIcon d={PHONE} size={14} color={COLORS.textTertiary} />
                  </div>
                  <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} autoComplete="tel"
                    style={{ ...inputStyle(errors.phone, form.phone), paddingLeft: 34 }} />
                </div>
                {errors.phone
                  ? <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger, margin: '3px 0 0' }}>{errors.phone}</p>
                  : <p style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.textTertiary, margin: '3px 0 0' }}>Include country code — used for OTP verification</p>
                }
              </div>

              {/* password */}
              <div style={{ marginBottom: 4 }}>
                <FieldLabel text="Password *" />
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <SvgIcon d={LOCK} size={14} color={COLORS.textTertiary} />
                  </div>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} autoComplete="new-password"
                    style={{ ...inputStyle(errors.password, form.password), paddingLeft: 34, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <SvgIcon d={showPassword ? EYE_CLOSE : EYE_OPEN} size={16} color={COLORS.textTertiary} />
                  </button>
                </div>
                <PasswordStrength password={form.password} />
                {errors.password && <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger, margin: '3px 0 0' }}>{errors.password}</p>}
              </div>

              {/* confirm password */}
              <div style={{ marginBottom: 18 }}>
                <FieldLabel text="Confirm Password *" />
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <SvgIcon d={LOCK} size={14} color={COLORS.textTertiary} />
                  </div>
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password"
                    style={{ ...inputStyle(errors.confirmPassword, form.confirmPassword), paddingLeft: 34, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowConfirmPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <SvgIcon d={showConfirmPassword ? EYE_CLOSE : EYE_OPEN} size={16} color={COLORS.textTertiary} />
                  </button>
                </div>
                {form.confirmPassword && form.password && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <SvgIcon d={form.password === form.confirmPassword ? CHECK : "M18 6L6 18M6 6l12 12"} size={13}
                      color={form.password === form.confirmPassword ? COLORS.success : COLORS.danger} />
                    <span style={{ fontFamily: FONTS.body, fontSize: 10, fontWeight: 600, color: form.password === form.confirmPassword ? COLORS.success : COLORS.danger }}>
                      {form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
                {errors.confirmPassword && !form.confirmPassword && (
                  <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger, margin: '3px 0 0' }}>{errors.confirmPassword}</p>
                )}
              </div>

              {/* T&C */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <div onClick={() => { setAgreedToTerms(p => !p); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' })); }}
                    style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `1.5px solid ${errors.terms ? COLORS.danger : agreedToTerms ? COLORS.primary : COLORS.borderMedium}`, background: agreedToTerms ? COLORS.primary : COLORS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {agreedToTerms && <SvgIcon d={CHECK} size={11} color={COLORS.white} />}
                  </div>
                  <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>
                    I agree to UrbanNest's{' '}
                    <a href="#" style={{ color: COLORS.primary, fontWeight: 700, textDecoration: 'none' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" style={{ color: COLORS.primary, fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</a>
                  </span>
                </label>
                {errors.terms && <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.danger, margin: '4px 0 0 28px' }}>{errors.terms}</p>}
              </div>

              {/* submit */}
              <button type="submit" disabled={loading} style={{
                width: '100%', height: 46,
                background: loading ? COLORS.borderMedium : COLORS.primary,
                color: COLORS.white, border: 'none', borderRadius: 8,
                fontFamily: FONTS.body, fontSize: 13, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 12, transition: 'background 0.15s',
              }}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: COLORS.white, borderRadius: '50%', animation: 'un-spin 0.7s linear infinite' }} />Creating account…</>
                ) : (
                  <>Create Account <SvgIcon d="M5 12h14M12 5l7 7-7 7" size={16} color={COLORS.white} /></>
                )}
              </button>

              {/* divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                <span style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textTertiary, whiteSpace: 'nowrap' }}>or sign up with</span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>

              {/* social */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Google', icon: GOOGLE, color: '#EA4335' },
                  { label: 'Apple',  icon: APPLE,  color: '#000000' },
                ].map(({ label, icon, color }) => (
                  <button key={label} type="button" style={{
                    height: 36, background: COLORS.white,
                    border: `1px solid ${COLORS.border}`, borderRadius: 8,
                    fontFamily: FONTS.body, fontSize: 12, fontWeight: 600,
                    color: COLORS.textPrimary, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d={icon} /></svg>
                    Continue with {label}
                  </button>
                ))}
              </div>

              {/* footer */}
              <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', margin: 0 }}>
                <a href="#" style={{ color: COLORS.textTertiary, textDecoration: 'none', marginRight: 16 }}>Privacy Policy</a>
                <a href="#" style={{ color: COLORS.textTertiary, textDecoration: 'none', marginRight: 16 }}>Security</a>
                <a href="#" style={{ color: COLORS.textTertiary, textDecoration: 'none' }}>Terms of Service</a>
              </p>

            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes un-spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${COLORS.textTertiary}; }
        input:focus { background: ${COLORS.white} !important; border-color: ${COLORS.primary} !important; }
      `}</style>
    </>
  );
}
