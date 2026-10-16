import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import PermissionGuard from './components/common/PermissionGuard';

// Auth
import LoginModal           from './pages/Login/LoginModal';
import LoginPage            from './pages/Login/LoginPage';
import SignUpPage           from './pages/SignUp/SignUpPage';
import OTPVerificationPage  from './pages/OTP/OTPVerificationPage';
import PersonaSelectPage    from './pages/PersonaSelect/PersonaSelectPage';
import ComingSoonPage       from './pages/ComingSoon/ComingSoonPage';

// Independent PM registration wizard
import IndependentPM_Step1  from './pages/IndependentPM/IndependentPM_Step1';
import IndependentPM_Step2  from './pages/IndependentPM/IndependentPM_Step2';
import IndependentPM_Step3  from './pages/IndependentPM/IndependentPM_Step3';

// Landlord registration wizard
import LandlordOnboarding_Step1 from './pages/Landlord/Onboarding/LandlordOnboarding_Step1';
import LandlordOnboarding_Step2 from './pages/Landlord/Onboarding/LandlordOnboarding_Step2';
import LandlordOnboarding_Step3 from './pages/Landlord/Onboarding/LandlordOnboarding_Step3';

// PM Portal
import PMDashboard          from './pages/PMPortal/Dashboard/PMDashboard';
import PMWelcomePage        from './pages/PMPortal/Dashboard/PMWelcomePage';
// Session 49 nav consolidation, folder cleanup — these 6 files used to live
// under pages/PMPortal/Profile/ (a holdover from before Account Settings
// existed as its own concept). Moved to their own pages/PMPortal/
// AccountSettings/ folder so the directory structure matches what they
// actually are. PM Portal's old "Account Settings" nav item used to be a
// separate, entirely dead-link nav section (Profile & Billing / Modules &
// Features / Integrations, none of them routed anywhere). Folded together
// with the old "My Profile" section into one real Account Settings entry
// with 6 tabs — see NavB.jsx and claude/UrbanNest_ActiveBacklog.md.
import PMProfileView        from './pages/PMPortal/AccountSettings/PMProfileView';
import PMSubscriptionPage   from './pages/PMPortal/AccountSettings/PMSubscriptionPage';
import PMBankAccountsTab    from './pages/PMPortal/AccountSettings/PMBankAccountsTab';
import PMTransactionsTab    from './pages/PMPortal/AccountSettings/PMTransactionsTab';
import PMIntegrationsTab    from './pages/PMPortal/AccountSettings/PMIntegrationsTab';
import PMVerificationSettings from './pages/PMPortal/Config/PMVerificationSettings';
import PMListingReadiness from './pages/PMPortal/Config/PMListingReadiness';

// UN Admin Portal
import UNAdminShell          from './pages/UNAdminPortal/UNAdminShell';
import UNAdminDashboard      from './pages/UNAdminPortal/Dashboard/UNAdminDashboard';
import UNAdminServiceCatalog from './pages/UNAdminPortal/Services/Catalog/UNAdminServiceCatalog';
import UNAdminPlanCatalog    from './pages/UNAdminPortal/Plans/UNAdminPlanCatalog';
import UNAdminOnboardDocs    from './pages/UNAdminPortal/OnboardDocs/UNAdminOnboardDocs';
import UNAdminApplicationReview from './pages/UNAdminPortal/Applications/UNAdminApplicationReview';
import UNAdminReferenceData from './pages/UNAdminPortal/Configurations/References/UNAdminReferenceData';
import UNAdminMiscConfig from './pages/UNAdminPortal/Configurations/Miscellaneous/UNAdminMiscConfig';
// Session 50 — UNAdminListingReadiness now renders inside UNAdminRuleEngine's
// "Listings" tab (unchanged, just relocated) rather than being routed here
// directly; see UNAdminRuleEngine.jsx.
import UNAdminRuleEngine from './pages/UNAdminPortal/Configurations/RuleEngine/UNAdminRuleEngine';

