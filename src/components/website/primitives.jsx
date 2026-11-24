// Shared building blocks for website sections (Phase 2 renderer).
// Every section composes these, so spacing, type and actions behave the same
// on every template.

import React from 'react';
import { useWebsite } from './WebsiteContext';
import { FONT, NEUTRAL, RADIUS, SHADOW, MAX_WIDTH, V, size } from './websiteTheme';
import placeholderImage from '../../assets/landlord/property-placeholder.jpg';

export const PREVIEW_NOTE = 'Preview — not active';

// Page-width band with consistent vertical rhythm.
export function Band({ children, tone = 'plain', style, id }) {
  const { compact } = useWebsite();
  const bg = tone === 'panel' ? V.panel : tone === 'dark' ? V.dark : 'transparent';
  return (
    <section id={id} style={{ background: bg, padding: compact ? '40px 0' : '72px 0', ...style }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: compact ? '0 20px' : '0 40px' }}>{children}</div>
    </section>
  );
}

export function Eyebrow({ children, onDark = false, rule = false, style }) {
  const { compact } = useWebsite();
  if (!children) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT.body, fontWeight: 600,
      fontSize: size('eyebrow', compact), letterSpacing: 1.6, textTransform: 'uppercase',
      color: onDark ? 'rgba(255,255,255,0.75)' : V.accent, marginBottom: 10, ...style,
    }}>
      {rule && <span style={{ width: 28, height: 1, background: 'currentColor' }} />}
      {children}
    </div>
  );
}

export function Heading({ as: Tag = 'h2', level = 'h2', children, onDark = false, style }) {
  const { compact } = useWebsite();
  if (!children) return null;
  return (
    <Tag style={{
      fontFamily: FONT.heading, fontWeight: 500, fontSize: size(level, compact), lineHeight: 1.15,
      color: onDark ? NEUTRAL.white : NEUTRAL.text, margin: 0, letterSpacing: -0.3, ...style,
    }}>{children}</Tag>
  );
}

export function Text({ children, level = 'body', onDark = false, muted = false, style }) {
  const { compact } = useWebsite();
  if (!children) return null;
  return (
    <p style={{
      fontFamily: FONT.body, fontSize: size(level, compact), lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line',
      color: onDark ? 'rgba(255,255,255,0.78)' : (muted ? NEUTRAL.muted : NEUTRAL.body), ...style,
    }}>{children}</p>
  );
}

export function SectionHead({ eyebrow, title, intro, center = false, onDark = false, aside }) {
  const { compact } = useWebsite();
  if (!eyebrow && !title && !intro) return null;
  return (
    <div style={{
      display: 'flex', flexDirection: compact || !aside ? 'column' : 'row', gap: 16,
      justifyContent: 'space-between', alignItems: compact || !aside ? (center ? 'center' : 'flex-start') : 'flex-end',
      textAlign: center ? 'center' : 'left', marginBottom: compact ? 24 : 36,
    }}>
      <div style={{ maxWidth: center ? 720 : 760 }}>
        <Eyebrow onDark={onDark} rule={!center} style={center ? { justifyContent: 'center' } : null}>{eyebrow}</Eyebrow>
        <Heading onDark={onDark}>{title}</Heading>
        {intro && <Text muted onDark={onDark} style={{ marginTop: 12 }}>{intro}</Text>}
      </div>
      {aside}
    </div>
  );
}

