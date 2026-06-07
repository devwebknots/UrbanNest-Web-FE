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

const FL = { display:'block', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' };
const inputS = (error=false) => ({ width:'100%', height:'40px', boxSizing:'border-box', background:C.white, border:'1px solid '+(error?C.danger:C.borderMedium), borderRadius:'8px', padding:'0 12px', fontFamily:F.body, fontSize:'13px', color:C.textPrimary, outline:'none' });
const hintS  = (error=false) => ({ fontFamily:F.body, fontSize:'11px', color:error?C.danger:C.textTertiary, marginTop:'4px' });
const dividerS = { borderTop:'1px solid '+C.border, margin:'20px 0' };

function formatCardNumber(val) {
  return val.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(val) {
  const clean = val.replace(/\D/g,'').slice(0,4);
  return clean.length > 2 ? clean.slice(0,2) + '/' + clean.slice(2) : clean;
}
function detectBrand(num) {
  const n = num.replace(/\s/g,'');
  if (/^4/.test(n))           return 'Visa';
  if (/^5[1-5]/.test(n))      return 'Mastercard';
  if (/^3[47]/.test(n))       return 'Amex';
  if (/^6(?:011|5)/.test(n))  return 'Discover';
  return null;
}

// Brand icon map
function BrandIcon({ brand }) {
  const icons = { Visa:'ti-credit-card', Mastercard:'ti-credit-card', Amex:'ti-credit-card', Discover:'ti-credit-card' };
  return <i className={'ti '+(icons[brand]||'ti-credit-card')} style={{ fontSize:'22px', color:C.primary }} />;
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

export default function OrgPMS_Step6_Payment() {
  const navigate = useNavigate();

  const [userName,      setUserName]      = useState('');
  const [cardNumber,    setCardNumber]    = useState('');
  const [cardName,      setCardName]      = useState('');
  const [expiry,        setExpiry]        = useState('');
  const [cvv,           setCvv]           = useState('');
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});  // always starts empty — no stale errors on Back

  const [accountNumber, setAccountNumber] = useState('');
  const [country,       setCountry]       = useState('US');

  // ── Card-on-file state (pre-population on Back) ────────────────────────────
  // null  = loading,  false = no card saved,  object = { last4, card_brand } = card exists
  const [savedCard,     setSavedCard]     = useState(null);
  // When true, hide the card-on-file summary and show the entry form instead
  const [changingCard,  setChangingCard]  = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const orgId = localStorage.getItem('org_pms_id');
    if (!token) { setSavedCard(false); return; }

    // 1. Get user display name
    fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User'); })
      .catch(() => {});

    // 2. Fetch org record to get real account_number + country
    if (!orgId) { setSavedCard(false); return; }
    fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/`, { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.account_info) { setSavedCard(false); return; }
        const accNum = data.account_info.account_number || '';
        const cntry  = data.account_info.country || 'US';
        setAccountNumber(accNum);
        setCountry(cntry);

        // 3. Now check if a payment method already exists for this account
        if (!accNum) { setSavedCard(false); return; }
        return fetch(
          `http://localhost:8001/api/admin/billing/payment-methods/?account_number=${encodeURIComponent(accNum)}`,
          { headers:{ Authorization:'Bearer '+token } }
        );
      })
      .then(r => {
        if (!r || !r.ok) { setSavedCard(false); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        // API may return an array or paginated { results: [...] }
        const list = Array.isArray(data) ? data : (data.results || []);
        const card = list.find(pm => pm.is_default) || list[0] || null;
        setSavedCard(card || false);
      })
      .catch(() => setSavedCard(false));
  }, []);

  const brand = detectBrand(cardNumber);

  const validate = () => {
    const e = {};
    const rawNum = cardNumber.replace(/\s/g,'');
    if (rawNum.length < 13)  e.cardNumber = 'Enter a valid card number';
    if (!cardName.trim())    e.cardName   = 'Required';
    if (expiry.length < 5)   e.expiry     = 'Enter a valid expiry date (MM/YY)';
    if (cvv.length < 3)      e.cvv        = 'Enter a valid CVV';
    return e;
  };

  // ── Continue when card on file is confirmed (no re-entry needed) ───────────
  const handleConfirmExisting = () => {
    navigate('/org-onboarding/step-7');
  };

  // ── Continue after entering a new card ────────────────────────────────────
  const handleContinue = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    try {
      const token  = localStorage.getItem('access_token');
      const rawNum = cardNumber.replace(/\s/g,'');

      const res = await fetch('http://localhost:8001/api/admin/billing/payment-methods/', {
        method:  'POST',
        headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
        body: JSON.stringify({
          account_number:      accountNumber,
          persona_type:        'ORG_PMS',
          country:             country,
          gateway:             'MOCK',
          gateway_customer_id: 'mock_cus_' + Date.now(),
          payment_method_id:   'mock_pm_'  + Date.now(),
          last4:               rawNum.slice(-4),
          card_brand:          brand || 'UNKNOWN',
          is_default:          true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ api: data.detail || 'Could not save payment method. Please try again.' });
        setSaving(false);
        return;
      }

      navigate('/org-onboarding/step-7');
    } catch {
      setErrors({ api:'Connection error. Please check your connection.' });
      setSaving(false);
    }
  };

  // ── Loading state while we check for a saved card ─────────────────────────
  const isLoadingCard = savedCard === null;

  // ── Decide which mode to show ─────────────────────────────────────────────
  // Show card-on-file summary if: card exists AND user hasn't clicked "Use a different card"
  const showCardOnFile = !isLoadingCard && savedCard && !changingCard;
  // Show entry form if: no card saved, OR user clicked "Use a different card"
  const showEntryForm  = !isLoadingCard && (!savedCard || changingCard);

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
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>Add a payment method to activate your trial. You will not be charged until your trial period ends.</p>
          </div>

          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
            <VerticalStepper current={6} />

            <div className="org-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'560px', width:'100%', animation:'fadein 0.3s ease both' }}>

                <h2 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Payment Method</h2>
                <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>Your card is securely tokenized. No charges until your trial ends.</p>

                {errors.api && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                    <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{errors.api}</span>
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px', padding:'11px 14px', marginBottom:'20px' }}>
                  <i className="ti ti-gift" style={{ fontSize:'15px', color:C.green, flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:'#065F46', lineHeight:1.55 }}>Your trial is free. We tokenize your card now but will not charge it until your trial expires. You can cancel any time before then.</p>
                </div>

                <div style={dividerS} />

                {/* ── Loading spinner while checking for saved card ─────────── */}
                {isLoadingCard && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'32px', gap:'10px' }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
                    <span style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary }}>Checking payment details…</span>
                  </div>
                )}

                {/* ── Card on file summary (Back navigation) ───────────────── */}
                {showCardOnFile && (
                  <div>
                    <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Card on File</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px', background:C.neutral, border:'1.5px solid '+C.borderMedium, borderRadius:'10px', padding:'16px 18px', marginBottom:'16px' }}>
                      <BrandIcon brand={savedCard.card_brand} />
                      <div style={{ flex:1 }}>
                        <p style={{ margin:'0 0 2px', fontFamily:F.body, fontSize:'13px', fontWeight:700, color:C.textPrimary }}>
                          {savedCard.card_brand || 'Card'} ending in {savedCard.last4}
                        </p>
                        <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Saved and tokenized — no changes needed</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'20px', padding:'3px 10px' }}>
                        <i className="ti ti-circle-check" style={{ fontSize:'12px', color:C.green }} />
                        <span style={{ fontFamily:F.body, fontSize:'11px', color:C.green, fontWeight:600 }}>Saved</span>
                      </div>
                    </div>

                    <button type="button" onClick={() => { setChangingCard(true); setErrors({}); }}
                      style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, padding:'0', marginBottom:'4px' }}>
                      <i className="ti ti-refresh" style={{ fontSize:'13px' }} />
                      Use a different card
                    </button>
                  </div>
                )}

                {/* ── Card entry form (first visit or "Use a different card") ── */}
                {showEntryForm && (
                  <>
                    <div style={{ marginBottom:'16px' }}>
                      <span style={FL}>Card Number *</span>
                      <div style={{ position:'relative' }}>
                        <input style={{ ...inputS(!!errors.cardNumber), paddingRight:'60px' }}
                          placeholder="1234 5678 9012 3456" value={cardNumber} maxLength={19}
                          onChange={e => { setCardNumber(formatCardNumber(e.target.value)); setErrors(p=>({...p,cardNumber:''})); }} />
                        {brand && (
                          <span style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary }}>{brand}</span>
                        )}
                      </div>
                      {errors.cardNumber && <p style={hintS(true)}>{errors.cardNumber}</p>}
                    </div>

                    <div style={{ marginBottom:'16px' }}>
                      <span style={FL}>Cardholder Name *</span>
                      <input style={inputS(!!errors.cardName)} placeholder="As it appears on the card"
                        value={cardName} onChange={e => { setCardName(e.target.value); setErrors(p=>({...p,cardName:''})); }} />
                      {errors.cardName && <p style={hintS(true)}>{errors.cardName}</p>}
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                      <div>
                        <span style={FL}>Expiry Date *</span>
                        <input style={inputS(!!errors.expiry)} placeholder="MM/YY" value={expiry} maxLength={5}
                          onChange={e => { setExpiry(formatExpiry(e.target.value)); setErrors(p=>({...p,expiry:''})); }} />
                        {errors.expiry && <p style={hintS(true)}>{errors.expiry}</p>}
                      </div>
                      <div>
                        <span style={FL}>CVV *</span>
                        <input style={inputS(!!errors.cvv)} placeholder="•••" type="password" maxLength={4}
                          value={cvv} onChange={e => { setCvv(e.target.value.replace(/\D/g,'')); setErrors(p=>({...p,cvv:''})); }} />
                        {errors.cvv && <p style={hintS(true)}>{errors.cvv}</p>}
                      </div>
                    </div>

                    {/* "Cancel change" link — only shown when replacing a saved card */}
                    {changingCard && savedCard && (
                      <button type="button" onClick={() => { setChangingCard(false); setErrors({}); setCardNumber(''); setCardName(''); setExpiry(''); setCvv(''); }}
                        style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'12px', color:C.textSecondary, padding:'0', marginBottom:'4px' }}>
                        <i className="ti ti-arrow-left" style={{ fontSize:'13px' }} />
                        Keep existing card
                      </button>
                    )}
                  </>
                )}

                {!isLoadingCard && (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'8px', marginBottom:'8px' }}>
                      <i className="ti ti-lock" style={{ fontSize:'13px', color:C.textTertiary }} />
                      <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>256-bit SSL encryption. We never store your full card number or CVV.</span>
                    </div>

                    <div style={dividerS} />

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <button onClick={() => navigate('/org-onboarding/step-5')} style={{ display:'flex', alignItems:'center', gap:'7px', height:'44px', padding:'0 22px', background:C.white, color:C.textPrimary, border:'1.5px solid '+C.borderMedium, borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                        <i className="ti ti-arrow-left" style={{ fontSize:'14px' }} /> Back
                      </button>
                      <button
                        onClick={showCardOnFile ? handleConfirmExisting : handleContinue}
                        disabled={saving}
                        style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:saving?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', transition:'background 0.15s' }}
                        onMouseEnter={e => { if(!saving) e.currentTarget.style.background=C.primaryHover; }}
                        onMouseLeave={e => { if(!saving) e.currentTarget.style.background=C.primary; }}
                      >
                        {saving
                          ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Processing…</>
                          : showCardOnFile
                            ? <>Continue <i className="ti ti-arrow-right" style={{ fontSize:'14px' }} /></>
                            : <><i className="ti ti-lock" style={{ fontSize:'13px' }} />Secure &amp; Continue</>
                        }
                      </button>
                    </div>
                  </>
                )}
              </div>
              <p style={{ textAlign:'center', fontFamily:F.body, fontSize:'10px', color:C.textTertiary, margin:'24px 0 16px', letterSpacing:'0.04em' }}>© 2026 URBANNEST. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
