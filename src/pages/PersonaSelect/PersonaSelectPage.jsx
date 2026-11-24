// ─────────────────────────────────────────────
// UrbanNest — Persona Select (route: /persona-select)
// Design System v2 (2026-11-24) — an open page (no card frame): our pageBg + the auth wave art, a top bar
// (brand · who's signed in · Sign out), a centred header and a deck of big PHOTO CARDS, one per role.
//
// Flow: select → preview → continue (nothing navigates on the first click):
//   · Click a card → it lifts with a light-blue ring + ✓, a light sweep crosses it, its details slide open
//     (what it is · what's inside) and the other photos calm down. The floating dock at the bottom springs up
//     with the role and a main button whose label follows it ("Continue to Landlord Portal", "Reactivate profile" …).
//   · Double-click a card, or Enter on the selected one, continues straight away.
//   · "Add a role" card (fanned photo stack) → the roles you can still set up are dealt in below as the same
//     photo cards (3D tilt → place, staggered) and the page glides down to them; pick one → "Set up …".
//   · Inactive profiles and a rejected PMS application still ask first (v2 Modal).
// The data loading (/auth/me, /admin/org-pms), switch-persona call and every navigation target are unchanged.
// ─────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ImageBackdrop, AUTH, introAt } from '../../components/layout';
import { Modal } from '../../components/ui';
import { C2, G2, SH2, TONES2, F2, FS2, FW2, LH2, LS2, R2, SP2, SZ2, ZI2, BLUR2, OP2, LAYOUT2, T2, UI2, pad } from '../../constants';
import brandLogo from '../../assets/brand/urban-nest-logo.png';
import backdropArt from '../../assets/landlord/wizard-backdrop.jpg';
// role photos — renter / landlord / PMS company from the user's set (Downloads/Tenant.png, Landlord.png, PMS.png,
// resized to 1400px); the others reuse the app's own hero art
import imgRenter from '../../assets/personas/renter.jpg';
import imgLandlord from '../../assets/personas/landlord.jpg';
import imgPmsCompany from '../../assets/personas/pms-company.jpg';
import imgTenant from '../../assets/landlord/signup-hero.jpg';
import imgIndependentPm from '../../assets/landlord/dashboard-hero.jpg';
import imgAgent from '../../assets/landlord/login-hero.jpg';
import imgAdmin from '../../assets/landlord/portfolio-hero-sunset.jpg';
import imgStaff from '../../assets/landlord/services/lease-management.jpg';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api').replace(/\/api\/?$/, '');

