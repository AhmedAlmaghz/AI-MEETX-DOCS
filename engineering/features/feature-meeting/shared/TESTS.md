# feature-meeting/shared/TESTS.md

Document ID: SHARED-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Shared Kernel & Cross-Cutting Concerns

Subdomain: feature-meeting/shared

---

# Test Strategy

The `shared` subdomain exclusively contains pure Kotlin domain types. Tests are Unit-only — no mocks, no infrastructure required.

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit | JUnit 5 (pure) | 100% |

---

# 1. Value Object Tests

```kotlin
describe("MeetingId") {
    it("should hold the provided string value") {
        val id = MeetingId("meet_123")
        id.value shouldBe "meet_123"
    }
}

describe("DisplayName") {
    it("should accept valid display names") {
        val name = DisplayName("Sarah Connor")
        name.value shouldBe "Sarah Connor"
    }

    it("should reject blank display names") {
        shouldThrow<IllegalArgumentException> {
            DisplayName("   ")
        }
    }

    it("should reject display names longer than 128 characters") {
        shouldThrow<IllegalArgumentException> {
            DisplayName("a".repeat(129))
        }
    }
}

describe("RoomName") {
    it("should generate room name from meeting ID convention") {
        val room = RoomName.fromMeetingId(MeetingId("abc123"))
        room.value shouldBe "meeting_abc123"
    }
}
```

---

# 2. ParticipantRole Permission Tests

```kotlin
describe("ParticipantRole") {
    it("HOST should be able to mute others") {
        ParticipantRole.HOST.canMuteOthers() shouldBe true
    }

    it("ATTENDEE should not be able to mute others") {
        ParticipantRole.ATTENDEE.canMuteOthers() shouldBe false
    }

    it("HOST and CO_HOST should be able to manage roles") {
        ParticipantRole.HOST.canManageRoles() shouldBe true
        ParticipantRole.CO_HOST.canManageRoles() shouldBe true
        ParticipantRole.MODERATOR.canManageRoles() shouldBe false
    }
}
```

---

# 3. Domain Exception Tests

```kotlin
describe("MeetingDomainException hierarchy") {
    it("MeetingNotFoundException should carry correct code") {
        val ex = MeetingNotFoundException(MeetingId("m1"))
        ex.code shouldBe "MEETING_NOT_FOUND"
        ex.message shouldContain "m1"
    }

    it("InsufficientRoleException should describe required and actual role") {
        val ex = InsufficientRoleException(
            required = ParticipantRole.HOST,
            actual = ParticipantRole.ATTENDEE
        )
        ex.code shouldBe "INSUFFICIENT_ROLE"
        ex.message shouldContain "HOST"
        ex.message shouldContain "ATTENDEE"
    }

    it("InvitationExpiredException should carry correct code") {
        val ex = InvitationExpiredException("inv_123")
        ex.code shouldBe "INVITATION_EXPIRED"
    }
}
```

---

# 4. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SH-T-001 | All value objects validate constraints | Invalid data throws exception | P0 |
| SH-T-002 | ParticipantRole permission helpers return correct booleans | Role matrix enforced | P0 |
| SH-T-003 | Exception codes are unique and non-overlapping | No duplicate codes across all exceptions | P0 |

---

End of Document