// A button or link. Internal page targets navigate; everything else
// (apply, booking, form submit, external links) is inert in preview mode.
export function Action({ children, kind = 'primary', to, href, onDark = false, full = false, small = false, icon, onClick, disabled }) {
  const { mode, navigate, manifest } = useWebsite();
  if (!children) return null;
  const pageEnabled = to && (manifest?.structure?.pages || []).some(p => p.page === to && p.enabled);
  // Internal = moves within the website: a page link (`to`) or an in-site
  // handler (`onClick`, e.g. opening a property or resetting a search).
  // Everything else (apply, booking, form submit, external `href`) is inert
  // in preview mode.
  const internal = Boolean(pageEnabled);
  const inert = disabled || (mode === 'preview' && !internal && !onClick);
  const palette = {
    primary: { background: V.primary, color: NEUTRAL.white, border: '1px solid transparent' },
    accent: { background: V.accent, color: NEUTRAL.white, border: '1px solid transparent' },
    soft: { background: 'rgba(15,23,42,0.06)', color: NEUTRAL.text, border: '1px solid transparent' },
    outline: { background: 'transparent', color: onDark ? NEUTRAL.white : NEUTRAL.text,
      border: `1px solid ${onDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.2)'}` },
    light: { background: NEUTRAL.white, color: NEUTRAL.text, border: '1px solid transparent' },
    link: { background: 'transparent', color: onDark ? NEUTRAL.white : NEUTRAL.text, border: 'none', padding: 0 },
  }[kind];
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: kind === 'link' ? 0 : (small ? '9px 16px' : '14px 24px'), width: full ? '100%' : undefined,
    fontFamily: FONT.body, fontSize: small ? 12 : 13, fontWeight: 600, letterSpacing: 0.8,
    textTransform: 'uppercase', borderRadius: RADIUS.sm, cursor: inert ? 'not-allowed' : 'pointer',
    opacity: inert && mode === 'preview' && !disabled ? 0.92 : (disabled ? 0.5 : 1),
    textDecoration: 'none', boxSizing: 'border-box', ...palette,
  };
  const handle = (e) => {
    e.preventDefault();
    if (inert) return;
    if (internal) navigate(to);
    else if (onClick) onClick();
    else if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };
  return (
    <button type="button" style={style} onClick={handle} aria-disabled={inert || undefined}
      title={inert && mode === 'preview' ? PREVIEW_NOTE : undefined} data-inert={inert ? 'true' : undefined}>
      {icon && <i className={`ti ${icon}`} aria-hidden="true" />}
      {children}
    </button>
  );
}

// Image with a Design System placeholder when no image is set.
export function Picture({ src, alt = '', height, ratio, rounded = RADIUS.md, style, children }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: rounded, background: '#E7ECEA',
      height, aspectRatio: ratio, ...style,
    }}>
      <img src={src || placeholderImage} alt={alt} loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {children}
    </div>
  );
}

export function Card({ children, style, padded = true, tone = 'white' }) {
  return (
    <div style={{
      background: tone === 'panel' ? V.panel : NEUTRAL.white, borderRadius: RADIUS.md,
      boxShadow: tone === 'panel' ? 'none' : SHADOW.card, padding: padded ? 28 : 0, ...style,
    }}>{children}</div>
  );
}

export function Grid({ children, cols = 3, gap = 24 }) {
  const { compact } = useWebsite();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compact ? 1 : cols}, minmax(0, 1fr))`, gap }}>
      {children}
    </div>
  );
}

export function Tag({ children, tone = 'light', style }) {
  if (!children) return null;
  const tones = {
    light: { background: 'rgba(255,255,255,0.92)', color: NEUTRAL.text },
    dark: { background: 'rgba(11,29,58,0.82)', color: NEUTRAL.white },
    soft: { background: 'rgba(15,23,42,0.06)', color: NEUTRAL.body },
    accent: { background: `color-mix(in srgb, ${V.accent} 16%, white)`, color: V.accent },
  };
  return (
    <span style={{
      display: 'inline-block', padding: '4px 8px', borderRadius: RADIUS.sm, fontFamily: FONT.body,
      fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', ...tones[tone], ...style,
    }}>{children}</span>
  );
}

export function IconBox({ icon, onDark = false }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: RADIUS.sm, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: onDark ? 'rgba(255,255,255,0.1)' : `color-mix(in srgb, ${V.accent} 14%, white)`,
      color: onDark ? NEUTRAL.white : V.accent, fontSize: 20, flexShrink: 0,
    }}><i className={`ti ${icon}`} aria-hidden="true" /></div>
  );
}

// Honest empty state for PMS-driven sections with nothing to show.
export function EmptyNote({ icon = 'ti-home-off', children }) {
  return (
    <div style={{
      padding: '36px 20px', textAlign: 'center', border: `1px dashed ${NEUTRAL.border}`, borderRadius: RADIUS.md,
      color: NEUTRAL.muted, fontFamily: FONT.body, fontSize: 14,
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 28, display: 'block', marginBottom: 8 }} aria-hidden="true" />
      {children}
    </div>
  );
}

// Initials avatar for people without a photo.
export function Initials({ name, sizePx = 56 }) {
  const initials = (name || '?').split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: sizePx, height: sizePx, borderRadius: '50%', background: V.primary, color: NEUTRAL.white,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.heading,
      fontSize: sizePx * 0.38, flexShrink: 0,
    }}>{initials}</div>
  );
}
