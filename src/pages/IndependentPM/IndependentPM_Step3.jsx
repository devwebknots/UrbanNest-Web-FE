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
  textTertiary:'#94A3B8', white:'#FFFFFF', neutral:'#F8FAFC', danger:'#E53E3E',
  green:'#16A34A', dropdownBg:'#E4ECFC',
  successBg:'#ECFDF5', successBorder:'#6EE7B7', successText:'#065F46',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

const STEPS = [
  { n:1, label:'Professional Profile',   sub:'Tell landlords about you and your experience' },
  { n:2, label:'Service Area & License', sub:'Where you operate and your professional credentials' },
  { n:3, label:'Fees & Identity',        sub:'Your fee structure & ID verification' },
];

const FL = { display:'block', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' };
const inputS = (error=false) => ({ width:'100%', height:'40px', boxSizing:'border-box', background:C.white, border:'1px solid '+(error?C.danger:C.borderMedium), borderRadius:'8px', padding:'0 12px', fontFamily:F.body, fontSize:'13px', color:C.textPrimary, outline:'none' });
const hintS = (error=false) => ({ fontFamily:F.body, fontSize:'11px', color:error?C.danger:C.textTertiary, marginTop:'4px' });
const dividerS = { borderTop:'1px solid '+C.border, margin:'20px 0' };

// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function CustomDropdown({ options, value, onChange, error, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <div onClick={()=>setOpen(p=>!p)} style={{ width:'100%', height:'40px', boxSizing:'border-box', background:open||value?C.dropdownBg:C.white, border:'1px solid '+(error?C.danger:open?'#BFDBFE':C.borderMedium), borderRadius:open?'8px 8px 0 0':'8px', padding:'0 36px 0 12px', display:'flex', alignItems:'center', fontFamily:F.body, fontSize:'13px', color:value?C.textPrimary:C.textTertiary, cursor:'pointer', userSelect:'none', transition:'all 0.15s' }}>
        <span style={{ flex:1 }}>{selected?selected.label:placeholder}</span>
        <i className={'ti '+(open?'ti-chevron-up':'ti-chevron-down')} style={{ position:'absolute', right:'10px', fontSize:'14px', color:C.textSecondary }} />
      </div>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:C.white, border:'1px solid #BFDBFE', borderTop:'none', borderRadius:'0 0 8px 8px', boxShadow:'0 4px 12px rgba(0,45,91,0.1)', overflow:'hidden', maxHeight:'220px', overflowY:'auto' }}>
          {options.filter(o=>o.value!=='').map(o=>(
            <div key={o.value} onClick={()=>{onChange(o.value);setOpen(false);}}
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

// ─── Document upload zone ──────────────────────────────────────────────────────
function DocUploadZone({ files, onAdd, onRemove }) {
  const ref = useRef();
  const MAX = 3;
  return (
    <div>
      <div onClick={()=>files.length<MAX&&ref.current?.click()}
        style={{ border:'1.5px dashed '+C.borderMedium, borderRadius:'10px', padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', cursor:files.length<MAX?'pointer':'default', background:C.white, transition:'border-color 0.15s' }}
        onMouseEnter={e=>{ if(files.length<MAX) e.currentTarget.style.borderColor=C.primary; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.borderMedium; }}
      >
        <input ref={ref} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" style={{ display:'none' }} onChange={e=>{ onAdd(Array.from(e.target.files).slice(0,MAX-files.length)); e.target.value=''; }} />
        <i className="ti ti-upload" style={{ fontSize:'20px', color:C.textTertiary }} />
        <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', fontWeight:600, color:C.textPrimary }}>Upload ID document(s)</p>
        <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Up to 3 files — JPG, PNG, or PDF. Max 10MB each.</p>
      </div>
      {files.length>0 && (
        <div style={{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'7px' }}>
          {files.map((f,i) => (
            <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:C.neutral, border:'1px solid '+C.borderMedium, borderRadius:'5px', padding:'3px 9px', fontFamily:F.body, fontSize:'11px', color:C.textPrimary }}>
              <i className="ti ti-file" style={{ fontSize:'11px', color:C.textSecondary }} />{f.name}
              <button type="button" onClick={()=>onRemove(i)} style={{ background:'none', border:'none', cursor:'pointer', color:C.textSecondary, fontSize:'13px', padding:'0', lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
      )}
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
        {[['ti-help-circle','Help Center'],['ti-logout','Sign Out']].map(([icon,label]) => (
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
      {STEPS.map((step,idx) => {
        const done = step.n < current, active = step.n === current;
        return (
          <div key={step.n} style={{ display:'flex', gap:'12px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', marginTop:'3px', flexShrink:0, background:active||done?C.primary:'transparent', border:'2px solid '+(active||done?C.primary:C.borderMedium) }} />
              {idx<STEPS.length-1 && <div style={{ width:'1.5px', flex:1, minHeight:'44px', background:done?C.primary:C.borderMedium, margin:'4px 0', opacity:done?1:0.35 }} />}
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

// ─── Main Step 3 ──────────────────────────────────────────────────────────────
export default function IndependentPM_Step3() {
  const navigate = useNavigate();

  const [userName,     setUserName]    = useState('');
  const [userRole,     setUserRole]    = useState('');
  const [mgmtType,     setMgmtType]    = useState('');
  const [mgmtValue,    setMgmtValue]   = useState('8%');
  const [leaseType,    setLeaseType]   = useState('');
  const [leaseValue,   setLeaseValue]  = useState('');
  const [renewalType,  setRenewalType] = useState('');
  const [renewalValue, setRenewalValue]= useState('');
  const [idType,       setIdType]      = useState('');
  const [idNumber,     setIdNumber]    = useState('');
  const [idFiles,      setIdFiles]     = useState([]);
  const [agreed,       setAgreed]      = useState(false);
  const [submitting,   setSubmitting]  = useState(false);
  const [errors,       setErrors]      = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } });
        if (res.ok) {
          const data = await res.json();
          const full = ((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User';
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

  const mgmtShowVal  = ['PERCENTAGE','FLAT'].includes(mgmtType);
  const leaseShowVal = ['FLAT'].includes(leaseType);
  const renewShowVal = ['PERCENTAGE','FLAT'].includes(renewalType);

  const validate = () => {
    const e = {};
    if (!mgmtType)        e.mgmtType = 'Required';
    if (!idType)          e.idType   = 'Required';
    if (!idNumber.trim()) e.idNumber = 'Required';
    if (!idFiles.length)  e.idFiles  = 'Upload at least one document';
    if (!agreed)          e.agreed   = 'You must accept the terms to continue';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');

      // ── PATCH step-3 — fees + identity ────────────────────────────────────
      const formData = new FormData();
      formData.append('management_fee_type', mgmtType);
      // Strip non-numeric chars (%, $) — backend expects decimal
      const cleanNum = v => v ? String(v).replace(/[^0-9.]/g, '') : null;
      if (mgmtShowVal && cleanNum(mgmtValue))    formData.append('management_fee_value',  cleanNum(mgmtValue));
      if (leaseType)                              formData.append('lease_up_fee_type',     leaseType);
      if (leaseShowVal && cleanNum(leaseValue))   formData.append('lease_up_fee_value',    cleanNum(leaseValue));
      if (renewalType)                            formData.append('renewal_fee_type',      renewalType);
      if (renewShowVal && cleanNum(renewalValue)) formData.append('renewal_fee_value',     cleanNum(renewalValue));
      formData.append('id_type',       idType);
      formData.append('id_number',     idNumber);
      formData.append('terms_accepted', 'true');

      if (idFiles[0]) formData.append('id_document_1', idFiles[0]);
      if (idFiles[1]) formData.append('id_document_2', idFiles[1]);
      if (idFiles[2]) formData.append('id_document_3', idFiles[2]);

      const step3Res = await fetch('http://localhost:8001/api/pm/register/step-3/', {
        method:  'PATCH',
        headers: { Authorization: 'Bearer ' + token },
        body:    formData,
      });

      if (!step3Res.ok) {
        const data = await step3Res.json();
        // Show detailed validation errors if available
        const msg = data.detail
          || Object.entries(data).map(([k,v]) => k + ': ' + (Array.isArray(v) ? v[0] : v)).join(' | ')
          || 'Could not save fees & identity. Please try again.';
        setErrors(p => ({ ...p, api: msg }));
        setSubmitting(false);
        return;
      }

      // ── POST submit — activate account ────────────────────────────────────
      const submitRes = await fetch('http://localhost:8001/api/pm/submit/', {
        method:  'POST',
        headers: {
          Authorization:  'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });

      const submitData = await submitRes.json();

      if (!submitRes.ok) {
        const msg = submitData.detail || 'Activation failed. Please try again.';
        setErrors(p => ({ ...p, api: msg }));
        setSubmitting(false);
        return;
      }

      // ── Success ───────────────────────────────────────────────────────────
      setSubmitting(false);
      navigate('/coming-soon');  // → /pm-portal once built

    } catch (err) {
      setErrors(p => ({ ...p, api: 'Connection error. Please check your connection.' }));
      setSubmitting(false);
    }
  };

  const MGMT_OPTS    = [{value:'',label:'Select…'},{value:'PERCENTAGE',label:'% of Monthly Rent'},{value:'FLAT',label:'Flat Monthly Fee'},{value:'NEGOTIABLE',label:'Negotiable'}];
  const LEASE_OPTS   = [{value:'',label:'Select…'},{value:'ONE_MONTH',label:"One Month's Rent"},{value:'FLAT',label:'Flat Fee'},{value:'NONE',label:'None'},{value:'NEGOTIABLE',label:'Negotiable'}];
  const RENEWAL_OPTS = [{value:'',label:'Select…'},{value:'PERCENTAGE',label:'% of Monthly Rent'},{value:'FLAT',label:'Flat Fee'},{value:'NONE',label:'None'},{value:'NEGOTIABLE',label:'Negotiable'}];
  const ID_OPTS      = [{value:'',label:'Select…'},{value:'DRIVERS_LICENSE',label:"Driver's License"},{value:'PASSPORT',label:'Passport'},{value:'STATE_ID',label:'State ID'},{value:'MILITARY_ID',label:'Military ID'}];

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

            {/* Vertical stepper — Step 3 active, Steps 1+2 completed */}
            <VerticalStepper current={3} />

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

                {/* Fee Structure */}
                <p style={{ margin:'0 0 4px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Fee Structure</p>
                <p style={{ margin:'0 0 16px', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Visible on your public profile</p>

                <div style={{ marginBottom:'16px' }}>
                  <span style={FL}>Management Fee Type *</span>
                  <div style={{ display:'grid', gridTemplateColumns:mgmtShowVal?'1fr 80px':'1fr', gap:'10px' }}>
                    <CustomDropdown options={MGMT_OPTS} value={mgmtType} placeholder="Select…" error={!!errors.mgmtType} onChange={v=>{setMgmtType(v);setErrors(p=>({...p,mgmtType:''}));}} />
                    {mgmtShowVal && <input type="text" style={{ ...inputS(), textAlign:'center' }} value={mgmtValue} onChange={e=>setMgmtValue(e.target.value)} placeholder="0" />}
                  </div>
                  {errors.mgmtType ? <p style={hintS(true)}>{errors.mgmtType}</p> : <p style={hintS()}>% of monthly rent / Flat monthly / Negotiable</p>}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'4px' }}>
                  <div>
                    <span style={FL}>Lease-up / Onboarding Fee</span>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <CustomDropdown options={LEASE_OPTS} value={leaseType} placeholder="Select…" onChange={v=>setLeaseType(v)} />
                      {leaseShowVal && <input type="text" style={{ ...inputS(), width:'68px', textAlign:'center', flexShrink:0 }} value={leaseValue} onChange={e=>setLeaseValue(e.target.value)} placeholder="$0" />}
                    </div>
                    <p style={hintS()}>One month's rent / Flat / None / Negotiable</p>
                  </div>
                  <div>
                    <span style={FL}>Lease Renewal Fee</span>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <CustomDropdown options={RENEWAL_OPTS} value={renewalType} placeholder="Select…" onChange={v=>setRenewalType(v)} />
                      {renewShowVal && <input type="text" style={{ ...inputS(), width:'68px', textAlign:'center', flexShrink:0 }} value={renewalValue} onChange={e=>setRenewalValue(e.target.value)} placeholder="0%" />}
                    </div>
                    <p style={hintS()}>% / Flat / None / Negotiable</p>
                  </div>
                </div>

                <div style={dividerS} />

                {/* Identity Verification */}
                <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Identity Verification</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'14px' }}>
                  <div>
                    <span style={FL}>ID Type *</span>
                    <CustomDropdown options={ID_OPTS} value={idType} placeholder="Select…" error={!!errors.idType} onChange={v=>{setIdType(v);setErrors(p=>({...p,idType:''}));}} />
                    {errors.idType ? <p style={hintS(true)}>{errors.idType}</p> : <p style={hintS()}>Filtered by country</p>}
                  </div>
                  <div>
                    <span style={FL}>ID Number *</span>
                    <input style={inputS(!!errors.idNumber)} placeholder="Enter ID number" value={idNumber} onChange={e=>{setIdNumber(e.target.value);setErrors(p=>({...p,idNumber:''}));}} />
                    {errors.idNumber && <p style={hintS(true)}>{errors.idNumber}</p>}
                  </div>
                </div>
                <div style={{ marginBottom:errors.idFiles?'4px':'0' }}>
                  <DocUploadZone files={idFiles} onAdd={f=>setIdFiles(p=>[...p,...f].slice(0,3))} onRemove={i=>setIdFiles(p=>p.filter((_,idx)=>idx!==i))} />
                  {errors.idFiles && <p style={hintS(true)}>{errors.idFiles}</p>}
                </div>

                <div style={dividerS} />

                {/* Terms & Subscription */}
                <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Terms &amp; Subscription</p>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:C.successBg, border:'1px solid '+C.successBorder, borderRadius:'8px', padding:'11px 14px', marginBottom:'14px' }}>
                  <i className="ti ti-gift" style={{ fontSize:'15px', color:C.successText, flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:C.successText, lineHeight:1.55 }}>Your account includes a 30-day free trial. No payment required today. A reminder will be sent on day 25.</p>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer', userSelect:'none' }}
                  onClick={()=>{setAgreed(p=>!p);setErrors(prev=>({...prev,agreed:''}));}}>
                  <div style={{ width:'16px', height:'16px', borderRadius:'4px', flexShrink:0, marginTop:'2px', border:errors.agreed?('2px solid '+C.danger):agreed?('2px solid '+C.primary):('1.5px solid '+C.borderMedium), background:agreed?C.primary:C.white, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s', cursor:'pointer' }}>
                    {agreed && <i className="ti ti-check" style={{ fontSize:'10px', color:C.white }} />}
                  </div>
                  <span style={{ fontFamily:F.body, fontSize:'13px', color:C.textPrimary, lineHeight:1.55 }}>
                    I agree to the UrbanNest{' '}
                    <a href="#" style={{ color:C.primary, fontWeight:600, textDecoration:'underline' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" style={{ color:C.primary, fontWeight:600, textDecoration:'underline' }}>Independent PM Code of Conduct</a>
                  </span>
                </div>
                {errors.agreed && <p style={{ ...hintS(true), marginTop:'6px' }}>{errors.agreed}</p>}

                <div style={dividerS} />

                {/* Footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <button onClick={()=>navigate('/pm-registration/step-2')} style={{ display:'flex', alignItems:'center', gap:'7px', height:'44px', padding:'0 22px', background:C.white, color:C.textPrimary, border:'1.5px solid '+C.borderMedium, borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    <i className="ti ti-arrow-left" style={{ fontSize:'14px' }} /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:submitting?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:submitting?'not-allowed':'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background=C.primaryHover; }}
                    onMouseLeave={e=>{ if(!submitting) e.currentTarget.style.background=C.primary; }}
                  >
                    {submitting ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Activating…</> : <><i className="ti ti-rocket" style={{ fontSize:'14px' }} />Activate my account</>}
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
