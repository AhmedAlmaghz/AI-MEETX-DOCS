'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

import { Button, radius, spacing, typography } from '@aimeetx/ui';
import type { Meeting, ClassroomSession } from '@aimeetx/sdk';
import type { MeetingId } from '@aimeetx/types';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import { PageHeader, PageLayout, LoadingScreen, EmptyState, StatusBadge } from '@/components/ui';
import { inMemoryStore } from '@/lib/sdk/in-memory-repositories';

export default function ClassroomsPage() {
  ensureSdkInitialized();
  const { palette } = usePalette();
  const [session] = useSession();

  const [meetings, setMeetings] = useState<ReadonlyArray<Meeting>>([]);
  const [sessions, setSessions] = useState<Map<string, ClassroomSession>>(new Map());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<MeetingId | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ListMeetingsUseCase>>(TOKENS.ListMeetingsUseCase).execute({ hostId: session.userId });
      const allMeetings = r.isSuccess ? r.value : [];
      const sessionMap = new Map<string, ClassroomSession>();
      for (const [, s] of inMemoryStore.classroomSessions) sessionMap.set(s.meetingId, s);
      setMeetings(allMeetings);
      setSessions(sessionMap);
    } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = useCallback(async (meetingId: MeetingId) => {
    if (!session) return;
    setCreating(meetingId);
    try {
      await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').CreateClassroomSessionUseCase>>(TOKENS.CreateClassroomSessionUseCase).execute({ input: { meetingId, allowStudentWhiteboard: false }, createdBy: session.userId });
      void load();
    } finally { setCreating(null); }
  }, [session, load]);

  const sorted = useMemo(() => [...meetings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [meetings]);

  if (loading) return <LoadingScreen text="Loading classrooms..." />;

  return (
    <PageLayout>
      <PageHeader
        title="Classrooms"
        subtitle={`${sessions.size} active classroom${sessions.size !== 1 ? 's' : ''} across ${meetings.length} meeting${meetings.length !== 1 ? 's' : ''}`}
      />

      {sorted.length === 0 ? (
        <EmptyState icon="🏫" title="No meetings yet" body="Create a meeting first." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {sorted.map((m) => {
            const cs = sessions.get(m.id);
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <span style={{ fontWeight: 600, color: palette.text }}>{m.title}</span>
                    {cs ? (
                      <StatusBadge status={cs.status === 'active' ? 'success' : cs.status === 'paused' ? 'warning' : 'error'} label={cs.status} />
                    ) : (
                      <StatusBadge status="neutral" label="No classroom" />
                    )}
                  </div>
                  <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, marginTop: 4 }}>{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: spacing.sm, flexShrink: 0 }}>
                  {cs ? (
                    <Link href={`/classroom/${cs.id}`}><Button variant="primary" size="sm">Open classroom</Button></Link>
                  ) : (
                    <Button variant="secondary" size="sm" disabled={creating === m.id} onClick={() => void handleCreate(m.id)}>
                      {creating === m.id ? 'Creating...' : 'Create classroom'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
