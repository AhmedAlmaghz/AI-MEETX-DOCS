'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { MeetingRecording } from '@aimeetx/sdk';
import type { RecordingId } from '@aimeetx/types';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import {
  PageHeader, FilterBar, PageLayout, LoadingScreen, EmptyState,
} from '@/components/ui';
import { timeAgo, formatDuration, formatSize } from '@/lib/utils';

type Filter = 'all' | 'ready' | 'active' | 'failed';

const FILTERS: ReadonlyArray<{ value: Filter; label?: string }> = [
  { value: 'all' }, { value: 'ready' }, { value: 'active' }, { value: 'failed' },
];

export default function RecordingsPage() {
  ensureSdkInitialized();
  const { palette, isDark } = usePalette();

  const [recordings, setRecordings] = useState<ReadonlyArray<MeetingRecording>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [copiedId, setCopiedId] = useState<RecordingId | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ListRecordingsUseCase>>(TOKENS.ListRecordingsUseCase).execute({ meetingId: 'meeting_demo_1' as never });
      if (r.isSuccess) setRecordings(r.value);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(
    () => recordings.filter((r) => filter === 'all' || r.status === filter).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [recordings, filter],
  );

  const filterOptions = useMemo(() => {
    const c: Record<string, number> = { all: recordings.length };
    for (const f of ['ready', 'active', 'failed'] as const) c[f] = recordings.filter((r) => r.status === f).length;
    return FILTERS.map((f) => ({ ...f, count: c[f.value] }));
  }, [recordings]);

  const handleDelete = useCallback(async (id: RecordingId) => {
    if (!confirm('Delete this recording permanently?')) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').DeleteRecordingUseCase>>(TOKENS.DeleteRecordingUseCase).execute({ actor: { userId: '' as never, role: 'host' }, recordingId: id });
    void load();
  }, [load]);

  const handleCopyLink = useCallback(async (id: RecordingId) => {
    const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GetDownloadLinkUseCase>>(TOKENS.GetDownloadLinkUseCase).execute({ actor: { userId: '' as never, role: 'host' }, recordingId: id, expiresInHours: 24 });
    if (r.isSuccess) {
      await navigator.clipboard.writeText(r.value.downloadUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  if (loading) return <LoadingScreen text="Loading recordings..." />;

  return (
    <PageLayout>
      <PageHeader
        title="Recordings"
        subtitle={`${recordings.length} recording${recordings.length === 1 ? '' : 's'} available`}
      />

      <FilterBar options={filterOptions} selected={filter} onChange={(v) => setFilter(v)} />

      {filtered.length === 0 ? (
        <EmptyState icon="📹" title={filter === 'all' ? 'No recordings yet.' : `No ${filter} recordings.`} body={filter === 'all' ? 'Start recording a meeting to see it here.' : undefined} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: spacing.md }}>
          {filtered.map((r) => {
            const sc = statusColor(r.status);
            const isReady = r.status === 'ready';
            const isCopied = copiedId === r.id;
            return (
              <div key={r.id} style={{ padding: spacing.lg, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg, display: 'flex', flexDirection: 'column', gap: spacing.sm, transition: 'transform 150ms ease, box-shadow 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ padding: `2px ${spacing.xs}`, borderRadius: radius.sm, backgroundColor: sc, color: '#FFFFFF', fontSize: typography.fontSize.xs, textTransform: 'uppercase', fontWeight: 600 }}>{r.status}</span>
                  <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>{r.layout}</span>
                </div>
                <div style={{ width: '100%', height: 100, borderRadius: radius.md, backgroundColor: isDark ? '#1F2937' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, opacity: 0.5 }}>
                  {isReady ? '▶' : r.status === 'active' ? '⏳' : '⛔'}
                </div>
                <h3 style={{ fontSize: typography.fontSize.base, fontWeight: 600, color: palette.text, margin: 0 }}>Recording {r.id.slice(-6)}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${spacing.xs} ${spacing.sm}`, fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
                  <span>Duration: {r.durationSeconds ? formatDuration(r.durationSeconds) : '—'}</span>
                  <span>Size: {r.fileSizeBytes ? formatSize(r.fileSizeBytes) : '—'}</span>
                  <span>Started {timeAgo(r.startedAt)}</span>
                  <span>{r.expiresAt ? `Expires ${new Date(r.expiresAt).toLocaleDateString()}` : 'No expiry'}</span>
                </div>
                <div style={{ display: 'flex', gap: spacing.sm, marginTop: 'auto' }}>
                  <Button variant="primary" size="sm" disabled={!isReady} onClick={() => void handleCopyLink(r.id)} style={{ flex: 1 }}>{isCopied ? 'Copied!' : 'Copy link'}</Button>
                  <Button variant="danger" size="sm" onClick={() => void handleDelete(r.id)}>Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}

function statusColor(status: MeetingRecording['status']): string {
  switch (status) {
    case 'ready': return colors.semantic.success;
    case 'active': return colors.semantic.warning;
    case 'failed': return colors.semantic.error;
    default: return '#6B7280';
  }
}
