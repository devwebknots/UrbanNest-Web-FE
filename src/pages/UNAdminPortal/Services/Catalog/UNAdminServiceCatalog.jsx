import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary: '#002D5B', primaryHover: '#003d7a',
  pageBg: '#F8FAFC', navBg: '#111827',
  border: '#E2E8F0', borderMedium: '#CBD5E1',
  textPrimary: '#0F172A', textSecondary: '#64748B', textTertiary: '#94A3B8',
  danger: '#E53E3E', white: '#FFFFFF', neutral: '#F1F5F9', green: '#16A34A',
  amberBg: '#FEF3C7', amberBorder: '#FCD34D', amberText: '#92400E',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

// ─── Inline SVG Icons — no CDN dependency, renders immediately ───────────────
// Each service gets a unique SVG illustration in the card placeholder
const SERVICE_SVGS = {
  'ti-file-text': (color) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:44,height:44,opacity:0.85}}>
      <rect x="10" y="6" width="22" height="28" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
      <path d="M10 14h22M10 20h14M10 26h10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="34" cy="34" r="8" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
      <path d="M31 34h6M34 31v6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'ti-tool': (color) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:44,height:44,opacity:0.85}}>
      <path d="M30 8c-4 0-7 3-7 7 0 1 .2 2 .6 2.8L10 31a3 3 0 104.2 4.2l13.2-13.6c.8.4 1.8.6 2.8.6 4 0 7-3 7-7 0-.8-.1-1.6-.4-2.3L33 17a2 2 0 01-2-2v-4.6A7 7 0 0030 8z" stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  'ti-chart-bar': (color) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:44,height:44,opacity:0.85}}>
      <rect x="8" y="28" width="8" height="12" rx="2" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.2"/>
      <rect x="20" y="18" width="8" height="22" rx="2" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.2"/>
      <rect x="32" y="10" width="8" height="30" rx="2" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.2"/>
      <path d="M6 42h36" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'ti-trending-up': (color) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:44,height:44,opacity:0.85}}>
      <path d="M6 34L18 22l8 8 14-16" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 14h10v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18" cy="22" r="2.5" fill={color}/>
      <circle cx="26" cy="30" r="2.5" fill={color}/>
    </svg>
  ),
  'ti-building': (color) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:44,height:44,opacity:0.85}}>
      <rect x="8" y="14" width="20" height="28" rx="2" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.1"/>
      <rect x="28" y="22" width="14" height="20" rx="2" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.1"/>
      <path d="M14 20h4M14 26h4M14 32h4M32 28h4M32 34h4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 42v-6h4v6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'ti-users': (color) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:44,height:44,opacity:0.85}}>
      <circle cx="18" cy="16" r="7" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.15"/>
      <path d="M4 38c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <circle cx="36" cy="18" r="5" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15"/>
      <path d="M42 36c0-5.5-2.7-10-6-12" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  default: (color) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:44,height:44,opacity:0.85}}>
      <rect x="8" y="8" width="32" height="32" rx="6" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.1"/>
      <path d="M16 24h16M24 16v16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── API CONFIG ───────────────────────────────────────────────────────────────
// Base URL — change this if your backend is on a different port/host
const API_BASE = 'http://127.0.0.1:8001';
const SERVICES_URL = `${API_BASE}/api/admin/services/`;

// Reads JWT access token from localStorage (set there by your login flow)
function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
  };
}

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────

