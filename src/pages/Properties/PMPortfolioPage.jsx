/**
 * PMPortfolioPage.jsx — Session 25
 * Route: /pm-portal/properties/portfolio/:propertyType
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavB from '../../components/layout/NavB';
import Header from '../../components/layout/Header';

const C = {
  primary:      '#002D5B',
  primaryHover: '#003d7a',
  white:        '#FFFFFF',
  pageBg:       '#F8FAFC',
  cardBg:       '#FFFFFF',
  border:       '#E2E8F0',
  borderMed:    '#CBD5E1',
  textPrimary:  '#0F172A',
  textSec:      '#64748B',
  textTert:     '#94A3B8',
  success:      '#16A34A',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const PROPERTY_TYPE_CONFIG = {
  APARTMENT_COMPLEX:  { label: 'Apartment',       icon: 'ti-building'            },
  MULTI_FAMILY:       { label: 'Multi-family',     icon: 'ti-building-community'  },
  INDIVIDUAL_HOUSE:   { label: 'Individual Homes', icon: 'ti-home'                },
  CONDOMINIUM:        { label: 'Condos',           icon: 'ti-building-skyscraper' },
  STUDENT_HOUSING:    { label: 'Student Housing',  icon: 'ti-school'              },
  TOWNHOME:           { label: 'Town Homes',       icon: 'ti-building-arch'       },
  VILLA:              { label: 'Villa',            icon: 'ti-pool'                },
  SERVICED_APARTMENT: { label: 'Serviced Apt',     icon: 'ti-star'                },
  COMMERCIAL:         { label: 'Commercial',       icon: 'ti-briefcase'           },
  MIXED_USE:          { label: 'Mixed Use',        icon: 'ti-layout-grid'         },
};

function getUnitPhoto(unit) {
  if (unit.primary_image) return unit.primary_image;
  const photos = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&q=80',
    'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&q=80',
  ];
  const idx = unit.id ? parseInt(String(unit.id).replace(/\D/g, ''), 10) % photos.length : 0;
  return photos[isNaN(idx) ? 0 : idx];
}

function UnitCard({ unit }) {
  const [hover, setHover] = useState(false);
  const isOccupied = ['OCCUPIED', 'occupied'].includes(unit.status);

  const unitTypeLabel = {
    studio: 'Studio', '1br': '1 Bed', '2br': '2 Bed', '3br': '3 Bed',
    '4br_plus': '4 Bed+', penthouse: 'Penthouse', student_room: 'Student Room',
    serviced: 'Serviced', commercial: 'Commercial',
  }[unit.unit_type] || unit.unit_type || 'Unit';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.cardBg,
        borderRadius: 10,
        border: `1px solid ${hover ? C.borderMed : C.border}`,
        overflow: 'hidden',
        flexShrink: 0,
        width: 210,
        boxShadow: hover ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
        cursor: 'pointer',
      }}
    >
      {/* Photo */}
      <div style={{ height: 120, overflow: 'hidden', background: '#e2e8f0' }}>
        <img
          src={getUnitPhoto(unit)}
          alt={`Unit ${unit.unit_number}`}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.3s ease',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: '11px 13px' }}>
        {/* Unit number + occupancy circle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>
            Unit {unit.unit_number}
          </span>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            background: isOccupied ? C.success : 'transparent',
            border: `2px solid ${isOccupied ? C.success : C.borderMed}`,
          }} />
        </div>

        {/* Bed / Bath / Sqft */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          {unit.total_rooms ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-bed" style={{ fontSize: 11, color: C.textTert }} />
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{unit.total_rooms}</span>
            </div>
          ) : null}
          {unit.total_baths ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-bath" style={{ fontSize: 11, color: C.textTert }} />
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{unit.total_baths}</span>
            </div>
          ) : null}
          {unit.total_area ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-ruler-2" style={{ fontSize: 11, color: C.textTert }} />
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{unit.total_area}</span>
            </div>
          ) : null}
          {!unit.total_rooms && !unit.total_baths && !unit.total_area && (
            <span style={{ fontSize: 11, color: C.textTert, fontFamily: F.body }}>{unitTypeLabel}</span>
          )}
        </div>

        {/* Rent + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.body }}>
            {unit.rent_amount ? `$${Number(unit.rent_amount).toLocaleString()} /mo` : '—'}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
            fontFamily: F.body,
            background: isOccupied ? '#DCFCE7' : '#F1F5F9',
            color: isOccupied ? '#166534' : C.textSec,
            border: `1px solid ${isOccupied ? '#BBF7D0' : C.border}`,
          }}>
            {isOccupied ? 'Occupied' : 'Available'}
          </span>
        </div>
      </div>
    </div>
  );
}

function PropertySection({ property }) {
  const [units, setUnits]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch(`http://localhost:8001/api/properties/${property.id}/units/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setUnits(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [property.id]);

  const isVerified = property.status === 'ACTIVE';

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Property name row — just text + divider, no card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, whiteSpace: 'nowrap' }}>
          {property.name}
        </span>
        {isVerified && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
            padding: '3px 9px', borderRadius: 4,
            background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
            fontFamily: F.body, whiteSpace: 'nowrap',
          }}>
            ✓ Verified Elite
          </span>
        )}
        {property.status === 'DRAFT' && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
            padding: '3px 9px', borderRadius: 4,
            background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D',
            fontFamily: F.body, whiteSpace: 'nowrap',
          }}>
            Draft
          </span>
        )}
        {/* Divider line */}
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Units horizontal scroll */}
      {loading ? (
        <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body, padding: '20px 0' }}>
          Loading units…
        </div>
      ) : units.length === 0 ? (
        <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body, padding: '20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-door-off" style={{ fontSize: 16 }} /> No units added yet
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'thin' }}>
          {units.map(unit => <UnitCard key={unit.id} unit={unit} />)}
        </div>
      )}
    </div>
  );
}

