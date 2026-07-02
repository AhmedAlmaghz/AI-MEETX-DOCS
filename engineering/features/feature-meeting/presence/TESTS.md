# feature-meeting/presence/TESTS.md

Document ID: PRESENCE-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Presence Tracking & Active Speakers

Subdomain: feature-meeting/presence

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | HeartbeatUseCase, ActiveSpeakerUseCase, HeartbeatMonitorJob | 90% |
| Integration | Embedded Redis (Testcontainers) | RedisPresenceRepository | 80% |
| E2E | Maestro | Speaker indicator UI update, disconnect/reconnect flow | Critical paths |

---

# 1. Unit Tests

## 1.1 HeartbeatUseCase

```kotlin
describe("HeartbeatUseCase") {

    it("should update lastHeartbeatAt and return CONNECTED state") {
        val repo = mockk<PresenceRepository>()
        val eventBus = mockk<EventBus>()
        val presence = ParticipantPresence(
            participantId = ParticipantId("p1"),
            meetingId = MeetingId("m1"),
            connectionState = ConnectionState.CONNECTED
        )

        coEvery { repo.findByParticipantId(any(), any()) } returns Result.success(presence)
        coEvery { repo.upsert(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = HeartbeatUseCase(repo, eventBus)
        val result = useCase(HeartbeatCommand(MeetingId("m1"), ParticipantId("p1")))

        result.isSuccess shouldBe true
        result.getOrNull()?.connectionState shouldBe ConnectionState.CONNECTED
        coVerify(exactly = 0) { eventBus.publish(any()) } // No event if state unchanged
    }

    it("should publish CONNECTED event if transitioning from RECONNECTING") {
        val repo = mockk<PresenceRepository>()
        val eventBus = mockk<EventBus>()
        val presence = ParticipantPresence(
            participantId = ParticipantId("p1"),
            meetingId = MeetingId("m1"),
            connectionState = ConnectionState.RECONNECTING
        )

        coEvery { repo.findByParticipantId(any(), any()) } returns Result.success(presence)
        coEvery { repo.upsert(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = HeartbeatUseCase(repo, eventBus)
        useCase(HeartbeatCommand(MeetingId("m1"), ParticipantId("p1")))

        coVerify {
            eventBus.publish(match<ParticipantPresenceChangedEvent> {
                it.newState == ConnectionState.CONNECTED
            })
        }
    }
}
```

---

## 1.2 ActiveSpeakerUseCase

```kotlin
describe("ActiveSpeakerUseCase") {

    it("should flag participant as speaking when audio level exceeds threshold") {
        val repo = mockk<PresenceRepository>()
        val eventBus = mockk<EventBus>()
        val presence = ParticipantPresence(
            participantId = ParticipantId("p1"),
            meetingId = MeetingId("m1"),
            isSpeaking = false,
            audioLevel = 0f
        )

        coEvery { repo.findByParticipantId(any(), any()) } returns Result.success(presence)
        coEvery { repo.upsert(any()) } answers { Result.success(firstArg()) }
        coEvery { repo.findAllByMeetingId(any()) } returns Result.success(listOf(presence.copy(isSpeaking = true, audioLevel = 0.85f)))
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = UpdateAudioLevelUseCase(repo, eventBus)
        useCase(UpdateAudioLevelCommand(MeetingId("m1"), ParticipantId("p1"), audioLevel = 0.85f))

        coVerify { eventBus.publish(ofType<ActiveSpeakerChangedEvent>()) }
    }
}
```

---

# 2. Integration Tests

```kotlin
@Testcontainers
class RedisPresenceRepositoryIntegrationTest {

    @Test
    fun `should upsert and retrieve presence record`() = runTest {
        val presence = ParticipantPresence(
            participantId = ParticipantId("p_redis_1"),
            meetingId = MeetingId("m_redis_1"),
            connectionState = ConnectionState.CONNECTED,
            audioLevel = 0.6f
        )

        repository.upsert(presence).getOrThrow()
        val found = repository.findByParticipantId(MeetingId("m_redis_1"), ParticipantId("p_redis_1")).getOrThrow()

        found shouldNotBe null
        found?.connectionState shouldBe ConnectionState.CONNECTED
        found?.audioLevel shouldBe 0.6f
    }
}
```

---

# 3. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PR-T-001 | Client sends heartbeats | Presence record refreshed in Redis every 5s | P0 |
| PR-T-002 | Client drops heartbeat for 15s | Status changes to DISCONNECTED, broadcast to room | P0 |
| PR-T-003 | Client reconnects | Status changes to CONNECTED, broadcast to room | P0 |
| PR-T-004 | Participant speaks | Active speaker indicator highlights them in UI | P0 |
| PR-T-005 | Network quality reported as POOR | Warning indicator shown, NetworkQualityDegradedEvent fired | P1 |

---

End of Document
