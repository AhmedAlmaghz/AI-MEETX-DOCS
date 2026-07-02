# feature-meeting/waiting-room/SPECIFICATION.md

Document ID: WAITING-ROOM-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Waiting Room / Lobby Management

Subdomain: feature-meeting/waiting-room

---

# 1. Purpose

This document defines the domain models, aggregates, value objects, domain services, and repository contracts for the Waiting Room subdomain.

---

# 2. Domain Models

## 2.1 WaitingRoomEntry (Aggregate Root)

Represents a queue entry of a participant waiting to join a meeting.

```kotlin
data class WaitingRoomEntry(
    val id: EntryId,
    val meetingId: MeetingId,
    val participantId: ParticipantId,
    val displayName: DisplayName,
    val requestedAt: Instant = Instant.now(),
    val resolvedAt: Instant? = null,
    val resolution: ResolutionStatus = ResolutionStatus.WAITING,
    val resolvedBy: ParticipantId? = null
)
```

---

# 3. Value Objects

## 3.1 EntryId

```kotlin
@JvmInline
value class EntryId(val value: String)
```

## 3.2 ResolutionStatus

```kotlin
enum class ResolutionStatus {
    WAITING,
    ADMITTED,
    DENIED
}
```

---

# 4. Domain Services

## 4.1 WaitingRoomService

Orchestrates lobby activities and transitions.

```kotlin
interface WaitingRoomService {
    suspend fun knock(
        meetingId: MeetingId,
        participantId: ParticipantId,
        displayName: DisplayName
    ): Result<WaitingRoomEntry>

    suspend fun admitParticipant(
        meetingId: MeetingId,
        hostId: ParticipantId,
        entryId: EntryId
    ): Result<WaitingRoomEntry>

    suspend fun denyParticipant(
        meetingId: MeetingId,
        hostId: ParticipantId,
        entryId: EntryId,
        reason: String?
    ): Result<WaitingRoomEntry>

    suspend fun admitAll(
        meetingId: MeetingId,
        hostId: ParticipantId
    ): Result<List<WaitingRoomEntry>>

    fun observeQueue(meetingId: MeetingId): Flow<List<WaitingRoomEntry>>
}
```

---

# 5. Repository Contracts

```kotlin
interface WaitingRoomRepository {
    suspend fun save(entry: WaitingRoomEntry): Result<WaitingRoomEntry>
    suspend fun findById(id: EntryId): Result<WaitingRoomEntry?>
    suspend fun findByMeetingIdAndStatus(
        meetingId: MeetingId,
        status: ResolutionStatus
    ): Result<List<WaitingRoomEntry>>
    suspend fun findByParticipantId(participantId: ParticipantId): Result<WaitingRoomEntry?>
    suspend fun update(entry: WaitingRoomEntry): Result<WaitingRoomEntry>
    suspend fun deleteForMeeting(meetingId: MeetingId): Result<Unit>
}
```

---

# 6. Use Cases

## 6.1 KnockUseCase

```
Input: KnockCommand(meetingId, participantId, displayName)

Steps:
1. Verify meeting state is ACTIVE.
2. Verify participant is in WAITING status.
3. Check if there is an active/duplicate entry for this participant.
4. Create WaitingRoomEntry.
5. Save to repository.
6. Publish WaitingRoomEnteredEvent.
```

## 6.2 AdmitParticipantUseCase

```
Input: AdmitParticipantCommand(meetingId, hostId, entryId)

Steps:
1. Verify hostId has canMute() / canAdmitOthers() permissions.
2. Load WaitingRoomEntry using repository.
3. Update entry:
   - resolution = ADMITTED
   - resolvedBy = hostId
   - resolvedAt = NOW
4. Save entry.
5. Call ParticipantRepository to update participant status to ACTIVE.
6. Generate and save LiveKit token for participant.
7. Publish WaitingRoomParticipantAdmittedEvent.
```

## 6.3 DenyParticipantUseCase

```
Input: DenyParticipantCommand(meetingId, hostId, entryId, reason)

Steps:
1. Verify hostId has canMute() / canAdmitOthers() permissions.
2. Load WaitingRoomEntry.
3. Update entry:
   - resolution = DENIED
   - resolvedBy = hostId
   - resolvedAt = NOW
4. Save entry.
5. Call ParticipantRepository to update participant status to REMOVED.
6. Close participant waiting socket connection.
7. Publish WaitingRoomParticipantDeniedEvent.
```

---

# 7. Module Structure

```
feature-meeting/
└── waiting-room/
    ├── domain/
    │   ├── model/
    │   │   ├── WaitingRoomEntry.kt
    │   │   └── ResolutionStatus.kt
    │   ├── usecase/
    │   │   ├── KnockUseCase.kt
    │   │   ├── AdmitParticipantUseCase.kt
    │   │   └── DenyParticipantUseCase.kt
    │   └── port/
    │       └── WaitingRoomRepository.kt
    ├── data/
    │   └── WaitingRoomRepositoryImpl.kt
    └── presentation/
        └── WaitingRoomQueueViewModel.kt
```

---

End of Document
