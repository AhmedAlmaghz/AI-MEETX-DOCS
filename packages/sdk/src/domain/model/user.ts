import type { IsoDateString, UserId } from '@aimeetx/types';

/**
 * User domain entity.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 *
 * Per `08_DATABASE_OVERVIEW.md` §5: User entity fields.
 */
export interface User {
  readonly id: UserId;
  readonly displayName: string;
  readonly email: string;
  readonly photoUrl: string | null;
  readonly preferredLanguage: string;
  readonly theme: 'light' | 'dark' | 'system';
  readonly role: 'owner' | 'admin' | 'moderator' | 'teacher' | 'presenter' | 'member' | 'guest';
  readonly status: 'active' | 'inactive' | 'suspended';
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}