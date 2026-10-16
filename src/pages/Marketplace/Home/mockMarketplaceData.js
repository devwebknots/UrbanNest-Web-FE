// ─────────────────────────────────────────────────────────────────────────────
// UrbanNest — Marketplace homepage mock data.
// Session 50 — FE-first build (no public marketplace backend exists yet;
// every GET endpoint in the real `listings` app today is authenticated and
// creator/manager-scoped — see UrbanNest_Listing_Architecture.md §8.5/§16
// and claude/UrbanNest_ActiveBacklog.md). This file stands in for that API
// and is shaped to match it as closely as possible so swapping to real data
// later is a drop-in replacement, not a rewrite:
//
//   - category/property-type `value`s are the REAL `Property.PROPERTY_TYPE_
//     CHOICES` strings (properties/models.py) — only the display `label`s
//     are consumer-facing copy, same pattern the backend itself already
//     uses (machine value + human label are never required to match).
//   - bedroom-filter `value`s are the REAL `Unit.UNIT_TYPE_CHOICES` strings.
//     This replaces the reviewed Figma's "03 Bhk" control — the real
//     backend has no BHK concept anywhere (see
//     listings/Marketplace_Listing_Design_Review.md §2.7/§4.4) — with a
//     Bed Configuration filter that actually maps onto a real field.
//   - listing cards carry both a single-`Listing` shape (one Unit) and a
//     `isGroup: true` shape (a `PropertyListing` — see Listing Architecture
//     §8) so the homepage can route a multi-unit card to the property-level
//     page once that page exists, instead of spamming one card per unit.
//
// Rent-range buckets are a FE-only UI convenience over a numeric field
// (ListingRentalTerms.rent_amount / ListingSaleTerms.asking_price), not
// managed reference data — same category as a sort-order list, not covered
// by READ ME's "no hardcoded dropdown options" rule (that rule is about
// data UN Admin manages — property types, unit types, amenities, etc.).
//
// Photos: Unsplash placeholders, same established stopgap already used for
// the Landlord property gallery (see claude/UrbanNest_ActiveBacklog.md,
// L-7) pending real image upload (LST-3/LST-11).
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { value: 'INDIVIDUAL_HOUSE',    label: 'Single Family',  photo: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop' },
  { value: 'MULTI_FAMILY',        label: 'Multi Family',   photo: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=200&h=200&fit=crop' },
  { value: 'APARTMENT_COMPLEX',   label: 'Apartments',     photo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop' },
  { value: 'CONDOMINIUM',         label: 'Condos',         photo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=200&fit=crop' },
  { value: 'TOWNHOME',            label: 'Town Homes',     photo: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=200&h=200&fit=crop' },
  { value: 'STUDENT_HOUSING',     label: 'Student Housing',photo: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200&h=200&fit=crop' },
];

// Mirrors Unit.UNIT_TYPE_CHOICES (properties/models.py) — the homepage
// quick-filter only surfaces the 5 that make sense as a consumer "how many
// bedrooms" control; penthouse/student_room/serviced/commercial stay
// available on the full search/results page once it's built.
export const BEDROOM_OPTIONS = [
  { value: 'studio',   label: 'Studio' },
  { value: '1br',      label: '1 Bed' },
  { value: '2br',      label: '2 Bed' },
  { value: '3br',      label: '3 Bed' },
  { value: '4br_plus', label: '4+ Bed' },
];

export const RENT_RANGE_OPTIONS = [
  { value: '0-1000',    label: 'Under $1,000' },
  { value: '1000-2000', label: '$1,000 – $2,000' },
  { value: '2000-3000', label: '$2,000 – $3,000' },
  { value: '3000-5000', label: '$3,000 – $5,000' },
  { value: '5000-',     label: '$5,000+' },
];

export const LOCATION_OPTIONS = [
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York' },
  { value: 'TX', label: 'Texas' },
  { value: 'FL', label: 'Florida' },
  { value: 'IL', label: 'Illinois' },
];

// `tourVideo` — Session 50 addition: this section is exclusively for
// listing videos (a 3D-tour style walkthrough), not static photos. No real
// video-upload pipeline exists yet (same gap LST-3/LST-11 track for
// photos), so these point at small, long-standing public sample clips —
// not real-estate footage, just a stand-in for the real uploads, same
// placeholder discipline as the Unsplash photos used throughout this file
// (see L-7 backlog item). `coverImage` is kept and now doubles as each
// video's `poster` (shown before/if playback doesn't start).
//
// NOTE: the original pick here (commondatastorage.googleapis.com's sample
// bucket) silently failed to play — confirmed live via the browser's own
// console (`video.error` = MEDIA_ERR_SRC_NOT_SUPPORTED / "no source"),
// not a code bug. That exact domain is unreachable from this network
// (same domain this session's own sandbox proxy independently rejected
// outright) — most likely blocked by a firewall/extension that treats
// googleapis.com storage buckets as trackers. A second pass (media.w3.org /
// MDN / w3schools clips) fixed playback but was thematically wrong — a
// flower close-up and two animated-film trailers, not property footage.
// Replaced again with 3 free-license Mixkit real-estate clips
// (assets.mixkit.co — mixkit.co/free-stock-video/real-estate/, Mixkit's
// free license, no attribution required) that actually show a house/
// property being viewed, each live-verified playable on this network via
// the same in-browser `loadedmetadata`/`error` probe used for the prior
// swap.
export const EXCLUSIVE_LISTINGS = [
  {
    id: 'ex-1',
    isGroup: false,
    title: 'Single Home',
    listingType: 'RENT',
    promotionTag: 'Exclusive',
    priceAmount: 1200,
    priceUnit: 'month',
    addressLine: '5960 W 85th Pl',
    city: 'Los Angeles', state: 'CA', zip: '90045',
    beds: 2, baths: 2, sqft: 1056,
    coverImage: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&h=700&fit=crop',
    tourVideo: 'https://assets.mixkit.co/videos/8603/8603-360.mp4',
  },
  {
    id: 'ex-2',
    isGroup: false,
    title: 'Garden Cottage',
    listingType: 'RENT',
    promotionTag: 'Exclusive',
    priceAmount: 1450,
    priceUnit: 'month',
    addressLine: '214 Maple Ave',
    city: 'Dallas', state: 'TX', zip: '75201',
    beds: 2, baths: 1, sqft: 980,
    coverImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=700&fit=crop',
    tourVideo: 'https://assets.mixkit.co/videos/6021/6021-360.mp4',
  },
  {
    id: 'ex-3',
    isGroup: true,
    title: 'Horizon Residences',
    listingType: 'RENT',
    promotionTag: 'Exclusive',
    priceAmount: 1900,
    priceUnit: 'month',
    priceIsFrom: true,
    addressLine: '88 Harbor View Dr',
    city: 'San Diego', state: 'CA', zip: '92101',
    beds: 2, baths: 2, sqft: 1200,
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=700&fit=crop',
    tourVideo: 'https://assets.mixkit.co/videos/13106/13106-360.mp4',
  },
];

// `typeTag` — FE-only display label for now (no real field yet); once the
// marketplace endpoint is wired (see UN_Marketplace_Backend_Wiring_
// Evaluation_HomePage.md §4) this should be composed from the real
// `Property.property_type` + `Listing.listing_type`, not a literal string.
// `addressLine`/`addressLine2`/`zip` mirror the same composite-address
// shape already used by EXCLUSIVE_LISTINGS above (real `Property` fields
// are `street1`/`street2`/`city`/`state`/`zip_code` — see the same doc's
// §4(c)). `priceUnit` added for consistency with EXCLUSIVE_LISTINGS too.
export const NEARBY_LISTINGS = [
  { id: 'nb-1', title: 'Brother Homes', promotionTag: 'Premium', typeTag: 'Rental House', priceAmount: 1850, priceUnit: 'month', beds: 3, baths: 2, sqft: 1056, addressLine: '482 Pecan Grove Ln', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=380&fit=crop' },
  { id: 'nb-2', title: 'Modern single-family home for sale', promotionTag: 'Premium', hideHeader: true, priceAmount: 437900, priceUnit: 'sale', beds: 3, baths: 2, sqft: 1056, description: 'Beautifully updated single-family home with an open floor plan, modern kitchen, and a private backyard featuring a resort-style pool.', descriptionLines: 2, addressLine: '617 Live Oak Cir', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=380&fit=crop' },
  { id: 'nb-3', title: 'Centerton Apartments', promotionTag: 'Premium', typeTag: 'Rental House', priceIsFrom: true, priceAmount: 1560, priceUnit: 'month', bedsRange: '1-3', bathsRange: '2-4', sqftRange: '1780-2100', description: 'Centerton Apartments offers modern one, two, and three-bedroom residences minutes from downtown, with in-unit laundry, stainless steel appliances, and a resort-style pool. Residents also enjoy a 24-hour fitness center, covered parking, and a pet-friendly courtyard built for everyday comfort.', descriptionLines: 3, addressLine: '1203 Bluebonnet Trl', addressLine2: 'Unit 4', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=380&fit=crop' },
  { id: 'nb-4', title: 'Benton Student Housing', promotionTag: 'Premium', typeTag: 'Student Housing', priceIsFrom: true, priceAmount: 1560, priceUnit: 'month', bedsRange: '1-3', bathsRange: '2-4', sqftRange: '1780-2100', description: 'Benton Student Housing provides fully furnished units steps from campus, with flexible by-the-bed leasing and utilities included. Residents enjoy a 24-hour study lounge, on-site laundry, and a shuttle to class, plus secure keycard access and on-call maintenance.', descriptionLines: 3, addressLine: '94 Willow Creek Rd', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&h=380&fit=crop' },
  { id: 'nb-5', title: 'Brother Homes', promotionTag: 'Premium', typeTag: 'Rental House', priceAmount: 1850, priceUnit: 'month', beds: 3, baths: 2, sqft: 1056, addressLine: '356 Cedar Ridge Way', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=500&h=380&fit=crop' },
  { id: 'nb-6', title: 'Brother Homes', promotionTag: 'Premium', typeTag: 'Rental House', priceAmount: 1850, priceUnit: 'month', beds: 3, baths: 2, sqft: 1056, addressLine: '2210 Sunflower Ave', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=500&h=380&fit=crop' },
  { id: 'nb-7', title: 'Brother Homes', promotionTag: 'Premium', typeTag: 'Rental House', priceAmount: 1850, priceUnit: 'month', beds: 3, baths: 2, sqft: 1056, addressLine: '78 Magnolia Park Dr', addressLine2: 'Apt 2B', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=500&h=380&fit=crop' },
  { id: 'nb-8', title: 'Brother Homes', promotionTag: 'Premium', typeTag: 'Rental House', priceAmount: 1850, priceUnit: 'month', beds: 3, baths: 2, sqft: 1056, addressLine: '540 Longhorn Pass', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=500&h=380&fit=crop' },
  { id: 'nb-9', title: 'Brother Homes', promotionTag: 'Premium', typeTag: 'Rental House', priceAmount: 1850, priceUnit: 'month', beds: 3, baths: 2, sqft: 1056, addressLine: '812 Bluffview Ter', city: 'Austin', state: 'TX', zip: '78701', coverImage: 'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=500&h=380&fit=crop' },
];

// "12,000+ Properties" in the reviewed Figma was flat/identical per city —
// kept here as a single round mock count per city rather than faked-unique
// numbers, until a real GROUP BY city count query exists (see the
// evaluation note on confirming Property's actual address/city field shape
// before that endpoint gets built).
// `PROPERTY_GUIDES` — Session 50 addition: a compact "Resources & Guides"
// teaser section sitting between Rentals Near You and Popular Cities (per
// request, matching the reviewed illustration — 4 cards + an "Explore"
// link below). No blog/CMS backend exists for this content yet — these 4
// entries, their copy, and their photos are illustrative placeholders
// only, not real UrbanNest articles (same placeholder discipline as the
// rest of this file — see L-7). One card (`guide-2`) plays a video instead
// of a static photo, per request ("make one of them video") — reuses the
// same live-verified-reachable Mixkit real-estate clip already used in
// EXCLUSIVE_LISTINGS above rather than sourcing/testing a new one.
export const PROPERTY_GUIDES = [
  {
    id: 'guide-1',
    title: 'Renting Your First Home: What to Know',
    category: 'Renters',
    readTime: '4 min read',
    coverImage: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=700&h=460&fit=crop',
  },
  {
    id: 'guide-2',
    title: '5 Ways to Improve Your Rental Listing',
    category: 'Landlords',
    readTime: '3 min read',
    coverImage: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=700&h=460&fit=crop',
    video: 'https://assets.mixkit.co/videos/8603/8603-360.mp4',
  },
  {
    id: 'guide-3',
    title: 'What to Look for in a Neighborhood',
    category: 'Buyers & Renters',
    readTime: '4 min read',
    coverImage: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=700&h=460&fit=crop',
  },
  {
    id: 'guide-4',
    title: 'How to Market a Property Effectively',
    category: 'Property Owners',
    readTime: '5 min read',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&h=460&fit=crop',
  },
];

// NOTE: San Diego / Philadelphia / Jacksonville originally pointed at 3
// Unsplash photo IDs that have since been taken down (confirmed via a
// live fetch() from the running app — all 3 returned a real HTTP 404, not
// a network/rendering issue). Replaced with 3 different photo IDs,
// live-verified (fetch returned 200) before landing here; Philadelphia's
// is an explicitly-tagged Philadelphia City Hall photo, the other two are
// representative waterfront/bridge cityscapes in the same spirit as the
// rest of this list (none of these are claimed to be the literal
// official skyline of that exact city — same placeholder discipline as
// every other photo in this file).
export const POPULAR_CITIES = [
  { value: 'new-york',    label: 'New York / NY',    count: '12,000+', photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200&h=200&fit=crop' },
  { value: 'san-diego',   label: 'San Diego',         count: '8,200+',  photo: 'https://images.unsplash.com/photo-1514939775307-d44e7f10cabd?w=200&h=200&fit=crop' },
  { value: 'philadelphia',label: 'Philadelphia / PA', count: '6,400+',  photo: 'https://images.unsplash.com/photo-1517009572053-93fb56dfef49?w=200&h=200&fit=crop' },
  { value: 'houston',     label: 'Houston / TX',      count: '9,100+',  photo: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200&h=200&fit=crop' },
  { value: 'los-angeles', label: 'Los Angeles / CA',  count: '14,300+', photo: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=200&h=200&fit=crop' },
  { value: 'chicago',     label: 'Chicago / IL',      count: '10,700+', photo: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=200&h=200&fit=crop' },
  { value: 'jacksonville',label: 'Jacksonville / FL', count: '4,900+',  photo: 'https://images.unsplash.com/photo-1602725159577-73d77e7583b0?w=200&h=200&fit=crop' },
  { value: 'dallas',      label: 'Dallas / TX',       count: '11,200+', photo: 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=200&h=200&fit=crop' },
];