export default function PMPortfolioPage() {
  const navigate                          = useNavigate();
  const { propertyType }                  = useParams();
  const [allProperties, setAllProperties] = useState([]);
  const [activeType, setActiveType]       = useState(propertyType || '');
  const [loading, setLoading]             = useState(true);
  const [userName, setUserName]           = useState('');
  const [userRole, setUserRole]           = useState('Independent PM');
  const [availableTypes, setAvailableTypes] = useState([]);

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
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const props = Array.isArray(data) ? data : [];
        setAllProperties(props);
        const types = [...new Set(props.map(p => p.property_type).filter(Boolean))];
        setAvailableTypes(types);
        if (types.length > 0 && !types.includes(activeType)) {
          setActiveType(types[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (propertyType) setActiveType(propertyType);
  }, [propertyType]);

  const filteredProperties = allProperties.filter(p => p.property_type === activeType);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        .port-scroll::-webkit-scrollbar { width: 5px; height: 4px; }
        .port-scroll::-webkit-scrollbar-track { background: transparent; }
        .port-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>
        <NavB activeId="all-props" />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header userName={userName} userRole={userRole} />

          <div className="port-scroll" style={{ flex: 1, overflowY: 'auto' }}>

            {/* Category filter tabs + single filter icon */}
            <div style={{
              background: C.cardBg,
              borderBottom: `1px solid ${C.border}`,
              padding: '0 28px',
              display: 'flex', alignItems: 'center',
              flexShrink: 0,
            }}>
              {/* Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, overflowX: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '14px 0', fontSize: 12, color: C.textTert }}>Loading…</div>
                ) : availableTypes.map(type => {
                  const cfg = PROPERTY_TYPE_CONFIG[type] || { label: type.replace(/_/g, ' '), icon: 'ti-building' };
                  const isActive = activeType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setActiveType(type);
                        navigate(`/pm-portal/properties/portfolio/${type}`);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '14px 16px', border: 'none', background: 'transparent',
                        fontFamily: F.body, fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? C.success : C.textSec,
                        borderBottom: isActive ? `2.5px solid ${C.success}` : '2.5px solid transparent',
                        cursor: 'pointer', outline: 'none',
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                        marginBottom: -1,
                      }}
                    >
                      <i className={`ti ${cfg.icon}`} style={{ fontSize: 14 }} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Single filter icon — top right */}
              <button style={{
                width: 34, height: 34, borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: C.cardBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, marginLeft: 12,
              }}>
                <i className="ti ti-adjustments-horizontal" style={{ fontSize: 15, color: C.textSec }} />
              </button>
            </div>

            {/* Content area */}
            <div style={{ padding: '28px 28px 60px' }}>

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: C.textSec, fontSize: 13 }}>
                  Loading properties…
                </div>
              )}

              {/* Empty */}
              {!loading && filteredProperties.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: C.textSec, fontSize: 13 }}>
                  <i className="ti ti-building-off" style={{ fontSize: 32, display: 'block', marginBottom: 12, color: C.textTert }} />
                  No properties found for this category.
                </div>
              )}

              {/* Property sections — no wrapper cards, just name + divider + unit row */}
              {!loading && filteredProperties.map(property => (
                <PropertySection key={property.id} property={property} />
              ))}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
