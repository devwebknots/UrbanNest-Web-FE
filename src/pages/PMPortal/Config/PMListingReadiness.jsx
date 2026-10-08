import React, { useState, useEffect } from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';

// ─── Design tokens (matches PMVerificationSettings.jsx exactly) ──────────────
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
  blue:         '#3d8ef0',
  blueBg:       '#EFF6FF',
  blueBorder:   '#BFDBFE',
  purple:       '#6D28D9',
  purpleBg:     '#F5F3FF',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };
const API   = 'http://localhost:8001/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });

const SOURCE_STYLE = {
  PLATFORM_DEFAULT: { bg: C.neutral,  color: C.textSecondary, label: 'Platform Default' },
  ACCOUNT_DEFAULT:  { bg: C.purpleBg, color: C.purple,        label: 'Account Default' },
  NODE:             { bg: C.blueBg,   color: C.blue,          label: 'Custom at this node' },
};

// ─── Shared UI (matches PMVerificationSettings.jsx) ───────────────────────────
const overlayStyle = { position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 };
const modalBase = { background:C.white,borderRadius:12,padding:28,width:'90%',maxWidth:480,boxShadow:'0 8px 40px rgba(0,0,0,0.14)',border:`1px solid ${C.borderLight}`,maxHeight:'90vh',overflowY:'auto' };
const fieldLabel = { fontFamily:F.body,fontSize:10,fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',color:C.textSecondary,display:'block',marginBottom:5 };
const inputStyle = { width:'100%',height:36,borderRadius:8,background:'#F8FAFC',border:`1px solid ${C.border}`,boxSizing:'border-box',padding:'0 12px',fontFamily:F.body,fontSize:13,color:C.textPrimary,outline:'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const btnPrimary = { height:36,padding:'0 18px',borderRadius:8,border:'none',background:C.primary,fontFamily:F.body,fontSize:13,fontWeight:500,color:C.white,cursor:'pointer',display:'flex',alignItems:'center',gap:6 };
const btnCancel  = { height:36,padding:'0 18px',borderRadius:8,border:`1px solid ${C.borderMedium}`,background:C.white,fontFamily:F.body,fontSize:13,fontWeight:500,color:C.textPrimary,cursor:'pointer' };

function Toast({ message }) {
  if (!message) return null;
  return <div style={{ position:'fixed',bottom:24,right:24,zIndex:2000,background:C.primary,color:C.white,padding:'10px 20px',borderRadius:8,fontSize:13,fontFamily:F.body,fontWeight:500,boxShadow:'0 4px 16px rgba(0,0,0,0.18)' }}>{message}</div>;
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width:36,height:20,borderRadius:10,background:value?C.green:C.textTertiary,display:'flex',alignItems:'center',padding:'0 3px',cursor:'pointer',transition:'background 0.2s',flexShrink:0 }}>
      <div style={{ width:14,height:14,borderRadius:'50%',background:C.white,marginLeft:value?'auto':0,transition:'margin 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );
}

function Pill({ bg, color, children }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:500,letterSpacing:'0.02em',background:bg,color }}>
      {children}
    </span>
  );
}
const SeverityBadge = ({ severity }) => severity === 'BLOCKING' ? <Pill bg={C.dangerBg} color="#B91C1C">Blocking</Pill> : <Pill bg={C.amberBg} color={C.amber}>Warning</Pill>;
const StatusBadge   = ({ enabled })  => enabled ? <Pill bg={C.greenBg} color={C.green}>Enabled</Pill> : <Pill bg={C.neutral} color={C.textSecondary}>Disabled</Pill>;
const SourceBadge    = ({ source })   => {
  const s = SOURCE_STYLE[source] || SOURCE_STYLE.PLATFORM_DEFAULT;
  return <Pill bg={s.bg} color={s.color}>{s.label}</Pill>;
};

