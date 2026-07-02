# Web Classroom UI Specifications

Document ID: WEB-CLASS-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Component Structure

- `Whiteboard`: Drawing canvas listening to local pointer events and syncing strokes via WebSocket channels.
- `QuizModal`: Overlays viewport displaying questions and inputs.
- `BreakoutTimer`: Floating overlay managing breakout session transitions.
- `AttendanceGrid`: Displays attendance statistics and export triggers.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useWhiteboardSync(roomId)`: Subscribes to drawing sync WebSocket channels.
- `useActiveQuizzes(roomId)`: Queries active published quizzes.
- `useSubmitQuizAnswers()`: Submits student response payloads.
- `useAttendanceRecords(roomId)`: Fetches attendance data lists.
