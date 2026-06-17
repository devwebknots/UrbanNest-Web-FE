/**
 * EditPropertyPage.jsx — Session 28 (revised: all 3 fixes applied)
 * Fix (a): ownership fields mapped from API (ownership_pct, maintenance_threshold, is_lease_signatory, is_maintenance, is_info_only)
 * Fix (b): selected amenity tile border changed to subtle 1px #BFDBFE
 * Fix (c): bank account tab shows "Currently saved" block with mock data + replace toggle
 * Route: /pm-portal/properties/:id/edit
 * Place at: src/pages/Properties/EditProperty/EditPropertyPage.jsx
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import Header from '../../../components/layout/Header';
import { CustomDropdown } from '../../../components/ui';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const API = 'http://localhost:8001';

const C = {
  primary:      '#002D5B',
  primaryBlue:  '#0659b2',
  primaryLight: '#EFF6FF',
  white:        '#FFFFFF',
  pageBg:       '#F1F5F9',
  cardBg:       '#FFFFFF',
  border:       '#E2E8F0',
  borderMed:    '#CBD5E1',
  inputBg:      '#F8F9FA',
  inputBorder:  '#E8ECF0',
  inputFocus:   '#002D5B',
  textPrimary:  '#0F172A',
  textSec:      '#64748B',
  textTert:     '#94A3B8',
  labelColor:   '#64748B',
  danger:       '#E53E3E',
  success:      '#16A34A',
  successLight: '#F0FDF4',
  amber:        '#D97706',
  amberLight:   '#FFFBEB',
  amberBorder:  '#FDE68A',
  // Fix (b): subtle amenity selected border
  amenitySelectedBorder: '#BFDBFE',
  amenitySelectedBg:     '#EFF6FF',
};

const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };
const PAGE_PX = 24;

const PROPERTY_TYPE_OPTIONS = ['Apartment Complex','Individual House','Multi-Family','Condominium','Townhome','Student Housing','Villa','Serviced Apartment','Commercial','Mixed Use'].map(v => ({ value: v, label: v }));
const OWNERSHIP_TYPE_OPTIONS = ['Self-Owned','Co-Owned','Corporate / LLC','Leasehold'].map(v => ({ value: v, label: v }));
const COUNTRY_OPTIONS = [{ value:'US',label:'United States' },{ value:'IN',label:'India' },{ value:'AE',label:'United Arab Emirates' },{ value:'GB',label:'United Kingdom' },{ value:'AU',label:'Australia' },{ value:'CA',label:'Canada' },{ value:'SG',label:'Singapore' }];
const STATES = { US:['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'], IN:['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'], AE:['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'], GB:['England','Scotland','Wales','Northern Ireland'], AU:['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','Australian Capital Territory','Northern Territory'], CA:['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan'], SG:['Central Region','East Region','North Region','North-East Region','West Region'] };

const PROP_TYPE_API_TO_DISPLAY = { APARTMENT_COMPLEX:'Apartment Complex', INDIVIDUAL_HOUSE:'Individual House', MULTI_FAMILY:'Multi-Family', CONDOMINIUM:'Condominium', TOWNHOME:'Townhome', STUDENT_HOUSING:'Student Housing', VILLA:'Villa', SERVICED_APARTMENT:'Serviced Apartment', COMMERCIAL:'Commercial', MIXED_USE:'Mixed Use' };
const PROP_TYPE_DISPLAY_TO_API = Object.fromEntries(Object.entries(PROP_TYPE_API_TO_DISPLAY).map(([k,v]) => [v,k]));
const OWN_TYPE_API_TO_DISPLAY  = { SELF_OWNED:'Self-Owned', CO_OWNED:'Co-Owned', CORPORATE:'Corporate / LLC', LEASEHOLD:'Leasehold' };
const OWN_TYPE_DISPLAY_TO_API  = Object.fromEntries(Object.entries(OWN_TYPE_API_TO_DISPLAY).map(([k,v]) => [v,k]));

// Fix (a): ownership_role API → local value map
const OWNERSHIP_ROLE_API_TO_LOCAL = { INDIVIDUAL_OWNER:'individual_owner', CO_OWNER:'co_owner', PRIMARY_OWNER:'individual_owner', CORPORATE:'corporate', TRUST:'trust' };
const OWNERSHIP_ROLE_OPTIONS = [{ value:'individual_owner',label:'Individual Owner' },{ value:'co_owner',label:'Co-Owner' },{ value:'corporate',label:'Corporate / LLC' },{ value:'trust',label:'Trust' }];

const PROP_SUBTABS = ['Primary Info','Amenities','Ownership','Bank Account'];
const PAGE_META = {
  'Primary Info': { title:'Property Basic Information', sub:'Edit the foundational details, property type, value and address.' },
  'Amenities':    { title:'Property Amenities',          sub:'Update the amenities available across this property.' },
  'Ownership':    { title:'Property Ownership',          sub:'Manage ownership records. Changes will re-send verification invites.' },
  'Bank Account': { title:'Bank Account Configuration',  sub:'Update bank accounts for property operations and fund management.' },
};

// Bank account constants
const ACCOUNT_CATEGORIES = [
  { section:'PROPERTY BANK ACCOUNTS', items:[{ id:'prop_operating',label:'Property Operating Account',sub:'Day-to-day operations',icon:'ti-building-bank' },{ id:'prop_reserve',label:'Property Reserve Account',sub:'CapEx and rainy day funds',icon:'ti-safe' }] },
  { section:'PMS ACCOUNTS', items:[{ id:'pm_operating',label:'PM Operating Account',sub:'Management fees & admin',icon:'ti-briefcase' },{ id:'pm_trust',label:'PM Trust Account',sub:'Client funds management',icon:'ti-shield-lock' },{ id:'rent',label:'Rent Collection Account',sub:'Tenant payment routing',icon:'ti-home-dollar' },{ id:'security',label:'Security Deposit Account',sub:'Escrow holding account',icon:'ti-lock-dollar' }] },
  { section:'OWNER ACCOUNTS', items:[{ id:'owner_settlement',label:'Owner Settlement Account',sub:'Property owner disbursement (optional)',icon:'ti-user-dollar' }] },
];
const ACCOUNT_DESCRIPTIONS = { prop_operating:'Primary account used for day-to-day property expenses and receiving operational income.', prop_reserve:'Dedicated fund for capital expenditures, major repairs, and emergency reserves.', pm_operating:'Account for collecting and disbursing property management fees, administrative costs, and vendor payments.', pm_trust:'Segregated trust account holding client funds in compliance with property management regulations.', rent:'Dedicated account where tenants route rent payments.', security:'Escrow account holding tenant security deposits. Regulated in most jurisdictions.', owner_settlement:'Account where collected rent is disbursed to the property owner after deducting management fees.' };
const MODULE_TO_CATEGORY_ID = { OPERATIONAL:'prop_operating', RESERVE:'prop_reserve', PM_OPERATING:'pm_operating', PM_TRUST:'pm_trust', RENT:'rent', SECURITY:'security', OWNER_SETTLEMENT:'owner_settlement' };

// Fix (c): mock bank account data — easily replaceable with real API data when pm_bank_account is linked
const MOCK_EXISTING_ACCOUNTS = [
  { value:'acc_001',label:'Chase Main — ••••8829',bank:'Chase Manhattan',nickname:'Main Op - 5th Ave',number:'••••••••••8829',routing:'021000021',type:'Checking',owner:'Tate Real Estate Holdings LLC' },
  { value:'acc_002',label:'Wells Fargo Reserve — ••••4412',bank:'Wells Fargo',nickname:'Reserve Fund A',number:'••••••••••4412',routing:'121000248',type:'Savings',owner:'Tate Real Estate Holdings LLC' },
  { value:'acc_003',label:'BofA Operations — ••••7731',bank:'Bank of America',nickname:'BofA Ops Account',number:'••••••••••7731',routing:'026009593',type:'Checking',owner:'Metro Holdings Inc.' },
];
const ACCOUNT_TYPE_OPTIONS = [{ value:'',label:'Select type…' },{ value:'checking',label:'Checking' },{ value:'savings',label:'Savings' }];

function emptyAccountState() {
  return { mode:'existing', existingId:'', saved:false, skipped:false, replacing:false, bankName:'', nickname:'', accountNumber:'', routing:'', accountType:'', owner:'', voidedCheck:null, voidedCheckName:'' };
}
function emptyReserveExtras() {
  return { minThreshold:'', topUp:'manual', topUpMode:'existing', topUpExistingId:'', topUpBankName:'', topUpNickname:'', topUpAccountNumber:'', topUpRouting:'', topUpAccountType:'', topUpOwner:'', topUpVoidedCheck:null, topUpVoidedCheckName:'' };
}

// ─── Shared field components ───────────────────────────────────────────────────
function FieldLabel({ children, required }) { return <div style={{ fontSize:10.5, fontWeight:700, color:C.labelColor, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5, fontFamily:F.body }}>{children}{required && <span style={{ color:C.danger, marginLeft:2 }}>*</span>}</div>; }
function ErrMsg({ msg }) { return msg ? <div style={{ fontSize:11, color:C.danger, marginTop:3, fontFamily:F.body }}>{msg}</div> : null; }
function TInput({ value, onChange, placeholder, prefix, type='text', error, disabled=false }) {
  const [f,sf] = useState(false);
  return <div style={{ display:'flex', alignItems:'center', border:`1px solid ${error?C.danger:f?C.inputFocus:C.inputBorder}`, borderRadius:6, background:C.inputBg, overflow:'hidden', boxShadow:f?`0 0 0 2px ${error?'#fde8e8':'#dbeafe'}`:'none', transition:'all 0.15s', height:38, opacity:disabled?0.6:1 }}>{prefix && <span style={{ padding:'0 10px', fontSize:13, color:C.textSec, borderRight:`1px solid ${C.inputBorder}`, background:'#f1f5f9', alignSelf:'stretch', display:'flex', alignItems:'center', fontFamily:F.body, flexShrink:0 }}>{prefix}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{ flex:1, padding:'0 11px', fontSize:13, border:'none', outline:'none', background:'transparent', color:C.textPrimary, fontFamily:F.body, height:'100%' }} /></div>;
}
function TArea({ value, onChange, placeholder, rows=3 }) {
  const [f,sf] = useState(false);
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{ width:'100%', padding:'8px 11px', fontSize:13, border:`1px solid ${f?C.inputFocus:C.inputBorder}`, borderRadius:6, outline:'none', resize:'vertical', color:C.textPrimary, background:C.inputBg, fontFamily:F.body, lineHeight:1.6, transition:'all 0.15s', boxShadow:f?'0 0 0 2px #dbeafe':'none', boxSizing:'border-box' }} />;
}
function SecHead({ type, title }) {
  const cfg = { info:{ bg:'#DBEAFE', color:'#1D4ED8', icon:'ti-info-circle' }, pin:{ bg:'#D1FAE5', color:'#065F46', icon:'ti-map-pin' } }[type] || { bg:'#DBEAFE', color:'#1D4ED8', icon:'ti-info-circle' };
  return <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}><div style={{ width:28, height:28, borderRadius:'50%', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><i className={`ti ${cfg.icon}`} style={{ fontSize:13, color:cfg.color }} /></div><span style={{ fontSize:14, fontWeight:700, color:C.textPrimary, fontFamily:F.headline }}>{title}</span></div>;
}
function LiveMap({ address }) {
  const [coords,setCoords] = useState(null);
  const [loading,setLoading] = useState(false);
  const timer = useRef(null);
  const geocode = useCallback(async q => {
    if (!q||q.length<5) { setCoords(null); return; }
    setLoading(true);
    try { const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,{ headers:{'Accept-Language':'en'} }); const d = await r.json(); if (d?.[0]) setCoords({ lat:parseFloat(d[0].lat), lon:parseFloat(d[0].lon) }); else setCoords(null); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(()=>geocode(address),900); return ()=>clearTimeout(timer.current); }, [address,geocode]);
  const src = coords ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon-0.012},${coords.lat-0.012},${coords.lon+0.012},${coords.lat+0.012}&layer=mapnik&marker=${coords.lat},${coords.lon}` : null;
  return <div style={{ background:C.cardBg, borderRadius:10, border:`1px solid ${C.border}`, overflow:'hidden' }}><div style={{ padding:'10px 14px', fontWeight:700, fontSize:13, color:C.textPrimary, borderBottom:`1px solid ${C.border}`, fontFamily:F.body }}>Location Preview</div><div style={{ height:180, position:'relative', background:'#e8ecf0' }}>{loading && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:C.pageBg, zIndex:2 }}><span style={{ fontSize:12, color:C.textSec, fontFamily:F.body }}>Finding location...</span></div>}{!loading&&src && <iframe title="map" src={src} width="100%" height="180" style={{ border:'none', display:'block' }} loading="lazy" />}{!loading&&!src && <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}><i className="ti ti-map-pin" style={{ fontSize:30, color:C.borderMed }} /><div style={{ fontSize:11, color:C.textTert, textAlign:'center', padding:'0 20px', lineHeight:1.5, fontFamily:F.body }}>Fill in address details to preview location</div></div>}</div>{coords && <div style={{ padding:'8px 12px', background:C.primary, display:'flex', alignItems:'center', gap:10 }}><div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="ti ti-gps" style={{ fontSize:12, color:'#fff' }} /></div><div><div style={{ fontSize:9.5, color:'rgba(255,255,255,0.5)', marginBottom:1, fontFamily:F.body }}>GPS Coordinates</div><div style={{ fontSize:11, color:'#fff', fontWeight:600, fontFamily:F.body }}>{coords.lat.toFixed(4)}° N, {Math.abs(coords.lon).toFixed(4)}° W</div></div></div>}</div>;
}


// Fix 1a: Gallery upload zone component
function GalleryUploadZone({ height=120, preview, onFile, onRemove, isThumb=false }) {
  const ref = React.useRef();
  const [hover,setHover] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <div onClick={()=>!preview&&ref.current.click()} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        style={{ height, border:`1.5px dashed ${preview?'transparent':C.borderMed}`, borderRadius:7, background:C.inputBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:preview?'default':'pointer', overflow:'hidden', position:'relative', transition:'all 0.15s' }}>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]){ onFile(e.target.files[0]); e.target.value=''; } }} />
        {preview?(
          <>
            <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            {hover&&!isThumb&&(
              <div onClick={()=>ref.current.click()} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.9)', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:600, color:C.textPrimary, fontFamily:F.body }}>
                  <i className="ti ti-refresh" style={{ fontSize:11 }} /> Replace
                </div>
              </div>
            )}
          </>
        ):isThumb?(
          <i className="ti ti-photo" style={{ fontSize:16, color:C.borderMed }} />
        ):(
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <i className="ti ti-file-upload" style={{ fontSize:24, color:C.textTert }} />
            <div style={{ fontSize:11, fontWeight:700, color:C.primaryBlue, fontFamily:F.body }}>Upload Image</div>
            <div style={{ fontSize:10, color:C.textTert, fontFamily:F.body }}>JPG, PNG (Max 5MB)</div>
          </div>
        )}
      </div>
      {preview&&onRemove&&<button onClick={e=>{ e.stopPropagation(); onRemove(); }} style={{ position:'absolute', top:5, right:5, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'1.5px solid rgba(255,255,255,0.75)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:10, padding:0 }}><i className="ti ti-x" style={{ fontSize:9, color:'#fff' }} /></button>}
    </div>
  );
}

// ─── FIX (b): Amenities — subtle selected border ───────────────────────────────
function AmenityTile({ amenity, selected, onToggle }) {
  const [hover,setHover] = useState(false);
  return (
    <div role="checkbox" aria-checked={selected} onClick={()=>onToggle(amenity.id)}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        border: selected ? `1px solid ${C.amenitySelectedBorder}` : `1px solid ${hover?C.borderMed:C.inputBorder}`,
        borderRadius:8, padding:'16px 10px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:8,
        cursor:'pointer',
        background: selected ? C.amenitySelectedBg : hover ? '#f8faff' : C.cardBg,
        transition:'all 0.15s', position:'relative', userSelect:'none',
      }}>
      <div style={{ position:'absolute', top:7, right:7, width:16, height:16, borderRadius:4, border:`1.5px solid ${selected?C.primary:C.borderMed}`, background:selected?C.primary:C.cardBg, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
        {selected && <i className="ti ti-check" style={{ fontSize:10, color:'#fff', lineHeight:1 }} />}
      </div>
      <i className={`ti ${amenity.icon}`} style={{ fontSize:22, color:selected?C.primary:C.textPrimary, transition:'color 0.15s' }} />
      <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:selected?C.primary:C.textSec, textAlign:'center', lineHeight:1.3, fontFamily:F.body }}>{amenity.label}</div>
    </div>
  );
}
function AccessCard({ amenity, checked, onToggle }) {
  return <div onClick={()=>onToggle(amenity.id)} style={{ border:`1px solid ${checked?C.amenitySelectedBorder:C.inputBorder}`, borderRadius:8, padding:'14px 10px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative', background:checked?C.amenitySelectedBg:C.inputBg, cursor:'pointer', transition:'all 0.15s', userSelect:'none' }}><div style={{ position:'absolute', top:7, right:7, width:16, height:16, borderRadius:3, border:`1.5px solid ${checked?C.primary:C.borderMed}`, background:checked?C.primary:C.cardBg, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>{checked && <i className="ti ti-check" style={{ fontSize:10, color:'#fff', lineHeight:1 }} />}</div><i className={`ti ${amenity.icon}`} style={{ fontSize:20, color:checked?C.primary:C.textPrimary }} /><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:checked?C.primary:C.textSec, textAlign:'center', lineHeight:1.3, fontFamily:F.body }}>{amenity.label}</div></div>;
}
function AmenitiesTab({ selectedAmenities, setSelectedAmenities, propertyAmenities }) {
  const [searchQuery,setSearchQuery] = useState('');
  const [generated,setGenerated] = useState(false);
  const [accessMode,setAccessMode] = useState('all');
  // Fix 2a: seed from selectedAmenities so pre-selected show green
  const [accessChecked,setAccessChecked] = useState(()=>new Set(selectedAmenities));
  const filtered = searchQuery.trim() ? propertyAmenities.filter(a=>a.label.toLowerCase().includes(searchQuery.toLowerCase())) : propertyAmenities;
  const selectedList = propertyAmenities.filter(a=>selectedAmenities.has(a.id));
  const selectedCount = selectedList.length;
  function toggleAmenity(id) { setSelectedAmenities(prev=>{ const next=new Set(prev); if(next.has(id)){ next.delete(id); setAccessChecked(ac=>{ const n=new Set(ac); n.delete(id); return n; }); } else next.add(id); return next; }); setGenerated(false); }
  return (
    <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
      <div style={{ flex:1, minWidth:0, background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontFamily:F.body }}><span style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>Amenities </span><span style={{ fontSize:13, color:C.textSec }}>(Select all that apply)</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:C.inputBg, border:`1px solid ${C.inputBorder}`, borderRadius:6, padding:'0 11px', height:36, width:220 }}>
            <i className="ti ti-search" style={{ fontSize:14, color:C.textTert, flexShrink:0 }} />
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search..." style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:C.textPrimary, fontFamily:F.body, width:'100%' }} />
            {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ border:'none', background:'transparent', cursor:'pointer', padding:0 }}><i className="ti ti-x" style={{ fontSize:12, color:C.textTert }} /></button>}
          </div>
        </div>
        {filtered.length > 0
          ? <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>{filtered.map(a=><AmenityTile key={a.id} amenity={a} selected={selectedAmenities.has(a.id)} onToggle={toggleAmenity} />)}</div>
          : <div style={{ textAlign:'center', padding:'40px 20px', color:C.textTert, fontFamily:F.body, fontSize:13 }}><i className="ti ti-search-off" style={{ fontSize:30, display:'block', marginBottom:8 }} />No amenities match "{searchQuery}"</div>
        }
      </div>
      <div style={{ width:320, flexShrink:0 }}>
        <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ background:C.primary, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#fff', fontSize:13, fontWeight:700, fontFamily:F.body }}><i className="ti ti-circle-check" style={{ fontSize:16 }} /> Amenities Access</div>
            <span style={{ background:'rgba(255,255,255,0.18)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:10, fontFamily:F.body }}>{selectedCount} {selectedCount===1?'Item':'Items'}</span>
          </div>
          <div style={{ padding:14 }}>
            {selectedCount > 0 ? <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>{selectedList.map(a=><AccessCard key={a.id} amenity={a} checked={accessChecked.has(a.id)} onToggle={generated?id=>setAccessChecked(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }):()=>{}} />)}</div>
              <button onClick={()=>{ setAccessChecked(new Set(selectedAmenities)); setGenerated(true); }} style={{ width:'100%', height:38, background:generated?C.success:C.primary, border:'none', borderRadius:6, fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:F.body, marginBottom:12 }}>
                <i className={`ti ${generated?'ti-circle-check':'ti-bolt'}`} style={{ fontSize:15 }} />{generated?'ACCESS GENERATED':'GENERATE ACCESS'}
              </button>
              {generated && <><div style={{ background:C.successLight, border:'1px solid #bbf7d0', borderRadius:6, padding:'8px 12px', marginBottom:12, display:'flex', alignItems:'flex-start', gap:8 }}><i className="ti ti-info-circle" style={{ fontSize:13, color:C.success, flexShrink:0, marginTop:1 }} /><div style={{ fontSize:11, color:'#166534', lineHeight:1.5, fontFamily:F.body }}>Access generated for <strong>All Units</strong> by default.</div></div><div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:`1px solid ${C.border}` }}><span style={{ fontSize:11.5, color:C.textSec, fontFamily:F.body }}>Access mode</span><div style={{ display:'flex', border:`1px solid ${C.inputBorder}`, borderRadius:5, overflow:'hidden' }}>{[{id:'all',label:'All Units'},{id:'specific',label:'Specific Units'}].map(m=><button key={m.id} onClick={()=>setAccessMode(m.id)} style={{ padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', border:'none', fontFamily:F.body, background:accessMode===m.id?C.primary:'transparent', color:accessMode===m.id?'#fff':C.textSec }}>{m.label}</button>)}</div></div></>}
            </> : <div style={{ border:`1.5px dashed ${C.borderMed}`, borderRadius:8, padding:'28px 16px', textAlign:'center' }}><i className="ti ti-sparkles" style={{ fontSize:26, color:C.textTert, display:'block', marginBottom:8 }} /><div style={{ fontSize:12, color:C.textTert, lineHeight:1.6, fontFamily:F.body }}>Select amenities from the left to add them here.</div></div>}
          </div>
        </div>
        <div style={{ marginTop:12, display:'flex', alignItems:'flex-start', gap:7 }}><i className="ti ti-info-circle" style={{ fontSize:13, color:C.textTert, flexShrink:0, marginTop:1 }} /><div style={{ fontSize:11, color:C.textTert, lineHeight:1.5, fontFamily:F.body }}>Property amenities apply building-wide. Unit-level amenities are configured in the Unit tab.</div></div>
      </div>
    </div>
  );
}

// ─── OWNERSHIP TAB ─────────────────────────────────────────────────────────────
function EquityDonut({ pct }) {
  const r=54,stroke=10,cx=70,cy=70,circ=2*Math.PI*r,dash=(Math.min(pct,100)/100)*circ,color=pct>=100?'#16A34A':pct>0?'#F59E0B':'#E2E8F0';
  return <svg width="140" height="140" style={{ display:'block', margin:'0 auto' }}><circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />{pct>0&&<circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ/4} strokeLinecap="round" style={{ transition:'stroke-dasharray 0.5s ease' }} />}<text x={cx} y={cy-6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0F172A" fontFamily="'Nunito Sans',sans-serif">{pct}%</text><text x={cx} y={cy+14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94A3B8" fontFamily="'Nunito Sans',sans-serif" letterSpacing="0.08em">ALLOCATED</text></svg>;
}
function OwnerRadio({ value, onChange, options, disabled=false }) { return <div style={{ display:'flex', alignItems:'center', gap:18, marginTop:6 }}>{options.map(opt=><div key={opt.value} onClick={()=>!disabled&&onChange(opt.value)} style={{ display:'flex', alignItems:'center', gap:7, cursor:disabled?'default':'pointer', userSelect:'none' }}><div style={{ width:16, height:16, borderRadius:'50%', border:`1.5px solid ${value===opt.value?C.primary:C.borderMed}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{value===opt.value&&<div style={{ width:8, height:8, borderRadius:'50%', background:C.primary }} />}</div><span style={{ fontSize:13, color:value===opt.value?C.primary:C.textSec, fontWeight:value===opt.value?600:400, fontFamily:F.body }}>{opt.label}</span></div>)}</div>; }
function CheckItem({ checked, onChange, label, disabled=false }) { return <div onClick={()=>!disabled&&onChange(!checked)} style={{ display:'flex', alignItems:'center', gap:8, cursor:disabled?'default':'pointer', userSelect:'none', opacity:disabled?0.5:1 }}><div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${checked?C.primary:C.borderMed}`, background:checked?C.primary:C.cardBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>{checked&&<i className="ti ti-check" style={{ fontSize:10, color:'#fff', lineHeight:1 }} />}</div><span style={{ fontSize:13, color:C.textPrimary, fontFamily:F.body }}>{label}</span></div>; }

function ExistingOwnerCard({ owner, onUpdate, onRemove }) {
  const [open,setOpen] = useState(false);
  const [editMode,setEditMode] = useState(false);
  const isPending = (owner.status||'').toUpperCase() === 'PENDING';
  const statusCfg = { verified:{ bg:'#F0FDF4',color:'#166534',border:'#BBF7D0',icon:'ti-circle-check',label:'Verified' }, pending:{ bg:'#EFF6FF',color:'#1D4ED8',border:'#BFDBFE',icon:'ti-clock',label:'Invite Pending' }, expired:{ bg:'#FEF2F2',color:'#991B1B',border:'#FECACA',icon:'ti-clock-x',label:'Invite Expired' } }[(owner.status||'pending').toLowerCase()] || { bg:'#EFF6FF',color:'#1D4ED8',border:'#BFDBFE',icon:'ti-clock',label:'Pending' };
  const isPassive = (owner.involvement||'active').toUpperCase()==='PASSIVE';
  // Fix (a): use first_name/last_name/email from API
  const displayName = [owner.first_name,owner.last_name].filter(Boolean).join(' ') || owner.owner_name || owner.email || 'Owner';
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, marginBottom:8, overflow:'hidden', background:C.cardBg }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px' }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:'#DBEAFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#1D4ED8', flexShrink:0 }}>{(displayName[0]||'O').toUpperCase()}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, fontFamily:F.body }}>{displayName}</div>
          {/* Fix (a): show ownership_pct from API */}
          <div style={{ fontSize:11, color:C.textSec, marginTop:1, fontFamily:F.body }}>{owner.ownership_pct?`${parseFloat(parseFloat(owner.ownership_pct).toFixed(2))}% stake`:''}{owner.ownership_role?` · ${(owner.ownership_role||'').replace(/_/g,' ')}`:''}</div>
        </div>
        {/* Fix 3a: only show amber Invite Pending badge, suppress status badge when isPending to avoid duplication */}
        {isPending && <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:C.amberLight, color:'#92400E', border:`1px solid ${C.amberBorder}`, fontFamily:F.body, whiteSpace:'nowrap' }}><i className="ti ti-lock" style={{ fontSize:11 }} /> Invite Pending</div>}
        {!isPending && <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:20, background:statusCfg.bg, color:statusCfg.color, border:`1px solid ${statusCfg.border}`, whiteSpace:'nowrap', fontFamily:F.body }}><i className={`ti ${statusCfg.icon}`} style={{ fontSize:12 }} />{statusCfg.label}</div>}
        <div onClick={()=>setOpen(o=>!o)} style={{ cursor:'pointer', padding:'2px 4px' }}><i className={`ti ${open?'ti-chevron-up':'ti-chevron-down'}`} style={{ fontSize:14, color:C.textTert }} /></div>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'16px 14px' }}>
          {isPending && <div style={{ background:C.amberLight, border:`1px solid ${C.amberBorder}`, borderRadius:7, padding:'10px 13px', marginBottom:14, display:'flex', alignItems:'flex-start', gap:8 }}><i className="ti ti-alert-triangle" style={{ fontSize:14, color:C.amber, flexShrink:0, marginTop:1 }} /><div style={{ fontSize:12, color:'#92400E', fontFamily:F.body, lineHeight:1.5 }}>Invite pending — ownership % and role are locked until the invite is accepted or expires.</div></div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:14 }}>
            <div>
              <FieldLabel>Ownership %</FieldLabel>
              {/* Fix (a): pre-populated from ownership_pct */}
              <div style={{ display:'flex', alignItems:'center', border:`1px solid ${C.inputBorder}`, borderRadius:6, background:C.inputBg, height:38, overflow:'hidden', opacity:isPending||!editMode?0.65:1 }}>
                <input value={owner.ownership_pct||''} onChange={e=>onUpdate({ ownership_pct:e.target.value })} disabled={isPending||!editMode} style={{ flex:1, padding:'0 10px', fontSize:13, border:'none', outline:'none', background:'transparent', color:C.textPrimary, fontFamily:F.body }} />
                <span style={{ padding:'0 10px', fontSize:13, color:C.textSec, borderLeft:`1px solid ${C.inputBorder}`, background:'#f1f5f9', alignSelf:'stretch', display:'flex', alignItems:'center', fontFamily:F.body }}>%</span>
              </div>
            </div>
            <div><FieldLabel>Ownership Role</FieldLabel><CustomDropdown options={OWNERSHIP_ROLE_OPTIONS} value={OWNERSHIP_ROLE_API_TO_LOCAL[owner.ownership_role]||owner.ownership_role||'individual_owner'} onChange={v=>onUpdate({ ownership_role:v })} placeholder="Individual Owner" disabled={isPending||!editMode} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:14 }}>
            <div><FieldLabel>Involvement</FieldLabel><OwnerRadio value={(owner.involvement||'active').toLowerCase()} onChange={v=>editMode&&!isPending&&onUpdate({ involvement:v })} options={[{value:'active',label:'Active'},{value:'passive',label:'Passive'}]} disabled={isPending||!editMode} /></div>
            <div><FieldLabel>Involvement Type</FieldLabel><div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:6 }}>
              {/* Fix (a): pre-populated from is_lease_signatory, is_maintenance, is_info_only */}
              <CheckItem checked={owner.is_lease_signatory??false} onChange={v=>editMode&&!isPending&&onUpdate({ is_lease_signatory:v })} label="Lease Signatory" disabled={isPassive||isPending||!editMode} />
              <CheckItem checked={owner.is_maintenance??true}      onChange={v=>editMode&&!isPending&&onUpdate({ is_maintenance:v })}     label="Maintenance"     disabled={isPassive||isPending||!editMode} />
              <CheckItem checked={owner.is_info_only??false}       onChange={v=>editMode&&!isPending&&onUpdate({ is_info_only:v })}       label="Information Only" disabled={isPassive||isPending||!editMode} />
            </div></div>
          </div>
          <div style={{ marginBottom:16 }}>
            <FieldLabel>Maintenance Threshold</FieldLabel>
            {/* Fix (a): pre-populated from maintenance_threshold */}
            <TInput value={owner.maintenance_threshold||''} onChange={v=>onUpdate({ maintenance_threshold:v })} placeholder="5,000" prefix="$" type="number" disabled={isPending||!editMode} />
            <div style={{ fontSize:11, color:C.textTert, marginTop:4, fontFamily:F.body }}>Approval required for expenses exceeding this amount.</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:`1px solid ${C.border}` }}>
            <button onClick={()=>onRemove(owner.id)} disabled={isPending} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', cursor:isPending?'not-allowed':'pointer', fontSize:13, fontWeight:600, color:isPending?C.textTert:C.danger, fontFamily:F.body, padding:0, opacity:isPending?0.5:1 }}><i className="ti ti-trash" style={{ fontSize:14 }} /> Remove Owner</button>
            <div style={{ display:'flex', gap:8 }}>
              {editMode && <button onClick={()=>setEditMode(false)} style={{ height:36, padding:'0 18px', border:`1px solid ${C.borderMed}`, borderRadius:7, background:C.cardBg, fontSize:13, fontWeight:600, color:C.textSec, cursor:'pointer', fontFamily:F.body }}>Cancel</button>}
              <button onClick={()=>setEditMode(e=>!e)} disabled={isPending} style={{ height:36, padding:'0 18px', background:isPending?C.borderMed:C.primary, border:'none', borderRadius:7, fontSize:13, fontWeight:700, color:'#fff', cursor:isPending?'not-allowed':'pointer', fontFamily:F.body }}>{editMode?'Done':'Edit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewOwnerForm({ onAdd, onCancel }) {
  const [form,setForm] = useState({ search:'',firstName:'',lastName:'',email:'',phone:'',ownershipRole:'',ownershipPct:'',involvement:'active',involvementType:{ leaseSig:false,maintenance:true,infoOnly:false },maintenanceThreshold:'500' });
  const upd = patch => setForm(f=>({...f,...patch}));
  const isPassive = form.involvement==='passive';
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px', background:C.cardBg, marginTop:10 }}>
      <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary, fontFamily:F.headline, marginBottom:16 }}>New Stakeholder</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, height:38, border:`1px solid ${C.inputBorder}`, borderRadius:6, background:C.inputBg, padding:'0 11px', marginBottom:14 }}><i className="ti ti-search" style={{ fontSize:15, color:C.textTert, flexShrink:0 }} /><input value={form.search} onChange={e=>upd({ search:e.target.value })} placeholder="Search by name, email or phone" style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:C.textPrimary, fontFamily:F.body, width:'100%' }} /></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:12 }}><div><FieldLabel>First Name</FieldLabel><TInput value={form.firstName} onChange={v=>upd({ firstName:v })} /></div><div><FieldLabel>Last Name</FieldLabel><TInput value={form.lastName} onChange={v=>upd({ lastName:v })} /></div></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:12 }}><div><FieldLabel required>Email</FieldLabel><TInput value={form.email} onChange={v=>upd({ email:v })} /></div><div><FieldLabel>Phone</FieldLabel><TInput value={form.phone} onChange={v=>upd({ phone:v })} /></div></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:14 }}><div><FieldLabel>Ownership Role</FieldLabel><CustomDropdown options={OWNERSHIP_ROLE_OPTIONS} value={form.ownershipRole} onChange={v=>upd({ ownershipRole:v })} placeholder="Select Role" /></div><div><FieldLabel>Ownership %</FieldLabel><TInput value={form.ownershipPct} onChange={v=>upd({ ownershipPct:v })} placeholder="0.00" type="number" /></div></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:14 }}>
        <div><FieldLabel>Involvement</FieldLabel><OwnerRadio value={form.involvement} onChange={v=>{ if(v==='passive') upd({ involvement:v,involvementType:{ leaseSig:false,maintenance:false,infoOnly:true } }); else upd({ involvement:v,involvementType:{ leaseSig:false,maintenance:true,infoOnly:false } }); }} options={[{value:'active',label:'Active'},{value:'passive',label:'Passive'}]} /></div>
        <div><FieldLabel>Involvement Type</FieldLabel><div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:6 }}><CheckItem checked={form.involvementType.leaseSig} onChange={v=>upd({ involvementType:{...form.involvementType,leaseSig:v} })} label="Lease Signatory" disabled={isPassive} /><CheckItem checked={form.involvementType.maintenance} onChange={v=>upd({ involvementType:{...form.involvementType,maintenance:v} })} label="Maintenance" disabled={isPassive} /><CheckItem checked={form.involvementType.infoOnly} onChange={v=>upd({ involvementType:{...form.involvementType,infoOnly:v} })} label="Information Only" disabled={isPassive} /></div></div>
      </div>
      <div style={{ marginBottom:20 }}><FieldLabel>Maintenance Threshold</FieldLabel><TInput value={form.maintenanceThreshold} onChange={v=>upd({ maintenanceThreshold:v })} placeholder="500" type="number" /></div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}><button onClick={onCancel} style={{ height:38, padding:'0 20px', border:`1px solid ${C.borderMed}`, borderRadius:7, background:C.cardBg, fontSize:13, fontWeight:600, color:C.textSec, cursor:'pointer', fontFamily:F.body }}>Cancel</button><button onClick={()=>{ if(!form.email) return; onAdd(form); }} style={{ height:38, padding:'0 20px', background:C.primary, border:'none', borderRadius:7, fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:F.body }}>Add Owner</button></div>
    </div>
  );
}

