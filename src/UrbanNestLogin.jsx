import { useState } from "react";

const C = {
  primary: "#002D5B",
  neutral: "#F1F5F9",
  pageBg: "#F8FAFC",
  navBg: "#1a2332",
  border: "#E2E8F0",
  borderMedium: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
};

const F = {
  headline: "'Noto Serif', serif",
  body: "'Nunito Sans', sans-serif",
};

const ESTATE_IMAGE =
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=80&fit=crop";

const testimonials = [
  {
    quote:
      "-The intersection of heritage and innovation. URANNEST provides the clarity and security essential for navigating complex global markets with confidence.-",
    name: "JULIAN VANE",
    title: "Global Portfolio Strategy, London",
  },
  {
    quote:
      "-Unparalleled access to prime real estate opportunities across three continents. URANNEST redefines what private wealth management looks like.-",
    name: "SOPHIA HARTWELL",
    title: "Private Equity Director, Zürich",
  },
  {
    quote:
      "-From acquisition to legacy planning, URANNEST has been the cornerstone of our family office strategy for over a decade.-",
    name: "MARCUS DELACROIX",
    title: "Family Office Principal, Singapore",
  },
];

// ── Eye icon ────────────────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── Lock icon ────────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ── Chevron icon ─────────────────────────────────────────────────────────────
function ChevronIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
}

// ── Google logo ──────────────────────────────────────────────────────────────
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

