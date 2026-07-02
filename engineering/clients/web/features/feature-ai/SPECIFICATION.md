# Web AI UI Specifications

Document ID: WEB-AI-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Component Structure

- `AiAssistantPanel`: Sidebar containing summary and Q&A sub-views.
- `SummaryView`: Displays running chronological meeting logs.
- `QaAssistant`: Dialogue cards mapping responses to user inputs.
- `ActionItemTracker`: Checklists allowing participant updates.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useMeetingSummary(roomId)`: Queries real-time computed summaries.
- `useAiAssistantMutation()`: Posts custom prompt strings to model gateways.
- `useActionItems(roomId)`: Renders item list mappings.
