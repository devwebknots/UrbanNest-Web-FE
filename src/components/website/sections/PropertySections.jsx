// PMS-driven sections. Their body ALWAYS comes from PMS data (data prop);
// owner content only supplies headings and eyebrows. Missing data is omitted
// or shown as an honest empty state — never invented. The existing
// Marketplace AvailableUnitsTable / floorPlanTiles are deliberately NOT reused:
// they pad thin data with sample rows, which a website must not show.

import React, { useMemo, useState } from 'react';
import { useWebsite, useSectionContent, useCapability } from '../WebsiteContext';
import {
  Band, Eyebrow, Heading, Text, SectionHead, Action, Picture, Card, Grid, Tag, EmptyNote, Initials,
} from '../primitives';
import { FONT, NEUTRAL, RADIUS, SHADOW, V, size } from '../websiteTheme';
import { cardView } from '../propertyData';
import { Lightbox, amenityIcon } from '../../../pages/Marketplace/Detail/marketplaceDetailShared';

// ─── Property card ───────────────────────────────────────────────────────────
function PropertyCard({ card }) {
  const { navigate } = useWebsite();
  const v = cardView(card);
  return (
    <div style={{ background: NEUTRAL.white, borderRadius: RADIUS.md, overflow: 'hidden', boxShadow: SHADOW.card, display: 'flex', flexDirection: 'column' }}>
      <Picture src={v.image} alt={v.title} ratio="4 / 3" rounded={0}>
        {v.tag && <Tag style={{ position: 'absolute', top: 12, left: 12 }}>{v.tag}</Tag>}
      </Picture>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {v.price && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: FONT.heading, fontSize: 22, color: NEUTRAL.text }}>{v.price}</span>
            <span style={{ fontFamily: FONT.body, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.muted }}>{v.priceUnit}</span>
          </div>
        )}
        <div style={{ fontFamily: FONT.body, fontSize: 16, fontWeight: 600, color: NEUTRAL.text }}>{v.title}</div>
        {v.address && (
          <div style={{ fontFamily: FONT.body, fontSize: 12, color: NEUTRAL.muted }}>
            <i className="ti ti-map-pin" style={{ color: V.accent, marginRight: 4 }} aria-hidden="true" />{v.address}
          </div>
        )}
        {v.facts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${v.facts.length}, 1fr)`, background: V.panel, borderRadius: RADIUS.sm, padding: '10px 6px', textAlign: 'center' }}>
            {v.facts.map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: FONT.body, fontSize: 15, fontWeight: 600, color: NEUTRAL.text }}>{f.value}</div>
                <div style={{ fontFamily: FONT.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.muted }}>{f.label}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 'auto' }}>
          <Action kind="soft" small full onClick={() => navigate('PROPERTY_DETAILS', { propertyId: card.id })}>View Details</Action>
        </div>
      </div>
    </div>
  );
}

function PropertyCards({ cards, cols }) {
  return <Grid cols={cols} gap={24}>{cards.map(c => <PropertyCard key={c.id} card={c} />)}</Grid>;
}

function propertiesState(data) {
  const p = (data && data.properties) || {};
  return { status: p.status || 'ready', items: p.items || [] };
}

// ─── FEATURED_PROPERTIES / PROPERTY_LIST ─────────────────────────────────────
export function FeaturedPropertiesSection({ section }) {
  const { data, layout } = useWebsite();
  const c = useSectionContent(section.section);
  const { status, items } = propertiesState(data);
  const featured = items.slice(0, layout === 'portfolio' ? 4 : 3);
  return (
    <Band>
      <SectionHead eyebrow={c.eyebrow} title={c.title || section.title} intro={c.intro} />
      <PropertyStatus status={status} count={items.length}>
        <PropertyCards cards={featured} cols={featured.length > 3 ? 4 : 3} />
        {c.button_label && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Action kind="soft" to="PROPERTIES" icon="ti-arrow-right">
              {`${c.button_label} (${items.length})`}
            </Action>
          </div>
        )}
      </PropertyStatus>
    </Band>
  );
}

export function PropertyListSection({ section }) {
  const { data, compact } = useWebsite();
  const c = useSectionContent(section.section);
  const searchable = useCapability('PROPERTY_SEARCH');
  const { status, items } = propertiesState(data);
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(it => [it.title, it.addressLine, it.city, it.state].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [items, q]);
  return (
    <Band>
      <SectionHead eyebrow={c.eyebrow} title={c.title || section.title} intro={c.intro}
        aside={items.length ? (
          <div style={{ background: V.panel, borderRadius: RADIUS.sm, padding: '12px 18px' }}>
            <div style={{ fontFamily: FONT.body, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: NEUTRAL.muted }}>Available now</div>
            <div style={{ fontFamily: FONT.heading, fontSize: 24, color: NEUTRAL.text }}>{items.length}</div>
          </div>
        ) : null} />
      {searchable && items.length > 0 && (
        <div style={{ display: 'flex', gap: 12, background: NEUTRAL.white, padding: 14, borderRadius: RADIUS.sm, boxShadow: SHADOW.card, marginBottom: 28, flexDirection: compact ? 'column' : 'row' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: V.panel, borderRadius: RADIUS.sm, padding: '0 14px' }}>
            <i className="ti ti-search" style={{ color: NEUTRAL.muted }} aria-hidden="true" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, street or city"
              aria-label="Search properties"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '12px 0', fontFamily: FONT.body, fontSize: 14 }} />
          </div>
          {q && <Action kind="soft" small onClick={() => setQ('')}>Reset</Action>}
        </div>
      )}
      <PropertyStatus status={status} count={shown.length} filtered={Boolean(q)}>
        <PropertyCards cards={shown} cols={3} />
      </PropertyStatus>
    </Band>
  );
}

function PropertyStatus({ status, count, filtered, children }) {
  if (status === 'loading') return <EmptyNote icon="ti-loader-2">Loading properties…</EmptyNote>;
  if (status === 'error') return <EmptyNote icon="ti-alert-circle">Properties could not be loaded.</EmptyNote>;
  if (!count) return <EmptyNote>{filtered ? 'No properties match your search.' : 'No properties are available right now.'}</EmptyNote>;
  return children;
}

// ─── PROPERTY DETAILS ────────────────────────────────────────────────────────
function useProperty() {
  const { data } = useWebsite();
  return (data && data.property) || { status: 'empty', item: null };
}

// Fixed page header for the Property Details page (PMS data, not a section).
export function PropertyHeader() {
  const { compact, navigate } = useWebsite();
  const { status, item } = useProperty();
  if (status === 'loading') return <Band><EmptyNote icon="ti-loader-2">Loading property…</EmptyNote></Band>;
  if (status === 'error' || !item) {
    return (
      <Band>
        <EmptyNote icon="ti-home-off">This property is not available.</EmptyNote>
        <div style={{ textAlign: 'center', marginTop: 20 }}><Action kind="soft" to="PROPERTIES">Back to Properties</Action></div>
      </Band>
    );
  }
  return (
    <Band style={{ paddingBottom: 24 }}>
      <div style={{ fontFamily: FONT.body, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.muted, marginBottom: 12 }}>
        <button type="button" onClick={() => navigate('PROPERTIES')} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>Properties</button>
        {'  /  '}<span style={{ color: NEUTRAL.text }}>{item.title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', alignItems: compact ? 'flex-start' : 'flex-end', gap: 12 }}>
        <div>
          <Heading as="h1" level="h1">{item.title}</Heading>
          {item.address && <Text muted style={{ marginTop: 6 }}><i className="ti ti-map-pin" aria-hidden="true" /> {item.address}</Text>}
        </div>
        {item.price && (
          <div style={{ textAlign: compact ? 'left' : 'right' }}>
            <span style={{ fontFamily: FONT.heading, fontSize: size('h1', compact), color: NEUTRAL.text }}>{item.price}</span>
            <span style={{ fontFamily: FONT.body, fontSize: 13, color: NEUTRAL.muted }}> {item.priceUnit}</span>
          </div>
        )}
      </div>
    </Band>
  );
}

export function PropertyGallerySection() {
  const { compact } = useWebsite();
  const { item } = useProperty();
  const [open, setOpen] = useState(null);
  if (!item || !item.photos.length) return null;
  const [first, ...rest] = item.photos;
  const side = rest.slice(0, 2);
  const lightboxItems = item.photos.map(url => ({ type: 'photo', url }));
  return (
    <Band style={{ paddingTop: 0, paddingBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: compact || !side.length ? '1fr' : '2fr 1fr', gap: 10, height: compact ? 'auto' : 460 }}>
        <button type="button" onClick={() => setOpen(0)} style={{ padding: 0, border: 'none', cursor: 'zoom-in', background: 'none' }}>
          <Picture src={first} alt={item.title} height={compact ? 240 : '100%'}>
            <Tag tone="dark" style={{ position: 'absolute', top: 14, left: 14 }}>{`1 / ${item.photos.length} photos`}</Tag>
          </Picture>
        </button>
        {!compact && side.length > 0 && (
          <div style={{ display: 'grid', gridTemplateRows: `repeat(${side.length}, 1fr)`, gap: 10 }}>
            {side.map((url, i) => (
              <button key={url} type="button" onClick={() => setOpen(i + 1)} style={{ padding: 0, border: 'none', cursor: 'zoom-in', background: 'none' }}>
                <Picture src={url} alt="" height="100%" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open !== null && <Lightbox items={lightboxItems} startIndex={open} onClose={() => setOpen(null)} />}
    </Band>
  );
}

export function PropertyOverviewSection() {
  const { compact } = useWebsite();
  const { item } = useProperty();
  if (!item || !item.facts.length) return null;
  return (
    <Band style={{ paddingTop: 0, paddingBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compact ? 2 : item.facts.length}, minmax(0,1fr))`, gap: 16, background: V.panel, borderRadius: RADIUS.md, padding: compact ? 18 : 28 }}>
        {item.facts.map(f => (
          <div key={f.label}>
            <div style={{ fontFamily: FONT.body, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: V.accent }}>{f.label}</div>
            <div style={{ fontFamily: FONT.heading, fontSize: compact ? 18 : 22, color: NEUTRAL.text, marginTop: 4 }}>{f.value}</div>
          </div>
        ))}
      </div>
    </Band>
  );
}

