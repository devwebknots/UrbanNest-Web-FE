import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavB from '../../components/layout/NavB';

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
  ACTIVE:                     { label: 'Active',                     bg: '#DCFCE7', color: '#166534', dot: '#16A34A' },
  DRAFT:                      { label: 'Draft',                      bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  PENDING:                    { label: 'Pending',                    bg: '#EEF2FF', color: '#3730A3', dot: '#6366F1' },
  PENDING_OWNER_VERIFICATION: { label: 'Pending Owner Verification', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  SUBMITTED:                  { label: 'Submitted',                  bg: '#EEF2FF', color: '#021A5D', dot: '#6366F1' },
  INACTIVE:                   { label: 'Inactive',                   bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  UNDER_REVIEW:               { label: 'Under Review',               bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
};

// ─── Property type display ────────────────────────────────────────────────────
const PROP_TYPES = [
  { key: 'APARTMENT_COMPLEX', label: 'Apartment',       icon: 'ti-building'           },
  { key: 'MULTI_FAMILY',      label: 'Multi Family',    icon: 'ti-building-community' },
  { key: 'TOWN_HOME',         label: 'Town Homes',      icon: 'ti-buildings'          },
  { key: 'INDIVIDUAL_HOUSE',  label: 'Individual Home', icon: 'ti-home'               },
  { key: 'STUDENT_HOUSING',   label: 'Student Housing', icon: 'ti-school'             },
];

// ─── Bank account module labels ───────────────────────────────────────────────
const MODULE_LABELS = {
  RENT_COLLECTION:  'Rent Account',
  OPERATIONAL:      'Operational Account',
  SECURITY_DEPOSIT: 'Security Deposit',
  RESERVE:          'Reserve Account',
  OWNER_SETTLEMENT: 'Owner Settlement',
  TAX:              'Tax Account',
  MAINTENANCE:      'Maintenance Fund',
};

// ─── Unsplash fallback images ─────────────────────────────────────────────────
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&auto=format&fit=crop';
const THUMB_FALLBACKS = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop',
];

// ─── API base URL ─────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// ─── Mock data (remove once API is wired) ────────────────────────────────────
const MOCK = {
  id:             1,
  property_name:  'Emerald Gardens',
  status:         'PENDING_OWNER_VERIFICATION',
  street_address: '123 Metropolitan Ave',
  city:           'Manhattan',
  state:          'NY',
  zip_code:       '10001',
  property_type:  'APARTMENT_COMPLEX',
  ownership_type: 'SELF_OWNED',
  description:    'Emerald Gardens represents the pinnacle of Manhattan residential luxury. This newly renovated multi-family complex features 48 high-specification units, ranging from studios to sprawling three-bedroom penthouses. The property integrates cutting-edge building management systems with classic architectural motifs, offering tenants a seamless blend of heritage and modern convenience.\n\nStrategically located in the heart of the Metropolitan district, it serves a demographic of high-net-worth professionals. Recent capital improvements include a complete lobby redesign, upgraded HVAC systems, and the installation of a state-of-the-art security perimeter.',
  total_units:    48,
  primary_image:  null,
  gallery_images: [],
  amenities: [
    { amenity_name: 'Smart Home'               },
    { amenity_name: '24 hours CCTV'            },
    { amenity_name: 'EV Charging'              },
    { amenity_name: 'Near public transport'    },
    { amenity_name: 'Short/Long term lease'    },
    { amenity_name: 'Zero Deposit'             },
    { amenity_name: 'Swimming Pool'            },
    { amenity_name: 'Gym'                      },
  ],
  ownerships: [
    { id: 882, owner_display_id: 'OWN-882', owner_name: 'Sterling Asset',   ownership_role: 'PRIMARY_OWNER', equity_percentage: 85, start_date: '2020-01-12', end_date: null },
    { id: 104, owner_display_id: 'OWN-104', owner_name: 'Vanderbilt Trust',  ownership_role: 'CO_OWNER',      equity_percentage: 15, start_date: '2021-03-05', end_date: null },
  ],
  bank_accounts: [
    { module: 'RENT_COLLECTION',  account_number: '88421220', routing_number: 'CHASE-821-NY', bank_name: 'Chase',  is_verified: true,  is_skipped: false, auto_refill: null,  min_threshold: null,   security_deposit_amount: null   },
    { module: 'OPERATIONAL',      account_number: '10045591', routing_number: 'CHASE-821-NY', bank_name: 'Chase',  is_verified: false, is_skipped: false, auto_refill: null,  min_threshold: null,   security_deposit_amount: null   },
    { module: 'SECURITY_DEPOSIT', account_number: '33290012', routing_number: 'CHASE-821-NY', bank_name: 'Chase',  is_verified: true,  is_skipped: false, auto_refill: null,  min_threshold: null,   security_deposit_amount: 750    },
    { module: 'RESERVE',          account_number: '44108821', routing_number: 'CHASE-821-NY', bank_name: 'Chase',  is_verified: true,  is_skipped: false, auto_refill: true,  min_threshold: 350,    security_deposit_amount: null   },
  ],
  units: [
    { id: 1, unit_number: '101', status: 'AVAILABLE',   rent_amount: 2500 },
    { id: 2, unit_number: '102', status: 'OCCUPIED',    rent_amount: 2800 },
    { id: 3, unit_number: '103', status: 'DRAFT',       rent_amount: null },
    { id: 4, unit_number: '201', status: 'AVAILABLE',   rent_amount: 3100 },
    { id: 5, unit_number: '202', status: 'COMING_SOON', rent_amount: 2950 },
    { id: 6, unit_number: '203', status: 'OCCUPIED',    rent_amount: 2700 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Mask to last 4 — NOTE: ideally done server-side in serializer
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
  if (v == null) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

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

// ─── Shimmer keyframe (injected once) ────────────────────────────────────────
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



// ── Gallery — 1 large hero left + 2×2 thumbs right ───────────────────────────
function Gallery({ property }) {
  const hero   = property.primary_image || HERO_FALLBACK;
  const thumbs = property.gallery_images?.length ? property.gallery_images : THUMB_FALLBACKS;
  const extra  = Math.max(0, (property.gallery_images?.length || 0) - 4);

  const TOTAL_H = 310;
  const THUMB_H = (TOTAL_H - 6) / 2; // 6px = the gap between the two rows

  return (
    <div style={{ display: 'flex', gap: 6, height: TOTAL_H, borderRadius: 12, overflow: 'hidden' }}>

      {/* Hero — left, full height */}
      <div style={{ flex: '0 0 55%', position: 'relative', overflow: 'hidden' }}>
        <img src={hero} alt={property.property_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* Right side — 2 columns × 2 rows of equal thumbs */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', gap: 6, height: THUMB_H }}>
          {[0, 1].map(i => {
            const src = typeof thumbs[i] === 'string' ? thumbs[i] : (thumbs[i]?.image_url || THUMB_FALLBACKS[i]);
            return (
              <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <img src={src} alt={`view-${i}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* VIDEO TOUR badge on slot 1 */}
                {i === 1 && (
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(0,0,0,0.62)', borderRadius: 5,
                    padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <i className="ti ti-player-play-filled" style={{ color: '#fff', fontSize: 10 }} />
                    <span style={{ color: '#fff', fontFamily: F.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.07em' }}>
                      VIDEO TOUR
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Row 2 */}
        <div style={{ display: 'flex', gap: 6, height: THUMB_H }}>
          {[2, 3].map(i => {
            const src = typeof thumbs[i] === 'string' ? thumbs[i] : (thumbs[i]?.image_url || THUMB_FALLBACKS[i]);
            const isLast = i === 3;
            return (
              <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <img src={src} alt={`view-${i}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* +N Photos overlay on last slot */}
                {isLast && extra > 0 && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <span style={{ color: '#fff', fontFamily: F.body, fontWeight: 700, fontSize: 13 }}>
                      +{extra} Photos
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
function PropertyTypePills({ activeType }) {
  return (
    <div>
      <h2 style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: '0 0 14px 0' }}>
        Property Type
      </h2>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {PROP_TYPES.map(({ key, label, icon }) => {
          const active = key === activeType;
          return (
            <div key={key} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '14px 18px', borderRadius: 10, minWidth: 88, cursor: 'default',
              background: active ? '#EFF6FF' : C.cardBg,
              border: `1.5px solid ${active ? C.primary : C.border}`,
            }}>
              <i className={`ti ${icon}`} style={{ fontSize: 22, color: active ? C.primary : C.textTert }} />
              <span style={{
                fontFamily: F.body, fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? C.primary : C.textSec, textAlign: 'center', lineHeight: 1.3,
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Property Overview ─────────────────────────────────────────────────────────
function PropertyOverview({ description }) {
  if (!description) return null;
  return (
    <div>
      <h2 style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: '0 0 14px 0' }}>
        Property Overview
      </h2>
      <div style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '18px 20px',
        fontFamily: F.body, fontSize: 13, lineHeight: 1.75,
        color: C.textPrimary, whiteSpace: 'pre-wrap',
      }}>
        {description}
      </div>
    </div>
  );
}

// ── Special Features ──────────────────────────────────────────────────────────
function SpecialFeatures({ amenities }) {
  const [showAll, setShowAll] = useState(false);
  if (!amenities?.length) return null;
  const shown = showAll ? amenities : amenities.slice(0, 6);

  return (
    <div>
      <h2 style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: '0 0 14px 0' }}>
        Special Features
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {shown.map((a, i) => {
          const name = a.amenity_name || a.name || '';
          const { icon, bg, color } = amenityStyle(name);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8, background: bg,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                background: 'rgba(255,255,255,0.65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />
              </div>
              <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>
                {name}
              </span>
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
    </div>
  );
}

// ── Owner Details table ───────────────────────────────────────────────────────
function OwnerDetails({ propertyId, currentOwnerships }) {
  const [tab,     setTab]     = useState('current');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  function onTabClick(t) {
    setTab(t);
    if (t === 'historical' && !loaded) {
      setLoading(true);
      const token = localStorage.getItem('access_Token') || sessionStorage.getItem('access_Token');
      fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/api/properties/${propertyId}/ownerships/history/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(r => r.ok ? r.json() : [])
        .then(data => { setHistory(Array.isArray(data) ? data : data.results || []); setLoaded(true); })
        .catch(() => setLoaded(true))
        .finally(() => setLoading(false));
    }
  }

  const rows = tab === 'current' ? (currentOwnerships || []) : history;

  const TH = ({ children }) => (
    <th style={{
      fontFamily: F.body, fontSize: 10, fontWeight: 700, color: '#fff',
      background: C.primary, padding: '10px 14px', textAlign: 'left',
      textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
    }}>{children}</th>
  );
  const TD = ({ children, style }) => (
    <td style={{
      fontFamily: F.body, fontSize: 12, color: C.textPrimary,
      padding: '12px 14px', borderBottom: `1px solid ${C.border}`, ...style,
    }}>{children}</td>
  );

  const roleLabel = r => r?.replace(/_/g, ' ') || '—';

  return (
    <div>
      {/* heading + tabs row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: F.headline, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
          Owner Details
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['current', 'historical'].map(t => (
            <button key={t} onClick={() => onTabClick(t)} style={{
              padding: '5px 16px', borderRadius: 10, cursor: 'pointer',
              fontFamily: F.body, fontSize: 11, fontWeight: 700,
              background: tab === t ? C.primary : 'transparent',
              color:      tab === t ? '#fff'    : C.textSec,
              border:     `1.5px solid ${tab === t ? C.primary : C.borderMed}`,
              textTransform: 'capitalize',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <TH>Owner ID</TH>
              <TH>Owner Name</TH>
              <TH>Role</TH>
              <TH>Stake</TH>
              <TH>Start DT</TH>
              <TH>End DT</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px 14px', textAlign: 'center', fontFamily: F.body, fontSize: 12, color: C.textSec }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px 14px', textAlign: 'center', fontFamily: F.body, fontSize: 12, color: C.textSec }}>
                  {tab === 'current' ? 'No current owners on record.' : 'No ownership history found.'}
                </td>
              </tr>
            ) : rows.map((o, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                <TD>
                  <span style={{
                    fontFamily: F.body, fontSize: 11, fontWeight: 700,
                    color: C.primaryBlue, background: '#EFF6FF',
                    padding: '2px 7px', borderRadius: 5,
                  }}>
                    #{o.owner_display_id || o.id}
                  </span>
                </TD>
                <TD style={{ fontWeight: 600 }}>{o.owner_name || '—'}</TD>
                <TD style={{ color: C.textSec }}>{roleLabel(o.ownership_role)}</TD>
                <TD>
                  {o.equity_percentage != null ? (
                    <span style={{
                      fontFamily: F.body, fontSize: 12, fontWeight: 700,
                      color: C.primary, background: '#EFF6FF',
                      padding: '2px 8px', borderRadius: 5,
                    }}>
                      {o.equity_percentage}%
                    </span>
                  ) : '—'}
                </TD>
                <TD style={{ color: C.textSec }}>{fmtDate(o.start_date)}</TD>
                <TD style={{ color: C.textSec }}>{o.end_date ? fmtDate(o.end_date) : '—'}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Financial Performance (placeholder, navy) ─────────────────────────────────
function FinancialCard() {
  const rows = [
    { label: 'PAID INVOICES',  value: '—', tag: null        },
    { label: 'RENT',           value: '—', tag: '/UNIT'     },
    { label: 'OPEN INVOICES',  value: '—', tag: null        },
  ];
  return (
    <div style={{
      background: C.navy, borderRadius: 12, padding: 20,
      boxShadow: '0 4px 18px rgba(0,20,60,0.18)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 14, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 14, fontWeight: 700, color: '#fff' }}>
            Financial Performance
          </span>
        </div>
        <i className="ti ti-external-link" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
      </div>

      {/* stat rows */}
      {rows.map(({ label, value, tag }) => (
        <div key={label} style={{
          background: 'rgba(255,255,255,0.07)', borderRadius: 8,
          padding: '10px 14px', marginBottom: 8,
        }}>
          <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: F.headline, fontSize: 22, fontWeight: 700, color: '#fff' }}>{value}</span>
            {tag && <span style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tag}</span>}
          </div>
        </div>
      ))}

      <p style={{ fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.3)',
        textAlign: 'center', fontStyle: 'italic', margin: '6px 0 10px' }}>
        Available after billing setup
      </p>

      <button style={{
        width: '100%', padding: '9px 0', borderRadius: 8,
        border: '1.5px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.07)',
        fontFamily: F.body, fontSize: 12, fontWeight: 700, color: '#fff',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <i className="ti ti-download" style={{ fontSize: 13 }} />
        Download PDF Report
      </button>
    </div>
  );
}

// ── Bank Accounts card ────────────────────────────────────────────────────────
function BankAccountsCard({ accounts }) {
  return (
    <div style={{
      background: C.cardBg, borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden',
    }}>
      {/* card header — navy bg matching Financial Performance */}
      <div style={{
        padding: '14px 20px', background: C.navy,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i className="ti ti-building-bank" style={{ fontSize: 14, color: '#fff' }} />
        </div>
        <span style={{ fontFamily: F.headline, fontSize: 15, fontWeight: 700, color: '#fff' }}>
          Bank Accounts
        </span>
      </div>

      {/* account rows */}
      <div style={{ padding: '0 20px' }}>
        {(!accounts || accounts.length === 0) ? (
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.textSec, padding: '14px 0' }}>
            No bank accounts configured.
          </p>
        ) : accounts.map((acct, i) => {
          const isLast  = i === accounts.length - 1;
          const label   = MODULE_LABELS[acct.module] || acct.module?.replace(/_/g, ' ') || 'Account';
          const masked  = maskAcct(acct.account_number);
          const routing = acct.routing_number || '—';

          return (
            <div key={i} style={{ padding: '14px 0', borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
              {/* module name + status icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Security deposit amount */}
                  {acct.security_deposit_amount != null && (
                    <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary }}>
                      {fmtCurrency(acct.security_deposit_amount)}
                    </span>
                  )}
                  {/* Auto-refill toggle display */}
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
                  {/* Verified / lock icon */}
                  {acct.is_skipped ? (
                    <span style={{
                      fontFamily: F.body, fontSize: 9, fontWeight: 700,
                      color: C.amberText, background: C.amberLight,
                      padding: '2px 6px', borderRadius: 8,
                    }}>Skipped</span>
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
                  {/* Account number */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textSec,
                      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                      Account #
                    </div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 600, color: C.textPrimary }}>
                      {masked}
                    </div>
                  </div>
                  {/* Routing */}
                  <div style={{ marginBottom: acct.min_threshold != null ? 6 : 0 }}>
                    <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.textSec,
                      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                      Routing / IFSC Code #
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSec }}>
                      {routing}
                    </div>
                  </div>
                  {/* Min threshold */}
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

      {/* Manage Credentials button */}
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}` }}>
        <button style={{
          width: '100%', padding: '9px 0', borderRadius: 8,
          border: `1.5px solid ${C.borderMed}`, background: C.cardBg,
          fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <i className="ti ti-settings" style={{ fontSize: 13 }} />
          Manage Credentials
        </button>
      </div>
    </div>
  );
}

// ── Units Summary Card (top of sidebar) ──────────────────────────────────────
function UnitsSummaryCard({ propertyId, units }) {
  const navigate = useNavigate();

  const statusColors = {
    AVAILABLE:   { bg: '#DCFCE7', color: '#166534' },
    OCCUPIED:    { bg: '#FEE2E2', color: '#991B1B' },
    COMING_SOON: { bg: '#EEF2FF', color: '#3730A3' },
    DRAFT:       { bg: '#FEF3C7', color: '#92400E' },
    default:     { bg: '#F1F5F9', color: '#64748B' },
  };

  const displayed = (units || []).slice(0, 5);
  const remaining = Math.max(0, (units?.length || 0) - 5);

  return (
    <div style={{
      background: C.cardBg, borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', background: C.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-door" style={{ fontSize: 13, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 14, fontWeight: 700, color: '#fff' }}>Units Summary</span>
        </div>
        <span style={{
          fontFamily: F.body, fontSize: 11, fontWeight: 700,
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          padding: '2px 8px', borderRadius: 10,
        }}>
          {units?.length || 0} Total
        </span>
      </div>

      {/* Unit rows */}
      <div style={{ padding: '8px 0' }}>
        {!units?.length ? (
          <div style={{ padding: '16px 18px', textAlign: 'center', fontFamily: F.body, fontSize: 12, color: C.textTert }}>
            No units added yet.
          </div>
        ) : displayed.map((unit, i) => {
          const scfg = statusColors[unit.status] || statusColors.default;
          return (
            <div
              key={unit.id || i}
              onClick={() => navigate(`/pm-portal/properties/${propertyId}/units/${unit.id}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 18px', cursor: 'pointer',
                borderBottom: i < displayed.length - 1 ? `1px solid ${C.border}` : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-door" style={{ fontSize: 12, color: C.primary }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                    Unit {unit.unit_number}
                  </div>
                  {unit.rent_amount && (
                    <div style={{ fontFamily: F.body, fontSize: 11, color: C.textSec }}>
                      ${Number(unit.rent_amount).toLocaleString()}/mo
                    </div>
                  )}
                </div>
              </div>
              <span style={{
                fontFamily: F.body, fontSize: 10, fontWeight: 700,
                background: scfg.bg, color: scfg.color,
                padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap',
              }}>
                {unit.status?.replace(/_/g, ' ') || '—'}
              </span>
            </div>
          );
        })}

        {/* View all link */}
        {(remaining > 0 || (units?.length || 0) > 0) && (
          <div style={{ padding: '10px 18px', borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={() => navigate(`/pm-portal/properties/portfolio/${units?.[0]?.property_type || ''}`)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {remaining > 0 ? `View all ${units.length} units →` : 'View all units →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Promotions (replaces Management Status) ───────────────────────────────────
function PromotionsCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Dark promo */}
      <div style={{
        background: C.primary, borderRadius: 12, padding: 18,
        boxShadow: '0 4px 14px rgba(0,29,91,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-shield-check" style={{ fontSize: 14, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 12, fontWeight: 700, color: '#fff' }}>
            Get Verified Elite Status
          </span>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, margin: '0 0 10px' }}>
          Verified Elite PMs receive 3× more landlord inquiries and priority listing placement across UrbanNest.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: F.body, fontSize: 11, fontWeight: 700, color: '#60A5FA',
          }}>
            Apply Now →
          </button>
        </div>
      </div>

      {/* Light promo */}
      <div style={{
        background: C.successLight, borderRadius: 12, padding: 18,
        border: `1px solid #BBF7D0`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(22,163,74,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-credit-card" style={{ fontSize: 14, color: C.success }} />
          </div>
          <span style={{ fontFamily: F.headline, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
            Automate Rent Collection
          </span>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 11, color: C.textSec, lineHeight: 1.6, margin: '0 0 10px' }}>
          Set up auto-collection and never chase a late payment again.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.success,
          }}>
            Set Up →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skel({ h = 16, w = '100%', r = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function PMPropertyDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  useShimmer();

  const [property, setProperty] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [units,    setUnits]    = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/properties/${id}/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setProperty(data); setLoading(false); })
      .catch(e   => { setError(e.message); setLoading(false); });

    // Fetch units for Units Summary sidebar card
    fetch(`${API}/api/properties/${id}/units/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
        .then(r => r.ok ? r.json() : [])
      .then(data => setUnits(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [id, API]);

  // Use mock while API not ready — remove this block once wired
  useEffect(() => {
    if (!loading && !property && !error) setProperty(MOCK);
  }, [loading, property, error]);

  // Dev fallback: use mock if API fails or no data yet
  // TODO: remove MOCK once PropertyDetailSerializer + endpoint are wired
  const prop = property || (error ? MOCK : null);
  const sidebarUnits = units.length > 0 ? units : (error ? MOCK.units : []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg }}>
      <NavB activeId="all-props" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          height: 60, background: C.cardBg, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            background: '#F8FAFC', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '6px 12px', width: 260 }}>
            <i className="ti ti-search" style={{ fontSize: 14, color: C.textTert }} />
            <input placeholder="Search…" style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontFamily: F.body, fontSize: 13, color: C.textPrimary, width: '100%',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <i className="ti ti-bell" style={{ fontSize: 18, color: C.textSec, cursor: 'pointer' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-user" style={{ fontSize: 15, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textPrimary }}>Property Manager</div>
                <div style={{ fontFamily: F.body, fontSize: 10, color: C.textSec }}>PM Portal</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18,
            fontFamily: F.body, fontSize: 12 }}>
            <button onClick={() => navigate(-1)} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: F.body, fontSize: 12, color: C.textSec,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <i className="ti ti-chevron-left" style={{ fontSize: 13 }} />
              Properties
            </button>
            <span style={{ color: C.textTert }}>›</span>
            <span style={{ color: C.textPrimary, fontWeight: 600 }}>
              {prop?.property_name || '…'}
            </span>
          </div>

          {/* Error — only show if no mock fallback covering it */}
          {error && !prop && (
            <div style={{
              padding: '14px 18px', borderRadius: 8, marginBottom: 20,
              background: '#FEF2F2', border: '1px solid #FECACA',
              fontFamily: F.body, fontSize: 13, color: C.danger,
            }}>
              <i className="ti ti-alert-triangle" style={{ marginRight: 8 }} />
              Failed to load property: {error}
            </div>
          )}

          {/* ── Full-width: Title block ───────────────────────────────── */}
          {prop && (
            <div style={{ marginBottom: 24 }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                  <h1 style={{
                    fontFamily: F.headline, fontSize: 'clamp(22px, 2.4vw, 30px)',
                    fontWeight: 700, color: C.textPrimary, margin: 0, lineHeight: 1.2,
                  }}>
                    {prop.property_name}
                  </h1>
                  {prop.status && <StatusBadge status={prop.status} />}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                  <button style={{
                    width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                    background: '#FEF2F2', border: '1.5px solid #FECACA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ti ti-trash" style={{ fontSize: 15, color: C.danger }} />
                  </button>
                  <button onClick={() => navigate(`/pm-portal/properties/${id}/edit`)} style={{
                    width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                    background: C.textPrimary, border: `1.5px solid ${C.textPrimary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ti ti-pencil" style={{ fontSize: 15, color: '#fff' }} />
                  </button>
                </div>
              </div>
              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 13, color: C.danger, flexShrink: 0 }} />
                <span style={{ fontFamily: F.body, fontSize: 13, color: C.textSec }}>
                  {[prop.street_address, prop.city, prop.state, prop.zip_code].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Two-col layout */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>

              {loading && !prop ? (
                <>
                  <Skel h={36} w="50%" />
                  <Skel h={340} r={12} />
                  <Skel h={140} r={10} />
                  <Skel h={200} r={10} />
                  <Skel h={160} r={10} />
                  <Skel h={220} r={10} />
                </>
              ) : prop ? (
                <>
                  {/* Gallery — inside left column as before */}
                  <Gallery property={prop} />

                  {/* Property Type */}
                  <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                    <PropertyTypePills activeType={prop.property_type} />
                  </div>

                  {/* Property Overview */}
                  <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                    <PropertyOverview description={prop.description} />
                  </div>

                  {/* Special Features */}
                  {prop.amenities?.length > 0 && (
                    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                      <SpecialFeatures amenities={prop.amenities} />
                    </div>
                  )}

                  {/* Owner Details */}
                  <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                    <OwnerDetails propertyId={id} currentOwnerships={prop.ownerships} />
                  </div>
                </>
              ) : null}
            </div>

            {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
            <div style={{ width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loading && !prop ? (
                <>
                  <Skel h={260} r={12} />
                  <Skel h={380} r={12} />
                  <Skel h={180} r={12} />
                </>
              ) : (
                <>
                  <UnitsSummaryCard propertyId={id} units={sidebarUnits} />
                  <FinancialCard />
                  <BankAccountsCard accounts={prop?.bank_accounts} />
                  <PromotionsCard />
                </>
              )}
            </div>

          </div>{/* end two-col */}
        </div>{/* end scroll */}
      </div>{/* end main */}
    </div>
  );
}
