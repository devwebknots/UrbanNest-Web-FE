// ─────────────────────────────────────────────────────────────
// UrbanNest — AuthContext
// Provides user + permissions state across the entire app.
//
// On mount:
//   1. Check localStorage for access_token
//   2. If found → call /api/auth/me/ → set user
//   3. If active_persona === PM_STAFF → call /api/pm/rbac/members/me/
//      → store permissions as flat map keyed by module_code
//   4. ORGANIZATIONAL_PM / INDEPENDENT_PM → permissions = null (full access)
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                           = useState(null);
  const [permissions, setPermissions]             = useState(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [authLoading, setAuthLoading]             = useState(true);

  useEffect(() => {
    _bootstrap();
  }, []);

  async function _bootstrap() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setAuthLoading(false);
      setPermissionsLoaded(true);
      return;
    }

    try {
      // ── Step 1: who is logged in? ──────────────────────────
      const meRes = await fetch(`${API_BASE}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meRes.ok) {
        // Token invalid or expired — clear storage and bail
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthLoading(false);
        setPermissionsLoaded(true);
        return;
      }

      const userData = await meRes.json();
      setUser(userData);

      // ── Step 2: load permissions only for PM_STAFF ─────────
      const isPMStaff = 
        userData.active_persona === 'PM_STAFF' ||
        (userData.active_persona === null && 
        userData.active_personas?.includes('PM_STAFF') &&
        !userData.active_personas?.includes('ORGANIZATIONAL_PM') &&
        !userData.active_personas?.includes('INDEPENDENT_PM'));

      if (isPMStaff) {
        try {
          const permRes = await fetch(`${API_BASE}/pm/rbac/members/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (permRes.ok) {
            const permData = await permRes.json();
            // Store as flat map: { DASHBOARD: { can_view, no_access, ... }, ... }
            setPermissions(permData.permissions);
          } else {
            // Could not load permissions — safest to deny all
            setPermissions({});
          }
        } catch {
          setPermissions({});
        }
      } else {
        // ORGANIZATIONAL_PM, INDEPENDENT_PM, UN_ADMIN → full access
        // permissions = null means "no restrictions"
        setPermissions(null);
      }

    } catch {
      // Network error — leave user as null
    } finally {
      setAuthLoading(false);
      setPermissionsLoaded(true);
    }
  }

  // ── Public helpers ────────────────────────────────────────

  // Reload user + permissions (call this after login)
  async function refreshAuth() {
    setAuthLoading(true);
    await _bootstrap();
  }

  // Clear everything (call this on logout)
  function clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setPermissions(null);
    setPermissionsLoaded(false);
  }

  // Does this user have access to a module?
  // null permissions = full access persona = always true
  // module not in permissions map = allow (future-safe)
  // module.no_access = true = blocked
  function hasAccess(moduleCode) {
    if (permissions === null) return true;
    if (!permissions[moduleCode]) return false;
    return !permissions[moduleCode].no_access;
  }

  // Can this user perform a specific action on a module?
  // action: 'view' | 'add' | 'edit' | 'delete'
  function can(moduleCode, action = 'view') {
    if (permissions === null) return true;
    if (!permissions[moduleCode]) return false;
    return permissions[moduleCode][`can_${action}`] === true;
  }

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      permissionsLoaded,
      authLoading,
      refreshAuth,
      clearAuth,
      hasAccess,
      can,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook — use this in any component
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}