// ─── Persona catalogue ─────────────────────────────────────────────────────────
// key · route (set-up flow for a role you don't hold yet) · portal (where it opens) — unchanged.
// img / pos = card photo + its framing · portalName / blurb / features = what the card tells you.
const ALL_PERSONAS = [
  { key:'RENTER',            label:'Renter',            sub:'Main account',       icon:'ti-home',                img:imgRenter,        pos:'56% center', route:'/marketplace',                  portal:'/marketplace',
    portalName:'Marketplace',         blurb:'Browse verified homes, book tours and track your applications.',
    features:[['ti-search', 'Listings'], ['ti-calendar-event', 'Tours'], ['ti-file-text', 'Applications']] },
  { key:'TENANT',            label:'Tenant',            sub:'Active tenancy',     icon:'ti-key',                 img:imgTenant,        pos:'55% center', route:'/coming-soon',                  portal:'/coming-soon',
    portalName:'Tenant Portal',       blurb:'Your lease, rent payments and maintenance requests in one place.',
    features:[['ti-receipt', 'Rent'], ['ti-tool', 'Maintenance'], ['ti-file-certificate', 'Lease']], soon:true },
  { key:'LANDLORD',          label:'Landlord',          sub:'Property owner',     icon:'ti-building',            img:imgLandlord,      pos:'56% center', route:'/landlord-registration/step-1', portal:'/landlord-portal/dashboard',
    portalName:'Landlord Portal',     blurb:'Run your portfolio — listings, units, rent collection and residents.',
    features:[['ti-buildings', 'Portfolio'], ['ti-cash', 'Rent'], ['ti-users', 'Residents']] },
  { key:'INDEPENDENT_PM',    label:'Property Manager',  sub:'Independent PM',     icon:'ti-briefcase',           img:imgIndependentPm, pos:'60% center', route:'/pm-registration',              portal:'/pm-portal/dashboard/welcome',
    portalName:'PM Portal',           blurb:'Manage properties for your clients, from leasing to maintenance.',
    features:[['ti-building-community', 'Clients'], ['ti-clipboard-check', 'Work orders'], ['ti-chart-line', 'Reports']] },
  { key:'ORGANIZATIONAL_PM', label:'PMS Company',       sub:'Organisational PM',  icon:'ti-building-skyscraper', img:imgPmsCompany,    pos:'64% center', route:'/org-onboarding/step-1',        portal:'/org-onboarding/step-1',
    portalName:'Organisation Portal', blurb:'Your property-management company — teams, portfolios and billing.',
    features:[['ti-users-group', 'Team'], ['ti-buildings', 'Portfolios'], ['ti-credit-card', 'Billing']] },
  { key:'REAL_ESTATE_AGENT', label:'Real Estate Agent', sub:'Agent portal',       icon:'ti-id-badge',            img:imgAgent,         pos:'62% center', route:'/coming-soon',                  portal:'/coming-soon',
    portalName:'Agent Portal',        blurb:'List on behalf of owners and follow your leads to signed leases.',
    features:[['ti-home-plus', 'Listings'], ['ti-address-book', 'Leads'], ['ti-signature', 'Deals']], soon:true },
  { key:'UN_ADMIN',          label:'UN Admin',          sub:'Lead administrator', icon:'ti-shield-lock',         img:imgAdmin,         pos:'50% center', route:'/admin-portal/dashboard',       portal:'/admin-portal/dashboard',
    portalName:'Admin Portal',        blurb:'Platform administration — approvals, screening and configuration.',
    features:[['ti-checklist', 'Approvals'], ['ti-shield-check', 'Screening'], ['ti-settings', 'Settings']] },
  { key:'PM_STAFF',          label:'PM Staff',          sub:'Team member',        icon:'ti-user-cog',            img:imgStaff,         pos:'78% center', route:'/pm-portal/dashboard/welcome',  portal:'/pm-portal/dashboard/my-dashboard',
    portalName:'PM Workspace',        blurb:'Your assigned properties, tasks and team updates.',
    features:[['ti-list-check', 'Tasks'], ['ti-building', 'Properties'], ['ti-messages', 'Team']] },
];

// Org PMS application status → chip · main-button label
const ORG_PMS_STATE = {
  DRAFT:     { label:'Draft',     tone:TONES2.neutral, cta:'Resume application' },
  PENDING:   { label:'In review', tone:TONES2.purple,  cta:'View application status' },
  APPROVED:  { label:'Active',    tone:TONES2.primary, cta:'Continue to Organisation Portal' },
  SUSPENDED: { label:'Suspended', tone:TONES2.error,   cta:'View account status' },
};

// page-open timing (s) — header lines, then the cards are dealt in
const INTRO = { bar: 0.05, eyebrow: 0.15, title: 0.25, lead: 0.35, deck: 0.45 };
const CLOSE_MS = 340;   // "Add a role" deck plays its exit before it unmounts
const CARD = SZ2.personaCard;
const DECK_GAP = SP2.lg;
const CARD_LG = SZ2.personaCardLg;   // "Your workspaces" — a size up
const maxCols = (sz) => (sz === CARD_LG ? 4 : 5);   // what fits the page width at each size
// balanced rows: never a lone card on the last row — 6 → 3 + 3, 7 → 4 + 3, 8 → 4 + 4, ≤ 5 → one row.
// The deck gets exactly that many columns' width (centred), so the rows wrap evenly and line up.
const deckCols = (n, sz) => Math.ceil(n / Math.ceil(n / maxCols(sz)));
const deckWidth = (n, sz = CARD) => { const c = deckCols(Math.max(n, 1), sz); return c * sz.w + (c - 1) * DECK_GAP; };

