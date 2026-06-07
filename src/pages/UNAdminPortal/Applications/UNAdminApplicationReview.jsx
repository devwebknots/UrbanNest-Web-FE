import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const API_BASE = 'http://localhost:8001';

const C = {
  primary:'#002D5B', primaryHover:'#003d7a', pageBg:'#F8FAFC',
  border:'#E2E8F0', borderMedium:'#CBD5E1',
  textPrimary:'#0F172A', textSecondary:'#64748B', textTertiary:'#94A3B8',
  white:'#FFFFFF', neutral:'#F1F5F9',
  green:'#16A34A', danger:'#DC2626',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label:'Pending',   bg:'#EFF6FF', color:'#1D4ED8', dot:'#1D4ED8' },
  APPROVED:  { label:'Approved',  bg:'#F0FDF4', color:'#166534', dot:'#16A34A' },
  REJECTED:  { label:'Rejected',  bg:'#FEF2F2', color:'#991B1B', dot:'#DC2626' },
  DRAFT:     { label:'Draft',     bg:'#FEF3C7', color:'#92400E', dot:'#F59E0B' },
  SUSPENDED: { label:'Suspended', bg:'#FEF2F2', color:'#991B1B', dot:'#DC2626' },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || { label:status, bg:C.neutral, color:C.textSecondary, dot:C.textTertiary };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'99px', background:cfg.bg, fontFamily:F.body, fontSize:'11px', fontWeight:700, color:cfg.color, whiteSpace:'nowrap' }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:cfg.dot, flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

// ─── Tooltip wrapper ─────────────────────────────────────────────────────────
function Tooltip({ text, children }) {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)', background:'#0F172A', color:'#fff', fontFamily:"'Nunito Sans', sans-serif", fontSize:'10px', fontWeight:600, padding:'4px 8px', borderRadius:'5px', whiteSpace:'nowrap', pointerEvents:'none', zIndex:100 }}>
          {text}
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'4px solid #0F172A' }} />
        </div>
      )}
    </div>
  );
}

// ─── Country flag helper ──────────────────────────────────────────────────────
const COUNTRY_FLAGS = { US:'🇺🇸', IN:'🇮🇳', AE:'🇦🇪', GB:'🇬🇧', AU:'🇦🇺', CA:'🇨🇦', SG:'🇸🇬' };
function CountryCell({ code }) {
  const flag = COUNTRY_FLAGS[code] || '🌐';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontFamily:"'Nunito Sans', sans-serif", fontSize:'12px', color:'#64748B' }}>
      <span style={{ fontSize:'14px', lineHeight:1 }}>{flag}</span>{code || '—'}
    </span>
  );
}

