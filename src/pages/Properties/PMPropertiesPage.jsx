/**
 * PMPropertiesPage.jsx — Session 25
 * Route: /pm-portal/properties
 * activeId: 'all-props'
 * Matches Figma: category cards with hero images, Residential/Commercial tabs
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../components/layout/NavB';
import Header from '../../components/layout/Header';

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
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const PROPERTY_TYPE_CONFIG = {
  APARTMENT_COMPLEX: {
    label: 'Apartment',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
    description: 'Modern multi-unit residential buildings located in prime metropolitan areas with shared amenities.',
    tab: 'residential',
  },
  MULTI_FAMILY: {
    label: 'Multi Family',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    description: 'Duplexes, triplexes, and small-scale apartment complexes designed for suburban living.',
    tab: 'residential',
  },
  TOWNHOME: {
    label: 'Town House',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80',
    description: 'Row-style housing units offering multiple floors and private entrances in urban clusters.',
    tab: 'residential',
  },
  CONDOMINIUM: {
    label: 'Condominiums',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
    description: 'High-rise luxury units with premium finishes and comprehensive building management services.',
    tab: 'residential',
  },
  STUDENT_HOUSING: {
    label: 'Student Housing',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    description: 'Specialized residential assets located near major universities with shared common spaces.',
    tab: 'residential',
  },
  INDIVIDUAL_HOUSE: {
    label: 'Individual House',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80',
    description: 'Single-family detached dwellings managed as high-end rental assets in premium suburbs.',
    tab: 'residential',
  },
  VILLA: {
    label: 'Villa',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    description: 'Premium standalone villas with private outdoor spaces and luxury finishes.',
    tab: 'residential',
  },
  SERVICED_APARTMENT: {
    label: 'Serviced Apartment',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    description: 'Hotel-style units with professional management and full amenity packages.',
    tab: 'residential',
  },
  COMMERCIAL: {
    label: 'Commercial',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
    description: 'Non-residential units for retail, office, or mixed commercial use in key locations.',
    tab: 'commercial',
  },
  MIXED_USE: {
    label: 'Mixed Use',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
    description: 'Combined residential and commercial spaces in a single strategically located property.',
    tab: 'commercial',
  },
};

function getOccupancyConfig(pct) {
  if (pct >= 90) return { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' };
  if (pct >= 70) return { bg: '#FEF3C7', border: '#FCD34D', color: '#92400E' };
  return { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' };
}

export default function PMPropertiesPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('residential');
  const [userName, setUserName]     = useState('');
  const [userRole, setUserRole]     = useState('Independent PM');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }

    fetch('http://localhost:8001/api/auth/me/', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setUserName(((data.first_name || '') + ' ' + (data.last_name || '')).trim() || data.email);
        const roleMap = { INDEPENDENT_PM: 'Independent PM', ORGANIZATIONAL_PM: 'Org PMS Admin' };
        setUserRole(roleMap[data.active_persona] || 'Independent PM');
      }
    }).catch(() => {});

    fetch('http://localhost:8001/api/properties/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(data => { setProperties(data); setLoading(false); })
      .catch(() => { setError('Could not load properties.'); setLoading(false); });
  }, [navigate]);

  const grouped = properties.reduce((acc, prop) => {
    const type = prop.property_type || 'UNKNOWN';
    if (!acc[type]) acc[type] = [];
    acc[type].push(prop);
    return acc;
  }, {});

  const filteredGroups = Object.entries(grouped).filter(([type]) => {
    const cfg = PROPERTY_TYPE_CONFIG[type];
    return cfg?.tab === activeTab;
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        .prop-scroll::-webkit-scrollbar { width: 5px; }
        .prop-scroll::-webkit-scrollbar-track { background: transparent; }
        .prop-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>
        <NavB activeId="all-props" />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header userName={userName} userRole={userRole} />

          <div className="prop-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px 60px' }}>

            {/* Page heading */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: F.headline, fontSize: 28, fontWeight: 700, color: C.textPrimary, margin: '0 0 8px' }}>
                    All Properties
                    </h1>
                    <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSec, margin: 0, lineHeight: 1.7, maxWidth: 560 }}>
                    Manage and monitor your entire real estate portfolio across residential and commercial sectors. View occupancy rates, unit breakdowns, and asset performance.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/pm-portal/properties/add')}
                    onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
                    onMouseLeave={e => e.currentTarget.style.background = C.primary}
                    style={{ background: C.primary, color: C.white, border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s', flexShrink: 0 }}>
                    <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add Property
                </button>
                </div>
            
            {/* Residential / Commercial tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 28 }}>
              {[
                { id: 'residential', label: 'RESIDENTIAL' },
                { id: 'commercial',  label: 'COMMERCIAL'  },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: '10px 22px', border: 'none', background: 'transparent',
                    fontFamily: F.body, fontSize: 13, fontWeight: isActive ? 650 : 450,
                    color: isActive ? C.primary : C.textTert,
                    borderBottom: isActive ? `2.5px solid ${C.primary}` : '2.5px solid transparent',
                    cursor: 'pointer', marginBottom: -1, outline: 'none',
                    transition: 'all 0.15s', letterSpacing: '0.04em',
                  }}>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: C.textSec, fontFamily: F.body, fontSize: 13 }}>
                Loading properties…
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '14px 18px', color: '#991B1B', fontFamily: F.body, fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Empty — no properties at all */}
            {!loading && !error && properties.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 40px', border: `1.5px dashed ${C.borderMed}`, borderRadius: 12, background: C.cardBg }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <i className="ti ti-building-estate" style={{ fontSize: 26, color: C.primary }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 6 }}>No properties yet</div>
                <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body, marginBottom: 24, lineHeight: 1.6 }}>Add your first property to start building your portfolio.</div>
                <button onClick={() => navigate('/pm-portal/properties/add')} style={{ background: C.primary, color: C.white, border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  + Add Property
                </button>
              </div>
            )}

            {/* Empty — no properties in this tab */}
            {!loading && !error && properties.length > 0 && filteredGroups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.textSec, fontFamily: F.body, fontSize: 13 }}>
                <i className="ti ti-building-off" style={{ fontSize: 28, display: 'block', marginBottom: 10, color: C.textTert }} />
                No {activeTab} properties in your portfolio yet.
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => navigate('/pm-portal/properties/add')} style={{ background: C.primary, color: C.white, border: 'none', borderRadius: 8, padding: '9px 20px', fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    + Add Property
                  </button>
                </div>
              </div>
            )}

            {/* Category cards — 3 column grid */}
            {!loading && !error && filteredGroups.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 290px))', gap: 24 , justifyContent: 'start' }}>
                {filteredGroups.map(([type, props]) => (
                  <CategoryCard key={type} type={type} properties={props} onClick={() => navigate(`/pm-portal/properties/portfolio/${type}`)} />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

function CategoryCard({ type, properties, onClick }) {
  const [hover, setHover] = useState(false);
  const cfg = PROPERTY_TYPE_CONFIG[type] || {
    label: type.replace(/_/g, ' '),
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
    description: 'Properties in this category.',
  };

  const totalUnits  = properties.reduce((s, p) => s + (p.unit_count || 0), 0);
  const activeCount = properties.filter(p => p.status === 'ACTIVE').length;
  const totalProps  = properties.length;
  const occupancyPct = totalProps > 0 ? Math.round((activeCount / totalProps) * 100) : 0;
  const occCfg = getOccupancyConfig(occupancyPct);

  const unitLabel = type === 'STUDENT_HOUSING' ? 'Beds' : type === 'INDIVIDUAL_HOUSE' ? 'Homes' : 'Units';
  const unitDisplay = totalUnits > 0 ? `${totalUnits} ${unitLabel}` : `${totalProps} ${totalProps === 1 ? 'Property' : 'Properties'}`;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.cardBg, borderRadius: 12, overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hover ? '0 8px 28px rgba(0,45,91,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
        border: `1px solid ${hover ? '#93C5FD' : C.border}`,
        transition: 'all 0.18s',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Hero image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: '#1a2744' }}>
        <img
          src={cfg.image}
          alt={cfg.label}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.35s ease',
            transform: hover ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 100%)',
        }} />
        {/* Category label */}
        <div style={{ position: 'absolute', bottom: 16, left: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.65)', fontFamily: F.body, marginBottom: 4 }}>
            CATEGORY
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: F.headline, lineHeight: 1.15, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            {cfg.label}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '18px 20px 20px' }}>
        {/* Total units */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.textTert, fontFamily: F.body }}>
            TOTAL UNITS
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>
            {unitDisplay}
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 12.5, color: C.textSec, fontFamily: F.body, lineHeight: 1.65, margin: '0 0 18px' }}>
          {cfg.description}
        </p>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          {/* Occupancy badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: occCfg.bg, border: `1px solid ${occCfg.border}`,
            color: occCfg.color, borderRadius: 99, padding: '4px 12px',
            fontSize: 12, fontWeight: 700, fontFamily: F.body,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: occCfg.color, flexShrink: 0 }} />
            {occupancyPct}% Active
          </div>

          {/* View Portfolio */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 700,
            color: hover ? C.primary : C.textSec,
            fontFamily: F.body, transition: 'color 0.15s',
          }}>
            View Portfolio <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