const S = {
  // ── page ──
  page:     { position: 'relative', zIndex: 0, minHeight: '100vh', boxSizing: 'border-box', background: C2.pageBg, fontFamily: F2.body, color: C2.textPrimary, overflowX: 'hidden',
              paddingBottom: SZ2.footerBar + SP2.huge * 2 },   // room under the last row for the floating dock
  // the wave art again, turned 180° → waves bottom-left too (same as the sign-in frame)
  waveWrap: { position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' },
  waveLeft: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SZ2.imageBackdrop, opacity: OP2.backdrop, transform: 'rotate(180deg)',
    backgroundImage: `url(${backdropArt})`, backgroundSize: '100% auto', backgroundPosition: 'right top', backgroundRepeat: 'no-repeat',
    WebkitMaskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`, maskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`,
    WebkitMaskComposite: 'source-in', maskComposite: 'intersect',
  },
  inner:    { width: '100%', maxWidth: SZ2.authCard, margin: '0 auto', padding: pad(0, LAYOUT2.pageX), boxSizing: 'border-box' },

  // ── top bar ──
  bar:      { ...UI2.rowBetween(SP2.lg), padding: pad(SP2.xl, 0) },
  brand:    { ...UI2.row(SP2.sm) },
  logo:     { height: SZ2.icon.md, width: 'auto', aspectRatio: SZ2.brandLogoRatio, display: 'block' },
  brandName:{ ...T2.brandTitle, color: C2.navyDeep, lineHeight: LH2.tight, letterSpacing: LS2.snug },
  who:      { ...UI2.row(SP2.md), minWidth: 0 },
  avatar:   { ...UI2.avatar(SZ2.icon.md, TONES2.primary) },
  whoText:  { ...UI2.stack(0), minWidth: 0, textAlign: 'right' },
  whoName:  { ...UI2.text.title, ...UI2.truncate },
  whoMail:  { ...T2.caption, ...UI2.truncate },
  signOut:  { ...UI2.btn.soft, ...UI2.btnSm },

  // ── header ──
  head:     { ...UI2.stack(SP2.sm), alignItems: 'center', textAlign: 'center', padding: pad(SP2.md, 0, SP2.xxl) },
  eyebrow:  { ...UI2.pill(TONES2.primary) },
  h1:       { ...T2.pageHeroTitle, margin: 0 },
  lead:     { ...T2.pageHeroSub, margin: 0 },

  // ── decks ──
  deck:     (n, sz = CARD) => ({ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: DECK_GAP, width: '100%', maxWidth: deckWidth(n, sz), margin: '0 auto' }),
  addHead:  (n) => ({ ...UI2.row(SP2.md), maxWidth: deckWidth(n), margin: pad(SP2.xxxl, 'auto', SP2.lg) }),   // lines span exactly the deck below
  addRule:  { ...UI2.divider, flex: 1 },
  addTitle: { ...T2.sectionTitle, whiteSpace: 'nowrap' },
  addMeta:  { ...T2.label, whiteSpace: 'nowrap' },

  // ── photo card ──
  card:     (on, sz) => ({
    display: 'block', width: sz.w, height: sz.h, padding: 0, border: 'none', borderRadius: R2.xxl, overflow: 'hidden', cursor: 'pointer',
    textAlign: 'left', fontFamily: F2.body, color: C2.white, background: C2.navyHero,
    boxShadow: on ? SH2.personaSelected : SH2.card, '--un2-persona-hover': SH2.personaHover,
  }),
  photo:    (pos) => ({ ...UI2.photoMedia, objectPosition: pos }),
  scrim:    { position: 'absolute', inset: 0, background: G2.personaScrim, pointerEvents: 'none' },
  top:      { ...UI2.rowBetween(SP2.sm), position: 'absolute', top: SP2.md, left: SP2.md, right: SP2.md, zIndex: 2 },
  chip:     { ...UI2.chipOnDark, minHeight: 0, padding: pad(SP2.xxs, SP2.sm), fontSize: FS2.xxs, fontWeight: FW2.semibold, gap: SP2.xs },
  chipDot:  (tone) => ({ ...UI2.statusDot(tone), boxShadow: `0 0 0 2px ${C2.onDark.surfaceHover}` }),
  // selection mark: empty frosted ring → light-blue ✓ (UI2.checkBadge look, a size up for the photo)
  mark:     (on) => ({
    ...UI2.center, width: SZ2.icon.xs, height: SZ2.icon.xs, flexShrink: 0, boxSizing: 'border-box', borderRadius: R2.round,
    border: on ? 'none' : `2px solid ${C2.onDark.border}`, background: on ? G2.primaryButton : C2.onDark.surface,
    backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, color: C2.white, fontSize: FS2.xs, transition: 'background 0.2s ease',
  }),
  markIcon: { display: 'inline-block' },   // transform (pop) needs a box
  body:     { ...UI2.stack(SP2.xxs), position: 'absolute', left: SP2.md, right: SP2.md, bottom: SP2.md, zIndex: 2 },
  icon:     { ...UI2.iconBox(SZ2.icon.sm, { soft: C2.onDark.surfaceHover, strong: C2.white }), backdropFilter: BLUR2.sm, WebkitBackdropFilter: BLUR2.sm, marginBottom: SP2.xs },
  name:     { ...T2.sectionTitle, color: C2.white, ...UI2.truncate },
  sub:      { ...T2.caption, color: C2.onDark.textMuted, ...UI2.truncate },

  // ── "Add a role" card: white, fanned photo stack ──
  add:      (open, sz) => ({
    ...UI2.stack(SP2.sm), alignItems: 'center', justifyContent: 'center', width: sz.w, height: sz.h, padding: SP2.lg, boxSizing: 'border-box',
    border: 'none', borderRadius: R2.xxl, cursor: 'pointer', fontFamily: F2.body, textAlign: 'center',
    background: open ? C2.primaryWash : C2.white, boxShadow: SH2.card, '--un2-persona-hover': SH2.personaHover,
  }),
  fan:      (sz) => ({ position: 'relative', width: sz.fan * 2.5, height: sz.fan * 1.4, marginBottom: SP2.sm }),
  fanItem:  (i, n, sz) => ({
    position: 'absolute', left: '50%', top: 0, width: sz.fan, height: sz.fan * 1.3, marginLeft: -sz.fan / 2, borderRadius: R2.lg,
    overflow: 'hidden', boxShadow: SH2.lg, zIndex: i === Math.floor(n / 2) ? 2 : 1,
    '--r': `${(i - (n - 1) / 2) * 10}deg`, '--x': `${(i - (n - 1) / 2) * (sz.fan * 0.55)}px`,
  }),
  fanImg:   (pos) => ({ ...UI2.photoMedia, objectPosition: pos }),
  plus:     { ...UI2.iconBox(SZ2.icon.md, TONES2.primary, { round: true, solid: true }), boxShadow: SH2.primary },
  addName:  { ...T2.sectionTitle, marginTop: SP2.xxs },
  addSub:   { ...UI2.text.meta },

  // skeleton card while the profile loads
  skel:     { display: 'block', width: CARD_LG.w, height: CARD_LG.h, borderRadius: R2.xxl },

  // ── floating dock ──
  dock:     {
    position: 'fixed', left: '50%', bottom: SP2.xxl, zIndex: ZI2.sticky, width: `calc(100% - ${LAYOUT2.pageX * 2}px)`, maxWidth: CARD.dock, boxSizing: 'border-box',
    ...UI2.row(SP2.md), padding: pad(SP2.sm, SP2.sm, SP2.sm, SP2.md), borderRadius: R2.xxl,
    background: C2.backgroundGlass, backdropFilter: BLUR2.bar, WebkitBackdropFilter: BLUR2.bar, boxShadow: SH2.lg,
  },
  dockThumb:{ position: 'relative', width: CARD.barThumb, height: CARD.barThumb, flexShrink: 0, borderRadius: R2.md, overflow: 'hidden', boxShadow: SH2.md },
  dockText: { ...UI2.stack(SP2.xxs), flex: 1, minWidth: 0 },
  dockName: { ...UI2.text.titleLg, ...UI2.truncate },
  dockMeta: { ...UI2.row(SP2.xs), ...T2.caption, ...UI2.truncate },
  cta:      { ...UI2.btn.brand, padding: pad(0, SP2.lg), flexShrink: 0 },

  // modals
  mIcon:    (tone) => ({ ...UI2.iconBox(SZ2.icon.lg, tone), marginBottom: SP2.md }),
  mText:    { ...T2.body, margin: 0 },
  mNote:    { ...UI2.tonePanel(TONES2.error), ...T2.label, color: C2.errorDark, padding: pad(SP2.md, SP2.lg), marginTop: SP2.md },
};

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

