import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Existing pages
import PMSOnboardingStep1     from './PMS_Onboarding_Step1';
import LoginPage              from './pages/Login/LoginPage';
import LoginModal             from './pages/Login/LoginModal';
import SignUpPage             from './pages/SignUp/SignUpPage';
import OTPVerificationPage    from './pages/OTP/OTPVerificationPage';
import PersonaSelectPage      from './pages/PersonaSelect/PersonaSelectPage';
import ComingSoonPage         from './pages/ComingSoon/ComingSoonPage';

// Independent PM registration wizard
import IndependentPM_Step1   from './pages/IndependentPM/IndependentPM_Step1';
import IndependentPM_Step2   from './pages/IndependentPM/IndependentPM_Step2';
import IndependentPM_Step3   from './pages/IndependentPM/IndependentPM_Step3';

// PM Portal
import PMDashboard from './pages/PMPortal/PMDashboard';
import PMProfileView from './pages/PMPortal/PMProfileView';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Routes>
      {/* ── Auth ── */}
      <Route path="/"        element={<LoginModal />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/signup"  element={
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

      {/* ── Persona select ── */}
      <Route path="/persona-select" element={<PersonaSelectPage />} />

      {/* ── Independent PM registration wizard ── */}
      <Route path="/pm-registration"        element={<IndependentPM_Step1 />} />
      <Route path="/pm-registration/step-2" element={<IndependentPM_Step2 />} />
      <Route path="/pm-registration/step-3" element={<IndependentPM_Step3 />} />

      {/* ── PM Portal ── */}
      <Route path="/pm-portal/dashboard/my-dashboard" element={<PMDashboard />} />  
      <Route path="/pm-portal/profile/persona"         element={<PMProfileView />} />

      {/* ── PMS onboarding (existing) ── */}
      <Route path="/onboarding" element={<PMSOnboardingStep1 />} />

      {/* ── Placeholders ── */}
      <Route path="/coming-soon" element={<ComingSoonPage />} />
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