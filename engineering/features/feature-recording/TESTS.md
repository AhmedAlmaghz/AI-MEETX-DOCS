# feature-recording/TESTS.md

Document ID: RECORDING-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Recording

Module: feature-recording

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | StartRecordingUseCase, StopRecordingUseCase, EgressStatusPollingJob | 90% |
| Integration | WireMock (LiveKit Egress) | LivekitEgressGateway | 80% |
| E2E | Maestro | Start/Stop recording UI flow | Critical paths |

---

# 1. Unit Tests

## 1.1 StartRecordingUseCase

```kotlin
describe("StartRecordingUseCase") {

    it("should start egress and save recording when HOST initiates") {
        val gateway = mockk<RecordingGateway>()
        val repo = mockk<RecordingRepository>()
        val eventBus = mockk<EventBus>()

        coEvery { gateway.startEgress(any(), any(), any()) } returns Result.success("egress_123")
        coEvery { repo.save(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = StartRecordingUseCase(gateway, repo, eventBus)
        val result = useCase(
            StartRecordingCommand(
                meetingId = MeetingId("m1"),
                hostId = ParticipantId("host_1"),
                layout = RecordingLayout.SPEAKER_VIEW
            )
        )

        result.isSuccess shouldBe true
        result.getOrNull()?.egressId shouldBe "egress_123"
        coVerify { eventBus.publish(ofType<RecordingStartedEvent>()) }
    }

    it("should fail if meeting is not ACTIVE") {
        val useCase = buildStartRecordingUseCase(meetingStatus = MeetingStatus.ENDED)
        val result = useCase(StartRecordingCommand(MeetingId("m1"), ParticipantId("h1"), RecordingLayout.GALLERY_VIEW))

        result.isFailure shouldBe true
        result.exceptionOrNull() shouldBeInstanceOf MeetingAlreadyEndedException::class
    }

    it("should fail if recording already ACTIVE") {
        val useCase = buildStartRecordingUseCase(existingRecordingStatus = RecordingStatus.ACTIVE)
        val result = useCase(StartRecordingCommand(MeetingId("m1"), ParticipantId("h1"), RecordingLayout.SPEAKER_VIEW))

        result.isFailure shouldBe true
    }
}
```

---

## 1.2 EgressStatusPollingJob

```kotlin
describe("EgressStatusPollingJob") {

    it("should mark recording READY when egress is COMPLETE") {
        val gateway = mockk<RecordingGateway>()
        val repo = mockk<RecordingRepository>()
        val eventBus = mockk<EventBus>()
        val stoppingRecording = buildRecording(status = RecordingStatus.STOPPING, egressId = "eg_1")

        coEvery { repo.findByStatus(RecordingStatus.STOPPING) } returns Result.success(listOf(stoppingRecording))
        coEvery { gateway.getEgressStatus("eg_1") } returns Result.success(
            EgressStatus("eg_1", "EGRESS_COMPLETE", listOf(
                EgressFileResult("meeting.mp4", "https://storage/meeting.mp4", 256000000L, 3600L)
            ))
        )
        coEvery { repo.update(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val job = EgressStatusPollingJob(gateway, repo, eventBus)
        job.poll()

        coVerify {
            repo.update(match { it.status == RecordingStatus.READY && it.storageUrl == "https://storage/meeting.mp4" })
        }
        coVerify { eventBus.publish(ofType<RecordingReadyEvent>()) }
    }
}
```

---

# 2. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| REC-T-001 | Host starts recording | All participants see recording indicator | P0 |
| REC-T-002 | Host stops recording | Egress stopped, polling job begins | P0 |
| REC-T-003 | Recording becomes READY | Host receives download link notification | P0 |
| REC-T-004 | Meeting ends with active recording | Recording auto-stopped | P0 |
| REC-T-005 | Non-host tries to start recording | Returns 403 InsufficientRole | P1 |
| REC-T-006 | Download link generated | Signed URL valid for 24h | P1 |

---

End of Document
