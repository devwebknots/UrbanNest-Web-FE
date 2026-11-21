// src/pages/ApplicationIntake/ApplicationIntakeContext.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Holds the in-flight Household Application draft across all four stages,
// per the approach document's data model (HouseholdApplication /
// ApplicationApplicant / rental history / employment / documents / consent —
// see applicationIntakeApi.js's own header and the Claude Project doc
// application-intake/UrbanNest_ApplicationIntake_Figma_ApproachDoc_Review.md).
//
// No backend app exists yet for this feature (Phase 1 is this FE build;
// the PE-4 intake-slice backend is the next piece of work). Every mutator
// below tries the real API first, and — same "FE-first, don't block on a
// backend that doesn't exist yet" posture as MarketplaceHomePage/
// PMListingsOverview/PromotionEngine before their own backends landed —
// falls back to updating local state + localStorage when that call fails
// (network error or 404), logging a console warning so this is never a
// silent swallow. `backendConnected` tracks which mode we're in so the UI
// can show an honest "Saved to this device" vs "Saved" indicator (NOT the
// amber Sample Data tag — that's reserved for the Figma's decorative
// institutional content in sampleInstitutionalContent.js; this is a real,
// if currently backend-less, save-state distinction).
//
// Draft persistence key: `un_application_draft:${kind}:${listingId}` so a
// Renter who closes the tab mid-Stage-2 picks back up where they left off
// (approach doc §10, Scenario H — "Application saved but not submitted").
// Once the real backend exists and returns a real applicationId, the key
// becomes `un_application_draft:id:${applicationId}` instead.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as api from './applicationIntakeApi';

const Ctx = createContext(null);

function draftKey({ kind, listingId, applicationId }) {
  return applicationId
    ? `un_application_draft:id:${applicationId}`
    : `un_application_draft:${kind}:${listingId}`;
}

function emptyApplicant(role, seed = {}) {
  return {
    id: null,
    role, // 'PRIMARY' | 'CO_APPLICANT'
    status: 'NOT_STARTED', // NOT_STARTED | IN_PROGRESS | SUBMITTED | WITHDRAWN
    legalFirstName: '', legalMiddleName: '', legalLastName: '',
    dateOfBirth: '', email: '', phone: '',
    // Session 56 — split from a single `currentAddress` free-text field
    // into real structured address components (matches how rental-history
    // addresses below, and the real `Property` address shape elsewhere in
    // this app, are already composed — street1/street2/city/state/zip).
    addressStreet1: '', addressStreet2: '', addressCity: '', addressState: '', addressZip: '',
    // occupantCount is no longer a free-text field a renter types in — per
    // request, it's protected/auto-calculated (1 primary + co-applicants +
    // dependents; see Stage1_ApplicantHousehold.jsx's own effect that keeps
    // it in sync) to avoid an inconsistent, hand-typed count drifting from
    // the household's real composition.
    desiredMoveInDate: '', occupantCount: '', isOccupant: true,
    rentalHistory: [],
    employment: {
      status: '', employerName: '', jobTitle: '',
      // Session [occupant-count/employment-dates request] — employmentDuration
      // (free text, e.g. "2 years 3 months") replaced with explicit
      // employmentStartDate/employmentEndDate (blank end = current
      // employer); duration itself is now always derived from these two
      // dates (applicationIntakeOptions.js's employmentDurationLabel()) so
      // it can never be typed inconsistently with the actual dates.
      employmentStartDate: '', employmentEndDate: '',
      employerContact: '', incomeAmount: '', incomeFrequency: 'MONTHLY',
      // Session 56 — was a single free-text field; now a real list of
      // { id, source, amount } entries (source from a fixed dropdown —
      // applicationIntakeOptions.js's ADDITIONAL_INCOME_SOURCES) so this is
      // actually analyzable instead of an unstructured string.
      additionalIncome: [],
    },
    documents: [], // { id, documentType, fileName, uploadedAt, label? }
    consents: {}, // { [consentType]: 'GRANTED' | 'DECLINED' }
    submittedAt: null,
    ...seed,
  };
}

