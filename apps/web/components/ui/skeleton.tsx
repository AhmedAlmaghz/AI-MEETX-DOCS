'use client';

import { usePalette } from '@/lib/hooks';
import { radius, spacing, typography } from '@aimeetx/ui';

interface SkeletonProps {
  readonly width?: string | number;
  readonly height?: string | number;
  readonly borderRadius?: string;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.md }: SkeletonProps) {
  const { palette } = usePalette();
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: palette.surfaceVariant,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ padding: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Skeleton width="40%" height={20} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="80%" height={14} />
      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
        <Skeleton width={80} height={32} borderRadius={radius.md} />
        <Skeleton width={80} height={32} borderRadius={radius.md} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { readonly count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: spacing.md, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Skeleton width={200} height={16} />
            <Skeleton width={120} height={12} />
          </div>
          <Skeleton width={80} height={32} borderRadius={radius.md} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { readonly count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: spacing.lg, border: `1px solid transparent`, borderRadius: radius.lg }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <Skeleton width="30%" height={14} />
            <Skeleton width="100%" height={18} />
            <Skeleton width="70%" height={14} />
            <Skeleton width="50%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingScreen({ text = 'Loading...' }: { readonly text?: string }) {
  const { palette } = usePalette();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing['4xl'] }}>
      <div style={{ width: 32, height: 32, border: '3px solid', borderColor: palette.border, borderTopColor: '#0066FF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: typography.fontSize.sm, color: palette.textSecondary }}>{text}</span>
    </div>
  );
}
