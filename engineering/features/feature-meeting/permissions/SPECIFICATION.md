# feature-meeting/permissions/SPECIFICATION.md

Document ID: PERMISSIONS-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Permissions & Role-Based Access Control

Subdomain: feature-meeting/permissions

---

# 1. Purpose

This document defines the domain models, aggregates, value objects, and service contracts for the Permissions subdomain.

---

# 2. Domain Models

## 2.1 MeetingPermissions (Aggregate Root)

Represents the global permissions configuration for a specific meeting, particularly locking down attendee capabilities.

```kotlin
data class MeetingPermissions(
    val meetingId: MeetingId,
    val lockAttendeeAudio: Boolean = false,
    val lockAttendeeVideo: Boolean = false,
    val lockAttendeeChat: Boolean = false,
    val allowAttendeeScreenShare: Boolean = false,
    val waitingRoomPolicy: WaitingRoomPolicy = WaitingRoomPolicy.AUTHENTICATED_USERS,
    val updatedBy: ParticipantId? = null,
    val updatedAt: Instant = Instant.now()
)
```

## 2.2 ParticipantPermissionOverride (Entity)

Represents custom permission overrides applied to a specific participant, bypassing their default role permissions.

```kotlin
data class ParticipantPermissionOverride(
    val id: OverrideId,
    val meetingId: MeetingId,
    val participantId: ParticipantId,
    val allowedPermissions: Set<PermissionFlag> = emptySet(),
    val deniedPermissions: Set<PermissionFlag> = emptySet(),
    val isHandRaised: Boolean = false,
    val handRaisedAt: Instant? = null,
    val speakPermissionGrantedAt: Instant? = null
)
```

---

# 3. Value Objects

## 3.1 PermissionFlag

```kotlin
enum class PermissionFlag {
    PUBLISH_AUDIO,
    PUBLISH_VIDEO,
    SHARE_SCREEN,
    SEND_CHAT,
    MUTE_OTHERS,
    ADMIT_OTHERS,
    KICK_OTHERS,
    MANAGE_ROLES
}
```

## 3.2 WaitingRoomPolicy

```kotlin
enum class WaitingRoomPolicy {
    EVERYONE,                 // All participants must wait in waiting room
    AUTHENTICATED_USERS,      // Anonymous users wait, signed-in users bypass
    INVITED_GUESTS,           // Only users explicitly invited bypass
    NONE                      // Waiting room is disabled, everyone bypasses
}
```

---

# 4. Domain Services

## 4.1 PermissionService

Enforces permissions checks at runtime.

```kotlin
interface PermissionService {
    suspend fun hasPermission(
        meetingId: MeetingId,
        participantId: ParticipantId,
        permission: PermissionFlag
    ): Boolean

    suspend fun updateGlobalPermissions(
        meetingId: MeetingId,
        requestedBy: ParticipantId,
        lockAudio: Boolean?,
        lockVideo: Boolean?,
        lockChat: Boolean?,
        allowScreenShare: Boolean?
    ): Result<MeetingPermissions>

    suspend fun overrideParticipantPermission(
        meetingId: MeetingId,
        requestedBy: ParticipantId,
        targetParticipantId: ParticipantId,
        permission: PermissionFlag,
        allow: Boolean
    ): Result<ParticipantPermissionOverride>

    suspend fun raiseHand(
        meetingId: MeetingId,
        participantId: ParticipantId
    ): Result<ParticipantPermissionOverride>

    suspend fun lowerHand(
        meetingId: MeetingId,
        requestedBy: ParticipantId,
        targetParticipantId: ParticipantId
    ): Result<ParticipantPermissionOverride>

    suspend fun grantSpeakPermission(
        meetingId: MeetingId,
        requestedBy: ParticipantId,
        targetParticipantId: ParticipantId
    ): Result<ParticipantPermissionOverride>

    suspend fun revokeSpeakPermission(
        meetingId: MeetingId,
        requestedBy: ParticipantId,
        targetParticipantId: ParticipantId
    ): Result<ParticipantPermissionOverride>
}
```

