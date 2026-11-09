// src/pages/Marketplace/RenterNotification/RenterNotificationModal.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Session 53+ — the Renter "Alerts / Notifications" in-app feed (the user's
// own feature request: "Just like favorites there should be a navigation
// item called 'Alerts/Notifications'... it should show an email Inbox and
// should show the Book tour appointment"). Original wireframe approved
// before any of this was written: https://claude.ai/artifact/69T6PwWULK1RB9F99fda4u.
//
// Session 53+, restyle pass — the user supplied a refined "Alerts &
// Communications" mockup (Email / Notifications / Messages tabs, a richer
// "Appointment Overview" reading-pane card) plus two explicit adds: (1) a
// page banner with the UN logo/name "similar to our other standard
// pop-up's", and (2) tab order Email, Notifications, Messages (NOT the
// mockup's own displayed order). Scope for THIS pass, confirmed via
// AskUserQuestion ("Restyle Notifications only; Email/Messages as honest
// placeholders"):
//   - Notifications tab: restyled, but still only the one real
//     notification_type (TOUR_BOOKED) — no new backend, no sample data.
//   - Email / Messages tabs: exist in the tab bar (per instruction #2's
//     explicit ordering) but render an honest "coming soon" placeholder —
//     no fake inbox items (the mockup's "Price Reduction Alert" / "Lease
//     Document Ready" / "Maintenance Update" sample cards are deliberately
//     NOT built — those don't correspond to anything this backend sends).
//
// Banner: reuses UNModalShell's own chrome (marketplaceDetailShared.jsx) —
// the navy (C.primary) bar with the small house-icon chip, the "Urban/Nest"
// wordmark, and the close X — rather than inventing a new banner style,
// since that IS "our other standard pop-up" the user meant.
//
// Two judgment calls made in this pass, flagged rather than silently
// decided:
//   - Left OUT the mockup's "Verified Agent" badge on the host row. We have
//     no actual agent-verification concept anywhere in this codebase
//     (ListingLeadSettings has no `verified` field) — showing that label
//     for every host would assert a real trust/safety claim about a real
//     third party (the landlord/contact) that nothing backs. Host name
//     alone is shown instead.
//   - "Reschedule or Cancel" has no backend (no reschedule/cancel endpoint
//     exists for a booked tour) — rendered as an inert, muted, non-clickable
//     label, same honest-placeholder treatment 'Add to Calendar' already
//     has, rather than wiring it to nothing or omitting it outright.
//
// Still Renter-only and read/mark-read only: no compose/reply anywhere,
// still "email-like" rendering of what the server already sent.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { C, F } from '../Home/marketplaceTokens';

// Not part of marketplaceTokens — this feed is the only place in the
// Marketplace FE that needs a "success/confirmed" accent color, so it's
// defined locally rather than widening the shared token file for one
// screen. Picked to sit comfortably next to C.primary/C.accentGold.
const GREEN = { bg: '#ECFDF5', text: '#047857', dot: '#10B981', border: '#A7F3D0' };

const TABS = [
  { key: 'email', label: 'Email' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'messages', label: 'Messages' },
];

function formatRelativeTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// "Received today at 10:18 AM" / "Received Nov 7 at 10:18 AM" — the reading
// pane's own top-right timestamp in the new design (distinct from the list
// row's relative-time caption above).
function formatReceivedLabel(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Received today at ${timeLabel}`;
  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Received ${dateLabel} at ${timeLabel}`;
}

