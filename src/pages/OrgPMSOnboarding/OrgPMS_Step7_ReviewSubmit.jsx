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

const dividerS = { borderTop:'1px solid '+C.border, margin:'16px 0' };

const CHECK_LABELS = {
  documents_uploaded:     'Required documents uploaded',
  plan_selected:          'Subscription plan selected',
  payment_method_on_file: 'Payment method on file',
  company_info_complete:  'Company information complete',
  integration_method_set: 'Integration method selected',
};

function CheckRow({ label, passed, loading }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 0', borderBottom:'1px solid '+C.border }}>
      {loading ? (
        <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite', flexShrink:0 }} />
      ) : passed ? (
        <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <i className="ti ti-check" style={{ fontSize:'10px', color:C.white }} />
        </div>
      ) : (
        <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#FEF2F2', border:'2px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <i className="ti ti-x" style={{ fontSize:'10px', color:C.danger }} />
        </div>
      )}
      <span style={{ fontFamily:F.body, fontSize:'13px', color:passed?C.textPrimary:C.danger, flex:1 }}>{label}</span>
      <span style={{ fontFamily:F.body, fontSize:'11px', fontWeight:600, color:passed?C.green:C.danger }}>
        {loading ? 'Checking…' : passed ? 'Pass' : 'Fail'}
      </span>
    </div>
  );
}

