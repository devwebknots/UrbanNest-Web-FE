import React, { useState, useLayoutEffect, useRef } from 'react';
import Grid from './Grid';
import ImageBackdrop from './ImageBackdrop';
import CornerArt from '../ui/CornerArt';
import Particles from '../ui/Particles';
import { C2, G2, F2, FS2, LH2, LS2, SP2, SZ2, R2, BLUR2, OP2, LAYOUT2, BP2, T2, UI2, pad } from '../../constants';
import brandLogo from '../../assets/brand/urban-nest-logo.png';
import backdropArt from '../../assets/landlord/wizard-backdrop.jpg';   // same soft waves as the Create Listing backdrop
import heroArt from '../../assets/landlord/login-hero.jpg';           // dusk villa + pool (Downloads/image 120.png, resized to 2400px)

// ─── AuthShell (Design System v2) ────────────────────────────────────────────
// The frame of every sign-in / sign-up screen (built on the Login page, 2026-11-24):
//   page   = our pageBg + soft waves top-right and bottom-left (never a dark blue page)
//   card   = one white card split photo │ form (<Grid layout="split">), scaled down as a whole on small windows
//            (useCardFit — sizes inside never change)
//   photo  = dusk villa + rain + leaves falling from its trees · brand · hero title (one line per entry) ·
//            subtitle · a navy-glass panel pinned to the bottom (testimonials, perks …)
//   form   = CornerArt + a centred column (children)
//   intro  = page-open choreography (un2-intro-* classes); the form rows cascade with formIntro(i)
//
//   <AuthShell titleLines={['The Smart Way to', 'Manage & Find Homes']} subtitle={…} panel={…}>
//     <div className="un2-intro-up" style={formIntro(0)}>…title…</div>
//     <form …>…</form>
//   </AuthShell>
//
// Props: titleLines (string[]) · subtitle (node) · brandSub (small caps line under the brand, optional) ·
//        accentRule (short white rule under the title) · heroExtra (plain content under the subtitle, no glass) ·
//        panel (node — glass panel pinned to the bottom) · panelAs ('div' | 'figure') ·
//        panelProps (events on the panel, e.g. pause on hover) · formGap (gap between form-column rows) ·
//        fit ({ w, h } share of the window the card may take — default SZ2.authFit) ·
//        layout (card columns: 'split' ≈ 55 / 45 photo │ form — login · 'wideRight' ≈ 40 / 60 — sign-up, a longer form) ·
//        heroImage · heroPosition (its CSS object-position) · leafSource (its tree crowns — see LEAF_SOURCE; keep
//        leafSource.position = heroPosition) — default: the villa photo ·
//        weather ('rain' — default, login · 'stars' — twinkling night sky + shooting stars, sign-up) ·
//        formMax (form column max width — SZ2.authForm, or SZ2.authFormWide with wideRight) · children (form column)
// Shared form-side styles for those pages: AUTH (heading, CTA, divider, social buttons, footer) + GoogleLogo / AppleLogo.

// Page-open choreography (seconds from load). Card first, then the photo curtain + camera settle, headline lines,
// the photo copy; the form rows cascade in parallel (formIntro); one sheen on the main button to finish (AUTH_INTRO.sheen).
export const AUTH_INTRO = { bg: 0, card: 0.1, photo: 0.45, brand: 1.0, line: 1.15, lineStep: 0.18, sub: 1.55, panel: 1.8, form: 0.7, formStep: 0.12, sheen: 2.5 };
export const introAt = (s) => ({ '--un2-d': `${s}s` });                                    // start time of one intro element
export const formIntro = (i) => introAt(AUTH_INTRO.form + i * AUTH_INTRO.formStep);       // i-th row of the form cascade

