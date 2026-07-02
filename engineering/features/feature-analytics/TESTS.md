# feature-analytics/TESTS.md

Document ID: ANALYTICS-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Analytics & Insights

Module: feature-analytics

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | GetMeetingAnalyticsUseCase, AggregationJob logic | 85% |
| Integration | Testcontainers (Postgres) | Fact repositories, aggregation queries | 80% |
| Performance | JMH | Summary table queries under 50 concurrent users | < 500ms p95 |
| E2E | Postman / Bruno | CSV export, date range filtering | Critical paths |

---

# 1. Unit Tests

## 1.1 AggregationJob

```kotlin
describe("AggregationJob") {

    it("should compute correct tenant daily summary from meeting facts") {
        val factRepo = mockk<MeetingFactRepository>()
        val summaryRepo = mockk<SummaryRepository>()

        val facts = listOf(
            MeetingFact(
                meetingId = MeetingId("m1"), tenantId = TenantId("t1"),
                durationMinutes = 60, totalParticipants = 10,
                recordingEnabled = true, recordingMinutes = 60,
                aiEnabled = false, translationEnabled = true, translationMinutes = 45,
                classroomMode = false, startedAt = Instant.now(), endedAt = Instant.now(), hostId = UserId("h1"), peakParticipants = 10
            ),
            MeetingFact(
                meetingId = MeetingId("m2"), tenantId = TenantId("t1"),
                durationMinutes = 30, totalParticipants = 5,
                recordingEnabled = false, recordingMinutes = 0,
                aiEnabled = true, translationEnabled = false, translationMinutes = 0,
                classroomMode = true, startedAt = Instant.now(), endedAt = Instant.now(), hostId = UserId("h2"), peakParticipants = 5
            )
        )

        coEvery { factRepo.findByTenantAndDateRange(any(), any(), any()) } returns Result.success(facts)
        coEvery { summaryRepo.upsertTenantDailySummary(any()) } returns Result.success(Unit)

        val job = AggregationJob(factRepo, summaryRepo)
        job.computeForTenant(TenantId("t1"), LocalDate.now())

        coVerify {
            summaryRepo.upsertTenantDailySummary(match {
                it.totalMeetings == 2 &&
                it.totalMeetingMinutes == 90L &&
                it.totalRecordingMinutes == 60L &&
                it.totalTranslationMinutes == 45L
            })
        }
    }
}
```

---

## 1.2 Date Range Validation

```kotlin
describe("GetMeetingAnalyticsUseCase") {

    it("should reject date range exceeding 12 months") {
        val useCase = GetMeetingAnalyticsUseCase(mockk())
        val result = useCase(
            GetMeetingAnalyticsQuery(
                tenantId = TenantId("t1"),
                from = LocalDate.of(2024, 1, 1),
                to = LocalDate.of(2025, 6, 1),     // 17 months
                granularity = Granularity.MONTHLY
            )
        )
        result.isFailure shouldBe true
        result.exceptionOrNull()?.message shouldContain "12 months"
    }
}
```

---

# 2. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| AN-T-001 | Meeting ends | meeting_facts row inserted within 5 min | P0 |
| AN-T-002 | Aggregation job runs | tenant_daily_summaries updated | P0 |
| AN-T-003 | Tenant admin queries daily meetings | Correct series returned | P0 |
| AN-T-004 | CSV export request | Valid CSV with correct headers | P1 |
| AN-T-005 | Platform metrics query by regular user | 403 Forbidden | P0 |
| AN-T-006 | Date range > 12 months | 400 Bad Request | P1 |

---

End of Document
