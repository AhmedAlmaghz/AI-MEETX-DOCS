'use client';

import { useState, type FormEvent } from 'react';

import {
  HttpAuthRepository,
  LoginAsGuestUseCase,
  LoginWithEmailUseCase,
  WebSecureTokenStorage,
  initializeSdk,
  sdkContainer,
  TOKENS,
} from '@aimeetx/sdk';
import { Button, Input, colors, radius, spacing, typography } from '@aimeetx/ui';

/**
 * Login page — email/password login + guest access.
 *
 * Per ADR-005: this is a client component that uses the SDK use cases.
 * Per `02_PRODUCT_REQUIREMENTS.md`: guest access is supported.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Initialize SDK with auth bindings
      initializeSdk({ apiBaseUrl: 'https://api.aimeetx.com' });

      // Bind auth dependencies
      const httpClient = sdkContainer.resolve<import('@aimeetx/network').HttpClient>(TOKENS.HttpClient);
      sdkContainer.registerInstance(TOKENS.AuthRepository, new HttpAuthRepository(httpClient, 'https://api.aimeetx.com'));
      sdkContainer.registerInstance(TOKENS.SecureTokenStorage, new WebSecureTokenStorage());
      sdkContainer.register(TOKENS.LoginWithEmailUseCase, { useClass: LoginWithEmailUseCase });

      const useCase = sdkContainer.resolve<LoginWithEmailUseCase>(TOKENS.LoginWithEmailUseCase);
      const result = await useCase.execute({ email, password });

      if (result.isFailure) {
        setError(result.error.message);
      } else {
        // Redirect to home on success
        window.location.href = '/';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      initializeSdk({ apiBaseUrl: 'https://api.aimeetx.com' });

      const httpClient = sdkContainer.resolve<import('@aimeetx/network').HttpClient>(TOKENS.HttpClient);
      sdkContainer.registerInstance(TOKENS.AuthRepository, new HttpAuthRepository(httpClient, 'https://api.aimeetx.com'));
      sdkContainer.registerInstance(TOKENS.SecureTokenStorage, new WebSecureTokenStorage());
      sdkContainer.register(TOKENS.LoginAsGuestUseCase, { useClass: LoginAsGuestUseCase });

      const useCase = sdkContainer.resolve<LoginAsGuestUseCase>(TOKENS.LoginAsGuestUseCase);
      const result = await useCase.execute(undefined);

      if (result.isFailure) {
        setError(result.error.message);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        backgroundColor: colors.light.background,
        fontFamily: typography.fontFamily.sans,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: spacing.xl,
          backgroundColor: colors.light.surface,
          border: `1px solid ${colors.light.border}`,
          borderRadius: radius.lg,
          boxShadow: shadow,
        }}
      >
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.sm,
            color: colors.light.text,
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.light.textSecondary,
            marginBottom: spacing.xl,
          }}
        >
          Sign in to your AI MeetX account
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          {error && (
            <div
              style={{
                padding: spacing.sm,
                backgroundColor: '#FEE2E2',
                border: `1px solid ${colors.semantic.error}`,
                borderRadius: radius.md,
                fontSize: typography.fontSize.sm,
                color: colors.semantic.error,
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              margin: `${spacing.md} 0`,
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.light.border }} />
            <span style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.light.border }} />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            onClick={handleGuestLogin}
          >
            Continue as guest
          </Button>
        </form>

        <p
          style={{
            marginTop: spacing.lg,
            fontSize: typography.fontSize.sm,
            color: colors.light.textSecondary,
            textAlign: 'center',
          }}
        >
          Don't have an account?{' '}
          <a href="/register" style={{ color: colors.brand.primary, textDecoration: 'none' }}>
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}

const shadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';