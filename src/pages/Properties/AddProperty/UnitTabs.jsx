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

// Mock Existing Accounts — will be replaced with real accounts when wired
const MOCK_EXISTING_ACCOUNTS = [
  { value: 'acc_001', label: 'Chase Main — ••••8829',          bank: 'Chase Manhattan', nickname: 'Main Op - 5th Ave', number: '••••••••••8829', routing: '021000021', type: 'checking', owner: 'Tate Real Estate Holdings LLC' },
  { value: 'acc_002', label: 'Wells Fargo Reserve — ••••4412', bank: 'Wells Fargo',      nickname: 'Reserve Fund A',    number: '••••••••••4412', routing: '121000248', type: 'savings',  owner: 'Tate Real Estate Holdings LLC' },
  { value: 'acc_003', label: 'BofA Operations — ••••7731',     bank: 'Bank of America',  nickname: 'BofA Ops Account',  number: '••••••••••7731', routing: '026009593', type: 'checking', owner: 'Metro Holdings Inc.' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: '',         label: 'Select type…' },
  { value: 'checking', label: 'Checking'     },
  { value: 'savings',  label: 'Savings'      },
];

const UNIT_ACCOUNT_CATEGORIES = [
  {
    id: 'owner_settlement',
    label: 'Owner Settlement Account',
    sub: 'Rent deposits & owner disbursements',
    icon: 'ti-home-dollar',
    required: true,
    description: 'Primary account where collected rent is deposited and disbursed to the property owner. This account is required for rent collection to function.',
  },
  {
    id: 'unit_reserve',
    label: 'Unit Reserve Account',
    sub: 'Unit-level capital reserve (optional)',
    icon: 'ti-safe',
    required: false,
    description: 'Optional dedicated reserve for unit-specific capital expenditures and maintenance. Can be skipped if managed at the property level.',
  },
];

// ─── Voided check upload (unit-level) ─────────────────────────────────────────

function UnitVoidedCheckUpload({ fileName, onFile, onRemove }) {
  const ref = React.useRef();
  return (
    <div>
      {fileName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.successLight, border: `1px solid #bbf7d0`, borderRadius: 6, padding: '8px 12px' }}>
          <i className="ti ti-file-check" style={{ fontSize: 16, color: C.success, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, color: '#166534', fontFamily: F.body, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-x" style={{ fontSize: 13, color: C.textSec }} />
          </button>
        </div>
      ) : (
        <div onClick={() => ref.current.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1.5px dashed ${C.borderMed}`, borderRadius: 6, padding: '9px 14px', cursor: 'pointer', background: C.inputBg, transition: 'border-color 0.15s', width: '100%', boxSizing: 'border-box' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.borderMed}>
          <input ref={ref} type="file" accept="image/jpeg,image/png,application/pdf" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { onFile(e.target.files[0]); e.target.value = ''; } }} />
          <i className="ti ti-upload" style={{ fontSize: 15, color: C.textTert, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primaryBlue, fontFamily: F.body }}>Upload Voided Check</div>
            <div style={{ fontSize: 11, color: C.textTert, fontFamily: F.body }}>JPG, PNG or PDF — Max 5MB</div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    amenities:        new Set(),
    galleryImages:    [],
    galleryVideos:    [],
    owners:           [],
    selfOwner:        null,
    sameAsProperty:   false,
    unitBankAccounts:  Object.fromEntries(['owner_settlement','unit_reserve'].map(id => [id, emptyUnitAccountState()])),
    unitBankActiveId:  'owner_settlement',
    unitReserveExtras: emptyUnitReserveExtras(),
    floorPlanMain:    null,
    floorPlanThumbs:  [null, null, null],
    status:           'draft',
  };
}

function emptyUnitAccountState() {
  return {
    mode: 'existing',
    existingId: '',
    saved: false,
    skipped: false,
    bankName: '', nickname: '', accountNumber: '', routing: '',
    accountType: '', owner: '', voidedCheck: null, voidedCheckName: '',
  };
}

function emptyUnitReserveExtras() {
  return {
    minThreshold: '',
    topUp: 'manual',
    topUpMode: 'existing',
    topUpExistingId: '',
    topUpBankName: '', topUpNickname: '', topUpAccountNumber: '',
    topUpRouting: '', topUpAccountType: '', topUpOwner: '',
    topUpVoidedCheck: null, topUpVoidedCheckName: '',
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

function UnitAmenityTile({ amenity, selected, onToggle }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      role="checkbox" aria-checked={selected} aria-label={amenity.label}
      onClick={() => onToggle(amenity.id)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ border: `1.5px solid ${selected ? C.primary : hover ? C.borderMed : C.inputBorder}`, borderRadius: 8, padding: '16px 10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: selected ? C.primaryLight : hover ? '#f8faff' : C.cardBg, transition: 'all 0.15s', position: 'relative', userSelect: 'none' }}>
      <div style={{ position: 'absolute', top: 7, right: 7, width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected ? C.primary : C.borderMed}`, background: selected ? C.primary : C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        {selected && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />}
      </div>
      <i className={`ti ${amenity.icon}`} style={{ fontSize: 22, color: selected ? C.primary : C.textPrimary, transition: 'color 0.15s' }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: selected ? C.primary : C.textSec, textAlign: 'center', lineHeight: 1.3, fontFamily: F.body, transition: 'color 0.15s' }}>{amenity.label}</div>
    </div>
  );
}

function UnitAmenitiesTab({ unit, onChange, unitAmenities = []  }) {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAmenities = unit.amenities || new Set();
  function setSelectedAmenities(updater) {
    const next = typeof updater === 'function' ? updater(selectedAmenities) : updater;
    onChange({ ...unit, amenities: next });
  }

  const filtered = searchQuery.trim()
   ? unitAmenities.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
   : unitAmenities;
  const selectedList = unitAmenities.filter(a => selectedAmenities.has(a.id));

  const selectedCount = selectedList.length;

  function toggleAmenity(id) {
    setSelectedAmenities(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* Left — amenity grid */}
      <div style={{ flex: 1, minWidth: 0, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: F.body }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Unit Amenities </span>
            <span style={{ fontSize: 13, color: C.textSec }}>(Select all that apply)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 6, padding: '0 11px', height: 36, width: 220 }}>
            <i className="ti ti-search" style={{ fontSize: 14, color: C.textTert, flexShrink: 0 }} />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search amenities..." aria-label="Search amenities"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: C.textPrimary, fontFamily: F.body, width: '100%' }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-x" style={{ fontSize: 12, color: C.textTert }} />
              </button>
            )}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {filtered.map(a => (
              <UnitAmenityTile key={a.id} amenity={a} selected={selectedAmenities.has(a.id)} onToggle={toggleAmenity} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textTert, fontFamily: F.body, fontSize: 13 }}>
            <i className="ti ti-search-off" style={{ fontSize: 30, display: 'block', marginBottom: 8 }} />
            No amenities match "{searchQuery}"
          </div>
        )}
      </div>

      {/* Right — selected summary */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ background: C.primary, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: F.body }}>
              <i className="ti ti-circle-check" style={{ fontSize: 16 }} /> Selected Amenities
            </div>
            <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10, fontFamily: F.body }}>
              {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <div style={{ padding: 14 }}>
            {selectedCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedList.map((a, idx) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: idx < selectedList.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className={`ti ${a.icon}`} style={{ fontSize: 13, color: C.textSec }} />
                      <span style={{ fontSize: 12, color: C.textPrimary, fontFamily: F.body }}>{a.label}</span>
                    </div>
                    <button onClick={() => toggleAmenity(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <i className="ti ti-x" style={{ fontSize: 12, color: C.textTert }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 8, padding: '28px 16px', textAlign: 'center' }}>
                <i className="ti ti-sparkles" style={{ fontSize: 26, color: C.textTert, display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: C.textTert, lineHeight: 1.6, fontFamily: F.body }}>Select amenities from the left to add them here.</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 7, padding: '0 2px' }}>
          <i className="ti ti-info-circle" style={{ fontSize: 13, color: C.textTert, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: C.textTert, lineHeight: 1.5, fontFamily: F.body }}>
            Unit amenities are in-unit features specific to this unit only. Building-wide amenities are configured in the Property tab.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Unit Gallery Tab ─────────────────────────────────────────────────────────
const MAX_UNIT_IMAGES = 8;
const MAX_UNIT_VIDEOS = 2;

function UnitGalleryImageCard({ img, onRemove, onOpen }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4 / 3', background: C.border, cursor: 'pointer' }}>
      <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {hover && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-zoom-in" style={{ fontSize: 28, color: '#fff' }} /></div>}
      <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: C.danger, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 2 }}>
        <i className="ti ti-x" style={{ fontSize: 11, color: '#fff', lineHeight: 1 }} />
      </button>
    </div>
  );
}

