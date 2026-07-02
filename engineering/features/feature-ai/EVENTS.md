# feature-ai/EVENTS.md

Document ID: AI-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: AI Meeting Assistant

Module: feature-ai

---

# Events Published

---

## AiSummaryUpdatedEvent

Published when the AI generates or updates a running meeting summary.

```yaml
Event: AiSummaryUpdatedEvent
Schema:
  eventId: string
  meetingId: string
  summaryText: string
  keyTopics: list of strings
  isFinal: boolean
  generatedAt: ISO8601
Routing:
  topic: ai.summary.updated
  partitionKey: meetingId
```

---

## AiActionItemDetectedEvent

Published when the AI detects a new action item from the transcript.

```yaml
Event: AiActionItemDetectedEvent
Schema:
  eventId: string
  meetingId: string
  actionItemId: string
  description: string
  assignedTo: string | null
  dueDate: string | null
  confidence: float
  detectedAt: ISO8601
Routing:
  topic: ai.action_item.detected
  partitionKey: meetingId
```

---

## AiReportGeneratedEvent

Published when the post-meeting report is ready.

```yaml
Event: AiReportGeneratedEvent
Schema:
  eventId: string
  meetingId: string
  reportId: string
  status: enum [READY, FAILED]
  generatedAt: ISO8601
Routing:
  topic: ai.report.generated
  partitionKey: meetingId

Side Effects:
  - feature-notification: Send report-ready email to host.
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `TranscriptSegmentCreatedEvent` | feature-translation | Feed segment to Gemini context window. |
| `MeetingEndedEvent` | feature-meeting/lifecycle | Trigger post-meeting report generation. |
| `ChatMessageSentEvent` | feature-chat | Detect `@AI` prefix and invoke Q&A pipeline. |

---

End of Document
