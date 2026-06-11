/**
 * AddNewProperty.jsx — Session 20 FINAL
 * Source: document index 5 (latest authoritative file)
 * Applied on top:
 *   - Banner replaced with per-tab page header (module title + green page title + subtitle)
 *   - Gallery already removed from PROP_SUBTABS in source
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavB from '../../../components/layout/NavB';
import Header from '../../../components/layout/Header';
import { CustomDropdown } from '../../../components/ui';
import UnitTabContent, { UnitSwitcher, emptyUnit } from './UnitTabs';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const C = {
  primary:     '#002D5B',
  primaryBlue: '#0659b2',
  primaryLight:'#EFF6FF',
  bannerFrom:  '#0c2340',
  bannerTo:    '#163d6e',
  white:       '#FFFFFF',
  pageBg:      '#F1F5F9',
  cardBg:      '#FFFFFF',
  border:      '#E2E8F0',
  borderMed:   '#CBD5E1',
  inputBg:     '#F8F9FA',
  inputBorder: '#E8ECF0',
  inputFocus:  '#002D5B',
  textPrimary: '#0F172A',
  textSec:     '#64748B',
  textTert:    '#94A3B8',
  labelColor:  '#64748B',
  danger:      '#E53E3E',
  success:     '#16A34A',
  successLight:'#F0FDF4',
};

const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

const PAGE_PX = 24;

const PROPERTY_AMENITIES = [
  { id: 'ac',        icon: 'ti-air-conditioning',   label: 'Air Condition' },
  { id: 'balcony',   icon: 'ti-building',            label: 'Balcony' },
  { id: 'kitchen',   icon: 'ti-tools-kitchen-2',     label: 'Mobile Kitchen' },
  { id: 'gated',     icon: 'ti-fence',               label: 'Gated Community' },
  { id: 'wifi',      icon: 'ti-wifi',                label: 'WiFi' },
  { id: 'parking',   icon: 'ti-parking',             label: 'Parking' },
  { id: 'pet',       icon: 'ti-paw',                 label: 'Pet Friendly' },
  { id: 'cctv',      icon: 'ti-video',               label: 'CCTV' },
  { id: 'garbage',   icon: 'ti-trash',               label: 'Garbage Disposal' },
  { id: 'hall',      icon: 'ti-building-community',  label: 'Community Hall' },
  { id: 'power',     icon: 'ti-plug',                label: 'Power Backup' },
  { id: 'water',     icon: 'ti-droplet',             label: 'Water Supply' },
  { id: 'gym',       icon: 'ti-barbell',             label: 'Gym' },
  { id: 'pool',      icon: 'ti-swimming',            label: 'Swimming Pool' },
  { id: 'lift',      icon: 'ti-elevator',            label: 'Elevator / Lift' },
  { id: 'garden',    icon: 'ti-plant-2',             label: 'Garden / Lawn' },
  { id: 'security',  icon: 'ti-shield-check',        label: 'Security' },
  { id: 'intercom',  icon: 'ti-phone-call',          label: 'Intercom' },
  { id: 'laundry',   icon: 'ti-wash-machine',        label: 'Laundry Room' },
  { id: 'rooftop',   icon: 'ti-building-skyscraper', label: 'Rooftop Access' },
];

const PROPERTY_TYPE_OPTIONS = [
  'Apartment Complex','Individual House','Multi-Family','Condominium',
  'Townhome','Student Housing','Villa','Serviced Apartment','Commercial','Mixed Use',
].map(v => ({ value: v, label: v }));

const OWNERSHIP_TYPE_OPTIONS = [
  'Self-Owned','Co-Owned','Corporate / LLC','Leasehold',
].map(v => ({ value: v, label: v }));

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'SG', label: 'Singapore' },
];

const STATES = {
  US: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  IN: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'],
  AE: ['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'],
  GB: ['England','Scotland','Wales','Northern Ireland'],
  AU: ['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','Australian Capital Territory','Northern Territory'],
  CA: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan'],
  SG: ['Central Region','East Region','North Region','North-East Region','West Region'],
};

const PROP_SUBTABS = ['Primary Info', 'Amenities', 'Ownership', 'Bank Account'];
const UNIT_SUBTABS = ['Unit/Home Info', 'Amenities', 'Gallery', 'Ownership', 'Bank Account'];

const OWNERSHIP_ROLE_OPTIONS = [
  { value: 'individual_owner', label: 'Individual Owner' },
  { value: 'co_owner',         label: 'Co-Owner' },
  { value: 'corporate',        label: 'Corporate / LLC' },
  { value: 'trust',            label: 'Trust' },
];

// ─── Per-tab page header config ────────────────────────────────────────────────
const PAGE_META = {
  'Primary Info':   { title: 'Property Basic Information',  sub: 'Enter the foundational details, property type, value and address for your new real estate asset.' },
  'Amenities':      { title: 'Property Amenities',          sub: 'Select and configure the amenities available across this property for tenants and units.' },
  'Ownership':      { title: 'Property Ownership',          sub: 'Add all legal owners and distribute equity. Ownership must total 100% before publishing.' },
  'Bank Account':   { title: 'Bank Account Configuration',  sub: 'Configure bank accounts for property operations and fund management. Assign existing accounts or create new ones for each category.' },
  'Unit/Home Info': { title: 'Unit / Home Information',     sub: 'Enter the unit-level details including type, size, rent and configuration.' },
  'Gallery':        { title: 'Property Gallery',            sub: 'Upload and manage photos and videos for the listing portfolio.' },
};

// ─── Shared field components ───────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.labelColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontFamily: F.body }}>
      {children}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function ErrMsg({ msg }) {
  return msg ? <div style={{ fontSize: 11, color: C.danger, marginTop: 3, fontFamily: F.body }}>{msg}</div> : null;
}

function TInput({ value, onChange, placeholder, prefix, type = 'text', error, disabled = false }) {
  const [f, sf] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${error ? C.danger : f ? C.inputFocus : C.inputBorder}`, borderRadius: 6, background: C.inputBg, overflow: 'hidden', boxShadow: f ? `0 0 0 2px ${error ? '#fde8e8' : '#dbeafe'}` : 'none', transition: 'all 0.15s', height: 38, opacity: disabled ? 0.6 : 1 }}>
      {prefix && (
        <span style={{ padding: '0 10px', fontSize: 13, color: C.textSec, borderRight: `1px solid ${C.inputBorder}`, background: '#f1f5f9', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontFamily: F.body, flexShrink: 0 }}>{prefix}</span>
      )}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        onFocus={() => sf(true)} onBlur={() => sf(false)}
        style={{ flex: 1, padding: '0 11px', fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: C.textPrimary, fontFamily: F.body, height: '100%' }} />
    </div>
  );
}

function TArea({ value, onChange, placeholder, rows = 3 }) {
  const [f, sf] = useState(false);
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      onFocus={() => sf(true)} onBlur={() => sf(false)}
      style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: `1px solid ${f ? C.inputFocus : C.inputBorder}`, borderRadius: 6, outline: 'none', resize: 'vertical', color: C.textPrimary, background: C.inputBg, fontFamily: F.body, lineHeight: 1.6, transition: 'all 0.15s', boxShadow: f ? '0 0 0 2px #dbeafe' : 'none', boxSizing: 'border-box' }} />
  );
}

function SecHead({ type, title }) {
  const cfg = {
    info: { bg: '#DBEAFE', color: '#1D4ED8', icon: 'ti-info-circle' },
    pin:  { bg: '#D1FAE5', color: '#065F46', icon: 'ti-map-pin' },
  }[type] || { bg: '#DBEAFE', color: '#1D4ED8', icon: 'ti-info-circle' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${cfg.icon}`} style={{ fontSize: 13, color: cfg.color }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>{title}</span>
    </div>
  );
}

function UploadZone({ onFile, onRemove, preview, height = 150, isVideo = false, isThumb = false }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div onClick={() => !preview && ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ width: '100%', height, border: `1.5px dashed ${drag ? C.primary : preview ? 'transparent' : C.borderMed}`, borderRadius: 8, background: drag ? '#eef4ff' : C.inputBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: preview ? 'default' : 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.15s' }}>
        <input ref={ref} type="file" accept={isVideo ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png'} style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
        {preview ? (
          isVideo ? (
            <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <i className="ti ti-player-play" style={{ fontSize: 22, color: '#fff' }} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', padding: '0 8px', textAlign: 'center', fontFamily: F.body }}>{preview}</div>
            </div>
          ) : (
            <>
              <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {hover && (
                <div onClick={() => ref.current.click()} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: '5px 11px', fontSize: 11, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>
                    <i className="ti ti-refresh" style={{ fontSize: 12 }} /> Replace
                  </div>
                </div>
              )}
            </>
          )
        ) : isThumb ? (
          <i className="ti ti-photo" style={{ fontSize: 18, color: C.borderMed }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <i className={`ti ${isVideo ? 'ti-video' : 'ti-file-upload'}`} style={{ fontSize: 28, color: C.textTert }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primaryBlue, fontFamily: F.body, textAlign: 'center' }}>{isVideo ? 'Upload Property Video' : 'Upload Main Image'}</div>
            <div style={{ fontSize: 11, color: C.textTert, fontFamily: F.body, textAlign: 'center' }}>{isVideo ? 'Support: MP4, MOV (Max 50MB)' : 'Support: JPG, PNG (Max 5MB)'}</div>
          </div>
        )}
      </div>
      {preview && onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }} title="Remove"
          style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'background 0.15s', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = C.danger}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}>
          <i className="ti ti-x" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />
        </button>
      )}
    </div>
  );
}

function LiveMap({ address }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const geocode = useCallback(async q => {
    if (!q || q.length < 5) { setCoords(null); return; }
    setLoading(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, { headers: { 'Accept-Language': 'en' } });
      const d = await r.json();
      if (d?.[0]) setCoords({ lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) });
      else setCoords(null);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => geocode(address), 900); return () => clearTimeout(timer.current); }, [address, geocode]);
  const src = coords ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.012},${coords.lat - 0.012},${coords.lon + 0.012},${coords.lat + 0.012}&layer=mapnik&marker=${coords.lat},${coords.lon}` : null;
  return (
    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: C.textPrimary, borderBottom: `1px solid ${C.border}`, fontFamily: F.body }}>Location Preview</div>
      <div style={{ height: 180, position: 'relative', background: '#e8ecf0' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.pageBg, zIndex: 2 }}><span style={{ fontSize: 12, color: C.textSec, fontFamily: F.body }}>Finding location...</span></div>}
        {!loading && src && <iframe title="map" src={src} width="100%" height="180" style={{ border: 'none', display: 'block' }} loading="lazy" />}
        {!loading && !src && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 30, color: C.borderMed }} />
            <div style={{ fontSize: 11, color: C.textTert, textAlign: 'center', padding: '0 20px', lineHeight: 1.5, fontFamily: F.body }}>Fill in address details to preview location</div>
          </div>
        )}
      </div>
      {coords && (
        <div style={{ padding: '8px 12px', background: C.primary, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-gps" style={{ fontSize: 12, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', marginBottom: 1, fontFamily: F.body }}>GPS Coordinates</div>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, fontFamily: F.body }}>{coords.lat.toFixed(4)}° N, {Math.abs(coords.lon).toFixed(4)}° W</div>
          </div>
        </div>
      )}
    </div>
  );
}

function AmenityTile({ amenity, selected, onToggle }) {
  const [hover, setHover] = useState(false);
  return (
    <div role="checkbox" aria-checked={selected} aria-label={amenity.label} onClick={() => onToggle(amenity.id)}
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

function AccessCard({ amenity, checked, onToggle }) {
  return (
    <div onClick={() => onToggle(amenity.id)}
      style={{ border: `1.5px solid ${checked ? C.primary : C.inputBorder}`, borderRadius: 8, padding: '14px 10px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', background: checked ? C.primaryLight : C.inputBg, cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none' }}>
      <div style={{ position: 'absolute', top: 7, right: 7, width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${checked ? C.primary : C.borderMed}`, background: checked ? C.primary : C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        {checked && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />}
      </div>
      <i className={`ti ${amenity.icon}`} style={{ fontSize: 20, color: checked ? C.primary : C.textPrimary, transition: 'color 0.15s' }} />
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: checked ? C.primary : C.textSec, textAlign: 'center', lineHeight: 1.3, fontFamily: F.body, transition: 'color 0.15s' }}>{amenity.label}</div>
    </div>
  );
}

function AmenitiesTab({ selectedAmenities, setSelectedAmenities }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [generated, setGenerated]     = useState(false);
  const [accessMode, setAccessMode]   = useState('all');
  const [accessChecked, setAccessChecked] = useState(new Set());

  const filtered = searchQuery.trim() ? PROPERTY_AMENITIES.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase())) : PROPERTY_AMENITIES;
  const selectedList = PROPERTY_AMENITIES.filter(a => selectedAmenities.has(a.id));
  const selectedCount = selectedList.length;

  function toggleAmenity(id) {
    setSelectedAmenities(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setAccessChecked(ac => { const n = new Set(ac); n.delete(id); return n; }); }
      else next.add(id);
      return next;
    });
    setGenerated(false);
  }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: F.body }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Amenities </span>
            <span style={{ fontSize: 13, color: C.textSec }}>(Select all that apply)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 6, padding: '0 11px', height: 36, width: 220 }}>
            <i className="ti ti-search" style={{ fontSize: 14, color: C.textTert, flexShrink: 0 }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." aria-label="Search amenities"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: C.textPrimary, fontFamily: F.body, width: '100%' }} />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><i className="ti ti-x" style={{ fontSize: 12, color: C.textTert }} /></button>}
          </div>
        </div>
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {filtered.map(a => <AmenityTile key={a.id} amenity={a} selected={selectedAmenities.has(a.id)} onToggle={toggleAmenity} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textTert, fontFamily: F.body, fontSize: 13 }}>
            <i className="ti ti-search-off" style={{ fontSize: 30, display: 'block', marginBottom: 8 }} />
            No amenities match "{searchQuery}"
          </div>
        )}
      </div>
      <div style={{ width: 320, flexShrink: 0 }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ background: C.primary, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: F.body }}>
              <i className="ti ti-circle-check" style={{ fontSize: 16 }} /> Amenities Access
            </div>
            <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10, fontFamily: F.body }}>{selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}</span>
          </div>
          <div style={{ padding: 14 }}>
            {selectedCount > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {selectedList.map(a => <AccessCard key={a.id} amenity={a} checked={accessChecked.has(a.id)} onToggle={generated ? id => setAccessChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }) : () => {}} />)}
                </div>
                <button onClick={() => { setAccessChecked(new Set(selectedAmenities)); setGenerated(true); }}
                  style={{ width: '100%', height: 38, background: generated ? C.success : C.primary, border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: F.body, marginBottom: 12 }}>
                  <i className={`ti ${generated ? 'ti-circle-check' : 'ti-bolt'}`} style={{ fontSize: 15 }} />
                  {generated ? 'ACCESS GENERATED' : 'GENERATE ACCESS'}
                </button>
                {generated && (
                  <>
                    <div style={{ background: C.successLight, border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <i className="ti ti-info-circle" style={{ fontSize: 13, color: C.success, flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.5, fontFamily: F.body }}>Access generated for <strong>All Units</strong> by default.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 11.5, color: C.textSec, fontFamily: F.body }}>Access mode</span>
                      <div style={{ display: 'flex', border: `1px solid ${C.inputBorder}`, borderRadius: 5, overflow: 'hidden' }}>
                        {[{ id: 'all', label: 'All Units' }, { id: 'specific', label: 'Specific Units' }].map(m => (
                          <button key={m.id} onClick={() => setAccessMode(m.id)}
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: F.body, background: accessMode === m.id ? C.primary : 'transparent', color: accessMode === m.id ? '#fff' : C.textSec }}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
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
          <div style={{ fontSize: 11, color: C.textTert, lineHeight: 1.5, fontFamily: F.body }}>Property amenities apply building-wide. Unit-level amenities are configured in the Unit tab.</div>
        </div>
      </div>
    </div>
  );
}

const MAX_IMAGES = 8;
const MAX_VIDEOS = 2;

function GalleryImageCard({ img, onRemove, onOpen }) {
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

function GalleryVideoCard({ video, onRemove, onOpen }) {
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

function GalleryTab({ images, setImages, videos, setVideos }) {
  const imageInputRef = useRef();
  const videoInputRef = useRef();
  const [lightbox, setLightbox] = useState(null);

  function handleImageFiles(files) {
    const accepted = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, MAX_IMAGES - images.length);
    setImages(prev => [...prev, ...accepted.map(f => ({ id: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), name: f.name }))].slice(0, MAX_IMAGES));
  }
  function handleVideoFile(file) {
    if (!file || !file.type.startsWith('video/') || videos.length >= MAX_VIDEOS) return;
    setVideos(prev => [...prev, { id: Math.random().toString(36).slice(2), url: URL.createObjectURL(file), name: file.name, size: (file.size / (1024 * 1024)).toFixed(1) + ' MB' }]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 4 }}>Photo Gallery</div>
            <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Select and manage property images for the listing portfolio.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {images.map((img, idx) => <GalleryImageCard key={img.id} img={img} onRemove={() => setImages(prev => prev.filter(i => i.id !== img.id))} onOpen={() => setLightbox({ type: 'image', index: idx })} />)}
          {images.length < MAX_IMAGES && (
            <div onClick={() => imageInputRef.current.click()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#f8faff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMed; e.currentTarget.style.background = C.cardBg; }}
              style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 10, aspectRatio: '4 / 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: C.cardBg, transition: 'border-color 0.15s, background 0.15s' }}>
              <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }} />
              <i className="ti ti-camera-plus" style={{ fontSize: 28, color: C.textTert }} />
              <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body }}>Upload Images</div>
            </div>
          )}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 20 }}>Video(s)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {videos.map((v, idx) => <GalleryVideoCard key={v.id} video={v} onRemove={() => setVideos(prev => prev.filter(x => x.id !== v.id))} onOpen={() => setLightbox({ type: 'video', index: idx })} />)}
          {videos.length < MAX_VIDEOS && (
            <div onClick={() => videoInputRef.current.click()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#f8faff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMed; e.currentTarget.style.background = C.cardBg; }}
              style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 10, aspectRatio: '4 / 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: C.cardBg, transition: 'border-color 0.15s, background 0.15s' }}>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: 'none' }} onChange={e => { handleVideoFile(e.target.files[0]); e.target.value = ''; }} />
              <i className="ti ti-video-plus" style={{ fontSize: 28, color: C.textTert }} />
              <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body }}>Upload Video</div>
            </div>
          )}
        </div>
      </div>
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
          {lightbox.type === 'video' && <video src={videos[lightbox.index].url} controls autoPlay onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 10, outline: 'none', display: 'block' }} />}
        </div>
      )}
    </div>
  );
}

// ─── Ownership components ──────────────────────────────────────────────────────

function EquityDonut({ pct }) {
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

function OwnerRadio({ value, onChange, options, disabled = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 }}>
      {options.map(opt => (
        <div key={opt.value} onClick={() => !disabled && onChange(opt.value)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: disabled ? 'default' : 'pointer', userSelect: 'none' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${value === opt.value ? C.primary : C.borderMed}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {value === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary }} />}
          </div>
          <span style={{ fontSize: 13, color: value === opt.value ? C.primary : C.textSec, fontWeight: value === opt.value ? 600 : 400, fontFamily: F.body }}>{opt.label}</span>
        </div>
      ))}
    </div>
  );
}

function CheckItem({ checked, onChange, label, disabled = false }) {
  return (
    <div onClick={() => !disabled && onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer', userSelect: 'none', opacity: disabled ? 0.5 : 1 }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? C.primary : C.borderMed}`, background: checked ? C.primary : C.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
        {checked && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff', lineHeight: 1 }} />}
      </div>
      <span style={{ fontSize: 13, color: C.textPrimary, fontFamily: F.body }}>{label}</span>
    </div>
  );
}

function NewStakeholderForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    search: '', firstName: '', lastName: '', email: '', phone: '',
    ownershipRole: '', ownershipPct: '',
    involvement: 'active',
    involvementType: { leaseSig: false, maintenance: true, infoOnly: false },
    maintenanceThreshold: '500',
  });
  const upd = patch => setForm(f => ({ ...f, ...patch }));

  function handleInvolvementChange(v) {
    if (v === 'passive') upd({ involvement: v, involvementType: { leaseSig: false, maintenance: false, infoOnly: true } });
    else upd({ involvement: v, involvementType: { leaseSig: false, maintenance: true, infoOnly: false } });
  }

  const isPassive = form.involvement === 'passive';

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', background: C.cardBg, marginTop: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 16 }}>New Stakeholder</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, border: `1px solid ${C.inputBorder}`, borderRadius: 6, background: C.inputBg, padding: '0 11px', marginBottom: 14 }}>
        <i className="ti ti-search" style={{ fontSize: 15, color: C.textTert, flexShrink: 0 }} />
        <input value={form.search} onChange={e => upd({ search: e.target.value })} placeholder="Search by name, email or phone"
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: C.textPrimary, fontFamily: F.body, width: '100%' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div><FieldLabel>First Name</FieldLabel><TInput value={form.firstName} onChange={v => upd({ firstName: v })} placeholder="" /></div>
        <div><FieldLabel>Last Name</FieldLabel><TInput value={form.lastName} onChange={v => upd({ lastName: v })} placeholder="" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div><FieldLabel>Email</FieldLabel><TInput value={form.email} onChange={v => upd({ email: v })} placeholder="" /></div>
        <div><FieldLabel>Phone Number</FieldLabel><TInput value={form.phone} onChange={v => upd({ phone: v })} placeholder="" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
        <div>
          <FieldLabel>Ownership Role</FieldLabel>
          <CustomDropdown options={OWNERSHIP_ROLE_OPTIONS} value={form.ownershipRole} onChange={v => upd({ ownershipRole: v })} placeholder="Select Role" />
        </div>
        <div>
          <FieldLabel>Ownership %</FieldLabel>
          <TInput value={form.ownershipPct} onChange={v => upd({ ownershipPct: v })} placeholder="0.00" type="number" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
        <div>
          <FieldLabel>Involvement</FieldLabel>
          <OwnerRadio value={form.involvement} onChange={handleInvolvementChange} options={[{ value: 'active', label: 'Active' }, { value: 'passive', label: 'Passive' }]} />
        </div>
        <div>
          <FieldLabel>Involvement Type</FieldLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
            <CheckItem checked={form.involvementType.leaseSig}   onChange={v => upd({ involvementType: { ...form.involvementType, leaseSig: v } })}   label="Lease Signatory"  disabled={isPassive} />
            <CheckItem checked={form.involvementType.maintenance} onChange={v => upd({ involvementType: { ...form.involvementType, maintenance: v } })} label="Maintenance"       disabled={isPassive} />
            <CheckItem checked={form.involvementType.infoOnly}    onChange={v => upd({ involvementType: { ...form.involvementType, infoOnly: v } })}    label="Information Only" disabled={isPassive} />
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <FieldLabel>Maintenance Threshold</FieldLabel>
        <TInput value={form.maintenanceThreshold} onChange={v => upd({ maintenanceThreshold: v })} placeholder="500" type="number" />
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

function StakeholderCard({ owner, onUpdate, onRemove, isSelf = false, isSaved = false }) {
  const [open, setOpen]         = useState(!isSaved);
  const [editMode, setEditMode] = useState(!isSaved);

  const displayName = owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}` : owner.firstName || 'Owner';
  const subInfo = `${isSelf ? 'Internal Account' : (owner.inUN ? 'UrbanNest Account' : 'External')}${owner.ownershipPct ? ` · ${owner.ownershipPct}% stake` : ''}`;

  const statusCfg = {
    verified: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', icon: 'ti-circle-check', label: 'Verified' },
    pending:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: 'ti-clock',        label: 'Pending'  },
    expired:  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', icon: 'ti-clock-x',      label: 'Expired'  },
  }[owner.status] || { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: 'ti-clock', label: 'Pending' };

  const isPassive = (owner.involvement || 'active') === 'passive';

  function handleInvolvementChange(v) {
    if (v === 'passive') onUpdate({ involvement: v, involvementType: { leaseSig: false, maintenance: false, infoOnly: true } });
    else onUpdate({ involvement: v, involvementType: { leaseSig: true, maintenance: true, infoOnly: false } });
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden', background: C.cardBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: isSelf ? '#DCFCE7' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isSelf ? '#166634' : '#1D4ED8' }}>
          {(displayName[0] || 'O').toUpperCase() + (owner.lastName?.[0] || '').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>{displayName}</span>
            {isSelf && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#166534', fontFamily: F.body }}>YOU</span>}
          </div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontFamily: F.body }}>{subInfo}</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, whiteSpace: 'nowrap', fontFamily: F.body }}>
          <i className={`ti ${statusCfg.icon}`} style={{ fontSize: 12 }} />{statusCfg.label}
        </div>

        <div onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', padding: '2px 4px' }}>
          <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14, color: C.textTert }} />
        </div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
            <div>
              <FieldLabel>Ownership %</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.inputBorder}`, borderRadius: 6, background: C.inputBg, height: 38, overflow: 'hidden' }}>
                <input value={owner.ownershipPct} onChange={e => onUpdate({ ownershipPct: e.target.value })} disabled={!editMode}
                  style={{ flex: 1, padding: '0 10px', fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: C.textPrimary, fontFamily: F.body }} />
                <span style={{ padding: '0 10px', fontSize: 13, color: C.textSec, borderLeft: `1px solid ${C.inputBorder}`, background: '#f1f5f9', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontFamily: F.body }}>%</span>
              </div>
            </div>
            <div>
              <FieldLabel>Ownership Role</FieldLabel>
              <CustomDropdown options={OWNERSHIP_ROLE_OPTIONS} value={owner.ownershipRole || 'individual_owner'} onChange={v => onUpdate({ ownershipRole: v })} placeholder="Individual Owner" disabled={!editMode} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
            <div>
              <FieldLabel>Involvement</FieldLabel>
              <OwnerRadio value={owner.involvement || 'active'} onChange={v => editMode && handleInvolvementChange(v)}
                options={[{ value: 'active', label: 'Active' }, { value: 'passive', label: 'Passive' }]} disabled={!editMode} />
            </div>
            <div>
              <FieldLabel>Involvement Type</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
                <CheckItem checked={owner.involvementType?.leaseSig   ?? false} onChange={v => editMode && onUpdate({ involvementType: { ...owner.involvementType, leaseSig: v } })}   label="Lease Signatory"  disabled={isPassive || !editMode} />
                <CheckItem checked={owner.involvementType?.maintenance ?? true}  onChange={v => editMode && onUpdate({ involvementType: { ...owner.involvementType, maintenance: v } })} label="Maintenance"       disabled={isPassive || !editMode} />
                <CheckItem checked={owner.involvementType?.infoOnly   ?? false} onChange={v => editMode && onUpdate({ involvementType: { ...owner.involvementType, infoOnly: v } })}   label="Information Only" disabled={isPassive || !editMode} />
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 16 }}>
            <div>
              <FieldLabel>Maintenance Threshold</FieldLabel>
              <TInput value={owner.maintenanceThreshold || ''} onChange={v => onUpdate({ maintenanceThreshold: v })} placeholder="5,000" prefix="$" type="number" disabled={!editMode} />
              <div style={{ fontSize: 11, color: C.textTert, marginTop: 4, fontFamily: F.body }}>Approval required for expenses exceeding this amount.</div>
            </div>
          </div>
          {isSaved ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <button onClick={onRemove} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.danger, fontFamily: F.body, padding: 0 }}>
                <i className="ti ti-trash" style={{ fontSize: 14 }} /> Delete
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setOpen(false)} style={{ height: 36, padding: '0 18px', border: `1px solid ${C.borderMed}`, borderRadius: 7, background: C.cardBg, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer', fontFamily: F.body }}>View</button>
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
          )}
        </div>
      )}
    </div>
  );
}

function SelfCard({ selfOwner, setSelfOwner, selfUser }) {
  function toggle() {
    if (selfOwner) { setSelfOwner(null); }
    else {
      setSelfOwner({ firstName: selfUser.firstName, lastName: selfUser.lastName, email: selfUser.email, inUN: true, status: 'verified', ownershipPct: '', ownershipRole: 'individual_owner', involvement: 'active', involvementType: { leaseSig: true, maintenance: true, infoOnly: false }, maintenanceThreshold: '5000', id: 'self' });
    }
  }
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.textSec, marginBottom: 8, fontFamily: F.body }}>
        Step 1 — Do you own this property?
      </div>
      <div onClick={toggle}
        style={{ border: `1px solid ${selfOwner ? '#16A34A' : C.border}`, borderRadius: 8, padding: '12px 14px', background: selfOwner ? '#F0FDF4' : C.cardBg, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: selfOwner ? '#DCFCE7' : C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-user-check" style={{ fontSize: 15, color: selfOwner ? '#16A34A' : C.textTert }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: selfOwner ? '#166534' : C.textPrimary, fontFamily: F.body }}>I own this property</div>
          <div style={{ fontSize: 12, color: selfOwner ? '#166534' : C.textTert, fontFamily: F.body, marginTop: 1, opacity: 0.8 }}>
            {selfOwner ? 'Click to remove yourself as owner' : 'Click to select yourself as owner'}
          </div>
        </div>
        {selfOwner && (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-check" style={{ fontSize: 13, color: '#fff' }} />
          </div>
        )}
      </div>
    </>
  );
}

function OwnershipTab({ selfUser, owners, setOwners, selfOwner, setSelfOwner }) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [expiryDays, setExpiryDays]   = useState('7');
  const [savedIds, setSavedIds]       = useState(new Set());
  const [selfSaved, setSelfSaved]     = useState(false);

  const totalPct = owners.reduce((s, o) => s + (parseFloat(o.ownershipPct) || 0), 0) + (selfOwner ? parseFloat(selfOwner.ownershipPct) || 0 : 0);
  const pctOk    = totalPct === 100;
  const ownerCount = owners.length + (selfOwner ? 1 : 0);
  const pctColor = pctOk ? '#16A34A' : '#F59E0B';

  function addOwner(data) { const newId = Math.random().toString(36).slice(2); setOwners(prev => [...prev, { ...data, id: newId }]); setSavedIds(prev => new Set([...prev, newId])); setShowNewForm(false); }
  function updateOwner(id, patch) { setOwners(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o)); }
  function removeOwner(id) { setOwners(prev => prev.filter(o => o.id !== id)); setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ width: 800, flexShrink: 0 }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: '#D97706' }}>🔑</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>Property Ownership</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSec, fontFamily: F.body }}>
              <span>Invite expiry</span>
              <input value={expiryDays} onChange={e => setExpiryDays(e.target.value)} type="number" min="1" max="30"
                style={{ width: 48, height: 30, border: `1px solid ${C.inputBorder}`, borderRadius: 5, background: C.inputBg, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.textPrimary, outline: 'none', fontFamily: F.body }} />
              <span>days</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.textSec, marginBottom: 18, fontFamily: F.body }}>Add all owners to distribute legal equity.</div>

          <SelfCard selfOwner={selfOwner} setSelfOwner={v => { setSelfOwner(v); if (!v) setSelfSaved(false); }} selfUser={selfUser} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, fontFamily: F.body }}>
              Stakeholder List <span style={{ fontSize: 13, fontWeight: 400, color: C.textSec }}>({ownerCount} added)</span>
            </div>
            {ownerCount > 0 && !showNewForm && (
              <button onClick={() => setShowNewForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `none`, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.primary, fontFamily: F.body, padding: '5px 14px' }}>
                + Add Stakeholder
              </button>
            )}
          </div>

          {selfOwner && (
            <StakeholderCard owner={selfOwner} onUpdate={patch => setSelfOwner(o => ({ ...o, ...patch }))} onRemove={() => { setSelfOwner(null); setSelfSaved(false); }} isSelf isSaved={selfSaved} />
          )}

          {owners.map(o => (
            <StakeholderCard key={o.id} owner={o} onUpdate={patch => updateOwner(o.id, patch)} onRemove={() => removeOwner(o.id)} isSaved={savedIds.has(o.id)} />
          ))}

          {ownerCount === 0 && !showNewForm && (
            <div onClick={() => setShowNewForm(true)}
              style={{ border: `1.5px dashed ${C.borderMed}`, borderRadius: 10, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: C.cardBg }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.borderMed}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C.borderMed}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-plus" style={{ fontSize: 18, color: C.textTert }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.textSec, fontFamily: F.body }}>Add Stakeholder</div>
              <div style={{ fontSize: 12, color: C.textTert, fontFamily: F.body }}>Invite partners or entities to share property equity</div>
            </div>
          )}

          {showNewForm && <NewStakeholderForm onAdd={addOwner} onCancel={() => setShowNewForm(false)} />}

        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <i className="ti ti-chart-pie" style={{ fontSize: 16, color: C.textPrimary }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline }}>Equity Summary</span>
          </div>
          <div style={{ marginBottom: 16 }}><EquityDonut pct={Math.round(Math.min(totalPct, 100))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Requirement</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.body }}>100%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>Remaining</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: pctColor, fontFamily: F.body }}>{Math.max(0, 100 - totalPct)}%</span>
            </div>
          </div>
          {!pctOk && (
            <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 11.5, color: '#92400E', fontFamily: F.body, textAlign: 'center', lineHeight: 1.5 }}>Ownership must equal 100% before the property can be published.</div>
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

        <div style={{ background: '#E8F5F0', border: '1px solid #A8D5C2', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#C8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 16, color: '#1B5E42' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0D3D2B', fontFamily: F.body }}>Ownership Guide</span>
          </div>
          <div style={{ fontSize: 13, color: '#2A6648', marginBottom: 14, lineHeight: 1.6, fontFamily: F.body }}>Add all legal entities who have a stake in this property.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 15, color: '#1B5E42', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0D3D2B', lineHeight: 1.5, fontFamily: F.body }}>Active owners sign leases and approve expenses above threshold.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <i className="ti ti-eye" style={{ fontSize: 15, color: '#1B5E42', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0D3D2B', lineHeight: 1.5, fontFamily: F.body }}>Passive owners receive financial reports only.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <i className="ti ti-mail" style={{ fontSize: 15, color: '#2A6648', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, fontWeight: 400, color: '#2A6648', lineHeight: 1.5, fontFamily: F.body }}>Invited owners have 7 days to verify their identity.</span>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #A8D5C2' }}>
            <a href="#" style={{ fontSize: 13, fontWeight: 700, color: '#0D5E3A', textDecoration: 'none', fontFamily: F.body, display: 'flex', alignItems: 'center', gap: 5 }}>
              Full Documentation <i className="ti ti-external-link" style={{ fontSize: 13 }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK ACCOUNT TAB — drop this entire block into AddNewProperty.jsx
// Place it after the OwnershipTab component and before the main export
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_CATEGORIES = [
  {
    section: 'PROPERTY BANK ACCOUNTS',
    items: [
      { id: 'prop_operating', label: 'Property Operating Account', sub: 'Day-to-day operations',    icon: 'ti-building-bank' },
      { id: 'prop_reserve',   label: 'Property Reserve Account',   sub: 'CapEx and rainy day funds', icon: 'ti-safe'          },
    ],
  },
  {
    section: 'PMS ACCOUNTS',
    items: [
      { id: 'pm_operating', label: 'PM Operating Account',       sub: 'Management fees & admin',   icon: 'ti-briefcase'     },
      { id: 'pm_trust',     label: 'PM Trust Account',           sub: 'Client funds management',   icon: 'ti-shield-lock'   },
      { id: 'rent',         label: 'Rent Collection Account',    sub: 'Tenant payment routing',    icon: 'ti-home-dollar'   },
      { id: 'security',     label: 'Security Deposit Account',   sub: 'Escrow holding account',    icon: 'ti-lock-dollar'   },
    ],
  },
];

const ACCOUNT_DESCRIPTIONS = {
  prop_operating: 'Primary account used for day-to-day property expenses and receiving operational income. Ensures transparency in daily financial activities.',
  prop_reserve:   'Dedicated fund for capital expenditures, major repairs, and emergency reserves. Keeps long-term property finances separate from operations.',
  pm_operating:   'Account for collecting and disbursing property management fees, administrative costs, and vendor payments.',
  pm_trust:       'Segregated trust account holding client funds in compliance with property management regulations. Must remain separate from PM operating funds.',
  rent:           'Dedicated account where tenants route rent payments. Provides clean reconciliation between collected rent and owner disbursements.',
  security:       'Escrow account holding tenant security deposits. Regulated in most jurisdictions — funds must be kept separate and accounted for individually.',
};

// Mock existing accounts — replace with API fetch when Financials is built
const MOCK_EXISTING_ACCOUNTS = [
  { value: 'acc_001', label: 'Chase Main — ••••8829',       bank: 'Chase Manhattan', nickname: 'Main Op - 5th Ave',  number: '••••••••••8829', routing: '021000021', type: 'checking', owner: 'Tate Real Estate Holdings LLC' },
  { value: 'acc_002', label: 'Wells Fargo Reserve — ••••4412', bank: 'Wells Fargo',  nickname: 'Reserve Fund A',     number: '••••••••••4412', routing: '121000248', type: 'savings',  owner: 'Tate Real Estate Holdings LLC' },
  { value: 'acc_003', label: 'BofA Operations — ••••7731',  bank: 'Bank of America', nickname: 'BofA Ops Account',   number: '••••••••••7731', routing: '026009593', type: 'checking', owner: 'Metro Holdings Inc.' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: '',         label: 'Select type…' },
  { value: 'checking', label: 'Checking'     },
  { value: 'savings',  label: 'Savings'      },
];

function emptyAccountState() {
  return {
    mode: 'existing',          // 'existing' | 'new'
    existingId: '',
    saved: false,
    bankName: '', nickname: '', accountNumber: '', routing: '',
    accountType: '', owner: '', voidedCheck: null, voidedCheckName: '',
  };
}

function emptyReserveExtras() {
  return {
    minThreshold: '',
    topUp: 'manual',           // 'manual' | 'auto'
    topUpMode: 'existing',     // 'existing' | 'new'
    topUpExistingId: '',
    topUpBankName: '', topUpNickname: '', topUpAccountNumber: '',
    topUpRouting: '', topUpAccountType: '', topUpOwner: '',
    topUpVoidedCheck: null, topUpVoidedCheckName: '',
  };
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function BankFieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.labelColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontFamily: F.body }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function BankInput({ value, onChange, placeholder, prefix, type = 'text', disabled = false, error = false }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 38,
      border: `1px solid ${error ? C.danger : focused ? C.inputFocus : C.inputBorder}`,
      borderRadius: 6, background: disabled ? '#f1f5f9' : C.inputBg,
      boxShadow: focused && !disabled ? `0 0 0 2px ${error ? '#fde8e8' : '#dbeafe'}` : 'none',
      overflow: 'hidden', transition: 'all 0.15s', opacity: disabled ? 0.7 : 1,
    }}>
      {prefix && (
        <span style={{ padding: '0 10px', fontSize: 13, color: C.textSec, borderRight: `1px solid ${C.inputBorder}`, background: '#f1f5f9', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontFamily: F.body, flexShrink: 0 }}>{prefix}</span>
      )}
      <input
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ flex: 1, padding: '0 11px', fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: C.textPrimary, fontFamily: F.body, cursor: disabled ? 'default' : 'text' }}
      />
    </div>
  );
}

function ModeToggle({ mode, onChange }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${C.borderMed}`, borderRadius: 7, overflow: 'hidden', width: 'fit-content', marginBottom: 20 }}>
      {[['existing', 'Select Existing'], ['new', 'Add New Account']].map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)}
          style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: 'none', fontFamily: F.body,
            background: mode === val ? C.primary : C.cardBg,
            color: mode === val ? '#fff' : C.textSec,
            transition: 'all 0.15s',
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function VoidedCheckUpload({ fileName, onFile, onRemove }) {
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
        <div
          onClick={() => ref.current.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1.5px dashed ${C.borderMed}`, borderRadius: 6, padding: '9px 14px', cursor: 'pointer', background: C.inputBg, transition: 'border-color 0.15s' , width: '100%', boxSizing: 'border-box'}}
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

function ExistingAccountForm({ existingId, onChange }) {
  const selected = MOCK_EXISTING_ACCOUNTS.find(a => a.value === existingId);
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <BankFieldLabel required>Existing Account</BankFieldLabel>
        <CustomDropdown
          options={[{ value: '', label: 'Select an account…' }, ...MOCK_EXISTING_ACCOUNTS]}
          value={existingId}
          onChange={onChange}
          placeholder="Select an account…"
        />
      </div>
      {selected && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginTop: 4 }}>
          <div><BankFieldLabel>Bank Name</BankFieldLabel><BankInput value={selected.bank} disabled /></div>
          <div><BankFieldLabel>Account Nickname</BankFieldLabel><BankInput value={selected.nickname} disabled /></div>
          <div><BankFieldLabel>Account Number</BankFieldLabel><BankInput value={selected.number} disabled /></div>
          <div><BankFieldLabel>Routing / IFSC</BankFieldLabel><BankInput value={selected.routing} disabled /></div>
          <div>
            <BankFieldLabel>Account Type</BankFieldLabel>
            <BankInput value={selected.type.charAt(0).toUpperCase() + selected.type.slice(1)} disabled />
          </div>
          <div><BankFieldLabel>Legal Owner Name</BankFieldLabel><BankInput value={selected.owner} disabled /></div>
        </div>
      )}
    </div>
  );
}

function NewAccountForm({ data, onChange }) {
  const upd = patch => onChange({ ...data, ...patch });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div>
          <BankFieldLabel required>Bank Name</BankFieldLabel>
          <BankInput value={data.bankName} onChange={v => upd({ bankName: v })} placeholder="e.g. Chase Manhattan" />
        </div>
        <div>
          <BankFieldLabel required>Account Nickname</BankFieldLabel>
          <BankInput value={data.nickname} onChange={v => upd({ nickname: v })} placeholder="e.g. Main Op Account" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div>
          <BankFieldLabel required>Account Number</BankFieldLabel>
          <BankInput value={data.accountNumber} onChange={v => upd({ accountNumber: v })} placeholder="Enter account number" type="password" />
        </div>
        <div>
          <BankFieldLabel required>Routing / IFSC Number</BankFieldLabel>
          <BankInput value={data.routing} onChange={v => upd({ routing: v })} placeholder="e.g. 021000021" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div>
          <BankFieldLabel>Account Type</BankFieldLabel>
          <CustomDropdown options={ACCOUNT_TYPE_OPTIONS} value={data.accountType} onChange={v => upd({ accountType: v })} placeholder="Select type…" />
        </div>
        <div>
          <BankFieldLabel>Owner</BankFieldLabel>
          <BankInput value={data.owner} onChange={v => upd({ owner: v })} placeholder="Legal owner name" />
        </div>
      </div>
      <div style={{ width: '100%' }}>
        <BankFieldLabel>Voided Check</BankFieldLabel>
        <VoidedCheckUpload
          fileName={data.voidedCheckName}
          onFile={f => upd({ voidedCheck: f, voidedCheckName: f.name })}
          onRemove={() => upd({ voidedCheck: null, voidedCheckName: '' })}
        />
      </div>
    </div>
  );
}

// ── Reserve Account extras (threshold + top-up) ────────────────────────────────
function ReserveExtras({ extras, onChange }) {
  const upd = patch => onChange({ ...extras, ...patch });

  const topUpNewData = {
    bankName: extras.topUpBankName, nickname: extras.topUpNickname,
    accountNumber: extras.topUpAccountNumber, routing: extras.topUpRouting,
    accountType: extras.topUpAccountType, owner: extras.topUpOwner,
    voidedCheck: extras.topUpVoidedCheck, voidedCheckName: extras.topUpVoidedCheckName,
  };
  const updateTopUpNew = patch => upd({
    topUpBankName: patch.bankName ?? extras.topUpBankName,
    topUpNickname: patch.nickname ?? extras.topUpNickname,
    topUpAccountNumber: patch.accountNumber ?? extras.topUpAccountNumber,
    topUpRouting: patch.routing ?? extras.topUpRouting,
    topUpAccountType: patch.accountType ?? extras.topUpAccountType,
    topUpOwner: patch.owner ?? extras.topUpOwner,
    topUpVoidedCheck: patch.voidedCheck ?? extras.topUpVoidedCheck,
    topUpVoidedCheckName: patch.voidedCheckName ?? extras.topUpVoidedCheckName,
  });

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
      {/* Minimum Threshold */}
      <div style={{ marginBottom: 16, maxWidth: 260 }}>
        <BankFieldLabel>Minimum Threshold Amount</BankFieldLabel>
        <BankInput value={extras.minThreshold} onChange={v => upd({ minThreshold: v })} placeholder="0.00" prefix="$" type="number" />
        <div style={{ fontSize: 11, color: C.textTert, marginTop: 4, fontFamily: F.body }}>Auto-refill triggers when balance falls below this amount.</div>
      </div>

      {/* Top Up radio */}
      <div style={{ marginBottom: extras.topUp === 'auto' ? 16 : 0 }}>
        <BankFieldLabel>Top Up</BankFieldLabel>
        <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
          {[['manual', 'Manual'], ['auto', 'Auto']].map(([val, label]) => (
            <div key={val} onClick={() => upd({ topUp: val })}
              style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${extras.topUp === val ? C.primary : C.borderMed}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {extras.topUp === val && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary }} />}
              </div>
              <span style={{ fontSize: 13, color: extras.topUp === val ? C.primary : C.textSec, fontWeight: extras.topUp === val ? 600 : 400, fontFamily: F.body }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.textTert, marginTop: 4, fontFamily: F.body }}>
          {extras.topUp === 'auto' ? 'Funds will be automatically transferred from the source account.' : 'You will manually transfer funds when the balance runs low.'}
        </div>
      </div>

      {/* Auto top-up source account */}
      {extras.topUp === 'auto' && (
        <div style={{ marginTop: 16, background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F.body, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ti ti-arrows-exchange" style={{ fontSize: 14, color: C.primaryBlue }} />
            Top Up From Account
          </div>
          <ModeToggle mode={extras.topUpMode} onChange={v => upd({ topUpMode: v })} />
          {extras.topUpMode === 'existing'
            ? <ExistingAccountForm existingId={extras.topUpExistingId} onChange={v => upd({ topUpExistingId: v })} />
            : <NewAccountForm data={topUpNewData} onChange={updateTopUpNew} />
          }
        </div>
      )}
    </div>
  );
}