// ─── Compact filter select ────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <span style={{ fontFamily:F.body, fontSize:'9px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ height:'30px', padding:'0 28px 0 10px', border:'1px solid '+C.borderMedium, borderRadius:'6px', fontFamily:F.body, fontSize:'11px', color:C.textPrimary, background:C.white, cursor:'pointer', outline:'none', appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 8px center', minWidth:'130px' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────────
function RejectModal({ org, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.white, borderRadius:'14px', padding:'28px 32px', maxWidth:'460px', width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#FEF2F2', border:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-x" style={{ fontSize:'18px', color:C.danger }} />
          </div>
          <div>
            <h2 style={{ margin:0, fontFamily:F.headline, fontSize:'17px', fontWeight:700, color:C.textPrimary }}>Reject Application</h2>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:C.textSecondary }}>{org?.company_name}</p>
          </div>
        </div>
        <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, lineHeight:1.6 }}>
          Please provide a reason for rejection. This will be visible to the applicant.
        </p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Documents provided are incomplete or illegible. Please resubmit with clear copies of all required documents."
          style={{ width:'100%', height:'90px', padding:'10px 12px', border:'1px solid '+C.borderMedium, borderRadius:'8px', fontFamily:F.body, fontSize:'12px', color:C.textPrimary, resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.5 }} />
        {!reason.trim() && <p style={{ margin:'4px 0 0', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>A reason is required before rejecting.</p>}
        <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
          <button onClick={onCancel} style={{ flex:1, height:'40px', background:C.white, border:'1px solid '+C.borderMedium, borderRadius:'8px', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textSecondary, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim() || loading}
            style={{ flex:1, height:'40px', background:!reason.trim()||loading?C.borderMedium:C.danger, border:'none', borderRadius:'8px', fontFamily:F.body, fontSize:'12px', fontWeight:700, color:C.white, cursor:!reason.trim()||loading?'not-allowed':'pointer', transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            {loading ? <><div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Processing…</> : <><i className="ti ti-x" style={{ fontSize:'13px' }} />Confirm Rejection</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail info row helper ───────────────────────────────────────────────────
function InfoRow({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:'1px solid '+C.border }}>
      <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textSecondary, flexShrink:0, marginRight:'12px' }}>{label}</span>
      <span style={{ fontFamily:mono?'monospace':F.body, fontSize:'12px', color:C.textPrimary, fontWeight:500, textAlign:'right', maxWidth:'260px', wordBreak:'break-all' }}>{value}</span>
    </div>
  );
}

// ─── Section heading helper ───────────────────────────────────────────────────
function SectionHead({ icon, label, mt }) {
  return (
    <p style={{ margin:`${mt||16}px 0 10px`, fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:'6px' }}>
      <i className={'ti '+icon} style={{ fontSize:'13px' }} />{label}
    </p>
  );
}

// ─── View detail slide-in panel ───────────────────────────────────────────────
function DetailPanel({ org, onClose, onApprove, onReject, actionLoading }) {
  const [subscription,   setSubscription]   = useState(null);   // null=loading, false=none
  const [paymentMethod,  setPaymentMethod]  = useState(null);
  const [billingLoading, setBillingLoading] = useState(true);

  // Fetch subscription + payment method when panel opens
  useEffect(() => {
    if (!org) return;
    const token      = localStorage.getItem('access_token');
    const accountNum = org.account_info?.account_number;
    if (!token || !accountNum) { setBillingLoading(false); return; }

    const encoded = encodeURIComponent(accountNum);

    Promise.all([
      fetch(`${API_BASE}/api/admin/billing/subscriptions/?account_number=${encoded}`,
        { headers:{ Authorization:'Bearer '+token } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const list = Array.isArray(data) ? data : (data?.results || []);
          setSubscription(list[0] || false);
        })
        .catch(() => setSubscription(false)),

      fetch(`${API_BASE}/api/admin/billing/payment-methods/?account_number=${encoded}`,
        { headers:{ Authorization:'Bearer '+token } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const list = Array.isArray(data) ? data : (data?.results || []);
          setPaymentMethod(list.find(p => p.is_default) || list[0] || false);
        })
        .catch(() => setPaymentMethod(false)),
    ]).finally(() => setBillingLoading(false));
  }, [org?.id]);

  if (!org) return null;
  const ai = org.account_info || {};

  const INTEGRATION_LABELS = {
    MANUAL:'Manual Entry', CSV:'CSV Import', API:'API Integration',
    MIGRATE:'Full Migration', SYNC:'Parallel Sync',
  };
  const SCENARIO_LABELS = {
    A:'Scenario A — New Setup',
    B:'Scenario B — Data Migration',
    C:'Scenario C — Parallel Sync',
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex' }}>
      <div onClick={onClose} style={{ flex:1, background:'rgba(0,0,0,0.3)' }} />
      <div style={{ width:'500px', background:C.white, height:'100%', overflowY:'auto', boxShadow:'-8px 0 32px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column' }}>

        {/* ── Panel header ── */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, position:'sticky', top:0, background:C.white, zIndex:10 }}>
          <div>
            <h2 style={{ margin:0, fontFamily:F.headline, fontSize:'17px', fontWeight:700, color:C.textPrimary }}>{org.company_name}</h2>
            <p style={{ margin:'2px 0 0', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>{ai.application_number}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <StatusPill status={org.status} />
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:C.textSecondary }}>
              <i className="ti ti-x" style={{ fontSize:'18px' }} />
            </button>
          </div>
        </div>

        <div style={{ flex:1, padding:'20px 24px', overflowY:'auto' }}>

          {/* ── 1. Company Information ── */}
          <SectionHead icon="ti-building-skyscraper" label="Company Information" mt={0} />
          <InfoRow label="Account No."      value={ai.account_number} mono />
          <InfoRow label="Registration No." value={org.company_reg_number} />
          <InfoRow label="Company Type"     value={org.company_type} />
          <InfoRow label="Country"          value={org.country} />
          <InfoRow label="City"             value={org.city} />
          <InfoRow label="State"            value={org.state} />
          <InfoRow label="Website"          value={org.website} />
          <InfoRow label="Units Under Mgmt" value={org.unit_count} />
          <InfoRow label="Scenario"         value={SCENARIO_LABELS[org.scenario] || org.scenario} />

          {/* ── 2. Integration Method ── */}
          <SectionHead icon="ti-plug-connected" label="Integration Method" />
          {org.integration_method ? (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:C.neutral, borderRadius:'8px' }}>
              <i className="ti ti-plug-connected" style={{ fontSize:'16px', color:C.primary, flexShrink:0 }} />
              <div>
                <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>
                  {INTEGRATION_LABELS[org.integration_method] || org.integration_method}
                </p>
                <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', color:C.textTertiary }}>Selected by applicant</p>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily:F.body, fontSize:'12px', color:C.textTertiary, fontStyle:'italic' }}>Not set</p>
          )}

          {/* ── 3. Subscription / Plan ── */}
          <SectionHead icon="ti-credit-card" label="Subscription & Plan" />
          {billingLoading ? (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 0' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
              <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Loading…</span>
            </div>
          ) : subscription ? (
            <div style={{ background:C.neutral, borderRadius:'8px', padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                <div>
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', fontWeight:700, color:C.textPrimary }}>{subscription.plan_name || subscription.plan?.name || 'Plan'}</p>
                  <p style={{ margin:'2px 0 0', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>
                    {subscription.billing_cycle === 'ANNUAL' ? 'Annual billing' : 'Monthly billing'}
                  </p>
                </div>
                <span style={{ fontFamily:F.body, fontSize:'11px', fontWeight:700, color:C.primary, background:'#EFF6FF', padding:'3px 10px', borderRadius:'99px' }}>
                  {subscription.status || 'TRIAL'}
                </span>
              </div>
              <InfoRow label="Trial start"   value={formatDate(subscription.trial_start)} />
              <InfoRow label="Trial end"     value={formatDate(subscription.trial_end)} />
              <InfoRow label="Next billing"  value={subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'Set on approval'} />
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 10px', background:'#FEF3C7', borderRadius:'7px' }}>
              <i className="ti ti-alert-triangle" style={{ fontSize:'13px', color:'#92400E' }} />
              <span style={{ fontFamily:F.body, fontSize:'12px', color:'#92400E' }}>No subscription on file</span>
            </div>
          )}

          {/* ── 4. Payment Method ── */}
          <SectionHead icon="ti-credit-card" label="Payment Method" />
          {billingLoading ? (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 0' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
              <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Loading…</span>
            </div>
          ) : paymentMethod ? (
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background:C.neutral, borderRadius:'8px' }}>
              <i className="ti ti-credit-card" style={{ fontSize:'20px', color:C.primary, flexShrink:0 }} />
              <div>
                <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>
                  {paymentMethod.card_brand || 'Card'} ending in {paymentMethod.last4}
                </p>
                <p style={{ margin:'2px 0 0', fontFamily:F.body, fontSize:'10px', color:C.textTertiary }}>
                  {paymentMethod.gateway} · {paymentMethod.is_default ? 'Default' : 'On file'}
                </p>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'4px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'99px', padding:'2px 8px' }}>
                <i className="ti ti-circle-check" style={{ fontSize:'11px', color:C.green }} />
                <span style={{ fontFamily:F.body, fontSize:'10px', color:C.green, fontWeight:600 }}>Saved</span>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 10px', background:'#FEF3C7', borderRadius:'7px' }}>
              <i className="ti ti-alert-triangle" style={{ fontSize:'13px', color:'#92400E' }} />
              <span style={{ fontFamily:F.body, fontSize:'12px', color:'#92400E' }}>No payment method on file</span>
            </div>
          )}

          {/* ── 5. Liaison ── */}
          <SectionHead icon="ti-user-shield" label="Liaison / Super Admin" />
          <InfoRow label="Name"       value={org.liaison_name} />
          <InfoRow label="Email"      value={org.liaison_email} />
          <InfoRow label="Department" value={org.liaison_department} />

          {/* ── 6. Documents ── */}
          {org.documents?.length > 0 && (
            <>
              <SectionHead icon="ti-files" label={`Documents (${org.documents.length})`} />
              {org.documents.map(doc => (
                <div key={doc.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:C.neutral, borderRadius:'7px', marginBottom:'6px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <i className="ti ti-file-description" style={{ fontSize:'14px', color:C.textSecondary, flexShrink:0 }} />
                    <div>
                      <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', fontWeight:600, color:C.textPrimary }}>{doc.doc_type}</p>
                      <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', color:doc.verified?C.green:C.textTertiary }}>
                        {doc.verified ? '✓ Verified' : 'Pending verification'}
                      </p>
                    </div>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      style={{ fontFamily:F.body, fontSize:'11px', color:C.primary, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px', flexShrink:0 }}>
                      View <i className="ti ti-external-link" style={{ fontSize:'11px' }} />
                    </a>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── 7. Readiness summary ── */}
          <SectionHead icon="ti-checklist" label="Readiness Checks" />
          {[
            { label:'Documents uploaded',      pass: org.documents?.length > 0 },
            { label:'Plan selected',           pass: !!subscription },
            { label:'Payment method on file',  pass: !!paymentMethod },
            { label:'Company info complete',   pass: !!(org.company_name && org.company_reg_number && org.unit_count != null) },
            { label:'Integration method set',  pass: !!org.integration_method },
          ].map(({ label, pass }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 0', borderBottom:'1px solid '+C.border }}>
              <div style={{ width:'16px', height:'16px', borderRadius:'50%', flexShrink:0, background:pass?C.green:'#FEF2F2', border:pass?'none':'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className={'ti '+(pass?'ti-check':'ti-x')} style={{ fontSize:'9px', color:pass?C.white:C.danger }} />
              </div>
              <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textPrimary, flex:1 }}>{label}</span>
              <span style={{ fontFamily:F.body, fontSize:'11px', fontWeight:600, color:pass?C.green:C.danger }}>{pass?'Pass':'Fail'}</span>
            </div>
          ))}

        </div>

        {/* ── Action footer — PENDING only ── */}
        {org.status === 'PENDING' && (
          <div style={{ padding:'16px 24px', borderTop:'1px solid '+C.border, background:C.white, flexShrink:0, display:'flex', gap:'10px' }}>
            <button onClick={() => onReject(org)} disabled={actionLoading}
              style={{ flex:1, height:'40px', background:C.white, border:'1px solid #FECACA', borderRadius:'8px', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.danger, cursor:actionLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <i className="ti ti-x" style={{ fontSize:'13px' }} />Reject
            </button>
            <button onClick={() => onApprove(org.id)} disabled={actionLoading}
              style={{ flex:2, height:'40px', background:actionLoading?C.borderMedium:C.primary, border:'none', borderRadius:'8px', fontFamily:F.body, fontSize:'12px', fontWeight:700, color:C.white, cursor:actionLoading?'not-allowed':'pointer', transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              {actionLoading
                ? <><div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Processing…</>
                : <><i className="ti ti-check" style={{ fontSize:'13px' }} />Approve Application</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key:'ORG_PMS',        label:'Org PMS',           live:true  },
  { key:'INDEPENDENT_PM', label:'Independent PM',    live:false },
  { key:'LANDLORD',       label:'Landlord',          live:false },
  { key:'REAL_ESTATE',    label:'Real Estate Agent', live:false },
  { key:'RENTER',         label:'Renter',            live:false },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function UNAdminApplicationReview() {
  const navigate = useNavigate();

  const [activeTab,      setActiveTab]      = useState('ORG_PMS');
  const [records,        setRecords]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [apiError,       setApiError]       = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');

  // Filters
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [filterCountry,  setFilterCountry]  = useState('ALL');
  const [filterSort,     setFilterSort]     = useState('NEWEST');
  const [searchQuery,    setSearchQuery]    = useState('');

  // Modals
  const [rejectTarget,   setRejectTarget]   = useState(null);
  const [detailRecord,   setDetailRecord]   = useState(null);

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Stats derived from records
  const pending   = records.filter(r => r.status === 'PENDING').length;
  const approved  = records.filter(r => r.status === 'APPROVED').length;
  const rejected  = records.filter(r => r.status === 'REJECTED').length;

  const fetchRecords = () => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/'); return; }
    setLoading(true);
    setApiError('');
    fetch(`${API_BASE}/api/admin/org-pms/`, { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        setRecords(list);
        setLoading(false);
      })
      .catch(() => { setApiError('Could not load applications.'); setLoading(false); });
  };

  useEffect(() => { fetchRecords(); }, [activeTab]);

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (orgId) => {
    setActionLoading(true);
    setApiError('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/api/admin/org-pms/${orgId}/approve/`, {
        method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || 'Could not approve.'); setActionLoading(false); return; }
      setSuccessMsg(`${data.message}`);
      setDetailRecord(null);
      fetchRecords();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch { setApiError('Connection error.'); }
    setActionLoading(false);
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    setApiError('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/api/admin/org-pms/${rejectTarget.id}/reject/`, {
        method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || 'Could not reject.'); setActionLoading(false); return; }
      setSuccessMsg(`${data.message}`);
      setRejectTarget(null);
      setDetailRecord(null);
      fetchRecords();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch { setApiError('Connection error.'); }
    setActionLoading(false);
  };

  // ── Filtered + sorted records ─────────────────────────────────────────────
  const filtered = records
    .filter(r => filterStatus  === 'ALL' || r.status  === filterStatus)
    .filter(r => filterCountry === 'ALL' || r.country === filterCountry)
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.company_name?.toLowerCase().includes(q) ||
        r.account_info?.account_number?.toLowerCase().includes(q) ||
        r.account_info?.application_number?.toLowerCase().includes(q) ||
        r.liaison_email?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (filterSort === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
      return new Date(a.created_at) - new Date(b.created_at);
    });

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  };

  const countries = [...new Set(records.map(r => r.country).filter(Boolean))];

  // Reset to page 1 when filters change
  React.useEffect(() => { setCurrentPage(1); }, [filterStatus, filterCountry, filterSort, searchQuery]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadein { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
        .review-table tr:hover td { background: #F8FAFC; }
        .icon-btn { transition: background 0.15s, border-color 0.15s; }
        .icon-btn-approve:hover { background: #F0FDF4 !important; border-color: #16A34A !important; }
        .icon-btn-reject:hover  { background: #FEF2F2 !important; border-color: #DC2626 !important; }
        .icon-btn-view:hover    { background: #EFF6FF !important; border-color: #93C5FD !important; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom:'20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <p style={{ margin:'0 0 4px', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Operations / Application Review</p>
          <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'26px', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>Application Review</h1>
          <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary }}>Review and action pending persona applications across all registration types</p>
        </div>
      </div>

      {/* ── Success / error banners ── */}
      {successMsg && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', animation:'fadein 0.25s ease' }}>
          <i className="ti ti-circle-check" style={{ fontSize:'15px', color:C.green, flexShrink:0 }} />
          <span style={{ fontFamily:F.body, fontSize:'12px', color:'#166534' }}>{successMsg}</span>
        </div>
      )}
      {apiError && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
          <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:C.danger, flexShrink:0 }} />
          <span style={{ fontFamily:F.body, fontSize:'12px', color:C.danger }}>{apiError}</span>
        </div>
      )}

      {/* ── Persona tabs ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'0', borderBottom:'1px solid '+C.border, marginBottom:'20px' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count    = tab.key === 'ORG_PMS' ? pending : 0;
          return (
            <div key={tab.key} onClick={() => tab.live && setActiveTab(tab.key)}
              style={{ padding:'10px 18px', cursor:tab.live?'pointer':'default', borderBottom:`2px solid ${isActive?C.primary:'transparent'}`, marginBottom:'-1px', display:'flex', alignItems:'center', gap:'6px', transition:'border-color 0.15s' }}>
              <span style={{ fontFamily:F.body, fontSize:'12px', fontWeight:isActive?700:500, color:isActive?C.primary:tab.live?C.textSecondary:C.textTertiary, whiteSpace:'nowrap' }}>
                {tab.label}
              </span>
              {tab.live && count > 0 && (
                <span style={{ background:'#EFF6FF', color:'#1D4ED8', fontFamily:F.body, fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'99px' }}>{count}</span>
              )}
              {!tab.live && (
                <span style={{ fontFamily:F.body, fontSize:'9px', color:C.textTertiary }}>coming soon</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Stat cards — fixed width, centered, don't stretch full row ── */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px' }}>
        {[
          { label:'Pending review',       val:pending,        color:'#1D4ED8' },
          { label:'Approved this month',  val:approved,       color:C.green   },
          { label:'Rejected this month',  val:rejected,       color:C.danger  },
          { label:'Total applications',   val:records.length, color:C.textPrimary },
        ].map(s => (
          <div key={s.label} style={{ width:'180px', background:C.white, borderRadius:'10px', padding:'10px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', textAlign:'center' }}>
            <p style={{ margin:'0 0 6px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</p>
            <p style={{ margin:0, fontFamily:F.headline, fontSize:'24px', fontWeight:700, color:s.color, lineHeight:1.1 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* ── Filters row — white container card ── */}
      <div style={{ background:C.white, borderRadius:'10px', padding:'16px 20px', marginBottom:'8px', borderRadius:'10px', boxShadow:'none', border:'1px solid '+C.border, display:'flex', alignItems:'flex-end', gap:'12px', flexWrap:'wrap' }}>
        {/* Search */}
        <div style={{ flex:1, minWidth:'200px' }}>
          <span style={{ display:'block', fontFamily:F.body, fontSize:'9px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Search</span>
          <div style={{ display:'flex', alignItems:'center', gap:'7px', height:'30px', background:'#F8FAFC', border:'1px solid '+C.borderMedium, borderRadius:'6px', padding:'0 10px' }}>
            <i className="ti ti-search" style={{ fontSize:'12px', color:C.textTertiary, flexShrink:0 }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Company, account no., email…"
              style={{ border:'none', outline:'none', fontFamily:F.body, fontSize:'11px', color:C.textPrimary, background:'none', width:'100%' }} />
          </div>
        </div>
        <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus}
          options={[{value:'ALL',label:'All statuses'},{value:'PENDING',label:'Pending'},{value:'APPROVED',label:'Approved'},{value:'REJECTED',label:'Rejected'},{value:'DRAFT',label:'Draft'}]} />
        <FilterSelect label="Country" value={filterCountry} onChange={setFilterCountry}
          options={[{value:'ALL',label:'All countries'}, ...countries.map(c => ({value:c,label:c}))]} />
        <FilterSelect label="Sort" value={filterSort} onChange={setFilterSort}
          options={[{value:'NEWEST',label:'Newest first'},{value:'OLDEST',label:'Oldest first'}]} />
      </div>

      {/* ── Table ── */}
      <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'48px', gap:'10px' }}>
            <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
            <span style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary }}>Loading applications…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 24px' }}>
            <i className="ti ti-clipboard-x" style={{ fontSize:'32px', color:C.textTertiary }} />
            <p style={{ fontFamily:F.headline, fontSize:'15px', fontWeight:700, color:C.textPrimary, marginTop:'12px', marginBottom:'6px' }}>No applications found</p>
            <p style={{ fontFamily:F.body, fontSize:'12px', color:C.textSecondary }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="review-table" style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#002D5B' }}>
                {['Company','Account No.','Applicant','Country','Submitted','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'16px 14px', textAlign:'left', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((rec, i) => (
                <tr key={rec.id} style={{ borderBottom: i < paginated.length-1 ? '1px solid '+C.border : 'none' }}>
                  <td style={{ padding:'12px 14px' }}>
                    <p style={{ margin:'0 0 2px', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>{rec.company_name}</p>
                    <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', color:C.textSecondary, fontWeight:400 }}>{rec.account_info?.application_number}</p>
                  </td>
                  <td style={{ padding:'12px 14px', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, whiteSpace:'nowrap' }}>{rec.account_info?.account_number || '—'}</td>
                  <td style={{ padding:'12px 14px', fontFamily:F.body, fontSize:'12px', color:C.textSecondary }}>{rec.liaison_email || '—'}</td>
                  <td style={{ padding:'12px 14px' }}><CountryCell code={rec.country} /></td>
                  <td style={{ padding:'12px 14px', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, whiteSpace:'nowrap' }}>{formatDate(rec.created_at)}</td>
                  <td style={{ padding:'12px 14px' }}><StatusPill status={rec.status} /></td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      {rec.status === 'PENDING' && (
                        <>
                          <Tooltip text="Approve">
                            <button className="icon-btn icon-btn-approve"
                              onClick={() => handleApprove(rec.id)} disabled={actionLoading}
                              style={{ width:'32px', height:'32px', background:'transparent', border:'none', borderRadius:'7px', cursor:actionLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <i className="ti ti-check" style={{ fontSize:'15px', color:'#16A34A' }} />
                            </button>
                          </Tooltip>
                          <Tooltip text="Reject">
                            <button className="icon-btn icon-btn-reject"
                              onClick={() => setRejectTarget(rec)} disabled={actionLoading}
                              style={{ width:'32px', height:'32px', background:'transparent', border:'none', borderRadius:'7px', cursor:actionLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <i className="ti ti-x" style={{ fontSize:'15px', color:'#DC2626' }} />
                            </button>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip text="View details">
                        <button className="icon-btn icon-btn-view"
                          onClick={() => setDetailRecord(rec)}
                          style={{ width:'32px', height:'32px', background:'transparent', border:'none', borderRadius:'7px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <i className="ti ti-eye" style={{ fontSize:'15px', color:C.textSecondary }} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px', margin:'16px 0 8px' }}>
          {/* Prev */}
          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
            style={{ width:'32px', height:'32px', background:C.white, border:'1px solid '+C.borderMedium, borderRadius:'7px', cursor:currentPage===1?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:currentPage===1?C.textTertiary:C.textPrimary, opacity:currentPage===1?0.4:1 }}>
            <i className="ti ti-chevron-left" style={{ fontSize:'13px' }} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx-1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) => p === '...'
              ? <span key={'e'+idx} style={{ width:'32px', textAlign:'center', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>…</span>
              : <button key={p} onClick={() => setCurrentPage(p)}
                  style={{ width:'32px', height:'32px', background:p===currentPage?C.primary:C.white, border:'1px solid '+(p===currentPage?C.primary:C.borderMedium), borderRadius:'7px', cursor:'pointer', fontFamily:F.body, fontSize:'12px', fontWeight:p===currentPage?700:400, color:p===currentPage?C.white:C.textPrimary }}>
                  {p}
                </button>
            )
          }

          {/* Next */}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}
            style={{ width:'32px', height:'32px', background:C.white, border:'1px solid '+C.borderMedium, borderRadius:'7px', cursor:currentPage===totalPages?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:currentPage===totalPages?C.textTertiary:C.textPrimary, opacity:currentPage===totalPages?0.4:1 }}>
            <i className="ti ti-chevron-right" style={{ fontSize:'13px' }} />
          </button>
        </div>
      )}

      <p style={{ textAlign:'center', fontFamily:F.body, fontSize:'10px', color:C.textTertiary, margin:'16px 0 8px', letterSpacing:'0.04em' }}>© 2026 URBANNEST. ALL RIGHTS RESERVED.</p>

      {/* ── Modals ── */}
      {rejectTarget && (
        <RejectModal org={rejectTarget} loading={actionLoading}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)} />
      )}
      {detailRecord && (
        <DetailPanel org={detailRecord} actionLoading={actionLoading}
          onClose={() => setDetailRecord(null)}
          onApprove={handleApprove}
          onReject={(org) => { setDetailRecord(null); setRejectTarget(org); }} />
      )}
    </>
  );
}
