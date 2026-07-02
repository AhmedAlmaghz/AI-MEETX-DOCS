'use client';

import { useEffect, useState } from 'react';

import { initializeSdk, sdkContainer, TOKENS } from '@aimeetx/sdk';
import { colors, radius, spacing, typography } from '@aimeetx/ui';

/**
 * SDK Status component — demonstrates SDK initialization and DI container usage.
 *
 * Per ADR-005: this is a client component that initializes the SDK
 * and displays the status of the DI container bindings.
 */
export function SdkStatus() {
    const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
    const [bindings, setBindings] = useState<string[]>([]);

    useEffect(() => {
        try {
            initializeSdk({ apiBaseUrl: 'https://api.aimeetx.com' });

            const registered: string[] = [];
            if (sdkContainer.isRegistered(TOKENS.HttpClient)) registered.push('HttpClient');
            if (sdkContainer.isRegistered(TOKENS.EventBus)) registered.push('EventBus');
            if (sdkContainer.isRegistered(TOKENS.KeyValueStore)) registered.push('KeyValueStore');

            setBindings(registered);
            setStatus('ready');
        } catch (err) {
            console.error('SDK initialization failed:', err);
            setStatus('error');
        }
    }, []);

    const statusColor =
        status === 'ready' ? colors.semantic.success : status === 'error' ? colors.semantic.error : colors.semantic.warning;

    return (
        <div
            style={{
                padding: spacing.lg,
                backgroundColor: colors.light.surface,
                border: `1px solid ${colors.light.border}`,
                borderRadius: radius.lg,
                maxWidth: '500px',
                width: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    marginBottom: spacing.md,
                }}
            >
                <div
                    style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: radius.full,
                        backgroundColor: statusColor,
                    }}
                />
                <h2
                    style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        margin: 0,
                    }}
                >
                    SDK Status: {status}
                </h2>
            </div>

            <p
                style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.light.textSecondary,
                    marginBottom: spacing.md,
                }}
            >
                DI Container bindings registered:
            </p>

            <ul
                style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.xs,
                }}
            >
                {bindings.map((binding) => (
                    <li
                        key={binding}
                        style={{
                            fontSize: typography.fontSize.sm,
                            fontFamily: typography.fontFamily.mono,
                            color: colors.light.text,
                        }}
                    >
                        ✓ {binding}
                    </li>
                ))}
            </ul>
        </div>
    );
}