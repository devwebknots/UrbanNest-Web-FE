// ─────────────────────────────────────────────
// UrbanNest — Login Page
// Route: / (via LoginModal) and /login — same v2 page
// Auth model: Option B — universal login, no persona dropdown
// On success: saves JWT tokens → navigates to /persona-select
// ─────────────────────────────────────────────

// Design System v2 (2026-11-24, layout from Downloads/image 14.png): page = our own pageBg + ImageBackdrop waves
// (not the design's blue) · one white card (UI2.card) split photo │ form (<Grid layout="split">) · photo side =
// brand + hero title (T2.heroTitle) + frosted testimonial carousel · form side = standard v2 form (FormField +
// IconField 36px, brand CTA, soft social buttons — never white buttons on white, TextLink).
// The sign-in logic (handleSubmit, tokens, refreshAuth, redirects) is unchanged.

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid, ImageBackdrop } from '../../components/layout';
import { FormField, IconField, TextLink, CornerArt, Particles } from '../../components/ui';
import { C2, G2, F2, FS2, LH2, LS2, SP2, SZ2, R2, BLUR2, OP2, LAYOUT2, BP2, T2, UI2, pad } from '../../constants';
import brandLogo from '../../assets/brand/urban-nest-logo.png';
import backdropArt from '../../assets/landlord/wizard-backdrop.jpg';   // same soft waves as the Create Listing backdrop
import heroArt from '../../assets/landlord/login-hero.jpg';           // dusk villa + pool (Downloads/image 120.png, resized to 2400px)
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
const FOOT_LINKS = ['Privacy', 'Security', 'Terms'];
// Page-open choreography (seconds from load) — un2-intro-* classes (utilities.css). Card first, then the photo
// curtain + camera settle, headline lines, the photo copy; the form rows cascade in parallel; one sheen to finish.
const INTRO = { bg: 0, card: 0.1, photo: 0.45, brand: 1.0, line: 1.15, lineStep: 0.18, sub: 1.55, quote: 1.8, form: 0.7, formStep: 0.12, sheen: 2.5 };
const at = (s) => ({ '--un2-d': `${s}s` });                     // start time of one intro element
const formAt = (i) => at(INTRO.form + i * INTRO.formStep);   // i-th row of the form cascade
// Where the falling leaves come from — the tree crowns in login-hero.jpg (fractions of the photo: x0, y0, x1, y1).
// position = the photo's object-position (68% center), so Particles crops the areas exactly like the <img>.
const LEAF_SOURCE = {
  ratio: 2400 / 1351,
  position: [0.68, 0.5],
  areas: [
    [0.69, 0.02, 1.0, 0.33],    // big tree, top right
    [0.82, 0.30, 1.0, 0.60],    // tree beside the house, right
    [0.22, 0.45, 0.39, 0.61],   // young trees left of the house
  ],
};
const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

