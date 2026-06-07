import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomDropdown } from '../../components/ui';

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
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

const STEPS = [
  { n:1, label:'Company & Portfolio',  sub:'Organisation details and unit count' },
  { n:2, label:'Document Upload',      sub:'Required verification documents' },
  { n:3, label:'Integration Method',   sub:'PMS setup and data migration' },
  { n:4, label:'Plan Selection',       sub:'Choose your UrbanNest plan' },
  { n:5, label:'Additional Services',  sub:'Optional add-on services' },
  { n:6, label:'Payment',              sub:'Secure card tokenization' },
  { n:7, label:'Review & Submit',      sub:'Confirm and activate your account' },
];

const FL = { display:'block', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' };
const inputS = (disabled=false, error=false) => ({
  width:'100%', height:'40px', boxSizing:'border-box',
  background:disabled?C.neutral:C.white,
  border:'1px solid '+(error?C.danger:disabled?C.border:C.borderMedium),
  borderRadius:'8px', padding:'0 12px',
  fontFamily:F.body, fontSize:'13px',
  color:disabled?C.textTertiary:C.textPrimary,
  cursor:disabled?'not-allowed':'text', outline:'none',
});
const hintS = (error=false) => ({ fontFamily:F.body, fontSize:'11px', color:error?C.danger:C.textTertiary, marginTop:'4px' });
const dividerS = { borderTop:'1px solid '+C.border, margin:'20px 0' };

// ─── Scenario detection ────────────────────────────────────────────────────────
function detectScenario(hasExistingPms, unitCount) {
  const n = parseInt(unitCount, 10);
  if (hasExistingPms === null || hasExistingPms === undefined) return null;
  if (!hasExistingPms) return 'A';
  if (isNaN(n) || n === 0) return null;
  if (n <= 500) return 'B';
  return 'C';
}

const SCENARIO_LABELS = {
  A: { label:'New Setup',      color:C.green,   bg:'#F0FDF4', border:'#BBF7D0', desc:'Manual entry, CSV import, or API integration — ideal for organizations starting fresh on UrbanNest.' },
  B: { label:'Data Migration', color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE', desc:'Full data migration from your existing PMS — we move all your properties, units, tenants and leases.' },
  C: { label:'Parallel Sync',  color:'#0369A1', bg:'#F0F9FF', border:'#BAE6FD', desc:'Run UrbanNest alongside your current system simultaneously — for large-scale enterprise transitions.' },
};

// ─── State lists ───────────────────────────────────────────────────────────────
const STATES_BY_COUNTRY = {
  US: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  IN: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'],
  AE: ['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'],
  GB: ['England','Scotland','Wales','Northern Ireland'],
  AU: ['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','Australian Capital Territory','Northern Territory'],
  CA: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'],
  SG: ['Central Region','East Region','North Region','North-East Region','West Region'],
};

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

// ─── On/Off Toggle ─────────────────────────────────────────────────────────────
function OnOffToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0', background:C.neutral, borderRadius:'9px', border:'1px solid '+C.borderMedium, overflow:'hidden', width:'fit-content' }}>
      <button type="button" onClick={() => onChange(true)}
        style={{ height:'38px', padding:'0 22px', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'13px', fontWeight:600, transition:'all 0.15s', borderRadius:'8px 0 0 8px',
          background: value === true ? C.green : 'transparent',
          color: value === true ? C.white : C.textSecondary,
        }}>
        On
      </button>
      <div style={{ width:'1px', height:'24px', background:C.borderMedium }} />
      <button type="button" onClick={() => onChange(false)}
        style={{ height:'38px', padding:'0 22px', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'13px', fontWeight:600, transition:'all 0.15s', borderRadius:'0 8px 8px 0',
          background: value === false ? C.danger : 'transparent',
          color: value === false ? C.white : C.textSecondary,
        }}>
        Off
      </button>
    </div>
  );
}

