/**
 * AddNewProperty.jsx v9
 * Changes from v8:
 * - Replaced all SInput (native select) with CustomDropdown
 * - All option arrays normalized to { value, label } format
 * - CustomDropdown imported from components/ui
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import Header from '../../../components/layout/Header';
import { CustomDropdown } from '../../../components/ui';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const C = {
  primary:     '#002D5B',
  primaryBlue: '#0659b2',
  bannerFrom:  '#0c2340',
  bannerTo:    '#163d6e',
  white:       '#FFFFFF',
  pageBg:      '#F1F5F9',
  cardBg:      '#FFFFFF',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  inputBg:     '#F8F9FA',
  inputBorder: '#E8ECF0',
  inputFocus:  '#002D5B',
  textPrimary: '#0F172A',
  textSec:     '#64748B',
  textTert:    '#94A3B8',
  labelColor:  '#64748B',
  danger:      '#E53E3E',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const PAGE_PX = 24;

// ─── Option arrays — normalized to { value, label } for CustomDropdown ────────
const PROPERTY_TYPE_OPTIONS = [
  'Apartment Complex','Individual House','Multi-Family','Condominium',
  'Townhome','Student Housing','Villa','Serviced Apartment','Commercial','Mixed Use',
].map(v => ({ value: v, label: v }));

const OWNERSHIP_TYPE_OPTIONS = [
  'Self-Owned','Co-Owned','Corporate / LLC','Leasehold',
].map(v => ({ value: v, label: v }));

const COUNTRY_OPTIONS = [
  {value:'US', label:'United States'},
  {value:'IN', label:'India'},
  {value:'AE', label:'United Arab Emirates'},
  {value:'GB', label:'United Kingdom'},
  {value:'AU', label:'Australia'},
  {value:'CA', label:'Canada'},
  {value:'SG', label:'Singapore'},
];

const STATES = {
  US:['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  IN:['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'],
  AE:['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'],
  GB:['England','Scotland','Wales','Northern Ireland'],
  AU:['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','Australian Capital Territory','Northern Territory'],
  CA:['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan'],
  SG:['Central Region','East Region','North Region','North-East Region','West Region'],
};

const PROP_SUBTABS = ['Primary Info','Amenities','Gallery','Ownership','Bank Account'];
const UNIT_SUBTABS = ['Unit/Home Info','Amenities','Gallery','Ownership','Bank Account'];

// ─── Field components ──────────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 700, color: C.labelColor,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 5, fontFamily: F.body,
    }}>
      {children}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function ErrMsg({ msg }) {
  return msg
    ? <div style={{ fontSize: 11, color: C.danger, marginTop: 3, fontFamily: F.body }}>{msg}</div>
    : null;
}

function TInput({ value, onChange, placeholder, prefix, type = 'text', error }) {
  const [f, sf] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      border: `1px solid ${error ? C.danger : f ? C.inputFocus : C.inputBorder}`,
      borderRadius: 6, background: C.inputBg, overflow: 'hidden',
      boxShadow: f ? `0 0 0 2px ${error ? '#fde8e8' : '#dbeafe'}` : 'none',
      transition: 'all 0.15s', height: 38,
    }}>
      {prefix && (
        <span style={{
          padding: '0 10px', fontSize: 13, color: C.textSec,
          borderRight: `1px solid ${C.inputBorder}`, background: '#f1f5f9',
          alignSelf: 'stretch', display: 'flex', alignItems: 'center',
          fontFamily: F.body, flexShrink: 0,
        }}>{prefix}</span>
      )}
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => sf(true)} onBlur={() => sf(false)}
        style={{
          flex: 1, padding: '0 11px', fontSize: 13,
          border: 'none', outline: 'none', background: 'transparent',
          color: C.textPrimary, fontFamily: F.body, height: '100%',
        }}
      />
    </div>
  );
}

function TArea({ value, onChange, placeholder, rows = 3 }) {
  const [f, sf] = useState(false);
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      onFocus={() => sf(true)} onBlur={() => sf(false)}
      style={{
        width: '100%', padding: '8px 11px', fontSize: 13,
        border: `1px solid ${f ? C.inputFocus : C.inputBorder}`,
        borderRadius: 6, outline: 'none', resize: 'vertical',
        color: C.textPrimary, background: C.inputBg,
        fontFamily: F.body, lineHeight: 1.6, transition: 'all 0.15s',
        boxShadow: f ? '0 0 0 2px #dbeafe' : 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}

// ─── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFile, onRemove, preview, height = 150, isVideo = false, isThumb = false }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !preview && ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '100%', height,
          border: `1.5px dashed ${drag ? C.primary : preview ? 'transparent' : C.borderMed}`,
          borderRadius: 8, background: drag ? '#eef4ff' : C.inputBg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: preview ? 'default' : 'pointer',
          overflow: 'hidden', position: 'relative', transition: 'all 0.15s',
        }}
      >
        <input ref={ref} type="file"
          accept={isVideo ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png'}
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />

        {preview ? (
          isVideo ? (
            <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <i className="ti ti-player-play" style={{ fontSize: 22, color: '#fff' }} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', padding: '0 8px', textAlign: 'center', fontFamily: F.body }}>{preview}</div>
            </div>
          ) : (
            <>
              <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {hover && (
                <div onClick={() => ref.current.click()} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: '5px 11px', fontSize: 11, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>
                    <i className="ti ti-refresh" style={{ fontSize: 12 }} /> Replace
                  </div>
                </div>
              )}
            </>
          )
        ) : isThumb ? (
          <i className="ti ti-photo" style={{ fontSize: 18, color: C.borderMed }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <i className={`ti ${isVideo ? 'ti-video' : 'ti-file-upload'}`} style={{ fontSize: 28, color: C.textTert }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primaryBlue, fontFamily: F.body, textAlign: 'center' }}>
              {isVideo ? 'Upload Property Video' : 'Upload Main Image'}
            </div>
            <div style={{ fontSize: 11, color: C.textTert, fontFamily: F.body, textAlign: 'center' }}>
              {isVideo ? 'Support: MP4, MOV (Max 50MB)' : 'Support: JPG, PNG (Max 5MB)'}
            </div>
          </div>
        )}
      </div>

      {/* ✕ Remove button */}
      {preview && onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="Remove"
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10, transition: 'background 0.15s', padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.danger}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
        >
          <i className="ti ti-x" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />
        </button>
      )}
    </div>
  );
}