// ─── Override Modal — set severity/enabled for this account (or node) ───────
function OverrideModal({ rule, isOverride, onClose, onSaved }) {
  const [severity, setSeverity] = useState(rule.severity);
  const [enabled,  setEnabled]  = useState(rule.enabled);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleSave() {
    setSaving(true); setError('');
    try {
      await onSaved({ rule_definition: rule.id, enabled, severity });
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalBase}>
        <h3 style={{ fontFamily:F.headline,fontSize:20,fontWeight:500,color:C.primary,margin:'0 0 6px' }}>
          {isOverride ? 'Edit Override' : 'Set Override'}
        </h3>
        <p style={{ fontFamily:F.body,fontSize:12.5,color:C.textSecondary,margin:'0 0 18px' }}>{rule.name}</p>

        {error && <div style={{ background:C.dangerBg,border:`1px solid ${C.dangerBorder}`,borderRadius:6,padding:'8px 12px',marginBottom:14,fontSize:12,color:C.danger,fontFamily:F.body }}>{error}</div>}

        <div style={{ marginBottom:14 }}>
          <label style={fieldLabel}>Severity</label>
          <select style={selectStyle} value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="WARNING">Warning</option>
            <option value="BLOCKING">Blocking</option>
          </select>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={fieldLabel}>Status</label>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:3 }}>
            <Toggle value={enabled} onChange={setEnabled} />
            <span style={{ fontFamily:F.body,fontSize:13,fontWeight:500,color:enabled?C.green:C.textTertiary }}>{enabled?'Enabled':'Disabled'}</span>
          </div>
        </div>

        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnCancel} disabled={saving}>Cancel</button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save Override'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Rules Tab (shared by Independent PM and Org PM) ─────────────────────────
