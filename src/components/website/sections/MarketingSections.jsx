// Owner-content sections: hero, key figures, personal introduction, CTA
// banner, numbered item cards (pillars, services, credentials, areas,
// resources) and the full profile. Text comes only from owner content
// (sample content in preview); the section title in the manifest is the
// fallback heading.

import React from 'react';
import { useWebsite, useSectionContent, numberedItems } from '../WebsiteContext';
import {
  Band, Eyebrow, Heading, Text, SectionHead, Action, Picture, Card, Grid, Tag, IconBox, Initials,
} from '../primitives';
import { FONT, NEUTRAL, RADIUS, SHADOW, V, size } from '../websiteTheme';

// ─── HERO ────────────────────────────────────────────────────────────────────
export function HeroSection({ section }) {
  const { compact, layout } = useWebsite();
  const c = useSectionContent(section.section);
  const features = numberedItems(c, 'feature', ['title', 'text']);
  return (
    <Band>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: compact ? 28 : 56, alignItems: 'center' }}>
        <div>
          <Eyebrow rule={layout === 'community'}>{c.eyebrow}</Eyebrow>
          <Heading as="h1" level="display">{c.headline || section.title}</Heading>
          <Text level="lead" muted style={{ marginTop: 18, maxWidth: 520 }}>{c.subheadline}</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
            <Action to="PROPERTIES" icon="ti-arrow-up-right">{c.primary_button_label}</Action>
            <Action kind="soft" to="CONTACT">{c.secondary_button_label}</Action>
          </div>
          {features.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 32 }}>
              {features.map((f, i) => (
                <div key={i}>
                  <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.text }}>{f.title}</div>
                  <div style={{ fontFamily: FONT.body, fontSize: 12, color: NEUTRAL.muted }}>{f.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Picture src={c.hero_image} alt={c.headline} ratio={compact ? '4 / 3' : '5 / 6'} style={{ boxShadow: SHADOW.lift }}>
          {c.image_caption && (
            <span style={{ position: 'absolute', right: 16, bottom: 16, fontFamily: FONT.body, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>{c.image_caption}</span>
          )}
          {(c.badge_title || c.badge_text) && (
            <div style={{
              position: 'absolute', left: 16, right: compact ? 16 : 'auto', bottom: 16, background: NEUTRAL.white,
              borderRadius: RADIUS.sm, padding: '12px 16px', boxShadow: SHADOW.card, display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <IconBox icon="ti-rosette-discount-check" />
              <div>
                <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: V.accent }}>{c.badge_title}</div>
                <div style={{ fontFamily: FONT.body, fontSize: 13, color: NEUTRAL.text }}>{c.badge_text}</div>
              </div>
            </div>
          )}
        </Picture>
      </div>
    </Band>
  );
}

// ─── KEY FIGURES ─────────────────────────────────────────────────────────────
export function FigureRow({ items, onDark = false }) {
  const { compact } = useWebsite();
  if (!items.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compact ? 2 : items.length}, minmax(0, 1fr))`, gap: 16 }}>
      {items.map((s, i) => (
        <div key={i} style={{ padding: '18px 20px', background: onDark ? 'rgba(255,255,255,0.06)' : NEUTRAL.white, borderRadius: RADIUS.sm }}>
          <div style={{ fontFamily: FONT.heading, fontSize: size('price', compact), color: onDark ? NEUTRAL.white : NEUTRAL.text }}>{s.value}</div>
          <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: V.accent, marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function KeyStatsSection({ section }) {
  const c = useSectionContent(section.section);
  const items = numberedItems(c, 'stat', ['value', 'label']);
  if (!items.length) return null;
  return <Band style={{ paddingTop: 0 }}><FigureRow items={items} /></Band>;
}

// ─── PERSONAL INTRODUCTION ("Meet Your Property Manager / Landlord") ─────────
export function IntroductionSection({ section }) {
  const { compact } = useWebsite();
  const c = useSectionContent(section.section);
  return (
    <Band tone="panel">
      <Card style={{ padding: compact ? 24 : 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '260px 1fr', gap: compact ? 24 : 48, alignItems: 'center' }}>
          <div>
            {c.photo ? (
              <Picture src={c.photo} alt={c.name} ratio="1 / 1">
                {c.photo_badge && <Tag tone="dark" style={{ position: 'absolute', top: 12, left: 12 }}>{c.photo_badge}</Tag>}
              </Picture>
            ) : (
              // A person's photo never falls back to a property image.
              <div style={{ aspectRatio: '1 / 1', borderRadius: RADIUS.md, background: V.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Initials name={c.name} sizePx={compact ? 88 : 120} />
                {c.photo_badge && <Tag tone="dark" style={{ position: 'absolute', top: 12, left: 12 }}>{c.photo_badge}</Tag>}
              </div>
            )}
            {c.experience_badge && <Tag tone="accent" style={{ marginTop: 12 }}>{c.experience_badge}</Tag>}
          </div>
          <div>
            <Eyebrow>{c.eyebrow || section.title}</Eyebrow>
            <Heading level="h2">{c.name}</Heading>
            {c.role && <Text muted style={{ marginTop: 4 }}>{c.role}</Text>}
            <Text style={{ marginTop: 16 }}>{c.introduction}</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24, alignItems: 'center' }}>
              {c.phone && <ContactChip icon="ti-phone" label="Direct line" value={c.phone} />}
              {c.email && <ContactChip icon="ti-mail" label="Direct email" value={c.email} />}
              <div style={{ flex: 1 }} />
              <Action small to="ABOUT" icon="ti-arrow-right">{c.button_label}</Action>
            </div>
          </div>
        </div>
      </Card>
    </Band>
  );
}

function ContactChip({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: V.panel, borderRadius: RADIUS.sm, padding: '10px 14px' }}>
      <i className={`ti ${icon}`} style={{ color: V.accent }} aria-hidden="true" />
      <div>
        <div style={{ fontFamily: FONT.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.muted }}>{label}</div>
        <div style={{ fontFamily: FONT.body, fontSize: 14, color: NEUTRAL.text }}>{value}</div>
      </div>
    </div>
  );
}

// ─── CTA BANNER ──────────────────────────────────────────────────────────────
export function CtaBannerSection({ section }) {
  const { compact, page } = useWebsite();
  const c = useSectionContent(section.section);
  const target = page === 'PROPERTIES' ? 'CONTACT' : 'PROPERTIES';
  const dark = page === 'PROPERTIES';
  return (
    <Band style={{ paddingTop: 0 }}>
      <div style={{
        background: dark ? V.dark : V.panel, borderRadius: RADIUS.md, padding: compact ? 24 : '44px 48px',
        display: 'flex', flexDirection: compact ? 'column' : 'row', gap: 24, alignItems: compact ? 'flex-start' : 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ maxWidth: 620 }}>
          <Eyebrow onDark={dark}>{c.eyebrow}</Eyebrow>
          <Heading level="h3" onDark={dark} style={{ fontSize: compact ? 22 : 28 }}>{c.title || section.title}</Heading>
          <Text muted onDark={dark} style={{ marginTop: 8 }}>{c.text}</Text>
        </div>
        <Action kind={dark ? 'accent' : 'primary'} to={target} icon="ti-arrow-right">{c.button_label}</Action>
      </div>
    </Band>
  );
}

// ─── NUMBERED ITEM CARDS ─────────────────────────────────────────────────────
// One component for every "heading + N cards" section. The per-section
// description below says which numbered fields make a card.
const ITEM_SECTIONS = {
  VALUE_PILLARS: { prefix: 'pillar', parts: ['label', 'title', 'text', 'footer'], icons: ['ti-shield-check', 'ti-message-2', 'ti-tool'], center: true, tone: 'panel' },
  SERVICES_LIST: { prefix: 'service', parts: ['title', 'text', 'footer'], numbered: true, cols: 2, tone: 'panel' },
  CREDENTIALS: { prefix: 'credential', parts: ['title', 'issuer', 'text'], icons: ['ti-certificate', 'ti-license', 'ti-scale', 'ti-users'], cols: 2, split: true },
  RESOURCE_LINKS: { prefix: 'card', parts: ['label', 'title', 'text', 'link_label', 'link_url'], icons: ['ti-tool', 'ti-calendar', 'ti-shield-check'] },
};

export function ItemCardsSection({ section }) {
  const { compact } = useWebsite();
  const cfg = ITEM_SECTIONS[section.section];
  const c = useSectionContent(section.section);
  const items = numberedItems(c, cfg.prefix, cfg.parts);
  const stats = section.section === 'VALUE_PILLARS' ? numberedItems(c, 'stat', ['value', 'label']) : [];
  if (!items.length && !c.title && !section.title) return null;

  const cards = (
    <Grid cols={cfg.cols || Math.min(items.length || 1, 3)} gap={20}>
      {items.map((it, i) => (
        <Card key={i} tone={cfg.split ? 'panel' : 'white'} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cfg.numbered
            ? <div style={{ fontFamily: FONT.heading, fontSize: 26, color: V.accent }}>{String(i + 1).padStart(2, '0')}</div>
            : (cfg.icons && <IconBox icon={cfg.icons[i % cfg.icons.length]} />)}
          {it.label && <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: V.accent }}>{it.label}</div>}
          <Heading level="h3" as="h3">{it.title}</Heading>
          {it.issuer && <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: V.accent }}>{it.issuer}</div>}
          <Text muted>{it.text}</Text>
          {it.footer && <div style={{ marginTop: 'auto', paddingTop: 8, fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: V.accent }}>{it.footer}</div>}
          {it.link_label && <div style={{ marginTop: 'auto', paddingTop: 8 }}><Action kind="link" href={it.link_url} icon="ti-arrow-up-right">{it.link_label}</Action></div>}
        </Card>
      ))}
    </Grid>
  );

  return (
    <Band tone={cfg.tone || 'plain'}>
      {cfg.split && !compact ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, alignItems: 'center' }}>
          <SectionHead eyebrow={c.eyebrow} title={c.title || section.title} intro={c.intro} />
          {cards}
        </div>
      ) : (
        <>
          <SectionHead eyebrow={c.eyebrow} title={c.title || section.title} intro={c.intro} center={cfg.center} />
          {cards}
        </>
      )}
      {stats.length > 0 && <div style={{ marginTop: 28 }}><FigureRow items={stats} /></div>}
    </Band>
  );
}

// ─── SERVICE AREAS (districts + property types) ──────────────────────────────
export function ServiceAreasSection({ section }) {
  const c = useSectionContent(section.section);
  const districts = numberedItems(c, 'district', ['name', 'text']);
  const types = numberedItems(c, 'property_type', ['title', 'text']);
  if (!districts.length && !types.length) return null;
  return (
    <Band>
      <SectionHead eyebrow={c.eyebrow} title={c.title || section.title} intro={c.intro} />
      {districts.length > 0 && (
        <Grid cols={Math.min(districts.length, 4)} gap={16}>
          {districts.map((d, i) => (
            <Card key={i} style={{ padding: 20 }}>
              <IconBox icon="ti-map-pin" />
              <Heading level="h3" as="h3" style={{ fontSize: 17, marginTop: 14 }}>{d.name}</Heading>
              <Text muted level="small" style={{ marginTop: 6 }}>{d.text}</Text>
            </Card>
          ))}
        </Grid>
      )}
      {types.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Grid cols={Math.min(types.length, 4)} gap={16}>
            {types.map((t, i) => (
              <Card key={i} tone="panel" style={{ padding: 20 }}>
                <Eyebrow style={{ marginBottom: 6 }}>{`Type ${String(i + 1).padStart(2, '0')}`}</Eyebrow>
                <Heading level="h3" as="h3" style={{ fontSize: 17 }}>{t.title}</Heading>
                <Text muted level="small" style={{ marginTop: 6 }}>{t.text}</Text>
              </Card>
            ))}
          </Grid>
        </div>
      )}
    </Band>
  );
}

// ─── FULL PROFILE (About Me) ─────────────────────────────────────────────────
export function AboutProfileSection({ section }) {
  const { compact } = useWebsite();
  const c = useSectionContent(section.section);
  const highlights = numberedItems(c, 'highlight', ['title', 'text']);
  return (
    <>
      <Band>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '5fr 7fr', gap: compact ? 24 : 56, alignItems: 'center' }}>
          {c.photo ? (
            <Picture src={c.photo} alt={c.name} ratio="1 / 1" style={{ boxShadow: SHADOW.lift }}>
              {c.photo_badge && <Tag style={{ position: 'absolute', left: 16, bottom: 16 }}>{c.photo_badge}</Tag>}
            </Picture>
          ) : (
            <div style={{ aspectRatio: '1 / 1', borderRadius: RADIUS.md, background: V.panel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Initials name={c.name} sizePx={compact ? 96 : 140} />
            </div>
          )}
          <div>
            <Eyebrow>{[c.eyebrow, c.license_number].filter(Boolean).join('  ·  ')}</Eyebrow>
            <Heading as="h1" level="h1">{c.name || section.title}</Heading>
            {c.role && <div style={{ fontFamily: FONT.body, fontSize: 17, color: V.accent, marginTop: 6 }}>{c.role}</div>}
            {c.quote && <p style={{ fontFamily: FONT.heading, fontStyle: 'italic', fontSize: compact ? 18 : 22, color: NEUTRAL.body, margin: '18px 0 0' }}>“{c.quote}”</p>}
          </div>
        </div>
      </Band>
      {(c.full_profile || highlights.length > 0) && (
        <Band tone="panel">
          <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 2fr', gap: compact ? 20 : 48 }}>
            <div>
              <Eyebrow>{c.philosophy_eyebrow}</Eyebrow>
              <Heading level="h2">{c.philosophy_title}</Heading>
            </div>
            <div>
              <Text level="lead">{c.full_profile}</Text>
              {highlights.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Grid cols={Math.min(highlights.length, 3)} gap={16}>
                    {highlights.map((h, i) => (
                      <Card key={i} style={{ padding: 18 }}>
                        <div style={{ fontFamily: FONT.body, fontSize: 15, fontWeight: 600, color: NEUTRAL.text }}>{h.title}</div>
                        <Text muted level="small" style={{ marginTop: 6 }}>{h.text}</Text>
                      </Card>
                    ))}
                  </Grid>
                </div>
              )}
            </div>
          </div>
        </Band>
      )}
    </>
  );
}
