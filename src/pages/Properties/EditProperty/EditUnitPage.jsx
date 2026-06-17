/**
 * EditUnitPage.jsx — Session 28 (revised: all 3 fixes applied)
 * Fix (a): ownership fields mapped from API (ownership_pct, maintenance_threshold, is_lease_signatory, is_maintenance, is_info_only)
 * Fix (b): selected amenity tile border changed to subtle 1px #BFDBFE
 * Fix (c): bank account tab shows "Currently saved" block with mock data + replace toggle
 * Route: /pm-portal/properties/:id/units/:unitId/edit
 * Place at: src/pages/Properties/EditProperty/EditUnitPage.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
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
  primary:'#002D5B', primaryBlue:'#0659b2', primaryLight:'#EFF6FF',
  pageBg:'#F1F5F9', cardBg:'#FFFFFF', border:'#E2E8F0', borderMed:'#CBD5E1',
  inputBg:'#F8F9FA', inputBorder:'#E8ECF0', inputFocus:'#002D5B',
  textPrimary:'#0F172A', textSec:'#64748B', textTert:'#94A3B8', labelColor:'#64748B',
  danger:'#E53E3E', success:'#16A34A', successLight:'#F0FDF4',
  amber:'#D97706', amberLight:'#FFFBEB', amberBorder:'#FDE68A',
  // Fix (b)
  amenitySelectedBorder:'#BFDBFE', amenitySelectedBg:'#EFF6FF',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };
const PAGE_PX = 24;

const UNIT_TYPE_OPTIONS = [{ value:'',label:'Select unit type…' },{ value:'studio',label:'Studio' },{ value:'1br',label:'1 Bedroom' },{ value:'2br',label:'2 Bedroom' },{ value:'3br',label:'3 Bedroom' },{ value:'4br_plus',label:'4 Bedroom+' },{ value:'penthouse',label:'Penthouse' },{ value:'student_room',label:'Student Room' },{ value:'serviced',label:'Serviced Unit' },{ value:'commercial',label:'Commercial Unit' }];
const OWNERSHIP_TYPE_OPTIONS = [{ value:'',label:'Select ownership…' },{ value:'self_owned',label:'Self-Owned' },{ value:'co_owned',label:'Co-Owned' },{ value:'corporate',label:'Corporate / LLC' },{ value:'leasehold',label:'Leasehold' }];
const LEASE_TYPE_OPTIONS     = [{ value:'',label:'Select lease type…' },{ value:'fixed',label:'Fixed-Term' },{ value:'month',label:'Month-to-Month' },{ value:'short',label:'Short-Term' },{ value:'student',label:'Student Lease' }];
const MANAGEMENT_MODEL_OPTIONS = [{ value:'',label:'Select model…' },{ value:'full',label:'Full Management' },{ value:'rent_only',label:'Rent Collection Only' },{ value:'owner',label:'Owner Managed' }];
const OWNERSHIP_ROLE_OPTIONS = [{ value:'individual_owner',label:'Individual Owner' },{ value:'co_owner',label:'Co-Owner' },{ value:'corporate',label:'Corporate / LLC' },{ value:'trust',label:'Trust' }];
const OWNERSHIP_ROLE_API_TO_LOCAL = { INDIVIDUAL_OWNER:'individual_owner', CO_OWNER:'co_owner', PRIMARY_OWNER:'individual_owner', CORPORATE:'corporate', TRUST:'trust' };

const UNIT_SERVICES_LIST = [
  { id:'tenant_onboarding',label:'Tenant Onboarding' },{ id:'rent_collection',label:'Rent Collection' },
  { id:'lease_management',label:'Lease Management' },{ id:'maintenance',label:'Maintenance' },
  { id:'utility_billing',label:'Utility Billing' },{ id:'inspection',label:'Inspection' },
];

const UNIT_ACCOUNT_CATEGORIES = [
  { id:'owner_settlement', label:'Owner Settlement Account', sub:'Rent deposits & owner disbursements', icon:'ti-home-dollar', required:true, description:'Primary account where collected rent is deposited and disbursed to the property owner.' },
  { id:'unit_reserve',     label:'Unit Reserve Account',     sub:'Unit-level capital reserve (optional)', icon:'ti-safe', required:false, description:'Optional dedicated reserve for unit-specific capital expenditures and maintenance.' },
];
const MODULE_TO_CATEGORY_ID = { OWNER_SETTLEMENT:'owner_settlement', UNIT_RESERVE:'unit_reserve' };

const MOCK_EXISTING_ACCOUNTS = [
  { value:'acc_001',label:'Chase Main — ••••8829',bank:'Chase Manhattan',nickname:'Main Op - 5th Ave',number:'••••••••••8829',routing:'021000021',type:'Checking',owner:'Tate Real Estate Holdings LLC' },
  { value:'acc_002',label:'Wells Fargo Reserve — ••••4412',bank:'Wells Fargo',nickname:'Reserve Fund A',number:'••••••••••4412',routing:'121000248',type:'Savings',owner:'Tate Real Estate Holdings LLC' },
  { value:'acc_003',label:'BofA Operations — ••••7731',bank:'Bank of America',nickname:'BofA Ops Account',number:'••••••••••7731',routing:'026009593',type:'Checking',owner:'Metro Holdings Inc.' },
];
const ACCOUNT_TYPE_OPTIONS = [{ value:'',label:'Select type…' },{ value:'checking',label:'Checking' },{ value:'savings',label:'Savings' }];

function emptyUnitAccountState() { return { mode:'existing', existingId:'', saved:false, skipped:false, replacing:false, bankName:'', nickname:'', accountNumber:'', routing:'', accountType:'', owner:'', voidedCheck:null, voidedCheckName:'' }; }
function emptyUnitReserveExtras() { return { minThreshold:'', topUp:'manual', topUpMode:'existing', topUpExistingId:'', topUpBankName:'', topUpNickname:'', topUpAccountNumber:'', topUpRouting:'', topUpAccountType:'', topUpOwner:'', topUpVoidedCheck:null, topUpVoidedCheckName:'' }; }

const UNIT_SUBTABS = ['Unit Info','Amenities','Ownership','Bank Account'];
const PAGE_META = {
  'Unit Info':    { title:'Unit / Home Information',  sub:'Edit unit-level details including type, size, rent and configuration.' },
  'Amenities':    { title:'Unit Amenities',            sub:'Update in-unit amenities specific to this unit.' },
  'Ownership':    { title:'Unit Ownership',            sub:'Manage unit ownership. Changes will re-send invites and notify active tenants.' },
  'Bank Account': { title:'Unit Bank Accounts',        sub:'Update bank accounts configured for this unit.' },
};

// ─── Shared field components ───────────────────────────────────────────────────
function ULabel({ children, required }) { return <div style={{ fontSize:10.5, fontWeight:700, color:C.labelColor, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5, fontFamily:F.body }}>{children}{required&&<span style={{ color:C.danger, marginLeft:2 }}>*</span>}</div>; }
function ErrMsg({ msg }) { return msg?<div style={{ fontSize:11,color:C.danger,marginTop:3,fontFamily:F.body }}>{msg}</div>:null; }
function UInput({ value, onChange, placeholder, prefix, suffix, type='text', disabled=false, error=false }) {
  const [f,sf] = useState(false);
  return <div style={{ display:'flex',alignItems:'center',height:38,border:`1px solid ${error?C.danger:f?C.inputFocus:C.inputBorder}`,borderRadius:6,background:disabled?'#f1f5f9':C.inputBg,boxShadow:f&&!disabled?`0 0 0 2px ${error?'#fde8e8':'#dbeafe'}`:'none',overflow:'hidden',transition:'all 0.15s',opacity:disabled?0.65:1 }}>{prefix&&<span style={{ padding:'0 10px',fontSize:13,color:C.textSec,borderRight:`1px solid ${C.inputBorder}`,background:'#f1f5f9',alignSelf:'stretch',display:'flex',alignItems:'center',fontFamily:F.body,flexShrink:0 }}>{prefix}</span>}<input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={e=>onChange&&onChange(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{ flex:1,padding:'0 11px',fontSize:13,border:'none',outline:'none',background:'transparent',color:C.textPrimary,fontFamily:F.body }} />{suffix&&<span style={{ padding:'0 10px',fontSize:12,color:C.textSec,borderLeft:`1px solid ${C.inputBorder}`,background:'#f1f5f9',alignSelf:'stretch',display:'flex',alignItems:'center',fontFamily:F.body,flexShrink:0 }}>{suffix}</span>}</div>;
}
function UTextarea({ value, onChange, placeholder, rows=3 }) {
  const [f,sf] = useState(false);
  return <textarea value={value} placeholder={placeholder} rows={rows} onChange={e=>onChange&&onChange(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{ width:'100%',padding:'9px 11px',fontSize:13,fontFamily:F.body,color:C.textPrimary,background:C.inputBg,border:`1px solid ${f?C.inputFocus:C.inputBorder}`,borderRadius:6,outline:'none',resize:'vertical',lineHeight:1.6,boxSizing:'border-box',boxShadow:f?'0 0 0 2px #dbeafe':'none',transition:'all 0.15s',minHeight:80 }} />;
}
function SectionHead({ icon, title, color='#1D4ED8', bg='#DBEAFE' }) { return <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}><div style={{ width:28,height:28,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><i className={`ti ${icon}`} style={{ fontSize:13,color }} /></div><span style={{ fontSize:14,fontWeight:700,color:C.textPrimary,fontFamily:F.headline }}>{title}</span></div>; }
function Toggle({ value, onChange }) { return <div onClick={()=>onChange(!value)} style={{ width:40,height:22,borderRadius:11,cursor:'pointer',flexShrink:0,background:value?C.primary:C.borderMed,position:'relative',transition:'background 0.2s' }}><div style={{ width:16,height:16,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:value?21:3,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} /></div>; }
function Skeleton({ h=38, w='100%', radius=6 }) { return <div style={{ height:h,width:w,borderRadius:radius,background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite',flexShrink:0 }} />; }

// ─── FIX (b): Unit Amenities — subtle selected border ─────────────────────────
function UnitAmenityTile({ amenity, selected, onToggle }) {
  const [hover,setHover] = useState(false);
  return (
    <div role="checkbox" aria-checked={selected} onClick={()=>onToggle(amenity.id)}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ border:selected?`1px solid ${C.amenitySelectedBorder}`:`1px solid ${hover?C.borderMed:C.inputBorder}`, borderRadius:8, padding:'16px 10px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', background:selected?C.amenitySelectedBg:hover?'#f8faff':C.cardBg, transition:'all 0.15s', position:'relative', userSelect:'none' }}>
      <div style={{ position:'absolute',top:7,right:7,width:16,height:16,borderRadius:4,border:`1.5px solid ${selected?C.primary:C.borderMed}`,background:selected?C.primary:C.cardBg,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s' }}>{selected&&<i className="ti ti-check" style={{ fontSize:10,color:'#fff',lineHeight:1 }} />}</div>
      <i className={`ti ${amenity.icon}`} style={{ fontSize:22,color:selected?C.primary:C.textPrimary,transition:'color 0.15s' }} />
      <div style={{ fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:selected?C.primary:C.textSec,textAlign:'center',lineHeight:1.3,fontFamily:F.body }}>{amenity.label}</div>
    </div>
  );
}

function UnitAmenitiesTab({ selectedAmenities, setSelectedAmenities, unitAmenities }) {
  const [searchQuery,setSearchQuery] = useState('');
  const filtered    = searchQuery.trim() ? unitAmenities.filter(a=>a.label.toLowerCase().includes(searchQuery.toLowerCase())) : unitAmenities;
  const selectedList  = unitAmenities.filter(a=>selectedAmenities.has(a.id));
  const selectedCount = selectedList.length;
  function toggleAmenity(id) { setSelectedAmenities(prev=>{ const next=new Set(prev); next.has(id)?next.delete(id):next.add(id); return next; }); }
  return (
    <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
      <div style={{ flex:1, minWidth:0, background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontFamily:F.body }}><span style={{ fontSize:15,fontWeight:700,color:C.textPrimary }}>Unit Amenities </span><span style={{ fontSize:13,color:C.textSec }}>(Select all that apply)</span></div>
          <div style={{ display:'flex',alignItems:'center',gap:6,background:C.inputBg,border:`1px solid ${C.inputBorder}`,borderRadius:6,padding:'0 11px',height:36,width:220 }}>
            <i className="ti ti-search" style={{ fontSize:14,color:C.textTert,flexShrink:0 }} />
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search amenities..." style={{ border:'none',outline:'none',background:'transparent',fontSize:13,color:C.textPrimary,fontFamily:F.body,width:'100%' }} />
            {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ border:'none',background:'transparent',cursor:'pointer',padding:0 }}><i className="ti ti-x" style={{ fontSize:12,color:C.textTert }} /></button>}
          </div>
        </div>
        {filtered.length>0 ? <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>{filtered.map(a=><UnitAmenityTile key={a.id} amenity={a} selected={selectedAmenities.has(a.id)} onToggle={toggleAmenity} />)}</div> : <div style={{ textAlign:'center',padding:'40px 20px',color:C.textTert,fontFamily:F.body,fontSize:13 }}><i className="ti ti-search-off" style={{ fontSize:30,display:'block',marginBottom:8 }} />No amenities match "{searchQuery}"</div>}
      </div>
      <div style={{ width:300, flexShrink:0 }}>
        <div style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ background:C.primary,padding:'13px 16px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,color:'#fff',fontSize:13,fontWeight:700,fontFamily:F.body }}><i className="ti ti-circle-check" style={{ fontSize:16 }} /> Selected Amenities</div>
            <span style={{ background:'rgba(255,255,255,0.18)',color:'#fff',fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:10,fontFamily:F.body }}>{selectedCount} {selectedCount===1?'Item':'Items'}</span>
          </div>
          <div style={{ padding:14 }}>
            {selectedCount>0 ? <div style={{ display:'flex',flexDirection:'column' }}>{selectedList.map((a,idx)=><div key={a.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 4px',borderBottom:idx<selectedList.length-1?`1px solid ${C.border}`:'none' }}><div style={{ display:'flex',alignItems:'center',gap:8 }}><i className={`ti ${a.icon}`} style={{ fontSize:13,color:C.textSec }} /><span style={{ fontSize:12,color:C.textPrimary,fontFamily:F.body }}>{a.label}</span></div><button onClick={()=>toggleAmenity(a.id)} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}><i className="ti ti-x" style={{ fontSize:12,color:C.textTert }} /></button></div>)}</div> : <div style={{ border:`1.5px dashed ${C.borderMed}`,borderRadius:8,padding:'28px 16px',textAlign:'center' }}><i className="ti ti-sparkles" style={{ fontSize:26,color:C.textTert,display:'block',marginBottom:8 }} /><div style={{ fontSize:12,color:C.textTert,lineHeight:1.6,fontFamily:F.body }}>Select amenities from the left to add them here.</div></div>}
          </div>
        </div>
        <div style={{ marginTop:12,display:'flex',alignItems:'flex-start',gap:7 }}><i className="ti ti-info-circle" style={{ fontSize:13,color:C.textTert,flexShrink:0,marginTop:1 }} /><div style={{ fontSize:11,color:C.textTert,lineHeight:1.5,fontFamily:F.body }}>Unit amenities are in-unit features specific to this unit only. Building-wide amenities are configured in the Property tab.</div></div>
      </div>
    </div>
  );
}

// ─── OWNERSHIP TAB ─────────────────────────────────────────────────────────────
function EquityDonut({ pct }) {
  const r=54,stroke=10,cx=70,cy=70,circ=2*Math.PI*r,dash=(Math.min(pct,100)/100)*circ,color=pct>=100?'#16A34A':pct>0?'#F59E0B':'#E2E8F0';
  return <svg width="140" height="140" style={{ display:'block',margin:'0 auto' }}><circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />{pct>0&&<circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ/4} strokeLinecap="round" style={{ transition:'stroke-dasharray 0.5s ease' }} />}<text x={cx} y={cy-6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0F172A" fontFamily="'Nunito Sans',sans-serif">{pct}%</text><text x={cx} y={cy+14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94A3B8" fontFamily="'Nunito Sans',sans-serif" letterSpacing="0.08em">ALLOCATED</text></svg>;
}
function OwnerRadio({ value, onChange, options, disabled=false }) { return <div style={{ display:'flex',alignItems:'center',gap:18,marginTop:6 }}>{options.map(opt=><div key={opt.value} onClick={()=>!disabled&&onChange(opt.value)} style={{ display:'flex',alignItems:'center',gap:7,cursor:disabled?'default':'pointer',userSelect:'none' }}><div style={{ width:16,height:16,borderRadius:'50%',border:`1.5px solid ${value===opt.value?C.primary:C.borderMed}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{value===opt.value&&<div style={{ width:8,height:8,borderRadius:'50%',background:C.primary }} />}</div><span style={{ fontSize:13,color:value===opt.value?C.primary:C.textSec,fontWeight:value===opt.value?600:400,fontFamily:F.body }}>{opt.label}</span></div>)}</div>; }
function CheckItem({ checked, onChange, label, disabled=false }) { return <div onClick={()=>!disabled&&onChange(!checked)} style={{ display:'flex',alignItems:'center',gap:8,cursor:disabled?'default':'pointer',userSelect:'none',opacity:disabled?0.5:1 }}><div style={{ width:16,height:16,borderRadius:4,border:`1.5px solid ${checked?C.primary:C.borderMed}`,background:checked?C.primary:C.cardBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}>{checked&&<i className="ti ti-check" style={{ fontSize:10,color:'#fff',lineHeight:1 }} />}</div><span style={{ fontSize:13,color:C.textPrimary,fontFamily:F.body }}>{label}</span></div>; }

function ExistingUnitOwnerCard({ owner, onUpdate, onRemove, hasActiveTenant }) {
  const [open,setOpen] = useState(false);
  const [editMode,setEditMode] = useState(false);
  const isPending = (owner.status||'').toUpperCase()==='PENDING';
  const statusCfg = { verified:{ bg:'#F0FDF4',color:'#166534',border:'#BBF7D0',icon:'ti-circle-check',label:'Verified' }, pending:{ bg:'#EFF6FF',color:'#1D4ED8',border:'#BFDBFE',icon:'ti-clock',label:'Invite Pending' }, expired:{ bg:'#FEF2F2',color:'#991B1B',border:'#FECACA',icon:'ti-clock-x',label:'Invite Expired' } }[(owner.status||'pending').toLowerCase()] || { bg:'#EFF6FF',color:'#1D4ED8',border:'#BFDBFE',icon:'ti-clock',label:'Pending' };
  const isPassive = (owner.involvement||'active').toUpperCase()==='PASSIVE';
  const displayName = [owner.first_name,owner.last_name].filter(Boolean).join(' ')||owner.owner_name||owner.email||'Owner';
  return (
    <div style={{ border:`1px solid ${C.border}`,borderRadius:10,marginBottom:8,overflow:'hidden',background:C.cardBg }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 14px' }}>
        <div style={{ width:34,height:34,borderRadius:'50%',background:'#DBEAFE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#1D4ED8',flexShrink:0 }}>{(displayName[0]||'O').toUpperCase()}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:13,fontWeight:600,color:C.textPrimary,fontFamily:F.body }}>{displayName}</div>
          <div style={{ fontSize:11,color:C.textSec,marginTop:1,fontFamily:F.body }}>{owner.ownership_pct?`${parseFloat(parseFloat(owner.ownership_pct).toFixed(2))}% stake`:''}{owner.ownership_role?` · ${(owner.ownership_role||'').replace(/_/g,' ')}`:''}</div>
        </div>
        {isPending && <div style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:20,background:C.amberLight,color:'#92400E',border:`1px solid ${C.amberBorder}`,fontFamily:F.body,whiteSpace:'nowrap' }}><i className="ti ti-lock" style={{ fontSize:11 }} /> Invite Pending</div>}
        {!isPending && <div style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:20,background:statusCfg.bg,color:statusCfg.color,border:`1px solid ${statusCfg.border}`,whiteSpace:'nowrap',fontFamily:F.body }}><i className={`ti ${statusCfg.icon}`} style={{ fontSize:12 }} />{statusCfg.label}</div>}
        <div onClick={()=>setOpen(o=>!o)} style={{ cursor:'pointer',padding:'2px 4px' }}><i className={`ti ${open?'ti-chevron-up':'ti-chevron-down'}`} style={{ fontSize:14,color:C.textTert }} /></div>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`,padding:'16px 14px' }}>
          {isPending && <div style={{ background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:7,padding:'10px 13px',marginBottom:14,display:'flex',alignItems:'flex-start',gap:8 }}><i className="ti ti-alert-triangle" style={{ fontSize:14,color:C.amber,flexShrink:0,marginTop:1 }} /><div style={{ fontSize:12,color:'#92400E',fontFamily:F.body,lineHeight:1.5 }}>Invite pending — % and role locked until accepted or expired.</div></div>}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:14 }}>
            <div>
              <ULabel>Ownership %</ULabel>
              {/* Fix (a): pre-populated from ownership_pct */}
              <div style={{ display:'flex',alignItems:'center',border:`1px solid ${C.inputBorder}`,borderRadius:6,background:C.inputBg,height:38,overflow:'hidden',opacity:isPending||!editMode?0.65:1 }}>
                <input value={owner.ownership_pct||''} onChange={e=>onUpdate({ ownership_pct:e.target.value })} disabled={isPending||!editMode} style={{ flex:1,padding:'0 10px',fontSize:13,border:'none',outline:'none',background:'transparent',color:C.textPrimary,fontFamily:F.body }} />
                <span style={{ padding:'0 10px',fontSize:13,color:C.textSec,borderLeft:`1px solid ${C.inputBorder}`,background:'#f1f5f9',alignSelf:'stretch',display:'flex',alignItems:'center',fontFamily:F.body }}>%</span>
              </div>
            </div>
            <div><ULabel>Ownership Role</ULabel><CustomDropdown options={OWNERSHIP_ROLE_OPTIONS} value={OWNERSHIP_ROLE_API_TO_LOCAL[owner.ownership_role]||owner.ownership_role||'individual_owner'} onChange={v=>onUpdate({ ownership_role:v })} placeholder="Individual Owner" disabled={isPending||!editMode} /></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:14 }}>
            <div><ULabel>Involvement</ULabel><OwnerRadio value={(owner.involvement||'active').toLowerCase()} onChange={v=>editMode&&!isPending&&onUpdate({ involvement:v })} options={[{value:'active',label:'Active'},{value:'passive',label:'Passive'}]} disabled={isPending||!editMode} /></div>
            <div><ULabel>Involvement Type</ULabel><div style={{ display:'flex',flexDirection:'column',gap:7,marginTop:6 }}>
              {/* Fix (a): is_lease_signatory, is_maintenance, is_info_only */}
              <CheckItem checked={owner.is_lease_signatory??false} onChange={v=>editMode&&!isPending&&onUpdate({ is_lease_signatory:v })} label="Lease Signatory"  disabled={isPassive||isPending||!editMode} />
              <CheckItem checked={owner.is_maintenance??true}      onChange={v=>editMode&&!isPending&&onUpdate({ is_maintenance:v })}     label="Maintenance"      disabled={isPassive||isPending||!editMode} />
              <CheckItem checked={owner.is_info_only??false}       onChange={v=>editMode&&!isPending&&onUpdate({ is_info_only:v })}       label="Information Only" disabled={isPassive||isPending||!editMode} />
            </div></div>
          </div>
          <div style={{ marginBottom:16 }}>
            <ULabel>Maintenance Threshold</ULabel>
            {/* Fix (a): pre-populated from maintenance_threshold */}
            <UInput value={owner.maintenance_threshold||''} onChange={v=>onUpdate({ maintenance_threshold:v })} placeholder="5,000" prefix="$" type="number" disabled={isPending||!editMode} />
            <div style={{ fontSize:11,color:C.textTert,marginTop:4,fontFamily:F.body }}>Approval required for expenses exceeding this amount.</div>
          </div>
          {hasActiveTenant && <div style={{ background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:7,padding:'9px 12px',marginBottom:12,display:'flex',alignItems:'flex-start',gap:8 }}><i className="ti ti-users" style={{ fontSize:13,color:'#EA580C',flexShrink:0,marginTop:1 }} /><div style={{ fontSize:11.5,color:'#7C2D12',fontFamily:F.body,lineHeight:1.5 }}>Active tenants exist. Removing this owner triggers a change-of-landlord notification.</div></div>}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:14,borderTop:`1px solid ${C.border}` }}>
            <button onClick={()=>onRemove(owner.id)} disabled={isPending} style={{ display:'flex',alignItems:'center',gap:6,background:'transparent',border:'none',cursor:isPending?'not-allowed':'pointer',fontSize:13,fontWeight:600,color:isPending?C.textTert:C.danger,fontFamily:F.body,padding:0,opacity:isPending?0.5:1 }}><i className="ti ti-trash" style={{ fontSize:14 }} /> Remove Owner</button>
            <div style={{ display:'flex',gap:8 }}>
              {editMode && <button onClick={()=>setEditMode(false)} style={{ height:36,padding:'0 18px',border:`1px solid ${C.borderMed}`,borderRadius:7,background:C.cardBg,fontSize:13,fontWeight:600,color:C.textSec,cursor:'pointer',fontFamily:F.body }}>Cancel</button>}
              <button onClick={()=>setEditMode(e=>!e)} disabled={isPending} style={{ height:36,padding:'0 18px',background:isPending?C.borderMed:C.primary,border:'none',borderRadius:7,fontSize:13,fontWeight:700,color:'#fff',cursor:isPending?'not-allowed':'pointer',fontFamily:F.body }}>{editMode?'Done':'Edit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewUnitOwnerForm({ onAdd, onCancel }) {
  const [form,setForm] = useState({ search:'',firstName:'',lastName:'',email:'',phone:'',ownershipRole:'',ownershipPct:'',involvement:'active',involvementType:{ leaseSig:false,maintenance:true,infoOnly:false },maintenanceThreshold:'500' });
  const upd = patch => setForm(f=>({...f,...patch}));
  const isPassive = form.involvement==='passive';
  return (
    <div style={{ border:`1px solid ${C.border}`,borderRadius:10,padding:'18px 20px',background:C.cardBg,marginTop:10 }}>
      <div style={{ fontSize:15,fontWeight:700,color:C.textPrimary,fontFamily:F.headline,marginBottom:16 }}>New Stakeholder</div>
      <div style={{ display:'flex',alignItems:'center',gap:8,height:38,border:`1px solid ${C.inputBorder}`,borderRadius:6,background:C.inputBg,padding:'0 11px',marginBottom:14 }}><i className="ti ti-search" style={{ fontSize:15,color:C.textTert,flexShrink:0 }} /><input value={form.search} onChange={e=>upd({ search:e.target.value })} placeholder="Search by name, email or phone" style={{ border:'none',outline:'none',background:'transparent',fontSize:13,color:C.textPrimary,fontFamily:F.body,width:'100%' }} /></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12 }}><div><ULabel>First Name</ULabel><UInput value={form.firstName} onChange={v=>upd({ firstName:v })} /></div><div><ULabel>Last Name</ULabel><UInput value={form.lastName} onChange={v=>upd({ lastName:v })} /></div></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12 }}><div><ULabel required>Email</ULabel><UInput value={form.email} onChange={v=>upd({ email:v })} /></div><div><ULabel>Phone</ULabel><UInput value={form.phone} onChange={v=>upd({ phone:v })} /></div></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:14 }}><div><ULabel>Ownership Role</ULabel><CustomDropdown options={OWNERSHIP_ROLE_OPTIONS} value={form.ownershipRole} onChange={v=>upd({ ownershipRole:v })} placeholder="Select Role" /></div><div><ULabel>Ownership %</ULabel><UInput value={form.ownershipPct} onChange={v=>upd({ ownershipPct:v })} placeholder="0.00" type="number" /></div></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:14 }}>
        <div><ULabel>Involvement</ULabel><OwnerRadio value={form.involvement} onChange={v=>{ if(v==='passive') upd({ involvement:v,involvementType:{ leaseSig:false,maintenance:false,infoOnly:true } }); else upd({ involvement:v,involvementType:{ leaseSig:false,maintenance:true,infoOnly:false } }); }} options={[{value:'active',label:'Active'},{value:'passive',label:'Passive'}]} /></div>
        <div><ULabel>Involvement Type</ULabel><div style={{ display:'flex',flexDirection:'column',gap:7,marginTop:6 }}><CheckItem checked={form.involvementType.leaseSig} onChange={v=>upd({ involvementType:{...form.involvementType,leaseSig:v} })} label="Lease Signatory" disabled={isPassive} /><CheckItem checked={form.involvementType.maintenance} onChange={v=>upd({ involvementType:{...form.involvementType,maintenance:v} })} label="Maintenance" disabled={isPassive} /><CheckItem checked={form.involvementType.infoOnly} onChange={v=>upd({ involvementType:{...form.involvementType,infoOnly:v} })} label="Information Only" disabled={isPassive} /></div></div>
      </div>
      <div style={{ marginBottom:20 }}><ULabel>Maintenance Threshold</ULabel><UInput value={form.maintenanceThreshold} onChange={v=>upd({ maintenanceThreshold:v })} placeholder="500" type="number" prefix="$" /></div>
      <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}><button onClick={onCancel} style={{ height:38,padding:'0 20px',border:`1px solid ${C.borderMed}`,borderRadius:7,background:C.cardBg,fontSize:13,fontWeight:600,color:C.textSec,cursor:'pointer',fontFamily:F.body }}>Cancel</button><button onClick={()=>{ if(!form.email) return; onAdd(form); }} style={{ height:38,padding:'0 20px',background:C.primary,border:'none',borderRadius:7,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:F.body }}>Add Owner</button></div>
    </div>
  );
}

