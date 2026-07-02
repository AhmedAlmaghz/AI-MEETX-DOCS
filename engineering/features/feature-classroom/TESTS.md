# feature-classroom/TESTS.md

Document ID: CLASSROOM-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Virtual Classroom

Module: feature-classroom

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | CreateQuizUseCase, SubmitQuizResponseUseCase, TrackAttendanceUseCase | 88% |
| Integration | Testcontainers (Postgres) | AttendanceRepository, QuizRepository | 80% |
| E2E | Maestro | Quiz flow, breakout rooms, attendance export | Critical paths |

---

# 1. Unit Tests

## 1.1 SubmitQuizResponseUseCase

```kotlin
describe("SubmitQuizResponseUseCase") {

    it("should save response and publish results updated event") {
        val quizRepo = mockk<QuizRepository>()
        val eventBus = mockk<EventBus>()
        val activeQuiz = buildQuiz(status = QuizStatus.ACTIVE)

        coEvery { quizRepo.findById(any()) } returns Result.success(activeQuiz)
        coEvery { quizRepo.saveResponse(any(), any()) } returns Result.success(Unit)
        coEvery { quizRepo.getResults(any()) } returns Result.success(mapOf("b" to 10))
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = SubmitQuizResponseUseCase(quizRepo, eventBus)
        val result = useCase(
            SubmitQuizResponseCommand(
                quizId = QuizId("q1"),
                participantId = ParticipantId("p1"),
                selectedOptionId = "b"
            )
        )

        result.isSuccess shouldBe true
        coVerify { eventBus.publish(ofType<QuizResultsUpdatedEvent>()) }
    }

    it("should fail if quiz is not ACTIVE") {
        val quizRepo = mockk<QuizRepository>()
        val closedQuiz = buildQuiz(status = QuizStatus.CLOSED)
        coEvery { quizRepo.findById(any()) } returns Result.success(closedQuiz)

        val useCase = SubmitQuizResponseUseCase(quizRepo, mockk())
        val result = useCase(SubmitQuizResponseCommand(QuizId("q1"), ParticipantId("p1"), "a"))

        result.isFailure shouldBe true
    }
}
```

---

## 1.2 TrackAttendanceUseCase

```kotlin
describe("TrackAttendanceUseCase") {

    it("should create attendance record when participant joins") {
        val repo = mockk<AttendanceRepository>()
        coEvery { repo.save(any()) } answers { Result.success(firstArg()) }

        val useCase = TrackAttendanceUseCase(repo)
        useCase.onParticipantJoined(ParticipantJoinedEvent(
            meetingId = "m1",
            participantId = "p1",
            classroomSessionId = "cls1",
            joinedAt = Instant.now()
        ))

        coVerify { repo.save(match { it.participantId.value == "p1" }) }
    }
}
```

---

# 2. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CL-T-001 | Instructor creates and activates quiz | All students see quiz in UI | P0 |
| CL-T-002 | Student submits quiz response | Results bar updates in real-time | P0 |
| CL-T-003 | Instructor creates 2 breakout rooms | Students moved to separate LiveKit rooms | P0 |
| CL-T-004 | Instructor pauses classroom | All students see paused state | P1 |
| CL-T-005 | Export attendance CSV | CSV with all joinedAt, leftAt, and duration | P1 |

---

End of Document
