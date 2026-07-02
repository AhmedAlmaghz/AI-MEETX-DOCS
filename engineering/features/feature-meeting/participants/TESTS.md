# feature-meeting/participants/TESTS.md

Document ID: PARTICIPANTS-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Participants Management

Subdomain: feature-meeting/participants

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | Domain logic, use cases | 90% |
| Integration | TestContainers (PostgreSQL) | Repository, DB queries | 80% |
| E2E | Maestro (Android) | Join flow, remove, role change | Critical paths |
| Contract | Pact | Event schema validation | 100% |

---

# 1. Unit Tests

## 1.1 ParticipantRole Permissions

```kotlin
describe("ParticipantRole") {

    it("HOST should have all permissions") {
        ParticipantRole.HOST.canMute() shouldBe true
        ParticipantRole.HOST.canRemove() shouldBe true
        ParticipantRole.HOST.canEndMeeting() shouldBe true
        ParticipantRole.HOST.canShareMedia() shouldBe true
        ParticipantRole.HOST.canPromoteOthers() shouldBe true
    }

    it("ATTENDEE should have minimal permissions") {
        ParticipantRole.ATTENDEE.canMute() shouldBe false
        ParticipantRole.ATTENDEE.canRemove() shouldBe false
        ParticipantRole.ATTENDEE.canEndMeeting() shouldBe false
        ParticipantRole.ATTENDEE.canShareMedia() shouldBe false
        ParticipantRole.ATTENDEE.canPromoteOthers() shouldBe false
    }

    it("MODERATOR should be able to mute and remove but not end meeting") {
        ParticipantRole.MODERATOR.canMute() shouldBe true
        ParticipantRole.MODERATOR.canRemove() shouldBe true
        ParticipantRole.MODERATOR.canEndMeeting() shouldBe false
        ParticipantRole.MODERATOR.canPromoteOthers() shouldBe false
    }

    it("SPEAKER should be able to share media but not moderate") {
        ParticipantRole.SPEAKER.canShareMedia() shouldBe true
        ParticipantRole.SPEAKER.canMute() shouldBe false
        ParticipantRole.SPEAKER.canRemove() shouldBe false
    }
}
```

---

## 1.2 JoinMeetingUseCase

```kotlin
describe("JoinMeetingUseCase") {

    describe("execute") {

        it("should succeed for valid meeting in ACTIVE state") {
            val repository = mockk<ParticipantRepository>()
            val eventBus = mockk<EventBus>()
            val livekitService = mockk<LivekitService>()

            coEvery { repository.save(any()) } answers { Result.success(firstArg()) }
            coEvery { eventBus.publish(any()) } just Runs
            coEvery { livekitService.generateToken(any(), any()) } returns "token_abc"

            val useCase = JoinMeetingUseCase(repository, eventBus, livekitService)
            val result = useCase(
                JoinMeetingCommand(
                    meetingId = MeetingId("m1"),
                    userId = UserId("u1"),
                    displayName = DisplayName("Ahmed")
                )
            )

            result.isSuccess shouldBe true
            result.getOrNull()?.participant?.role shouldBe ParticipantRole.ATTENDEE
        }

        it("should assign HOST role to the meeting creator") {
            val useCase = buildJoinUseCase(meetingCreatorUserId = "u1")
            val result = useCase(
                JoinMeetingCommand(MeetingId("m1"), UserId("u1"), DisplayName("Creator"))
            )
            result.getOrNull()?.participant?.role shouldBe ParticipantRole.HOST
        }

        it("should publish ParticipantJoinedEvent on success") {
            val eventBus = mockk<EventBus>()
            coEvery { eventBus.publish(any()) } just Runs

            val useCase = buildJoinUseCase(eventBus = eventBus)
            useCase(JoinMeetingCommand(MeetingId("m1"), UserId("u2"), DisplayName("Sara")))

            coVerify { eventBus.publish(ofType<ParticipantJoinedEvent>()) }
        }

        it("should fail when participant is banned") {
            val banRepository = mockk<BanRepository>()
            coEvery { banRepository.isBanned(any(), any()) } returns true

            val useCase = buildJoinUseCase(banRepository = banRepository)
            val result = useCase(
                JoinMeetingCommand(MeetingId("m1"), UserId("u_banned"), DisplayName("Banned"))
            )

            result.isFailure shouldBe true
            result.exceptionOrNull() shouldBeInstanceOf ParticipantBannedException::class
        }

        it("should fail when meeting participant count is at limit") {
            val repository = mockk<ParticipantRepository>()
            coEvery { repository.countActiveByMeetingId(any()) } returns Result.success(500)

            val useCase = buildJoinUseCase(repository = repository)
            val result = useCase(
                JoinMeetingCommand(MeetingId("m1"), UserId("u_new"), DisplayName("New"))
            )

            result.isFailure shouldBe true
            result.exceptionOrNull() shouldBeInstanceOf MeetingFullException::class
        }
    }
}
```

---

## 1.3 RemoveParticipantUseCase

