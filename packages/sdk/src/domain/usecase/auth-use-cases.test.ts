import 'reflect-metadata';

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';

import type { IsoDateString, UserId } from '@aimeetx/types';

import type { Session } from '../model/auth.js';
import type { AuthRepository } from '../port/auth-repository.js';
import type { SecureTokenStorage } from '../port/secure-token-storage.js';
import { InMemoryEventBus } from '@aimeetx/events';
import {
  LoginAsGuestUseCase,
  LoginWithEmailUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
  RegisterWithEmailUseCase,
} from './auth-use-cases.js';
import { TOKENS } from '../../di/tokens.js';

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'sess_123',
  userId: 'user_123' as UserId,
  accessToken: 'access_token_abc',
  refreshToken: 'refresh_token_xyz',
  expiresAt: '2026-12-31T23:59:59.000Z' as IsoDateString,
  status: 'active',
  createdAt: '2026-02-07T00:00:00.000Z' as IsoDateString,
  ...overrides,
});

describe('Auth Use Cases', () => {
  let mockAuthRepo: AuthRepository;
  let mockTokenStorage: SecureTokenStorage;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    container.reset();
    eventBus = new InMemoryEventBus();
    container.registerInstance(TOKENS.EventBus, eventBus);

    mockAuthRepo = {
      loginWithEmail: vi.fn(),
      register: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      getCurrentSession: vi.fn(),
    };

    mockTokenStorage = {
      storeSession: vi.fn().mockResolvedValue({ isSuccess: true, isFailure: false, value: undefined }),
      getSession: vi.fn().mockResolvedValue({ isSuccess: true, isFailure: false, value: null }),
      clearSession: vi.fn().mockResolvedValue({ isSuccess: true, isFailure: false, value: undefined }),
      hasSession: vi.fn().mockResolvedValue({ isSuccess: true, isFailure: false, value: false }),
    };

    container.registerInstance(TOKENS.AuthRepository, mockAuthRepo);
    container.registerInstance(TOKENS.SecureTokenStorage, mockTokenStorage);
  });

  describe('LoginWithEmailUseCase', () => {
    it('returns failure when email is empty', async () => {
      container.register(TOKENS.LoginWithEmailUseCase, { useClass: LoginWithEmailUseCase });
      const useCase = container.resolve<LoginWithEmailUseCase>(TOKENS.LoginWithEmailUseCase);

      const result = await useCase.execute({ email: '', password: 'password123' });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('required');
      }
    });

    it('returns failure when password is empty', async () => {
      container.register(TOKENS.LoginWithEmailUseCase, { useClass: LoginWithEmailUseCase });
      const useCase = container.resolve<LoginWithEmailUseCase>(TOKENS.LoginWithEmailUseCase);

      const result = await useCase.execute({ email: 'test@example.com', password: '' });

      expect(result.isFailure).toBe(true);
    });

    it('returns failure when auth repository fails', async () => {
      vi.mocked(mockAuthRepo.loginWithEmail).mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: new Error('Invalid credentials'),
      });

      container.register(TOKENS.LoginWithEmailUseCase, { useClass: LoginWithEmailUseCase });
      const useCase = container.resolve<LoginWithEmailUseCase>(TOKENS.LoginWithEmailUseCase);

      const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toBe('Invalid credentials');
      }
    });

    it('returns success and stores session on valid login', async () => {
      const session = makeSession();
      vi.mocked(mockAuthRepo.loginWithEmail).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });

      container.register(TOKENS.LoginWithEmailUseCase, { useClass: LoginWithEmailUseCase });
      const useCase = container.resolve<LoginWithEmailUseCase>(TOKENS.LoginWithEmailUseCase);

      const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.id).toBe('sess_123');
      }
      expect(mockTokenStorage.storeSession).toHaveBeenCalledWith(session);
    });

    it('publishes UserLoggedIn event on success', async () => {
      const session = makeSession();
      vi.mocked(mockAuthRepo.loginWithEmail).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });

      const events: string[] = [];
      eventBus.on('UserLoggedIn').subscribe(() => events.push('UserLoggedIn'));

      container.register(TOKENS.LoginWithEmailUseCase, { useClass: LoginWithEmailUseCase });
      const useCase = container.resolve<LoginWithEmailUseCase>(TOKENS.LoginWithEmailUseCase);

      await useCase.execute({ email: 'test@example.com', password: 'password123' });

      expect(events).toContain('UserLoggedIn');
    });
  });

  describe('RegisterWithEmailUseCase', () => {
    it('returns failure when password is too short', async () => {
      container.register(TOKENS.RegisterWithEmailUseCase, { useClass: RegisterWithEmailUseCase });
      const useCase = container.resolve<RegisterWithEmailUseCase>(TOKENS.RegisterWithEmailUseCase);

      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'short',
        displayName: 'Test User',
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('8 characters');
      }
    });

    it('returns success on valid registration', async () => {
      const session = makeSession();
      vi.mocked(mockAuthRepo.register).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });

      container.register(TOKENS.RegisterWithEmailUseCase, { useClass: RegisterWithEmailUseCase });
      const useCase = container.resolve<RegisterWithEmailUseCase>(TOKENS.RegisterWithEmailUseCase);

      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockTokenStorage.storeSession).toHaveBeenCalledWith(session);
    });
  });

  describe('LoginAsGuestUseCase', () => {
    it('returns success and creates guest session', async () => {
      const session = makeSession({ status: 'guest' });
      vi.mocked(mockAuthRepo.loginAsGuest).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });

      container.register(TOKENS.LoginAsGuestUseCase, { useClass: LoginAsGuestUseCase });
      const useCase = container.resolve<LoginAsGuestUseCase>(TOKENS.LoginAsGuestUseCase);

      const result = await useCase.execute(undefined);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('guest');
      }
    });
  });

  describe('LogoutUseCase', () => {
    it('returns success when no session exists', async () => {
      vi.mocked(mockTokenStorage.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: null,
      });

      container.register(TOKENS.LogoutUseCase, { useClass: LogoutUseCase });
      const useCase = container.resolve<LogoutUseCase>(TOKENS.LogoutUseCase);

      const result = await useCase.execute(undefined);

      expect(result.isSuccess).toBe(true);
      expect(mockAuthRepo.logout).not.toHaveBeenCalled();
    });

    it('clears session and publishes event on logout', async () => {
      const session = makeSession();
      vi.mocked(mockTokenStorage.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });
      vi.mocked(mockAuthRepo.logout).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: undefined,
      });

      const events: string[] = [];
      eventBus.on('UserLoggedOut').subscribe(() => events.push('UserLoggedOut'));

      container.register(TOKENS.LogoutUseCase, { useClass: LogoutUseCase });
      const useCase = container.resolve<LogoutUseCase>(TOKENS.LogoutUseCase);

      const result = await useCase.execute(undefined);

      expect(result.isSuccess).toBe(true);
      expect(mockAuthRepo.logout).toHaveBeenCalledWith(session.id);
      expect(mockTokenStorage.clearSession).toHaveBeenCalled();
      expect(events).toContain('UserLoggedOut');
    });
  });

  describe('RefreshSessionUseCase', () => {
    it('returns failure when no session exists', async () => {
      vi.mocked(mockTokenStorage.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: null,
      });

      container.register(TOKENS.RefreshSessionUseCase, { useClass: RefreshSessionUseCase });
      const useCase = container.resolve<RefreshSessionUseCase>(TOKENS.RefreshSessionUseCase);

      const result = await useCase.execute(undefined);

      expect(result.isFailure).toBe(true);
    });

    it('refreshes session and publishes event on success', async () => {
      const oldSession = makeSession();
      const newSession = makeSession({ id: 'sess_new', accessToken: 'new_token' });

      vi.mocked(mockTokenStorage.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: oldSession,
      });
      vi.mocked(mockAuthRepo.refreshSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: newSession,
      });

      const events: string[] = [];
      eventBus.on('SessionRefreshed').subscribe(() => events.push('SessionRefreshed'));

      container.register(TOKENS.RefreshSessionUseCase, { useClass: RefreshSessionUseCase });
      const useCase = container.resolve<RefreshSessionUseCase>(TOKENS.RefreshSessionUseCase);

      const result = await useCase.execute(undefined);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.id).toBe('sess_new');
      }
      expect(mockAuthRepo.refreshSession).toHaveBeenCalledWith(oldSession.refreshToken);
      expect(mockTokenStorage.storeSession).toHaveBeenCalledWith(newSession);
      expect(events).toContain('SessionRefreshed');
    });
  });
});