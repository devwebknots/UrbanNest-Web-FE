// WebsiteRenderer — focused render tests (Website Builder Phase 2).
// Fixture: the three seeded templates' manifests + sample content, exported
// from the websites migrations. Property payloads below follow the verified
// public Marketplace shapes (_serialize_listing_card / detail views); they
// are test data only.

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import WebsiteRenderer from '../WebsiteRenderer';
import { detailView } from '../propertyData';
import fixture from './templates.fixture.json';

jest.mock('../../../pages/Marketplace/Detail/marketplaceDetailShared', () => {
  const money = (a) => (a === null || a === undefined ? null : `$${Number(a).toLocaleString()}`);
  return {
    money,
    moneyOrRange: (single, range, suffix = '') => (range ? `${range}${suffix}` : (single === null || single === undefined ? '—' : `${money(single)}${suffix}`)),
    specOrRange: (single, range, label) => (range ? `${range} ${label}` : `${single} ${label}`),
    amenityIcon: () => 'ti-circle-check',
    Lightbox: () => null,
  };
});

const T = {
  community: fixture['COMMUNITY_SITE|Community Website'],
  ipm: fixture['PORTFOLIO_SITE|Independent PM Website'],
  landlord: fixture['PORTFOLIO_SITE|Landlord Website'],
};

const CARD = {
  id: 'real-7', isGroup: false, title: 'Maple Court 2B', listingType: 'RENT', priceAmount: 2400, priceUnit: 'month',
  addressLine: '12 Maple St', city: 'Springfield', state: 'IL', beds: 2, baths: 1, sqft: 900, coverImage: 'https://img.test/a.jpg',
};
const DETAIL = {
  id: 'real-7', isGroup: false, listingType: 'RENT', title: 'Maple Court 2B', description: 'Bright two-bedroom home.',
  highlights: ['Water included'], beds: 2, baths: 1, sqft: 900,
  address: { street1: '12 Maple St', city: 'Springfield', state: 'IL' },
  fees: { rentAmount: 2400, securityDeposit: 2400, leaseTermMonths: 12, applicationFee: 45 },
  gallery: { coverImage: 'https://img.test/a.jpg', photos: ['https://img.test/a.jpg', 'https://img.test/b.jpg'], videos: [], floorPlanImages: [] },
  floorPlan: { name: null, imageUrl: null }, amenities: ['Dishwasher'],
  leadContact: { name: 'Jamie Lee', phone: '555-0100', email: 'jamie@example.com', photoUrl: null, orgName: null, role: 'AGENT' },
};

const fullData = { properties: { status: 'ready', items: [CARD] }, property: { status: 'ready', item: detailView(DETAIL) } };
const emptyData = { properties: { status: 'ready', items: [] }, property: { status: 'error', item: null } };

function show(tpl, page, { data = fullData, mode = 'preview', manifest, onNavigate = jest.fn() } = {}) {
  render(<WebsiteRenderer manifest={manifest || tpl.manifest} content={tpl.content} data={data} page={page} mode={mode} onNavigate={onNavigate} />);
  return onNavigate;
}

const enabled = (tpl) => tpl.manifest.structure.pages.filter(p => p.enabled).map(p => p.page);

describe('approved pages render for every template', () => {
  test('Community: Home, Properties, Property Details, Contact — no About', () => {
    expect(enabled(T.community)).toEqual(['HOME', 'PROPERTIES', 'PROPERTY_DETAILS', 'CONTACT']);
  });
  test.each(['ipm', 'landlord'])('%s: Home, About Me, Properties, Property Details, Contact', (k) => {
    expect(enabled(T[k])).toEqual(['HOME', 'ABOUT', 'PROPERTIES', 'PROPERTY_DETAILS', 'CONTACT']);
  });

  Object.entries(T).forEach(([key, tpl]) => {
    enabled(tpl).forEach((page) => {
      test(`${key} ${page} renders without errors`, () => {
        show(tpl, page);
        const root = document.querySelector('[data-website-page]');
        expect(root.getAttribute('data-website-page')).toBe(page);
        expect(root.getAttribute('data-website-layout')).toBe(tpl.manifest.renderer_key === 'COMMUNITY_SITE' ? 'community' : 'portfolio');
      });
    });
  });
});

describe('content and personas', () => {
  test('Independent PM home shows "Meet Your Property Manager" fallback heading', () => {
    show(T.ipm, 'HOME');
    expect(screen.getByText(T.ipm.content.pages.HOME.INTRODUCTION.eyebrow)).toBeInTheDocument();
    expect(screen.getByText('Why Rent With An Independent PM')).toBeInTheDocument();
  });
  test('Landlord home uses its own section title', () => {
    show(T.landlord, 'HOME');
    expect(screen.getByText('Why Rent Directly From Me')).toBeInTheDocument();
  });
  test('navigation lists enabled pages only, without Property Details', () => {
    show(T.community, 'HOME');
    const nav = screen.getAllByRole('navigation')[0];
    expect(within(nav).getByText('Properties')).toBeInTheDocument();
    expect(within(nav).queryByText('Property Details')).toBeNull();
    expect(within(nav).queryByText('About Me')).toBeNull();
  });
});