// ─── Logo Upload Zone ──────────────────────────────────────────────────────────
function LogoUploadZone({ file, preview, onFile, onRemove }) {
  const ref = useRef();
  return (
    <div>
      {file ? (
        // New file picked this session — show file name + size
        <div style={{ display:'flex', alignItems:'center', gap:'16px', background:C.neutral, border:'1px solid '+C.borderMedium, borderRadius:'10px', padding:'14px 16px' }}>
          {preview && <img src={preview} alt="Brand logo" style={{ height:'40px', maxWidth:'120px', objectFit:'contain', borderRadius:'4px' }} />}
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>{file.name}</p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>{(file.size/1024).toFixed(1)} KB</p>
          </div>
          <button type="button" onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:C.textSecondary, fontSize:'18px', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
      ) : preview ? (
        // Existing logo URL loaded from API (no File object)
        <div style={{ display:'flex', alignItems:'center', gap:'16px', background:C.neutral, border:'1px solid '+C.borderMedium, borderRadius:'10px', padding:'14px 16px' }}>
          <img src={preview} alt="Brand logo" style={{ height:'40px', maxWidth:'120px', objectFit:'contain', borderRadius:'4px' }} />
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>Existing logo</p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Upload a new file to replace it</p>
          </div>
          <button type="button" onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:C.textSecondary, fontSize:'18px', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()}
          style={{ border:'1.5px dashed '+C.borderMedium, borderRadius:'10px', padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', cursor:'pointer', background:C.white, transition:'border-color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMedium; }}>
          <input ref={ref} type="file" accept=".svg,.png,.jpg,.jpeg" style={{ display:'none' }}
            onChange={e => { const f = e.target.files[0]; if (f) onFile(f); e.target.value=''; }} />
          <i className="ti ti-photo-up" style={{ fontSize:'22px', color:C.textTertiary }} />
          <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', fontWeight:600, color:C.textPrimary }}>Upload brand logo</p>
          <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>SVG or transparent PNG preferred — max 5MB</p>
        </div>
      )}
    </div>
  );
}

