// ─────────────────────────────────────────────────────────────────────────
// LandlordCalendarPage.jsx — Landlord Portal's "Calendar" screen.
//
// Phase 5 (Neyora) Step 3. Mounts the real Neyora Calendar widget (see
// NeyoraCalendarWidget.jsx) inside the same shell every other Landlord
// portal page uses (NavF + topbar + content), so clicking "Calendar" in the
// left nav feels like navigating to any other UrbanNest screen — not like
// leaving the app. The Back button returns to whichever UrbanNest page the
// user came from (browser history), per the user's own requirement.
// ─────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavF from '../../components/layout/NavF';
import { C, F } from './landlordTokens';
import NeyoraCalendarWidget from '../../components/Neyora/NeyoraCalendarWidget';

const S = {
  shell:   { display: 'flex', height: '100vh', fontFamily: F.sans, background: C.pageBg, overflow: 'hidden' },
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:  { background: C.topbarBg, borderBottom: `1px solid ${C.topbarBdr}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  title:   { fontSize: 14, fontWeight: 600, color: C.txtPrimary, letterSpacing: 0.1 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: C.txtSec, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, fontFamily: F.sans },
  content: { flex: 1, overflowY: 'auto', padding: '20px 24px 32px' },
};

export default function LandlordCalendarPage() {
  const navigate = useNavigate();

  return (
    <div style={S.shell}>
      <NavF activePage="calendar" />
      <div style={S.main}>
        <div style={S.topbar}>
          <button
            style={S.backBtn}
            onClick={() => navigate(-1)}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" />
            Back
          </button>
          <span style={S.title}>Calendar</span>
          <span style={{ width: 60 }} /> {/* balances the Back button so the title stays centered */}
        </div>
        <div style={S.content}>
          <NeyoraCalendarWidget />
        </div>
      </div>
    </div>
  );
}
