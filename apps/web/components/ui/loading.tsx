'use client';

import { useTheme, colors, spacing, typography } from '@aimeetx/ui';

interface LoadingProps {
  readonly text?: string;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function Loading({ text, size = 'md' }: LoadingProps) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette = isDark ? colors.dark : colors.light;
  const dim = size === 'sm' ? 20 : size === 'lg' ? 40 : 28;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, color: palette.textSecondary }}>
      <div style={{ width: dim, height: dim, border: `3px solid ${palette.border}`, borderTopColor: colors.brand.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      {text && <span style={{ fontSize: typography.fontSize.sm }}>{text}</span>}
    </div>
  );
}