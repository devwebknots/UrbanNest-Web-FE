// propertyData.js — reads the existing public Marketplace payloads
// (rules_engine/marketplace_display/public_views.py, verified Session 60):
//   card    → _serialize_listing_card / _serialize_group_card
//   detail  → MarketplaceListingDetailView / MarketplacePropertyListingDetailView
//
// Only fields that are present are returned. Nothing is invented: a missing
// value is null and the section omits it. The same payloads will be served
// by the future website-scoped endpoints, so this file is not preview-only.

import { money, moneyOrRange, specOrRange } from '../../pages/Marketplace/Detail/marketplaceDetailShared';

const present = (v) => v !== null && v !== undefined && v !== '';

export function addressText(parts) {
  return [parts.addressLine || parts.street1, parts.city, parts.state].filter(present).join(', ');
}

// Card for property grids.
export function cardView(card) {
  const priceUnit = card.priceUnit === 'month' ? '/ month' : '';
  const price = card.priceAmount !== null && card.priceAmount !== undefined
    ? `${card.priceIsFrom ? 'From ' : ''}${money(card.priceAmount)}` : null;
  const facts = [
    { label: 'Beds', value: card.bedsRange || card.beds },
    { label: 'Baths', value: card.bathsRange || card.baths },
    { label: 'Sq Ft', value: card.sqftRange || (present(card.sqft) ? Number(card.sqft).toLocaleString() : null) },
  ].filter(f => present(f.value));
  return {
    id: card.id,
    isGroup: Boolean(card.isGroup),
    title: card.title,
    price,
    priceUnit: price ? priceUnit : '',
    address: addressText(card),
    image: card.coverImage || null,
    tag: card.typeTag || null,
    facts,
  };
}

// Detail page.
export function detailView(d) {
  if (!d) return null;
  const fees = d.fees || {};
  const isRent = d.listingType === 'RENT';
  const price = isRent
    ? moneyOrRange(fees.rentAmount, fees.rentAmountRange)
    : moneyOrRange(fees.askingPrice, fees.askingPriceRange);
  const deposit = present(fees.securityDeposit) || fees.securityDepositRange
    ? moneyOrRange(fees.securityDeposit, fees.securityDepositRange) : null;
  const applicationFee = present(fees.applicationFee) || fees.applicationFeeRange
    ? moneyOrRange(fees.applicationFee, fees.applicationFeeRange) : null;
  const leaseTerm = present(fees.leaseTermMonths) ? `${fees.leaseTermMonths} months`
    : (fees.leaseTerms && fees.leaseTerms.length ? `${fees.leaseTerms.join(', ')} months` : null);
  const area = d.sqftRange ? specOrRange(null, d.sqftRange, 'sq ft')
    : (present(d.sqft) ? `${Number(d.sqft).toLocaleString()} sq ft` : null);

  const facts = [
    { label: 'Bedrooms', value: d.bedsRange || d.beds },
    { label: 'Bathrooms', value: d.bathsRange || d.baths },
    { label: 'Interior', value: area },
    { label: 'Security Deposit', value: deposit },
    { label: 'Lease Term', value: leaseTerm },
  ].filter(f => present(f.value));

  const gallery = d.gallery || {};
  const photos = gallery.photos || [];
  const floorPlans = [
    ...(gallery.floorPlanImages || []),
    ...(d.floorPlan && d.floorPlan.imageUrl ? [d.floorPlan.imageUrl] : []),
  ];

  return {
    id: d.id,
    isGroup: Boolean(d.isGroup),
    title: d.title,
    description: d.description || '',
    highlights: Array.isArray(d.highlights) ? d.highlights.filter(present) : [],
    address: addressText(d.address || {}),
    price: price && price !== '—' ? price : null,
    priceUnit: isRent ? '/ month' : '',
    deposit,
    applicationFee,
    leaseTerm,
    facts,
    photos,
    floorPlans,
    floorPlanName: d.floorPlan ? d.floorPlan.name : null,
    amenities: Array.isArray(d.amenities) ? d.amenities : [],
    units: Array.isArray(d.units) ? d.units.map(u => ({
      id: u.id,
      label: u.label,
      beds: u.beds,
      baths: u.baths,
      sqft: u.sqft,
      price: present(u.price) ? money(u.price) : null,
      availableOn: u.availableOn,
    })) : [],
    leadContact: d.leadContact || null,
  };
}
