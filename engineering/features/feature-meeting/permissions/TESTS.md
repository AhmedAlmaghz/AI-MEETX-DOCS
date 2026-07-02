# feature-meeting/permissions/TESTS.md

Document ID: PERMISSIONS-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Permissions & Role-Based Access Control

Subdomain: feature-meeting/permissions

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | CheckPermissionUseCase, RaiseHandUseCase, GrantSpeakUseCase | 90% |
| Integration | TestContainers (Postgres) | PermissionsRepository, LiveKit client mock | 80% |
| E2E | Maestro | Dynamic audio lock, speak request flow | Critical paths |

---

# 1. Unit Tests

## 1.1 CheckPermissionUseCase

```kotlin
describe("CheckPermissionUseCase") {

    it("HOST should bypass attendee lockdowns and have all permissions") {
        val useCase = buildCheckPermissionUseCase(
            globalLocks = MeetingPermissions(meetingId = MeetingId("m1"), lockAttendeeAudio = true),
            role = ParticipantRole.HOST
        )

        useCase(MeetingId("m1"), ParticipantId("p_host"), PermissionFlag.PUBLISH_AUDIO) shouldBe true
    }

    it("ATTENDEE should be blocked when lockAttendeeAudio is true") {
        val useCase = buildCheckPermissionUseCase(
            globalLocks = MeetingPermissions(meetingId = MeetingId("m1"), lockAttendeeAudio = true),
            role = ParticipantRole.ATTENDEE
        )

        useCase(MeetingId("m1"), ParticipantId("p_att"), PermissionFlag.PUBLISH_AUDIO) shouldBe false
    }

    it("ATTENDEE should have SEND_CHAT by default if not locked") {
        val useCase = buildCheckPermissionUseCase(
            globalLocks = MeetingPermissions(meetingId = MeetingId("m1"), lockAttendeeChat = false),
            role = ParticipantRole.ATTENDEE
        )

        useCase(MeetingId("m1"), ParticipantId("p_att"), PermissionFlag.SEND_CHAT) shouldBe true
    }

    it("ATTENDEE should be allowed to speak if they have custom speak override") {
        val useCase = buildCheckPermissionUseCase(
            globalLocks = MeetingPermissions(meetingId = MeetingId("m1"), lockAttendeeAudio = true),
            role = ParticipantRole.ATTENDEE,
            override = ParticipantPermissionOverride(
                id = OverrideId("o1"),
                meetingId = MeetingId("m1"),
                participantId = ParticipantId("p_att"),
                allowedPermissions = setOf(PermissionFlag.PUBLISH_AUDIO)
            )
        )

        useCase(MeetingId("m1"), ParticipantId("p_att"), PermissionFlag.PUBLISH_AUDIO) shouldBe true
    }
}
```

---

## 1.2 GrantSpeakUseCase

```kotlin
describe("GrantSpeakUseCase") {

    it("should allow MODERATOR to grant speak permission and update LiveKit") {
        val gateway = mockk<LivekitGateway>()
        val repository = mockk<PermissionsRepository>()
        val eventBus = mockk<EventBus>()

        coEvery { repository.saveOverride(any()) } answers { Result.success(firstArg()) }
        coEvery { gateway.muteParticipantTrack(any(), any(), any()) } returns Result.success(Unit) // dummy or update permissions
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = GrantSpeakUseCase(gateway, repository, eventBus)
        val result = useCase(
            GrantSpeakCommand(
                meetingId = MeetingId("m1"),
                hostId = ParticipantId("p_host"),
                targetParticipantId = ParticipantId("p_attendee")
            )
        )

        result.isSuccess shouldBe true
        coVerify { eventBus.publish(ofType<SpeakPermissionGrantedEvent>()) }
    }
}
```

---

# 2. Integration Tests

```kotlin
@TestContainers
class PermissionsRepositoryIntegrationTest {

    @Test
    fun `should persist and retrieve override policies`() = runTest {
        val override = ParticipantPermissionOverride(
            id = OverrideId("o_123"),
            meetingId = MeetingId("m_int_1"),
            participantId = ParticipantId("p_int_1"),
            allowedPermissions = setOf(PermissionFlag.PUBLISH_AUDIO),
            deniedPermissions = setOf(PermissionFlag.SEND_CHAT)
        )
        
        repository.saveOverride(override).getOrThrow()
        val found = repository.findOverride(ParticipantId("p_int_1")).getOrThrow()

        found shouldNotBe null
        found?.allowedPermissions shouldContain PermissionFlag.PUBLISH_AUDIO
        found?.deniedPermissions shouldContain PermissionFlag.SEND_CHAT
    }
}
```

---

# 3. End-to-End Tests (Maestro)

## 3.1 Hand Raise and Speak Grant Flow

```yaml
# maestro/permissions_hand_raise.yaml
appId: com.aimeetx.app
---
# As Attendee
- launchApp
- tapOn: "Raise Hand"
- assertVisible: "Hand is raised"

# As Host (simulated view switcher)
- tapOn: "Host Controls"
- assertVisible: "Sarah Connor (Hand Raised)"
- tapOn: "Grant Speaking Rights"
- assertVisible: "Speaking permission granted to Sarah Connor"
```

---

# 4. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PM-T-001 | Attendee raises hand | Hand-raised event is broadcast, Host notified | P0 |
| PM-T-002 | Host locks audio | Attendees' audio tracks are disabled automatically | P0 |
| PM-T-003 | Host grants speaking rights | Attendee's client is unmuted, track is enabled | P0 |
| PM-T-004 | Attendee tries to share screen | Rejected by default permissions check | P1 |
| PM-T-005 | Host overrides screen share | Attendee screen share track successfully published | P1 |

---

End of Document
