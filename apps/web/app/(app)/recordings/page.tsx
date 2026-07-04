'use client';

import { useEffect, useState, useCallback } from 'react';

import { useTheme, Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { MeetingRecording } from '@aimeetx/sdk';
import type { RecordingId } from '@aimeetx/types';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { TOKENS } from '@aimeetx/sdk';

type Palette = {
  readonly background: string;
  readonly surface: string;
  readonly surfaceVariant: string;
  readonly border: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textDisabled: string;
};

export default function RecordingsPage() {
  ensureSdkInitialized();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette: Palette = isDark ? colors.dark : colors.light;

  const [recordings, setRecordings] = useState<ReadonlyArray<MeetingRecording>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').ListRecordingsUseCase>
      >(TOKENS.ListRecordingsUseCase).execute({ meetingId: 'meeting_demo_1' as never });
      if (result.isSuccess) setRecordings(result.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (id: RecordingId) => {
      if (!confirm('Delete this recording permanently?')) return;
      await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').DeleteRecordingUseCase>>(
        TOKENS.DeleteRecordingUseCase,
      ).execute({ actor: { userId: '' as never, role: 'host' }, recordingId: id });
      void load();
    },
    [load],
  );

  const handleDownload = useCallback(async (id: RecordingId) => {
    const result = await resolveUseCase<
      InstanceType<typeof import('@aimeetx/sdk').GetDownloadLinkUseCase>
    >(TOKENS.GetDownloadLinkUseCase).execute({
      actor: { userId: '' as never, role: 'host' },
      recordingId: id,
      expiresInHours: 24,
    });
    if (result.isSuccess) {
      window.alert(`Download URL (24h expiry):\n${result.value.downloadUrl}`);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <header>
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: palette.text,
          }}
        >
          Recordings
        </h1>
        <p style={{ color: palette.textSecondary, marginTop: spacing.xs }}>
          {recordings.length} recording{recordings.length === 1 ? '' : 's'} available
        </p>
      </header>

      {loading ? (
        <p style={{ color: palette.textSecondary }}>Loading recordings...</p>
      ) : recordings.length === 0 ? (
        <div
          style={{
            padding: spacing['2xl'],
            textAlign: 'center',
            color: palette.textSecondary,
            backgroundColor: palette.surface,
            border: `1px dashed ${palette.border}`,
            borderRadius: radius.lg,
          }}
        >
          No recordings yet. Start recording a meeting to see it here.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: spacing.md,
          }}
        >
          {recordings.map((r) => (
            <RecordingCard
              key={r.id}
              recording={r}
              palette={palette}
              onDownload={() => void handleDownload(r.id)}
              onDelete={() => void handleDelete(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordingCard({
  recording,
  palette,
  onDownload,
  onDelete,
}: {
  readonly recording: MeetingRecording;
  readonly palette: Palette;
  readonly onDownload: () => void;
  readonly onDelete: () => void;
}) {
  const isReady = recording.status === 'ready';
  const minutes = recording.durationSeconds ? Math.round(recording.durationSeconds / 60) : null;
  const sizeMB = recording.fileSizeBytes ? (recording.fileSizeBytes / 1024 / 1024).toFixed(1) : null;

  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            padding: `2px ${spacing.xs}`,
            borderRadius: radius.sm,
            backgroundColor: isReady ? colors.semantic.success : colors.semantic.warning,
            color: '#FFFFFF',
            fontSize: typography.fontSize.xs,
            textTransform: 'uppercase',
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          {recording.status}
        </span>
        <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>{recording.layout}</span>
      </div>
      <h3
        style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          color: palette.text,
        }}
      >
        Recording {recording.id.slice(-6)}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.xs,
          fontSize: typography.fontSize.xs,
          color: palette.textSecondary,
        }}
      >
        <span>Duration: {minutes ? `${minutes}m` : '—'}</span>
        <span>Size: {sizeMB ? `${sizeMB} MB` : '—'}</span>
        <span>Started: {new Date(recording.startedAt).toLocaleString()}</span>
        <span>Expires: {recording.expiresAt ? new Date(recording.expiresAt).toLocaleDateString() : '—'}</span>
      </div>
      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
        <Button
          variant="primary"
          size="sm"
          disabled={!isReady}
          onClick={onDownload}
          fullWidth
        >
          Download
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
