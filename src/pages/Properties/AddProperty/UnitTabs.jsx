/**
 * UnitTabs.jsx — Session 21
 * Unit tab content for AddNewProperty.jsx
 * Handles: multi-unit state, Unit/Home Info tab (Basic sub-tab)
 * Place at: src/pages/Properties/AddProperty/UnitTabs.jsx
 */

import React, { useState, useRef } from 'react';
import { CustomDropdown } from '../../../components/ui';

// ─── Shared tokens (mirror AddNewProperty.jsx) ────────────────────────────────
const C = {
  primary:      '#002D5B',
  primaryBlue:  '#0659b2',
  primaryLight: '#EFF6FF',
  white:        '#FFFFFF',
  pageBg:       '#F1F5F9',
  cardBg:       '#FFFFFF',
  border:       '#E2E8F0',
  borderMed:    '#CBD5E1',
  inputBg:      '#F8F9FA',
  inputBorder:  '#E8ECF0',
  inputFocus:   '#002D5B',
  textPrimary:  '#0F172A',
  textSec:      '#64748B',
  textTert:     '#94A3B8',
  labelColor:   '#64748B',
  danger:       '#E53E3E',
  success:      '#16A34A',
  successLight: '#F0FDF4',
};
const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// ─── Dropdown options ─────────────────────────────────────────────────────────
const UNIT_TYPE_OPTIONS = [
  { value: '',               label: 'Select unit type…'  },
  { value: 'studio',         label: 'Studio'             },
  { value: '1br',            label: '1 Bedroom'          },
  { value: '2br',            label: '2 Bedroom'          },
  { value: '3br',            label: '3 Bedroom'          },
  { value: '4br_plus',       label: '4 Bedroom+'         },
  { value: 'penthouse',      label: 'Penthouse'          },
  { value: 'student_room',   label: 'Student Room'       },
  { value: 'serviced',       label: 'Serviced Unit'      },
  { value: 'commercial',     label: 'Commercial Unit'    },
];

const OWNERSHIP_TYPE_OPTIONS = [
  { value: '',           label: 'Select ownership…'   },
  { value: 'self_owned', label: 'Self-Owned'          },
  { value: 'co_owned',   label: 'Co-Owned'            },
  { value: 'corporate',  label: 'Corporate / LLC'     },
  { value: 'leasehold',  label: 'Leasehold'           },
];

const LEASE_TYPE_OPTIONS = [
  { value: '',           label: 'Select lease type…'  },
  { value: 'fixed',      label: 'Fixed-Term'          },
  { value: 'month',      label: 'Month-to-Month'      },
  { value: 'short',      label: 'Short-Term'          },
  { value: 'student',    label: 'Student Lease'       },
];

const MANAGEMENT_MODEL_OPTIONS = [
  { value: '',           label: 'Select model…'           },
  { value: 'full',       label: 'Full Management'         },
  { value: 'rent_only',  label: 'Rent Collection Only'    },
  { value: 'owner',      label: 'Owner Managed'           },
];

const ROOM_TYPE_OPTIONS = [
  { value: '',        label: 'Select type…' },
  { value: 'single',  label: 'Single'       },
  { value: 'double',  label: 'Double'       },
  { value: 'triple',  label: 'Triple'       },
  { value: 'quad',    label: 'Quad'         },
  { value: 'suite',   label: 'Suite'        },
];

const BATH_TYPE_OPTIONS = [
  { value: '',        label: 'Select type…' },
  { value: 'ensuite', label: 'Ensuite'      },
  { value: 'shared',  label: 'Shared'       },
  { value: 'private', label: 'Private'      },
];

// Mock unit services — will be replaced with plan+addon data when wired
const UNIT_SERVICES = [
  { id: 'tenant_onboarding', label: 'Tenant Onboarding'  },
  { id: 'rent_collection',   label: 'Rent Collection'     },
  { id: 'lease_management',  label: 'Lease Management'    },
  { id: 'maintenance',       label: 'Maintenance'         },
  { id: 'utility_billing',   label: 'Utility Billing'     },
  { id: 'inspection',        label: 'Inspection'          },
];