describe('section visibility', () => {
  test('a disabled section is not rendered', () => {
    const manifest = JSON.parse(JSON.stringify(T.community.manifest));
    manifest.structure.pages[0].sections.find(s => s.section === 'CTA_BANNER').enabled = false;
    show(T.community, 'HOME', { manifest });
    expect(screen.queryByText(T.community.content.pages.HOME.CTA_BANNER.title)).toBeNull();
  });
  test('a disabled page is not reachable and falls back to the first page', () => {
    const manifest = JSON.parse(JSON.stringify(T.ipm.manifest));
    manifest.structure.pages.find(p => p.page === 'ABOUT').enabled = false;
    show(T.ipm, 'ABOUT', { manifest });
    expect(document.querySelector('[data-website-page]').getAttribute('data-website-page')).toBe('HOME');
  });
  test('an unknown layout shows a notice instead of breaking', () => {
    show(T.community, 'HOME', { manifest: { ...T.community.manifest, renderer_key: 'NOT_CODED' } });
    expect(screen.getByText(/is not available/)).toBeInTheDocument();
  });
});

describe('PMS data vs owner content', () => {
  test('property cards come from PMS data', () => {
    show(T.community, 'PROPERTIES');
    expect(screen.getByText('Maple Court 2B')).toBeInTheDocument();
    expect(screen.getByText('$2,400')).toBeInTheDocument();
  });
  test('property details show PMS facts, description and leasing contact', () => {
    show(T.community, 'PROPERTY_DETAILS');
    expect(screen.getAllByText('Maple Court 2B').length).toBeGreaterThan(0);
    expect(screen.getByText('Bright two-bedroom home.')).toBeInTheDocument();
    expect(screen.getByText('Jamie Lee')).toBeInTheDocument();
    expect(screen.getByText('Water included')).toBeInTheDocument();
  });
  test('missing PMS data shows empty states, never invented data', () => {
    show(T.community, 'PROPERTIES', { data: emptyData });
    expect(screen.getByText('No properties are available right now.')).toBeInTheDocument();
  });
  test('unavailable property shows an honest notice', () => {
    show(T.community, 'PROPERTY_DETAILS', { data: emptyData });
    expect(screen.getByText('This property is not available.')).toBeInTheDocument();
    expect(screen.queryByText('Apply Now')).toBeNull();
  });
});

describe('capabilities and inert preview actions', () => {
  test('Apply and viewing buttons follow capabilities and are inert in preview', () => {
    show(T.community, 'PROPERTY_DETAILS');
    const apply = screen.getByText('Apply Now').closest('button');
    const tour = screen.getByText('Schedule a Viewing').closest('button');
    expect(apply).toHaveAttribute('data-inert', 'true');
    expect(tour).toHaveAttribute('data-inert', 'true');
  });
  test('without APPLY_NOW / TOUR_BOOKING the buttons are not rendered', () => {
    const manifest = JSON.parse(JSON.stringify(T.community.manifest));
    manifest.structure.capabilities = manifest.structure.capabilities.filter(c => c !== 'APPLY_NOW' && c !== 'TOUR_BOOKING');
    show(T.community, 'PROPERTY_DETAILS', { manifest });
    expect(screen.queryByText('Apply Now')).toBeNull();
    expect(screen.queryByText('Schedule a Viewing')).toBeNull();
  });
  test('PROPERTY_SEARCH capability controls the search bar', () => {
    show(T.community, 'PROPERTIES');
    expect(screen.getByLabelText('Search properties')).toBeInTheDocument();
  });
  test('contact form inputs are disabled and submit is inert in preview', () => {
    show(T.ipm, 'CONTACT');
    document.querySelectorAll('main input, main textarea').forEach(el => {
      if (el.getAttribute('aria-label') !== 'Search properties') expect(el).toBeDisabled();
    });
    expect(screen.getByText('Send Message').closest('button')).toHaveAttribute('data-inert', 'true');
  });
  test('View Details opens the property in preview mode', () => {
    const onNavigate = show(T.community, 'PROPERTIES');
    const button = screen.getByText('View Details').closest('button');
    expect(button).not.toHaveAttribute('data-inert');
    fireEvent.click(button);
    expect(onNavigate).toHaveBeenCalledWith('PROPERTY_DETAILS', { propertyId: 'real-7' });
  });
  test('inert actions never navigate or call out; internal links navigate', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    const onNavigate = show(T.community, 'PROPERTY_DETAILS');
    fireEvent.click(screen.getByText('Apply Now'));
    expect(onNavigate).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Properties')[0]);
    expect(onNavigate).toHaveBeenCalledWith('PROPERTIES', undefined);
    openSpy.mockRestore();
  });
});
