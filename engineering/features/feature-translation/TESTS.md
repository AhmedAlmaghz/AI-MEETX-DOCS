# feature-translation/TESTS.md

Document ID: TRANSLATION-TESTS-001

Version: 2.0.0

Status: Approved

Feature: Real-Time Translation

Phase: 11

---

# Overview

This document defines the test strategy for the Real-Time Translation feature using `gemini-3.5-live-translate-preview`.

Tests are organized into four layers: Unit, Integration, End-to-End, and Privacy/Compliance.

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | Domain logic, routing, session management | 90% |
| Integration | TestContainers + WireMock | Gemini API mock, LiveKit mock | 80% |
| E2E | Maestro (Android) | Full user flow (select language, hear translation) | Critical paths |
| Privacy | Automated audit script | Verify no audio/data stored after session end | 100% |

---

# 1. Unit Tests

## 1.1 TranslationRouter

```kotlin
describe("TranslationRouter") {

    describe("addParticipantLanguagePreference") {

        it("should add participant to existing session for their language") {
            val router = TranslationRouterImpl()
            val sessionId = TranslationSessionId("session_ar")
            router.registerSession("ar", sessionId)
            router.addParticipantLanguagePreference(ParticipantId("p1"), "ar")

            router.getListenersForLanguage("ar") shouldContain ParticipantId("p1")
        }

        it("should handle participant changing language") {
            val router = TranslationRouterImpl()
            router.registerSession("ar", TranslationSessionId("session_ar"))
            router.registerSession("fr", TranslationSessionId("session_fr"))

            router.addParticipantLanguagePreference(ParticipantId("p1"), "ar")
            router.addParticipantLanguagePreference(ParticipantId("p1"), "fr") // change

            router.getListenersForLanguage("ar") shouldNotContain ParticipantId("p1")
            router.getListenersForLanguage("fr") shouldContain ParticipantId("p1")
        }

        it("should return null if no session exists for the language") {
            val router = TranslationRouterImpl()
            router.getSessionForLanguage("de") shouldBe null
        }
    }

    describe("removeParticipant") {

        it("should remove participant from their language group") {
            val router = TranslationRouterImpl()
            router.registerSession("ar", TranslationSessionId("session_ar"))
            router.addParticipantLanguagePreference(ParticipantId("p1"), "ar")

            router.removeParticipant(ParticipantId("p1"))

            router.getListenersForLanguage("ar") shouldNotContain ParticipantId("p1")
        }
    }
}
```

---

## 1.2 TranslationGateway Session Creation

```kotlin
describe("TranslationGateway") {

    describe("startSession") {

        it("should create a new session if none exists for target language") {
            val controller = mockk<AITranslationController>()
            coEvery { controller.connect(any()) } returns Result.success(Unit)

            val gateway = TranslationGatewayImpl(controller)
            val result = gateway.startSession(
                meetingId = MeetingId("m1"),
                sourceLanguage = "auto",
                targetLanguage = "ar"
            )

            result.isSuccess shouldBe true
            result.getOrNull() shouldNotBe null
        }

        it("should return existing session if one already exists for target language") {
            val controller = mockk<AITranslationController>()
            coEvery { controller.connect(any()) } returns Result.success(Unit)

            val gateway = TranslationGatewayImpl(controller)
            val first = gateway.startSession(MeetingId("m1"), "auto", "ar").getOrThrow()
            val second = gateway.startSession(MeetingId("m1"), "auto", "ar").getOrThrow()

            first shouldBe second
        }

        it("should reject when maximum sessions (10) reached") {
            val gateway = TranslationGatewayImpl(mockk())
            // Create 10 sessions
            repeat(10) { i ->
                val lang = "lang_$i"
                gateway.startSession(MeetingId("m1"), "auto", lang)
            }

            val result = gateway.startSession(MeetingId("m1"), "auto", "eleventh_lang")
            result.isFailure shouldBe true
            result.exceptionOrNull() shouldBeInstanceOf MaxSessionsReachedException::class
        }
    }

    describe("stopSession") {

        it("should disconnect controller and remove session") {
            val controller = mockk<AITranslationController>()
            coEvery { controller.connect(any()) } returns Result.success(Unit)
            coEvery { controller.disconnect() } returns Result.success(Unit)

            val gateway = TranslationGatewayImpl(controller)
            val sessionId = gateway.startSession(MeetingId("m1"), "auto", "ar").getOrThrow()

            gateway.stopSession(sessionId).isSuccess shouldBe true
            gateway.getSessionForLanguage("ar") shouldBe null
        }
    }
}
```