function DetailBlock({ eyebrow, title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading level="h3" as="h3" style={{ fontSize: 26, marginBottom: 16 }}>{title}</Heading>
      {children}
    </div>
  );
}

export function PropertyDescriptionSection({ section }) {
  const { item } = useProperty();
  const c = useSectionContent(section.section);
  if (!item || !item.description) return null;
  return <DetailBlock eyebrow={c.eyebrow} title={section.title}><Text level="lead">{item.description}</Text></DetailBlock>;
}

export function FloorPlanSection({ section }) {
  const { item } = useProperty();
  const c = useSectionContent(section.section);
  const [open, setOpen] = useState(null);
  if (!item || !item.floorPlans.length) return null;
  return (
    <DetailBlock eyebrow={c.eyebrow} title={item.floorPlanName || section.title}>
      <Grid cols={Math.min(item.floorPlans.length, 2)} gap={12}>
        {item.floorPlans.map((url, i) => (
          <button key={url} type="button" onClick={() => setOpen(i)} style={{ padding: 0, border: 'none', background: NEUTRAL.white, borderRadius: RADIUS.md, cursor: 'zoom-in' }}>
            <img src={url} alt={`Floor plan ${i + 1}`} style={{ width: '100%', display: 'block', borderRadius: RADIUS.md }} />
          </button>
        ))}
      </Grid>
      {open !== null && <Lightbox items={item.floorPlans.map(url => ({ type: 'photo', url }))} startIndex={open} onClose={() => setOpen(null)} />}
    </DetailBlock>
  );
}

