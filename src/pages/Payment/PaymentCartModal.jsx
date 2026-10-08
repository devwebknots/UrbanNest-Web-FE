// Intended path: src/pages/Payment/PaymentCartModal.jsx
//
// Portal-agnostic checkout dialog. Knows nothing about services, plans, or
// any other purchasable thing — it only renders whatever's in the shared
// PaymentCart (see PaymentCartContext.jsx) and defers to the caller for what
// "confirming" actually does. Uses the shared <Button> for every real button
// (Close / Confirm & Pay / Done) — "Remove" stays a plain text link, matching
// how "Set as default" / "View Full Ledger" etc. are styled elsewhere in the
// app (a link, not a button).
//
// Props:
//   onClose    — called when the dialog should close (Close / Done / backdrop click)
//   onConfirm  — function(checkedItems) => void | Promise<void>. Called when
//                "Confirm & Pay" is clicked, BEFORE checked items are removed
//                from the cart. This is where a module applies its own side
//                effects (e.g. LandlordSettingsPage flips services to owned).
//                No real payment gateway exists yet — per your instruction,
//                this always completes as a mock purchase; onConfirm is the
//                one place that changes when a real gateway is wired in.
//   theme      — optional colors/font override, see DEFAULT_THEME below.

import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import { usePaymentCart } from './PaymentCartContext';

const DEFAULT_THEME = {
  navBg: '#0a1628', cardBg: '#ffffff', cardBdr: '#e5e8ed',
  txtPrimary: '#0d1b2e', txtSec: '#475569', txtMuted: '#6b7280',
  blue: '#3d8ef0', blueLight: '#dbeafe', blueDark: '#1d4ed8',
  greenLight: '#dcfce7', greenDark: '#15803d', red: '#dc2626',
  font: "'Inter', -apple-system, sans-serif",
};

