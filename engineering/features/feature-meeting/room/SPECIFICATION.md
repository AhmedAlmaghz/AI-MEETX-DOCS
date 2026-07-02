# feature-meeting/room/SPECIFICATION.md

Document ID: ROOM-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Room Management

Subdomain: feature-meeting/room

---

# 1. Purpose

This document defines the domain model, services, and integration patterns for the Room subdomain.

The Room subdomain is the real-time media layer. It wraps LiveKit and provides a domain-level abstraction for meeting audio/video management.

---

# 2. Domain Model: MeetingRoom

```kotlin
data class MeetingRoom(
    val id: RoomId,
    val meetingId: MeetingId,
    val livekitRoomName: String,
    val settings: RoomSettings,
    val status: RoomStatus,
    val createdAt: Instant,
    val destroyedAt: Instant? = null
)
```

---

# 3. Value Objects

## 3.1 RoomId

```kotlin
@JvmInline
value class RoomId(val value: String)
```

## 3.2 RoomStatus

```kotlin
enum class RoomStatus {
    CREATING,
    ACTIVE,
    LOCKED,      // Room locked by host — no new participants allowed
    ENDED
}
```

## 3.3 RoomSettings

```kotlin
data class RoomSettings(
    val maxParticipants: Int = 100,
    val isLocked: Boolean = false,
    val isMuteAllEnabled: Boolean = false,
    val isVideoDisabled: Boolean = false,
    val allowMultipleScreenShares: Boolean = false,
    val maxVideoBitratekbps: Int = 2500,
    val audioQuality: AudioQuality = AudioQuality.STANDARD
)

enum class AudioQuality { ECONOMY, STANDARD, HIGH }
```

---

# 4. Domain Services

## 4.1 RoomService

```kotlin
interface RoomService {
    suspend fun createRoom(
        meetingId: MeetingId,
        settings: RoomSettings
    ): Result<MeetingRoom>

    suspend fun destroyRoom(meetingId: MeetingId): Result<Unit>

    suspend fun lockRoom(meetingId: MeetingId, lockedBy: ParticipantId): Result<Unit>

    suspend fun unlockRoom(meetingId: MeetingId, unlockedBy: ParticipantId): Result<Unit>

    suspend fun muteAll(meetingId: MeetingId, mutedBy: ParticipantId): Result<Unit>

    suspend fun disableAllVideo(meetingId: MeetingId, disabledBy: ParticipantId): Result<Unit>

    suspend fun enableAllVideo(meetingId: MeetingId, enabledBy: ParticipantId): Result<Unit>

    fun observeRoomStatus(meetingId: MeetingId): Flow<MeetingRoom>
}
```

---

## 4.2 LivekitGateway

Abstracts the LiveKit server API.

```kotlin
interface LivekitGateway {
    suspend fun createRoom(
        roomName: String,
        config: LivekitRoomConfig
    ): Result<LivekitRoomInfo>

    suspend fun deleteRoom(roomName: String): Result<Unit>

    suspend fun muteParticipantTrack(
        roomName: String,
        participantIdentity: String,
        trackSid: String
    ): Result<Unit>

    suspend fun removeParticipant(
        roomName: String,
        participantIdentity: String
    ): Result<Unit>

    suspend fun generateToken(
        roomName: String,
        participantIdentity: String,
        permissions: LivekitPermissions
    ): Result<String>

    fun observeRoomEvents(roomName: String): Flow<LivekitRoomEvent>
}
```

---

## 4.3 RoomQualityMonitor

Monitors network quality for each participant.

```kotlin
interface RoomQualityMonitor {
    fun observeQuality(
        meetingId: MeetingId,
        participantId: ParticipantId
    ): Flow<ConnectionQuality>
}

data class ConnectionQuality(
    val participantId: ParticipantId,
    val quality: QualityLevel,
    val packetLossPercent: Float,
    val rttMs: Int,
    val bitrateKbps: Int
)

enum class QualityLevel { EXCELLENT, GOOD, POOR, DISCONNECTED }
```

---

# 5. Repository Contracts

```kotlin
interface RoomRepository {
    suspend fun save(room: MeetingRoom): Result<MeetingRoom>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<MeetingRoom?>
    suspend fun update(room: MeetingRoom): Result<MeetingRoom>
}
```

---

# 6. Use Cases

## 6.1 CreateRoomUseCase

Triggered by `MeetingStartedEvent`.

```
Input: meetingId, planConfig

Steps:
1. Derive RoomSettings from plan config.
2. Generate a unique LiveKit room name.
3. Call LivekitGateway.createRoom().
4. Save MeetingRoom to repository with status ACTIVE.
5. Publish RoomCreatedEvent.
```

## 6.2 DestroyRoomUseCase

Triggered by `MeetingEndedEvent`.

```
Input: meetingId

Steps:
1. Load room from repository.
2. Call LivekitGateway.deleteRoom().
3. Update room status to ENDED, set destroyedAt.
4. Publish RoomDestroyedEvent.
```

## 6.3 LockRoomUseCase

```
Input: meetingId, callerParticipantId

Steps:
1. Validate caller is HOST or CO_HOST.
2. Update room settings: isLocked = true.
3. LiveKit room marked as locked (no new tokens issued).
4. Publish RoomLockedEvent.
```

## 6.4 MuteAllUseCase

```
Input: meetingId, callerParticipantId

Steps:
1. Validate caller is HOST or CO_HOST.
2. Update room settings: isMuteAllEnabled = true.
3. Call LivekitGateway.muteParticipantTrack() for each active participant.
4. Publish RoomMutedAllEvent.
5. Publish ParticipantMutedEvent for each participant.
```

---

# 7. LiveKit Integration Details

```
LiveKit Room naming convention:
  room_name = "meeting_{meetingId}"

Token permissions per role:
  HOST        → canPublish, canSubscribe, canPublishData, roomAdmin
  CO_HOST     → canPublish, canSubscribe, canPublishData, roomAdmin
  MODERATOR   → canPublish, canSubscribe, canPublishData
  SPEAKER     → canPublish, canSubscribe
  ATTENDEE    → canSubscribe only

Screen share:
  Enabled via LiveKit's screenShareEnabled permission flag.
  Only HOST, CO_HOST, MODERATOR, SPEAKER may screen share.
```

---

# 8. Module Structure

```
feature-meeting/
└── room/
    ├── domain/
    │   ├── model/
    │   │   ├── MeetingRoom.kt
    │   │   ├── RoomSettings.kt
    │   │   └── RoomStatus.kt
    │   ├── usecase/
    │   │   ├── CreateRoomUseCase.kt
    │   │   ├── DestroyRoomUseCase.kt
    │   │   ├── LockRoomUseCase.kt
    │   │   ├── MuteAllUseCase.kt
    │   │   └── DisableVideoUseCase.kt
    │   └── port/
    │       ├── RoomRepository.kt
    │       ├── LivekitGateway.kt
    │       └── RoomQualityMonitor.kt
    ├── data/
    │   ├── RoomRepositoryImpl.kt
    │   └── LivekitGatewayImpl.kt
    ├── presentation/
    │   ├── viewmodel/
    │   │   └── RoomViewModel.kt
    │   └── component/
    │       ├── VideoGrid.kt
    │       ├── RoomControlBar.kt
    │       └── ConnectionQualityIndicator.kt
    └── di/
        └── RoomModule.kt
```

---

End of Document