---

## 1.3 StartTranslationUseCase

```kotlin
describe("StartTranslationUseCase") {

    it("should start translation and publish TranslationSessionStartedEvent") {
        val gateway = mockk<TranslationGateway>()
        val router = mockk<TranslationRouter>()
        val eventBus = mockk<EventBus>()

        coEvery { gateway.startSession(any(), any(), any()) } returns
            Result.success(TranslationSessionId("ts_123"))
        every { router.addParticipantLanguagePreference(any(), any()) } just Runs
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = StartTranslationUseCase(gateway, router, eventBus)
        val result = useCase(
            meetingId = MeetingId("m1"),
            participantId = ParticipantId("p1"),
            targetLanguage = "ar"
        )

        result.isSuccess shouldBe true
        coVerify { eventBus.publish(ofType<TranslationSessionStartedEvent>()) }
    }
}
```

---

# 2. Integration Tests

## 2.1 Gemini API Mock Integration

```kotlin
@ExtendWith(WireMockExtension::class)
class GeminiTranslationControllerIntegrationTest {

    @Test
    fun `should connect to Gemini Live Translate WebSocket`() {
        // Arrange: WireMock simulates Gemini WebSocket upgrade
        wireMock.stubFor(
            get(urlPathEqualTo("/ws/translate"))
                .willReturn(aResponse().withStatus(101).withHeader("Upgrade", "websocket"))
        )

        val controller = AITranslationControllerImpl(
            wsUrl = "ws://localhost:${wireMock.port()}/ws/translate",
            apiKey = "test-api-key"
        )

        // Act
        val result = runBlocking {
            controller.connect(
                GeminiLiveTranslateConfig(
                    apiKey = "test-api-key",
                    sourceLanguage = "auto",
                    targetLanguage = "ar"
                )
            )
        }

        // Assert
        result.isSuccess shouldBe true
    }

    @Test
    fun `should retry connection on failure with exponential backoff`() {
        var attempts = 0
        wireMock.stubFor(
            get(urlPathEqualTo("/ws/translate"))
                .willReturn(aResponse()
                    .withStatus(503)
                    .withFixedDelay(100)
                )
        )

        val controller = AITranslationControllerImpl(
            wsUrl = "ws://localhost:${wireMock.port()}/ws/translate",
            apiKey = "test-api-key",
            maxRetries = 3
        )

        val result = runBlocking { controller.connect(mockConfig()) }

        result.isFailure shouldBe true
        // Verify 3 retry attempts were made
    }
}
```

---

## 2.2 Session Lifecycle Integration

```kotlin
@TestContainers
class TranslationSessionLifecycleTest {

    @Test
    fun `full session lifecycle - start, translate, stop`() = runTest {
        val gateway = buildTestGateway()
        val meetingId = MeetingId("test_meeting_001")

        // Start session
        val sessionId = gateway.startSession(meetingId, "auto", "ar").getOrThrow()

        // Send mock audio
        gateway.sendAudio(sessionId, generateTestPcmAudio())

        // Wait for translated audio output
        val translatedChunk = gateway
            .observeTranslatedAudio(sessionId)
            .first()

        translatedChunk shouldNotBe null
        translatedChunk.durationMs shouldBeGreaterThan 0

        // Stop session
        gateway.stopSession(sessionId).isSuccess shouldBe true
    }
}
```

---

# 3. End-to-End Tests

## 3.1 Language Selection Flow (Maestro)

```yaml
# maestro/translation_select_language.yaml
appId: com.aimeetx.app

---
- launchApp
- tapOn: "Join Meeting"
- waitForAnimationToEnd
- tapOn: "Translation"
- tapOn: "Select Language"
- tapOn: "Arabic"
- assertVisible: "Translating to Arabic"
- waitForAnimationToEnd
- assertVisible: "Translation Active"
```

---