// UN Admin Portal — Advertise & Monetise — Promotion Engine (Session 48).
// FE-first build, sample-data driven (Product Catalog → Campaigns →
// Analytics & Audit → Overview), per Listings_Overview_Design_Review.md's
// precedent of shipping the UI ahead of any backend model. Shell tab
// switcher wraps all four sub-screens — see PromotionEngine.jsx header.
import PromotionEngine from './pages/UNAdminPortal/Advertise/PromotionEngine/PromotionEngine';

// PMS Onboarding (existing — pending refactor)
import PMSOnboardingStep1   from './PMS_Onboarding_Step1';

// Org PMS Onboarding
import OrgPMS_Step1_CompanyPortfolio   from './pages/OrgPMSOnboarding/OrgPMS_Step1_CompanyPortfolio';
import OrgPMS_Step2_DocumentUpload     from './pages/OrgPMSOnboarding/OrgPMS_Step2_DocumentUpload';
import OrgPMS_Step3_IntegrationMethod  from './pages/OrgPMSOnboarding/OrgPMS_Step3_IntegrationMethod';
import OrgPMS_Step4_PlanSelection      from './pages/OrgPMSOnboarding/OrgPMS_Step4_PlanSelection';
import OrgPMS_Step5_AdditionalServices from './pages/OrgPMSOnboarding/OrgPMS_Step5_AdditionalServices';
import OrgPMS_Step6_Payment            from './pages/OrgPMSOnboarding/OrgPMS_Step6_Payment';
import OrgPMS_Step7_ReviewSubmit       from './pages/OrgPMSOnboarding/OrgPMS_Step7_ReviewSubmit';
import OrgPMS_PendingStatus            from './pages/OrgPMSOnboarding/OrgPMS_PendingStatus';

// Properties
import AddNewProperty from "./pages/Properties/AddProperty/AddNewProperty";
import PMPropertiesPage from './pages/Properties/PMPropertiesPage';
import PMPortfolioPage from './pages/Properties/PMPortfolioPage';
import PMPropertyDetailPage from './pages/Properties/PMPropertyDetailPage';
import PMUnitDetailPage from './pages/Properties/PMUnitDetailPage';
import EditPropertyPage from './pages/Properties/EditProperty/EditPropertyPage';
import EditUnitPage     from './pages/Properties/EditProperty/EditUnitPage';
import { useParams } from 'react-router-dom';

// PM-Portal/Approvals
import PMApprovalsOverview  from './pages/PMPortal/Approvals/PMApprovalsOverview';
import PMApprovalsOwnership from './pages/PMPortal/Approvals/PMApprovalsOwnership';

// PM-Portal/RBAC
import PMRolesPage    from './pages/PMPortal/RBAC/PMRolesPage';
import PMAssignPage   from './pages/PMPortal/RBAC/PMAssignPage';
import PMMembersPage  from './pages/PMPortal/RBAC/PMMembersPage';
import PMOrgPage      from './pages/PMPortal/RBAC/PMOrgPage';
import PMStaffSignupPage from './pages/PMPortal/RBAC/PMStaffSignupPage';

// PM Portal — Create Listing wizard (Session 47 — Independent PM / Org PM
// Listing capability. A deliberate duplicate of the Landlord wizard's
// shell/tokens, not a persona-prop extension — see
// pmListingWizardShared.jsx's header comment. Org PM live-testing was a
// follow-up slice, done Session 47.
import PMListingStep1_Property from './pages/PMPortal/Listing/PMListingStep1_Property';
import PMListingStep2_Unit from './pages/PMPortal/Listing/PMListingStep2_Unit';
import PMListingStep3_Promote from './pages/PMPortal/Listing/PMListingStep3_Promote';
import PMListingStep4_Publish from './pages/PMPortal/Listing/PMListingStep4_Publish';

