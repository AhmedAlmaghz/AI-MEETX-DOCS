'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, Input, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { RegisterInput } from '@aimeetx/sdk';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { writeSession } from '@/lib/sdk/session-store';
import { TOKENS } from '@aimeetx/sdk';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  ensureSdkInitialized();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const input: RegisterInput = { email, password, displayName };
      const result = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').RegisterWithEmailUseCase>>(
        TOKENS.RegisterWithEmailUseCase,
      ).execute(input);
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
          <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing.sm, color: colors.light.text }}>Create account</h1>
          <p style={{ fontSize: typography.fontSize.base, color: colors.light.textSecondary, margin: 0 }}>Get started with AI MeetX</p>
        </div>

        <form onSubmit={(e) => void handleRegister(e)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Input label="Display name" type="text" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={3} maxLength={50} disabled={loading} />
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          <Input label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} disabled={loading} />

          {error && (
            <div style={{ padding: spacing.sm, backgroundColor: '#FEE2E2', border: `1px solid ${colors.semantic.error}`, borderRadius: radius.md, fontSize: typography.fontSize.sm, color: colors.semantic.error }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p style={{ marginTop: spacing.lg, fontSize: typography.fontSize.sm, color: colors.light.textSecondary, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: colors.brand.primary, textDecoration: 'none', fontWeight: typography.fontWeight.medium }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
