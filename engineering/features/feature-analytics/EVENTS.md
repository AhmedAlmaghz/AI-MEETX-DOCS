# feature-analytics/EVENTS.md

Document ID: ANALYTICS-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Analytics & Insights

Module: feature-analytics

---

# Overview

`feature-analytics` is a **pure consumer** of domain events. It publishes no events of its own. Its outputs are database writes (fact records and pre-computed summaries) that power the analytics API.

---

# Events Consumed

| Event | Source | Handler | Fact Written |
|-------|--------|---------|-------------|
| `MeetingEndedEvent` | feature-meeting/lifecycle | `MeetingEndedConsumer` | Insert into `meeting_facts` |
| `ParticipantJoinedEvent` | feature-meeting/participants | `ParticipantJoinedConsumer` | Increment `user_engagement_facts.meetings_attended` |
| `MeetingStartedEvent` | feature-meeting/lifecycle | `MeetingStartedConsumer` | Update `user_engagement_facts.meetings_hosted` for host |
| `RecordingReadyEvent` | feature-recording | `RecordingReadyConsumer` | Update `meeting_facts.recording_minutes` |
| `AiReportGeneratedEvent` | feature-ai | `AiReportConsumer` | Set `meeting_facts.ai_enabled = true` |
| `TranscriptSegmentCreatedEvent` | feature-translation | `TranslationConsumer` | Accumulate `meeting_facts.translation_minutes` |

---

# Aggregation Job

```
Trigger:  Cron every 5 minutes

Steps:
1. Query all meetings ended in the last 10 minutes (fact window).
2. Recompute tenant_daily_summaries for affected dates.
3. Recompute platform_daily_summaries for affected dates.
4. Update last_computed_at timestamps.
```

---

End of Document
