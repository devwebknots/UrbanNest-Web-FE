// ─────────────────────────────────────────────
// UrbanNest — Login Page
// Route: / (via LoginModal) and /login — same v2 page
// Auth model: Option B — universal login, no persona dropdown
// On success: saves JWT tokens → navigates to /persona-select
// ─────────────────────────────────────────────

// Design System v2 (2026-11-24, layout from Downloads/image 14.png). The frame — page background, split card,
// photo side (villa · rain · leaves · brand · headline), card fit and the page-open animation — is the shared
// AuthShell (components/layout); this page adds the testimonial carousel (bottom glass panel) and the sign-in form
// (FormField + IconField 36px, brand CTA, soft social buttons, TextLink).
// The sign-in logic (handleSubmit, tokens, refreshAuth, redirects) is unchanged.

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid, AuthShell, AUTH, AUTH_INTRO, introAt, formIntro, GoogleLogo, AppleLogo } from '../../components/layout';
import { FormField, IconField, TextLink } from '../../components/ui';
import { C2, FS2, LH2, SP2, SZ2, T2, UI2 } from '../../constants';
// Session 51, Phase 3 fix — AuthContext.refreshAuth() exists specifically
// "to call after login" (see its own doc comment), but nothing here ever
// called it. AuthProvider only bootstraps `user`/`permissions` once, on the
// app's very first mount (before any login); every login after that is a
// client-side navigate(), so without this, `user` stayed null for the rest
// of the session until a hard page reload. Surfaced by Marketplace's new
// account-aware nav (Session 51, Phase 3) being the first real consumer of
// useAuth().user, but the gap was already there for any future consumer.
import { useAuth } from '../../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';


const TESTIMONIALS = [
  {
    quote: 'The intersection of heritage and innovation. UrbanNest provides the clarity and security essential for navigating complex global markets with confidence.',
    name: 'Julian Vane',
    title: 'Global Portfolio Strategy, London',
  },
  {
    quote: 'Unparalleled access to prime real estate opportunities across three continents. UrbanNest redefines what private wealth management looks like.',
    name: 'Sophia Hartwell',
    title: 'Private Equity Director, Zürich',
  },
  {
    quote: 'From acquisition to legacy planning, UrbanNest has been the cornerstone of our family office strategy for over a decade.',
    name: 'Marcus Delacroix',
    title: 'Family Office Principal, Singapore',
  },
];
const TESTIMONIAL_MS = 5000;   // carousel auto-advance
const FORM_GAP = SP2.lg;   // row gap inside the form
const FOOT_LINKS = ['Privacy', 'Security', 'Terms'];
const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

// page-specific: the testimonial carousel in the bottom glass panel + the "New here?" line
const S = {
  quoteMark: { fontSize: FS2.xxl, lineHeight: LH2.none, color: C2.white },
  quoteText: { ...T2.quote, margin: 0, color: C2.white },
  author:    { ...UI2.row(SP2.md), justifyContent: 'space-between' },
  person:    { ...UI2.row(SP2.md), minWidth: 0 },
  avatar:    { ...UI2.avatar(SZ2.icon.lg, { soft: C2.onDark.surfaceHover, fg: C2.white }) },
  name:      { ...UI2.text.title, color: C2.white },
  role:      { ...T2.caption, color: C2.onDark.textMuted, ...UI2.truncate },
  arrows:    { ...UI2.row(SP2.sm), flexShrink: 0 },
  arrow:     { ...UI2.btn.icon(SZ2.control.md), color: C2.white, fontSize: FS2.lg, border: `${SZ2.hairline}px solid ${C2.onDark.border}` },
  form:      { ...UI2.stack(FORM_GAP) },
  signup:    { ...UI2.row(SP2.xs), justifyContent: 'center', ...T2.label, fontSize: AUTH.lead.fontSize },
  signupLink: { fontSize: AUTH.lead.fontSize },   // "Create Account" = same 14px as the "New here?" text (same as Sign Up's "Sign in" line)
};

