import type { Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';
import type { ZodSchema } from 'zod';

/**
 * HTTP error types.
 */
export type HttpError =
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Timeout'; readonly message: string }
  | { readonly code: 'Abort'; readonly message: string }
  | { readonly code: 'HttpStatus'; readonly status: number; readonly message: string; readonly body?: unknown }
  | { readonly code: 'ValidationError'; readonly message: string; readonly issues: unknown }
  | { readonly code: 'SerializationError'; readonly message: string; readonly cause?: unknown };

/**
 * Request configuration.
 */
export interface HttpRequestConfig {
  readonly url: string;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

/**
 * Request interceptor — runs before each request.
 * Can modify the request or short-circuit by returning a failure.
 */
export type RequestInterceptor = (
  config: HttpRequestConfig,
) => HttpRequestConfig | Promise<HttpRequestConfig>;

/**
 * Response interceptor — runs after each successful response.
 */
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * Error interceptor — runs when a request fails.
 */
export type ErrorInterceptor = (error: HttpError) => HttpError | Promise<HttpError>;

/**
 * HTTP client interface.
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The default implementation uses the native fetch API.
 */
export interface HttpClient {
  request<T>(config: HttpRequestConfig, schema?: ZodSchema<T>): Promise<Result<T, HttpError>>;
  get<T>(url: string, schema?: ZodSchema<T>): Promise<Result<T, HttpError>>;
  post<T>(url: string, body?: unknown, schema?: ZodSchema<T>): Promise<Result<T, HttpError>>;
  put<T>(url: string, body?: unknown, schema?: ZodSchema<T>): Promise<Result<T, HttpError>>;
  patch<T>(url: string, body?: unknown, schema?: ZodSchema<T>): Promise<Result<T, HttpError>>;
  delete<T>(url: string, schema?: ZodSchema<T>): Promise<Result<T, HttpError>>;
}

/**
 * Default fetch-based implementation of HttpClient.
 *
 * Supports:
 * - Request/response/error interceptors
 * - Timeout via AbortController
 * - Optional Zod schema validation
 * - JSON serialization
 */
export class FetchHttpClient implements HttpClient {
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly errorInterceptors: ErrorInterceptor[] = [];

  constructor(
    private readonly baseHeaders: Readonly<Record<string, string>> = {},
    private readonly defaultTimeoutMs = 30_000,
  ) {}

  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  useErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  async request<T>(
    config: HttpRequestConfig,
    schema?: ZodSchema<T>,
  ): Promise<Result<T, HttpError>> {
    try {
      // Run request interceptors
      let finalConfig = config;
      for (const interceptor of this.requestInterceptors) {
        finalConfig = await interceptor(finalConfig);
      }

      // Set up timeout + signal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeoutMs ?? this.defaultTimeoutMs);

      // Chain external signal
      if (finalConfig.signal) {
        finalConfig.signal.addEventListener('abort', () => controller.abort());
      }

      // Build fetch options
      const fetchOptions: RequestInit = {
        method: finalConfig.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.baseHeaders,
          ...finalConfig.headers,
        },
        signal: controller.signal,
      };

      if (finalConfig.body !== undefined && finalConfig.method !== 'GET') {
        fetchOptions.body = JSON.stringify(finalConfig.body);
      }

      // Execute request
      let response = await fetch(finalConfig.url, fetchOptions);
      clearTimeout(timeoutId);

      // Run response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      // Check status
      if (!response.ok) {
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          // ignore
        }
        return failure({
          code: 'HttpStatus',
          status: response.status,
          message: `HTTP ${response.status} ${response.statusText}`,
          body,
        });
      }

      // Parse JSON
      let data: unknown;
      try {
        data = await response.json();
      } catch (cause) {
        return failure({
          code: 'SerializationError',
          message: 'Failed to parse response JSON',
          cause,
        });
      }

      // Validate with Zod schema if provided
      if (schema) {
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
          return failure({
            code: 'ValidationError',
            message: 'Response failed schema validation',
            issues: parsed.error.issues,
          });
        }
        return success(parsed.data);
      }

      return success(data as T);
    } catch (cause) {
      let error: HttpError;
      if (cause instanceof Error && cause.name === 'AbortError') {
        error = { code: 'Abort', message: 'Request was aborted' };
      } else {
        error = {
          code: 'NetworkError',
          message: cause instanceof Error ? cause.message : 'Network request failed',
          cause,
        };
      }

      // Run error interceptors
      for (const interceptor of this.errorInterceptors) {
        error = await interceptor(error);
      }

      return failure(error);
    }
  }

  get<T>(url: string, schema?: ZodSchema<T>): Promise<Result<T, HttpError>> {
    return this.request<T>({ url, method: 'GET' }, schema);
  }

  post<T>(url: string, body?: unknown, schema?: ZodSchema<T>): Promise<Result<T, HttpError>> {
    return this.request<T>({ url, method: 'POST', body }, schema);
  }

  put<T>(url: string, body?: unknown, schema?: ZodSchema<T>): Promise<Result<T, HttpError>> {
    return this.request<T>({ url, method: 'PUT', body }, schema);
  }

  patch<T>(url: string, body?: unknown, schema?: ZodSchema<T>): Promise<Result<T, HttpError>> {
    return this.request<T>({ url, method: 'PATCH', body }, schema);
  }

  delete<T>(url: string, schema?: ZodSchema<T>): Promise<Result<T, HttpError>> {
    return this.request<T>({ url, method: 'DELETE' }, schema);
  }
}