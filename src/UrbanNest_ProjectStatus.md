# UrbanNest — Project Status
> Upload this alongside UrbanNest_DesignSystem.md at the start of every session.
> Update the "Last Session" and "Up Next" sections before closing each session.
> Last updated: May 22, 2026 — Session 1

---

## Project Overview

**App name:** urbannest-admin
**Framework:** Create React App (React 18)
**Router:** react-router-dom v6
**Port:** localhost:3000
**Styling approach:** Inline styles + shared constants (no Tailwind, no CSS modules)

---

## Folder Structure

```
src/
├── components/
│   └── ui/
│       ├── index.js                 ← barrel export (import all from here)
│       ├── Button.jsx               ✅ done
│       ├── Input.jsx                ✅ done (includes password toggle)
│       ├── Select.jsx               ✅ done
│       ├── Divider.jsx              ✅ done
│       └── TestimonialCarousel.jsx  ✅ done
│
├── constants/
│   ├── colors.js                    ✅ done — all brand color tokens
│   ├── fonts.js                     ✅ done — Noto Serif + Nunito Sans scale
│   └── styles.js                    ✅ done — shared style factories
│
├── pages/
│   ├── Login/
│   │   ├── LoginPage.jsx            ✅ done — Figma-matched login screen
│   │   └── LoginModal.jsx           ✅ done — 75vw modal wrapper
│   └── Onboarding/
│       └── PMS_Onboarding_Step1.jsx ✅ exists (pre-session, not yet refactored)
│
├── App.js                           ✅ updated — react-router v6 routes
├── index.css                        ✅ cleared
└── index.js                         (unchanged)
```

---

## Routes

| Path | Component | Status |
|---|---|---|
| `/` | `LoginModal` | ✅ Live |
| `/login` | `LoginPage` (full screen) | ✅ Live |
| `/onboarding` | `PMS_Onboarding_Step1` | ✅ Live (pre-session) |

---

## App.js (current)

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PMSOnboardingStep1 from './pages/Onboarding/PMS_Onboarding_Step1';
import LoginPage from './pages/Login/LoginPage';
import LoginModal from './pages/Login/LoginModal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<LoginModal />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/onboarding" element={<PMSOnboardingStep1 />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
```

> ⚠️ Note: PMS_Onboarding_Step1 still lives in src/ root — move to src/pages/Onboarding/ when refactoring that screen.

---

## Screens Completed

### 1. Login Page (`/login` and `/`)
- **Figma:** UrbanNest login — "Secure Access"
- **File:** `src/pages/Login/LoginPage.jsx`
- **Features:** Client Persona dropdown, Client ID input, Password (show/hide), Secure Sign In button with spinner, Google/Apple social buttons, testimonial carousel (3 items, animated), footer with Privacy/Security/Terms
- **Modal wrapper:** `src/pages/Login/LoginModal.jsx` — 75vw, 90vh max, dot grid backdrop

---

## Screens In Progress / Up Next

| Screen | Route | Notes |
|---|---|---|
| PMS Onboarding Step 1 | `/onboarding` | Exists, needs refactor to use shared components |
| PMS Onboarding Step 2 | `/onboarding/step-2` | Not started |
| Dashboard | `/dashboard` | Not started |
| Header + Nav shell | (layout) | Not started — needed before dashboard |

---

## Session Notes

### Session 1 — May 22, 2026
- Built Login page from Figma PNG
- Applied UrbanNest Design System (colors, fonts, field styles)
- Wrapped in 75vw responsive modal
- Refactored into production structure:
  - `src/constants/` — colors, fonts, styles
  - `src/components/ui/` — Button, Input, Select, Divider, TestimonialCarousel
  - `src/pages/Login/` — LoginPage + LoginModal
- Fixed footer spacing and centered Privacy/Security/Terms
- Generated UrbanNest_DesignSystem.md + UrbanNest_ProjectStatus.md

---

## How to Start Each New Session

1. Upload **both** ReadMe files to Claude:
   - `UrbanNest_DesignSystem.md`
   - `UrbanNest_ProjectStatus.md`
2. Tell Claude what screen or feature to work on next
3. Claude will use the existing components and constants — no reinventing
4. At end of session, update the "Last Session" and "Up Next" sections above