// ─── Default unit state factory ───────────────────────────────────────────────
export function emptyUnit(unitNumber = '') {
  return {
    id:               Math.random().toString(36).slice(2),
    unitNumber,
    tower:            '',
    unitType:         '',
    floor:            '',
    ownershipType:    '',
    leaseType:        '',
    managementModel:  '',
    carpetArea:       '',
    totalArea:        '',
    totalRooms:       '',
    totalBathrooms:   '',
    studentHousing:   false,
    rooms:            [],
    rentAmount:       '',
    securityDeposit:  '',
    services:         new Set(),
    floorPlanMain:    null,
    floorPlanThumbs:  [null, null, null],
    status:           'draft',
  };
}

// ─── Shared field components ──────────────────────────────────────────────────
function ULabel({ children, required }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.labelColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontFamily: F.body }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function UInput({ value, onChange, placeholder, prefix, suffix, type = 'text', disabled = false, error = false }) {
  const [f, sf] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 38,
      border: `1px solid ${error ? C.danger : f ? C.inputFocus : C.inputBorder}`,
      borderRadius: 6, background: disabled ? '#f1f5f9' : C.inputBg,
      boxShadow: f && !disabled ? `0 0 0 2px ${error ? '#fde8e8' : '#dbeafe'}` : 'none',
      overflow: 'hidden', transition: 'all 0.15s', opacity: disabled ? 0.65 : 1,
    }}>
      {prefix && <span style={{ padding: '0 10px', fontSize: 13, color: C.textSec, borderRight: `1px solid ${C.inputBorder}`, background: '#f1f5f9', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontFamily: F.body, flexShrink: 0 }}>{prefix}</span>}
      <input
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => sf(true)} onBlur={() => sf(false)}
        style={{ flex: 1, padding: '0 11px', fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: C.textPrimary, fontFamily: F.body }}
      />
      {suffix && <span style={{ padding: '0 10px', fontSize: 12, color: C.textSec, borderLeft: `1px solid ${C.inputBorder}`, background: '#f1f5f9', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontFamily: F.body, flexShrink: 0 }}>{suffix}</span>}
    </div>
  );
}

function SectionHead({ icon, title, color = '#1D4ED8', bg = '#DBEAFE' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 13, color }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>{title}</span>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0,
        background: value ? C.primary : C.borderMed,
        position: 'relative', transition: 'background 0.2s',
      }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

