import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

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

// PM Portal
import PMDashboard          from './pages/PMPortal/Dashboard/PMDashboard';
import PMWelcomePage        from './pages/PMPortal/Dashboard/PMWelcomePage';
import PMProfileView        from './pages/PMPortal/Profile/PMProfileView';

// UN Admin Portal
import UNAdminShell          from './pages/UNAdminPortal/UNAdminShell';
import UNAdminDashboard      from './pages/UNAdminPortal/Dashboard/UNAdminDashboard';
import UNAdminServiceCatalog from './pages/UNAdminPortal/Services/Catalog/UNAdminServiceCatalog';
import UNAdminPlanCatalog    from './pages/UNAdminPortal/Plans/UNAdminPlanCatalog';
import UNAdminOnboardDocs    from './pages/UNAdminPortal/OnboardDocs/UNAdminOnboardDocs';
import UNAdminApplicationReview from './pages/UNAdminPortal/Applications/UNAdminApplicationReview';
import UNAdminReferenceData from './pages/UNAdminPortal/Configurations/References/UNAdminReferenceData';
import UNAdminMiscConfig from './pages/UNAdminPortal/Configurations/Miscellaneous/UNAdminMiscConfig';

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

function AddUnitWrapper() {
  const { id } = useParams();
  return (
    <AddNewProperty
      persona="INDEPENDENT_PM"
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

      {/* ── Independent PM registration wizard ────────────────────────────── */}
      <Route path="/pm-registration"        element={<IndependentPM_Step1 />} />
      <Route path="/pm-registration/step-2" element={<IndependentPM_Step2 />} />
      <Route path="/pm-registration/step-3" element={<IndependentPM_Step3 />} />

      {/* ── PM Portal ─────────────────────────────────────────────────────── */}
      <Route path="/pm-portal/dashboard/welcome"      element={<PMWelcomePage persona="INDEPENDENT_PM" />} />
      <Route path="/pm-portal/dashboard/my-dashboard" element={<PMDashboard   persona="INDEPENDENT_PM" />} />
      <Route path="/pm-portal/profile/persona"        element={<PMProfileView />} />

      {/* ── Org PMS Portal — reuses PM dashboard (NavD when Org-specific nav needed) ── */}
      <Route path="/org-portal/dashboard/welcome"      element={<PMWelcomePage persona="ORGANIZATIONAL_PM" />} />
      <Route path="/org-portal/dashboard/my-dashboard" element={<PMDashboard persona="ORGANIZATIONAL_PM" />} />

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
      <Route path="/admin-portal/config/miscellaneous" element={
        <UNAdminShell activeId="misc-config" title="Miscellaneous Configurations">
          <UNAdminMiscConfig />
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
      <Route path="/pm-portal/properties" element={<PMPropertiesPage />} />
      <Route path="/pm-portal/properties/add" element={<AddNewProperty persona="INDEPENDENT_PM" />} />
      <Route path="/org-portal/properties/add"  element={<AddNewProperty persona="ORGANIZATIONAL_PM" />} />
      <Route path="/pm-portal/properties/portfolio/:propertyType" element={<PMPortfolioPage />} />
      <Route path="/pm-portal/properties/:id" element={<PMPropertyDetailPage />} />
      <Route path="/pm-portal/properties/:id/units/:unitId" element={<PMUnitDetailPage />} />
      <Route path="/pm-portal/properties/:id/edit"                    element={<EditPropertyPage />} />
      <Route path="/pm-portal/properties/:id/units/:unitId/edit"      element={<EditUnitPage />} />
      <Route path="/pm-portal/properties/:id/add-unit" element={<AddUnitWrapper />} />


      // Temporary placeholder — replace with PMPropertyDetailPage when built
      <Route path="/pm-portal/properties/:id" element={
        <div style={{ padding: 40, fontFamily: 'Nunito Sans, sans-serif', color: '#0F172A' }}>
          Property Detail page — coming soon
        </div>
      } />

    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;