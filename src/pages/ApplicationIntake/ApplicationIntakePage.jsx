// src/pages/ApplicationIntake/ApplicationIntakePage.jsx
//
// Entry point for the real "Apply Now" flow, mounted at
// /marketplace/listing/:id/apply/* and /marketplace/property-listing/:id/apply/*
// (see App.js). Fetches the real listing summary (reusing
// apiGetListingDetail/apiGetPropertyListingDetail — the same calls
// ListingDetailPage.jsx/PropertyListingDetailPage.jsx already use), gates
// on a real logged-in user (same "gate on click, not on render" + same
// logged-out destination as ListingContactCard's handleBookTourClick), and
// then mounts the four-stage flow under ApplicationIntakeContext.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetListingDetail, apiGetPropertyListingDetail } from '../Marketplace/Home/marketplaceHomeApi';
import { ApplicationIntakeProvider } from './ApplicationIntakeContext';
import { C, F } from './applicationIntakeTokens';
import { currencySymbol } from './applicationIntakeOptions';
import Stage1_ApplicantHousehold from './Stage1_ApplicantHousehold';
import Stage2_RentalFinancial from './Stage2_RentalFinancial';
import Stage3_PropertyDocuments from './Stage3_PropertyDocuments';
import Stage4_ReviewConsentSubmit from './Stage4_ReviewConsentSubmit';

// Session 56 — extended to also surface the real fields the redesigned
// Stages 1-3 now need: the listing's actual lead contact (shown as the
// sidebar's "Listing Agent" card, replacing the old sample concierge —
// same `leadContact` shape ListingContactCard already renders on the
// Marketplace detail pages: {name, email, phone, photoUrl, role, orgName}),
// its real pet/parking/storage facts (ListingRentalTerms.pets_allowed/
// parking_fee/other_fees — see listings/UrbanNest_Listing_Architecture.md),
// and the property's country (for $ / ₹ display — see
// applicationIntakeOptions.js's own currency note). None of this is
// invented — every field here is read straight off the same
// apiGetListingDetail/apiGetPropertyListingDetail payload
// ListingDetailPage.jsx/PropertyListingDetailPage.jsx already consume.
function adaptListingSummary(data, kind, listingId) {
  if (!data) return null;
  const addr = data.address || {};
  const addressLine = [addr.street1, addr.street2].filter(Boolean).join(', ');
  const cityStateZip = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
  const fees = data.fees || {};
  const rentAmount = fees.rentAmount ?? fees.rentAmountMin ?? null;
  const country = addr.country || 'US';
  const cur = currencySymbol(country);
  const amenities = data.amenities || [];
  const storageFee = (fees.otherFees || []).find((f) => /storage/i.test(f?.type || ''));
  const parkingAvailable = fees.parkingFee != null || amenities.some((a) => /parking/i.test(a));
  const storageAvailable = storageFee != null || amenities.some((a) => /storage/i.test(a));
  return {
    propertyName: data.title || 'This listing',
    unitLabel: data.title || '',
    address: [addressLine, cityStateZip].filter(Boolean).join(', '),
    country,
    currency: cur,
    rentLabel: rentAmount != null ? `${cur}${Number(rentAmount).toLocaleString()} / mo` : 'Rent on request',
    monthlyRentRaw: rentAmount,
    // Session 56 follow-up — the user's reference screenshot showed this
    // reading "Fixed / 12 Months", not just "12 Months". `ListingRentalTerms`
    // has no lease-type field (fixed-term vs. month-to-month) anywhere in
    // the real backend — the only real data point is the month count. This
    // prepends "Fixed /" as a labeling assumption (a listing that carries a
    // specific lease_term_months value is, by construction, on a fixed
    // term — a month-to-month listing would have no such value to show).
    // Flagging this here rather than treating it as a real "lease type"
    // field, since no such field exists to read.
    leaseTerm: fees.leaseTermMonths ? `Fixed / ${fees.leaseTermMonths} Months` : null,
    // Session 56 follow-up — carried through so the real Listing Agent
    // card's Book Tour action (ApplicationIntakeShell.jsx) can send the
    // renter back to this exact listing without re-deriving its id/kind
    // from the route a second time.
    listingId,
    photoUrl: data.gallery?.coverImage || null,
    // Real pet/parking/storage facts (not sample) — gate Stage 3's
    // Property-Specific Lifestyle sections on these rather than always
    // showing them (see Stage3_PropertyDocuments.jsx).
    petsAllowed: !!fees.petsAllowed,
    petRent: fees.petRent ?? null,
    petDeposit: fees.petDeposit ?? null,
    parkingAvailable,
    parkingFeeAmount: fees.parkingFee?.amount ?? null,
    storageAvailable,
    storageFeeAmount: storageFee?.amount ?? null,
    // Real listing agent/contact — replaces the old sample concierge card.
    listingAgent: data.leadContact || null,
    kind,
  };
}

export default function ApplicationIntakePage({ kind }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [listingSummary, setListingSummary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Same logged-out gate/destination as Book A Tour elsewhere on
      // Marketplace (ListingContactCard's handleBookTourClick).
      navigate('/', { state: { postLoginRedirect: `/marketplace/${kind}/${id}/apply` } });
      return;
    }
    const fetcher = kind === 'property-listing' ? apiGetPropertyListingDetail : apiGetListingDetail;
    fetcher(id)
      .then((data) => setListingSummary(adaptListingSummary(data, kind, id)))
      .catch((e) => setLoadError(e.message || 'Could not load this listing.'))
      .finally(() => setLoading(false));
  }, [id, kind, user, authLoading, navigate]);

  if (authLoading || loading) {
    return <div style={{ padding: 60, textAlign: 'center', fontFamily: F.body, color: C.textSecondary }}>Loading application…</div>;
  }

  if (loadError) {
    return (
      <div style={{ padding: 60, textAlign: 'center', fontFamily: F.body, color: C.textSecondary }}>
        {loadError} <button onClick={() => navigate(-1)} style={{ color: C.navy, background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Go back</button>
      </div>
    );
  }

  return (
    <ApplicationIntakeProvider kind={kind} listingId={id} listingSummary={listingSummary} basePath={`/marketplace/${kind}/${id}/apply`}>
      <Routes>
        <Route index element={<Navigate to="stage-1" replace />} />
        <Route path="stage-1" element={<Stage1_ApplicantHousehold />} />
        <Route path="stage-2" element={<Stage2_RentalFinancial />} />
        <Route path="stage-3" element={<Stage3_PropertyDocuments />} />
        <Route path="stage-4" element={<Stage4_ReviewConsentSubmit />} />
      </Routes>
    </ApplicationIntakeProvider>
  );
}