function LeftNav() {
  return (
    <div style={{ width:'185px', minWidth:'185px', flexShrink:0, background:C.navBg, display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ height:'60px', flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily:F.headline, fontSize:'17px', fontWeight:700, color:C.white }}>UrbanNest</span>
        <span style={{ fontFamily:F.body, fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Org PMS Portal</span>
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

function VerticalStepper({ current }) {
  return (
    <div style={{ width:'200px', minWidth:'200px', flexShrink:0, background:C.pageBg, borderRight:'1px solid '+C.border, padding:'clamp(16px,2vw,24px) 16px 24px clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', overflowY:'hidden' }}>
      {STEPS.map((step,idx) => {
        const done = step.n < current, active = step.n === current;
        return (
          <div key={step.n} style={{ display:'flex', gap:'12px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', marginTop:'3px', flexShrink:0, background:active||done?C.primary:'transparent', border:'2px solid '+(active||done?C.primary:C.borderMedium), display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done && <i className="ti ti-check" style={{ fontSize:'6px', color:C.white }} />}
              </div>
              {idx < STEPS.length-1 && <div style={{ width:'1.5px', flex:1, minHeight:'32px', background:done?C.primary:C.borderMedium, margin:'4px 0', opacity:done?1:0.35 }} />}
            </div>
            <div style={{ paddingBottom:idx<STEPS.length-1?'12px':0 }}>
              <p style={{ margin:'0 0 2px', fontFamily:F.headline, fontSize:'12px', fontWeight:active?700:500, color:active?C.textPrimary:done?C.textSecondary:C.textTertiary, lineHeight:1.3 }}>{step.label}</p>
              <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', color:active?C.textSecondary:C.textTertiary, lineHeight:1.4 }}>{step.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrgPMS_Step1_CompanyPortfolio() {
  const navigate = useNavigate();

  const [userName,        setUserName]        = useState('');
  const [userRole,        setUserRole]        = useState('Org PMS Admin');
  const [companyName,     setCompanyName]     = useState('');
  const [tradingName,     setTradingName]     = useState('');
  const [regNumber,       setRegNumber]       = useState('');
  const [incorporatedAt,  setIncorporatedAt]  = useState('');
  const [companyType,     setCompanyType]     = useState('');
  const [country,         setCountry]         = useState('US');
  const [state,           setState]           = useState('');
  const [city,            setCity]            = useState('');
  const [zipCode,         setZipCode]         = useState('');
  const [streetAddress1,  setStreetAddress1]  = useState('');
  const [streetAddress2,  setStreetAddress2]  = useState('');
  const [website,         setWebsite]         = useState('');
  const [unitCount,       setUnitCount]       = useState('');
  const [hasExistingPms,  setHasExistingPms]  = useState(null);
  const [scenario,        setScenario]        = useState(null);
  const [liaisonName,     setLiaisonName]     = useState('');
  const [liaisonEmail,    setLiaisonEmail]    = useState('');
  const [liaisonDept,     setLiaisonDept]     = useState('');
  const [logoFile,        setLogoFile]        = useState(null);
  const [logoPreview,     setLogoPreview]     = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [errors,          setErrors]          = useState({});

  // Prevents /auth/me/ from overwriting liaison fields already loaded from the org record.
  const orgLoaded = useRef(false);

  // ── useEffect 1: Pre-populate all fields from existing org record ──────────
  // Fires on every mount. If org_pms_id exists in localStorage (i.e. user has
  // navigated Back from step 2+), fetch the saved record and fill every field.
  useEffect(() => {
    const orgId = localStorage.getItem('org_pms_id');
    if (!orgId) return; // First visit — nothing to pre-populate

    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/`, {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;

        // Serializer returns all fields at the top level — direct 1-to-1 mapping.
        setCompanyName(    data.company_name        || '');
        setTradingName(    data.trading_name        || '');
        setRegNumber(      data.company_reg_number  || '');
        // incorporated_at is "YYYY-MM-DD" from Django — correct format for <input type="date">
        setIncorporatedAt( data.incorporated_at     || '');
        setCompanyType(    data.company_type        || '');
        setWebsite(        data.website             || '');
        setStreetAddress1( data.street_address_1    || '');
        setStreetAddress2( data.street_address_2    || '');
        setCity(           data.city                || '');
        // Set country BEFORE state so the state dropdown list is correct
        setCountry(        data.country             || 'US');
        setState(          data.state               || '');
        setZipCode(        data.zip_code            || '');
        setUnitCount(      data.unit_count != null  ? String(data.unit_count) : '');
        setHasExistingPms( data.has_existing_pms != null ? data.has_existing_pms : null);
        // Re-derive scenario badge immediately from loaded values
        setScenario(detectScenario(data.has_existing_pms, data.unit_count));
        setLiaisonName(    data.liaison_name        || '');
        setLiaisonEmail(   data.liaison_email       || '');
        setLiaisonDept(    data.liaison_department  || '');
        // Show saved logo (URL string, no File object)
        if (data.brand_logo_url) setLogoPreview(data.brand_logo_url);

        orgLoaded.current = true;
      })
      .catch(() => {
        // Non-fatal — user can still edit the form manually
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── useEffect 2: Pre-fill user name + liaison defaults from /auth/me/ ─────
  // Only sets liaison name/email when the org record hasn't already provided them.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch('http://localhost:8001/api/auth/me/', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) {
          const d = decodeJWT(token);
          if (d) setUserName(((d.first_name||'')+' '+(d.last_name||'')).trim()||d.email||'User');
          return;
        }
        const full = ((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User';
        setUserName(full);
        // Only fill liaison fields on first visit (no org record loaded yet)
        if (!orgLoaded.current) {
          setLiaisonName(full);
          setLiaisonEmail(data.email || '');
        }
      })
      .catch(() => {});
  }, []);

  // Reset state when country changes
  const handleCountryChange = (val) => {
    setCountry(val);
    setState('');
  };

  const handleExistingPmsChange = (val) => {
    setHasExistingPms(val);
    setScenario(detectScenario(val, unitCount));
    setErrors(p => ({ ...p, hasExistingPms:'' }));
  };

  const handleUnitCountChange = (val) => {
    setUnitCount(val);
    setScenario(detectScenario(hasExistingPms, val));
    setErrors(p => ({ ...p, unitCount:'' }));
  };

  const handleLogoFile = f => { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); };

  const normalizeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://' + url;
  };

  const validate = () => {
    const e = {};
    if (!companyName.trim())                        e.companyName    = 'Required';
    if (!regNumber.trim())                          e.regNumber      = 'Required';
    if (!incorporatedAt)                            e.incorporatedAt = 'Required';
    if (!companyType)                               e.companyType    = 'Required';
    if (!streetAddress1.trim())                     e.streetAddress1 = 'Required';
    if (!state)                                     e.state          = 'Required';
    if (!city.trim())                               e.city           = 'Required';
    if (!zipCode.trim())                            e.zipCode        = 'Required';
    if (!unitCount || parseInt(unitCount,10) < 1)   e.unitCount      = 'Enter a valid unit count';
    if (hasExistingPms === null)                    e.hasExistingPms = 'Please select Yes or No';
    if (!liaisonName.trim())                        e.liaisonName    = 'Required';
    if (!liaisonEmail.trim())                       e.liaisonEmail   = 'Required';
    if (liaisonEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(liaisonEmail)) e.liaisonEmail = 'Enter a valid email';
    return e;
  };

  const handleContinue = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');
      const orgId = localStorage.getItem('org_pms_id');
      const formData = new FormData();

      formData.append('company_name',       companyName);
      formData.append('trading_name',       tradingName);
      formData.append('company_reg_number', regNumber);
      formData.append('company_type',       companyType);
      formData.append('incorporated_at',    incorporatedAt);
      formData.append('website',            normalizeUrl(website));
      formData.append('street_address_1',   streetAddress1);
      if (streetAddress2) formData.append('street_address_2', streetAddress2);
      formData.append('city',               city);
      formData.append('state',              state);
      formData.append('zip_code',           zipCode);
      formData.append('country',            country);
      formData.append('unit_count',         parseInt(unitCount, 10));
      formData.append('has_existing_pms',   hasExistingPms);
      formData.append('scenario',           scenario || 'A');
      formData.append('liaison_name',       liaisonName);
      formData.append('liaison_email',      liaisonEmail);
      formData.append('liaison_department', liaisonDept);
      // Only attach logo if a new file was selected this session —
      // omitting it on PATCH leaves the existing logo intact server-side.
      if (logoFile) formData.append('brand_logo', logoFile);

      // PATCH if record already exists (Back navigation), POST on first visit
      const isUpdate = Boolean(orgId);
      const url      = isUpdate
        ? `http://localhost:8001/api/admin/org-pms/${orgId}/`
        : 'http://localhost:8001/api/admin/org-pms/';
      const method   = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: 'Bearer ' + token },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail || Object.values(data)[0]?.[0] || 'Could not save. Please try again.';
        setErrors(p => ({ ...p, api: msg }));
        setSaving(false);
        return;
      }

      // First-time POST: persist the new id
      if (!isUpdate) {
        localStorage.setItem('org_pms_id', data.id);
      }
      localStorage.setItem('org_pms_scenario',   scenario || 'A');
      localStorage.setItem('org_pms_country',    country);
      localStorage.setItem('org_pms_unit_count', unitCount);
      navigate('/org-onboarding/step-2');
    } catch {
      setErrors(p => ({ ...p, api: 'Connection error. Please check your connection.' }));
      setSaving(false);
    }
  };

  const COMPANY_TYPE_OPTIONS = [
    { value:'',     label:'Select type…' }, { value:'LLC',  label:'LLC' },
    { value:'CORP', label:'Corporation' },  { value:'SOLE', label:'Sole Proprietorship' },
    { value:'PART', label:'Partnership' },  { value:'OTHER',label:'Other' },
  ];
  const COUNTRY_OPTIONS = [
    { value:'US', label:'United States' }, { value:'IN', label:'India' },
    { value:'AE', label:'UAE' },           { value:'GB', label:'United Kingdom' },
    { value:'AU', label:'Australia' },     { value:'CA', label:'Canada' },
    { value:'SG', label:'Singapore' },
  ];
  const DEPT_OPTIONS = [
    { value:'',           label:'Select department…' },
    { value:'Operations', label:'Operations' }, { value:'Finance',    label:'Finance' },
    { value:'Technology', label:'Technology' }, { value:'Legal',      label:'Legal' },
    { value:'HR',         label:'HR' },         { value:'Other',      label:'Other' },
  ];

  const stateList = STATES_BY_COUNTRY[country] || [];
  const STATE_OPTIONS = [{ value:'', label:'Select state / region…' }, ...stateList.map(s => ({ value:s, label:s }))];
  const sc = scenario ? SCENARIO_LABELS[scenario] : null;

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        html, body, #root { height:100%; overflow:hidden; margin:0; padding:0; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .org-form-scroll::-webkit-scrollbar { width:5px; }
        .org-form-scroll::-webkit-scrollbar-track { background:transparent; }
        .org-form-scroll::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg, fontFamily:F.body }}>
        <LeftNav />
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <Header userName={userName} userRole={userRole} />

          <div style={{ flexShrink:0, padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,48px) 0', background:C.pageBg }}>
            <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'clamp(22px,2.2vw,28px)', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>Organizational Property Management</h1>
            <p style={{ margin:'0 0 10px', fontFamily:F.headline, fontSize:'clamp(13px,1.2vw,15px)', fontWeight:600, color:C.green }}>Account Registration &amp; Setup</p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>Set up your organization's account on UrbanNest. Progress is auto-saved after every step. Fields marked * are required.</p>
          </div>

          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
            <VerticalStepper current={1} />

            <div className="org-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'780px', width:'100%', animation:'fadein 0.3s ease both' }}>

                <h2 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Organizational PMS registration</h2>
                <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Pre-filled from your account — read-only fields are locked</p>

                {errors.api && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                    <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{errors.api}</span>
                  </div>
                )}

                <div style={dividerS} />

                {/* ── Company Information ── */}
                <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Company Information</p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>Company / Legal Name *</span>
                    <input style={inputS(false,!!errors.companyName)} placeholder="e.g. Silicon Property Management Inc." value={companyName}
                      onChange={e => { setCompanyName(e.target.value); setErrors(p=>({...p,companyName:''})); }} />
                    {errors.companyName && <p style={hintS(true)}>{errors.companyName}</p>}
                  </div>
                  <div>
                    <span style={FL}>Trading Name</span>
                    <input style={inputS()} placeholder="e.g. Silicon PMS" value={tradingName} onChange={e => setTradingName(e.target.value)} />
                    <p style={hintS()}>If different from legal name</p>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>Business Registration No. *</span>
                    <input style={inputS(false,!!errors.regNumber)} placeholder="EIN / Company No." value={regNumber}
                      onChange={e => { setRegNumber(e.target.value); setErrors(p=>({...p,regNumber:''})); }} />
                    {errors.regNumber && <p style={hintS(true)}>{errors.regNumber}</p>}
                  </div>
                  <div>
                    <span style={FL}>Date of Incorporation *</span>
                    <div style={{ position:'relative' }}>
                      <input type="date" style={{ ...inputS(false,!!errors.incorporatedAt), paddingRight:'36px', colorScheme:'light', color:incorporatedAt?C.textPrimary:C.textTertiary }}
                        value={incorporatedAt} onChange={e => { setIncorporatedAt(e.target.value); setErrors(p=>({...p,incorporatedAt:''})); }} />
                      <i className="ti ti-calendar" style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', color:C.textTertiary, pointerEvents:'none' }} />
                    </div>
                    {errors.incorporatedAt && <p style={hintS(true)}>{errors.incorporatedAt}</p>}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>Company Type *</span>
                    <CustomDropdown options={COMPANY_TYPE_OPTIONS} value={companyType} placeholder="Select type…" error={!!errors.companyType}
                      onChange={v => { setCompanyType(v); setErrors(p=>({...p,companyType:''})); }} />
                    {errors.companyType && <p style={hintS(true)}>{errors.companyType}</p>}
                  </div>
                  <div>
                    <span style={FL}>Website</span>
                    <input style={inputS()} placeholder="e.g. www.yourcompany.com" value={website} onChange={e => setWebsite(e.target.value)} />
                    <p style={hintS()}>https:// will be added automatically if missing</p>
                  </div>
                </div>

                <div style={dividerS} />

                {/* ── Company Address ── */}
                <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Company Address</p>

                <div style={{ marginBottom:'16px' }}>
                  <span style={FL}>Country *</span>
                  <div style={{ maxWidth:'360px' }}>
                    <CustomDropdown options={COUNTRY_OPTIONS} value={country} placeholder="Select country…" onChange={handleCountryChange} />
                  </div>
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <span style={FL}>Street Address 1 *</span>
                  <input style={inputS(false,!!errors.streetAddress1)} placeholder="e.g. 123 Main Street" value={streetAddress1}
                    onChange={e => { setStreetAddress1(e.target.value); setErrors(p=>({...p,streetAddress1:''})); }} />
                  {errors.streetAddress1 && <p style={hintS(true)}>{errors.streetAddress1}</p>}
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <span style={FL}>Street Address 2</span>
                  <input style={inputS()} placeholder="Suite, floor, building (optional)" value={streetAddress2}
                    onChange={e => setStreetAddress2(e.target.value)} />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 140px', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>City *</span>
                    <input style={inputS(false,!!errors.city)} placeholder="e.g. San Francisco" value={city}
                      onChange={e => { setCity(e.target.value); setErrors(p=>({...p,city:''})); }} />
                    {errors.city && <p style={hintS(true)}>{errors.city}</p>}
                  </div>
                  <div>
                    <span style={FL}>State / Region *</span>
                    <CustomDropdown options={STATE_OPTIONS} value={state} placeholder="Select…" error={!!errors.state}
                      onChange={v => { setState(v); setErrors(p=>({...p,state:''})); }} />
                    {errors.state && <p style={hintS(true)}>{errors.state}</p>}
                  </div>
                  <div>
                    <span style={FL}>Zip / Post Code *</span>
                    <input style={inputS(false,!!errors.zipCode)} placeholder="00000" value={zipCode}
                      onChange={e => { setZipCode(e.target.value); setErrors(p=>({...p,zipCode:''})); }} />
                    {errors.zipCode && <p style={hintS(true)}>{errors.zipCode}</p>}
                  </div>
                </div>

                <div style={dividerS} />

                {/* ── Liaison Information ── */}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'#E0F2FE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className="ti ti-user-shield" style={{ fontSize:'14px', color:'#0369A1' }} />
                  </div>
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Liaison Information</p>
                </div>
                <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>The primary contact who will be the Super Admin for this account.</p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div>
                    <span style={FL}>Primary Contact Name *</span>
                    <input style={inputS(false,!!errors.liaisonName)} placeholder="Full name" value={liaisonName}
                      onChange={e => { setLiaisonName(e.target.value); setErrors(p=>({...p,liaisonName:''})); }} />
                    {errors.liaisonName && <p style={hintS(true)}>{errors.liaisonName}</p>}
                  </div>
                  <div>
                    <span style={FL}>Department</span>
                    <CustomDropdown options={DEPT_OPTIONS} value={liaisonDept} placeholder="Select department…" onChange={v => setLiaisonDept(v)} />
                  </div>
                </div>

                <div style={{ marginBottom:'16px', maxWidth:'400px' }}>
                  <span style={FL}>Super Admin Email *</span>
                  <input style={inputS(false,!!errors.liaisonEmail)} placeholder="admin@yourcompany.com" value={liaisonEmail}
                    onChange={e => { setLiaisonEmail(e.target.value); setErrors(p=>({...p,liaisonEmail:''})); }} />
                  {errors.liaisonEmail
                    ? <p style={hintS(true)}>{errors.liaisonEmail}</p>
                    : <p style={hintS()}>This email will be used to log in and manage the account</p>}
                </div>

                <div style={dividerS} />

                {/* ── Brand Assets ── */}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className="ti ti-photo" style={{ fontSize:'14px', color:C.green }} />
                  </div>
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Brand Assets <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(Optional)</span></p>
                </div>
                <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Your logo will appear on reports, invoices, and tenant-facing communications.</p>
                <LogoUploadZone file={logoFile} preview={logoPreview}
                  onFile={handleLogoFile} onRemove={() => { setLogoFile(null); setLogoPreview(null); }} />

                <div style={dividerS} />

                {/* ── Portfolio Size & Setup ── */}
                <p style={{ margin:'0 0 6px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Portfolio Size &amp; Setup</p>
                <p style={{ margin:'0 0 16px', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>This helps us detect the right integration scenario and suggest the best plan for you.</p>

                <div style={{ marginBottom:'16px' }}>
                  <span style={FL}>Do you currently use a Property Management System? *</span>
                  <OnOffToggle value={hasExistingPms} onChange={handleExistingPmsChange} />
                  {errors.hasExistingPms && <p style={hintS(true)}>{errors.hasExistingPms}</p>}
                  {hasExistingPms === true  && <p style={hintS()}>e.g. Yardi, AppFolio, Buildium, MRI, RealPage, custom system</p>}
                  {hasExistingPms === false && <p style={hintS()}>You'll start fresh — we'll help you set up your portfolio from scratch</p>}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'16px', alignItems:'flex-start', marginBottom:'16px' }}>
                  <div>
                    <span style={{ ...FL, whiteSpace:'nowrap' }}>Total Units Under Management *</span>
                    <input type="number" min="1" style={inputS(false,!!errors.unitCount)} placeholder="e.g. 120"
                      value={unitCount} onChange={e => handleUnitCountChange(e.target.value)} />
                    {errors.unitCount
                      ? <p style={hintS(true)}>{errors.unitCount}</p>
                      : <p style={hintS()}>Approximate count is fine</p>}
                  </div>

                  {sc && (
                    <div style={{ marginTop:'22px', display:'flex', alignItems:'flex-start', gap:'10px', background:sc.bg, border:'1px solid '+sc.border, borderRadius:'10px', padding:'12px 14px' }}>
                      <i className="ti ti-info-circle" style={{ fontSize:'15px', color:sc.color, flexShrink:0, marginTop:'1px' }} />
                      <div>
                        <p style={{ margin:'0 0 3px', fontFamily:F.body, fontSize:'12px', fontWeight:700, color:sc.color }}>Scenario {scenario} — {sc.label}</p>
                        <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:sc.color, lineHeight:1.5 }}>{sc.desc}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div style={dividerS} />

                {/* ── Footer ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <i className="ti ti-device-floppy" style={{ fontSize:'13px', color:C.textTertiary }} />
                    <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Progress auto-saved</span>
                  </div>
                  <button onClick={handleContinue} disabled={saving}
                    style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:saving?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e => { if(!saving) e.currentTarget.style.background=C.primaryHover; }}
                    onMouseLeave={e => { if(!saving) e.currentTarget.style.background=C.primary; }}
                  >
                    {saving
                      ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Saving…</>
                      : <>Continue <i className="ti ti-arrow-right" style={{ fontSize:'14px' }} /></>}
                  </button>
                </div>
              </div>
              <p style={{ textAlign:'center', fontFamily:F.body, fontSize:'10px', color:C.textTertiary, margin:'24px 0 16px', letterSpacing:'0.04em' }}>© 2026 URBANNEST. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
