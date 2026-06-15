import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavB from '../../components/layout/NavB';

// ─── API base ─────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:      '#002D5B',
  primaryLight: '#EFF6FF',
  primaryBlue:  '#0659b2',
  pageBg:       '#F8FAFC',
  cardBg:       '#FFFFFF',
  border:       '#E2E8F0',
  borderMed:    '#CBD5E1',
  inputBg:      '#F8F9FA',
  textPrimary:  '#0F172A',
  textSec:      '#64748B',
  textTert:     '#94A3B8',
  danger:       '#E53E3E',
  success:      '#16A34A',
  successLight: '#F0FDF4',
  amberLight:   '#FEF3C7',
  amberText:    '#92400E',
  navy:         '#001A3A',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CFG = {
  AVAILABLE:                  { label: 'Available',                   bg: '#DCFCE7', color: '#166534', dot: '#16A34A' },
  OCCUPIED:                   { label: 'Occupied',                    bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  COMING_SOON:                { label: 'Coming Soon',                 bg: '#EEF2FF', color: '#3730A3', dot: '#6366F1' },
  DRAFT:                      { label: 'Draft',                       bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  PENDING_OWNERSHIP_SUBMISSION:   { label: 'Pending Submission',      bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  PENDING_OWNERSHIP_VERIFICATION: { label: 'Pending Verification',    bg: '#EEF2FF', color: '#3730A3', dot: '#6366F1' },
  SUSPENDED:                  { label: 'Suspended',                   bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
};

// ─── Unit type display ────────────────────────────────────────────────────────
const UNIT_TYPE_MAP = {
  studio:       { label: 'Studio',        icon: 'ti-home'          },
  '1br':        { label: '1 Bedroom',     icon: 'ti-bed'           },
  '2br':        { label: '2 Bedroom',     icon: 'ti-bed'           },
  '3br':        { label: '3 Bedroom',     icon: 'ti-bed'           },
  '4br_plus':   { label: '4 Bedroom+',    icon: 'ti-bed'           },
  penthouse:    { label: 'Penthouse',     icon: 'ti-building'      },
  student_room: { label: 'Student Room',  icon: 'ti-school'        },
  serviced:     { label: 'Serviced Unit', icon: 'ti-star'          },
  commercial:   { label: 'Commercial',    icon: 'ti-briefcase'     },
};

const LEASE_TYPE_MAP = {
  fixed:   'Fixed-Term',
  month:   'Month-to-Month',
  short:   'Short-Term',
  student: 'Student Lease',
};

// ─── Bank account module labels ───────────────────────────────────────────────
const MODULE_LABELS = {
  OWNER_SETTLEMENT: 'Owner Settlement',
  UNIT_RESERVE:     'Unit Reserve',
};

// ─── Amenity icon map ─────────────────────────────────────────────────────────
function amenityStyle(name) {
  const map = {
    'Smart Home':            { icon: 'ti-home-signal', bg: '#EFF6FF', color: '#2563EB' },
    '24 hours CCTV':         { icon: 'ti-video',       bg: '#F0FDF4', color: '#16A34A' },
    'EV Charging':           { icon: 'ti-bolt',        bg: '#F0FDF4', color: '#16A34A' },
    'Near public transport': { icon: 'ti-bus',         bg: '#EFF6FF', color: '#2563EB' },
    'Short/Long term lease': { icon: 'ti-file-text',   bg: '#F0FDF4', color: '#16A34A' },
    'Zero Deposit':          { icon: 'ti-shield-check',bg: '#F0FDF4', color: '#16A34A' },
    'Swimming Pool':         { icon: 'ti-droplet',     bg: '#EFF6FF', color: '#2563EB' },
    'Gym':                   { icon: 'ti-barbell',     bg: '#FEF3C7', color: '#D97706' },
    'Parking':               { icon: 'ti-car',         bg: '#F1F5F9', color: '#64748B' },
    'Elevator':              { icon: 'ti-elevator',    bg: '#EEF2FF', color: '#7C3AED' },
    'Pet Friendly':          { icon: 'ti-paw',         bg: '#FEF3C7', color: '#D97706' },
  };
  return map[name] || { icon: 'ti-star', bg: '#F0FDF4', color: '#16A34A' };
}

// ─── Unsplash fallbacks ───────────────────────────────────────────────────────
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop';
const THUMB_FALLBACKS = [
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop',
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
  id:               1,
  property:         { id: 1, name: 'Emerald Gardens', street1: '123 Metropolitan Ave', city: 'Manhattan', state: 'NY' },
  unit_number:      '402-B',
  tower:            'Tower A',
  unit_type:        '2br',
  ownership_type:   'CO_OWNED',
  floor:            4,
  lease_type:       'fixed',
  management_model: 'full',
  carpet_area:      850,
  total_area:       1050,
  total_rooms:      3,
  total_baths:      2,
  student_housing:  false,
  rent_amount:      2500,
  security_deposit: 750,
  description:      'A bright and spacious 2-bedroom unit on the 4th floor of Tower A. Features floor-to-ceiling windows with panoramic city views, hardwood floors throughout, and a recently renovated kitchen with quartz countertops. Includes in-unit washer/dryer and a private balcony.',
  status:           'AVAILABLE',
  services:         ['Tenant Onboarding', 'Rent Collection', 'Lease Management'],
  primary_image:    null,
  gallery_images:   [],
  amenities: [
    { amenity_name: 'Smart Home'            },
    { amenity_name: '24 hours CCTV'         },
    { amenity_name: 'EV Charging'           },
    { amenity_name: 'Near public transport' },
    { amenity_name: 'Zero Deposit'          },
    { amenity_name: 'Gym'                   },
    { amenity_name: 'Parking'               },
  ],
  ownerships: [
    { id: 101, owner_display_id: 'OWN-101', owner_name: 'Jonathan Hart',    ownership_role: 'PRIMARY_OWNER', equity_percentage: 60, start_date: '2021-03-01', end_date: null },
    { id: 102, owner_display_id: 'OWN-102', owner_name: 'Mina Murray',      ownership_role: 'CO_OWNER',      equity_percentage: 40, start_date: '2021-03-01', end_date: null },
  ],
  tenants: [
    { id: 'TNT-21', tenant_name: 'Jonathan Harl', lease_id: 'LSE-445', lease_start: '2022-05-15', lease_end: '2023-05-14' },
    { id: 'TNT-41', tenant_name: 'Mina Murray',   lease_id: 'LSE-102', lease_start: '2023-08-01', lease_end: '2024-07-31' },
  ],
  bank_accounts: [
    { module: 'OWNER_SETTLEMENT', account_number: '88421220', routing_number: 'CHASE-821-NY', bank_name: 'Chase', is_verified: true,  is_skipped: false, auto_refill: null, min_threshold: null },
    { module: 'UNIT_RESERVE',     account_number: '44108821', routing_number: 'CHASE-821-NY', bank_name: 'Chase', is_verified: true,  is_skipped: false, auto_refill: true,  min_threshold: 350  },
  ],
  rooms: [],
};

// MOCK_STUDENT — used for student housing UI testing
// Switch prop fallback to MOCK_STUDENT to test Room-Bed Details section
// eslint-disable-next-line no-unused-vars
const MOCK_STUDENT = {
  ...MOCK,
  unit_number:     'SH-101',
  unit_type:       'student_room',
  student_housing: true,
  description:     'A fully furnished student room with shared common areas. Includes high-speed WiFi, weekly cleaning service, and 24/7 security access.',
  rooms: [
    { id: 1, room_number: 'A', room_type: 'Single', bed_count: 1, bathroom_count: 1, status: 'occupied',  beds: [{ id: 1, bed_number: 'B1', status: 'occupied'  }] },
    { id: 2, room_number: 'B', room_type: 'Double', bed_count: 2, bathroom_count: 1, status: 'partial',   beds: [{ id: 2, bed_number: 'B1', status: 'occupied'  }, { id: 3, bed_number: 'B2', status: 'vacant' }] },
    { id: 3, room_number: 'C', room_type: 'Triple', bed_count: 3, bathroom_count: 2, status: 'partial',   beds: [] },
    { id: 4, room_number: 'D', room_type: 'Single', bed_count: 1, bathroom_count: 1, status: 'occupied',  beds: [] },
    { id: 5, room_number: 'E', room_type: 'Double', bed_count: 2, bathroom_count: 1, status: 'partial',   beds: [] },
  ],
  tenants: [
    { id: 'TNT-21', tenant_name: 'Jonathan Harl', lease_id: 'LSE-445', lease_start: '2022-05-15', lease_end: '2023-05-14', room: 'B', bed: 'B1' },
    { id: 'TNT-41', tenant_name: 'Mina Murray',   lease_id: 'LSE-102', lease_start: '2023-08-01', lease_end: '2024-07-31', room: 'B', bed: 'B2' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskAcct(n) {
  if (!n) return '—';
  const s = String(n).replace(/\s/g, '');
  return s.length <= 4 ? s : `**** ${s.slice(-4)}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtCurrency(v) {
  if (v == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}
function useShimmer() {
  useEffect(() => {
    if (document.getElementById('un-shimmer')) return;
    const s = document.createElement('style');
    s.id = 'un-shimmer';
    s.textContent = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
    document.head.appendChild(s);
  }, []);
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, fontFamily: F.body,
      letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function SectionHeading({ title }) {
  return (
    <h2 style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: '0 0 14px 0' }}>
      {title}
    </h2>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.cardBg, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style,
    }}>
      {children}
    </div>
  );
}

function Skel({ h = 16, w = '100%', r = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ── Gallery (identical to property detail) ────────────────────────────────────
function Gallery({ unit }) {
  const hero   = unit.primary_image || HERO_FALLBACK;
  const thumbs = unit.gallery_images?.length ? unit.gallery_images : THUMB_FALLBACKS;
  const extra  = Math.max(0, (unit.gallery_images?.length || 0) - 4);
  const TOTAL_H = 310;
  const THUMB_H = (TOTAL_H - 6) / 2;

  return (
    <div style={{ display: 'flex', gap: 6, height: TOTAL_H, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ flex: '0 0 55%', overflow: 'hidden' }}>
        <img src={hero} alt="Unit" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[0, 1].map(row => (
          <div key={row} style={{ display: 'flex', gap: 6, height: THUMB_H }}>
            {[0, 1].map(col => {
              const i   = row * 2 + col;
              const src = typeof thumbs[i] === 'string' ? thumbs[i] : (thumbs[i]?.image_url || THUMB_FALLBACKS[i]);
              const isVideo = i === 1;
              const isLast  = i === 3;
              return (
                <div key={col} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <img src={src} alt={`view-${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {isVideo && (
                    <div style={{
                      position: 'absolute', bottom: 8, right: 8,
                      background: 'rgba(0,0,0,0.62)', borderRadius: 5,
                      padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <i className="ti ti-player-play-filled" style={{ color: '#fff', fontSize: 10 }} />
                      <span style={{ color: '#fff', fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.07em' }}>VIDEO TOUR</span>
                    </div>
                  )}
                  {isLast && extra > 0 && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <span style={{ color: '#fff', fontFamily: F.body, fontWeight: 700, fontSize: 13 }}>+{extra} Photos</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Unit Type + Stats card ────────────────────────────────────────────────────
function UnitTypeCard({ unit }) {
  const typeCfg = UNIT_TYPE_MAP[unit.unit_type] || { label: unit.unit_type, icon: 'ti-home' };
  const serviceCount = unit.services?.length || 0;

  const stats = [
    { icon: 'ti-bed',           label: 'Total Beds',      value: unit.total_rooms    != null ? unit.total_rooms    : '—' },
    { icon: 'ti-bath',          label: 'Total Baths',     value: unit.total_baths    != null ? unit.total_baths    : '—' },
    { icon: 'ti-currency-dollar',label: 'Rent / mo',      value: unit.rent_amount    != null ? fmtCurrency(unit.rent_amount)    : '—' },
    { icon: 'ti-shield-check',  label: 'Security Dep.',   value: unit.security_deposit != null ? fmtCurrency(unit.security_deposit) : '—' },
    { icon: 'ti-file-text',     label: 'Lease Type',      value: LEASE_TYPE_MAP[unit.lease_type] || unit.lease_type || '—' },
    { icon: 'ti-settings',      label: 'Services',        value: serviceCount > 0 ? `${serviceCount} Active` : '—' },
  ];

  return (
    <Card>
      <SectionHeading title="Unit Type" />
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
        {/* Active type pill — left, same size as property type pills */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '14px 18px', borderRadius: 10, minWidth: 90,
          background: C.primaryLight, border: `1.5px solid ${C.primary}`,
          flexShrink: 0,
        }}>
          <i className={`ti ${typeCfg.icon}`} style={{ fontSize: 22, color: C.primary }} />
          <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, textAlign: 'center', lineHeight: 1.3 }}>
            {typeCfg.label}
          </span>
        </div>

        {/* 6 stats — right, 3-col grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {stats.map(({ icon, label, value }) => (
            <div key={label} style={{
              background: '#F8F9FA',
              border: `1px solid #E2E8F0`,
              borderRadius: 8, padding: '8px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 12, color: C.textSec }} />
                <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </span>
              </div>
              <div style={{ fontFamily: F.headline, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Unit Overview ─────────────────────────────────────────────────────────────
function UnitOverview({ description }) {
  if (!description) return null;
  return (
    <Card>
      <SectionHeading title="Unit Overview" />
      <div style={{
        background: '#F8F9FA',
        border: `1px solid #E2E8F0`,
        borderRadius: 8, padding: '18px 20px',
        fontFamily: F.body, fontSize: 13, lineHeight: 1.75,
        color: C.textPrimary, whiteSpace: 'pre-wrap',
      }}>
        {description}
      </div>
    </Card>
  );
}

// ── Special Features ──────────────────────────────────────────────────────────
function SpecialFeatures({ amenities }) {
  const [showAll, setShowAll] = useState(false);
  if (!amenities?.length) return null;
  const shown = showAll ? amenities : amenities.slice(0, 6);
  return (
    <Card>
      <SectionHeading title="Special Features" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {shown.map((a, i) => {
          const name = a.amenity_name || a.name || '';
          const { icon, bg, color } = amenityStyle(name);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8, background: bg,
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />
              </div>
              <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>{name}</span>
            </div>
          );
        })}
      </div>
      {amenities.length > 6 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={() => setShowAll(v => !v)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary, padding: 0,
          }}>
            {showAll ? 'Show Less ↑' : 'See All →'}
          </button>
        </div>
      )}
    </Card>
  );
}

// ── Shared table styles ───────────────────────────────────────────────────────
const TH_STYLE = {
  fontFamily: F.body, fontSize: 10, fontWeight: 700, color: '#fff',
  background: C.primary, padding: '10px 14px', textAlign: 'left',
  textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
};
const TD_STYLE = {
  fontFamily: F.body, fontSize: 12, color: C.textPrimary,
  padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
};

function TabButtons({ tab, onTabClick, tabs = ['Current', 'Historical'] }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onTabClick(t.toLowerCase())} style={{
          padding: '5px 16px', borderRadius: 10, cursor: 'pointer',
          fontFamily: F.body, fontSize: 11, fontWeight: 700,
          background: tab === t.toLowerCase() ? C.primary : 'transparent',
          color:      tab === t.toLowerCase() ? '#fff'    : C.textSec,
          border:     `1.5px solid ${tab === t.toLowerCase() ? C.primary : C.borderMed}`,
        }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Owner Details ─────────────────────────────────────────────────────────────
function OwnerDetails({ unitId, currentOwnerships }) {
  const [tab,     setTab]     = useState('current');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  function onTabClick(t) {
    setTab(t);
    if (t === 'historical' && !loaded) {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      fetch(`${API}/api/units/${unitId}/ownerships/history/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => { setHistory(Array.isArray(data) ? data : data.results || []); setLoaded(true); })
        .catch(() => setLoaded(true))
        .finally(() => setLoading(false));
    }
  }

  const rows = tab === 'current' ? (currentOwnerships || []) : history;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeading title="Owner Details" style={{ margin: 0 }} />
        <TabButtons tab={tab} onTabClick={onTabClick} />
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Owner ID', 'Owner Name', 'Role', 'Stake', 'Start Date', 'End Date'].map(h => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ ...TD_STYLE, textAlign: 'center', color: C.textSec }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{ ...TD_STYLE, textAlign: 'center', color: C.textSec, padding: '24px 14px' }}>
                {tab === 'current' ? 'No current owners on record.' : 'No ownership history found.'}
              </td></tr>
            ) : rows.map((o, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                <td style={TD_STYLE}>
                  <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primaryBlue, background: '#EFF6FF', padding: '2px 7px', borderRadius: 5 }}>
                    #{o.owner_display_id || o.id}
                  </span>
                </td>
                <td style={{ ...TD_STYLE, fontWeight: 600 }}>{o.owner_name || '—'}</td>
                <td style={{ ...TD_STYLE, color: C.textSec }}>{o.ownership_role?.replace(/_/g, ' ') || '—'}</td>
                <td style={TD_STYLE}>
                  {o.equity_percentage != null ? (
                    <span style={{ fontWeight: 700, color: C.primary, background: '#EFF6FF', padding: '2px 8px', borderRadius: 5, fontSize: 12 }}>
                      {o.equity_percentage}%
                    </span>
                  ) : '—'}
                </td>
                <td style={{ ...TD_STYLE, color: C.textSec }}>{fmtDate(o.start_date)}</td>
                <td style={{ ...TD_STYLE, color: C.textSec }}>{o.end_date ? fmtDate(o.end_date) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Room-Bed Details (Student Housing only) ───────────────────────────────────
function RoomBedDetails({ rooms }) {
  if (!rooms?.length) return null;

  const OCCUPANCY_CFG = {
    occupied: { label: 'Full',    bg: '#FEE2E2', color: '#991B1B' },
    partial:  { label: 'Partial', bg: '#FEF3C7', color: '#92400E' },
    vacant:   { label: 'Vacant',  bg: '#DCFCE7', color: '#166534' },
  };

  return (
    <Card>
      <SectionHeading title="Room-Bed Details" />
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Room', 'Beds', 'Baths', 'Type', 'Occupancy', 'Action'].map(h => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => {
              const occStatus = room.status || 'vacant';
              const occCfg = OCCUPANCY_CFG[occStatus] || OCCUPANCY_CFG.vacant;
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                  <td style={{ ...TD_STYLE, fontWeight: 600 }}>Room {room.room_number}</td>
                  <td style={TD_STYLE}>{room.bed_count ?? '—'}</td>
                  <td style={TD_STYLE}>{room.bathroom_count ?? '—'}</td>
                  <td style={{ ...TD_STYLE, color: C.textSec, textTransform: 'capitalize' }}>{room.room_type || '—'}</td>
                  <td style={TD_STYLE}>
                    <span style={{
                      fontFamily: F.body, fontSize: 11, fontWeight: 700,
                      background: occCfg.bg, color: occCfg.color,
                      padding: '2px 9px', borderRadius: 10,
                    }}>
                      {occCfg.label}
                    </span>
                  </td>
                  <td style={TD_STYLE}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <i className="ti ti-eye" style={{ fontSize: 16, color: C.textSec }} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Tenant Details ────────────────────────────────────────────────────────────
function TenantDetails({ unitId, currentTenants, isStudentHousing }) {
  const [tab,     setTab]     = useState('current');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  function onTabClick(t) {
    setTab(t);
    if (t === 'historical' && !loaded) {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      fetch(`${API}/api/units/${unitId}/tenants/history/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => { setHistory(Array.isArray(data) ? data : data.results || []); setLoaded(true); })
        .catch(() => setLoaded(true))
        .finally(() => setLoading(false));
    }
  }

  const rows = tab === 'current' ? (currentTenants || []) : history;

  // Student housing columns include Room + Bed
  const headers = isStudentHousing
    ? ['Room', 'Bed', 'Tenant ID', 'Tenant Name', 'Lease ID', 'LS Start DT', 'LS End DT']
    : ['Tenant ID', 'Tenant Name', 'Lease ID', 'LS Start DT', 'LS End DT'];

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeading title="Tenant Details" style={{ margin: 0 }} />
        <TabButtons tab={tab} onTabClick={onTabClick} />
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{headers.map(h => <th key={h} style={TH_STYLE}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={headers.length} style={{ ...TD_STYLE, textAlign: 'center', color: C.textSec }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={headers.length} style={{ ...TD_STYLE, textAlign: 'center', color: C.textSec, padding: '24px 14px' }}>
                {tab === 'current' ? 'No current tenants.' : 'No tenant history found.'}
              </td></tr>
            ) : rows.map((t, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                {isStudentHousing && (
                  <>
                    <td style={{ ...TD_STYLE, fontWeight: 600 }}>{t.room || '—'}</td>
                    <td style={TD_STYLE}>{t.bed || '—'}</td>
                  </>
                )}
                <td style={TD_STYLE}>
                  <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primaryBlue, background: '#EFF6FF', padding: '2px 7px', borderRadius: 5 }}>
                    #{t.id}
                  </span>
                </td>
                <td style={{ ...TD_STYLE, fontWeight: 600 }}>{t.tenant_name || '—'}</td>
                <td style={TD_STYLE}>
                  <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, color: C.textSec, background: '#F1F5F9', padding: '2px 7px', borderRadius: 5 }}>
                    {t.lease_id || '—'}
                  </span>
                </td>
                <td style={{ ...TD_STYLE, color: C.textSec }}>{fmtDate(t.lease_start)}</td>
                <td style={{ ...TD_STYLE, color: C.textSec }}>{fmtDate(t.lease_end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Financial placeholder (navy) ──────────────────────────────────────────────
function FinancialCard() {
  return (
    <div style={{ background: C.navy, borderRadius: 12, padding: 20, boxShadow: '0 4px 18px rgba(0,20,60,0.18)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 14, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 14, fontWeight: 700, color: '#fff' }}>Financial Performance</span>
        </div>
        <i className="ti ti-external-link" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
      </div>
      {[
        { label: 'PAID INVOICES', tag: null    },
        { label: 'RENT',          tag: '/UNIT' },
        { label: 'OPEN INVOICES', tag: null    },
      ].map(({ label, tag }) => (
        <div key={label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
          <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: '#fff' }}>—</span>
            {tag && <span style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tag}</span>}
          </div>
        </div>
      ))}
      <p style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontStyle: 'italic', margin: '6px 0 10px' }}>
        Available after billing setup
      </p>
      <button style={{
        width: '100%', padding: '9px 0', borderRadius: 8,
        border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)',
        fontFamily: F.body, fontSize: 12, fontWeight: 700, color: '#fff',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <i className="ti ti-download" style={{ fontSize: 13 }} /> Download PDF Report
      </button>
    </div>
  );
}

// ── Bank Accounts (unit-specific: Owner Settlement + Unit Reserve) ─────────────
function BankAccountsCard({ accounts }) {
  // Filter to unit-specific modules only
  const unitAccounts = (accounts || []).filter(a =>
    ['OWNER_SETTLEMENT', 'UNIT_RESERVE'].includes(a.module)
  );

  return (
    <div style={{ background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', background: C.navy, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-building-bank" style={{ fontSize: 14, color: '#fff' }} />
        </div>
        <span style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: '#fff' }}>Bank Accounts</span>
      </div>

      <div style={{ padding: '0 20px' }}>
        {unitAccounts.length === 0 ? (
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSec, padding: '14px 0' }}>No bank accounts configured.</p>
        ) : unitAccounts.map((acct, i) => {
          const isLast  = i === unitAccounts.length - 1;
          const label   = MODULE_LABELS[acct.module] || acct.module?.replace(/_/g, ' ') || 'Account';
          return (
            <div key={i} style={{ padding: '14px 0', borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {acct.auto_refill != null && (
                    <span style={{
                      fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                      color: acct.auto_refill ? C.success : C.textTert,
                      background: acct.auto_refill ? C.successLight : '#F1F5F9',
                      padding: '2px 6px', borderRadius: 8,
                    }}>
                      AUTO-REFILL: {acct.auto_refill ? 'YES' : 'NO'}
                    </span>
                  )}
                  {acct.is_skipped ? (
                    <span style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.amberText, background: C.amberLight, padding: '2px 6px', borderRadius: 8 }}>Skipped</span>
                  ) : acct.is_verified ? (
                    <i className="ti ti-circle-check" style={{ color: C.success, fontSize: 16 }} />
                  ) : (
                    <i className="ti ti-lock" style={{ color: C.textTert, fontSize: 15 }} />
                  )}
                </div>
              </div>
              {acct.is_skipped ? (
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.textTert, margin: 0 }}>Not configured</p>
              ) : (
                <>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Account #</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{maskAcct(acct.account_number)}</div>
                  </div>
                  {acct.routing_number && (
                    <div style={{ marginBottom: acct.min_threshold != null ? 6 : 0 }}>
                      <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Routing / IFSC Code #</div>
                      <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSec }}>{acct.routing_number}</div>
                    </div>
                  )}
                  {acct.min_threshold != null && (
                    <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSec }}>
                      MIN THRESHOLD&nbsp;&nbsp;
                      <span style={{ fontWeight: 700, color: C.textPrimary }}>{fmtCurrency(acct.min_threshold)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}` }}>
        <button style={{
          width: '100%', padding: '9px 0', borderRadius: 8,
          border: `1.5px solid ${C.borderMed}`, background: C.cardBg,
          fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <i className="ti ti-settings" style={{ fontSize: 13 }} /> Manage Credentials
        </button>
      </div>
    </div>
  );
}

// ── Promotions ────────────────────────────────────────────────────────────────
function PromotionsCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: C.primary, borderRadius: 12, padding: 18, boxShadow: '0 4px 14px rgba(0,29,91,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-shield-check" style={{ fontSize: 14, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 12, fontWeight: 700, color: '#fff' }}>Get Verified Elite Status</span>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, margin: '0 0 10px' }}>
          Verified Elite PMs receive 3× more landlord inquiries and priority listing placement.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: F.body, fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>Apply Now →</button>
        </div>
      </div>
      <div style={{ background: C.successLight, borderRadius: 12, padding: 18, border: '1px solid #BBF7D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-credit-card" style={{ fontSize: 14, color: C.success }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>Automate Rent Collection</span>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 11, color: C.textSec, lineHeight: 1.6, margin: '0 0 10px' }}>
          Set up auto-collection and never chase a late payment again.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.success }}>Set Up →</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function PMUnitDetailPage() {
  const { id, unitId } = useParams();
  const navigate       = useNavigate();
  useShimmer();

  const [unit,    setUnit]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    setLoading(true);
    fetch(`${API}/api/properties/${id}/units/${unitId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setUnit(data); setLoading(false); })
      .catch(e   => { setError(e.message); setLoading(false); });
  }, [id, unitId]);

  // Mock fallback when API not ready
  // Uses MOCK_STUDENT if unitId ends in 'sh' or unit_type is student_room, else MOCK
  const prop = unit || (error ? MOCK : null);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg }}>
      <NavB activeId="all-props" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{
          height: 60, background: C.cardBg, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', width: 260 }}>
            <i className="ti ti-search" style={{ fontSize: 14, color: C.textTert }} />
            <input placeholder="Search…" style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: F.body, fontSize: 13, color: C.textPrimary, width: '100%' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <i className="ti ti-bell" style={{ fontSize: 18, color: C.textSec, cursor: 'pointer' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-user" style={{ fontSize: 15, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>Property Manager</div>
                <div style={{ fontFamily: F.body, fontSize: 10, color: C.textSec }}>PM Portal</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, fontFamily: F.body, fontSize: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: F.body, fontSize: 12, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-chevron-left" style={{ fontSize: 13 }} /> Properties
            </button>
            <span style={{ color: C.textTert }}>›</span>
            <button onClick={() => navigate(`/pm-portal/properties/${id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: F.body, fontSize: 12, color: C.textSec }}>
              {prop?.property?.name || '…'}
            </button>
            <span style={{ color: C.textTert }}>›</span>
            <span style={{ color: C.textPrimary, fontWeight: 600 }}>
              Unit {prop?.unit_number || '…'}
            </span>
          </div>

          {/* Error banner */}
          {error && !prop && (
            <div style={{ padding: '14px 18px', borderRadius: 8, marginBottom: 20, background: '#FEF2F2', border: '1px solid #FECACA', fontFamily: F.body, fontSize: 13, color: C.danger }}>
              <i className="ti ti-alert-triangle" style={{ marginRight: 8 }} />
              Failed to load unit: {error}
            </div>
          )}

          {/* ── Full-width title block ── */}
          {prop && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontFamily: F.headline, fontSize: 'clamp(22px,2.4vw,30px)', fontWeight: 700, color: C.textPrimary, margin: 0, lineHeight: 1.2 }}>
                    {prop.property?.name || '—'}&nbsp;
                    <span style={{ color: C.textSec, fontWeight: 400 }}>›</span>&nbsp;
                    Unit {prop.unit_number}
                  </h1>
                  {prop.status && <StatusBadge status={prop.status} />}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                  <button style={{ width: 36, height: 36, borderRadius: 8, cursor: 'pointer', background: '#FEF2F2', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-trash" style={{ fontSize: 15, color: C.danger }} />
                  </button>
                  <button onClick={() => navigate(`/pm-portal/properties/${id}/units/${unitId}/edit`)} style={{ width: 36, height: 36, borderRadius: 8, cursor: 'pointer', background: C.textPrimary, border: `1.5px solid ${C.textPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-pencil" style={{ fontSize: 15, color: '#fff' }} />
                  </button>
                </div>
              </div>
              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 13, color: C.danger, flexShrink: 0 }} />
                <span style={{ fontFamily: F.body, fontSize: 13, color: C.textSec }}>
                  {[prop.property?.street1, prop.property?.city, prop.property?.state].filter(Boolean).join(', ')}
                  {prop.floor ? ` · Floor ${prop.floor}` : ''}
                  {prop.tower ? ` · ${prop.tower}`       : ''}
                </span>
              </div>
            </div>
          )}

          {/* ── Two-col layout ── */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* LEFT COLUMN */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
              {loading && !prop ? (
                <>
                  <Skel h={36} w="50%" />
                  <Skel h={310} r={12} />
                  <Skel h={140} r={10} />
                  <Skel h={180} r={10} />
                  <Skel h={160} r={10} />
                  <Skel h={220} r={10} />
                </>
              ) : prop ? (
                <>
                  {/* Gallery */}
                  <Gallery unit={prop} />

                  {/* Unit Type + Stats */}
                  <UnitTypeCard unit={prop} />

                  {/* Unit Overview */}
                  <UnitOverview description={prop.description} />

                  {/* Special Features */}
                  {prop.amenities?.length > 0 && <SpecialFeatures amenities={prop.amenities} />}

                  {/* Owner Details */}
                  <OwnerDetails unitId={unitId} currentOwnerships={prop.ownerships} />

                  {/* Room-Bed Details — student housing only */}
                  {prop.student_housing && <RoomBedDetails rooms={prop.rooms} />}

                  {/* Tenant Details */}
                  <TenantDetails
                    unitId={unitId}
                    currentTenants={prop.tenants}
                    isStudentHousing={prop.student_housing}
                  />
                </>
              ) : null}
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loading && !prop ? (
                <>
                  <Skel h={260} r={12} />
                  <Skel h={320} r={12} />
                  <Skel h={180} r={12} />
                </>
              ) : (
                <>
                  <FinancialCard />
                  <BankAccountsCard accounts={prop?.bank_accounts} />
                  <PromotionsCard />
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
