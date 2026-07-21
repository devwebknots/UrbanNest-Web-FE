import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const C = {
  primary:'#002D5B', primaryHover:'#003d7a', navBg:'#1a2332', pageBg:'#F1F5F9',
  border:'#E2E8F0', borderMedium:'#CBD5E1', textPrimary:'#0F172A', textSecondary:'#64748B',
  textTertiary:'#94A3B8', white:'#FFFFFF', neutral:'#F8FAFC', danger:'#E53E3E', green:'#16A34A',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

const STEPS = [
  { n:1, label:'Personal Details',      sub:'Name, phone, occupation' },
  { n:2, label:'Residential Address',   sub:'Where you live' },
  { n:3, label:'Identity Verification', sub:'ID type, number & document' },
];

const FL = { display:'block', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' };
const inputS = (disabled=false, error=false) => ({ width:'100%', height:'40px', boxSizing:'border-box', background:disabled?C.neutral:C.white, border:'1px solid '+(error?C.danger:disabled?C.border:C.borderMedium), borderRadius:'8px', padding:'0 12px', fontFamily:F.body, fontSize:'13px', color:disabled?C.textTertiary:C.textPrimary, cursor:disabled?'not-allowed':'text', outline:'none' });
const hintS = (error=false) => ({ fontFamily:F.body, fontSize:'11px', color:error?C.danger:C.textTertiary, marginTop:'4px' });
const dividerS = { borderTop:'1px solid '+C.border, margin:'20px 0' };

function PhotoUpload({ preview, onChange }) {
  const ref = useRef();
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
      <div style={{ width:'52px', height:'52px', borderRadius:'50%', flexShrink:0, background:C.neutral, border:'1.5px solid '+C.borderMedium, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {preview ? <img src={preview} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <i className="ti ti-user" style={{ fontSize:'20px', color:C.textTertiary }} />}
      </div>
      <div>
        <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display:'none' }} onChange={onChange} />
        <button type="button" onClick={() => ref.current?.click()} style={{ display:'flex', alignItems:'center', gap:'6px', height:'34px', padding:'0 14px', background:C.white, border:'1.5px solid '+C.borderMedium, borderRadius:'7px', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary, cursor:'pointer' }}>
          <i className="ti ti-upload" style={{ fontSize:'12px' }} />Upload photo
        </button>
        <p style={{ ...hintS(), margin:'5px 0 0' }}>JPG or PNG, max 5MB. Optional.</p>
      </div>
    </div>
  );
}

function LeftNav() {
  return (
    <div style={{ width:'185px', minWidth:'185px', flexShrink:0, background:C.navBg, display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ height:'60px', flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily:F.headline, fontSize:'17px', fontWeight:700, color:C.white }}>UrbanNest</span>
        <span style={{ fontFamily:F.body, fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Landlord Onboarding</span>
      </div>
      <div style={{ margin:'16px 10px 0', borderRadius:'6px', padding:'9px 12px', display:'flex', alignItems:'center', gap:'9px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.08)' }}>
        <i className="ti ti-home-2" style={{ fontSize:'15px', color:'rgba(255,255,255,0.85)' }} />
        <span style={{ fontFamily:F.body, fontSize:'13px', fontWeight:600, color:C.white }}>Onboarding</span>
      </div>
      <div style={{ marginTop:'auto', padding:'20px' }}>
        {[['ti-help-circle','Help Center'],['ti-logout','Sign out']].map(([icon,label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', cursor:'pointer' }}>
            <i className={'ti '+icon} style={{ fontSize:'14px', color:'rgba(255,255,255,0.35)' }} />
            <span style={{ fontFamily:F.body, fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ userName, userRole }) {
  return (
    <div style={{ height:'60px', flexShrink:0, background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', background:C.neutral, borderRadius:'8px', padding:'0 14px', height:'36px', width:'280px' }}>
        <i className="ti ti-search" style={{ fontSize:'14px', color:C.textTertiary }} />
        <input type="text" placeholder="Search…" style={{ background:'none', border:'none', outline:'none', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, width:'100%' }} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
        <i className="ti ti-bell" style={{ fontSize:'18px', color:C.textSecondary, cursor:'pointer' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px', paddingLeft:'12px', borderLeft:'1px solid '+C.border }}>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', fontWeight:600, color:C.textPrimary }}>{userName}</p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'9px', color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.06em' }}>{userRole}</p>
          </div>
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:C.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-user" style={{ fontSize:'16px', color:C.white }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerticalStepper({ current }) {
  return (
    <div style={{ width:'200px', minWidth:'200px', flexShrink:0, background:C.pageBg, borderRight:'1px solid '+C.border, padding:'clamp(16px,2vw,24px) 16px 24px clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', overflowY:'hidden' }}>
      {STEPS.map((step, idx) => {
        const done = step.n < current, active = step.n === current;
        return (
          <div key={step.n} style={{ display:'flex', gap:'12px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', marginTop:'3px', flexShrink:0, background:active||done?C.primary:'transparent', border:'2px solid '+(active||done?C.primary:C.borderMedium) }} />
              {idx < STEPS.length-1 && <div style={{ width:'1.5px', flex:1, minHeight:'44px', background:done?C.primary:C.borderMedium, margin:'4px 0', opacity:done?1:0.35 }} />}
            </div>
            <div style={{ paddingBottom:idx<STEPS.length-1?'16px':0 }}>
              <p style={{ margin:'0 0 3px', fontFamily:F.headline, fontSize:'13px', fontWeight:active?700:500, color:active?C.textPrimary:done?C.textSecondary:C.textTertiary, lineHeight:1.3 }}>{step.label}</p>
              <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:active?C.textSecondary:C.textTertiary, lineHeight:1.45 }}>{step.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LandlordOnboarding_Step1() {
  const navigate = useNavigate();

  const [userName,     setUserName]     = useState('');
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [userCountry,  setUserCountry]  = useState('US');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [phone,        setPhone]        = useState('');
  const [occupation,   setOccupation]   = useState('');
  const [profileExists,setProfileExists]= useState(false);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) { navigate('/login'); return; }
      try {
        const res = await fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } });
        if (res.ok) {
          const data = await res.json();
          const full = ((data.first_name||'')+' '+(data.last_name||'')).trim() || data.email || 'User';
          setUserName(full);
          setFirstName(data.first_name||'');
          setLastName(data.last_name||'');
          const country = data.country || 'US';
          setUserCountry(country);
          setPhone(data.phone || '');

          // Resume flow — if a partial LandlordProfile already exists for this
          // country (e.g. they left after Step 1 before), pre-fill from it.
          // Mirrors the same resume pattern used in Step 2 for address fields.
          try {
            const profRes = await fetch(`http://localhost:8001/api/landlord/register/?country=${country}`, { headers:{ Authorization:'Bearer '+token } });
            if (profRes.ok) {
              const profData = await profRes.json();
              if (profData?.exists) setProfileExists(true);
              const p = profData?.profile;
              if (p) {
                if (p.phone)      setPhone(p.phone);
                if (p.occupation) setOccupation(p.occupation);
                if (p.profile_photo) setPhotoPreview(`http://localhost:8001${p.profile_photo}`);
              }
            }
          } catch {
            // Non-blocking — resume pre-fill is a convenience, not required for the form to work
          }
        } else {
          const d = decodeJWT(token);
          if (d) { setUserName(((d.first_name||'')+' '+(d.last_name||'')).trim()||d.email||'User'); setFirstName(d.first_name||''); setLastName(d.last_name||''); }
        }
      } catch {
        const d = decodeJWT(localStorage.getItem('access_token'));
        if (d) setUserName(d.email||'User');
      }
    };
    fetchUser();
  }, [navigate]);

  const handlePhoto = e => { const f = e.target.files[0]; if (f) setPhotoPreview(URL.createObjectURL(f)); };

  const validate = () => {
    const e = {};
    if (!phone.trim()) e.phone = 'Required';
    return e;
  };

  const handleContinue = async () => {
    setErrors({});
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('country',    userCountry);
      formData.append('phone',      phone);
      formData.append('occupation', occupation);

      if (photoPreview) {
        const photoInput = document.querySelector('input[type="file"][accept="image/jpeg,image/png"]');
        if (photoInput?.files[0]) formData.append('profile_photo', photoInput.files[0]);
      }

      const res = await fetch('http://localhost:8001/api/landlord/register/', {
        method: profileExists ? 'PATCH' : 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors(p => ({ ...p, api: data.detail || 'Could not save. Please try again.' }));
        setSaving(false);
        return;
      }

      navigate('/landlord-registration/step-2', { state: { country: userCountry } });
    } catch {
      setErrors(p => ({ ...p, api: 'Connection error. Please check your connection.' }));
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lo-form-scroll::-webkit-scrollbar { width: 5px; }
        .lo-form-scroll::-webkit-scrollbar-track { background: transparent; }
        .lo-form-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg, fontFamily:F.body }}>
        <LeftNav />

        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <Header userName={userName} userRole="Landlord" />

          <div style={{ flexShrink:0, padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,48px) 0', background:C.pageBg }}>
            <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'clamp(22px,2.2vw,28px)', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>
              Independent Landlord
            </h1>
            <p style={{ margin:'0 0 10px', fontFamily:F.headline, fontSize:'clamp(13px,1.2vw,15px)', fontWeight:600, color:C.green }}>
              Registration &amp; Profile Setup
            </p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>
              Set up your landlord profile to manage your properties directly — without a property manager.
              Fields marked with an asterisk are required.
            </p>
          </div>

          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
            <VerticalStepper current={1} />

            <div className="lo-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'780px', width:'100%', animation:'fadein 0.3s ease both' }}>

                <h2 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Landlord registration</h2>
                <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Pre-filled from your account — locked fields can't be edited here</p>
                {errors.api && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                    <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{errors.api}</span>
                  </div>
                )}
                <div style={dividerS} />

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'18px' }}>
                  <div>
                    <span style={FL}>First Name <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:C.textTertiary }}>(Locked)</span></span>
                    <input style={inputS(true)} value={firstName} readOnly />
                  </div>
                  <div>
                    <span style={FL}>Last Name <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:C.textTertiary }}>(Locked)</span></span>
                    <input style={inputS(true)} value={lastName} readOnly />
                  </div>
                </div>
                <div style={dividerS} />

                <div style={{ marginBottom:'18px' }}>
                  <span style={FL}>Profile Photo</span>
                  <PhotoUpload preview={photoPreview} onChange={handlePhoto} />
                </div>
                <div style={dividerS} />

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'8px' }}>
                  <div>
                    <span style={FL}>Phone Number *</span>
                    <input style={inputS(false, !!errors.phone)} placeholder="(555) 123-4567" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone:'' })); }} />
                    {errors.phone ? <p style={hintS(true)}>{errors.phone}</p> : <p style={hintS()}>Used for tenant and PM contact</p>}
                  </div>
                  <div>
                    <span style={FL}>Occupation</span>
                    <input style={inputS()} placeholder="e.g. Software engineer" value={occupation} onChange={e => setOccupation(e.target.value)} />
                    <p style={hintS()}>Optional</p>
                  </div>
                </div>
                <div style={dividerS} />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <i className="ti ti-device-floppy" style={{ fontSize:'13px', color:C.textTertiary }} />
                    <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Progress auto-saved</span>
                  </div>
                  <button onClick={handleContinue} disabled={saving}
                    style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:saving?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer' }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.background = C.primaryHover; }}
                    onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.primary; }}
                  >
                    {saving ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Saving…</> : <>Continue <i className="ti ti-arrow-right" style={{ fontSize:'14px' }} /></>}
                  </button>
                </div>
              </div>

              <p style={{ textAlign:'center', fontFamily:F.body, fontSize:'10px', color:C.textTertiary, margin:'24px 0 16px', letterSpacing:'0.04em' }}>
                © 2024 URBANNEST EDITORIAL SYSTEMS. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
