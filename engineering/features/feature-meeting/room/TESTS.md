# feature-meeting/room/TESTS.md

Document ID: ROOM-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Room Management

Subdomain: feature-meeting/room

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | Use cases, domain logic | 90% |
| Integration | TestContainers + WireMock | Repository, LiveKit API mock | 80% |
| E2E | Maestro (Android) | Join room, mute, screen share | Critical paths |

---

# 1. Unit Tests

## 1.1 CreateRoomUseCase

```kotlin
describe("CreateRoomUseCase") {

    it("should create room on MeetingStartedEvent and publish RoomCreatedEvent") {
        val livekitGateway = mockk<LivekitGateway>()
        val roomRepository = mockk<RoomRepository>()
        val eventBus = mockk<EventBus>()

        coEvery { livekitGateway.createRoom(any(), any()) } returns Result.success(
            LivekitRoomInfo(roomName = "meeting_m1", createdAt = Instant.now())
        )
        coEvery { roomRepository.save(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = CreateRoomUseCase(livekitGateway, roomRepository, eventBus)
        val result = useCase(
            CreateRoomCommand(
                meetingId = MeetingId("m1"),
                settings = RoomSettings(maxParticipants = 100)
            )
        )

        result.isSuccess shouldBe true
        coVerify { livekitGateway.createRoom("meeting_m1", any()) }
        coVerify { eventBus.publish(ofType<RoomCreatedEvent>()) }
    }

    it("should fail gracefully when LiveKit room creation fails") {
        val livekitGateway = mockk<LivekitGateway>()
        coEvery { livekitGateway.createRoom(any(), any()) } returns
            Result.failure(LivekitConnectionException("LiveKit unavailable"))

        val useCase = CreateRoomUseCase(livekitGateway, mockk(), mockk())
        val result = useCase(CreateRoomCommand(MeetingId("m1"), RoomSettings()))

        result.isFailure shouldBe true
    }
}
```

---

## 1.2 LockRoomUseCase

```kotlin
describe("LockRoomUseCase") {

    it("should succeed when caller is HOST") {
        val caller = buildParticipant(role = ParticipantRole.HOST)
        val room = buildRoom(status = RoomStatus.ACTIVE)

        val useCase = buildLockRoomUseCase(caller = caller, room = room)
        val result = useCase(LockRoomCommand(MeetingId("m1"), caller.id))

        result.isSuccess shouldBe true
    }

    it("should fail when caller is ATTENDEE") {
        val caller = buildParticipant(role = ParticipantRole.ATTENDEE)
        val room = buildRoom(status = RoomStatus.ACTIVE)

        val useCase = buildLockRoomUseCase(caller = caller, room = room)
        val result = useCase(LockRoomCommand(MeetingId("m1"), caller.id))

        result.isFailure shouldBe true
        result.exceptionOrNull() shouldBeInstanceOf InsufficientRoleException::class
    }

    it("should fail when room is already locked") {
        val caller = buildParticipant(role = ParticipantRole.HOST)
        val room = buildRoom(status = RoomStatus.LOCKED)

        val useCase = buildLockRoomUseCase(caller = caller, room = room)
        val result = useCase(LockRoomCommand(MeetingId("m1"), caller.id))

        result.isFailure shouldBe true
        result.exceptionOrNull() shouldBeInstanceOf RoomAlreadyLockedException::class
    }
}
```

---

## 1.3 MuteAllUseCase

```kotlin
describe("MuteAllUseCase") {

    it("should mute all active participants and publish events") {
        val participants = listOf(
            buildParticipant(status = ParticipantStatus.ACTIVE),
            buildParticipant(status = ParticipantStatus.ACTIVE)
        )
        val eventBus = mockk<EventBus>()
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = buildMuteAllUseCase(participants = participants, eventBus = eventBus)
        val result = useCase(MuteAllCommand(MeetingId("m1"), ParticipantId("host_1")))

        result.isSuccess shouldBe true
        result.getOrNull()?.mutedCount shouldBe 2
        coVerify(exactly = 1) { eventBus.publish(ofType<RoomMutedAllEvent>()) }
    }
}
```

---

## 1.4 DestroyRoomUseCase

```kotlin
describe("DestroyRoomUseCase") {

    it("should destroy LiveKit room and mark room as ENDED") {
        val livekitGateway = mockk<LivekitGateway>()
        val roomRepository = mockk<RoomRepository>()
        val eventBus = mockk<EventBus>()
        val room = buildRoom(status = RoomStatus.ACTIVE)

        coEvery { roomRepository.findByMeetingId(any()) } returns Result.success(room)
        coEvery { livekitGateway.deleteRoom(any()) } returns Result.success(Unit)
        coEvery { roomRepository.update(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = DestroyRoomUseCase(livekitGateway, roomRepository, eventBus)
        val result = useCase(DestroyRoomCommand(meetingId = MeetingId("m1")))

        result.isSuccess shouldBe true
        coVerify { livekitGateway.deleteRoom(room.livekitRoomName) }
        coVerify { eventBus.publish(ofType<RoomDestroyedEvent>()) }
    }
}
```

---

# 2. Integration Tests

## 2.1 LiveKit Room Creation (WireMock)

```kotlin
@ExtendWith(WireMockExtension::class)
class LivekitGatewayIntegrationTest {

    @Test
    fun `should create room via LiveKit API`() {
        wireMock.stubFor(
            post(urlEqualTo("/twirp/livekit.RoomService/CreateRoom"))
                .willReturn(okJson("""{"name":"meeting_m1","sid":"RM_abc123"}"""))
        )

        val gateway = LivekitGatewayImpl(
            serverUrl = "http://localhost:${wireMock.port()}",
            apiKey = "test-key",
            apiSecret = "test-secret"
        )

        val result = runBlocking {
            gateway.createRoom("meeting_m1", LivekitRoomConfig(maxParticipants = 100))
        }

        result.isSuccess shouldBe true
        result.getOrNull()?.roomName shouldBe "meeting_m1"
    }
}
```

---

# 3. End-to-End Tests (Maestro)

## 3.1 Host Locks Room

```yaml
# maestro/room_lock.yaml
appId: com.aimeetx.app
---
- launchApp
- tapOn: "Room Settings"
- tapOn: "Lock Room"
- assertVisible: "Room is locked"
- assertVisible: "🔒"
```

## 3.2 Host Mutes All

```yaml
# maestro/room_mute_all.yaml
appId: com.aimeetx.app
---
- tapOn: "Room Settings"
- tapOn: "Mute All"
- assertVisible: "All participants muted"
```

---

# 4. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| RM-T-001 | Room created on MeetingStartedEvent | LiveKit room exists | P0 |
| RM-T-002 | Room destroyed on MeetingEndedEvent | LiveKit room deleted within 30s | P0 |
| RM-T-003 | Host locks room | New join attempts rejected | P0 |
| RM-T-004 | ATTENDEE tries to lock room | Returns 403 InsufficientRole | P0 |
| RM-T-005 | Host mutes all | All participants muted | P0 |
| RM-T-006 | Host disables video | All video tracks stopped | P1 |
| RM-T-007 | Lock already locked room | Returns 409 RoomAlreadyLocked | P1 |
| RM-T-008 | LiveKit creation fails | Error propagated, meeting not started | P0 |
| RM-T-009 | Screen share with allowMultiple=false | Only one share at a time | P1 |
| RM-T-010 | Quality monitor detects poor connection | Warning displayed to participant | P2 |

---

End of Document
