// ─── Landlord Property Detail — sample (demo) data ───────────────────────────
// Shown ONLY where GET /landlord/property/<id>/ gives nothing for a section (empty list, missing
// or zero value). Real backend values always win (same rules as dashboardDemoData.js).
//
// DISPLAY ONLY: modals that call the API (Bulk Add Service, List Multi Units, Edit Property) keep
// receiving the REAL units / amenities — sample rows are never sent to the backend.
// Sample units / tenants have ids starting with "demo-": their View Unit / links don't navigate.

export { withDemo, orDemo } from './dashboardDemoData';

export const isDemoId = id => String(id || '').startsWith('demo-');

export const PROPERTY_DEMO = {
  description: 'A calm, light-filled residence with landscaped courtyards, secure parking and easy access to transport — designed for long-term, hassle-free living.',

  stats: {
    total_units: 4,
    occupancy_pct: 75,
    collection_pct: 92,
    maint_open: 2,
  },

  ownerships: [
    { owner_name: 'Marcus Vance', share_pct: 100 },
  ],

  amenities: [
    { id: 'demo-a1', name: 'Balcony' },
    { id: 'demo-a2', name: 'CCTV' },
    { id: 'demo-a3', name: 'Parking' },
    { id: 'demo-a4', name: 'Elevator' },
    { id: 'demo-a5', name: 'Laundry' },
    { id: 'demo-a6', name: 'Gym' },
  ],

  units: [
    { id: 'demo-u1', unit_name: 'Unit 101', unit_type: '2 Bed', rent_amount: 2450, status: 'OCCUPIED', tenant_name: 'Olivia Bennett', rent_status: 'PAID',    lease_end: 'Mar 31, 2027', maint_open: 0 },
    { id: 'demo-u2', unit_name: 'Unit 102', unit_type: '1 Bed', rent_amount: 1850, status: 'OCCUPIED', tenant_name: 'James Whitaker', rent_status: 'PAID',    lease_end: 'Aug 15, 2027', maint_open: 1 },
    { id: 'demo-u3', unit_name: 'Unit 201', unit_type: '3 Bed', rent_amount: 3200, status: 'OVERDUE',  tenant_name: 'Sophia Clarke',  rent_status: 'OVERDUE', lease_end: 'Dec 01, 2026', maint_open: 1 },
    { id: 'demo-u4', unit_name: 'Unit 202', unit_type: 'Studio', rent_amount: 1400, status: 'VACANT', tenant_name: null,           rent_status: null,      lease_end: null,           maint_open: 0 },
  ],

  open_tickets: [
    { id: 'demo-t1', title: 'Kitchen sink leak — Unit 102', priority: 'HIGH',     status: 'IN_PROGRESS', time_ago: '2h ago' },
    { id: 'demo-t2', title: 'Hallway light replacement',    priority: 'STANDARD', status: 'OPEN',        time_ago: '1d ago' },
  ],

  // Rent collection chart (monthly, $) — deliberately uneven so the bars read as a real trend
  rent: [
    { month: 'MAY', amount: 3850 },
    { month: 'JUN', amount: 2100 },
    { month: 'JUL', amount: 4600 },
    { month: 'AUG', amount: 3200 },
    { month: 'SEP', amount: 5400 },
    { month: 'OCT', amount: 4250 },
  ],
};

// ─── Landlord Unit Detail — sample (demo) data ───────────────────────────────
// Shown ONLY in the unit page's Tenant card when GET /landlord/property/<id>/unit/<uid>/ has no
// tenant_profile (current) or no past_tenants (past). Display only: the header's Vacant / Occupied
// and the Unit Status card always use the REAL tenant. Fields match the API shape so the eye
// detail pop-up works for sample rows too.
export const UNIT_DEMO = {
  // Unit & Lease Overview — fills a row only when the unit has no value for it
  overview: { unit_type: '2 Bedroom', rooms: 2, baths: 2, lease_term: '12 Months', notice_period: '30 Days' },
  tenant: {
    id: 'demo-t1', tenant_id: 'TNT-1042', name: 'Olivia Bennett', email: 'olivia.bennett@example.com',
    occupation: 'Product Designer', company: 'Northwind Studio',
    move_in_date: 'Apr 01, 2025', lease_start_date: 'Apr 01, 2025', lease_end_date: 'Mar 31, 2027',
    renewal_window: 'Jan 01 – Mar 31, 2027', payment_rating: 5,
  },
  past_tenants: [
    { id: 'demo-t2', tenant_id: 'TNT-0987', name: 'James Whitaker', email: 'james.whitaker@example.com',
      occupation: 'Software Engineer', company: 'Brightline Labs',
      move_in_date: 'Mar 15, 2023', lease_start_date: 'Mar 15, 2023', lease_end_date: 'Mar 14, 2025', payment_rating: 4 },
    { id: 'demo-t3', tenant_id: 'TNT-0815', name: 'Sophia Clarke', email: 'sophia.clarke@example.com',
      occupation: 'Nurse', company: 'St. Mary Hospital',
      move_in_date: 'Feb 01, 2021', lease_start_date: 'Feb 01, 2021', lease_end_date: 'Jan 31, 2023', payment_rating: 5 },
  ],
  // Maintenance Queue — shown when the unit has no tickets (same fields as the API's maintenance rows)
  maintenance: [
    { id: 'demo-m1', ticket_id: 'MT-1284', title: 'Leaking kitchen faucet',     priority: 'HIGH',   status: 'OPEN',        time_ago: '2h ago' },
    { id: 'demo-m2', ticket_id: 'MT-1283', title: 'AC not cooling in bedroom',  priority: 'MEDIUM', status: 'IN_PROGRESS', time_ago: '1d ago' },
    { id: 'demo-m3', ticket_id: 'MT-1281', title: 'Replace hallway light bulb', priority: 'LOW',    status: 'SCHEDULED',   time_ago: '3d ago' },
  ],
  // Special Features / Amenities — shown when the unit has none configured (same { id, name } shape as the API)
  features: [
    { id: 'demo-f1', name: 'Air Condition' }, { id: 'demo-f2', name: 'Furnished' },    { id: 'demo-f3', name: 'Intercom' },
    { id: 'demo-f4', name: 'Balcony' },       { id: 'demo-f5', name: 'Security System' }, { id: 'demo-f6', name: 'Power Backup' },
  ],
  amenities: [
    { id: 'demo-a1', name: 'Balcony' },         { id: 'demo-a2', name: 'CCTV' },    { id: 'demo-a3', name: 'Elevator / Lift' },
    { id: 'demo-a4', name: 'Gated Community' }, { id: 'demo-a5', name: 'Parking' }, { id: 'demo-a6', name: 'Dishwasher' },
  ],
};
