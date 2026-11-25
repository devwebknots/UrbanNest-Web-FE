// src/pages/PMPortal/Approvals/PMApprovalsOverview.jsx
//
// PM Portal — Approvals overview (Design System v2 redesign, layout from Downloads/image 140.png).
//
//   NavPM sidebar │ PM top bar                                    (PMPageShell)
//                 │ wave backdrop · Breadcrumb · "Approvals" header
//                 │   → top TabBar (underline, counts) → HeroStats (the Listings hero stats row), one spaced block
//                 │ one panel, 3 divided columns (un2-cols): Priority Snapshot │ Approval Trend │ Status Breakdown
//                 │ All Pending Approvals — search · Status / Property / Sort menus · DataTable
//                 │ PageFooter
//
// Data, filters and actions are unchanged from the v1 page: GET /approvals/ (category · status · property ·
// search · ordering), GET /properties/, approve / reject (+ ?type=property|unit), detail GET /approvals/:id/.
// Pop-ups use the standard v2 Modal (details, reject reason, document preview, error) and SuccessModal.

import React, { useState, useEffect, useCallback } from 'react';
import { PMPageShell, Breadcrumb, PageFooter, ImageBackdrop } from '../../../components/layout';
import {
  TabBar, HeroStats, CountUp, DataTable, EmptyState, FilterMenu, ActionTray, MultiLineChart, SegmentDonut, rampColor, segmentMidpoints,
  Modal, ModalSection, SuccessModal, FormField, FIELD2,
} from '../../../components/ui';
import {
  C2, TONES2, ACCENT2, STATUS2, accentTone, FS2, FW2, R2, SP2, SZ2, LAYOUT2, T2, UI2, pad,
} from '../../../constants';
import backdropArt from '../../../assets/landlord/wizard-backdrop.jpg';   // soft blue wave lines (same art as Create Listing)
// TEMP SAMPLE profile pictures (UI preview only) — square placeholder headshots (randomuser.me, saved locally in
// assets/avatars). A real photo from the API (avatar_url / photo_url) always wins; remove SAMPLE_FACES + these
// files once applicants have photos.
import faceA from '../../../assets/avatars/sample-women-44.jpg';
import faceB from '../../../assets/avatars/sample-men-32.jpg';
import faceC from '../../../assets/avatars/sample-women-68.jpg';
import faceD from '../../../assets/avatars/sample-men-75.jpg';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
// Session 52 fix: landlord_profile.id_document_1/2/3 come back from the API
// as relative paths (e.g. "/media/landlord/documents/...") — not absolute
// URLs like Property/Unit gallery fields, which use ImageField(use_url=True)
// with request context. An <a href> to a relative path resolves against
// THIS page's own origin (the frontend's CloudFront domain, which serves no
// /media/ path at all), landing on a blank page. Resolve against the API's
// own origin instead.
const MEDIA_BASE = API.replace(/\/api\/?$/, '');
function resolveMediaUrl(u) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return MEDIA_BASE + (u.startsWith('/') ? u : '/' + u);
}

// TEMP SAMPLE faces (see imports) — already square, centred headshots: they simply fill the round avatar
const SAMPLE_FACES = [faceA, faceB, faceC, faceD];

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'ownership',   label: 'Ownership' },
  { id: 'onboarding',  label: 'Onboarding',  future: true },
  { id: 'maintenance', label: 'Maintenance', future: true },
  { id: 'financial',   label: 'Financial',   future: true },
];

// Status → label + tone for UI2.statusPill (dot + coloured word, the v2 table status) — standard TONES2 like Listings. No yellow.
const STATUS_CFG = {
  SUBMITTED: { label: 'Submitted',      tone: accentTone(ACCENT2.violet) },
  PENDING:   { label: 'Pending invite', tone: TONES2.primary },
  // positive end states = the standard success tone, same as Listings "Active" / Residents "Active" (green = real success only)
  ACCEPTED:  { label: 'Accepted',       tone: TONES2.success },
  VERIFIED:  { label: 'Verified',       tone: TONES2.success },
  REJECTED:  { label: 'Rejected',       tone: TONES2.error },
  EXPIRED:   { label: 'Expired',        tone: TONES2.neutral },
  CANCELLED: { label: 'Cancelled',      tone: TONES2.neutral },
};

const STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PENDING',   label: 'Pending invite' },
  { value: 'VERIFIED',  label: 'Verified' },
  { value: 'REJECTED',  label: 'Rejected' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const TREND_SERIES = [   // line colour (chart) + tone (legend chip)
  { key: 'Submitted', color: STATUS2.submitted, tone: TONES2.primary },
  { key: 'Approved',  color: STATUS2.approved,  tone: TONES2.success },
  { key: 'Rejected',  color: STATUS2.rejected,  tone: TONES2.error },
];

// ── Page-specific layout only (shared patterns come from UI2 / v2 components) ──
const S = {
  headBlock: UI2.pageHead.block,   // shared header-block spacing (UI2.pageHead) — same on PM Listings
  head:      { ...UI2.stack(SP2.xs) },                 // title → subtitle SP2.xs apart (= Portfolio WaveHero)
  tabs:      UI2.pageHead.next,    // top tabs, SP2.xl under the subtitle
  stats:     UI2.pageHead.stats,   // stats row, SP2.xxl under the tabs
  title:     { ...T2.heroHeading, margin: 0 },        // same heading as Portfolio "Property List" (WaveHero title)
  sub:       { ...T2.lead, margin: 0 },               // same subtitle as Portfolio (Playfair 13, grey)
  // insights panel
  panel:     { ...UI2.card },
  col:       { ...UI2.stack(SP2.lg), minWidth: 0 },
  colTop:    { ...UI2.rowBetween(SP2.sm), minHeight: SZ2.control.sm },
  colTitle:  { ...UI2.cardTitle, ...UI2.truncate },
  rangePill: { ...UI2.pill(TONES2.neutral), color: C2.textSecondary, background: C2.surfaceMuted },
  chartBox:  { position: 'relative', height: SZ2.chart },
  // Approval Trend header (CardHeader pieces: tinted icon box · title · subtitle — no divider) + range pill
  trendTop:  { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP2.sm, flexWrap: 'wrap' },
  trendHead: { ...UI2.row(SP2.md), alignItems: 'flex-start', minWidth: 0, flex: 1 },
  trendIcon: { ...UI2.iconBox(SZ2.icon.md, TONES2.primary) },
  // legend chips — tinted pill · status dot · name · count, hairline between chips
  legend:    { ...UI2.row(SP2.sm), justifyContent: 'center', flexWrap: 'wrap', rowGap: SP2.sm },
  legendChip:(tone) => ({ ...UI2.row(SP2.sm), padding: pad(SP2.xs, SP2.xs, SP2.xs, SP2.md), borderRadius: R2.pill, background: tone.tint, fontSize: FS2.sm, color: C2.textPrimary, whiteSpace: 'nowrap' }),
  legendCount:(tone) => ({ minWidth: SZ2.icon.xs, padding: pad(0, SP2.sm), borderRadius: R2.pill, background: tone.soft, color: tone.fg, fontSize: FS2.xs, fontWeight: FW2.semibold, lineHeight: `${SZ2.icon.xs}px`, textAlign: 'center' }),
  legendSep: { width: SZ2.hairline, height: SZ2.icon.xs, background: C2.border },
  legendDot: (color) => ({ ...UI2.dot(color) }),
  donutWrap: { ...UI2.center, paddingTop: SP2.xs },
  // priority snapshot
  prio:      { display: 'flex', gap: SP2.md, minWidth: 0 },
  prioDot:   (tone) => ({ ...UI2.statusDot(tone), marginTop: SP2.xs }),
  prioBody:  { ...UI2.stack(SP2.xs), flex: 1, minWidth: 0 },
  prioTitle: { ...UI2.text.rowTitle },   // standard item title (Inter 13 Regular) — same as ListRow / tiles
  prioEmpty: { ...UI2.text.meta },       // standard description line under an item title (Playfair 11, muted)
  prioRow:   { ...UI2.row(SP2.sm), minWidth: 0 },
  prioName:  { ...UI2.text.rowTitle, ...UI2.truncate, flex: 1, minWidth: 0 },
  prioTag:   (tone) => ({ ...UI2.pill(tone), flexShrink: 0 }),
  // table section
  // heading row → table, LAYOUT2.sectionGap apart; SP2.sm extra air above the heading (after the panel)
  section:   { ...UI2.stack(LAYOUT2.sectionGap), minWidth: 0, paddingTop: SP2.sm },
  secHead:   { ...UI2.rowBetween(SP2.md), flexWrap: 'wrap' },
  secTitle:  { ...T2.sectionTitle, fontSize: FS2.xl, margin: 0 },
  tools:     UI2.toolbar.tools,
  search:    UI2.toolbar.search,       // shared list-toolbar pieces (UI2.toolbar — Listings is the reference)
  searchIcon:UI2.toolbar.searchIcon,
  input:     UI2.searchInput,
  menuWrap:  UI2.toolbar.menuWrap,
  toolBtn:   UI2.toolbar.button,
  applicant: { ...UI2.row(SP2.md), minWidth: 0 },
  // profile picture in the same round avatar (size / ring unchanged) — photo fills it, cropped to the face
  photo:     (url, size = 'cover', pos = 'center') => ({ ...UI2.avatar(SZ2.icon.md, TONES2.neutral), backgroundImage: `url(${url})`, backgroundSize: size, backgroundPosition: pos, backgroundRepeat: 'no-repeat' }),
  nameCol:   { minWidth: 0 },
  name:      { ...UI2.text.rowTitle, ...UI2.truncate },
  email:     { ...UI2.text.meta, ...UI2.truncate },
  capitalize:{ textTransform: 'capitalize' },
  equity:    { color: C2.textSecondary },                // plain text after the reference (no tag box in tables)
  dash:      { color: C2.textMuted },
  actions:   { ...UI2.row(SP2.xs) },   // left-aligned under the "Actions" heading, like every other column
  // row icon button = the unit page's eye button: small round, tone glyph on its soft tint · grey + not-allowed when off
  act:       (tone, on) => UI2.btn.rowIcon(tone, on),   // shared round row action (UI2.btn.rowIcon)
  // detail pop-up
  info:      (first) => ({ ...UI2.kvRow(first) }),
  infoVal:   { ...UI2.kvVal, wordBreak: 'break-word' },
  doc:       { ...UI2.row(SP2.md), padding: pad(SP2.sm, SP2.md), borderRadius: R2.md, background: C2.surfaceMuted },
  docIcon:   (on) => ({ ...UI2.iconBox(SZ2.icon.sm, on ? TONES2.primary : TONES2.neutral) }),
  docText:   { flex: 1, minWidth: 0 },
  docBtn:    { ...UI2.btn.soft, ...UI2.btnSm },
  check:     (pass) => ({ ...UI2.checkBadge, ...(pass ? {} : { background: C2.errorLight, color: C2.errorDark }) }),
  checkRow:  (first) => ({ ...UI2.kvRow(first), justifyContent: 'flex-start', gap: SP2.sm }),
  checkVal:  (pass) => ({ marginLeft: 'auto', fontWeight: FW2.semibold, color: pass ? C2.primaryDark : C2.errorDark }),
  reason:    { ...UI2.errorBanner },
  preview:   { display: 'flex', justifyContent: 'center', background: C2.surfaceMuted, borderRadius: R2.md, overflow: 'hidden' },
  previewImg:{ maxWidth: '100%', height: 'auto', display: 'block' },
  previewPdf:{ width: '100%', height: '70vh', border: 'none' },
  hint:      { ...T2.caption, marginTop: SP2.xs },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const Dash = () => <span style={S.dash}>—</span>;

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return <span style={UI2.statusPill(cfg.tone)}><span style={UI2.statusDot(cfg.tone)} />{cfg.label}</span>;
}

function InfoRows({ rows }) {
  const shown = rows.filter(([, v]) => v || v === 0);
  if (shown.length === 0) return <div style={UI2.emptyInline}>No details yet.</div>;
  return shown.map(([label, value], i) => (
    <div key={label} style={S.info(i === 0)}>
      <span>{label}</span>
      <span style={S.infoVal}>{value}</span>
    </div>
  ));
}

// ── Detail pop-up (was the slide-in panel) ──────────────────────────────────
function DetailModal({ record, onClose, onApprove, onReject, actionLoading }) {
  const [detail, setDetail]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [docPreview, setDocPreview] = useState(null); // { label, url }

  useEffect(() => {
    if (!record) return;
    setLoading(true);
    const token = localStorage.getItem('access_token');
    // PropertyOwnership and UnitOwnership are separate tables with independent
    // ids, so `type` (derived from sub_category) is required to resolve the
    // correct record — see PMApprovalsOverview's recordType() helper.
    const type = record.sub_category === 'Unit' ? 'unit' : 'property';
    fetch(`${API}/approvals/${record.id}/?type=${type}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [record?.id, record?.sub_category]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!record) return null;

  const profile     = detail?.landlord_profile;
  const invite      = detail?.invite;
  const ownership   = detail?.ownership;
  const isDecided   = record.status === 'ACCEPTED' || record.status === 'REJECTED';
  const isSubmitted = record.status === 'SUBMITTED';
  const cfg         = STATUS_CFG[record.status] || STATUS_CFG.PENDING;

  const address = profile ? [
    profile.street_address_1, profile.city, profile.state, profile.zip_code, profile.country,
  ].filter(Boolean).join(', ') : null;

  const equity = ownership?.equity_pct
    ? `${parseFloat(ownership.equity_pct).toFixed(0)}%`
    : record.equity_pct ? `${parseFloat(record.equity_pct).toFixed(0)}%` : null;

  const docs = [
    // Session 52 fix: these labels must mirror the owner-submission
    // wizard's own document names (VerifyOwnershipPage.jsx), not the
    // old generic "Front/Back/Additional" placeholders.
    { label: 'Government ID / Driving License', url: resolveMediaUrl(profile?.id_document_1) },
    { label: 'Passport',                         url: resolveMediaUrl(profile?.id_document_2) },
    { label: 'Property Ownership Proof',         url: resolveMediaUrl(profile?.id_document_3) },
  ];

  // Session 52: one "Documents uploaded" check (Government ID + Property Ownership Proof — doc slots 1 and 3),
  // matching the is_required flags enforced at submission time in VerifyOwnershipPage.jsx.
  const checks = [
    { label: 'Profile submitted',  pass: record.status === 'SUBMITTED' || isDecided },
    { label: 'Documents uploaded', pass: !!profile?.id_document_1 && !!profile?.id_document_3 },
    { label: 'Address provided',   pass: !!profile?.street_address_1 },
    { label: 'Phone provided',     pass: !!profile?.phone },
  ];

  const footer = isSubmitted ? (
    <>
      <button type="button" className="un2-btn" style={UI2.btn.soft} disabled={actionLoading} onClick={() => onReject(record)}>
        <i className="ti ti-x" style={UI2.btnIcon} aria-hidden="true" /> Reject
      </button>
      <button type="button" className="un2-btn" style={UI2.btn.brand} disabled={actionLoading} onClick={() => onApprove(record.id, record.sub_category)}>
        {actionLoading
          ? <><i className="ti ti-loader-2 un2-spin" style={UI2.btnIcon} aria-hidden="true" /> Processing…</>
          : <><i className="ti ti-check" style={UI2.btnIcon} aria-hidden="true" /> Approve Ownership</>}
      </button>
    </>
  ) : (
    <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={onClose}>Close</button>
  );

  return (
    <>
      <Modal
        size="lg"
        eyebrow={cfg.label}
        title={record.owner_name || '—'}
        subtitle={record.email}
        onClose={onClose}
        footer={footer}
      >
        {loading ? (
          <div style={UI2.stack(SP2.md)}>
            {[0, 1, 2, 3].map(i => <div key={i} className="un2-skel" style={UI2.skeleton('100%', SZ2.field)} />)}
          </div>
        ) : (
          <>
            <ModalSection icon="ti-building" title="Property">
              <InfoRows rows={[
                ['Property',     record.property_name],
                ['Equity share', equity],
                ['Role',         ownership?.ownership_role?.replace(/_/g, ' ')],
                ['Invite sent',  fmtDate(invite?.created_at)],
                ['Submitted',    fmtDate(record.submitted_at)],
                ['Expires',      fmtDate(invite?.expires_at)],
              ]} />
            </ModalSection>

            <ModalSection icon="ti-user" title="Personal Details">
              <InfoRows rows={[
                ['First name', profile?.first_name],
                ['Last name',  profile?.last_name],
                ['Email',      record.email],
                ['Phone',      profile?.phone],
                ['Occupation', profile?.occupation],
                ['ID type',    profile?.id_type],
                ['ID number',  profile?.id_number],
                ['Address',    address],
              ]} />
            </ModalSection>

            <ModalSection icon="ti-files" title="Documents">
              <div style={UI2.stack(SP2.sm)}>
                {docs.map(doc => (
                  <div key={doc.label} style={S.doc}>
                    <span style={S.docIcon(!!doc.url)}><i className={`ti ${doc.url ? 'ti-file-description' : 'ti-file'}`} aria-hidden="true" /></span>
                    <div style={S.docText}>
                      <div style={{ ...UI2.text.rowTitle, ...UI2.truncate }}>{doc.label}</div>
                      <div style={UI2.text.meta}>{doc.url ? 'Uploaded' : 'Not uploaded'}</div>
                    </div>
                    {doc.url && (
                      <button type="button" className="un2-btn" style={S.docBtn} onClick={() => setDocPreview({ label: doc.label, url: doc.url })}>
                        View <i className="ti ti-external-link" style={UI2.btnIcon} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </ModalSection>

            <ModalSection icon="ti-checklist" title="Readiness Checks">
              {checks.map(({ label, pass }, i) => (
                <div key={label} style={S.checkRow(i === 0)}>
                  <span style={S.check(pass)}><i className={`ti ${pass ? 'ti-check' : 'ti-x'}`} aria-hidden="true" /></span>
                  <span style={{ color: C2.textPrimary }}>{label}</span>
                  <span style={S.checkVal(pass)}>{pass ? 'Pass' : 'Missing'}</span>
                </div>
              ))}
            </ModalSection>

            {record.status === 'REJECTED' && detail?.rejection_reason && (
              <ModalSection icon="ti-alert-circle" title="Rejection Reason">
                <div style={S.reason}>{detail.rejection_reason}</div>
              </ModalSection>
            )}
          </>
        )}
      </Modal>

      {docPreview && (
        <DocumentPreviewModal label={docPreview.label} url={docPreview.url} onClose={() => setDocPreview(null)} />
      )}
    </>
  );
}

// ── Session 52 fix: in-page document viewer (images inline, PDFs in an iframe) ──
function DocumentPreviewModal({ label, url, onClose }) {
  const isPdf = /\.pdf(\?|$)/i.test(url || '');
  return (
    <Modal
      size="lg"
      media={false}
      icon="ti-file-description"
      title={label}
      onClose={onClose}
      footer={(
        <>
          <a href={url} target="_blank" rel="noreferrer" className="un2-btn" style={UI2.btn.soft}>
            Open original <i className="ti ti-external-link" style={UI2.btnIcon} aria-hidden="true" />
          </a>
          <button type="button" className="un2-btn" style={UI2.btn.brand} onClick={onClose}>Done</button>
        </>
      )}
    >
      <div style={S.preview}>
        {isPdf
          ? <iframe src={url} title={label} style={S.previewPdf} />
          : <img src={url} alt={label} style={S.previewImg} />}
      </div>
    </Modal>
  );
}

// ── Reject reason pop-up ────────────────────────────────────────────────────
function RejectModal({ record, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const name = record?.owner_name || record?.email || '—';
  const prop = record?.property_name || '—';
  const ok = !!reason.trim();
  return (
    <Modal
      variant="confirm"
      icon="ti-x"
      tone={TONES2.error}
      title="Reject Application"
      subtitle={`${name} — ${prop}`}
      onClose={onCancel}
      footer={(
        <>
          <button type="button" className="un2-btn" style={UI2.btn.soft} onClick={onCancel}>Cancel</button>
          <button type="button" className="un2-btn" style={UI2.btn.danger} disabled={!ok || loading} onClick={() => ok && onConfirm(reason)}>
            {loading
              ? <><i className="ti ti-loader-2 un2-spin" style={UI2.btnIcon} aria-hidden="true" /> Processing…</>
              : <><i className="ti ti-x" style={UI2.btnIcon} aria-hidden="true" /> Confirm Rejection</>}
          </button>
        </>
      )}
    >
      <div style={UI2.stack(SP2.md)}>
        <div style={UI2.text.label}>
          Please provide a reason for rejection. This will be sent to the owner and recorded in the audit log.
        </div>
        <FormField label="Reason">
          <textarea
            className="un2-focus-ring"
            style={FIELD2.textarea}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Documents provided are incomplete or illegible. Please resubmit with clear copies of all required documents."
          />
          {!ok && <div style={S.hint}>A reason is required before rejecting.</div>}
        </FormField>
      </div>
    </Modal>
  );
}

// ── Priority snapshot item ──────────────────────────────────────────────────
function PriorityItem({ tone, title, empty, rows, onView }) {
  return (
    <div style={S.prio}>
      <span style={S.prioDot(tone)} aria-hidden="true" />
      <div style={S.prioBody}>
        <div style={S.prioTitle}>{title}</div>
        {rows.length === 0
          ? <div style={S.prioEmpty}>{empty}</div>
          : rows.map(r => (
            <div key={r.id} style={S.prioRow}>
              <span style={S.prioName} title={`${r.name} · ${r.detail}`}>{r.name} <span style={UI2.text.meta}>· {r.detail}</span></span>
              <span style={S.prioTag(tone)}>{r.tag}</span>
              <button type="button" style={S.act(TONES2.primary, true)} onClick={() => onView(r.record)} aria-label={`View ${r.name}`} title="View details">
                <i className="ti ti-eye" aria-hidden="true" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function PMApprovalsOverview() {
  const [activeTab,      setActiveTab]      = useState('all');
  const [approvals,      setApprovals]      = useState([]);
  const [stats,          setStats]          = useState({ pending: 0, approvedMonth: 0, rejectedMonth: 0, total: 0 });
  const [trendData,      setTrendData]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [searchText,     setSearchText]     = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [sortOrder,      setSortOrder]      = useState('newest');
  const [properties,     setProperties]     = useState([]);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [popup,          setPopup]          = useState(null);

  // Pop-up state
  const [panelRecord,  setPanelRecord]  = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const token   = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchApprovals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('category', activeTab);
      if (statusFilter)   params.set('status',   statusFilter);
      if (propertyFilter) params.set('property', propertyFilter);
      if (searchText)     params.set('search',   searchText);
      params.set('ordering', sortOrder === 'newest' ? '-created_at' : 'created_at');
      const res = await fetch(`${API}/approvals/?${params}`, { headers });
      if (!res.ok) throw new Error('Failed to load approvals');
      const data = await res.json();
      setApprovals(data.results ?? data);
      if (data.stats) setStats(data.stats);
      if (data.trend) setTrendData(data.trend);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [activeTab, statusFilter, propertyFilter, searchText, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch(`${API}/properties/`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setProperties(data.results ?? data);
    } catch (_) {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchApprovals(); },  [fetchApprovals]);
  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const showSuccess = (msg) => setPopup({ type: 'success', title: 'Action successful', message: msg });
  const showError   = (msg) => setPopup({ type: 'error',   title: 'Action not allowed', message: msg });

  // PropertyOwnership and UnitOwnership are separate tables with independent
  // ids, so every approve/reject/detail call must say which table `id`
  // belongs to — otherwise the backend can match an unrelated row that
  // happens to share the same numeric id in the other table.
  const recordType = (subCategory) => (subCategory === 'Unit' ? 'unit' : 'property');

  const handleApprove = async (id, subCategory) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/approvals/${id}/approve/?type=${recordType(subCategory)}`, { method: 'POST', headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Approval failed');
      }
      showSuccess('Ownership approved successfully.');
      setPanelRecord(null);
      fetchApprovals();
    } catch (e) { showError(e.message); }
    finally { setActionLoading(false); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/approvals/${rejectTarget.id}/reject/?type=${recordType(rejectTarget.sub_category)}`, {
        method: 'POST', headers, body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      showSuccess('Application rejected.');
      setRejectTarget(null);
      setPanelRecord(null);
      fetchApprovals();
    } catch (e) { showError(e.message); }
    finally { setActionLoading(false); }
  };

  const now = new Date();
  const daysSince = (d) => {
    if (!d) return null;
    const days = Math.floor((now - new Date(d)) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  // Priority snapshot
  const submitted      = approvals.filter(a => a.status === 'SUBMITTED');
  const waitingLongest = [...submitted].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  const expiringSoon   = approvals
    .filter(a => a.status === 'PENDING' && a.expires_at)
    .map(a => ({ ...a, daysLeft: Math.ceil((new Date(a.expires_at) - now) / 86400000) }))
    .filter(a => a.daysLeft <= 3 && a.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const incompleteDocs = submitted.filter(a => !a.id_document_1 || !a.id_document_2);
  const snapRow = (a, tag) => ({ id: a.id, name: a.owner_name || a.email, detail: a.property_name, tag, record: a });

  // Status breakdown
  const realSegments = [
    { label: 'Pending',   value: approvals.filter(a => a.status === 'PENDING').length,   color: STATUS2.pending },
    { label: 'Submitted', value: approvals.filter(a => a.status === 'SUBMITTED').length, color: STATUS2.submitted },
    { label: 'Approved',  value: approvals.filter(a => a.status === 'ACCEPTED').length,  color: STATUS2.approved },
    { label: 'Rejected',  value: approvals.filter(a => a.status === 'REJECTED').length,  color: STATUS2.rejected },
    { label: 'Expired',   value: approvals.filter(a => a.status === 'EXPIRED').length,   color: STATUS2.expired },
  ];
  // TEMP SAMPLE DATA (UI preview only) — shown ONLY while every real count is 0, so real data always wins.
  // Remove SAMPLE_SEGMENTS + this fallback once the breakdown has real data.
  const SAMPLE_SEGMENTS = [
    { label: 'Pending',   value: 3, color: STATUS2.pending },
    { label: 'Submitted', value: 2, color: STATUS2.submitted },
    { label: 'Approved',  value: 1, color: STATUS2.approved },
  ];
  const segments = realSegments.some(s => s.value > 0) ? realSegments : SAMPLE_SEGMENTS;
  // Ring = one blue gradient (STATUS2.ramp); each legend dot takes the colour at the middle of its part
  const ringMids = segmentMidpoints(segments);
  const shownSegments = segments.filter(s => s.value > 0).map((s, i) => ({ ...s, color: rampColor(STATUS2.ramp, ringMids[i]) }));

  // Approval trend
  const chartTrend = trendData.length > 0 ? trendData : [
    { week: 'Wk 1', Submitted: 0, Approved: 0, Rejected: 0 },
    { week: 'Wk 2', Submitted: 0, Approved: 0, Rejected: 0 },
    { week: 'Wk 3', Submitted: 0, Approved: 0, Rejected: 0 },
    { week: 'Wk 4', Submitted: 0, Approved: 0, Rejected: 0 },
  ];
  const trendLabels = chartTrend.map(t => t.week);
  const trendSeries = TREND_SERIES.map(s => ({ label: s.key, color: s.color, tone: s.tone, values: chartTrend.map(t => Number(t[s.key]) || 0) }));

  const tabCounts = {
    all:       approvals.length,
    ownership: approvals.filter(a => a.category === 'ownership').length,
  };

  const filteredRows = approvals.filter(row => {
    if (activeTab !== 'all' && row.category !== activeTab) return false;
    if (statusFilter   && row.status !== statusFilter) return false;
    if (propertyFilter && String(row.property_id) !== propertyFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        row.owner_name?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        row.property_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Summary stats (HeroStats items: icon · tone · label · value) ──
  const kpiTotal = Number(stats.total) || 0;
  const KPIS = [
    { tone: TONES2.primary,                icon: 'ti-file-text',    label: 'Pending Review',      value: <CountUp value={stats.pending || 0} /> },
    { tone: accentTone(ACCENT2.teal),      icon: 'ti-circle-check', label: 'Approved This Month', value: <CountUp value={stats.approvedMonth || 0} /> },
    { tone: TONES2.error,                  icon: 'ti-circle-x',     label: 'Rejected This Month', value: <CountUp value={stats.rejectedMonth || 0} /> },
    { tone: accentTone(ACCENT2.violet),    icon: 'ti-stack-2',      label: 'Total Applications',  value: <CountUp value={kpiTotal} /> },
  ];

  // ── Table — v2 table format (same as the Landlord property / unit pages + Listings):
  //   cells styled by column type only (13px Regular) · NO tag boxes inside tables (plain text) · status = dot + word ·
  //   order: who → what → category → when → status → row actions · action column unlabelled, hugging the right,
  //   small round tinted icon buttons (the unit page's eye button), grey + disabled when not available.
  const COLUMNS = [
    { key: 'applicant', label: 'Applicant', type: 'primary', width: 1.7,
      render: (r, i) => {
        const real = r.avatar_url || r.photo_url;
        const face = SAMPLE_FACES[i % SAMPLE_FACES.length];   // TEMP sample until real photos exist
        return (
        <div style={S.applicant}>
          <span style={S.photo(real ? resolveMediaUrl(real) : face)} role="img" aria-label={r.owner_name || 'Applicant'} />
          <div style={S.nameCol}>
            <div style={S.name} title={r.owner_name || ''}>{r.owner_name || '—'}</div>
            <div style={S.email} title={r.email || ''}>{r.email}</div>
          </div>
        </div>
        );
      } },
    { key: 'ref', label: 'Reference', type: 'text', width: 1.3,
      render: r => (
        <span>
          {r.sub_category === 'Unit' && r.unit_number ? `${r.property_name || '—'} / Unit ${r.unit_number}` : (r.property_name || '—')}
          {r.equity_pct && <span style={S.equity}> · {parseFloat(r.equity_pct).toFixed(0)}%</span>}
        </span>
      ) },
    { key: 'category', label: 'Category', type: 'text', fit: true,
      render: r => (r.category ? <span style={S.capitalize}>{r.category}</span> : <Dash />) },
    { key: 'sub', label: 'Sub category', type: 'secondary', fit: true, render: r => r.sub_category || <Dash /> },
    { key: 'submitted', label: 'Submitted', type: 'secondary', fit: true, render: r => (r.submitted_at ? fmtDate(r.submitted_at) : <Dash />) },
    { key: 'status', label: 'Status', type: 'status', fit: true, render: r => <StatusPill status={r.status} /> },
    { key: 'actions', label: 'Actions', fit: true,
      render: r => {
        const on = r.status === 'SUBMITTED';   // approve / reject only once the owner has submitted
        return (
          <div style={S.actions}>
            <button type="button" style={S.act(TONES2.primary, on)} disabled={!on} onClick={() => on && handleApprove(r.id, r.sub_category)}
              title={on ? 'Approve' : 'Not yet submitted'} aria-label="Approve">
              <i className="ti ti-check" aria-hidden="true" />
            </button>
            <button type="button" style={S.act(TONES2.error, on)} disabled={!on} onClick={() => on && setRejectTarget(r)}
              title={on ? 'Reject' : 'Not yet submitted'} aria-label="Reject">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
            <button type="button" style={S.act(TONES2.primary, true)} onClick={() => setPanelRecord(r)} title="View details" aria-label={`View ${r.owner_name || 'application'} details`}>
              <i className="ti ti-eye" aria-hidden="true" />
            </button>
          </div>
        );
      } },
  ];

  const propertyOptions = properties.map(p => ({ value: String(p.id), label: p.name }));
  const statusLabel   = STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || 'All statuses';
  const propertyLabel = propertyOptions.find(o => o.value === propertyFilter)?.label || 'All properties';
  const sortLabel     = SORT_OPTIONS.find(o => o.value === sortOrder)?.label || 'Newest first';
  const filtered = !!searchText || !!statusFilter || !!propertyFilter || activeTab !== 'all';

  const menuTrigger = (icon, text, active) => (open) => (
    <>
      <i className={`ti ${icon}`} style={UI2.btnIcon} aria-hidden="true" />
      <span className="un2-hide-narrow">{text}</span>
      {active && <span style={UI2.statusDot(TONES2.primary)} aria-hidden="true" />}
      <i className="ti ti-chevron-down" style={{ ...UI2.btnIcon, transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
    </>
  );

  return (
    <PMPageShell activeId="approvals-overview" animate backdrop={<ImageBackdrop image={backdropArt} />}>
      <Breadcrumb items={[{ label: 'PM Portal', href: '/pm-portal/dashboard/my-dashboard' }, { label: 'Approvals' }]} />

      {/* ── Header block: title · subtitle → top category tabs → summary stats (the SAME stats row as the
             Listings hero, HeroStats) — spaced as one block so nothing is cramped ── */}
      <section style={S.headBlock}>
        <div style={S.head}>
          <h1 style={S.title}>Approvals</h1>
          <p style={S.sub}>Review and action pending approval requests across all categories.</p>
        </div>

        {/* Category tabs — the standard v2 page tabs (underline, count in the label). Future categories show (0)
            and are not selectable yet. */}
        <div style={S.tabs}>
          <TabBar
            variant="underline"
            ariaLabel="Approval categories"
            value={activeTab}
            onChange={id => { if (!TABS.find(t => t.id === id)?.future) setActiveTab(id); }}
            tabs={TABS.map(t => ({ id: t.id, label: `${t.label} (${t.future ? 0 : (tabCounts[t.id] ?? 0)})` }))}
          />
        </div>

        <HeroStats stats={KPIS} style={S.stats} />
      </section>

      {error && (
        <div style={UI2.errorBanner}>
          <i className="ti ti-alert-circle" aria-hidden="true" /> {error} —{' '}
          <button type="button" style={UI2.btn.link} onClick={fetchApprovals}>Retry</button>
        </div>
      )}

      {/* ── Priority Snapshot │ Approval Trend │ Status Breakdown — one panel, divided columns ── */}
      <section style={S.panel}>
        <div className="un2-cols un2-cols-wide-mid">   {/* wider middle column for the trend chart */}
          <div style={S.col}>
            <div style={S.colTop}>
              <div style={UI2.colHead}>
                <i className="ti ti-flag-3" style={UI2.colIcon} aria-hidden="true" />
                <span style={S.colTitle}>Priority Snapshot</span>
              </div>
            </div>
            <PriorityItem
              tone={TONES2.error} title="Waiting longest" empty="No submitted applications waiting" onView={setPanelRecord}
              rows={waitingLongest.slice(0, 2).map(a => snapRow(a, daysSince(a.submitted_at) || '—'))}
            />
            <PriorityItem
              tone={accentTone(ACCENT2.violet)} title="Invite expiring soon" empty="No invites expiring in 3 days" onView={setPanelRecord}
              rows={expiringSoon.slice(0, 2).map(a => snapRow(a, a.daysLeft === 0 ? 'Today' : `${a.daysLeft}d left`))}
            />
            <PriorityItem
              tone={TONES2.primary} title="Incomplete documents" empty="All submitted docs are complete" onView={setPanelRecord}
              rows={incompleteDocs.slice(0, 2).map(a => snapRow(a, 'Docs missing'))}
            />
          </div>

          <div style={S.col}>
            {/* header: tinted icon box · title · subtitle (the CardHeader pieces, without its divider line) │ range */}
            <div style={S.trendTop}>
              <div style={S.trendHead}>
                <span style={S.trendIcon}><i className="ti ti-trending-up" aria-hidden="true" /></span>
                <div style={UI2.minWidth0}>
                  <div style={S.colTitle}>Approval Trend</div>
                  <div style={UI2.cardSubtitle}>Submitted, approved and rejected requests over time.</div>
                </div>
              </div>
              <span style={S.rangePill}><i className="ti ti-calendar" aria-hidden="true" /> Last 8 weeks</span>
            </div>
            <div style={S.chartBox}>
              <MultiLineChart labels={trendLabels} series={trendSeries} ariaLabel="Submitted vs approved vs rejected — last 8 weeks" />
            </div>
            {/* legend chips: tinted pill · dot · name · total over the range, hairline between chips */}
            <div className="un2-cq">
            <div className="un2-legend-chips" style={S.legend}>
              {trendSeries.map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <span className="un2-legend-sep" style={S.legendSep} aria-hidden="true" />}
                  <span className="un2-legend-chip" style={S.legendChip(s.tone)}>
                    <span style={UI2.statusDot(s.tone)} aria-hidden="true" />
                    {s.label}
                    <span style={S.legendCount(s.tone)}>{s.values.reduce((n, v) => n + v, 0)}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
            </div>
          </div>

          <div style={S.col}>
            <div style={S.colTop}>
              <div style={UI2.colHead}>
                <i className="ti ti-chart-donut-3" style={UI2.colIcon} aria-hidden="true" />
                <span style={S.colTitle}>Status Breakdown</span>
              </div>
            </div>
            <div style={S.donutWrap}>
              <SegmentDonut segments={segments} ramp={STATUS2.ramp} label="Applications" />
            </div>
            <div style={UI2.stack(SP2.sm)}>
              {shownSegments.length === 0
                ? <div style={{ ...S.prioEmpty, textAlign: 'center' }}>No data yet</div>
                : shownSegments.map(s => (
                  <div key={s.label} style={UI2.legendRow}>
                    <span style={UI2.legendKey}><span style={S.legendDot(s.color)} aria-hidden="true" />{s.label}</span>
                    <span style={UI2.legendVal}>{s.value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── All Pending Approvals — search · status · property · sort, then the table ── */}
      <section className="un2-cq" style={S.section}>
        <div style={S.secHead}>
          <h2 style={S.secTitle}>All Pending Approvals</h2>
          {/* Search box, then the "Options" toggle on its right — Status / Property / Sort slide out between them.
              Same ActionTray setup as Listings (compact = soft toggle on a light surface); un2-tray-tools /
              un2-tray-search: the search field slides away while Options is open. */}
          <div className="un2-tray-tools" style={S.tools}>
            <label className="un2-focus-ring un2-tray-search" style={S.search}>
              <i className="ti ti-search" style={S.searchIcon} aria-hidden="true" />
              <input
                style={S.input}
                type="search"
                placeholder="Name, email, property…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                aria-label="Search approvals"
              />
            </label>
            <ActionTray compact label="Options">
            <div style={S.menuWrap}>
              <FilterMenu
                title="Status" allLabel="All statuses" ariaLabel="Filter by status" itemIcon="ti-circle-dot" allIcon="ti-list"
                options={STATUS_OPTIONS} value={statusFilter || null} onChange={v => setStatusFilter(v || '')}
                triggerStyle={S.toolBtn} trigger={menuTrigger('ti-filter', statusLabel, !!statusFilter)}
              />
            </div>
            <div style={S.menuWrap}>
              <FilterMenu
                title="Property" allLabel="All properties" ariaLabel="Filter by property" itemIcon="ti-building" allIcon="ti-buildings"
                options={propertyOptions} value={propertyFilter || null} onChange={v => setPropertyFilter(v || '')}
                triggerStyle={S.toolBtn} trigger={menuTrigger('ti-building', propertyLabel, !!propertyFilter)}
              />
            </div>
            <div style={S.menuWrap}>
              <FilterMenu
                title="Sort" ariaLabel="Sort approvals" showAll={false}
                options={SORT_OPTIONS} value={sortOrder} onChange={v => setSortOrder(v || 'newest')}
                triggerStyle={S.toolBtn} trigger={menuTrigger('ti-arrows-sort', sortLabel, false)}
              />
            </div>
            </ActionTray>
          </div>
        </div>

        {/* white card behind the table: rows sit on white, hover shows the light-blue band */}
        <div style={S.panel}>
        {loading ? (
          <div style={UI2.stack(SP2.md)}>
            {[0, 1, 2, 3].map(i => <div key={i} className="un2-skel" style={UI2.skeleton('100%', SZ2.field)} />)}
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={filteredRows}
            rowKey={r => `${r.sub_category || 'p'}-${r.id}`}
            empty={(
              <EmptyState
                icon="ti-circle-check"
                title={filtered ? 'No approvals match' : 'No approvals yet'}
                text={filtered ? 'No approvals match the selected filters.' : 'New ownership requests will appear here.'}
              />
            )}
          />
        )}
        </div>
      </section>

      <PageFooter />

      {/* Details pop-up */}
      {panelRecord && (
        <DetailModal
          record={panelRecord}
          onClose={() => setPanelRecord(null)}
          onApprove={handleApprove}
          onReject={(rec) => { setPanelRecord(null); setRejectTarget(rec); }}
          actionLoading={actionLoading}
        />
      )}

      {/* Reject reason pop-up */}
      {rejectTarget && (
        <RejectModal
          record={rejectTarget}
          loading={actionLoading}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Result pop-ups */}
      {popup?.type === 'success' && (
        <SuccessModal
          title={popup.title}
          message={popup.message}
          primary={{ label: 'Done', icon: 'ti-arrow-right', onClick: () => setPopup(null) }}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.type === 'error' && (
        <Modal
          variant="confirm"
          icon="ti-alert-triangle"
          tone={TONES2.error}
          title={popup.title}
          onClose={() => setPopup(null)}
          footer={<button type="button" className="un2-btn" style={UI2.btn.brand} onClick={() => setPopup(null)}>OK</button>}
        >
          <div style={UI2.text.label}>{popup.message}</div>
        </Modal>
      )}
    </PMPageShell>
  );
}
