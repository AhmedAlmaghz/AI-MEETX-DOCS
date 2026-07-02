# feature-ai/TESTS.md

Document ID: AI-TESTS-001

Version: 1.0.0

Status: Approved

Feature: AI Meeting Assistant

Module: feature-ai

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | Use cases, Gemini gateway mock | 85% |
| Integration | WireMock (Gemini API) | GeminiAiGateway HTTP calls | 75% |
| E2E | Maestro | Q&A flow, report download | Critical paths |

---

# 1. Unit Tests

## 1.1 GenerateRunningSummaryUseCase

```kotlin
describe("GenerateRunningSummaryUseCase") {

    it("should call Gemini with transcript context and save summary") {
        val gateway = mockk<GeminiAiGateway>()
        val contextRepo = mockk<TranscriptContextRepository>()
        val summaryRepo = mockk<MeetingReportRepository>()
        val eventBus = mockk<EventBus>()

        val context = MeetingTranscriptContext(
            meetingId = MeetingId("m1"),
            segments = listOf(
                TranscriptSegment("s1", "Sarah", "We need to review the budget.", "en", Instant.now())
            )
        )

        coEvery { contextRepo.getContext(any()) } returns Result.success(context)
        coEvery { gateway.generateSummary(any()) } returns Result.success(
            MeetingSummary(
                id = SummaryId("sum_1"),
                meetingId = MeetingId("m1"),
                summaryText = "The team discussed budget review.",
                keyTopics = listOf("budget"),
                generatedAt = Instant.now()
            )
        )
        coEvery { summaryRepo.save(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = GenerateRunningSummaryUseCase(gateway, contextRepo, summaryRepo, eventBus)
        val result = useCase(MeetingId("m1"))

        result.isSuccess shouldBe true
        result.getOrNull()?.summaryText shouldContain "budget"
        coVerify { eventBus.publish(ofType<AiSummaryUpdatedEvent>()) }
    }
}
```

---

## 1.2 AnswerQuestionUseCase

```kotlin
describe("AnswerQuestionUseCase") {

    it("should return AI answer within context window") {
        val gateway = mockk<GeminiAiGateway>()
        coEvery { gateway.answerQuestion(any(), any()) } returns Result.success(
            "The team discussed a 20% budget increase."
        )

        val useCase = AnswerQuestionUseCase(gateway, mockk())
        val result = useCase(
            AskQuestionCommand(
                meetingId = MeetingId("m1"),
                question = "What was discussed about budget?"
            )
        )

        result.isSuccess shouldBe true
        result.getOrNull() shouldContain "budget"
    }
}
```

---

# 2. Integration Tests (WireMock)

```kotlin
@ExtendWith(WireMockExtension::class)
class GeminiGatewayIntegrationTest {

    @Test
    fun `should call Gemini generateContent and parse response`() {
        wireMock.stubFor(
            post(urlEqualTo("/v1/models/gemini-2.0-flash-exp:generateContent"))
                .willReturn(okJson("""
                    {
                      "candidates": [{
                        "content": {
                          "parts": [{"text": "The team discussed marketing budget."}]
                        }
                      }]
                    }
                """.trimIndent()))
        )

        val gateway = GeminiAiGateway(baseUrl = "http://localhost:${wireMock.port()}", apiKey = "test-key")
        val result = runBlocking { gateway.generateSummary(mockContext()) }

        result.isSuccess shouldBe true
        result.getOrNull()?.summaryText shouldContain "marketing"
    }
}
```

---

# 3. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| AI-T-001 | AI receives transcript segment | Summary updated within 5s | P0 |
| AI-T-002 | Participant asks @AI question | Response returned within 3s | P0 |
| AI-T-003 | Meeting ends | Report generated within 5 min | P0 |
| AI-T-004 | Export report as Markdown | Valid .md file downloaded | P1 |
| AI-T-005 | Gemini API fails | Graceful fallback, no crash | P0 |

---

End of Document
