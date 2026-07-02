'use client';

import { useCallback, useEffect, useState } from 'react';

import type { MeetingId, ParticipantId, UserId } from '@aimeetx/types';

import {
  CreateMeetingUseCase,
  EndMeetingUseCase,
  GetMeetingUseCase,
  JoinMeetingUseCase,
  LeaveMeetingUseCase,
  ListMeetingsUseCase,
  ListParticipantsUseCase,
  LowerHandUseCase,
  MuteParticipantUseCase,
  RaiseHandUseCase,
  StartMeetingUseCase,
  ChangeParticipantRoleUseCase,
  initializeSdk,
  sdkContainer,
  TOKENS,
  type Meeting,
  type MeetingSettings,
  type Participant,
  type ParticipantRole,
} from '@aimeetx/sdk';

// ============================================================================
// Meeting State Types
// ============================================================================

/**
 * Meeting list state.
 */
export type MeetingListState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly meetings: ReadonlyArray<Meeting> }
  | { readonly status: 'error'; readonly error: string };

/**
 * Single meeting state.
 */
export type MeetingState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly meeting: Meeting }
  | { readonly status: 'error'; readonly error: string };

/**
 * Participants state.
 */
export type ParticipantsState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly participants: ReadonlyArray<Participant> }
  | { readonly status: 'error'; readonly error: string };

/**
 * Create meeting input.
 */
export interface CreateMeetingInput {
  readonly title: string;
  readonly description?: string;
  readonly maxParticipants?: number;
  readonly passcode?: string;
  readonly settings?: Partial<MeetingSettings>;
}

/**
 * Join meeting input.
 */
export interface JoinMeetingInput {
  readonly meetingId: MeetingId;
  readonly displayName: string;
  readonly passcode?: string;
  readonly invitationToken?: string;
}

// ============================================================================
// SDK Initialization
// ============================================================================

/**
 * Initialize the meeting SDK bindings.
 *
 * Per ADR-005: this is a client-side helper that wires up the SDK for the meeting feature.
 */
function initializeMeetingSdk(): void {
  initializeSdk({ apiBaseUrl: 'https://api.aimeetx.com' });

  // Note: MeetingRepository and ParticipantRepository implementations
  // would be registered here when the HTTP implementations are created.
  // For now, we register the use cases which will be resolved when
  // the repository implementations are available.

  sdkContainer.register(TOKENS.CreateMeetingUseCase, { useClass: CreateMeetingUseCase });
  sdkContainer.register(TOKENS.GetMeetingUseCase, { useClass: GetMeetingUseCase });
  sdkContainer.register(TOKENS.StartMeetingUseCase, { useClass: StartMeetingUseCase });
  sdkContainer.register(TOKENS.EndMeetingUseCase, { useClass: EndMeetingUseCase });
  sdkContainer.register(TOKENS.JoinMeetingUseCase, { useClass: JoinMeetingUseCase });
  sdkContainer.register(TOKENS.LeaveMeetingUseCase, { useClass: LeaveMeetingUseCase });
  sdkContainer.register(TOKENS.MuteParticipantUseCase, { useClass: MuteParticipantUseCase });
  sdkContainer.register(TOKENS.ChangeParticipantRoleUseCase, {
    useClass: ChangeParticipantRoleUseCase,
  });
  sdkContainer.register(TOKENS.RaiseHandUseCase, { useClass: RaiseHandUseCase });
  sdkContainer.register(TOKENS.LowerHandUseCase, { useClass: LowerHandUseCase });
  sdkContainer.register(TOKENS.ListParticipantsUseCase, { useClass: ListParticipantsUseCase });
  sdkContainer.register(TOKENS.ListMeetingsUseCase, { useClass: ListMeetingsUseCase });
}

// ============================================================================
// useMeetingListViewModel
// ============================================================================

/**
 * useMeetingListViewModel — React hook for managing meeting list state.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: lists meetings for a host.
 */