// ── AccountCard — right panel ─────────────────────────────────────────────────
function AccountCard({ categoryId, accountData, onChange, onSaved, reserveExtras, onReserveExtrasChange }) {
  const isReserve = categoryId === 'prop_reserve';
  const desc = ACCOUNT_DESCRIPTIONS[categoryId] || '';

  // Find category meta
  const allItems = ACCOUNT_CATEGORIES.flatMap(s => s.items);
  const meta = allItems.find(i => i.id === categoryId) || { label: '', icon: 'ti-building-bank' };

  const canSave = accountData.mode === 'existing'
    ? Boolean(accountData.existingId)
    : Boolean(
        (accountData.bankName || '').trim() &&
        (accountData.accountNumber || '').trim() &&
        (accountData.routing || '').trim()
    );
       

  function handleSave() {
    if (!canSave) return;
    onChange({ ...accountData, saved: true });
    if (onSaved) onSaved();
  }

  function handleCancel() {
    onChange({ ...accountData, saved: false });
  }

  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '18px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <i className={`ti ${meta.icon}`} style={{ fontSize: 17, color: C.primaryBlue }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: F.headline, marginBottom: 4 }}>{meta.label}</div>
            <div style={{ fontSize: 12, color: C.textSec, fontFamily: F.body, lineHeight: 1.55, maxWidth: 520 }}>{desc}</div>
          </div>
          {accountData.saved && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: C.successLight, border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: C.success, fontFamily: F.body, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 12 }} /> Saved
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '20px 20px 0' }}>
        <ModeToggle mode={accountData.mode} onChange={v => onChange({ ...accountData, mode: v, saved: false })} />

        {accountData.mode === 'existing'
          ? <ExistingAccountForm existingId={accountData.existingId} onChange={v => onChange({ ...accountData, existingId: v })} />
          : <NewAccountForm data={accountData} onChange={d => onChange({ ...accountData, ...d })} />
        }

        {/* Reserve extras */}
        {isReserve && (
          <ReserveExtras extras={reserveExtras} onChange={onReserveExtrasChange} />
        )}
      </div>

      {/* Card footer */}
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
    </div>
  );
}

