// Intended path: src/pages/Payment/PaymentCartContext.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Payment Cart
// Shared, portal-agnostic cart used by any module that sells something a
// landlord/PM/org can buy (Landlord Services today; PM plan add-ons, etc.
// later). This file knows NOTHING about services, pricing rules, or which
// portal is using it — that's deliberate, so it can be reused as-is.
//
// Cart line item shape (all fields required unless noted):
//   {
//     id:          string   — stable unique id (e.g. the service id). Used to
//                              dedupe — addItem() is a no-op if the id is
//                              already in the cart.
//     name:        string   — display name
//     subtitle:    string   — small secondary line (tag/category)
//     icon:        string   — optional Tabler icon class suffix, e.g. 'ti-chart-bar'
//     priceLabel:  string   — display string, e.g. '$15 / Unit'
//     amountDueToday: number — how much this item actually adds to "Due today"
//                              in the cart, in dollars (default 0 if omitted).
//                              The cart just sums this across checked items —
//                              it deliberately has no opinion on WHY a $49
//                              flat-fee item charges now while a $15/unit one
//                              charges $0 until assigned to a unit; that's the
//                              calling module's business rule to apply when it
//                              builds the cart item.
//     moduleKey:   string   — which feature/module this item came from, e.g.
//                              'landlord-service' — lets a consuming module's
//                              onConfirm() tell its own items apart if the
//                              cart ever mixes items from more than one module
//     meta:        object   — optional, module-specific payload (e.g. the
//                              full service object) handed back untouched via
//                              onConfirm() in PaymentCartModal
//     checked:     boolean  — whether this item is included in the next
//                              "Confirm & Pay" — defaults to true on add
//   }
//
// State persists to localStorage (see STORAGE_KEY below) so a landlord doesn't
// lose items they've already added on an accidental refresh — no backend cart
// model exists yet (that's still FE-only per SVC_011), so this is an interim
// step, not the final answer. Known limitation: localStorage is per-browser,
// not per-account — it won't follow the landlord to a different device. That
// gap closes naturally once a real backend cart API exists; nothing about
// this file's public interface (usePaymentCart()) needs to change for that —
// only the internals here would swap localStorage reads/writes for API calls.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const PaymentCartContext = createContext(null);

// Versioned so a future shape change can detect + discard old cached carts
// instead of crashing on an incompatible shape.
const STORAGE_KEY = 'un_payment_cart_v1';

function loadPersistedItems() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Private browsing, storage disabled, corrupted JSON, etc. — fall back to
    // an empty cart rather than letting the page crash on load.
    return [];
  }
}

export function PaymentCartProvider({ children }) {
  const [items, setItems] = useState(loadPersistedItems);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/blocked — cart still works for this session, it just
      // won't survive a refresh. Not worth surfacing to the user over.
    }
  }, [items]);

  const addItem = useCallback(item => {
    setItems(prev => prev.some(i => i.id === item.id) ? prev : [...prev, { checked: true, ...item }]);
  }, []);

  const removeItem = useCallback(id => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleItem = useCallback(id => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  }, []);

  // Removes only the given ids — used after a successful "Confirm & Pay" so
  // purchased (checked) items leave the cart while unchecked ones stay put.
  const removeItems = useCallback(ids => {
    setItems(prev => prev.filter(i => !ids.includes(i.id)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(id => items.some(i => i.id === id), [items]);

  const value = { items, addItem, removeItem, toggleItem, removeItems, clearCart, isInCart };

  return (
    <PaymentCartContext.Provider value={value}>
      {children}
    </PaymentCartContext.Provider>
  );
}

export function usePaymentCart() {
  const ctx = useContext(PaymentCartContext);
  if (!ctx) {
    throw new Error('usePaymentCart() must be used inside a <PaymentCartProvider> — check that App.js wraps the app with it.');
  }
  return ctx;
}
