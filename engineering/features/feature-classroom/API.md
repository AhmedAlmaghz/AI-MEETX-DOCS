# feature-classroom/API.md

Document ID: CLASSROOM-API-001

Version: 1.0.0

Status: Approved

Feature: Virtual Classroom

Base Path: /api/v1/classrooms/{meetingId}

---

## 1. Get Classroom Session

```
GET /api/v1/classrooms/{meetingId}
```

### Response (200 OK)

```json
{
  "classroomId": "cls_abc123",
  "meetingId": "meeting_xyz",
  "status": "ACTIVE",
  "allowStudentWhiteboard": false
}
```

---

## 2. Pause / Resume Classroom

```
POST /api/v1/classrooms/{meetingId}/pause
POST /api/v1/classrooms/{meetingId}/resume
```

### Response (200 OK)

```json
{ "status": "PAUSED" }
```

---

## 3. Create Quiz

```
POST /api/v1/classrooms/{meetingId}/quizzes
```

### Request Body

```json
{
  "question": "What is the capital of France?",
  "options": [
    { "id": "a", "text": "Berlin" },
    { "id": "b", "text": "Paris" },
    { "id": "c", "text": "Madrid" }
  ],
  "correctOptionId": "b",
  "showCorrectAnswer": true,
  "activateNow": true
}
```

### Response (201 Created)

```json
{
  "quizId": "quiz_001",
  "status": "ACTIVE",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

## 4. Get Quiz Results

```
GET /api/v1/classrooms/{meetingId}/quizzes/{quizId}/results
```

### Response (200 OK)

```json
{
  "quizId": "quiz_001",
  "question": "What is the capital of France?",
  "totalResponses": 24,
  "results": [
    { "optionId": "a", "text": "Berlin", "count": 3, "percentage": 12.5 },
    { "optionId": "b", "text": "Paris",  "count": 19, "percentage": 79.2 },
    { "optionId": "c", "text": "Madrid", "count": 2, "percentage": 8.3 }
  ]
}
```

---

## 5. Create Breakout Rooms

```
POST /api/v1/classrooms/{meetingId}/breakout-rooms
```

### Request Body

```json
{
  "rooms": [
    { "name": "Group A", "participantIds": ["par_001", "par_002"] },
    { "name": "Group B", "participantIds": ["par_003", "par_004"] }
  ]
}
```

### Response (201 Created)

```json
{
  "breakoutRooms": [
    { "id": "br_001", "name": "Group A", "participantCount": 2 },
    { "id": "br_002", "name": "Group B", "participantCount": 2 }
  ]
}
```

---

## 6. Get Attendance Report

```
GET /api/v1/classrooms/{meetingId}/attendance
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_xyz",
  "attendees": [
    {
      "participantId": "par_001",
      "name": "Alice",
      "joinedAt": "2025-01-15T09:00:00Z",
      "leftAt": "2025-01-15T10:30:00Z",
      "durationMinutes": 90
    }
  ]
}
```

---

# WebSocket Events

| Event | Description |
|-------|-------------|
| `QUIZ_STARTED` | Broadcast when instructor activates a quiz |
| `QUIZ_RESULTS_UPDATED` | Broadcast on each new quiz response |
| `QUIZ_CLOSED` | Broadcast when quiz ends |
| `CLASSROOM_PAUSED` | Broadcast when instructor pauses |
| `BREAKOUT_ROOMS_CREATED` | Broadcast when students are moved to breakout rooms |

---

End of Document
