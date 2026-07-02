# feature-meeting/invitations/SPECIFICATION.md

Document ID: INVITATIONS-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Invitations & RSVP

Subdomain: feature-meeting/invitations

---

# 1. Purpose

This document defines the domain models, value objects, domain services, and repository contracts for the Invitations subdomain.

---

# 2. Domain Models

## 2.1 MeetingInvitation (Aggregate Root)

Represents a single invitation sent to an invitee for a specific meeting.

```kotlin
data class MeetingInvitation(
    val id: InvitationId,
    val meetingId: MeetingId,
    val inviteeEmail: String,
    val inviteeName: String? = null,
    val inviteeRole: ParticipantRole = ParticipantRole.ATTENDEE,
    val token: InvitationToken,
    val status: RSVPStatus = RSVPStatus.PENDING,
    val expiresAt: Instant,
    val createdAt: Instant = Instant.now(),
    val respondedAt: Instant? = null
) {
    fun isExpired(): Boolean = Instant.now().isAfter(expiresAt)
}
```

---

# 3. Value Objects

## 3.1 InvitationId

```kotlin
@JvmInline
value class InvitationId(val value: String)
```

## 3.2 InvitationToken

Represents a cryptographically secure token sent to the invitee.

```kotlin
@JvmInline
value class InvitationToken(val value: String) {
    init {
        require(value.length >= 32) { "InvitationToken must be at least 32 characters long" }
    }
}
```

## 3.3 RSVPStatus

```kotlin
enum class RSVPStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    EXPIRED
}
```

---

# 4. Domain Services

## 4.1 InvitationService

Coordinates the lifecycle of invitations and checks validity.

```kotlin
interface InvitationService {
    suspend fun createInvitation(
        meetingId: MeetingId,
        hostId: ParticipantId,
        inviteeEmail: String,
        inviteeName: String?,
        role: ParticipantRole,
        lifespanHours: Int
    ): Result<MeetingInvitation>

    suspend fun sendBulkInvitations(
        meetingId: MeetingId,
        hostId: ParticipantId,
        invitees: List<InviteeDto>
    ): Result<List<MeetingInvitation>>

    suspend fun updateRSVP(
        token: InvitationToken,
        status: RSVPStatus
    ): Result<MeetingInvitation>

    suspend fun validateInvitationToken(
        meetingId: MeetingId,
        token: InvitationToken
    ): Result<MeetingInvitation>

    suspend fun validatePasscode(
        meetingId: MeetingId,
        providedPasscode: String
    ): Boolean
}

data class InviteeDto(
    val email: String,
    val name: String?,
    val role: ParticipantRole = ParticipantRole.ATTENDEE
)
```

---

# 5. Repository Contracts

```kotlin
interface InvitationRepository {
    suspend fun save(invitation: MeetingInvitation): Result<MeetingInvitation>
    suspend fun findById(id: InvitationId): Result<MeetingInvitation?>
    suspend fun findByToken(token: InvitationToken): Result<MeetingInvitation?>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<List<MeetingInvitation>>
    suspend fun update(invitation: MeetingInvitation): Result<MeetingInvitation>
    suspend fun deleteForMeeting(meetingId: MeetingId): Result<Unit>
}
```

---

# 6. Use Cases

## 6.1 CreateInvitationsUseCase

```
Input: SendInvitationsCommand(meetingId, hostId, list of invitees)

Steps:
1. Verify hostId is actually HOST/CO_HOST in the meeting.
2. For each invitee in list:
   - Generate secure random token (using cryptographically secure generator).
   - Set expiry to 48 hours (default) or meeting start time.
   - Create MeetingInvitation aggregate.
   - Save to repository.
   - Publish InvitationCreatedEvent.
```

## 6.2 RespondToInvitationUseCase

```
Input: RespondToInvitationCommand(token, rsvpStatus)

Steps:
1. Load invitation using InvitationRepository.findByToken(token).
2. Validate invitation exists and is not expired.
3. Update status to ACCEPTED or DECLINED.
4. Set respondedAt to NOW.
5. Save updated invitation.
6. Publish InvitationRsvpUpdatedEvent.
```

## 6.3 VerifyInvitationAccessUseCase

```
Input: VerifyInvitationAccessCommand(meetingId, userId, token, providedPasscode)

Steps:
1. Check if meeting settings require passcode:
   - If yes, verify providedPasscode matches hashed passcode in DB.
2. Check if meeting policy is INVITED_GUESTS:
   - If yes, verify token is provided, valid, matches meetingId, and status = ACCEPTED/PENDING.
3. On success, allow join.
```

---

# 7. Module Structure

```
feature-meeting/
└── invitations/
    ├── domain/
    │   ├── model/
    │   │   ├── MeetingInvitation.kt
    │   │   ├── RSVPStatus.kt
    │   │   └── InvitationToken.kt
    │   ├── usecase/
    │   │   ├── CreateInvitationUseCase.kt
    │   │   ├── RespondToInvitationUseCase.kt
    │   │   └── VerifyInvitationAccessUseCase.kt
    │   └── port/
    │       └── InvitationRepository.kt
    ├── data/
    │   └── InvitationRepositoryImpl.kt
    └── presentation/
        └── InvitationRsvpViewModel.kt
```

---

End of Document
