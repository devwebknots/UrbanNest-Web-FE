/**
 * PartnerList.jsx — UN Admin → Partners → Tenant Screening → "Partners" tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Card-grid list, per the approved wireframe
 * (https://claude.ai/artifact/M7ZMt4KgSZBXBCxKCTApeJ) — a card grid rather
 * than a plain data table, confirmed with the user before this build.
 *
 * All state is in-memory (useState seeded from mockPartnerData.js) — there
 * is no backend model yet (see mockPartnerData.js's own header). Search and
 * the four filters (Market / Criterion / Status / Integration Type) run
 * client-side against this same in-memory list; Add/Edit writes back into
 * it via setPartners, nothing is persisted beyond this page's lifetime.
 * "Reconnect" is a DeadEndButton — reconnecting a credential genuinely
 * needs a real backend endpoint that doesn't exist yet, so it stays visibly
 * disabled with a tooltip rather than faking a success state (ARCH_028).
 */
import React, { useMemo, useState } from 'react';
import {
  C, F, Pill, SampleTag, DeadEndButton, btnPrimary,
} from './partnerManagementTokens';
import {
  CRITERIA_OPTIONS, MARKET_OPTIONS, INTEGRATION_TYPES, INITIAL_PARTNERS, criterionLabel,
} from './mockPartnerData';
import PartnerFormModal from './PartnerFormModal';

const inputSm = {
  padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
  fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, background: C.white,
};

// Compact button pair for the card's top action row — View + Configure +
// Reconnect now share one line (Session 71), so each button is resized
// down from the original single wide "Configure" button to fit three in a
// ~300px-wide card.
const btnCompactBase = {
  height: 30, padding: '0 6px', borderRadius: 7,
  fontFamily: F.body, fontSize: 10.8, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 4, flex: 1, whiteSpace: 'nowrap',
  border: 'none',
};
const btnPrimaryCompact = { ...btnCompactBase, background: C.primary, color: C.white };
const btnOutlineCompact = { ...btnCompactBase, background: C.white, border: `1.5px solid ${C.borderMedium}`, color: C.textPrimary };

function iconFor(partner) {
  if (partner.criteria.includes('credit_check')) return 'ti-building-bank';
  if (partner.criteria.includes('criminal_background')) return 'ti-shield-check';
  if (partner.criteria.includes('rental_history')) return 'ti-clipboard-list';
  return 'ti-briefcase';
}