function SummaryRow({ label, value, step }) {
  const navigate = useNavigate();
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid '+C.border }}>
      <div style={{ flex:1 }}>
        <p style={{ margin:'0 0 2px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textTertiary, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
        <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textPrimary }}>{value || '—'}</p>
      </div>
      {step && (
        <button onClick={() => navigate('/org-onboarding/step-'+step)}
          style={{ background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'11px', color:C.primary, fontWeight:600, padding:'2px 0', flexShrink:0 }}>
          Edit
        </button>
      )}
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

function SubmissionSuccess({ companyName }) {
  const navigate = useNavigate();
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'40px', textAlign:'center' }}>
      <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'#F0FDF4', border:'2px solid #BBF7D0', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px' }}>
        <i className="ti ti-circle-check" style={{ fontSize:'36px', color:C.green }} />
      </div>
      <h2 style={{ margin:'0 0 12px', fontFamily:F.headline, fontSize:'24px', fontWeight:700, color:C.textPrimary }}>Application Submitted!</h2>
      <p style={{ margin:'0 0 8px', fontFamily:F.body, fontSize:'14px', color:C.textSecondary, maxWidth:'420px', lineHeight:1.7 }}>
        <strong style={{ fontWeight:600 }}>{companyName}</strong> has been submitted for review.
      </p>
      <p style={{ margin:'0 0 32px', fontFamily:F.body, fontSize:'13px', color:C.textTertiary, maxWidth:'380px', lineHeight:1.7 }}>
        Our compliance team will review your application and documents within <strong style={{ fontWeight:600 }}>2–3 business days</strong>. You'll receive an email notification once a decision is made.
      </p>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', background:C.neutral, border:'1px solid '+C.border, borderRadius:'10px', padding:'14px 20px', maxWidth:'380px', marginBottom:'32px' }}>
        <i className="ti ti-mail" style={{ fontSize:'18px', color:C.primary, flexShrink:0 }} />
        <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:C.textSecondary, lineHeight:1.6 }}>
          Check your email for a confirmation and updates on your application status.
        </p>
      </div>
      <button onClick={() => navigate('/persona-select')}
        style={{ height:'44px', padding:'0 28px', background:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default function OrgPMS_Step7_ReviewSubmit() {
  const navigate = useNavigate();

  const [userName,     setUserName]     = useState('');
  const [summary,      setSummary]      = useState(null);
  const [planDetails,  setPlanDetails]  = useState(null);
  const [addonDetails, setAddonDetails] = useState([]);
  const [checks,       setChecks]       = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [failed,       setFailed]       = useState([]);
  const [apiError,     setApiError]     = useState('');

  useEffect(() => {
    const token  = localStorage.getItem('access_token');
    const orgId  = localStorage.getItem('org_pms_id');
    const planId = localStorage.getItem('org_pms_plan_id');
    const selectedAddons = JSON.parse(localStorage.getItem('org_pms_selected_addons') || '[]');
    if (!token || !orgId) return;

    fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User'); })
      .catch(() => {});

    fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/`, { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.json())
      .then(data => setSummary(data))
      .catch(() => {});

    if (planId) {
      // ← CHANGED: use public endpoint instead of admin endpoint
      fetch(`http://localhost:8001/api/admin/plans/public/${planId}/`, { headers:{ Authorization:'Bearer '+token } })
        .then(r => r.json())
        .then(data => setPlanDetails(data))
        .catch(() => {});

      if (selectedAddons.length > 0) {
        // ← CHANGED: use public endpoint instead of admin endpoint
        fetch(`http://localhost:8001/api/admin/plans/public/${planId}/services/?type=ADDON`, { headers:{ Authorization:'Bearer '+token } })
          .then(r => r.json())
          .then(data => {
            const services = Array.isArray(data?.services) ? data.services : Array.isArray(data) ? data : [];
            setAddonDetails(services.filter(s => selectedAddons.includes(s.service_id)));
          })
          .catch(() => {});
      }
    }
  }, []);

  const runChecksAndSubmit = async () => {
    setCheckLoading(true);
    setApiError('');
    const token = localStorage.getItem('access_token');
    const orgId = localStorage.getItem('org_pms_id');

    try {
      const res  = await fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/submit/`, {
        method:  'POST',
        headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
      });
      const data = await res.json();

      setChecks(data.checks);
      setFailed(data.failed || []);
      setCheckLoading(false);

      if (data.submitted) {
        setSubmitting(true);
        setTimeout(() => {
          setSubmitting(false);
          setSubmitted(true);
        }, 1200);
      }
    } catch {
      setApiError('Could not submit. Please check your connection and try again.');
      setCheckLoading(false);
    }
  };

  const scenario     = localStorage.getItem('org_pms_scenario');
  const integration  = localStorage.getItem('org_pms_integration_method');
  const billingCycle = localStorage.getItem('org_pms_billing_cycle') || 'MONTHLY';

  const INTEGRATION_LABELS = {
    MANUAL:'Manual Entry', CSV:'CSV Import', API:'API Integration',
    MIGRATE:'Full Migration', SYNC:'Parallel Sync',
  };
  const SCENARIO_LABELS_MAP = {
    A:'Scenario A — New Setup',
    B:'Scenario B — Data Migration',
    C:'Scenario C — Parallel Sync',
  };

  const planPrice = planDetails
    ? billingCycle === 'ANNUAL' && planDetails.annual_price
      ? `$${planDetails.annual_price}/yr`
      : `$${planDetails.monthly_price}/mo`
    : null;

  const addonTotal       = addonDetails.reduce((sum, s) => sum + parseFloat(s.effective_price || s.addon_price || s.service_price || 0), 0);
  const allChecksPassed  = checks && failed.length === 0;
  const someChecksFailed = checks && failed.length > 0;

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

          {submitted ? (
            <SubmissionSuccess companyName={summary?.company_name || 'Your company'} />
          ) : (
            <>
              <div style={{ flexShrink:0, padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,48px) 0', background:C.pageBg }}>
                <h1 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'clamp(22px,2.2vw,28px)', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>Organizational Property Management</h1>
                <p style={{ margin:'0 0 10px', fontFamily:F.headline, fontSize:'clamp(13px,1.2vw,15px)', fontWeight:600, color:C.green }}>Account Registration &amp; Setup</p>
                <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>Review your details and submit for UN Admin review.</p>
              </div>

              <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
                <VerticalStepper current={7} />

                <div className="org-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
                  <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'780px', width:'100%', animation:'fadein 0.3s ease both' }}>

                    <h2 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Review &amp; Submit for Review</h2>
                    <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Verify your details below. Once submitted, our compliance team will review your application within 2–3 business days.</p>

                    {apiError && (
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                        <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                        <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{apiError}</span>
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'11px 14px', marginBottom:'20px' }}>
                      <i className="ti ti-info-circle" style={{ fontSize:'15px', color:'#1D4ED8', flexShrink:0, marginTop:'1px' }} />
                      <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:'#1D4ED8', lineHeight:1.55 }}>
                        After submission, a UrbanNest compliance officer will review your documents and company details. You will receive an email notification within 2–3 business days.
                      </p>
                    </div>

                    <div style={dividerS} />

                    <p style={{ margin:'0 0 10px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Company Details</p>
                    {summary ? (
                      <>
                        <SummaryRow label="Company Name"     value={summary.company_name}                    step={1} />
                        <SummaryRow label="Registration No." value={summary.company_reg_number}              step={1} />
                        <SummaryRow label="Company Type"     value={summary.company_type}                    step={1} />
                        <SummaryRow label="Country"          value={summary.account_info?.country}           step={1} />
                        <SummaryRow label="Account Number"   value={summary.account_info?.account_number} />
                        <SummaryRow label="Application No."  value={summary.account_info?.application_number} />
                      </>
                    ) : (
                      <div style={{ padding:'12px 0', display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
                        <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Loading…</span>
                      </div>
                    )}

                    <div style={{ ...dividerS, margin:'16px 0' }} />

                    <p style={{ margin:'0 0 10px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Setup Configuration</p>
                    <SummaryRow label="Scenario"           value={SCENARIO_LABELS_MAP[scenario] || scenario}     step={1} />
                    <SummaryRow label="Integration Method" value={INTEGRATION_LABELS[integration] || integration} step={3} />

                    <div style={{ ...dividerS, margin:'16px 0' }} />

                    <p style={{ margin:'0 0 10px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Plan &amp; Services</p>
                    {planDetails ? (
                      <>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:C.neutral, borderRadius:'8px', marginBottom:'8px' }}>
                          <div>
                            <p style={{ margin:'0 0 2px', fontFamily:F.body, fontSize:'13px', fontWeight:600, color:C.textPrimary }}>{planDetails.name}</p>
                            <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textSecondary }}>{billingCycle === 'ANNUAL' ? 'Annual billing' : 'Monthly billing'}</p>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                            <span style={{ fontFamily:F.headline, fontSize:'15px', fontWeight:700, color:C.primary }}>{planPrice}</span>
                            <button onClick={() => navigate('/org-onboarding/step-4')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'11px', color:C.primary, fontWeight:600 }}>Edit</button>
                          </div>
                        </div>
                        {addonDetails.length > 0 && (
                          <div style={{ marginBottom:'8px', border:'1px solid '+C.border, borderRadius:'8px', overflow:'hidden' }}>
                            <p style={{ margin:0, padding:'8px 12px', fontFamily:F.body, fontSize:'11px', fontWeight:600, color:C.textSecondary, background:C.neutral, borderBottom:'1px solid '+C.border }}>Add-on Services</p>
                            {addonDetails.map(svc => (
                              <div key={svc.service_id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:'1px solid '+C.border }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                  <i className={'ti '+(svc.service_icon||'ti-puzzle')} style={{ fontSize:'13px', color:C.textTertiary }} />
                                  <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textPrimary }}>{svc.service_name}</span>
                                </div>
                                <span style={{ fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textSecondary }}>
                                  +${svc.effective_price || svc.addon_price || svc.service_price}/mo
                                </span>
                              </div>
                            ))}
                            <div style={{ display:'flex', justifyContent:'flex-end', padding:'8px 12px' }}>
                              <span style={{ fontFamily:F.body, fontSize:'12px', fontWeight:700, color:C.primary }}>Add-ons total: +${addonTotal.toFixed(2)}/mo</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ fontFamily:F.body, fontSize:'13px', color:C.textTertiary, padding:'8px 0' }}>
                        No plan selected — <button onClick={() => navigate('/org-onboarding/step-4')} style={{ background:'none', border:'none', cursor:'pointer', color:C.primary, fontFamily:F.body, fontSize:'13px', fontWeight:600 }}>Select a plan</button>
                      </p>
                    )}

                    <div style={{ ...dividerS, margin:'16px 0' }} />

                    <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Readiness Checks</p>
                    <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>
                      These checks run automatically when you click Submit. All must pass before your application can be submitted for review.
                    </p>

                    {(checks || checkLoading) && (
                      <div style={{ marginBottom:'14px' }}>
                        {Object.entries(CHECK_LABELS).map(([key, label]) => (
                          <CheckRow key={key} label={label} passed={checks?.[key]} loading={checkLoading} />
                        ))}
                        {allChecksPassed && (
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px', padding:'12px 14px', marginTop:'14px', animation:'fadein 0.3s ease both' }}>
                            <i className="ti ti-circle-check" style={{ fontSize:'16px', color:C.green }} />
                            <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:'#065F46', fontWeight:600 }}>All checks passed — submitting your application…</p>
                          </div>
                        )}
                        {someChecksFailed && (
                          <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'12px 14px', marginTop:'14px' }}>
                            <i className="ti ti-alert-circle" style={{ fontSize:'16px', color:C.danger, flexShrink:0, marginTop:'1px' }} />
                            <div>
                              <p style={{ margin:'0 0 4px', fontFamily:F.body, fontSize:'12px', color:C.danger, fontWeight:600 }}>{failed.length} check{failed.length>1?'s':''} failed — please fix before submitting.</p>
                              <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.danger }}>Use the Edit links above to go back and complete the missing information.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={dividerS} />

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <button onClick={() => navigate('/org-onboarding/step-6')}
                        style={{ display:'flex', alignItems:'center', gap:'7px', height:'44px', padding:'0 22px', background:C.white, color:C.textPrimary, border:'1.5px solid '+C.borderMedium, borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                        <i className="ti ti-arrow-left" style={{ fontSize:'14px' }} /> Back
                      </button>
                      <button onClick={runChecksAndSubmit} disabled={submitting || checkLoading || someChecksFailed}
                        style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:(submitting||checkLoading||someChecksFailed)?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:(submitting||checkLoading||someChecksFailed)?'not-allowed':'pointer', transition:'background 0.15s' }}
                        onMouseEnter={e => { if(!submitting&&!checkLoading&&!someChecksFailed) e.currentTarget.style.background=C.primaryHover; }}
                        onMouseLeave={e => { if(!submitting&&!checkLoading&&!someChecksFailed) e.currentTarget.style.background=C.primary; }}
                      >
                        {submitting || checkLoading
                          ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />{checkLoading?'Checking…':'Submitting…'}</>
                          : <><i className="ti ti-send" style={{ fontSize:'14px' }} />Submit for Review</>
                        }
                      </button>
                    </div>
                  </div>
                  <p style={{ textAlign:'center', fontFamily:F.body, fontSize:'10px', color:C.textTertiary, margin:'24px 0 16px', letterSpacing:'0.04em' }}>© 2026 URBANNEST. ALL RIGHTS RESERVED.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