export function useMeetingListViewModel(hostId: UserId) {
  const [state, setState] = useState<MeetingListState>({ status: 'idle' });

  // Initialize SDK bindings once
  useEffect(() => {
    try {
      initializeMeetingSdk();
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to initialize SDK',
      });
    }
  }, []);

  // Load meetings
  const loadMeetings = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const useCase = sdkContainer.resolve<ListMeetingsUseCase>(TOKENS.ListMeetingsUseCase);
      const result = await useCase.execute({ hostId });
      if (result.isFailure) {
        setState({ status: 'error', error: result.error.message });
        return;
      }
      setState({ status: 'loaded', meetings: result.value });
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load meetings',
      });
    }
  }, [hostId]);

  return { state, loadMeetings };
}

// ============================================================================
// useMeetingViewModel
// ============================================================================

/**
 * useMeetingViewModel — React hook for managing single meeting state.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: manages meeting lifecycle.
 */
export function useMeetingViewModel() {
  const [state, setState] = useState<MeetingState>({ status: 'idle' });

  // Load meeting
  const loadMeeting = useCallback(async (meetingId: MeetingId) => {
    setState({ status: 'loading' });
    try {
      const useCase = sdkContainer.resolve<GetMeetingUseCase>(TOKENS.GetMeetingUseCase);
      const result = await useCase.execute({ meetingId });
      if (result.isFailure) {
        setState({ status: 'error', error: result.error.message });
        return;
      }
      if (!result.value) {
        setState({ status: 'error', error: 'Meeting not found' });
        return;
      }
      setState({ status: 'loaded', meeting: result.value });
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load meeting',
      });
    }
  }, []);

  // Create meeting
  const createMeeting = useCallback(
    async (input: CreateMeetingInput, hostId: UserId) => {
      setState({ status: 'loading' });
      try {
        const useCase = sdkContainer.resolve<CreateMeetingUseCase>(TOKENS.CreateMeetingUseCase);
        const result = await useCase.execute({
          input: {
            title: input.title,
            description: input.description,
            hostId,
            maxParticipants: input.maxParticipants,
            passcode: input.passcode,
            settings: input.settings,
          },
        });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        setState({ status: 'loaded', meeting: result.value });
        return result.value;
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to create meeting',
        });
      }
    },
    [],
  );

  // Start meeting
  const startMeeting = useCallback(
    async (meetingId: MeetingId, startedBy: UserId) => {
      try {
        const useCase = sdkContainer.resolve<StartMeetingUseCase>(TOKENS.StartMeetingUseCase);
        const result = await useCase.execute({ meetingId, startedBy });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        setState({ status: 'loaded', meeting: result.value });
        return result.value;
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to start meeting',
        });
      }
    },
    [],
  );

  // End meeting
  const endMeeting = useCallback(
    async (meetingId: MeetingId, endedBy: UserId) => {
      try {
        const useCase = sdkContainer.resolve<EndMeetingUseCase>(TOKENS.EndMeetingUseCase);
        const result = await useCase.execute({ meetingId, endedBy });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        setState({ status: 'loaded', meeting: result.value });
        return result.value;
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to end meeting',
        });
      }
    },
    [],
  );

  return { state, loadMeeting, createMeeting, startMeeting, endMeeting };
}

// ============================================================================
// useJoinMeetingViewModel
// ============================================================================

/**
 * useJoinMeetingViewModel — React hook for joining a meeting.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: handles join logic.
 */
