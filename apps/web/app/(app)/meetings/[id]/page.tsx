'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, type FormEvent } from 'react';

import { useTheme, Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { Meeting, Participant } from '@aimeetx/sdk';
import type { MeetingId, ParticipantId, ConversationId } from '@aimeetx/types';

import { resolveUseCase } from '@/lib/sdk/bootstrap';
import { useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';

interface RoomState {
  readonly meeting: Meeting | null;
  readonly participants: ReadonlyArray<Participant>;
  readonly myParticipant: Participant | null;
  readonly loading: boolean;
  readonly error: string | null;
}

export default function MeetingRoomPage() {
  const params = useParams<{ id: string }>();
  const meetingId = (params?.id ?? '') as MeetingId;
  const router = useRouter();
  const [session] = useSession();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette = isDark ? colors.dark : colors.light;

  const [state, setState] = useState<RoomState>({
    meeting: null,
    participants: [],
    myParticipant: null,
    loading: true,
    error: null,
  });
  const [chatMessage, setChatMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const loadRoom = useCallback(async () => {
    if (!session || !meetingId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const meetingResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').GetMeetingUseCase>
      >(TOKENS.GetMeetingUseCase).execute({ meetingId });
      if (meetingResult.isFailure || !meetingResult.value) {
        setState((s) => ({ ...s, loading: false, error: 'Meeting not found' }));
        return;
      }
      const meeting = meetingResult.value;

      const participantsResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').ListParticipantsUseCase>
      >(TOKENS.ListParticipantsUseCase).execute({ meetingId });
      const participants = participantsResult.isSuccess ? participantsResult.value : [];

      // Find the current user's participant entry
      let myParticipant: Participant | null =
        participants.find((p) => p.userId === session.userId) ?? null;

      // If the user is not yet a participant (e.g., just opened the room), join
      if (!myParticipant) {
        const joinResult = await resolveUseCase<
          InstanceType<typeof import('@aimeetx/sdk').JoinMeetingUseCase>
        >(TOKENS.JoinMeetingUseCase).execute({
          input: {
            meetingId,
            userId: session.userId,
            displayName: session.userId,
          },
        });
        if (joinResult.isSuccess) {
          myParticipant = joinResult.value;
        }
      }

      // Reload participants after join
      const finalParticipantsResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').ListParticipantsUseCase>
      >(TOKENS.ListParticipantsUseCase).execute({ meetingId });
      const finalParticipants = finalParticipantsResult.isSuccess ? finalParticipantsResult.value : participants;

      setState({
        meeting,
        participants: finalParticipants,
        myParticipant:
          finalParticipants.find((p) => p.userId === session.userId) ?? myParticipant,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load meeting',
      }));
    }
  }, [meetingId, session]);

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  const handleStart = useCallback(async () => {
    if (!session || !state.meeting) return;
    const result = await resolveUseCase<
      InstanceType<typeof import('@aimeetx/sdk').StartMeetingUseCase>
    >(TOKENS.StartMeetingUseCase).execute({
      meetingId: state.meeting.id,
      startedBy: session.userId,
    });
    if (result.isSuccess) {
      setState((s) => ({ ...s, meeting: result.value }));
    }
  }, [session, state.meeting]);

  const handleEnd = useCallback(async () => {
    if (!session || !state.meeting) return;
    const result = await resolveUseCase<
      InstanceType<typeof import('@aimeetx/sdk').EndMeetingUseCase>
    >(TOKENS.EndMeetingUseCase).execute({
      meetingId: state.meeting.id,
      endedBy: session.userId,
    });
    if (result.isSuccess) {
      setState((s) => ({ ...s, meeting: result.value }));
      router.push('/meetings');
    }
  }, [session, state.meeting, router]);

  const handleToggleMute = useCallback(async () => {
    if (!state.myParticipant) return;
    const next = !state.myParticipant.isMuted;
    await resolveUseCase<
      InstanceType<typeof import('@aimeetx/sdk').MuteParticipantUseCase>
    >(TOKENS.MuteParticipantUseCase).execute({
      participantId: state.myParticipant.id,
      muted: next,
      mutedBy: state.myParticipant.id,
    });
    void loadRoom();
  }, [state.myParticipant, loadRoom]);

  const handleToggleHand = useCallback(async () => {
    if (!state.myParticipant) return;
    const next = !state.myParticipant.isHandRaised;
    if (next) {
      const useCase = resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').RaiseHandUseCase>>(TOKENS.RaiseHandUseCase);
      await useCase.execute({ participantId: state.myParticipant.id });
    } else {
      const useCase = resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').LowerHandUseCase>>(TOKENS.LowerHandUseCase);
      await useCase.execute({ participantId: state.myParticipant.id, loweredBy: state.myParticipant.id });
    }
    void loadRoom();
  }, [state.myParticipant, loadRoom]);

  const handleMuteParticipant = useCallback(
    async (participantId: ParticipantId) => {
      if (!state.myParticipant) return;
      await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').MuteParticipantUseCase>
      >(TOKENS.MuteParticipantUseCase).execute({
        participantId,
        muted: true,
        mutedBy: state.myParticipant.id,
      });
      void loadRoom();
    },
    [state.myParticipant, loadRoom],
  );

  const handleSendChat = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const text = chatMessage.trim();
      if (!text || !session) return;

      // Get or create meeting conversation
      const convResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').ListConversationsUseCase>
      >(TOKENS.ListConversationsUseCase).execute({ userId: session.userId });
      let conversationId: ConversationId | null = null;
      const found = convResult.isSuccess
        ? convResult.value.find((c) => c.meetingId === meetingId)
        : null;
      if (found) conversationId = found.id;
      if (!conversationId) {
        const createResult = await resolveUseCase<
          InstanceType<typeof import('@aimeetx/sdk').CreateConversationUseCase>
        >(TOKENS.CreateConversationUseCase).execute({
          input: {
            meetingId,
            type: 'meeting',
            name: `Meeting ${meetingId}`,
            createdBy: session.userId,
            participantIds: [session.userId],
          },
        });
        if (createResult.isSuccess) conversationId = createResult.value.id;
      }
      if (!conversationId) return;

      await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').SendMessageUseCase>>(
        TOKENS.SendMessageUseCase,
      ).execute({
        input: {
          conversationId,
          senderId: session.userId,
          senderDisplayName: session.userId,
          content: text,
          type: 'text',
        },
      });
      setChatMessage('');
    },
    [chatMessage, session, meetingId],
  );

  const handleToggleRecording = useCallback(async () => {
    if (!state.meeting || !state.myParticipant) return;
    if (!isRecording) {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').StartRecordingUseCase>
      >(TOKENS.StartRecordingUseCase).execute({
        actor: { userId: session?.userId as never, role: 'host' },
        input: {
          meetingId: state.meeting.id,
          hostId: state.myParticipant.id,
          layout: 'speaker_view',
          roomName: state.meeting.livekitRoomName ?? `room_${state.meeting.id}`,
          storageBucket: 'recordings',
        },
        meeting: state.meeting,
      });
      if (result.isSuccess) setIsRecording(true);
    } else {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').StopRecordingUseCase>
      >(TOKENS.StopRecordingUseCase).execute({
        actor: { userId: session?.userId as never, role: 'host' },
        meetingId: state.meeting.id,
        recordingId: `rec_${state.meeting.id}` as never,
        stoppedBy: state.myParticipant.id,
      });
      if (result.isSuccess) setIsRecording(false);
    }
  }, [state.meeting, state.myParticipant, isRecording, session]);

  if (state.loading) {
    return <p style={{ color: palette.textSecondary }}>Loading meeting...</p>;
  }

  if (state.error || !state.meeting) {
    return (
      <div
        style={{
          padding: spacing.lg,
          backgroundColor: '#FEE2E2',
          color: colors.semantic.error,
          border: `1px solid ${colors.semantic.error}`,
          borderRadius: radius.md,
        }}
      >
        {state.error ?? 'Meeting not found'}
      </div>
    );
  }

  const meeting = state.meeting;
  const myParticipant = state.myParticipant;
  const isHost = myParticipant?.role === 'host' || myParticipant?.role === 'co_host';
  const canStart = isHost && meeting.status === 'scheduled';
  const canEnd = isHost && (meeting.status === 'active' || meeting.status === 'scheduled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, height: 'calc(100vh - 60px - 4rem)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          backgroundColor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: radius.lg,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: palette.text,
            }}
          >
            {meeting.title}
          </h1>
          <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, marginTop: 4 }}>
            Status: <strong>{meeting.status}</strong> · {state.participants.length} participant
            {state.participants.length === 1 ? '' : 's'} · Recording: {isRecording ? 'ON' : 'off'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {canStart && (
            <Button variant="primary" onClick={() => void handleStart()}>
              Start meeting
            </Button>
          )}
          {canEnd && (
            <Button variant="danger" onClick={() => void handleEnd()}>
              End meeting
            </Button>
          )}
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: spacing.lg,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gridAutoRows: 'minmax(140px, auto)',
              gap: spacing.md,
              padding: spacing.md,
              backgroundColor: '#000000',
              borderRadius: radius.lg,
              minHeight: 0,
              overflow: 'auto',
            }}
          >
            {state.participants.map((p) => (
              <ParticipantTile key={p.id} participant={p} isDark={isDark} />
            ))}
            {state.participants.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF80',
                }}
              >
                Waiting for participants to join...
              </div>
            )}
          </div>

          {myParticipant && (
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                padding: spacing.md,
                backgroundColor: palette.surface,
                border: `1px solid ${palette.border}`,
                borderRadius: radius.lg,
              }}
            >
              <Button
                variant={myParticipant.isMuted ? 'danger' : 'primary'}
                onClick={() => void handleToggleMute()}
              >
                {myParticipant.isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                variant={myParticipant.isHandRaised ? 'primary' : 'secondary'}
                onClick={() => void handleToggleHand()}
              >
                {myParticipant.isHandRaised ? 'Lower hand ✋' : 'Raise hand ✋'}
              </Button>
              <Button
                variant={isRecording ? 'danger' : 'secondary'}
                onClick={() => void handleToggleRecording()}
              >
                {isRecording ? 'Stop recording' : 'Start recording'}
              </Button>
            </div>
          )}
        </div>

        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: radius.lg,
            padding: spacing.md,
            minHeight: 0,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.md,
              color: palette.text,
            }}
          >
            Participants ({state.participants.length})
          </h2>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              marginBottom: spacing.md,
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {state.participants.map((p) => (
              <li
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.xs,
                  borderRadius: radius.sm,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  fontSize: typography.fontSize.sm,
                  color: palette.text,
                }}
              >
                <span>
                  {p.displayName} {p.isHandRaised ? '✋' : ''}
                  <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, marginLeft: 4 }}>
                    {p.role}
                  </span>
                </span>
                {isHost && p.id !== myParticipant?.id && (
                  <button
                    type="button"
                    onClick={() => void handleMuteParticipant(p.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.semantic.error,
                      fontSize: typography.fontSize.xs,
                    }}
                  >
                    Mute
                  </button>
                )}
              </li>
            ))}
          </ul>

          <h2
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.sm,
              color: palette.text,
            }}
          >
            Chat
          </h2>
          <form
            onSubmit={(e) => void handleSendChat(e)}
            style={{ display: 'flex', gap: spacing.xs }}
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: radius.md,
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.background,
                color: palette.text,
                fontSize: typography.fontSize.sm,
              }}
            />
            <Button type="submit" variant="primary" size="sm">
              Send
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function ParticipantTile({
  participant,
  isDark,
}: {
  readonly participant: Participant;
  readonly isDark: boolean;
}) {
  const initials = participant.displayName.charAt(0).toUpperCase();
  return (
    <div
      style={{
        backgroundColor: '#1F2937',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        color: '#FFFFFF',
        position: 'relative',
        minHeight: 140,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: isDark ? '#374151' : '#4B5563',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 600,
          marginBottom: spacing.sm,
        }}
      >
        {initials}
      </div>
      <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
        {participant.displayName}
      </span>
      <span style={{ fontSize: typography.fontSize.xs, color: '#9CA3AF' }}>{participant.role}</span>
      <div style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, display: 'flex', gap: 4 }}>
        {participant.isMuted && <span title="Muted">🔇</span>}
        {participant.isHandRaised && <span title="Hand raised">✋</span>}
        {participant.isScreenSharing && <span title="Sharing">🖥️</span>}
      </div>
    </div>
  );
}
