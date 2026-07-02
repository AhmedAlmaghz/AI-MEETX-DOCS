import type { HttpClient } from '@aimeetx/network';
import type { Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { AuthCredentials, RegisterInput, Session } from '../domain/model/auth.js';
import type { AuthRepository } from '../domain/port/auth-repository.js';

/**
 * HTTP-based implementation of AuthRepository.
 *
 * Per ADR-004 (Clean Architecture): this is an Adapter in the data layer.
 * It calls the backend REST API for authentication operations.
 *
 * Per `06_TECH_STACK.md` §7: all auth tokens are transmitted over HTTPS only.
 */
export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly baseUrl: string,
  ) {}

  async loginWithEmail(credentials: AuthCredentials): Promise<Result<Session, Error>> {
    const result = await this.httpClient.post<SessionDto>(
      `${this.baseUrl}/auth/login`,
      credentials,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toSession(result.value));
  }

  async register(input: RegisterInput): Promise<Result<Session, Error>> {
    const result = await this.httpClient.post<SessionDto>(
      `${this.baseUrl}/auth/register`,
      input,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toSession(result.value));
  }

  async loginAsGuest(): Promise<Result<Session, Error>> {
    const result = await this.httpClient.post<SessionDto>(`${this.baseUrl}/auth/guest`);

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toSession(result.value));
  }

  async logout(sessionId: string): Promise<Result<void, Error>> {
    const result = await this.httpClient.post<void>(`${this.baseUrl}/auth/logout`, {
      sessionId,
    });

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(undefined);
  }

  async refreshSession(refreshToken: string): Promise<Result<Session, Error>> {
    const result = await this.httpClient.post<SessionDto>(`${this.baseUrl}/auth/refresh`, {
      refreshToken,
    });

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toSession(result.value));
  }

  async getCurrentSession(): Promise<Result<Session | null, Error>> {
    const result = await this.httpClient.get<SessionDto | null>(`${this.baseUrl}/auth/session`);

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    if (!result.value) {
      return success(null);
    }

    return success(this.toSession(result.value));
  }

  private toSession(dto: SessionDto): Session {
    return {
      id: dto.id,
      userId: dto.userId as import('@aimeetx/types').UserId,
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
      expiresAt: dto.expiresAt as import('@aimeetx/types').IsoDateString,
      status: dto.status,
      createdAt: dto.createdAt as import('@aimeetx/types').IsoDateString,
    };
  }
}

/**
 * Session DTO as returned by the backend API.
 */
interface SessionDto {
  readonly id: string;
  readonly userId: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
  readonly status: 'active' | 'expired' | 'revoked' | 'guest';
  readonly createdAt: string;
}