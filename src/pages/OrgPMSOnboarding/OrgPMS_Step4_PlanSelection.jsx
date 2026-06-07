import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const C = {
  primary:'#002D5B', primaryHover:'#003d7a', navBg:'#1a2332', pageBg:'#F1F5F9',
  border:'#E2E8F0', borderMedium:'#CBD5E1', textPrimary:'#0F172A', textSecondary:'#64748B',
  textTertiary:'#94A3B8', white:'#FFFFFF', neutral:'#F8FAFC', danger:'#E53E3E', green:'#16A34A',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

const STEPS = [
  { n:1, label:'Company & Portfolio',  sub:'Organisation details and unit count' },
  { n:2, label:'Document Upload',      sub:'Required verification documents' },
  { n:3, label:'Integration Method',   sub:'PMS setup and data migration' },
  { n:4, label:'Plan Selection',       sub:'Choose your UrbanNest plan' },
  { n:5, label:'Additional Services',  sub:'Optional add-on services' },
  { n:6, label:'Payment',              sub:'Secure card tokenization' },
  { n:7, label:'Review & Submit',      sub:'Confirm and activate your account' },
];

const dividerS = { borderTop:'1px solid '+C.border, margin:'20px 0' };
const hintS = (error=false) => ({ fontFamily:F.body, fontSize:'11px', color:error?C.danger:C.textTertiary, marginTop:'4px' });

const CURRENCY_MAP = { US:'USD', IN:'INR', AE:'AED', GB:'GBP', AU:'AUD', CA:'CAD', SG:'SGD' };

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

function PlanCard({ plan, selected, onSelect, suggested }) {
  const isEnterprise = !plan.monthly_price;
  const includedSvcs = plan.included_services || [];
  const addonSvcs    = plan.addon_services    || [];

  return (
    <div
      onClick={() => !isEnterprise && onSelect(plan.id)}
      style={{
        borderRadius:'12px', overflow:'hidden', cursor:isEnterprise?'default':'pointer',
        border: selected ? '2px solid '+C.primary : '1.5px solid '+(suggested?'#93C5FD':C.borderMedium),
        background:C.white, transition:'all 0.15s', position:'relative',
        boxShadow: selected ? '0 0 0 3px rgba(0,45,91,0.08)' : 'none',
      }}
      onMouseEnter={e => { if (!isEnterprise && !selected) e.currentTarget.style.borderColor = C.primary; }}
      onMouseLeave={e => { if (!isEnterprise && !selected) e.currentTarget.style.borderColor = suggested?'#93C5FD':C.borderMedium; }}
    >
      {suggested && (
        <div style={{ position:'absolute', top:'10px', right:'10px', background:C.primary, color:C.white, borderRadius:'20px', padding:'3px 10px', fontFamily:F.body, fontSize:'10px', fontWeight:700, letterSpacing:'0.04em' }}>
          SUGGESTED
        </div>
      )}
      <div style={{ height:'100px', background:'linear-gradient(135deg, #1a2332 0%, #002D5B 100%)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {plan.image_url
          ? <img src={plan.image_url} alt={plan.name} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
          : <i className="ti ti-building-skyscraper" style={{ fontSize:'32px', color:'rgba(255,255,255,0.15)' }} />
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div style={{ position:'absolute', bottom:'10px', left:'14px', right:'14px' }}>
          <p style={{ margin:0, fontFamily:F.headline, fontSize:'15px', fontWeight:700, color:C.white }}>{plan.name}</p>
        </div>
        {selected && (
          <div style={{ position:'absolute', top:'10px', left:'10px', width:'22px', height:'22px', borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-check" style={{ fontSize:'12px', color:C.white }} />
          </div>
        )}
      </div>
      <div style={{ padding:'14px 16px' }}>
        <p style={{ margin:'0 0 8px', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, lineHeight:1.5 }}>{plan.short_description}</p>
        {(includedSvcs.length > 0 || addonSvcs.length > 0) && (
          <div style={{ display:'flex', gap:'10px', marginBottom:'10px', flexWrap:'wrap' }}>
            {includedSvcs.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#16A34A"/><path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.2" fill="none"/></svg>
                <span style={{ fontFamily:F.body, fontSize:'10px', color:C.green, fontWeight:600 }}>{includedSvcs.length} included</span>
              </div>
            )}
            {addonSvcs.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#94A3B8"/><path d="M5 3v4M3 5h4" stroke="white" strokeWidth="1.2"/></svg>
                <span style={{ fontFamily:F.body, fontSize:'10px', color:C.textTertiary, fontWeight:600 }}>{addonSvcs.length} add-ons</span>
              </div>
            )}
          </div>
        )}
        {includedSvcs.length > 0 && (
          <div style={{ marginBottom:'10px' }}>
            {includedSvcs.slice(0,3).map(svc => (
              <div key={svc.service_id} style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
                <i className="ti ti-check" style={{ fontSize:'10px', color:C.green }} />
                <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textPrimary }}>{svc.service_name}</span>
              </div>
            ))}
            {includedSvcs.length > 3 && (
              <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>+{includedSvcs.length - 3} more services</span>
            )}
          </div>
        )}
        {(plan.unit_limit_min != null || plan.unit_limit_max != null) && (
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'10px' }}>
            <i className="ti ti-building" style={{ fontSize:'11px', color:C.textTertiary }} />
            <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textSecondary }}>
              {plan.unit_limit_min || 1}–{plan.unit_limit_max ? plan.unit_limit_max : '∞'} units
            </span>
          </div>
        )}
        <div style={dividerS} />
        {isEnterprise ? (
          <div style={{ textAlign:'center', padding:'4px 0' }}>
            <p style={{ margin:'0 0 2px', fontFamily:F.headline, fontSize:'16px', fontWeight:700, color:C.textPrimary }}>Custom Pricing</p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Contact our sales team</p>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'baseline', gap:'3px' }}>
            <span style={{ fontFamily:F.headline, fontSize:'20px', fontWeight:700, color:C.textPrimary }}>${plan.monthly_price}</span>
            <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>/mo</span>
            {plan.annual_price && (
              <span style={{ fontFamily:F.body, fontSize:'10px', color:C.green, marginLeft:'6px' }}>Save {Math.round((1 - (plan.annual_price/12)/plan.monthly_price)*100)}% annually</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LeftNav() {
  return (
    <div style={{ width:'185px', minWidth:'185px', flexShrink:0, background:C.navBg, display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ height:'60px', flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily:F.headline, fontSize:'17px', fontWeight:700, color:C.white }}>UrbanNest</span>
        <span style={{ fontFamily:F.body, fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Org PMS Portal</span>
      </div>
      <div style={{ margin:'16px 10px 0', borderRadius:'6px', padding:'9px 12px', display:'flex', alignItems:'center', gap:'9px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.08)' }}>
        <i className="ti ti-layout-dashboard" style={{ fontSize:'15px', color:'rgba(255,255,255,0.85)' }} />
        <span style={{ fontFamily:F.body, fontSize:'13px', fontWeight:600, color:C.white }}>Onboarding</span>
      </div>
      <div style={{ marginTop:'auto', padding:'20px' }}>
        {[['ti-help-circle','Help Center'],['ti-logout','Sign out']].map(([icon,label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', cursor:'pointer' }}>
            <i className={'ti '+icon} style={{ fontSize:'14px', color:'rgba(255,255,255,0.35)' }} />
            <span style={{ fontFamily:F.body, fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ userName }) {
  return (
    <div style={{ height:'60px', flexShrink:0, background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', background:C.neutral, borderRadius:'8px', padding:'0 14px', height:'36px', width:'280px' }}>
        <i className="ti ti-search" style={{ fontSize:'14px', color:C.textTertiary }} />
        <input type="text" placeholder="Search portfolios, settings, or help…" style={{ background:'none', border:'none', outline:'none', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, width:'100%' }} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
        <i className="ti ti-bell" style={{ fontSize:'18px', color:C.textSecondary, cursor:'pointer' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px', paddingLeft:'12px', borderLeft:'1px solid '+C.border }}>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', fontWeight:600, color:C.textPrimary }}>{userName}</p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'9px', color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.06em' }}>Org PMS Admin</p>
          </div>
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:C.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-user" style={{ fontSize:'16px', color:C.white }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerticalStepper({ current }) {
  return (
    <div style={{ width:'200px', minWidth:'200px', flexShrink:0, background:C.pageBg, borderRight:'1px solid '+C.border, padding:'clamp(16px,2vw,24px) 16px 24px clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', overflowY:'hidden' }}>
      {STEPS.map((step,idx) => {
        const done = step.n < current, active = step.n === current;
        return (
          <div key={step.n} style={{ display:'flex', gap:'12px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', marginTop:'3px', flexShrink:0, background:active||done?C.primary:'transparent', border:'2px solid '+(active||done?C.primary:C.borderMedium), display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done && <i className="ti ti-check" style={{ fontSize:'6px', color:C.white }} />}
              </div>
              {idx < STEPS.length-1 && <div style={{ width:'1.5px', flex:1, minHeight:'32px', background:done?C.primary:C.borderMedium, margin:'4px 0', opacity:done?1:0.35 }} />}
            </div>
            <div style={{ paddingBottom:idx<STEPS.length-1?'12px':0 }}>
              <p style={{ margin:'0 0 2px', fontFamily:F.headline, fontSize:'12px', fontWeight:active?700:500, color:active?C.textPrimary:done?C.textSecondary:C.textTertiary, lineHeight:1.3 }}>{step.label}</p>
              <p style={{ margin:0, fontFamily:F.body, fontSize:'10px', color:active?C.textSecondary:C.textTertiary, lineHeight:1.4 }}>{step.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrgPMS_Step4_PlanSelection() {
  const navigate = useNavigate();

  const [userName,     setUserName]     = useState('');
  const [plans,        setPlans]        = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [suggestedId,  setSuggestedId]  = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});

  useEffect(() => {
    const token       = localStorage.getItem('access_token');
    const unitCount   = parseInt(localStorage.getItem('org_pms_unit_count') || '0', 10);
    const country     = localStorage.getItem('org_pms_country') || 'US';
    const currency    = CURRENCY_MAP[country] || 'USD';
    const savedPlanId = localStorage.getItem('org_pms_plan_id');
    const savedCycle  = localStorage.getItem('org_pms_billing_cycle');
    if (!token) return;

    if (savedCycle) setBillingCycle(savedCycle);

    fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User'); })
      .catch(() => {});

    fetch('http://localhost:8001/api/admin/plans/public/', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.json())
      .then(data => {
        const allActive = Array.isArray(data) ? data.filter(p => p.status === 'ACTIVE') : [];

        const byUnit = unitCount > 0
          ? allActive.filter(p =>
              (p.unit_limit_min == null || unitCount >= p.unit_limit_min) &&
              (p.unit_limit_max == null || unitCount <= p.unit_limit_max)
            )
          : allActive;

        // Filter by currency — only show plans matching the org's country
        const activePlans = byUnit.filter(p =>
          !p.monthly_price_currency || p.monthly_price_currency === currency
        );

        setPlans(activePlans);

        // Pre-select saved plan if still in filtered list
        if (savedPlanId) {
          const savedPlan = activePlans.find(p => p.id === parseInt(savedPlanId, 10));
          if (savedPlan) {
            setSelectedPlan(savedPlan.id);
            setSuggestedId(savedPlan.id);
            setLoading(false);
            return;
          }
        }

        // Auto-suggest by unit count
        const match = activePlans.find(p =>
          (p.unit_limit_min == null || unitCount >= p.unit_limit_min) &&
          (p.unit_limit_max == null || unitCount <= p.unit_limit_max)
        );
        if (match) { setSuggestedId(match.id); setSelectedPlan(match.id); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const handleContinue = async () => {
    if (!selectedPlan) { setErrors({ plan:'Please select a plan to continue.' }); return; }
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');
      const orgId = localStorage.getItem('org_pms_id');

      localStorage.setItem('org_pms_plan_id',      selectedPlan);
      localStorage.setItem('org_pms_billing_cycle', billingCycle);

      // Step 1 — fetch org record to get account_number + country
      const orgRes  = await fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/`, {
        headers: { Authorization:'Bearer '+token },
      });
      const orgData = await orgRes.json();

      if (!orgRes.ok) {
        setErrors({ api:'Could not load account details. Please try again.' });
        setSaving(false);
        return;
      }

      const country  = orgData.account_info?.country || 'US';
      const currency = CURRENCY_MAP[country] || 'USD';
      const accountNumber = orgData.account_info?.account_number;

      // Step 2 — create UNSubscription with trial dates
      const now          = new Date();
      const trialEnd     = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const subRes = await fetch('http://localhost:8001/api/admin/billing/subscriptions/', {
        method:  'POST',
        headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          persona_type:   'ORG_PMS',
          plan:           selectedPlan,
          country:        country,
          currency:       currency,
          billing_cycle:  billingCycle,
          status:         'TRIAL',
          trial_start:    now.toISOString(),
          trial_end:      trialEnd.toISOString(),
        }),
      });

      if (!subRes.ok) {
        const data = await subRes.json();
        setErrors({ api: data.detail || 'Could not save plan. Please try again.' });
        setSaving(false);
        return;
      }

      const subData = await subRes.json();
      localStorage.setItem('org_pms_subscription_id', subData.id);

      // Step 3 — link subscription to UNAccount via org-pms PATCH
      // Uses orgId (integer) to avoid slash issue with account_number in URL
      await fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/`, {
        method:  'PATCH',
        headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
        body: JSON.stringify({ link_subscription: subData.id }),
      });

      navigate('/org-onboarding/step-5');
    } catch {
      setErrors({ api:'Connection error. Please check your connection.' });
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        html, body, #root { height:100%; overflow:hidden; margin:0; padding:0; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .org-form-scroll::-webkit-scrollbar { width:5px; }
        .org-form-scroll::-webkit-scrollbar-track { background:transparent; }
        .org-form-scroll::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg, fontFamily:F.body }}>
        <LeftNav />
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <Header userName={userName} />

          <div style={{ flexShrink:0, padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,48px) 0', background:C.pageBg }}>
            <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'clamp(22px,2.2vw,28px)', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>Organizational Property Management</h1>
            <p style={{ margin:'0 0 10px', fontFamily:F.headline, fontSize:'clamp(13px,1.2vw,15px)', fontWeight:600, color:C.green }}>Account Registration &amp; Setup</p>
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>Select the plan that best fits your portfolio size. You can upgrade or downgrade at any time after activation.</p>
          </div>

          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
            <VerticalStepper current={4} />

            <div className="org-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'780px', width:'100%', animation:'fadein 0.3s ease both' }}>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                  <h2 style={{ margin:0, fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Select a Plan</h2>
                  <div style={{ display:'flex', background:C.neutral, borderRadius:'8px', padding:'3px', border:'1px solid '+C.border }}>
                    {['MONTHLY','ANNUAL'].map(cycle => (
                      <button key={cycle} onClick={() => setBillingCycle(cycle)}
                        style={{ height:'30px', padding:'0 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'11px', fontWeight:600, background:billingCycle===cycle?C.white:'transparent', color:billingCycle===cycle?C.textPrimary:C.textTertiary, boxShadow:billingCycle===cycle?'0 1px 3px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>
                        {cycle === 'MONTHLY' ? 'Monthly' : 'Annual'}{cycle==='ANNUAL'&&<span style={{ color:C.green, marginLeft:'4px' }}>-20%</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>
                  {suggestedId ? 'A plan has been suggested based on your portfolio size.' : 'Choose the plan that fits your portfolio.'}
                </p>

                {errors.api && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                    <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{errors.api}</span>
                  </div>
                )}

                <div style={dividerS} />

                {loading ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'48px', gap:'10px' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
                    <span style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary }}>Loading plans…</span>
                  </div>
                ) : plans.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px' }}>
                    <i className="ti ti-package-off" style={{ fontSize:'32px', color:C.textTertiary }} />
                    <p style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary, marginTop:'12px' }}>No plans available for your portfolio size. Please contact support.</p>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'16px', marginBottom:'8px' }}>
                    {plans.map(plan => (
                      <PlanCard key={plan.id} plan={plan} selected={selectedPlan===plan.id} suggested={suggestedId===plan.id}
                        onSelect={id => { setSelectedPlan(id); setErrors(p=>({...p,plan:''})); }} />
                    ))}
                  </div>
                )}
                {errors.plan && <p style={hintS(true)}>{errors.plan}</p>}

                <div style={dividerS} />

                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px', padding:'11px 14px', marginBottom:'20px' }}>
                  <i className="ti ti-gift" style={{ fontSize:'15px', color:C.green, flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:'#065F46', lineHeight:1.55 }}>All plans include a free trial period. Your card will be tokenized but not charged until your trial ends. You can cancel at any time before the trial expires.</p>
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <button onClick={() => navigate('/org-onboarding/step-3')} style={{ display:'flex', alignItems:'center', gap:'7px', height:'44px', padding:'0 22px', background:C.white, color:C.textPrimary, border:'1.5px solid '+C.borderMedium, borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    <i className="ti ti-arrow-left" style={{ fontSize:'14px' }} /> Back
                  </button>
                  <button onClick={handleContinue} disabled={saving||loading}
                    style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:(saving||loading)?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:(saving||loading)?'not-allowed':'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e => { if(!saving&&!loading) e.currentTarget.style.background=C.primaryHover; }}
                    onMouseLeave={e => { if(!saving&&!loading) e.currentTarget.style.background=C.primary; }}
                  >
                    {saving ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Saving…</> : <>Continue <i className="ti ti-arrow-right" style={{ fontSize:'14px' }} /></>}
                  </button>
                </div>
              </div>
              <p style={{ textAlign:'center', fontFamily:F.body, fontSize:'10px', color:C.textTertiary, margin:'24px 0 16px', letterSpacing:'0.04em' }}>© 2026 URBANNEST. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
