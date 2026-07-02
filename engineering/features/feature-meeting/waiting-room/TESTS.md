# feature-meeting/waiting-room/TESTS.md

Document ID: WAITING-ROOM-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Waiting Room / Lobby Management

Subdomain: feature-meeting/waiting-room

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | KnockUseCase, AdmitParticipantUseCase, DenyParticipantUseCase | 90% |
| Integration | Postgres + TestContainers | WaitingRoomRepository | 80% |
| E2E | Maestro | Admit and Deny interface flows | Critical paths |

---

# 1. Unit Tests

## 1.1 KnockUseCase

```kotlin
describe("KnockUseCase") {

    it("should place active join requester in waiting room state") {
        val repository = mockk<WaitingRoomRepository>()
        val eventBus = mockk<EventBus>()

        coEvery { repository.save(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = KnockUseCase(repository, eventBus)
        val result = useCase(
            KnockCommand(
                meetingId = MeetingId("m1"),
                participantId = ParticipantId("p_waiting"),
                displayName = DisplayName("Guest User")
            )
        )

        result.isSuccess shouldBe true
        result.getOrNull()?.resolution shouldBe ResolutionStatus.WAITING
        coVerify { eventBus.publish(ofType<WaitingRoomEnteredEvent>()) }
    }
}
```

---

## 1.2 AdmitParticipantUseCase

```kotlin
describe("AdmitParticipantUseCase") {

    it("should update waiting room status, change participant status, and publish event") {
        val entry = WaitingRoomEntry(
            id = EntryId("e1"),
            meetingId = MeetingId("m1"),
            participantId = ParticipantId("p_waiting"),
            displayName = DisplayName("Guest User")
        )
        val repository = mockk<WaitingRoomRepository>()
        val participantRepo = mockk<ParticipantRepository>()
        val eventBus = mockk<EventBus>()

        coEvery { repository.findById(any()) } returns Result.success(entry)
        coEvery { repository.update(any()) } answers { Result.success(firstArg()) }
        coEvery { participantRepo.updateStatus(any(), any()) } returns Result.success(Unit)
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = AdmitParticipantUseCase(repository, participantRepo, eventBus)
        val result = useCase(
            AdmitParticipantCommand(
                meetingId = MeetingId("m1"),
                hostId = ParticipantId("p_host"),
                entryId = EntryId("e1")
            )
        )

        result.isSuccess shouldBe true
        result.getOrNull()?.resolution shouldBe ResolutionStatus.ADMITTED
        coVerify { participantRepo.updateStatus(ParticipantId("p_waiting"), ParticipantStatus.ACTIVE) }
        coVerify { eventBus.publish(ofType<WaitingRoomParticipantAdmittedEvent>()) }
    }
}
```

---

# 2. Integration Tests

```kotlin
@TestContainers
class WaitingRoomRepositoryIntegrationTest {

    @Test
    fun `should insert and query active lobby queue`() = runTest {
        val entry = WaitingRoomEntry(
            id = EntryId("entry_1"),
            meetingId = MeetingId("m_lobby_1"),
            participantId = ParticipantId("p_lobby_1"),
            displayName = DisplayName("Sarah")
        )

        repository.save(entry).getOrThrow()
        
        val activeQueue = repository.findByMeetingIdAndStatus(
            MeetingId("m_lobby_1"),
            ResolutionStatus.WAITING
        ).getOrThrow()

        activeQueue shouldHaveSize 1
        activeQueue.first().displayName shouldBe DisplayName("Sarah")
    }
}
```

---

# 3. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| WR-T-001 | Unauthenticated user knocks | Placed in lobby, status WAITING | P0 |
| WR-T-002 | Host admits guest | Guest joins WebRTC room immediately | P0 |
| WR-T-003 | Host denies guest | Connection closed, notification shown | P0 |
| WR-T-004 | Meeting ends with people in lobby | All waiting connections closed and cleaned | P1 |

---

End of Document
