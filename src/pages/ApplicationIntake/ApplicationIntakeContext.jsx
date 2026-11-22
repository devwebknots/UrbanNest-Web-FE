// src/pages/ApplicationIntake/ApplicationIntakeContext.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Holds the in-flight Household Application draft across all four stages.
//
// Session 55 — now backed by the real Django `application_intake` app
// (RentalApplication / ApplicationApplicant / ApplicationDependent /
// ApplicantDetails — see applicationIntakeApi.js's header). Every mutator
// updates local state + localStorage first, then calls the API; when the
// backend is unreachable it stays in local-draft mode with a console
// warning (never a silent swallow). `backendConnected` drives the honest
// "Saved to this device" vs "Saved" indicator.
//
// Session 55 fix — API calls used to be made *inside* setState updater
// functions. React 19 StrictMode (src/index.js) runs updaters twice in
// development, which against a real backend double-POSTs rental history,
// pets, co-applicants, etc. Mutators now compute the next state from refs,
// set it, and call the API exactly once. The bootstrap effect's
// `cancelled` flag was also dropped for the same reason: under StrictMode
// the first run's response was discarded and the second run never fetched.
//
// Server-assigned ids replace the temporary `local-*` ids as soon as a
// create call returns, so later edits/deletes reach the backend.
//
// INVITATION MODE (invitationToken set — a co-applicant) is strict: it never
// falls back to local drafts. If accepting the invitation fails the flow
// stops with `fatalError` (CoApplicantInvitePage shows why and what to do),
// and any later save that fails sets `saveError` so the renter knows the
// server didn't get it. Submission is only reported once the server confirms.
//
// Draft persistence key: `un_application_draft:${kind}:${listingId}` (plus
// `:unit-${unitListingId}` for a Multi-Unit listing), or
// `un_application_draft:id:${applicationId}` once a real id exists.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as api from './applicationIntakeApi';

const Ctx = createContext(null);

function draftKey({ kind, listingId, unitListingId, applicationId }) {
  if (applicationId) return `un_application_draft:id:${applicationId}`;
  return `un_application_draft:${kind}:${listingId}${unitListingId ? `:unit-${unitListingId}` : ''}`;
}

const isLocalId = (id) => id == null || String(id).startsWith('local-');

// Ids for a remote call, or null when we're in local-draft mode / the
// record hasn't been created server-side yet. Reads refs only, so it's safe
// to call from any memoised mutator.
function remoteIdsFrom(connectedRef, applicationRef, applicantRef) {
  const app = applicationRef.current;
  const me = applicantRef.current;
  if (!connectedRef.current || !app?.id || isLocalId(me?.id)) return null;
  return { appId: app.id, applicantId: me.id };
}

const warn = (what) => (e) => console.warn(`[ApplicationIntake] remote ${what} failed, kept locally`, e);

function emptyApplicant(role, seed = {}) {
  return {
    id: null,
    role, // 'PRIMARY' | 'CO_APPLICANT'
    status: 'DRAFT', // DRAFT | IN_PROGRESS | SUBMITTED | WITHDRAWN (Session 55 vocabulary)
    legalFirstName: '', legalMiddleName: '', legalLastName: '',
    dateOfBirth: '', email: '', phone: '',
    addressStreet1: '', addressStreet2: '', addressCity: '', addressState: '', addressZip: '',
    // Edited on Stage 1 alongside the applicant fields; stored on the
    // household application server-side (primary applicant only).
    desiredMoveInDate: '',
    hasNoRentalHistory: false,
    rentalHistory: [],
    employment: {
      status: '', employerName: '', jobTitle: '',
      // Duration is always derived from these two dates (never stored).
      employmentStartDate: '', employmentEndDate: '',
      employerContact: '', incomeAmount: '', incomeFrequency: 'MONTHLY',
      additionalIncome: [], // { id, source, amount, frequency }
    },
    documents: [], // { id, documentType, fileName, uploadedAt, label }
    consents: {}, // { [consentType]: 'GRANTED' | 'DECLINED' }
    submittedAt: null,
    ...seed,
  };
}

// Backend returns null for empty dates/amounts; form inputs want ''.
function blankNulls(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => { out[k] = v === null ? '' : v; });
  return out;
}