export default function PartnerList() {
  const [partners, setPartners] = useState(INITIAL_PARTNERS);
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState('All Markets');
  const [criterionFilter, setCriterionFilter] = useState('All Criteria');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [integrationFilter, setIntegrationFilter] = useState('All Integration Types');
  // Single modal-state object replaces the old separate editing/adding
  // state (Session 71) now that the same modal also opens in a third,
  // read-only "view" mode: null = closed, else { partner, mode }.
  const [modalState, setModalState] = useState(null);

  const filtered = useMemo(() => {
    return partners.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.key.toLowerCase().includes(search.toLowerCase())) return false;
      if (marketFilter !== 'All Markets' && !p.markets.includes(marketFilter)) return false;
      if (criterionFilter !== 'All Criteria') {
        const match = CRITERIA_OPTIONS.find(c => c.label === criterionFilter);
        if (match && !p.criteria.includes(match.value)) return false;
      }
      if (statusFilter !== 'All Statuses' && p.status !== statusFilter) return false;
      if (integrationFilter !== 'All Integration Types' && p.integrationType !== integrationFilter) return false;
      return true;
    });
  }, [partners, search, marketFilter, criterionFilter, statusFilter, integrationFilter]);

  const activeCount = partners.filter(p => p.status === 'Active').length;

  const handleSave = (partner) => {
    setPartners(prev => {
      const exists = prev.some(p => p.id === partner.id);
      return exists ? prev.map(p => (p.id === partner.id ? partner : p)) : [...prev, partner];
    });
    setModalState(null);
  };

  const toggleStatus = (id) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p));
  };

  return (
    <div>
      {/* header row: title + stat chips */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontFamily: F.headline, fontSize: 26, color: C.primary, margin: 0 }}>Tenant Screening Partners</h1>
          <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.textSecondary, margin: '6px 0 0', maxWidth: 560 }}>
            Manage third-party screening providers and control which ones are available to Property Managers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <i className="ti ti-circle-check" style={{ color: C.green, fontSize: 18 }} />
            <div>
              <div style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{activeCount} of {partners.length}</div>
              <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.textTertiary }}>Active Partners</div>
            </div>
          </div>
          <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, background: C.primary, borderRadius: 12, color: '#fff' }}>
            <i className="ti ti-shield" style={{ fontSize: 18 }} />
            <div>
              <div style={{ fontFamily: F.headline, fontSize: 16, fontWeight: 700 }}>98.5%</div>
              <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#C7D6EC' }}>Provider Uptime</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ margin: '14px 0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SampleTag />
        <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary }}>These partners are illustrative; none are wired to a real screening provider yet.</span>
      </div>

      {/* filter bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap', marginBottom: 18 }}>
        <input
          placeholder="Search partners..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputSm, flex: '1 1 200px' }}
        />
        <select style={{ ...inputSm, flex: '0 0 150px' }} value={marketFilter} onChange={e => setMarketFilter(e.target.value)}>
          <option>All Markets</option>
          {MARKET_OPTIONS.map(m => <option key={m}>{m}</option>)}
        </select>
        <select style={{ ...inputSm, flex: '0 0 190px' }} value={criterionFilter} onChange={e => setCriterionFilter(e.target.value)}>
          <option>All Criteria</option>
          {CRITERIA_OPTIONS.map(c => <option key={c.value}>{c.label}</option>)}
        </select>
        <select style={{ ...inputSm, flex: '0 0 140px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <select style={{ ...inputSm, flex: '0 0 170px' }} value={integrationFilter} onChange={e => setIntegrationFilter(e.target.value)}>
          <option>All Integration Types</option>
          {INTEGRATION_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button style={{ ...btnPrimary, flex: '0 0 auto' }} onClick={() => setModalState({ partner: null, mode: 'add' })}>
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Add Partner
        </button>
      </div>

      {/* card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(p => {
          const connected = p.status === 'Active';
          return (
            <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${iconFor(p)}`} style={{ fontSize: 17, color: C.blue }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.textTertiary }}>
                      {p.criteria.map(criterionLabel).join(' · ') || 'No criteria yet'}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 15.5, fontWeight: 800, color: C.textPrimary, marginTop: 2 }}>{p.name}</div>
                  </div>
                </div>
                <Pill bg={connected ? C.greenBg : C.neutral} color={connected ? C.green : C.textTertiary}>
                  {connected ? '● Connected' : '○ Not Connected'}
                </Pill>
              </div>

              <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, margin: '0 0 12px', minHeight: 32 }}>{p.description}</p>

              <div style={{
                background: p.environment === 'Sandbox' ? C.amberBg : C.pageBg,
                border: `1px solid ${p.environment === 'Sandbox' ? C.amberBorder : C.border}`,
                borderRadius: 10, padding: '12px 14px', marginBottom: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: p.environment === 'Sandbox' ? C.amberText : C.textSecondary }}>Environment</span>
                  <b style={{ color: p.environment === 'Sandbox' ? C.amberText : C.textPrimary }}>{p.environment}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: p.environment === 'Sandbox' ? C.amberText : C.textSecondary }}>Config Health</span>
                  <b style={{ color: p.environment === 'Sandbox' ? C.amberText : C.textPrimary }}>{p.configHealth}</b>
                </div>
              </div>

              {connected ? (
                <>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={btnOutlineCompact} onClick={() => setModalState({ partner: p, mode: 'view' })}>
                      <i className="ti ti-eye" style={{ fontSize: 12 }} /> View
                    </button>
                    <button style={btnPrimaryCompact} onClick={() => setModalState({ partner: p, mode: 'edit' })}>
                      <i className="ti ti-settings" style={{ fontSize: 12 }} /> Configure
                    </button>
                    <DeadEndButton
                      label="Reconnect" icon="ti-refresh" small
                      tooltip="Reconnecting requires a live backend credential endpoint, which doesn't exist yet."
                      style={{ flex: 1, height: 30, padding: '0 6px', fontSize: 10.8, justifyContent: 'center' }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 10 }}>
                    <button onClick={() => toggleStatus(p.id)} style={{ background: 'none', border: 'none', color: C.danger, fontFamily: F.body, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <i className="ti ti-ban" style={{ fontSize: 13 }} /> Disable
                    </button>
                  </div>
                </>
              ) : (
                <button style={{ ...btnPrimary, width: '100%', justifyContent: 'center', height: 36 }} onClick={() => toggleStatus(p.id)}>
                  Enable Partner
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.textTertiary, fontFamily: F.body, fontSize: 13 }}>
          No partners match these filters.
        </div>
      )}

      <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginTop: 20, maxWidth: 800, lineHeight: 1.6 }}>
        Partner credentials are configured and stored through the secure backend — never shown or editable here. Only partners marked <b>Connected</b> and eligible for a given criterion/market appear in a PM's own Provider Selection step — see the Capability Matrix tab.
      </p>

      {modalState && (
        <PartnerFormModal
          partner={modalState.partner}
          mode={modalState.mode}
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
