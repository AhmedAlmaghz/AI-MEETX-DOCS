/**
 * Client-side session store.
 *
 * Persists the currently signed-in user across navigation using
 * localStorage. The store is reactive via a tiny event-based pattern
 * (no external state library) to keep the bundle small.
 *
 * Per ADR-005: the SDK owns the session, but the web app needs a
 * reactive subscription to redirect users between protected and
 * public routes.
 */

import type { Session, UserProfile } from '@aimeetx/sdk';
import type { UserId } from '@aimeetx/types';

const SESSION_KEY = 'aimeetx.currentSession';
const PROFILE_CACHE_KEY = 'aimeetx.currentProfile';

type SessionListener = (session: Session | null) => void;
type ProfileListener = (profile: UserProfile | null) => void;

const sessionListeners = new Set<SessionListener>();
const profileListeners = new Set<ProfileListener>();

function emitSession(): void {
  const session = readSession();
  for (const listener of sessionListeners) listener(session);
}

function emitProfile(): void {
  const profile = readProfile();
  for (const listener of profileListeners) listener(profile);
}

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed.status === 'revoked' ? null : parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null): void {
  if (typeof window === 'undefined') return;
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  }
  emitSession();
}

export function readProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function writeProfile(profile: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (profile) {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } else {
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  }
  emitProfile();
}

export function subscribeSession(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function subscribeProfile(listener: ProfileListener): () => void {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(PROFILE_CACHE_KEY);
  emitSession();
  emitProfile();
}

export function getCurrentUserId(): UserId | null {
  const session = readSession();
  return session?.userId ?? null;
}
