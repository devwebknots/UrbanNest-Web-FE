// Contact sections: details, enquiry form, location and the paired
// details + form block. Owner content only. In preview mode the form is
// fully inert: inputs are disabled and nothing is sent (decision D6's email
// delivery is a later phase).

import React from 'react';
import { useWebsite, useSectionContent, numberedItems } from '../WebsiteContext';
import { Band, Eyebrow, Heading, Text, Action, Card, IconBox, PREVIEW_NOTE } from '../primitives';
import { FONT, NEUTRAL, RADIUS, SHADOW, V } from '../websiteTheme';

function DetailLine({ icon, label, value, onDark }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <IconBox icon={icon} onDark={onDark} />
      <div>
        <div style={{ fontFamily: FONT.body, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: onDark ? 'rgba(255,255,255,0.6)' : NEUTRAL.muted }}>{label}</div>
        <div style={{ fontFamily: FONT.body, fontSize: 15, color: onDark ? NEUTRAL.white : NEUTRAL.text, whiteSpace: 'pre-line', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function DetailsBody({ c, onDark = false, showDirectory = false }) {
  const departments = showDirectory ? numberedItems(c, 'department', ['label', 'phone', 'email', 'note']) : [];
  const offices = showDirectory ? numberedItems(c, 'office', ['label', 'address']) : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {c.company_name && <div style={{ fontFamily: FONT.heading, fontSize: 22, color: onDark ? NEUTRAL.white : NEUTRAL.text }}>{c.company_name}</div>}
      {c.response_note && (
        <div style={{ display: 'flex', gap: 8, background: onDark ? 'rgba(255,255,255,0.08)' : V.panel, borderRadius: RADIUS.sm, padding: '10px 14px', fontFamily: FONT.body, fontSize: 13, color: onDark ? NEUTRAL.white : NEUTRAL.body }}>
          <i className="ti ti-bolt" style={{ color: V.accent }} aria-hidden="true" />{c.response_note}
        </div>
      )}
      <DetailLine icon="ti-phone" label="Telephone" value={c.phone} onDark={onDark} />
      <DetailLine icon="ti-at" label="Email" value={c.email} onDark={onDark} />
      <DetailLine icon="ti-map-pin" label="Office" value={c.address} onDark={onDark} />
      <DetailLine icon="ti-clock" label="Office hours" value={c.office_hours} onDark={onDark} />
      {departments.length > 0 && (
        <div style={{ borderTop: `1px solid ${NEUTRAL.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {departments.map((d, i) => (
            <div key={i}>
              <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.muted }}>{d.label}</div>
              {d.phone && <div style={{ fontFamily: FONT.body, fontSize: 16, color: NEUTRAL.text }}>{d.phone}</div>}
              {d.email && <div style={{ fontFamily: FONT.body, fontSize: 13, color: V.accent }}>{d.email}</div>}
              {d.note && <div style={{ fontFamily: FONT.body, fontSize: 12, color: NEUTRAL.muted }}>{d.note}</div>}
            </div>
          ))}
        </div>
      )}
      {offices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {offices.map((o, i) => (
            <div key={i} style={{ background: V.panel, borderRadius: RADIUS.sm, padding: '10px 12px' }}>
              <div style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: V.accent }}>{o.label}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 13, color: NEUTRAL.text }}>{o.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, multiline, placeholder, required }) {
  const { mode } = useWebsite();
  const inert = mode === 'preview';
  const style = {
    width: '100%', boxSizing: 'border-box', border: `1px solid transparent`, background: V.panel, borderRadius: RADIUS.sm,
    padding: '12px 14px', fontFamily: FONT.body, fontSize: 14, color: NEUTRAL.text, resize: 'vertical',
  };
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: FONT.body, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: NEUTRAL.body }}>
        {label}{required ? ' *' : ''}
      </span>
      {multiline
        ? <textarea rows={4} placeholder={placeholder} disabled={inert} style={style} />
        : <input placeholder={placeholder} disabled={inert} style={style} />}
    </label>
  );
}

function EnquiryForm({ c, sectionTitle }) {
  const { compact, mode, data, page } = useWebsite();
  // The property reference appears only on the Contact page (as in the design).
  const property = page === 'CONTACT' && data && data.property && data.property.item;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <Heading level="h3" as="h3" style={{ fontSize: 26 }}>{c.title || sectionTitle}</Heading>
        {c.intro && <Text muted level="small" style={{ marginTop: 6 }}>{c.intro}</Text>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="Your name" required placeholder="Full name" />
        <Field label="Email address" required placeholder="name@example.com" />
      </div>
      <Field label="Phone number" placeholder="Optional" />
      {property && <Field label="Property" placeholder={property.title} />}
      <Field label="Message" required multiline placeholder="How can we help?" />
      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', gap: 12, alignItems: compact ? 'stretch' : 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONT.body, fontSize: 12, color: NEUTRAL.muted }}>
          <i className="ti ti-lock" aria-hidden="true" /> {mode === 'preview' ? PREVIEW_NOTE : c.privacy_note}
        </span>
        <Action icon="ti-send">{c.button_label || 'Send'}</Action>
      </div>
    </div>
  );
}

// CONTACT_DETAILS on its own.
export function ContactDetailsSection({ section }) {
  const c = useSectionContent(section.section);
  return (
    <Band>
      <Eyebrow rule>{c.eyebrow}</Eyebrow>
      <Heading as="h1" level="h1">{c.title || section.title}</Heading>
      <Text muted level="lead" style={{ marginTop: 10, marginBottom: 32 }}>{c.intro}</Text>
      <Card><DetailsBody c={c} showDirectory /></Card>
    </Band>
  );
}

// CONTACT_FORM on its own.
export function ContactFormSection({ section }) {
  const c = useSectionContent(section.section);
  return <Band><Card><EnquiryForm c={c} sectionTitle={section.title} /></Card></Band>;
}

// CONTACT_DETAILS immediately followed by CONTACT_FORM: one block, as in the
// designs. 'dark' (portfolio home / about) or 'split' (community home and
// every Contact page).
export function ContactPair({ details, form }) {
  const { compact, layout, page } = useWebsite();
  const { content } = useWebsite();
  const d = content?.pages?.[page]?.[details.section] || {};
  const f = content?.pages?.[page]?.[form.section] || {};
  const dark = layout === 'portfolio' && page !== 'CONTACT';

  if (page === 'CONTACT') {
    return (
      <Band>
        <Eyebrow rule>{d.eyebrow}</Eyebrow>
        <Heading as="h1" level="h1" style={{ fontSize: compact ? 34 : 56 }}>{d.title || details.title}</Heading>
        <Text muted level="lead" style={{ marginTop: 10, marginBottom: 36 }}>{d.intro}</Text>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '5fr 7fr', gap: 28, alignItems: 'start' }}>
          <Card><DetailsBody c={d} showDirectory /></Card>
          <Card style={{ padding: compact ? 22 : 40 }}><EnquiryForm c={f} sectionTitle={form.title} /></Card>
        </div>
      </Band>
    );
  }

  return (
    <Band>
      <div style={{
        display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', borderRadius: RADIUS.md, overflow: 'hidden',
        boxShadow: SHADOW.lift, background: dark ? V.dark : NEUTRAL.white,
      }}>
        <div style={{ padding: compact ? 24 : 48 }}>
          <Eyebrow onDark={dark} rule={!dark}>{d.eyebrow}</Eyebrow>
          <Heading level="h2" onDark={dark}>{d.title || details.title}</Heading>
          <Text muted onDark={dark} style={{ marginTop: 12, marginBottom: 28 }}>{d.intro}</Text>
          <DetailsBody c={{ ...d, company_name: dark ? '' : d.company_name }} onDark={dark} />
        </div>
        <div style={{ padding: compact ? 20 : 40, background: dark ? 'transparent' : V.panel }}>
          <Card style={{ padding: compact ? 20 : 32 }}><EnquiryForm c={f} sectionTitle={form.title} /></Card>
        </div>
      </div>
    </Band>
  );
}

// LOCATION: office address with a maps link (no third-party map embed).
export function LocationSection({ section }) {
  const { content, page } = useWebsite();
  const c = useSectionContent(section.section);
  const address = content?.pages?.[page]?.CONTACT_DETAILS?.address || content?.site?.footer_address;
  if (!address) return null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/\n/g, ', '))}`;
  return (
    <Band style={{ paddingTop: 0 }}>
      <Card tone="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <IconBox icon="ti-map-2" />
          <div>
            <Eyebrow style={{ marginBottom: 4 }}>{c.caption || section.title}</Eyebrow>
            <div style={{ fontFamily: FONT.body, fontSize: 15, color: NEUTRAL.text, whiteSpace: 'pre-line' }}>{address}</div>
          </div>
        </div>
        <Action kind="outline" small href={mapsUrl} icon="ti-external-link">Open in Maps</Action>
      </Card>
    </Band>
  );
}
