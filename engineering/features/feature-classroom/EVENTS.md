# feature-classroom/EVENTS.md

Document ID: CLASSROOM-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Virtual Classroom

Module: feature-classroom

---

# Events Published

---

## QuizCreatedEvent

```yaml
Event: QuizCreatedEvent
Schema:
  eventId: string
  meetingId: string
  classroomSessionId: string
  quizId: string
  question: string
  optionCount: integer
  status: enum [DRAFT, ACTIVE]
  createdAt: ISO8601
Routing:
  topic: classroom.quiz.created
  partitionKey: meetingId
```

---

## QuizResultsUpdatedEvent

```yaml
Event: QuizResultsUpdatedEvent
Schema:
  eventId: string
  meetingId: string
  quizId: string
  totalResponses: integer
  results: list of { optionId, count, percentage }
  updatedAt: ISO8601
Routing:
  topic: classroom.quiz.results_updated
  partitionKey: meetingId
```

---

## ClassroomPausedEvent

```yaml
Event: ClassroomPausedEvent
Schema:
  eventId: string
  meetingId: string
  classroomSessionId: string
  pausedBy: string
  pausedAt: ISO8601
Routing:
  topic: classroom.session.paused
  partitionKey: meetingId
```

---

## BreakoutRoomsCreatedEvent

```yaml
Event: BreakoutRoomsCreatedEvent
Schema:
  eventId: string
  meetingId: string
  classroomSessionId: string
  rooms: list of { id, name, participantCount }
  createdAt: ISO8601
Routing:
  topic: classroom.breakout_rooms.created
  partitionKey: meetingId
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `ParticipantJoinedEvent` | feature-meeting/participants | Create attendance record with joinedAt. |
| `ParticipantLeftEvent` | feature-meeting/participants | Update attendance record with leftAt, compute duration. |
| `MeetingEndedEvent` | feature-meeting/lifecycle | Close classroom session, finalize all attendance records. |

---

End of Document