const S = {
  // page — our own background (pageBg + soft waves top-right), card centred
  page:      { position: 'relative', zIndex: 0, minHeight: '100vh', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: LAYOUT2.pageX, background: C2.pageBg, fontFamily: F2.body, color: C2.textPrimary },
  // the same wave art again, turned 180° → waves in the BOTTOM-LEFT corner too (top-right comes from ImageBackdrop).
  // Same size, masks and strength as ImageBackdrop — the masks turn with it, so only the bottom-left shows.
  // (wrapped: the page's entrance animation moves its direct children with transform — the wrapper takes that,
  // so the 180° turn on the art itself is never overridden)
  waveWrap:  { position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' },
  waveLeft:  {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SZ2.imageBackdrop,
    opacity: OP2.backdrop, transform: 'rotate(180deg)',
    backgroundImage: `url(${backdropArt})`, backgroundSize: '100% auto', backgroundPosition: 'right top', backgroundRepeat: 'no-repeat',
    WebkitMaskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`, maskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`,
    WebkitMaskComposite: 'source-in', maskComposite: 'intersect',
  },
  card:      { ...UI2.card, padding: 0, gap: 0, width: '100%', overflow: 'hidden' },
  // card frame: same max width; scaled down AS A WHOLE when the window is small (see useCardFit) — every size
  // inside stays the standard one. The wrapper takes the page's entrance animation, the frame only the scale.
  cardWrap:  { width: '100%', maxWidth: SZ2.authCard },
  cardFit:   (k) => ({ transform: k === 1 ? 'none' : `scale(${k})`, transformOrigin: 'center' }),

  // photo side
  hero:      { position: 'relative', display: 'flex', flexDirection: 'column', minHeight: SZ2.authHeroMin, padding: SP2.huge, background: C2.navyHero, color: C2.white, overflow: 'hidden' },
  heroPhoto: { ...UI2.photoMedia, objectPosition: '68% center' },   // keeps the house + pool in view
  heroScrim: { position: 'absolute', inset: 0, background: G2.authHeroScrim, pointerEvents: 'none' },
  heroBody:  { position: 'relative' },
  brand:     { ...UI2.row(SP2.sm) },
  logoMark:  { height: SZ2.icon.md, width: 'auto', aspectRatio: SZ2.brandLogoRatio, display: 'block' },
  logoName:  { ...T2.brandTitle, lineHeight: LH2.tight, letterSpacing: LS2.snug },
  title:     { ...T2.heroTitle, margin: pad(SP2.huge, 0, SP2.sm) },
  sub:       { margin: 0, fontSize: FS2.base, lineHeight: LH2.body, color: C2.onDark.textSoft },
  // testimonial panel — pinned to the BOTTOM of the photo (same inset as the text), clear navy glass
  quote:     { ...UI2.stack(SP2.md), position: 'absolute', left: SP2.huge, right: SP2.huge, bottom: SP2.huge, margin: 0, padding: SP2.xl, borderRadius: R2.xl, background: G2.authGlass, border: `${SZ2.hairline}px solid ${C2.onDark.borderSoft}`, backdropFilter: BLUR2.md, WebkitBackdropFilter: BLUR2.md },
  quoteMark: { fontSize: FS2.xxl, lineHeight: LH2.none, color: C2.white },
  quoteText: { ...T2.quote, margin: 0, color: C2.white },
  author:    { ...UI2.row(SP2.md), justifyContent: 'space-between' },
  person:    { ...UI2.row(SP2.md), minWidth: 0 },
  avatar:    { ...UI2.avatar(SZ2.icon.lg, { soft: C2.onDark.surfaceHover, fg: C2.white }) },
  name:      { ...UI2.text.title, color: C2.white },
  role:      { ...T2.caption, color: C2.onDark.textMuted, ...UI2.truncate },
  arrows:    { ...UI2.row(SP2.sm), flexShrink: 0 },
  arrow:     { ...UI2.btn.icon(SZ2.control.md), color: C2.white, fontSize: FS2.lg, border: `${SZ2.hairline}px solid ${C2.onDark.border}` },

  // form side
  formSide:  { position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: SP2.huge, background: C2.white, overflow: 'hidden' },
  formCol:   { position: 'relative', ...UI2.stack(SP2.xl), width: '100%', maxWidth: SZ2.authForm, margin: '0 auto' },
  h1:        { ...T2.pageHeroTitle, margin: 0 },
  lead:      { ...T2.pageHeroSub, margin: pad(SP2.xs, 0, 0) },
  form:      { ...UI2.stack(SP2.lg) },
  submit:    { ...UI2.btn.brand, width: '100%', minHeight: SZ2.field, justifyContent: 'center' },
  orRow:     { ...UI2.row(SP2.md) },
  orLine:    { ...UI2.divider, flex: 1 },
  orText:    { ...UI2.capsLabel, whiteSpace: 'nowrap' },
  socials:   { gap: SP2.md },
  busy:      { opacity: OP2.soft, cursor: 'wait' },
  social:    { ...UI2.btn.soft, width: '100%', minHeight: SZ2.field, justifyContent: 'center' },
  signup:    { ...UI2.row(SP2.xs), justifyContent: 'center', ...T2.label },
  foot:      { ...UI2.stack(SP2.sm), alignItems: 'center', textAlign: 'center' },
  copy:      { ...T2.eyebrow },
  footLinks: { ...UI2.row(SP2.lg), justifyContent: 'center' },
  footLink:  { ...UI2.btn.textLink, color: C2.textSecondary },
};

function GoogleLogo() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="15" height="17" viewBox="0 0 814 1000" fill={C2.navy}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.2-62.3-150.6-123.6C46.5 726 1.1 583.9 1.1 440.8c0-109.1 39.1-212.2 103.7-283.6 56-62.2 140.7-101.7 232.8-101.7 85.5 0 152.6 42.3 204.8 42.3 49.4 0 126.9-45.3 227.2-45.3 34.2 0 150.4 3.2 224.1 110.9zM490.1 73.6c28.9-38.8 48.9-91.1 48.9-143.4 0-5.8-.6-11.7-1.3-17.6-47.5 2.6-104.6 32.5-138.2 74-26.9 32.5-50 84.7-50 136.9 0 6.5.6 12.9 1.3 15.5 3.2.6 8.4 1.3 13.6 1.3 42.9 0 96.9-28.3 125.7-66.7z"/>
    </svg>
  );
}

