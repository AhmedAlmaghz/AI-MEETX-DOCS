import type { Result, UserId } from '@aimeetx/types';

import type { User } from '../model/user.js';

/**
 * User repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., HttpUserRepository, FirebaseUserRepository).
 *
 * Per `08_DATABASE_OVERVIEW.md` §3: Repository Pattern — UI SHALL NEVER access storage directly.
 */
export interface UserRepository {
  findById(id: UserId): Promise<Result<User, Error>>;
  findByEmail(email: string): Promise<Result<User, Error>>;
  save(user: User): Promise<Result<void, Error>>;
  delete(id: UserId): Promise<Result<void, Error>>;
}