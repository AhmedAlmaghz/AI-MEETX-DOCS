# feature-meeting/participants/SPECIFICATION.md

Document ID: PARTICIPANTS-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Participants Management

Subdomain: feature-meeting/participants

---

# 1. Purpose

Defines the domain model, aggregate design, value objects, repository contracts, and service logic for the Participants subdomain.

---

# 2. Aggregate Root: MeetingParticipant

```kotlin
data class MeetingParticipant(
    val id: ParticipantId,
    val meetingId: MeetingId,
    val userId: UserId,
    val displayName: DisplayName,
    val role: ParticipantRole,
    val audioState: AudioState,
    val videoState: VideoState,
    val status: ParticipantStatus,
    val joinedAt: Instant,
    val leftAt: Instant? = null,
    val removedAt: Instant? = null,
    val removalReason: String? = null
)
```

---

# 3. Value Objects

## 3.1 ParticipantId

```kotlin
@JvmInline
value class ParticipantId(val value: String) {
    init {
        require(value.isNotBlank()) { "ParticipantId cannot be blank" }
    }
}
```

## 3.2 ParticipantRole

```kotlin
enum class ParticipantRole {
    HOST,
    CO_HOST,
    MODERATOR,
    SPEAKER,
    ATTENDEE;

    fun canMute(): Boolean = this in listOf(HOST, CO_HOST, MODERATOR)
    fun canRemove(): Boolean = this in listOf(HOST, CO_HOST, MODERATOR)
    fun canEndMeeting(): Boolean = this in listOf(HOST, CO_HOST)
    fun canShareMedia(): Boolean = this in listOf(HOST, CO_HOST, MODERATOR, SPEAKER)
    fun canPromoteOthers(): Boolean = this in listOf(HOST, CO_HOST)
}
```

## 3.3 ParticipantStatus

```kotlin
enum class ParticipantStatus {
    WAITING,       // In waiting room
    ACTIVE,        // Inside meeting
    LEFT,          // Left voluntarily
    REMOVED,       // Removed by host/moderator
    DISCONNECTED   // Network issue, attempting reconnect
}
```

## 3.4 AudioState

```kotlin
data class AudioState(
    val isMuted: Boolean,
    val mutedBy: ParticipantId? = null,  // null = self-muted
    val mutedAt: Instant? = null
)
```

## 3.5 VideoState

```kotlin
data class VideoState(
    val isCameraOn: Boolean,
    val isScreenSharing: Boolean
)
```

---

# 4. Domain Services

## 4.1 ParticipantService

Coordinates join, leave, remove, and role change operations.

```kotlin
interface ParticipantService {
    suspend fun joinMeeting(
        meetingId: MeetingId,
        userId: UserId,
        displayName: DisplayName
    ): Result<MeetingParticipant>

    suspend fun leaveMeeting(
        meetingId: MeetingId,
        participantId: ParticipantId
    ): Result<Unit>

    suspend fun removeParticipant(
        meetingId: MeetingId,
        removedBy: ParticipantId,
        targetParticipantId: ParticipantId,
        reason: String
    ): Result<Unit>

    suspend fun changeRole(
        meetingId: MeetingId,
        changedBy: ParticipantId,
        targetParticipantId: ParticipantId,
        newRole: ParticipantRole
    ): Result<MeetingParticipant>

    suspend fun muteParticipant(
        meetingId: MeetingId,
        mutedBy: ParticipantId,
        targetParticipantId: ParticipantId
    ): Result<Unit>
}
```

---

## 4.2 WaitingRoomService

```kotlin
interface WaitingRoomService {
    suspend fun addToWaitingRoom(
        meetingId: MeetingId,
        participantId: ParticipantId
    ): Result<Unit>

    suspend fun admitParticipant(
        meetingId: MeetingId,
        participantId: ParticipantId,
        admittedBy: ParticipantId
    ): Result<Unit>

    suspend fun denyParticipant(
        meetingId: MeetingId,
        participantId: ParticipantId,
        deniedBy: ParticipantId
    ): Result<Unit>

    fun observeWaitingRoom(meetingId: MeetingId): Flow<List<MeetingParticipant>>
}
```

---

# 5. Repository Contracts

## 5.1 ParticipantRepository

