'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef, type FormEvent } from 'react';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { Meeting, Message, Participant, ClassroomSession, Quiz } from '@aimeetx/sdk';
import type { MeetingId, ParticipantId, ConversationId, QuizId } from '@aimeetx/types';

import { resolveUseCase } from '@/lib/sdk/bootstrap';
import { useCurrentProfile, useSession } from '@/lib/sdk/hooks';
import { usePalette, type Palette } from '@/lib/hooks/use-palette';
import { useEventBus } from '@/lib/sdk/use-event-bus';
import { TOKENS } from '@aimeetx/sdk';
import AiPanel from '@/components/ai-panel';
import Whiteboard from '@/components/whiteboard';
import { inMemoryStore } from '@/lib/sdk/in-memory-repositories';

type SidebarTab = 'participants' | 'chat' | 'ai' | 'board' | 'classroom';

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
  const { profile } = useCurrentProfile();
  const { isDark, palette } = usePalette();

  const [state, setState] = useState<RoomState>({
    meeting: null,
    participants: [],
    myParticipant: null,
    loading: true,
    error: null,
  });
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ReadonlyArray<Message>>([]);
  const [conversationId, setConversationId] = useState<ConversationId | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [classroomSession, setClassroomSession] = useState<ClassroomSession | null>(null);
  const [classroomQuizzes, setClassroomQuizzes] = useState<ReadonlyArray<Quiz>>([]);
  const [classroomCreating, setClassroomCreating] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chat');
  const [elapsed, setElapsed] = useState('00:00');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerResult, setAnswerResult] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
            displayName: profile?.displayName ?? session.userId,
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

      const csResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').GetClassroomSessionByMeetingUseCase>
      >(TOKENS.GetClassroomSessionByMeetingUseCase).execute({ meetingId });
      if (csResult.isSuccess) {
        setClassroomSession(csResult.value);
        const qs: Quiz[] = [];
        for (const [, q] of inMemoryStore.quizzes) {
          if (csResult.value && q.classroomSessionId === csResult.value.id) qs.push(q);
        }
        setClassroomQuizzes(qs);
      }

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
  }, [meetingId, session, profile]);

  const loadMessages = useCallback(async () => {
    const cid = conversationId;
    if (!cid) return;
    const result = await resolveUseCase<
      InstanceType<typeof import('@aimeetx/sdk').ListMessagesUseCase>
    >(TOKENS.ListMessagesUseCase).execute({ conversationId: cid });
    if (result.isSuccess) {
      setMessages(result.value);
    }
  }, [conversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const simulateParticipants = useCallback(async () => {
    if (!session || !meetingId || !state.meeting) return;
    const existing = await resolveUseCase<
      InstanceType<typeof import('@aimeetx/sdk').ListParticipantsUseCase>
    >(TOKENS.ListParticipantsUseCase).execute({ meetingId });
    const count = existing.isSuccess ? existing.value.length : 0;
    if (count >= 3) return;
    const mockNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    for (let i = count; i < Math.min(3, mockNames.length); i++) {
      const joinResult = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').JoinMeetingUseCase>
      >(TOKENS.JoinMeetingUseCase).execute({
        input: {
          meetingId,
          userId: `mock_user_${i}` as never,
          displayName: mockNames[i] ?? 'User',
        },
      });
      if (joinResult.isSuccess) {
        if (i % 2 === 0) {
          const muteUseCase = resolveUseCase<
            InstanceType<typeof import('@aimeetx/sdk').MuteParticipantUseCase>
          >(TOKENS.MuteParticipantUseCase);
          await muteUseCase.execute({
            participantId: joinResult.value.id,
            muted: true,
            mutedBy: joinResult.value.id,
          });
        }
      }
    }
    void loadRoom();
  }, [session, meetingId, state.meeting, loadRoom]);

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    if (state.meeting && state.participants.length <= 1) {
      void simulateParticipants();
    }
  }, [state.meeting, state.participants.length, simulateParticipants]);

  useEffect(() => {
    if (conversationId) {
      void loadMessages();
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => void loadMessages(), 5000);
    return () => clearInterval(interval);
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!state.meeting || state.meeting.status !== 'active') return;
    const start = Date.now();
    const tick = () => {
      const sec = Math.floor((Date.now() - start) / 1000);
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      setElapsed(`${m}:${s}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [state.meeting]);

  useEffect(() => {
    if (!classroomSession) return;
    const poll = () => {
      const qs: Quiz[] = [];
      for (const [, q] of inMemoryStore.quizzes) {
        if (q.classroomSessionId === classroomSession.id) qs.push(q);
      }
      setClassroomQuizzes(qs);
      const active = qs.find((q) => q.status === 'active');
      if (active && active.id !== activeQuiz?.id) {
        setActiveQuiz(active);
        setSelectedOption(null);
        setAnswerResult(null);
      }
      if (!active) {
        setActiveQuiz(null);
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [classroomSession, activeQuiz?.id]);

  useEventBus<{ eventType: 'QuizActivated'; quizId: QuizId }>(
    'QuizActivated',
    () => {
      if (!classroomSession) return;
      const active = [...inMemoryStore.quizzes.values()].find(
        (q) => q.classroomSessionId === classroomSession.id && q.status === 'active',
      );
      if (active) {
        setActiveQuiz(active);
        setSelectedOption(null);
        setAnswerResult(null);
      }
    },
  );

  useEventBus<{ eventType: 'QuizClosed'; quizId: QuizId }>(
    'QuizClosed',
    () => {
      setActiveQuiz(null);
      setSelectedOption(null);
      setAnswerResult(null);
    },
  );

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

  const getOrCreateConversation = useCallback(async (): Promise<ConversationId | null> => {
    if (!session) return null;
    const convResult = await resolveUseCase<
      InstanceType<typeof import('@aimeetx/sdk').ListConversationsUseCase>
    >(TOKENS.ListConversationsUseCase).execute({ userId: session.userId });
    const found = convResult.isSuccess
      ? convResult.value.find((c) => c.meetingId === meetingId)
      : null;
    if (found) return found.id;

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
    return createResult.isSuccess ? createResult.value.id : null;
  }, [session, meetingId]);

  const handleSendChat = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const text = chatMessage.trim();
      if (!text || !session) return;

      const cid = conversationId ?? (await getOrCreateConversation());
      if (!cid) return;
      if (!conversationId) setConversationId(cid);

      const displayName = profile?.displayName ?? session.userId;
      await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').SendMessageUseCase>>(
        TOKENS.SendMessageUseCase,
      ).execute({
        input: {
          conversationId: cid,
          senderId: session.userId,
          senderDisplayName: displayName,
          content: text,
          type: 'text',
        },
      });
      setChatMessage('');
      void loadMessages();
    },
    [chatMessage, session, profile, conversationId, getOrCreateConversation, loadMessages],
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

  const handleCopyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href);
  }, []);

  const handleSubmitAnswer = useCallback(async () => {
    if (!activeQuiz || !selectedOption || !state.myParticipant) return;
    setSubmittingAnswer(true);
    setAnswerResult(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').SubmitQuizResponseUseCase>
      >(TOKENS.SubmitQuizResponseUseCase).execute({
        quizId: activeQuiz.id,
        participantId: state.myParticipant.id,
        selectedOptionId: selectedOption,
      });
      if (result.isSuccess) {
        setAnswerResult('submitted');
        setActiveQuiz(null);
      } else {
        setAnswerResult(result.error.message);
      }
    } catch {
      setAnswerResult('Failed to submit answer');
    } finally {
      setSubmittingAnswer(false);
    }
  }, [activeQuiz, selectedOption, state.myParticipant]);

  const handleCreateClassroomSession = useCallback(async () => {
    if (!session || !state.meeting) return;
    setClassroomCreating(true);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').CreateClassroomSessionUseCase>
      >(TOKENS.CreateClassroomSessionUseCase).execute({
        input: { meetingId, allowStudentWhiteboard: false },
        createdBy: session.userId,
      });
      if (result.isSuccess) setClassroomSession(result.value);
    } finally {
      setClassroomCreating(false);
    }
  }, [session, state.meeting, meetingId]);

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
  const statusColor =
    meeting.status === 'active' ? colors.semantic.success
    : meeting.status === 'scheduled' ? colors.semantic.info
    : meeting.status === 'ended' ? colors.semantic.error
    : palette.textSecondary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, height: 'calc(100vh - 60px - 4rem)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing.md} ${spacing.lg}`,
          backgroundColor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: radius.lg,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  display: 'inline-block',
                }}
              />
              <h1
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.semibold,
                  color: palette.text,
                  margin: 0,
                }}
              >
                {meeting.title}
              </h1>
            </div>
            <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, marginTop: 4, margin: 0 }}>
              {meeting.status === 'active' && <>{elapsed} · </>}
              {state.participants.length} participant{state.participants.length === 1 ? '' : 's'}
              {isRecording && <> · <span style={{ color: colors.semantic.error }}>● Recording</span></>}
            </p>
          </div>
          {meeting.description && (
            <p style={{ fontSize: typography.fontSize.sm, color: palette.textSecondary, maxWidth: 300, margin: 0 }}>
              {meeting.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            Copy link
          </Button>
          {canStart && (
            <Button variant="primary" onClick={() => void handleStart()}>
              Start
            </Button>
          )}
          {canEnd && (
            <Button variant="danger" onClick={() => void handleEnd()}>
              End
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push('/meetings')}>
            Leave
          </Button>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gridAutoRows: 'minmax(140px, auto)',
              gap: spacing.md,
              padding: spacing.md,
              backgroundColor: '#000000',
              borderRadius: radius.lg,
              minHeight: 0,
              overflow: 'auto',
              alignContent: 'start',
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
                  fontSize: typography.fontSize.sm,
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
                flexShrink: 0,
              }}
            >
              <Button
                variant={myParticipant.isMuted ? 'danger' : 'primary'}
                size="sm"
                onClick={() => void handleToggleMute()}
              >
                {myParticipant.isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                variant={myParticipant.isHandRaised ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => void handleToggleHand()}
              >
                {myParticipant.isHandRaised ? 'Lower hand' : 'Raise hand'} ✋
              </Button>
              <Button
                variant={isRecording ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => void handleToggleRecording()}
              >
                {isRecording ? 'Stop rec' : 'Record'}
              </Button>
            </div>
          )}
        </div>

        <SidebarPanel
            sidebarTab={sidebarTab}
            setSidebarTab={setSidebarTab}
            participants={state.participants}
            messages={messages}
            chatMessage={chatMessage}
            setChatMessage={setChatMessage}
            handleSendChat={handleSendChat}
            classroomSession={classroomSession}
            classroomQuizzes={classroomQuizzes}
            classroomCreating={classroomCreating}
            handleCreateClassroomSession={handleCreateClassroomSession}
            activeQuiz={activeQuiz}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            submittingAnswer={submittingAnswer}
            answerResult={answerResult}
            setAnswerResult={setAnswerResult}
            handleSubmitAnswer={handleSubmitAnswer}
            isHost={isHost}
            myParticipant={myParticipant}
            handleMuteParticipant={handleMuteParticipant}
            meetingId={meetingId}
            meeting={meeting}
            messagesEndRef={messagesEndRef}
            session={session}
            isDark={isDark}
            palette={palette}
          />
      </div>
    </div>
  );
}

