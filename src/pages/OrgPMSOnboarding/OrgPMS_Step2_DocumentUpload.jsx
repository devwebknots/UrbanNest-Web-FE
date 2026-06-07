import React, { useState, useRef, useEffect } from 'react';
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
  textTertiary:'#94A3B8', white:'#FFFFFF', neutral:'#F8FAFC', danger:'#E53E3E',
  green:'#16A34A', infoBg:'#EFF6FF', infoBorder:'#BFDBFE', infoText:'#1D4ED8',
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

const hintS    = (error=false) => ({ fontFamily:F.body, fontSize:'11px', color:error?C.danger:C.textTertiary, marginTop:'4px' });
const dividerS = { borderTop:'1px solid '+C.border, margin:'20px 0' };

// ─── Extract a clean display filename from a server file URL ──────────────────
function cleanFilename(fileUrl) {
  if (!fileUrl) return null;
  const raw = fileUrl.split('/').pop().split('?')[0];
  return raw.replace(/_[A-Za-z0-9]{6,}(\.[^.]+)$/, '$1');
}

// ─── Already-uploaded doc display (read-only) ─────────────────────────────────
function AlreadyUploadedZone({ requirement, fileUrl, onReplace }) {
  const filename = cleanFilename(fileUrl);
  return (
    <div>
      <p style={{ margin:'0 0 8px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>
        {requirement.doc_label}{requirement.is_required ? ' *' : ' (Optional)'}
      </p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px', padding:'10px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <i className="ti ti-file-check" style={{ fontSize:'16px', color:C.green }} />
          <div>
            {filename ? (
              <>
                <span style={{ fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>{filename}</span>
                <p style={{ margin:'1px 0 0', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Uploaded — click Replace to change</p>
              </>
            ) : (
              <>
                <span style={{ fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>Already uploaded</span>
                <p style={{ margin:'1px 0 0', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Submitted in a previous session</p>
              </>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'#DCFCE7', border:'1px solid #BBF7D0', borderRadius:'20px', padding:'2px 8px' }}>
            <i className="ti ti-circle-check" style={{ fontSize:'11px', color:C.green }} />
            <span style={{ fontFamily:F.body, fontSize:'10px', color:C.green, fontWeight:600 }}>Uploaded</span>
          </div>
          <button type="button" onClick={onReplace}
            style={{ background:'none', border:'none', cursor:'pointer', fontFamily:F.body, fontSize:'11px', color:C.textSecondary, padding:'0', display:'flex', alignItems:'center', gap:'4px' }}>
            <i className="ti ti-refresh" style={{ fontSize:'12px' }} />
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload zone for a single required/optional doc ───────────────────────────
function DocZone({ requirement, file, onFile, onRemove, error }) {
  const ref    = useRef();
  const hasFile = !!file;
  const accept  = requirement.accepted_formats
    ? requirement.accepted_formats.split(',').map(f => '.'+f.trim().toLowerCase()).join(',')
    : '.pdf,.jpg,.jpeg,.png';

  return (
    <div>
      <p style={{ margin:'0 0 8px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>
        {requirement.doc_label}{requirement.is_required ? ' *' : ' (Optional)'}
      </p>
      {hasFile ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.neutral, border:'1px solid '+C.borderMedium, borderRadius:'8px', padding:'10px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <i className="ti ti-file-check" style={{ fontSize:'16px', color:C.green }} />
            <span style={{ fontFamily:F.body, fontSize:'12px', color:C.textPrimary }}>{file.name}</span>
            <span style={{ fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>({(file.size/1024/1024).toFixed(2)} MB)</span>
          </div>
          <button type="button" onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:C.textSecondary, fontSize:'18px', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()}
          style={{ border:'1.5px dashed '+(error?C.danger:C.borderMedium), borderRadius:'10px', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', cursor:'pointer', background:C.white, transition:'border-color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = error ? C.danger : C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = error ? C.danger : C.borderMedium; }}>
          <input ref={ref} type="file" accept={accept} style={{ display:'none' }}
            onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value=''; }} />
          <i className="ti ti-upload" style={{ fontSize:'18px', color:C.textTertiary }} />
          <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>Upload {requirement.doc_label}</p>
          {requirement.hint && <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary, textAlign:'center' }}>{requirement.hint}</p>}
        </div>
      )}
      {error && <p style={hintS(true)}>{error}</p>}
    </div>
  );
}

// ─── Multi-file zone (supporting / OTHER docs) ────────────────────────────────
// savedFiles: array of { name, url } — already on server (shown as green chips)
// newFiles:   array of File objects  — picked this session (shown as neutral chips)
function MultiDocZone({ requirement, savedFiles, newFiles, onAdd, onRemoveNew, onRemoveSaved, maxFiles = 5 }) {
  const ref = useRef();
  const totalCount = savedFiles.length + newFiles.length;
  const canAdd = totalCount < maxFiles;

  return (
    <div>
      <p style={{ margin:'0 0 8px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>
        {requirement.doc_label} (Optional)
      </p>

      {/* Upload drop zone — only shown if under limit */}
      {canAdd && (
        <div onClick={() => ref.current?.click()}
          style={{ border:'1.5px dashed '+C.borderMedium, borderRadius:'10px', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', cursor:'pointer', background:C.white, transition:'border-color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMedium; }}>
          <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}
            onChange={e => { onAdd(Array.from(e.target.files).slice(0, maxFiles - totalCount)); e.target.value=''; }} />
          <i className="ti ti-upload" style={{ fontSize:'18px', color:C.textTertiary }} />
          <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', fontWeight:600, color:C.textPrimary }}>{requirement.doc_label}</p>
          {requirement.hint && <p style={{ margin:0, fontFamily:F.body, fontSize:'11px', color:C.textTertiary, textAlign:'center' }}>{requirement.hint}</p>}
        </div>
      )}

      {/* Already-saved files from server — green chips */}
      {savedFiles.length > 0 && (
        <div style={{ marginTop: canAdd ? '8px' : '0', display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {savedFiles.map((f, i) => (
            <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'5px', padding:'4px 10px', fontFamily:F.body, fontSize:'11px', color:C.green }}>
              <i className="ti ti-file-check" style={{ fontSize:'11px', color:C.green }} />
              {cleanFilename(f.url) || f.name}
              <button type="button" onClick={() => onRemoveSaved(i)}
                style={{ background:'none', border:'none', cursor:'pointer', color:C.green, fontSize:'13px', padding:'0', lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Newly picked files this session — neutral chips */}
      {newFiles.length > 0 && (
        <div style={{ marginTop:'6px', display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {newFiles.map((f, i) => (
            <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:C.neutral, border:'1px solid '+C.borderMedium, borderRadius:'5px', padding:'4px 10px', fontFamily:F.body, fontSize:'11px', color:C.textPrimary }}>
              <i className="ti ti-file" style={{ fontSize:'11px', color:C.textSecondary }} />
              {f.name}
              <button type="button" onClick={() => onRemoveNew(i)}
                style={{ background:'none', border:'none', cursor:'pointer', color:C.textSecondary, fontSize:'13px', padding:'0', lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {totalCount >= maxFiles && (
        <p style={{ margin:'6px 0 0', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Maximum {maxFiles} files reached.</p>
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

export default function OrgPMS_Step2_DocumentUpload() {
  const navigate = useNavigate();

  const [userName,           setUserName]           = useState('');
  const [requirements,       setRequirements]       = useState([]);
  const [loadingDocs,        setLoadingDocs]        = useState(true);
  // New files picked this session — keyed by doc_type_code
  const [files,              setFiles]              = useState({});
  // Map of doc_type_code → file_url for named docs already on the server
  const [uploadedCodes,      setUploadedCodes]      = useState(new Map());
  // Already-saved OTHER/supporting docs from server — array of { name, url, id }
  const [savedSupportingFiles, setSavedSupportingFiles] = useState([]);
  // New supporting files picked this session — array of File objects
  const [newSupportingFiles, setNewSupportingFiles] = useState([]);
  const [saving,             setSaving]             = useState(false);
  const [errors,             setErrors]             = useState({});

  useEffect(() => {
    const token   = localStorage.getItem('access_token');
    const country = localStorage.getItem('org_pms_country') || 'US';
    const orgId   = localStorage.getItem('org_pms_id');
    if (!token) return;

    fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User'); })
      .catch(() => {});

    const reqFetch = fetch(
      `http://localhost:8001/api/admin/document-requirements/?persona_type=ORG_PMS&country=${country}&active=true`,
      { headers: { Authorization:'Bearer '+token } }
    ).then(r => r.json()).then(data => Array.isArray(data) ? data : []);

    const docFetch = orgId
      ? fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/documents/`, {
          headers: { Authorization:'Bearer '+token },
        })
          .then(r => r.ok ? r.json() : [])
          .then(data => Array.isArray(data) ? data : (data.results || []))
          .catch(() => [])
      : Promise.resolve([]);

    Promise.all([reqFetch, docFetch])
      .then(([reqs, existingDocs]) => {
        setRequirements(reqs);

        // Named docs (REG_CERT, TAX_ID, etc.) → Map for AlreadyUploadedZone
        const docMap = new Map(
          existingDocs
            .filter(d => d.doc_type !== 'OTHER')
            .map(d => [d.doc_type, d.file_url || ''])
        );
        setUploadedCodes(docMap);

        // OTHER/supporting docs → array of { name, url, id } for green chips
        const otherDocs = existingDocs
          .filter(d => d.doc_type === 'OTHER')
          .map(d => ({
            id:   d.id,
            url:  d.file_url || '',
            name: cleanFilename(d.file_url) || 'Supporting document',
          }));
        setSavedSupportingFiles(otherDocs);

        setLoadingDocs(false);
      })
      .catch(() => setLoadingDocs(false));
  }, []);

  const requiredDocs = requirements.filter(r => r.is_required && r.doc_type_code !== 'OTHER');
  const optionalDocs = requirements.filter(r => !r.is_required || r.doc_type_code === 'OTHER');

  const isDocSatisfied = (code) => uploadedCodes.has(code) || !!files[code];

  const handleContinue = async () => {
    const e = {};
    requiredDocs.forEach(req => {
      if (!isDocSatisfied(req.doc_type_code)) {
        e[req.doc_type_code] = `${req.doc_label} is required`;
      }
    });
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');
      const orgId = localStorage.getItem('org_pms_id');

      const uploadDoc = async (docTypeCode, file) => {
        const fd = new FormData();
        fd.append('org_pms_account', orgId);
        fd.append('doc_type', docTypeCode);
        fd.append('file', file);
        return fetch(`http://localhost:8001/api/admin/org-pms/${orgId}/documents/`, {
          method: 'POST',
          headers: { Authorization:'Bearer '+token },
          body: fd,
        });
      };

      // Only upload new files — skip already-uploaded named docs and saved supporting docs
      const uploads = [
        ...requiredDocs
          .filter(req => !!files[req.doc_type_code])
          .map(req => uploadDoc(req.doc_type_code, files[req.doc_type_code])),
        ...optionalDocs
          .filter(req => req.doc_type_code !== 'OTHER' && !!files[req.doc_type_code])
          .map(req => uploadDoc(req.doc_type_code, files[req.doc_type_code])),
        // Only new supporting files — not savedSupportingFiles (already on server)
        ...newSupportingFiles.map(f => uploadDoc('OTHER', f)),
      ];

      if (uploads.length > 0) {
        const results   = await Promise.all(uploads);
        const anyFailed = results.some(r => !r.ok);
        if (anyFailed) {
          setErrors({ api:'One or more documents failed to upload. Please try again.' });
          setSaving(false);
          return;
        }
      }

      navigate('/org-onboarding/step-3');
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
            <p style={{ margin:0, fontFamily:F.body, fontSize:'13px', color:C.textSecondary, lineHeight:1.6, maxWidth:'580px' }}>Upload the required documents to verify your organization. All documents are stored securely and reviewed within 24 hours.</p>
          </div>

          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
            <VerticalStepper current={2} />

            <div className="org-form-scroll" style={{ flex:1, overflowY:'auto', padding:'clamp(16px,2vw,24px) clamp(20px,3vw,48px) clamp(20px,2.5vw,36px)', minWidth:0 }}>
              <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'12px', padding:'clamp(20px,2.5vw,32px) clamp(20px,3vw,40px)', maxWidth:'780px', width:'100%', animation:'fadein 0.3s ease both' }}>

                <h2 style={{ margin:'0 0 4px', fontFamily:F.headline, fontSize:'18px', fontWeight:700, color:C.textPrimary }}>Document Upload</h2>
                <p style={{ margin:'0 0 18px', fontFamily:F.body, fontSize:'12px', color:C.textTertiary }}>
                  {loadingDocs ? 'Loading requirements…' : `${requiredDocs.length} required document${requiredDocs.length !== 1 ? 's' : ''} for your country`}
                </p>

                {errors.api && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize:'15px', color:'#DC2626', flexShrink:0 }} />
                    <span style={{ fontFamily:F.body, fontSize:'12px', color:'#DC2626' }}>{errors.api}</span>
                  </div>
                )}

                {/* Progress badges */}
                {!loadingDocs && requiredDocs.length > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
                    {requiredDocs.map(req => {
                      const satisfied = isDocSatisfied(req.doc_type_code);
                      return (
                        <div key={req.doc_type_code} style={{ display:'flex', alignItems:'center', gap:'5px', background:satisfied?'#F0FDF4':C.neutral, border:'1px solid '+(satisfied?'#BBF7D0':C.border), borderRadius:'20px', padding:'4px 10px' }}>
                          <i className={'ti '+(satisfied?'ti-circle-check':'ti-circle')} style={{ fontSize:'12px', color:satisfied?C.green:C.textTertiary }} />
                          <span style={{ fontFamily:F.body, fontSize:'11px', color:satisfied?C.green:C.textTertiary, fontWeight:satisfied?600:400 }}>{req.doc_label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={dividerS} />

                {loadingDocs ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'48px', gap:'10px' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid '+C.border, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }} />
                    <span style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary }}>Loading document requirements…</span>
                  </div>
                ) : requiredDocs.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px' }}>
                    <i className="ti ti-circle-check" style={{ fontSize:'32px', color:C.green }} />
                    <p style={{ fontFamily:F.body, fontSize:'13px', color:C.textSecondary, marginTop:'12px' }}>No required documents for your country. Click Continue to proceed.</p>
                  </div>
                ) : (
                  <>
                    <p style={{ margin:'0 0 14px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>Required Documents</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'20px', marginBottom:'8px' }}>
                      {requiredDocs.map(req => {
                        if (uploadedCodes.has(req.doc_type_code) && !files[req.doc_type_code]) {
                          return (
                            <AlreadyUploadedZone
                              key={req.doc_type_code}
                              requirement={req}
                              fileUrl={uploadedCodes.get(req.doc_type_code)}
                              onReplace={() => {
                                setUploadedCodes(prev => {
                                  const next = new Map(prev);
                                  next.delete(req.doc_type_code);
                                  return next;
                                });
                              }}
                            />
                          );
                        }
                        return (
                          <DocZone key={req.doc_type_code} requirement={req}
                            file={files[req.doc_type_code] || null}
                            onFile={f => { setFiles(p => ({ ...p, [req.doc_type_code]: f })); setErrors(p => ({ ...p, [req.doc_type_code]: '' })); }}
                            onRemove={() => setFiles(p => { const n = { ...p }; delete n[req.doc_type_code]; return n; })}
                            error={errors[req.doc_type_code]}
                          />
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Supporting / OTHER docs */}
                {!loadingDocs && optionalDocs.length > 0 && (
                  <>
                    <div style={dividerS} />
                    <p style={{ margin:'0 0 6px', fontFamily:F.body, fontSize:'10px', fontWeight:700, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                      Supporting Documents <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(Optional)</span>
                    </p>
                    <p style={{ margin:'0 0 12px', fontFamily:F.body, fontSize:'11px', color:C.textTertiary }}>Additional supporting files for verification.</p>
                    <MultiDocZone
                      requirement={optionalDocs[0]}
                      savedFiles={savedSupportingFiles}
                      newFiles={newSupportingFiles}
                      onAdd={f => setNewSupportingFiles(p => [...p, ...f].slice(0, 5 - savedSupportingFiles.length))}
                      onRemoveNew={i => setNewSupportingFiles(p => p.filter((_,idx) => idx !== i))}
                      onRemoveSaved={i => setSavedSupportingFiles(p => p.filter((_,idx) => idx !== i))}
                      maxFiles={5}
                    />
                  </>
                )}

                {/* Info banner */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:C.infoBg, border:'1px solid '+C.infoBorder, borderRadius:'8px', padding:'11px 14px', marginTop:'20px' }}>
                  <i className="ti ti-shield-check" style={{ fontSize:'15px', color:C.infoText, flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontFamily:F.body, fontSize:'12px', color:C.infoText, lineHeight:1.55 }}>Documents are encrypted and stored securely. They will be reviewed by our compliance team within 24 hours. You can continue setting up your account while verification is in progress.</p>
                </div>

                <div style={dividerS} />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <button onClick={() => navigate('/org-onboarding/step-1')} style={{ display:'flex', alignItems:'center', gap:'7px', height:'44px', padding:'0 22px', background:C.white, color:C.textPrimary, border:'1.5px solid '+C.borderMedium, borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    <i className="ti ti-arrow-left" style={{ fontSize:'14px' }} /> Back
                  </button>
                  <button onClick={handleContinue} disabled={saving}
                    style={{ display:'flex', alignItems:'center', gap:'8px', height:'44px', padding:'0 28px', background:saving?C.borderMedium:C.primary, color:C.white, border:'none', borderRadius:'9px', fontFamily:F.body, fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e => { if(!saving) e.currentTarget.style.background=C.primaryHover; }}
                    onMouseLeave={e => { if(!saving) e.currentTarget.style.background=C.primary; }}
                  >
                    {saving ? <><div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:C.white, animation:'spin 0.7s linear infinite' }} />Uploading…</> : <>Continue <i className="ti ti-arrow-right" style={{ fontSize:'14px' }} /></>}
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