export function AmenitiesSection({ section }) {
  const { item } = useProperty();
  const c = useSectionContent(section.section);
  if (!item || !item.amenities.length) return null;
  return (
    <DetailBlock eyebrow={c.eyebrow} title={section.title}>
      <Grid cols={2} gap={12}>
        {item.amenities.map(name => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: V.panel, borderRadius: RADIUS.sm, padding: '14px 16px' }}>
            <i className={`ti ${amenityIcon(name)}`} style={{ color: V.accent, fontSize: 18 }} aria-hidden="true" />
            <span style={{ fontFamily: FONT.body, fontSize: 14, color: NEUTRAL.text }}>{name}</span>
          </div>
        ))}
      </Grid>
    </DetailBlock>
  );
}

export function IncludedServicesSection({ section }) {
  const { item } = useProperty();
  const c = useSectionContent(section.section);
  if (!item || !item.highlights.length) return null;
  return (
    <DetailBlock eyebrow={c.eyebrow} title={section.title}>
      <Card tone="panel">
        <Grid cols={2} gap={14}>
          {item.highlights.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <i className="ti ti-circle-check" style={{ color: V.accent, fontSize: 18 }} aria-hidden="true" />
              <span style={{ fontFamily: FONT.body, fontSize: 14, color: NEUTRAL.text }}>{h}</span>
            </div>
          ))}
        </Grid>
      </Card>
    </DetailBlock>
  );
}

