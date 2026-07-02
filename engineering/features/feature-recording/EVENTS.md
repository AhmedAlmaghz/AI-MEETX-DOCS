# feature-recording/EVENTS.md

Document ID: RECORDING-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Recording

Module: feature-recording

---

# Events Published

---

## RecordingStartedEvent

```yaml
Event: RecordingStartedEvent
Schema:
  eventId: string
  meetingId: string
  recordingId: string
  layout: enum [SPEAKER_VIEW, GALLERY_VIEW, AUDIO_ONLY]
  startedBy: string
  startedAt: ISO8601
Routing:
  topic: recording.started
  partitionKey: meetingId
```

---

## RecordingStoppedEvent

```yaml
Event: RecordingStoppedEvent
Schema:
  eventId: string
  meetingId: string
  recordingId: string
  stoppedBy: string
  stoppedAt: ISO8601
Routing:
  topic: recording.stopped
  partitionKey: meetingId
```

---

## RecordingReadyEvent

```yaml
Event: RecordingReadyEvent
Schema:
  eventId: string
  meetingId: string
  recordingId: string
  storageUrl: string
  fileSizeBytes: long
  durationSeconds: long
  expiresAt: ISO8601
  readyAt: ISO8601
Routing:
  topic: recording.ready
  partitionKey: meetingId

Side Effects:
  - feature-notification: Notify host that recording is ready for download.
```

---

## RecordingFailedEvent

```yaml
Event: RecordingFailedEvent
Schema:
  eventId: string
  meetingId: string
  recordingId: string
  reason: string
  failedAt: ISO8601
Routing:
  topic: recording.failed
  partitionKey: meetingId
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingEndedEvent` | feature-meeting/lifecycle | Auto-stop any active recordings. |

---

End of Document