export default function PaymentCartModal({ onClose, onConfirm, theme = {} }) {
  const t = { ...DEFAULT_THEME, ...theme };
  const { items, removeItem, toggleItem, removeItems } = usePaymentCart();
  const [stage, setStage] = useState('cart'); // 'cart' | 'success'
  const [purchased, setPurchased] = useState([]);
  const [retained, setRetained] = useState([]);
  const [confirming, setConfirming] = useState(false);
  // onConfirm now does real async work (Session 40, second pass — it POSTs to
  // a backend endpoint for landlord services) and can genuinely fail, so a
  // thrown/rejected onConfirm surfaces here instead of leaving the button
  // stuck on "confirming" — checked items stay in the cart to retry.
  const [confirmError, setConfirmError] = useState(null);

  const checkedItems = items.filter(i => i.checked);
  const checkedCount = checkedItems.length;
  // Whether an item costs anything today (vs. only once assigned to a unit,
  // etc.) is business logic the cart deliberately doesn't own — the caller
  // sets amountDueToday per item (defaults to 0), the cart just sums it.
  const dueToday = checkedItems.reduce((sum, i) => sum + (i.amountDueToday || 0), 0);

  const handleConfirm = async () => {
    if (checkedCount === 0 || confirming) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await onConfirm(checkedItems);
    } catch (err) {
      setConfirming(false);
      setConfirmError((err && err.message) || 'Something went wrong completing this purchase. Please try again.');
      return;
    }
    const checkedIds = checkedItems.map(i => i.id);
    removeItems(checkedIds);
    setPurchased(checkedItems);
    setRetained(items.filter(i => !i.checked));
    setConfirming(false);
    setStage('success');
  };

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(13,27,46,0.55)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '30px 20px',
    zIndex: 1000, fontFamily: t.font,
  };
  const modalStyle = {
    background: t.cardBg, borderRadius: 12, width: 460, maxWidth: '100%',
    boxShadow: '0 24px 50px rgba(0,0,0,0.3)', overflow: 'hidden', color: t.txtPrimary,
  };

  if (stage === 'success') {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={{ padding: '26px 22px 6px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.greenLight, color: t.greenDark, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 20 }}>✓</div>
            {/* Session 49: the cart is now reused for plan subscriptions too
                (landlord-plan-subscription), not just services — "assign to
                units" doesn't make sense for a plan, so the copy below
                branches by what was actually purchased instead of always
                assuming "service". Service-only purchases keep the exact
                original wording. */}
            {(() => {
              const planItems = purchased.filter(p => p.moduleKey === 'landlord-plan-subscription');
              const otherItems = purchased.filter(p => p.moduleKey !== 'landlord-plan-subscription');
              const hasPlan = planItems.length > 0;
              const hasOther = otherItems.length > 0;
              const heading = hasPlan && !hasOther
                ? `${planItems[0].name} plan is now active`
                : hasOther && !hasPlan
                  ? `${otherItems.length} service${otherItems.length === 1 ? '' : 's'} added to your account`
                  : `${purchased.length} item${purchased.length === 1 ? '' : 's'} added to your account`;
              return (
                <>
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6 }}>{heading}</div>
                  <div style={{ fontSize: 12, color: t.txtMuted, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 12px' }}>
                    {hasPlan && (
                      <div style={{ marginBottom: hasOther ? 6 : 0 }}>
                        {planItems.map(p => p.name).join(', ')} {planItems.length === 1 ? 'is' : 'are'} now active on your account.
                      </div>
                    )}
                    {hasOther && (
                      <div>
                        {otherItems.map(p => p.name).join(', ')} {otherItems.length === 1 ? 'is' : 'are'} now on your account. Assign {otherItems.length === 1 ? 'it' : 'them'} to individual units from each unit's page.
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
            {retained.length > 0 && (
              <div style={{ background: '#f4f6f9', border: `1px solid ${t.cardBdr}`, borderRadius: 8, padding: '10px 14px', fontSize: 11.5, color: t.txtSec, textAlign: 'left', maxWidth: 320, margin: '0 auto 18px' }}>
                🛒 {retained.map(r => r.name).join(', ')} still in your cart, unpurchased — open the cart any time to buy or remove.
              </div>
            )}
          </div>
          <div style={{ padding: '0 22px 22px', display: 'flex', justifyContent: 'center' }}>
            <Button variant="primary" fullWidth={false} onClick={onClose} style={{ background: t.navBg, fontFamily: t.font }}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>Your Cart</h3>
          <span style={{ fontSize: 12, color: t.txtMuted, fontWeight: 600 }}>{items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>

        <div style={{ padding: '6px 20px 4px', maxHeight: 320, overflowY: 'auto' }}>
          {items.length === 0 && (
            <div style={{ fontSize: 12.5, color: t.txtMuted, padding: '20px 0', textAlign: 'center' }}>Your cart is empty.</div>
          )}
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: `1px solid ${t.cardBdr}`, opacity: item.checked ? 1 : 0.55 }}>
              <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} style={{ marginTop: 3, width: 15, height: 15, accentColor: t.blue, flexShrink: 0 }} />
              <div style={{ width: 30, height: 30, borderRadius: 7, background: t.blueLight, color: t.blueDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                {item.icon ? <i className={`ti ${item.icon}`} aria-hidden="true" /> : '•'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 10.5, color: t.txtMuted, marginTop: 1 }}>
                  {item.checked ? item.subtitle : 'Saved for later — not included in this purchase'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginLeft: 'auto' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{item.priceLabel}</div>
                <span onClick={() => removeItem(item.id)} style={{ fontSize: 11, color: t.red, cursor: 'pointer', fontWeight: 600 }}>Remove</span>
              </div>
            </div>
          ))}

          {items.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: t.txtSec, lineHeight: 1.5, padding: '10px 0', borderBottom: `1px solid ${t.cardBdr}` }}>
                <b style={{ color: t.txtPrimary }}>How this is billed:</b> per-unit or per-property services charge nothing today — only once you assign them to a unit. Flat-fee services are charged in full now. Unchecking an item keeps it in your cart without buying it now.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 2px', fontSize: 13, fontWeight: 700 }}>
                <span>Due today</span>
                <span style={{ fontSize: 16 }}>${dueToday.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 11, color: t.txtMuted, fontWeight: 500, marginBottom: 8 }}>{checkedCount} of {items.length} item{items.length === 1 ? '' : 's'} selected</div>
              <div style={{ background: '#f8f9fb', border: `1px dashed ${t.cardBdr}`, borderRadius: 8, padding: '10px 12px', margin: '4px 0 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: '#eef0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.txtMuted, fontSize: 12, flexShrink: 0 }}>💳</div>
                <div style={{ fontSize: 11, color: t.txtMuted, lineHeight: 1.5 }}>Payment method — not connected yet. Confirming below skips the gateway and completes as a mock purchase.</div>
              </div>
            </>
          )}
        </div>

        {confirmError && (
          <div style={{ margin: '0 20px 10px', padding: '9px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: t.red, fontSize: 11.5, lineHeight: 1.5 }}>
            {confirmError}
          </div>
        )}

        <div style={{ padding: '12px 20px 18px', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <Button variant="secondary" fullWidth={false} onClick={onClose} style={{ fontFamily: t.font }}>Close</Button>
          <Button
            variant="primary"
            fullWidth={false}
            disabled={checkedCount === 0}
            loading={confirming}
            onClick={handleConfirm}
            style={{ background: t.navBg, fontFamily: t.font }}
          >
            Confirm & Pay {checkedCount > 0 ? `(${checkedCount})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