## 3.2 Language Change During Meeting (Maestro)

```yaml
# maestro/translation_change_language.yaml
appId: com.aimeetx.app

---
- launchApp
- tapOn: "Join Meeting"
- tapOn: "Translation"
- tapOn: "Arabic"
- assertVisible: "Translating to Arabic"
- tapOn: "Change Language"
- tapOn: "French"
- assertVisible: "Translating to French"
```

---

## 3.3 Stop Translation (Maestro)

```yaml
# maestro/translation_stop.yaml
appId: com.aimeetx.app

---
- launchApp
- tapOn: "Join Meeting"
- tapOn: "Translation"
- tapOn: "Arabic"
- assertVisible: "Translation Active"
- tapOn: "Stop Translation"
- assertVisible: "Original Audio"
- assertNotVisible: "Translation Active"
```

---

# 4. Privacy / Compliance Tests

## 4.1 Verify No Audio Data Persisted

```kotlin
class TranslationPrivacyTest {

    @Test
    fun `no audio data should be stored after session ends`() = runTest {
        val meetingId = MeetingId("privacy_test_meeting")

        // Create session, send audio, terminate
        val sessionId = gateway.startSession(meetingId, "auto", "ar").getOrThrow()
        gateway.sendAudio(sessionId, generateTestPcmAudio())
        eventBus.publish(MeetingEndedEvent(meetingId = meetingId))

        // Wait for cleanup
        delay(6.minutes)

        // Assert: No records in session participants table
        val participants = translationSessionParticipantRepository.findByMeetingId(meetingId)
        participants shouldBe emptyList()
    }

    @Test
    fun `sessions should be terminated within 5 minutes of MeetingEndedEvent`() = runTest {
        val meetingId = MeetingId("cleanup_test_meeting")
        val sessionId = gateway.startSession(meetingId, "auto", "fr").getOrThrow()

        eventBus.publish(MeetingEndedEvent(meetingId = meetingId))
        delay(5.minutes + 30.seconds)

        val session = translationSessionRepository.findById(sessionId)
        session?.status shouldBe SessionStatus.TERMINATED
    }

    @Test
    fun `transcripts should not be stored unless recording is enabled`() = runTest {
        val meetingId = MeetingId("no_recording_meeting")
        // recording NOT enabled
        val sessionId = gateway.startSession(meetingId, "auto", "en").getOrThrow()
        gateway.sendAudio(sessionId, generateTestPcmAudio())

        delay(2.seconds)

        val transcripts = transcriptRepository.findByMeetingId(meetingId)
        transcripts shouldBe emptyList()
    }
}
```

---

# 5. Performance Tests

## 5.1 Audio Latency

| Test Scenario | Target | Measurement Method |
|---------------|--------|--------------------|
| Single speaker, single language | < 800ms p95 | Client timestamp to audio received |
| 10 concurrent languages, 100 speakers | < 800ms p95 | Distributed latency measurement |
| Session reconnect time | < 5 seconds | Time from disconnect to audio resuming |

## 5.2 Load Test

```
Scenario: 1000 concurrent meetings, each with 5 languages, 50 speakers

Expected:
  - All translations within 800ms p95
  - No session errors
  - Total Gemini API cost: ~5000 sessions

Tool: k6 with WebSocket extension
```

---

# 6. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| TR-T-001 | Participant selects Arabic | Arabic audio heard within 800ms | P0 |
| TR-T-002 | Participant switches from Arabic to French | French audio heard within 2 seconds | P0 |
| TR-T-003 | Participant stops translation | Original audio heard immediately | P0 |
| TR-T-004 | Meeting ends, session destroyed | No session metadata in DB after 5 minutes | P0 |
| TR-T-005 | 10 participants select 10 different languages | 10 separate sessions created | P1 |
| TR-T-006 | 11th language requested | Error returned, max sessions message | P1 |
| TR-T-007 | Gemini disconnects during session | Auto-reconnect within 5 seconds | P1 |
| TR-T-008 | Recording disabled | Transcripts not saved to DB | P0 |
| TR-T-009 | Subtitle delivery | Subtitles appear within 1200ms | P1 |
| TR-T-010 | Language preference saved | User's language auto-selected on next meeting | P2 |

---

End of Document