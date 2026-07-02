# feature-chat/TESTS.md
Document ID: CHAT-TEST-001

Version: 1.0.0

Status: Approved

Feature: Meeting Chat

Priority: P1

Owner: Quality Engineering Team

Classification: Mandatory

---

# 1. Purpose

Defines test matrix for chat history retrieval, direct messaging permission logic, and thread delivery.

---

# 2. Scenarios

## Unit Testing
- Validate text filters (prevent spamming, blank checks).
- Assert thread messages associate to their correct parent UUID.

## Integration Testing
- Assert websocket broadcasts to the room target when a user fires `MessageSentEvent`.

---

End of Document