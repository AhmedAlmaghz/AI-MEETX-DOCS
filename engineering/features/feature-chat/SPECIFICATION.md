# feature-chat/SPECIFICATION.md
Document ID: CHAT-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Chat

Priority: P1

Owner: Platform Architecture Team

Classification: Mandatory

---

# 1. Purpose

Outlines core interfaces, message routing, and UI-state abstractions for the Meeting Chat subdomain.

---

# 2. Domain Models

```kotlin
data class ChatMessage(
    val id: String,
    val meetingId: String,
    val senderId: String,
    val text: String,
    val threadId: String?,
    val isPrivate: Boolean,
    val recipientId: String?,
    val sentAt: Instant
)
```

---

# 3. Domain Interfaces

```kotlin
interface ChatRepository {
    suspend fun saveMessage(message: ChatMessage): Result<Unit>
    suspend fun getMessagesByMeeting(meetingId: MeetingId): Result<List<ChatMessage>>
}
```

---

End of Document