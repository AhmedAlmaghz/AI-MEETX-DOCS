import 'reflect-metadata';

import { describe, expect, it, beforeEach } from 'vitest';
import { container } from 'tsyringe';

import type { IsoDateString, UserId } from '@aimeetx/types';

import type { User } from '../domain/model/user.js';
import type { UserRepository } from '../domain/port/user-repository.js';
import { GetCurrentUserUseCase } from '../domain/usecase/get-current-user.js';
import { initializeSdk, resetSdk, TOKENS } from './container.js';

const makeUser = (id: string): User => ({
  id: id as UserId,
  displayName: 'Test User',
  email: 'test@example.com',
  photoUrl: null,
  preferredLanguage: 'en',
  theme: 'system',
  role: 'member',
  status: 'active',
  createdAt: '2026-02-07T00:00:00.000Z' as IsoDateString,
  updatedAt: '2026-02-07T00:00:00.000Z' as IsoDateString,
});

describe('SDK DI Container', () => {
  beforeEach(() => {
    resetSdk();
  });

  it('initializes with default bindings', () => {
    initializeSdk({ apiBaseUrl: 'https://api.test.com' });

    expect(container.isRegistered(TOKENS.HttpClient)).toBe(true);
    expect(container.isRegistered(TOKENS.EventBus)).toBe(true);
    expect(container.isRegistered(TOKENS.KeyValueStore)).toBe(true);
  });

  it('resolves a use case with a mocked repository', async () => {
    // Register a mock UserRepository
    const mockUser: User = makeUser('user_123');
    const mockRepo: UserRepository = {
      findById: async () => ({ isSuccess: true, isFailure: false, value: mockUser }),
      findByEmail: async () => ({ isSuccess: true, isFailure: false, value: mockUser }),
      save: async () => ({ isSuccess: true, isFailure: false, value: undefined }),
      delete: async () => ({ isSuccess: true, isFailure: false, value: undefined }),
    };

    container.registerInstance(TOKENS.UserRepository, mockRepo);
    container.register(TOKENS.GetCurrentUserUseCase, {
      useClass: GetCurrentUserUseCase,
    });

    initializeSdk({ apiBaseUrl: 'https://api.test.com' });

    const useCase = container.resolve<GetCurrentUserUseCase>(TOKENS.GetCurrentUserUseCase);
    const result = await useCase.execute({ userId: 'user_123' as UserId });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.id).toBe('user_123');
      expect(result.value.displayName).toBe('Test User');
    }
  });

  it('returns failure when user is not found', async () => {
    const mockRepo: UserRepository = {
      findById: async () => ({ isSuccess: true, isFailure: false, value: null }),
      findByEmail: async () => ({ isSuccess: true, isFailure: false, value: null }),
      save: async () => ({ isSuccess: true, isFailure: false, value: undefined }),
      delete: async () => ({ isSuccess: true, isFailure: false, value: undefined }),
    };

    container.registerInstance(TOKENS.UserRepository, mockRepo);
    container.register(TOKENS.GetCurrentUserUseCase, {
      useClass: GetCurrentUserUseCase,
    });

    initializeSdk({ apiBaseUrl: 'https://api.test.com' });

    const useCase = container.resolve<GetCurrentUserUseCase>(TOKENS.GetCurrentUserUseCase);
    const result = await useCase.execute({ userId: 'user_999' as UserId });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('User not found');
    }
  });
});