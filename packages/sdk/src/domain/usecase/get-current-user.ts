import { inject, injectable } from 'tsyringe';

import type { Result, UserId } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { User } from '../model/user.js';
import type { UserRepository } from '../port/user-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

/**
 * Command for GetCurrentUserUseCase.
 */
export interface GetCurrentUserCommand {
  readonly userId: UserId;
}

/**
 * GetCurrentUserUseCase — retrieves the current authenticated user.
 *
 * This is a sample use case that demonstrates the Clean Architecture pattern
 * in the SDK. It will be expanded in PHASE_01 (Authentication & Identity).
 *
 * Per ADR-004: Use cases are single-responsibility and live in the domain layer.
 * They depend only on Ports (interfaces), never on concrete implementations.
 */
@injectable()
export class GetCurrentUserUseCase implements UseCase<GetCurrentUserCommand, User, Error> {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: GetCurrentUserCommand): Promise<Result<User, Error>> {
    const result = await this.userRepository.findById(command.userId);
    if (result.isFailure) {
      return failure(result.error);
    }
    if (result.value === null) {
      return failure(new Error(`User not found: ${command.userId}`));
    }
    return success(result.value);
  }
}