// Session 55 — callers that send a signed-out user here (Apply, Book a
// Tour, Applications, a co-applicant invitation) pass
// `state.postLoginRedirect`; it was never read, so every login landed on
// /persona-select. Only same-app paths are honoured (no open redirects).
export function safeRedirect(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : null;
}

// Card fit: on windows where the card would take more than SZ2.authFit of the width / height (small laptops,
// Windows display scaling 125 %+), scale the whole card down so it keeps the same share of the screen —
// nothing inside changes size in the code. Only while photo │ form sit side by side (wider than BP2.lg); stacked
// (tablets) and phones are left alone.
function useCardFit() {
  const ref = useRef(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const vw = window.innerWidth; const vh = window.innerHeight;
      const k = vw <= BP2.lg ? 1 : Math.min(1, (vw * SZ2.authFit.w) / el.offsetWidth, (vh * SZ2.authFit.h) / el.offsetHeight);
      setFit(Math.round(k * 1000) / 1000);
    };
    update();
    const ro = new ResizeObserver(update);   // layout size (a transform never changes it → no loop)
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  return [ref, fit];
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
  const [cardRef, fit] = useCardFit();
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

  return (
    <div style={S.page}>
      <div className="un2-intro-fade" style={at(INTRO.bg)}>
        <ImageBackdrop image={backdropArt} />
        <div style={S.waveWrap} aria-hidden="true"><div style={S.waveLeft} /></div>
      </div>

      <div className="un2-intro-card" style={{ ...S.cardWrap, ...at(INTRO.card) }}>
      <div ref={cardRef} style={S.cardFit(fit)}>
      <Grid layout="split" as="div" style={S.card}>
        {/* ── Photo side — brand · headline · testimonial carousel ── */}
        <div style={{ ...S.hero, ...at(INTRO.photo) }} className="un2-hide-md un2-intro-curtain">
          <img src={heroArt} alt="" className="un2-intro-zoom" style={{ ...S.heroPhoto, ...at(INTRO.photo) }} />
          <div style={S.heroScrim} aria-hidden="true" />
          {/* weather over the photo: rain behind, falling leaves in front (nearer the camera) */}
          <Particles variant="rain" density={0.7} />
          <Particles variant="leaves" source={LEAF_SOURCE} />
          <div style={S.heroBody}>
            <div className="un2-intro-up" style={{ ...S.brand, ...at(INTRO.brand) }}>
              <img src={brandLogo} alt="" style={S.logoMark} />
              <span style={S.logoName}>UrbanNest</span>
            </div>
            <h2 style={S.title}>
              <span className="un2-intro-line"><span style={at(INTRO.line)}>The Smart Way to</span></span>
              <span className="un2-intro-line"><span style={at(INTRO.line + INTRO.lineStep)}>Manage &amp; Find Homes</span></span>
            </h2>
            <p className="un2-intro-up" style={{ ...S.sub, ...at(INTRO.sub) }}>Rent, buy, manage and explore properties —<br />all in one trusted platform.</p>
          </div>

          <figure className="un2-intro-rise" style={{ ...S.quote, ...at(INTRO.quote) }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
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
            </figure>
        </div>

        {/* ── Form side ── */}
        <div style={S.formSide}>
          <CornerArt />
          <div style={S.formCol}>
            <div className="un2-intro-up" style={formAt(0)}>
              <h1 style={S.h1}>Secure Access</h1>
              <p style={S.lead}>Enter your credentials to access your UrbanNest account.</p>
            </div>

            {error && (
              <div style={UI2.errorBanner} role="alert">
                <i className="ti ti-alert-circle" aria-hidden="true" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={S.form}>
              <div className="un2-intro-up" style={formAt(1)}><FormField label="Email or Phone">
                <IconField icon="ti-mail" type="text" placeholder="Enter your email or phone number" autoComplete="username"
                  value={clientId} onChange={e => { setClientId(e.target.value); setError(''); }} aria-label="Email or phone" />
              </FormField></div>
              <div className="un2-intro-up" style={formAt(2)}><FormField label="Password" action={<TextLink arrow={false} onClick={() => {}}>Forgot password?</TextLink>}>
                <IconField icon="ti-lock" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password"
                  value={password} onChange={e => { setPassword(e.target.value); setError(''); }} aria-label="Password"
                  trailing={{ icon: showPassword ? 'ti-eye-off' : 'ti-eye', label: showPassword ? 'Hide password' : 'Show password', onClick: () => setShowPassword(v => !v) }} />
              </FormField></div>
              <div className="un2-intro-up" style={formAt(3)}>
              <button type="submit" className="un2-btn un2-intro-sheen" style={{ ...S.submit, ...(loading ? S.busy : {}), ...at(INTRO.sheen) }} disabled={loading}>
                <i className={`ti ${loading ? 'ti-loader-2 un2-spin' : 'ti-lock'}`} style={UI2.btnIcon} aria-hidden="true" />
                {loading ? 'Signing in…' : 'Secure Sign In'}
              </button>
              </div>
            </form>

            <div className="un2-intro-up" style={{ ...S.orRow, ...formAt(4) }}>
              <span style={S.orLine} />
              <span style={S.orText}>Or continue with</span>
              <span style={S.orLine} />
            </div>

            <Grid layout="two" as="div" className="un2-intro-up" style={{ ...S.socials, ...formAt(5) }}>
              <button type="button" className="un2-btn" style={S.social}><GoogleLogo /> Google</button>
              <button type="button" className="un2-btn" style={S.social}><AppleLogo /> Apple</button>
            </Grid>

            <div className="un2-intro-up" style={{ ...S.signup, ...formAt(6) }}>
              New here?
              <TextLink onClick={() => navigate('/signup', { state: location.state })}>Create Account</TextLink>
            </div>

            <div className="un2-intro-up" style={{ ...S.foot, ...formAt(7) }}>
              <span style={S.copy}>© 2024 UrbanNest Editorial Systems. All rights reserved.</span>
              <div style={S.footLinks}>
                {FOOT_LINKS.map(l => <button key={l} type="button" style={S.footLink}>{l}</button>)}
              </div>
            </div>
          </div>
        </div>
      </Grid>
      </div>
      </div>
    </div>
  );
}
