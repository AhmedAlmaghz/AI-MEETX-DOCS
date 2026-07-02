# Web Chat UI Specifications

Document ID: WEB-CHAT-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Component Structure

- `ChatSidebar`: Parent sidebar widget.
- `MessageFeed`: Scrollable message container.
- `MessageBubble`: Single text/file attachment box.
- `ChatInput`: Text area supporting submissions and staging file dropzone.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useChatMessages(roomId)`: Real-time query returning room message arrays.
- `useSendChatMessage()`: Mutation payload sender.
- `useUploadChatFile()`: Handles storage staging and yields attachment URL models.
