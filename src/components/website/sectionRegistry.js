// Section registry — the one place a manifest section code meets its coded
// component. Only the sections used by the approved templates are registered;
// adding a section later is one entry here plus one UN Reference row.
//
// placement controls the Property Details page layout:
//   full  — full-width band, in manifest order (default)
//   main  — left column of the two-column detail layout
//   aside — right column (sticky)

import {
  HeroSection, KeyStatsSection, IntroductionSection, CtaBannerSection, ItemCardsSection,
  ServiceAreasSection, AboutProfileSection,
} from './sections/MarketingSections';
import {
  FeaturedPropertiesSection, PropertyListSection, PropertyGallerySection, PropertyOverviewSection,
  PropertyDescriptionSection, FloorPlanSection, AmenitiesSection, IncludedServicesSection,
  AvailableUnitsSection, ApplyCtaSection, LeasingContactSection, FairHousingNoticeSection,
} from './sections/PropertySections';
import { ContactDetailsSection, ContactFormSection, LocationSection } from './sections/ContactSections';

export const SECTION_REGISTRY = {
  HERO: { component: HeroSection },
  KEY_STATS: { component: KeyStatsSection },
  INTRODUCTION: { component: IntroductionSection },
  FEATURED_PROPERTIES: { component: FeaturedPropertiesSection },
  CTA_BANNER: { component: CtaBannerSection },
  VALUE_PILLARS: { component: ItemCardsSection },
  SERVICES_LIST: { component: ItemCardsSection },
  CREDENTIALS: { component: ItemCardsSection },
  RESOURCE_LINKS: { component: ItemCardsSection },
  SERVICE_AREAS: { component: ServiceAreasSection },
  ABOUT_PROFILE: { component: AboutProfileSection },
  CONTACT_DETAILS: { component: ContactDetailsSection },
  CONTACT_FORM: { component: ContactFormSection },
  LOCATION: { component: LocationSection },
  PROPERTY_LIST: { component: PropertyListSection },
  PROPERTY_GALLERY: { component: PropertyGallerySection },
  PROPERTY_OVERVIEW: { component: PropertyOverviewSection },
  PROPERTY_DESCRIPTION: { component: PropertyDescriptionSection, placement: 'main' },
  FLOOR_PLAN: { component: FloorPlanSection, placement: 'main' },
  AMENITIES: { component: AmenitiesSection, placement: 'main' },
  INCLUDED_SERVICES: { component: IncludedServicesSection, placement: 'main' },
  AVAILABLE_UNITS: { component: AvailableUnitsSection, placement: 'main' },
  APPLY_CTA: { component: ApplyCtaSection, placement: 'aside' },
  LEASING_CONTACT: { component: LeasingContactSection, placement: 'aside' },
  FAIR_HOUSING_NOTICE: { component: FairHousingNoticeSection, placement: 'aside' },
};

export const placementOf = (code) => (SECTION_REGISTRY[code] && SECTION_REGISTRY[code].placement) || 'full';
