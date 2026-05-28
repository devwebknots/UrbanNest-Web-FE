import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:      '#002D5B', primaryHover: '#003d7a', navBg: '#1a2332',
  pageBg:       '#F1F5F9', border: '#E2E8F0', borderMedium: '#CBD5E1',
  textPrimary:  '#0F172A', textSecondary: '#64748B', textTertiary: '#94A3B8',
  white:        '#FFFFFF', neutral: '#F8FAFC', danger: '#E53E3E',
  green:        '#16A34A', dropdownBg: '#E4ECFC',
  infoBg:       '#EFF6FF', infoBorder: '#BFDBFE', infoText: '#1D4ED8',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

// ─── JWT + API ─────────────────────────────────────────────────────────────────
function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { n:1, label:'Professional Profile',   sub:'Tell landlords about you and your experience' },
  { n:2, label:'Service Area & License', sub:'Where you operate and your professional credentials' },
  { n:3, label:'Fees & Identity',        sub:'Your fee structure & ID verification' },
];

// ─── Field styles ──────────────────────────────────────────────────────────────
const FL = { display:'block', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' };
const inputS = (disabled=false, error=false) => ({ width:'100%', height:'40px', boxSizing:'border-box', background:disabled?C.neutral:C.white, border:'1px solid '+(error?C.danger:disabled?C.border:C.borderMedium), borderRadius:'8px', padding:'0 12px', fontFamily:F.body, fontSize:'13px', color:disabled?C.textTertiary:C.textPrimary, cursor:disabled?'not-allowed':'text', outline:'none' });
const hintS = (error=false) => ({ fontFamily:F.body, fontSize:'11px', color:error?C.danger:C.textTertiary, marginTop:'4px' });
const dividerS = { borderTop:'1px solid '+C.border, margin:'20px 0' };

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function CustomDropdown({ options, value, onChange, error, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find(o => o.value === value);
  if (disabled) return (
    <div style={{ width:'100%', height:'40px', boxSizing:'border-box', background:C.neutral, border:'1px solid '+C.border, borderRadius:'8px', padding:'0 12px', display:'flex', alignItems:'center', fontFamily:F.body, fontSize:'13px', color:C.textTertiary }}>
      {selected ? selected.label : placeholder}
    </div>
  );
  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <div onClick={() => setOpen(p=>!p)} style={{ width:'100%', height:'40px', boxSizing:'border-box', background:open||value?C.dropdownBg:C.white, border:'1px solid '+(error?C.danger:open?'#BFDBFE':C.borderMedium), borderRadius:open?'8px 8px 0 0':'8px', padding:'0 36px 0 12px', display:'flex', alignItems:'center', fontFamily:F.body, fontSize:'13px', color:value?C.textPrimary:C.textTertiary, cursor:'pointer', userSelect:'none', transition:'all 0.15s' }}>
        <span style={{ flex:1 }}>{selected ? selected.label : placeholder}</span>
        <i className={'ti '+(open?'ti-chevron-up':'ti-chevron-down')} style={{ position:'absolute', right:'10px', fontSize:'14px', color:C.textSecondary }} />
      </div>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:C.white, border:'1px solid #BFDBFE', borderTop:'none', borderRadius:'0 0 8px 8px', boxShadow:'0 4px 12px rgba(0,45,91,0.1)', overflow:'hidden', maxHeight:'220px', overflowY:'auto' }}>
          {options.filter(o=>o.value!=='').map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ padding:'10px 12px', fontFamily:F.body, fontSize:'13px', color:o.value===value?C.primary:C.textPrimary, background:o.value===value?C.dropdownBg:C.white, cursor:'pointer', fontWeight:o.value===value?600:400 }}
              onMouseEnter={e=>{ if(o.value!==value) e.currentTarget.style.background='#F0F5FF'; }}
              onMouseLeave={e=>{ if(o.value!==value) e.currentTarget.style.background=C.white; }}
            >{o.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── City tag input ───────────────────────────────────────────────────────────
function CityTagInput({ tags, onAdd, onRemove, error }) {
  const [val, setVal] = useState('');
  const ref = useRef();
  const handleKey = e => {
    if ((e.key==='Enter'||e.key===',') && val.trim()) { e.preventDefault(); onAdd(val.trim()); setVal(''); }
    if (e.key==='Backspace' && !val && tags.length) onRemove(tags[tags.length-1]);
  };
  return (
    <div onClick={() => ref.current?.focus()} style={{ minHeight:'40px', background:C.white, border:'1px solid '+(error?C.danger:C.borderMedium), borderRadius:'8px', padding:'5px 10px', display:'flex', flexWrap:'wrap', gap:'5px', alignItems:'center', cursor:'text', boxSizing:'border-box' }}>
      {tags.map(t => (
        <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:C.dropdownBg, border:'1px solid #BFDBFE', borderRadius:'5px', padding:'2px 7px', fontFamily:F.body, fontSize:'12px', fontWeight:500, color:C.textPrimary }}>
          {t}
          <button type="button" onClick={e=>{e.stopPropagation();onRemove(t);}} style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:C.textSecondary, fontSize:'12px', lineHeight:1 }}>×</button>
        </span>
      ))}
      <input ref={ref} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={handleKey} placeholder={tags.length?'Add city or zip…':'Type a city or zip and press Enter'} style={{ flex:1, minWidth:'120px', background:'none', border:'none', outline:'none', fontFamily:F.body, fontSize:'13px', color:C.textPrimary }} />
    </div>
  );
}