// ── Apple logo ───────────────────────────────────────────────────────────────
function AppleLogo() {
  return (
    <svg width="15" height="17" viewBox="0 0 814 1000" fill={C.textPrimary}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.2-62.3-150.6-123.6C46.5 726 1.1 583.9 1.1 440.8c0-109.1 39.1-212.2 103.7-283.6 56-62.2 140.7-101.7 232.8-101.7 85.5 0 152.6 42.3 204.8 42.3 49.4 0 126.9-45.3 227.2-45.3 34.2 0 150.4 3.2 224.1 110.9zM490.1 73.6c28.9-38.8 48.9-91.1 48.9-143.4 0-5.8-.6-11.7-1.3-17.6-47.5 2.6-104.6 32.5-138.2 74-26.9 32.5-50 84.7-50 136.9 0 6.5.6 12.9 1.3 15.5 3.2.6 8.4 1.3 13.6 1.3 42.9 0 96.9-28.3 125.7-66.7z"/>
    </svg>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 15, height: 15,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff", borderRadius: "50%",
      animation: "un-spin 0.7s linear infinite",
    }} />
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function UrbanNestLogin() {
  const [persona, setPersona] = useState("Renter");
  const [clientId, setClientId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tIdx, setTIdx] = useState(0);
  const [idFocused, setIdFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const t = testimonials[tIdx];
  const prev = () => setTIdx((i) => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setTIdx((i) => (i + 1) % testimonials.length);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  };

  // ── shared field styles ──────────────────────────────────────────────────
  const inputStyle = (focused) => ({
    width: "100%",
    height: 42,
    background: focused ? "#fff" : C.neutral,
    border: `1px solid ${focused ? C.primary : C.border}`,
    borderRadius: 8,
    padding: "10px 12px",
    fontFamily: F.body,
    fontSize: 11,
    fontWeight: 400,
    color: C.textPrimary,
    outline: "none",
    transition: "border-color 0.18s, background 0.18s",
  });

  const labelStyle = {
    display: "block",
    fontFamily: F.body,
    fontSize: 10,
    fontWeight: 700,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 5,
  };

  return (
    <>
      <style>{`
        @keyframes un-spin { to { transform: rotate(360deg); } }
        @keyframes un-fadein { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
        @keyframes un-pagein { from { opacity:0; } to { opacity:1; } }
        .un-root { animation: un-pagein 0.45s ease; }
        .un-tslide { animation: un-fadein 0.3s ease; }
        .un-navbtn:hover { background: rgba(255,255,255,0.18) !important; }
        .un-social:hover { border-color: #94A3B8 !important; background: #F8FAFC !important; }
        .un-forgot:hover { color: ${C.textPrimary} !important; }
        .un-reglink:hover { border-color: ${C.textPrimary} !important; }
        .un-footlink:hover { color: ${C.primary} !important; }
        .un-eye:hover { color: ${C.textPrimary} !important; }
        .un-submit:hover:not(:disabled) { background: #003d7a !important; }
        .un-submit:active:not(:disabled) { transform: scale(0.99); }
      `}</style>

      <div className="un-root" style={{ display: "flex", minHeight: "100%", fontFamily: F.body, background: "#fff" }}>

        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <div style={{ position: "relative", width: "52%", minHeight: "100%", overflow: "hidden", flexShrink: 0 }}>
          <img
            src={ESTATE_IMAGE}
            alt="Luxury estate"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          {/* overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,20,50,0.42) 0%, rgba(0,20,50,0.12) 40%, rgba(0,20,50,0.62) 100%)" }} />

          {/* Logo */}
          <div style={{
            position: "absolute", top: 52, left: 52,
            fontFamily: F.body, fontWeight: 700, fontSize: 15,
            letterSpacing: "0.38em", color: "#fff", textTransform: "uppercase",
          }}>
            URANNEST
          </div>

          {/* Testimonial card */}
          <div style={{
            position: "absolute", bottom: 52, left: 40, right: 40,
            background: "rgba(255,255,255,0.11)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, padding: "30px 30px 26px",
          }}>
            <div className="un-tslide" key={tIdx}>
              <p style={{
                fontFamily: F.headline, fontStyle: "italic",
                fontSize: 16, lineHeight: 1.68, color: "#fff", marginBottom: 20,
              }}>
                {t.quote}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 11, letterSpacing: "0.13em", color: "#fff", marginBottom: 3 }}>
                    {t.name}
                  </div>
                  <div style={{ fontFamily: F.body, fontWeight: 400, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                    {t.title}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[prev, next].map((fn, i) => (
                    <button key={i} className="un-navbtn" onClick={fn}
                      style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                      aria-label={i === 0 ? "Previous" : "Next"}>
                      {i === 0 ? "‹" : "›"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 76px 36px 68px", background: "#fff" }}>

          <div style={{ maxWidth: 440 }}>

            {/* Heading */}
            <h1 style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 40, color: C.primary, lineHeight: 1.2, marginBottom: 10 }}>
              Secure Access
            </h1>
            <p style={{ fontFamily: F.body, fontWeight: 400, fontSize: 13, color: C.textSecondary, marginBottom: 34, lineHeight: 1.5 }}>
              Enter your private credentials to manage your estate.
            </p>

            <form onSubmit={handleSubmit}>

              {/* CLIENT PERSONA */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Client Persona</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    style={{
                      ...inputStyle(false),
                      height: 42,
                      padding: "10px 36px 10px 12px",
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option>Renter</option>
                    <option>Owner</option>
                    <option>Investor</option>
                    <option>Agent</option>
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <ChevronIcon />
                  </span>
                </div>
              </div>

              {/* CLIENT ID */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Client ID</label>
                <input
                  type="text"
                  placeholder="Enter your unique ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                  autoComplete="username"
                  style={{
                    ...inputStyle(idFocused),
                    "::placeholder": { color: C.textTertiary },
                  }}
                />
              </div>

              {/* PASSWORD */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <button type="button" className="un-forgot"
                    style={{ fontFamily: F.body, fontSize: 12, fontWeight: 400, color: C.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.18s" }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="• • • • • • • •"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
                    autoComplete="current-password"
                    style={{ ...inputStyle(pwFocused), paddingRight: 44 }}
                  />
                  <button type="button" className="un-eye" onClick={() => setShowPw((v) => !v)}
                    style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textTertiary, display: "flex", alignItems: "center", padding: 0, transition: "color 0.18s" }}
                    aria-label={showPw ? "Hide password" : "Show password"}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button type="submit" disabled={loading} className="un-submit"
                style={{ width: "100%", height: 50, background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontFamily: F.body, fontWeight: 700, fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.2s", opacity: loading ? 0.75 : 1 }}>
                {loading ? <Spinner /> : (<><LockIcon /> Secure Sign In</>)}
              </button>
            </form>

            {/* DIVIDER */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: C.textTertiary, whiteSpace: "nowrap" }}>
                OR CONTINUE WITH
              </span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            {/* SOCIAL BUTTONS */}
            <div style={{ display: "flex", gap: 14, marginBottom: 26 }}>
              {[
                { label: "Google", icon: <GoogleLogo /> },
                { label: "Apple", icon: <AppleLogo /> },
              ].map(({ label, icon }) => (
                <button key={label} className="un-social"
                  style={{ flex: 1, height: 46, border: `1px solid ${C.border}`, borderRadius: 8, background: "#fff", fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, transition: "border-color 0.18s, background 0.18s" }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* REGISTER */}
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 400, color: C.textSecondary }}>
                New here?{" "}
                <a href="#" className="un-reglink"
                  style={{ color: C.textPrimary, fontWeight: 600, textDecoration: "none", borderBottom: "1px solid transparent", transition: "border-color 0.18s" }}>
                  Create Account ↗
                </a>
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <p style={{ fontFamily: F.body, fontSize: 11, fontWeight: 400, color: C.textTertiary, letterSpacing: "0.05em", marginBottom: 10 }}>
              © 2024 URANNEST PRIVATE WEALTH. ALL RIGHTS RESERVED.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {["Privacy", "Security", "Terms"].map((l) => (
                <a key={l} href="#" className="un-footlink"
                  style={{ fontFamily: F.body, fontSize: 11, fontWeight: 500, color: C.textSecondary, textDecoration: "none", transition: "color 0.18s" }}>
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
