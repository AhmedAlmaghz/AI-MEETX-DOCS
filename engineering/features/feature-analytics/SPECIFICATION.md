# feature-analytics/SPECIFICATION.md

Document ID: ANALYTICS-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Analytics & Insights

Module: feature-analytics

---

# 1. Domain Models

## 1.1 MeetingFact (Entity)

Raw meeting-level fact record, populated on MeetingEndedEvent.

```kotlin
data class MeetingFact(
    val meetingId: MeetingId,
    val tenantId: TenantId,
    val hostId: UserId,
    val startedAt: Instant,
    val endedAt: Instant,
    val durationMinutes: Long,
    val peakParticipants: Int,
    val totalParticipants: Int,
    val recordingEnabled: Boolean,
    val aiEnabled: Boolean,
    val translationEnabled: Boolean,
    val classroomMode: Boolean
)
```

## 1.2 UserEngagementFact (Entity)

Per-user per-day engagement metrics.

```kotlin
data class UserEngagementFact(
    val userId: UserId,
    val tenantId: TenantId,
    val date: LocalDate,
    val meetingsHosted: Int,
    val meetingsAttended: Int,
    val totalMeetingMinutes: Long
)
```

## 1.3 PlatformDailySummary (Entity)

Pre-computed daily platform rollup.

```kotlin
data class PlatformDailySummary(
    val date: LocalDate,
    val tenantId: TenantId?,           // null = platform-wide
    val dailyActiveUsers: Int,
    val totalMeetings: Int,
    val totalMeetingMinutes: Long,
    val totalRecordingMinutes: Long,
    val totalTranslationMinutes: Long
)
```

---

# 2. Data Pipeline Architecture

```
Domain Events (Kafka)
    ↓
AnalyticsEventConsumer (async)
    ↓
Fact Tables (meeting_facts, user_engagement_facts)
    ↓
AggregationJob (runs every 5 minutes via cron)
    ↓
Summary Tables (platform_daily_summaries, tenant_daily_summaries)
    ↓
Analytics API (reads from summary tables with < 500ms response)
```

---

# 3. Service Contracts

```kotlin
interface AnalyticsQueryService {
    suspend fun getMeetingSummary(
        tenantId: TenantId,
        from: LocalDate,
        to: LocalDate,
        granularity: Granularity
    ): Result<List<MeetingAnalyticsSummary>>

    suspend fun getUserEngagement(
        tenantId: TenantId,
        from: LocalDate,
        to: LocalDate
    ): Result<List<UserEngagementSummary>>

    suspend fun getPlatformMetrics(
        from: LocalDate,
        to: LocalDate
    ): Result<PlatformMetricsSummary>   // Super admin only
}

enum class Granularity { DAILY, WEEKLY, MONTHLY }
```

---

# 4. Event Consumer Mappings

| Event | Fact Written |
|-------|-------------|
| `MeetingEndedEvent` | `meeting_facts` (one row per meeting) |
| `ParticipantJoinedEvent` | Increment `user_engagement_facts.meetings_attended` |
| `RecordingReadyEvent` | Update `meeting_facts.recording_enabled`, add duration |
| `TranscriptSegmentCreatedEvent` | Accumulate translation minutes per meeting |
| `AiReportGeneratedEvent` | Update `meeting_facts.ai_enabled` |

---

# 5. Module Structure

```
feature-analytics/
├── domain/
│   ├── model/
│   │   ├── MeetingFact.kt
│   │   ├── UserEngagementFact.kt
│   │   └── PlatformDailySummary.kt
│   ├── usecase/
│   │   ├── GetMeetingAnalyticsUseCase.kt
│   │   └── GetPlatformMetricsUseCase.kt
│   └── port/
│       ├── MeetingFactRepository.kt
│       ├── UserEngagementRepository.kt
│       └── SummaryRepository.kt
├── data/
│   ├── MeetingFactRepositoryImpl.kt
│   └── SummaryRepositoryImpl.kt
├── consumer/
│   ├── MeetingEndedConsumer.kt
│   ├── ParticipantJoinedConsumer.kt
│   └── RecordingReadyConsumer.kt
└── job/
    └── AggregationJob.kt
```

---

End of Document