// Where the falling leaves come from — the tree crowns in login-hero.jpg (fractions of the photo: x0, y0, x1, y1).
// position = the photo's object-position (68% center), so Particles crops the areas exactly like the <img>.
const LEAF_SOURCE = {
  ratio: 2400 / 1351,
  position: [0.68, 0.5],
  areas: [
    [0.69, 0.02, 1.0, 0.33],    // big tree, top right
    [0.82, 0.30, 1.0, 0.60],    // tree beside the house, right
    [0.22, 0.45, 0.39, 0.61],   // young trees left of the house
  ],
};

const S = {
  // page — our own background (pageBg + soft waves top-right), card centred
  page:      { position: 'relative', zIndex: 0, minHeight: '100vh', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: LAYOUT2.pageX, background: C2.pageBg, fontFamily: F2.body, color: C2.textPrimary },
  // the same wave art again, turned 180° → waves in the BOTTOM-LEFT corner too (top-right comes from ImageBackdrop).
  // Same size, masks and strength as ImageBackdrop — the masks turn with it, so only the bottom-left shows.
  // (wrapped: the intro animation moves its element with transform — the wrapper takes that, so the 180° turn
  // on the art itself is never overridden)
  waveWrap:  { position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' },
  waveLeft:  {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SZ2.imageBackdrop,
    opacity: OP2.backdrop, transform: 'rotate(180deg)',
    backgroundImage: `url(${backdropArt})`, backgroundSize: '100% auto', backgroundPosition: 'right top', backgroundRepeat: 'no-repeat',
    WebkitMaskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`, maskImage: `${G2.imageBackdropMask}, ${G2.imageBackdropMaskX}`,
    WebkitMaskComposite: 'source-in', maskComposite: 'intersect',
  },
  card:      { ...UI2.card, padding: 0, gap: 0, width: '100%', overflow: 'hidden' },
  // card frame: same max width; scaled down AS A WHOLE when the window is small (see useCardFit) — every size
  // inside stays the standard one. The wrapper takes the intro animation, the frame only the scale.
  // the wrapper only reserves the card's SCALED height (a transform doesn't change layout size) — otherwise a
  // scaled-down card would still push the page taller than the window and sit off-centre / touch the bottom
  cardWrap:  (h) => ({ width: '100%', maxWidth: SZ2.authCard, ...(h ? { height: h } : {}) }),
  cardFit:   (k) => ({ transform: k === 1 ? 'none' : `scale(${k})`, transformOrigin: 'top center' }),

  // photo side
  hero:      { position: 'relative', display: 'flex', flexDirection: 'column', minHeight: SZ2.authHeroMin, padding: SP2.huge, background: C2.navyHero, color: C2.white, overflow: 'hidden' },
  heroPhoto: (position) => ({ ...UI2.photoMedia, objectPosition: position }),   // villa default '68% center' keeps the house + pool in view
  heroScrim: { position: 'absolute', inset: 0, background: G2.authHeroScrim, pointerEvents: 'none' },
  heroBody:  { position: 'relative' },
  brand:     { ...UI2.row(SP2.sm) },
  logoMark:  { height: SZ2.icon.md, width: 'auto', aspectRatio: SZ2.brandLogoRatio, display: 'block' },
  logoName:  { ...T2.brandTitle, lineHeight: LH2.tight, letterSpacing: LS2.snug },
  logoSub:   { ...T2.eyebrow, display: 'block', color: C2.onDark.textMuted, marginTop: SP2.xxs },   // same as the sidebar brand sub line
  title:     { ...T2.heroTitle, margin: pad(SP2.huge, 0, SP2.sm) },
  rule:      { width: SP2.xxxl, height: SZ2.hairline * 2, borderRadius: R2.pill, background: C2.white, margin: pad(SP2.md, 0, SP2.lg) },
  sub:       { margin: 0, fontSize: FS2.base, lineHeight: LH2.body, color: C2.onDark.textSoft },
  extra:     { marginTop: SP2.xl },   // heroExtra — plain content right under the subtitle (no glass), e.g. the sign-up perks
  // bottom panel — pinned to the BOTTOM of the photo (same inset as the text), clear navy glass
  panel:     { ...UI2.stack(SP2.md), position: 'absolute', left: SP2.huge, right: SP2.huge, bottom: SP2.huge, margin: 0, padding: SP2.xl, borderRadius: R2.xl, background: G2.authGlass, border: `${SZ2.hairline}px solid ${C2.onDark.borderSoft}`, backdropFilter: BLUR2.md, WebkitBackdropFilter: BLUR2.md },

  // form side
  formSide:  { position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: SP2.huge, background: C2.white, overflow: 'hidden' },
  formCol:   (gap, max) => ({ position: 'relative', ...UI2.stack(gap), width: '100%', maxWidth: max, margin: '0 auto' }),
};

// Shared form-side styles (sign-in / sign-up)
export const AUTH = {
  h1:        { ...T2.pageHeroTitle, margin: 0 },
  lead:      { ...T2.pageHeroSub, margin: pad(SP2.xs, 0, 0) },
  submit:    { ...UI2.btn.brand, width: '100%', minHeight: SZ2.field, justifyContent: 'center' },
  // STANDARD space above the main button (Secure Sign In / Create Account): always SP2.xxl + SP2.md = 36px from the
  // last form row — pass the form's own row gap, the margin tops it up: style={AUTH.submitRow(SP2.lg)}
  submitRow: (rowGap) => ({ marginTop: SP2.xxl + SP2.md - rowGap }),
  busy:      { opacity: OP2.soft, cursor: 'wait' },
  orRow:     { ...UI2.row(SP2.md) },
  orLine:    { ...UI2.divider, flex: 1 },
  orText:    { ...UI2.capsLabel, whiteSpace: 'nowrap' },
  socials:   { gap: SP2.md },
  social:    { ...UI2.btn.soft, width: '100%', minHeight: SZ2.field, justifyContent: 'center' },
  foot:      { ...UI2.stack(SP2.sm), alignItems: 'center', textAlign: 'center' },
  copy:      { ...T2.eyebrow },
  footLinks: { ...UI2.row(SP2.lg), justifyContent: 'center' },
  footLink:  { ...UI2.btn.textLink, color: C2.textSecondary },
};

export function GoogleLogo() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function AppleLogo() {
  return (
    <svg width="15" height="17" viewBox="0 0 814 1000" fill={C2.navy} aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.2-62.3-150.6-123.6C46.5 726 1.1 583.9 1.1 440.8c0-109.1 39.1-212.2 103.7-283.6 56-62.2 140.7-101.7 232.8-101.7 85.5 0 152.6 42.3 204.8 42.3 49.4 0 126.9-45.3 227.2-45.3 34.2 0 150.4 3.2 224.1 110.9zM490.1 73.6c28.9-38.8 48.9-91.1 48.9-143.4 0-5.8-.6-11.7-1.3-17.6-47.5 2.6-104.6 32.5-138.2 74-26.9 32.5-50 84.7-50 136.9 0 6.5.6 12.9 1.3 15.5 3.2.6 8.4 1.3 13.6 1.3 42.9 0 96.9-28.3 125.7-66.7z"/>
    </svg>
  );
}

// Card fit: on windows where the card would take more than `fit` of the width / height (small laptops,
// Windows display scaling 125 %+), scale the whole card down so it keeps the same share of the screen —
// nothing inside changes size in the code. Only while photo │ form sit side by side (wider than BP2.lg); stacked
// (tablets) and phones are left alone.
function useCardFit(fit) {
  const ref = useRef(null);
  const [fitState, setFitState] = useState({ k: 1, h: 0 });   // scale · natural (unscaled) card height
  const { w: fw, h: fh } = fit;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const vw = window.innerWidth; const vh = window.innerHeight;
      const next = vw <= BP2.lg ? 1 : Math.min(1, (vw * fw) / el.offsetWidth, (vh * fh) / el.offsetHeight);
      setFitState({ k: Math.round(next * 1000) / 1000, h: el.offsetHeight });
    };
    update();
    const ro = new ResizeObserver(update);   // layout size (a transform never changes it → no loop)
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [fw, fh]);
  return [ref, fitState.k, fitState.h];
}

export default function AuthShell({
  titleLines = [], subtitle, brandSub, accentRule = false,
  panel, panelAs: Panel = 'div', panelProps, heroExtra,
  formGap = SP2.xl, fit = SZ2.authFit, layout = 'split', formMax = SZ2.authForm,
  heroImage = heroArt, heroPosition = '68% center', leafSource = LEAF_SOURCE, weather = 'rain', children,
}) {
  const [cardRef, k, natH] = useCardFit(fit);
  const subAt = AUTH_INTRO.sub + Math.max(0, titleLines.length - 2) * AUTH_INTRO.lineStep;   // after the last title line
  return (
    <div style={S.page}>
      <div className="un2-intro-fade" style={introAt(AUTH_INTRO.bg)}>
        <ImageBackdrop image={backdropArt} />
        <div style={S.waveWrap} aria-hidden="true"><div style={S.waveLeft} /></div>
      </div>

      <div className="un2-intro-card" style={{ ...S.cardWrap(k < 1 ? natH * k : 0), ...introAt(AUTH_INTRO.card) }}>
        <div ref={cardRef} style={S.cardFit(k)}>
          <Grid layout={layout} as="div" style={S.card}>
            {/* ── Photo side — brand · headline · bottom glass panel ── */}
            <div style={{ ...S.hero, ...introAt(AUTH_INTRO.photo) }} className="un2-hide-md un2-intro-curtain">
              <img src={heroImage} alt="" className="un2-intro-zoom" style={{ ...S.heroPhoto(heroPosition), ...introAt(AUTH_INTRO.photo) }} />
              <div style={S.heroScrim} aria-hidden="true" />
              {/* weather over the photo: rain (or a night sky of stars + shooting stars) behind, falling leaves in front */}
              {weather === 'stars' ? <Particles variant="stars" /> : <Particles variant="rain" density={0.7} />}
              <Particles variant="leaves" source={leafSource} />
              <div style={S.heroBody}>
                <div className="un2-intro-up" style={{ ...S.brand, ...introAt(AUTH_INTRO.brand) }}>
                  <img src={brandLogo} alt="" style={S.logoMark} />
                  <span>
                    <span style={{ ...S.logoName, display: 'block' }}>UrbanNest</span>
                    {brandSub && <span style={S.logoSub}>{brandSub}</span>}
                  </span>
                </div>
                <h2 style={S.title}>
                  {titleLines.map((line, i) => (
                    <span key={line} className="un2-intro-line"><span style={introAt(AUTH_INTRO.line + i * AUTH_INTRO.lineStep)}>{line}</span></span>
                  ))}
                </h2>
                {accentRule && <div className="un2-intro-up" style={{ ...S.rule, ...introAt(subAt) }} aria-hidden="true" />}
                {subtitle && <p className="un2-intro-up" style={{ ...S.sub, ...introAt(subAt) }}>{subtitle}</p>}
                {heroExtra && <div className="un2-intro-up" style={{ ...S.extra, ...introAt(subAt + AUTH_INTRO.lineStep * 2) }}>{heroExtra}</div>}
              </div>

              {panel && (
                <Panel className="un2-intro-rise" style={{ ...S.panel, ...introAt(AUTH_INTRO.panel) }} {...panelProps}>
                  {panel}
                </Panel>
              )}
            </div>

            {/* ── Form side ── */}
            <div style={S.formSide}>
              <CornerArt />
              <div style={S.formCol(formGap, formMax)}>{children}</div>
            </div>
          </Grid>
        </div>
      </div>
    </div>
  );
}
