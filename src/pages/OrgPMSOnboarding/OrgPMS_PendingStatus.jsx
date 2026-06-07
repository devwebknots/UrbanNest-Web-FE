// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Org PMS Pending Status Screen
// Route: /org-onboarding/pending
// Shown when user clicks the "Pending" persona card on PersonaSelectPage.
// Reuses the SubmissionSuccess UI from Step 7 — standalone route, no wizard state needed.
// ─────────────────────────────────────────────────────────────────────────────

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
  textTertiary:'#94A3B8', white:'#FFFFFF', neutral:'#F8FAFC', green:'#16A34A',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

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

export default function OrgPMS_PendingStatus() {
  const navigate = useNavigate();
  const [userName,    setUserName]    = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/'); return; }

    // Get user display name
    fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User');
      })
      .catch(() => {});

    // Get latest org record to show company name
    fetch('http://localhost:8001/api/admin/org-pms/?mine=true', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        // Latest record is first (ordered by -created_at on backend)
        const latest = list[0];
        if (latest?.company_name) setCompanyName(latest.company_name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg }}>
        <LeftNav />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        html, body, #root { height:100%; overflow:hidden; margin:0; padding:0; }
        @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.pageBg, fontFamily:F.body }}>
        <LeftNav />
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <Header userName={userName} />

          {/* ── Pending status content ── */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px', textAlign:'center', animation:'fadein 0.35s ease both' }}>

            {/* Status icon */}
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'#EFF6FF', border:'2px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px' }}>
              <i className="ti ti-clock" style={{ fontSize:'36px', color:'#1D4ED8' }} />
            </div>

            <h2 style={{ margin:'0 0 12px', fontFamily:F.headline, fontSize:'24px', fontWeight:700, color:C.textPrimary }}>
              Application Under Review
            </h2>
            <p style={{ margin:'0 0 8px', fontFamily:F.body, fontSize:'14px', color:C.textSecondary, maxWidth:'420px', lineHeight:1.7 }}>
              <strong style={{ fontWeight:600 }}>{companyName || 'Your company'}</strong> has been submitted and is currently being reviewed by our compliance team.
            </p>
            <p style={{ margin:'0 0 32px', fontFamily:F.body, fontSize:'13px', color:C.textTertiary, maxWidth:'380px', lineHeight:1.7 }}>
              Review typically takes <strong style={{ fontWeight:600 }}>2–3 business days</strong>. You'll receive an email notification once a decision has been made.
            </p>

            {/* Status timeline */}
            <div style={{ display:'flex', alignItems:'center', gap:'0', marginBottom:'32px', maxWidth:'420px', width:'100%' }}>
              {[
                { label:'Submitted',   done:true  },
                { label:'Under Review', done:false, active:true },
                { label:'Decision',    done:false  },
              ].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', flex:1 }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      background: step.done ? C.green : step.active ? '#1D4ED8' : C.neutral,
                      border: `2px solid ${step.done ? C.green : step.active ? '#1D4ED8' : C.borderMedium}`,
                    }}>
                      {step.done
                        ? <i className="ti ti-check" style={{ fontSize:'12px', color:C.white }} />
                        : step.active
                          ? <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:C.white }} />
                          : null
                      }
                    </div>
                    <span style={{ fontFamily:F.body, fontSize:'10px', fontWeight:step.active?700:500,
                      color:step.done?C.green:step.active?'#1D4ED8':C.textTertiary, whiteSpace:'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ height:'2px', flex:1, background:step.done?C.green:C.borderMedium, marginBottom:'18px', flexShrink:0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Email reminder */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', background:C.neutral, border:'1px solid '+C.border, borderRadius:'10px', padding:'14px 20px', maxWidth:'380px', width:'100%', marginBottom:'32px' }}>
              <i className="ti ti-mail" style={{ fontSize:'18px', color:C.primary, flexShrink:0 }} />
              <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:C.textSecondary, lineHeight:1.6, textAlign:'left' }}>
                Check your email for a confirmation and updates on your application status.
              </p>
            </div>

            <button onClick={() => navigate('/persona-select')}
              style={{ height:'44px', padding:'0 28px', background:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:'pointer', transition:'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.primaryHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.primary; }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
