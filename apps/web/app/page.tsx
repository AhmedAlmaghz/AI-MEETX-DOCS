'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';

import { useSession } from '@/lib/sdk/hooks';

/**
 * Landing page — redirects signed-in users to the dashboard,
 * shows a marketing page with sign-in / sign-up CTAs otherwise.
 */
export default function HomePage() {
  const router = useRouter();
  const [session] = useSession();

  useEffect(() => {
    if (session) router.replace('/dashboard');
  }, [session, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        backgroundColor: colors.light.background,
        color: colors.light.text,
        fontFamily: typography.fontFamily.sans,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div
          style={{
            display: 'inline-flex',
            padding: `${spacing.xs} ${spacing.md}`,
            backgroundColor: colors.brand.primary,
            color: '#FFFFFF',
            borderRadius: radius.full,
            fontSize: typography.fontSize.sm,
            marginBottom: spacing.lg,
          }}
        >
          AI-powered real-time collaboration
        </div>
        <h1
          style={{
            fontSize: typography.fontSize['5xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.md,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          Meet, translate, and collaborate — in any language.
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.light.textSecondary,
            marginBottom: spacing['2xl'],
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          AI MeetX brings together real-time translation, intelligent meeting
          summaries, virtual classrooms, and multi-tenant administration on
          a single SDK-first platform.
        </p>
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg">
              Sign in
            </Button>
          </Link>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="lg">
              Create account
            </Button>
          </Link>
        </div>
        <ul
          style={{
            marginTop: spacing['3xl'],
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: spacing.lg,
            listStyle: 'none',
            padding: 0,
            textAlign: 'left',
          }}
        >
          {[
            { title: 'Live translation', body: 'Gemini-powered speech-to-speech in 50+ languages.' },
            { title: 'AI summaries', body: 'Action items and post-meeting reports, automated.' },
            { title: 'Virtual classrooms', body: 'Quizzes, attendance, and breakout rooms built in.' },
            { title: 'Multi-tenant', body: 'Org-level feature flags and immutable audit logs.' },
          ].map((feature) => (
            <li
              key={feature.title}
              style={{
                padding: spacing.lg,
                backgroundColor: colors.light.surface,
                border: `1px solid ${colors.light.border}`,
                borderRadius: radius.lg,
              }}
            >
              <h3
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing.sm,
                  color: colors.brand.primary,
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.textSecondary,
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
