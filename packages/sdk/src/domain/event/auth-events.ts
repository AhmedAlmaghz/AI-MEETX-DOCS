import type { DomainEvent, IsoDateString, Uuid } from '@aimeetx/types';

/**
 * UserLoggedInEvent — published when a user successfully authenticates.
 *
 * Per `09_EVENT_SYSTEM.md` §4: All auth state changes MUST be published as events.
 */
export interface UserLoggedInEvent extends DomainEvent {
  readonly eventType: 'UserLoggedIn';
  readonly payload: {
    readonly userId: Uuid;
    readonly sessionId: string;
    readonly isGuest: boolean;
    readonly loginAt: IsoDateString;
  };
}

/**
 * UserLoggedOutEvent — published when a user logs out.
 */
export interface UserLoggedOutEvent extends DomainEvent {
  readonly eventType: 'UserLoggedOut';
  readonly payload: {
    readonly userId: Uuid;
    readonly sessionId: string;
    readonly logoutAt: IsoDateString;
  };
}

/**
 * SessionExpiredEvent — published when a session expires and needs refresh.
 */
export interface SessionExpiredEvent extends DomainEvent {
  readonly eventType: 'SessionExpired';
  readonly payload: {
    readonly sessionId: string;
    readonly expiredAt: IsoDateString;
  };
}

/**
 * SessionRefreshedEvent — published when a session is successfully refreshed.
 */
export interface SessionRefreshedEvent extends DomainEvent {
  readonly eventType: 'SessionRefreshed';
  readonly payload: {
    readonly sessionId: string;
    readonly userId: Uuid;
    readonly newExpiresAt: IsoDateString;
  };
}

/**
 * Union of all auth-related domain events.
 */
export type AuthEvent =
  | UserLoggedInEvent
  | UserLoggedOutEvent
  | SessionExpiredEvent
  | SessionRefreshedEvent;