// ─── Live map ──────────────────────────────────────────────────────────────────
function LiveMap({ address }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const geocode = useCallback(async q => {
    if (!q || q.length < 5) { setCoords(null); return; }
    setLoading(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const d = await r.json();
      if (d?.[0]) setCoords({ lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) });
      else setCoords(null);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => geocode(address), 900);
    return () => clearTimeout(timer.current);
  }, [address, geocode]);
  const src = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.012},${coords.lat - 0.012},${coords.lon + 0.012},${coords.lat + 0.012}&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : null;
  return (
    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: C.textPrimary, borderBottom: `1px solid ${C.border}`, fontFamily: F.body }}>Location Preview</div>
      <div style={{ height: 180, position: 'relative', background: '#e8ecf0' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.pageBg, zIndex: 2 }}><span style={{ fontSize: 12, color: C.textSec, fontFamily: F.body }}>Finding location…</span></div>}
        {!loading && src && <iframe title="map" src={src} width="100%" height="180" style={{ border: 'none', display: 'block' }} loading="lazy" />}
        {!loading && !src && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 30, color: C.borderMed }} />
            <div style={{ fontSize: 11, color: C.textTert, textAlign: 'center', padding: '0 20px', lineHeight: 1.5, fontFamily: F.body }}>Fill in address details to preview location</div>
          </div>
        )}
      </div>
      {coords && (
        <div style={{ padding: '8px 12px', background: C.primary, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-gps" style={{ fontSize: 12, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', marginBottom: 1, fontFamily: F.body }}>GPS Coordinates</div>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, fontFamily: F.body }}>{coords.lat.toFixed(4)}° N, {Math.abs(coords.lon).toFixed(4)}° W</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SecHead({ type, title }) {
  const cfg = {
    info: { bg: '#DBEAFE', color: '#1D4ED8', icon: 'ti-info-circle' },
    pin:  { bg: '#D1FAE5', color: '#065F46', icon: 'ti-map-pin' },
  }[type] || { bg: '#DBEAFE', color: '#1D4ED8', icon: 'ti-info-circle' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${cfg.icon}`} style={{ fontSize: 13, color: cfg.color }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>{title}</span>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AddNewProperty({ persona = 'INDEPENDENT_PM' }) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Independent PM');
  const [mainTab, setMainTab]       = useState('property');
  const [subTab, setSubTab]         = useState('Primary Info');
  const [unitLocked, setUnitLocked] = useState(true);
  const [showMore, setShowMore]     = useState(false);
  const [unitCount, setUnitCount]   = useState(0);

  const [propName, setPropName]   = useState('');
  const [propType, setPropType]   = useState('');
  const [propValue, setPropValue] = useState('');
  const [buildYear, setBuildYear] = useState('');
  const [ownerType, setOwnerType] = useState('');
  const [desc, setDesc]           = useState('');
  const [country, setCountry]     = useState('US');
  const [street1, setStreet1]     = useState('');
  const [street2, setStreet2]     = useState('');
  const [landmark, setLandmark]   = useState('');
  const [city, setCity]           = useState('');
  const [state, setState]         = useState('');
  const [zip, setZip]             = useState('');
  const [mainPrev, setMainPrev]     = useState(null);
  const [thumbPrevs, setThumbPrevs] = useState([null, null, null]);
  const [videoPrev, setVideoPrev]   = useState(null);
  const [errors, setErrors]         = useState({});

  const currentTabs = mainTab === 'property' ? PROP_SUBTABS : UNIT_SUBTABS;

  // State options derived from selected country
  const stateOptions = (STATES[country] || []).map(s => ({ value: s, label: s }));

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetch('http://localhost:8001/api/auth/me/', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUserName(((data.first_name || '') + ' ' + (data.last_name || '')).trim() || data.email || 'User');
          const roleMap = { INDEPENDENT_PM: 'Independent PM', ORGANIZATIONAL_PM: 'Org PMS Admin', LANDLORD: 'Landlord', RENTER: 'Renter' };
          setUserRole(roleMap[persona || data.active_persona] || 'Independent PM');
        }
      }).catch(() => {});
  }, [navigate, persona]);

  useEffect(() => { setState(''); }, [country]);

  const fullAddr = [street1, city, state,
    COUNTRY_OPTIONS.find(c => c.value === country)?.label]
    .filter(Boolean).join(', ');

  function validate() {
    const e = {};
    if (!propName.trim()) e.propName  = 'Property name is required';
    if (!propType)        e.propType  = 'Select a property type';
    if (!ownerType)       e.ownerType = 'Select an ownership type';
    if (!street1.trim())  e.street1   = 'Street address is required';
    if (!city.trim())     e.city      = 'City is required';
    if (!state)           e.state     = 'Select a state';
    if (!zip.trim())      e.zip       = 'Zip code is required';
    if (buildYear && (isNaN(buildYear) || +buildYear < 1800 || +buildYear > 2099))
      e.buildYear = 'Enter a valid year';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (mainTab === 'property' && subTab === 'Primary Info') {
      if (!validate()) return;
      setUnitLocked(false);
    }
    const idx = currentTabs.indexOf(subTab);
    if (idx < currentTabs.length - 1) setSubTab(currentTabs[idx + 1]);
  }

  const isLastTab = currentTabs.indexOf(subTab) === currentTabs.length - 1;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        .anp-scroll::-webkit-scrollbar { width: 5px; }
        .anp-scroll::-webkit-scrollbar-track { background: transparent; }
        .anp-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>
        <NavB activeId="add-new" />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header userName={userName} userRole={userRole} />

          <div className="anp-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Banner */}
            <div style={{ padding: `0 ${PAGE_PX}px`, paddingTop: PAGE_PX, paddingBottom: 16, flexShrink: 0 }}>
              <div style={{ background: `linear-gradient(135deg, ${C.bannerFrom} 0%, ${C.bannerTo} 100%)`, padding: '26px 28px', borderRadius: 10, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 7, opacity: 0.15 }}>
                  {[48, 48, 48, 32, 24].map((s, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ width: s, height: s, borderRadius: 7, background: '#fff' }} />
                      {i < 3 && <div style={{ width: s, height: s, borderRadius: 7, background: '#fff' }} />}
                    </div>
                  ))}
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 5, letterSpacing: '-0.3px', fontFamily: F.headline }}>Add New Property(s)</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: 0, fontFamily: F.body }}>
                  {mainTab === 'property' ? 'Enter the foundational details for your new real estate asset.' : 'Expand your urban portfolio with a refined unit management workflow.'}
                </p>
              </div>
            </div>

            {/* Main tabs */}
            <div style={{ background: C.pageBg, margin: `0 ${PAGE_PX}px`, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'flex-end', gap: 4, paddingTop: 10, flexShrink: 0 }}>
              {[{ id: 'property', label: 'Property' }, { id: 'unit', label: 'Unit' }].map(tab => {
                const isA = mainTab === tab.id;
                const isL = tab.id === 'unit' && unitLocked;
                return (
                  <button key={tab.id}
                    onClick={() => { if (!isL) { setMainTab(tab.id); setSubTab(tab.id === 'property' ? 'Primary Info' : 'Unit/Home Info'); } }}
                    style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: '7px 7px 0 0', border: `1.5px solid ${isA ? C.border : 'transparent'}`, borderBottom: isA ? `1.5px solid ${C.cardBg}` : '1.5px solid transparent', background: isA ? C.primary : C.cardBg, color: isA ? '#fff' : isL ? C.textTert : C.textSec, cursor: isL ? 'not-allowed' : 'pointer', marginBottom: -1, fontFamily: F.body, outline: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {tab.label}
                    {isL && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(0,0,0,0.06)', color: C.textTert }}>LOCKED</span>}
                    {tab.id === 'unit' && !isL && unitCount > 0 && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{unitCount}</span>}
                  </button>
                );
              })}
            </div>

            {/* Sub-tabs */}
            <div style={{ background: C.cardBg, margin: `0 ${PAGE_PX}px`, borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderRadius: '0 0 10px 10px', display: 'flex', flexShrink: 0 }}>
              {currentTabs.map(st => {
                const isA = subTab === st;
                return (
                  <button key={st} onClick={() => setSubTab(st)}
                    style={{ padding: '10px 14px', fontSize: 13, fontWeight: isA ? 700 : 500, color: isA ? C.primary : C.textSec, background: 'transparent', border: 'none', borderBottom: isA ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1, fontFamily: F.body, outline: 'none' }}>
                    {st}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div style={{ padding: `20px ${PAGE_PX}px 90px` }}>

              {subTab === 'Primary Info' && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                  {/* Left cards */}
                  <div style={{ width: 800, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Property Basics */}
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SecHead type="info" title="Property Basics" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>

                        <div>
                          <FieldLabel required>Property Name</FieldLabel>
                          <TInput value={propName} onChange={setPropName} placeholder="e.g. Skyline Heights Plaza" error={errors.propName} />
                          <ErrMsg msg={errors.propName} />
                        </div>

                        <div>
                          <FieldLabel required>Property Type</FieldLabel>
                          <CustomDropdown
                            options={PROPERTY_TYPE_OPTIONS}
                            value={propType}
                            onChange={setPropType}
                            placeholder="Select Type"
                            error={!!errors.propType}
                          />
                          <ErrMsg msg={errors.propType} />
                        </div>

                        <div>
                          <FieldLabel>Property Value (Est.)</FieldLabel>
                          <TInput value={propValue} onChange={setPropValue} placeholder="0.00" prefix="$" type="number" />
                        </div>

                        <div>
                          <FieldLabel>Build In Year</FieldLabel>
                          <TInput value={buildYear} onChange={setBuildYear} placeholder="YYYY" type="number" error={errors.buildYear} />
                          <ErrMsg msg={errors.buildYear} />
                        </div>

                        <div>
                          <FieldLabel required>Ownership Type</FieldLabel>
                          <CustomDropdown
                            options={OWNERSHIP_TYPE_OPTIONS}
                            value={ownerType}
                            onChange={setOwnerType}
                            placeholder="Select Ownership Type"
                            error={!!errors.ownerType}
                          />
                          <ErrMsg msg={errors.ownerType} />
                        </div>

                        <div style={{ gridColumn: '1/-1' }}>
                          <FieldLabel>Description</FieldLabel>
                          <TArea value={desc} onChange={setDesc} placeholder="Detailed overview of the property's unique value propositions and structural highlights…" rows={3} />
                        </div>

                      </div>
                    </div>

                    {/* Address Details */}
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SecHead type="pin" title="Address Details" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>

                        <div>
                          <FieldLabel required>Country</FieldLabel>
                          <CustomDropdown
                            options={COUNTRY_OPTIONS}
                            value={country}
                            onChange={v => { setCountry(v); setState(''); }}
                            placeholder="Select Country"
                            error={!!errors.country}
                          />
                          <ErrMsg msg={errors.country} />
                        </div>

                        <div />

                        <div>
                          <FieldLabel required>Street Address 01</FieldLabel>
                          <TInput value={street1} onChange={setStreet1} placeholder="Building No, Street Name" error={errors.street1} />
                          <ErrMsg msg={errors.street1} />
                        </div>

                        <div>
                          <FieldLabel>Street Address 02</FieldLabel>
                          <TInput value={street2} onChange={setStreet2} placeholder="Suite, Floor (Optional)" />
                        </div>

                        <div>
                          <FieldLabel>Landmark</FieldLabel>
                          <TInput value={landmark} onChange={setLandmark} placeholder="Near Central Park" />
                        </div>

                        <div>
                          <FieldLabel required>City</FieldLabel>
                          <TInput value={city} onChange={setCity} placeholder="New York" error={errors.city} />
                          <ErrMsg msg={errors.city} />
                        </div>

                        <div>
                          <FieldLabel required>State</FieldLabel>
                          <CustomDropdown
                            options={stateOptions}
                            value={state}
                            onChange={setState}
                            placeholder={country ? 'Select State' : 'Select country first'}
                            disabled={!country}
                            error={!!errors.state}
                          />
                          <ErrMsg msg={errors.state} />
                        </div>

                        <div>
                          <FieldLabel required>Zipcode</FieldLabel>
                          <TInput value={zip} onChange={setZip} placeholder="10001" error={errors.zip} />
                          <ErrMsg msg={errors.zip} />
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Right column */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Images */}
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 10, fontFamily: F.body }}>Upload Property Image</div>
                      <UploadZone height={155} onFile={f => setMainPrev(URL.createObjectURL(f))} onRemove={() => setMainPrev(null)} preview={mainPrev} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 8 }}>
                        {[0, 1, 2].map(i => (
                          <UploadZone key={i} isThumb height={56}
                            onFile={f => { const p = [...thumbPrevs]; p[i] = URL.createObjectURL(f); setThumbPrevs(p); }}
                            onRemove={() => { const p = [...thumbPrevs]; p[i] = null; setThumbPrevs(p); }}
                            preview={thumbPrevs[i]} />
                        ))}
                      </div>
                    </div>

                    {/* Video */}
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 10, fontFamily: F.body }}>Upload Property Video</div>
                      <UploadZone isVideo height={130} onFile={f => setVideoPrev(f.name)} onRemove={() => setVideoPrev(null)} preview={videoPrev} />
                    </div>

                    {/* Live map */}
                    <LiveMap address={fullAddr} />

                  </div>
                </div>
              )}

              {subTab !== 'Primary Info' && subTab !== 'Unit/Home Info' && (
                <div style={{ background: C.cardBg, borderRadius: 10, border: `1.5px dashed ${C.border}`, padding: '56px 24px', textAlign: 'center' }}>
                  <i className={`ti ${{ Amenities: 'ti-swimming-pool', Gallery: 'ti-photo', Ownership: 'ti-key', 'Bank Account': 'ti-building-bank' }[subTab] || 'ti-layout'}`} style={{ fontSize: 38, color: C.borderMed, display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 5, fontFamily: F.headline }}>{subTab}</div>
                  <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>This section is being built — coming in the next step.</div>
                </div>
              )}

              {subTab === 'Unit/Home Info' && (
                <div style={{ background: C.cardBg, borderRadius: 10, border: `1.5px dashed ${C.border}`, padding: '56px 24px', textAlign: 'center' }}>
                  <i className="ti ti-door" style={{ fontSize: 38, color: C.borderMed, display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 5, fontFamily: F.headline }}>Unit / Home Info</div>
                  <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Unit details form — building next.</div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{ position: 'sticky', bottom: 0, background: C.cardBg, borderTop: `1px solid ${C.border}`, padding: `13px ${PAGE_PX}px`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, zIndex: 10, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)', fontFamily: F.body, marginTop: 'auto' }}>
              {subTab === 'Bank Account' && (
                <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textSec }}>
                  <i className="ti ti-lock" style={{ fontSize: 13 }} /> Secure Transaction Encryption
                </div>
              )}
              <button onClick={() => navigate(-1)} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, background: 'transparent', border: `1.5px solid ${C.borderMed}`, borderRadius: 7, color: C.textSec, cursor: 'pointer', fontFamily: F.body, outline: 'none' }}>Cancel</button>
              {isLastTab && mainTab === 'property' ? (
                <button onClick={() => { setMainTab('unit'); setSubTab('Unit/Home Info'); }} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700, background: C.primary, border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontFamily: F.body, outline: 'none' }}>Go to Unit Details →</button>
              ) : isLastTab && mainTab === 'unit' ? (
                <button onClick={() => { setUnitCount(c => c + 1); setShowMore(true); }} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700, background: C.primary, border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontFamily: F.body, outline: 'none' }}>Save Unit Details</button>
              ) : (
                <button onClick={handleNext} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700, background: C.primary, border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontFamily: F.body, outline: 'none' }}>
                  {subTab === 'Primary Info' ? 'Save' : 'Next →'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* More units modal */}
      {showMore && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 28, width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', fontFamily: F.body }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary, marginBottom: 6, fontFamily: F.headline }}>Unit Saved ✓</div>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 16, lineHeight: 1.6 }}>Do you want to add another unit to this property?</div>
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 20, lineHeight: 1.6 }}>
              <b>Note:</b> You can also add more units later from the property details page.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowMore(false); alert('Final Submit — ownership verification emails sent!'); }} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, background: 'transparent', border: `1.5px solid ${C.borderMed}`, borderRadius: 7, color: C.textSec, cursor: 'pointer', outline: 'none' }}>No — Final Submit</button>
              <button onClick={() => { setShowMore(false); setSubTab('Unit/Home Info'); setMainTab('unit'); }} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, background: C.primary, border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', outline: 'none' }}>+ Add Another Unit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