const initialsOf = (user, email) => {
  const n = [user?.first_name, user?.last_name].filter(Boolean).map(s => s[0]).join('');
  return (n || email.slice(0, 1) || 'U').toUpperCase();
};

// ─── One photo card ───────────────────────────────────────────────────────────
function PersonaCard({ p, info, on, index, base, out, disabled, onSelect, onOpen, size = CARD }) {
  return (
    <div className={`un2-deal${out ? ' is-out' : ''}`} style={{ '--un2-i': index, '--un2-deal-base': `${base}s` }}>
      <button
        type="button" role="radio" aria-checked={on} aria-label={`${p.label} — ${info.status}`} disabled={disabled}
        className={`un2-persona${on ? ' is-selected' : ''}`} style={S.card(on, size)}
        onClick={onSelect} onDoubleClick={onOpen}
        onKeyDown={e => { if (e.key === 'Enter' && on) { e.preventDefault(); onOpen(); } }}
      >
        <img src={p.img} alt="" className="un2-persona-photo" style={S.photo(p.pos)} />
        <span style={S.scrim} aria-hidden="true" />
        <span style={S.top}>
          <span style={S.chip}>
            {info.isNew ? <i className="ti ti-sparkles" aria-hidden="true" /> : <span style={S.chipDot(info.tone)} />}
            {info.status}
          </span>
          <span style={S.mark(on)} aria-hidden="true">{on && <i className="ti ti-check un2-pop" style={S.markIcon} />}</span>
        </span>
        <span style={S.body}>
          <span style={S.icon}><i className={`ti ${p.icon}`} aria-hidden="true" /></span>
          <span style={S.name}>{p.label}</span>
          <span style={S.sub}>{p.sub}</span>
        </span>
      </button>
    </div>
  );
}

