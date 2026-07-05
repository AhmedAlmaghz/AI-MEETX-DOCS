'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, Input, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { AuthCredentials } from '@aimeetx/sdk';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { writeSession } from '@/lib/sdk/session-store';
import { TOKENS } from '@aimeetx/sdk';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  ensureSdkInitialized();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credentials: AuthCredentials = { email, password };
      const result = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').LoginWithEmailUseCase>>(
        TOKENS.LoginWithEmailUseCase,
      ).execute(credentials);
      if (result.isFailure) { setError(result.error.message); return; }
      writeSession(result.value);
      router.push('/dashboard');
    } finally { setLoading(false); }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').LoginAsGuestUseCase>>(
        TOKENS.LoginAsGuestUseCase,
      ).execute(undefined);
      if (result.isFailure) { setError(result.error.message); return; }
      writeSession(result.value);
      router.push('/dashboard');
    } finally { setLoading(false); }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.light.background, fontFamily: typography.fontFamily.sans }}>
      <div style={{ width: '100%', maxWidth: 400, padding: spacing.xl, backgroundColor: colors.light.surface, border: `1px solid ${colors.light.border}`, borderRadius: radius.lg, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.sm, textDecoration: 'none', color: colors.brand.primary, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.xl, marginBottom: spacing.lg }}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="4" width="20" height="14" rx="3" fill={colors.brand.primary} />
              <circle cx="12" cy="11" r="3" fill="#FFFFFF" />
            </svg>
            AI MeetX
          </Link>
          <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing.sm, color: colors.light.text }}>Welcome back</h1>
          <p style={{ fontSize: typography.fontSize.base, color: colors.light.textSecondary, margin: 0 }}>Sign in to your AI MeetX account</p>
        </div>

        <form onSubmit={(e) => void handleLogin(e)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />

          {error && (
            <div style={{ padding: spacing.sm, backgroundColor: '#FEE2E2', border: `1px solid ${colors.semantic.error}`, borderRadius: radius.md, fontSize: typography.fontSize.sm, color: colors.semantic.error }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, margin: `${spacing.md} 0` }}>
            <div style={{ flex: 1, height: 1, backgroundColor: colors.light.border }} />
            <span style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: colors.light.border }} />
          </div>

          <Button type="button" variant="secondary" size="lg" fullWidth disabled={loading} onClick={() => void handleGuestLogin()}>
            Continue as guest
          </Button>
        </form>

        <p style={{ marginTop: spacing.lg, fontSize: typography.fontSize.sm, color: colors.light.textSecondary, textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: colors.brand.primary, textDecoration: 'none', fontWeight: typography.fontWeight.medium }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
