'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

import { useTheme, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { UserId } from '@aimeetx/types';
import type { Meeting, MeetingFact, PlatformMetricsSummary } from '@aimeetx/sdk';

import { ensureSdkInitialized } from '@/lib/sdk/bootstrap';
import { useCurrentProfile, useSession } from '@/lib/sdk/hooks';
import { resolveUseCase } from '@/lib/sdk/bootstrap';
import { TOKENS } from '@aimeetx/sdk';

interface DashboardData {
  readonly upcoming: ReadonlyArray<Meeting>;
  readonly active: ReadonlyArray<Meeting>;
  readonly recentFacts: ReadonlyArray<MeetingFact>;
  readonly platform: PlatformMetricsSummary | null;
}

type Palette = {
  readonly background: string;
  readonly surface: string;
  readonly surfaceVariant: string;
  readonly border: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textDisabled: string;
};

export default function DashboardPage() {
  ensureSdkInitialized();
  const [session] = useSession();
  const { profile } = useCurrentProfile();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette: Palette = isDark ? colors.dark : colors.light;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const userId = session.userId;
      const meetingsResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').ListMeetingsUseCase>
      >(TOKENS.ListMeetingsUseCase).execute({ hostId: userId });

      const activeResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').ListMeetingsUseCase>
      >(TOKENS.ListMeetingsUseCase).execute({ hostId: userId });

      const platformResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').GetPlatformMetricsUseCase>
      >(TOKENS.GetPlatformMetricsUseCase).execute({
        actor: { userId: session.userId, role: 'super_admin' },
        range: { from: '2026-01-01', to: '2026-01-31' },
      });

      const allMeetings = meetingsResult.isSuccess ? meetingsResult.value : [];
      const allActive = activeResult.isSuccess ? activeResult.value : [];
      const platform = platformResult.isSuccess ? platformResult.value : null;

      setData({
        upcoming: allMeetings.filter((m) => m.status === 'scheduled'),
        active: allActive.filter((m) => m.status === 'active'),
        recentFacts: [],
        platform,
      });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <header>
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.sm,
            color: palette.text,
          }}
        >
          Welcome back, {profile?.displayName ?? 'there'} 👋
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: palette.textSecondary,
          }}
        >
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: spacing.md,
        }}
      >
        <StatCard
          title="Active meetings"
          value={String(data?.active.length ?? 0)}
          color={colors.semantic.success}
        />
        <StatCard
          title="Scheduled"
          value={String(data?.upcoming.length ?? 0)}
          color={colors.brand.primary}
        />
        <StatCard
          title="Recording minutes"
          value={formatMinutes(data?.platform?.totalRecordingMinutes)}
          color={colors.semantic.warning}
        />
        <StatCard
          title="Translation minutes"
          value={formatMinutes(data?.platform?.totalTranslationMinutes)}
          color={colors.semantic.info}
        />
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: spacing.lg,
        }}
      >
        <Card title="Upcoming meetings" palette={palette}>
          {loading ? (
            <p style={{ color: palette.textSecondary }}>Loading...</p>
          ) : (data?.upcoming.length ?? 0) === 0 ? (
            <p style={{ color: palette.textSecondary }}>
              No upcoming meetings.{' '}
              <Link href="/meetings" style={{ color: colors.brand.primary }}>
                Schedule one
              </Link>
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {data?.upcoming.slice(0, 5).map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/meetings/${m.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: spacing.md,
                      border: `1px solid ${palette.border}`,
                      borderRadius: radius.md,
                      textDecoration: 'none',
                      color: palette.text,
                    }}
                  >
                    <span style={{ fontWeight: typography.fontWeight.medium }}>{m.title}</span>
                    <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
                      {m.status} · max {m.maxParticipants} participants
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active now" palette={palette}>
          {loading ? (
            <p style={{ color: palette.textSecondary }}>Loading...</p>
          ) : (data?.active.length ?? 0) === 0 ? (
            <p style={{ color: palette.textSecondary }}>No active meetings.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {data?.active.slice(0, 5).map((m) => (
                <li
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    border: `1px solid ${colors.semantic.success}`,
                    borderRadius: radius.md,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                    color: palette.text,
                  }}
                >
                  <span style={{ fontWeight: typography.fontWeight.medium }}>{m.title}</span>
                  <Link
                    href={`/meetings/${m.id}`}
                    style={{
                      color: colors.semantic.success,
                      fontWeight: typography.fontWeight.semibold,
                      textDecoration: 'none',
                    }}
                  >
                    Join →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card title="Platform metrics (this month)" palette={palette}>
        {data?.platform ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: spacing.md,
            }}
          >
            <MetricCell label="Daily active users" value={data.platform.dailyActiveUsers.toLocaleString()} />
            <MetricCell label="Monthly active users" value={data.platform.monthlyActiveUsers.toLocaleString()} />
            <MetricCell label="Total meetings" value={data.platform.totalMeetings.toLocaleString()} />
            <MetricCell label="Meeting minutes" value={data.platform.totalMeetingMinutes.toLocaleString()} />
          </div>
        ) : (
          <p style={{ color: palette.textSecondary }}>Platform metrics unavailable.</p>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
  palette,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly palette: Palette;
}) {
  return (
    <section
      style={{
        padding: spacing.lg,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: radius.lg,
      }}
    >
      <h2
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          marginBottom: spacing.md,
          color: palette.text,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatCard({ title, value, color }: { readonly title: string; readonly value: string; readonly color: string }) {
  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.light.surface,
        border: `1px solid ${colors.light.border}`,
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
      }}
    >
      <span style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary }}>{title}</span>
      <span style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color }}>{value}</span>
    </div>
  );
}

function MetricCell({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.light.surfaceVariant,
        borderRadius: radius.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
      }}
    >
      <span style={{ fontSize: typography.fontSize.xs, color: colors.light.textSecondary }}>{label}</span>
      <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold }}>
        {value}
      </span>
    </div>
  );
}

function formatMinutes(value: number | undefined): string {
  if (value === undefined) return '—';
  if (value >= 60) return `${(value / 60).toFixed(1)}h`;
  return `${value}m`;
}
