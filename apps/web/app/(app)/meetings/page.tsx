'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { Meeting } from '@aimeetx/sdk';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import {
  PageHeader, FilterBar, SearchInput, PageLayout, LoadingScreen, EmptyState,
} from '@/components/ui';

type Filter = 'all' | 'active' | 'scheduled' | 'ended';

const FILTERS: ReadonlyArray<Filter> = ['all', 'active', 'scheduled', 'ended'];

export default function MeetingsPage() {
  ensureSdkInitialized();
  const router = useRouter();
  const [session] = useSession();
  const { palette } = usePalette();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [meetings, setMeetings] = useState<ReadonlyArray<Meeting>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ListMeetingsUseCase>>(
        TOKENS.ListMeetingsUseCase,
      ).execute({ hostId: session.userId });
      if (result.isSuccess) setMeetings(result.value);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return meetings
      .filter((m) => (filter === 'all' ? true : m.status === filter))
      .filter((m) => !q || m.title.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [meetings, filter, search]);

  const filterOptions = useMemo(() => {
    const counts: Record<string, number> = { all: meetings.length };
    for (const f of FILTERS) if (f !== 'all') counts[f] = meetings.filter((m) => m.status === f).length;
    return FILTERS.map((f) => ({ value: f, count: counts[f] }));
  }, [meetings]);

  if (loading) return <LoadingScreen text="Loading meetings..." />;

  return (
    <PageLayout>
      <PageHeader
        title="Meetings"
        subtitle={meetings.length === 0 ? 'No meetings yet' : `${meetings.length} meeting${meetings.length === 1 ? '' : 's'} total`}
        actions={
          <Button variant="primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : 'New meeting'}
          </Button>
        }
      />

      {showCreate && (
        <CreateMeetingForm
          palette={palette}
          onClose={() => setShowCreate(false)}
          onCreated={(m) => {
            setShowCreate(false);
            void load();
            router.push(`/meetings/${m.id}`);
          }}
        />
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterBar options={filterOptions} selected={filter} onChange={(v) => setFilter(v)} />
        <div style={{ flex: 1, minWidth: 200, maxWidth: 320, marginLeft: 'auto' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search meetings..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title={search ? 'No meetings match your search.' : 'No meetings here yet.'}
          action={
            <Button variant="secondary" onClick={() => setShowCreate(true)}>
              {meetings.length === 0 ? 'Create your first meeting' : 'Create a new meeting'}
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

function MeetingCard({ meeting }: { readonly meeting: Meeting }) {
  const { palette, isDark } = usePalette();
  const statusColor = meeting.status === 'active' ? colors.semantic.success
    : meeting.status === 'scheduled' ? colors.semantic.info
    : palette.textSecondary;

  const date = new Date(meeting.createdAt);
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

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
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ padding: `2px ${spacing.xs}`, borderRadius: radius.sm, backgroundColor: statusColor, color: '#FFFFFF', fontSize: typography.fontSize.xs, textTransform: 'uppercase', fontWeight: typography.fontWeight.semibold }}>
          {meeting.status}
        </span>
        <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>{dateStr}</span>
      </div>
      <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, margin: 0 }}>{meeting.title}</h3>
      {meeting.description && (
        <p style={{ fontSize: typography.fontSize.sm, color: palette.textSecondary, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {meeting.description}
        </p>
      )}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
        <span>
          {['Chat', 'Hand raise', 'Recording'].filter((_, i) => [meeting.settings.chatEnabled, meeting.settings.handRaiseEnabled, meeting.settings.allowRecording][i]).join(' · ') || 'No features'}
        </span>
        <span>max {meeting.maxParticipants}</span>
      </div>
    </Link>
  );
}

function CreateMeetingForm({
  palette, onClose, onCreated,
}: {
  readonly palette: ReturnType<typeof usePalette>['palette'];
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
    if (!title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const result = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').CreateMeetingUseCase>>(
        TOKENS.CreateMeetingUseCase,
      ).execute({ input: { title: title.trim(), description: description.trim() || undefined, hostId: session.userId, maxParticipants } });
      if (result.isFailure) setError(result.error.message);
      else onCreated(result.value);
    } finally { setSubmitting(false); }
  };

  const inputBase: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: radius.md,
    border: `1px solid ${palette.border}`,
    fontSize: typography.fontSize.sm,
    backgroundColor: palette.background,
    color: palette.text,
    outline: 'none',
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: spacing.lg, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: palette.text, margin: 0 }}>New meeting</h2>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: typography.fontSize.sm, color: palette.text }}>
        <span>Title</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputBase} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: typography.fontSize.sm, color: palette.text }}>
        <span>Description (optional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputBase, minHeight: 80, resize: 'vertical' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: typography.fontSize.sm, color: palette.text }}>
        <span>Max participants</span>
        <input type="number" min={1} max={500} value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} style={inputBase} />
      </label>
      {error && <div style={{ padding: spacing.sm, backgroundColor: '#FEE2E2', color: colors.semantic.error, border: `1px solid ${colors.semantic.error}`, borderRadius: radius.md, fontSize: typography.fontSize.sm }}>{error}</div>}
      <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create meeting'}</Button>
      </div>
    </form>
  );
}
