# feature-meeting/shared/SPECIFICATION.md

Document ID: SHARED-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Shared Kernel & Cross-Cutting Concerns

Subdomain: feature-meeting/shared

---

# 1. Purpose

This document is the canonical source of truth for all shared value objects, domain primitives, enumerations, and domain exceptions used across the entire `feature-meeting` bounded context.

---

# 2. Value Objects

All value objects are implemented as Kotlin `@JvmInline` value classes.

```kotlin
// --- Identity Types ---

@JvmInline value class MeetingId(val value: String)

@JvmInline value class ParticipantId(val value: String)

@JvmInline value class UserId(val value: String)

@JvmInline value class RoomName(val value: String) {
    companion object {
        fun fromMeetingId(meetingId: MeetingId) = RoomName("meeting_${meetingId.value}")
    }
}

// --- Domain Primitives ---

@JvmInline value class DisplayName(val value: String) {
    init {
        require(value.isNotBlank()) { "DisplayName cannot be blank" }
        require(value.length <= 128) { "DisplayName too long" }
    }
}
```

---

# 3. Enumerations

```kotlin
// --- Participant Role ---

enum class ParticipantRole {
    HOST,
    CO_HOST,
    MODERATOR,
    SPEAKER,
    ATTENDEE;

    fun canMuteOthers(): Boolean = this in setOf(HOST, CO_HOST, MODERATOR)
    fun canManageRoles(): Boolean = this in setOf(HOST, CO_HOST)
    fun canAdmitOthers(): Boolean = this in setOf(HOST, CO_HOST, MODERATOR)
    fun canKickOthers(): Boolean = this in setOf(HOST, CO_HOST, MODERATOR)
    fun isPrivileged(): Boolean = this in setOf(HOST, CO_HOST)
}

// --- Participant Status ---

enum class ParticipantStatus {
    WAITING,          // In waiting room
    ACTIVE,           // Live in meeting
    MUTED,            // Audio muted
    ON_HOLD,          // Host hold
    LEFT,             // Gracefully exited
    REMOVED,          // Kicked by host
    DISCONNECTED      // Network loss
}

// --- Meeting Status ---

enum class MeetingStatus {
    SCHEDULED,
    WAITING,          // Host joined, waiting for others
    ACTIVE,           // In progress
    PAUSED,           // On hold (classroom mode)
    ENDED
}
```

---

# 4. Domain Exceptions

```kotlin
// --- Base Exception ---

sealed class MeetingDomainException(
    override val message: String,
    val code: String
) : Exception(message)

// --- Meeting Exceptions ---

class MeetingNotFoundException(meetingId: MeetingId) :
    MeetingDomainException("Meeting not found: ${meetingId.value}", "MEETING_NOT_FOUND")

class MeetingAlreadyEndedException(meetingId: MeetingId) :
    MeetingDomainException("Meeting has already ended: ${meetingId.value}", "MEETING_ALREADY_ENDED")

class MeetingCapacityExceededException(meetingId: MeetingId, capacity: Int) :
    MeetingDomainException("Meeting ${meetingId.value} is at capacity ($capacity)", "MEETING_CAPACITY_EXCEEDED")

// --- Participant Exceptions ---

class ParticipantNotFoundException(participantId: ParticipantId) :
    MeetingDomainException("Participant not found: ${participantId.value}", "PARTICIPANT_NOT_FOUND")

class InsufficientRoleException(required: ParticipantRole, actual: ParticipantRole) :
    MeetingDomainException("Required role: $required, but got: $actual", "INSUFFICIENT_ROLE")

// --- Permission Exceptions ---

class PermissionDeniedException(permissionFlag: String) :
    MeetingDomainException("Permission denied: $permissionFlag", "PERMISSION_DENIED")

class RoomAlreadyLockedException(meetingId: MeetingId) :
    MeetingDomainException("Room is already locked: ${meetingId.value}", "ROOM_ALREADY_LOCKED")

// --- Invitation Exceptions ---

class InvitationNotFoundException(token: String) :
    MeetingDomainException("Invitation not found for token", "INVITATION_NOT_FOUND")

class InvitationExpiredException(invitationId: String) :
    MeetingDomainException("Invitation has expired: $invitationId", "INVITATION_EXPIRED")

// --- Scheduling Exceptions ---

class InvalidStartTimeException(reason: String) :
    MeetingDomainException("Invalid start time: $reason", "INVALID_START_TIME")
```

---

# 5. Shared DTOs

```kotlin
// --- Common API Response Wrappers ---

data class PagedResponse<T>(
    val items: List<T>,
    val page: Int,
    val pageSize: Int,
    val totalCount: Long
)

data class SuccessResponse(
    val message: String,
    val timestamp: Instant = Instant.now()
)

data class ErrorResponse(
    val code: String,
    val message: String,
    val timestamp: Instant = Instant.now()
)
```

---

# 6. Module Structure

```
feature-meeting/
└── shared/
    ├── domain/
    │   ├── id/
    │   │   ├── MeetingId.kt
    │   │   ├── ParticipantId.kt
    │   │   ├── UserId.kt
    │   │   └── RoomName.kt
    │   ├── primitive/
    │   │   └── DisplayName.kt
    │   ├── enum/
    │   │   ├── ParticipantRole.kt
    │   │   ├── ParticipantStatus.kt
    │   │   └── MeetingStatus.kt
    │   └── exception/
    │       └── MeetingDomainException.kt
    └── dto/
        ├── PagedResponse.kt
        ├── SuccessResponse.kt
        └── ErrorResponse.kt
```

---

End of Document