function UnitOwnershipTab({ existingOwners, setExistingOwners, newOwners, setNewOwners, hasActiveTenant }) {
  const [showNewForm,setShowNewForm] = useState(false);
  const existingTotal = existingOwners.reduce((s,o)=>s+(parseFloat(o.ownership_pct)||0),0);
  const newTotal      = newOwners.reduce((s,o)=>s+(parseFloat(o.ownershipPct)||0),0);
  const totalPct = existingTotal + newTotal;
  const pctOk = Math.round(totalPct)===100;
  return (
    <div style={{ display:'flex',gap:16,alignItems:'flex-start' }}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}><div style={{ display:'flex',alignItems:'center',gap:8 }}><span style={{ fontSize:16,color:'#D97706' }}>🔑</span><span style={{ fontSize:15,fontWeight:700,color:C.textPrimary,fontFamily:F.headline }}>Unit Ownership</span></div>{!showNewForm&&<button onClick={()=>setShowNewForm(true)} style={{ background:'transparent',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:C.primary,fontFamily:F.body,padding:0 }}>+ Add Stakeholder</button>}</div>
          <div style={{ fontSize:12,color:C.textSec,marginBottom:18,fontFamily:F.body }}>Changes to verified owners will re-send invites and notify active tenants.</div>
          {existingOwners.length===0&&newOwners.length===0&&!showNewForm && <div style={{ border:`1.5px dashed ${C.borderMed}`,borderRadius:10,padding:'30px 20px',textAlign:'center',color:C.textTert,fontFamily:F.body,fontSize:13 }}>No ownership records found.</div>}
          {existingOwners.map(o=><ExistingUnitOwnerCard key={o.id} owner={o} onUpdate={patch=>setExistingOwners(prev=>prev.map(x=>x.id===o.id?{...x,...patch}:x))} onRemove={oid=>setExistingOwners(prev=>prev.filter(x=>x.id!==oid))} hasActiveTenant={hasActiveTenant} />)}
          {newOwners.map((o,idx)=>(
            <div key={idx} style={{ border:'1px solid #BBF7D0',borderRadius:10,padding:'11px 14px',marginBottom:8,background:'#F0FDF4',display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:34,height:34,borderRadius:'50%',background:'#DCFCE7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#166634',flexShrink:0 }}>{(o.firstName?.[0]||'N').toUpperCase()}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600,color:C.textPrimary,fontFamily:F.body }}>{[o.firstName,o.lastName].filter(Boolean).join(' ')||o.email}</div><div style={{ fontSize:11,color:C.textSec,fontFamily:F.body }}>{o.ownershipPct?`${o.ownershipPct}%`:''} · New — invite pending save</div></div>
              <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:'#DCFCE7',color:'#166534',fontFamily:F.body }}>New</span>
              <button onClick={()=>setNewOwners(prev=>prev.filter((_,i)=>i!==idx))} style={{ background:'none',border:'none',cursor:'pointer',padding:4 }}><i className="ti ti-x" style={{ fontSize:14,color:C.textTert }} /></button>
            </div>
          ))}
          {showNewForm && <NewUnitOwnerForm onAdd={o=>{ setNewOwners(prev=>[...prev,o]); setShowNewForm(false); }} onCancel={()=>setShowNewForm(false)} />}
        </div>
      </div>
      <div style={{ width:260,flexShrink:0,display:'flex',flexDirection:'column',gap:12 }}>
        <div style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,padding:18 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}><i className="ti ti-chart-pie" style={{ fontSize:16,color:C.textPrimary }} /><span style={{ fontSize:14,fontWeight:700,color:C.textPrimary,fontFamily:F.headline }}>Equity Summary</span></div>
          <div style={{ marginBottom:16 }}><EquityDonut pct={Math.round(Math.min(totalPct,100))} /></div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <div style={{ display:'flex',justifyContent:'space-between' }}><span style={{ fontSize:13,color:C.textSec,fontFamily:F.body }}>Requirement</span><span style={{ fontSize:13,fontWeight:700,color:C.textPrimary,fontFamily:F.body }}>100%</span></div>
            <div style={{ display:'flex',justifyContent:'space-between' }}><span style={{ fontSize:13,color:C.textSec,fontFamily:F.body }}>Remaining</span><span style={{ fontSize:13,fontWeight:700,color:pctOk?C.success:'#F59E0B',fontFamily:F.body }}>{Math.max(0,100-Math.round(totalPct))}%</span></div>
          </div>
          {!pctOk && <div style={{ marginTop:12,background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:6,padding:'8px 10px',fontSize:11.5,color:'#92400E',fontFamily:F.body,textAlign:'center',lineHeight:1.5 }}>Total must equal 100% to save changes.</div>}
          {pctOk  && <div style={{ marginTop:12,background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:6,padding:'8px 10px',fontSize:11.5,color:'#166534',fontFamily:F.body,textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}><i className="ti ti-circle-check" style={{ fontSize:13 }} /> Fully allocated</div>}
        </div>
        <div style={{ background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:10,padding:14 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}><i className="ti ti-alert-triangle" style={{ fontSize:14,color:C.amber }} /><span style={{ fontSize:13,fontWeight:700,color:'#92400E',fontFamily:F.body }}>Edit Mode Notes</span></div>
          <div style={{ fontSize:11.5,color:'#92400E',lineHeight:1.6,fontFamily:F.body }}><div style={{ marginBottom:5 }}>• Editing a verified owner's % re-sends their invite → Pending.</div><div>• Removing an owner notifies active tenants of the landlord change.</div></div>
        </div>
      </div>
    </div>
  );
}

