// src/pages/PMPortal/Profile/PMSubscriptionPage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// PM Portal (Independent PM) — Subscription & Trial
// Route:   /pm-portal/profile/subscription
// Nav:     Nav B — My Profile → Subscription & Trial (this slot already
//          existed in NAV_STRUCTURE, pointing here — this file is the page
//          that was missing behind it).
//
// Phase 3 (Session 49) — the Independent PM parity half of the Subscription
// & Billing / My Services build. Mirrors src/pages/Landlord/
// LandlordSettingsPage.jsx's "Subscription & Billing" tab (same backend
// shape — UNPlan/UNSubscription — different app-level endpoints: /api/pm/
// instead of /api/landlord/, and no `country` param since Independent PM
// has exactly one UNAccount per user, unlike Landlord's one-per-country).
//
// No "Buy Service" here (unlike Landlord's Services tab) — Independent PM
// has no POST add-on-purchase endpoint yet (see independent_pm/views.py's
// own module-level comment: PMServiceEntitlementView is read-only, a new
// capability rather than a rewrite of something that already existed). The
// Services tab below is display-only: what's already entitled via the
// subscribed plan's INCLUDED services + any UNSubscriptionAddon rows,
// should any ever exist for this persona.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import NavB from '../../../components/layout/NavB';
import PMTopBar from '../../../components/layout/PMTopBar';

const C = {
  primary:      '#002D5B',
  pageBg:       '#F8FAFC',
  white:        '#FFFFFF',
  border:       'rgba(0,0,0,0.06)',
  borderMedium: 'rgba(0,0,0,0.10)',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textTertiary: '#94A3B8',
  neutral:      '#F1F5F9',
  green:        '#16A34A',
  greenBg:      '#F0FDF4',
  greenBorder:  '#BBF7D0',
  blue:         '#1D4ED8',
  blueBg:       '#EFF6FF',
  blueBorder:   '#BFDBFE',
  amber:        '#92400E',
  amberBg:      '#FEF3C7',
};
const F = { headline: "'Noto Serif', serif", body: "'Nunito Sans', sans-serif" };

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });

const S = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: C.pageBg, fontFamily: F.body },
  main:  { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 },
  content: { flex: 1, minHeight: 0, padding: '28px 32px', overflowY: 'auto' },
  crumb: { fontSize: 12, color: C.textTertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 },
  h1: { fontFamily: F.headline, fontSize: 26, fontWeight: 500, color: C.primary, margin: '0 0 3px' },
  sub: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, margin: '0 0 22px', maxWidth: 820 },

  tabstrip: { display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 22 },
  tab: (active) => ({ padding: '10px 18px', fontSize: 13.5, fontWeight: 600, color: active ? C.textPrimary : C.textTertiary, borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent', cursor: 'pointer' }),

  sectionHdr: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 14px' },
  sectionH2: { fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: 0 },
  sectionCount: { fontSize: 12.5, color: C.textTertiary },

  banner: { background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 12.5, color: C.textPrimary, lineHeight: 1.5 },
  currentSubCard: { background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 },

  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  planCard: (current) => ({ background: C.white, border: `1.5px solid ${current ? C.green : C.borderMedium}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }),
  planCardName: { fontSize: 15, fontWeight: 700, color: C.textPrimary },
  planCardPrice: { fontSize: 20, fontWeight: 700, color: C.textPrimary },
  planCardPriceUnit: { fontSize: 11.5, fontWeight: 600, color: C.textTertiary },
  planCardDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 1.5, flex: 1 },
  planCardIncluded: { fontSize: 11, color: C.textSecondary, lineHeight: 1.6 },

  btnPrimary: { background: C.primary, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
  btnSecondary: { background: C.white, color: C.textPrimary, border: `1px solid ${C.borderMedium}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body },
  pill: { background: C.greenBg, color: C.green, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 8 },

  svcGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  svcCard: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 },
  svcTitle: { fontSize: 14, fontWeight: 700, color: C.textPrimary },
  svcDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 1.5 },
  svcBadge: { alignSelf: 'flex-start', fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: C.greenBg, color: C.green },

  emptyState: { background: C.white, border: `1px dashed ${C.borderMedium}`, borderRadius: 10, padding: '32px 24px', textAlign: 'center' },
  emptyP: { fontSize: 12.5, color: C.textSecondary, maxWidth: 360, margin: '0 auto 14px', lineHeight: 1.6 },
};

