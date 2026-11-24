// ─────────────────────────────────────────────
// UrbanNest — Sign Up Page (route: /signup)
// Design System v2 (2026-11-24, layout from Downloads/image 16 (1).png) — built exactly like the Login page:
// the shared AuthShell frame (page background, split card, villa photo · rain · leaves, card fit, page-open
// animation) with the perks listed plainly under the subtitle (no glass), and the standard v2 form on the right
// (FormField + IconField 36px · FIELD2.invalid / FIELD2.error · Checkbox · brand CTA · soft social buttons).
// The sign-up logic (validate, /api/auth/register/, error mapping, locked invitation email, OTP hand-off) is unchanged.
// ─────────────────────────────────────────────

import { useState } from "react";
import { Grid, AuthShell, AUTH, AUTH_INTRO, introAt, formIntro, GoogleLogo, AppleLogo } from '../../components/layout';
import { FormField, IconField, FIELD2, TextLink, Checkbox } from '../../components/ui';
import { C2, G2, TONES2, FS2, FW2, LH2, SP2, SZ2, T2, UI2 } from '../../constants';
import heroArt from '../../assets/landlord/signup-hero.jpg';   // night-blue sky over a lit house + trees (Downloads/image 123.png, resized to 1600px)

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api').replace(/\/api\/?$/, '');

const PERKS = [
  { icon: 'ti-bolt',         text: 'Free to join — no hidden fees' },
  { icon: 'ti-shield-check', text: 'Verified listings only' },
  { icon: 'ti-file-text',    text: 'Digital lease signing' },
];
const FOOT_LINKS = ['Privacy Policy', 'Security', 'Terms of Service'];
const FORM_GAP = SP2.md;   // row gap inside the form
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
// The photo: framed on the house (55% across); the leaves fall from its two tree crowns (fractions of the photo)
const HERO_POSITION = '55% center';
const LEAF_SOURCE = {
  ratio: 1600 / 1777,
  position: [0.55, 0.5],
  areas: [
    [0.20, 0.70, 0.40, 0.80],   // trees left of the house
    [0.80, 0.62, 1.0, 0.76],    // tree right of the house
  ],
};

const S = {
  // photo side — perks: plain rows under the subtitle (no glass, like the design)
  perks:     { ...UI2.stack(SP2.md) },
  perk:      { ...UI2.row(SP2.md) },
  perkIcon:  { ...UI2.iconBox(SZ2.icon.sm, { soft: C2.onDark.surfaceHover, strong: C2.white }) },
  perkText:  { ...UI2.text.title, color: C2.white },
  // form side
  step:      { ...UI2.pill(TONES2.primary), alignSelf: 'flex-start' },
  head:      { ...UI2.stack(SP2.sm), alignItems: 'flex-start' },
  have:      { ...UI2.row(SP2.xs), ...T2.label },
  haveLink:  { fontSize: AUTH.lead.fontSize },   // "Sign in" = same 14px (FS2.md) as the "Already have an account?" line it sits in
  form:      { ...UI2.stack(FORM_GAP) },
  pair:      { columnGap: SP2.lg, rowGap: SP2.md },          // two fields side by side
  field:     { ...UI2.stack(SP2.xs) },                        // field + its hint / error / meter
  readOnly:  { background: C2.fieldReadOnly },
  // password strength: 4 segments + label (weak = red, then the brand blue — never amber / green)
  meter:     { ...UI2.row(SP2.sm) },
  segs:      { display: 'flex', gap: SP2.xs, flex: 1 },
  seg:       (on, weak) => ({ ...UI2.progressTrack, flex: 1, background: on ? (weak ? G2.errorBar : G2.primaryBar) : C2.surfaceMuted, transition: 'background 0.2s' }),
  meterText: (weak) => ({ fontSize: FS2.xs, fontWeight: FW2.semibold, lineHeight: LH2.body, color: weak ? C2.errorDark : C2.primary }),
  match:     (ok) => ({ ...UI2.row(SP2.xs), fontSize: FS2.xs, fontWeight: FW2.semibold, lineHeight: LH2.body, color: ok ? C2.primary : C2.errorDark }),
  terms:     { ...UI2.row(SP2.sm), flexWrap: 'wrap', rowGap: SP2.xxs },
  termsText: { ...T2.label, display: 'inline-flex', alignItems: 'center', gap: SP2.xs, flexWrap: 'wrap' },
};