function RulesTab() {
  const [personaType,  setPersonaType]  = useState(null);
  const [accountName,  setAccountName]  = useState('');
  const [nodes,        setNodes]        = useState([]);
  const [currentNode,  setCurrentNode]  = useState('');
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [activeTab,    setActiveTab]    = useState('ALL');
  const [modalRule,    setModalRule]    = useState(null);
  const [toast,        setToast]        = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function load(nodeId) {
    setLoading(true);
    try {
      const qs  = nodeId ? `?node=${nodeId}` : '';
      const res = await fetch(`${API}/pm/readiness-rules/${qs}`, { headers: authH() });
      const data = await res.json();
      setPersonaType(data.persona_type);
      setAccountName(data.account_name);
      setNodes(data.nodes || []);
      setCurrentNode(data.current_node || '');
      setItems(data.results || []);
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function handleNodeChange(nodeId) {
    setCurrentNode(nodeId);
    load(nodeId || undefined);
  }

  async function applyOverride({ rule_definition, enabled, severity }) {
    const body = { rule_definition, enabled, severity };
    if (currentNode) body.node = currentNode;
    const res = await fetch(`${API}/pm/readiness-rules/`, { method: 'PATCH', headers: authH(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Save failed');
    const updated = await res.json();
    setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
    showToast('Override saved.');
  }

  async function resetToDefault(rule) {
    const body = { rule_definition: rule.id };
    if (currentNode) body.node = currentNode;
    const res = await fetch(`${API}/pm/readiness-rules/`, { method: 'DELETE', headers: authH(), body: JSON.stringify(body) });
    if (res.ok) {
      const updated = await res.json();
      setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
      showToast('Reset to default.');
    }
  }

  const isOrgPms = personaType === 'ORG_PMS';

  const tabs = [
    { id: 'ALL', label: 'All Rules' },
    { id: 'UNIT_READINESS', label: 'Unit Readiness' },
    { id: 'LISTING_PUBLICATION', label: 'Listing Publication' },
  ];

  const filtered = items.filter(item => {
    const matchTab    = activeTab === 'ALL' || item.category?.scope === activeTab;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchSource = !sourceFilter || item.source === sourceFilter;
    return matchTab && matchSearch && matchSource;
  });

  const groups = filtered.reduce((acc, item) => {
    const key = item.category?.id ?? 'uncategorized';
    if (!acc[key]) acc[key] = { category: item.category, rows: [] };
    acc[key].rows.push(item);
    return acc;
  }, {});

  const currentNodeLabel = currentNode
    ? nodes.find(n => n.id === currentNode)?.node_name || 'Selected node'
    : `${accountName || 'Your account'} (Account Default)`;

  const overrideActionLabel = (source) => {
    if (currentNode) return source === 'NODE' ? 'Reset to Account Default' : 'Override for this node';
    return source === 'ACCOUNT_DEFAULT' ? 'Reset to Default' : 'Override';
  };

  return (
    <>
      {/* Node picker — Org PM only */}
      {isOrgPms && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, padding:'12px 14px', background:C.blueBg, border:`1px solid ${C.blueBorder}`, borderRadius:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:500, letterSpacing:'0.05em', color:C.blue, fontFamily:F.body }}>CONFIGURING FOR</span>
          <select
            style={{ height:34, padding:'0 14px', borderRadius:8, background:C.white, border:`1px solid ${C.blueBorder}`, fontFamily:F.body, fontSize:12.5, fontWeight:500, color:C.textPrimary, cursor:'pointer' }}
            value={currentNode}
            onChange={e => handleNodeChange(e.target.value)}
          >
            <option value="">{accountName || 'Account'} (Account Default)</option>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{'—'.repeat(Math.max(0, n.level - 1))} {n.node_name}</option>
            ))}
          </select>
          <span style={{ fontSize:11, color:C.textSecondary, fontFamily:F.body }}>
            A node without its own override inherits its parent's setting, down to your account default, down to the platform default.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${C.borderLight}`, marginBottom:16 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily:F.body,fontSize:13,fontWeight:500,padding:'10px 16px',border:'none',background:'none',color:activeTab===tab.id?C.primary:C.textTertiary,borderBottom:`2px solid ${activeTab===tab.id?C.primary:'transparent'}`,marginBottom:-1,cursor:'pointer' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ height:36, background:C.neutral, borderRadius:8, display:'flex', alignItems:'center', gap:8, padding:'0 12px', flex:1, maxWidth:300 }}>
          <i className="ti ti-search" style={{ fontSize:13, color:C.textTertiary }} />
          <input style={{ border:'none', background:'none', outline:'none', fontFamily:F.body, fontSize:12.5, color:C.textPrimary, width:'100%' }} placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ height:36, padding:'0 12px', borderRadius:8, border:`1px solid ${C.borderMedium}`, background:C.white, fontFamily:F.body, fontSize:12.5, fontWeight:500, color:C.textPrimary, cursor:'pointer' }} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="">Source: All</option>
          <option value="PLATFORM_DEFAULT">Platform Default</option>
          {isOrgPms && <option value="ACCOUNT_DEFAULT">Account Default</option>}
          <option value={isOrgPms ? 'NODE' : 'ACCOUNT_DEFAULT'}>{isOrgPms ? 'Custom at this node' : 'Custom'}</option>
        </select>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:C.textTertiary, fontStyle:'italic', maxWidth:280, textAlign:'right' }}>
          Rules are predefined by the platform — you can only enable, disable or adjust severity, not add new rules.
        </span>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:C.textTertiary, fontSize:13 }}>Loading...</div>
      ) : Object.keys(groups).length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:C.textTertiary, fontSize:13 }}>No rules found.</div>
      ) : (
        Object.values(groups).map(({ category, rows }) => (
          <div key={category?.id ?? 'uncategorized'} style={{ marginBottom:20 }}>
            <div style={{ background:C.white, border:`1px solid ${C.borderLight}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'10px 16px', background:C.neutral, fontSize:11, fontWeight:500, letterSpacing:'0.05em', color:C.textSecondary, display:'flex', justifyContent:'space-between' }}>
                <span>{(category?.name || 'UNCATEGORIZED').toUpperCase()}</span>
                <span>{rows.length} rule{rows.length !== 1 ? 's' : ''}{isOrgPms ? ` · showing: ${currentNodeLabel}` : ''}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1.4fr 110px 100px 170px 170px', gap:12, padding:'8px 16px', borderBottom:`1px solid ${C.borderLight}` }}>
                {['Rule', 'Severity', 'Status', 'Source', 'Actions'].map(h => (
                  <span key={h} style={{ fontSize:10, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:C.textSecondary }}>{h}</span>
                ))}
              </div>
              {rows.map((item, idx) => (
                <div key={item.id} style={{ display:'grid', gridTemplateColumns:'1.4fr 110px 100px 170px 170px', gap:12, padding:'11px 16px', borderBottom:`1px solid ${C.borderLight}`, alignItems:'center', background: idx % 2 === 1 ? '#FAFBFC' : C.white }}>
                  <span style={{ fontSize:13, fontWeight:500, color:C.textPrimary }}>{item.name}</span>
                  <span><SeverityBadge severity={item.severity} /></span>
                  <span><StatusBadge enabled={item.enabled} /></span>
                  <span><SourceBadge source={item.source} /></span>
                  <div>
                    {(currentNode ? item.source === 'NODE' : item.source === 'ACCOUNT_DEFAULT') ? (
                      <span style={{ display:'flex', gap:12 }}>
                        <span onClick={() => setModalRule(item)} style={{ color:'#3D8EF0', fontWeight:500, fontSize:12.5, cursor:'pointer' }}>Edit</span>
                        <span onClick={() => resetToDefault(item)} style={{ color:C.textSecondary, fontWeight:500, fontSize:12.5, cursor:'pointer' }}>{overrideActionLabel(item.source)}</span>
                      </span>
                    ) : (
                      <span onClick={() => setModalRule(item)} style={{ color:'#3D8EF0', fontWeight:500, fontSize:12.5, cursor:'pointer' }}>
                        {overrideActionLabel(item.source)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Legend — Org PM only, matches wireframe */}
      {isOrgPms && (
        <div style={{ display:'flex', gap:18, alignItems:'center', padding:'10px 4px', fontSize:11, color:C.textSecondary, flexWrap:'wrap' }}>
          <span style={{ fontWeight:500, color:C.textTertiary, letterSpacing:'0.05em' }}>SOURCE KEY</span>
          <SourceBadge source="PLATFORM_DEFAULT" />
          <SourceBadge source="ACCOUNT_DEFAULT" />
          <SourceBadge source="NODE" />
        </div>
      )}

      {modalRule && (
        <OverrideModal
          rule={modalRule}
          isOverride={currentNode ? modalRule.source === 'NODE' : modalRule.source === 'ACCOUNT_DEFAULT'}
          onClose={() => setModalRule(null)}
          onSaved={applyOverride}
        />
      )}

      <Toast message={toast} />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PMListingReadiness() {
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg, fontFamily:F.body }}>
      <NavB activeId="listing-readiness" />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0 }}>
        <PMTopBar />

        <div style={{ flex:1, minHeight:0, padding:'28px 32px', overflowY:'auto' }}>
          <div style={{ fontSize:12, color:C.textTertiary, marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
            Configuration <i className="ti ti-chevron-right" style={{ fontSize:12 }} />
            <span style={{ color:C.textSecondary }}>Listing Readiness Rules</span>
          </div>
          <h1 style={{ fontFamily:F.headline, fontSize:26, fontWeight:500, color:C.primary, margin:'0 0 3px' }}>Listing Readiness Rules</h1>
          <p style={{ fontFamily:F.body, fontSize:13, color:C.textSecondary, margin:'0 0 22px', maxWidth:820 }}>
            Your account uses UrbanNest's platform defaults. Override severity or turn a rule off for your account (or, for an org with branches, for one node) — everything else keeps following the default automatically, including future platform changes.
          </p>

          <RulesTab />
        </div>
      </div>
    </div>
  );
}
