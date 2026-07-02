import { Button, colors, spacing, typography } from '@aimeetx/ui';

import { SdkStatus } from '@/components/sdk-status';

/**
 * Home page — demonstrates SDK + UI integration.
 *
 * Per ADR-005: this is the reference web client.
 * It consumes @aimeetx/sdk for business logic and @aimeetx/ui for components.
 */
export default function HomePage() {
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
            }}
        >
            <h1
                style={{
                    fontSize: typography.fontSize['5xl'],
                    fontWeight: typography.fontWeight.bold,
                    marginBottom: spacing.md,
                }}
            >
                AI MeetX
            </h1>
            <p
                style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.light.textSecondary,
                    marginBottom: spacing.xl,
                    textAlign: 'center',
                    maxWidth: '600px',
                }}
            >
                AI-powered real-time collaboration platform. Built as a Next.js 16 + TypeScript SDK-First
                monorepo per ADR-005.
            </p>

            <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing['2xl'] }}>
                <Button variant="primary" size="lg">
                    Get Started
                </Button>
                <Button variant="secondary" size="lg">
                    Documentation
                </Button>
            </div>

            <SdkStatus />
        </main>
    );
}