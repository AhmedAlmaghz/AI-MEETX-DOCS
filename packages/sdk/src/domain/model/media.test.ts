import { describe, expect, it } from 'vitest';

import {
  canPlatformManage,
  isAudioTerminal,
  isDeviceSelectable,
  isGlobalMediaTerminal,
  isMediaSessionActive,
  isMediaSessionTerminal,
  isNetworkConnected,
  isNetworkTerminal,
  isPlatformHost,
  isPlatformSessionTerminal,
  isScreenShareTerminal,
  isVideoTerminal,
  MEDIA_CONSTRAINTS,
} from './media.js';

describe('Media constraints', () => {
  it('caps participants and streams at sensible limits', () => {
    expect(MEDIA_CONSTRAINTS.MAX_PARTICIPANTS).toBe(500);
    expect(MEDIA_CONSTRAINTS.MAX_AUDIO_STREAMS).toBe(500);
    expect(MEDIA_CONSTRAINTS.MAX_VIDEO_STREAMS).toBe(50);
  });

  it('defines aggressive latency targets (per ADR-001)', () => {
    expect(MEDIA_CONSTRAINTS.AUDIO_LATENCY_TARGET_MS).toBe(150);
    expect(MEDIA_CONSTRAINTS.VIDEO_LATENCY_TARGET_MS).toBe(200);
    expect(MEDIA_CONSTRAINTS.SIGNALING_LATENCY_TARGET_MS).toBe(100);
  });

  it('connection establishment under 2 seconds', () => {
    expect(MEDIA_CONSTRAINTS.CONNECTION_ESTABLISHMENT_TARGET_MS).toBe(2_000);
  });

  it('reconnection under 3 seconds', () => {
    expect(MEDIA_CONSTRAINTS.RECONNECTION_TARGET_MS).toBe(3_000);
  });

  it('one screen share per participant at a time', () => {
    expect(MEDIA_CONSTRAINTS.MAX_SCREEN_SHARES_PER_PARTICIPANT).toBe(1);
  });
});

describe('Media session state machine', () => {
  it('closed is a terminal state for media sessions', () => {
    expect(isMediaSessionTerminal('closed')).toBe(true);
    expect(isMediaSessionTerminal('active')).toBe(false);
    expect(isMediaSessionTerminal('ready')).toBe(false);
  });

  it('active is the only media-session state considered active', () => {
    expect(isMediaSessionActive('active')).toBe(true);
    expect(isMediaSessionActive('ready')).toBe(false);
    expect(isMediaSessionActive('paused')).toBe(false);
    expect(isMediaSessionActive('closed')).toBe(false);
  });

  it('paused, recovering, initializing are non-terminal (can recover)', () => {
    expect(isMediaSessionTerminal('paused')).toBe(false);
    expect(isMediaSessionTerminal('recovering')).toBe(false);
    expect(isMediaSessionTerminal('initializing')).toBe(false);
  });

  it('audio/video terminal states are correct', () => {
    expect(isAudioTerminal('closed')).toBe(true);
    expect(isAudioTerminal('active')).toBe(false);
    expect(isVideoTerminal('closed')).toBe(true);
    expect(isVideoTerminal('active')).toBe(false);
  });

  it('network state helpers', () => {
    expect(isNetworkConnected('connected')).toBe(true);
    expect(isNetworkConnected('failed')).toBe(false);
    expect(isNetworkTerminal('failed')).toBe(true);
    expect(isNetworkTerminal('connected')).toBe(false);
  });

  it('screen share terminal state', () => {
    expect(isScreenShareTerminal('closed')).toBe(true);
    expect(isScreenShareTerminal('active')).toBe(false);
  });

  it('device selectable when active or inactive', () => {
    expect(isDeviceSelectable('active')).toBe(true);
    expect(isDeviceSelectable('inactive')).toBe(true);
    expect(isDeviceSelectable('unavailable')).toBe(false);
    expect(isDeviceSelectable('initializing')).toBe(false);
  });

  it('global media terminal includes terminated', () => {
    expect(isGlobalMediaTerminal('terminated')).toBe(true);
    expect(isGlobalMediaTerminal('active')).toBe(false);
    expect(isGlobalMediaTerminal('terminating')).toBe(false);
  });

  it('platform session terminal state', () => {
    expect(isPlatformSessionTerminal('ended')).toBe(true);
    expect(isPlatformSessionTerminal('active')).toBe(false);
  });
});

describe('Platform role helpers', () => {
  it('host is the most privileged role', () => {
    expect(isPlatformHost('host')).toBe(true);
    expect(isPlatformHost('participant')).toBe(false);
  });

  it('host and co_host can manage platform sessions', () => {
    expect(canPlatformManage('host')).toBe(true);
    expect(canPlatformManage('co_host')).toBe(true);
    expect(canPlatformManage('moderator')).toBe(false);
    expect(canPlatformManage('participant')).toBe(false);
  });
});
