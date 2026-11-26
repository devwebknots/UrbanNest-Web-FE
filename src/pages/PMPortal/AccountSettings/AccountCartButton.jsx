// AccountCartButton.jsx — VERSION 2 "Cart" header button for the PM Account Settings pages
//
// White button on the light-blue header wave (UI2.btn.light — same pair as the PM Listings header) with the
// shared payment cart's item count as a brand badge. Single source for every Account Settings header that shows
// the cart (Subscription & Billing · Services · Transactions).
//
//   <AccountCartButton onClick={() => setCartOpen(true)} />

import React from 'react';
import { usePaymentCart } from '../../Payment/PaymentCartContext';
import { UI2 } from '../../../constants';

const S = {
  btn:   UI2.btn.light,
  badge: { ...UI2.countBadge, background: UI2.btn.brand.background, color: UI2.btn.brand.color },
};

export default function AccountCartButton({ onClick }) {
  const { items } = usePaymentCart();
  return (
    <button type="button" className="un2-btn" style={S.btn} onClick={onClick}>
      <i className="ti ti-shopping-cart" style={UI2.btnIcon} aria-hidden="true" /> Cart
      {items.length > 0 && <span style={S.badge}>{items.length}</span>}
    </button>
  );
}
