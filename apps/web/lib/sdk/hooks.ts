'use client';

import { useEffect, useState } from 'react';

import type { Session, UserProfile } from '@aimeetx/sdk';

import { sdkContainer, TOKENS } from '@aimeetx/sdk';

import { ensureSdkInitialized, resolveUseCase } from './bootstrap';
import { readProfile, readSession, subscribeProfile, subscribeSession, writeProfile } from './session-store';

/**
 * Returns the current session and a setter. Subscribes to changes so
 * navigation between protected routes re-renders correctly.
 */
export function useSession(): readonly [Session | null, (next: Session | null) => void] {
  const [session, setSession] = useState<Session | null>(() => readSession());

  useEffect(() => {
    ensureSdkInitialized();
    const unsub = subscribeSession(setSession);
    return unsub;
  }, []);

  return [session, setSession] as const;
}

/**
 * Returns the current user profile (loaded from the SDK + cached).
 * Triggers a reload when the session changes.
 */
export function useCurrentProfile(): {
  readonly profile: UserProfile | null;
  readonly loading: boolean;
  readonly reload: () => Promise<void>;
} {
  const [session] = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(() => readProfile());
  const [loading, setLoading] = useState(false);

  const reload = async (): Promise<void> => {
    if (!session) {
      writeProfile(null);
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const useCase = resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GetProfileUseCase>>(TOKENS.GetProfileUseCase);
      const result = await useCase.execute({ userId: session.userId });
      if (result.isSuccess) {
        writeProfile(result.value);
        setProfile(result.value);
      } else {
        writeProfile(null);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      void reload();
    } else {
      writeProfile(null);
      setProfile(null);
    }
    const unsub = subscribeProfile((p) => setProfile(p));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId, session?.accessToken]);

  return { profile, loading, reload };
}

/**
 * Resolves a use case from the SDK container on every render.
 * Convenience wrapper to avoid repeating the boilerplate.
 */
export function useUseCase<T>(token: symbol): T {
  ensureSdkInitialized();
  return sdkContainer.resolve<T>(token);
}
