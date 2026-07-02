# feature-meeting/presence/SPECIFICATION.md

Document ID: PRESENCE-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Presence Tracking & Active Speakers

Subdomain: feature-meeting/presence

---

# 1. Purpose

This document defines the domain models, value objects, domain services, and repository contracts for the Presence subdomain.

---

# 2. Domain Models

## 2.1 ParticipantPresence (Aggregate Root)

Represents the real-time connectivity and speaking state of a participant.

```kotlin
data class ParticipantPresence(
    val participantId: ParticipantId,
    val meetingId: MeetingId,
    val connectionState: ConnectionState = ConnectionState.CONNECTED,
    val networkQuality: NetworkQuality = NetworkQuality.GOOD,
    val isSpeaking: Boolean = false,
    val audioLevel: Float = 0f,           // 0.0 - 1.0
    val lastHeartbeatAt: Instant = Instant.now(),
    val connectedAt: Instant = Instant.now(),
    val disconnectedAt: Instant? = null
)
```

---

# 3. Value Objects

## 3.1 ConnectionState

```kotlin
enum class ConnectionState {
    CONNECTED,
    RECONNECTING,
    DISCONNECTED
}
```

## 3.2 NetworkQuality

```kotlin
enum class NetworkQuality {
    EXCELLENT,   // < 50ms latency
    GOOD,        // 50–150ms latency
    FAIR,        // 150–300ms latency
    POOR         // > 300ms or packet loss > 5%
}
```

---

# 4. Domain Services

## 4.1 PresenceService

```kotlin
interface PresenceService {
    suspend fun heartbeat(
        meetingId: MeetingId,
        participantId: ParticipantId
    ): Result<ParticipantPresence>

    suspend fun updateConnectionState(
        meetingId: MeetingId,
        participantId: ParticipantId,
        state: ConnectionState
    ): Result<ParticipantPresence>

    suspend fun updateNetworkQuality(
        meetingId: MeetingId,
        participantId: ParticipantId,
        quality: NetworkQuality,
        audioLevel: Float
    ): Result<ParticipantPresence>

    suspend fun getActiveSpeaker(meetingId: MeetingId): Result<ParticipantPresence?>

    fun observePresence(meetingId: MeetingId): Flow<List<ParticipantPresence>>
}
```

---

# 5. Repository Contracts

```kotlin
interface PresenceRepository {
    // Uses Redis for hot data; presence records are ephemeral
    suspend fun upsert(presence: ParticipantPresence): Result<ParticipantPresence>
    suspend fun findByParticipantId(
        meetingId: MeetingId,
        participantId: ParticipantId
    ): Result<ParticipantPresence?>
    suspend fun findAllByMeetingId(meetingId: MeetingId): Result<List<ParticipantPresence>>
    suspend fun deleteForMeeting(meetingId: MeetingId): Result<Unit>
    suspend fun findMissedHeartbeats(
        meetingId: MeetingId,
        cutoffTime: Instant
    ): Result<List<ParticipantPresence>>
}
```

---

# 6. Use Cases

## 6.1 HeartbeatUseCase

```
Input: HeartbeatCommand(meetingId, participantId)

Steps:
1. Load or create ParticipantPresence from Redis.
2. Update lastHeartbeatAt = NOW.
3. If state was RECONNECTING, set state = CONNECTED.
4. Upsert to Redis.
5. If state changed from RECONNECTING to CONNECTED:
   - Publish ParticipantPresenceChangedEvent(state=CONNECTED).
```

## 6.2 HeartbeatMonitorJob (Scheduled Job)

```
Triggers: Every 5 seconds via a cron scheduler.

Steps:
1. Load all active meetings (from meeting lifecycle cache).
2. For each meeting, query PresenceRepository.findMissedHeartbeats(cutoffTime = NOW - 15 seconds).
3. For each missed participant:
   - Update connectionState = DISCONNECTED.
   - Upsert to Redis.
   - Publish ParticipantPresenceChangedEvent(state=DISCONNECTED).
```

## 6.3 ActiveSpeakerUseCase

```
Input: UpdateAudioLevelCommand(meetingId, participantId, audioLevel)

Steps:
1. Load ParticipantPresence.
2. Update audioLevel = provided level.
3. isSpeaking = audioLevel > 0.1f (threshold).
4. Upsert to Redis.
5. Find current active speaker (highest audioLevel among isSpeaking=true).
6. If active speaker changed:
   - Publish ActiveSpeakerChangedEvent.
```

---

# 7. Storage Strategy (Redis-First)

Presence data is hot, ephemeral, and must be extremely fast. It is stored exclusively in Redis:

```
Key pattern: presence:{meetingId}:{participantId}
TTL:         30 seconds (refreshed on each heartbeat)
```

On meeting end, all keys in the namespace are deleted.

---

# 8. Module Structure

```
feature-meeting/
└── presence/
    ├── domain/
    │   ├── model/
    │   │   ├── ParticipantPresence.kt
    │   │   ├── ConnectionState.kt
    │   │   └── NetworkQuality.kt
    │   ├── usecase/
    │   │   ├── HeartbeatUseCase.kt
    │   │   ├── UpdateAudioLevelUseCase.kt
    │   │   └── GetActiveSpeakerUseCase.kt
    │   └── port/
    │       └── PresenceRepository.kt
    ├── data/
    │   └── RedisPresenceRepository.kt
    └── job/
        └── HeartbeatMonitorJob.kt
```

---

End of Document