export default function PMSubscriptionPage() {
  const [activeTab, setActiveTab] = useState('subscription'); // 'subscription' | 'services'

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null); // { subscription, included_services, addons } | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  const fetchSubscriptionData = React.useCallback(() => {
    setError(null);
    return Promise.all([
      fetch(`${API_BASE}/pm/plans/`, { headers: authHeaders() })
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch(`${API_BASE}/pm/subscription/`, { headers: authHeaders() })
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
    ])
      .then(([planList, sub]) => {
        setPlans(planList || []);
        setSubscription(sub.subscription ? sub : null);
      })
      .catch(() => setError('Could not load your subscription. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const fetchEntitlement = React.useCallback(() => {
    setServicesError(null);
    return fetch(`${API_BASE}/pm/services/entitlement/`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(j => setServices(j.services || []))
      .catch(() => setServicesError('Could not load your services. Please refresh the page.'))
      .finally(() => setServicesLoading(false));
  }, []);

  React.useEffect(() => { fetchSubscriptionData(); }, [fetchSubscriptionData]);
  React.useEffect(() => { fetchEntitlement(); }, [fetchEntitlement]);

  const handleSubscribe = (planId) => {
    setSubscribingPlanId(planId);
    fetch(`${API_BASE}/pm/subscription/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ plan_id: planId }),
    })
      .then(r => { if (!r.ok) return r.json().then(b => { throw new Error(b.detail || `Request failed (${r.status})`); }); })
      .then(() => Promise.all([fetchSubscriptionData(), fetchEntitlement()]))
      .catch(e => setError(e.message || 'Could not subscribe to this plan.'))
      .finally(() => setSubscribingPlanId(null));
  };

  return (
    <div style={S.shell}>
      <NavB activeId="subscription" />
      <div style={S.main}>
        <PMTopBar />
        <div style={S.content}>
          <div style={S.crumb}>
            My Profile <i className="ti ti-chevron-right" style={{ fontSize: 12 }} aria-hidden="true" />
            <span style={{ color: C.textSecondary }}>Subscription & Trial</span>
          </div>
          <h1 style={S.h1}>Subscription & Trial</h1>
          <p style={S.sub}>Manage your Independent PM plan and see which services it entitles you to.</p>

          <div style={S.tabstrip}>
            <div style={S.tab(activeTab === 'subscription')} onClick={() => setActiveTab('subscription')}>Subscription & Billing</div>
            <div style={S.tab(activeTab === 'services')} onClick={() => setActiveTab('services')}>Services</div>
          </div>

          {activeTab === 'subscription' && (
            <>
              {loading && <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '24px 0' }}>Loading your subscription…</div>}
              {!loading && error && (
                <div style={{ ...S.emptyState, marginBottom: 20 }}>
                  <p style={S.emptyP}>{error}</p>
                  <button style={S.btnPrimary} onClick={fetchSubscriptionData}>Retry</button>
                </div>
              )}
              {!loading && !error && (
                <>
                  {subscription ? (
                    <div style={S.currentSubCard}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.green }}>
                        <i className="ti ti-circle-check" style={{ marginRight: 6 }} aria-hidden="true" />
                        Current Plan: {subscription.subscription.plan_name} ({subscription.subscription.billing_cycle})
                      </div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                        Status: {subscription.subscription.status}
                        {subscription.subscription.next_billing_date ? ` · Next billing ${subscription.subscription.next_billing_date}` : ''}
                      </div>
                      {subscription.included_services?.length > 0 && (
                        <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 8 }}>
                          Included: {subscription.included_services.map(s => s.service_name).join(', ')}
                        </div>
                      )}
                      {subscription.addons?.length > 0 && (
                        <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 4 }}>
                          Add-ons: {subscription.addons.map(a => a.service_name).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={S.banner}>You don't have an active plan yet. Subscribe to a plan below.</div>
                  )}

                  <div style={S.sectionHdr}>
                    <div style={S.sectionH2}>Available Plans</div>
                    <span style={S.sectionCount}>{plans.length} plan(s) available for Independent PM</span>
                  </div>
                  <div style={S.planGrid}>
                    {plans.map(p => {
                      const isCurrent = subscription && subscription.subscription.plan === p.id;
                      const monthly = Number(p.monthly_price) || 0;
                      return (
                        <div key={p.id} style={S.planCard(isCurrent)}>
                          <div style={S.planCardName}>{p.name}{isCurrent && <span style={S.pill}>Current</span>}</div>
                          <div><span style={S.planCardPrice}>${monthly.toFixed(2)}</span> <span style={S.planCardPriceUnit}>{p.monthly_price_currency} / month</span></div>
                          <p style={S.planCardDesc}>{p.short_description}</p>
                          {p.included_services?.length > 0 && (
                            <div style={S.planCardIncluded}>Included: {p.included_services.map(s => s.service_name).join(', ')}</div>
                          )}
                          <button
                            style={isCurrent ? S.btnSecondary : S.btnPrimary}
                            disabled={isCurrent || subscribingPlanId === p.id}
                            onClick={() => handleSubscribe(p.id)}
                          >
                            {isCurrent ? 'Current Plan' : (subscribingPlanId === p.id ? 'Subscribing…' : 'Subscribe')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'services' && (
            <>
              {servicesLoading && <div style={{ fontSize: 12.5, color: C.textTertiary, padding: '24px 0' }}>Loading services…</div>}
              {!servicesLoading && servicesError && (
                <div style={{ ...S.emptyState, marginBottom: 20 }}>
                  <p style={S.emptyP}>{servicesError}</p>
                  <button style={S.btnPrimary} onClick={fetchEntitlement}>Retry</button>
                </div>
              )}
              {!servicesLoading && !servicesError && (
                services.length === 0 ? (
                  <div style={S.emptyState}>
                    <p style={S.emptyP}>No services yet — subscribe to a plan to see what it includes here.</p>
                  </div>
                ) : (
                  <div style={S.svcGrid}>
                    {services.map(s => (
                      <div key={s.id} style={S.svcCard}>
                        <span style={S.svcBadge}>✓ Entitled</span>
                        <div style={S.svcTitle}>{s.name}</div>
                        <div style={S.svcDesc}>{s.short_description}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
