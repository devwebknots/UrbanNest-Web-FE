/**
 * PMPortfolioPage.jsx — Session 25 (updated)
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

const PROPERTIES_PER_PAGE = 5;

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

function UnitCard({ unit, propertyId }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/pm-portal/properties/${propertyId}/units/${unit.id}`)}    
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
        {/* Unit number */}
        <div style={{ marginBottom: 7 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>
            Unit {unit.unit_number}
          </span>
        </div>

        {/* Bed / Bath / Area — icon + value, no dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 9 }}>
          {(unit.total_rooms !== null && unit.total_rooms !== undefined) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-bed" style={{ fontSize: 12, color: C.textTert }} />
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{unit.total_rooms}</span>
            </div>
          ) : null}
          {(unit.total_baths !== null && unit.total_baths !== undefined) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-bath" style={{ fontSize: 12, color: C.textTert }} />
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{unit.total_baths}</span>
            </div>
          ) : null}
          {(unit.total_area !== null && unit.total_area !== undefined) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-ruler-2" style={{ fontSize: 12, color: C.textTert }} />
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{unit.total_area}</span>
            </div>
          ) : (unit.carpet_area !== null && unit.carpet_area !== undefined) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-ruler-2" style={{ fontSize: 12, color: C.textTert }} />
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{unit.carpet_area}</span>
            </div>
          ) : null}
          {/* Fallback — show unit type if no dimensions available */}
          {(unit.total_rooms === null || unit.total_rooms === undefined) &&
           (unit.total_baths === null || unit.total_baths === undefined) &&
           (unit.total_area === null || unit.total_area === undefined) && unit.unit_type ? (
            <span style={{ fontSize: 11, color: C.textTert, fontFamily: F.body, textTransform: 'capitalize' }}>
              {unit.unit_type.replace(/_/g, ' ')}
            </span>
          ) : null}
        </div>

        {/* Rent + status badge */}
        {(() => {
          const STATUS_MAP = {
            OCCUPIED:                        { label: 'Occupied',    bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' },
            VACANT:                          { label: 'Vacant',      bg: '#F1F5F9', color: C.textSec,  border: C.border  },
            ACTIVE:                          { label: 'Active',      bg: '#DBEAFE', color: '#05247a', border: '#BFDBFE' },
            DRAFT:                           { label: 'Draft',       bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
            PENDING_OWNERSHIP_SUBMISSION:    { label: 'Pending',     bg: '#EFF6FF', color: '#05247a', border: '#BFDBFE' },
            PENDING_OWNERSHIP_VERIFICATION:  { label: 'Verifying',   bg: '#EFF6FF', color: '#05247a', border: '#BFDBFE' },
            MAINTENANCE:                     { label: 'Maintenance', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
            RESERVED:                        { label: 'Reserved',    bg: '#F3E8FF', color: '#6D28D9', border: '#DDD6FE' },
          };
          const s = STATUS_MAP[unit.status] || { label: unit.status || 'Unknown', bg: '#F1F5F9', color: C.textSec, border: C.border };
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.body }}>
                {unit.rent_amount ? `$${Number(unit.rent_amount).toLocaleString()} /mo` : '—'}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                fontFamily: F.body, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
              }}>
                {s.label}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function PropertySection({ property }) {
  const navigate = useNavigate();
  const [units, setUnits]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);

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
    <div style={{ marginBottom: 32 }}>
      {/* Property name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, whiteSpace: 'nowrap' }}>
          {property.name}
        </span>

        {/* Eye icon + tooltip */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => navigate(`/pm-portal/properties/${property.id}`)}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: tooltipVisible ? '#EFF6FF' : C.cardBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
              outline: 'none',
            }}
          >
            <i className="ti ti-eye" style={{ fontSize: 13, color: tooltipVisible ? C.primary : C.textSec }} />
          </button>
          {/* Tooltip */}
          {tooltipVisible && (
            <div style={{
              position: 'absolute', bottom: '110%', left: '50%',
              transform: 'translateX(-50%)',
              background: '#0F172A', color: '#fff',
              fontSize: 11, fontWeight: 600, fontFamily: F.body,
              padding: '4px 10px', borderRadius: 5,
              whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
            }}>
              View Property Detail
              <div style={{
                position: 'absolute', top: '100%', left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid #0F172A',
              }} />
            </div>
          )}
        </div>

        {/* Badges */}
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
        <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body, padding: '12px 0' }}>
          Loading units…
        </div>
      ) : units.length === 0 ? (
        <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-door-off" style={{ fontSize: 16 }} /> No units added yet
        </div>
      ) : (
        <div className="port-scroll" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {units.map(unit => <UnitCard key={unit.id} unit={unit} propertyId={property.id} />)}
        </div>
      )}
    </div>
  );
}


