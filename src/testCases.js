// ─── Test cases — UI preview switches ────────────────────────────────────────
// Flip a flag to true to force a screen / pop-up open so its UI can be checked without going through the
// real flow (no payment, no API call). Set every flag back to false before committing / shipping.
//
//   true  = always show it (preview)
//   false = normal behaviour (only after the real action)

export const TEST_CASES = {
  // Create Listing · Step 4 (Review & Publish) — the Pay & Publish success pop-up (SuccessModal).
  // Opens as soon as Step 4 has loaded: /landlord-portal/property/<id>/unit/<uid>/list/step-4
  showListingPublishedModal: false,
};
