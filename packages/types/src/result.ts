/**
 * Result wrapper for type-safe error handling.
 *
 * Replaces thrown exceptions with explicit success/failure values.
 * Per ADR-004 (Clean Architecture) and Constitution §9: "Never return null to indicate failure."
 *
 * @example
 * ```ts
 * const result: Result<User, AuthError> = await loginUseCase(credentials);
 * if (result.isSuccess) {
 *   console.log(result.value.displayName);
 * } else {
 *   console.error(result.error.code);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { readonly isSuccess: true; readonly isFailure: false; readonly value: T }
  | { readonly isSuccess: false; readonly isFailure: true; readonly error: E };

/**
 * Creates a successful Result.
 */
export const success = <T>(value: T): Result<T, never> => ({
  isSuccess: true,
  isFailure: false,
  value,
});

/**
 * Creates a failed Result.
 */
export const failure = <E>(error: E): Result<never, E> => ({
  isSuccess: false,
  isFailure: true,
  error,
});

/**
 * Type guard for success.
 */
export const isSuccess = <T, E>(
  result: Result<T, E>,
): result is { readonly isSuccess: true; readonly isFailure: false; readonly value: T } =>
  result.isSuccess;

/**
 * Type guard for failure.
 */
export const isFailure = <T, E>(
  result: Result<T, E>,
): result is { readonly isSuccess: false; readonly isFailure: true; readonly error: E } =>
  result.isFailure;

/**
 * Maps the success value of a Result, leaving failure unchanged.
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  if (isSuccess(result)) {
    return success(fn(result.value));
  }
  return result as Result<U, E>;
};

/**
 * Maps the error of a failed Result, leaving success unchanged.
 */
export const mapError = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  if (isFailure(result)) {
    return failure(fn(result.error));
  }
  return result as Result<T, F>;
};

/**
 * Chains Results, short-circuiting on failure.
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (isSuccess(result) ? fn(result.value) : (result as Result<U, E>));

/**
 * Unwraps a Result, throwing the error if failed.
 * Use sparingly — prefer pattern matching with isSuccess/isFailure.
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isSuccess(result)) return result.value;
  if (isFailure(result)) throw result.error;
  throw new Error('Unreachable: Result is neither success nor failure');
};