// Pagination component
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  function getPages() {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  const btnBase = {
    width: 36, height: 36, borderRadius: 8, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontFamily: F.body, fontWeight: 600,
    cursor: 'pointer', border: `1px solid ${C.border}`,
    transition: 'all 0.15s',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingTop: 8 }}>
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ ...btnBase, background: C.cardBg, color: currentPage === 1 ? C.textTert : C.textSec, opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
      </button>

      {getPages().map((p, i) => (
        p === '...' ? (
          <span key={`dots-${i}`} style={{ width: 36, textAlign: 'center', fontSize: 13, color: C.textTert, fontFamily: F.body }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              ...btnBase,
              background: p === currentPage ? C.primary : C.cardBg,
              color: p === currentPage ? C.white : C.textSec,
              border: `1px solid ${p === currentPage ? C.primary : C.border}`,
            }}
          >
            {p}
          </button>
        )
      ))}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ ...btnBase, background: C.cardBg, color: currentPage === totalPages ? C.textTert : C.textSec, opacity: currentPage === totalPages ? 0.5 : 1 }}
      >
        <i className="ti ti-chevron-right" style={{ fontSize: 14 }} />
      </button>
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
  const [currentPage, setCurrentPage]     = useState(1);

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
    if (propertyType) { setActiveType(propertyType); setCurrentPage(1); }
  }, [propertyType]);

  const filteredProperties = allProperties.filter(p => p.property_type === activeType);
  const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
  const pagedProperties = filteredProperties.slice(
    (currentPage - 1) * PROPERTIES_PER_PAGE,
    currentPage * PROPERTIES_PER_PAGE
  );

  function handleTabChange(type) {
    setActiveType(type);
    setCurrentPage(1);
    navigate(`/pm-portal/properties/portfolio/${type}`);
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        .port-scroll::-webkit-scrollbar { height: 4px; }
        .port-scroll::-webkit-scrollbar-track { background: transparent; }
        .port-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        .main-scroll::-webkit-scrollbar { width: 5px; }
        .main-scroll::-webkit-scrollbar-track { background: transparent; }
        .main-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>
        <NavB activeId="all-props" />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header userName={userName} userRole={userRole} />

          <div className="main-scroll" style={{ flex: 1, overflowY: 'auto' }}>

            {/* Category filter tabs — no border bottom, padding top for breathing room */}
            <div style={{
              background: C.cardBg,
              paddingTop: 16,
              paddingLeft: 28,
              paddingRight: 28,
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
                      onClick={() => handleTabChange(type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '12px 16px', border: 'none', background: 'transparent',
                        fontFamily: F.body, fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? C.primary : C.textSec,
                        borderBottom: isActive ? `2.5px solid ${C.primary}` : '2.5px solid transparent',
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

              {/* Single filter icon */}
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
            <div style={{ padding: '24px 28px 60px' }}>

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

              {/* Single white container wrapping ALL property sections on current page */}
              {!loading && pagedProperties.length > 0 && (
                <div style={{
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '28px 28px 8px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  marginBottom: 24,
                }}>
                  {pagedProperties.map(property => (
                    <PropertySection key={property.id} property={property} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={page => { setCurrentPage(page); }}
                />
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
