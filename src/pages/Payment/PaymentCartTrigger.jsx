// Intended path: src/pages/Payment/PaymentCartTrigger.jsx
//
// Small reusable "open the cart" button — a badge count wrapped around the
// existing shared <Button> (src/components/ui/Button.jsx), NOT a reimplemented
// button style. Any module using PaymentCartContext can drop this in without
// rebuilding the badge-count logic itself.
//
// `theme` lets each portal match its own design tokens instead of inheriting
// platform colors — e.g. the Landlord portal passes its landlordTokens values
// so this respects the Inter/landlordTokens isolation (ARCH_L001/L002)
// rather than pulling from src/constants/colors.js.

import React from 'react';
import Button from '../../components/ui/Button';
import { usePaymentCart } from './PaymentCartContext';

const DEFAULT_THEME = {
  txtPrimary: '#0d1b2e',
  cardBdr: '#e5e8ed',
  font: "'Inter', -apple-system, sans-serif",
};

export default function PaymentCartTrigger({ onClick, theme = {}, badgeColor = '#dc2626' }) {
  const t = { ...DEFAULT_THEME, ...theme };
  const { items } = usePaymentCart();
  const count = items.length;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="secondary"
        fullWidth={false}
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', color: t.txtPrimary, border: `1px solid ${t.cardBdr}`,
          fontFamily: t.font,
        }}
      >
        <i className="ti ti-shopping-cart" aria-hidden="true" style={{ fontSize: 14 }} />
        Cart
      </Button>
      {count > 0 && (
        <span
          aria-label={`${count} item${count === 1 ? '' : 's'} in cart`}
          style={{
            position: 'absolute', top: -6, right: -6,
            background: badgeColor, color: '#fff', fontSize: 10, fontWeight: 800,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}
