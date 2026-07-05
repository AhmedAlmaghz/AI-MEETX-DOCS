'use client';

import type { ReactNode } from 'react';
import { usePalette } from '@/lib/hooks';
import { radius, spacing, typography } from '@aimeetx/ui';

interface CardProps {
  readonly title?: string;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
}

export function Card({ title, children, actions, className }: CardProps) {
  const { palette } = usePalette();
  return (
    <section
      className={className}
      style={{
        padding: spacing.lg,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: radius.lg,
      }}
    >
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: title ? spacing.md : 0 }}>
          {title && (
            <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: palette.text, margin: 0 }}>
              {title}
            </h2>
          )}
          {actions && <div style={{ display: 'flex', gap: spacing.sm }}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  const { palette } = usePalette();
  return (
    <div style={{ padding: spacing.lg, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <span style={{ fontSize: typography.fontSize.sm, color: palette.textSecondary }}>{label}</span>
      <span style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color ?? palette.text }}>{value}</span>
    </div>
  );
}

interface MetricCellProps {
  readonly label: string;
  readonly value: string;
}

export function MetricCell({ label, value }: MetricCellProps) {
  const { palette } = usePalette();
  return (
    <div style={{ padding: spacing.md, backgroundColor: palette.surfaceVariant, borderRadius: radius.md, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>{label}</span>
      <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: palette.text }}>{value}</span>
    </div>
  );
}

interface BarRowProps {
  readonly label: string;
  readonly count: number;
  readonly total: number;
  readonly color: string;
}

export function BarRow({ label, count, total, color }: BarRowProps) {
  const { palette } = usePalette();
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
      <span style={{ width: 140, fontSize: typography.fontSize.sm, color }}>{label}</span>
      <div style={{ flex: 1, height: 8, backgroundColor: 'rgba(128,128,128,0.15)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 4, transition: 'width 300ms ease' }} />
      </div>
      <span style={{ width: 40, fontSize: typography.fontSize.xs, color: palette.textSecondary }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { palette } = usePalette();
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
      <div>
        <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: palette.text, margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: palette.textSecondary, marginTop: spacing.xs, margin: subtitle ? `${spacing.xs} 0 0` : 0, fontSize: typography.fontSize.base }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: spacing.sm }}>{actions}</div>}
    </header>
  );
}
