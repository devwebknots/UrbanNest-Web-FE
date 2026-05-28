// ─────────────────────────────────────────────
// UrbanNest — Login Page
// Route: / (inside LoginModal)
// Auth model: Option B — universal login, no persona dropdown
// On success: saves JWT tokens → navigates to /persona-select
// ─────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Divider, TestimonialCarousel } from '../../components/ui';
import { C } from '../../constants/colors';
import { F } from '../../constants/fonts';

const API_BASE = 'http://localhost:8001';

// ── Static data ───────────────────────────────
const ESTATE_IMAGE = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=80&fit=crop';

const TESTIMONIALS = [
  {
    quote: '-The intersection of heritage and innovation. URBANNEST provides the clarity and security essential for navigating complex global markets with confidence.-',
    name: 'JULIAN VANE',
    title: 'Global Portfolio Strategy, London',
  },
  {
    quote: '-Unparalleled access to prime real estate opportunities across three continents. URBANNEST redefines what private wealth management looks like.-',
    name: 'SOPHIA HARTWELL',
    title: 'Private Equity Director, Zürich',
  },
  {
    quote: '-From acquisition to legacy planning, URBANNEST has been the cornerstone of our family office strategy for over a decade.-',
    name: 'MARCUS DELACROIX',
    title: 'Family Office Principal, Singapore',
  },
];

// ── Icons ─────────────────────────────────────
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

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
    <svg width="15" height="17" viewBox="0 0 814 1000" fill={C.textPrimary}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.2-62.3-150.6-123.6C46.5 726 1.1 583.9 1.1 440.8c0-109.1 39.1-212.2 103.7-283.6 56-62.2 140.7-101.7 232.8-101.7 85.5 0 152.6 42.3 204.8 42.3 49.4 0 126.9-45.3 227.2-45.3 34.2 0 150.4 3.2 224.1 110.9zM490.1 73.6c28.9-38.8 48.9-91.1 48.9-143.4 0-5.8-.6-11.7-1.3-17.6-47.5 2.6-104.6 32.5-138.2 74-26.9 32.5-50 84.7-50 136.9 0 6.5.6 12.9 1.3 15.5 3.2.6 8.4 1.3 13.6 1.3 42.9 0 96.9-28.3 125.7-66.7z"/>
    </svg>
  );
}

// ── Page component ────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();

  const [clientId,  setClientId]  = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId.trim() || !password.trim()) {
      setError('Please enter your email/phone and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email_or_phone: clientId.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface backend error message
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

      // ── AUTH_WEB_001: Save JWT tokens to localStorage ──
      // Backend returns tokens nested: { tokens: { access, refresh }, user: {...} }
      const tokens = data.tokens || data;
      if (tokens.access)  localStorage.setItem('access_token',  tokens.access);
      if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh);

      // ── AUTH_WEB_002: Navigate to persona select ──
      navigate('/persona-select');

    } catch (err) {
      setError('Could not connect to the server. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes un-spin   { to { transform: rotate(360deg); } }
        @keyframes un-fadein { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
        @keyframes un-pagein { from { opacity:0; } to { opacity:1; } }
        .un-login-root { animation: un-pagein 0.45s ease; }
        .un-btn-primary:hover:not(:disabled) { background: ${C.primaryHover} !important; }
        .un-btn-primary:active:not(:disabled){ transform: scale(0.99); }
        .un-btn-social:hover  { border-color: #94A3B8 !important; background: #F8FAFC !important; }
        .un-reglink:hover     { border-color: ${C.textPrimary} !important; }
        .un-footlink:hover    { color: ${C.primary} !important; }
      `}</style>

      <div className="un-login-root" style={{
        display: 'flex', minHeight: '100%',
        fontFamily: F.body, background: '#fff',
      }}>

        {/* ── LEFT — hero image + testimonial ── */}
        <div style={{ position: 'relative', width: '52%', minHeight: '100%', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={ESTATE_IMAGE}
            alt="Luxury estate"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,20,50,0.42) 0%, rgba(0,20,50,0.12) 40%, rgba(0,20,50,0.62) 100%)' }} />
          <div style={{ position: 'absolute', top: 52, left: 52, fontFamily: F.body, fontWeight: 700, fontSize: 15, letterSpacing: '0.38em', color: '#fff', textTransform: 'uppercase' }}>
            URBANNEST
          </div>
          <TestimonialCarousel testimonials={TESTIMONIALS} />
        </div>

        {/* ── RIGHT — form panel ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 76px 36px 68px', background: '#fff',
        }}>
          <div style={{ maxWidth: 440 }}>
            <h1 style={{
              fontFamily: F.headline, fontWeight: 700, fontSize: 40,
              color: C.primary, lineHeight: 1.2, marginBottom: 10,
            }}>
              Secure Access
            </h1>
            <p style={{
              fontFamily: F.body, fontWeight: 400, fontSize: 13,
              color: C.textSecondary, marginBottom: 34, lineHeight: 1.5,
            }}>
              Enter your credentials to access your UrbanNest account.
            </p>

            {/* ── Error banner ── */}
            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 8, padding: '10px 14px', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: F.body, fontSize: 12, color: '#DC2626',
                animation: 'un-fadein 0.2s ease',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* ── No persona dropdown — AUTH_REG_005 / Option B ── */}
              <Input
                label="Email or Phone"
                type="text"
                placeholder="Enter your email or phone number"
                value={clientId}
                onChange={e => { setClientId(e.target.value); setError(''); }}
                autoComplete="username"
              />
              <Input
                label="Password"
                type="password"
                placeholder="• • • • • • • •"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                rightAction={{ label: 'Forgot password?', onClick: () => {} }}
                style={{ marginBottom: 22 }}
              />
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                <LockIcon /> Secure Sign In
              </Button>
            </form>

            <Divider label="OR CONTINUE WITH" />

            <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
              <Button variant="social" fullWidth={false} style={{ flex: 1 }}>
                <GoogleLogo /> Google
              </Button>
              <Button variant="social" fullWidth={false} style={{ flex: 1 }}>
                <AppleLogo /> Apple
              </Button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 400, color: C.textSecondary }}>
                New here?{' '}
                <a
                  href="/signup"
                  className="un-reglink"
                  style={{ color: C.textPrimary, fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid transparent', transition: 'border-color 0.18s' }}
                >
                  Create Account ↗
                </a>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, letterSpacing: '0.05em', marginBottom: 10 }}>
              © 2024 URBANNEST EDITORIAL SYSTEMS. ALL RIGHTS RESERVED.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {['Privacy', 'Security', 'Terms'].map(l => (
                <a key={l} href="#" className="un-footlink"
                  style={{ fontFamily: F.body, fontSize: 11, fontWeight: 500, color: C.textSecondary, textDecoration: 'none', transition: 'color 0.18s' }}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