// PM Portal — Multi-Unit Listing wizard (LST-12 — PM Portal entry point into
// the Multi-Unit flow). A deliberate duplicate of the Landlord Multi-Unit
// wizard's 4 step files, same reasoning as the Individual wizard above —
// see PMListMultiStep1_Property.jsx's own header note. Entry point is
// PMPropertyDetailPage.jsx's "List Multi Units" button →
// PMUnitSelection.jsx (the real LST-8 readiness gate).
import PMListMultiStep1_Property from './pages/PMPortal/Listing/PMListMultiStep1_Property';
import PMListMultiStep2_Unit from './pages/PMPortal/Listing/PMListMultiStep2_Unit';
import PMListMultiStep3_Promote from './pages/PMPortal/Listing/PMListMultiStep3_Promote';
import PMListMultiStep4_Publish from './pages/PMPortal/Listing/PMListMultiStep4_Publish';

// PM Portal — Marketing → Listings dashboard (Session 47 follow-up).
// NavB.jsx's 'listings' nav item already pointed at
// '/pm-portal/marketing/listings' with no route behind it — this is that
// route. FE-first build per Listings_Overview_Design_Review.md §7: every
// section renders off in-memory mock data for now (no backend wiring yet),
// with "sample" sections carrying a permanent Sample Data watermark.
import PMListingsOverview from './pages/PMPortal/Listing/PMListingsOverview';

// Landlord Portals
import LandlordDashboard from './pages/Landlord/LandlordDashboard';
import LandlordPortfolioPage from './pages/Landlord/LandlordPortfolioPage';
import LandlordPropertyDetailPage from './pages/Landlord/LandlordPropertyDetailPage';
import LandlordUnitDetailPage from './pages/Landlord/LandlordUnitDetailPage';
import LandlordSettingsPage from './pages/Landlord/Account Settings/LandlordSettingsPage';

// Landlord — Create Listing wizard (Session 41 FE build; wired to the real
// `listings` backend Session 43 — see listingApi.js). Step 4 was built
// Session 41 but never actually imported/routed here until now.
import ListingStep1_Property from './pages/Landlord/Listing/ListingStep1_Property';
import ListingStep2_Unit from './pages/Landlord/Listing/ListingStep2_Unit';
import ListingStep3_Promote from './pages/Landlord/Listing/ListingStep3_Promote';
import ListingStep4_Publish from './pages/Landlord/Listing/ListingStep4_Publish';
import ListMultiStep1_Property from './pages/Landlord/Listing/ListMultiStep1_Property';
import ListMultiUnits from './pages/Landlord/Listing/ListMultiUnits';
import ListMultiStep3_Promote from './pages/Landlord/Listing/ListMultiStep3_Promote';
import ListMultiStep4_Publish from './pages/Landlord/Listing/ListMultiStep4_Publish';

// Landlord — Listings Overview dashboard. Lean counterpart to the PM
// Portal's own PMListingsOverview above — same backend endpoint (pm-
// overview is portal-agnostic despite the name — see that file's own
// header comment), deliberately without the donut/opportunities/bulk-
// select machinery a PM-scale dashboard needs.
import LandlordListingsOverview from './pages/Landlord/Listing/LandlordListingsOverview';

// Invite for all email/phone verifications
import VerifyOwnershipPage from './pages/Invite/VerifyOwnershipPage';

// Marketplace (public, consumer-facing) — Session 50. FE-first homepage
// build against mock data; no public marketplace backend exists yet. Same
// "public page" pattern as VerifyOwnershipPage below — no nav shell, no
// PermissionGuard.
import MarketplaceHomePage from './pages/Marketplace/Home/MarketplaceHomePage';

// Payment- Cart/Payment Gateway
import { PaymentCartProvider } from './pages/Payment/PaymentCartContext';

