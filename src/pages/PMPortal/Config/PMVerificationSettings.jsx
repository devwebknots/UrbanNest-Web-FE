import React, { useState, useEffect } from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';

const C = {
  primary:      '#002D5B',
  pageBg:       '#F8FAFC',
  white:        '#FFFFFF',
  border:       'rgba(0,0,0,0.06)',
  borderLight:  'rgba(0,0,0,0.05)',
  borderMedium: 'rgba(0,0,0,0.10)',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  neutral:      '#F1F5F9',
  danger:       '#E53E3E',
  dangerBg:     '#FEF2F2',
  dangerBorder: '#FECACA',
  green:        '#16A34A',
  greenBg:      '#F0FDF4',
  greenBorder:  '#BBF7D0',
  amber:        '#92400E',
  amberBg:      '#FEF3C7',
  amberBorder:  '#FCD34D',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };
const API   = 'http://localhost:8001/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });

const US_STATES = [
  {code:'AL',name:'Alabama'},{code:'AK',name:'Alaska'},{code:'AZ',name:'Arizona'},
  {code:'AR',name:'Arkansas'},{code:'CA',name:'California'},{code:'CO',name:'Colorado'},
  {code:'CT',name:'Connecticut'},{code:'DE',name:'Delaware'},{code:'FL',name:'Florida'},
  {code:'GA',name:'Georgia'},{code:'HI',name:'Hawaii'},{code:'ID',name:'Idaho'},
  {code:'IL',name:'Illinois'},{code:'IN',name:'Indiana'},{code:'IA',name:'Iowa'},
  {code:'KS',name:'Kansas'},{code:'KY',name:'Kentucky'},{code:'LA',name:'Louisiana'},
  {code:'ME',name:'Maine'},{code:'MD',name:'Maryland'},{code:'MA',name:'Massachusetts'},
  {code:'MI',name:'Michigan'},{code:'MN',name:'Minnesota'},{code:'MS',name:'Mississippi'},
  {code:'MO',name:'Missouri'},{code:'MT',name:'Montana'},{code:'NE',name:'Nebraska'},
  {code:'NV',name:'Nevada'},{code:'NH',name:'New Hampshire'},{code:'NJ',name:'New Jersey'},
  {code:'NM',name:'New Mexico'},{code:'NY',name:'New York'},{code:'NC',name:'North Carolina'},
  {code:'ND',name:'North Dakota'},{code:'OH',name:'Ohio'},{code:'OK',name:'Oklahoma'},
  {code:'OR',name:'Oregon'},{code:'PA',name:'Pennsylvania'},{code:'RI',name:'Rhode Island'},
  {code:'SC',name:'South Carolina'},{code:'SD',name:'South Dakota'},{code:'TN',name:'Tennessee'},
  {code:'TX',name:'Texas'},{code:'UT',name:'Utah'},{code:'VT',name:'Vermont'},
  {code:'VA',name:'Virginia'},{code:'WA',name:'Washington'},{code:'WV',name:'West Virginia'},
  {code:'WI',name:'Wisconsin'},{code:'WY',name:'Wyoming'},
];
const IN_STATES = [
  {code:'AP',name:'Andhra Pradesh'},{code:'AR',name:'Arunachal Pradesh'},{code:'AS',name:'Assam'},
  {code:'BR',name:'Bihar'},{code:'CG',name:'Chhattisgarh'},{code:'GA',name:'Goa'},
  {code:'GJ',name:'Gujarat'},{code:'HR',name:'Haryana'},{code:'HP',name:'Himachal Pradesh'},
  {code:'JH',name:'Jharkhand'},{code:'KA',name:'Karnataka'},{code:'KL',name:'Kerala'},
  {code:'MP',name:'Madhya Pradesh'},{code:'MH',name:'Maharashtra'},{code:'MN',name:'Manipur'},
  {code:'ML',name:'Meghalaya'},{code:'MZ',name:'Mizoram'},{code:'NL',name:'Nagaland'},
  {code:'OD',name:'Odisha'},{code:'PB',name:'Punjab'},{code:'RJ',name:'Rajasthan'},
  {code:'SK',name:'Sikkim'},{code:'TN',name:'Tamil Nadu'},{code:'TG',name:'Telangana'},
  {code:'TR',name:'Tripura'},{code:'UP',name:'Uttar Pradesh'},{code:'UK',name:'Uttarakhand'},
  {code:'WB',name:'West Bengal'},{code:'DL',name:'Delhi'},{code:'PY',name:'Puducherry'},
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
const overlayStyle = { position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' };
const modalBase = { background:C.white,borderRadius:12,padding:28,width:'90%',maxWidth:480,boxShadow:'0 8px 40px rgba(0,0,0,0.14)',border:`1px solid ${C.borderLight}`,maxHeight:'90vh',overflowY:'auto' };
const fieldLabel = { fontFamily:F.body,fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.textSecondary,display:'block',marginBottom:5 };
const inputStyle = { width:'100%',height:36,borderRadius:8,background:'#F8FAFC',border:`1px solid ${C.border}`,boxSizing:'border-box',padding:'0 12px',fontFamily:F.body,fontSize:13,color:C.textPrimary,outline:'none' };
const btnPrimary = { height:36,padding:'0 18px',borderRadius:8,border:'none',background:C.primary,fontFamily:F.body,fontSize:13,fontWeight:700,color:C.white,cursor:'pointer',display:'flex',alignItems:'center',gap:6 };
const btnCancel  = { height:36,padding:'0 18px',borderRadius:8,border:`1px solid ${C.borderMedium}`,background:C.white,fontFamily:F.body,fontSize:13,fontWeight:700,color:C.textPrimary,cursor:'pointer' };
const btnOutline = { height:34,padding:'0 14px',borderRadius:8,border:`1px solid ${C.primary}`,background:C.white,fontFamily:F.body,fontSize:12,fontWeight:700,color:C.primary,cursor:'pointer',display:'flex',alignItems:'center',gap:5 };

function Toast({ message }) {
  if (!message) return null;
  return <div style={{ position:'fixed',bottom:24,right:24,zIndex:2000,background:C.primary,color:C.white,padding:'10px 20px',borderRadius:8,fontSize:13,fontFamily:F.body,fontWeight:700,boxShadow:'0 4px 16px rgba(0,0,0,0.18)' }}>{message}</div>;
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width:36,height:20,borderRadius:10,background:value?C.green:C.textTertiary,display:'flex',alignItems:'center',padding:'0 3px',cursor:'pointer',transition:'background 0.2s',flexShrink:0 }}>
      <div style={{ width:14,height:14,borderRadius:'50%',background:C.white,marginLeft:value?'auto':0,transition:'margin 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalBase, maxWidth:400 }}>
        <p style={{ fontFamily:F.body,fontSize:13,color:C.textPrimary,margin:'0 0 20px',lineHeight:1.6 }}>{message}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={btnCancel}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnPrimary,background:C.danger }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Doc Modal ─────────────────────────────────────────────────────────
function CustomDocModal({ existing, section, state, country, onClose, onSaved }) {
  const isEdit = Boolean(existing);
  const [name,        setName]        = useState(existing?.custom_name || '');
  const [isMandatory, setIsMandatory] = useState(existing?.is_required ?? true);
  const [isActive,    setIsActive]    = useState(existing?.is_active   ?? true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const sectionLabel = section === 'OWNERSHIP' ? 'Ownership Verification' : 'Onboarding';
  const countryLabel = country === 'US' ? 'United States (US)' : country === 'IN' ? 'India (IN)' : country;

  async function handleSubmit() {
    if (!name.trim()) { setError('Document name is required.'); return; }
    setError(''); setSaving(true);
    try {
      const url    = isEdit ? `${API}/pm/doc-config/${existing.id}/` : `${API}/pm/doc-config/`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method, headers: authH(),
        body: JSON.stringify({ custom_name:name.trim(), section_code:section, state, country, is_required:isMandatory, is_active:isActive, is_custom:true }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(JSON.stringify(e)); }
      onSaved(await res.json(), isEdit);
    } catch(e) { setError(e.message || 'Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  const lockedField = (label, value) => (
    <div style={{ marginBottom:14 }}>
      <label style={fieldLabel}>{label}</label>
      <div style={{ ...inputStyle,display:'flex',alignItems:'center',justifyContent:'space-between',border:`1px dashed ${C.borderMedium}`,color:C.textSecondary,cursor:'not-allowed' }}>
        <span>{value}</span>
        <i className="ti ti-lock" style={{ fontSize:12,color:C.textTertiary }} />
      </div>
    </div>
  );

  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        <h3 style={{ fontFamily:F.headline,fontSize:20,fontWeight:700,color:C.primary,margin:'0 0 20px' }}>
          {isEdit ? 'Edit Custom Document' : 'Add Custom Document'}
        </h3>
        {error && <div style={{ background:C.dangerBg,border:`1px solid ${C.dangerBorder}`,borderRadius:6,padding:'8px 12px',marginBottom:14,fontSize:12,color:C.danger,fontFamily:F.body }}>{error}</div>}

        <div style={{ marginBottom:14 }}>
          <label style={fieldLabel}>Document Name <span style={{ color:C.danger }}>*</span></label>
          <input style={inputStyle} placeholder="e.g. Driving License, Utility Bill" value={name} onChange={e=>setName(e.target.value)} autoFocus />
        </div>
        {lockedField('Section', sectionLabel)}
        {lockedField('Country', countryLabel)}

        <div style={{ borderTop:`1px solid ${C.borderLight}`,margin:'16px 0' }} />

        <div style={{ marginBottom:14 }}>
          <label style={fieldLabel}>Mandatory</label>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:3 }}>
            <Toggle value={isMandatory} onChange={setIsMandatory} />
            <span style={{ fontFamily:F.body,fontSize:13,fontWeight:700,color:isMandatory?C.green:C.textTertiary }}>{isMandatory?'Mandatory':'Optional'}</span>
          </div>
          <p style={{ fontFamily:F.body,fontSize:11,color:C.textTertiary,margin:'2px 0 0',paddingLeft:46 }}>
            {isMandatory ? 'Owners must submit this document' : 'Owners may submit this optionally'}
          </p>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={fieldLabel}>Status</label>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:3 }}>
            <Toggle value={isActive} onChange={setIsActive} />
            <span style={{ fontFamily:F.body,fontSize:13,fontWeight:700,color:isActive?C.green:C.textTertiary }}>{isActive?'Active':'Inactive'}</span>
          </div>
        </div>

        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnCancel} disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={saving}>
            {!isEdit && <i className="ti ti-plus" style={{ fontSize:13 }} />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Badge components ─────────────────────────────────────────────────────────
function SourceBadge({ isCustom }) {
  return isCustom
    ? <span style={{ fontSize:9,fontWeight:700,fontFamily:F.body,letterSpacing:'0.06em',textTransform:'uppercase',padding:'2px 6px',borderRadius:4,background:C.greenBg,color:C.green,border:`0.5px solid ${C.greenBorder}` }}>Custom</span>
    : <span style={{ fontSize:9,fontWeight:700,fontFamily:F.body,letterSpacing:'0.06em',textTransform:'uppercase',padding:'2px 6px',borderRadius:4,background:C.neutral,color:C.textSecondary,border:`0.5px solid ${C.border}` }}>UN Admin</span>;
}
function MandatoryBadge({ value }) {
  return <span style={{ fontSize:9,fontWeight:700,fontFamily:F.body,letterSpacing:'0.06em',textTransform:'uppercase',padding:'2px 6px',borderRadius:4,background:C.neutral,color:value?C.textPrimary:C.textTertiary,border:`0.5px solid ${C.border}` }}>{value?'Mandatory':'Optional'}</span>;
}

// ─── Action icon button ───────────────────────────────────────────────────────
function ActionBtn({ onClick, icon, danger }) {
  return (
    <button onClick={onClick} style={{ width:28,height:28,borderRadius:6,border:`1px solid ${danger?C.dangerBorder:C.borderLight}`,background:danger?C.dangerBg:C.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:danger?C.danger:C.textSecondary }}>
      <i className={`ti ti-${icon}`} style={{ fontSize:13 }} />
    </button>
  );
}

// ─── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab({ pmCountry }) {
  const stateList     = pmCountry === 'IN' ? IN_STATES : US_STATES;
  const [selectedState,  setSelectedState]  = useState(stateList[0].code);
  const [activeSection,  setActiveSection]  = useState('OWNERSHIP');
  const [isEditMode,     setIsEditMode]     = useState(false);
  const [search,         setSearch]         = useState('');
  const [unAdminDocs,    setUnAdminDocs]    = useState([]);
  const [pmSelections,   setPmSelections]   = useState({});
  const [customDocs,     setCustomDocs]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [editCustom,     setEditCustom]     = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [dirty,          setDirty]          = useState(false);
  const [toast,          setToast]          = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function loadUnAdminDocs(section) {
    try {
      const res  = await fetch(`${API}/admin/document-types/?section=${section}&is_active=true`, { headers: authH() });
      const data = await res.json();
      setUnAdminDocs(Array.isArray(data) ? data : (data.results || []));
    } catch { setUnAdminDocs([]); }
  }

  async function loadPmConfig(state, section) {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/pm/doc-config/?state=${state}&section=${section}`, { headers: authH() });
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.results || []);
      const selections = {};
      const customs    = [];
      rows.forEach(row => {
        if (row.is_custom) customs.push(row);
        else if (row.document_type) selections[row.document_type] = { id:row.id, included:true, is_required:row.is_required };
      });
      setPmSelections(selections);
      setCustomDocs(customs);
    } catch { setPmSelections({}); setCustomDocs([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadUnAdminDocs(activeSection); }, [activeSection]);
  useEffect(() => { loadPmConfig(selectedState, activeSection); setIsEditMode(false); setDirty(false); }, [selectedState, activeSection]);

  function handleStateChange(code) { setSelectedState(code); setIsEditMode(false); setDirty(false); }

  function enterEditMode() { setIsEditMode(true); setDirty(false); }

  function handleCancel() {
    setIsEditMode(false); setDirty(false);
    loadPmConfig(selectedState, activeSection);
  }

  function toggleDoc(docId) {
    const doc = unAdminDocs.find(d => d.id === docId);
    setPmSelections(prev => {
      const next = { ...prev };
      if (next[docId]?.included) delete next[docId];
      else next[docId] = { included:true, is_required:doc?.is_required ?? false };
      return next;
    });
    setDirty(true);
  }

  function toggleMandatory(docId, current) {
    setPmSelections(prev => ({ ...prev, [docId]: { ...(prev[docId]||{included:true}), is_required:!current } }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = Object.entries(pmSelections).map(([docId, sel]) => ({
        document_type: parseInt(docId), state:selectedState, section_code:activeSection,
        country:pmCountry, is_required:sel.is_required, is_custom:false,
      }));
      const res = await fetch(`${API}/pm/doc-config/bulk-save/`, {
        method:'POST', headers:authH(),
        body: JSON.stringify({ state:selectedState, section_code:activeSection, country:pmCountry, selections:payload }),
      });
      if (!res.ok) throw new Error();
      showToast('Configuration saved.');
      setDirty(false); setIsEditMode(false);
      loadPmConfig(selectedState, activeSection);
    } catch { showToast('Save failed. Please try again.'); }
    finally { setSaving(false); }
  }

  function handleCustomSaved(data, isEdit) {
    if (isEdit) setCustomDocs(prev => prev.map(x => x.id === data.id ? data : x));
    else setCustomDocs(prev => [...prev, data]);
    showToast(isEdit ? 'Document updated.' : 'Custom document added.');
    setShowModal(false); setEditCustom(null);
  }

  async function handleDeleteCustom(doc) {
    try {
      await fetch(`${API}/pm/doc-config/${doc.id}/`, { method:'DELETE', headers:authH() });
      setCustomDocs(prev => prev.filter(x => x.id !== doc.id));
      showToast('Document removed.');
    } catch { showToast('Delete failed.'); }
    finally { setDeleteTarget(null); }
  }

  const selectedUnAdmin = unAdminDocs.filter(d => pmSelections[d.id]?.included);
  const filteredUnAdmin = unAdminDocs.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));
  const filteredCustom  = customDocs.filter(d => !search || d.custom_name?.toLowerCase().includes(search.toLowerCase()));
  const ownershipCount  = Object.keys(pmSelections).length + customDocs.filter(d => d.section_code === 'OWNERSHIP').length;
  const onboardingCount = Object.keys(pmSelections).length + customDocs.filter(d => d.section_code === 'ONBOARDING').length;
  const currentStateName = stateList.find(s => s.code === selectedState)?.name || selectedState;

  const SectionLabel = ({ label }) => (
    <div style={{ padding:'8px 16px 4px',fontSize:10,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:C.textTertiary,fontFamily:F.body }}>{label}</div>
  );

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  const ViewMode = () => (
    <>
      {/* Sub-tabs */}
      <div style={{ display:'flex',padding:'0 16px',borderBottom:`1px solid ${C.borderLight}` }}>
        {[{id:'OWNERSHIP',label:'Ownership'},{id:'ONBOARDING',label:'Onboarding'}].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ fontFamily:F.body,fontSize:13,fontWeight:600,padding:'10px 16px',border:'none',background:'none',color:activeSection===tab.id?C.primary:C.textTertiary,borderBottom:`2px solid ${activeSection===tab.id?C.primary:'transparent'}`,marginBottom:-1,cursor:'pointer' }}>
            {tab.label}
            <span style={{ marginLeft:5,fontSize:10,fontWeight:700,background:'rgba(0,45,91,0.08)',color:C.primary,borderRadius:20,padding:'1px 6px' }}>
              {tab.id==='OWNERSHIP'?ownershipCount:onboardingCount}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40,textAlign:'center',color:C.textTertiary,fontFamily:F.body,fontSize:13 }}>Loading...</div>
      ) : (selectedUnAdmin.length === 0 && customDocs.length === 0) ? (
        <div style={{ padding:'32px 16px',textAlign:'center' }}>
          <i className="ti ti-file-off" style={{ fontSize:32,color:C.borderMedium,display:'block',marginBottom:10 }} />
          <p style={{ fontFamily:F.body,fontSize:13,color:C.textTertiary,margin:'0 0 14px' }}>No documents configured for {activeSection === 'OWNERSHIP' ? 'Ownership' : 'Onboarding'} · {currentStateName}</p>
          <button onClick={enterEditMode} style={{ ...btnPrimary,margin:'0 auto' }}>
            <i className="ti ti-settings" style={{ fontSize:13 }} />
            Configure now
          </button>
        </div>
      ) : (
        <>
          {selectedUnAdmin.length > 0 && (
            <>
              <SectionLabel label="UN Admin defaults (selected)" />
              {selectedUnAdmin.map(doc => (
                <div key={doc.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:`1px solid ${C.borderLight}` }}>
                  <div style={{ width:16,height:16,borderRadius:4,background:C.primary,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <i className="ti ti-check" style={{ fontSize:10,color:C.white }} />
                  </div>
                  <span style={{ fontFamily:F.body,fontSize:13,fontWeight:500,color:C.textPrimary,flex:1 }}>{doc.name}</span>
                  <SourceBadge isCustom={false} />
                  <MandatoryBadge value={pmSelections[doc.id]?.is_required ?? doc.is_required} />
                </div>
              ))}
            </>
          )}

          {customDocs.length > 0 && (
            <>
              <SectionLabel label="Custom documents" />
              {customDocs.map(doc => (
                <div key={doc.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:`1px solid ${C.borderLight}` }}>
                  <div style={{ width:16,height:16,borderRadius:4,background:C.green,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <i className="ti ti-check" style={{ fontSize:10,color:C.white }} />
                  </div>
                  <span style={{ fontFamily:F.body,fontSize:13,fontWeight:500,color:C.textPrimary,flex:1 }}>{doc.custom_name}</span>
                  <SourceBadge isCustom={true} />
                  <MandatoryBadge value={doc.is_required} />
                </div>
              ))}
            </>
          )}

        </>
      )}
    </>
  );

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  const EditMode = () => (
    <>
      {/* Edit toolbar */}
      <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:`1px solid ${C.borderLight}`,flexWrap:'wrap' }}>
        <div style={{ height:34,background:C.neutral,borderRadius:8,display:'flex',alignItems:'center',gap:6,padding:'0 10px',flex:1,maxWidth:260 }}>
          <i className="ti ti-search" style={{ fontSize:13,color:C.textTertiary }} />
          <input style={{ border:'none',background:'none',outline:'none',fontFamily:F.body,fontSize:12,color:C.textPrimary,width:'100%' }} placeholder="Search documents..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setEditCustom(null); setShowModal(true); }} style={{ ...btnOutline,marginLeft:'auto' }}>
          <i className="ti ti-plus" style={{ fontSize:13 }} />
          Add custom doc
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex',padding:'0 16px',borderBottom:`1px solid ${C.borderLight}` }}>
        {[{id:'OWNERSHIP',label:'Ownership'},{id:'ONBOARDING',label:'Onboarding'}].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ fontFamily:F.body,fontSize:13,fontWeight:600,padding:'10px 16px',border:'none',background:'none',color:activeSection===tab.id?C.primary:C.textTertiary,borderBottom:`2px solid ${activeSection===tab.id?C.primary:'transparent'}`,marginBottom:-1,cursor:'pointer' }}>
            {tab.label}
            <span style={{ marginLeft:5,fontSize:10,fontWeight:700,background:'rgba(0,45,91,0.08)',color:C.primary,borderRadius:20,padding:'1px 6px' }}>
              {tab.id==='OWNERSHIP'?ownershipCount:onboardingCount}
            </span>
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div style={{ margin:'10px 16px',padding:'9px 12px',background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:8,display:'flex',alignItems:'flex-start',gap:8,fontSize:12,color:'#166534',fontFamily:F.body,lineHeight:1.5 }}>
        <i className="ti ti-info-circle" style={{ fontSize:14,flexShrink:0,marginTop:1 }} />
        Tick documents for <strong>{activeSection==='OWNERSHIP'?'Ownership':'Onboarding'} · {currentStateName}</strong>. Add custom docs for requirements not in the list.
      </div>

      {/* UN Admin defaults */}
      <SectionLabel label="UN Admin defaults" />
      {filteredUnAdmin.length === 0 ? (
        <div style={{ padding:'10px 16px 14px',fontSize:12,color:C.textTertiary,fontFamily:F.body }}>No default documents for this section.</div>
      ) : filteredUnAdmin.map(doc => {
        const sel         = pmSelections[doc.id];
        const included    = sel?.included    ?? false;
        const isMandatory = sel?.is_required ?? doc.is_required;
        return (
          <div key={doc.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:`1px solid ${C.borderLight}`,background:included?'#FAFEFF':C.white }}>
            <div onClick={() => toggleDoc(doc.id)} style={{ width:16,height:16,borderRadius:4,border:included?'none':`1px solid ${C.borderMedium}`,background:included?C.primary:'#F8FAFC',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
              {included && <i className="ti ti-check" style={{ fontSize:10,color:C.white }} />}
            </div>
            <span style={{ fontFamily:F.body,fontSize:13,fontWeight:500,color:C.textPrimary,flex:1 }}>{doc.name}</span>
            <SourceBadge isCustom={false} />
            <MandatoryBadge value={isMandatory} />
            <Toggle value={included ? isMandatory : false} onChange={() => included && toggleMandatory(doc.id, isMandatory)} />
          </div>
        );
      })}

      {/* Custom docs */}
      <div style={{ borderTop:`1px solid ${C.borderLight}`,margin:'6px 16px' }} />
      <SectionLabel label="Custom documents" />
      {filteredCustom.length === 0 ? (
        <div style={{ padding:'10px 16px 14px',fontSize:12,color:C.textTertiary,fontFamily:F.body }}>
          No custom documents yet.{' '}
          <span onClick={() => { setEditCustom(null); setShowModal(true); }} style={{ color:C.primary,fontWeight:600,cursor:'pointer',textDecoration:'underline' }}>Add one</span>
        </div>
      ) : filteredCustom.map(doc => (
        <div key={doc.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:`1px solid ${C.borderLight}` }}>
          <div style={{ width:16,height:16,borderRadius:4,background:C.green,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <i className="ti ti-check" style={{ fontSize:10,color:C.white }} />
          </div>
          <span style={{ fontFamily:F.body,fontSize:13,fontWeight:500,color:C.textPrimary,flex:1 }}>{doc.custom_name}</span>
          <SourceBadge isCustom={true} />
          <MandatoryBadge value={doc.is_required} />
          <Toggle value={doc.is_required} onChange={() => {}} />
          <ActionBtn onClick={() => { setEditCustom(doc); setShowModal(true); }} icon="pencil" />
          <ActionBtn onClick={() => setDeleteTarget(doc)} icon="trash" danger />
        </div>
      ))}

      {/* Footer */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'flex-end',gap:10,padding:'12px 16px',borderTop:`1px solid ${C.borderLight}` }}>
        {dirty && (
          <span style={{ fontFamily:F.body,fontSize:11,color:C.amber,marginRight:'auto',display:'flex',alignItems:'center',gap:4 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize:12 }} /> Unsaved changes
          </span>
        )}
        <button onClick={handleCancel} style={btnCancel}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={btnPrimary}>
          <i className="ti ti-device-floppy" style={{ fontSize:13 }} />
          {saving ? 'Saving…' : 'Save configuration'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Toast message={toast} />

      <div style={{ background:C.white,borderRadius:10,border:`1px solid ${C.borderLight}`,overflow:'hidden' }}>

        {/* Top toolbar — always visible */}
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:`1px solid ${C.borderLight}`,flexWrap:'wrap' }}>
          <span style={{ fontFamily:F.body,fontSize:12,fontWeight:600,color:C.textSecondary }}>State:</span>
          <select
            style={{ height:34,padding:'0 10px',borderRadius:8,border:`1px solid ${C.borderMedium}`,background:C.white,fontFamily:F.body,fontSize:12,fontWeight:600,color:C.textPrimary,cursor:'pointer',minWidth:180 }}
            value={selectedState}
            onChange={e => handleStateChange(e.target.value)}
          >
            {stateList.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
          </select>

          {/* Configure button — only in view mode */}
          {!isEditMode && (
            <button onClick={enterEditMode} style={{ ...btnPrimary,marginLeft:'auto' }}>
              <i className="ti ti-settings" style={{ fontSize:13 }} />
              Configure
            </button>
          )}
        </div>

        {/* Mode-specific content */}
        {isEditMode ? <EditMode /> : <ViewMode />}
      </div>

      {showModal && (
        <CustomDocModal
          existing={editCustom}
          section={activeSection}
          state={selectedState}
          country={pmCountry}
          onClose={() => { setShowModal(false); setEditCustom(null); }}
          onSaved={handleCustomSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Remove "${deleteTarget.custom_name}" from your document list? This cannot be undone.`}
          onConfirm={() => handleDeleteCustom(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PMVerificationSettings() {
  const [activeTab, setActiveTab] = useState('documents');
  const [pmCountry, setPmCountry] = useState(null);

  useEffect(() => {
    fetch(`${API}/auth/me/`, { headers: authH() })
        .then(r => r.json())
        .then(data => setPmCountry(data.country || 'US'))
        .catch(() => setPmCountry('US'));
  }, []);

  if (!pmCountry) {
    return (
        <div style={{ display:'flex', minHeight:'100vh', background:C.pageBg, fontFamily:F.body }}>
        <NavB activeId="verification-settings" />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:F.body, fontSize:13, color:C.textTertiary }}>Loading...</span>
        </div>
        </div>
    );
    }
  return (
    <div style={{ display:'flex',minHeight:'100vh',background:C.pageBg,fontFamily:F.body }}>
      <NavB activeId="verification-settings" />
      <div style={{ flex:1,display:'flex',flexDirection:'column',minWidth:0 }}>
        <PMTopBar />
       
        <div style={{ flex:1,padding:'28px 32px',overflowY:'auto' }}>
          <div style={{ fontSize:12,color:C.textTertiary,marginBottom:6,display:'flex',alignItems:'center',gap:5 }}>
            Configuration <i className="ti ti-chevron-right" style={{ fontSize:12 }} />
            <span style={{ color:C.textSecondary }}>Verification Settings</span>
          </div>
          <h1 style={{ fontFamily:F.headline,fontSize:26,fontWeight:700,color:C.primary,margin:'0 0 3px' }}>Verification Settings</h1>
          <p style={{ fontFamily:F.body,fontSize:13,color:C.textSecondary,margin:'0 0 22px' }}>Configure document requirements for owner and onboarding verification</p>

          <div style={{ display:'flex',borderBottom:`1px solid ${C.borderLight}`,marginBottom:22 }}>
            <button onClick={() => setActiveTab('documents')} style={{ fontFamily:F.body,fontSize:13,fontWeight:600,padding:'10px 20px',border:'none',background:'none',color:activeTab==='documents'?C.primary:C.textTertiary,borderBottom:`2px solid ${activeTab==='documents'?C.primary:'transparent'}`,marginBottom:-1,cursor:'pointer' }}>
              Documents
            </button>
            <button style={{ fontFamily:F.body,fontSize:13,fontWeight:600,padding:'10px 20px',border:'none',background:'none',color:'rgba(0,0,0,0.2)',cursor:'default',borderBottom:'2px solid transparent',marginBottom:-1 }}>
              Coming soon
            </button>
          </div>

          {activeTab === 'documents' && <DocumentsTab pmCountry={pmCountry} />}
        </div>
      </div>
    </div>
  );
}