// Session 55 — callers that send a signed-out user here (Apply, Book a
// Tour, Applications, a co-applicant invitation) pass
// `state.postLoginRedirect`; it was never read, so every login landed on
// /persona-select. Only same-app paths are honoured (no open redirects).
export function safeRedirect(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();
  const postLoginRedirect = safeRedirect(location.state?.postLoginRedirect);

  // `state.prefillEmail` — e.g. the address a co-applicant invitation was sent to.
  const [clientId, setClientId] = useState(location.state?.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // testimonial carousel — current slide + the one fading out (crossfade, un2-xfade)
  const [carousel, setCarousel] = useState({ cur: 0, prev: null });
  const [paused, setPaused] = useState(false);   // hover / focus on the panel holds the current quote
  const step = (d) => setCarousel(({ cur }) => ({ cur: (cur + d + TESTIMONIALS.length) % TESTIMONIALS.length, prev: cur }));

  // auto-advance; the timer restarts after every change (incl. a manual prev / next) and stops while paused
  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => step(1), TESTIMONIAL_MS);
    return () => clearTimeout(t);
  }, [carousel.cur, paused]);
  const slideCls = (i) => (i === carousel.cur ? 'is-active' : i === carousel.prev ? 'is-leaving' : undefined);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId.trim() || !password.trim()) {
      setError('Please enter your email/phone and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email_or_phone: clientId.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.detail ||
          data.non_field_errors?.[0] ||
          data.email_or_phone?.[0] ||
          data.password?.[0] ||
          'Invalid credentials. Please try again.';
        setError(msg);
        setLoading(false);
        return;
      }

      // ── SECURITY: clear ALL previous user data before saving new tokens ──
      // Prevents previous user's org_pms_* wizard state, tokens, and any other
      // localStorage keys from bleeding into the newly logged-in user's session.
      //
      // 2026-11-13 follow-up: a small allowlist is preserved across the clear.
      // These keys aren't per-user session state — they stand in for data that
      // would live on a real backend (UN Admin's saved Screening Configuration,
      // and a PM's own override diff of it), shared across whoever is logged
      // in. Wiping them on every login meant UN Admin's settings silently
      // reverted the instant anyone logged back in. Everything else — tokens,
      // wizard state, anything not on this list — is still wiped exactly as
      // before.
      const PRESERVE_ACROSS_LOGIN = ['un_admin_screening_config_v1', 'un_pm_screening_overrides_v1'];
      const preservedAcrossLogin = {};
      PRESERVE_ACROSS_LOGIN.forEach((k) => {
        const v = localStorage.getItem(k);
        if (v !== null) preservedAcrossLogin[k] = v;
      });
      localStorage.clear();
      Object.entries(preservedAcrossLogin).forEach(([k, v]) => localStorage.setItem(k, v));

      // ── AUTH_WEB_001: Save JWT tokens ──
      // Backend returns tokens nested: { tokens: { access, refresh }, user: {...} }
      const tokens = data.tokens || data;
      if (tokens.access)  localStorage.setItem('access_token',  tokens.access);
      if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh);

      // ── Session 51 fix: re-run AuthContext's bootstrap now, so every
      // useAuth() consumer (e.g. the Marketplace nav) sees the logged-in
      // user immediately — not only after a hard page reload. Awaited so
      // `user` is already populated by the time the next screen renders. ──
      await refreshAuth();

      // ── AUTH_WEB_002: Navigate to persona select — or back to where the
      // user was sent from (Session 55: postLoginRedirect). ──
      navigate(postLoginRedirect || '/persona-select');

    } catch (err) {
      setError('Could not connect to the server. Please check your connection.');
      setLoading(false);
    }
  };

  const testimonials = (
    <>
      <i className="ti ti-quote" style={S.quoteMark} aria-hidden="true" />
      {/* every quote sits in the same cell (un2-xfade) → the panel keeps one height and the quotes crossfade */}
      <div className="un2-xfade" aria-live="polite">
        {TESTIMONIALS.map((t, i) => (
          <blockquote key={t.name} className={slideCls(i)} style={S.quoteText} aria-hidden={i !== carousel.cur}>“{t.quote}”</blockquote>
        ))}
      </div>
      <figcaption style={S.author}>
        <span className="un2-xfade" style={UI2.minWidth0}>
          {TESTIMONIALS.map((t, i) => (
            <span key={t.name} className={slideCls(i)} style={S.person} aria-hidden={i !== carousel.cur}>
              <span style={S.avatar} aria-hidden="true">{initials(t.name)}</span>
              <span style={UI2.minWidth0}>
                <span style={{ ...S.name, display: 'block' }}>{t.name}</span>
                <span style={{ ...S.role, display: 'block' }}>{t.title}</span>
              </span>
            </span>
          ))}
        </span>
        <span style={S.arrows}>
          <button type="button" className="un2-btn" style={S.arrow} onClick={() => step(-1)} aria-label="Previous testimonial"><i className="ti ti-chevron-left" aria-hidden="true" /></button>
          <button type="button" className="un2-btn" style={S.arrow} onClick={() => step(1)} aria-label="Next testimonial"><i className="ti ti-chevron-right" aria-hidden="true" /></button>
        </span>
      </figcaption>
    </>
  );

  return (
    <AuthShell
      titleLines={['The Smart Way to', 'Manage & Find Homes']}
      subtitle={<>Rent, buy, manage and explore properties —<br />all in one trusted platform.</>}
      panel={testimonials}
      panelAs="figure"
      panelProps={{ onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false) }}
    >
      <div className="un2-intro-up" style={formIntro(0)}>
        <h1 style={AUTH.h1}>Secure Access</h1>
        <p style={AUTH.lead}>Enter your credentials to access your UrbanNest account.</p>
      </div>

      {error && (
        <div style={UI2.errorBanner} role="alert">
          <i className="ti ti-alert-circle" aria-hidden="true" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={S.form}>
        <div className="un2-intro-up" style={formIntro(1)}><FormField label="Email or Phone">
          <IconField icon="ti-mail" type="text" placeholder="Enter your email or phone number" autoComplete="username"
            value={clientId} onChange={e => { setClientId(e.target.value); setError(''); }} aria-label="Email or phone" />
        </FormField></div>
        <div className="un2-intro-up" style={formIntro(2)}><FormField label="Password" action={<TextLink arrow={false} onClick={() => {}}>Forgot password?</TextLink>}>
          <IconField icon="ti-lock" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }} aria-label="Password"
            trailing={{ icon: showPassword ? 'ti-eye-off' : 'ti-eye', label: showPassword ? 'Hide password' : 'Show password', onClick: () => setShowPassword(v => !v) }} />
        </FormField></div>
        <div className="un2-intro-up" style={{ ...AUTH.submitRow(FORM_GAP), ...formIntro(3) }}>
          <button type="submit" className="un2-btn un2-intro-sheen" style={{ ...AUTH.submit, ...(loading ? AUTH.busy : {}), ...introAt(AUTH_INTRO.sheen) }} disabled={loading}>
            <i className={`ti ${loading ? 'ti-loader-2 un2-spin' : 'ti-lock'}`} style={UI2.btnIcon} aria-hidden="true" />
            {loading ? 'Signing in…' : 'Secure Sign In'}
          </button>
        </div>
      </form>

      <div className="un2-intro-up" style={{ ...AUTH.orRow, ...formIntro(4) }}>
        <span style={AUTH.orLine} />
        <span style={AUTH.orText}>Or continue with</span>
        <span style={AUTH.orLine} />
      </div>

      <Grid layout="two" as="div" className="un2-intro-up" style={{ ...AUTH.socials, ...formIntro(5) }}>
        <button type="button" className="un2-btn" style={AUTH.social}><GoogleLogo /> Google</button>
        <button type="button" className="un2-btn" style={AUTH.social}><AppleLogo /> Apple</button>
      </Grid>

      <div className="un2-intro-up" style={{ ...S.signup, ...formIntro(6) }}>
        New here?
        <TextLink onClick={() => navigate('/signup', { state: location.state })} style={S.signupLink}>Create Account</TextLink>
      </div>

      <div className="un2-intro-up" style={{ ...AUTH.foot, ...formIntro(7) }}>
        <span style={AUTH.copy}>© 2024 UrbanNest Editorial Systems. All rights reserved.</span>
        <div style={AUTH.footLinks}>
          {FOOT_LINKS.map(l => <button key={l} type="button" style={AUTH.footLink}>{l}</button>)}
        </div>
      </div>
    </AuthShell>
  );
}
