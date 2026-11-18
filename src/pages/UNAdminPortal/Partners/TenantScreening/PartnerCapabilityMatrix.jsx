/**
 * PartnerCapabilityMatrix.jsx — UN Admin → Partners → Tenant Screening →
 * "Capability Matrix" tab.
 * ─────────────────────────────────────────────────────────────────────────────
 * Read-only-by-default Partner × Criterion grid (spec §4.4), per the
 * approved wireframe (https://claude.ai/artifact/M7ZMt4KgSZBXBCxKCTApeJ).
 * "Manual Verification" is not a partner record; it's the always-available
 * fallback every criterion permits unless UN Admin disables it in Criteria
 * Rules Management (not yet built).
 *
 * Session 71 revision: added an Actions column (eye = View in protected
 * mode, pencil = Edit) and restyled the page to match the "Billing History
 * & Invoices" screenshot the user supplied as a typography reference —
 * serif bold title, grey subtitle, a dashed divider under the header
 * block, uppercase letter-spaced grey table headers, plain-weight row
 * text, and a small caption-style footer line.
 *
 * This tab still keeps its OWN copy of partner state (seeded from
 * INITIAL_PARTNERS, same as before) rather than sharing PartnerList.jsx's
 * live state — the two tabs remain independent, unmounted components in
 * UNAdminPartnerManagement.jsx (same pattern as Listings/Market Display in
 * UNAdminRuleEngine.jsx). The difference now is that THIS tab also needs
 * its own mutable copy so the new pencil-icon Edit action has somewhere to
 * write a save back to. An edit made here will not appear on the Partners
 * tab's own list (and vice versa) until a real backend model exists and
 * both tabs read the same query — a known, intentional Sample-Data-era
 * limit, not a bug.
 */
import React, { useState } from 'react';
import { C, F, SampleTag } from './partnerManagementTokens';
import { CRITERIA_OPTIONS, INITIAL_PARTNERS } from './mockPartnerData';
import PartnerFormModal from './PartnerFormModal';

const Check = () => <i className="ti ti-check" style={{ color: C.green, fontSize: 15 }} />;
const Dash = () => <span style={{ color: C.textTertiary }}>—</span>;

const thStyle = {
  textAlign: 'left', padding: '12px 16px', fontFamily: F.body, fontSize: 10.5,
  fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: C.textTertiary, borderBottom: `1px solid ${C.border}`,
};
const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
  display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
};

export default function PartnerCapabilityMatrix() {
  const [partners, setPartners] = useState(INITIAL_PARTNERS);
  const [modalState, setModalState] = useState(null); // null | { partner, mode }

  const rows = [
    ...partners.map(p => ({ name: p.name, criteria: p.criteria, muted: false, partner: p })),
    { name: 'Manual Verification', criteria: CRITERIA_OPTIONS.map(c => c.value), muted: true, partner: null },
  ];

  const handleSave = (partner) => {
    setPartners(prev => prev.map(p => (p.id === partner.id ? partner : p)));
    setModalState(null);
  };

  return (
    <div>
      {/* ── Header — serif bold title + grey subtitle, matching the Billing History & Invoices reference ── */}
      <h1 style={{ fontFamily: F.headline, fontSize: 23, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
        Provider Capability Mapping
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '6px 0 0', maxWidth: 620 }}>
        Which criteria each partner is eligible to screen. Only a "Yes" cell makes a partner selectable in a PM's Provider Selection step for that criterion and market.
      </p>
      <div style={{ margin: '12px 0 0' }}><SampleTag /></div>

      {/* ── Dashed divider under the header block, as in the reference ── */}
      <div style={{ borderBottom: `1.5px dashed ${C.borderMedium}`, margin: '16px 0 20px' }} />

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Partner</th>
              {CRITERIA_OPTIONS.map(c => (
                <th key={c.value} style={{ ...thStyle, textAlign: 'center' }}>{c.label}</th>
              ))}
              <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.name} style={{ borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${C.border}` }}>
                <td style={{ padding: '12px 16px', fontFamily: F.body, fontSize: 13, fontWeight: 400, color: row.muted ? C.textSecondary : C.textPrimary }}>
                  {row.name}
                </td>
                {CRITERIA_OPTIONS.map(c => (
                  <td key={c.value} style={{ textAlign: 'center', padding: '12px 10px' }}>
                    {row.criteria.includes(c.value) ? <Check /> : <Dash />}
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                  {row.partner ? (
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button
                        onClick={() => setModalState({ partner: row.partner, mode: 'view' })}
                        style={iconBtnStyle}
                        title="View (protected)"
                      >
                        <i className="ti ti-eye" style={{ fontSize: 15 }} />
                      </button>
                      <button
                        onClick={() => setModalState({ partner: row.partner, mode: 'edit' })}
                        style={iconBtnStyle}
                        title="Edit"
                      >
                        <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                      </button>
                    </div>
                  ) : (
                    <Dash />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer caption, matching the reference's "Showing X of Y..." style ── */}
      <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginTop: 16, letterSpacing: '0.01em' }}>
        Showing {partners.length} of {partners.length} partners · Manual Verification is always available as a fallback.
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
