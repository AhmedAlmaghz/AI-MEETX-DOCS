# feature-meeting/invitations/TESTS.md

Document ID: INVITATIONS-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Invitations & RSVP

Subdomain: feature-meeting/invitations

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | CreateInvitationUseCase, RespondToInvitationUseCase | 90% |
| Integration | Postgres + TestContainers | InvitationRepository, Hashing methods | 80% |
| E2E | Maestro | Email link click simulation, RSVP update | Critical flows |

---

# 1. Unit Tests

## 1.1 CreateInvitationUseCase

```kotlin
describe("CreateInvitationUseCase") {

    it("should generate cryptographically secure token and save invitation") {
        val repository = mockk<InvitationRepository>()
        val eventBus = mockk<EventBus>()

        coEvery { repository.save(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = CreateInvitationUseCase(repository, eventBus)
        val result = useCase(
            CreateInvitationCommand(
                meetingId = MeetingId("m1"),
                hostId = ParticipantId("host_1"),
                inviteeEmail = "test@example.com",
                inviteeName = "Test User",
                role = ParticipantRole.SPEAKER,
                lifespanHours = 24
            )
        )

        result.isSuccess shouldBe true
        val invitation = result.getOrNull()
        invitation?.token?.value?.length shouldBeGreaterThanOrEqualTo 32
        invitation?.inviteeRole shouldBe ParticipantRole.SPEAKER
        coVerify { eventBus.publish(ofType<InvitationCreatedEvent>()) }
    }

    it("should fail if non-host tries to invite") {
        val useCase = buildCreateInvitationUseCase(callerRole = ParticipantRole.ATTENDEE)
        val result = useCase(
            CreateInvitationCommand(MeetingId("m1"), ParticipantId("att_1"), "t@ex.com", null, ParticipantRole.SPEAKER, 24)
        )
        result.isFailure shouldBe true
    }
}
```

---

## 1.2 RespondToInvitationUseCase

```kotlin
describe("RespondToInvitationUseCase") {

    it("should update RSVP status to ACCEPTED and publish event") {
        val repository = mockk<InvitationRepository>()
        val eventBus = mockk<EventBus>()
        val invitation = buildInvitation(status = RSVPStatus.PENDING)

        coEvery { repository.findByToken(any()) } returns Result.success(invitation)
        coEvery { repository.update(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = RespondToInvitationUseCase(repository, eventBus)
        val result = useCase(
            RespondToInvitationCommand(
                token = InvitationToken("tok_12345678901234567890123456789012"),
                status = RSVPStatus.ACCEPTED
            )
        )

        result.isSuccess shouldBe true
        result.getOrNull()?.status shouldBe RSVPStatus.ACCEPTED
        coVerify { eventBus.publish(ofType<InvitationRsvpUpdatedEvent>()) }
    }

    it("should fail if invitation is expired") {
        val invitation = buildInvitation(status = RSVPStatus.PENDING, expiresAt = Instant.now().minusSeconds(100))
        val repository = mockk<InvitationRepository>()
        coEvery { repository.findByToken(any()) } returns Result.success(invitation)

        val useCase = RespondToInvitationUseCase(repository, mockk())
        val result = useCase(
            RespondToInvitationCommand(
                token = InvitationToken("tok_12345678901234567890123456789012"),
                status = RSVPStatus.ACCEPTED
            )
        )

        result.isFailure shouldBe true
        result.exceptionOrNull() shouldBeInstanceOf InvitationExpiredException::class
    }
}
```

---

# 2. Integration Tests

```kotlin
@TestContainers
class InvitationRepositoryIntegrationTest {

    @Test
    fun `should insert and find invitation details`() = runTest {
        val invite = MeetingInvitation(
            id = InvitationId("inv_1"),
            meetingId = MeetingId("m1"),
            inviteeEmail = "sarah@ex.com",
            token = InvitationToken("token_12345678901234567890123456789012"),
            expiresAt = Instant.now().plusSeconds(3600)
        )

        repository.save(invite).getOrThrow()
        val found = repository.findByToken(invite.token).getOrThrow()

        found shouldNotBe null
        found?.inviteeEmail shouldBe "sarah@ex.com"
    }
}
```

---

# 3. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| IN-T-001 | Send bulk invitations | Emails sent, PENDING records created in DB | P0 |
| IN-T-002 | Invitee accepts invite | RSVP status ACCEPTED, notified host | P0 |
| IN-T-003 | Join with valid accepted token | User successfully joins meeting | P0 |
| IN-T-004 | Join with expired token | Access denied, returns 403 | P0 |
| IN-T-005 | Join with wrong passcode | Access denied, passcode required | P0 |

---

End of Document