function FieldError({ children }) {
  return children ? <span style={FIELD2.error} role="alert">{children}</span> : null;
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const weak = score <= 1;
  return (
    <div style={S.meter}>
      <div style={S.segs}>{[1, 2, 3, 4].map(i => <span key={i} style={S.seg(i <= score, weak)} />)}</div>
      <span style={S.meterText(weak)}>{STRENGTH_LABELS[score]}</span>
    </div>
  );
}

// Session 55 — `initialEmail` / `lockEmail`: a co-applicant invited by
// email registers with exactly that address (it's what the invitation is
// bound to), so it arrives pre-filled and read-only. Optional; every other
// caller is unchanged.
export default function SignUpPage({ onNavigateToLogin, onNavigateToOTP, initialEmail = '', lockEmail = false }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: initialEmail || '', phone: '',
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

  const invalid = (field) => (errors[field] ? FIELD2.invalid : undefined);
  const eye = (shown, toggle) => ({ icon: shown ? 'ti-eye-off' : 'ti-eye', label: shown ? 'Hide password' : 'Show password', onClick: toggle });
  const passwordsMatch = form.password === form.confirmPassword;
  const toggleTerms = () => { setAgreedToTerms(p => !p); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' })); };

  const perks = <div style={S.perks}>{PERKS.map(p => (
    <div key={p.text} style={S.perk}>
      <span style={S.perkIcon}><i className={`ti ${p.icon}`} aria-hidden="true" /></span>
      <span style={S.perkText}>{p.text}</span>
    </div>
  ))}</div>;

  return (
    <AuthShell
      titleLines={['Join the smarter', 'way to manage', 'property.']}
      brandSub="Platform"
      accentRule
      subtitle="Create your free account and discover curated listings, seamless leasing, and a platform built for modern renters."
      heroExtra={perks}
      formGap={SP2.lg}
      fit={SZ2.authFitTall}
      layout="wideRight"
      heroImage={heroArt}
      heroPosition={HERO_POSITION}
      leafSource={LEAF_SOURCE}
      weather="stars"
      formMax={SZ2.authFormWide}
    >
      <div className="un2-intro-up" style={{ ...S.head, ...formIntro(0) }}>
        <span style={S.step}>Step 1 of 2 — Account details</span>
        <div>
          <h1 style={AUTH.h1}>Create your account</h1>
          <div style={{ ...S.have, ...AUTH.lead }}>
            Already have an account?
            <TextLink arrow={false} onClick={onNavigateToLogin} style={S.haveLink}>Sign in</TextLink>
          </div>
        </div>
      </div>

      {apiError && (
        <div style={UI2.errorBanner} role="alert">
          <i className="ti ti-alert-circle" aria-hidden="true" /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={S.form}>
        <Grid layout="two" as="div" className="un2-intro-up" style={{ ...S.pair, ...formIntro(1) }}>
          <FormField label="First Name *">
            <div style={S.field}>
              <IconField icon="ti-user" type="text" placeholder="John" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" aria-label="First name" style={invalid('firstName')} />
              <FieldError>{errors.firstName}</FieldError>
            </div>
          </FormField>
          <FormField label="Last Name *">
            <div style={S.field}>
              <IconField type="text" placeholder="Doe" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" aria-label="Last name" style={invalid('lastName')} />
              <FieldError>{errors.lastName}</FieldError>
            </div>
          </FormField>
        </Grid>

        <div className="un2-intro-up" style={formIntro(2)}>
          <FormField label="Email Address *">
            <div style={S.field}>
              <IconField icon="ti-mail" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} autoComplete="email" aria-label="Email address"
                readOnly={lockEmail} title={lockEmail ? 'This is the email address your invitation was sent to.' : undefined}
                style={{ ...(lockEmail ? S.readOnly : {}), ...invalid('email') }} />
              <FieldError>{errors.email}</FieldError>
            </div>
          </FormField>
        </div>

        <div className="un2-intro-up" style={formIntro(3)}>
          <FormField label="Phone Number *">
            <div style={S.field}>
              <IconField icon="ti-phone" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} autoComplete="tel" aria-label="Phone number" style={invalid('phone')} />
              <FieldError>{errors.phone}</FieldError>
            </div>
          </FormField>
        </div>

        <Grid layout="two" as="div" className="un2-intro-up" style={{ ...S.pair, ...formIntro(4) }}>
          <FormField label="Password *">
            <div style={S.field}>
              <IconField icon="ti-lock" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} autoComplete="new-password" aria-label="Password"
                trailing={eye(showPassword, () => setShowPassword(p => !p))} style={invalid('password')} />
              <PasswordStrength password={form.password} />
              <FieldError>{errors.password}</FieldError>
            </div>
          </FormField>
          <FormField label="Confirm Password *">
            <div style={S.field}>
              <IconField icon="ti-lock" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" aria-label="Confirm password"
                trailing={eye(showConfirmPassword, () => setShowConfirmPassword(p => !p))} style={invalid('confirmPassword')} />
              {form.confirmPassword && form.password && (
                <span style={S.match(passwordsMatch)}>
                  <i className={`ti ${passwordsMatch ? 'ti-circle-check' : 'ti-circle-x'}`} aria-hidden="true" />
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              )}
              {errors.confirmPassword && !form.confirmPassword && <FieldError>{errors.confirmPassword}</FieldError>}
            </div>
          </FormField>
        </Grid>

        <div className="un2-intro-up" style={{ ...S.field, ...formIntro(5) }}>
          <div style={S.terms}>
            <Checkbox checked={agreedToTerms} onChange={toggleTerms} />
            <span style={S.termsText}>
              I agree to UrbanNest's
              <TextLink arrow={false} onClick={() => {}}>Terms of Service</TextLink>
              and
              <TextLink arrow={false} onClick={() => {}}>Privacy Policy</TextLink>
            </span>
          </div>
          <FieldError>{errors.terms}</FieldError>
        </div>

        <div className="un2-intro-up" style={{ ...AUTH.submitRow(FORM_GAP), ...formIntro(6) }}>
          <button type="submit" className="un2-btn un2-intro-sheen" style={{ ...AUTH.submit, ...(loading ? AUTH.busy : {}), ...introAt(AUTH_INTRO.sheen) }} disabled={loading}>
            {loading
              ? <><i className="ti ti-loader-2 un2-spin" style={UI2.btnIcon} aria-hidden="true" /> Creating account…</>
              : <>Create Account <i className="ti ti-arrow-right" style={UI2.btnIcon} aria-hidden="true" /></>}
          </button>
        </div>
      </form>

      <div className="un2-intro-up" style={{ ...AUTH.orRow, ...formIntro(7) }}>
        <span style={AUTH.orLine} />
        <span style={AUTH.orText}>Or sign up with</span>
        <span style={AUTH.orLine} />
      </div>

      <Grid layout="two" as="div" className="un2-intro-up" style={{ ...AUTH.socials, ...formIntro(8) }}>
        <button type="button" className="un2-btn" style={AUTH.social}><GoogleLogo /> Continue with Google</button>
        <button type="button" className="un2-btn" style={AUTH.social}><AppleLogo /> Continue with Apple</button>
      </Grid>

      <div className="un2-intro-up" style={{ ...AUTH.footLinks, ...formIntro(9) }}>
        {FOOT_LINKS.map(l => <button key={l} type="button" style={AUTH.footLink}>{l}</button>)}
      </div>
    </AuthShell>
  );
}