---

# 5. Repository Contracts

```kotlin
interface PermissionsRepository {
    suspend fun saveMeetingPermissions(permissions: MeetingPermissions): Result<MeetingPermissions>
    suspend fun findMeetingPermissions(meetingId: MeetingId): Result<MeetingPermissions?>
    
    suspend fun saveOverride(override: ParticipantPermissionOverride): Result<ParticipantPermissionOverride>
    suspend fun findOverride(participantId: ParticipantId): Result<ParticipantPermissionOverride?>
    suspend fun findOverridesByMeetingId(meetingId: MeetingId): Result<List<ParticipantPermissionOverride>>
    suspend fun deleteOverridesForMeeting(meetingId: MeetingId): Result<Unit>
}
```

---

# 6. Use Cases

## 6.1 CheckPermissionFlow

```
Input: hasPermission(meetingId, participantId, permission)

Steps:
1. Load participant details (specifically their role) from ParticipantRepository.
2. Check for explicit Override:
   - If permission is in deniedPermissions → Return false.
   - If permission is in allowedPermissions → Return true.
3. Check Global Meeting Settings:
   - If participant is ATTENDEE:
     - If permission is PUBLISH_AUDIO and lockAttendeeAudio is true → Return false.
     - If permission is PUBLISH_VIDEO and lockAttendeeVideo is true → Return false.
     - If permission is SEND_CHAT and lockAttendeeChat is true → Return false.
4. Fallback to Role Default:
   - Match role default permission (e.g. ATTENDEE has SEND_CHAT by default, but not PUBLISH_AUDIO).
```

## 6.2 RaiseHandUseCase

```
Input: RaiseHandCommand(meetingId, participantId)

Steps:
1. Fetch participant. Verify they are ACTIVE in the meeting.
2. Get or create ParticipantPermissionOverride.
3. Set isHandRaised = true, handRaisedAt = Instant.now().
4. Save override.
5. Publish ParticipantHandRaisedEvent.
```

## 6.3 GrantSpeakPermissionUseCase

```
Input: GrantSpeakPermissionCommand(meetingId, hostId, targetParticipantId)

Steps:
1. Verify hostId has canPromoteOthers() or is HOST/CO_HOST/MODERATOR.
2. Get or create ParticipantPermissionOverride for targetParticipantId.
3. Set isHandRaised = false.
4. Add PUBLISH_AUDIO (and optionally PUBLISH_VIDEO) to allowedPermissions.
5. Set speakPermissionGrantedAt = Instant.now().
6. Save override.
7. Call LivekitGateway to update participant's track publish permissions.
8. Publish SpeakPermissionGrantedEvent.
```

---

# 7. LiveKit Integration

When permissions are granted or revoked dynamically, we issue token updates or invoke LiveKit server API updates:

```kotlin
// Example LiveKit permission update call
livekitClient.updateParticipant(
    roomName = "meeting_$meetingId",
    identity = targetParticipantId.value,
    permission = ParticipantPermission(
        canPublish = true,
        canSubscribe = true,
        canPublishSources = listOf(TrackSource.MICROPHONE)
    )
)
```

---

# 8. Module Structure

```
feature-meeting/
└── permissions/
    ├── domain/
    │   ├── model/
    │   │   ├── MeetingPermissions.kt
    │   │   ├── ParticipantPermissionOverride.kt
    │   │   └── PermissionFlag.kt
    │   ├── usecase/
    │   │   ├── CheckPermissionUseCase.kt
    │   │   ├── RaiseHandUseCase.kt
    │   │   ├── GrantSpeakUseCase.kt
    │   │   └── UpdateGlobalPermissionsUseCase.kt
    │   └── port/
    │       └── PermissionsRepository.kt
    ├── data/
    │   └── PermissionsRepositoryImpl.kt
    └── presentation/
        └── PermissionsViewModel.kt
```

---

End of Document