```kotlin
describe("RemoveParticipantUseCase") {

    it("should fail when caller does not have MODERATOR or higher role") {
        val caller = buildParticipant(role = ParticipantRole.ATTENDEE)
        val target = buildParticipant(role = ParticipantRole.ATTENDEE)

        val useCase = buildRemoveUseCase(caller = caller, target = target)
        val result = useCase(
            RemoveParticipantCommand(
                meetingId = MeetingId("m1"),
                removedBy = caller.id,
                targetId = target.id,
                reason = "Test"
            )
        )

        result.isFailure shouldBe true
        result.exceptionOrNull() shouldBeInstanceOf InsufficientRoleException::class
    }

    it("should succeed when caller is HOST") {
        val host = buildParticipant(role = ParticipantRole.HOST)
        val target = buildParticipant(role = ParticipantRole.ATTENDEE)

        val useCase = buildRemoveUseCase(caller = host, target = target)
        val result = useCase(
            RemoveParticipantCommand(MeetingId("m1"), host.id, target.id, "Test removal")
        )

        result.isSuccess shouldBe true
    }
}
```

---

## 1.4 LeaveMeetingUseCase — Host Transfer

```kotlin
describe("LeaveMeetingUseCase") {

    it("should end meeting when host leaves with no co-host") {
        val eventBus = mockk<EventBus>()
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = buildLeaveUseCase(
            eventBus = eventBus,
            participantRole = ParticipantRole.HOST,
            hasCoHost = false
        )
        useCase(LeaveMeetingCommand(MeetingId("m1"), ParticipantId("host_1")))

        coVerify { eventBus.publish(ofType<MeetingEndedEvent>()) }
    }

    it("should NOT end meeting when host leaves with co-host present") {
        val eventBus = mockk<EventBus>()
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = buildLeaveUseCase(
            eventBus = eventBus,
            participantRole = ParticipantRole.HOST,
            hasCoHost = true
        )
        useCase(LeaveMeetingCommand(MeetingId("m1"), ParticipantId("host_1")))

        coVerify(exactly = 0) { eventBus.publish(ofType<MeetingEndedEvent>()) }
        coVerify { eventBus.publish(ofType<ParticipantRoleChangedEvent>()) }
    }
}
```

---

# 2. Integration Tests

## 2.1 ParticipantRepository

```kotlin
@TestContainers
class ParticipantRepositoryIntegrationTest {

    @Test
    fun `should save and retrieve participant by meeting and user`() = runTest {
        val participant = buildTestParticipant(
            meetingId = MeetingId("m_int_001"),
            userId = UserId("u_int_001")
        )
        repository.save(participant)

        val found = repository.findByMeetingIdAndUserId(
            MeetingId("m_int_001"),
            UserId("u_int_001")
        ).getOrThrow()

        found shouldNotBe null
        found?.displayName shouldBe participant.displayName
    }

    @Test
    fun `should count only active participants`() = runTest {
        val meetingId = MeetingId("m_int_002")
        repository.save(buildTestParticipant(meetingId, status = ParticipantStatus.ACTIVE))
        repository.save(buildTestParticipant(meetingId, status = ParticipantStatus.ACTIVE))
        repository.save(buildTestParticipant(meetingId, status = ParticipantStatus.LEFT))

        val count = repository.countActiveByMeetingId(meetingId).getOrThrow()
        count shouldBe 2
    }
}
```

---

# 3. End-to-End Tests (Maestro)

## 3.1 Join Meeting Flow

```yaml
# maestro/participants_join_meeting.yaml
appId: com.aimeetx.app
---
- launchApp
- tapOn: "Join Meeting"
- inputText:
    id: meeting_code_input
    text: "ABC-123"
- tapOn: "Join"
- assertVisible: "You joined the meeting"
- assertVisible: "Participants (1)"
```

## 3.2 Host Removes Participant

```yaml
# maestro/host_remove_participant.yaml
appId: com.aimeetx.app
---
- tapOn: "Participants"
- longPressOn: "Sara Ahmad"
- tapOn: "Remove from Meeting"
- inputText:
    id: removal_reason_input
    text: "Test removal"
- tapOn: "Confirm Remove"
- assertNotVisible: "Sara Ahmad"
```

---

# 4. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PA-T-001 | ATTENDEE joins meeting | Joins successfully with ATTENDEE role | P0 |
| PA-T-002 | Creator joins meeting | Joins with HOST role | P0 |
| PA-T-003 | Banned user tries to join | Returns 403 | P0 |
| PA-T-004 | HOST removes ATTENDEE | Participant removed, ban record created | P0 |
| PA-T-005 | ATTENDEE tries to remove someone | Returns 403 InsufficientRole | P0 |
| PA-T-006 | Host leaves, no co-host | Meeting ends automatically | P0 |
| PA-T-007 | Host leaves with co-host | Co-host promoted to host | P0 |
| PA-T-008 | Host mutes participant | Participant is muted | P1 |
| PA-T-009 | Host tries to unmute participant | Must be done by participant | P1 |
| PA-T-010 | Waiting room enabled | Participant waits for approval | P1 |
| PA-T-011 | Meeting full (500 participants) | Returns 422 MeetingFull | P1 |
| PA-T-012 | Participant rejoins after network drop | Reconnects with same participantId | P2 |

---

End of Document