// ─── File attach ──────────────────────────────────────────────────────────────
function FileAttach({ label, onChange, fileName }) {
  const ref = useRef();
  return (
    <div onClick={() => ref.current?.click()} style={{ height:'40px', background:C.white, border:'1px solid '+C.borderMedium, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', cursor:'pointer', fontFamily:F.body, fontSize:'13px', color:fileName?C.textPrimary:C.textTertiary, boxSizing:'border-box' }}>
      <input ref={ref} type="file" style={{ display:'none' }} onChange={onChange} accept=".pdf,.jpg,.png" />
      <span>{fileName||label}</span>
      <i className="ti ti-paperclip" style={{ fontSize:'15px', color:C.textTertiary }} />
    </div>
  );
}

// ─── Left Nav ─────────────────────────────────────────────────────────────────
function LeftNav() {
  return (
    <div style={{ width:'185px', minWidth:'185px', flexShrink:0, background:C.navBg, display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ height:'60px', flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily:F.headline, fontSize:'17px', fontWeight:700, color:C.white }}>UrbanNest</span>
        <span style={{ fontFamily:F.body, fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Editorial Admin</span>
      </div>
      <div style={{ margin:'16px 10px 0', borderRadius:'6px', padding:'9px 12px', display:'flex', alignItems:'center', gap:'9px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.08)' }}>
        <i className="ti ti-layout-dashboard" style={{ fontSize:'15px', color:'rgba(255,255,255,0.85)' }} />
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

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ userName, userRole }) {
  return (
    <div style={{ height:'60px', flexShrink:0, background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', background:C.neutral, borderRadius:'8px', padding:'0 14px', height:'36px', width:'280px' }}>
        <i className="ti ti-search" style={{ fontSize:'14px', color:C.textTertiary }} />
        <input type="text" placeholder="Search portfolios, settings, or help…" style={{ background:'none', border:'none', outline:'none', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, width:'100%' }} />
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

// ─── Vertical Stepper ─────────────────────────────────────────────────────────
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

// ─── Main Step 2 ──────────────────────────────────────────────────────────────
export default function IndependentPM_Step2() {
  const navigate = useNavigate();

  const [userName,     setUserName]     = useState('');
  const [userRole,     setUserRole]     = useState('');
  const [state,        setState]        = useState('');
  const [cities,       setCities]       = useState(['Austin','Round Rock']);
  const [licenseNum,   setLicenseNum]   = useState('');
  const [issuingState, setIssuingState] = useState('Texas');
  const [expiryDate,   setExpiryDate]   = useState('');
  const [licenseFile,  setLicenseFile]  = useState(null);
  const [brokerageName,setBrokerageName]= useState('');
  const [brokerageLic, setBrokerageLic] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } });
        if (res.ok) {
          const data = await res.json();
          const full = ((data.first_name||'')+' '+(data.last_name||'')).trim() || data.email || 'User';
          setUserName(full); setUserRole(data.role||'Property Manager');
        } else {
          const d = decodeJWT(token);
          if (d) setUserName(((d.first_name||'')+' '+(d.last_name||'')).trim()||d.email||'User');
        }
      } catch {
        const d = decodeJWT(localStorage.getItem('access_token'));
        if (d) setUserName(d.email||'User');
      }
    };
    fetchUser();
  }, []);

  const addCity = c => { if (!cities.includes(c)) setCities(p=>[...p,c]); };
  const removeCity = c => setCities(p=>p.filter(x=>x!==c));

  const validate = () => {
    const e = {};
    if (!state) e.state = 'Required';
    if (!cities.length) e.cities = 'Add at least one city';
    return e;
  };

  const handleContinue = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');

      // type="date" already returns YYYY-MM-DD — use directly
      const formattedExpiry = expiryDate || null;

      // Use FormData only if there is a file, else use JSON
      let res;
      if (licenseFile) {
        const formData = new FormData();
        formData.append('country',          'US');
        formData.append('state',            state);
        // Send cities as JSON string — backend Step2Serializer uses ListField
        formData.append('cities',           JSON.stringify(cities));
        formData.append('license_number',   licenseNum);
        formData.append('issuing_state',    issuingState);
        formData.append('brokerage_name',   brokerageName);
        formData.append('brokerage_license',brokerageLic);
        if (formattedExpiry) formData.append('expiry_date', formattedExpiry);
        formData.append('license_document', licenseFile);
        res = await fetch('http://localhost:8001/api/pm/register/step-2/', {
          method:  'PATCH',
          headers: { Authorization: 'Bearer ' + token },
          body:    formData,
        });
      } else {
        // JSON body — cleaner, no multipart needed
        const body = {
          country:          'US',
          state:            state,
          cities:           cities,
          license_number:   licenseNum,
          issuing_state:    issuingState,
          brokerage_name:   brokerageName,
          brokerage_license:brokerageLic,
        };
        if (formattedExpiry) body.expiry_date = formattedExpiry;
        res = await fetch('http://localhost:8001/api/pm/register/step-2/', {
          method:  'PATCH',
          headers: {
            Authorization:  'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        const msg = data.detail || data.non_field_errors?.[0] || 'Could not save. Please try again.';
        setErrors(p => ({ ...p, api: msg }));
        setSaving(false);
        return;
      }

      navigate('/pm-registration/step-3');

    } catch (err) {
      setErrors(p => ({ ...p, api: 'Connection error. Please check your connection.' }));
      setSaving(false);
    }
  };

  const STATE_OPTIONS = [{ value:'', label:'Select state…' }, ...US_STATES.map(s=>({ value:s, label:s }))];
  const ISSUING_OPTIONS = US_STATES.map(s=>({ value:s, label:s }));

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        html, body, #root { height:100%; overflow:hidden; margin:0; padding:0; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .pm-form-scroll::-webkit-scrollbar { width:5px; }
        .pm-form-scroll::-webkit-scrollbar-track { background:transparent; }
        .pm-form-scroll::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg, fontFamily:F.body }}>
        <LeftNav />

        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <Header userName={userName} userRole={userRole} />

          {/* Full-width title block */}
          <div style={{ flexShrink:0, padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,48px) 0', background:C.pageBg }}>
            <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'clamp(22px,2.2vw,28px)', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>
              Independent Property Manager
            </h1>
            <p style={{ margin:'0 0 10px', fontFamily:F.headline, fontSize:'clamp(13px,1.2vw,15px)', fontWeight:600, color:C.green }}>
              Registration &amp; Profile Setup
            </p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>
              Complete your professional profile to join UrbanNest's network of certified property managers. Fields marked with an asterisk are required.
            </p>
          </div>

          {/* Body row */}
          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>

            {/* Vertical stepper — Step 2 active */}
            <VerticalStepper current={2} />

            {/* Form scroll col */}
            <div className="pm-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'780px', width:'100%', animation:'fadein 0.3s ease both' }}>

                <h2 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Independent PM registration</h2>
                <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Pre-filled from your account — read-only fields are locked</p>
                {errors.api && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                    <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{errors.api}</span>
                  </div>
                )}
                <div style={dividerS} />

                {/* Service Area */}
                <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Service Area</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>Country <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(Auto-detected)</span></span>
                    <CustomDropdown options={[{value:'US',label:'United States'}]} value="US" placeholder="United States" disabled />
                  </div>
                  <div>
                    <span style={FL}>State / Region *</span>
                    <CustomDropdown options={STATE_OPTIONS} value={state} placeholder="Select state…" error={!!errors.state} onChange={v=>{setState(v);setErrors(p=>({...p,state:''}));}} />
                    {errors.state ? <p style={hintS(true)}>{errors.state}</p> : <p style={hintS()}>Determines license requirements</p>}
                  </div>
                </div>
                <div style={{ marginBottom:'4px' }}>
                  <span style={FL}>Cities Served *</span>
                  <CityTagInput tags={cities} onAdd={addCity} onRemove={removeCity} error={!!errors.cities} />
                  {errors.cities ? <p style={hintS(true)}>{errors.cities}</p> : <p style={hintS()}>Type a city name or zip code and press Enter</p>}
                </div>

                <div style={dividerS} />

                {/* Professional License */}
                <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'14px' }}>
                  <i className="ti ti-info-circle" style={{ fontSize:'14px', color:C.textSecondary }} />
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Professional License</p>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>License Number</span>
                    <input style={inputS()} placeholder="e.g. PM-12345" value={licenseNum} onChange={e=>setLicenseNum(e.target.value)} />
                  </div>
                  <div>
                    <span style={FL}>Issuing State</span>
                    <CustomDropdown options={ISSUING_OPTIONS} value={issuingState} placeholder="Select state…" onChange={v=>setIssuingState(v)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>License Expiry Date</span>
                    <div style={{ position:'relative' }}>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                          ...inputS(),
                          paddingRight:'36px',
                          color: expiryDate ? C.textPrimary : C.textTertiary,
                          cursor:'pointer',
                          // Hide native calendar icon — we show our own
                          colorScheme:'light',
                        }}
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                      />
                      <i className="ti ti-calendar" style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', color:C.textTertiary, pointerEvents:'none' }} />
                    </div>
                    <p style={hintS()}>License must not be expired</p>
                  </div>
                  <div>
                    <span style={FL}>License Document (Optional)</span>
                    <FileAttach label="Upload file…" fileName={licenseFile?.name} onChange={e=>setLicenseFile(e.target.files[0])} />
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:C.infoBg, border:'1px solid '+C.infoBorder, borderRadius:'8px', padding:'11px 14px' }}>
                  <i className="ti ti-info-circle" style={{ fontSize:'15px', color:C.infoText, flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:C.infoText, lineHeight:1.55 }}>If you skip the license now, you'll have 30 days to submit it after activation. Your account will be restricted if not submitted in time.</p>
                </div>

                <div style={dividerS} />

                {/* Brokerage */}
                <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Brokerage Information</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
                  <div>
                    <span style={FL}>Brokerage Name</span>
                    <input style={inputS()} placeholder="Enter brokerage name" value={brokerageName} onChange={e=>setBrokerageName(e.target.value)} />
                  </div>
                  <div>
                    <span style={FL}>Brokerage License #</span>
                    <input style={inputS()} placeholder="Enter license number" value={brokerageLic} onChange={e=>setBrokerageLic(e.target.value)} />
                  </div>
                </div>

                <div style={dividerS} />

                {/* Footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <button onClick={()=>navigate('/pm-registration')} style={{ display:'flex', alignItems:'center', gap:'7px', height:'44px', padding:'0 22px', background:C.white, color:C.textPrimary, border:'1.5px solid '+C.borderMedium, borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    <i className="ti ti-arrow-left" style={{ fontSize:'14px' }} /> Back
                  </button>
                  <button onClick={handleContinue} disabled={saving}
                    style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:saving?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background=C.primaryHover; }}
                    onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=C.primary; }}
                  >
                    {saving ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Saving…</> : <>Continue <i className="ti ti-arrow-right" style={{ fontSize:'14px' }} /></>}
                  </button>
                </div>
              </div>
              <p style={{ textAlign:'center', fontFamily:F.body, fontSize:'10px', color:C.textTertiary, margin:'24px 0 16px', letterSpacing:'0.04em' }}>© 2024 URBANNEST EDITORIAL SYSTEMS. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
