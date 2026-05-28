import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Tabler icons ──────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:       '#002D5B',
  primaryHover:  '#003d7a',
  navBg:         '#1a2332',
  pageBg:        '#F1F5F9',
  border:        '#E2E8F0',
  borderMedium:  '#CBD5E1',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  white:         '#FFFFFF',
  neutral:       '#F8FAFC',
  danger:        '#E53E3E',
  green:         '#16A34A',
  dropdownBg:    '#E4ECFC',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};


// ─── JWT decode helper ─────────────────────────────────────────────────────────
function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

// ─── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Professional Profile',   sub: 'Tell landlords about you and your experience' },
  { n: 2, label: 'Service Area & License', sub: 'Where you operate and your professional credentials' },
  { n: 3, label: 'Fees & Identity',        sub: 'Your fee structure & ID verification' },
];

// ─── Shared field styles ───────────────────────────────────────────────────────
const FL = {
  display: 'block', fontFamily: F.body, fontSize: '10px', fontWeight: 700,
  color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
};
const inputS = (disabled = false, error = false) => ({
  width: '100%', height: '40px', boxSizing: 'border-box',
  background: disabled ? C.neutral : C.white,
  border: '1px solid ' + (error ? C.danger : disabled ? C.border : C.borderMedium),
  borderRadius: '8px', padding: '0 12px',
  fontFamily: F.body, fontSize: '13px',
  color: disabled ? C.textTertiary : C.textPrimary,
  cursor: disabled ? 'not-allowed' : 'text', outline: 'none',
});
const selectS = (error = false) => ({
  width: '100%', height: '40px', boxSizing: 'border-box',
  background: C.white,
  border: '1px solid ' + (error ? C.danger : C.borderMedium),
  borderRadius: '8px', padding: '0 32px 0 12px',
  fontFamily: F.body, fontSize: '13px', color: C.textPrimary,
  appearance: 'none', outline: 'none', cursor: 'pointer',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
});
const hintS = (error = false) => ({
  fontFamily: F.body, fontSize: '11px',
  color: error ? C.danger : C.textTertiary, marginTop: '4px',
});
const dividerS = { borderTop: '1px solid ' + C.border, margin: '20px 0' };

// ─── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={onChange}
        style={{
          width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
          border: checked ? ('2px solid ' + C.primary) : ('1.5px solid ' + C.borderMedium),
          background: checked ? C.primary : C.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s', cursor: 'pointer',
        }}
      >
        {checked && <i className="ti ti-check" style={{ fontSize: '10px', color: C.white }} />}
      </div>
      <span style={{ fontFamily: F.body, fontSize: '13px', color: C.textPrimary }}>{label}</span>
    </label>
  );
}

// ─── Photo upload ──────────────────────────────────────────────────────────────
function PhotoUpload({ preview, onChange }) {
  const ref = useRef();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
        background: C.neutral, border: '1.5px solid ' + C.borderMedium,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {preview
          ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <i className="ti ti-user" style={{ fontSize: '20px', color: C.textTertiary }} />}
      </div>
      <div>
        <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={onChange} />
        <button type="button" onClick={() => ref.current?.click()} style={{
          display: 'flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px',
          background: C.white, border: '1.5px solid ' + C.borderMedium, borderRadius: '7px',
          fontFamily: F.body, fontSize: '12px', fontWeight: 600, color: C.textPrimary, cursor: 'pointer',
        }}>
          <i className="ti ti-upload" style={{ fontSize: '12px' }} />
          Upload photo
        </button>
        <p style={{ ...hintS(), margin: '5px 0 0' }}>JPG or PNG, max 5MB. Optional.</p>
      </div>
    </div>
  );
}


// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function CustomDropdown({ options, value, onChange, error, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', height: '40px', boxSizing: 'border-box',
          background: open ? '#E4ECFC' : value ? '#E4ECFC' : C.white,
          border: '1px solid ' + (error ? C.danger : open ? '#BFDBFE' : C.borderMedium),
          borderRadius: open ? '8px 8px 0 0' : '8px',
          padding: '0 36px 0 12px',
          display: 'flex', alignItems: 'center',
          fontFamily: F.body, fontSize: '13px',
          color: value ? C.textPrimary : C.textTertiary,
          cursor: 'pointer', userSelect: 'none',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ flex: 1 }}>{selected ? selected.label : placeholder}</span>
        <i
          className={'ti ' + (open ? 'ti-chevron-up' : 'ti-chevron-down')}
          style={{
            position: 'absolute', right: '10px',
            fontSize: '14px', color: C.textSecondary,
            transition: 'transform 0.15s',
          }}
        />
      </div>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: C.white,
          border: '1px solid #BFDBFE',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 4px 12px rgba(0,45,91,0.1)',
          overflow: 'hidden',
        }}>
          {options.filter(o => o.value !== '').map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '10px 12px',
                fontFamily: F.body, fontSize: '13px',
                color: o.value === value ? C.primary : C.textPrimary,
                background: o.value === value ? '#E4ECFC' : C.white,
                cursor: 'pointer',
                fontWeight: o.value === value ? 600 : 400,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = '#F0F5FF'; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = C.white; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vertical Stepper (standalone middle column) ───────────────────────────────
function VerticalStepper({ current }) {
  return (
    <div style={{
      width: '200px',
      minWidth: '200px',
      flexShrink: 0,
      background: C.pageBg,
      padding: '32px 20px 24px 24px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {STEPS.map((step, idx) => {
        const done   = step.n < current;
        const active = step.n === current;

        return (
          <div key={step.n} style={{ display: 'flex', gap: '12px' }}>
            {/* Dot + connector line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              {/* Circle */}
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '4px',
                background: active || done ? C.primary : 'transparent',
                border: '2px solid ' + (active || done ? C.primary : C.borderMedium),
                transition: 'all 0.2s',
              }} />
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  width: '1.5px',
                  flex: 1,
                  minHeight: '48px',
                  background: done ? C.primary : C.borderMedium,
                  margin: '4px 0',
                  opacity: done ? 1 : 0.4,
                }} />
              )}
            </div>

            {/* Step labels */}
            <div style={{ paddingBottom: idx < STEPS.length - 1 ? '16px' : '0', paddingTop: '0' }}>
              <p style={{
                margin: '0 0 3px',
                fontFamily: F.headline,
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                color: active ? C.textPrimary : done ? C.textSecondary : C.textTertiary,
                lineHeight: 1.3,
              }}>
                {step.label}
              </p>
              <p style={{
                margin: 0,
                fontFamily: F.body,
                fontSize: '11px',
                color: active ? C.textSecondary : C.textTertiary,
                lineHeight: 1.45,
              }}>
                {step.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Left Nav ──────────────────────────────────────────────────────────────────
function LeftNav() {
  return (
    <div style={{
      width: '185px',
      minWidth: '185px',
      flexShrink: 0,
      background: C.navBg,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{
        height: '60px', flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontFamily: F.headline, fontSize: '17px', fontWeight: 700, color: C.white }}>UrbanNest</span>
        <span style={{ fontFamily: F.body, fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Editorial Admin</span>
      </div>

      {/* Onboarding — only nav item */}
      <div style={{
        margin: '16px 10px 0',
        borderRadius: '6px', padding: '9px 12px',
        display: 'flex', alignItems: 'center', gap: '9px',
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <i className="ti ti-layout-dashboard" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)' }} />
        <span style={{ fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.white }}>Onboarding</span>
      </div>

      {/* Bottom links */}
      <div style={{ marginTop: 'auto', padding: '20px' }}>
        {[['ti-help-circle', 'Help Center'], ['ti-logout', 'Sign out']].map(([icon, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
            <i className={'ti ' + icon} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }} />
            <span style={{ fontFamily: F.body, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header({ userName, userRole }) {
  return (
    <div style={{
      height: '60px', flexShrink: 0,
      background: C.white, borderBottom: '1px solid ' + C.border,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: C.neutral, borderRadius: '8px',
        padding: '0 14px', height: '36px', width: '280px',
      }}>
        <i className="ti ti-search" style={{ fontSize: '14px', color: C.textTertiary }} />
        <input type="text" placeholder="Search portfolios, settings, or help…" style={{
          background: 'none', border: 'none', outline: 'none',
          fontFamily: F.body, fontSize: '12px', color: C.textSecondary, width: '100%',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <i className="ti ti-bell" style={{ fontSize: '18px', color: C.textSecondary, cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', borderLeft: '1px solid ' + C.border }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', fontWeight: 600, color: C.textPrimary }}>{userName}</p>
            <p style={{ margin: 0, fontFamily: F.body, fontSize: '9px', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{userRole}</p>
          </div>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-user" style={{ fontSize: '16px', color: C.white }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1 main component ─────────────────────────────────────────────────────
export default function IndependentPM_Step1() {
  const navigate = useNavigate();

  const [userName,     setUserName]     = useState('');
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [userRole,     setUserRole]     = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [yearsExp,     setYearsExp]     = useState('');
  const [maxUnits,     setMaxUnits]     = useState('');
  const [bio,          setBio]          = useState('');
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});

  const [businessTypes, setBusinessTypes] = useState({
    property_management: false, tenant_placement: false, buy: false, sell: false,
  });
  const [propertyTypes, setPropertyTypes] = useState({
    residential: false, commercial: false, student_housing: false, short_term: false, mixed: false,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:8001/api/auth/me/', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (res.ok) {
          const data = await res.json();
          const first = data.first_name || '';
          const last  = data.last_name  || '';
          const full  = (first + ' ' + last).trim() || data.email || 'User';
          setUserName(full);
          setUserRole(data.role || data.persona || 'Property Manager');
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
        } else {
          // Fallback to JWT decode
          const decoded = decodeJWT(token);
          if (decoded) {
            const first = decoded.first_name || '';
            const last  = decoded.last_name  || '';
            const full  = (first + ' ' + last).trim() || decoded.email || 'User';
            setUserName(full);
            setUserRole(decoded.role || 'Property Manager');
            setFirstName(decoded.first_name||'');
            setLastName(decoded.last_name||'');
          }
        }
      } catch {
        const decoded = decodeJWT(localStorage.getItem('access_token'));
        if (decoded) setUserName(decoded.email || 'User');
      }
    };
    fetchUser();
  }, []);

  const toggleB = k => setBusinessTypes(p => ({ ...p, [k]: !p[k] }));
  const toggleP = k => setPropertyTypes(p => ({ ...p, [k]: !p[k] }));
  const handlePhoto = e => { const f = e.target.files[0]; if (f) setPhotoPreview(URL.createObjectURL(f)); };

  const validate = () => {
    const e = {};
    if (!yearsExp) e.yearsExp = 'Required';
    if (!maxUnits) e.maxUnits = 'Required';
    if (bio.trim().length < 50) e.bio = 'Minimum 50 characters';
    if (!Object.values(propertyTypes).some(Boolean)) e.propertyTypes = 'Select at least one';
    return e;
  };

  const handleContinue = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('years_of_experience', yearsExp);
      formData.append('bio',                 bio);
      formData.append('max_units_capacity',  maxUnits);

      // JSONField arrays must be sent as JSON strings
      formData.append('property_types', JSON.stringify(
        Object.entries(propertyTypes).filter(([,v]) => v).map(([k]) => k.toUpperCase())
      ));
      formData.append('business_types', JSON.stringify(
        Object.entries(businessTypes).filter(([,v]) => v).map(([k]) => k.toUpperCase())
      ));

      // Profile photo — only if user selected one
      if (photoPreview) {
        const photoInput = document.querySelector('input[type="file"][accept="image/jpeg,image/png"]');
        if (photoInput?.files[0]) formData.append('profile_photo', photoInput.files[0]);
      }

      const res = await fetch('http://localhost:8001/api/pm/register/', {
        method:  'POST',
        headers: { Authorization: 'Bearer ' + token },
        body:    formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.detail || data.non_field_errors?.[0] || 'Could not save. Please try again.';
        setErrors(p => ({ ...p, api: msg }));
        setSaving(false);
        return;
      }

      navigate('/pm-registration/step-2');

    } catch (err) {
      setErrors(p => ({ ...p, api: 'Connection error. Please check your connection.' }));
      setSaving(false);
    }
  };

  const EXP_OPTIONS = [
    { value: '',      label: 'Select range…' },
    { value: '0-1',   label: '0–1 years' },
    { value: '1-3',   label: '1–3 years' },
    { value: '3-5',   label: '3–5 years' },
    { value: '5-10',  label: '5–10 years' },
    { value: '10+',   label: '10+ years' },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes spin    { to   { transform: rotate(360deg); } }
        .pm-form-scroll::-webkit-scrollbar { width: 5px; }
        .pm-form-scroll::-webkit-scrollbar-track { background: transparent; }
        .pm-form-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      {/* ── Root shell: full viewport, no overflow ── */}
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: C.pageBg,
        fontFamily: F.body,
      }}>

        {/* ── Col 1: Left nav (fixed 185px, full height) ── */}
        <LeftNav />

        {/* ── Col 2 + 3: right side (header + body row) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Header (fixed 60px) */}
          <Header userName={userName} userRole={userRole} />

          {/* ── Full-width title block — left aligned, spans stepper+form ── */}
          <div style={{
            flexShrink: 0,
            padding: 'clamp(20px, 2.5vw, 32px) clamp(20px, 3vw, 48px) 0',
            background: C.pageBg,
          }}>
            <h1 style={{
              margin: '0 0 4px',
              fontFamily: F.headline,
              fontSize: 'clamp(22px, 2.2vw, 28px)',
              fontWeight: 700,
              color: C.textPrimary,
              lineHeight: 1.2,
            }}>
              Independent Property Manager
            </h1>
            <p style={{
              margin: '0 0 10px',
              fontFamily: F.headline,
              fontSize: 'clamp(13px, 1.2vw, 15px)',
              fontWeight: 600,
              color: C.green,
            }}>
              Registration &amp; Profile Setup
            </p>
            <p style={{
              margin: 0,
              fontFamily: F.body,
              fontSize: '13px',
              color: C.textSecondary,
              lineHeight: 1.6,
              maxWidth: '580px',
            }}>
              Complete your professional profile to join UrbanNest's network of certified
              property managers. Fields marked with an asterisk are required.
            </p>
          </div>

          {/* Body row: stepper + form side by side */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

            {/* ── Col 2: Vertical stepper (fixed 200px, does NOT scroll) ── */}
            <div style={{
              width: '200px',
              minWidth: '200px',
              flexShrink: 0,
              background: C.pageBg,
              borderRight: '1px solid ' + C.border,
              padding: 'clamp(16px, 2vw, 24px) 16px 24px clamp(20px, 3vw, 48px)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'hidden',
            }}>
              {/* Vertical steps */}
              {STEPS.map((step, idx) => {
                const done   = step.n < 1;
                const active = step.n === 1;
                return (
                  <div key={step.n} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        marginTop: '3px', flexShrink: 0,
                        background: active || done ? C.primary : 'transparent',
                        border: '2px solid ' + (active || done ? C.primary : C.borderMedium),
                      }} />
                      {idx < STEPS.length - 1 && (
                        <div style={{
                          width: '1.5px', flex: 1, minHeight: '44px',
                          background: done ? C.primary : C.borderMedium,
                          margin: '4px 0', opacity: done ? 1 : 0.35,
                        }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: idx < STEPS.length - 1 ? '16px' : 0 }}>
                      <p style={{
                        margin: '0 0 3px',
                        fontFamily: F.headline,
                        fontSize: '13px',
                        fontWeight: active ? 700 : 500,
                        color: active ? C.textPrimary : done ? C.textSecondary : C.textTertiary,
                        lineHeight: 1.3,
                      }}>
                        {step.label}
                      </p>
                      <p style={{
                        margin: 0,
                        fontFamily: F.body,
                        fontSize: '11px',
                        color: active ? C.textSecondary : C.textTertiary,
                        lineHeight: 1.45,
                      }}>
                        {step.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Col 3: Form area — THIS is the only scrolling column ── */}
            <div
              className="pm-form-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'clamp(16px, 2vw, 24px) clamp(20px, 3vw, 48px) clamp(20px, 2.5vw, 36px)',
                minWidth: 0,
              }}
            >
              {/* Form card — max-width 780px, centred */}
              <div style={{
                background: C.white,
                border: '1px solid ' + C.border,
                borderRadius: '12px',
                padding: 'clamp(20px, 2.5vw, 32px) clamp(20px, 3vw, 40px)',
                maxWidth: '780px',
                width: '100%',
                animation: 'fadein 0.3s ease both',
              }}>
                {/* Card header */}
                <h2 style={{ margin: '0 0 4px', fontFamily: F.headline, fontSize: '18px', fontWeight: 700, color: C.textPrimary }}>
                  Independent PM registration
                </h2>
                <p style={{ margin: '0 0 18px', fontFamily: F.body, fontSize: '12px', color: C.textTertiary }}>
                  Pre-filled from your account — read-only fields are locked
                </p>
                {errors.api && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                    <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{errors.api}</span>
                  </div>
                )}
                <div style={dividerS} />

                {/* Name row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <span style={FL}>First Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.textTertiary }}>(Locked)</span></span>
                    <input style={inputS(true)} value={firstName} readOnly />
                  </div>
                  <div>
                    <span style={FL}>Last Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.textTertiary }}>(Locked)</span></span>
                    <input style={inputS(true)} value={lastName} readOnly />
                  </div>
                </div>
                <div style={dividerS} />

                {/* Profile photo */}
                <div style={{ marginBottom: '18px' }}>
                  <span style={FL}>Profile Photo</span>
                  <PhotoUpload preview={photoPreview} onChange={handlePhoto} />
                </div>
                <div style={dividerS} />

                {/* Experience + Max units */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <span style={FL}>Years of Experience *</span>
                    <CustomDropdown
                      options={EXP_OPTIONS}
                      value={yearsExp}
                      placeholder="Select range…"
                      error={!!errors.yearsExp}
                      onChange={v => { setYearsExp(v); setErrors(p => ({ ...p, yearsExp: '' })); }}
                    />
                    {errors.yearsExp && <p style={hintS(true)}>{errors.yearsExp}</p>}
                  </div>
                  <div>
                    <span style={FL}>Max Units Capacity *</span>
                    <input
                      type="number" min="1" placeholder="e.g. 25"
                      style={inputS(false, !!errors.maxUnits)}
                      value={maxUnits}
                      onChange={e => { setMaxUnits(e.target.value); setErrors(p => ({ ...p, maxUnits: '' })); }}
                    />
                    {errors.maxUnits
                      ? <p style={hintS(true)}>{errors.maxUnits}</p>
                      : <p style={hintS()}>How many units can you manage?</p>}
                  </div>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: '18px' }}>
                  <span style={FL}>Bio / About Me *</span>
                  <textarea
                    placeholder="Describe your experience, approach, and what makes you stand out…"
                    style={{
                      width: '100%', minHeight: '100px',
                      background: C.white,
                      border: '1px solid ' + (errors.bio ? C.danger : C.borderMedium),
                      borderRadius: '8px', padding: '10px 12px',
                      fontFamily: F.body, fontSize: '13px', color: C.textPrimary,
                      resize: 'vertical', outline: 'none', lineHeight: 1.55, boxSizing: 'border-box',
                    }}
                    value={bio}
                    onChange={e => { setBio(e.target.value); setErrors(p => ({ ...p, bio: '' })); }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ ...hintS(!!errors.bio), margin: 0 }}>
                      {errors.bio || 'Shown publicly on your profile. Min 50 characters.'}
                    </p>
                    <p style={{ ...hintS(bio.length < 50 && bio.length > 0), margin: 0 }}>{bio.length}/50</p>
                  </div>
                </div>
                <div style={dividerS} />

                {/* Type of business */}
                <div style={{ marginBottom: '18px' }}>
                  <span style={FL}>Type of Business *</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: '8px' }}>
                    {[['property_management','Property Management'],['tenant_placement','Tenant Placement'],['buy','Buy'],['sell','Sell']].map(([k, l]) => (
                      <Checkbox key={k} label={l} checked={businessTypes[k]} onChange={() => toggleB(k)} />
                    ))}
                  </div>
                  <p style={hintS()}>Select all that apply</p>
                </div>

                {/* Property types */}
                <div style={{ marginBottom: '24px' }}>
                  <span style={FL}>Property Types Managed *</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: '8px' }}>
                    {[['residential','Residential'],['commercial','Commercial'],['student_housing','Student Housing'],['short_term','Short-term'],['mixed','Mixed']].map(([k, l]) => (
                      <Checkbox key={k} label={l} checked={propertyTypes[k]} onChange={() => { toggleP(k); setErrors(p => ({ ...p, propertyTypes: '' })); }} />
                    ))}
                  </div>
                  {errors.propertyTypes
                    ? <p style={hintS(true)}>{errors.propertyTypes}</p>
                    : <p style={hintS()}>Select all that apply</p>}
                </div>
                <div style={dividerS} />

                {/* Footer row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ti ti-device-floppy" style={{ fontSize: '13px', color: C.textTertiary }} />
                    <span style={{ fontFamily: F.body, fontSize: '11px', color: C.textTertiary }}>Progress auto-saved</span>
                  </div>
                  <button
                    onClick={handleContinue}
                    disabled={saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      height: '44px', padding: '0 28px',
                      background: saving ? C.borderMedium : C.primary,
                      color: C.white, border: 'none', borderRadius: '9px',
                      fontFamily: F.body, fontSize: '13px', fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.background = C.primaryHover; }}
                    onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.primary; }}
                  >
                    {saving
                      ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                      : <>Continue <i className="ti ti-arrow-right" style={{ fontSize: '14px' }} /></>
                    }
                  </button>
                </div>
              </div>

              {/* Page footer */}
              <p style={{
                textAlign: 'center', fontFamily: F.body, fontSize: '10px',
                color: C.textTertiary, margin: '24px 0 16px', letterSpacing: '0.04em',
              }}>
                © 2024 URBANNEST EDITORIAL SYSTEMS. ALL RIGHTS RESERVED.
              </p>
            </div>
            {/* ── End Col 3 ── */}

          </div>
          {/* ── End body row ── */}
        </div>
        {/* ── End right side ── */}
      </div>
    </>
  );
}
