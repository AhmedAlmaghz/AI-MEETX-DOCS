# feature-notification/SPECIFICATION.md

Document ID: NOTIF-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Notification System

Module: feature-notification

---

# 1. Domain Models

## 1.1 Notification (Aggregate Root)

```kotlin
data class Notification(
    val id: NotificationId,
    val recipientId: UserId,
    val type: NotificationType,
    val channel: NotificationChannel,
    val title: String,
    val body: String,
    val data: Map<String, String> = emptyMap(),   // Deep link data for push
    val status: NotificationStatus = NotificationStatus.PENDING,
    val idempotencyKey: String,
    val createdAt: Instant = Instant.now(),
    val sentAt: Instant? = null
)
```

## 1.2 UserNotificationPreferences (Entity)

```kotlin
data class UserNotificationPreferences(
    val userId: UserId,
    val preferences: Map<NotificationType, Set<NotificationChannel>>
)
```

---

# 2. Value Objects

```kotlin
@JvmInline value class NotificationId(val value: String)

enum class NotificationChannel { PUSH, EMAIL, SMS }

enum class NotificationStatus { PENDING, SENT, FAILED, SUPPRESSED }

enum class NotificationType {
    MEETING_INVITATION,
    RSVP_UPDATE,
    MEETING_REMINDER,
    MEETING_STARTED,
    MEETING_CANCELLED,
    RECORDING_READY,
    AI_REPORT_READY,
    PARTICIPANT_ADMITTED,
    SPEAK_PERMISSION_GRANTED
}
```

---

# 3. Service Contracts

## 3.1 NotificationService

```kotlin
interface NotificationService {
    suspend fun send(
        recipientId: UserId,
        type: NotificationType,
        title: String,
        body: String,
        channels: Set<NotificationChannel>,
        data: Map<String, String> = emptyMap(),
        idempotencyKey: String
    ): Result<List<Notification>>
}
```

## 3.2 Channel Gateways

```kotlin
interface PushGateway {
    suspend fun send(deviceToken: String, title: String, body: String, data: Map<String, String>): Result<Unit>
}

interface EmailGateway {
    suspend fun send(toEmail: String, toName: String?, subject: String, htmlBody: String, icsAttachment: ByteArray? = null): Result<Unit>
}

interface SmsGateway {
    suspend fun send(phoneNumber: String, body: String): Result<Unit>
}
```

---

# 4. Notification Pipeline

```
Domain Event (from any module)
    ↓
EventHandler (maps event → NotificationCommand)
    ↓
PreferenceCheck (load UserNotificationPreferences)
    ↓
IdempotencyCheck (suppress if sent within 60s)
    ↓
TemplateRenderer (renders HTML/plain text using Thymeleaf)
    ↓
ChannelDispatcher → [PushGateway | EmailGateway | SmsGateway]
    ↓
Notification saved with status SENT/FAILED
```

---

# 5. Repository Contracts

```kotlin
interface NotificationRepository {
    suspend fun save(notification: Notification): Result<Notification>
    suspend fun findByIdempotencyKey(key: String): Result<Notification?>
    suspend fun findByRecipientId(userId: UserId, page: Int, pageSize: Int): Result<List<Notification>>
}

interface PreferencesRepository {
    suspend fun findByUserId(userId: UserId): Result<UserNotificationPreferences?>
    suspend fun save(prefs: UserNotificationPreferences): Result<UserNotificationPreferences>
}
```

---

# 6. Module Structure

```
feature-notification/
├── domain/
│   ├── model/
│   │   ├── Notification.kt
│   │   ├── NotificationType.kt
│   │   └── UserNotificationPreferences.kt
│   ├── usecase/
│   │   └── SendNotificationUseCase.kt
│   └── port/
│       ├── NotificationRepository.kt
│       └── PreferencesRepository.kt
├── data/
│   ├── NotificationRepositoryImpl.kt
│   ├── FcmPushGateway.kt
│   ├── SendGridEmailGateway.kt
│   └── TwilioSmsGateway.kt
├── handler/
│   ├── InvitationCreatedHandler.kt
│   ├── MeetingReminderHandler.kt
│   ├── RecordingReadyHandler.kt
│   └── AiReportReadyHandler.kt
└── template/
    ├── invitation_email.html
    ├── reminder_email.html
    └── recording_ready_email.html
```

---

End of Document