// GET /api/admin/services/ — list all services
async function apiGetServices() {
  const res = await fetch(SERVICES_URL, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load services');
  return res.json();
}

// GET /api/admin/services/references/ — statuses + price units
async function apiGetReferences() {
  const res = await fetch(`${SERVICES_URL}references/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load references');
  return res.json();
}

// POST /api/admin/services/ — create new service
// Uses FormData because the image is a file upload
async function apiCreateService(formData) {
  const res = await fetch(SERVICES_URL, {
    method: 'POST',
    headers: getAuthHeaders(), // no Content-Type — browser sets it with boundary for FormData
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

// PATCH /api/admin/services/<id>/ — update existing service
async function apiUpdateService(id, formData) {
  const res = await fetch(`${SERVICES_URL}${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

// PATCH /api/admin/services/<id>/ — update status only (toggle)
async function apiUpdateStatus(id, status) {
  const res = await fetch(`${SERVICES_URL}${id}/`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

// DELETE /api/admin/services/<id>/
async function apiDeleteService(id) {
  const res = await fetch(`${SERVICES_URL}${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete service');
  // DELETE returns 204 No Content — no JSON body
}

// ─── Build FormData from form state (for create + update) ────────────────────
// Your backend UNService model fields:
// name, short_description, long_description, receivers (JSON),
// status, price, price_unit, start_date, end_date, icon, display_order, image (file)
function buildFormData(form) {
  const fd = new FormData();
  fd.append('name', form.name);
  fd.append('short_description', form.short_description);
  fd.append('long_description', form.long_description || '');
  fd.append('receivers', JSON.stringify(form.receivers));   // JSONField expects JSON string
  fd.append('status', form.status || 'ACTIVE');
  fd.append('price', form.price);
  fd.append('price_unit', form.price_unit);
  fd.append('icon', form.icon || 'ti-package');
  fd.append('display_order', form.display_order || 0);
  if (form.start_date)       fd.append('start_date',       form.start_date);
  if (form.end_date)         fd.append('end_date',         form.end_date);
  if (form.scheduled_status) fd.append('scheduled_status', form.scheduled_status);
  if (form.effective_from)   fd.append('effective_from',   form.effective_from);
  if (form.imageFile)        fd.append('image',            form.imageFile);
  return fd;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRICE_UNIT_LABELS = {
  PER_UNIT: 'Per Unit', PER_MONTH: 'Per Month',
  PER_PROPERTY: 'Per Property', FLAT_FEE: 'Flat Fee',
};

const RECEIVER_OPTIONS = [
  { value: 'INDEPENDENT_PM',   label: 'Independent PM' },
  { value: 'ORGANIZATIONAL_PM',label: 'Organizational PM' },
  { value: 'LANDLORD',         label: 'Landlord' },
  { value: 'RENTER',           label: 'Renter' },
  { value: 'TENANT',           label: 'Tenant' },
  { value: 'REAL_ESTATE_AGENT',label: 'Real Estate Agent' },
];

const TABS = [
  { id: 'all',     label: 'UrbanNest',        receivers: null },
  { id: 'ind_pm',  label: 'Independent PM',   receivers: ['INDEPENDENT_PM'] },
  { id: 'org_pms', label: 'Org PMS',          receivers: ['ORGANIZATIONAL_PM'] },
  { id: 'landlord',label: 'Landlord',         receivers: ['LANDLORD'] },
  { id: 'renter',  label: 'Renter',           receivers: ['RENTER', 'TENANT'] },
  { id: 'agent',   label: 'Real Estate Agent',receivers: ['REAL_ESTATE_AGENT'], comingSoon: true },
];

// ─── Inline SVG UI Icons (replaces all <i className="ti-..."> for UI chrome) ──
const SvgX = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgChevron = ({ direction = 'down', size = 14, color = '#64748B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d={direction === 'down' ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SvgTrash = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgAlert = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SvgPackage = ({ size = 40, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Status labels (for display + scheduled status dropdown) ─────────────────
const STATUS_LABELS = {
  ACTIVE:      'Active',
  INACTIVE:    'Inactive',
  SUSPENDED:   'Suspended',
  COMING_SOON: 'Coming Soon',
  DEPRECATED:  'Deprecated',
};
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function priceShort(service) {
  const unit = (PRICE_UNIT_LABELS[service.price_unit] || '').split(' ')[1] || 'Unit';
  return `$${parseFloat(service.price || 0).toFixed(0)}/${unit}`;
}

// ─── ServiceImage — dark placeholder with icon if no image uploaded ───────────
const ICON_THEMES = {
  'ti-file-text':   { bg: '#0A1628', color: '#3B82F6' },
  'ti-tool':        { bg: '#0D1117', color: '#10B981' },
  'ti-chart-bar':   { bg: '#0A1628', color: '#6366F1' },
  'ti-trending-up': { bg: '#0D1117', color: '#F59E0B' },
  'ti-building':    { bg: '#0A1628', color: '#EC4899' },
  'ti-users':       { bg: '#0D1117', color: '#14B8A6' },
  default:          { bg: '#0A1628', color: '#3B82F6' },
};

function ServiceImage({ service, height = 150 }) {
  const theme = ICON_THEMES[service.icon] || ICON_THEMES.default;
  const SvgIcon = SERVICE_SVGS[service.icon] || SERVICE_SVGS.default;
  if (service.image) {
    return <img src={service.image} alt={service.name} style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />;
  }
  return (
    <div style={{ width: '100%', height, background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${theme.color}18 1px, transparent 1px), linear-gradient(90deg, ${theme.color}18 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{SvgIcon(theme.color)}</div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <div onClick={() => !disabled && onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 11, background: checked ? C.green : C.borderMedium, position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.6 : 1 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: C.white, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 019.8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: F.body, fontSize: 13, color: '#991B1B' }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', display:'flex', alignItems:'center' }}><SvgX size={16} color="#991B1B" /></button>
    </div>
  );
}

// ─── Service Detail Panel ─────────────────────────────────────────────────────
function ServiceDetailPanel({ service, onClose, onEdit, onDelete, onStatusChange }) {
  const [toggling, setToggling] = useState(false);
  const isActive = service.status === 'ACTIVE';

  const handleToggle = async (val) => {
    setToggling(true);
    try {
      await onStatusChange(service.id, val ? 'ACTIVE' : 'INACTIVE');
    } finally {
      setToggling(false);
    }
  };

  const receiverLabels = (service.receivers || [])
    .map(r => RECEIVER_OPTIONS.find(o => o.value === r)?.label || r)
    .join(', ');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.25)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640, background: C.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Hero */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ServiceImage service={service} height={200} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 50%)', display: 'flex', alignItems: 'flex-end', padding: '20px 24px' }}>
            <h2 style={{ fontFamily: F.headline, fontSize: 26, fontWeight: 700, color: C.white, margin: 0 }}>{service.name}</h2>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SvgX size={14} color={C.white} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* Left */}
          <div style={{ flex: 1, padding: 'clamp(16px, 2vw, 24px)', borderRight: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Short Description</p>
            <p style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: '0 0 20px', lineHeight: 1.5 }}>{service.short_description}</p>
            <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Detailed Description</p>
            <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>{service.long_description || '—'}</p>
          </div>
          {/* Right */}
          <div style={{ width: 'clamp(160px, 18vw, 200px)', flexShrink: 0, padding: 'clamp(16px, 2vw, 24px) clamp(12px, 1.5vw, 20px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: isActive ? C.green : C.textSecondary }}>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                <Toggle checked={isActive} onChange={handleToggle} disabled={toggling} />
              </div>
            </div>
            <div>
              <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Service Receiver</p>
              <span style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>{receiverLabels || '—'}</span>
            </div>
            <div>
              <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Start Date</p>
              <span style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary }}>{fmtDate(service.start_date)}</span>
            </div>
            <div>
              <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>End Date</p>
              <span style={{ fontFamily: F.body, fontSize: 13, color: C.textPrimary }}>{fmtDate(service.end_date)}</span>
            </div>
            <div>
              <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Pricing Model</p>
              <span style={{ fontFamily: F.headline, fontSize: 'clamp(18px, 1.8vw, 22px)', fontWeight: 700, color: C.textPrimary }}>${service.price}</span>
              <span style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, marginLeft: 4 }}>/ {PRICE_UNIT_LABELS[service.price_unit] || service.price_unit}</span>
            </div>
            {/* Scheduled Status — only show if set */}
            {service.scheduled_status && (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Scheduled Change</p>
                <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.amberText, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 6 }}>
                  {STATUS_LABELS[service.scheduled_status] || service.scheduled_status}
                </span>
                {service.effective_from && (
                  <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: 0 }}>
                    Effective: {fmtDate(service.effective_from)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.white, flexShrink: 0 }}>
          <button onClick={() => onDelete(service)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.danger, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 0' }}>
            <SvgTrash size={15} color={C.danger} /> Delete Service
          </button>
          <button onClick={() => onEdit(service)} style={{ background: C.primary, color: C.white, border: 'none', borderRadius: 8, fontFamily: F.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 20px', cursor: 'pointer' }}>
            Edit Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function ServiceFormModal({ mode, service, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    name:              service?.name || '',
    short_description: service?.short_description || '',
    long_description:  service?.long_description || '',
    receivers:         service?.receivers || [],
    start_date:        service?.start_date || '',
    end_date:          service?.end_date || '',
    price:             service?.price || '',
    price_unit:        service?.price_unit || 'PER_UNIT',
    status:            service?.status || 'ACTIVE',
    scheduled_status:  service?.scheduled_status || '',
    effective_from:    service?.effective_from || '',
    icon:              service?.icon || 'ti-package',
    display_order:     service?.display_order || 0,
    imageFile:         null,
    imagePreview:      service?.image || null,
  });
  const [errors, setErrors]           = useState({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState('');
  const [receiverOpen, setReceiverOpen]       = useState(false);
  const [priceUnitOpen, setPriceUnitOpen]     = useState(false);
  const [schedStatusOpen, setSchedStatusOpen] = useState(false);
  const [dragOver, setDragOver]               = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => set('imagePreview', e.target.result);
    reader.readAsDataURL(file);
    set('imageFile', file);
  };

  const toggleReceiver = (val) => {
    set('receivers', form.receivers.includes(val)
      ? form.receivers.filter(r => r !== val)
      : [...form.receivers, val]);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name = 'Service title is required';
    if (!form.short_description.trim()) e.short_description = 'Short description is required';
    if (form.receivers.length === 0)    e.receivers = 'Select at least one receiver';
    if (!form.price || isNaN(form.price)) e.price = 'Valid price is required';
    if (Object.keys(e).length) { setErrors(e); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    try {
      const fd = buildFormData(form);
      let saved;
      if (isEdit) {
        saved = await apiUpdateService(service.id, fd);
      } else {
        saved = await apiCreateService(fd);
      }
      onSaved(saved, isEdit);        // pass saved object back to parent
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── shared style helpers ──
  const inputStyle = (err) => ({
    width: '100%', boxSizing: 'border-box',
    background: C.neutral, border: `1px solid ${err ? C.danger : C.border}`,
    borderRadius: 8, padding: '10px 12px',
    fontFamily: F.body, fontSize: 13, color: C.textPrimary, outline: 'none',
  });
  const labelStyle = { fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 };
  const errStyle   = { fontFamily: F.body, fontSize: 11, color: C.danger, marginTop: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 600, background: C.white, borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: 'clamp(16px, 2vw, 24px) clamp(20px, 3vw, 28px) 0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: F.headline, fontSize: 'clamp(18px, 1.8vw, 22px)', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 4, display:'flex', alignItems:'center' }}>
            <SvgX size={18} color={C.textSecondary} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 'clamp(16px, 2vw, 20px) clamp(20px, 3vw, 28px) 8px' }}>

          {apiError && <ErrorBanner message={apiError} onDismiss={() => setApiError('')} />}

          {/* Image Upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Service Imagery</label>
            {form.imagePreview ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                <img src={form.imagePreview} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                <button onClick={() => { set('imagePreview', null); set('imageFile', null); }} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SvgX size={12} color={C.white} />
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }} style={{ border: `2px dashed ${dragOver ? C.primary : C.borderMedium}`, borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#EEF2FF' : C.neutral, transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke={C.textTertiary} strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill={C.textTertiary}/><path d="M3 15l5-5 4 4 3-3 6 6" stroke={C.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 7h4M17 5v4" stroke={C.textTertiary} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 4px' }}>Click to upload or drag and drop</p>
                <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>High-resolution JPG or PNG preferred</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageFile(e.target.files[0])} />
          </div>

          {/* Service Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Service Title & Brief</label>
            <input style={inputStyle(errors.name)} placeholder="e.g., Lease Management" value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <p style={errStyle}>{errors.name}</p>}
          </div>

          {/* Short Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Short Description</label>
            <textarea style={{ ...inputStyle(errors.short_description), height: 80, resize: 'vertical' }} placeholder="Brief one-line description shown on the service card..." value={form.short_description} onChange={(e) => set('short_description', e.target.value)} />
            {errors.short_description && <p style={errStyle}>{errors.short_description}</p>}
          </div>

          {/* Long Description — NEW */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Detailed Specification</label>
            <textarea style={{ ...inputStyle(), height: 100, resize: 'vertical' }} placeholder="Provide a comprehensive breakdown of the service scope, equipment used, and personnel requirements..." value={form.long_description} onChange={(e) => set('long_description', e.target.value)} />
          </div>

          {/* Service Receiver — multi-select */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Service Receiver</label>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setReceiverOpen(o => !o)} style={{ ...inputStyle(errors.receivers), display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: receiverOpen ? '#E4ECFC' : C.neutral, border: `1px solid ${receiverOpen ? '#BFDBFE' : errors.receivers ? C.danger : C.border}` }}>
                <span style={{ color: form.receivers.length ? C.textPrimary : C.textTertiary, fontSize: 13 }}>
                  {form.receivers.length ? form.receivers.map(r => RECEIVER_OPTIONS.find(o => o.value === r)?.label).filter(Boolean).join(', ') : 'Select receivers...'}
                </span>
                <SvgChevron direction={receiverOpen ? 'up' : 'down'} />
              </div>
              {receiverOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                  {RECEIVER_OPTIONS.map(opt => {
                    const sel = form.receivers.includes(opt.value);
                    return (
                      <div key={opt.value} onClick={() => toggleReceiver(opt.value)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: sel ? '#E4ECFC' : 'transparent', fontFamily: F.body, fontSize: 13, color: sel ? C.primary : C.textPrimary, fontWeight: sel ? 600 : 400 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? C.primary : C.borderMedium}`, background: sel ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {opt.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {errors.receivers && <p style={errStyle}>{errors.receivers}</p>}
          </div>

          {/* Start / End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[['Start Date', 'start_date'], ['End Date', 'end_date']].map(([lbl, key]) => (
              <div key={key}>
                <label style={labelStyle}>{lbl}</label>
                <input type="date" style={inputStyle()} value={form[key]} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
          </div>

          {/* Price / Price Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Price</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: F.body, fontSize: 13, color: C.textSecondary }}>$</span>
                <input type="number" step="0.01" min="0" style={{ ...inputStyle(errors.price), paddingLeft: 26 }} placeholder="0.00" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              {errors.price && <p style={errStyle}>{errors.price}</p>}
            </div>
            <div>
              <label style={labelStyle}>Price Unit</label>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setPriceUnitOpen(o => !o)} style={{ ...inputStyle(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: priceUnitOpen ? '#E4ECFC' : C.neutral, border: `1px solid ${priceUnitOpen ? '#BFDBFE' : C.border}` }}>
                  <span style={{ fontSize: 13 }}>{PRICE_UNIT_LABELS[form.price_unit]}</span>
                  <SvgChevron direction={priceUnitOpen ? 'up' : 'down'} />
                </div>
                {priceUnitOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4 }}>
                    {Object.entries(PRICE_UNIT_LABELS).map(([val, lbl]) => (
                      <div key={val} onClick={() => { set('price_unit', val); setPriceUnitOpen(false); }} style={{ padding: '10px 14px', cursor: 'pointer', fontFamily: F.body, fontSize: 13, color: form.price_unit === val ? C.primary : C.textPrimary, fontWeight: form.price_unit === val ? 600 : 400, background: form.price_unit === val ? '#E4ECFC' : 'transparent' }}>
                        {lbl}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Scheduled Status section — NEW ─────────────────────────── */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 8 }}>
            <p style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Scheduled Status Change</p>
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '0 0 14px', lineHeight: 1.5 }}>
              Set a future status change. The cron job applies it on the effective date (suspension takes effect end of month per business rules).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Scheduled Status</label>
                <div style={{ position: 'relative' }}>
                  <div onClick={() => setSchedStatusOpen(o => !o)} style={{ ...inputStyle(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: schedStatusOpen ? '#E4ECFC' : C.neutral, border: `1px solid ${schedStatusOpen ? '#BFDBFE' : C.border}` }}>
                    <span style={{ fontSize: 13, color: form.scheduled_status ? C.textPrimary : C.textTertiary }}>{form.scheduled_status ? STATUS_LABELS[form.scheduled_status] || form.scheduled_status : 'None'}</span>
                    <SvgChevron direction={schedStatusOpen ? 'up' : 'down'} />
                  </div>
                  {schedStatusOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4 }}>
                      {[{ value: '', label: 'None' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))].map(opt => (
                        <div key={opt.value} onClick={() => { set('scheduled_status', opt.value); setSchedStatusOpen(false); }} style={{ padding: '10px 14px', cursor: 'pointer', fontFamily: F.body, fontSize: 13, color: form.scheduled_status === opt.value ? C.primary : C.textPrimary, fontWeight: form.scheduled_status === opt.value ? 600 : 400, background: form.scheduled_status === opt.value ? '#E4ECFC' : 'transparent' }}>
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Effective From</label>
                <input type="date" style={inputStyle()} value={form.effective_from || ''} onChange={(e) => set('effective_from', e.target.value)} disabled={!form.scheduled_status} />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: 'clamp(12px, 1.5vw, 16px) clamp(20px, 3vw, 28px)', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0, background: C.white }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 16px' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? C.borderMedium : C.primary, color: C.white, border: 'none', borderRadius: 8, fontFamily: F.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 22px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving && <Spinner size={14} />}
            {isEdit ? 'Save Changes' : 'Save Service'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ service, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleConfirm = async () => {
    setDeleting(true);
    setApiError('');
    try {
      await apiDeleteService(service.id);   // DELETE /api/admin/services/<id>/
      onDeleted(service.id);
    } catch (err) {
      setApiError('Could not delete service. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: 420, background: C.white, borderRadius: 16, padding: 32, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <SvgTrash size={22} color={C.danger} />
        </div>
        <h3 style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: '0 0 8px' }}>Delete Service?</h3>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 16px', lineHeight: 1.5 }}>
          <strong>{service.name}</strong> will be permanently removed from the service catalog. This cannot be undone.
        </p>
        {apiError && <p style={{ fontFamily: F.body, fontSize: 12, color: C.danger, marginBottom: 12 }}>{apiError}</p>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.textSecondary, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={deleting} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: C.danger, fontFamily: F.body, fontSize: 13, fontWeight: 700, color: C.white, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {deleting && <Spinner size={14} />}
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ service, onViewDetails }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ background: C.white, borderRadius: 14, border: `1px solid ${hover ? C.borderMedium : C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, border-color 0.2s', boxShadow: hover ? '0 8px 24px rgba(0,45,91,0.10)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ borderRadius: '14px 14px 0 0', overflow: 'hidden', flexShrink: 0 }}>
        <ServiceImage service={service} height={148} />
      </div>
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <h3 style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0, lineHeight: 1.3 }}>{service.name}</h3>
          <span style={{ background: C.primary, color: C.white, borderRadius: 20, padding: '3px 9px', fontFamily: F.body, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{priceShort(service)}</span>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textTertiary, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          {service.short_description?.split(' ').slice(0, 4).join(' ').toUpperCase()}
        </p>
        <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSecondary, margin: '0 0 14px', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {service.short_description}
        </p>
        <button onClick={() => onViewDetails(service)} style={{ width: '100%', padding: '9px', border: `1px solid ${hover ? C.primary : C.borderMedium}`, borderRadius: 8, background: hover ? C.neutral : 'transparent', fontFamily: F.body, fontSize: 11, fontWeight: 700, color: hover ? C.primary : C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s' }}>
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UNAdminServiceCatalog() {
  const [activeTab, setActiveTab]           = useState('all');
  const [services, setServices]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [loadError, setLoadError]           = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [modal, setModal]                   = useState(null); // 'add' | 'edit' | 'delete'
  const [editTarget, setEditTarget]         = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);

  // ── Load services on mount ──
  const loadServices = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiGetServices();   // GET /api/admin/services/
      // DRF returns an array or { results: [] } depending on pagination
      setServices(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setLoadError('Could not load services. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  // ── Filter by active tab ──
  const filteredServices = services.filter(s => {
    const tab = TABS.find(t => t.id === activeTab);
    if (!tab?.receivers) return true;
    return (s.receivers || []).some(r => tab.receivers.includes(r));
  });

  // ── Status toggle (called from detail panel) ──
  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await apiUpdateStatus(id, newStatus);  // PATCH with { status }
      setServices(prev => prev.map(s => s.id === id ? updated : s));
      // also update the open detail panel if it's showing this service
      setSelectedService(prev => prev?.id === id ? updated : prev);
    } catch {
      // toggle failed — no UI change
    }
  };

  // ── Edit: open modal pre-filled ──
  const handleEdit = (service) => {
    setEditTarget(service);
    setSelectedService(null);
    setModal('edit');
  };

  // ── Delete: open confirm dialog ──
  const handleDelete = (service) => {
    setDeleteTarget(service);
    setSelectedService(null);
    setModal('delete');
  };

  // ── Called by form modal after successful API save ──
  const handleSaved = (savedService, wasEdit) => {
    if (wasEdit) {
      // replace the old record with the updated one from the API
      setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
    } else {
      // add the newly created service to the top of the list
      setServices(prev => [savedService, ...prev]);
    }
    setModal(null);
    setEditTarget(null);
  };

  // ── Called by delete modal after successful API delete ──
  const handleDeleted = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setModal(null);
    setDeleteTarget(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: F.body }}>

      {/* Title row */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: F.headline, fontSize: 'clamp(22px, 2.2vw, 28px)', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
          Service Catalog
        </h1>
      </div>

      {/* Tabs + Add button on same row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${C.border}`, marginBottom: 'clamp(16px, 2vw, 24px)' }}>
        <div style={{ display: 'flex', overflowX: 'auto', flexShrink: 1 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => !tab.comingSoon && setActiveTab(tab.id)} style={{ background: 'none', border: 'none', cursor: tab.comingSoon ? 'default' : 'pointer', padding: '10px clamp(10px, 1.2vw, 18px)', fontFamily: F.body, fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? C.primary : C.textTertiary, borderBottom: isActive ? `2.5px solid ${C.primary}` : '2.5px solid transparent', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {tab.label}
                {tab.comingSoon && <span style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 20, padding: '1px 7px', fontSize: 9, fontWeight: 700, color: C.amberText, letterSpacing: '0.04em' }}>SOON</span>}
              </button>
            );
          })}
        </div>
        <div style={{ paddingBottom: 8, flexShrink: 0, marginLeft: 12 }}>
          <button
            onClick={() => setModal('add')}
            onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.primary, color: C.white, border: 'none', borderRadius: 7, fontFamily: F.body, fontSize: 13, fontWeight: 700, padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Add Services
          </button>
        </div>
      </div>

      {/* States: loading / error / empty / grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', gap: 12 }}>
          <Spinner size={22} />
          <span style={{ fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>Loading services...</span>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      ) : loadError ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><SvgAlert size={36} color={C.danger} /></div>
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.textSecondary, marginBottom: 16 }}>{loadError}</p>
          <button onClick={loadServices} style={{ background: C.primary, color: C.white, border: 'none', borderRadius: 8, fontFamily: F.body, fontSize: 13, fontWeight: 700, padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><SvgPackage size={40} color={C.textTertiary} /></div>
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.textSecondary }}>No services in this category yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(200px, 20vw, 260px), 1fr))', gap: 'clamp(14px, 1.5vw, 20px)' }}>
          {filteredServices.map(svc => (
            <ServiceCard key={svc.id} service={svc} onViewDetails={setSelectedService} />
          ))}
        </div>
      )}

      {/* View Details overlay */}
      {selectedService && (
        <ServiceDetailPanel
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <ServiceFormModal
          mode={modal}
          service={modal === 'edit' ? editTarget : null}
          onClose={() => { setModal(null); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {modal === 'delete' && deleteTarget && (
        <DeleteConfirmModal
          service={deleteTarget}
          onClose={() => { setModal(null); setDeleteTarget(null); }}
          onDeleted={handleDeleted}
        />
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