// Mirrors public_views.py's own _format_tour_window() — same "Tue, Nov 12 ·
// 4:00–4:30 PM" shape, computed client-side here since the API returns raw
// ISO startAt/endAt rather than a pre-formatted string.
function formatTourWindow(startAtIso, endAtIso) {
  if (!startAtIso || !endAtIso) return '';
  const start = new Date(startAtIso);
  const end = new Date(endAtIso);
  const dateLabel = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const startLabel = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateLabel} · ${startLabel}–${endLabel}`;
}

// A reference number tied to the real row id (TR-00001) rather than a
// fabricated/random code — honest about what it actually is (this
// notification's own primary key), just formatted to look like a ticket ref.
function formatRefNumber(id) {
  return `TR-${String(id).padStart(5, '0')}`;
}

function initialsFor(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function NotificationIcon({ type }) {
  // Only one notification_type exists today (TOUR_BOOKED) — this switch
  // exists so a second type (models.py's own docstring reserves the field
  // for one) can get its own icon later without touching the list row's
  // own markup.
  const iconClass = type === 'TOUR_BOOKED' ? 'ti ti-calendar-event' : 'ti ti-bell';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: C.accentGoldBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <i className={iconClass} style={{ fontSize: 16, color: C.accentGold }} />
    </div>
  );
}

function NotificationListRow({ notification, selected, onClick }) {
  const n = notification;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', cursor: 'pointer',
        background: selected ? C.inputBg : 'transparent',
        borderLeft: `3px solid ${selected ? C.primary : 'transparent'}`,
        borderBottom: `1px solid ${C.divider}`,
      }}
    >
      <NotificationIcon type={n.notificationType} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontFamily: F.body, fontSize: 13, color: C.textPrimary,
            fontWeight: n.isRead ? 600 : 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {n.title}
          </span>
          {!n.isRead && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary, flexShrink: 0, marginLeft: 'auto' }} />
          )}
        </div>
        <div style={{
          fontFamily: F.body, fontSize: 12, color: C.textSecondary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {n.listingTitle}{n.listingSubtitle ? ` — ${n.listingSubtitle}` : ''}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 11, color: C.textTertiary, marginTop: 3 }}>
          {formatRelativeTime(n.createdAt)}
        </div>
      </div>
    </div>
  );
}

// The "email-like" reading pane, restyled per the user's refined mockup —
// pill status badge, "Appointment Overview" card with a ref number, a
// host row with an initials avatar, and a slimmer action row (buttons
// deliberately sized down from the first pass — see the action-row styles
// below).
function NotificationReadingPane({ notification, onViewListing }) {
  if (!notification) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.body, fontSize: 13, color: C.textTertiary,
      }}>
        Select an alert to view it.
      </div>
    );
  }

  const n = notification;
  const when = formatTourWindow(n.startAt, n.endAt);

  // Compact action-button styling, shared by all three actions so they
  // stay visually aligned (smaller than the first-pass buttons, per
  // explicit ask — 8px/13px padding and 12px text/icons, down from 11px/20px
  // and 13-14px).
  const actionBtnBase = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontFamily: F.body, fontSize: 12, fontWeight: 700,
    padding: '7px 13px', borderRadius: 7,
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: GREEN.bg, color: GREEN.text, border: `1px solid ${GREEN.border}`,
          fontFamily: F.body, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '4px 10px', borderRadius: 999,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN.dot }} />
          Tour Confirmed
        </span>
        <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, whiteSpace: 'nowrap', marginTop: 3 }}>
          {formatReceivedLabel(n.createdAt)}
        </span>
      </div>

      <h2 style={{ fontFamily: F.serif, fontSize: 23, color: C.textPrimary, margin: '0 0 6px' }}>
        {n.title}
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.textSecondary, margin: '0 0 22px', lineHeight: 1.6 }}>
        Your tour{n.hostName ? ` with ${n.hostName}` : ''} for{' '}
        <strong style={{ color: C.textPrimary }}>{n.listingTitle}</strong>
        {n.listingSubtitle ? ` (${n.listingSubtitle})` : ''} is confirmed.
      </p>

      <div style={{ background: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 800, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Appointment Overview
          </span>
          <span style={{
            fontFamily: F.body, fontSize: 10.5, fontWeight: 700, color: C.textSecondary,
            background: C.white, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: '3px 9px',
          }}>
            Ref: #{formatRefNumber(n.id)}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <i className="ti ti-calendar" style={{ fontSize: 14, color: C.textTertiary, marginTop: 2 }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>When</span>
              <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, fontWeight: 700, textAlign: 'right' }}>{when}</span>
            </div>
          </div>
          <div style={{ height: 1, background: C.divider }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 14, color: C.textTertiary, marginTop: 2 }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>Where</span>
              <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, fontWeight: 700, textAlign: 'right' }}>{n.listingSubtitle || n.listingTitle}</span>
            </div>
          </div>
          {n.hostName && (
            <>
              <div style={{ height: 1, background: C.divider }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ti ti-user" style={{ fontSize: 14, color: C.textTertiary }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>Host</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: C.primary, color: C.white,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: F.body, fontSize: 9, fontWeight: 800, flexShrink: 0,
                    }}>
                      {initialsFor(n.hostName)}
                    </div>
                    <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, fontWeight: 700 }}>{n.hostName}</span>
                  </div>
                </div>
              </div>
            </>
          )}
          <div style={{ height: 1, background: C.divider }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <i className="ti ti-building" style={{ fontSize: 14, color: C.textTertiary, marginTop: 2 }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary }}>Tour Type</span>
              {/* Static — every tour booked through this flow is an
                  in-person walkthrough today; there's no virtual-tour
                  option anywhere upstream, so this isn't a real field on
                  RenterNotification, just an accurate constant. */}
              <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.textPrimary, fontWeight: 700, textAlign: 'right' }}>In-Person Tour</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* 'Add to Calendar' is a visual placeholder only (user decision,
            confirmed over the .ics-scope AskUserQuestion) — no calendar
            file is generated in this pass, so this deliberately has no
            onClick/href. */}
        <span style={{
          ...actionBtnBase,
          border: `1px solid ${C.primary}`, color: C.primary, cursor: 'default',
        }}>
          <i className="ti ti-calendar-plus" style={{ fontSize: 12.5 }} />
          Add to Calendar
        </span>
        <button
          onClick={() => onViewListing(n.listingUrl)}
          style={{
            ...actionBtnBase,
            background: C.primary, color: C.white, border: 'none', cursor: 'pointer',
          }}
        >
          View Listing
          <i className="ti ti-arrow-right" style={{ fontSize: 12.5 }} />
        </button>
        {/* No reschedule/cancel endpoint exists for a booked tour anywhere
            in this backend — rendered inert rather than wired to nothing,
            same honest-placeholder posture as 'Add to Calendar' above. */}
        <span style={{
          fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.textTertiary,
          padding: '7px 6px', cursor: 'default',
        }}>
          Reschedule or Cancel
        </span>
      </div>

      <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.textTertiary, marginTop: 24 }}>
        This confirmation was also emailed to the address on your account.
      </p>
    </div>
  );
}

// Honest "coming soon" pane for the Email and Messages tabs — no backend,
// no sample/fabricated items (the mockup's Price Reduction Alert / Lease
// Document Ready / Maintenance Update cards are deliberately not built;
// see this file's header comment).
function ComingSoonPane({ icon, label }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: 32,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: C.inputBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={icon} style={{ fontSize: 20, color: C.textTertiary }} />
      </div>
      <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.textSecondary }}>
        {label} is coming soon
      </div>
      <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textTertiary, textAlign: 'center', maxWidth: 280 }}>
        We'll let you know here as soon as this is ready.
      </div>
    </div>
  );
}

export default function RenterNotificationModal({ open, notifications, error, selectedId, onSelect, onMarkAllRead, onClose }) {
  const navigate = useNavigate();
  const [internalSelectedId, setInternalSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('notifications');

  // Auto-select the most recent notification the first time the list loads
  // for this modal-open session, so the reading pane isn't left blank —
  // same "don't make them click twice" posture a real inbox has. Only runs
  // once per open (resets below), never overriding a renter's own later
  // click. Also resets the active tab back to Notifications on each open,
  // since that's the only tab with anything real to show.
  useEffect(() => {
    if (!open) { setInternalSelectedId(null); return; }
    setActiveTab('notifications');
    if (internalSelectedId == null && notifications && notifications.length > 0) {
      const first = notifications[0];
      setInternalSelectedId(first.id);
      if (!first.isRead) onSelect(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notifications]);

  if (!open) return null;

  const activeId = selectedId != null ? selectedId : internalSelectedId;
  const activeNotification = (notifications || []).find(n => n.id === activeId) || null;
  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  function handleRowClick(n) {
    setInternalSelectedId(n.id);
    if (!n.isRead) onSelect(n);
  }

  // listingUrl is the full absolute FRONTEND_URL link the backend built
  // (public_views.py's ListingBookTourView/PropertyListingBookTourView) —
  // routed in-SPA via its pathname when it resolves to this same origin
  // (the normal case), falling back to a full navigation otherwise rather
  // than silently doing nothing.
  function handleViewListing(listingUrl) {
    if (!listingUrl) return;
    try {
      const parsed = new URL(listingUrl, window.location.origin);
      if (parsed.origin === window.location.origin) {
        onClose();
        navigate(parsed.pathname);
        return;
      }
    } catch { /* fall through to a plain navigation below */ }
    window.location.href = listingUrl;
  }

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '84vw', minWidth: '72vw', height: '80vh', minHeight: '62vh', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          background: C.white, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Page banner — reuses UNModalShell's own chrome
            (marketplaceDetailShared.jsx) so this matches "our other
            standard pop-up's" exactly, per the user's explicit ask. */}
        <div style={{ background: C.primary, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 24, height: 24, background: 'rgba(255,255,255,0.15)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-home" style={{ fontSize: 13, color: C.white }} />
          </div>
          <span style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 700, color: C.white, lineHeight: 1, letterSpacing: '0.01em' }}>
            Urban<span style={{ color: '#60A5FA' }}>Nest</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: 'auto', width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 4, opacity: 0.85,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 15, color: C.white }} />
          </button>
        </div>

        {/* Title + subtitle */}
        <div style={{ padding: '18px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: F.serif, fontSize: 21, color: C.textPrimary, margin: 0 }}>Alerts &amp; Communications</h2>
            {!error && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: GREEN.bg, color: GREEN.text, border: `1px solid ${GREEN.border}`,
                fontFamily: F.body, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '3px 9px', borderRadius: 999,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN.dot }} />
                Live Updates
              </span>
            )}
          </div>
          <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSecondary, margin: '4px 0 0' }}>
            Updates on your scheduled tours, saved homes, and leasing activity.
          </p>
        </div>

        {/* Tab bar — order is Email, Notifications, Messages per explicit
            instruction (NOT the mockup's own displayed order). Email and
            Messages carry no count chip (no real unread concept exists for
            either yet) and open ComingSoonPane when selected. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '14px 28px 0',
          borderBottom: `1px solid ${C.cardBorder}`, flexShrink: 0,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tab.key === 'notifications' && unreadCount > 0 ? unreadCount : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0 4px 11px', marginRight: 22,
                  borderBottom: `2px solid ${isActive ? C.primary : 'transparent'}`,
                  fontFamily: F.body, fontSize: 13.5, fontWeight: isActive ? 800 : 600,
                  color: isActive ? C.textPrimary : C.textSecondary,
                }}
              >
                {tab.label}
                {count != null && (
                  <span style={{
                    minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
                    background: isActive ? C.primary : C.textTertiary, color: C.white,
                    fontFamily: F.body, fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          {activeTab === 'notifications' && unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', marginBottom: 11,
                fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary,
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {activeTab === 'notifications' ? (
          <div style={{ display: 'flex', flex: '1 1 auto', minHeight: 0 }}>
            <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${C.cardBorder}`, overflowY: 'auto' }}>
              {error && (
                <div style={{ margin: 16, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontFamily: F.body, fontSize: 12.5 }}>
                  {error}
                </div>
              )}
              {notifications === null ? (
                <div style={{ padding: 20, fontFamily: F.body, fontSize: 13, color: C.textSecondary }}>Loading…</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: F.body, fontSize: 13, color: C.textSecondary }}>
                  You don't have any alerts yet. Book a tour on a listing and we'll let you know here.
                </div>
              ) : (
                notifications.map(n => (
                  <NotificationListRow
                    key={n.id}
                    notification={n}
                    selected={n.id === activeId}
                    onClick={() => handleRowClick(n)}
                  />
                ))
              )}
            </div>

            <NotificationReadingPane notification={activeNotification} onViewListing={handleViewListing} />
          </div>
        ) : activeTab === 'email' ? (
          <ComingSoonPane icon="ti ti-mail" label="Email" />
        ) : (
          <ComingSoonPane icon="ti ti-message-circle" label="Messages" />
        )}
      </div>
    </div>,
    document.body,
  );
}
