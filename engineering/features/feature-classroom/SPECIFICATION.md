# feature-classroom/SPECIFICATION.md

Document ID: CLASSROOM-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Virtual Classroom

Module: feature-classroom

---

# 1. Domain Models

## 1.1 ClassroomSession (Aggregate Root)

```kotlin
data class ClassroomSession(
    val id: ClassroomSessionId,
    val meetingId: MeetingId,
    val status: ClassroomStatus = ClassroomStatus.ACTIVE,
    val allowStudentWhiteboard: Boolean = false,
    val breakoutRooms: List<BreakoutRoom> = emptyList(),
    val createdAt: Instant = Instant.now()
)

enum class ClassroomStatus { ACTIVE, PAUSED, ENDED }
```

## 1.2 AttendanceRecord (Entity)

```kotlin
data class AttendanceRecord(
    val id: AttendanceId,
    val classroomSessionId: ClassroomSessionId,
    val participantId: ParticipantId,
    val joinedAt: Instant,
    val leftAt: Instant? = null,
    val totalDurationMinutes: Long = 0
)
```

## 1.3 Quiz (Entity)

```kotlin
data class Quiz(
    val id: QuizId,
    val classroomSessionId: ClassroomSessionId,
    val question: String,
    val options: List<QuizOption>,
    val correctOptionId: String? = null,
    val showCorrectAnswer: Boolean = false,
    val status: QuizStatus = QuizStatus.DRAFT,
    val createdAt: Instant = Instant.now()
)

data class QuizOption(val id: String, val text: String)
data class QuizResponse(val participantId: ParticipantId, val selectedOptionId: String, val submittedAt: Instant)

enum class QuizStatus { DRAFT, ACTIVE, CLOSED }
```

## 1.4 BreakoutRoom (Value Object)

```kotlin
data class BreakoutRoom(
    val id: BreakoutRoomId,
    val name: String,
    val livekitRoomName: String,
    val assignedParticipants: List<ParticipantId>
)
```

---

# 2. Repository Contracts

```kotlin
interface ClassroomRepository {
    suspend fun save(session: ClassroomSession): Result<ClassroomSession>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<ClassroomSession?>
    suspend fun update(session: ClassroomSession): Result<ClassroomSession>
}

interface AttendanceRepository {
    suspend fun save(record: AttendanceRecord): Result<AttendanceRecord>
    suspend fun findBySessionId(sessionId: ClassroomSessionId): Result<List<AttendanceRecord>>
    suspend fun update(record: AttendanceRecord): Result<AttendanceRecord>
}

interface QuizRepository {
    suspend fun save(quiz: Quiz): Result<Quiz>
    suspend fun findById(id: QuizId): Result<Quiz?>
    suspend fun findActiveBySessionId(sessionId: ClassroomSessionId): Result<Quiz?>
    suspend fun saveResponse(response: QuizResponse, quizId: QuizId): Result<Unit>
    suspend fun getResults(quizId: QuizId): Result<Map<String, Int>>  // optionId → count
}
```

---

# 3. Use Cases

## 3.1 CreateQuizUseCase

```
Input: CreateQuizCommand(sessionId, instructorId, question, options, correctOptionId, showAnswer)

Steps:
1. Verify instructorId has HOST/MODERATOR role.
2. Create Quiz (status = DRAFT).
3. Save quiz.
4. Optionally activate immediately (status = ACTIVE).
5. Publish QuizCreatedEvent.
```

## 3.2 SubmitQuizResponseUseCase

```
Input: SubmitQuizResponseCommand(quizId, participantId, selectedOptionId)

Steps:
1. Load quiz. Verify status = ACTIVE.
2. Check no existing response from this participant.
3. Save QuizResponse.
4. Compute updated aggregated results.
5. Publish QuizResultsUpdatedEvent.
```

## 3.3 CreateBreakoutRoomsUseCase

```
Input: CreateBreakoutRoomsCommand(meetingId, hostId, rooms: List<BreakoutRoomConfig>)

Steps:
1. Verify hostId has HOST role.
2. For each room config:
   - Generate a LiveKit room via RoomGateway.
   - Create BreakoutRoom value object.
3. Update ClassroomSession with breakout rooms list.
4. Move assigned participants to their rooms (issue new LiveKit tokens).
5. Publish BreakoutRoomsCreatedEvent.
```

---

# 4. Module Structure

```
feature-classroom/
├── domain/
│   ├── model/
│   │   ├── ClassroomSession.kt
│   │   ├── AttendanceRecord.kt
│   │   ├── Quiz.kt
│   │   └── BreakoutRoom.kt
│   ├── usecase/
│   │   ├── CreateQuizUseCase.kt
│   │   ├── SubmitQuizResponseUseCase.kt
│   │   ├── CreateBreakoutRoomsUseCase.kt
│   │   └── TrackAttendanceUseCase.kt
│   └── port/
│       ├── ClassroomRepository.kt
│       ├── AttendanceRepository.kt
│       └── QuizRepository.kt
└── data/
    ├── ClassroomRepositoryImpl.kt
    ├── AttendanceRepositoryImpl.kt
    └── QuizRepositoryImpl.kt
```

---

End of Document
