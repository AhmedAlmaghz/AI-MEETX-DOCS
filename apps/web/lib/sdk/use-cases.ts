import { sdkContainer, TOKENS } from '@aimeetx/sdk';
import { ensureSdkInitialized } from './bootstrap';

export function useCase<Token extends symbol, T>(token: Token): T {
  ensureSdkInitialized();
  return sdkContainer.resolve<T>(token as symbol);
}

export function resolveUseCaseToken<T>(token: symbol): T {
  ensureSdkInitialized();
  return sdkContainer.resolve<T>(token);
}
