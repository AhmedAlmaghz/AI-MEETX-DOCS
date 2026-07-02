# feature-meeting/scheduling/SPECIFICATION.md

Document ID: SCHEDULING-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Scheduling & Calendar

Subdomain: feature-meeting/scheduling

---

# 1. Purpose

This document defines the domain models, aggregates, value objects, domain services, and repository contracts for the Scheduling subdomain.

---

# 2. Domain Models

## 2.1 ScheduledMeeting (Aggregate Root)

Represents a scheduled booking for a single meeting or an instance within a recurring series.

```kotlin
data class ScheduledMeeting(
    val id: ScheduleId,
    val meetingId: MeetingId,
    val title: String,
    val description: String? = null,
    val startTime: Instant,
    val durationMinutes: Int,
    val timezoneId: TimezoneId,
    val recurrenceRule: RecurrenceRule? = null,
    val seriesId: SeriesId? = null,
    val status: ScheduleStatus = ScheduleStatus.SCHEDULED,
    val reminderSettings: List<ReminderSetting> = emptyList(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {
    fun getEndTime(): Instant = startTime.plus(java.time.Duration.ofMinutes(durationMinutes.toLong()))
}
```

---

# 3. Value Objects

## 3.1 ScheduleId & SeriesId

```kotlin
@JvmInline
value class ScheduleId(val value: String)

@JvmInline
value class SeriesId(val value: String)
```

## 3.2 TimezoneId

Represents a valid IANA timezone name.

```kotlin
@JvmInline
value class TimezoneId(val value: String) {
    init {
        require(java.time.ZoneId.getAvailableZoneIds().contains(value)) {
            "Invalid Timezone ID: $value"
        }
    }
}
```

## 3.3 RecurrenceRule

Holds the recurrence attributes (RFC 5545 format).

```kotlin
data class RecurrenceRule(
    val frequency: RecurrenceFrequency,
    val interval: Int = 1,
    val count: Int? = null,
    val until: Instant? = null,
    val byDay: List<DayOfWeek> = emptyList()
) {
    fun toRRuleString(): String {
        val parts = mutableListOf("FREQ=${frequency.name}", "INTERVAL=$interval")
        count?.let { parts.add("COUNT=$it") }
        until?.let { parts.add("UNTIL=${it.toString().replace("-", "").replace(":", "")}") }
        if (byDay.isNotEmpty()) {
            parts.add("BYDAY=${byDay.joinToString(",") { it.name.take(2) }}")
        }
        return parts.joinToString(";")
    }
}

enum class RecurrenceFrequency { DAILY, WEEKLY, MONTHLY, YEARLY }
```

## 3.4 ReminderSetting

```kotlin
data class ReminderSetting(
    val triggerOffsetMinutes: Int,
    val channel: ReminderChannel
)

enum class ReminderChannel { PUSH, EMAIL, SMS }
```

## 3.5 ScheduleStatus

```kotlin
enum class ScheduleStatus {
    SCHEDULED,
    CANCELLED,
    COMPLETED
}
```

---

# 4. Domain Services

## 4.1 SchedulingService

Coordinates scheduled series creation and validations.

```kotlin
interface SchedulingService {
    suspend fun scheduleMeeting(
        title: String,
        description: String?,
        startTime: Instant,
        durationMinutes: Int,
        timezoneId: TimezoneId,
        recurrenceRule: RecurrenceRule?,
        reminders: List<ReminderSetting>
    ): Result<ScheduledMeeting>

    suspend fun rescheduleMeeting(
        scheduleId: ScheduleId,
        newStartTime: Instant,
        newDurationMinutes: Int
    ): Result<ScheduledMeeting>

    suspend fun cancelMeeting(
        scheduleId: ScheduleId,
        cancelSeries: Boolean
    ): Result<Unit>

    fun generateICS(schedule: ScheduledMeeting): String
}
```

---

# 5. Repository Contracts

```kotlin
interface SchedulingRepository {
    suspend fun save(schedule: ScheduledMeeting): Result<ScheduledMeeting>
    suspend fun findById(id: ScheduleId): Result<ScheduledMeeting?>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<ScheduledMeeting?>
    suspend fun findUpcomingReminders(
        fromTime: Instant,
        toTime: Instant
    ): Result<List<ScheduledMeeting>>
    
    suspend fun findBySeriesId(seriesId: SeriesId): Result<List<ScheduledMeeting>>
    suspend fun update(schedule: ScheduledMeeting): Result<ScheduledMeeting>
    suspend fun delete(id: ScheduleId): Result<Unit>
}
```

---

# 6. Use Cases

## 6.1 ScheduleMeetingUseCase

```
Input: ScheduleMeetingCommand(title, desc, start, duration, timezone, recurrence, reminders)

Steps:
1. Validate start time is in the future.
2. If recurrence rule is present:
   - Generate unique seriesId.
   - Generate occurrence timestamps up to 1 year or recurrence limit.
   - For each occurrence:
     - Generate a new ScheduleId and MeetingId.
     - Save as ScheduledMeeting with status SCHEDULED.
3. If no recurrence, save single ScheduledMeeting.
4. Publish MeetingScheduledEvent.
```

## 6.2 CancelMeetingUseCase

```
Input: CancelMeetingCommand(scheduleId, cancelSeries)

Steps:
1. Load ScheduledMeeting.
2. If cancelSeries = true and seriesId is present:
   - Load all scheduled occurrences in the series.
   - Update status = CANCELLED.
   - Save all.
   - Publish SeriesCancelledEvent.
3. Else:
   - Update single schedule status = CANCELLED.
   - Save.
   - Publish MeetingCancelledEvent.
```

---

# 7. Module Structure

```
feature-meeting/
└── scheduling/
    ├── domain/
    │   ├── model/
    │   │   ├── ScheduledMeeting.kt
    │   │   ├── RecurrenceRule.kt
    │   │   ├── ReminderSetting.kt
    │   │   └── ScheduleStatus.kt
    │   ├── usecase/
    │   │   ├── ScheduleMeetingUseCase.kt
    │   │   ├── RescheduleMeetingUseCase.kt
    │   │   └── CancelMeetingUseCase.kt
    │   └── port/
    │       └── SchedulingRepository.kt
    ├── data/
    │   ├── SchedulingRepositoryImpl.kt
    │   └── ICalGenerator.kt
    └── presentation/
        └── ScheduleFormViewModel.kt
```

---

End of Document