function applicantFromServer(serverApplicant, household, prev) {
  if (!serverApplicant) return prev;
  const base = blankNulls(serverApplicant);
  return {
    ...emptyApplicant(serverApplicant.role),
    ...base,
    submittedAt: serverApplicant.submittedAt,
    employment: { ...emptyApplicant().employment, ...blankNulls(serverApplicant.employment) },
    desiredMoveInDate: household?.desiredMoveInDate || prev?.desiredMoveInDate || '',
    // Keep any DECLINED choices the user made this session (the backend only
    // records acceptances).
    consents: { ...(prev?.consents || {}), ...(serverApplicant.consents || {}) },
  };
}

function applicationFromServer(household, prev, listingSummary) {
  if (!household) return prev;
  const prevReq = prev?.propertyRequirements || {};
  const req = household.propertyRequirements || {};
  return {
    ...household,
    // The page's adapter summary (fees, agent, pet/parking facts) is richer
    // than the backend's display summary — prefer it when present.
    listingSummary: listingSummary || prev?.listingSummary || household.listingSummary,
    propertyRequirements: {
      ...req,
      // hasPets/hasVehicles are derived server-side from whether any entries
      // exist; keep a "yes" the user ticked before adding the first entry.
      hasPets: !!(req.hasPets || prevReq.hasPets),
      hasVehicles: !!(req.hasVehicles || prevReq.hasVehicles),
    },
  };
}