// Session 40 — L-4 fix: AddUnitWrapper previously took no props and always
// hardcoded persona="INDEPENDENT_PM" when calling AddNewProperty. The
// Landlord standalone "+ Add Unit" route (added S39) already passed
// persona="LANDLORD" into <AddUnitWrapper persona="LANDLORD" />, but since
// this component never declared a `persona` param, that prop was silently
// dropped — AddNewProperty always fell back to its own default
// (persona = 'INDEPENDENT_PM'), rendering the PM-styled shell for landlords.
// Fix: accept `persona` with the same default as before, so the existing
// PM route (/pm-portal/properties/:id/add-unit, which renders
// <AddUnitWrapper /> with no persona prop) is completely unaffected, while
// the Landlord route's persona="LANDLORD" now actually reaches
// AddNewProperty.
//
// NOTE (still open, not fixed here): the architecture doc also flags that
// the property fetch inside AddNewProperty (GET /api/properties/:id/,
// used to pre-load property name/owners when initialPropertyId is set)
// 404s for self-managed landlord properties (managed_by IS NULL). That's a
// backend-side scoping issue in the properties app view, not something
// fixable from this file — needs properties/views.py to confirm.
function AddUnitWrapper({ persona = 'INDEPENDENT_PM' }) {
  const { id } = useParams();
  return (
    <AddNewProperty
      persona={persona}
      initialPropertyId={id}
    />
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Routes>

      {/* ── Auth ──────────────────────────────────────────────────────────── */}
      <Route path="/"           element={<LoginModal />} />
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/signup"     element={
        <SignUpPage
          onNavigateToLogin={() => navigate('/login')}
          onNavigateToOTP={(data) => navigate('/verify-otp', { state: data })}
        />
      } />
      <Route path="/verify-otp" element={
        <OTPVerificationPage
          email={location.state?.email}
          phone={location.state?.phone}
          onVerified={() => navigate('/persona-select')}
          onBack={() => navigate('/signup')}
        />
      } />
      <Route path="/persona-select" element={<PersonaSelectPage />} />
      <Route path="/pm-staff-signup" element={<PMStaffSignupPage />} />


      {/* ── Independent PM registration wizard ────────────────────────────── */}
      <Route path="/pm-registration"        element={<IndependentPM_Step1 />} />
      <Route path="/pm-registration/step-2" element={<IndependentPM_Step2 />} />
      <Route path="/pm-registration/step-3" element={<IndependentPM_Step3 />} />

      {/* ── Landlord registration wizard ────────────────────────────── */}
      <Route path="/landlord-registration/step-1" element={<LandlordOnboarding_Step1 />} />
      <Route path="/landlord-registration/step-2" element={<LandlordOnboarding_Step2 />} />
      <Route path="/landlord-registration/step-3" element={<LandlordOnboarding_Step3 />} />

      {/* ── PM Portal ─────────────────────────────────────────────────────── */}
      <Route path="/pm-portal/dashboard/welcome"      element={<PMWelcomePage persona="INDEPENDENT_PM" />} />
      <Route path="/pm-portal/dashboard/my-dashboard" element={<PMDashboard   persona="INDEPENDENT_PM" />} />
      {/* Session 49 nav consolidation — old "My Profile" routes kept as
          redirects to the new Account Settings tabs, in case anything else
          still links to them. */}
      <Route path="/pm-portal/profile/persona"        element={<Navigate to="/pm-portal/account/profile" replace />} />
      <Route path="/pm-portal/profile/subscription"   element={<Navigate to="/pm-portal/account/subscription" replace />} />

      {/* ── PM Portal / Account Settings (Session 49 nav consolidation) ───
          One real section, 6 tabs — replaces the old "My Profile" nav item
          (Persona, Subscription & Trial) and the old "Account Settings" nav
          item (Profile & Billing / Modules & Features / Integrations), none
          of which had routes behind them. See NavB.jsx. */}
      <Route path="/pm-portal/account/profile"         element={<PMProfileView />} />
      <Route path="/pm-portal/account/bank-accounts"   element={<PMBankAccountsTab />} />
      <Route path="/pm-portal/account/subscription"    element={<PMSubscriptionPage />} />
      <Route path="/pm-portal/account/services"        element={<PMSubscriptionPage />} />
      <Route path="/pm-portal/account/transactions"    element={<PMTransactionsTab />} />
      <Route path="/pm-portal/account/integrations"    element={<PMIntegrationsTab />} />
      <Route path="/pm-portal/config/verification-settings" element={<PMVerificationSettings />} />
      <Route path="/pm-portal/config/listing-readiness"     element={<PMListingReadiness />} />

      {/* ── PM Portal/ Approvals ─────────────────────────────────────────────────────── */}
      <Route path="/pm-portal/approvals"           element={<PermissionGuard module="APPROVALS"><PMApprovalsOverview /></PermissionGuard>} />
      <Route path="/pm-portal/approvals/ownership" element={<PermissionGuard module="APPROVALS"><PMApprovalsOwnership /></PermissionGuard>} />

      {/* ── PM Portal/ Marketing ─────────────────────────────────────────────────────── */}
      <Route path="/pm-portal/marketing/listings" element={<PermissionGuard module="MARKETING"><PMListingsOverview /></PermissionGuard>} />

      {/* ── PM Portal/ RBAC ─────────────────────────────────────────────────────── */}
      <Route path="/pm-portal/rbac/roles"   element={<PermissionGuard module="ROLES_ACCESS"><PMRolesPage /></PermissionGuard>} />
      <Route path="/pm-portal/rbac/assign"  element={<PermissionGuard module="ROLES_ACCESS"><PMAssignPage /></PermissionGuard>} />
      <Route path="/pm-portal/rbac/members" element={<PermissionGuard module="ROLES_ACCESS"><PMMembersPage /></PermissionGuard>} />
      <Route path="/pm-portal/rbac/org"     element={<PermissionGuard module="ROLES_ACCESS"><PMOrgPage /></PermissionGuard>} />


      {/* ── Org PMS Portal — reuses PM dashboard (NavD when Org-specific nav needed) ── */}
      <Route path="/org-portal/dashboard/welcome"      element={<PMWelcomePage persona="ORGANIZATIONAL_PM" />} />
      <Route path="/org-portal/dashboard/my-dashboard" element={<PMDashboard persona="ORGANIZATIONAL_PM" />} />

      {/* ── Landlord Portals ── */}
      <Route path="/landlord-portal/dashboard" element={<LandlordDashboard />} />
      <Route path="/landlord-portal/portfolio" element={<LandlordPortfolioPage />} />
      <Route path="/landlord-portal/property/:id" element={<LandlordPropertyDetailPage />} />
      <Route path="/landlord-portal/property/:id/unit/:uid" element={<LandlordUnitDetailPage />} />
      <Route path="/landlord-portal/add-property" element={<AddNewProperty persona="LANDLORD" />} />
      <Route path="/landlord-portal/property/:id/add-unit" element={<AddUnitWrapper persona="LANDLORD" />} />
      <Route path="/landlord-portal/settings" element={<LandlordSettingsPage />} />
      <Route path="/landlord-portal/listings" element={<LandlordListingsOverview />} />

      {/* ── Landlord — Create Listing wizard (Session 41) ── */}
      <Route path="/landlord-portal/property/:id/unit/:uid/list/step-1" element={<ListingStep1_Property />} />
      <Route path="/landlord-portal/property/:id/unit/:uid/list/step-2" element={<ListingStep2_Unit />} />
      <Route path="/landlord-portal/property/:id/unit/:uid/list/step-3" element={<ListingStep3_Promote />} />
      <Route path="/landlord-portal/property/:id/unit/:uid/list/step-4" element={<ListingStep4_Publish />} />

      {/* ── Landlord — Multi-Unit Listing (Session 44 — wired to /api/property-listings/, see propertyListingApi.js) ── */}
      <Route path="/landlord-portal/property/:id/list-multi/step-1" element={<ListMultiStep1_Property />} />
      <Route path="/landlord-portal/property/:id/list-multi/step-2" element={<ListMultiUnits />} />
      <Route path="/landlord-portal/property/:id/list-multi/step-3" element={<ListMultiStep3_Promote />} />
      <Route path="/landlord-portal/property/:id/list-multi/step-4" element={<ListMultiStep4_Publish />} />

      {/* ── UN Admin Portal ───────────────────────────────────────────────── */}
      <Route path="/admin-portal/dashboard" element={
        <UNAdminShell activeId="dashboard" title="Dashboard">
          <UNAdminDashboard />
        </UNAdminShell>
      } />
      <Route path="/admin-portal/services/catalog" element={
        <UNAdminShell activeId="services-catalog" title="Service Catalog">
          <UNAdminServiceCatalog />
        </UNAdminShell>
      } />
      <Route path="/admin-portal/config/plans" element={
        <UNAdminShell activeId="config-plans" title="Plan Catalog">
          <UNAdminPlanCatalog />
        </UNAdminShell>
      } />
      <Route path="/admin-portal/config/onboard-docs" element={
        <UNAdminShell activeId="config-onboard-docs" title="Onboarding Documents">
          <UNAdminOnboardDocs />
        </UNAdminShell>
      } />
      <Route path="/admin-portal/operations/applications" element={
        <UNAdminShell activeId="operations-applications" title="Application Review">
          <UNAdminApplicationReview />
        </UNAdminShell>
      } />
      <Route path="/admin-portal/config/reference" element={
        <UNAdminShell activeId="reference-data" title="Reference Data">
          <UNAdminReferenceData />
        </UNAdminShell>
      } />
      {/* Session 50 — "Listing Readiness Rules" became the "Listings" tab of
          the new Rule Engine screen (same content, unchanged); the old URL
          below redirects so any existing bookmark still works. */}
      <Route path="/admin-portal/config/rule-engine" element={
        <UNAdminShell activeId="config-rule-engine" title="Rule Engine">
          <UNAdminRuleEngine />
        </UNAdminShell>
      } />
      <Route path="/admin-portal/config/listing-readiness" element={<Navigate to="/admin-portal/config/rule-engine" replace />} />
      <Route path="/admin-portal/config/miscellaneous" element={
        <UNAdminShell activeId="misc-config" title="Miscellaneous Configurations">
          <UNAdminMiscConfig />
        </UNAdminShell>
      } />
      {/* Session 48 — Advertise & Monetise — Promotion Engine. Single tabbed
          page (Overview / Product Catalog / Campaigns / Analytics & Audit)
          per the user's confirmed nav-wiring decision — one new NavE child,
          the 3 existing advertise-* placeholders are left untouched. */}
      <Route path="/admin-portal/advertise/promotion-engine" element={
        <UNAdminShell activeId="advertise-promotion-engine" title="Promotion Engine">
          <PromotionEngine />
        </UNAdminShell>
      } />

      {/* ── PMS Onboarding (existing — pending refactor) ──────────────────── */}
      <Route path="/onboarding" element={<PMSOnboardingStep1 />} />

      {/* ── Placeholders ──────────────────────────────────────────────────── */}
      <Route path="/coming-soon" element={<ComingSoonPage />} />

      {/* ── Organizational PMS onboarding wizard ──────────────────────────── */}
      <Route path="/org-onboarding/step-1"   element={<OrgPMS_Step1_CompanyPortfolio />} />
      <Route path="/org-onboarding/step-2"   element={<OrgPMS_Step2_DocumentUpload />} />
      <Route path="/org-onboarding/step-3"   element={<OrgPMS_Step3_IntegrationMethod />} />
      <Route path="/org-onboarding/step-4"   element={<OrgPMS_Step4_PlanSelection />} />
      <Route path="/org-onboarding/step-5"   element={<OrgPMS_Step5_AdditionalServices />} />
      <Route path="/org-onboarding/step-6"   element={<OrgPMS_Step6_Payment />} />
      <Route path="/org-onboarding/step-7"   element={<OrgPMS_Step7_ReviewSubmit />} />
      {/* Standalone pending/waiting screen — shown when user clicks PENDING persona card */}
      <Route path="/org-onboarding/pending"  element={<OrgPMS_PendingStatus />} />

      {/* ── Properties  ──────────────────────────── */}
      <Route path="/pm-portal/properties"     element={<PermissionGuard module="PROPERTIES"><PMPropertiesPage /></PermissionGuard>} />
      <Route path="/pm-portal/properties/add" element={<PermissionGuard module="PROPERTIES"><AddNewProperty persona="INDEPENDENT_PM" /></PermissionGuard>} />
      <Route path="/org-portal/properties/add"  element={<AddNewProperty persona="ORGANIZATIONAL_PM" />} />
      <Route path="/pm-portal/properties/portfolio/:propertyType" element={<PMPortfolioPage />} />
      <Route path="/pm-portal/properties/:id" element={<PMPropertyDetailPage />} />
      <Route path="/pm-portal/properties/:id/units/:unitId" element={<PMUnitDetailPage />} />
      <Route path="/pm-portal/properties/:id/edit"                    element={<EditPropertyPage />} />
      <Route path="/pm-portal/properties/:id/units/:unitId/edit"      element={<EditUnitPage />} />
      <Route path="/pm-portal/properties/:id/add-unit" element={<AddUnitWrapper />} />

      {/* ── PM Portal — Create Listing wizard (Session 47) ────────────────── */}
      <Route path="/pm-portal/properties/:id/units/:unitId/list/step-1" element={<PermissionGuard module="MARKETING"><PMListingStep1_Property /></PermissionGuard>} />
      <Route path="/pm-portal/properties/:id/units/:unitId/list/step-2" element={<PermissionGuard module="MARKETING"><PMListingStep2_Unit /></PermissionGuard>} />
      <Route path="/pm-portal/properties/:id/units/:unitId/list/step-3" element={<PermissionGuard module="MARKETING"><PMListingStep3_Promote /></PermissionGuard>} />
      <Route path="/pm-portal/properties/:id/units/:unitId/list/step-4" element={<PermissionGuard module="MARKETING"><PMListingStep4_Publish /></PermissionGuard>} />

      {/* ── PM Portal — Multi-Unit Listing wizard (LST-12) ─────────────────── */}
      <Route path="/pm-portal/properties/:id/list-multi/step-1" element={<PermissionGuard module="MARKETING"><PMListMultiStep1_Property /></PermissionGuard>} />
      <Route path="/pm-portal/properties/:id/list-multi/step-2" element={<PermissionGuard module="MARKETING"><PMListMultiStep2_Unit /></PermissionGuard>} />
      <Route path="/pm-portal/properties/:id/list-multi/step-3" element={<PermissionGuard module="MARKETING"><PMListMultiStep3_Promote /></PermissionGuard>} />
      <Route path="/pm-portal/properties/:id/list-multi/step-4" element={<PermissionGuard module="MARKETING"><PMListMultiStep4_Publish /></PermissionGuard>} />

      // Temporary placeholder — replace with PMPropertyDetailPage when built
      {/* NOTE (found, not fixed, this session — see LST-18 in the backlog):
          this route is dead code. The real PMPropertyDetailPage route,
          registered earlier under "── Properties ──"
          (/pm-portal/properties/:id), already matches this exact path and
          wins (React Router v6 takes the first match), so this placeholder
          can never render. Left as-is per this session's own discipline —
          out-of-scope cleanup gets flagged, not folded into the LST-12
          routing change above. */}
      <Route path="/pm-portal/properties/:id" element={
        <div style={{ padding: 40, fontFamily: 'Nunito Sans, sans-serif', color: '#0F172A' }}>
          Property Detail page — coming soon
        </div>
      } />

      {/* ── Invites ──────────────────────────────────────────────────── */}
      <Route path="/verify-ownership" element={<VerifyOwnershipPage />} />

      {/* ── Marketplace (public) ─────────────────────────────────────── */}
      <Route path="/marketplace" element={<MarketplaceHomePage />} />

    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <PaymentCartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PaymentCartProvider>
    </AuthProvider>
  );
}


export default App;
