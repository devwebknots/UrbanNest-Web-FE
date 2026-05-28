# UrbanNest — Design System
> Upload this at the start of every session. Source of truth for all UI tokens.
> Last updated: May 22, 2026

---

## 1. Brand Colors (`src/constants/colors.js`)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#002D5B` | Buttons, active states, focus borders, headings |
| `primaryHover` | `#003d7a` | Button hover state |
| `secondary` | `#064E3B` | Section icon circle backgrounds |
| `tertiary` | `#B45309` | Card dot accents |
| `neutral` | `#F1F5F9` | Input / dropdown background |
| `pageBg` | `#F8FAFC` | Content area background |
| `navBg` | `#1a2332` | Left nav + logo header |
| `heroBg` | `#001f3f` | Hero banner |
| `border` | `#E2E8F0` | Card borders, dividers |
| `borderMedium` | `#CBD5E1` | Button borders, dashed upload |
| `textPrimary` | `#0F172A` | Body text, input values |
| `textSecondary` | `#64748B` | Labels, muted text |
| `textTertiary` | `#94A3B8` | Placeholders, hints |
| `danger` | `#E53E3E` | Map pin, error states |
| `white` | `#FFFFFF` | Surfaces |

---

## 2. Typography (`src/constants/fonts.js`)

### Font Families
| Token | Value |
|---|---|
| `F.headline` | `'Noto Serif', serif` |
| `F.body` | `'Nunito Sans', sans-serif` |

### Google Fonts Import (in `public/index.html` `<head>`)
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Text Scale (`TEXT` object)
| Token | Font | Size | Weight |
|---|---|---|---|
| `pageHeading` | Noto Serif | 28px | 700 |
| `sectionTitle` | Noto Serif | 16px | 600 |
| `panelLabel` | Noto Serif | 14px | 600 |
| `heroSubtitle` | Nunito Sans | 13px | 400 |
| `tabLabel` | Nunito Sans | 13px | 600 |
| `fieldLabel` | Nunito Sans | 10px | 700 + uppercase + 0.08em |
| `inputText` | Nunito Sans | 11px | 400 |
| `buttonText` | Nunito Sans | 13px | 700 |
| `navItem` | Nunito Sans | 12px | 500 |
| `footerText` | Nunito Sans | 11px | 400 |

---

## 3. Shared Styles (`src/constants/styles.js`)

| Export | Description |
|---|---|
| `labelStyle` | Form field label — uppercase, 10px, 700 weight |
| `inputStyle(focused)` | Text input — 42px height, 8px radius, focus-aware border |
| `primaryBtnStyle` | Dark navy full-width button |
| `secondaryBtnStyle` | Outline transparent button |
| `socialBtnStyle` | White bordered social auth button |
| `cardStyle` | White card with border and 12px radius |
| `dotGridBg` | Full-page backdrop with dot grid pattern |
| `dividerStyle` | Flex row for OR dividers |

---

## 4. Reusable UI Components (`src/components/ui/`)

| Component | File | Props |
|---|---|---|
| `Button` | `Button.jsx` | `variant` (primary/secondary/social), `loading`, `disabled`, `fullWidth`, `style` |
| `Input` | `Input.jsx` | `label`, `type`, `placeholder`, `value`, `onChange`, `rightAction`, `autoComplete` |
| `Select` | `Select.jsx` | `label`, `value`, `onChange`, `options` (string[] or {value,label}[]) |
| `Divider` | `Divider.jsx` | `label`, `margin` |
| `TestimonialCarousel` | `TestimonialCarousel.jsx` | `testimonials` [{quote, name, title}] |

### Usage example
```jsx
import { Button, Input, Select, Divider } from '../components/ui';
```

---

## 5. Layout Structure

```
┌─────────────────────────────────────────────────┐
│  HEADER (60px, sticky)                          │
│  [Logo #1a2332] [Search] [Icons + User]         │
├──────────┬──────────────────────────────────────┤
│  NAV     │  MAIN CONTENT                        │
│  185px   │  padding: 20px, bg: #F1F5F9          │
│  #1a2332 │  ┌──────────────────────────────┐    │
│          │  │ PAGE (white card, rounded)   │    │
│          │  │  HERO 110px #001f3f          │    │
│          │  │  TABS                        │    │
│          │  │  CONTENT (1fr + 268px)       │    │
│          │  │  FOOTER                      │    │
│          │  └──────────────────────────────┘    │
└──────────┴──────────────────────────────────────┘
```

### Key dimensions
| Element | Value |
|---|---|
| Header height | 60px |
| Left nav width | 185px |
| Hero height | 110px |
| Content padding | 24px 36px |
| Right panel width | 268px |
| Card border radius | 12px |
| Input height | 42px |
| Button height | 50px (primary), 40px (secondary), 46px (social) |

---

## 6. Modal / Popup Pattern

Login (and similar auth screens) render as a **75vw floating modal** on a dotted backdrop:
```
bg: #F0F2F5 + radial-gradient dots (#CBD5E1, 28px)
modal: width 75vw, maxHeight 90vh, borderRadius 20px
shadow: 0 32px 80px rgba(0,0,0,0.18)
inner scroll: overflowY auto on content div
```

---

## 7. CSS Animation Classes

| Class | Animation |
|---|---|
| `un-pagein` | Fade in on page load |
| `un-fadein` | Fade + slide up (testimonials, modals) |
| `un-spin` | 360° rotation (loading spinner) |

Hover states use `!important` overrides via className:
- `.un-btn-primary:hover` → `background: #003d7a`
- `.un-btn-social:hover` → `border-color: #94A3B8, background: #F8FAFC`
- `.un-navbtn:hover` → `background: rgba(255,255,255,0.18)`