// ─── FIX (c): Unit Bank Account — shows existing saved data + replace toggle ────
function UnitVoidedCheckUpload({ fileName, onFile, onRemove }) {
  const ref = useRef();
  return <div>{fileName ? <div style={{ display:'flex',alignItems:'center',gap:10,background:C.successLight,border:'1px solid #bbf7d0',borderRadius:6,padding:'8px 12px' }}><i className="ti ti-file-check" style={{ fontSize:16,color:C.success,flexShrink:0 }} /><span style={{ flex:1,fontSize:12,color:'#166534',fontFamily:F.body,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{fileName}</span><button onClick={onRemove} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}><i className="ti ti-x" style={{ fontSize:13,color:C.textSec }} /></button></div> : <div onClick={()=>ref.current.click()} style={{ display:'flex',alignItems:'center',gap:10,border:`1.5px dashed ${C.borderMed}`,borderRadius:6,padding:'9px 14px',cursor:'pointer',background:C.inputBg,transition:'border-color 0.15s',width:'100%',boxSizing:'border-box' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.primary} onMouseLeave={e=>e.currentTarget.style.borderColor=C.borderMed}><input ref={ref} type="file" accept="image/jpeg,image/png,application/pdf" style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]){ onFile(e.target.files[0]); e.target.value=''; } }} /><i className="ti ti-upload" style={{ fontSize:15,color:C.textTert,flexShrink:0 }} /><div><div style={{ fontSize:12,fontWeight:700,color:C.primaryBlue,fontFamily:F.body }}>Upload Voided Check</div><div style={{ fontSize:11,color:C.textTert,fontFamily:F.body }}>JPG, PNG or PDF — Max 5MB</div></div></div>}</div>;
}

