import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';

const C = {
  primary:      '#002D5B',
  primaryHover: '#003d7a',
  white:        '#FFFFFF',
  pageBg:       '#F1F5F9',
  cardBg:       '#FFFFFF',
  border:       '#E2E8F0',
  borderMed:    '#CBD5E1',
  inputBg:      '#F8F9FA',
  textPrimary:  '#0F172A',
  textSec:      '#64748B',
  textTert:     '#94A3B8',
  success:      '#16A34A',
  successLight: '#F0FDF4',
  amberBg:      '#FEF3C7',
  amberBorder:  '#FCD34D',
  amberText:    '#92400E',
  navBg:        '#111827',
  danger:       '#E53E3E',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};





const API = 'http://localhost:8001/api';

// ─── Reusable sub-components ──────────────────────────────────────────────────

const FieldRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textSec, fontWeight: 500, fontFamily: F.body }}>
      {label}
    </div>
    <div style={{ fontSize: 11, color: value ? C.textPrimary : C.textSec, fontFamily: F.body, fontStyle: value ? 'normal' : 'italic' }}>
      {value || 'Not provided'}
    </div>
  </div>
);

const SectionCard = ({ title, icon, children, style: extra }) => (
  <div style={{
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.06)',
    borderRadius: 10,
    padding: '16px 18px',
    ...extra,
  }}>
    {title && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 10, fontWeight: 500, color: C.textSec,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        fontFamily: F.body, marginBottom: 14,
        paddingBottom: 10, borderBottom: '0.5px solid rgba(0,0,0,0.05)',
      }}>
        {icon && <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 14 }} />}
        {title}
      </div>
    )}
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    SUBMITTED: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', label: 'Submitted' },
    PENDING:   { bg: '#F1F5F9', color: '#64748B', border: 'rgba(0,0,0,0.06)', label: 'Pending invite' },
    ACCEPTED:  { bg: '#EAF3DE', color: '#166534', border: 'rgba(22,163,74,0.2)', label: 'Accepted' },
    REJECTED:  { bg: '#FCEBEB', color: '#991B1B', border: 'rgba(229,62,62,0.2)', label: 'Rejected' },
    EXPIRED:   { bg: '#F1F5F9', color: '#94A3B8', border: 'rgba(0,0,0,0.06)', label: 'Expired' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{
      fontSize: 10, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color,
      border: `0.5px solid ${s.border}`,
      fontFamily: F.body, fontWeight: 500,
    }}>
      ● {s.label}
    </span>
  );
};

const DocRow = ({ label, docType, fileUrl, missing }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 0', borderBottom: '0.5px solid rgba(0,0,0,0.04)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <i
        className={missing ? 'ti ti-file' : 'ti ti-file-text'}
        aria-hidden="true"
        style={{ fontSize: 16, color: missing ? '#CBD5E1' : '#0C447C' }}
      />
      <div>
        <div style={{ fontSize: 11, color: missing ? C.textSec : C.textPrimary, fontFamily: F.body, fontStyle: missing ? 'italic' : 'normal' }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: C.textSec, fontFamily: F.body }}>
          {docType}
        </div>
      </div>
    </div>
    {!missing && fileUrl && (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 10, padding: '3px 10px',
          border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 5,
          color: C.textSec, background: '#FAFBFC',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: F.body,
        }}
      >
        <i className="ti ti-eye" aria-hidden="true" style={{ fontSize: 12 }} /> View
      </a>
    )}
    {missing && (
      <span style={{ fontSize: 10, color: '#CBD5E1', fontFamily: F.body, fontStyle: 'italic' }}>
        Not uploaded
      </span>
    )}
  </div>
);

const TimelineItem = ({ label, date, isFirst, isLast }) => (
  <div style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 14, position: 'relative' }}>
    <div style={{ position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isFirst ? C.primary : '#CBD5E1',
        zIndex: 1, marginTop: 4,
      }} />
      {!isLast && (
        <div style={{ width: 1, flex: 1, background: 'rgba(0,0,0,0.08)', marginTop: 2 }} />
      )}
    </div>
    <div style={{ paddingBottom: isLast ? 0 : 4 }}>
      <div style={{ fontSize: 11, color: C.textPrimary, fontFamily: F.body, lineHeight: 1.4 }}>{label}</div>
      {date && (
        <div style={{ fontSize: 10, color: C.textSec, fontFamily: F.body, marginTop: 2 }}>{date}</div>
      )}
    </div>
  </div>
);

const PropRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
    <span style={{ fontSize: 10, color: C.textSec, fontFamily: F.body }}>{label}</span>
    <span style={{ fontSize: 11, fontWeight: 500, color: C.textPrimary, fontFamily: F.body }}>{value || '—'}</span>
  </div>
);

// ─── Reject Modal ─────────────────────────────────────────────────────────────

const RejectModal = ({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 24, width: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-circle-x" aria-hidden="true" style={{ color: '#991B1B', fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, fontFamily: F.headline }}>Reject application</div>
            <div style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>This action will notify the applicant</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textSec, fontWeight: 500, fontFamily: F.body, marginBottom: 6 }}>
            Reason for rejection (optional)
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Provide a reason to help the applicant understand the decision..."
            rows={4}
            style={{
              width: '100%', fontSize: 11, fontFamily: F.body,
              border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 7,
              padding: '8px 12px', resize: 'vertical', color: C.textPrimary,
              background: '#FAFBFC', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', fontSize: 12, fontFamily: F.body,
              border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: 7,
              background: '#fff', color: C.textSec, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            style={{
              padding: '8px 16px', fontSize: 12, fontFamily: F.body,
              border: 'none', borderRadius: 7,
              background: '#991B1B', color: '#fff', cursor: 'pointer', fontWeight: 500,
            }}
          >
            Confirm rejection
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PMApprovalsOwnership = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const approvalId = searchParams.get('id');

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchDetail = useCallback(async () => {
    if (!approvalId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/approvals/${approvalId}/`, { headers });
      if (!res.ok) throw new Error('Failed to load approval detail');
      const d = await res.json();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this ownership application? This will activate the landlord account and send an email to the owner.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/approvals/${approvalId}/approve/`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Approval failed');
      await fetchDetail();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    setShowRejectModal(false);
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/approvals/${approvalId}/reject/`, {
        method: 'POST', headers,
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      await fetchDetail();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const formatDateTime = (d) => d
    ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const initials = (name) => name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const profile = data?.landlord_profile;
  const invite  = data?.invite;
  const ownership = data?.ownership;
  const isDecided = data?.status === 'ACCEPTED' || data?.status === 'REJECTED';

  const s = {
    page: { display: 'flex', minHeight: '100vh', background: C.pageBg, fontFamily: F.body },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
    topbar: {
      height: 52, background: '#fff',
      borderBottom: '0.5px solid rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 10, flexShrink: 0,
    },
    breadcrumb: { fontSize: 12, color: C.textSec, fontFamily: F.body, display: 'flex', alignItems: 'center', gap: 4 },
    content: { flex: 1, overflowY: 'auto', padding: 24 },
    layout: { display: 'flex', gap: 18, alignItems: 'flex-start' },
    mainCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 },
    sideCol: { width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 },
    ownerHeader: {
      display: 'flex', alignItems: 'center', gap: 14,
      marginBottom: 16, paddingBottom: 14, borderBottom: '0.5px solid rgba(0,0,0,0.06)',
    },
    avatar: {
      width: 42, height: 42, borderRadius: '50%',
      background: C.primary, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 500, flexShrink: 0, fontFamily: F.body,
    },
    ownerName: { fontSize: 15, fontWeight: 500, color: C.textPrimary, fontFamily: F.headline },
    ownerEmail: { fontSize: 11, color: C.textSec, fontFamily: F.body, marginTop: 2 },
    equityBlock: {
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#F8FAFC', border: '0.5px solid rgba(0,0,0,0.06)',
      borderRadius: 8, padding: '8px 12px', marginBottom: 14,
    },
    equityCircle: {
      width: 34, height: 34, borderRadius: '50%',
      background: C.primary, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 500, flexShrink: 0, fontFamily: F.body,
    },
    fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btnApprove: {
      width: '100%', padding: '9px 0', borderRadius: 7, border: 'none',
      background: C.primary, color: '#fff', fontSize: 12, fontWeight: 500,
      fontFamily: F.body, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      opacity: (isDecided || actionLoading) ? 0.5 : 1,
    },
    btnReject: {
      width: '100%', padding: '9px 0', borderRadius: 7,
      border: '0.5px solid #fca5a5', background: '#fff',
      color: '#991B1B', fontSize: 12, fontFamily: F.body, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      opacity: (isDecided || actionLoading) ? 0.5 : 1,
    },
  };

  if (!approvalId) {
    return (
      <div style={s.page}>
        <NavB activeId="approvals-ownership" />
        <div style={s.main}>
          <div style={{ padding: 40, textAlign: 'center', color: C.textSec, fontSize: 13 }}>
            No application selected. <span style={{ color: C.primary, cursor: 'pointer' }} onClick={() => navigate('/pm-portal/approvals')}>Back to overview</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <NavB activeId="approvals-ownership" />

      {showRejectModal && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}

      <div style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div style={s.breadcrumb}>
            <span
              style={{ cursor: 'pointer', color: C.textSec }}
              onClick={() => navigate('/pm-portal/approvals')}
            >
              Approvals
            </span>
            <i className="ti ti-chevron-right" aria-hidden="true" style={{ fontSize: 11 }} />
            <span
              style={{ cursor: 'pointer', color: C.textSec }}
              onClick={() => navigate('/pm-portal/approvals/ownership')}
            >
              Ownership
            </span>
            <i className="ti ti-chevron-right" aria-hidden="true" style={{ fontSize: 11 }} />
            <span style={{ color: C.textPrimary, fontWeight: 500 }}>
              {data ? (data.owner_name || data.owner_email) : '—'}
            </span>
          </div>
          {data && (
            <div style={{ marginLeft: 'auto' }}>
              <StatusBadge status={data.status} />
            </div>
          )}
        </div>

        <div style={s.content}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: C.textSec, fontSize: 12 }}>
              Loading application...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#991B1B', fontSize: 12 }}>
              {error} — <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={fetchDetail}>Retry</span>
            </div>
          ) : !data ? null : (
            <div style={s.layout}>

              {/* ── Main column ─────────────────────────────────────────── */}
              <div style={s.mainCol}>

                {/* Applicant details */}
                <SectionCard>
                  <div style={s.ownerHeader}>
                    <div style={s.avatar}>{initials(data.owner_name)}</div>
                    <div>
                      <div style={s.ownerName}>{data.owner_name || '—'}</div>
                      <div style={s.ownerEmail}>{data.owner_email}</div>
                    </div>
                  </div>

                  {/* Equity block */}
                  <div style={s.equityBlock}>
                    <div style={s.equityCircle}>
                      {ownership?.equity_pct ? `${parseFloat(ownership.equity_pct).toFixed(0)}%` : '—'}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.textSec, fontFamily: F.body }}>
                        Equity share · {data.property_name}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, fontFamily: F.body, marginTop: 2 }}>
                        {ownership?.ownership_role?.replace('_', ' ') || 'Individual Owner'}
                      </div>
                    </div>
                  </div>

                  {/* Personal details */}
                  <div style={{ fontSize: 10, fontWeight: 500, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: F.body, marginBottom: 12 }}>
                    <i className="ti ti-user" aria-hidden="true" style={{ fontSize: 13, marginRight: 5 }} />
                    Personal details
                  </div>
                  <div style={s.fieldGrid}>
                    <FieldRow label="First name"  value={profile?.first_name} />
                    <FieldRow label="Last name"   value={profile?.last_name} />
                    <FieldRow label="Phone"        value={profile?.phone} />
                    <FieldRow label="Occupation"   value={profile?.occupation} />
                    <FieldRow label="ID type"      value={profile?.id_type} />
                    <FieldRow label="ID number"    value={profile?.id_number} />
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>
                    <FieldRow
                      label="Address"
                      value={[profile?.street_address_1, profile?.city, profile?.state, profile?.zip_code, profile?.country].filter(Boolean).join(', ')}
                    />
                  </div>
                </SectionCard>

                {/* Documents */}
                <SectionCard title="Documents submitted" icon="ti-file-text">
                  <DocRow
                    label={profile?.id_document_1 ? 'id_document_1' : 'Document 1'}
                    docType="Government ID — Front"
                    fileUrl={profile?.id_document_1}
                    missing={!profile?.id_document_1}
                  />
                  <DocRow
                    label={profile?.id_document_2 ? 'id_document_2' : 'Document 2'}
                    docType="Government ID — Back"
                    fileUrl={profile?.id_document_2}
                    missing={!profile?.id_document_2}
                  />
                  <DocRow
                    label={profile?.id_document_3 ? 'id_document_3' : 'Document 3'}
                    docType="Additional document"
                    fileUrl={profile?.id_document_3}
                    missing={!profile?.id_document_3}
                  />
                  <div style={{ marginTop: 8, fontSize: 10, color: C.textSec, fontFamily: F.body, fontStyle: 'italic' }}>
                    Files open in a new tab
                  </div>
                </SectionCard>

              </div>

              {/* ── Side column ─────────────────────────────────────────── */}
              <div style={s.sideCol}>

                {/* Property info */}
                <SectionCard title="Property" icon="ti-building">
                  <PropRow label="Name"        value={data.property_name} />
                  <PropRow label="Equity"       value={ownership?.equity_pct ? `${parseFloat(ownership.equity_pct).toFixed(0)}%` : '—'} />
                  <PropRow label="Role"         value={ownership?.ownership_role?.replace(/_/g, ' ')} />
                  <PropRow label="Invite sent"  value={formatDate(invite?.created_at)} />
                  <PropRow label="Submitted"    value={formatDate(data.submitted_at)} />
                  <PropRow label="Expires"      value={formatDate(invite?.expires_at)} />
                </SectionCard>

                {/* Timeline */}
                <SectionCard title="Timeline" icon="ti-clock">
                  {[
                    data.submitted_at && { label: 'Application submitted', date: formatDateTime(data.submitted_at), order: 0 },
                    invite?.created_at && { label: 'Invite sent', date: formatDateTime(invite.created_at), order: 2 },
                    data.decided_at && { label: data.status === 'ACCEPTED' ? 'Application approved' : 'Application rejected', date: formatDateTime(data.decided_at), order: -1 },
                  ]
                    .filter(Boolean)
                    .sort((a, b) => a.order - b.order)
                    .map((item, idx, arr) => (
                      <TimelineItem
                        key={idx}
                        label={item.label}
                        date={item.date}
                        isFirst={idx === 0}
                        isLast={idx === arr.length - 1}
                      />
                    ))
                  }
                </SectionCard>

                {/* Decision */}
                <SectionCard title="Decision" icon="ti-shield-check">
                  {isDecided ? (
                    <div style={{ fontSize: 11, color: C.textSec, fontFamily: F.body, fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
                      {data.status === 'ACCEPTED' ? '✓ Application has been approved' : '✗ Application has been rejected'}
                      {data.rejection_reason && (
                        <div style={{ marginTop: 8, fontStyle: 'normal', color: C.textPrimary, background: '#F8FAFC', borderRadius: 6, padding: '8px 10px', textAlign: 'left' }}>
                          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textSec, marginBottom: 4 }}>Reason</div>
                          {data.rejection_reason}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        style={s.btnApprove}
                        disabled={isDecided || actionLoading}
                        onClick={handleApprove}
                      >
                        <i className="ti ti-check" aria-hidden="true" />
                        {actionLoading ? 'Processing...' : 'Approve ownership'}
                      </button>
                      <button
                        style={s.btnReject}
                        disabled={isDecided || actionLoading}
                        onClick={() => setShowRejectModal(true)}
                      >
                        <i className="ti ti-x" aria-hidden="true" />
                        Reject
                      </button>
                      <div style={{ fontSize: 9, color: C.textSec, fontFamily: F.body, fontStyle: 'italic', textAlign: 'center', marginTop: 2 }}>
                        Approving will activate the landlord account and notify the owner by email
                      </div>
                    </div>
                  )}
                </SectionCard>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PMApprovalsOwnership;