export default function PersonaSelectPage() {
  const navigate = useNavigate();

  const { refreshAuth } = useAuth();

  const activatePersona = async (personaKey) => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/api/auth/switch-persona/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ persona: personaKey }),
      });
      await refreshAuth(); // reload permissions with new active_persona
    } catch {
      // Non-blocking — navigate anyway
    }
  };

  const [user,                 setUser]                 = useState(null);
  const [activeKeys,           setActiveKeys]           = useState([]);
  const [inactiveKeys,         setInactiveKeys]         = useState([]);
  const [loading,              setLoading]              = useState(true);
  const [showAll,              setShowAll]              = useState(false);   // "Add a role" deck open
  const [error,                setError]                = useState('');

  // ── Org PMS specific state ─────────────────────────────────────────────────
  // null = still loading, false = no record exists, object = latest OrgPMS record
  const [orgPmsRecord,         setOrgPmsRecord]         = useState(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showReactivateModal,  setShowReactivateModal]  = useState(false);
  const [pendingReactivateKey, setPendingReactivateKey] = useState(null);
  const [showRejectionModal,   setShowRejectionModal]   = useState(false);

  // ── Selection (select → preview → continue) ───────────────────────────────
  const [selected, setSelected] = useState(null);   // { group: 'mine' | 'add', key }
  const [closing,  setClosing]  = useState(false);  // "Add a role" deck playing its exit
  const [busy,     setBusy]     = useState(false);
  const mounted = useRef(true);
  const addRef = useRef(null);
  useEffect(() => () => { mounted.current = false; }, []);

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

  const handlePersonaClick = async (persona) => {
    if (persona.key === 'ORGANIZATIONAL_PM') {
      switch (orgPmsStatus) {
        case 'DRAFT':
          if (orgPmsRecord?.id) localStorage.setItem('org_pms_id', orgPmsRecord.id);
          navigate('/org-onboarding/step-1');
          break;
        case 'PENDING':
          navigate('/org-onboarding/pending');
          break;
        case 'APPROVED':
          await activatePersona('ORGANIZATIONAL_PM');
          navigate('/org-portal/dashboard/welcome');
          break;
        case 'SUSPENDED':
          navigate('/coming-soon');
          break;
        default:
          break;
      }
      return;
    }

    // ── All other personas ────────────────────────────────────
    if (activeKeys.includes(persona.key)) {
      switch (persona.key) {
        case 'INDEPENDENT_PM':
          await activatePersona('INDEPENDENT_PM');
          navigate('/pm-portal/dashboard/welcome');
          break;
        case 'PM_STAFF':
          await activatePersona('PM_STAFF');
          navigate('/pm-portal/dashboard/my-dashboard');
          break;
        case 'UN_ADMIN':
          await activatePersona('UN_ADMIN');
          navigate('/admin-portal/dashboard');
          break;
        case 'LANDLORD':
          navigate('/landlord-portal/dashboard');
          break;
        case 'TENANT':
          navigate('/coming-soon');
          break;
        case 'RENTER':
          // Session 51, Phase 3 — closes the loop the Marketplace
          // architecture doc flagged (no authenticated homepage variant to
          // land a Renter login on): the Marketplace homepage itself is
          // that variant now, so Renter goes there instead of the
          // /coming-soon placeholder every other not-yet-built persona
          // still uses.
          navigate('/marketplace');
          break;
        default:
          navigate('/coming-soon');
      }
    } else if (inactiveKeys.includes(persona.key)) {
      setPendingReactivateKey(persona.key);
      setShowReactivateModal(true);
    } else {
      navigate(persona.route);
    }
  };

  // ── When user picks a persona from the "Add a role" deck ──────────────────
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
    if (pendingReactivateKey === 'LANDLORD') navigate('/landlord-registration/step-1');
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
  const firstName    = user?.first_name || '';
  const fullName     = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

  // ── Lists ──────────────────────────────────────────────────────────────────
  // Registered personas (active/inactive from UserPersona) + the Org PMS application when it has one
  const registeredPersonas = ALL_PERSONAS.filter(p =>
    p.key !== 'ORGANIZATIONAL_PM' && (activeKeys.includes(p.key) || inactiveKeys.includes(p.key))
  );
  const myPersonas = [
    ...registeredPersonas,
    ...(showOrgPmsCard ? [ALL_PERSONAS.find(p => p.key === 'ORGANIZATIONAL_PM')] : []),
  ];
  // Unregistered personas available to add — suppress ORGANIZATIONAL_PM if already active
  const unregisteredPersonas = ALL_PERSONAS.filter(p => {
    if (p.key === 'ORGANIZATIONAL_PM') return orgPmsAvailableToAdd;
    return !activeKeys.includes(p.key) && !inactiveKeys.includes(p.key);
  });

  // ── Status chip / dock wording for one persona ────────────────────────────
  const describe = (group, p) => {
    if (group === 'add') {
      const rejected = p.key === 'ORGANIZATIONAL_PM' && orgPmsStatus === 'REJECTED';
      return {
        isNew: true, status: rejected ? 'Re-apply' : 'New role', tone: TONES2.primary,
        cta: rejected ? 'Start new application' : `Set up ${p.label}`, icon: rejected ? 'ti-plus' : 'ti-arrow-right',
        dest: rejected ? 'Your previous application was rejected — you can apply again' : p.soon ? `The ${p.portalName} is coming soon` : `Starts the ${p.label} set-up`,
      };
    }
    if (p.key === 'ORGANIZATIONAL_PM') {
      const st = ORG_PMS_STATE[orgPmsStatus] || ORG_PMS_STATE.DRAFT;
      return { status: st.label, tone: st.tone, cta: st.cta, icon: 'ti-arrow-right', dest: `${p.sub} · ${st.label}` };
    }
    if (inactiveKeys.includes(p.key) && !activeKeys.includes(p.key)) {
      return { status: 'Inactive', tone: TONES2.neutral, cta: 'Reactivate profile', icon: 'ti-refresh', dest: "Paused — you'll review and resubmit your details" };
    }
    return {
      status: 'Active', tone: TONES2.primary, cta: `Continue to ${p.portalName}`, icon: 'ti-arrow-right',
      dest: p.soon ? `The ${p.portalName} is coming soon` : `Opens ${p.portalName}`,
    };
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const isSel = (group, key) => selected?.group === group && selected?.key === key;
  const select = (group, key) => setSelected({ group, key });

  // first load: preselect the active persona from the profile, else the first workspace
  useEffect(() => {
    if (loading || selected || !myPersonas.length) return;
    const current = myPersonas.find(p => p.key === user?.active_persona) || myPersonas[0];
    select('mine', current.key);
  }, [loading]);   // eslint-disable-line react-hooks/exhaustive-deps

  const selPersona = selected && (selected.group === 'mine' ? myPersonas : unregisteredPersonas).find(p => p.key === selected.key);
  const selInfo = selPersona ? describe(selected.group, selPersona) : null;

  const proceed = async (group = selected?.group, persona = selPersona) => {
    if (!persona || busy) return;
    setSelected({ group, key: persona.key });
    setBusy(true);
    try {
      if (group === 'add') handleUnregisteredPersonaClick(persona);
      else await handlePersonaClick(persona);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  // ── "Add a role" deck: deal in + glide down to it · play the exit, then unmount ──
  const openAdd = () => {
    setClosing(false);
    setShowAll(true);
    setTimeout(() => addRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };
  const closeAdd = () => {
    if (selected?.group === 'add' && myPersonas.length) select('mine', myPersonas[0].key);   // never keep a hidden choice
    setClosing(true);
    setTimeout(() => { if (mounted.current) { setShowAll(false); setClosing(false); } }, CLOSE_MS);
  };
  const addOpen = showAll && !closing;

  const fanPersonas = unregisteredPersonas.slice(0, 3);
  const dockShown = !loading && !!selInfo;
  // dock line: what the role is — or, when it matters more, its state (paused, coming soon, re-apply …)
  const dockNote = selInfo && (/^(Opens|Starts) /.test(selInfo.dest) ? selPersona.blurb : selInfo.dest);

  return (
    <div style={S.page}>
      {/* backdrop: wave art top-right + bottom-left */}
      <div className="un2-intro-fade" style={introAt(0)}>
        <ImageBackdrop image={backdropArt} />
        <div style={S.waveWrap} aria-hidden="true"><div style={S.waveLeft} /></div>
      </div>

      <div style={S.inner}>
        {/* ── Top bar: brand · who's signed in · Sign out ── */}
        <header className="un2-intro-up" style={{ ...S.bar, ...introAt(INTRO.bar) }}>
          <div style={S.brand}>
            <img src={brandLogo} alt="" style={S.logo} />
            <span style={S.brandName}>UrbanNest</span>
          </div>
          <div style={S.who}>
            <div style={S.whoText} className="un2-hide-md">
              <span style={S.whoName}>{loading ? ' ' : (fullName || displayEmail)}</span>
              {fullName && <span style={S.whoMail}>{displayEmail}</span>}
            </div>
            {loading
              ? <span className="un2-skel" style={{ ...UI2.skeleton(SZ2.icon.md, SZ2.icon.md), borderRadius: R2.round }} />
              : <span style={S.avatar} aria-hidden="true">{initialsOf(user, displayEmail)}</span>}
            <button type="button" className="un2-btn" style={S.signOut} onClick={handleSignOut}>
              <i className="ti ti-logout" style={UI2.btnIcon} aria-hidden="true" /> Sign out
            </button>
          </div>
        </header>

        {/* ── Header ── */}
        <div style={S.head}>
          <span className="un2-intro-up" style={{ ...S.eyebrow, ...introAt(INTRO.eyebrow) }}>
            <i className="ti ti-sparkles" aria-hidden="true" /> Welcome back{firstName ? `, ${firstName}` : ''}
          </span>
          <h1 className="un2-intro-up" style={{ ...S.h1, ...introAt(INTRO.title) }}>Choose your workspace</h1>
          <p className="un2-intro-up" style={{ ...S.lead, ...introAt(INTRO.lead) }}>Pick the role you want to work in today — you can switch any time.</p>
          {error && (
            <div style={{ ...UI2.errorBanner, marginTop: SP2.md }} role="alert">
              <i className="ti ti-alert-circle" aria-hidden="true" /> {error}
            </div>
          )}
        </div>

        {/* ── Your workspaces ── */}
        {loading ? (
          <div style={S.deck(3, CARD_LG)} aria-busy="true">
            {[0, 1, 2].map(i => <span key={i} className="un2-skel" style={S.skel} />)}
          </div>
        ) : (
          <div role="radiogroup" aria-label="Your workspaces" className="un2-persona-deck" style={S.deck(myPersonas.length + (unregisteredPersonas.length ? 1 : 0), CARD_LG)}>
            {myPersonas.map((p, i) => (
              <PersonaCard
                key={p.key} p={p} info={describe('mine', p)} on={isSel('mine', p.key)} index={i} base={INTRO.deck} disabled={busy} size={CARD_LG}
                onSelect={() => select('mine', p.key)} onOpen={() => proceed('mine', p)}
              />
            ))}

            {unregisteredPersonas.length > 0 && (
              <div className="un2-deal" style={{ '--un2-i': myPersonas.length, '--un2-deal-base': `${INTRO.deck}s` }}>
                <button
                  type="button" className={`un2-persona un2-add${addOpen ? ' is-open' : ''}`} style={S.add(addOpen, CARD_LG)}
                  onClick={addOpen ? closeAdd : openAdd} aria-expanded={addOpen} aria-controls="persona-add-deck" disabled={busy}
                >
                  <span className="un2-fan" style={S.fan(CARD_LG)} aria-hidden="true">
                    {fanPersonas.map((p, i) => (
                      <span key={p.key} style={S.fanItem(i, fanPersonas.length, CARD_LG)}><img src={p.img} alt="" style={S.fanImg(p.pos)} /></span>
                    ))}
                  </span>
                  <span style={S.plus}><i className="ti ti-plus un2-add-plus" aria-hidden="true" /></span>
                  <span style={S.addName}>{addOpen ? 'Hide roles' : 'Add a role'}</span>
                  <span style={S.addSub}>{unregisteredPersonas.length} {unregisteredPersonas.length === 1 ? 'role' : 'roles'} you can set up</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Roles you can add — dealt in below ── */}
        {showAll && (
          <section id="persona-add-deck" ref={addRef} aria-label="Roles you can add">
            <div className={`un2-deal${closing ? ' is-out' : ''}`} style={S.addHead(unregisteredPersonas.length)}>
              <span style={S.addRule} />
              <span style={S.addTitle}>Roles you can add</span>
              <span style={S.addMeta}>Pick one to see what's included</span>
              <span style={S.addRule} />
            </div>
            <div role="radiogroup" aria-label="Roles you can add" className="un2-persona-deck" style={S.deck(unregisteredPersonas.length)}>
              {unregisteredPersonas.map((p, i) => (
                <PersonaCard
                  key={p.key} p={p} info={describe('add', p)} on={isSel('add', p.key)} index={i + 1} base={0.05} out={closing} disabled={busy}
                  onSelect={() => select('add', p.key)} onOpen={() => proceed('add', p)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Floating dock: the selected role + its main action ── */}
      <div className={`un2-dock${dockShown ? ' is-shown' : ''}`} style={{ ...S.dock, pointerEvents: dockShown ? 'auto' : 'none' }} aria-live="polite">
        {selPersona && selInfo && (
          <>
            <span key={`t-${selected.group}-${selected.key}`} className="un2-swap" style={S.dockThumb}>
              <img src={selPersona.img} alt="" style={S.fanImg(selPersona.pos)} />
            </span>
            <span key={`x-${selected.group}-${selected.key}`} className="un2-swap" style={S.dockText}>
              <span style={S.dockName}>{selPersona.label}</span>
              <span style={S.dockMeta} title={dockNote}>{dockNote}</span>
            </span>
            <button type="button" className="un2-btn" style={{ ...S.cta, ...(busy ? AUTH.busy : {}) }} onClick={() => proceed()} disabled={busy}>
              {busy
                ? <><i className="ti ti-loader-2 un2-spin" style={UI2.btnIcon} aria-hidden="true" /> Opening…</>
                : <span key={`c-${selected.group}-${selected.key}`} className="un2-swap" style={UI2.row(SP2.sm)}>{selInfo.cta} <i className={`ti ${selInfo.icon}`} style={UI2.btnIcon} aria-hidden="true" /></span>}
            </button>
          </>
        )}
      </div>

      {/* ── Reactivate modal (inactive Landlord / Independent PM — existing logic) ── */}
      {showReactivateModal && (
        <Modal
          title="Reactivate profile?"
          onClose={handleReactivateCancel}
          footer={<>
            <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={handleReactivateCancel}>Cancel</button>
            <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={handleReactivateConfirm}>
              <i className="ti ti-refresh" style={UI2.btnIcon} aria-hidden="true" /> Yes, reactivate
            </button>
          </>}
        >
          <span style={S.mIcon(TONES2.primary)}><i className="ti ti-refresh" aria-hidden="true" /></span>
          <p style={S.mText}>
            Your {pendingReactivateKey === 'LANDLORD' ? 'Landlord' : 'Independent PM'} profile is currently inactive.
            Would you like to reactivate it? You'll need to review and resubmit your details.
          </p>
        </Modal>
      )}

      {/* ── Rejection modal (Organisational PMS application rejected) ── */}
      {showRejectionModal && (
        <Modal
          title="Previous application rejected"
          onClose={() => setShowRejectionModal(false)}
          footer={<>
            <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={() => setShowRejectionModal(false)}>Cancel</button>
            <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={handleRejectionConfirm}>
              <i className="ti ti-plus" style={UI2.btnIcon} aria-hidden="true" /> Start new application
            </button>
          </>}
        >
          <span style={S.mIcon(TONES2.error)}><i className="ti ti-alert-circle" aria-hidden="true" /></span>
          <p style={S.mText}>
            Your previous Organizational PMS application was rejected. You can start a fresh new application — your previous submission will be kept on record.
          </p>
          <div style={S.mNote}>
            A new account number will be assigned to your re-application. Your existing personas (Renter, etc.) will not be affected.
          </div>
        </Modal>
      )}
    </div>
  );
}

