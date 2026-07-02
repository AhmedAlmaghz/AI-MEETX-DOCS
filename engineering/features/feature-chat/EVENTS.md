# feature-chat/EVENTS.md
Document ID: CHAT-EVT-001

Version: 1.0.0

Status: Approved

Feature: Meeting Chat

Priority: P1

Owner: Platform Architecture Team

Classification: Mandatory

---

# 1. Purpose

Defines the real-time messages events dispatched via EventBus.

---

# 2. Events

## EVT-CHAT-001: MessageSentEvent

**Trigger:** A participant submits a text message.

**Payload:**
```kotlin
data class MessageSentEvent(
    val eventId: String,
    val meetingId: String,
    val messageId: String,
    val senderId: String,
    val text: String,
    val isPrivate: Boolean,
    val timestamp: Instant
)
```

---

End of Document