function SidebarPanel({
  sidebarTab, setSidebarTab,
  participants, messages, chatMessage, setChatMessage, handleSendChat,
  classroomSession, classroomQuizzes, classroomCreating, handleCreateClassroomSession,
  activeQuiz, selectedOption, setSelectedOption, submittingAnswer, answerResult, setAnswerResult, handleSubmitAnswer,
  isHost, myParticipant, handleMuteParticipant,
  meetingId, meeting, messagesEndRef, session, isDark, palette,
}: {
  readonly sidebarTab: SidebarTab;
  readonly setSidebarTab: (tab: SidebarTab) => void;
  readonly participants: ReadonlyArray<Participant>;
  readonly messages: ReadonlyArray<Message>;
  readonly chatMessage: string;
  readonly setChatMessage: (v: string) => void;
  readonly handleSendChat: (e: FormEvent) => void | Promise<void>;
  readonly classroomSession: ClassroomSession | null;
  readonly classroomQuizzes: ReadonlyArray<Quiz>;
  readonly classroomCreating: boolean;
  readonly handleCreateClassroomSession: () => void | Promise<void>;
  readonly activeQuiz: Quiz | null;
  readonly selectedOption: string | null;
  readonly setSelectedOption: (v: string | null) => void;
  readonly submittingAnswer: boolean;
  readonly answerResult: string | null;
  readonly setAnswerResult: (v: string | null) => void;
  readonly handleSubmitAnswer: () => void | Promise<void>;
  readonly isHost: boolean;
  readonly myParticipant: Participant | null;
  readonly handleMuteParticipant: (id: ParticipantId) => void | Promise<void>;
  readonly meetingId: MeetingId;
  readonly meeting: Meeting;
  readonly messagesEndRef: { readonly current: HTMLDivElement | null };
  readonly session: { readonly userId: string } | null;
  readonly isDark: boolean;
  readonly palette: Palette;
}) {
  const tabs: { key: SidebarTab; label: string; onClick?: () => void }[] = [
    { key: 'participants', label: `Participants (${participants.length})` },
    { key: 'chat', label: 'Chat' },
    { key: 'ai', label: 'AI' },
    { key: 'board', label: 'Board' },
    {
      key: 'classroom', label: 'Class',
      onClick: () => { if (!classroomSession && meeting) void handleCreateClassroomSession(); },
    },
  ];

  return (
    <aside
      style={{
        display: 'flex', flexDirection: 'column', backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`, borderRadius: radius.lg, minHeight: 0, overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', borderBottom: `1px solid ${palette.border}`, flexShrink: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key} type="button"
            onClick={() => { setSidebarTab(t.key); t.onClick?.(); }}
            style={tabButtonStyle(t.key === sidebarTab, palette.text, palette.textSecondary)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: spacing.md }}>
        {sidebarTab === 'participants' ? (
          <ParticipantsPanel participants={participants} isHost={isHost} myParticipant={myParticipant} handleMuteParticipant={handleMuteParticipant} isDark={isDark} palette={palette} />
        ) : sidebarTab === 'board' ? (
          <Whiteboard isDark={isDark} palette={palette} />
        ) : sidebarTab === 'classroom' ? (
          <ClassroomPanel
            classroomSession={classroomSession} classroomCreating={classroomCreating}
            handleCreateClassroomSession={handleCreateClassroomSession}
            classroomQuizzes={classroomQuizzes} activeQuiz={activeQuiz}
            selectedOption={selectedOption} setSelectedOption={setSelectedOption}
            submittingAnswer={submittingAnswer} answerResult={answerResult}
            setAnswerResult={setAnswerResult}
            handleSubmitAnswer={handleSubmitAnswer} isDark={isDark} palette={palette}
          />
        ) : sidebarTab === 'ai' ? (
          <AiPanel meetingId={meetingId} isDark={isDark} palette={palette} />
        ) : (
          <ChatPanel
            messages={messages} session={session} chatMessage={chatMessage}
            setChatMessage={setChatMessage} handleSendChat={handleSendChat}
            messagesEndRef={messagesEndRef} isDark={isDark} palette={palette}
          />
        )}
      </div>
    </aside>
  );
}

function tabButtonStyle(active: boolean, text: string, textSecondary: string): React.CSSProperties {
  return {
    flex: 1, padding: `${spacing.sm} ${spacing.md}`, background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.normal,
    color: active ? text : textSecondary,
    borderBottom: active ? `2px solid ${colors.semantic.info}` : '2px solid transparent',
  };
}

function ParticipantsPanel({
  participants, isHost, myParticipant, handleMuteParticipant, isDark, palette,
}: {
  readonly participants: ReadonlyArray<Participant>;
  readonly isHost: boolean;
  readonly myParticipant: Participant | null;
  readonly handleMuteParticipant: (id: ParticipantId) => void | Promise<void>;
  readonly isDark: boolean;
  readonly palette: Palette;
}) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: spacing.xs, overflow: 'auto' }}>
      {participants.map((p) => (
        <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', fontSize: typography.fontSize.sm, color: palette.text }}>
          <span>
            {p.displayName} {p.isHandRaised ? '✋' : ''}
            <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, marginLeft: 4 }}>{p.role}</span>
          </span>
          {isHost && p.id !== myParticipant?.id && (
            <button type="button" onClick={() => void handleMuteParticipant(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.semantic.error, fontSize: typography.fontSize.xs }}>Mute</button>
          )}
        </li>
      ))}
      {participants.length === 0 && (
        <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs, textAlign: 'center', padding: spacing.md }}>No participants yet</p>
      )}
    </ul>
  );
}

function ChatPanel({
  messages, session, chatMessage, setChatMessage, handleSendChat, messagesEndRef, isDark, palette,
}: {
  readonly messages: ReadonlyArray<Message>;
  readonly session: { readonly userId: string } | null;
  readonly chatMessage: string;
  readonly setChatMessage: (v: string) => void;
  readonly handleSendChat: (e: FormEvent) => void | Promise<void>;
  readonly messagesEndRef: { readonly current: HTMLDivElement | null };
  readonly isDark: boolean;
  readonly palette: Palette;
}) {
  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.sm, padding: spacing.xs }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', fontSize: typography.fontSize.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontWeight: typography.fontWeight.semibold, color: msg.senderId === session?.userId ? colors.semantic.info : palette.text, fontSize: typography.fontSize.xs }}>
                {msg.senderDisplayName}
              </span>
              <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span style={{ color: palette.text }}>{msg.content}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs, textAlign: 'center', padding: spacing.md }}>No messages yet</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={(e) => void handleSendChat(e)} style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
        <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type a message..."
          style={{ flex: 1, padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm }}
        />
        <Button type="submit" variant="primary" size="sm">Send</Button>
      </form>
    </>
  );
}

function ClassroomPanel({
  classroomSession, classroomCreating, handleCreateClassroomSession,
  classroomQuizzes, activeQuiz, selectedOption, setSelectedOption,
  submittingAnswer, answerResult, setAnswerResult, handleSubmitAnswer, isDark, palette,
}: {
  readonly classroomSession: ClassroomSession | null;
  readonly classroomCreating: boolean;
  readonly handleCreateClassroomSession: () => void | Promise<void>;
  readonly classroomQuizzes: ReadonlyArray<Quiz>;
  readonly activeQuiz: Quiz | null;
  readonly selectedOption: string | null;
  readonly setSelectedOption: (v: string | null) => void;
  readonly submittingAnswer: boolean;
  readonly answerResult: string | null;
  readonly handleSubmitAnswer: () => void | Promise<void>;
  readonly setAnswerResult: (v: string | null) => void;
  readonly isDark: boolean;
  readonly palette: Palette;
}) {
  if (!classroomSession) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: spacing.sm, padding: spacing.lg }}>
        <p style={{ fontSize: typography.fontSize.sm, color: palette.textSecondary, textAlign: 'center' }}>
          {classroomCreating ? 'Creating classroom session...' : 'No classroom session for this meeting.'}
        </p>
        {!classroomCreating && (
          <Button variant="primary" size="sm" onClick={() => void handleCreateClassroomSession()}>Create classroom</Button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: palette.text, textTransform: 'capitalize' }}>{classroomSession.status}</span>
        <a href={`/classroom/${classroomSession.id}`} style={{ fontSize: typography.fontSize.xs, color: colors.brand.primary, textDecoration: 'none' }}>Full view →</a>
      </div>
      <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, margin: 0 }}>
        {classroomQuizzes.length} quiz{classroomQuizzes.length !== 1 ? 'zes' : ''} · {classroomSession.breakoutRooms.length} breakout room{classroomSession.breakoutRooms.length !== 1 ? 's' : ''}
      </p>

      {activeQuiz && answerResult !== 'submitted' && (
        <div style={{ padding: spacing.sm, border: `2px solid ${colors.semantic.warning}`, borderRadius: radius.md, backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)' }}>
          <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: palette.text, margin: '0 0 8px' }}>🎯 Live Quiz: {activeQuiz.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeQuiz.options.map((o) => {
              const isSelected = selectedOption === o.id;
              return (
                <button key={o.id} type="button" onClick={() => { setSelectedOption(o.id); setAnswerResult(null); }} disabled={submittingAnswer}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm,
                    border: `2px solid ${isSelected ? colors.semantic.info : palette.border}`,
                    backgroundColor: isSelected ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)') : 'transparent',
                    color: palette.text, cursor: submittingAnswer ? 'not-allowed' : 'pointer', fontSize: typography.fontSize.sm, textAlign: 'left',
                  }}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <Button variant="primary" size="sm" onClick={() => void handleSubmitAnswer()} disabled={!selectedOption || submittingAnswer}>
              {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
            </Button>
            {answerResult && answerResult !== 'submitted' && (
              <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.error }}>{answerResult}</span>
            )}
          </div>
        </div>
      )}

      {answerResult === 'submitted' && (
        <div style={{ padding: spacing.sm, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)', borderRadius: radius.sm, border: `1px solid ${colors.semantic.success}`, textAlign: 'center' }}>
          <p style={{ fontSize: typography.fontSize.sm, color: colors.semantic.success, fontWeight: typography.fontWeight.semibold, margin: 0 }}>✓ Answer submitted!</p>
        </div>
      )}

      {classroomQuizzes.filter((q) => q.status === 'active').map((q) => (
        <div key={q.id} style={{ padding: spacing.sm, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: radius.sm }}>
          <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: palette.text, margin: 0 }}>{q.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spacing.xs }}>
            {q.options.map((o) => (
              <span key={o.id} style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>• {o.text}</span>
            ))}
          </div>
        </div>
      ))}
      {classroomQuizzes.filter((q) => q.status === 'active').length === 0 && !activeQuiz && (
        <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, textAlign: 'center', padding: spacing.md }}>No active quizzes. Create one from the full view.</p>
      )}
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
  const speaking = participant.isScreenSharing;
  return (
    <div
      style={{
        backgroundColor: '#1F2937',
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        color: '#FFFFFF',
        position: 'relative',
        minHeight: 140,
        outline: speaking ? `3px solid ${colors.semantic.success}` : undefined,
        transition: 'outline 0.2s',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: isDark ? '#374151' : '#4B5563',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 600,
          marginBottom: spacing.sm,
          outline: participant.isHandRaised ? `3px solid ${colors.semantic.warning}` : undefined,
          outlineOffset: 3,
        }}
      >
        {initials}
      </div>
      <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
        {participant.displayName}
      </span>
      <span style={{ fontSize: typography.fontSize.xs, color: '#9CA3AF' }}>{participant.role}</span>
      <div style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, display: 'flex', gap: 4 }}>
        {participant.isMuted && <span title="Muted" style={{ fontSize: 14 }}>🔇</span>}
        {participant.isHandRaised && <span title="Hand raised" style={{ fontSize: 14 }}>✋</span>}
        {participant.isScreenSharing && <span title="Sharing" style={{ fontSize: 14 }}>🖥️</span>}
      </div>
      {participant.isMuted && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: typography.fontSize.xs,
            color: colors.semantic.error,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          MUTED
        </div>
      )}
      {speaking && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: typography.fontSize.xs,
            color: colors.semantic.success,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          SPEAKING
        </div>
      )}
    </div>
  );
}
