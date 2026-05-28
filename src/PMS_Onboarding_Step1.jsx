import { useState } from "react";

const COLORS = {
  primary: '#002D5B',
  secondary: '#064E3B',
  tertiary: '#B45309',
  neutral: '#F1F5F9',
  pageBg: '#F8FAFC',
  navBg: '#1a2332',
  heroBg: '#001f3f',
  border: '#E2E8F0',
  borderMedium: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  danger: '#E53E3E',
  white: '#ffffff',
};

const FONTS = {
  headline: "'Noto Serif', serif",
  body: "'Nunito Sans', sans-serif",
};

const NAV_SECTIONS = [
  {
    label: "Platform",
    items: [
      { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Overview" },
    ]
  },
  {
    label: "Operations",
    items: [
      { icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", label: "PMS", active: true, subs: ["360° View", "Onboarding", "Registry", "Agreements & Contracts", "Health & Activity"] },
      { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Landlords" },
      { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Properties" },
      { icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Services" },
    ]
  },
  {
    label: "Finance",
    items: [
      { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Financials" },
      { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Documents" },
    ]
  },
  {
    label: "Management",
    items: [
      { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Employees" },
      { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", label: "Approvals & Workflows" },
    ]
  },
  {
    label: "Growth",
    items: [
      { icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z", label: "Advertise & Monetize" },
      { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Communications" },
    ]
  },
  {
    label: "System",
    items: [
      { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", label: "Platform & Config" },
      { icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z", label: "Support & Helpdesk" },
      { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Reports & Analytics" },
    ]
  },
];

const SERVICE_CATALOG = [
  { id: 'lease', icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Lease Management", desc: "End-to-end lease lifecycle" },
  { id: 'maintenance', icon: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z", label: "Maintenance", desc: "Work orders & vendor coordination" },
  { id: 'screening', icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", label: "Tenant Screening", desc: "Background & credit checks" },
  { id: 'payments', icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", label: "Payment Processing", desc: "Rent collection & reconciliation" },
  { id: 'listings', icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", label: "Listing & Marketing", desc: "Multi-channel property listings" },
  { id: 'analytics', icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Analytics & Reporting", desc: "Portfolio performance dashboards" },
  { id: 'documents', icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2", label: "Document Management", desc: "Secure vault & e-signatures" },
  { id: 'compliance', icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Compliance Tracking", desc: "Regulatory & audit management" },
];

const REGIONS = ["North America", "Europe", "Asia Pacific", "Middle East", "South Asia", "Africa", "Latin America"];
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "India", "UAE", "Singapore", "Germany", "France"];
const PMS_TYPES = ["Software-based Platform", "In-house Management Team", "Franchise Network", "Hybrid (Tech + Team)", "Boutique Agency"];
const DEPARTMENTS = ["Operations", "Technology", "Finance", "Sales", "Legal", "Executive", "Human Resources", "Compliance"];
const PORTFOLIO_SIZES = ["1–50 units", "51–200 units", "201–500 units", "501–1,000 units", "1,000+ units"];
const ONBOARDING_STEPS = [
  { label: 'Company Details', sub: 'Legal entity information' },
  { label: 'API Credentials', sub: 'Secure system handshake' },
  { label: 'Portfolio Sync', sub: 'Mapping property data' },
  { label: 'Review & Launch', sub: 'Verify and go live' },
];
const TABS = ['Company Details', 'API Credentials', 'Portfolio Sync', 'Review & Launch'];

function SvgIcon({ path, size = 14, color = "currentColor", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {path.split(' M').map((p, i) => <path key={i} d={i === 0 ? p : 'M' + p} />)}
    </svg>
  );
}

function FormField({ label, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={{ display: 'block', fontFamily: FONTS.body, fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: COLORS.neutral, border: `1px solid ${COLORS.border}`,
  borderRadius: 8, padding: '10px 12px', fontFamily: FONTS.body, fontSize: 11,
  color: COLORS.textPrimary, outline: 'none', boxSizing: 'border-box',
};

function TextInput({ placeholder, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ ...inputStyle, border: `1px solid ${focused ? COLORS.primary : COLORS.border}`, background: focused ? COLORS.white : COLORS.neutral }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  );
}

function SelectField({ options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select style={{ ...inputStyle, appearance: 'none', paddingRight: 32, border: `1px solid ${focused ? COLORS.primary : COLORS.border}`, background: focused ? COLORS.white : COLORS.neutral, cursor: 'pointer' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SvgIcon path={icon} size={14} color={COLORS.secondary} />
        </div>
        <span style={{ fontFamily: FONTS.headline, fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// Shared primary button style — matches "Next: API Credentials" footer button exactly
const primaryBtnStyle = {
  fontFamily: FONTS.body,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.white,
  background: COLORS.primary,
  border: 'none',
  borderRadius: 8,
  padding: '10px 32px',
  cursor: 'pointer',
};

function LiaisonCard({ liaison, index, onUpdate, onRemove, canRemove }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px', marginBottom: 12, background: COLORS.pageBg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: FONTS.body, fontSize: 10, fontWeight: 700, color: COLORS.white }}>{index + 1}</span>
          </div>
          <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>Contact {index + 1}</span>
        </div>
        {canRemove && (
          <button onClick={() => onRemove(index)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <SvgIcon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13} color={COLORS.danger} />
            <span style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.danger, fontWeight: 600 }}>Remove</span>
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Full Name *">
          <TextInput placeholder="Full name" value={liaison.name} onChange={e => onUpdate(index, 'name', e.target.value)} />
        </FormField>
        <FormField label="Designation / Title *">
          <TextInput placeholder="e.g. Head of Operations" value={liaison.designation} onChange={e => onUpdate(index, 'designation', e.target.value)} />
        </FormField>
        <FormField label="Department *">
          <SelectField options={DEPARTMENTS} placeholder="Select department..." />
        </FormField>
        <FormField label="Work Email *">
          <TextInput type="email" placeholder="contact@company.com" value={liaison.email} onChange={e => onUpdate(index, 'email', e.target.value)} />
        </FormField>
        <FormField label="Phone Number *">
          <TextInput placeholder="+1 (555) 000-0000" value={liaison.phone} onChange={e => onUpdate(index, 'phone', e.target.value)} />
        </FormField>
        <FormField label="Alternate Number">
          <TextInput placeholder="+1 (555) 000-0000" value={liaison.altPhone} onChange={e => onUpdate(index, 'altPhone', e.target.value)} />
        </FormField>
      </div>
    </div>
  );
}

export default function PMSOnboardingStep1() {
  const [activeSub, setActiveSub] = useState("Onboarding");
  const [expandedNav, setExpandedNav] = useState("PMS");
  const [selectedServices, setSelectedServices] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [liaisons, setLiaisons] = useState([
    { name: '', designation: '', department: '', email: '', phone: '', altPhone: '' }
  ]);

  const toggleService = (id) => setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const addLiaison = () => setLiaisons(prev => [...prev, { name: '', designation: '', department: '', email: '', phone: '', altPhone: '' }]);
  const removeLiaison = (index) => setLiaisons(prev => prev.filter((_, i) => i !== index));
  const updateLiaison = (index, field, value) => setLiaisons(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: FONTS.body, background: COLORS.pageBg }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ height: 60, display: 'flex', alignItems: 'stretch', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flexShrink: 0 }}>
        <div style={{ width: 185, minWidth: 185, background: COLORS.navBg, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SvgIcon path="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" size={13} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: FONTS.headline, fontSize: 14, fontWeight: 600, color: COLORS.white, lineHeight: 1.2 }}>UrbanNest</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Panel</div>
          </div>
        </div>
        <div style={{ flex: 1, background: COLORS.white, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <SvgIcon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14} color={COLORS.textTertiary} />
            </div>
            <input placeholder="Search system resources..." style={{ ...inputStyle, paddingLeft: 36, borderRadius: 10, fontSize: 12, background: COLORS.pageBg, border: `1px solid ${COLORS.border}` }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <SvgIcon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={18} color="#475569" />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
            </div>
            <SvgIcon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={18} color="#475569" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 700, color: COLORS.white }}>AS</span>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, color: COLORS.textPrimary }}>Alex Sterling</div>
                <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Admin</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT NAV */}
        <div style={{ width: 185, minWidth: 185, background: COLORS.navBg, overflowY: 'auto', padding: '16px 0 24px', flexShrink: 0 }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 20px', marginBottom: 2 }}>
                {section.label}
              </div>
              {section.items.map((item) => {
                const isExpanded = expandedNav === item.label;
                const isActive = item.label === "PMS";
                return (
                  <div key={item.label}>
                    <div onClick={() => setExpandedNav(isExpanded ? null : item.label)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px', cursor: 'pointer', borderRadius: 8, margin: '1px 8px', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                      <SvgIcon path={item.icon} size={14} color={isActive ? COLORS.white : 'rgba(255,255,255,0.6)'} />
                      <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? COLORS.white : 'rgba(255,255,255,0.6)', flex: 1 }}>{item.label}</span>
                      {item.subs && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                          <polyline points={isExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                        </svg>
                      )}
                    </div>
                    {item.subs && isExpanded && item.subs.map((sub) => (
                      <div key={sub} onClick={() => setActiveSub(sub)}
                        style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: activeSub === sub ? 600 : 400, color: activeSub === sub ? COLORS.white : 'rgba(255,255,255,0.45)', padding: '5px 20px 5px 36px', cursor: 'pointer', borderLeft: activeSub === sub ? `2px solid ${COLORS.white}` : '2px solid transparent', marginLeft: 8 }}>
                        {sub}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            {[
              { icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Help Center" },
              { icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1", label: "Sign Out" },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px', cursor: 'pointer', margin: '1px 8px', borderRadius: 8 }}>
                <SvgIcon path={item.icon} size={14} color="rgba(255,255,255,0.45)" />
                <span style={{ fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', background: COLORS.neutral, minWidth: 0 }}>
          <div style={{ padding: 20 }}>
            <div style={{ background: COLORS.white, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

              {/* HERO — 97px (88px + 10%) */}
              <div style={{ background: COLORS.heroBg, height: 97, padding: '0 32px', display: 'flex', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                    PMS Onboarding › Step 1 of 4
                  </div>
                  <h1 style={{ fontFamily: FONTS.headline, fontSize: 24, fontWeight: 700, color: COLORS.white, margin: 0, lineHeight: 1.2 }}>
                    Property Management System
                  </h1>
                  <p style={{ fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '4px 0 0' }}>
                    Integration & Onboarding
                  </p>
                </div>
              </div>

              {/* TABS */}
              <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: '0 36px', display: 'flex', overflowX: 'auto' }}>
                {TABS.map((tab, i) => (
                  <div key={tab} style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, padding: '14px 20px', color: i === 0 ? COLORS.primary : COLORS.textTertiary, borderBottom: i === 0 ? `2px solid ${COLORS.primary}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {tab}
                  </div>
                ))}
              </div>

              {/* CONTENT GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 268px' }}>

                {/* FORM */}
                <div style={{ padding: '24px 36px', borderRight: `1px solid ${COLORS.border}`, minWidth: 0 }}>

                  {/* Organizational Identity — Type of PMS restored, address split into 5 fields */}
                  <SectionCard
                    icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    title="Organizational Identity"
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <FormField label="Legal Company Name *">
                        <TextInput placeholder="e.g. Urban Habitat Management Group" />
                      </FormField>
                      <FormField label="Company Registration Number *">
                        <TextInput placeholder="e.g. 12345678" />
                      </FormField>
                      <FormField label="Company Website">
                        <TextInput placeholder="https://" />
                      </FormField>
                      <FormField label="Type of PMS *">
                        <SelectField options={PMS_TYPES} placeholder="Select PMS type..." />
                      </FormField>
                      <FormField label="Country of Registration *">
                        <SelectField options={COUNTRIES} placeholder="Select country..." />
                      </FormField>
                      <FormField label="Regions of Operation *">
                        <SelectField options={REGIONS} placeholder="Select primary region..." />
                      </FormField>
                      <FormField label="Portfolio Size (Units Managed) *">
                        <SelectField options={PORTFOLIO_SIZES} placeholder="Select range..." />
                      </FormField>
                      <FormField label="Years in Operation">
                        <TextInput placeholder="e.g. 8" />
                      </FormField>
                    </div>

                    {/* Address — separated section within the card */}
                    <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 18, paddingTop: 18 }}>
                      <div style={{ fontFamily: FONTS.body, fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        HQ Office Address
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Street Address 1 *" span={2}>
                          <TextInput placeholder="Building number, street name" />
                        </FormField>
                        <FormField label="Street Address 2" span={2}>
                          <TextInput placeholder="Suite, floor, unit (optional)" />
                        </FormField>
                        <FormField label="City *">
                          <TextInput placeholder="e.g. New York" />
                        </FormField>
                        <FormField label="State / Province *">
                          <TextInput placeholder="e.g. NY" />
                        </FormField>
                        <FormField label="ZIP / Postal Code *">
                          <TextInput placeholder="e.g. 10001" />
                        </FormField>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Liaison — multi-contact, Add Another Contact matches primary button style */}
                  <SectionCard icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" title="Liaison Information">
                    <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary, margin: '0 0 14px' }}>
                      Add one or more contacts for this PMS — technical, operations, and billing contacts where applicable.
                    </p>
                    {liaisons.map((liaison, index) => (
                      <LiaisonCard key={index} liaison={liaison} index={index} onUpdate={updateLiaison} onRemove={removeLiaison} canRemove={liaisons.length > 1} />
                    ))}
                    {/* Add Another Contact — same style as "Next: API Credentials" footer button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <button onClick={addLiaison} style={{ ...primaryBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <SvgIcon path="M12 4v16m8-8H4" size={13} color={COLORS.white} />
                        Add Another Contact
                      </button>
                    </div>
                  </SectionCard>

                  {/* Brand Assets */}
                  <SectionCard icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" title="Brand Assets">
                    <div style={{ border: `1.5px dashed ${COLORS.borderMedium}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center', background: COLORS.pageBg, cursor: 'pointer' }}
                      onClick={() => document.getElementById('logo-upload').click()}>
                      <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setLogoFile(e.target.files[0])} />
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <SvgIcon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={16} color={COLORS.secondary} />
                      </div>
                      <div style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 4 }}>
                        {logoFile ? logoFile.name : 'Drag & drop your company logo'}
                      </div>
                      <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textTertiary }}>SVG or transparent PNG preferred · Max 5MB</div>
                      <button style={{ marginTop: 12, fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, background: COLORS.white, border: `1px solid ${COLORS.borderMedium}`, borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>Select File</button>
                    </div>
                  </SectionCard>

                  {/* Services */}
                  <SectionCard icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" title="Services Required">
                    <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary, margin: '0 0 14px' }}>
                      Select from the UrbanNest Service Catalog. Selections update the panel on the right and can be adjusted at any time.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {SERVICE_CATALOG.map(service => {
                        const selected = selectedServices.includes(service.id);
                        return (
                          <div key={service.id} onClick={() => toggleService(service.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1.5px solid ${selected ? COLORS.primary : COLORS.border}`, borderRadius: 8, cursor: 'pointer', background: selected ? '#EEF4FF' : COLORS.white, transition: 'all 0.15s' }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: selected ? COLORS.primary : COLORS.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <SvgIcon path={service.icon} size={12} color={selected ? COLORS.white : COLORS.textSecondary} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, color: selected ? COLORS.primary : COLORS.textPrimary }}>{service.label}</div>
                              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.textTertiary, marginTop: 1 }}>{service.desc}</div>
                            </div>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${selected ? COLORS.primary : COLORS.borderMedium}`, background: selected ? COLORS.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {selectedServices.length > 0 && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#EEF4FF', borderRadius: 6, fontFamily: FONTS.body, fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>
                        {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                      </div>
                    )}
                  </SectionCard>

                </div>

                {/* RIGHT PANEL */}
                <div style={{ padding: '24px 20px', background: COLORS.pageBg, minWidth: 0 }}>
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '18px 16px', marginBottom: 16 }}>
                    <div style={{ fontFamily: FONTS.headline, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 16 }}>Onboarding Progress</div>
                    {ONBOARDING_STEPS.map((step, i) => (
                      <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < ONBOARDING_STEPS.length - 1 ? 12 : 0, position: 'relative' }}>
                        {i < ONBOARDING_STEPS.length - 1 && (
                          <div style={{ position: 'absolute', left: 10, top: 24, width: 1.5, height: 20, background: COLORS.border }} />
                        )}
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? COLORS.primary : 'transparent', border: `2px solid ${i === 0 ? COLORS.primary : COLORS.borderMedium}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          {i === 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.white }} />}
                        </div>
                        <div>
                          <div style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? COLORS.primary : COLORS.textTertiary }}>{step.label}</div>
                          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.textTertiary, marginTop: 1 }}>{step.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '18px 16px', marginBottom: 16 }}>
                    <div style={{ fontFamily: FONTS.headline, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 12 }}>Services Selected</div>
                    {selectedServices.length === 0
                      ? (
                        <div style={{ textAlign: 'center', padding: '14px 0' }}>
                          <SvgIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={20} color={COLORS.textTertiary} style={{ margin: '0 auto 6px', display: 'block' }} />
                          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textTertiary }}>No services selected yet</div>
                        </div>
                      )
                      : SERVICE_CATALOG.filter(s => selectedServices.includes(s.id)).map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '6px 8px', background: '#EEF4FF', borderRadius: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.primary, flexShrink: 0 }} />
                            <span style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.primary, fontWeight: 500 }}>{s.label}</span>
                          </div>
                          <button onClick={() => toggleService(s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                            <SvgIcon path="M6 18L18 6M6 6l12 12" size={11} color={COLORS.textSecondary} />
                          </button>
                        </div>
                      ))
                    }
                  </div>

                  <div style={{ background: '#FFF7ED', border: `1px solid #FED7AA`, borderRadius: 12, padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <SvgIcon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={16} color={COLORS.tertiary} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 700, color: '#92400E' }}>Need help with onboarding?</div>
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 11, color: '#B45309', lineHeight: 1.5 }}>Our implementation specialists are available for a 1-on-1 walkthrough. Schedule a session to accelerate your PMS integration.</div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div style={{ background: COLORS.white, borderTop: `1px solid ${COLORS.border}`, padding: '16px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: '#475569', background: 'transparent', border: `1px solid ${COLORS.borderMedium}`, borderRadius: 8, padding: '10px 28px', cursor: 'pointer' }}>
                  ← Return to PMS
                </button>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}>Save Progress</button>
                  <button style={{ ...primaryBtnStyle }}>
                    Next: API Credentials →
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}