// ── BankAccountTab — top-level ────────────────────────────────────────────────
function BankAccountTab({ accounts, setAccounts, reserveExtras, setReserveExtras, activeId, setActiveId }) {
  const allIds = ACCOUNT_CATEGORIES.flatMap(s => s.items.map(i => i.id));

  const savedCount = Object.values(accounts).filter(a => a.saved).length;
  const totalCount = allIds.length;

  function updateAccount(id, data) {
    setAccounts(prev => ({ ...prev, [id]: data }));
  }

  function advanceToNext(currentId) {
    const idx = allIds.indexOf(currentId);
    if (idx < allIds.length - 1) setActiveId(allIds[idx + 1]);
  }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Left category nav ── */}
      <div style={{ width: 260, flexShrink: 0, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {ACCOUNT_CATEGORIES.map((section, si) => (
          <div key={section.section}>
            {/* Section label */}
            <div style={{ padding: si === 0 ? '16px 16px 8px' : '12px 16px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.textTert, fontFamily: F.body, borderTop: si > 0 ? `1px solid ${C.border}` : 'none' }}>
              {section.section}
            </div>
            {/* Items */}
            {section.items.map(item => {
              const isActive = activeId === item.id;
              const isSaved  = accounts[item.id]?.saved;
              return (
                <div key={item.id} onClick={() => setActiveId(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', background: isActive ? C.primaryLight : 'transparent', borderLeft: `3px solid ${isActive ? C.primary : 'transparent'}`, transition: 'all 0.12s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8faff'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                  {/* Status dot */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: isSaved ? C.success : isActive ? C.primary : C.borderMed, border: `2px solid ${isSaved ? C.success : isActive ? C.primary : C.borderMed}`, transition: 'all 0.15s' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.primary : C.textPrimary, fontFamily: F.body, lineHeight: 1.3 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.textTert, fontFamily: F.body, marginTop: 1 }}>{item.sub}</div>
                  </div>
                  {isSaved && <i className="ti ti-circle-check" style={{ fontSize: 13, color: C.success, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        ))}

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

      {/* ── Right account card ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <AccountCard
          key={activeId}
          categoryId={activeId}
          accountData={accounts[activeId]}
          onChange={data => updateAccount(activeId, data)}
          onSaved={() => advanceToNext(activeId)}
          reserveExtras={reserveExtras}
          onReserveExtrasChange={setReserveExtras}
        />

        {/* Info note */}
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

// ─── Main component ────────────────────────────────────────────────────────────
export default function AddNewProperty({ persona = 'INDEPENDENT_PM' }) {
  const navigate = useNavigate();
  const [userName, setUserName]     = useState('');
  const [userRole, setUserRole]     = useState('Independent PM');
  const [mainTab, setMainTab]       = useState('property');
  const [subTab, setSubTab]         = useState('Primary Info');
  const [unitLocked, setUnitLocked] = useState(true);
  const [showMore, setShowMore]     = useState(false);
  const [unitCount, setUnitCount]   = useState(0);
  const [unitSaved, setUnitSaved] = useState(false);
  const [pendingNewUnit, setPendingNewUnit] = useState(null);
  const firstUnit                      = React.useMemo(() => emptyUnit(''), []);
  const [units, setUnits]              = useState([firstUnit]);
  const [activeUnitId, setActiveUnitId] = useState(firstUnit.id);  
  const [bankAccounts, setBankAccounts]         = useState(() => Object.fromEntries(['prop_operating','prop_reserve','pm_operating','pm_trust','rent','security'].map(id => [id, emptyAccountState()])));
  const [bankReserveExtras, setBankReserveExtras] = useState(() => emptyReserveExtras());
  const [bankActiveId, setBankActiveId]           = useState('prop_operating');

  const activeUnit = units.find(u => u.id === activeUnitId) || units[0];
  const propBankComplete = Object.values(bankAccounts).every(a => a.saved);
  const unitBankComplete = activeUnit
  ? Object.values(activeUnit.unitBankAccounts || {}).every(a => a.saved || a.skipped)
  : false;

  const [propName, setPropName]     = useState('');
  const [propType, setPropType]     = useState('');
  const [propValue, setPropValue]   = useState('');
  const [buildYear, setBuildYear]   = useState('');
  const [ownerType, setOwnerType]   = useState('');
  const [desc, setDesc]             = useState('');
  const [country, setCountry]       = useState('US');
  const [street1, setStreet1]       = useState('');
  const [street2, setStreet2]       = useState('');
  const [landmark, setLandmark]     = useState('');
  const [city, setCity]             = useState('');
  const [state, setState]           = useState('');
  const [zip, setZip]               = useState('');
  const [mainPrev, setMainPrev]     = useState(null);
  const [thumbPrevs, setThumbPrevs] = useState([null, null, null]);
  const [videoPrev, setVideoPrev]   = useState(null);
  const [errors, setErrors]         = useState({});

  const [selectedAmenities, setSelectedAmenities] = useState(new Set());
  const [galleryImages, setGalleryImages]         = useState([]);
  const [galleryVideos, setGalleryVideos]         = useState([]);
  const [owners, setOwners]                       = useState([]);
  const [selfOwner, setSelfOwner]                 = useState(null);

  const selfUser = { firstName: userName.split(' ')[0] || 'User', lastName: userName.split(' ').slice(1).join(' ') || '', email: '' };
  const currentTabs  = mainTab === 'property' ? PROP_SUBTABS : UNIT_SUBTABS;
  const stateOptions = (STATES[country] || []).map(s => ({ value: s, label: s }));

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetch('http://localhost:8001/api/auth/me/', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUserName(((data.first_name || '') + ' ' + (data.last_name || '')).trim() || data.email || 'User');
          const roleMap = { INDEPENDENT_PM: 'Independent PM', ORGANIZATIONAL_PM: 'Org PMS Admin', LANDLORD: 'Landlord', RENTER: 'Renter' };
          setUserRole(roleMap[persona || data.active_persona] || 'Independent PM');
        }
      }).catch(() => {});
  }, [navigate, persona]);

  useEffect(() => { setState(''); }, [country]);

  const fullAddr = [street1, city, state, COUNTRY_OPTIONS.find(c => c.value === country)?.label].filter(Boolean).join(', ');

  function validate() {
    const e = {};
    if (!propName.trim()) e.propName = 'Property name is required';
    if (!propType)        e.propType = 'Select a property type';
    if (!ownerType)       e.ownerType = 'Select an ownership type';
    if (!street1.trim())  e.street1 = 'Street address is required';
    if (!city.trim())     e.city = 'City is required';
    if (!state)           e.state = 'Select a state';
    if (!zip.trim())      e.zip = 'Zip code is required';
    if (buildYear && (isNaN(buildYear) || +buildYear < 1800 || +buildYear > 2099)) e.buildYear = 'Enter a valid year';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (mainTab === 'property' && subTab === 'Primary Info') { if (!validate()) return; setUnitLocked(false); }
    const idx = currentTabs.indexOf(subTab);
    if (idx < currentTabs.length - 1) setSubTab(currentTabs[idx + 1]);
  }

  const isLastTab = currentTabs.indexOf(subTab) === currentTabs.length - 1;
  const meta = PAGE_META[subTab] || { title: subTab, sub: '' };

  function updateActiveUnit(data) {
  setUnits(prev => prev.map(u => u.id === activeUnitId ? data : u));
  }

  function handleAddUnit() {
  const newUnit = emptyUnit('');
  setUnits(prev => [...prev, newUnit]);
  setActiveUnitId(newUnit.id);
  setSubTab('Unit/Home Info');
  setUnitSaved(false);
  setPendingNewUnit(newUnit.id);
  }

  function handleSwitchUnit(id) {
  setActiveUnitId(id);
  setSubTab('Unit/Home Info');
  setUnitSaved(false);
  setPendingNewUnit(null);
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        .anp-scroll::-webkit-scrollbar { width: 5px; }
        .anp-scroll::-webkit-scrollbar-track { background: transparent; }
        .anp-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body }}>
        <NavB activeId="add-new" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header userName={userName} userRole={userRole} />
          <div className="anp-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Page header — module title + per-tab page title + subtitle */}
            <div style={{ padding: `${PAGE_PX}px ${PAGE_PX}px 0`, flexShrink: 0 }}>
              <h1 style={{ margin: '0 0 4px', fontFamily: F.headline, fontSize: 'clamp(22px, 2.2vw, 28px)', fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
                Add New Property
              </h1>
              <p style={{ margin: '0 0 10px', fontFamily: F.headline, fontSize: 'clamp(13px, 1.2vw, 15px)', fontWeight: 600, color: C.success }}>
                {meta.title}
              </p>
              {meta.sub && (
                <p style={{ margin: 0, fontFamily: F.body, fontSize: '13px', color: C.textSec, lineHeight: 1.6, maxWidth: '580px' }}>
                  {meta.sub}
                </p>
              )}
            </div>

            {/* Main tabs */}
            <div style={{ background: C.pageBg, margin: `0 ${PAGE_PX}px`, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-end', gap: 4, paddingTop: 10, flexShrink: 0 }}>
              {[{ id: 'property', label: 'Property' }, { id: 'unit', label: 'Unit' }].map(tab => {
                const isA = mainTab === tab.id;
                const isL = tab.id === 'unit' && unitLocked;
                return (
                  <button key={tab.id}
                    onClick={() => { if (!isL) { setMainTab(tab.id); setSubTab(tab.id === 'property' ? 'Primary Info' : 'Unit/Home Info'); } }}
                    style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: '7px 7px 0 0', border: `1.5px solid ${isA ? C.border : 'transparent'}`, borderBottom: isA ? `1.5px solid ${C.cardBg}` : '1.5px solid transparent', background: isA ? C.primary : C.cardBg, color: isA ? '#fff' : isL ? C.textTert : C.textSec, cursor: isL ? 'not-allowed' : 'pointer', marginBottom: -1, fontFamily: F.body, outline: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {tab.label}
                    {isL && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(0,0,0,0.06)', color: C.textTert }}>LOCKED</span>}
                    {tab.id === 'unit' && !isL && unitCount > 0 && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{unitCount}</span>}
                  </button>
                );
              })}
            </div>

            {/* Sub-tabs */}

            <div style={{ background: C.cardBg, margin: `0 ${PAGE_PX}px`, borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, display: 'flex', flexShrink: 0 }}>
              {currentTabs.map(st => {
                const isA = subTab === st;
                return (
                  <button key={st} onClick={() => setSubTab(st)}
                    style={{ padding: '10px 16px', fontSize: 13, fontWeight: isA ? 700 : 400, color: isA ? C.primary : C.textSec, background: 'transparent', border: 'none', borderBottom: isA ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1, fontFamily: F.body, outline: 'none', whiteSpace: 'nowrap' }}>
                    {st === 'Primary Info' ? 'Basic' : st}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div style={{ padding: `20px ${PAGE_PX}px 90px` }}>

              {subTab === 'Primary Info' && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 800, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SecHead type="info" title="Property Basics" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                        <div><FieldLabel required>Property Name</FieldLabel><TInput value={propName} onChange={setPropName} placeholder="e.g. Skyline Heights Plaza" error={errors.propName} /><ErrMsg msg={errors.propName} /></div>
                        <div><FieldLabel required>Property Type</FieldLabel><CustomDropdown options={PROPERTY_TYPE_OPTIONS} value={propType} onChange={setPropType} placeholder="Select Type" error={!!errors.propType} /><ErrMsg msg={errors.propType} /></div>
                        <div><FieldLabel>Property Value (Est.)</FieldLabel><TInput value={propValue} onChange={setPropValue} placeholder="0.00" prefix="$" type="number" /></div>
                        <div><FieldLabel>Build In Year</FieldLabel><TInput value={buildYear} onChange={setBuildYear} placeholder="YYYY" type="number" error={errors.buildYear} /><ErrMsg msg={errors.buildYear} /></div>
                        <div><FieldLabel required>Ownership Type</FieldLabel><CustomDropdown options={OWNERSHIP_TYPE_OPTIONS} value={ownerType} onChange={setOwnerType} placeholder="Select Ownership Type" error={!!errors.ownerType} /><ErrMsg msg={errors.ownerType} /></div>
                        <div style={{ gridColumn: '1/-1' }}><FieldLabel>Description</FieldLabel><TArea value={desc} onChange={setDesc} placeholder="Detailed overview of the property's unique value propositions and structural highlights..." rows={3} /></div>
                      </div>
                    </div>
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <SecHead type="pin" title="Address Details" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                        <div><FieldLabel required>Country</FieldLabel><CustomDropdown options={COUNTRY_OPTIONS} value={country} onChange={v => { setCountry(v); setState(''); }} placeholder="Select Country" error={!!errors.country} /><ErrMsg msg={errors.country} /></div>
                        <div />
                        <div><FieldLabel required>Street Address 01</FieldLabel><TInput value={street1} onChange={setStreet1} placeholder="Building No, Street Name" error={errors.street1} /><ErrMsg msg={errors.street1} /></div>
                        <div><FieldLabel>Street Address 02</FieldLabel><TInput value={street2} onChange={setStreet2} placeholder="Suite, Floor (Optional)" /></div>
                        <div><FieldLabel>Landmark</FieldLabel><TInput value={landmark} onChange={setLandmark} placeholder="Near Central Park" /></div>
                        <div><FieldLabel required>City</FieldLabel><TInput value={city} onChange={setCity} placeholder="New York" error={errors.city} /><ErrMsg msg={errors.city} /></div>
                        <div><FieldLabel required>State</FieldLabel><CustomDropdown options={stateOptions} value={state} onChange={setState} placeholder={country ? 'Select State' : 'Select country first'} disabled={!country} error={!!errors.state} /><ErrMsg msg={errors.state} /></div>
                        <div><FieldLabel required>Zipcode</FieldLabel><TInput value={zip} onChange={setZip} placeholder="10001" error={errors.zip} /><ErrMsg msg={errors.zip} /></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 10, fontFamily: F.body }}>Upload Property Image</div>
                      <UploadZone height={155} onFile={f => setMainPrev(URL.createObjectURL(f))} onRemove={() => setMainPrev(null)} preview={mainPrev} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 8 }}>
                        {[0, 1, 2].map(i => (
                          <UploadZone key={i} isThumb height={56} onFile={f => { const p = [...thumbPrevs]; p[i] = URL.createObjectURL(f); setThumbPrevs(p); }} onRemove={() => { const p = [...thumbPrevs]; p[i] = null; setThumbPrevs(p); }} preview={thumbPrevs[i]} />
                        ))}
                      </div>
                    </div>
                    <div style={{ background: C.cardBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 10, fontFamily: F.body }}>Upload Property Video</div>
                      <UploadZone isVideo height={130} onFile={f => setVideoPrev(f.name)} onRemove={() => setVideoPrev(null)} preview={videoPrev} />
                    </div>
                    <LiveMap address={fullAddr} />
                  </div>
                </div>
              )}

              {subTab === 'Amenities' && mainTab === 'property' && (
                <AmenitiesTab selectedAmenities={selectedAmenities} setSelectedAmenities={setSelectedAmenities} />
              )}

              {subTab === 'Ownership' && mainTab === 'property' && (
                <OwnershipTab selfUser={selfUser} owners={owners} setOwners={setOwners} selfOwner={selfOwner} setSelfOwner={setSelfOwner} />
              )}

              {subTab === 'Bank Account' && mainTab === 'property' && (
                <BankAccountTab
                 accounts={bankAccounts}
                 setAccounts={setBankAccounts}
                 reserveExtras={bankReserveExtras}
                 setReserveExtras={setBankReserveExtras}
                 activeId={bankActiveId}
                 setActiveId={setBankActiveId}
                />
              )}   

              {(subTab !== 'Primary Info' && subTab !== 'Amenities' && subTab !== 'Ownership' && subTab !== 'Bank Account' && mainTab === 'property')  && (
                <div style={{ background: C.cardBg, borderRadius: 10, border: `1.5px dashed ${C.border}`, padding: '56px 24px', textAlign: 'center' }}>
                  <i className={`ti ${{ 'Bank Account': 'ti-building-bank' }[subTab] || 'ti-layout'}`} style={{ fontSize: 38, color: C.borderMed, display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 5, fontFamily: F.headline }}>{subTab}</div>
                  <div style={{ fontSize: 13, color: C.textSec, fontFamily: F.body }}>This section is being built — coming in the next step.</div>
                </div>
              )}

              {mainTab === 'unit' && activeUnit && (
                <UnitTabContent
                  subTab={subTab}
                  unit={activeUnit}
                  onChange={updateActiveUnit}
                  propName={propName}
                  propType={propType}
                  units={units}
                  activeUnitId={activeUnitId}
                  onSwitchUnit={handleSwitchUnit}
                  onAddUnit={handleAddUnit}
                  propOwners={owners}
                  propSelfOwner={selfOwner}
                  selfUser={selfUser}
                />
              )}  
            
            </div>

            {/* Footer */}

            <div style={{ position: 'sticky', bottom: 0, background: C.cardBg, borderTop: `1px solid ${C.border}`, padding: `13px ${PAGE_PX}px`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, zIndex: 10, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)', fontFamily: F.body, marginTop: 'auto' }}>
              {subTab === 'Bank Account' && (
                <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textSec }}>
                 <i className="ti ti-lock" style={{ fontSize: 13 }} /> Secure Transaction Encryption
                </div>
              )}
              <button onClick={() => {
                if (mainTab === 'unit' && pendingNewUnit && activeUnitId === pendingNewUnit) {
                    const remaining = units.filter(u => u.id !== pendingNewUnit);
                    setUnits(remaining);
                    setActiveUnitId(remaining[remaining.length - 1].id);
                    setSubTab('Unit/Home Info');
                    setUnitSaved(true);
                    setPendingNewUnit(null);
                } else {
                    navigate(-1);
                }
              }} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, background: 'transparent', border: `1.5px solid ${C.borderMed}`, borderRadius: 7, color: C.textSec, cursor: 'pointer', fontFamily: F.body, outline: 'none' }}>Cancel</button>
              
              {isLastTab && mainTab === 'property' ? (
                 <button onClick={() => { if (!propBankComplete) return; setMainTab('unit'); setSubTab('Unit/Home Info'); }} disabled={!propBankComplete} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700, background: propBankComplete ? C.primary : C.borderMed, border: 'none', borderRadius: 7, color: '#fff', cursor: propBankComplete ? 'pointer' : 'not-allowed', fontFamily: F.body, outline: 'none' }}>Go to Unit Details →</button>                
              ) : mainTab === 'unit' && unitSaved ? (
                 <button onClick={() => alert('Final Submit')} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700, background: C.success, border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontFamily: F.body, outline: 'none' }}>Final Submit</button>
              ) : isLastTab && mainTab === 'unit' && !unitSaved ? (
                 <button onClick={() => { if (!unitBankComplete) return; setUnitCount(units.length); setUnitSaved(true); setSubTab('Unit/Home Info'); setPendingNewUnit(null); }} disabled={!unitBankComplete} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700, background: unitBankComplete ? C.primary : C.borderMed, border: 'none', borderRadius: 7, color: '#fff', cursor: unitBankComplete ? 'pointer' : 'not-allowed', fontFamily: F.body, outline: 'none' }}>Save Unit</button>
              ) : (
                 <button onClick={handleNext} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 700, background: C.primary, border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontFamily: F.body, outline: 'none' }}>
                    {subTab === 'Primary Info' ? 'Save & Continue' : 'Next →'}
                 </button>
              )}
            </div>    

          </div>
        </div>
      </div>

      {showMore && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 28, width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', fontFamily: F.body }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary, marginBottom: 6, fontFamily: F.headline }}>Unit Saved</div>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 16, lineHeight: 1.6 }}>Do you want to add another unit to this property?</div>
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 20, lineHeight: 1.6 }}>
              <b>Note:</b> You can also add more units later from the property details page.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowMore(false); alert('Final Submit'); }} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, background: 'transparent', border: `1.5px solid ${C.borderMed}`, borderRadius: 7, color: C.textSec, cursor: 'pointer', outline: 'none' }}>No - Final Submit</button>
              <button onClick={() => { setShowMore(false); handleAddUnit(); setMainTab('unit'); }} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, background: C.primary, border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', outline: 'none' }}>+ Add Another Unit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