export function useJoinMeetingViewModel() {
  const [state, setState] = useState<MeetingState>({ status: 'idle' });
  const [participant, setParticipant] = useState<Participant | null>(null);

  // Join meeting
  const joinMeeting = useCallback(async (input: JoinMeetingInput, userId: UserId | null) => {
    setState({ status: 'loading' });
    try {
      const useCase = sdkContainer.resolve<JoinMeetingUseCase>(TOKENS.JoinMeetingUseCase);
      const result = await useCase.execute({
        input: {
          meetingId: input.meetingId,
          userId,
          displayName: input.displayName,
          passcode: input.passcode,
          invitationToken: input.invitationToken,
        },
      });
      if (result.isFailure) {
        setState({ status: 'error', error: result.error.message });
        return;
      }
      setParticipant(result.value);
      // Load the meeting
      const getUseCase = sdkContainer.resolve<GetMeetingUseCase>(TOKENS.GetMeetingUseCase);
      const meetingResult = await getUseCase.execute({ meetingId: input.meetingId });
      if (meetingResult.isSuccess && meetingResult.value) {
        setState({ status: 'loaded', meeting: meetingResult.value });
      }
      return result.value;
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to join meeting',
      });
    }
  }, []);

  // Leave meeting
  const leaveMeeting = useCallback(async (participantId: ParticipantId) => {
    try {
      const useCase = sdkContainer.resolve<LeaveMeetingUseCase>(TOKENS.LeaveMeetingUseCase);
      const result = await useCase.execute({ participantId });
      if (result.isFailure) {
        return false;
      }
      setParticipant(null);
      setState({ status: 'idle' });
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  return { state, participant, joinMeeting, leaveMeeting };
}

// ============================================================================
// useParticipantsViewModel
// ============================================================================

/**
 * useParticipantsViewModel — React hook for managing participants state.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: manages participant list.
 */
export function useParticipantsViewModel(meetingId: MeetingId | null) {
  const [state, setState] = useState<ParticipantsState>({ status: 'idle' });

  // Load participants
  const loadParticipants = useCallback(async () => {
    if (!meetingId) return;
    setState({ status: 'loading' });
    try {
      const useCase = sdkContainer.resolve<ListParticipantsUseCase>(
        TOKENS.ListParticipantsUseCase,
      );
      const result = await useCase.execute({ meetingId });
      if (result.isFailure) {
        setState({ status: 'error', error: result.error.message });
        return;
      }
      setState({ status: 'loaded', participants: result.value });
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load participants',
      });
    }
  }, [meetingId]);

  // Mute participant
  const muteParticipant = useCallback(
    async (participantId: ParticipantId, muted: boolean, mutedBy: ParticipantId) => {
      try {
        const useCase = sdkContainer.resolve<MuteParticipantUseCase>(
          TOKENS.MuteParticipantUseCase,
        );
        const result = await useCase.execute({ participantId, muted, mutedBy });
        if (result.isFailure) {
          return false;
        }
        await loadParticipants();
        return true;
      } catch (err) {
        return false;
      }
    },
    [loadParticipants],
  );

  // Change participant role
  const changeParticipantRole = useCallback(
    async (participantId: ParticipantId, newRole: ParticipantRole, changedBy: ParticipantId) => {
      try {
        const useCase = sdkContainer.resolve<ChangeParticipantRoleUseCase>(
          TOKENS.ChangeParticipantRoleUseCase,
        );
        const result = await useCase.execute({ participantId, newRole, changedBy });
        if (result.isFailure) {
          return false;
        }
        await loadParticipants();
        return true;
      } catch (err) {
        return false;
      }
    },
    [loadParticipants],
  );

  // Raise hand
  const raiseHand = useCallback(async (participantId: ParticipantId) => {
    try {
      const useCase = sdkContainer.resolve<RaiseHandUseCase>(TOKENS.RaiseHandUseCase);
      const result = await useCase.execute({ participantId });
      if (result.isFailure) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  // Lower hand
  const lowerHand = useCallback(
    async (participantId: ParticipantId, loweredBy: ParticipantId) => {
      try {
        const useCase = sdkContainer.resolve<LowerHandUseCase>(TOKENS.LowerHandUseCase);
        const result = await useCase.execute({ participantId, loweredBy });
        if (result.isFailure) {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    },
    [],
  );

  return {
    state,
    loadParticipants,
    muteParticipant,
    changeParticipantRole,
    raiseHand,
    lowerHand,
  };
}