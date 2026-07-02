# feature-notification/TESTS.md

Document ID: NOTIF-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Notification System

Module: feature-notification

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | SendNotificationUseCase, handlers, idempotency logic | 90% |
| Integration | WireMock (FCM/SendGrid) | Gateway HTTP calls | 80% |
| E2E | Manual / Firebase Test Lab | Push delivery end-to-end | Critical paths |

---

# 1. Unit Tests

## 1.1 SendNotificationUseCase — Idempotency

```kotlin
describe("SendNotificationUseCase - Idempotency") {

    it("should suppress duplicate notification within 60 seconds") {
        val repo = mockk<NotificationRepository>()
        val pushGateway = mockk<PushGateway>()
        val existingNotif = buildNotification(
            status = NotificationStatus.SENT,
            sentAt = Instant.now().minusSeconds(30) // Sent 30s ago
        )

        coEvery { repo.findByIdempotencyKey(any()) } returns Result.success(existingNotif)

        val useCase = SendNotificationUseCase(repo, pushGateway, mockk(), mockk())
        val result = useCase(
            SendNotificationCommand(
                recipientId = UserId("u1"),
                type = NotificationType.MEETING_REMINDER,
                title = "Reminder",
                body = "Meeting in 15 min",
                channels = setOf(NotificationChannel.PUSH),
                idempotencyKey = "key_reminder_123"
            )
        )

        result.isSuccess shouldBe true
        coVerify(exactly = 0) { pushGateway.send(any(), any(), any(), any()) }
    }
}
```

---

## 1.2 SendNotificationUseCase — Preference Filtering

```kotlin
describe("SendNotificationUseCase - Preferences") {

    it("should skip EMAIL channel if user has disabled EMAIL for MEETING_REMINDER") {
        val emailGateway = mockk<EmailGateway>()
        val preferences = UserNotificationPreferences(
            userId = UserId("u1"),
            preferences = mapOf(NotificationType.MEETING_REMINDER to setOf(NotificationChannel.PUSH))
        )

        val useCase = buildSendNotificationUseCaseWithPreferences(preferences = preferences)
        useCase(
            SendNotificationCommand(
                recipientId = UserId("u1"),
                type = NotificationType.MEETING_REMINDER,
                title = "Reminder",
                body = "Meeting soon",
                channels = setOf(NotificationChannel.PUSH, NotificationChannel.EMAIL),
                idempotencyKey = "key_123"
            )
        )

        coVerify(exactly = 0) { emailGateway.send(any(), any(), any(), any()) }
    }
}
```

---

# 2. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| NT-T-001 | Invitation created → email sent | Invitee receives email with ICS | P0 |
| NT-T-002 | Reminder 15 min before meeting | Push + email delivered on time | P0 |
| NT-T-003 | User disables push notifications | No push sent, email still sent | P0 |
| NT-T-004 | Duplicate reminder within 60s | Second notification suppressed | P0 |
| NT-T-005 | Recording ready event | Host receives download link email | P1 |

---

End of Document
