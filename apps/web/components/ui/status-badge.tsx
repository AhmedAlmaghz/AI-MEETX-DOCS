'use client';

import { colors, radius, spacing, typography } from '@aimeetx/ui';

type StatusLevel = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_COLORS: Record<StatusLevel, { bg: string; text: string }> = {
  success: { bg: 'rgba(16,185,129,0.15)', text: colors.semantic.success },
  warning: { bg: 'rgba(245,158,11,0.15)', text: colors.semantic.warning },
  error: { bg: 'rgba(239,68,68,0.15)', text: colors.semantic.error },
  info: { bg: 'rgba(59,130,246,0.15)', text: colors.semantic.info },
  neutral: { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' },
};

interface StatusBadgeProps {
  readonly status: StatusLevel;
  readonly label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.neutral;
  return (
    <span
      style={{
        padding: `1px ${spacing.xs}`,
        borderRadius: radius.sm,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        backgroundColor: sc.bg,
        color: sc.text,
        textTransform: 'capitalize' as const,
      }}
    >
      {label ?? status}
    </span>
  );
}

interface StatusDotProps {
  readonly status: StatusLevel;
}

export function StatusDot({ status }: StatusDotProps) {
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.neutral;
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: sc.text,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}