```kotlin
interface ParticipantRepository {
    suspend fun save(participant: MeetingParticipant): Result<MeetingParticipant>
    suspend fun findById(id: ParticipantId): Result<MeetingParticipant?>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<List<MeetingParticipant>>
    suspend fun findByMeetingIdAndStatus(
        meetingId: MeetingId,
        status: ParticipantStatus
    ): Result<List<MeetingParticipant>>
    suspend fun findByMeetingIdAndUserId(
        meetingId: MeetingId,
        userId: UserId
    ): Result<MeetingParticipant?>
    suspend fun countActiveByMeetingId(meetingId: MeetingId): Result<Int>
    suspend fun update(participant: MeetingParticipant): Result<MeetingParticipant>
}
```

---

# 6. Use Cases

## 6.1 JoinMeetingUseCase

```
Input: JoinMeetingCommand(meetingId, userId, displayName)

Steps:
1. Validate meeting is ACTIVE or WAITING.
2. Check participant count does not exceed plan limit.
3. Check user is not already an ACTIVE participant.
4. Determine role (HOST if creator, ATTENDEE by default).
5. Create MeetingParticipant with status ACTIVE (or WAITING if waiting room enabled).
6. Save participant.
7. Issue LiveKit token.
8. Publish ParticipantJoinedEvent.

Output: JoinMeetingResult(participant, livekitToken)
```

## 6.2 LeaveMeetingUseCase

```
Input: LeaveMeetingCommand(meetingId, participantId)

Steps:
1. Load participant from repository.
2. Validate participant is ACTIVE.
3. If participant is HOST and no CO_HOST exists → trigger MeetingEndedEvent.
4. Update participant status to LEFT, set leftAt.
5. Revoke LiveKit token.
6. Publish ParticipantLeftEvent.
```

## 6.3 RemoveParticipantUseCase

```
Input: RemoveParticipantCommand(meetingId, removedBy, targetId, reason)

Steps:
1. Load both participants (actor and target).
2. Validate actor has canRemove() permission.
3. Validate target is currently ACTIVE.
4. Update target status to REMOVED, set removedAt and removalReason.
5. Revoke target's LiveKit token.
6. Publish ParticipantRemovedEvent.
7. Add target's userId to meeting's blocked list.
```

## 6.4 ChangeRoleUseCase

```
Input: ChangeRoleCommand(meetingId, changedBy, targetId, newRole)

Steps:
1. Load both participants.
2. Validate actor has canPromoteOthers() permission.
3. Validate new role is not HOST (HOST is non-transferable without explicit host transfer).
4. Update participant role.
5. Update LiveKit permissions for target participant.
6. Publish ParticipantRoleChangedEvent.
```

---

# 7. Integration with LiveKit

```
On ParticipantJoined:
  → Issue LiveKit token with permissions matching role
  → Grant audio/video based on canShareMedia()

On ParticipantRemoved:
  → Call LiveKit API to kick participant
  → Revoke token

On RoleChanged:
  → Update LiveKit room permissions for participant
```

---

# 8. Module Structure

```
feature-meeting/
└── participants/
    ├── domain/
    │   ├── model/
    │   │   ├── MeetingParticipant.kt
    │   │   ├── ParticipantRole.kt
    │   │   ├── ParticipantStatus.kt
    │   │   ├── AudioState.kt
    │   │   └── VideoState.kt
    │   ├── usecase/
    │   │   ├── JoinMeetingUseCase.kt
    │   │   ├── LeaveMeetingUseCase.kt
    │   │   ├── RemoveParticipantUseCase.kt
    │   │   ├── ChangeRoleUseCase.kt
    │   │   └── MuteParticipantUseCase.kt
    │   └── port/
    │       ├── ParticipantRepository.kt
    │       └── WaitingRoomService.kt
    ├── data/
    │   ├── ParticipantRepositoryImpl.kt
    │   └── WaitingRoomServiceImpl.kt
    ├── presentation/
    │   ├── viewmodel/
    │   │   └── ParticipantListViewModel.kt
    │   └── component/
    │       ├── ParticipantListPanel.kt
    │       └── WaitingRoomPanel.kt
    └── di/
        └── ParticipantsModule.kt
```

---

End of Document
