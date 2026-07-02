# feature-meeting/scheduling/TESTS.md

Document ID: SCHEDULING-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Scheduling & Calendar

Subdomain: feature-meeting/scheduling

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | ScheduleMeetingUseCase, Recurrence Rule calculations | 90% |
| Integration | Postgres + TestContainers | SchedulingRepository reminders query | 80% |
| E2E | Maestro | Form schedule creation & reminder flow | Critical flow |

---

# 1. Unit Tests

## 1.1 ScheduleMeetingUseCase (Recurrence expansion)

```kotlin
describe("ScheduleMeetingUseCase") {

    it("should create multiple ScheduledMeetings when recurrence rule is present") {
        val repository = mockk<SchedulingRepository>()
        val eventBus = mockk<EventBus>()
        val savedSchedules = mutableListOf<ScheduledMeeting>()

        coEvery { repository.save(any()) } answers {
            savedSchedules.add(firstArg())
            Result.success(firstArg())
        }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = ScheduleMeetingUseCase(repository, eventBus)
        val result = useCase(
            ScheduleMeetingCommand(
                title = "Weekly Meet",
                description = "Sync",
                startTime = Instant.parse("2025-02-01T10:00:00Z"),
                durationMinutes = 60,
                timezoneId = TimezoneId("Asia/Riyadh"),
                recurrenceRule = RecurrenceRule(
                    frequency = RecurrenceFrequency.WEEKLY,
                    interval = 1,
                    count = 4
                ),
                reminderSettings = emptyList()
            )
        )

        result.isSuccess shouldBe true
        savedSchedules shouldHaveSize 4
        // Check week offsets
        savedSchedules[0].startTime shouldBe Instant.parse("2025-02-01T10:00:00Z")
        savedSchedules[1].startTime shouldBe Instant.parse("2025-02-08T10:00:00Z")
        savedSchedules[2].startTime shouldBe Instant.parse("2025-02-15T10:00:00Z")
        savedSchedules[3].startTime shouldBe Instant.parse("2025-02-22T10:00:00Z")
    }

    it("should fail if start date is in the past") {
        val useCase = buildScheduleUseCase()
        val result = useCase(
            ScheduleMeetingCommand(
                title = "Past",
                description = "Past test",
                startTime = Instant.now().minusSeconds(3600),
                durationMinutes = 30,
                timezoneId = TimezoneId("Asia/Riyadh"),
                recurrenceRule = null,
                reminderSettings = emptyList()
            )
        )

        result.isFailure shouldBe true
        result.exceptionOrNull() shouldBeInstanceOf InvalidStartTimeException::class
    }
}
```

---

## 1.2 CancelMeetingUseCase

```kotlin
describe("CancelMeetingUseCase") {

    it("should mark series as cancelled if cancelSeries is true") {
        val repository = mockk<SchedulingRepository>()
        val eventBus = mockk<EventBus>()
        val schedules = listOf(
            buildScheduledMeeting(id = "s1", seriesId = "ser1", status = ScheduleStatus.SCHEDULED),
            buildScheduledMeeting(id = "s2", seriesId = "ser1", status = ScheduleStatus.SCHEDULED)
        )

        coEvery { repository.findById(ScheduleId("s1")) } returns Result.success(schedules[0])
        coEvery { repository.findBySeriesId(SeriesId("ser1")) } returns Result.success(schedules)
        coEvery { repository.update(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = CancelMeetingUseCase(repository, eventBus)
        val result = useCase(CancelMeetingCommand(ScheduleId("s1"), cancelSeries = true))

        result.isSuccess shouldBe true
        coVerify(exactly = 2) { repository.update(match { it.status == ScheduleStatus.CANCELLED }) }
        coVerify { eventBus.publish(ofType<SeriesCancelledEvent>()) }
    }
}
```

---

# 2. Integration Tests

```kotlin
@TestContainers
class SchedulingRepositoryIntegrationTest {

    @Test
    fun `should query upcoming reminders matching offsets`() = runTest {
        val schedule = buildScheduledMeeting(
            id = "s_rem",
            startTime = Instant.now().plusSeconds(900) // 15 mins from now
        )
        repository.save(schedule).getOrThrow()
        repository.saveReminder(ReminderSetting(triggerOffsetMinutes = 15, channel = ReminderChannel.PUSH), ScheduleId("s_rem"))

        val due = repository.findUpcomingReminders(Instant.now(), Instant.now().plusSeconds(60)).getOrThrow()
        due shouldHaveSize 1
    }
}
```

---

# 3. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SC-T-001 | Host schedules a single meeting | Entry created, status SCHEDULED | P0 |
| SC-T-002 | Host schedules recurring weekly | Generates weekly instances up to limit | P0 |
| SC-T-003 | Host reschedules meeting | Time updated, invitees receive reschedule notifications | P0 |
| SC-T-004 | Host cancels series | All future instances cancelled in database | P0 |
| SC-T-005 | Reminder offsets triggered | Scheduled reminder events publish at correct offset | P1 |

---

End of Document