function UnitGalleryVideoCard({ video, onRemove, onOpen }) {
  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4 / 3', background: '#0f172a' }}>
      <video src={video.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.7 }} muted preload="metadata" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />
      <div onClick={onOpen} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <i className="ti ti-player-play" style={{ fontSize: 18, color: C.textPrimary, marginLeft: 2 }} />
      </div>
      <div style={{ position: 'absolute', bottom: 10, left: 12, right: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: F.body, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.name.replace(/\.[^.]+$/, '') || 'Video'}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', fontFamily: F.body }}>{video.size}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: C.danger, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 2 }}>
        <i className="ti ti-x" style={{ fontSize: 11, color: '#fff', lineHeight: 1 }} />
      </button>
    </div>
  );
}

function UnitGalleryTab({ unit, onChange }) {
  const imageInputRef = useRef();
  const videoInputRef = useRef();
  const [lightbox, setLightbox] = useState(null);

  const images = unit.galleryImages || [];
  const videos = unit.galleryVideos || [];

  function setImages(updater) {
    const next = typeof updater === 'function' ? updater(images) : updater;
    onChange({ ...unit, galleryImages: next });
  }
  function setVideos(updater) {
    const next = typeof updater === 'function' ? updater(videos) : updater;
    onChange({ ...unit, galleryVideos: next });
  }

  function handleImageFiles(files) {
    const accepted = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, MAX_UNIT_IMAGES - images.length);
    setImages(prev => [...prev, ...accepted.map(f => ({ id: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), name: f.name }))].slice(0, MAX_UNIT_IMAGES));
  }
  function handleVideoFile(file) {
    if (!file || !file.type.startsWith('video/') || videos.length >= MAX_UNIT_VIDEOS) return;
    setVideos(prev => [...prev, { id: Math.random().toString(36).slice(2), url: URL.createObjectURL(file), name: file.name, size: (file.size / (1024 * 1024)).toFixed(1) + ' MB' }]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* Photos */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 4 }}>Photo Gallery</div>
          <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Upload interior photos for this unit's listing.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {images.map((img, idx) => (
            <UnitGalleryImageCard key={img.id} img={img}
              onRemove={() => setImages(prev => prev.filter(i => i.id !== img.id))}
              onOpen={() => setLightbox({ type: 'image', index: idx })} />
          ))}
          {images.length < MAX_UNIT_IMAGES && (
            <div onClick={() => imageInputRef.current.click()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#f8faff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMed; e.currentTarget.style.background = C.cardBg; }}
              style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 10, aspectRatio: '4 / 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: C.cardBg, transition: 'border-color 0.15s, background 0.15s' }}>
              <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }} />
              <i className="ti ti-camera-plus" style={{ fontSize: 20, color: C.textTert }} />
              <div style={{ fontSize: 11, color: C.textTert, fontFamily: F.body }}>Upload Images</div>
            </div>
          )}
        </div>
      </div>

      {/* Videos */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 20 }}>Video(s)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {videos.map((v, idx) => (
            <UnitGalleryVideoCard key={v.id} video={v}
              onRemove={() => setVideos(prev => prev.filter(x => x.id !== v.id))}
              onOpen={() => setLightbox({ type: 'video', index: idx })} />
          ))}
          {videos.length < MAX_UNIT_VIDEOS && (
            <div onClick={() => videoInputRef.current.click()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#f8faff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMed; e.currentTarget.style.background = C.cardBg; }}
              style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 10, aspectRatio: '4 / 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: C.cardBg, transition: 'border-color 0.15s, background 0.15s' }}>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: 'none' }}
                onChange={e => { handleVideoFile(e.target.files[0]); e.target.value = ''; }} />
              <i className="ti ti-video-plus" style={{ fontSize: 20, color: C.textTert }} />
              <div style={{ fontSize: 11, color: C.textTert, fontFamily: F.body }}>Upload Video</div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000 }}>
            <i className="ti ti-x" style={{ fontSize: 18, color: '#fff' }} />
          </button>
          {lightbox.type === 'image' && (
            <>
              <img src={images[lightbox.index].url} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 10, objectFit: 'contain', display: 'block' }} />
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, index: (l.index - 1 + images.length) % images.length })); }} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <i className="ti ti-chevron-left" style={{ fontSize: 20, color: '#fff' }} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, index: (l.index + 1) % images.length })); }} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <i className="ti ti-chevron-right" style={{ fontSize: 20, color: '#fff' }} />
                  </button>
                  <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: F.body }}>{lightbox.index + 1} / {images.length}</div>
                </>
              )}
            </>
          )}
          {lightbox.type === 'video' && (
            <video src={videos[lightbox.index].url} controls autoPlay onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 10, outline: 'none', display: 'block' }} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Unit Ownership Tab ───────────────────────────────────────────────────────

