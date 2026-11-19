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