// ─── Floor plan upload ────────────────────────────────────────────────────────
function FloorPlanUpload({ mainPreview, thumbPreviews, onMainFile, onThumbFile, onMainRemove, onThumbRemove }) {
  const mainRef = useRef();
  const thumbRefs = [useRef(), useRef(), useRef()];
  const [hover, setHover] = useState(false);

  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.body }}>Floor Plan</div>
        <i className="ti ti-camera" style={{ fontSize: 14, color: C.textTert }} />
      </div>

      {/* Main upload */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div
          onClick={() => !mainPreview && mainRef.current.click()}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            height: 120, border: `1.5px dashed ${mainPreview ? 'transparent' : C.borderMed}`,
            borderRadius: 8, background: C.inputBg, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: mainPreview ? 'default' : 'pointer', overflow: 'hidden', position: 'relative',
          }}>
          <input ref={mainRef} type="file" accept="image/jpeg,image/png,application/pdf" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { onMainFile(e.target.files[0]); e.target.value = ''; } }} />
          {mainPreview ? (
            <>
              <img src={mainPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {hover && (
                <div onClick={() => mainRef.current.click()} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: '5px 11px', fontSize: 11, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>
                    <i className="ti ti-refresh" style={{ fontSize: 12 }} /> Replace
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <i className="ti ti-file-description" style={{ fontSize: 24, color: C.textTert }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: C.primaryBlue, fontFamily: F.body }}>Upload Technical Drawings</div>
              <div style={{ fontSize: 10, color: C.textTert, fontFamily: F.body }}>PDF, JPG, or PNG up to 15MB</div>
            </>
          )}
        </div>
        {mainPreview && (
          <button onClick={onMainRemove}
            style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-x" style={{ fontSize: 9, color: '#fff' }} />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: 'relative' }}>
            <div
              onClick={() => !thumbPreviews[i] && thumbRefs[i].current.click()}
              style={{
                height: 52, border: `1.5px dashed ${thumbPreviews[i] ? 'transparent' : C.borderMed}`,
                borderRadius: 6, background: C.inputBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: thumbPreviews[i] ? 'default' : 'pointer', overflow: 'hidden',
              }}>
              <input ref={thumbRefs[i]} type="file" accept="image/jpeg,image/png,application/pdf" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) { onThumbFile(i, e.target.files[0]); e.target.value = ''; } }} />
              {thumbPreviews[i]
                ? <img src={thumbPreviews[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <i className="ti ti-file-description" style={{ fontSize: 16, color: C.borderMed }} />
              }
            </div>
            {thumbPreviews[i] && (
              <button onClick={() => onThumbRemove(i)}
                style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                <i className="ti ti-x" style={{ fontSize: 8, color: '#fff' }} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Add Room Modal ───────────────────────────────────────────────────────────
function AddRoomModal({ onSave, onCancel, existingRoom = null }) {
  const [room, setRoom] = useState(existingRoom || {
    roomNo: '', roomType: '', bedCount: '', bathroomCount: '',
    bathroomType: '', status: 'vacant',
  });
  const [beds, setBeds] = useState(existingRoom?.beds || []);
  const updRoom = patch => setRoom(r => ({ ...r, ...patch }));

  const maxBeds = parseInt(room.bedCount, 10) || 0;
  const canAddBed = beds.length < maxBeds && maxBeds > 0;

  function addBed() {
    if (!canAddBed) return;
    setBeds(prev => [...prev, { id: Math.random().toString(36).slice(2), bedNumber: `B${prev.length + 1}`, status: 'vacant' }]);
  }
  function updateBed(id, patch) { setBeds(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function removeBed(id)         { setBeds(prev => prev.filter(b => b.id !== id)); }

  function handleSave() {
    if (!room.roomNo || !room.roomType) return;
    onSave({ ...room, beds, id: existingRoom?.id || Math.random().toString(36).slice(2) });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ background: C.cardBg, borderRadius: 12, width: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>

        {/* Modal header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>
            {existingRoom ? 'Edit Room' : 'Add Room'}
          </div>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`, background: C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <i className="ti ti-x" style={{ fontSize: 14, color: C.textSec }} />
          </button>
        </div>

        {/* Modal body — two columns */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left — Room Details */}
          <div style={{ width: 320, flexShrink: 0, padding: '20px 24px', borderRight: `1px solid ${C.border}`, overflowY: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 14 }}>Room Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <ULabel required>Room No.</ULabel>
                <UInput value={room.roomNo} onChange={v => updRoom({ roomNo: v })} placeholder="e.g. A, 101" />
              </div>
              <div>
                <ULabel required>Room Type</ULabel>
                <CustomDropdown options={ROOM_TYPE_OPTIONS} value={room.roomType} onChange={v => updRoom({ roomType: v })} placeholder="Select type…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <div>
                  <ULabel>Bed Count</ULabel>
                  <UInput value={room.bedCount} onChange={v => {
                    updRoom({ bedCount: v });
                    const max = parseInt(v, 10) || 0;
                    if (beds.length > max) setBeds(prev => prev.slice(0, max));
                  }} placeholder="0" type="number" />
                </div>
                <div>
                  <ULabel>Bathroom Count</ULabel>
                  <UInput value={room.bathroomCount} onChange={v => updRoom({ bathroomCount: v })} placeholder="0" type="number" />
                </div>
              </div>
              <div>
                <ULabel>Bathroom Type</ULabel>
                <CustomDropdown options={BATH_TYPE_OPTIONS} value={room.bathroomType} onChange={v => updRoom({ bathroomType: v })} placeholder="Select type…" />
              </div>
              <div>
                <ULabel>Room Status</ULabel>
                <div style={{ height: 38, border: `1px solid ${C.inputBorder}`, borderRadius: 6, background: C.inputBg, display: 'flex', alignItems: 'center', padding: '0 11px', fontSize: 13, color: C.textSec, fontFamily: F.body }}>
                  Vacant
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 6px', borderRadius: 4, background: C.successLight, color: C.success, fontFamily: F.body }}>default</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Bed Details */}
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>Bed Details</div>
              <span style={{ fontSize: 11, color: C.textTert, fontFamily: F.body }}>{beds.length} of {maxBeds || '—'} beds added</span>
            </div>

            {maxBeds === 0 && (
              <div style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 8, padding: '28px 16px', textAlign: 'center', flex: 1 }}>
                <i className="ti ti-bed" style={{ fontSize: 24, color: C.textTert, display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body, lineHeight: 1.6 }}>Enter a bed count in Room Details to add beds.</div>
              </div>
            )}

            {maxBeds > 0 && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Header row */}
                {beds.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: '0 12px', marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textTert, fontFamily: F.body }}>Bed Number</div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textTert, fontFamily: F.body }}>Bed Status</div>
                    <div />
                  </div>
                )}

                {beds.map((bed, idx) => (
                  <div key={bed.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: '0 12px', marginBottom: 8, alignItems: 'center' }}>
                    <UInput value={bed.bedNumber} onChange={v => updateBed(bed.id, { bedNumber: v })} placeholder={`Bed ${idx + 1}`} />
                    <div style={{ height: 38, border: `1px solid ${C.inputBorder}`, borderRadius: 6, background: C.inputBg, display: 'flex', alignItems: 'center', padding: '0 11px', fontSize: 13, color: C.textSec, fontFamily: F.body }}>
                      Vacant
                    </div>
                    <button onClick={() => removeBed(bed.id)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, background: C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <i className="ti ti-trash" style={{ fontSize: 13, color: C.danger }} />
                    </button>
                  </div>
                ))}

                {/* Add Bed button */}
                <button
                  onClick={addBed}
                  disabled={!canAddBed}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
                    background: 'transparent', border: 'none', cursor: canAddBed ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 600, color: canAddBed ? C.primaryBlue : C.textTert,
                    fontFamily: F.body, padding: 0,
                  }}>
                  <i className="ti ti-plus" style={{ fontSize: 13 }} />
                  Add Bed
                  {!canAddBed && beds.length > 0 && (
                    <span style={{ fontSize: 11, color: C.textTert, fontWeight: 400 }}>(limit reached)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: '#fafbfc' }}>
          <button onClick={onCancel}
            style={{ height: 36, padding: '0 20px', border: `1px solid ${C.borderMed}`, borderRadius: 7, background: C.cardBg, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!room.roomNo || !room.roomType}
            style={{ height: 36, padding: '0 20px', background: room.roomNo && room.roomType ? C.primary : C.borderMed, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: room.roomNo && room.roomType ? 'pointer' : 'not-allowed', fontFamily: F.body }}>
            {existingRoom ? 'Update Room' : 'Add Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unit/Home Info Tab ───────────────────────────────────────────────────────
function UnitHomeInfoTab({ unit, onChange, propName, propType, units, activeUnitId, onSwitchUnit, onAddUnit }) {
  const upd = patch => onChange({ ...unit, ...patch });
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom]     = useState(null);

  function handleRoomSave(room) {
    if (editingRoom) {
      upd({ rooms: unit.rooms.map(r => r.id === room.id ? room : r) });
    } else {
      upd({ rooms: [...unit.rooms, room] });
    }
    setShowRoomModal(false);
    setEditingRoom(null);
  }

  function toggleService(id) {
    const next = new Set(unit.services);
    next.has(id) ? next.delete(id) : next.add(id);
    upd({ services: next });
  }

  const unitTypeLabel = UNIT_TYPE_OPTIONS.find(o => o.value === unit.unitType)?.label || '—';

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Left: main form ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Card 1 — Unit Basics */}
        <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <SectionHead icon="ti-door" title="Unit Basics" color="#1D4ED8" bg="#DBEAFE" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
            <div>
              <ULabel required>Unit Number</ULabel>
              <UInput value={unit.unitNumber} onChange={v => upd({ unitNumber: v })} placeholder="e.g. 101, A1" />
            </div>
            <div>
              <ULabel>Tower</ULabel>
              <UInput value={unit.tower} onChange={v => upd({ tower: v })} placeholder="e.g. Tower A" />
            </div>
            <div>
              <ULabel required>Unit Type</ULabel>
              <CustomDropdown options={UNIT_TYPE_OPTIONS} value={unit.unitType} onChange={v => upd({ unitType: v })} placeholder="Select unit type…" />
            </div>
            <div>
              <ULabel>Floor</ULabel>
              <UInput value={unit.floor} onChange={v => upd({ floor: v })} placeholder="e.g. 1" type="number" />
            </div>
            <div>
              <ULabel required>Ownership Type</ULabel>
              <CustomDropdown options={OWNERSHIP_TYPE_OPTIONS} value={unit.ownershipType} onChange={v => upd({ ownershipType: v })} placeholder="Select ownership…" />
            </div>
            <div>
              <ULabel>Lease Type</ULabel>
              <CustomDropdown options={LEASE_TYPE_OPTIONS} value={unit.leaseType} onChange={v => upd({ leaseType: v })} placeholder="Select lease type…" />
            </div>
            <div>
              <ULabel>Management Model</ULabel>
              <CustomDropdown options={MANAGEMENT_MODEL_OPTIONS} value={unit.managementModel} onChange={v => upd({ managementModel: v })} placeholder="Select model…" />
            </div>
          </div>
        </div>

        {/* Card 2 — Size & Configuration */}
        <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <SectionHead icon="ti-ruler" title="Size & Configuration" color="#065F46" bg="#D1FAE5" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', marginBottom: 16 }}>
            <div>
              <ULabel>Carpet Area</ULabel>
              <UInput value={unit.carpetArea} onChange={v => upd({ carpetArea: v })} placeholder="0" type="number" suffix="sq ft" />
            </div>
            <div>
              <ULabel>Total Area</ULabel>
              <UInput value={unit.totalArea} onChange={v => upd({ totalArea: v })} placeholder="0" type="number" suffix="sq ft" />
            </div>
            <div>
              <ULabel>Total Rooms</ULabel>
              <UInput value={unit.totalRooms} onChange={v => upd({ totalRooms: v })} placeholder="0" type="number" />
            </div>
            <div>
              <ULabel>Total Bathrooms</ULabel>
              <UInput value={unit.totalBathrooms} onChange={v => upd({ totalBathrooms: v })} placeholder="0" type="number" />
            </div>
          </div>

          {/* Student Housing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: unit.studentHousing ? 14 : 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>Student housing — room details</div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 2, fontFamily: F.body }}>Configure per-room bed &amp; bathroom breakdown</div>
            </div>
            <Toggle value={unit.studentHousing} onChange={v => upd({ studentHousing: v })} />
          </div>

          {/* Room table */}
          {unit.studentHousing && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 44px', background: C.inputBg, borderBottom: `1px solid ${C.border}`, padding: '8px 14px' }}>
                {['Room', 'Room No.', 'Room Type', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textTert, fontFamily: F.body }}>{h}</div>
                ))}
              </div>

              {unit.rooms.length === 0 && (
                <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12, color: C.textTert, fontFamily: F.body }}>
                  No rooms added yet. Click "+ Add Room" below.
                </div>
              )}

              {unit.rooms.map((room, idx) => (
                <div key={room.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 44px', padding: '10px 14px', borderBottom: idx < unit.rooms.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>Room {idx + 1}</div>
                  <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>{room.roomNo || '—'}</div>
                  <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body, textTransform: 'capitalize' }}>{room.roomType || '—'}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => { setEditingRoom(room); setShowRoomModal(true); }}
                      style={{ width: 28, height: 28, borderRadius: 5, border: `1px solid ${C.border}`, background: C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <i className="ti ti-eye" style={{ fontSize: 13, color: C.textSec }} />
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ padding: '10px 14px', borderTop: unit.rooms.length > 0 ? `1px solid ${C.border}` : 'none' }}>
                <button
                  onClick={() => { setEditingRoom(null); setShowRoomModal(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.primaryBlue, fontFamily: F.body, padding: 0 }}>
                  <i className="ti ti-plus-circle" style={{ fontSize: 14 }} /> Add room
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card 3 — Financials */}
        <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <SectionHead icon="ti-currency-dollar" title="Financials" color="#92400E" bg="#FEF3C7" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
            <div>
              <ULabel required>Rent Amount</ULabel>
              <UInput value={unit.rentAmount} onChange={v => upd({ rentAmount: v })} placeholder="0.00" prefix="$" type="number" />
            </div>
            <div>
              <ULabel>Security Deposit</ULabel>
              <UInput value={unit.securityDeposit} onChange={v => upd({ securityDeposit: v })} placeholder="0.00" prefix="$" type="number" />
            </div>
          </div>
        </div>

        {/* Card 4 — Unit Services */}
        <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <SectionHead icon="ti-settings" title="Unit Services" color="#7C3AED" bg="#EDE9FE" />
          <div style={{ fontSize: 11, color: C.textSec, fontFamily: F.body, marginBottom: 14, marginTop: -8 }}>
            Based on your plan and add-ons. Select services applicable to this unit.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px' }}>
            {UNIT_SERVICES.map(svc => {
              const checked = unit.services.has(svc.id);
              return (
                <div key={svc.id} onClick={() => toggleService(svc.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? C.primary : C.borderMed}`, background: checked ? C.primary : C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {checked && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />}
                  </div>
                  <span style={{ fontSize: 13, color: C.textPrimary, fontFamily: F.body }}>{svc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Unit switcher */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.labelColor, fontFamily: F.body, marginBottom: 8 }}>Units added so far</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <select
                value={activeUnitId}
                onChange={e => onSwitchUnit(e.target.value)}
                style={{ width: '100%', height: 36, border: `1px solid ${C.inputBorder}`, borderRadius: 6, background: C.inputBg, fontSize: 13, color: C.textPrimary, fontFamily: F.body, padding: '0 10px', outline: 'none', cursor: 'pointer' }}>
                {units.map((u, idx) => (
                  <option key={u.id} value={u.id}>
                    {u.unitNumber ? `Unit ${idx + 1}: #${u.unitNumber}` : `Unit ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onAddUnit}
              style={{ height: 36, padding: '0 12px', background: C.primary, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: F.body, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Unit
            </button>
          </div>
        </div>

        {/* Property context */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <i className="ti ti-building" style={{ fontSize: 13, color: C.textSec }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>Property Context</span>
          </div>
          {[
            { label: 'Property', value: propName || '—' },
            { label: 'Type',     value: propType || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.body }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, fontFamily: F.body, textAlign: 'right', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.body }}>Units so far</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>—</span>
          </div>
        </div>

        {/* Unit summary */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <i className="ti ti-list-check" style={{ fontSize: 13, color: C.textSec }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>Unit Summary</span>
          </div>
          {[
            { label: 'Unit no.',  value: unit.unitNumber  || '—'           },
            { label: 'Type',      value: unitTypeLabel                      },
            { label: 'Floor',     value: unit.floor       || '—'           },
            { label: 'Area',      value: unit.totalArea   ? `${unit.totalArea} sq ft` : '—' },
            { label: 'Rent',      value: unit.rentAmount  ? `$${Number(unit.rentAmount).toLocaleString()}/mo` : '—' },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 10, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.body }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: C.successLight, color: C.success, border: '1px solid #bbf7d0', fontFamily: F.body }}>
            <i className="ti ti-clock" style={{ fontSize: 11 }} /> Draft
          </div>
        </div>

        {/* Floor plan upload */}
        <FloorPlanUpload
          mainPreview={unit.floorPlanMain}
          thumbPreviews={unit.floorPlanThumbs}
          onMainFile={f  => upd({ floorPlanMain: URL.createObjectURL(f) })}
          onThumbFile={(i, f) => { const t = [...unit.floorPlanThumbs]; t[i] = URL.createObjectURL(f); upd({ floorPlanThumbs: t }); }}
          onMainRemove={() => upd({ floorPlanMain: null })}
          onThumbRemove={i => { const t = [...unit.floorPlanThumbs]; t[i] = null; upd({ floorPlanThumbs: t }); }}
        />

        {/* Unit types guide */}
        <div style={{ background: '#E8F5F0', border: '1px solid #A8D5C2', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#C8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 13, color: '#1B5E42' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0D3D2B', fontFamily: F.body }}>Unit types guide</span>
          </div>
          <div style={{ fontSize: 11, color: '#2A6648', lineHeight: 1.7, fontFamily: F.body }}>
            <b>Studio</b> — open plan, no separate bedroom<br />
            <b>1BR–4BR+</b> — bedroom count<br />
            <b>Student room</b> — per-room bed config<br />
            <b>Serviced</b> — hotel-style amenities<br />
            <b>Commercial</b> — non-residential use
          </div>
        </div>
      </div>

      {/* Room modal */}
      {showRoomModal && (
        <AddRoomModal
          existingRoom={editingRoom}
          onSave={handleRoomSave}
          onCancel={() => { setShowRoomModal(false); setEditingRoom(null); }}
        />
      )}
    </div>
  );
}

// ─── Unit switcher bar (rendered above sub-tabs in AddNewProperty) ────────────
export function UnitSwitcher({ units, activeUnitId, onSwitch, onAddUnit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `10px 24px 0`, background: C.pageBg, flexShrink: 0 }}>
      <div style={{ fontSize: 12, color: C.textSec, fontFamily: F.body, flexShrink: 0 }}>Units added so far:</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {units.map((u, idx) => {
          const isActive = u.id === activeUnitId;
          return (
            <button key={u.id} onClick={() => onSwitch(u.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: F.body, border: `1px solid ${isActive ? C.primary : C.borderMed}`,
                background: isActive ? C.primary : C.cardBg,
                color: isActive ? '#fff' : C.textSec,
                transition: 'all 0.15s',
              }}>
              <i className="ti ti-door" style={{ fontSize: 11 }} />
              {u.unitNumber ? `Unit ${idx + 1}: #${u.unitNumber}` : `Unit ${idx + 1}`}
            </button>
          );
        })}
        <button onClick={onAddUnit}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F.body, border: `1px dashed ${C.borderMed}`, background: 'transparent', color: C.textSec, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMed; e.currentTarget.style.color = C.textSec; }}>
          <i className="ti ti-plus" style={{ fontSize: 11 }} /> Add unit
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function UnitTabContent({ subTab, unit, onChange, propName, propType, units, activeUnitId, onSwitchUnit, onAddUnit }) {
  if (subTab === 'Unit/Home Info') {
    return <UnitHomeInfoTab unit={unit} onChange={onChange} propName={propName} propType={propType} units={units} activeUnitId={activeUnitId} onSwitchUnit={onSwitchUnit} onAddUnit={onAddUnit}  />;
  }

  // Placeholder for other unit sub-tabs (Amenities, Gallery, Ownership, Bank Account)
  const icons = { Amenities: 'ti-sparkles', Gallery: 'ti-photo', Ownership: 'ti-key', 'Bank Account': 'ti-building-bank' };
  return (
    <div style={{ background: C.cardBg, borderRadius: 10, border: `1.5px dashed ${C.border}`, padding: '56px 24px', textAlign: 'center' }}>
      <i className={`ti ${icons[subTab] || 'ti-layout'}`} style={{ fontSize: 38, color: C.borderMed, display: 'block', marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 5, fontFamily: F.headline }}>Unit {subTab}</div>
      <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Coming in the next step of this session.</div>
    </div>
  );
}