function UnitEquityDonut({ pct }) {
  const r = 54, stroke = 10, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct, 100);
  const dash = (filled / 100) * circ;
  const color = pct >= 100 ? '#16A34A' : pct > 0 ? '#F59E0B' : '#E2E8F0';
  return (
    <svg width="140" height="140" style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      {pct > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s' }} />}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0F172A" fontFamily="'Nunito Sans',sans-serif">{pct}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94A3B8" fontFamily="'Nunito Sans',sans-serif" letterSpacing="0.08em">ALLOCATED</text>
    </svg>
  );
}

function UnitOwnerCard({ owner, onUpdate, onRemove, isSelf = false, isSaved = false, isCopied = false }) {
  const [open, setOpen]         = useState(!isSaved);
  const [editMode, setEditMode] = useState(!isSaved);

  const displayName = owner.firstName && owner.lastName
    ? `${owner.firstName} ${owner.lastName}`
    : owner.firstName || owner.email || 'Owner';

  const subInfo = `${isSelf ? 'Internal Account' : (owner.inUN ? 'UrbanNest Account' : 'External')}${isCopied ? ' · Copied from property' : ''}`;

  const statusCfg = {
    verified: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', icon: 'ti-circle-check', label: 'Verified' },
    pending:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: 'ti-clock',        label: 'Pending'  },
    expired:  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', icon: 'ti-clock-x',      label: 'Expired'  },
  }[owner.status] || { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: 'ti-clock', label: 'Pending' };

  const isPassive = (owner.involvement || 'active') === 'passive';

  const UNIT_OWNERSHIP_ROLE_OPTIONS = [
    { value: 'individual_owner', label: 'Individual Owner' },
    { value: 'co_owner',         label: 'Co-Owner'         },
    { value: 'corporate',        label: 'Corporate / LLC'  },
    { value: 'trust',            label: 'Trust'            },
  ];

  return (
    <div style={{ borderRadius: 10, marginBottom: 8, overflow: 'hidden', background: isCopied ? '#F0FDF4' : C.cardBg, borderLeft: isCopied ? `3px solid #16A34A` : `1px solid ${C.border}`, borderRight: `1px solid ${isCopied ? '#BBF7D0' : C.border}`, borderTop: `1px solid ${isCopied ? '#BBF7D0' : C.border}`, borderBottom: `1px solid ${isCopied ? '#BBF7D0' : C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: isSelf ? '#DCFCE7' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isSelf ? '#166634' : '#1D4ED8' }}>
          {(displayName[0] || 'O').toUpperCase() + (owner.lastName?.[0] || '').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>{displayName}</span>
            {isSelf && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#166534', fontFamily: F.body }}>YOU</span>}
            {owner.ownershipPct && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99, background: '#EFF6FF', color: '#185FA5', border: '0.5px solid #B5D4F4', fontFamily: F.body }}>{owner.ownershipPct}%</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 2, fontFamily: F.body }}>{subInfo}</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, whiteSpace: 'nowrap', fontFamily: F.body }}>
          <i className={`ti ${statusCfg.icon}`} style={{ fontSize: 12 }} />{statusCfg.label}
        </div>
        <div onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', padding: '2px 4px' }}>
          <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14, color: C.textTert }} />
        </div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${isCopied ? '#BBF7D0' : C.border}`, padding: '16px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
            <div>
              <ULabel>Ownership %</ULabel>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.inputBorder}`, borderRadius: 6, background: C.inputBg, height: 38, overflow: 'hidden' }}>
                <input value={owner.ownershipPct || ''} onChange={e => onUpdate({ ownershipPct: e.target.value })} disabled={!editMode || isCopied}
                  style={{ flex: 1, padding: '0 10px', fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: C.textPrimary, fontFamily: F.body }} />
                <span style={{ padding: '0 10px', fontSize: 13, color: C.textSec, borderLeft: `1px solid ${C.inputBorder}`, background: '#f1f5f9', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontFamily: F.body }}>%</span>
              </div>
            </div>
            <div>
              <ULabel>Ownership Role</ULabel>
              <CustomDropdown options={UNIT_OWNERSHIP_ROLE_OPTIONS} value={owner.ownershipRole || 'individual_owner'} onChange={v => onUpdate({ ownershipRole: v })} placeholder="Individual Owner" disabled={!editMode || isCopied} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
            <div>
              <ULabel>Involvement</ULabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 }}>
                {[{ value: 'active', label: 'Active' }, { value: 'passive', label: 'Passive' }].map(opt => (
                  <div key={opt.value} onClick={() => (editMode && !isCopied) && onUpdate({ involvement: opt.value })}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: editMode && !isCopied ? 'pointer' : 'default', userSelect: 'none' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${(owner.involvement || 'active') === opt.value ? C.primary : C.borderMed}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(owner.involvement || 'active') === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary }} />}
                    </div>
                    <span style={{ fontSize: 13, color: (owner.involvement || 'active') === opt.value ? C.primary : C.textSec, fontFamily: F.body }}>{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <ULabel>Involvement Type</ULabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
                {[{ key: 'leaseSig', label: 'Lease Signatory' }, { key: 'maintenance', label: 'Maintenance' }, { key: 'infoOnly', label: 'Information Only' }].map(({ key, label }) => {
                  const checked = owner.involvementType?.[key] ?? (key === 'maintenance');
                  return (
                    <div key={key} onClick={() => (editMode && !isCopied && !isPassive) && onUpdate({ involvementType: { ...owner.involvementType, [key]: !checked } })}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', opacity: isPassive || isCopied ? 0.5 : 1 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? C.primary : C.borderMed}`, background: checked ? C.primary : C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {checked && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />}
                      </div>
                      <span style={{ fontSize: 13, color: C.textPrimary, fontFamily: F.body }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 16 }}>
            <div>
              <ULabel>Maintenance Threshold</ULabel>
              <UInput value={owner.maintenanceThreshold || ''} onChange={v => onUpdate({ maintenanceThreshold: v })} placeholder="5,000" prefix="$" type="number" disabled={!editMode || isCopied} />
              <div style={{ fontSize: 11, color: C.textTert, marginTop: 4, fontFamily: F.body }}>Approval required for expenses exceeding this amount.</div>
            </div>
          </div>

          {isCopied && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#92400E', fontFamily: F.body }}>
              <i className="ti ti-lock" style={{ fontSize: 12, marginRight: 5 }} />
              This owner was copied from the property. Toggle "Ownership same as property" off to edit independently.
            </div>
          )}

          {!isCopied && (
            isSaved ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <button onClick={onRemove} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.danger, fontFamily: F.body, padding: 0 }}>
                  <i className="ti ti-trash" style={{ fontSize: 14 }} /> Delete
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setOpen(false)} style={{ height: 36, padding: '0 18px', border: `1px solid ${C.borderMed}`, borderRadius: 7, background: C.cardBg, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>Close</button>
                  <button onClick={() => { if (editMode) { setEditMode(false); setOpen(false); } else setEditMode(true); }}
                    style={{ height: 36, padding: '0 18px', background: C.primary, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: F.body }}>
                    {editMode ? 'Save Owner' : 'Edit Owner'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <button onClick={onRemove} style={{ height: 38, padding: '0 20px', border: `1px solid ${C.borderMed}`, borderRadius: 7, background: C.cardBg, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>Cancel</button>
                <button onClick={() => { setEditMode(false); setOpen(false); }}
                  style={{ height: 38, padding: '0 20px', background: C.primary, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: F.body }}>
                  Add Owner
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function UnitNewStakeholderForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    search: '', firstName: '', lastName: '', email: '', phone: '',
    ownershipRole: '', ownershipPct: '',
    involvement: 'active',
    involvementType: { leaseSig: false, maintenance: true, infoOnly: false },
    maintenanceThreshold: '500',
  });
  const upd = patch => setForm(f => ({ ...f, ...patch }));
  const isPassive = form.involvement === 'passive';

  const UNIT_OWNERSHIP_ROLE_OPTIONS = [
    { value: 'individual_owner', label: 'Individual Owner' },
    { value: 'co_owner',         label: 'Co-Owner'         },
    { value: 'corporate',        label: 'Corporate / LLC'  },
    { value: 'trust',            label: 'Trust'            },
  ];

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', background: C.cardBg, marginTop: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 16 }}>New Stakeholder</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, border: `1px solid ${C.inputBorder}`, borderRadius: 6, background: C.inputBg, padding: '0 11px', marginBottom: 14 }}>
        <i className="ti ti-search" style={{ fontSize: 15, color: C.textTert, flexShrink: 0 }} />
        <input value={form.search} onChange={e => upd({ search: e.target.value })} placeholder="Search by name, email or phone"
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: C.textPrimary, fontFamily: F.body, width: '100%' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div><ULabel>First Name</ULabel><UInput value={form.firstName} onChange={v => upd({ firstName: v })} placeholder="" /></div>
        <div><ULabel>Last Name</ULabel><UInput value={form.lastName} onChange={v => upd({ lastName: v })} placeholder="" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div><ULabel>Email</ULabel><UInput value={form.email} onChange={v => upd({ email: v })} placeholder="" /></div>
        <div><ULabel>Phone Number</ULabel><UInput value={form.phone} onChange={v => upd({ phone: v })} placeholder="" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
        <div>
          <ULabel>Ownership Role</ULabel>
          <CustomDropdown options={UNIT_OWNERSHIP_ROLE_OPTIONS} value={form.ownershipRole} onChange={v => upd({ ownershipRole: v })} placeholder="Select Role" />
        </div>
        <div>
          <ULabel>Ownership %</ULabel>
          <UInput value={form.ownershipPct} onChange={v => upd({ ownershipPct: v })} placeholder="0.00" type="number" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
        <div>
          <ULabel>Involvement</ULabel>
          <div style={{ display: 'flex', gap: 18, marginTop: 6 }}>
            {[{ value: 'active', label: 'Active' }, { value: 'passive', label: 'Passive' }].map(opt => (
              <div key={opt.value} onClick={() => {
                if (opt.value === 'passive') upd({ involvement: 'passive', involvementType: { leaseSig: false, maintenance: false, infoOnly: true } });
                else upd({ involvement: 'active', involvementType: { leaseSig: false, maintenance: true, infoOnly: false } });
              }} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${form.involvement === opt.value ? C.primary : C.borderMed}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {form.involvement === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary }} />}
                </div>
                <span style={{ fontSize: 13, color: form.involvement === opt.value ? C.primary : C.textSec, fontFamily: F.body }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <ULabel>Involvement Type</ULabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
            {[{ key: 'leaseSig', label: 'Lease Signatory' }, { key: 'maintenance', label: 'Maintenance' }, { key: 'infoOnly', label: 'Information Only' }].map(({ key, label }) => (
              <div key={key} onClick={() => !isPassive && upd({ involvementType: { ...form.involvementType, [key]: !form.involvementType[key] } })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: isPassive ? 'default' : 'pointer', userSelect: 'none', opacity: isPassive ? 0.5 : 1 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${form.involvementType[key] ? C.primary : C.borderMed}`, background: form.involvementType[key] ? C.primary : C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {form.involvementType[key] && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />}
                </div>
                <span style={{ fontSize: 13, color: C.textPrimary, fontFamily: F.body }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <ULabel>Maintenance Threshold</ULabel>
        <UInput value={form.maintenanceThreshold} onChange={v => upd({ maintenanceThreshold: v })} placeholder="500" type="number" prefix="$" />
        <div style={{ fontSize: 11, color: C.textTert, marginTop: 4, fontFamily: F.body }}>Approval required for expenses exceeding this amount.</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onCancel} style={{ height: 38, padding: '0 20px', border: `1px solid ${C.borderMed}`, borderRadius: 7, background: C.cardBg, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>Cancel</button>
        <button onClick={() => { if (!form.firstName || !form.email) return; onAdd({ ...form, inUN: false, status: 'pending', id: Math.random().toString(36).slice(2) }); }}
          style={{ height: 38, padding: '0 20px', background: C.primary, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: F.body }}>
          Add Owner
        </button>
      </div>
    </div>
  );
}

function UnitOwnershipTab({ unit, onChange, propOwners, propSelfOwner, selfUser }) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [expiryDays, setExpiryDays]   = useState('7');
  const [savedIds, setSavedIds]       = useState(new Set());
  const [selfSaved, setSelfSaved]     = useState(false);

  const sameAsProperty = unit.sameAsProperty || false;
  const owners         = unit.owners        || [];
  const selfOwner      = unit.selfOwner     || null;

  function upd(patch) { onChange({ ...unit, ...patch }); }

  // Build the effective list shown — copied owners from property when toggle ON
  const copiedOwners = sameAsProperty
    ? [
        ...(propSelfOwner ? [{ ...propSelfOwner, id: 'copied_self', isCopiedSelf: true }] : []),
        ...(propOwners || []).map(o => ({ ...o, id: `copied_${o.id}` })),
      ]
    : [];

  const allOwners = sameAsProperty ? copiedOwners : [...(selfOwner ? [selfOwner] : []), ...owners];
  const ownerCount = allOwners.length;

  const totalPct = sameAsProperty
    ? copiedOwners.reduce((s, o) => s + (parseFloat(o.ownershipPct) || 0), 0)
    : owners.reduce((s, o) => s + (parseFloat(o.ownershipPct) || 0), 0) + (selfOwner ? parseFloat(selfOwner.ownershipPct) || 0 : 0);

  const pctOk   = Math.round(totalPct) === 100;
  const pctColor = pctOk ? '#16A34A' : '#F59E0B';

  function handleToggleSameAsProperty() {
    if (!sameAsProperty) {
      upd({ sameAsProperty: true, owners: [], selfOwner: null });
    } else {
      upd({ sameAsProperty: false, owners: [], selfOwner: null });
    }
    setSavedIds(new Set());
    setSelfSaved(false);
    setShowNewForm(false);
  }

  function addOwner(data) {
    const newId = Math.random().toString(36).slice(2);
    upd({ owners: [...owners, { ...data, id: newId }] });
    setSavedIds(prev => new Set([...prev, newId]));
    setShowNewForm(false);
  }
  function updateOwner(id, patch) { upd({ owners: owners.map(o => o.id === id ? { ...o, ...patch } : o) }); }
  function removeOwner(id)        { upd({ owners: owners.filter(o => o.id !== id) }); setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Left — 800px ── */}
      <div style={{ width: 800, flexShrink: 0 }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: '#D97706' }}>🔑</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>Unit Ownership</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSec, fontFamily: F.body }}>
              <span>Invite expiry</span>
              <input value={expiryDays} onChange={e => setExpiryDays(e.target.value)} type="number" min="1" max="30"
                style={{ width: 48, height: 30, border: `1px solid ${C.inputBorder}`, borderRadius: 5, background: C.inputBg, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.textPrimary, outline: 'none', fontFamily: F.body }} />
              <span>days</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.textSec, marginBottom: 16, fontFamily: F.body }}>Add all owners and distribute legal equity for this unit.</div>

          {/* Step 1 — Same as property toggle */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.textSec, marginBottom: 8, fontFamily: F.body }}>
            Step 1 — Is ownership same as property?
          </div>
          <div onClick={handleToggleSameAsProperty}
            style={{ border: `1px solid ${sameAsProperty ? '#16A34A' : C.border}`, borderRadius: 8, padding: '12px 14px', background: sameAsProperty ? '#F0FDF4' : C.cardBg, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: sameAsProperty ? '#DCFCE7' : C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-copy" style={{ fontSize: 14, color: sameAsProperty ? '#16A34A' : C.textTert }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: sameAsProperty ? '#166534' : C.textPrimary, fontFamily: F.body }}>Ownership same as property</div>
              <div style={{ fontSize: 12, color: sameAsProperty ? '#166534' : C.textTert, fontFamily: F.body, marginTop: 1, opacity: 0.8 }}>
                {sameAsProperty ? 'Click to use independent unit ownership' : 'Click to copy ownership from property'}
              </div>
            </div>
            <Toggle value={sameAsProperty} onChange={() => {}} />
          </div>

          {/* Copied banner */}
          {sameAsProperty && (
            <div style={{ background: '#EAF3DE', border: '1px solid #97C459', borderRadius: 6, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 14, color: '#3B6D11', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#27500A', fontFamily: F.body }}>Ownership copied from property</div>
                <div style={{ fontSize: 11, color: '#3B6D11', marginTop: 2, lineHeight: 1.5, fontFamily: F.body }}>
                  {copiedOwners.length} owner{copiedOwners.length !== 1 ? 's' : ''} imported. You can still add unit-specific owners below or toggle off to use independent ownership.
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Self card (only when not sameAsProperty) */}
          {!sameAsProperty && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.textSec, marginBottom: 8, fontFamily: F.body }}>
                Step 2 — Do you own this unit?
              </div>
              <div onClick={() => {
                if (selfOwner) { upd({ selfOwner: null }); setSelfSaved(false); }
                else upd({ selfOwner: { firstName: selfUser.firstName, lastName: selfUser.lastName, email: selfUser.email, inUN: true, status: 'verified', ownershipPct: '', ownershipRole: 'individual_owner', involvement: 'active', involvementType: { leaseSig: true, maintenance: true, infoOnly: false }, maintenanceThreshold: '5000', id: 'self' } });
              }}
                style={{ border: `1px solid ${selfOwner ? '#16A34A' : C.border}`, borderRadius: 8, padding: '12px 14px', background: selfOwner ? '#F0FDF4' : C.cardBg, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: selfOwner ? '#DCFCE7' : C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-user-check" style={{ fontSize: 15, color: selfOwner ? '#16A34A' : C.textTert }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selfOwner ? '#166534' : C.textPrimary, fontFamily: F.body }}>I own this unit</div>
                  <div style={{ fontSize: 12, color: selfOwner ? '#166534' : C.textTert, fontFamily: F.body, marginTop: 1, opacity: 0.8 }}>
                    {selfOwner ? 'Click to remove yourself as owner' : 'Click to select yourself as owner'}
                  </div>
                </div>
                {selfOwner && <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="ti ti-check" style={{ fontSize: 13, color: '#fff' }} /></div>}
              </div>
            </>
          )}

          {/* Stakeholder list heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>
              Stakeholder List{' '}
              <span style={{ fontSize: 13, fontWeight: 400, color: C.textSec }}>
                ({ownerCount} added{sameAsProperty ? ' — copied' : ''})
              </span>
            </div>
            {ownerCount > 0 && !showNewForm && (
              <button onClick={() => setShowNewForm(true)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.primary, fontFamily: F.body, padding: 0 }}>
                + Add Stakeholder
              </button>
            )}
          </div>

          {/* Copied owner cards */}
          {sameAsProperty && copiedOwners.map(o => (
            <UnitOwnerCard key={o.id} owner={o} onUpdate={() => {}} onRemove={() => {}} isSelf={o.isCopiedSelf} isSaved isCopied />
          ))}

          {/* Independent owner cards */}
          {!sameAsProperty && selfOwner && (
            <UnitOwnerCard owner={selfOwner} onUpdate={patch => upd({ selfOwner: { ...selfOwner, ...patch } })} onRemove={() => { upd({ selfOwner: null }); setSelfSaved(false); }} isSelf isSaved={selfSaved} />
          )}
          
          {!sameAsProperty && owners.map(o => (
            <UnitOwnerCard key={o.id} owner={o} onUpdate={patch => updateOwner(o.id, patch)} onRemove={() => removeOwner(o.id)} isSaved={savedIds.has(o.id)} />
          ))}

          {/* Empty state */}
          {ownerCount === 0 && !showNewForm && (
            <div onClick={() => setShowNewForm(true)}
              style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 10, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: C.cardBg }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.borderMed}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C.borderMed}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-plus" style={{ fontSize: 18, color: C.textTert }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.textSec, fontFamily: F.body }}>Add Stakeholder</div>
              <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body }}>Invite partners or entities to share unit equity</div>
            </div>
          )}

          {showNewForm && <UnitNewStakeholderForm onAdd={addOwner} onCancel={() => setShowNewForm(false)} />}

          {/* Additional stakeholders when sameAsProperty */}
          {sameAsProperty && !showNewForm && (
            <button onClick={() => setShowNewForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.primary, fontFamily: F.body, padding: '8px 0', marginTop: 4 }}>
              + Add Stakeholder
            </button>
          )}

          {sameAsProperty && showNewForm && <UnitNewStakeholderForm onAdd={addOwner} onCancel={() => setShowNewForm(false)} />}

        </div>
      </div>

      {/* ── Right — flex ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Equity donut */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <i className="ti ti-chart-pie" style={{ fontSize: 16, color: C.textPrimary }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>Equity Summary</span>
          </div>
          <div style={{ marginBottom: 16 }}><UnitEquityDonut pct={Math.round(Math.min(totalPct, 100))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Requirement</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.body }}>100%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Remaining</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: pctColor, fontFamily: F.body }}>{Math.max(0, 100 - Math.round(totalPct))}%</span>
            </div>
          </div>
          {!pctOk && (
            <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 11.5, color: '#92400E', fontFamily: F.body, textAlign: 'center', lineHeight: 1.5 }}>Ownership must equal 100% before the unit can be published.</div>
            </div>
          )}
          {pctOk && (
            <div style={{ marginTop: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 11.5, color: '#166534', fontFamily: F.body, textAlign: 'center', lineHeight: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <i className="ti ti-circle-check" style={{ fontSize: 13 }} /> Ownership fully allocated
              </div>
            </div>
          )}
        </div>

        {/* Ownership guide */}
        <div style={{ background: '#E8F5F0', border: '1px solid #A8D5C2', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#C8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 16, color: '#1B5E42' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0D3D2B', fontFamily: F.body }}>Ownership Guide</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: 'ti-circle-check', text: 'Active owners sign leases and approve expenses above threshold.', bold: false },
              { icon: 'ti-eye',          text: 'Passive owners receive financial reports only.',                  bold: false },
              { icon: 'ti-copy',         text: 'Use "same as property" to save time for same-owner units.',       bold: false },
            ].map(({ icon, text, bold }) => (
              <div key={icon} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 15, color: '#1B5E42', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, fontWeight: bold ? 700 : 400, color: bold ? '#0D3D2B' : '#2A6648', lineHeight: 1.5, fontFamily: F.body }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── STEP 4: UnitBankAccountTab component ────────────────────────────────────

function UnitAccountCard({ categoryId, accountData, onChange, reserveExtras, onReserveExtrasChange, onSaved }) {
  const cat = UNIT_ACCOUNT_CATEGORIES.find(c => c.id === categoryId);
  const isReserve = categoryId === 'unit_reserve';

  const canSave = accountData.skipped ? false :
    accountData.mode === 'existing'
      ? Boolean((accountData.existingId || '').trim())
      : Boolean(
          (accountData.bankName || '').trim() &&
          (accountData.accountNumber || '').trim() &&
          (accountData.routing || '').trim()
        );
  
  function handleSave() {
    if (!canSave) return;
    const saved = { ...accountData, saved: true, skipped: false };
    if (onSaved) onSaved(saved);
  }      
  

  function handleSkip() {
    const skippedData = { ...accountData, saved: false, skipped: true };
   if (onSaved) onSaved(skippedData);
  }

  function handleCancel() {
    onChange({ ...accountData, saved: false, skipped: false });
  }

  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

      {/* Card header */}
      <div style={{ padding: '18px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <i className={`ti ${cat.icon}`} style={{ fontSize: 17, color: C.primaryBlue }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>{cat.label}</div>
              {!cat.required && (
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4, background: '#F1F5F9', color: C.textTert, fontFamily: F.body }}>Optional</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.textSec, fontFamily: F.body, lineHeight: 1.55, maxWidth: 520 }}>{cat.description}</div>
          </div>
          {accountData.saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.successLight, border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: C.success, fontFamily: F.body, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 12 }} /> Saved
            </div>
          )}
          {accountData.skipped && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F8FAFC', border: `1px solid ${C.borderMed}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: C.textTert, fontFamily: F.body, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <i className="ti ti-minus" style={{ fontSize: 12 }} /> Skipped
            </div>
          )}
        </div>
      </div>

      {/* Skip banner for optional account */}
      {isReserve && !accountData.saved && !accountData.skipped && (
        <div style={{ margin: '16px 20px 0', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 14, color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: '#92400E', fontFamily: F.body, lineHeight: 1.5 }}>
              This account is optional. You can skip it and manage reserves at the property level instead.
            </div>
          </div>
          <button onClick={handleSkip}
            style={{ height: 32, padding: '0 14px', border: `1px solid #FDE68A`, borderRadius: 6, background: '#FEF3C7', fontSize: 12, fontWeight: 600, color: '#92400E', cursor: 'pointer', fontFamily: F.body, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Skip this account
          </button>
        </div>
      )}

      {/* Skipped state */}
      {accountData.skipped && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-circle-dashed" style={{ fontSize: 32, color: C.borderMed }} />
          <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>This account has been skipped.</div>
          <button onClick={() => onChange({ ...accountData, skipped: false })}
            style={{ height: 34, padding: '0 16px', border: `1px solid ${C.borderMed}`, borderRadius: 6, background: C.cardBg, fontSize: 12, fontWeight: 600, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>
            Set up this account
          </button>
        </div>
      )}

      {/* Card body — only when not skipped */}
      {!accountData.skipped && (
        <div style={{ padding: '20px 20px 0' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', border: `1px solid ${C.borderMed}`, borderRadius: 7, overflow: 'hidden', width: 'fit-content', marginBottom: 20 }}>
            {[['existing', 'Select Existing'], ['new', 'Add New Account']].map(([val, label]) => (
              <button key={val} onClick={() => onChange({ ...accountData, mode: val, saved: false })}
                style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: F.body, background: accountData.mode === val ? C.primary : C.cardBg, color: accountData.mode === val ? '#fff' : C.textSec, transition: 'all 0.15s' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Existing account form */}
          {accountData.mode === 'existing' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <ULabel required>Existing Account</ULabel>
                <CustomDropdown
                  options={[{ value: '', label: 'Select an account…' }, ...MOCK_EXISTING_ACCOUNTS]}
                  value={accountData.existingId}
                  onChange={v => onChange({ ...accountData, existingId: v })}
                  placeholder="Select an account…"
                />
              </div>
              {(() => {
                const selected = MOCK_EXISTING_ACCOUNTS.find(a => a.value === accountData.existingId);
                return selected ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginTop: 4 }}>
                    <div><ULabel>Bank Name</ULabel><UInput value={selected.bank} disabled /></div>
                    <div><ULabel>Account Nickname</ULabel><UInput value={selected.nickname} disabled /></div>
                    <div><ULabel>Account Number</ULabel><UInput value={selected.number} disabled /></div>
                    <div><ULabel>Routing / IFSC</ULabel><UInput value={selected.routing} disabled /></div>
                    <div><ULabel>Account Type</ULabel><UInput value={selected.type.charAt(0).toUpperCase() + selected.type.slice(1)} disabled /></div>
                    <div><ULabel>Legal Owner Name</ULabel><UInput value={selected.owner} disabled /></div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* New account form */}
          {accountData.mode === 'new' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
                <div><ULabel required>Bank Name</ULabel><UInput value={accountData.bankName} onChange={v => onChange({ ...accountData, bankName: v })} placeholder="e.g. Chase Manhattan" /></div>
                <div><ULabel required>Account Nickname</ULabel><UInput value={accountData.nickname} onChange={v => onChange({ ...accountData, nickname: v })} placeholder="e.g. Unit 101 Settlement" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
                <div><ULabel required>Account Number</ULabel><UInput value={accountData.accountNumber} onChange={v => onChange({ ...accountData, accountNumber: v })} placeholder="Enter account number" type="password" /></div>
                <div><ULabel required>Routing / IFSC Number</ULabel><UInput value={accountData.routing} onChange={v => onChange({ ...accountData, routing: v })} placeholder="e.g. 021000021" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
                <div>
                  <ULabel>Account Type</ULabel>
                  <CustomDropdown options={ACCOUNT_TYPE_OPTIONS} value={accountData.accountType} onChange={v => onChange({ ...accountData, accountType: v })} placeholder="Select type…" />
                </div>
                <div><ULabel>Owner</ULabel><UInput value={accountData.owner} onChange={v => onChange({ ...accountData, owner: v })} placeholder="Legal owner name" /></div>
              </div>
              <div style={{ width: '100%', marginBottom: 4 }}>
                <ULabel>Voided Check</ULabel>
                <UnitVoidedCheckUpload
                  fileName={accountData.voidedCheckName}
                  onFile={f => onChange({ ...accountData, voidedCheck: f, voidedCheckName: f.name })}
                  onRemove={() => onChange({ ...accountData, voidedCheck: null, voidedCheckName: '' })}
                />
              </div>
            </div>
          )}

          {/* Reserve extras */}
          {isReserve && !accountData.skipped && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <div style={{ marginBottom: 16, maxWidth: 260 }}>
                <ULabel>Minimum Threshold Amount</ULabel>
                <UInput value={reserveExtras.minThreshold} onChange={v => onReserveExtrasChange({ ...reserveExtras, minThreshold: v })} placeholder="0.00" prefix="$" type="number" />
                <div style={{ fontSize: 11, color: C.textTert, marginTop: 4, fontFamily: F.body }}>Auto-refill triggers when balance falls below this amount.</div>
              </div>
              <div style={{ marginBottom: reserveExtras.topUp === 'auto' ? 16 : 0 }}>
                <ULabel>Top Up</ULabel>
                <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                  {[['manual', 'Manual'], ['auto', 'Auto']].map(([val, label]) => (
                    <div key={val} onClick={() => onReserveExtrasChange({ ...reserveExtras, topUp: val })}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${reserveExtras.topUp === val ? C.primary : C.borderMed}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {reserveExtras.topUp === val && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary }} />}
                      </div>
                      <span style={{ fontSize: 13, color: reserveExtras.topUp === val ? C.primary : C.textSec, fontWeight: reserveExtras.topUp === val ? 600 : 400, fontFamily: F.body }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.textTert, marginTop: 4, fontFamily: F.body }}>
                  {reserveExtras.topUp === 'auto' ? 'Funds will be automatically transferred from the source account.' : 'You will manually transfer funds when the balance runs low.'}
                </div>
              </div>
              {reserveExtras.topUp === 'auto' && (
                <div style={{ marginTop: 16, background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.body, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <i className="ti ti-arrows-exchange" style={{ fontSize: 14, color: C.primaryBlue }} />
                    Top Up From Account
                  </div>
                  <div style={{ display: 'flex', border: `1px solid ${C.borderMed}`, borderRadius: 7, overflow: 'hidden', width: 'fit-content', marginBottom: 20 }}>
                    {[['existing', 'Select Existing'], ['new', 'Add New Account']].map(([val, label]) => (
                      <button key={val} onClick={() => onReserveExtrasChange({ ...reserveExtras, topUpMode: val })}
                        style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: F.body, background: reserveExtras.topUpMode === val ? C.primary : C.cardBg, color: reserveExtras.topUpMode === val ? '#fff' : C.textSec, transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {reserveExtras.topUpMode === 'existing' ? (
                    <div>
                      <ULabel required>Existing Account</ULabel>
                      <CustomDropdown
                        options={[{ value: '', label: 'Select an account…' }, ...MOCK_EXISTING_ACCOUNTS]}
                        value={reserveExtras.topUpExistingId}
                        onChange={v => onReserveExtrasChange({ ...reserveExtras, topUpExistingId: v })}
                        placeholder="Select an account…"
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                      <div><ULabel required>Bank Name</ULabel><UInput value={reserveExtras.topUpBankName} onChange={v => onReserveExtrasChange({ ...reserveExtras, topUpBankName: v })} placeholder="e.g. Chase Manhattan" /></div>
                      <div><ULabel required>Account Nickname</ULabel><UInput value={reserveExtras.topUpNickname} onChange={v => onReserveExtrasChange({ ...reserveExtras, topUpNickname: v })} placeholder="e.g. Reserve Source" /></div>
                      <div><ULabel required>Account Number</ULabel><UInput value={reserveExtras.topUpAccountNumber} onChange={v => onReserveExtrasChange({ ...reserveExtras, topUpAccountNumber: v })} placeholder="Enter account number" type="password" /></div>
                      <div><ULabel required>Routing / IFSC</ULabel><UInput value={reserveExtras.topUpRouting} onChange={v => onReserveExtrasChange({ ...reserveExtras, topUpRouting: v })} placeholder="e.g. 021000021" /></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card footer */}
      {!accountData.skipped && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', marginTop: 16, borderTop: `1px solid ${C.border}`, background: '#fafbfc' }}>
          <button onClick={handleCancel}
            style={{ height: 36, padding: '0 20px', border: `1px solid ${C.borderMed}`, borderRadius: 7, background: C.cardBg, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave}
            style={{ height: 36, padding: '0 20px', background: canSave ? C.primary : C.borderMed, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: F.body, transition: 'background 0.15s' }}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

function UnitBankAccountTab({ unit, onChange }) {
  const accounts      = unit.unitBankAccounts   || Object.fromEntries(UNIT_ACCOUNT_CATEGORIES.map(c => [c.id, emptyUnitAccountState()]));
  const reserveExtras = unit.unitReserveExtras  || emptyUnitReserveExtras();
  const activeId      = unit.unitBankActiveId   || 'owner_settlement';

  function updateAccount(id, data) {
    onChange({ ...unit, unitBankAccounts: { ...accounts, [id]: data } });
  }
  function setActiveId(id) {
    onChange({ ...unit, unitBankActiveId: id });
  }
  function advanceToNext(currentId) {
    const ids = UNIT_ACCOUNT_CATEGORIES.map(c => c.id);
    const idx = ids.indexOf(currentId);
    if (idx < ids.length - 1) setActiveId(ids[idx + 1]);
  }

  const savedCount = UNIT_ACCOUNT_CATEGORIES.filter(c => accounts[c.id]?.saved || accounts[c.id]?.skipped).length;
  const totalCount = UNIT_ACCOUNT_CATEGORIES.length;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* Left nav */}
      <div style={{ width: 260, flexShrink: 0, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 16px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.textTert, fontFamily: F.body }}>
          UNIT BANK ACCOUNTS
        </div>
        {UNIT_ACCOUNT_CATEGORIES.map(cat => {
          const isActive = activeId === cat.id;
          const acct     = accounts[cat.id];
          const isSaved  = acct?.saved;
          const isSkipped = acct?.skipped;
          return (
            <div key={cat.id} onClick={() => setActiveId(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', background: isActive ? C.primaryLight : 'transparent', borderLeft: `3px solid ${isActive ? C.primary : 'transparent'}`, transition: 'all 0.12s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8faff'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: isSaved ? C.success : isSkipped ? C.borderMed : isActive ? C.primary : C.borderMed, border: `2px solid ${isSaved ? C.success : isSkipped ? C.borderMed : isActive ? C.primary : C.borderMed}`, transition: 'all 0.15s' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.primary : C.textPrimary, fontFamily: F.body, lineHeight: 1.3 }}>{cat.label}</div>
                  {!cat.required && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '1px 5px', borderRadius: 3, background: '#F1F5F9', color: C.textTert, fontFamily: F.body }}>OPT</span>}
                </div>
                <div style={{ fontSize: 11, color: C.textTert, fontFamily: F.body, marginTop: 1 }}>{cat.sub}</div>
              </div>
              {isSaved  && <i className="ti ti-circle-check" style={{ fontSize: 13, color: C.success, flexShrink: 0 }} />}
              {isSkipped && <i className="ti ti-minus" style={{ fontSize: 13, color: C.textTert, flexShrink: 0 }} />}
            </div>
          );
        })}

        {/* Progress footer */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: C.inputBg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.textSec, fontFamily: F.body }}>{savedCount} of {totalCount} configured</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: savedCount === totalCount ? C.success : C.textTert, fontFamily: F.body }}>{Math.round((savedCount / totalCount) * 100)}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: savedCount === totalCount ? C.success : C.primaryBlue, width: `${(savedCount / totalCount) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Right card */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <UnitAccountCard
          categoryId={activeId}
          accountData={accounts[activeId] || emptyUnitAccountState()}
          onChange={data => updateAccount(activeId, data)}
          onSaved={savedData => {
            const ids = UNIT_ACCOUNT_CATEGORIES.map(c => c.id);
            const idx = ids.indexOf(activeId);
            const nextId = idx < ids.length - 1 ? ids[idx + 1] : activeId;
            onChange({
              ...unit,
              unitBankAccounts: { ...accounts, [activeId]: savedData },
              unitBankActiveId: nextId,
            });
          }}
          reserveExtras={reserveExtras}
          onReserveExtrasChange={extras => onChange({ ...unit, unitReserveExtras: extras })}
        />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, padding: '0 2px' }}>
          <i className="ti ti-lock" style={{ fontSize: 13, color: C.textTert, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: C.textTert, lineHeight: 1.5, fontFamily: F.body }}>
            Account details are encrypted at rest. Banking credentials are never stored in plain text.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function UnitTabContent({ subTab, unit, onChange, propName, propType, units, activeUnitId, onSwitchUnit, onAddUnit, propOwners, propSelfOwner, selfUser, unitAmenities = [] }) {
  if (subTab === 'Unit/Home Info') {
    return <UnitHomeInfoTab unit={unit} onChange={onChange} propName={propName} propType={propType} units={units} activeUnitId={activeUnitId} onSwitchUnit={onSwitchUnit} onAddUnit={onAddUnit}  />;
  }

  // Placeholder for other unit sub-tabs (Amenities, Gallery, Ownership, Bank Account)

  if (subTab === 'Amenities') {
    return <UnitAmenitiesTab unit={unit} onChange={onChange}  unitAmenities={unitAmenities}/>;
  }

  if (subTab === 'Gallery') {
    return <UnitGalleryTab unit={unit} onChange={onChange} />;
  }

  if (subTab === 'Ownership') {
    return (
      <UnitOwnershipTab
        unit={unit}
        onChange={onChange}
        propOwners={propOwners}
        propSelfOwner={propSelfOwner}
        selfUser={selfUser}
      />
    );
  }

  if (subTab === 'Bank Account') {
    return <UnitBankAccountTab unit={unit} onChange={onChange} />;
  }

  const icons = { Gallery: 'ti-photo', Ownership: 'ti-key' };
  return (
    <div style={{ background: C.cardBg, borderRadius: 10, border: `1.5px dashed ${C.border}`, padding: '56px 24px', textAlign: 'center' }}>
      <i className={`ti ${icons[subTab] || 'ti-layout'}`} style={{ fontSize: 38, color: C.borderMed, display: 'block', marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 5, fontFamily: F.headline }}>Unit {subTab}</div>
      <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Coming in the next step of this session.</div>
    </div>
  );
}