function UnitAccountCard({ categoryId, accountData, onChange, reserveExtras, onReserveExtrasChange, onSaved, apiRecord }) {
  const cat       = UNIT_ACCOUNT_CATEGORIES.find(c=>c.id===categoryId);
  const isReserve = categoryId==='unit_reserve';

  // Fix (c): resolve saved account — real data when available, mock otherwise
  const resolvedAccount = (() => {
    if (apiRecord?.bank_name) return { bank:apiRecord.bank_name, number:apiRecord.account_number||'••••', routing:apiRecord.routing_number||'••••', type:'—', nickname:'—', owner:'—' };
    return MOCK_EXISTING_ACCOUNTS[1]; // default mock for unit accounts
  })();

  const isAlreadySaved = accountData.saved && !accountData.replacing;
  const isSkipped      = accountData.skipped;

  const canSave = accountData.mode==='existing'
    ? Boolean((accountData.existingId||'').trim())
    : Boolean((accountData.bankName||'').trim()&&(accountData.accountNumber||'').trim()&&(accountData.routing||'').trim());

  function handleSave()   { if(!canSave) return; const saved = { ...accountData, saved:true, replacing:false }; if(onSaved) onSaved(saved); }
  function handleSkip()   { if(onSaved) onSaved({ ...accountData, saved:false, skipped:true }); }
  function handleKeep()   { onChange({ ...accountData, replacing:false, saved:true }); }

  return (
    <div style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:'0 1px 4px rgba(0,0,0,0.05)',overflow:'hidden' }}>
      <div style={{ padding:'18px 20px 16px',borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex',alignItems:'flex-start',gap:12 }}>
          <div style={{ width:36,height:36,borderRadius:8,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}><i className={`ti ${cat.icon}`} style={{ fontSize:17,color:C.primaryBlue }} /></div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}><div style={{ fontSize:16,fontWeight:700,color:C.textPrimary,fontFamily:F.headline }}>{cat.label}</div>{!cat.required&&<span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',padding:'2px 7px',borderRadius:4,background:'#F1F5F9',color:C.textTert,fontFamily:F.body }}>Optional</span>}</div>
            <div style={{ fontSize:12,color:C.textSec,fontFamily:F.body,lineHeight:1.55,maxWidth:520 }}>{cat.description}</div>
          </div>
          {isAlreadySaved && <div style={{ display:'flex',alignItems:'center',gap:5,background:C.successLight,border:'1px solid #bbf7d0',borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,color:C.success,fontFamily:F.body,whiteSpace:'nowrap',flexShrink:0 }}><i className="ti ti-circle-check" style={{ fontSize:12 }} /> Saved</div>}
          {isSkipped      && <div style={{ display:'flex',alignItems:'center',gap:5,background:'#F8FAFC',border:`1px solid ${C.borderMed}`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,color:C.textTert,fontFamily:F.body,whiteSpace:'nowrap',flexShrink:0 }}><i className="ti ti-minus" style={{ fontSize:12 }} /> Skipped</div>}
        </div>
      </div>

      {isSkipped && <div style={{ padding:20,display:'flex',flexDirection:'column',alignItems:'center',gap:10 }}><i className="ti ti-circle-dashed" style={{ fontSize:32,color:C.borderMed }} /><div style={{ fontSize:13,color:C.textSec,fontFamily:F.body }}>This account has been skipped.</div><button onClick={()=>onChange({ ...accountData,skipped:false })} style={{ height:34,padding:'0 16px',border:`1px solid ${C.borderMed}`,borderRadius:6,background:C.cardBg,fontSize:12,fontWeight:600,color:C.textSec,cursor:'pointer',fontFamily:F.body }}>Set up this account</button></div>}

      {/* Fix (c): Currently saved block */}
      {isAlreadySaved && (
        <div style={{ padding:'16px 20px 0' }}>
          <div style={{ fontSize:10.5,fontWeight:700,color:C.textTert,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10,fontFamily:F.body }}>Currently saved</div>
          <div style={{ background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',marginBottom:16 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
              <div style={{ width:30,height:30,borderRadius:6,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><i className={`ti ${cat.icon}`} style={{ fontSize:14,color:C.primaryBlue }} /></div>
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:C.textPrimary,fontFamily:F.body }}>{resolvedAccount.bank} <span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',padding:'1px 6px',borderRadius:4,background:'#EFF6FF',color:C.primaryBlue,marginLeft:4 }}>{resolvedAccount.type}</span></div>
                <div style={{ fontSize:11,color:C.textSec,fontFamily:F.body,marginTop:1 }}>{resolvedAccount.nickname} · {resolvedAccount.number}</div>
              </div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 14px' }}>
              {[{ label:'Account number',value:resolvedAccount.number },{ label:'Routing / IFSC',value:resolvedAccount.routing }].map(({ label,value })=>(
                <div key={label}><div style={{ fontSize:10,color:C.textTert,fontFamily:F.body,marginBottom:3 }}>{label}</div><div style={{ fontSize:12,color:C.textSec,background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:5,padding:'5px 9px',fontFamily:F.body }}>{value}</div></div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:16,borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:12,color:C.textSec,fontFamily:F.body }}>Want to change this account?</span>
            <div style={{ display:'flex',border:`1px solid ${C.borderMed}`,borderRadius:7,overflow:'hidden' }}>
              {[['existing','Select existing'],['new','Add new account']].map(([val,label])=>(
                <button key={val} onClick={()=>onChange({ ...accountData, replacing:true, mode:val, saved:false })}
                  style={{ padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',border:'none',fontFamily:F.body,background:accountData.mode===val&&accountData.replacing?C.primary:'transparent',color:accountData.mode===val&&accountData.replacing?'#fff':C.textSec,transition:'all 0.15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=C.primaryLight; e.currentTarget.style.color=C.primary; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=C.textSec; }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Replace form */}
      {!isSkipped && (accountData.replacing || !isAlreadySaved) && (
        <div style={{ padding:'16px 20px 0' }}>
          {accountData.replacing && <div style={{ background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:7,padding:'9px 13px',marginBottom:16,display:'flex',alignItems:'center',gap:8 }}><i className="ti ti-arrows-exchange" style={{ fontSize:14,color:C.primaryBlue }} /><span style={{ fontSize:12,color:'#1D4ED8',fontFamily:F.body }}>Replacing the current account — save to confirm, or keep current to cancel.</span></div>}
          {!isAlreadySaved && <div style={{ display:'flex',border:`1px solid ${C.borderMed}`,borderRadius:7,overflow:'hidden',width:'fit-content',marginBottom:20 }}>{[['existing','Select Existing'],['new','Add New Account']].map(([val,label])=><button key={val} onClick={()=>onChange({ ...accountData,mode:val,saved:false })} style={{ padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer',border:'none',fontFamily:F.body,background:accountData.mode===val?C.primary:C.cardBg,color:accountData.mode===val?'#fff':C.textSec,transition:'all 0.15s' }}>{label}</button>)}</div>}
          {accountData.mode==='existing' && (
            <div>
              <div style={{ marginBottom:16 }}><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Select Account<span style={{ color:C.danger,marginLeft:2 }}>*</span></div><CustomDropdown options={[{value:'',label:'Select an account…'},...MOCK_EXISTING_ACCOUNTS]} value={accountData.existingId} onChange={v=>onChange({ ...accountData,existingId:v })} placeholder="Select an account…" /></div>
              {(() => { const sel=MOCK_EXISTING_ACCOUNTS.find(a=>a.value===accountData.existingId); return sel?<div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px' }}><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Bank Name</div><UInput value={sel.bank} disabled /></div><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Account Nickname</div><UInput value={sel.nickname} disabled /></div><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Account Number</div><UInput value={sel.number} disabled /></div><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Routing / IFSC</div><UInput value={sel.routing} disabled /></div></div>:null; })()}
            </div>
          )}
          {accountData.mode==='new' && (
            <div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12 }}><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Bank Name<span style={{ color:C.danger,marginLeft:2 }}>*</span></div><UInput value={accountData.bankName} onChange={v=>onChange({ ...accountData,bankName:v })} placeholder="e.g. Chase Manhattan" /></div><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Account Nickname<span style={{ color:C.danger,marginLeft:2 }}>*</span></div><UInput value={accountData.nickname} onChange={v=>onChange({ ...accountData,nickname:v })} placeholder="e.g. Unit 101 Settlement" /></div></div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12 }}><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Account Number<span style={{ color:C.danger,marginLeft:2 }}>*</span></div><UInput value={accountData.accountNumber} onChange={v=>onChange({ ...accountData,accountNumber:v })} type="password" placeholder="Enter account number" /></div><div><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Routing / IFSC<span style={{ color:C.danger,marginLeft:2 }}>*</span></div><UInput value={accountData.routing} onChange={v=>onChange({ ...accountData,routing:v })} placeholder="e.g. 021000021" /></div></div>
              <div style={{ width:'100%',marginBottom:4 }}><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Voided Check</div><UnitVoidedCheckUpload fileName={accountData.voidedCheckName} onFile={f=>onChange({ ...accountData,voidedCheck:f,voidedCheckName:f.name })} onRemove={()=>onChange({ ...accountData,voidedCheck:null,voidedCheckName:'' })} /></div>
            </div>
          )}
          {isReserve && (
            <div style={{ marginTop:20,paddingTop:20,borderTop:`1px solid ${C.border}` }}>
              <div style={{ marginBottom:16,maxWidth:260 }}><div style={{ fontSize:10.5,fontWeight:700,color:C.labelColor,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:F.body }}>Minimum Threshold Amount</div><UInput value={reserveExtras.minThreshold} onChange={v=>onReserveExtrasChange({ ...reserveExtras,minThreshold:v })} placeholder="0.00" prefix="$" type="number" /><div style={{ fontSize:11,color:C.textTert,marginTop:4,fontFamily:F.body }}>Auto-refill triggers when balance falls below this amount.</div></div>
            </div>
          )}
          {isReserve && !isAlreadySaved && !accountData.replacing && (
            <div style={{ marginTop:16,background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
              <div style={{ display:'flex',alignItems:'flex-start',gap:8 }}><i className="ti ti-info-circle" style={{ fontSize:14,color:'#D97706',flexShrink:0,marginTop:1 }} /><div style={{ fontSize:12,color:'#92400E',fontFamily:F.body,lineHeight:1.5 }}>This account is optional. You can skip it and manage reserves at the property level instead.</div></div>
              <button onClick={handleSkip} style={{ height:32,padding:'0 14px',border:'1px solid #FDE68A',borderRadius:6,background:'#FEF3C7',fontSize:12,fontWeight:600,color:'#92400E',cursor:'pointer',fontFamily:F.body,whiteSpace:'nowrap',flexShrink:0 }}>Skip this account</button>
            </div>
          )}
        </div>
      )}

      {!isSkipped && (accountData.replacing || !isAlreadySaved) && (
        <div style={{ display:'flex',justifyContent:'flex-end',gap:10,padding:'16px 20px',marginTop:16,borderTop:`1px solid ${C.border}`,background:'#fafbfc' }}>
          {accountData.replacing
            ? <button onClick={handleKeep} style={{ height:36,padding:'0 20px',border:`1px solid ${C.borderMed}`,borderRadius:7,background:C.cardBg,fontSize:13,fontWeight:600,color:C.textSec,cursor:'pointer',fontFamily:F.body }}>Keep current</button>
            : <button onClick={()=>onChange({ ...accountData,saved:false })} style={{ height:36,padding:'0 20px',border:`1px solid ${C.borderMed}`,borderRadius:7,background:C.cardBg,fontSize:13,fontWeight:600,color:C.textSec,cursor:'pointer',fontFamily:F.body }}>Cancel</button>
          }
          <button onClick={handleSave} disabled={!canSave} style={{ height:36,padding:'0 20px',background:canSave?C.primary:C.borderMed,border:'none',borderRadius:7,fontSize:13,fontWeight:700,color:'#fff',cursor:canSave?'pointer':'not-allowed',fontFamily:F.body }}>Save Changes</button>
        </div>
      )}
    </div>
  );
}

function UnitBankAccountTab({ bankAccounts, setBankAccounts, reserveExtras, setReserveExtras, activeId, setActiveId, apiRecords }) {
  const savedCount = UNIT_ACCOUNT_CATEGORIES.filter(c=>bankAccounts[c.id]?.saved||bankAccounts[c.id]?.skipped).length;
  const totalCount = UNIT_ACCOUNT_CATEGORIES.length;
  function updateAccount(id,data) { setBankAccounts(prev=>({ ...prev,[id]:data })); }
  return (
    <div style={{ display:'flex',gap:16,alignItems:'flex-start' }}>
      <div style={{ width:260,flexShrink:0,background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'16px 16px 8px',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:C.textTert,fontFamily:F.body }}>UNIT BANK ACCOUNTS</div>
        {UNIT_ACCOUNT_CATEGORIES.map(cat=>{
          const isActive=activeId===cat.id, acct=bankAccounts[cat.id], isSaved=acct?.saved, isSkipped=acct?.skipped;
          return <div key={cat.id} onClick={()=>setActiveId(cat.id)}
            style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 16px',cursor:'pointer',background:isActive?C.primaryLight:'transparent',borderLeft:`3px solid ${isActive?C.primary:'transparent'}`,transition:'all 0.12s' }}
            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='#f8faff'; }}
            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent'; }}>
            <div style={{ width:10,height:10,borderRadius:'50%',flexShrink:0,background:isSaved?C.success:isSkipped?'#F59E0B':isActive?C.primary:C.borderMed,border:`2px solid ${isSaved?C.success:isSkipped?'#F59E0B':isActive?C.primary:C.borderMed}`,transition:'all 0.15s' }} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}><div style={{ fontSize:13,fontWeight:isActive?700:500,color:isActive?C.primary:C.textPrimary,fontFamily:F.body,lineHeight:1.3 }}>{cat.label}</div>{!cat.required&&<span style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',padding:'1px 5px',borderRadius:3,background:'#F1F5F9',color:C.textTert,fontFamily:F.body }}>OPT</span>}</div>
              <div style={{ fontSize:11,color:C.textTert,fontFamily:F.body,marginTop:1 }}>{cat.sub}</div>
            </div>
            {isSaved   && <i className="ti ti-circle-check" style={{ fontSize:13,color:C.success,flexShrink:0 }} />}
            {isSkipped && <i className="ti ti-minus"        style={{ fontSize:13,color:C.textTert,flexShrink:0 }} />}
          </div>;
        })}
        <div style={{ padding:'12px 16px',borderTop:`1px solid ${C.border}`,background:C.inputBg }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}><span style={{ fontSize:11,color:C.textSec,fontFamily:F.body }}>{savedCount} of {totalCount} configured</span><span style={{ fontSize:11,fontWeight:700,color:savedCount===totalCount?C.success:C.textTert,fontFamily:F.body }}>{Math.round((savedCount/totalCount)*100)}%</span></div>
          <div style={{ height:4,borderRadius:2,background:C.border,overflow:'hidden' }}><div style={{ height:'100%',borderRadius:2,background:savedCount===totalCount?C.success:C.primaryBlue,width:`${(savedCount/totalCount)*100}%`,transition:'width 0.4s ease' }} /></div>
        </div>
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <UnitAccountCard categoryId={activeId} accountData={bankAccounts[activeId]||emptyUnitAccountState()} onChange={data=>updateAccount(activeId,data)}
          onSaved={savedData=>{
            const ids=UNIT_ACCOUNT_CATEGORIES.map(c=>c.id), idx=ids.indexOf(activeId), next=idx<ids.length-1?ids[idx+1]:activeId;
            setBankAccounts(prev=>({ ...prev,[activeId]:savedData }));
            setActiveId(next);
          }}
          reserveExtras={reserveExtras} onReserveExtrasChange={setReserveExtras} apiRecord={apiRecords[activeId]} />
        <div style={{ display:'flex',alignItems:'flex-start',gap:7,marginTop:12 }}><i className="ti ti-lock" style={{ fontSize:13,color:C.textTert,flexShrink:0,marginTop:1 }} /><div style={{ fontSize:11,color:C.textTert,lineHeight:1.5,fontFamily:F.body }}>Account details are encrypted at rest. Banking credentials are never stored in plain text.</div></div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function EditUnitPage() {
  const navigate       = useNavigate();
  const { id, unitId } = useParams();
  const token          = localStorage.getItem('access_token');

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [subTab,   setSubTab]   = useState('Unit Info');
  const [errors,   setErrors]   = useState({});
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Independent PM');
  const [propName, setPropName] = useState('');

  const [unitNumber,      setUnitNumber]      = useState('');
  const [tower,           setTower]           = useState('');
  const [unitType,        setUnitType]        = useState('');
  const [floor,           setFloor]           = useState('');
  const [ownershipType,   setOwnershipType]   = useState('');
  const [leaseType,       setLeaseType]       = useState('');
  const [managementModel, setManagementModel] = useState('');
  const [carpetArea,      setCarpetArea]      = useState('');
  const [totalArea,       setTotalArea]       = useState('');
  const [totalRooms,      setTotalRooms]      = useState('');
  const [totalBaths,      setTotalBaths]      = useState('');
  const [studentHousing,  setStudentHousing]  = useState(false);
  const [rentAmount,      setRentAmount]      = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [description,     setDescription]     = useState('');

  const [unitAmenities,      setUnitAmenities]      = useState([]);
  const [selectedAmenities,  setSelectedAmenities]  = useState(new Set());
  const [originalAmenityIds, setOriginalAmenityIds] = useState(new Set());
  const [amenityRecords,     setAmenityRecords]     = useState([]);

  const [existingOwners,  setExistingOwners]  = useState([]);
  const [newOwners,       setNewOwners]       = useState([]);
  const [hasActiveTenant, setHasActiveTenant] = useState(false);

  const [unitServices,      setUnitServices]      = useState(new Set());
  const [bankAccounts,      setBankAccounts]      = useState(() => Object.fromEntries(UNIT_ACCOUNT_CATEGORIES.map(c=>[c.id,emptyUnitAccountState()])));
  const [bankReserveExtras, setBankReserveExtras] = useState(() => emptyUnitReserveExtras());
  const [bankActiveId,      setBankActiveId]      = useState('owner_settlement');
  const [bankApiRecords,    setBankApiRecords]    = useState({});

  const [originalUnitNumber, setOriginalUnitNumber] = useState('');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch(`${API}/api/auth/me/`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.ok?r.json():null).then(data=>{ if(data){ setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User'); setUserRole({ INDEPENDENT_PM:'Independent PM', ORGANIZATIONAL_PM:'Org PMS Admin' }[data.active_persona]||'Independent PM'); } }).catch(()=>{});
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/amenities/?category=UNIT`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(data=>setUnitAmenities((data||[]).map(a=>({ id:a.id,icon:a.icon,label:a.name })))).catch(()=>{});
  }, [token]);

  useEffect(() => {
    if (!token||!id||!unitId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/properties/${id}/units/${unitId}/`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>{ if(!r.ok) throw new Error('Failed to load unit'); return r.json(); }),
      fetch(`${API}/api/properties/${id}/`,                  { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.ok?r.json():null),
    ])
      .then(([unitData, propData]) => {
        if (propData) setPropName(propData.property_name||propData.name||'');
        setUnitNumber(unitData.unit_number||'');
        setOriginalUnitNumber(unitData.unit_number||'');
        setTower(unitData.tower||'');
        setUnitType(unitData.unit_type||'');
        setFloor(unitData.floor!=null?String(unitData.floor):'');
        setOwnershipType(unitData.ownership_type||'');
        setLeaseType(unitData.lease_type||'');
        setManagementModel(unitData.management_model||'');
        setCarpetArea(unitData.carpet_area!=null?String(unitData.carpet_area):'');
        setTotalArea(unitData.total_area!=null?String(unitData.total_area):'');
        setTotalRooms(unitData.total_rooms!=null?String(unitData.total_rooms):'');
        setTotalBaths(unitData.total_baths!=null?String(unitData.total_baths):'');
        setStudentHousing(unitData.student_housing||false);
        setRentAmount(unitData.rent_amount!=null?String(unitData.rent_amount):'');
        setSecurityDeposit(unitData.security_deposit!=null?String(unitData.security_deposit):'');
        setDescription(unitData.description||'');

        // Fix 1b: pre-populate services from API (data.services is array of service IDs or strings)
        if (Array.isArray(unitData.services) && unitData.services.length>0) {
          setUnitServices(new Set(unitData.services));
        }

        // Fix (b): amenity field is `amenity` (integer)
        if (Array.isArray(unitData.amenities)) {
          const ids = new Set(unitData.amenities.map(a=>a.amenity));
          setSelectedAmenities(ids);
          setOriginalAmenityIds(ids);
          setAmenityRecords(unitData.amenities);
        }

        // Fix (a): use correct field names from updated UnitOwnershipDetailSerializer
        if (Array.isArray(unitData.ownerships)) {
          setExistingOwners(unitData.ownerships.map(o=>({
            ...o,
            ownership_role: OWNERSHIP_ROLE_API_TO_LOCAL[o.ownership_role]||(o.ownership_role||'').toLowerCase(),
            // ownership_pct, maintenance_threshold, is_lease_signatory, is_maintenance, is_info_only now returned directly
          })));
        }
        if (Array.isArray(unitData.tenants)&&unitData.tenants.length>0) setHasActiveTenant(true);

        // Fix (c): bank accounts with real data when available
        if (Array.isArray(unitData.bank_accounts)) {
          const map = {}, rawMap = {};
          unitData.bank_accounts.forEach(a=>{
            const catId = MODULE_TO_CATEGORY_ID[a.module];
            if (!catId) return;
            rawMap[catId] = a;
            map[catId] = { ...emptyUnitAccountState(), saved:!a.is_skipped, skipped:a.is_skipped||false };
          });
          setBankAccounts(prev=>({ ...prev,...map }));
          setBankApiRecords(rawMap);
        }
      })
      .catch(err=>setError(err.message))
      .finally(()=>setLoading(false));
  }, [id, unitId, token]);

  function validate() {
    const e = {};
    if (!unitNumber.trim()) e.unitNumber='Unit number is required';
    if (!unitType)          e.unitType='Select a unit type';
    if (!ownershipType)     e.ownershipType='Select an ownership type';
    setErrors(e);
    return Object.keys(e).length===0;
  }

  async function handleSave() {
    if (!validate()||saving) return;
    setSaving(true);
    try {
      const patchRes = await fetch(`${API}/api/properties/${id}/units/${unitId}/`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ unit_number:unitNumber, tower:tower||'', unit_type:unitType, ownership_type:ownershipType, lease_type:leaseType||'', management_model:managementModel||'', carpet_area:parseFloat(carpetArea)||null, total_area:parseFloat(totalArea)||null, total_rooms:parseInt(totalRooms)||null, floor:parseInt(floor)||null, total_baths:parseInt(totalBaths)||null, student_housing:studentHousing, rent_amount:parseFloat(rentAmount)||null, security_deposit:parseFloat(securityDeposit)||null, description:description||'' }) });
      if (!patchRes.ok) { console.error('PATCH unit failed:', await patchRes.json()); setSaving(false); return; }

      // Sync amenities — Fix (b): use record.amenity for matching
      const toAdd    = [...selectedAmenities].filter(aId=>!originalAmenityIds.has(aId));
      const toRemove = [...originalAmenityIds].filter(aId=>!selectedAmenities.has(aId));
      for (const aId of toAdd)    { await fetch(`${API}/api/properties/${id}/units/${unitId}/amenities/`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ amenity:aId }) }); }
      for (const aId of toRemove) { const rec=amenityRecords.find(a=>a.amenity===aId); if(rec?.id) await fetch(`${API}/api/properties/${id}/units/${unitId}/amenities/${rec.id}/`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); }

      for (const o of existingOwners) {
        await fetch(`${API}/api/properties/${id}/units/${unitId}/ownerships/${o.id}/`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ ownership_role:(o.ownership_role||'individual_owner').toUpperCase(), ownership_pct:parseFloat(o.ownership_pct)||0, involvement:(o.involvement||'active').toUpperCase(), is_lease_signatory:o.is_lease_signatory??false, is_maintenance:o.is_maintenance??true, is_info_only:o.is_info_only??false, maintenance_threshold:parseFloat(o.maintenance_threshold)||0 }) });
      }
      for (const o of newOwners) {
        await fetch(`${API}/api/properties/${id}/units/${unitId}/ownerships/`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ first_name:o.firstName, last_name:o.lastName, email:o.email, phone:o.phone||'', ownership_role:(o.ownershipRole||'individual_owner').toUpperCase(), ownership_pct:parseFloat(o.ownershipPct)||0, involvement:(o.involvement||'active').toUpperCase(), is_lease_signatory:o.involvementType?.leaseSig??false, is_maintenance:o.involvementType?.maintenance??true, is_info_only:o.involvementType?.infoOnly??false, maintenance_threshold:parseFloat(o.maintenanceThreshold)||0, is_corporate:o.ownershipRole==='corporate' }) });
      }
      navigate(`/pm-portal/properties/${id}/units/${unitId}`);
    } catch(err) { console.error('Save unit error:', err); }
    setSaving(false);
  }

  const meta = PAGE_META[subTab]||{ title:subTab, sub:'' };

  if (loading) return (<><style>{`*{box-sizing:border-box;}html,body,#root{height:100%;overflow:hidden;margin:0;padding:0;}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style><div style={{ display:'flex',height:'100vh',background:C.pageBg }}><NavB activeId="all-props" /><div style={{ flex:1,display:'flex',flexDirection:'column' }}><Header userName={userName} userRole={userRole} /><div style={{ flex:1,padding:PAGE_PX,display:'flex',flexDirection:'column',gap:16 }}><Skeleton h={32} w={280} /><div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>{[...Array(6)].map((_,i)=><Skeleton key={i} h={52} />)}</div></div></div></div></>);
  if (error)   return (<><style>{`*{box-sizing:border-box;}html,body,#root{height:100%;overflow:hidden;margin:0;padding:0;}`}</style><div style={{ display:'flex',height:'100vh',background:C.pageBg }}><NavB activeId="all-props" /><div style={{ flex:1,display:'flex',flexDirection:'column' }}><Header userName={userName} userRole={userRole} /><div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12 }}><i className="ti ti-alert-circle" style={{ fontSize:36,color:C.danger }} /><div style={{ fontSize:15,fontWeight:700,color:C.textPrimary,fontFamily:F.headline }}>{error}</div><button onClick={()=>navigate(-1)} style={{ height:38,padding:'0 20px',background:C.primary,border:'none',borderRadius:7,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:F.body }}>Go Back</button></div></div></div></>);

  return (
    <>
      <style>{`*{box-sizing:border-box;}html,body,#root{height:100%;overflow:hidden;margin:0;padding:0;}.eu-scroll::-webkit-scrollbar{width:5px;}.eu-scroll::-webkit-scrollbar-track{background:transparent;}.eu-scroll::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px;}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{ display:'flex',height:'100vh',overflow:'hidden',background:C.pageBg,fontFamily:F.body }}>
        <NavB activeId="all-props" />
        <div style={{ flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden' }}>
          <Header userName={userName} userRole={userRole} />
          <div className="eu-scroll" style={{ flex:1,overflowY:'auto',display:'flex',flexDirection:'column',minHeight:0 }}>
            <div style={{ padding:`${PAGE_PX}px ${PAGE_PX}px 0`,flexShrink:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.textSec,fontFamily:F.body,marginBottom:10 }}>
                <span onClick={()=>navigate('/pm-portal/properties')} style={{ cursor:'pointer',color:C.primaryBlue }}>Properties</span>
                <i className="ti ti-chevron-right" style={{ fontSize:11 }} />
                <span onClick={()=>navigate(`/pm-portal/properties/${id}`)} style={{ cursor:'pointer',color:C.primaryBlue }}>{propName||'Property'}</span>
                <i className="ti ti-chevron-right" style={{ fontSize:11 }} />
                <span onClick={()=>navigate(`/pm-portal/properties/${id}/units/${unitId}`)} style={{ cursor:'pointer',color:C.primaryBlue }}>Unit {originalUnitNumber}</span>
                <i className="ti ti-chevron-right" style={{ fontSize:11 }} />
                <span style={{ color:C.textTert }}>Edit Unit</span>
              </div>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4 }}>
                <div><h1 style={{ margin:'0 0 4px',fontFamily:F.headline,fontSize:'clamp(20px,2vw,26px)',fontWeight:700,color:C.textPrimary }}>Edit Unit</h1><p style={{ margin:'0 0 4px',fontFamily:F.headline,fontSize:13,fontWeight:600,color:C.success }}>{meta.title}</p>{meta.sub&&<p style={{ margin:0,fontFamily:F.body,fontSize:13,color:C.textSec,maxWidth:560 }}>{meta.sub}</p>}</div>
                <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:700,color:'#C2410C',fontFamily:F.body,flexShrink:0 }}><i className="ti ti-pencil" style={{ fontSize:13 }} /> Edit Mode</div>
              </div>
            </div>
            <div style={{ background:C.cardBg,margin:`12px ${PAGE_PX}px 0`,borderBottom:`1px solid ${C.border}`,borderTop:`1px solid ${C.border}`,borderLeft:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,borderRadius:'8px 8px 0 0',display:'flex',flexShrink:0 }}>
              {UNIT_SUBTABS.map(st=>{ const isA=subTab===st; return <button key={st} onClick={()=>setSubTab(st)} style={{ padding:'10px 16px',fontSize:13,fontWeight:isA?700:400,color:isA?C.primary:C.textSec,background:'transparent',border:'none',borderBottom:isA?`2.5px solid ${C.primary}`:'2.5px solid transparent',cursor:'pointer',transition:'all 0.15s',marginBottom:-1,fontFamily:F.body,outline:'none',whiteSpace:'nowrap' }}>{st}</button>; })}
            </div>
            <div style={{ padding:`20px ${PAGE_PX}px 100px` }}>
              {subTab==='Unit Info' && (
                <div style={{ display:'flex',gap:16,alignItems:'flex-start' }}>
                  <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:16 }}>
                    <div style={{ background:C.cardBg,borderRadius:10,border:`1px solid ${C.border}`,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SectionHead icon="ti-door" title="Unit Basics" color="#1D4ED8" bg="#DBEAFE" />
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 16px' }}>
                        <div><ULabel required>Unit Number</ULabel><UInput value={unitNumber} onChange={setUnitNumber} placeholder="e.g. 101, A1" error={!!errors.unitNumber} /><ErrMsg msg={errors.unitNumber} /></div>
                        <div><ULabel>Tower</ULabel><UInput value={tower} onChange={setTower} placeholder="e.g. Tower A" /></div>
                        <div><ULabel required>Unit Type</ULabel><CustomDropdown options={UNIT_TYPE_OPTIONS} value={unitType} onChange={setUnitType} placeholder="Select unit type…" error={!!errors.unitType} /><ErrMsg msg={errors.unitType} /></div>
                        <div><ULabel>Floor</ULabel><UInput value={floor} onChange={setFloor} placeholder="e.g. 1" type="number" /></div>
                        <div><ULabel required>Ownership Type</ULabel><CustomDropdown options={OWNERSHIP_TYPE_OPTIONS} value={ownershipType} onChange={setOwnershipType} placeholder="Select ownership…" error={!!errors.ownershipType} /><ErrMsg msg={errors.ownershipType} /></div>
                        <div><ULabel>Lease Type</ULabel><CustomDropdown options={LEASE_TYPE_OPTIONS} value={leaseType} onChange={setLeaseType} placeholder="Select lease type…" /></div>
                        <div><ULabel>Management Model</ULabel><CustomDropdown options={MANAGEMENT_MODEL_OPTIONS} value={managementModel} onChange={setManagementModel} placeholder="Select model…" /></div>
                        <div style={{ gridColumn:'1/-1' }}><ULabel>Unit Description</ULabel><UTextarea value={description} onChange={setDescription} placeholder="Describe this unit — layout, features, views, upgrades..." rows={3} /></div>
                      </div>
                    </div>
                    <div style={{ background:C.cardBg,borderRadius:10,border:`1px solid ${C.border}`,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SectionHead icon="ti-ruler" title="Size & Configuration" color="#065F46" bg="#D1FAE5" />
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 16px',marginBottom:16 }}>
                        <div><ULabel>Carpet Area</ULabel><UInput value={carpetArea} onChange={setCarpetArea} placeholder="0" type="number" suffix="sq ft" /></div>
                        <div><ULabel>Total Area</ULabel><UInput value={totalArea} onChange={setTotalArea} placeholder="0" type="number" suffix="sq ft" /></div>
                        <div><ULabel>Total Rooms</ULabel><UInput value={totalRooms} onChange={setTotalRooms} placeholder="0" type="number" /></div>
                        <div><ULabel>Total Bathrooms</ULabel><UInput value={totalBaths} onChange={setTotalBaths} placeholder="0" type="number" /></div>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 16px' }}>
                        <div><div style={{ fontSize:13,fontWeight:600,color:C.textPrimary,fontFamily:F.body }}>Student housing — room details</div><div style={{ fontSize:11,color:C.textSec,marginTop:2,fontFamily:F.body }}>Enable to configure per-room bed & bathroom breakdown</div></div>
                        <Toggle value={studentHousing} onChange={setStudentHousing} />
                      </div>
                      {studentHousing && <div style={{ marginTop:12,background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:7,padding:'10px 13px',display:'flex',alignItems:'flex-start',gap:8 }}><i className="ti ti-info-circle" style={{ fontSize:14,color:C.amber,flexShrink:0,marginTop:1 }} /><div style={{ fontSize:12,color:'#92400E',fontFamily:F.body,lineHeight:1.5 }}>Room and bed configuration is managed from the Unit Detail page. Add/edit rooms from there after saving.</div></div>}
                    </div>
                    <div style={{ background:C.cardBg,borderRadius:10,border:`1px solid ${C.border}`,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SectionHead icon="ti-currency-dollar" title="Financials" color="#92400E" bg="#FEF3C7" />
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 16px' }}>
                        <div><ULabel>Rent Amount</ULabel><UInput value={rentAmount} onChange={setRentAmount} placeholder="0.00" prefix="$" type="number" /></div>
                        <div><ULabel>Security Deposit</ULabel><UInput value={securityDeposit} onChange={setSecurityDeposit} placeholder="0.00" prefix="$" type="number" /></div>
                      </div>
                    </div>
                    {/* Fix 1b: Services section */}
                    <div style={{ background:C.cardBg,borderRadius:10,border:`1px solid ${C.border}`,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SectionHead icon="ti-settings" title="Unit Services" color="#7C3AED" bg="#EDE9FE" />
                      <div style={{ fontSize:11,color:C.textSec,fontFamily:F.body,marginBottom:14,marginTop:-8 }}>Based on your plan and add-ons. Select services applicable to this unit.</div>
                      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px 16px' }}>
                        {UNIT_SERVICES_LIST.map(svc=>{ const checked=(unitServices||new Set()).has(svc.id); return (
                          <div key={svc.id} onClick={()=>{ const next=new Set(unitServices); next.has(svc.id)?next.delete(svc.id):next.add(svc.id); setUnitServices(next); }} style={{ display:'flex',alignItems:'center',gap:9,cursor:'pointer',userSelect:'none' }}>
                            <div style={{ width:16,height:16,borderRadius:4,border:`1.5px solid ${checked?C.primary:C.borderMed}`,background:checked?C.primary:C.cardBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}>{checked&&<i className="ti ti-check" style={{ fontSize:10,color:'#fff',lineHeight:1 }} />}</div>
                            <span style={{ fontSize:13,color:C.textPrimary,fontFamily:F.body }}>{svc.label}</span>
                          </div>
                        );})}
                      </div>
                    </div>
                  </div>
                  <div style={{ width:280,flexShrink:0,display:'flex',flexDirection:'column',gap:12 }}>
                    <div style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,padding:16,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:12 }}><i className="ti ti-list-check" style={{ fontSize:13,color:C.textSec }} /><span style={{ fontSize:13,fontWeight:700,color:C.textPrimary,fontFamily:F.headline }}>Unit Summary</span></div>
                      {[{ label:'Property',value:propName||'—' },{ label:'Unit No.',value:unitNumber||'—' },{ label:'Type',value:UNIT_TYPE_OPTIONS.find(o=>o.value===unitType)?.label||'—' },{ label:'Floor',value:floor||'—' },{ label:'Total Area',value:totalArea?`${totalArea} sq ft`:'—' },{ label:'Rent',value:rentAmount?`$${Number(rentAmount).toLocaleString()}/mo`:'—' }].map(({ label,value },i,arr)=>(
                        <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:i<arr.length-1?8:0,marginBottom:i<arr.length-1?8:10,borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none' }}>
                          <span style={{ fontSize:12,color:C.textSec,fontFamily:F.body }}>{label}</span>
                          <span style={{ fontSize:12,fontWeight:600,color:C.textPrimary,fontFamily:F.body,textAlign:'right',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:10,padding:14 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}><i className="ti ti-info-circle" style={{ fontSize:14,color:C.amber }} /><span style={{ fontSize:13,fontWeight:700,color:'#92400E',fontFamily:F.body }}>Edit Mode</span></div>
                      <div style={{ fontSize:11.5,color:'#92400E',lineHeight:1.6,fontFamily:F.body }}>Gallery and floor plan images are managed from the Unit Detail page. Room/bed config for student housing is also managed there.</div>
                    </div>
                  </div>
                </div>
              )}
              {subTab==='Amenities'    && <UnitAmenitiesTab selectedAmenities={selectedAmenities} setSelectedAmenities={setSelectedAmenities} unitAmenities={unitAmenities} />}
              {subTab==='Ownership'    && <UnitOwnershipTab existingOwners={existingOwners} setExistingOwners={setExistingOwners} newOwners={newOwners} setNewOwners={setNewOwners} hasActiveTenant={hasActiveTenant} />}
              {subTab==='Bank Account' && <UnitBankAccountTab bankAccounts={bankAccounts} setBankAccounts={setBankAccounts} reserveExtras={bankReserveExtras} setReserveExtras={setBankReserveExtras} activeId={bankActiveId} setActiveId={setBankActiveId} apiRecords={bankApiRecords} />}
            </div>
            <div style={{ position:'sticky',bottom:0,background:C.cardBg,borderTop:`1px solid ${C.border}`,padding:`13px ${PAGE_PX}px`,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:12,zIndex:10,boxShadow:'0 -2px 8px rgba(0,0,0,0.05)',marginTop:'auto' }}>
              {subTab==='Bank Account' && <div style={{ marginRight:'auto',display:'flex',alignItems:'center',gap:7,fontSize:12,color:C.textSec }}><i className="ti ti-lock" style={{ fontSize:13 }} /> Secure Transaction Encryption</div>}
              <button onClick={()=>navigate(`/pm-portal/properties/${id}/units/${unitId}`)} style={{ padding:'9px 24px',fontSize:13,fontWeight:600,background:'transparent',border:`1.5px solid ${C.borderMed}`,borderRadius:7,color:C.textSec,cursor:'pointer',fontFamily:F.body }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'9px 28px',fontSize:13,fontWeight:700,background:saving?C.borderMed:C.primary,border:'none',borderRadius:7,color:'#fff',cursor:saving?'not-allowed':'pointer',fontFamily:F.body,display:'flex',alignItems:'center',gap:8 }}>
                {saving && <i className="ti ti-loader-2" style={{ fontSize:14,animation:'spin 1s linear infinite' }} />}
                {saving?'Saving...':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
