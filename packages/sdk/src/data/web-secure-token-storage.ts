import type { Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { Session } from '../domain/model/auth.js';
import type { SecureTokenStorage } from '../domain/port/secure-token-storage.js';

/**
 * Web-based implementation of SecureTokenStorage using the Web Crypto API.
 *
 * Per `06_TECH_STACK.md` §7: sensitive data (tokens, refresh tokens) MUST be stored
 * in encrypted storage. On web, this uses AES-GCM encryption with a key derived
 * from a device-specific salt via PBKDF2.
 *
 * Per ADR-004: this is an Adapter in the data layer.
 *
 * Browser-only. Will fail with an error in Node.js / SSR contexts.
 */
export class WebSecureTokenStorage implements SecureTokenStorage {
  private static readonly STORAGE_KEY = 'aimeetx-secure-session';
  private static readonly SALT_KEY = 'aimeetx-device-salt';
  private static readonly PBKDF2_ITERATIONS = 100_000;

  constructor(private readonly deviceKey: string = 'aimeetx-default-device-key') {}

  async storeSession(session: Session): Promise<Result<void, Error>> {
    try {
      const key = await this.deriveKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintext = new TextEncoder().encode(JSON.stringify(session));

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext,
      );

      const payload = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(ciphertext)),
      };

      localStorage.setItem(WebSecureTokenStorage.STORAGE_KEY, JSON.stringify(payload));
      return success(undefined);
    } catch (cause) {
      return failure(
        cause instanceof Error ? cause : new Error('Failed to store session securely'),
      );
    }
  }

  async getSession(): Promise<Result<Session | null, Error>> {
    try {
      const raw = localStorage.getItem(WebSecureTokenStorage.STORAGE_KEY);
      if (!raw) return success(null);

      const payload = JSON.parse(raw) as { iv: number[]; data: number[] };
      const key = await this.deriveKey();
      const iv = new Uint8Array(payload.iv);
      const ciphertext = new Uint8Array(payload.data);

      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
      );

      const session = JSON.parse(new TextDecoder().decode(plaintext)) as Session;
      return success(session);
    } catch (cause) {
      return failure(
        cause instanceof Error ? cause : new Error('Failed to retrieve session'),
      );
    }
  }

  async clearSession(): Promise<Result<void, Error>> {
    try {
      localStorage.removeItem(WebSecureTokenStorage.STORAGE_KEY);
      return success(undefined);
    } catch (cause) {
      return failure(
        cause instanceof Error ? cause : new Error('Failed to clear session'),
      );
    }
  }

  async hasSession(): Promise<Result<boolean, Error>> {
    try {
      return success(localStorage.getItem(WebSecureTokenStorage.STORAGE_KEY) !== null);
    } catch (cause) {
      return failure(
        cause instanceof Error ? cause : new Error('Failed to check session'),
      );
    }
  }

  /**
   * Derive an AES-GCM key from the device key using PBKDF2.
   */
  private async deriveKey(): Promise<CryptoKey> {
    const salt = await this.getOrCreateSalt();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.deviceKey) as BufferSource,
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: WebSecureTokenStorage.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Get or create a device-specific salt.
   */
  private async getOrCreateSalt(): Promise<Uint8Array> {
    const existing = localStorage.getItem(WebSecureTokenStorage.SALT_KEY);
    if (existing) {
      return new Uint8Array(JSON.parse(existing) as number[]);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(WebSecureTokenStorage.SALT_KEY, JSON.stringify(Array.from(salt)));
    return salt;
  }
}