// ─── Landlord Dashboard — sample (demo) data ─────────────────────────────────
// Shown ONLY where GET /landlord/dashboard/ gives nothing for a section (API not
// integrated yet, request failed, field missing or list empty). As soon as the
// backend returns real values for a field / list, those are shown instead.
//
//   withDemo(obj, demo)      → object: every field the API sends with a real value overrides the
//                              demo field. "No value" = null / undefined / '' / 0 / '0' / '0.00'
//                              (a zero means there is no data yet, so the sample is shown).
//   orDemo(list, demo, keys) → the API list when it has items AND (if `keys` given) at least one
//                              item has a non-zero value in one of those keys — e.g. a rent chart
//                              whose months are all $0 counts as empty. Otherwise the demo list.
//
// Demo prime assets have no `id`, so their "Details" button doesn't navigate anywhere.

const isBlank = (v) => {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);
  return n === 0;
};

export const withDemo = (obj, demo) => {
  const out = { ...demo };
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (!isBlank(v)) out[k] = v;
  });
  return out;
};

export const orDemo = (list, demo, keys) => {
  if (!Array.isArray(list) || list.length === 0) return demo;
  if (keys && !list.some(item => keys.some(k => !isBlank(item?.[k])))) return demo;
  return list;
};

export const DASHBOARD_DEMO = {
  landlord: {
    name: 'Marcus Vance',
    status: 'Portfolio Owner',
  },

  portfolio: {
    total_properties: 12,
    total_units: 84,
    active_tenants: 81,
  },

  kpis: {
    rent_collected_this_month: 428500,
    rent_collection_pct: 94.2,
    occupancy_rate: 96.4,
    new_leases_this_month: 8,
    open_tickets: 4,
    priority_tickets: 2,
    renewals_next_30_days: 6,
  },

  // 24 months (oldest → newest), deliberately uneven (high / low / medium) so the bars read
  // as a lively trend. Enough months for the rent card's mini bars to fill the card's full width
  // on wide screens; the big monthly chart shows the last 12.
  monthly_rent_chart: [
    { month: 'Dec', amount: 392000 },
    { month: 'Jan', amount: 168500 },
    { month: 'Feb', amount: 276000 },
    { month: 'Mar', amount: 451000 },
    { month: 'Apr', amount: 214800 },
    { month: 'May', amount: 322500 },
    { month: 'Jun', amount: 139000 },
    { month: 'Jul', amount: 408600 },
    { month: 'Aug', amount: 261400 },
    { month: 'Sep', amount: 476200 },
    { month: 'Oct', amount: 188900 },
    { month: 'Nov', amount: 347000 },
    { month: 'Dec', amount: 236500 },
    { month: 'Jan', amount: 442300 },
    { month: 'Feb', amount: 154700 },
    { month: 'Mar', amount: 301800 },
    { month: 'Apr', amount: 465900 },
    { month: 'May', amount: 207400 },
    { month: 'Jun', amount: 384100 },
    { month: 'Jul', amount: 172600 },
    { month: 'Aug', amount: 329500 },
    { month: 'Sep', amount: 458800 },
    { month: 'Oct', amount: 248300 },
    { month: 'Nov', amount: 428500 },
  ],

  rent_collection_trend: [
    { month: 'Jun', pct: 88 },
    { month: 'Jul', pct: 90 },
    { month: 'Aug', pct: 89 },
    { month: 'Sep', pct: 92 },
    { month: 'Oct', pct: 93 },
    { month: 'Nov', pct: 94.2 },
  ],

  prime_assets: [
    { name: 'Emerald Gardens Penthouse & Residences', address: 'Chelsea, SW3', total_units: 32,
      badge: 'ELITE LISTING', management_tag: 'PM_ACTIVE', occupancy_pct: 100, maint_open: 0 },
    { name: 'Regent Plaza Luxury Suites', address: 'Marylebone, W1', total_units: 28,
      badge: 'STABILIZED', management_tag: 'SELF', occupancy_pct: 96.4, maint_open: 1 },
    { name: 'Kingston Riverside Lofts', address: 'Kingston Upon Thames', total_units: 24,
      badge: 'STABILIZED', management_tag: 'PM_PASSIVE', occupancy_pct: 91.6, maint_open: 0 },
  ],

  open_operations: [
    { priority: 'HIGH', status: 'IN_PROGRESS', title: 'Regent Plaza #302 — HVAC pressure leak',
      property_name: 'Regent Plaza', location_note: 'Vendor: London Precision Heating', time_ago: '42m ago' },
    { priority: 'STANDARD', status: 'OPEN', title: 'Kingston Lofts #12 — Keyless intercom sync',
      property_name: 'Kingston Riverside Lofts', location_note: 'Remote diagnostics', time_ago: '3h ago' },
  ],

  tenant_pulse: [
    { name: 'Olivia Bennett', property_name: 'Emerald Gardens', unit_ref: 'Penthouse 1' },
    { name: 'James Whitaker', property_name: 'Regent Plaza', unit_ref: 'Apt 4B' },
    { name: 'Sophia Clarke', property_name: 'Kingston Riverside Lofts', unit_ref: 'Loft 12' },
  ],

  recent_payments: [
    { tenant_name: 'James Whitaker', property_name: 'Regent Plaza', unit_ref: 'Apt 4B', amount: 3450 },
    { tenant_name: 'Olivia Bennett', property_name: 'Emerald Gardens', unit_ref: 'Penthouse 1', amount: 6800 },
    { tenant_name: 'Sophia Clarke', property_name: 'Kingston Riverside Lofts', unit_ref: 'Loft 12', amount: 2950 },
  ],
};
