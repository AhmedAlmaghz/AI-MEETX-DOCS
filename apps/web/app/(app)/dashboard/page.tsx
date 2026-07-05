'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';

import { Button, colors } from '@aimeetx/ui';
import type { Meeting, PlatformMetricsSummary } from '@aimeetx/sdk';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useCurrentProfile, useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import {
  PageHeader, Card, StatCard, MetricCell, BarRow, PageLayout, LoadingScreen,
} from '@/components/ui';
import { formatMinutes, diffMinutes } from '@/lib/utils';

export default function DashboardPage() {
  ensureSdkInitialized();
  const [session] = useSession();
  const { profile } = useCurrentProfile();
  const { palette } = usePalette();

  const [meetings, setMeetings] = useState<ReadonlyArray<Meeting>>([]);
  const [platform, setPlatform] = useState<PlatformMetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [meetingsResult, platformResult] = await Promise.all([
        resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ListMeetingsUseCase>>(
          TOKENS.ListMeetingsUseCase,
        ).execute({ hostId: session.userId }),
        resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GetPlatformMetricsUseCase>>(
          TOKENS.GetPlatformMetricsUseCase,
        ).execute({
          actor: { userId: session.userId, role: 'super_admin' },
          range: { from: '2026-01-01', to: '2026-01-31' },
        }),
      ]);
      if (meetingsResult.isSuccess) setMeetings(meetingsResult.value);
      if (platformResult.isSuccess) setPlatform(platformResult.value);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const active = useMemo(() => meetings.filter((m) => m.status === 'active'), [meetings]);
  const upcoming = useMemo(() => meetings.filter((m) => m.status === 'scheduled').slice(0, 5), [meetings]);
  const recent = useMemo(() => meetings.filter((m) => m.status === 'ended').slice(0, 5), [meetings]);

  if (loading) return <LoadingScreen text="Loading dashboard..." />;

  return (
    <PageLayout>
      <PageHeader
        title={`Welcome back, ${profile?.displayName ?? 'there'}`}
        subtitle={active.length > 0 ? `You have ${active.length} active meeting${active.length > 1 ? 's' : ''}.` : 'No active meetings right now.'}
        actions={
          <>
            <Link href="/meetings"><Button variant="primary" size="sm">＋ New meeting</Button></Link>
            <Link href="/classroom"><Button variant="secondary" size="sm">📚 Classrooms</Button></Link>
            <Link href="/recordings"><Button variant="secondary" size="sm">🎬 Recordings</Button></Link>
            <Link href="/notifications"><Button variant="secondary" size="sm">🔔 Notifications</Button></Link>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard label="Active meetings" value={String(active.length)} color={colors.semantic.success} />
        <StatCard label="Scheduled" value={String(upcoming.length)} color={colors.brand.primary} />
        <StatCard label="Recording minutes" value={formatMinutes(platform?.totalRecordingMinutes)} color={colors.semantic.warning} />
        <StatCard label="Translation minutes" value={formatMinutes(platform?.totalTranslationMinutes)} color={colors.semantic.info} />
      </div>

      {active.length > 0 && (
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: palette.text, margin: '0 0 16px' }}>Active now</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {active.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: `1px solid ${colors.semantic.success}`, borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.05)' }}>
                <span style={{ fontWeight: 500, color: palette.text }}>{m.title}</span>
                <Link href={`/meetings/${m.id}`}><Button variant="primary" size="sm">Join</Button></Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        <Card title="Upcoming">
          {upcoming.length === 0 ? (
            <p style={{ color: palette.textSecondary, fontSize: '14px' }}>No upcoming meetings. Schedule one to get started.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcoming.map((m) => (
                <Link key={m.id} href={`/meetings/${m.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '8px', border: `1px solid ${palette.border}`, borderRadius: '8px', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 500, color: palette.text }}>{m.title}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: palette.textSecondary }}>{new Date(m.createdAt).toLocaleDateString()} · max {m.maxParticipants} participants</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent meetings">
          {recent.length === 0 ? (
            <p style={{ color: palette.textSecondary, fontSize: '14px' }}>No recent meetings.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recent.map((m) => (
                <div key={m.id} style={{ padding: '8px', border: `1px solid ${palette.border}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 500, color: palette.text, fontSize: '14px' }}>{m.title}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: palette.textSecondary }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  {m.endedAt && (
                    <span style={{ fontSize: '12px', color: palette.textSecondary }}>{formatMinutes(diffMinutes(m.createdAt, m.endedAt))}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Platform metrics (this month)">
        {platform ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <MetricCell label="Daily active users" value={platform.dailyActiveUsers.toLocaleString()} />
            <MetricCell label="Monthly active users" value={platform.monthlyActiveUsers.toLocaleString()} />
            <MetricCell label="Total meetings" value={platform.totalMeetings.toLocaleString()} />
            <MetricCell label="Meeting minutes" value={platform.totalMeetingMinutes.toLocaleString()} />
            <MetricCell label="Translation minutes" value={formatMinutes(platform.totalTranslationMinutes)} />
            <MetricCell label="Recording minutes" value={formatMinutes(platform.totalRecordingMinutes)} />
          </div>
        ) : (
          <p style={{ color: palette.textSecondary, margin: 0 }}>Platform metrics unavailable.</p>
        )}
      </Card>

      {meetings.length > 0 && (
        <Card title="Activity summary">
          <BarRow label={`Active (${active.length})`} count={active.length} total={meetings.length} color={colors.semantic.success} />
          <BarRow label={`Scheduled (${upcoming.length})`} count={upcoming.length} total={meetings.length} color={colors.brand.primary} />
          <BarRow label={`Ended (${recent.length})`} count={recent.length} total={meetings.length} color={palette.textSecondary} />
        </Card>
      )}
    </PageLayout>
  );
}
