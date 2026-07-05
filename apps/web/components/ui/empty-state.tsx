'use client';

import type { ReactNode } from 'react';

import { useTheme, colors, radius, spacing, typography } from '@aimeetx/ui';

interface EmptyStateProps {
  readonly icon?: string;
  readonly title: string;
  readonly body?: string;
  readonly action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette = isDark ? colors.dark : colors.light;

  return (
    <div style={{ padding: spacing['2xl'], textAlign: 'center', color: palette.textSecondary, backgroundColor: palette.surface, border: `1px dashed ${palette.border}`, borderRadius: radius.lg, animation: 'fadeIn 0.3s ease' }}>
      {icon && <p style={{ fontSize: 32, margin: `0 0 ${spacing.sm}` }}>{icon}</p>}
      <p style={{ fontSize: typography.fontSize.base, color: palette.text, fontWeight: typography.fontWeight.medium, margin: `0 0 ${body ? spacing.xs : 0}` }}>{title}</p>
      {body && <p style={{ fontSize: typography.fontSize.sm, margin: `0 0 ${action ? spacing.md : 0}` }}>{body}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}