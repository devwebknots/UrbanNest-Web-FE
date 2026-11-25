/**
 * src/components/layout/index.js
 * Barrel export for the Version 2 (Design System v2) page frame components.
 * The v1 layout pieces in this folder (Header, NavB, NavE, NavF, PMTopBar) are imported directly from their files.
 *
 * Usage:
 *   import { PageShell, Grid, PageFooter } from '../../components/layout';
 */

export { default as PageShell } from './PageShell';
export { default as TopBar } from './TopBar';
export { default as Grid } from './Grid';
export { default as PageFooter } from './PageFooter';
export { default as Breadcrumb } from './Breadcrumb';
export { default as PageWave } from './PageWave';
export { default as ImageBackdrop } from './ImageBackdrop';
export { default as PMPageShell, PMTopBar2 } from './PMPageShell';   // PM Portal frame: NavPM sidebar + PM top bar
export { default as NavPM } from './NavPM';
export { default as AuthShell, AUTH, AUTH_INTRO, introAt, formIntro, GoogleLogo, AppleLogo } from './AuthShell';   // sign-in / sign-up frame
