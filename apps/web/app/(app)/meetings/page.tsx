'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, type FormEvent } from 'react';

import { useTheme, Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { Meeting } from '@aimeetx/sdk';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';

type Filter = 'all' | 'active' | 'scheduled' | 'ended';

type Palette = {
  readonly background: string;
  readonly surface: string;
  readonly surfaceVariant: string;
  readonly border: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textDisabled: string;
};

export default function MeetingsPage() {
  ensureSdkInitialized();
  const router = useRouter();
  const [session] = useSession();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette: Palette = isDark ? colors.dark : colors.light;

  const [filter, setFilter] = useState<Filter>('all');
  const [meetings, setMeetings] = useState<ReadonlyArray<Meeting>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').ListMeetingsUseCase>
      >(TOKENS.ListMeetingsUseCase).execute({ hostId: session.userId });
      if (result.isSuccess) setMeetings(result.value);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = meetings.filter((m) => (filter === 'all' ? true : m.status === filter));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: palette.text,
            }}
          >
            Meetings
          </h1>
          <p style={{ color: palette.textSecondary, marginTop: spacing.xs }}>
            {meetings.length === 0
              ? 'No meetings yet'
              : `${meetings.length} meeting${meetings.length === 1 ? '' : 's'} total`}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : 'New meeting'}
        </Button>
      </header>

      {showCreate && (
        <CreateMeetingForm
          onClose={() => setShowCreate(false)}
          onCreated={(m) => {
            setShowCreate(false);
            void load();
            router.push(`/meetings/${m.id}`);
          }}
        />
      )}

      <div style={{ display: 'flex', gap: spacing.sm }}>
        {(['all', 'active', 'scheduled', 'ended'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: radius.md,
              border: `1px solid ${filter === f ? colors.brand.primary : palette.border}`,
              backgroundColor: filter === f ? colors.brand.primary : palette.surface,
              color: filter === f ? '#FFFFFF' : palette.text,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: palette.textSecondary }}>Loading meetings...</p>
      ) : filtered.length === 0 ? (
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
          <p>No meetings match the filter.</p>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            Create your first meeting
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: spacing.md,
          }}
        >
          {filtered.map((m) => (
            <MeetingCard key={m.id} meeting={m} palette={palette} />
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, palette }: { readonly meeting: Meeting; readonly palette: Palette }) {
  const statusColor =
    meeting.status === 'active'
      ? colors.semantic.success
      : meeting.status === 'ended'
        ? colors.light.textSecondary
        : colors.brand.primary;

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      style={{
        padding: spacing.lg,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: radius.lg,
        textDecoration: 'none',
        color: palette.text,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            padding: `2px ${spacing.xs}`,
            borderRadius: radius.sm,
            backgroundColor: statusColor,
            color: '#FFFFFF',
            fontSize: typography.fontSize.xs,
            textTransform: 'uppercase',
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          {meeting.status}
        </span>
        <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
          max {meeting.maxParticipants}
        </span>
      </div>
      <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold }}>
        {meeting.title}
      </h3>
      {meeting.description && (
        <p style={{ fontSize: typography.fontSize.sm, color: palette.textSecondary, lineHeight: typography.lineHeight.normal }}>
          {meeting.description}
        </p>
      )}
      <div style={{ marginTop: 'auto', fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
        {meeting.settings.chatEnabled ? 'Chat · ' : ''}
        {meeting.settings.handRaiseEnabled ? 'Hand raise · ' : ''}
        {meeting.settings.allowRecording ? 'Recording' : ''}
      </div>
    </Link>
  );
}

function CreateMeetingForm({
  onClose,
  onCreated,
}: {
  readonly onClose: () => void;
  readonly onCreated: (m: Meeting) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session] = useSession();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').CreateMeetingUseCase>
      >(TOKENS.CreateMeetingUseCase).execute({
        input: {
          title: title.trim(),
          description: description.trim() || undefined,
          hostId: session.userId,
          maxParticipants,
        },
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        onCreated(result.value);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{
        padding: spacing.lg,
        backgroundColor: colors.light.surface,
        border: `1px solid ${colors.light.border}`,
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
    >
      <h2
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.light.text,
        }}
      >
        New meeting
      </h2>
      <label style={labelStyle}>
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        <span>Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
        />
      </label>
      <label style={labelStyle}>
        <span>Max participants</span>
        <input
          type="number"
          min={1}
          max={500}
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
          style={inputStyle}
        />
      </label>
      {error && (
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: '#FEE2E2',
            color: colors.semantic.error,
            border: `1px solid ${colors.semantic.error}`,
            borderRadius: radius.md,
            fontSize: typography.fontSize.sm,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create meeting'}
        </Button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 14,
  color: colors.light.text,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid ${colors.light.border}`,
  fontSize: 14,
  backgroundColor: colors.light.background,
  color: colors.light.text,
};
