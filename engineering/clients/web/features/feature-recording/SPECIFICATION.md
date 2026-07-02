# Web Recording UI Specifications

Document ID: WEB-REC-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Component Structure

- `/dashboard/recordings` - Displays past recording listings.
- `VideoPlayer`: Custom HTML5 player widget wrapper supporting playback triggers.
- `RecordingToolbarControls`: Host-only start/stop recording action button panel.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useRecordingsList()`: Queries list collections of past room sessions.
- `useStartRecordingMutation()`: Host trigger to activate LiveKit composite recording.
- `useStopRecordingMutation()`: Halts active recordings.
