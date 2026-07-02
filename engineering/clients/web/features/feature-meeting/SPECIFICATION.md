# Web Meeting UI Specifications

Document ID: WEB-MEETING-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Routing Model

- `/meeting/[roomId]` - Live meeting session interface layout.
- `/meeting/[roomId]/lobby` - Waiting lobby staging view.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useMeetingRoom(roomId)`: Tracks active room details, statuses, and configurations.
- `useLobbyQueue(roomId)`: Dynamic roster of waiting participants.
- `useAdmitParticipantMutation()`: Host action to approve lobby entry.
- `usePresenceHeartbeat()`: Fires periodic socket events confirming user active state.

---

# 3. Host Operations Panel

The host layout triggers mutations directly via generated platform SDK hooks. All active states (like mutes or raises) dispatch actions to socket channels.
