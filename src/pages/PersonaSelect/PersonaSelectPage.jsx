import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

if (!document.getElementById('tabler-icons-cdn')) {
  const link = document.createElement('link');
  link.id   = 'tabler-icons-cdn';
  link.rel  = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(link);
}

const API_BASE = 'http://localhost:8001';

const C = {
  primary:'#002D5B', primaryHover:'#003d7a', pageBg:'#F0F2F5',
  border:'#E2E8F0', borderMedium:'#CBD5E1',
  textPrimary:'#0F172A', textSecondary:'#64748B', textTertiary:'#94A3B8',
  white:'#FFFFFF', neutral:'#F1F5F9',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

const ESTATE_IMAGE = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=80&fit=crop';
const TESTIMONIALS = [
  { quote: '"Experience the pinnacle of urban living with curated spaces designed for the modern tenant. URBANNEST provides the clarity and security essential for navigating complex global markets with confidence."', name: 'JULIAN VANE', title: 'GLOBAL PORTFOLIO STRATEGY, LONDON' },
  { quote: '"Unparalleled access to prime real estate opportunities across three continents. URBANNEST redefines what private wealth management looks like."', name: 'SOPHIA HARTWELL', title: 'PRIVATE EQUITY DIRECTOR, ZÜRICH' },
  { quote: '"From acquisition to legacy planning, URBANNEST has been the cornerstone of our family office strategy for over a decade."', name: 'MARCUS DELACROIX', title: 'FAMILY OFFICE PRINCIPAL, SINGAPORE' },
];

// ─── Org PMS status badge config ──────────────────────────────────────────────
const ORG_PMS_BADGE = {
  DRAFT:     { label:'Draft',    bg:'#FEF3C7', color:'#92400E', border:'#FCD34D' },
  PENDING:   { label:'Pending',  bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE' },
  APPROVED:  { label:'Active',   bg:'#F0FDF4', color:'#166534', border:'#BBF7D0' },
  SUSPENDED: { label:'Suspended',bg:'#FEF2F2', color:'#991B1B', border:'#FECACA' },
};

// ─── Persona catalogue ─────────────────────────────────────────────────────────
const ALL_PERSONAS = [
  { key:'RENTER',            label:'Renter',            sub:'Main Account',       icon:'ti-home',                color:C.primary,  route:'/coming-soon',            portal:'/coming-soon' },
  { key:'TENANT',            label:'Tenant',            sub:'Active Tenancy',     icon:'ti-users',               color:'#1D4ED8',  route:'/coming-soon',            portal:'/coming-soon' },
  { key:'LANDLORD',          label:'Landlord',          sub:'Property Owner',     icon:'ti-building',            color:'#064E3B',  route:'/coming-soon',            portal:'/coming-soon' },
  { key:'INDEPENDENT_PM',    label:'Property Manager',  sub:'Independent PM',     icon:'ti-briefcase',           color:'#B45309',  route:'/pm-registration',        portal:'/pm-portal/dashboard/welcome' },
  { key:'ORGANIZATIONAL_PM', label:'PMS Company',       sub:'Organisational PM',  icon:'ti-building-skyscraper', color:'#BE123C',  route:'/org-onboarding/step-1',  portal:'/org-onboarding/step-1' },
  { key:'REAL_ESTATE_AGENT', label:'Real Estate Agent', sub:'Agent Portal',       icon:'ti-id-badge',            color:'#7C3AED',  route:'/coming-soon',            portal:'/coming-soon' },
  { key:'UN_ADMIN',          label:'UN Admin',          sub:'Lead Administrator', icon:'ti-shield-lock',         color:C.primary,  route:'/admin-portal/dashboard', portal:'/admin-portal/dashboard' },
];

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  const t = TESTIMONIALS[idx];
  return (
    <div style={{ position:'absolute', bottom:48, left:36, right:36, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderRadius:16, border:'1px solid rgba(255,255,255,0.18)', padding:'28px 32px 22px' }}>
      <p style={{ fontFamily:F.headline, fontSize:14, fontWeight:400, color:'#fff', lineHeight:1.7, margin:'0 0 20px', fontStyle:'italic' }}>{t.quote}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontFamily:F.body, fontSize:11, fontWeight:700, color:'#fff', margin:'0 0 2px', letterSpacing:'0.06em' }}>{t.name}</p>
          <p style={{ fontFamily:F.body, fontSize:10, color:'rgba(255,255,255,0.6)', margin:0, letterSpacing:'0.04em' }}>{t.title}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[() => setIdx(i => (i-1+TESTIMONIALS.length)%TESTIMONIALS.length), () => setIdx(i => (i+1)%TESTIMONIALS.length)].map((fn,i) => (
            <button key={i} onClick={fn} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F.body, fontSize:14 }}>
              {i===0?'‹':'›'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

// ─── Persona card — supports orgPmsBadge for ORGANIZATIONAL_PM ────────────────
// All other personas use existing isActive/isInactive system — UNTOUCHED.
function PersonaCard({ persona, isActive, isInactive, orgPmsBadge, onClick }) {
  const [hovered, setHovered] = useState(false);
  const { label, sub, icon, color } = persona;

  // For ORGANIZATIONAL_PM: use orgPmsBadge styling if provided
  const hasOrgBadge = !!orgPmsBadge;
  const bg     = hasOrgBadge ? orgPmsBadge.bg
               : isActive || hovered ? '#F0F4F8'
               : isInactive ? '#FFF7ED'
               : C.white;
  const border = hasOrgBadge ? `2px solid ${orgPmsBadge.border}`
               : isActive ? `2px solid ${C.primary}`
               : isInactive ? `2px solid #F59E0B`
               : hovered ? `2px solid ${C.borderMedium}`
               : `1.5px solid ${C.border}`;

  return (
    <div onClick={() => onClick(persona)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      role="button" tabIndex={0} onKeyDown={e => (e.key==='Enter'||e.key===' ')&&onClick(persona)}
      style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', padding:'21px 10px 16px', borderRadius:'11px', border, background:bg, cursor:'pointer', transition:'all 0.18s ease', transform:hovered&&!isActive&&!isInactive&&!hasOrgBadge?'translateY(-1px)':'none', boxShadow:isActive?'0 4px 16px rgba(0,45,91,0.12)':isInactive?'0 4px 16px rgba(245,158,11,0.10)':hovered?'0 4px 12px rgba(0,0,0,0.06)':'0 1px 3px rgba(0,0,0,0.04)', textAlign:'center', minHeight:'120px' }}>

      {/* ── Org PMS status badge (DRAFT/PENDING/ACTIVE/SUSPENDED) ── */}
      {hasOrgBadge && (
        <div style={{ position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)', background:orgPmsBadge.color, color:C.white, fontFamily:F.body, fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', padding:'3px 10px', borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
          {orgPmsBadge.label}
        </div>
      )}

      {/* ── Standard Active badge (other personas) ── */}
      {isActive && !hasOrgBadge && (
        <div style={{ position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)', background:C.primary, color:C.white, fontFamily:F.body, fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', padding:'3px 10px', borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap' }}>Active</div>
      )}

      {/* ── Standard Inactive badge (other personas) ── */}
      {isInactive && !hasOrgBadge && (
        <div style={{ position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)', background:'#F59E0B', color:C.white, fontFamily:F.body, fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', padding:'3px 10px', borderRadius:'99px', textTransform:'uppercase', whiteSpace:'nowrap' }}>Inactive</div>
      )}

      <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:hasOrgBadge?`${orgPmsBadge.color}22`:isActive?C.primary:isInactive?'#FEF3C7':hovered?`${color}18`:C.neutral, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.18s ease', flexShrink:0 }}>
        <i className={`ti ${icon}`} style={{ fontSize:'16px', color:hasOrgBadge?orgPmsBadge.color:isActive?C.white:isInactive?'#F59E0B':color }} aria-hidden="true" />
      </div>
      <div>
        <p style={{ margin:'0 0 2px', fontFamily:F.headline, fontSize:'11px', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>{label}</p>
        <p style={{ margin:0, fontFamily:F.body, fontSize:'8px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.07em' }}>{sub}</p>
      </div>
    </div>
  );
}

function AddPersonaCard({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      role="button" tabIndex={0} onKeyDown={e => (e.key==='Enter'||e.key===' ')&&onClick()}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', padding:'21px 10px 16px', borderRadius:'11px', border:`1.5px dashed ${hovered?C.primary:C.borderMedium}`, background:hovered?'#F8FAFC':'transparent', cursor:'pointer', transition:'all 0.18s ease', textAlign:'center', minHeight:'120px' }}>
      <div style={{ width:'42px', height:'42px', borderRadius:'50%', border:`1.5px dashed ${hovered?C.primary:C.borderMedium}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s ease', flexShrink:0 }}>
        <i className="ti ti-plus" style={{ fontSize:'15px', color:hovered?C.primary:C.textTertiary }} aria-hidden="true" />
      </div>
      <div>
        <p style={{ margin:'0 0 2px', fontFamily:F.headline, fontSize:'11px', fontWeight:700, color:hovered?C.primary:C.textSecondary, lineHeight:1.2, transition:'color 0.18s ease' }}>Add Persona</p>
        <p style={{ margin:0, fontFamily:F.body, fontSize:'8px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.07em' }}>Unlock a new role</p>
      </div>
    </div>
  );
}

export default function PersonaSelectPage() {
  const navigate = useNavigate();

  const [user,                 setUser]                 = useState(null);
  const [activeKeys,           setActiveKeys]           = useState([]);
  const [inactiveKeys,         setInactiveKeys]         = useState([]);
  const [loading,              setLoading]              = useState(true);
  const [showAll,              setShowAll]              = useState(false);
  const [error,                setError]                = useState('');

  // ── Org PMS specific state ─────────────────────────────────────────────────
  // null = still loading, false = no record exists, object = latest OrgPMS record
  const [orgPmsRecord,         setOrgPmsRecord]         = useState(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showReactivateModal,  setShowReactivateModal]  = useState(false);
  const [pendingReactivateKey, setPendingReactivateKey] = useState(null);
  const [showRejectionModal,   setShowRejectionModal]   = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) { navigate('/'); return; }

      try {
        // ── Step 1: fetch user profile ──────────────────────────────────────
        const meRes = await fetch(`${API_BASE}/api/auth/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.status === 401) { localStorage.clear(); navigate('/'); return; }
        if (!meRes.ok) throw new Error('Failed to load profile');

        const data = await meRes.json();
        setUser(data);

        let keys = [];
        if (Array.isArray(data.active_personas)) {
          keys = data.active_personas;
        } else if (Array.isArray(data.personas)) {
          keys = data.personas.map(p => (typeof p === 'string' ? p : p.persona));
        }
        if (!keys.includes('UN_ADMIN')) {
          if (!keys.includes('RENTER')) keys = ['RENTER', ...keys];
        }
        setActiveKeys(keys);
        setInactiveKeys(Array.isArray(data.inactive_personas) ? data.inactive_personas : []);

        // ── Step 2: fetch OrgPMS record — skip entirely for UN_ADMIN ───────
        // Using the keys we just got from the API — 100% reliable, no race condition.
        if (keys.includes('UN_ADMIN')) {
          setOrgPmsRecord(false);
        } else {
          try {
            const orgRes = await fetch(`${API_BASE}/api/admin/org-pms/?mine=true`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (orgRes.ok) {
              const orgData = await orgRes.json();
              const list = Array.isArray(orgData) ? orgData : (orgData.results || []);
              setOrgPmsRecord(list[0] || false);
            } else {
              setOrgPmsRecord(false);
            }
          } catch {
            setOrgPmsRecord(false);
          }
        }

      } catch (err) {
        if (err.message !== 'Unauthorized') {
          setError('Could not load your profile.');
          setActiveKeys(['RENTER']);
          const decoded = decodeJWT(localStorage.getItem('access_token'));
          if (decoded) setUser({ email: decoded.email || decoded.username || '' });
          setOrgPmsRecord(false);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // ── Derived org PMS state ──────────────────────────────────────────────────
  const orgPmsStatus = orgPmsRecord ? orgPmsRecord.status : null;
  // Show the Org PMS persona card only for these statuses (not REJECTED, not null)
  const showOrgPmsCard = orgPmsRecord && ['DRAFT','PENDING','APPROVED','SUSPENDED'].includes(orgPmsStatus);
  // Suppress ORGANIZATIONAL_PM from "Add Persona" list if user has active application
  const orgPmsAvailableToAdd = !orgPmsRecord || orgPmsStatus === 'REJECTED';

  const handlePersonaClick = (persona) => {
    if (persona.key === 'ORGANIZATIONAL_PM') {
      // ── Org PMS routing is status-aware ─────────────────────────────────
      switch (orgPmsStatus) {
        case 'DRAFT':
          // Pre-populate localStorage with the org id so Step 1 fetches existing data
          if (orgPmsRecord?.id) localStorage.setItem('org_pms_id', orgPmsRecord.id);
          navigate('/org-onboarding/step-1');
          break;
        case 'PENDING':
          navigate('/org-onboarding/pending');
          break;
        case 'APPROVED':
          navigate('/org-portal/dashboard/welcome');
          break;
        case 'SUSPENDED':
          navigate('/coming-soon');
          break;
        default:
          // No record or REJECTED — handled by Add Persona flow, not card click
          break;
      }
      return;
    }

    // ── All other personas — existing logic untouched ────────────────────
    if (activeKeys.includes(persona.key)) {
      switch (persona.key) {
        case 'INDEPENDENT_PM':    navigate('/pm-portal/dashboard/welcome'); break;
        case 'UN_ADMIN':          navigate('/admin-portal/dashboard'); break;
        case 'LANDLORD':          navigate('/coming-soon'); break;
        case 'TENANT':            navigate('/coming-soon'); break;
        case 'RENTER':            navigate('/coming-soon'); break;
        default:                  navigate('/coming-soon');
      }
    } else if (inactiveKeys.includes(persona.key)) {
      setPendingReactivateKey(persona.key);
      setShowReactivateModal(true);
    } else {
      // Unregistered persona — navigate to registration route
      navigate(persona.route);
    }
  };

  const handleAddPersonaClick = () => {
    setShowAll(true);
  };

  // ── When user selects ORGANIZATIONAL_PM from "Add Persona" list ───────────
  const handleUnregisteredPersonaClick = (persona) => {
    if (persona.key === 'ORGANIZATIONAL_PM') {
      if (orgPmsStatus === 'REJECTED') {
        // Show rejection modal before starting fresh
        setShowRejectionModal(true);
      } else {
        // Truly new application — clear any stale org_pms_* keys and go to Step 1
        clearOrgPmsStorage();
        navigate('/org-onboarding/step-1');
      }
      return;
    }
    navigate(persona.route);
  };

  const clearOrgPmsStorage = () => {
    ['org_pms_id','org_pms_scenario','org_pms_country','org_pms_unit_count',
     'org_pms_integration_method','org_pms_plan_id','org_pms_billing_cycle',
     'org_pms_subscription_id','org_pms_selected_addons'].forEach(k => localStorage.removeItem(k));
  };

  const handleReactivateConfirm = () => {
    setShowReactivateModal(false);
    if (pendingReactivateKey === 'INDEPENDENT_PM') navigate('/pm-portal/profile/persona?mode=edit');
    setPendingReactivateKey(null);
  };
  const handleReactivateCancel = () => { setShowReactivateModal(false); setPendingReactivateKey(null); };

  const handleRejectionConfirm = () => {
    setShowRejectionModal(false);
    clearOrgPmsStorage();
    navigate('/org-onboarding/step-1');
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/');
  };

  const displayEmail = user?.email || user?.username || '';

  // ── Card lists ─────────────────────────────────────────────────────────────
  // Registered personas (active/inactive from UserPersona) — shown by default
  const registeredPersonas = ALL_PERSONAS.filter(p =>
    p.key !== 'ORGANIZATIONAL_PM' && (activeKeys.includes(p.key) || inactiveKeys.includes(p.key))
  );

  // Unregistered personas available to add — suppress ORGANIZATIONAL_PM if already active
  const unregisteredPersonas = ALL_PERSONAS.filter(p => {
    if (p.key === 'ORGANIZATIONAL_PM') return orgPmsAvailableToAdd;
    return !activeKeys.includes(p.key) && !inactiveKeys.includes(p.key);
  });

  // All visible personas in default view
  const visiblePersonas = showAll ? registeredPersonas : registeredPersonas;

  const allDisplayCards = [
    ...registeredPersonas,
    ...(showOrgPmsCard ? [ALL_PERSONAS.find(p => p.key === 'ORGANIZATIONAL_PM')] : []),
  ];

  const cardCount = allDisplayCards.length + (showAll ? 0 : 1);
  const cols      = Math.min(cardCount, 3);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.pageBg, backgroundImage:'radial-gradient(circle, #CBD5E1 1px, transparent 1px)', backgroundSize:'28px 28px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${C.border}`, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`@keyframes un-pagein { from { opacity:0; } to { opacity:1; } } @keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <div style={{ minHeight:'100vh', background:C.pageBg, backgroundImage:'radial-gradient(circle, #CBD5E1 1px, transparent 1px)', backgroundSize:'28px 28px', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ width:'75vw', maxHeight:'90vh', borderRadius:'20px', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)', display:'flex', animation:'un-pagein 0.35s ease both' }}>

          {/* LEFT */}
          <div style={{ position:'relative', width:'52%', minHeight:'100%', flexShrink:0, overflow:'hidden' }}>
            <img src={ESTATE_IMAGE} alt="Luxury estate" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,20,50,0.42) 0%, rgba(0,20,50,0.12) 40%, rgba(0,20,50,0.62) 100%)' }} />
            <div style={{ position:'absolute', top:52, left:52, fontFamily:F.body, fontWeight:700, fontSize:15, letterSpacing:'0.38em', color:'#fff', textTransform:'uppercase' }}>URBANNEST</div>
            <div style={{ position:'absolute', top:20, left:16, fontFamily:F.headline, fontSize:180, fontWeight:700, color:'rgba(255,255,255,0.07)', lineHeight:1, userSelect:'none', pointerEvents:'none' }}>R</div>
            <TestimonialCarousel />
          </div>

          {/* RIGHT */}
          <div style={{ flex:1, background:C.white, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'52px 60px 36px 56px', overflowY:'auto' }}>
            <div>
              <h1 style={{ fontFamily:F.headline, fontSize:'39px', fontWeight:700, color:C.primary, lineHeight:1.15, margin:'0 0 10px', whiteSpace:'nowrap' }}>Persona Selection</h1>
              <p style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary, margin:'0 0 36px', lineHeight:1.6, maxWidth:'260px' }}>Select a profile below to continue to your personalised dashboard and portal.</p>
              {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'8px 12px', marginBottom:'16px', fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{error}</div>}

              {/* ── Main cards grid ── */}
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:'14px' }}>
                {allDisplayCards.map(persona => {
                  const isOrgPms = persona.key === 'ORGANIZATIONAL_PM';
                  const badge    = isOrgPms && orgPmsStatus ? ORG_PMS_BADGE[orgPmsStatus] : null;
                  return (
                    <PersonaCard
                      key={persona.key}
                      persona={persona}
                      isActive={!isOrgPms && activeKeys.includes(persona.key)}
                      isInactive={!isOrgPms && inactiveKeys.includes(persona.key)}
                      orgPmsBadge={badge}
                      onClick={handlePersonaClick}
                    />
                  );
                })}
                {!showAll && <AddPersonaCard onClick={handleAddPersonaClick} />}
              </div>

              {/* ── "Add Persona" expanded list ── */}
              {showAll && unregisteredPersonas.length > 0 && (
                <>
                  <p style={{ margin:'24px 0 10px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Available to register</p>
                  <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(unregisteredPersonas.length,3)}, 1fr)`, gap:'14px' }}>
                    {unregisteredPersonas.map(persona => (
                      <PersonaCard key={persona.key} persona={persona} isActive={false} isInactive={false}
                        onClick={handleUnregisteredPersonaClick} />
                    ))}
                  </div>
                </>
              )}

              {showAll && (
                <div style={{ marginTop:'16px', textAlign:'center' }}>
                  <button onClick={() => setShowAll(false)} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textSecondary, display:'inline-flex', alignItems:'center', gap:'4px' }}>
                    <i className="ti ti-chevron-up" style={{ fontSize:'14px' }} aria-hidden="true" />
                    Show active only
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop:'32px', paddingTop:'20px', borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
              <p style={{ margin:0, fontFamily:F.body, fontSize:'8px', fontWeight:600, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Logged in as <span style={{ color:C.textSecondary }}>{displayEmail.toUpperCase()}</span>
              </p>
              <button onClick={handleSignOut}
                style={{ height:'36px', padding:'0 20px', background:C.primary, color:C.white, border:'none', borderRadius:'8px', fontFamily:F.body, fontSize:'12px', fontWeight:700, cursor:'pointer', letterSpacing:'0.04em', textTransform:'uppercase', transition:'background 0.15s ease', flexShrink:0 }}
                onMouseEnter={e => e.currentTarget.style.background = C.primaryHover}
                onMouseLeave={e => e.currentTarget.style.background = C.primary}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reactivate modal (INDEPENDENT_PM inactive — existing logic) ── */}
      {showReactivateModal && (
        <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:C.white, borderRadius:'14px', padding:'28px 32px', maxWidth:'400px', width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', animation:'un-pagein 0.2s ease both' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#FEF3C7', border:'1px solid #FCD34D', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
              <i className="ti ti-refresh" style={{ fontSize:'20px', color:'#F59E0B' }} />
            </div>
            <h2 style={{ margin:'0 0 8px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:'#0F172A' }}>Reactivate Profile?</h2>
            <p style={{ margin:'0 0 24px', fontFamily:F.body, fontSize:'13px', color:'#64748B', lineHeight:1.6 }}>Your Independent PM profile is currently inactive. Would you like to reactivate it? You'll need to review and resubmit your details.</p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleReactivateCancel} style={{ flex:1, height:'42px', background:C.white, border:'1.5px solid #CBD5E1', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, color:'#64748B', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleReactivateConfirm} style={{ flex:1, height:'42px', background:'#002D5B', border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, color:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}
                onMouseEnter={e => e.currentTarget.style.background='#003d7a'} onMouseLeave={e => e.currentTarget.style.background='#002D5B'}>
                <i className="ti ti-refresh" style={{ fontSize:'14px' }} />
                Yes, Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection modal (ORGANIZATIONAL_PM rejected — new) ── */}
      {showRejectionModal && (
        <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:C.white, borderRadius:'14px', padding:'28px 32px', maxWidth:'420px', width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', animation:'un-pagein 0.2s ease both' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#FEF2F2', border:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
              <i className="ti ti-alert-circle" style={{ fontSize:'20px', color:'#DC2626' }} />
            </div>
            <h2 style={{ margin:'0 0 8px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:'#0F172A' }}>Previous Application Rejected</h2>
            <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'13px', color:'#64748B', lineHeight:1.6 }}>
              Your previous Organizational PMS application was rejected. You can start a fresh new application — your previous submission will be kept on record.
            </p>
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'24px' }}>
              <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:'#991B1B', lineHeight:1.6 }}>
                A new account number will be assigned to your re-application. Your existing personas (Renter, etc.) will not be affected.
              </p>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setShowRejectionModal(false)} style={{ flex:1, height:'42px', background:C.white, border:'1.5px solid #CBD5E1', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, color:'#64748B', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleRejectionConfirm} style={{ flex:1, height:'42px', background:'#002D5B', border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, color:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}
                onMouseEnter={e => e.currentTarget.style.background='#003d7a'} onMouseLeave={e => e.currentTarget.style.background='#002D5B'}>
                <i className="ti ti-plus" style={{ fontSize:'14px' }} />
                Start New Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
