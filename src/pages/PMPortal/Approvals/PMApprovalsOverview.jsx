import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import UNPopup from '../../../components/common/UNPopup';
import PMTopBar from '../../../components/layout/PMTopBar';

const C = {
  primary:     '#002D5B',
  primaryHover:'#003d7a',
  white:       '#FFFFFF',
  pageBg:      '#F8FAFC',
  textPrimary: '#0F172A',
  textSec:     '#64748B',
  textTert:    '#94A3B8',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  neutral:     '#F1F5F9',
  success:     '#16A34A',
  danger:      '#DC2626',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const API = 'http://localhost:8001/api';

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'ownership',   label: 'Ownership' },
  { id: 'onboarding',  label: 'Onboarding',  future: true },
  { id: 'maintenance', label: 'Maintenance', future: true },
  { id: 'financial',   label: 'Financial',   future: true },
];

const STATUS_CFG = {
  SUBMITTED: { bg: '#FEF3C7', color: '#92400E', dot: '#D97706',  label: 'Submitted'     },
  PENDING:   { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8',  label: 'Pending invite' },
  ACCEPTED:  { bg: '#F0FDF4', color: '#166534', dot: '#16A34A',  label: 'Accepted'      },
  VERIFIED:  { bg: '#F0FDF4', color: '#166534', dot: '#16A34A',  label: 'Verified'},
  REJECTED:  { bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626',  label: 'Rejected'      },
  EXPIRED:   { bg: '#F1F5F9', color: '#94A3B8', dot: '#CBD5E1',  label: 'Expired'       },
  CANCELLED: { bg: '#F1F5F9', color: '#94A3B8', dot: '#CBD5E1',  label: 'Cancelled'     },
};

const DONUT_COLORS = {
  Pending: '#FCD34D', Submitted: '#002D5B',
  Approved: '#16A34A', Rejected: '#E53E3E', Expired: '#CBD5E1',
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, background:cfg.bg, fontFamily:F.body, fontSize:11, fontWeight:700, color:cfg.color, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

function SectionHead({ icon, label, mt }) {
  return (
    <p style={{ margin:`${mt||16}px 0 10px`, fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textTert, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:6 }}>
      <i className={`ti ${icon}`} style={{ fontSize:13 }} />{label}
    </p>
  );
}

function InfoRow({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:'1px solid '+C.border }}>
      <span style={{ fontFamily:F.body, fontSize:12, color:C.textSec, flexShrink:0, marginRight:12 }}>{label}</span>
      <span style={{ fontFamily:mono?'monospace':F.body, fontSize:12, color:C.textPrimary, fontWeight:500, textAlign:'right', maxWidth:260, wordBreak:'break-all' }}>{value}</span>
    </div>
  );
}

function ActionTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)', background:'#0F172A', color:'#fff', fontFamily:F.body, fontSize:10, fontWeight:600, padding:'4px 8px', borderRadius:5, whiteSpace:'nowrap', pointerEvents:'none', zIndex:200 }}>
          {text}
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'4px solid #0F172A' }} />
        </div>
      )}
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ record, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const name = record?.owner_name || record?.email || '—';
  const prop = record?.property_name || '—';
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.white, borderRadius:14, padding:'28px 32px', maxWidth:460, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#FEF2F2', border:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-x" style={{ fontSize:18, color:C.danger }} />
          </div>
          <div>
            <h2 style={{ margin:0, fontFamily:F.headline, fontSize:17, fontWeight:700, color:C.textPrimary }}>Reject Application</h2>
            <p style={{ margin:0, fontFamily:F.body, fontSize:12, color:C.textSec }}>{name} — {prop}</p>
          </div>
        </div>
        <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:12, color:C.textSec, lineHeight:1.6 }}>
          Please provide a reason for rejection. This will be sent to the owner and recorded in the audit log.
        </p>
        <textarea
          value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. Documents provided are incomplete or illegible. Please resubmit with clear copies of all required documents."
          style={{ width:'100%', height:90, padding:'10px 12px', border:'1px solid '+C.borderMed, borderRadius:8, fontFamily:F.body, fontSize:12, color:C.textPrimary, resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.5 }}
        />
        {!reason.trim() && <p style={{ margin:'4px 0 0', fontFamily:F.body, fontSize:11, color:C.textTert }}>A reason is required before rejecting.</p>}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onCancel} style={{ flex:1, height:40, background:C.white, border:'1px solid '+C.borderMed, borderRadius:8, fontFamily:F.body, fontSize:12, fontWeight:600, color:C.textSec, cursor:'pointer' }}>
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim() || loading}
            style={{ flex:1, height:40, background:!reason.trim()||loading?C.borderMed:C.danger, border:'none', borderRadius:8, fontFamily:F.body, fontSize:12, fontWeight:700, color:C.white, cursor:!reason.trim()||loading?'not-allowed':'pointer', transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
          >
            {loading
              ? <><div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Processing…</>
              : <><i className="ti ti-x" style={{ fontSize:13 }} />Confirm Rejection</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Slide-in Panel ────────────────────────────────────────────────────

function DetailPanel({ record, onClose, onApprove, onReject, actionLoading }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!record) return;
    setLoading(true);
    const token = localStorage.getItem('access_token');
    fetch(`${API}/approvals/${record.id}/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [record?.id]);

  if (!record) return null;

  const profile   = detail?.landlord_profile;
  const invite    = detail?.invite;
  const ownership = detail?.ownership;
  const isDecided = record.status === 'ACCEPTED' || record.status === 'REJECTED';
  const isSubmitted = record.status === 'SUBMITTED';

  const formatDT = (d) => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?';

  const address = profile ? [
    profile.street_address_1, profile.city, profile.state, profile.zip_code, profile.country
  ].filter(Boolean).join(', ') : null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ flex:1, background:'rgba(0,0,0,0.3)' }} />

      {/* Panel */}
      <div style={{ width:500, background:C.white, height:'100%', overflowY:'auto', boxShadow:'-8px 0 32px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column' }}>

        {/* Sticky header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, position:'sticky', top:0, background:C.white, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:C.primary, color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:600, fontFamily:F.body, flexShrink:0 }}>
              {initials(record.owner_name)}
            </div>
            <div>
              <h2 style={{ margin:0, fontFamily:F.headline, fontSize:17, fontWeight:700, color:C.textPrimary }}>{record.owner_name || '—'}</h2>
              <p style={{ margin:'2px 0 0', fontFamily:F.body, fontSize:11, color:C.textTert }}>{record.email}</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <StatusPill status={record.status} />
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:C.textSec }}>
              <i className="ti ti-x" style={{ fontSize:18 }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, padding:'20px 24px', overflowY:'auto' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'24px 0' }}>
              <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
              <span style={{ fontFamily:F.body, fontSize:12, color:C.textTert }}>Loading details…</span>
            </div>
          ) : (
            <>
              {/* Property info */}
              <SectionHead icon="ti-building" label="Property" mt={0} />
              <InfoRow label="Property"     value={record.property_name} />
              <InfoRow label="Equity share" value={ownership?.equity_pct ? `${parseFloat(ownership.equity_pct).toFixed(0)}%` : record.equity_pct ? `${parseFloat(record.equity_pct).toFixed(0)}%` : null} />
              <InfoRow label="Role"         value={ownership?.ownership_role?.replace(/_/g,' ')} />
              <InfoRow label="Invite sent"  value={formatDT(invite?.created_at)} />
              <InfoRow label="Submitted"    value={formatDT(record.submitted_at)} />
              <InfoRow label="Expires"      value={formatDT(invite?.expires_at)} />

              {/* Personal details */}
              <SectionHead icon="ti-user" label="Personal Details" />
              <InfoRow label="First name"  value={profile?.first_name} />
              <InfoRow label="Last name"   value={profile?.last_name} />
              <InfoRow label="Email"       value={record.email} />
              <InfoRow label="Phone"       value={profile?.phone} />
              <InfoRow label="Occupation"  value={profile?.occupation} />
              <InfoRow label="ID type"     value={profile?.id_type} />
              <InfoRow label="ID number"   value={profile?.id_number} />
              <InfoRow label="Address"     value={address} />

              {/* Documents */}
              <SectionHead icon="ti-files" label="Documents" />
              {[
                { label: 'Government ID — Front', url: profile?.id_document_1 },
                { label: 'Government ID — Back',  url: profile?.id_document_2 },
                { label: 'Additional document',   url: profile?.id_document_3 },
              ].map((doc, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:doc.url ? C.neutral : '#FAFBFC', borderRadius:7, marginBottom:6, border:'1px solid '+C.border }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <i className={`ti ${doc.url ? 'ti-file-description' : 'ti-file'}`} style={{ fontSize:14, color:doc.url ? C.primary : C.textTert, flexShrink:0 }} />
                    <div>
                      <p style={{ margin:0, fontFamily:F.body, fontSize:11, fontWeight:600, color:doc.url ? C.textPrimary : C.textTert }}>{doc.label}</p>
                      <p style={{ margin:0, fontFamily:F.body, fontSize:10, color:C.textTert }}>{doc.url ? 'Uploaded' : 'Not uploaded'}</p>
                    </div>
                  </div>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noreferrer"
                      style={{ fontFamily:F.body, fontSize:11, color:C.primary, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                      View <i className="ti ti-external-link" style={{ fontSize:11 }} />
                    </a>
                  )}
                </div>
              ))}

              {/* Readiness checks */}
              <SectionHead icon="ti-checklist" label="Readiness Checks" />
              {[
                { label: 'Profile submitted',       pass: record.status === 'SUBMITTED' || isDecided },
                { label: 'Government ID uploaded',  pass: !!profile?.id_document_1 },
                { label: 'ID back uploaded',        pass: !!profile?.id_document_2 },
                { label: 'Address provided',        pass: !!profile?.street_address_1 },
                { label: 'Phone provided',          pass: !!profile?.phone },
              ].map(({ label, pass }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid '+C.border }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', flexShrink:0, background:pass?C.success:'#FEF2F2', border:pass?'none':'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <i className={`ti ${pass?'ti-check':'ti-x'}`} style={{ fontSize:9, color:pass?C.white:C.danger }} />
                  </div>
                  <span style={{ fontFamily:F.body, fontSize:12, color:C.textPrimary, flex:1 }}>{label}</span>
                  <span style={{ fontFamily:F.body, fontSize:11, fontWeight:600, color:pass?C.success:C.danger }}>{pass?'Pass':'Missing'}</span>
                </div>
              ))}

              {/* Rejection reason if already rejected */}
              {record.status === 'REJECTED' && detail?.rejection_reason && (
                <>
                  <SectionHead icon="ti-alert-circle" label="Rejection Reason" />
                  <div style={{ background:'#FEF2F2', borderRadius:8, padding:'10px 14px', fontFamily:F.body, fontSize:12, color:'#991B1B', lineHeight:1.6 }}>
                    {detail.rejection_reason}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Sticky action footer — only for SUBMITTED */}
        {isSubmitted && (
          <div style={{ padding:'16px 24px', borderTop:'1px solid '+C.border, background:C.white, flexShrink:0, display:'flex', gap:10 }}>
            <button
              onClick={() => onReject(record)}
              disabled={actionLoading}
              style={{ flex:1, height:40, background:C.white, border:'1px solid #FECACA', borderRadius:8, fontFamily:F.body, fontSize:12, fontWeight:600, color:C.danger, cursor:actionLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            >
              <i className="ti ti-x" style={{ fontSize:13 }} />Reject
            </button>
            <button
              onClick={() => onApprove(record.id)}
              disabled={actionLoading}
              style={{ flex:2, height:40, background:actionLoading?C.borderMed:C.primary, border:'none', borderRadius:8, fontFamily:F.body, fontSize:12, fontWeight:700, color:C.white, cursor:actionLoading?'not-allowed':'pointer', transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            >
              {actionLoading
                ? <><div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Processing…</>
                : <><i className="ti ti-check" style={{ fontSize:13 }} />Approve Ownership</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, valueColor }) {
  return (
    <div style={{ width:180, background:C.white, borderRadius:10, padding:'10px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', textAlign:'center' }}>
      <p style={{ margin:'0 0 6px', fontFamily:F.body, fontSize:10, fontWeight:700, color:C.textTert, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
      <p style={{ margin:0, fontFamily:F.headline, fontSize:24, fontWeight:700, color:valueColor, lineHeight:1.1 }}>{value ?? 0}</p>
    </div>
  );
}

// ─── Snap helpers ─────────────────────────────────────────────────────────────

function SnapCard({ accentColor, iconName, iconBg, iconColor, title, children }) {
  return (
    <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:8, display:'flex', overflow:'hidden' }}>
      <div style={{ width:3, background:accentColor, flexShrink:0 }} />
      <div style={{ flex:1, padding:'8px 12px', minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
          <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:iconBg, color:iconColor, fontSize:12 }}>
            <i className={`ti ${iconName}`} />
          </div>
          <span style={{ fontSize:12, fontWeight:600, color:C.textPrimary, fontFamily:F.body }}>{title}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function SnapRow({ name, detail, tag, tagColor, tagBg, onView }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 0', borderTop:'1px solid '+C.border }}>
      <span style={{ fontSize:12, fontWeight:600, color:C.textPrimary, fontFamily:F.body, flexShrink:0 }}>{name}</span>
      <span style={{ fontSize:11, color:C.textSec, fontFamily:F.body, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{detail}</span>
      <span style={{ marginLeft:'auto', fontSize:10, padding:'1px 7px', borderRadius:99, background:tagBg, color:tagColor, fontFamily:F.body, fontWeight:700, flexShrink:0 }}>{tag}</span>
      <div onClick={onView} title="View" style={{ cursor:'pointer', color:C.textTert, fontSize:14, flexShrink:0, paddingLeft:4 }}>
        <i className="ti ti-eye" />
      </div>
    </div>
  );
}

function SnapEmpty({ message }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 0' }}>
      <i className="ti ti-circle-check" style={{ color:C.success, fontSize:13 }} />
      <span style={{ fontSize:11, color:C.textSec, fontFamily:F.body, fontStyle:'italic' }}>{message}</span>
    </div>
  );
}

// ─── Chart tooltips ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:7, padding:'8px 12px', boxShadow:'0 4px 12px rgba(0,0,0,0.08)', fontFamily:F.body, fontSize:12 }}>
      <div style={{ fontWeight:700, color:C.textPrimary, marginBottom:4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display:'flex', alignItems:'center', gap:6, color:C.textSec, marginBottom:2 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
          {p.name}: <span style={{ fontWeight:700, color:C.textPrimary, marginLeft:2 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:7, padding:'7px 12px', boxShadow:'0 4px 12px rgba(0,0,0,0.08)', fontFamily:F.body, fontSize:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:p.payload.fill, flexShrink:0 }} />
        <span style={{ color:C.textSec }}>{p.name}:</span>
        <span style={{ fontWeight:700, color:C.textPrimary }}>{p.value}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PMApprovalsOverview() {
  const navigate = useNavigate();

  const [activeTab,       setActiveTab]       = useState('all');
  const [approvals,       setApprovals]       = useState([]);
  const [stats,           setStats]           = useState({ pending:0, approvedMonth:0, rejectedMonth:0, total:0 });
  const [trendData,       setTrendData]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [searchText,      setSearchText]      = useState('');
  const [statusFilter,    setStatusFilter]    = useState('');
  const [propertyFilter,  setPropertyFilter]  = useState('');
  const [sortOrder,       setSortOrder]       = useState('newest');
  const [properties,      setProperties]      = useState([]);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [successMsg,      setSuccessMsg]      = useState('');
  const [popup,           setPopup]           = useState(null);

  // Panel + modal state
  const [panelRecord,   setPanelRecord]   = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);

  const token   = localStorage.getItem('access_token');
  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  const fetchApprovals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('category', activeTab);
      if (statusFilter)   params.set('status',   statusFilter);
      if (propertyFilter) params.set('property', propertyFilter);
      if (searchText)     params.set('search',   searchText);
      params.set('ordering', sortOrder === 'newest' ? '-created_at' : 'created_at');
      const res  = await fetch(`${API}/approvals/?${params}`, { headers });
      if (!res.ok) throw new Error('Failed to load approvals');
      const data = await res.json();
      setApprovals(data.results ?? data);
      if (data.stats) setStats(data.stats);
      if (data.trend) setTrendData(data.trend);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [activeTab, statusFilter, propertyFilter, searchText, sortOrder]);

  const fetchProperties = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/properties/`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setProperties(data.results ?? data);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchApprovals(); },  [fetchApprovals]);
  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  
  const showSuccess = (msg) => setPopup({ type:'success', title:'Action successful', message:msg });
  const showError   = (msg) => setPopup({ type:'error',   title:'Action not allowed', message:msg });

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/approvals/${id}/approve/`, { method:'POST', headers });
      if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Approval failed');
      }
      showSuccess('Ownership approved successfully.');
      setPanelRecord(null);
      fetchApprovals();
    } catch (e) { showError(e.message); }  
    finally { setActionLoading(false); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/approvals/${rejectTarget.id}/reject/`, {
        method:'POST', headers, body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      showSuccess('Application rejected.');
      setRejectTarget(null);
      setPanelRecord(null);
      fetchApprovals();
    } catch (e) { showError(e.message); }  
    finally { setActionLoading(false); }
  };

  const now = new Date();

  // Priority snapshot
  const submitted      = approvals.filter(a => a.status === 'SUBMITTED');
  const waitingLongest = [...submitted].sort((a,b) => new Date(a.submitted_at)-new Date(b.submitted_at));
  const expiringSoon   = approvals
    .filter(a => a.status==='PENDING' && a.expires_at)
    .map(a => ({ ...a, daysLeft: Math.ceil((new Date(a.expires_at)-now)/86400000) }))
    .filter(a => a.daysLeft<=3 && a.daysLeft>=0)
    .sort((a,b) => a.daysLeft-b.daysLeft);
  const incompleteDocs = submitted.filter(a => !a.id_document_1 || !a.id_document_2);

  // Donut
  const donutData = [
    { name:'Pending',   value:approvals.filter(a=>a.status==='PENDING').length,   fill:DONUT_COLORS.Pending   },
    { name:'Submitted', value:approvals.filter(a=>a.status==='SUBMITTED').length, fill:DONUT_COLORS.Submitted },
    { name:'Approved',  value:approvals.filter(a=>a.status==='ACCEPTED').length,  fill:DONUT_COLORS.Approved  },
    { name:'Rejected',  value:approvals.filter(a=>a.status==='REJECTED').length,  fill:DONUT_COLORS.Rejected  },
    { name:'Expired',   value:approvals.filter(a=>a.status==='EXPIRED').length,   fill:DONUT_COLORS.Expired   },
  ].filter(d => d.value > 0);

  const chartTrend = trendData.length > 0 ? trendData : [
    { week:'Wk 1',Submitted:0,Approved:0,Rejected:0 },
    { week:'Wk 2',Submitted:0,Approved:0,Rejected:0 },
    { week:'Wk 3',Submitted:0,Approved:0,Rejected:0 },
    { week:'Wk 4',Submitted:0,Approved:0,Rejected:0 },
  ];

  const tabCounts = {
    all:       approvals.length,
    ownership: approvals.filter(a=>a.category==='ownership').length,
  };

  const filteredRows = approvals.filter(row => {
    if (activeTab !== 'all' && row.category !== activeTab) return false;
    if (statusFilter   && row.status !== statusFilter) return false;
    if (propertyFilter && String(row.property_id) !== propertyFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        row.owner_name?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        row.property_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const daysSince = (d) => {
    if (!d) return null;
    const days = Math.floor((now-new Date(d))/86400000);
    if (days===0) return 'Today';
    if (days===1) return '1 day ago';
    return `${days} days ago`;
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

  return (
    <div style={{ display:'flex', height:'100vh', background:C.pageBg, fontFamily:F.body, overflow:'hidden' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>

      <NavB activeId="approvals-overview" />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

        {/* Topbar */}
        <PMTopBar />
        <div style={{ height:52, background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', padding:'0 24px', gap:12, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid '+C.borderMed, borderRadius:7, padding:'0 10px', height:32, background:'#F8FAFC', flex:1, maxWidth:300 }}>
            <i className="ti ti-search" style={{ fontSize:13, color:C.textTert, flexShrink:0 }} />
            <input style={{ border:'none', background:'transparent', fontSize:12, color:C.textPrimary, outline:'none', width:'100%', fontFamily:F.body }} placeholder="Search..." />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            <i className="ti ti-bell" style={{ fontSize:18, color:C.textSec }} />
            <span style={{ fontSize:12, color:C.textSec, fontFamily:F.body }}>PM User</span>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:24 }}>


          {/* Breadcrumb + heading */}
          <p style={{ margin:'0 0 4px', fontFamily:F.body, fontSize:11, color:C.textTert }}>PM Portal / Approvals</p>
          <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:26, fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>Approvals</h1>
          <p style={{ margin:'0 0 20px', fontFamily:F.body, fontSize:13, color:C.textSec }}>Review and action pending approval requests across all categories</p>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid '+C.border, marginBottom:20 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const count    = tabCounts[tab.id] ?? 0;
              return (
                <div key={tab.id}
                  onClick={() => !tab.future && setActiveTab(tab.id)}
                  style={{ padding:'10px 18px', cursor:tab.future?'default':'pointer', borderBottom:`2px solid ${isActive?C.primary:'transparent'}`, marginBottom:-1, display:'flex', alignItems:'center', gap:6, opacity:tab.future?0.45:1 }}
                >
                  <span style={{ fontFamily:F.body, fontSize:12, fontWeight:isActive?700:500, color:isActive?C.primary:C.textSec, whiteSpace:'nowrap' }}>{tab.label}</span>
                  <span style={{ background:isActive?C.primary:'#F1F5F9', color:isActive?C.white:'#64748B', fontFamily:F.body, fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:99 }}>
                    {tab.future ? '0' : count}
                  </span>
                  {tab.future && <span style={{ fontFamily:F.body, fontSize:9, color:C.textTert, fontStyle:'italic' }}>coming soon</span>}
                </div>
              );
            })}
          </div>

          {/* ── 4-column top panel ─────────────────────────── */}
          <div style={{ display:'flex', gap:14, marginBottom:22, alignItems:'stretch' }}>

            {/* Col 1 — Stats */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, width:180, flexShrink:0 }}>
              <StatCard label="Pending review"      value={stats.pending}      valueColor="#1D4ED8" />
              <StatCard label="Approved this month" value={stats.approvedMonth} valueColor={C.success} />
              <StatCard label="Rejected this month" value={stats.rejectedMonth} valueColor={C.danger} />
              <StatCard label="Total applications"  value={stats.total}        valueColor={C.textPrimary} />
            </div>

            {/* Col 2 — Priority snapshot */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.textTert, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize:13, color:'#92400E' }} />
                Priority snapshot — needs attention first
              </div>

              <SnapCard accentColor="#DC2626" iconName="ti-clock-hour-4" iconBg="#FEF2F2" iconColor="#DC2626" title="Waiting longest">
                {waitingLongest.length===0
                  ? <SnapEmpty message="No submitted applications waiting" />
                  : waitingLongest.slice(0,2).map(a => <SnapRow key={a.id} name={a.owner_name||a.email} detail={`· ${a.property_name}`} tag={daysSince(a.submitted_at)||'—'} tagBg="#FEF2F2" tagColor="#DC2626" onView={() => setPanelRecord(a)} />)
                }
              </SnapCard>

              <SnapCard accentColor="#FCD34D" iconName="ti-hourglass" iconBg="#FEF3C7" iconColor="#92400E" title="Invite expiring soon">
                {expiringSoon.length===0
                  ? <SnapEmpty message="No invites expiring in 3 days" />
                  : expiringSoon.slice(0,2).map(a => <SnapRow key={a.id} name={a.owner_name||a.email} detail={`· ${a.property_name}`} tag={a.daysLeft===0?'Today':`${a.daysLeft}d left`} tagBg="#FEF3C7" tagColor="#92400E" onView={() => setPanelRecord(a)} />)
                }
              </SnapCard>

              <SnapCard accentColor="#CBD5E1" iconName="ti-file-x" iconBg="#F1F5F9" iconColor="#64748B" title="Incomplete documents">
                {incompleteDocs.length===0
                  ? <SnapEmpty message="All submitted docs are complete" />
                  : incompleteDocs.slice(0,2).map(a => <SnapRow key={a.id} name={a.owner_name||a.email} detail={`· ${a.property_name}`} tag="Docs missing" tagBg="#F1F5F9" tagColor="#64748B" onView={() => setPanelRecord(a)} />)
                }
              </SnapCard>
            </div>

            {/* Col 3 — Trend chart */}
            <div style={{ flex:1.4, minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:10, padding:'14px 16px', height:'100%', boxSizing:'border-box' }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, fontFamily:F.body, marginBottom:2 }}>Approval trend</div>
                <div style={{ fontSize:11, color:C.textSec, fontFamily:F.body, marginBottom:12 }}>Submitted vs approved vs rejected — last 8 weeks</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartTrend} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="week" tick={{ fontSize:10, fill:'#94A3B8', fontFamily:F.body }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10, fill:'#94A3B8', fontFamily:F.body }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="Submitted" stroke="#002D5B" strokeWidth={2} dot={{ r:3, fill:'#002D5B' }} />
                    <Line type="monotone" dataKey="Approved"  stroke="#16A34A" strokeWidth={2} dot={{ r:3, fill:'#16A34A' }} />
                    <Line type="monotone" dataKey="Rejected"  stroke="#DC2626" strokeWidth={2} dot={{ r:3, fill:'#DC2626' }} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
                  {[['#002D5B','Submitted'],['#16A34A','Approved'],['#DC2626','Rejected']].map(([color,label]) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:10, height:2, background:color, borderRadius:2 }} />
                      <span style={{ fontSize:11, color:C.textSec, fontFamily:F.body }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 4 — Donut */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:10, padding:'14px 16px', height:'100%', boxSizing:'border-box' }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, fontFamily:F.body, marginBottom:2 }}>Status breakdown</div>
                <div style={{ fontSize:11, color:C.textSec, fontFamily:F.body, marginBottom:12 }}>Current distribution of all applications</div>
                {donutData.length===0
                  ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, fontSize:12, color:C.textSec, fontFamily:F.body, fontStyle:'italic' }}>No data yet</div>
                  : <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                          {donutData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip content={<DonutTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
                      {donutData.map(d => (
                        <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:d.fill, flexShrink:0 }} />
                            <span style={{ fontSize:11, color:C.textSec, fontFamily:F.body }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:C.textPrimary, fontFamily:F.body }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                }
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 14px' }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:10, fontWeight:700, color:C.textTert, textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap', padding:'0 12px' }}>All pending approvals</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          {/* Filters */}
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:10, padding:'16px 20px', marginBottom:12, display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <span style={{ display:'block', fontFamily:F.body, fontSize:9, fontWeight:700, color:C.textTert, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Search</span>
              <div style={{ display:'flex', alignItems:'center', gap:7, height:30, background:'#F8FAFC', border:'1px solid '+C.borderMed, borderRadius:6, padding:'0 10px' }}>
                <i className="ti ti-search" style={{ fontSize:12, color:C.textTert, flexShrink:0 }} />
                <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Name, email, property…"
                  style={{ border:'none', outline:'none', fontFamily:F.body, fontSize:11, color:C.textPrimary, background:'none', width:'100%' }} />
              </div>
            </div>
            {[
              { label:'Status', value:statusFilter, onChange:setStatusFilter, options:[{v:'',l:'All statuses'},{v:'SUBMITTED',l:'Submitted'},{v:'PENDING',l:'Pending invite'},{v:'VERIFIED',l:'Verified'},{v:'REJECTED',l:'Rejected'}] },
              { label:'Property', value:propertyFilter, onChange:setPropertyFilter, options:[{v:'',l:'All properties'},...properties.map(p=>({v:String(p.id),l:p.name}))] },
              { label:'Sort', value:sortOrder, onChange:setSortOrder, options:[{v:'newest',l:'Newest first'},{v:'oldest',l:'Oldest first'}] },
            ].map(({ label, value, onChange, options }) => (
              <div key={label}>
                <span style={{ display:'block', fontFamily:F.body, fontSize:9, fontWeight:700, color:C.textTert, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</span>
                <select value={value} onChange={e => onChange(e.target.value)}
                  style={{ height:30, padding:'0 10px', border:'1px solid '+C.borderMed, borderRadius:6, fontFamily:F.body, fontSize:11, color:C.textPrimary, background:C.white, minWidth:130 }}>
                  {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:12, overflow:'hidden' }}>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
                <span style={{ fontFamily:F.body, fontSize:13, color:C.textSec }}>Loading approvals…</span>
              </div>
            ) : error ? (
              <div style={{ textAlign:'center', padding:48, color:'#991B1B', fontSize:13, fontFamily:F.body }}>
                {error} — <span style={{ cursor:'pointer', textDecoration:'underline' }} onClick={fetchApprovals}>Retry</span>
              </div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:C.primary }}>
                    {['Applicant','Category','Sub Category','Reference','Submitted','Status','Actions'].map(h => (
                      <th key={h} style={{ padding:'16px 14px', textAlign:'left', fontFamily:F.body, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length===0 ? (
                    <tr><td colSpan={7} style={{ padding:48, textAlign:'center', fontFamily:F.body, fontSize:13, color:C.textSec }}>No approvals match the selected filters</td></tr>
                  ) : filteredRows.map((row, i) => {
                    const isSubmitted = row.status === 'SUBMITTED';
                    return (
                      <tr key={row.id}
                        style={{ borderBottom: i<filteredRows.length-1 ? '1px solid '+C.border : 'none', background:C.white, transition:'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background=C.white}
                      >
                        <td style={{ padding:'12px 14px' }}>
                          <p style={{ margin:'0 0 2px', fontFamily:F.body, fontSize:12, fontWeight:500, color:C.textPrimary }}>{row.owner_name||'—'}</p>
                          <p style={{ margin:0, fontFamily:F.body, fontSize:10, color:C.textSec }}>{row.email}</p>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, display:'inline-block', fontWeight:500, fontFamily:F.body, background:'#E1F5EE', color:'#085041', textTransform:'capitalize' }}>
                            {row.category||'—'}
                          </span>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, display:'inline-block', fontWeight:500, fontFamily:F.body, background: row.sub_category==='Unit' ? '#EEF6FF' : '#F1F5F9', color: row.sub_category==='Unit' ? '#1D4ED8' : '#475569' }}>
                            {row.sub_category||'—'}
                          </span>
                        </td>
                        <td style={{ padding:'12px 14px', fontFamily:F.body, fontSize:12, fontWeight:500, color:C.textPrimary }}>
                          {row.sub_category==='Unit' && row.unit_number
                            ? `${row.property_name||'—'} / Unit ${row.unit_number}`
                            : (row.property_name||'—')
                          }
                          {row.equity_pct && <span style={{ fontSize:10, background:'#F1F5F9', color:'#64748B', borderRadius:99, padding:'1px 8px', marginLeft:6, fontWeight:400 }}>{parseFloat(row.equity_pct).toFixed(0)}%</span>}
                        </td>
                        <td style={{ padding:'12px 14px', fontFamily:F.body, fontSize:12, color:C.textSec, whiteSpace:'nowrap' }}>{fmtDate(row.submitted_at)}</td>
                        <td style={{ padding:'12px 14px' }}><StatusPill status={row.status} /></td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            {/* Approve — enabled only when SUBMITTED */}
                            <ActionTooltip text={isSubmitted ? 'Approve' : 'Not yet submitted'}>
                              <button
                                onClick={() => isSubmitted && handleApprove(row.id)}
                                style={{ width:32, height:32, background:'transparent', border:'none', borderRadius:7, cursor:isSubmitted?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', opacity:isSubmitted?1:0.3, transition:'all 0.15s' }}
                                onMouseEnter={e => { if(isSubmitted) e.currentTarget.style.background='#F0FDF4'; }}
                                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                              >
                                <i className="ti ti-check" style={{ fontSize:15, color:'#16A34A' }} />
                              </button>
                            </ActionTooltip>
                            {/* Reject — enabled only when SUBMITTED */}
                            <ActionTooltip text={isSubmitted ? 'Reject' : 'Not yet submitted'}>
                              <button
                                onClick={() => isSubmitted && setRejectTarget(row)}
                                style={{ width:32, height:32, background:'transparent', border:'none', borderRadius:7, cursor:isSubmitted?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', opacity:isSubmitted?1:0.3, transition:'all 0.15s' }}
                                onMouseEnter={e => { if(isSubmitted) e.currentTarget.style.background='#FEF2F2'; }}
                                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                              >
                                <i className="ti ti-x" style={{ fontSize:15, color:'#DC2626' }} />
                              </button>
                            </ActionTooltip>
                            {/* Eye — always enabled */}
                            <ActionTooltip text="View details">
                              <button
                                onClick={() => setPanelRecord(row)}
                                style={{ width:32, height:32, background:'transparent', border:'none', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background='#EFF6FF'}
                                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                              >
                                <i className="ti ti-eye" style={{ fontSize:15, color:C.textSec }} />
                              </button>
                            </ActionTooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p style={{ textAlign:'center', fontFamily:F.body, fontSize:10, color:C.textTert, margin:'16px 0 8px', letterSpacing:'0.04em' }}>© 2026 URBANNEST. ALL RIGHTS RESERVED.</p>
        </div>
      </div>

      {/* Slide-in detail panel */}
      {panelRecord && (
        <DetailPanel
          record={panelRecord}
          onClose={() => setPanelRecord(null)}
          onApprove={handleApprove}
          onReject={(rec) => { setPanelRecord(null); setRejectTarget(rec); }}
          actionLoading={actionLoading}
        />
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          record={rejectTarget}
          loading={actionLoading}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* System popup */}
      {popup && (
        <UNPopup
          type={popup.type}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={popup.onConfirm}
          confirmLabel={popup.confirmLabel}
          loading={actionLoading}
        />
      )}

    </div>
  );
}