function OwnershipTab({ existingOwners, setExistingOwners, newOwners, setNewOwners }) {
  const [showNewForm,setShowNewForm] = useState(false);
  const existingTotal = existingOwners.reduce((s,o)=>s+(parseFloat(o.ownership_pct)||0),0);
  const newTotal      = newOwners.reduce((s,o)=>s+(parseFloat(o.ownershipPct)||0),0);
  const totalPct = existingTotal + newTotal;
  const pctOk = Math.round(totalPct)===100;
  return (
    <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontSize:16, color:'#D97706' }}>🔑</span><span style={{ fontSize:15, fontWeight:700, color:C.textPrimary, fontFamily:F.headline }}>Property Ownership</span></div>{!showNewForm && <button onClick={()=>setShowNewForm(true)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:C.primary, fontFamily:F.body, padding:0 }}>+ Add Stakeholder</button>}</div>
          <div style={{ fontSize:12, color:C.textSec, marginBottom:18, fontFamily:F.body }}>Changes to verified owners will re-send ownership verification invites.</div>
          {existingOwners.length===0&&newOwners.length===0&&!showNewForm && <div style={{ border:`1.5px dashed ${C.borderMed}`, borderRadius:10, padding:'30px 20px', textAlign:'center', color:C.textTert, fontFamily:F.body, fontSize:13 }}>No ownership records found.</div>}
          {existingOwners.map(o=><ExistingOwnerCard key={o.id} owner={o} onUpdate={patch=>setExistingOwners(prev=>prev.map(x=>x.id===o.id?{...x,...patch}:x))} onRemove={oid=>setExistingOwners(prev=>prev.filter(x=>x.id!==oid))} />)}
          {newOwners.map((o,idx)=>(
            <div key={idx} style={{ border:'1px solid #BBF7D0', borderRadius:10, padding:'11px 14px', marginBottom:8, background:'#F0FDF4', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#166634', flexShrink:0 }}>{(o.firstName?.[0]||'N').toUpperCase()}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, fontFamily:F.body }}>{[o.firstName,o.lastName].filter(Boolean).join(' ')||o.email}</div><div style={{ fontSize:11, color:C.textSec, fontFamily:F.body }}>{o.ownershipPct?`${o.ownershipPct}%`:''} · New — invite pending save</div></div>
              <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'#DCFCE7', color:'#166534', fontFamily:F.body }}>New</span>
              <button onClick={()=>setNewOwners(prev=>prev.filter((_,i)=>i!==idx))} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><i className="ti ti-x" style={{ fontSize:14, color:C.textTert }} /></button>
            </div>
          ))}
          {showNewForm && <NewOwnerForm onAdd={o=>{ setNewOwners(prev=>[...prev,o]); setShowNewForm(false); }} onCancel={()=>setShowNewForm(false)} />}
        </div>
      </div>
      <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}><i className="ti ti-chart-pie" style={{ fontSize:16, color:C.textPrimary }} /><span style={{ fontSize:14, fontWeight:700, color:C.textPrimary, fontFamily:F.headline }}>Equity Summary</span></div>
          <div style={{ marginBottom:16 }}><EquityDonut pct={Math.round(Math.min(totalPct,100))} /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:13, color:C.textSec, fontFamily:F.body }}>Requirement</span><span style={{ fontSize:13, fontWeight:700, color:C.textPrimary, fontFamily:F.body }}>100%</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:13, color:C.textSec, fontFamily:F.body }}>Remaining</span><span style={{ fontSize:13, fontWeight:700, color:pctOk?C.success:'#F59E0B', fontFamily:F.body }}>{Math.max(0,100-Math.round(totalPct))}%</span></div>
          </div>
          {!pctOk && <div style={{ marginTop:12, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:6, padding:'8px 10px', fontSize:11.5, color:'#92400E', fontFamily:F.body, textAlign:'center', lineHeight:1.5 }}>Total ownership must equal 100% to save changes.</div>}
          {pctOk  && <div style={{ marginTop:12, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:6, padding:'8px 10px', fontSize:11.5, color:'#166534', fontFamily:F.body, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><i className="ti ti-circle-check" style={{ fontSize:13 }} /> Ownership fully allocated</div>}
        </div>
        <div style={{ background:C.amberLight, border:`1px solid ${C.amberBorder}`, borderRadius:10, padding:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><i className="ti ti-alert-triangle" style={{ fontSize:14, color:C.amber }} /><span style={{ fontSize:13, fontWeight:700, color:'#92400E', fontFamily:F.body }}>Edit Mode Notes</span></div>
          <div style={{ fontSize:11.5, color:'#92400E', lineHeight:1.6, fontFamily:F.body }}><div style={{ marginBottom:6 }}>• Editing a verified owner's % will re-send their invite → Pending.</div><div style={{ marginBottom:6 }}>• Units using "same as property" ownership are not auto-updated.</div><div>• Removing an owner triggers a change-of-ownership notice to active tenants.</div></div>
        </div>
      </div>
    </div>
  );
}

// ─── FIX (c): BANK ACCOUNT TAB — shows existing saved data + replace toggle ────
function BankFieldLabel({ children, required }) { return <div style={{ fontSize:10.5, fontWeight:700, color:C.labelColor, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5, fontFamily:F.body }}>{children}{required && <span style={{ color:C.danger, marginLeft:2 }}>*</span>}</div>; }
function BankInput({ value, onChange, placeholder, prefix, type='text', disabled=false }) {
  const [focused,setFocused] = useState(false);
  return <div style={{ display:'flex', alignItems:'center', height:38, border:`1px solid ${focused?C.inputFocus:C.inputBorder}`, borderRadius:6, background:disabled?'#f1f5f9':C.inputBg, boxShadow:focused&&!disabled?'0 0 0 2px #dbeafe':'none', overflow:'hidden', transition:'all 0.15s', opacity:disabled?0.7:1 }}>{prefix && <span style={{ padding:'0 10px', fontSize:13, color:C.textSec, borderRight:`1px solid ${C.inputBorder}`, background:'#f1f5f9', alignSelf:'stretch', display:'flex', alignItems:'center', fontFamily:F.body, flexShrink:0 }}>{prefix}</span>}<input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={e=>onChange&&onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ flex:1, padding:'0 11px', fontSize:13, border:'none', outline:'none', background:'transparent', color:C.textPrimary, fontFamily:F.body, cursor:disabled?'default':'text' }} /></div>;
}
function VoidedCheckUpload({ fileName, onFile, onRemove }) {
  const ref = useRef();
  return <div>{fileName ? <div style={{ display:'flex', alignItems:'center', gap:10, background:C.successLight, border:'1px solid #bbf7d0', borderRadius:6, padding:'8px 12px' }}><i className="ti ti-file-check" style={{ fontSize:16, color:C.success, flexShrink:0 }} /><span style={{ flex:1, fontSize:12, color:'#166534', fontFamily:F.body, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fileName}</span><button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}><i className="ti ti-x" style={{ fontSize:13, color:C.textSec }} /></button></div> : <div onClick={()=>ref.current.click()} style={{ display:'flex', alignItems:'center', gap:10, border:`1.5px dashed ${C.borderMed}`, borderRadius:6, padding:'9px 14px', cursor:'pointer', background:C.inputBg, transition:'border-color 0.15s', width:'100%', boxSizing:'border-box' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.primary} onMouseLeave={e=>e.currentTarget.style.borderColor=C.borderMed}><input ref={ref} type="file" accept="image/jpeg,image/png,application/pdf" style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]){ onFile(e.target.files[0]); e.target.value=''; } }} /><i className="ti ti-upload" style={{ fontSize:15, color:C.textTert, flexShrink:0 }} /><div><div style={{ fontSize:12, fontWeight:700, color:C.primaryBlue, fontFamily:F.body }}>Upload Voided Check</div><div style={{ fontSize:11, color:C.textTert, fontFamily:F.body }}>JPG, PNG or PDF — Max 5MB</div></div></div>}</div>;
}

