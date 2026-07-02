import { describe, expect, it } from 'vitest';
import { failure, flatMap, isFailure, isSuccess, map, mapError, success, unwrap } from './result.js';

describe('Result', () => {
  describe('success', () => {
    it('creates a successful Result', () => {
      const result = success(42);
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      if (result.isSuccess) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe('failure', () => {
    it('creates a failed Result', () => {
      const error = new Error('boom');
      const result = failure(error);
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('isSuccess / isFailure', () => {
    it('isSuccess narrows the type', () => {
      const result = success('hello');
      if (isSuccess(result)) {
        // TypeScript should allow accessing .value here
        const _value: string = result.value;
        expect(_value).toBe('hello');
      }
    });

    it('isFailure narrows the type', () => {
      const result = failure(new Error('nope'));
      if (isFailure(result)) {
        // TypeScript should allow accessing .error here
        const _error: Error = result.error;
        expect(_error.message).toBe('nope');
      }
    });
  });

  describe('map', () => {
    it('maps the success value', () => {
      const result = success(2);
      const mapped = map(result, (x) => x * 3);
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.value).toBe(6);
      }
    });

    it('leaves failure unchanged', () => {
      const error = new Error('original');
      const result = failure<Error>(error);
      const mapped = map(result, (x: number) => x * 3);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('mapError', () => {
    it('maps the error value', () => {
      const result = failure(new Error('original'));
      const mapped = mapError(result, (e) => `Wrapped: ${e.message}`);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe('Wrapped: original');
      }
    });

    it('leaves success unchanged', () => {
      const result = success(42);
      const mapped = mapError(result, (e: Error) => `Wrapped: ${e.message}`);
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });
  });

  describe('flatMap', () => {
    it('chains successful Results', () => {
      const result = success(2);
      const chained = flatMap(result, (x) => success(x * 10));
      expect(isSuccess(chained)).toBe(true);
      if (isSuccess(chained)) {
        expect(chained.value).toBe(20);
      }
    });

    it('short-circuits on failure', () => {
      const error = new Error('first');
      const result = failure<Error>(error);
      const fn = () => success(999);
      const chained = flatMap(result, fn);
      expect(isFailure(chained)).toBe(true);
      if (isFailure(chained)) {
        expect(chained.error).toBe(error);
      }
    });
  });

  describe('unwrap', () => {
    it('returns the value on success', () => {
      expect(unwrap(success(42))).toBe(42);
    });

    it('throws the error on failure', () => {
      const error = new Error('boom');
      expect(() => unwrap(failure(error))).toThrow(error);
    });
  });
});