export function AvailableUnitsSection({ section }) {
  const { item } = useProperty();
  const { compact } = useWebsite();
  if (!item || !item.units.length) return null;
  return (
    <DetailBlock title={section.title}>
      <div style={{ background: NEUTRAL.white, borderRadius: RADIUS.md, boxShadow: SHADOW.card, overflow: 'hidden' }}>
        {item.units.map((u, i) => (
          <div key={u.id} style={{
            display: 'grid', gridTemplateColumns: compact ? '1fr auto' : '2fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'center',
            padding: '14px 18px', borderTop: i ? `1px solid ${NEUTRAL.border}` : 'none', fontFamily: FONT.body, fontSize: 14, color: NEUTRAL.text,
          }}>
            <span style={{ fontWeight: 600 }}>{u.label}</span>
            {!compact && <span>{u.beds !== null && u.beds !== undefined ? `${u.beds} bd` : ''}</span>}
            {!compact && <span>{u.baths !== null && u.baths !== undefined ? `${u.baths} ba` : ''}</span>}
            {!compact && <span>{u.sqft ? `${Number(u.sqft).toLocaleString()} sq ft` : ''}</span>}
            <span style={{ textAlign: 'right', fontFamily: FONT.heading, fontSize: 17 }}>{u.price || ''}</span>
          </div>
        ))}
      </div>
    </DetailBlock>
  );
}

// ─── Aside column ────────────────────────────────────────────────────────────
export function ApplyCtaSection({ section }) {
  const { item } = useProperty();
  const c = useSectionContent(section.section);
  const canApply = useCapability('APPLY_NOW');
  const canTour = useCapability('TOUR_BOOKING');
  if (!item) return null;
  const rows = [
    item.applicationFee && { icon: 'ti-receipt', label: 'Application fee', value: item.applicationFee },
    item.leaseTerm && { icon: 'ti-calendar', label: 'Lease term', value: item.leaseTerm },
  ].filter(Boolean);
  return (
    <Card style={{ borderTop: `4px solid ${V.accent}`, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <Eyebrow style={{ marginBottom: 4 }}>{item.priceUnit ? 'Monthly rent' : 'Price'}</Eyebrow>
          <span style={{ fontFamily: FONT.heading, fontSize: 34, color: NEUTRAL.text }}>{item.price || '—'}</span>
          <span style={{ fontFamily: FONT.body, fontSize: 13, color: NEUTRAL.muted }}> {item.priceUnit}</span>
        </div>
        {item.deposit && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: FONT.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.muted }}>Deposit</div>
            <div style={{ fontFamily: FONT.body, fontSize: 17, fontWeight: 600, color: NEUTRAL.text }}>{item.deposit}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {canApply && <Action full icon="ti-bolt">{c.button_label || 'Apply Now'}</Action>}
        {canApply && c.helper_text && <div style={{ textAlign: 'center', fontFamily: FONT.body, fontSize: 12, color: NEUTRAL.muted }}>{c.helper_text}</div>}
        {canTour && <Action kind="soft" full icon="ti-calendar-event">{c.tour_button_label || 'Schedule a Viewing'}</Action>}
      </div>
      {rows.length > 0 && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${NEUTRAL.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.body, fontSize: 13 }}>
              <span style={{ color: NEUTRAL.muted }}><i className={`ti ${r.icon}`} aria-hidden="true" /> {r.label}</span>
              <span style={{ color: NEUTRAL.text, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LeasingContactSection({ section }) {
  const { item } = useProperty();
  const c = useSectionContent(section.section);
  const contact = item && item.leadContact;
  if (!contact) return null;
  return (
    <Card tone="panel" style={{ marginBottom: 16, padding: 22 }}>
      <Eyebrow>{c.eyebrow || section.title}</Eyebrow>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {contact.photoUrl
          ? <img src={contact.photoUrl} alt={contact.name} style={{ width: 56, height: 56, borderRadius: RADIUS.sm, objectFit: 'cover' }} />
          : <Initials name={contact.name} />}
        <div>
          <div style={{ fontFamily: FONT.heading, fontSize: 20, color: NEUTRAL.text }}>{contact.name}</div>
          {contact.orgName && <div style={{ fontFamily: FONT.body, fontSize: 12, color: V.accent, textTransform: 'uppercase', letterSpacing: 0.8 }}>{contact.orgName}</div>}
        </div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: FONT.body, fontSize: 13, color: NEUTRAL.body }}>
        {contact.phone && <span><i className="ti ti-phone" style={{ color: V.accent }} aria-hidden="true" /> {contact.phone}</span>}
        {contact.email && <span><i className="ti ti-at" style={{ color: V.accent }} aria-hidden="true" /> {contact.email}</span>}
      </div>
    </Card>
  );
}

export function FairHousingNoticeSection({ section }) {
  const c = useSectionContent(section.section);
  if (!c.text) return null;
  return (
    <div style={{ display: 'flex', gap: 10, background: V.panel, borderRadius: RADIUS.sm, padding: '14px 16px', fontFamily: FONT.body, fontSize: 12, color: NEUTRAL.muted }}>
      <i className="ti ti-shield" style={{ fontSize: 18 }} aria-hidden="true" />
      <span>{c.text}</span>
    </div>
  );
}