// Fix (c): AccountCard — shows "Currently saved" block, then optional replace form
function AccountCard({ categoryId, accountData, onChange, onSaved, reserveExtras, onReserveExtrasChange, apiRecord }) {
  const isOptional = categoryId==='prop_reserve'||categoryId==='owner_settlement';
  const isReserve  = categoryId==='prop_reserve';
  const allItems   = ACCOUNT_CATEGORIES.flatMap(s=>s.items);
  const meta       = allItems.find(i=>i.id===categoryId)||{ label:'',icon:'ti-building-bank' };
  const desc       = ACCOUNT_DESCRIPTIONS[categoryId]||'';

  // Fix (c): resolve saved account — use real API data if available, else mock
  // When pm_bank_account is eventually linked, apiRecord.bank_name/account_number/routing_number will be populated
  const resolvedAccount = (() => {
    if (apiRecord?.bank_name) {
      return { bank: apiRecord.bank_name, number: apiRecord.account_number||'••••', routing: apiRecord.routing_number||'••••', type: '—', nickname: '—', owner: '—' };
    }
    // Fallback: show first mock account as placeholder until real data exists
    return MOCK_EXISTING_ACCOUNTS[0];
  })();

  const isAlreadySaved = accountData.saved && !accountData.replacing;
  const isSkipped      = accountData.skipped;

  const canSave = accountData.mode==='existing'
    ? Boolean(accountData.existingId)
    : Boolean((accountData.bankName||'').trim()&&(accountData.accountNumber||'').trim()&&(accountData.routing||'').trim());

  function handleSave() { if(!canSave) return; onChange({ ...accountData, saved:true, replacing:false }); if(onSaved) onSaved(); }
  // Fix 4c: Keep Current must restore saved:true so the 'Currently saved' block reappears
  function handleKeep() { onChange({ ...accountData, replacing:false, saved:true }); }

  return (
    <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'18px 20px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}><i className={`ti ${meta.icon}`} style={{ fontSize:17, color:C.primaryBlue }} /></div>
          <div style={{ flex:1 }}><div style={{ fontSize:16, fontWeight:700, color:C.textPrimary, fontFamily:F.headline, marginBottom:4 }}>{meta.label}</div><div style={{ fontSize:12, color:C.textSec, fontFamily:F.body, lineHeight:1.55, maxWidth:520 }}>{desc}</div></div>
          {isAlreadySaved && <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, background:C.successLight, border:'1px solid #bbf7d0', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, color:C.success, fontFamily:F.body, whiteSpace:'nowrap', flexShrink:0 }}><i className="ti ti-circle-check" style={{ fontSize:12 }} /> Saved</div>}
          {isSkipped      && <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, background:'#F8FAFC', border:`1px solid ${C.borderMed}`, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, color:C.textTert, fontFamily:F.body, whiteSpace:'nowrap', flexShrink:0 }}><i className="ti ti-minus" style={{ fontSize:12 }} /> Skipped</div>}
        </div>
      </div>

      {/* Skipped state */}
      {isSkipped && <div style={{ padding:20, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}><i className="ti ti-circle-dashed" style={{ fontSize:32, color:C.borderMed }} /><div style={{ fontSize:13, color:C.textSec, fontFamily:F.body }}>This account has been skipped.</div><button onClick={()=>onChange({ ...accountData, skipped:false })} style={{ height:34, padding:'0 16px', border:`1px solid ${C.borderMed}`, borderRadius:6, background:C.cardBg, fontSize:12, fontWeight:600, color:C.textSec, cursor:'pointer', fontFamily:F.body }}>Set up this account</button></div>}

      {/* Fix (c): Currently saved block — shown when saved and not in replace mode */}
      {isAlreadySaved && (
        <div style={{ padding:'16px 20px 0' }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:C.textTert, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10, fontFamily:F.body }}>Currently saved</div>
          <div style={{ background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:6, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><i className={`ti ${meta.icon}`} style={{ fontSize:14, color:C.primaryBlue }} /></div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, fontFamily:F.body }}>{resolvedAccount.bank} <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', padding:'1px 6px', borderRadius:4, background:'#EFF6FF', color:C.primaryBlue, marginLeft:4 }}>{resolvedAccount.type}</span></div>
                <div style={{ fontSize:11, color:C.textSec, fontFamily:F.body, marginTop:1 }}>{resolvedAccount.nickname} · {resolvedAccount.number}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 14px' }}>
              {[{ label:'Account number', value:resolvedAccount.number },{ label:'Routing / IFSC', value:resolvedAccount.routing },{ label:'Account type', value:resolvedAccount.type },{ label:'Legal owner', value:resolvedAccount.owner }].map(({ label,value }) => (
                <div key={label}><div style={{ fontSize:10, color:C.textTert, fontFamily:F.body, marginBottom:3 }}>{label}</div><div style={{ fontSize:12, color:C.textSec, background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:5, padding:'5px 9px', fontFamily:F.body }}>{value}</div></div>
              ))}
            </div>
          </div>
          {/* Replace toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:16, borderBottom:`1px solid ${C.border}`, marginBottom:0 }}>
            <span style={{ fontSize:12, color:C.textSec, fontFamily:F.body }}>Want to change this account?</span>
            <div style={{ display:'flex', border:`1px solid ${C.borderMed}`, borderRadius:7, overflow:'hidden' }}>
              {[['existing','Select existing'],['new','Add new account']].map(([val,label]) => (
                <button key={val} onClick={()=>onChange({ ...accountData, replacing:true, mode:val, saved:false })}
                  style={{ padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', border:'none', fontFamily:F.body,
                    // Fix 4b: active blue when this option is selected
                    background: accountData.mode===val && accountData.replacing ? C.primary : 'transparent',
                    color: accountData.mode===val && accountData.replacing ? '#fff' : C.textSec,
                    transition:'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fix (c): Replace form — shown when replacing or not yet saved */}
      {!isSkipped && (accountData.replacing || !isAlreadySaved) && (
        <div style={{ padding:'16px 20px 0' }}>
          {accountData.replacing && <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:7, padding:'9px 13px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><i className="ti ti-arrows-exchange" style={{ fontSize:14, color:C.primaryBlue }} /><span style={{ fontSize:12, color:'#1D4ED8', fontFamily:F.body }}>Replacing the current account — save to confirm, or keep current to cancel.</span></div>}
          {/* Mode toggle */}
          {!isAlreadySaved && <div style={{ display:'flex', border:`1px solid ${C.borderMed}`, borderRadius:7, overflow:'hidden', width:'fit-content', marginBottom:20 }}>{[['existing','Select Existing'],['new','Add New Account']].map(([val,label]) => <button key={val} onClick={()=>onChange({ ...accountData, mode:val, saved:false })} style={{ padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', fontFamily:F.body, background:accountData.mode===val?C.primary:C.cardBg, color:accountData.mode===val?'#fff':C.textSec, transition:'all 0.15s' }}>{label}</button>)}</div>}
          {/* Existing account dropdown */}
          {accountData.mode==='existing' && (
            <div>
              <div style={{ marginBottom:16 }}><BankFieldLabel required>Select Account</BankFieldLabel><CustomDropdown options={[{value:'',label:'Select an account…'},...MOCK_EXISTING_ACCOUNTS]} value={accountData.existingId} onChange={v=>onChange({ ...accountData, existingId:v })} placeholder="Select an account…" /></div>
              {(() => { const sel = MOCK_EXISTING_ACCOUNTS.find(a=>a.value===accountData.existingId); return sel ? <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginTop:4 }}><div><BankFieldLabel>Bank Name</BankFieldLabel><BankInput value={sel.bank} disabled /></div><div><BankFieldLabel>Account Nickname</BankFieldLabel><BankInput value={sel.nickname} disabled /></div><div><BankFieldLabel>Account Number</BankFieldLabel><BankInput value={sel.number} disabled /></div><div><BankFieldLabel>Routing / IFSC</BankFieldLabel><BankInput value={sel.routing} disabled /></div><div><BankFieldLabel>Account Type</BankFieldLabel><BankInput value={sel.type} disabled /></div><div><BankFieldLabel>Legal Owner</BankFieldLabel><BankInput value={sel.owner} disabled /></div></div> : null; })()}
            </div>
          )}
          {/* New account form */}
          {accountData.mode==='new' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:12 }}><div><BankFieldLabel required>Bank Name</BankFieldLabel><BankInput value={accountData.bankName} onChange={v=>onChange({ ...accountData, bankName:v })} placeholder="e.g. Chase Manhattan" /></div><div><BankFieldLabel required>Account Nickname</BankFieldLabel><BankInput value={accountData.nickname} onChange={v=>onChange({ ...accountData, nickname:v })} placeholder="e.g. Main Op Account" /></div></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:12 }}><div><BankFieldLabel required>Account Number</BankFieldLabel><BankInput value={accountData.accountNumber} onChange={v=>onChange({ ...accountData, accountNumber:v })} placeholder="Enter account number" type="password" /></div><div><BankFieldLabel required>Routing / IFSC Number</BankFieldLabel><BankInput value={accountData.routing} onChange={v=>onChange({ ...accountData, routing:v })} placeholder="e.g. 021000021" /></div></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px', marginBottom:12 }}><div><BankFieldLabel>Account Type</BankFieldLabel><CustomDropdown options={ACCOUNT_TYPE_OPTIONS} value={accountData.accountType} onChange={v=>onChange({ ...accountData, accountType:v })} placeholder="Select type…" /></div><div><BankFieldLabel>Owner</BankFieldLabel><BankInput value={accountData.owner} onChange={v=>onChange({ ...accountData, owner:v })} placeholder="Legal owner name" /></div></div>
              <div style={{ width:'100%', marginBottom:4 }}><BankFieldLabel>Voided Check</BankFieldLabel><VoidedCheckUpload fileName={accountData.voidedCheckName} onFile={f=>onChange({ ...accountData, voidedCheck:f, voidedCheckName:f.name })} onRemove={()=>onChange({ ...accountData, voidedCheck:null, voidedCheckName:'' })} /></div>
            </div>
          )}
          {/* Reserve extras */}
          {isReserve && (
            <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
              <div style={{ marginBottom:16, maxWidth:260 }}><BankFieldLabel>Minimum Threshold Amount</BankFieldLabel><BankInput value={reserveExtras.minThreshold} onChange={v=>onReserveExtrasChange({ ...reserveExtras, minThreshold:v })} placeholder="0.00" prefix="$" type="number" /><div style={{ fontSize:11, color:C.textTert, marginTop:4, fontFamily:F.body }}>Auto-refill triggers when balance falls below this amount.</div></div>
            </div>
          )}
          {/* Optional skip banner — only for accounts not yet saved */}
          {isOptional && !isAlreadySaved && !accountData.replacing && (
            <div style={{ marginTop:16, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}><i className="ti ti-info-circle" style={{ fontSize:14, color:'#D97706', flexShrink:0, marginTop:1 }} /><div style={{ fontSize:12, color:'#92400E', fontFamily:F.body, lineHeight:1.5 }}>{categoryId==='owner_settlement'?'This account is optional. The property owner will provide it after accepting their ownership invite via the Landlord Portal.':'This account is optional. You can skip it and manage reserves at the property level instead.'}</div></div>
              <button onClick={()=>{ onChange({ ...accountData, skipped:true }); if(onSaved) onSaved(); }} style={{ height:32, padding:'0 14px', border:'1px solid #FDE68A', borderRadius:6, background:'#FEF3C7', fontSize:12, fontWeight:600, color:'#92400E', cursor:'pointer', fontFamily:F.body, whiteSpace:'nowrap', flexShrink:0 }}>Skip this account</button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!isSkipped && (accountData.replacing || !isAlreadySaved) && (
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'16px 20px', marginTop:16, borderTop:`1px solid ${C.border}`, background:'#fafbfc' }}>
          {accountData.replacing
            ? <button onClick={handleKeep} style={{ height:36, padding:'0 20px', border:`1px solid ${C.borderMed}`, borderRadius:7, background:C.cardBg, fontSize:13, fontWeight:600, color:C.textSec, cursor:'pointer', fontFamily:F.body }}>Keep current</button>
            : <button onClick={()=>onChange({ ...accountData, saved:false })} style={{ height:36, padding:'0 20px', border:`1px solid ${C.borderMed}`, borderRadius:7, background:C.cardBg, fontSize:13, fontWeight:600, color:C.textSec, cursor:'pointer', fontFamily:F.body }}>Cancel</button>
          }
          <button onClick={handleSave} disabled={!canSave} style={{ height:36, padding:'0 20px', background:canSave?C.primary:C.borderMed, border:'none', borderRadius:7, fontSize:13, fontWeight:700, color:'#fff', cursor:canSave?'pointer':'not-allowed', fontFamily:F.body }}>Save Changes</button>
        </div>
      )}
    </div>
  );
}

function BankAccountTab({ accounts, setAccounts, reserveExtras, setReserveExtras, activeId, setActiveId, apiRecords }) {
  const allIds     = ACCOUNT_CATEGORIES.flatMap(s=>s.items.map(i=>i.id));
  const savedCount = Object.values(accounts).filter(a=>a.saved||a.skipped).length;
  const totalCount = allIds.length;
  function updateAccount(id,data) { setAccounts(prev=>({ ...prev, [id]:data })); }
  function advanceToNext(currentId) { const idx=allIds.indexOf(currentId); if(idx<allIds.length-1) setActiveId(allIds[idx+1]); }
  return (
    <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
      <div style={{ width:260, flexShrink:0, background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        {ACCOUNT_CATEGORIES.map((section,si)=>(
          <div key={section.section}>
            <div style={{ padding:si===0?'16px 16px 8px':'12px 16px 8px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:C.textTert, fontFamily:F.body, borderTop:si>0?`1px solid ${C.border}`:'none' }}>{section.section}</div>
            {section.items.map(item=>{
              const isActive=activeId===item.id, isSaved=accounts[item.id]?.saved, isSkip=accounts[item.id]?.skipped;
              return <div key={item.id} onClick={()=>setActiveId(item.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', background:isActive?C.primaryLight:'transparent', borderLeft:`3px solid ${isActive?C.primary:'transparent'}`, transition:'all 0.12s' }}
                onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='#f8faff'; }}
                onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent'; }}>
                <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background:isSaved?C.success:isSkip?'#F59E0B':isActive?C.primary:C.borderMed, border:`2px solid ${isSaved?C.success:isSkip?'#F59E0B':isActive?C.primary:C.borderMed}`, transition:'all 0.15s' }} />
                <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:isActive?700:500, color:isActive?C.primary:C.textPrimary, fontFamily:F.body, lineHeight:1.3 }}>{item.label}</div><div style={{ fontSize:11, color:C.textTert, fontFamily:F.body, marginTop:1 }}>{item.sub}</div></div>
                {isSaved && <i className="ti ti-circle-check" style={{ fontSize:13, color:C.success, flexShrink:0 }} />}
                {isSkip  && <i className="ti ti-minus"        style={{ fontSize:13, color:'#F59E0B', flexShrink:0 }} />}
              </div>;
            })}
          </div>
        ))}
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}`, background:C.inputBg }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}><span style={{ fontSize:11, color:C.textSec, fontFamily:F.body }}>{savedCount} of {totalCount} configured</span><span style={{ fontSize:11, fontWeight:700, color:savedCount===totalCount?C.success:C.textTert, fontFamily:F.body }}>{Math.round((savedCount/totalCount)*100)}%</span></div>
          <div style={{ height:4, borderRadius:2, background:C.border, overflow:'hidden' }}><div style={{ height:'100%', borderRadius:2, background:savedCount===totalCount?C.success:C.primaryBlue, width:`${(savedCount/totalCount)*100}%`, transition:'width 0.4s ease' }} /></div>
        </div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <AccountCard key={activeId} categoryId={activeId} accountData={accounts[activeId]} onChange={data=>updateAccount(activeId,data)} onSaved={()=>advanceToNext(activeId)} reserveExtras={reserveExtras} onReserveExtrasChange={setReserveExtras} apiRecord={apiRecords[activeId]} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:7, marginTop:12 }}><i className="ti ti-lock" style={{ fontSize:13, color:C.textTert, flexShrink:0, marginTop:1 }} /><div style={{ fontSize:11, color:C.textTert, lineHeight:1.5, fontFamily:F.body }}>Account details are encrypted at rest. Banking credentials are never stored in plain text.</div></div>
      </div>
    </div>
  );
}

function Skeleton({ h=38, w='100%', radius=6 }) { return <div style={{ height:h, width:w, borderRadius:radius, background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', flexShrink:0 }} />; }

// ─── Main component ────────────────────────────────────────────────────────────
export default function EditPropertyPage() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const token    = localStorage.getItem('access_token');

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [subTab,  setSubTab]  = useState('Primary Info');
  const [errors,  setErrors]  = useState({});
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Independent PM');

  const [propName,   setPropName]   = useState('');
  const [propType,   setPropType]   = useState('');
  const [propValue,  setPropValue]  = useState('');
  const [buildYear,  setBuildYear]  = useState('');
  const [ownerType,  setOwnerType]  = useState('');
  const [desc,       setDesc]       = useState('');
  const [country,    setCountry]    = useState('US');
  const [street1,    setStreet1]    = useState('');
  const [street2,    setStreet2]    = useState('');
  const [landmark,   setLandmark]   = useState('');
  const [city,       setCity]       = useState('');
  const [state,      setState]      = useState('');
  const [zip,        setZip]        = useState('');

  const [propertyAmenities,  setPropertyAmenities]  = useState([]);

  // Fix 1a: Gallery state
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [thumbPreviews,    setThumbPreviews]    = useState([null,null,null]);
  const [galleryImages,    setGalleryImages]    = useState([]);
  const [selectedAmenities,  setSelectedAmenities]  = useState(new Set());
  const [originalAmenityIds, setOriginalAmenityIds] = useState(new Set());
  // Fix (b): store amenity record IDs for deletion
  const [amenityRecords, setAmenityRecords] = useState([]);

  const [existingOwners, setExistingOwners] = useState([]);
  const [newOwners,      setNewOwners]      = useState([]);

  const [bankAccounts,      setBankAccounts]      = useState(() => Object.fromEntries(['prop_operating','prop_reserve','pm_operating','pm_trust','rent','security','owner_settlement'].map(id=>[id,emptyAccountState()])));
  const [bankReserveExtras, setBankReserveExtras] = useState(() => emptyReserveExtras());
  const [bankActiveId,      setBankActiveId]      = useState('prop_operating');
  // Fix (c): store raw API bank records for resolving real account data
  const [bankApiRecords, setBankApiRecords] = useState({});

  const [originalPropName, setOriginalPropName] = useState('');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch(`${API}/api/auth/me/`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.ok?r.json():null).then(data=>{ if(data){ setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User'); setUserRole({ INDEPENDENT_PM:'Independent PM', ORGANIZATIONAL_PM:'Org PMS Admin' }[data.active_persona]||'Independent PM'); } }).catch(()=>{});
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/amenities/?category=PROPERTY`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(data=>setPropertyAmenities((data||[]).map(a=>({ id:a.id, icon:a.icon, label:a.name })))).catch(()=>{});
  }, [token]);

  useEffect(() => {
    if (!token||!id) return;
    setLoading(true);
    fetch(`${API}/api/properties/${id}/`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>{ if(!r.ok) throw new Error('Failed to load property'); return r.json(); })
      .then(data=>{
        setPropName(data.property_name||data.name||'');
        setOriginalPropName(data.property_name||data.name||'');
        setPropType(PROP_TYPE_API_TO_DISPLAY[data.property_type]||data.property_type||'');
        // Fix 1b: value and build_year must be in PropertyDetailSerializer.Meta.fields to pre-populate
        setPropValue(data.value||'');
        setBuildYear(data.build_year||'');
        setOwnerType(OWN_TYPE_API_TO_DISPLAY[data.ownership_type]||data.ownership_type||'');
        setDesc(data.description||'');
        setCountry(data.country||'US');
        setStreet1(data.street_address||data.street1||'');
        setStreet2(data.street2||'');
        setLandmark(data.landmark||'');
        setCity(data.city||'');
        setState(data.state||'');
        setZip(data.zip_code||'');

        // Fix 1a: pre-populate gallery from API
        if (data.primary_image) setMainImagePreview(data.primary_image);
        if (Array.isArray(data.gallery_images)) {
          setGalleryImages(data.gallery_images.map(g=>typeof g==='string'?{ url:g }:{ url:g.file_url||g.image_url||g }));
        }

        // Fix (b): amenity field is `amenity` (integer), not `amenity_id`
        if (Array.isArray(data.amenities)) {
          const ids = new Set(data.amenities.map(a=>a.amenity));
          setSelectedAmenities(ids);
          setOriginalAmenityIds(ids);
          setAmenityRecords(data.amenities); // store full records for deletion by record id
        }

        // Fix (a): pre-populate ownership using correct API field names
        if (Array.isArray(data.ownerships)) {
          setExistingOwners(data.ownerships.map(o=>({
            ...o,
            // ownership_pct now returned directly from updated serializer
            // maintenance_threshold, is_lease_signatory, is_maintenance, is_info_only also returned
            ownership_role: OWNERSHIP_ROLE_API_TO_LOCAL[o.ownership_role]||(o.ownership_role||'').toLowerCase(),
          })));
        }

        // Fix (c): bank accounts — map module to categoryId, store raw records for display
        if (Array.isArray(data.bank_accounts)) {
          const map = {};
          const rawMap = {};
          data.bank_accounts.forEach(a=>{
            const catId = MODULE_TO_CATEGORY_ID[a.module];
            if (!catId) return;
            rawMap[catId] = a; // store raw record so AccountCard can use real data when available
            map[catId] = {
              ...emptyAccountState(),
              saved:   !a.is_skipped,
              skipped: a.is_skipped||false,
            };
            if (catId==='prop_reserve' && a.min_threshold) {
              setBankReserveExtras(prev=>({ ...prev, minThreshold:String(a.min_threshold) }));
            }
          });
          setBankAccounts(prev=>({ ...prev, ...map }));
          setBankApiRecords(rawMap);
        }
      })
      .catch(err=>setError(err.message))
      .finally(()=>setLoading(false));
  }, [id, token]);

  const stateOptions = (STATES[country]||[]).map(s=>({ value:s, label:s }));
  const fullAddr     = [street1,city,state,COUNTRY_OPTIONS.find(c=>c.value===country)?.label].filter(Boolean).join(', ');
  const meta         = PAGE_META[subTab]||{ title:subTab, sub:'' };

  function validate() {
    const e = {};
    if (!propName.trim()) e.propName='Property name is required';
    if (!propType)        e.propType='Select a property type';
    if (!ownerType)       e.ownerType='Select an ownership type';
    if (!street1.trim())  e.street1='Street address is required';
    if (!city.trim())     e.city='City is required';
    if (!state)           e.state='Select a state';
    if (!zip.trim())      e.zip='Zip code is required';
    if (buildYear&&(isNaN(buildYear)||+buildYear<1800||+buildYear>2099)) e.buildYear='Enter a valid year';
    setErrors(e);
    return Object.keys(e).length===0;
  }

  async function handleSave() {
    if (!validate()||saving) return;
    setSaving(true);
    try {
      const patchRes = await fetch(`${API}/api/properties/${id}/`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ name:propName, property_type:PROP_TYPE_DISPLAY_TO_API[propType]||propType, ownership_type:OWN_TYPE_DISPLAY_TO_API[ownerType]||ownerType, description:desc, country, street1, street2, landmark, city, state, zip_code:zip, value:propValue||null, build_year:buildYear||null }) });
      if (!patchRes.ok) { console.error('PATCH failed:', await patchRes.json()); setSaving(false); return; }

      // Sync amenities — Fix (b): use record.id for deletion, record.amenity for matching
      const toAdd    = [...selectedAmenities].filter(aId=>!originalAmenityIds.has(aId));
      const toRemove = [...originalAmenityIds].filter(aId=>!selectedAmenities.has(aId));
      for (const aId of toAdd)    { await fetch(`${API}/api/properties/${id}/amenities/`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ amenity:aId, access_type:'ALL' }) }); }
      for (const aId of toRemove) { const rec = amenityRecords.find(a=>a.amenity===aId); if(rec?.id) await fetch(`${API}/api/properties/${id}/amenities/${rec.id}/`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); }

      // PATCH existing owners
      for (const o of existingOwners) {
        await fetch(`${API}/api/properties/${id}/ownerships/${o.id}/`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ ownership_role:(o.ownership_role||'individual_owner').toUpperCase(), ownership_pct:parseFloat(o.ownership_pct)||0, involvement:(o.involvement||'active').toUpperCase(), is_lease_signatory:o.is_lease_signatory??false, is_maintenance:o.is_maintenance??true, is_info_only:o.is_info_only??false, maintenance_threshold:parseFloat(o.maintenance_threshold)||0 }) });
      }
      for (const o of newOwners) {
        await fetch(`${API}/api/properties/${id}/ownerships/`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ first_name:o.firstName, last_name:o.lastName, email:o.email, phone:o.phone||'', ownership_role:(o.ownershipRole||'individual_owner').toUpperCase(), ownership_pct:parseFloat(o.ownershipPct)||0, involvement:(o.involvement||'active').toUpperCase(), is_lease_signatory:o.involvementType?.leaseSig??false, is_maintenance:o.involvementType?.maintenance??true, is_info_only:o.involvementType?.infoOnly??false, maintenance_threshold:parseFloat(o.maintenanceThreshold)||0, is_corporate:o.ownershipRole==='corporate' }) });
      }
      navigate(`/pm-portal/properties/${id}`);
    } catch(err) { console.error('Save error:', err); }
    setSaving(false);
  }

  if (loading) return (<><style>{`*{box-sizing:border-box;}html,body,#root{height:100%;overflow:hidden;margin:0;padding:0;}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style><div style={{ display:'flex',height:'100vh',background:C.pageBg }}><NavB activeId="all-props" /><div style={{ flex:1,display:'flex',flexDirection:'column' }}><Header userName={userName} userRole={userRole} /><div style={{ flex:1,padding:PAGE_PX,display:'flex',flexDirection:'column',gap:16 }}><Skeleton h={36} w={320} /><div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>{[...Array(6)].map((_,i)=><Skeleton key={i} h={52} />)}</div></div></div></div></>);
  if (error)   return (<><style>{`*{box-sizing:border-box;}html,body,#root{height:100%;overflow:hidden;margin:0;padding:0;}`}</style><div style={{ display:'flex',height:'100vh',background:C.pageBg }}><NavB activeId="all-props" /><div style={{ flex:1,display:'flex',flexDirection:'column' }}><Header userName={userName} userRole={userRole} /><div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12 }}><i className="ti ti-alert-circle" style={{ fontSize:36,color:C.danger }} /><div style={{ fontSize:15,fontWeight:700,color:C.textPrimary,fontFamily:F.headline }}>{error}</div><button onClick={()=>navigate(-1)} style={{ height:38,padding:'0 20px',background:C.primary,border:'none',borderRadius:7,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:F.body }}>Go Back</button></div></div></div></>);

  return (
    <>
      <style>{`*{box-sizing:border-box;}html,body,#root{height:100%;overflow:hidden;margin:0;padding:0;}.ep-scroll::-webkit-scrollbar{width:5px;}.ep-scroll::-webkit-scrollbar-track{background:transparent;}.ep-scroll::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px;}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg, fontFamily:F.body }}>
        <NavB activeId="all-props" />
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <Header userName={userName} userRole={userRole} />
          <div className="ep-scroll" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', minHeight:0 }}>
            <div style={{ padding:`${PAGE_PX}px ${PAGE_PX}px 0`, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.textSec, fontFamily:F.body, marginBottom:10 }}>
                <span onClick={()=>navigate('/pm-portal/properties')} style={{ cursor:'pointer', color:C.primaryBlue }}>Properties</span>
                <i className="ti ti-chevron-right" style={{ fontSize:11 }} />
                <span onClick={()=>navigate(`/pm-portal/properties/${id}`)} style={{ cursor:'pointer', color:C.primaryBlue }}>{originalPropName||'Property'}</span>
                <i className="ti ti-chevron-right" style={{ fontSize:11 }} />
                <span style={{ color:C.textTert }}>Edit Property</span>
              </div>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
                <div>
                  <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'clamp(20px,2vw,26px)', fontWeight:700, color:C.textPrimary }}>Edit Property</h1>
                  <p style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:13, fontWeight:600, color:C.success }}>{meta.title}</p>
                  {meta.sub && <p style={{ margin:0, fontFamily:F.body, fontSize:13, color:C.textSec, maxWidth:560 }}>{meta.sub}</p>}
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, color:'#C2410C', fontFamily:F.body, flexShrink:0 }}><i className="ti ti-pencil" style={{ fontSize:13 }} /> Edit Mode</div>
              </div>
            </div>
            <div style={{ background:C.cardBg, margin:`12px ${PAGE_PX}px 0`, borderBottom:`1px solid ${C.border}`, borderTop:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, borderRadius:'8px 8px 0 0', display:'flex', flexShrink:0 }}>
              {PROP_SUBTABS.map(st=>{ const isA=subTab===st; return <button key={st} onClick={()=>setSubTab(st)} style={{ padding:'10px 16px', fontSize:13, fontWeight:isA?700:400, color:isA?C.primary:C.textSec, background:'transparent', border:'none', borderBottom:isA?`2.5px solid ${C.primary}`:'2.5px solid transparent', cursor:'pointer', transition:'all 0.15s', marginBottom:-1, fontFamily:F.body, outline:'none', whiteSpace:'nowrap' }}>{st==='Primary Info'?'Basic':st}</button>; })}
            </div>
            <div style={{ padding:`20px ${PAGE_PX}px 100px` }}>
              {subTab==='Primary Info' && (
                <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ width:800, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ background:C.cardBg, borderRadius:10, border:`1px solid ${C.border}`, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SecHead type="info" title="Property Basics" />
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 16px' }}>
                        <div><FieldLabel required>Property Name</FieldLabel><TInput value={propName} onChange={setPropName} error={errors.propName} /><ErrMsg msg={errors.propName} /></div>
                        <div><FieldLabel required>Property Type</FieldLabel><CustomDropdown options={PROPERTY_TYPE_OPTIONS} value={propType} onChange={setPropType} placeholder="Select Type" error={!!errors.propType} /><ErrMsg msg={errors.propType} /></div>
                        <div><FieldLabel>Property Value (Est.)</FieldLabel><TInput value={propValue} onChange={setPropValue} placeholder="0.00" prefix="$" type="number" /></div>
                        <div><FieldLabel>Build In Year</FieldLabel><TInput value={buildYear} onChange={setBuildYear} placeholder="YYYY" type="number" error={errors.buildYear} /><ErrMsg msg={errors.buildYear} /></div>
                        <div><FieldLabel required>Ownership Type</FieldLabel><CustomDropdown options={OWNERSHIP_TYPE_OPTIONS} value={ownerType} onChange={setOwnerType} placeholder="Select Ownership Type" error={!!errors.ownerType} /><ErrMsg msg={errors.ownerType} /></div>
                        <div style={{ gridColumn:'1/-1' }}><FieldLabel>Description</FieldLabel><TArea value={desc} onChange={setDesc} rows={3} /></div>
                      </div>
                    </div>
                    <div style={{ background:C.cardBg, borderRadius:10, border:`1px solid ${C.border}`, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SecHead type="pin" title="Address Details" />
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 16px' }}>
                        <div><FieldLabel required>Country</FieldLabel><CustomDropdown options={COUNTRY_OPTIONS} value={country} onChange={v=>{ setCountry(v); setState(''); }} placeholder="Select Country" /></div>
                        <div />
                        <div><FieldLabel required>Street Address 01</FieldLabel><TInput value={street1} onChange={setStreet1} placeholder="Building No, Street Name" error={errors.street1} /><ErrMsg msg={errors.street1} /></div>
                        <div><FieldLabel>Street Address 02</FieldLabel><TInput value={street2} onChange={setStreet2} placeholder="Suite, Floor (Optional)" /></div>
                        <div><FieldLabel>Landmark</FieldLabel><TInput value={landmark} onChange={setLandmark} placeholder="Near Central Park" /></div>
                        <div><FieldLabel required>City</FieldLabel><TInput value={city} onChange={setCity} placeholder="New York" error={errors.city} /><ErrMsg msg={errors.city} /></div>
                        <div><FieldLabel required>State</FieldLabel><CustomDropdown options={stateOptions} value={state} onChange={setState} placeholder={country?'Select State':'Select country first'} disabled={!country} error={!!errors.state} /><ErrMsg msg={errors.state} /></div>
                        <div><FieldLabel required>Zipcode</FieldLabel><TInput value={zip} onChange={setZip} placeholder="10001" error={errors.zip} /><ErrMsg msg={errors.zip} /></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:16 }}>
                    <LiveMap address={fullAddr} />
                    {/* Fix 1a: Gallery upload section — pre-populated from API, allow delete + upload */}
                  <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, fontFamily:F.body }}>Property Gallery</div>
                      <span style={{ fontSize:11, color:C.textTert, fontFamily:F.body }}>{galleryImages.length} image{galleryImages.length!==1?'s':''}</span>
                    </div>
                    {/* Main image */}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10.5, fontWeight:700, color:C.labelColor, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, fontFamily:F.body }}>Main Image</div>
                      <GalleryUploadZone height={130} preview={mainImagePreview} onFile={f=>setMainImagePreview(URL.createObjectURL(f))} onRemove={()=>setMainImagePreview(null)} />
                    </div>
                    {/* Thumbnails */}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10.5, fontWeight:700, color:C.labelColor, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, fontFamily:F.body }}>Thumbnails</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                        {[0,1,2].map(i=><GalleryUploadZone key={i} height={56} isThumb preview={thumbPreviews[i]} onFile={f=>{ const t=[...thumbPreviews]; t[i]=URL.createObjectURL(f); setThumbPreviews(t); }} onRemove={()=>{ const t=[...thumbPreviews]; t[i]=null; setThumbPreviews(t); }} />)}
                      </div>
                    </div>
                    {/* Gallery images */}
                    {galleryImages.length>0&&(
                      <div>
                        <div style={{ fontSize:10.5, fontWeight:700, color:C.labelColor, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, fontFamily:F.body }}>Gallery Images</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                          {galleryImages.map((img,i)=>(
                            <div key={i} style={{ position:'relative', borderRadius:7, overflow:'hidden', aspectRatio:'4/3' }}>
                              <img src={img.url||img.file_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                              <button onClick={()=>setGalleryImages(prev=>prev.filter((_,j)=>j!==i))} style={{ position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'1.5px solid rgba(255,255,255,0.75)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
                                <i className="ti ti-x" style={{ fontSize:9, color:'#fff' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, padding:'8px 12px', border:`1.5px dashed ${C.borderMed}`, borderRadius:7, cursor:'pointer', background:C.inputBg, transition:'border-color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.primary} onMouseLeave={e=>e.currentTarget.style.borderColor=C.borderMed}>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display:'none' }} onChange={e=>{ const files=Array.from(e.target.files); setGalleryImages(prev=>[...prev,...files.map(f=>({ file:f, url:URL.createObjectURL(f) }))]); e.target.value=''; }} />
                      <i className="ti ti-camera-plus" style={{ fontSize:15, color:C.textTert }} />
                      <span style={{ fontSize:12, color:C.textSec, fontFamily:F.body }}>Add gallery images</span>
                    </label>
                  </div>
                  </div>
                </div>
              )}
              {subTab==='Amenities'    && <AmenitiesTab selectedAmenities={selectedAmenities} setSelectedAmenities={setSelectedAmenities} propertyAmenities={propertyAmenities} />}
              {subTab==='Ownership'    && <OwnershipTab existingOwners={existingOwners} setExistingOwners={setExistingOwners} newOwners={newOwners} setNewOwners={setNewOwners} />}
              {subTab==='Bank Account' && <BankAccountTab accounts={bankAccounts} setAccounts={setBankAccounts} reserveExtras={bankReserveExtras} setReserveExtras={setBankReserveExtras} activeId={bankActiveId} setActiveId={setBankActiveId} apiRecords={bankApiRecords} />}
            </div>
            <div style={{ position:'sticky', bottom:0, background:C.cardBg, borderTop:`1px solid ${C.border}`, padding:`13px ${PAGE_PX}px`, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:12, zIndex:10, boxShadow:'0 -2px 8px rgba(0,0,0,0.05)', marginTop:'auto' }}>
              {subTab==='Bank Account' && <div style={{ marginRight:'auto', display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.textSec }}><i className="ti ti-lock" style={{ fontSize:13 }} /> Secure Transaction Encryption</div>}
              <button onClick={()=>navigate(`/pm-portal/properties/${id}`)} style={{ padding:'9px 24px', fontSize:13, fontWeight:600, background:'transparent', border:`1.5px solid ${C.borderMed}`, borderRadius:7, color:C.textSec, cursor:'pointer', fontFamily:F.body }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'9px 28px', fontSize:13, fontWeight:700, background:saving?C.borderMed:C.primary, border:'none', borderRadius:7, color:'#fff', cursor:saving?'not-allowed':'pointer', fontFamily:F.body, display:'flex', alignItems:'center', gap:8 }}>
                {saving && <i className="ti ti-loader-2" style={{ fontSize:14, animation:'spin 1s linear infinite' }} />}
                {saving?'Saving...':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
