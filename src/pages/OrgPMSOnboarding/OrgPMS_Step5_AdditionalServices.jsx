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

function AddonCard({ svc, selected, onToggle }) {
  const price     = svc.effective_price ?? svc.addon_price ?? svc.service_price;
  const priceUnit = svc.effective_currency ?? svc.addon_price_currency ?? svc.service_price_unit;

  return (
    <div onClick={onToggle}
      style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 16px', borderRadius:'10px', cursor:'pointer',
        border: selected ? '2px solid '+C.primary : '1.5px solid '+C.borderMedium,
        background: selected ? '#EFF6FF' : C.white, transition:'all 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = C.primary; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = C.borderMedium; }}
    >
      <div style={{ width:'18px', height:'18px', borderRadius:'4px', flexShrink:0, marginTop:'2px', border:'2px solid '+(selected?C.primary:C.borderMedium), background:selected?C.primary:C.white, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
        {selected && <i className="ti ti-check" style={{ fontSize:'10px', color:C.white }} />}
      </div>
      <div style={{ width:'36px', height:'36px', borderRadius:'8px', flexShrink:0, background:selected?C.primary:C.neutral, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}>
        <i className={'ti '+(svc.service_icon||'ti-puzzle')} style={{ fontSize:'18px', color:selected?C.white:C.textSecondary }} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'3px' }}>
          <p style={{ margin:0, fontFamily:F.headline, fontSize:'13px', fontWeight:700, color:C.textPrimary }}>{svc.service_name}</p>
          {price && (
            <span style={{ fontFamily:F.body, fontSize:'12px', fontWeight:700, color:C.primary }}>
              +${price}<span style={{ fontWeight:400, color:C.textTertiary, fontSize:'10px' }}>/{priceUnit==='PER_MONTH'?'mo':'unit'}</span>
            </span>
          )}
        </div>
        <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textSecondary, lineHeight:1.5 }}>{svc.service_description}</p>
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

export default function OrgPMS_Step5_AdditionalServices() {
  const navigate = useNavigate();

  const [userName,       setUserName]       = useState('');
  const [addonServices,  setAddonServices]  = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [errors,         setErrors]         = useState({});

  useEffect(() => {
    const token       = localStorage.getItem('access_token');
    const planId      = localStorage.getItem('org_pms_plan_id');
    const savedAddons = JSON.parse(localStorage.getItem('org_pms_selected_addons') || '[]');

    // ── Pre-restore selected add-ons from previous visit ──
    if (savedAddons.length > 0) setSelectedAddons(savedAddons);

    if (!token || !planId) { setLoading(false); return; }

    fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User'); })
      .catch(() => {});

    // ── Use public endpoint — services are nested under data.services ──
    fetch(`http://localhost:8001/api/admin/plans/public/${planId}/services/?type=ADDON`, {
      headers: { Authorization:'Bearer '+token },
    })
      .then(r => r.json())
      .then(data => {
        // Public endpoint returns { plan_id, plan_name, services: [...] }
        const arr = Array.isArray(data?.services) ? data.services : Array.isArray(data) ? data : [];
        setAddonServices(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleAddon = (svcId) => {
    setSelectedAddons(p => p.includes(svcId) ? p.filter(x => x !== svcId) : [...p, svcId]);
  };

  const handleContinue = async () => {
    setSaving(true);
    localStorage.setItem('org_pms_selected_addons', JSON.stringify(selectedAddons));
    navigate('/org-onboarding/step-6');
  };

  const selectedServices = addonServices.filter(s => selectedAddons.includes(s.service_id));
  const totalAddon = selectedServices.reduce((sum, s) => sum + parseFloat(s.effective_price || s.addon_price || s.service_price || 0), 0);

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
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>Enhance your plan with optional add-on services. You can add or remove these at any time after activation.</p>
          </div>

          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
            <VerticalStepper current={5} />

            <div className="org-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'780px', width:'100%', animation:'fadein 0.3s ease both' }}>

                <h2 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Additional Services</h2>
                <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>These add-ons are available for your selected plan. All are optional — skip to continue.</p>

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
                    <span style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary }}>Loading add-ons…</span>
                  </div>
                ) : addonServices.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px 24px' }}>
                    <i className="ti ti-puzzle" style={{ fontSize:'32px', color:C.textTertiary }} />
                    <p style={{ fontFamily:F.headline, fontSize:'15px', fontWeight:700, color:C.textPrimary, marginTop:'12px', marginBottom:'6px' }}>No add-ons for this plan</p>
                    <p style={{ fontFamily:F.body, fontSize:'12px', color:C.textSecondary }}>Your selected plan has no optional add-ons. Click Continue to proceed.</p>
                  </div>
                ) : (
                  <>
                    <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Available Add-ons</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
                      {addonServices.map(svc => (
                        <AddonCard key={svc.service_id} svc={svc}
                          selected={selectedAddons.includes(svc.service_id)}
                          onToggle={() => toggleAddon(svc.service_id)} />
                      ))}
                    </div>

                    {selectedAddons.length > 0 && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.neutral, border:'1px solid '+C.border, borderRadius:'8px', padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <i className="ti ti-circle-check" style={{ fontSize:'15px', color:C.green }} />
                          <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textPrimary, fontWeight:600 }}>{selectedAddons.length} add-on{selectedAddons.length>1?'s':''} selected</span>
                        </div>
                        <span style={{ fontFamily:F.body, fontSize:'13px', fontWeight:700, color:C.primary }}>+${totalAddon.toFixed(2)}/mo</span>
                      </div>
                    )}
                  </>
                )}

                <div style={dividerS} />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <button onClick={() => navigate('/org-onboarding/step-4')}
                    style={{ display:'flex', alignItems:'center', gap:'7px', height:'44px', padding:'0 22px', background:C.white, color:C.textPrimary, border:'1.5px solid '+C.borderMedium, borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    <i className="ti ti-arrow-left" style={{ fontSize:'14px' }} /> Back
                  </button>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    {!loading && addonServices.length > 0 && selectedAddons.length === 0 && (
                      <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Skip — no add-ons needed</span>
                    )}
                    <button onClick={handleContinue} disabled={saving}
                      style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:saving?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e => { if(!saving) e.currentTarget.style.background=C.primaryHover; }}
                      onMouseLeave={e => { if(!saving) e.currentTarget.style.background=C.primary; }}
                    >
                      {saving ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Saving…</> : <>Continue <i className="ti ti-arrow-right" style={{ fontSize:'14px' }} /></>}
                    </button>
                  </div>
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