export function ApplicationIntakeProvider({ kind, listingId, unitListingId, listingSummary, invitationToken, basePath, children }) {
  const { user } = useAuth();
  const [application, setApplicationState] = useState(null);
  const [applicant, setApplicantState] = useState(() => emptyApplicant(invitationToken ? 'CO_APPLICANT' : 'PRIMARY'));
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error] = useState(null);
  const strict = !!invitationToken;
  // Invitation mode only: why the server refused to let this person in
  // ({message, code, status}), and whether a later save didn't reach it.
  const [fatalError, setFatalError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const bootstrapped = useRef(false);
  const applicationRef = useRef(application);
  const applicantRef = useRef(applicant);
  const connectedRef = useRef(false);

  const persistLocal = useCallback((appState, applicantState) => {
    try {
      localStorage.setItem(
        draftKey({ kind, listingId, unitListingId, applicationId: appState?.id }),
        JSON.stringify({ application: appState, applicant: applicantState, savedAt: Date.now() })
      );
      setLastSavedAt(Date.now());
    } catch (e) {
      console.warn('[ApplicationIntake] could not persist local draft', e);
    }
  }, [kind, listingId, unitListingId]);

  // Single write path for both pieces of state: refs first (so the next
  // mutator in the same tick sees the change), then React state, then
  // localStorage.
  const commit = useCallback((nextApplication, nextApplicant) => {
    if (nextApplication !== undefined) { applicationRef.current = nextApplication; setApplicationState(nextApplication); }
    if (nextApplicant !== undefined) { applicantRef.current = nextApplicant; setApplicantState(nextApplicant); }
    persistLocal(applicationRef.current, applicantRef.current);
  }, [persistLocal]);


  // Remote-failure reporter: always logs; in invitation mode also tells the
  // renter (no silent local fallback). Held in a ref so memoised mutators
  // can call it without extra hook dependencies.
  const failRef = useRef(null);
  failRef.current = (what) => (e) => {
    warn(what)(e);
    if (strict) {
      setSaveError(
        e?.status
          ? (e.message || `Your ${what} could not be saved.`)
          : `Your ${what} didn't reach the server — check your connection and try again.`,
      );
    }
  };

  const [bootNonce, setBootNonce] = useState(0);

  // ── Bootstrap ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      let seededApp = null;
      let seededApplicant = applicantRef.current;
      try {
        // Invitation mode never seeds from (or trusts) a local draft.
        const raw = strict ? null : localStorage.getItem(draftKey({ kind, listingId, unitListingId }));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.application) seededApp = parsed.application;
          if (parsed.applicant) seededApplicant = { ...emptyApplicant(parsed.applicant.role), ...parsed.applicant };
        }
      } catch { /* ignore corrupt draft */ }

      if (user && !invitationToken) {
        seededApplicant = {
          ...seededApplicant,
          legalFirstName: seededApplicant.legalFirstName || user.first_name || '',
          legalLastName: seededApplicant.legalLastName || user.last_name || '',
          email: seededApplicant.email || user.email || '',
          phone: seededApplicant.phone || user.phone || '',
        };
      }
      applicationRef.current = seededApp;
      applicantRef.current = seededApplicant;
      setApplicationState(seededApp);
      setApplicantState(seededApplicant);

      try {
        const result = invitationToken
          ? await api.apiAcceptInvitation(invitationToken)
          : await api.apiStartApplication(kind, listingId, unitListingId);
        const household = result.household_application;
        const serverApplicant = result.applicant || result.primary_applicant;
        connectedRef.current = true;
        setBackendConnected(true);
        commit(
          applicationFromServer(household, applicationRef.current, listingSummary),
          applicantFromServer(serverApplicant, household, applicantRef.current),
        );
      } catch (e) {
        connectedRef.current = false;
        setBackendConnected(false);
        if (strict) {
          console.warn('[ApplicationIntake] invitation could not be accepted', e);
          setFatalError({
            status: e?.status || null,
            code: e?.body?.code || (e?.status ? 'refused' : 'network'),
            message: e?.status
              ? (e.message || 'This invitation could not be accepted.')
              : 'We could not reach UrbanNest to join this application. Check your connection and try again.',
          });
          return;
        }
        console.warn('[ApplicationIntake] backend not available — continuing in local-draft mode', e);
        if (!applicationRef.current) {
          commit({ id: null, status: 'DRAFT', listingKind: kind, listingId, unitListingId, listingSummary }, undefined);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, listingId, unitListingId, invitationToken, bootNonce]);

  // Invitation mode: retry joining after a network failure (re-runs the
  // accept call — the backend treats a repeat accept as a no-op).
  const retryJoin = useCallback(() => {
    setFatalError(null);
    setLoading(true);
    bootstrapped.current = false;
    setBootNonce((n) => n + 1);
  }, []);

  // ── Autosave queue ─────────────────────────────────────────────────────
  // Each form edit autosaves. Edits are merged and sent one request at a
  // time per endpoint, so an older keystroke can never land after a newer
  // one and overwrite it on the server. flushSaves() waits for everything
  // queued so far (used before submitting).
  const saveQueues = useRef({});
  const queueSave = useCallback((key, patchObj, send, what) => {
    if (!remoteIdsFrom(connectedRef, applicationRef, applicantRef)) return;
    const q = saveQueues.current[key] || (saveQueues.current[key] = { pending: null, running: null });
    q.pending = { ...(q.pending || {}), ...patchObj };
    if (q.running) return;
    q.running = (async () => {
      while (q.pending) {
        const body = q.pending;
        q.pending = null;
        const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
        if (!ids) break;
        try { await send(ids, body); } catch (e) { failRef.current(what)(e); }
      }
      q.running = null;
    })();
  }, []);
  const flushSaves = useCallback(
    () => Promise.all(Object.values(saveQueues.current).map((q) => q.running).filter(Boolean)),
    [],
  );

  // ── Applicant fields ───────────────────────────────────────────────────
  const updateApplicantFields = useCallback((patchObj) => {
    const prev = applicantRef.current;
    const next = { ...prev, ...patchObj, status: prev.status === 'DRAFT' ? 'IN_PROGRESS' : prev.status };
    commit(undefined, next);
    queueSave('fields', patchObj, (ids, body) => api.apiUpdateApplicant(ids.appId, ids.applicantId, body), 'save');
  }, [commit, queueSave]);

  const setEmployment = useCallback((employmentPatch) => {
    const prev = applicantRef.current;
    const next = { ...prev, employment: { ...prev.employment, ...employmentPatch }, status: prev.status === 'DRAFT' ? 'IN_PROGRESS' : prev.status };
    commit(undefined, next);
    queueSave('employment', next.employment, (ids, body) => api.apiSetEmployment(ids.appId, ids.applicantId, body), 'employment save');
  }, [commit, queueSave]);

  // ── Rental history (isCurrent kept exclusive, also enforced server-side) ─
  const addRentalHistoryEntry = useCallback(async (entry) => {
    const prev = applicantRef.current;
    const localEntry = { id: `local-${Date.now()}`, ...entry };
    const existing = entry.isCurrent ? prev.rentalHistory.map((e) => ({ ...e, isCurrent: false })) : prev.rentalHistory;
    commit(undefined, { ...prev, hasNoRentalHistory: false, rentalHistory: [...existing, localEntry] });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (!ids) return;
    try {
      const saved = await api.apiAddRentalHistory(ids.appId, ids.applicantId, entry);
      const cur = applicantRef.current;
      commit(undefined, { ...cur, rentalHistory: cur.rentalHistory.map((e) => (e.id === localEntry.id ? { ...e, ...saved } : e)) });
    } catch (e) { failRef.current('rental history save')(e); }
  }, [commit]);

  const removeRentalHistoryEntry = useCallback((entryId) => {
    const prev = applicantRef.current;
    commit(undefined, { ...prev, rentalHistory: prev.rentalHistory.filter((e) => e.id !== entryId) });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (ids && !isLocalId(entryId)) api.apiDeleteRentalHistory(ids.appId, ids.applicantId, entryId).catch(failRef.current('rental history delete'));
  }, [commit]);

  const setCurrentResidence = useCallback((entryId) => {
    const prev = applicantRef.current;
    commit(undefined, {
      ...prev,
      rentalHistory: prev.rentalHistory.map((e) => ({ ...e, isCurrent: e.id === entryId, endDate: e.id === entryId ? '' : e.endDate })),
    });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (ids && !isLocalId(entryId)) {
      // A current residence can't carry an end date (backend rule).
      api.apiUpdateRentalHistory(ids.appId, ids.applicantId, entryId, { isCurrent: true, endDate: '' }).catch(failRef.current('rental history update'));
    }
  }, [commit]);

  // ── Additional income (rides along inside the employment PATCH) ─────────
  const addAdditionalIncomeEntry = useCallback((entry) => {
    const prev = applicantRef.current;
    const nextEmployment = { ...prev.employment, additionalIncome: [...(prev.employment.additionalIncome || []), { id: `local-inc-${Date.now()}`, ...entry }] };
    commit(undefined, { ...prev, employment: nextEmployment, status: prev.status === 'DRAFT' ? 'IN_PROGRESS' : prev.status });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (ids) api.apiSetEmployment(ids.appId, ids.applicantId, nextEmployment).catch(failRef.current('employment save'));
  }, [commit]);

  const removeAdditionalIncomeEntry = useCallback((entryId) => {
    const prev = applicantRef.current;
    const nextEmployment = { ...prev.employment, additionalIncome: (prev.employment.additionalIncome || []).filter((e) => e.id !== entryId) };
    commit(undefined, { ...prev, employment: nextEmployment });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (ids) api.apiSetEmployment(ids.appId, ids.applicantId, nextEmployment).catch(failRef.current('employment save'));
  }, [commit]);

  // ── Dependents (household-level; ApplicationDependent) ──────────────────
  const addDependent = useCallback(async (dependentData) => {
    const prev = applicationRef.current;
    const localDependent = { id: `local-dep-${Date.now()}`, ...dependentData };
    commit({ ...prev, dependents: [...(prev?.dependents || []), localDependent] }, undefined);
    if (!connectedRef.current || !prev?.id) return;
    try {
      const saved = await api.apiAddDependent(prev.id, dependentData);
      const cur = applicationRef.current;
      commit({ ...cur, dependents: (cur.dependents || []).map((d) => (d.id === localDependent.id ? saved : d)) }, undefined);
    } catch (e) { failRef.current('dependent save')(e); }
  }, [commit]);

  const removeDependent = useCallback((dependentId) => {
    const prev = applicationRef.current;
    commit({ ...prev, dependents: (prev?.dependents || []).filter((d) => d.id !== dependentId) }, undefined);
    if (connectedRef.current && prev?.id && !isLocalId(dependentId)) {
      api.apiRemoveDependent(prev.id, dependentId).catch(failRef.current('dependent delete'));
    }
  }, [commit]);

  // ── Property Requirements — pets & vehicles ─────────────────────────────
  // Stored on the PRIMARY applicant server-side (ApplicantDetails PET /
  // VEHICLE); kept in the household-level `propertyRequirements` shape
  // Stage 3/4 already read. hasPets/hasVehicles are the yes/no toggles.
  const setPropertyRequirements = useCallback((patch) => {
    const prev = applicationRef.current;
    commit({ ...prev, propertyRequirements: { ...(prev?.propertyRequirements || {}), ...patch } }, undefined);
  }, [commit]);

  const makeRequirementMutators = (listKey, localPrefix, addCall, removeCall) => {
    const add = async (data) => {
      const prev = applicationRef.current;
      const localItem = { id: `${localPrefix}-${Date.now()}`, ...data };
      const req = prev?.propertyRequirements || {};
      commit({ ...prev, propertyRequirements: { ...req, [listKey]: [...(req[listKey] || []), localItem] } }, undefined);
      const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
      if (!ids || applicantRef.current.role !== 'PRIMARY') return;
      try {
        const saved = await addCall(ids.appId, ids.applicantId, data);
        const cur = applicationRef.current;
        const curReq = cur.propertyRequirements || {};
        commit({ ...cur, propertyRequirements: { ...curReq, [listKey]: (curReq[listKey] || []).map((x) => (x.id === localItem.id ? saved : x)) } }, undefined);
      } catch (e) { failRef.current(`${listKey} save`)(e); }
    };
    const remove = (itemId) => {
      const prev = applicationRef.current;
      const req = prev?.propertyRequirements || {};
      commit({ ...prev, propertyRequirements: { ...req, [listKey]: (req[listKey] || []).filter((x) => x.id !== itemId) } }, undefined);
      const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
      if (ids && !isLocalId(itemId)) removeCall(ids.appId, ids.applicantId, itemId).catch(failRef.current(`${listKey} delete`));
    };
    return [add, remove];
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [addPet, removePet] = React.useMemo(() => makeRequirementMutators('pets', 'local-pet', api.apiAddPet, api.apiRemovePet), [commit]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [addVehicle, removeVehicle] = React.useMemo(() => makeRequirementMutators('vehicles', 'local-vehicle', api.apiAddVehicle, api.apiRemoveVehicle), [commit]);

  // ── Documents (private storage server-side) ─────────────────────────────
  const addDocument = useCallback(async (documentType, file, label) => {
    const localDoc = {
      id: `local-${Date.now()}`, documentType, fileName: file.name, label: label || '',
      uploadedAt: new Date().toISOString(),
    };
    const prev = applicantRef.current;
    commit(undefined, { ...prev, documents: [...prev.documents, localDoc] });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (!ids) return;
    try {
      const saved = await api.apiUploadDocument(ids.appId, ids.applicantId, documentType, file, label);
      const cur = applicantRef.current;
      commit(undefined, { ...cur, documents: cur.documents.map((d) => (d.id === localDoc.id ? saved : d)) });
    } catch (e) { failRef.current('document upload')(e); }
  }, [commit]);

  const removeDocument = useCallback((documentId) => {
    const prev = applicantRef.current;
    commit(undefined, { ...prev, documents: prev.documents.filter((d) => d.id !== documentId) });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (ids && !isLocalId(documentId)) api.apiDeleteDocument(ids.appId, ids.applicantId, documentId).catch(failRef.current('document delete'));
  }, [commit]);

  // ── Consents ─────────────────────────────────────────────────────────────
  const setConsent = useCallback((consentType, granted) => {
    const prev = applicantRef.current;
    commit(undefined, { ...prev, consents: { ...prev.consents, [consentType]: granted ? 'GRANTED' : 'DECLINED' } });
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (ids) api.apiRecordConsent(ids.appId, ids.applicantId, consentType, granted).catch(failRef.current('consent save'));
  }, [commit]);

  // ── Co-applicants ───────────────────────────────────────────────────────
  const addCoApplicant = useCallback(async (coApplicantData) => {
    const prev = applicationRef.current;
    const localCoApplicant = { id: `local-co-${Date.now()}`, ...coApplicantData, role: 'CO_APPLICANT', invitationStatus: 'NOT_INVITED' };
    commit({ ...prev, coApplicants: [...(prev?.coApplicants || []), localCoApplicant] }, undefined);
    if (!connectedRef.current || !prev?.id) return;
    try {
      const saved = await api.apiAddCoApplicant(prev.id, coApplicantData);
      const cur = applicationRef.current;
      commit({ ...cur, coApplicants: cur.coApplicants.map((c) => (c.id === localCoApplicant.id ? saved : c)) }, undefined);
    } catch (e) {
      failRef.current('add co-applicant')(e);
      // A rejected invite (e.g. duplicate email) must not linger as a fake
      // "added" row — roll it back and let Stage 1 show the message.
      if (e.status && e.status < 500) {
        const cur = applicationRef.current;
        commit({ ...cur, coApplicants: (cur.coApplicants || []).filter((c) => c.id !== localCoApplicant.id) }, undefined);
        throw e;
      }
    }
  }, [commit]);

  const removeCoApplicant = useCallback((coApplicantId) => {
    const prev = applicationRef.current;
    commit({ ...prev, coApplicants: (prev.coApplicants || []).filter((c) => c.id !== coApplicantId) }, undefined);
    if (connectedRef.current && prev?.id && !isLocalId(coApplicantId)) {
      api.apiRemoveCoApplicant(prev.id, coApplicantId).catch(failRef.current('remove co-applicant'));
    }
  }, [commit]);

  const resendInvitation = useCallback(async (coApplicantId) => {
    const app = applicationRef.current;
    if (!connectedRef.current || !app?.id || isLocalId(coApplicantId)) return undefined;
    const saved = await api.apiResendInvitation(app.id, coApplicantId);
    const cur = applicationRef.current;
    commit({ ...cur, coApplicants: cur.coApplicants.map((c) => (c.id === coApplicantId ? saved : c)) }, undefined);
    return saved;
  }, [commit]);

  // ── Submission ───────────────────────────────────────────────────────────
  // Session 55 — takes the Stage 4 typed legal name (verified server-side).
  // A PRIMARY submission moves the household to SUBMITTED regardless of
  // co-applicants; a co-applicant's only changes their own status.
  const submitApplicantSection = useCallback(async (typedLegalName) => {
    const me = applicantRef.current;
    const requiredConsents = ['ACCURACY_ATTESTATION', 'BACKGROUND_SCREENING_AUTH', 'PRIVACY_CONSENT'];
    const missing = requiredConsents.filter((c) => me.consents[c] !== 'GRANTED');
    if (missing.length > 0) {
      throw new Error('Please provide all required consents before submitting.');
    }
    const ids = remoteIdsFrom(connectedRef, applicationRef, applicantRef);
    if (ids) {
      await flushSaves();
      const result = await api.apiSubmitApplicantSection(ids.appId, ids.applicantId, typedLegalName);
      commit(
        applicationFromServer(result.household_application, applicationRef.current, applicationRef.current?.listingSummary),
        applicantFromServer(result.applicant, result.household_application, applicantRef.current),
      );
      return result;
    }
    if (strict) {
      // Invitation mode never "submits" locally.
      throw new Error('Your application is not connected to UrbanNest, so it cannot be submitted. Reload the invitation link and try again.');
    }
    // Local-only fallback — mirrors the backend's rules.
    const submittedAt = new Date().toISOString();
    const nextApplicant = { ...me, status: 'SUBMITTED', submittedAt, typedLegalName };
    const app = applicationRef.current;
    const nextApplication = me.role === 'PRIMARY' ? { ...app, status: 'SUBMITTED', submittedAt } : app;
    commit(nextApplication, nextApplicant);
    return { household_status: nextApplication?.status, applicant_status: 'SUBMITTED' };
  }, [commit, strict, flushSaves]);

  const value = {
    kind, listingId, unitListingId, listingSummary, basePath: basePath || `/marketplace/${kind}/${listingId}/apply`,
    application, applicant, loading, error, backendConnected, lastSavedAt,
    invitationMode: strict, fatalError, retryJoin, saveError, clearSaveError: () => setSaveError(null),
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