export function ApplicationIntakeProvider({ kind, listingId, listingSummary, invitationToken, basePath, children }) {
  const { user } = useAuth();
  const [application, setApplication] = useState(null); // { id, status, householdApplicants: [...] }
  const [applicant, setApplicant] = useState(() => emptyApplicant(invitationToken ? 'CO_APPLICANT' : 'PRIMARY'));
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const bootstrapped = useRef(false);

  const persistLocal = useCallback((appState, applicantState) => {
    try {
      localStorage.setItem(
        draftKey({ kind, listingId, applicationId: appState?.id }),
        JSON.stringify({ application: appState, applicant: applicantState, savedAt: Date.now() })
      );
      setLastSavedAt(Date.now());
    } catch (e) {
      // localStorage unavailable (private mode, quota) — not fatal, just
      // means this particular draft isn't resumable after a reload.
      console.warn('[ApplicationIntake] could not persist local draft', e);
    }
  }, [kind, listingId]);

  // ── Bootstrap: resume local draft, then try to start/attach the real
  // application on the backend (co-applicant path: accept the invitation
  // instead of starting a new household). ──────────────────────────────
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;

    (async () => {
      // 1. Seed from any existing local draft first, so the form never
      // flashes empty while the network call below is in flight.
      try {
        const raw = localStorage.getItem(draftKey({ kind, listingId }));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.application) setApplication(parsed.application);
          if (parsed.applicant) setApplicant(parsed.applicant);
        }
      } catch { /* ignore corrupt draft */ }

      // 2. Prefill the Primary Applicant's identity from the real,
      // authenticated user profile — genuinely functional, not sample
      // (matches the Figma's "Pre-filled from Profile" badge honestly).
      if (user && !invitationToken) {
        setApplicant((prev) => ({
          ...prev,
          legalFirstName: prev.legalFirstName || user.first_name || '',
          legalLastName: prev.legalLastName || user.last_name || '',
          email: prev.email || user.email || '',
          phone: prev.phone || user.phone || '',
        }));
      }

      // 3. Try the real backend.
      try {
        if (invitationToken) {
          const result = await api.apiAcceptInvitation(invitationToken);
          if (cancelled) return;
          setApplication(result.household_application);
          setApplicant(result.applicant);
          setBackendConnected(true);
        } else {
          const result = await api.apiStartApplication(kind, listingId);
          if (cancelled) return;
          setApplication(result.household_application || result);
          if (result.primary_applicant) setApplicant((prev) => ({ ...prev, ...result.primary_applicant }));
          setBackendConnected(true);
        }
      } catch (e) {
        console.warn('[ApplicationIntake] backend not available yet — continuing in local-draft mode', e);
        setBackendConnected(false);
        if (!application) {
          setApplication({
            id: null,
            status: 'DRAFT',
            listingKind: kind,
            listingId,
            listingSummary,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, listingId, invitationToken]);

  // ── Generic field update (local-first, best-effort remote patch) ─────
  const updateApplicantFields = useCallback((patchObj) => {
    setApplicant((prev) => {
      const next = { ...prev, ...patchObj, status: prev.status === 'NOT_STARTED' ? 'IN_PROGRESS' : prev.status };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id) {
        api.apiUpdateApplicant(application.id, next.id, patchObj).catch((e) => {
          console.warn('[ApplicationIntake] remote save failed, kept locally', e);
        });
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  const setEmployment = useCallback((employmentPatch) => {
    setApplicant((prev) => {
      const next = { ...prev, employment: { ...prev.employment, ...employmentPatch }, status: 'IN_PROGRESS' };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id) {
        api.apiSetEmployment(application.id, next.id, next.employment).catch((e) =>
          console.warn('[ApplicationIntake] remote employment save failed, kept locally', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  // `isCurrent` (new field, per request — "we need to know which residence
  // is current") is kept exclusive: adding a new entry marked current
  // un-marks every existing one, so at most one residence is ever "current"
  // at a time. Same exclusivity enforced in setCurrentResidence() below for
  // marking an already-added entry current after the fact.
  const addRentalHistoryEntry = useCallback((entry) => {
    setApplicant((prev) => {
      const localEntry = { id: `local-${Date.now()}`, ...entry };
      const existing = entry.isCurrent ? prev.rentalHistory.map((e) => ({ ...e, isCurrent: false })) : prev.rentalHistory;
      const next = { ...prev, rentalHistory: [...existing, localEntry] };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id) {
        api.apiAddRentalHistory(application.id, next.id, entry).catch((e) =>
          console.warn('[ApplicationIntake] remote rental history save failed, kept locally', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  const removeRentalHistoryEntry = useCallback((entryId) => {
    setApplicant((prev) => {
      const next = { ...prev, rentalHistory: prev.rentalHistory.filter((e) => e.id !== entryId) };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id && !String(entryId).startsWith('local-')) {
        api.apiDeleteRentalHistory(application.id, next.id, entryId).catch((e) =>
          console.warn('[ApplicationIntake] remote rental history delete failed', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  const setCurrentResidence = useCallback((entryId) => {
    setApplicant((prev) => {
      const next = { ...prev, rentalHistory: prev.rentalHistory.map((e) => ({ ...e, isCurrent: e.id === entryId })) };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id && !String(entryId).startsWith('local-')) {
        api.apiUpdateRentalHistory(application.id, next.id, entryId, { isCurrent: true }).catch((e) =>
          console.warn('[ApplicationIntake] remote rental history update failed, kept locally', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  // ── Additional income (Session 56) — replaces the old free-text field
  // with a real list of { source, amount } entries, same add/remove
  // pattern as rental history above. No dedicated backend endpoint exists
  // for this yet (it rides along inside the employment PATCH), so it's
  // saved via the same setEmployment() remote call once a source+amount
  // pair is actually present. ──────────────────────────────────────────
  const addAdditionalIncomeEntry = useCallback((entry) => {
    setApplicant((prev) => {
      const localEntry = { id: `local-inc-${Date.now()}`, ...entry };
      const nextEmployment = { ...prev.employment, additionalIncome: [...(prev.employment.additionalIncome || []), localEntry] };
      const next = { ...prev, employment: nextEmployment, status: 'IN_PROGRESS' };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id) {
        api.apiSetEmployment(application.id, next.id, nextEmployment).catch((e) =>
          console.warn('[ApplicationIntake] remote employment save failed, kept locally', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  const removeAdditionalIncomeEntry = useCallback((entryId) => {
    setApplicant((prev) => {
      const nextEmployment = { ...prev.employment, additionalIncome: (prev.employment.additionalIncome || []).filter((e) => e.id !== entryId) };
      const next = { ...prev, employment: nextEmployment };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id) {
        api.apiSetEmployment(application.id, next.id, nextEmployment).catch((e) =>
          console.warn('[ApplicationIntake] remote employment save failed, kept locally', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  // ── Dependents (Session 56) — a new concept the approach doc's data
  // model doesn't carry at all (it only has PRIMARY/CO_APPLICANT
  // `ApplicationApplicant` rows — see applicationIntakeApi.js's own
  // header). A dependent is a household member who lives at the unit but
  // is not applying and never gets their own applicant/invitation record,
  // so this is deliberately NOT modeled as a zero-invitation co-applicant.
  // No backend table exists for this yet, so — same "FE-first" posture as
  // everything else in this file — it's local/localStorage-only today
  // (persisted on the household `application`, not per-applicant, since a
  // dependent belongs to the household as a whole). Flagged here, and in
  // the Claude Project review doc, as a real architecture gap to close
  // once a backend intake slice exists, not silently left unsaid. ───────
  const addDependent = useCallback((dependentData) => {
    setApplication((prev) => {
      const localDependent = { id: `local-dep-${Date.now()}`, ...dependentData };
      const next = { ...prev, dependents: [...(prev?.dependents || []), localDependent] };
      persistLocal(next, applicant);
      return next;
    });
  }, [applicant, persistLocal]);

  const removeDependent = useCallback((dependentId) => {
    setApplication((prev) => {
      const next = { ...prev, dependents: (prev?.dependents || []).filter((d) => d.id !== dependentId) };
      persistLocal(next, applicant);
      return next;
    });
  }, [applicant, persistLocal]);

  // ── Property Requirements — Pets & Vehicles ───────────────────────────
  // Replaces the old numberOfPets/numberOfParkingSpots counters (Session 58)
  // per request: the applicant is now asked a plain yes/no ("Do you have
  // pets?" / "Do you have vehicles?" — setPropertyRequirements({hasPets}/
  // {hasVehicles})), and, if yes, adds one entry per pet/vehicle with real
  // detail (pet type/breed/weight; vehicle type/brand) via addPet/addVehicle
  // below — the "count" the user asked to collect is simply that list's own
  // length, so it can never drift out of sync with the detail entries the
  // way a separately-typed number could. Storage Allocation is removed
  // entirely per request (no field, no state, no UI).
  // Same architecture gap as Dependents above: neither the approach doc's
  // data model nor the real backend has a field for per-applicant
  // pet/vehicle records yet, so this is stored household-level on
  // `application.propertyRequirements`, local/localStorage-only — flagged
  // here and in the Claude Project review doc as a real gap to close once a
  // backend intake slice exists, not silently absorbed into an existing
  // field. See Stage3_PropertyDocuments.jsx for where the listing's real
  // per-unit pet-rent/parking-fee data is still multiplied against these
  // list lengths for an at-a-glance monthly total.
  const setPropertyRequirements = useCallback((patch) => {
    setApplication((prev) => {
      const next = { ...prev, propertyRequirements: { ...(prev?.propertyRequirements || {}), ...patch } };
      persistLocal(next, applicant);
      return next;
    });
  }, [applicant, persistLocal]);

  const addPet = useCallback((petData) => {
    setApplication((prev) => {
      const localPet = { id: `local-pet-${Date.now()}`, ...petData };
      const propertyRequirements = { ...(prev?.propertyRequirements || {}), pets: [...((prev?.propertyRequirements?.pets) || []), localPet] };
      const next = { ...prev, propertyRequirements };
      persistLocal(next, applicant);
      return next;
    });
  }, [applicant, persistLocal]);

  const removePet = useCallback((petId) => {
    setApplication((prev) => {
      const propertyRequirements = { ...(prev?.propertyRequirements || {}), pets: ((prev?.propertyRequirements?.pets) || []).filter((p) => p.id !== petId) };
      const next = { ...prev, propertyRequirements };
      persistLocal(next, applicant);
      return next;
    });
  }, [applicant, persistLocal]);

  const addVehicle = useCallback((vehicleData) => {
    setApplication((prev) => {
      const localVehicle = { id: `local-vehicle-${Date.now()}`, ...vehicleData };
      const propertyRequirements = { ...(prev?.propertyRequirements || {}), vehicles: [...((prev?.propertyRequirements?.vehicles) || []), localVehicle] };
      const next = { ...prev, propertyRequirements };
      persistLocal(next, applicant);
      return next;
    });
  }, [applicant, persistLocal]);

  const removeVehicle = useCallback((vehicleId) => {
    setApplication((prev) => {
      const propertyRequirements = { ...(prev?.propertyRequirements || {}), vehicles: ((prev?.propertyRequirements?.vehicles) || []).filter((v) => v.id !== vehicleId) };
      const next = { ...prev, propertyRequirements };
      persistLocal(next, applicant);
      return next;
    });
  }, [applicant, persistLocal]);

  const addDocument = useCallback(async (documentType, file, label) => {
    const localDoc = {
      id: `local-${Date.now()}`, documentType, fileName: file.name, label: label || '',
      uploadedAt: new Date().toISOString(), verificationStatus: 'PENDING_REVIEW',
    };
    setApplicant((prev) => {
      const next = { ...prev, documents: [...prev.documents, localDoc] };
      persistLocal(application, next);
      return next;
    });
    if (backendConnected && application?.id && applicant.id) {
      try {
        const saved = await api.apiUploadDocument(application.id, applicant.id, documentType, file, label);
        setApplicant((prev) => ({
          ...prev,
          documents: prev.documents.map((d) => (d.id === localDoc.id ? { ...saved, fileName: file.name, label: label || '' } : d)),
        }));
      } catch (e) {
        console.warn('[ApplicationIntake] remote document upload failed, kept locally', e);
      }
    }
  }, [application, applicant.id, backendConnected, persistLocal]);

  const removeDocument = useCallback((documentId) => {
    setApplicant((prev) => {
      const next = { ...prev, documents: prev.documents.filter((d) => d.id !== documentId) };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id && !String(documentId).startsWith('local-')) {
        api.apiDeleteDocument(application.id, next.id, documentId).catch((e) =>
          console.warn('[ApplicationIntake] remote document delete failed', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  const setConsent = useCallback((consentType, granted) => {
    setApplicant((prev) => {
      const next = { ...prev, consents: { ...prev.consents, [consentType]: granted ? 'GRANTED' : 'DECLINED' } };
      persistLocal(application, next);
      if (backendConnected && application?.id && next.id) {
        api.apiRecordConsent(application.id, next.id, consentType, granted).catch((e) =>
          console.warn('[ApplicationIntake] remote consent save failed, kept locally', e));
      }
      return next;
    });
  }, [application, backendConnected, persistLocal]);

  const addCoApplicant = useCallback(async (coApplicantData) => {
    const localCoApplicant = {
      id: `local-co-${Date.now()}`,
      ...coApplicantData,
      role: 'CO_APPLICANT',
      invitationStatus: 'ADDED',
    };
    setApplication((prev) => {
      const next = { ...prev, coApplicants: [...(prev?.coApplicants || []), localCoApplicant] };
      persistLocal(next, applicant);
      return next;
    });
    if (backendConnected && application?.id) {
      try {
        const saved = await api.apiAddCoApplicant(application.id, coApplicantData);
        setApplication((prev) => ({
          ...prev,
          coApplicants: prev.coApplicants.map((c) => (c.id === localCoApplicant.id ? saved : c)),
        }));
      } catch (e) {
        console.warn('[ApplicationIntake] remote add co-applicant failed, kept locally', e);
      }
    }
  }, [application, applicant, backendConnected, persistLocal]);

  const removeCoApplicant = useCallback((coApplicantId) => {
    setApplication((prev) => {
      const next = { ...prev, coApplicants: (prev.coApplicants || []).filter((c) => c.id !== coApplicantId) };
      persistLocal(next, applicant);
      if (backendConnected && !String(coApplicantId).startsWith('local-')) {
        api.apiRemoveCoApplicant(application.id, coApplicantId).catch((e) =>
          console.warn('[ApplicationIntake] remote remove co-applicant failed', e));
      }
      return next;
    });
  }, [application, applicant, backendConnected, persistLocal]);

  const resendInvitation = useCallback((coApplicantId) => {
    if (backendConnected && application?.id) {
      return api.apiResendInvitation(application.id, coApplicantId);
    }
    return Promise.resolve();
  }, [application, backendConnected]);

  const submitApplicantSection = useCallback(async () => {
    const requiredConsents = ['ACCURACY_ATTESTATION', 'BACKGROUND_SCREENING_AUTH', 'PRIVACY_CONSENT'];
    const missing = requiredConsents.filter((c) => applicant.consents[c] !== 'GRANTED');
    if (missing.length > 0) {
      throw new Error('Please provide all required consents before submitting.');
    }
    const submittedAt = new Date().toISOString();
    if (backendConnected && application?.id && applicant.id) {
      const result = await api.apiSubmitApplicantSection(application.id, applicant.id);
      setApplicant((prev) => ({ ...prev, status: 'SUBMITTED', submittedAt }));
      setApplication((prev) => ({ ...prev, status: result?.household_status || 'AWAITING_CO_APPLICANT' }));
      return result;
    }
    // Local-only fallback: mark submitted, derive a plausible household
    // status exactly the way the backend would (approach doc §5/§6), so the
    // confirmation screen reads correctly even with no backend yet.
    const hasPendingCoApplicants = (application?.coApplicants || []).some(
      (c) => c.invitationStatus !== 'WITHDRAWN' && c.applicantStatus !== 'SUBMITTED'
    );
    const nextStatus = hasPendingCoApplicants ? 'AWAITING_CO_APPLICANT' : 'READY_FOR_SCREENING';
    const nextApplicant = { ...applicant, status: 'SUBMITTED', submittedAt };
    const nextApplication = { ...application, status: nextStatus };
    setApplicant(nextApplicant);
    setApplication(nextApplication);
    persistLocal(nextApplication, nextApplicant);
    return { household_status: nextStatus };
  }, [application, applicant, backendConnected, persistLocal]);

  const value = {
    kind, listingId, listingSummary, basePath: basePath || `/marketplace/${kind}/${listingId}/apply`,
    application, applicant, loading, error, backendConnected, lastSavedAt,
    updateApplicantFields, setEmployment,
    addRentalHistoryEntry, removeRentalHistoryEntry, setCurrentResidence,
    addAdditionalIncomeEntry, removeAdditionalIncomeEntry,
    addDocument, removeDocument,
    setConsent,
    addCoApplicant, removeCoApplicant, resendInvitation,
    addDependent, removeDependent,
    setPropertyRequirements, addPet, removePet, addVehicle, removeVehicle,
    submitApplicantSection,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApplicationIntake() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApplicationIntake must be used inside ApplicationIntakeProvider');
  return ctx;
}
