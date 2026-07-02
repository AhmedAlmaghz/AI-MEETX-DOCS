# Testing Guide

Document ID: TST-001

Version: 1.0.0

Status: Approved

Owner: Quality Assurance & Testing Team

Classification: Mandatory

---

# 1. Purpose

This document defines the mandatory testing policies, tooling, execution commands, and standard templates for the AI Meeting Platform.

Every feature module must have high-quality test coverage before it is merged into the master codebase.

---

# 2. Testing Principles

The platform testing strategy is built around:

1. **Automation First**: Every pull request must run unit and integration tests automatically.
2. **Layered Verification**: Tests are partitioned by execution scope (Unit, Integration, Performance, Security).
3. **Hermetic Mocks**: Domain logic tests must be isolated from networks, databases, and third-party APIs using mock frameworks.
4. **Offline Resilience**: Tests must assert offline cache recovery and synchronization logic.

---

# 3. Tooling Stack

The following frameworks are approved for testing:

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Testing | **JUnit 5** | Core domain and use case assertions |
| Mocking | **MockK** | Simulating dependency behaviors |
| Coroutine Testing | **kotlinx-coroutines-test** | Controlling dispatchers and virtual time |
| Integration Testing | **Testcontainers** | Running real PostgreSQL, Redis, and Kafka in tests |
| API Stubbing | **WireMock** | Simulating Google Gemini and Firebase REST APIs |
| UI/E2E Testing | **Compose UI Test / Maestro** | Testing user flows on Android emulators |
| Coverage Reporting | **JaCoCo** | Analyzing test coverage percent |

---

# 4. Unit Testing Standards

All domain Use Cases and presentation ViewModels must have corresponding unit tests.

### 4.1 Mocking Strategy
- Mock repositories, gateways, and services.
- Never use real network/database instances in unit tests.
- Prefer `coEvery` for suspend function stubbing.

### 4.2 Assertions
- Use Kotlin `shouldBe`, `shouldNotBe`, `shouldThrow` for clean BDD-style assertions.

```kotlin
// Example Use Case Unit Test
describe("JoinMeetingUseCase") {
    val repository = mockk<MeetingRepository>()
    val useCase = JoinMeetingUseCase(repository)

    it("should succeed when meeting is active and slots are available") {
        val meetingId = MeetingId("meet_123")
        val participantId = ParticipantId("user_001")
        
        coEvery { repository.getMeeting(meetingId) } returns Result.success(activeMeeting())
        coEvery { repository.addParticipant(meetingId, any()) } returns Result.success(Unit)

        val result = useCase(JoinMeetingCommand(meetingId, participantId))
        
        result.isSuccess shouldBe true
    }
}
```

---

# 5. Integration Testing Standards

Integration tests verify data-to-infrastructure and cross-subdomain integration boundaries.

### 5.1 Testcontainers usage
For repository and caching tests:
- Spin up an embedded PostgreSQL database container.
- Spin up a Redis container for presence and waitlist caches.

### 5.2 WireMock usage
For Gemini AI and Translation integration:
- Stub all Gemini REST API endpoints.
- Assert correct JSON requests are built by translation client classes.

---

# 6. Performance & Load Testing

- **WebSocket Connection Limits**: Load testing must confirm the meeting room can handle 1,000 concurrent WebSocket presence signals.
- **Audio Rendering Latency**: Tests must verify translation audio stream parsing and playback completes within 200ms of socket packet reception.

---

# 7. Coverage Quality Gates

Every feature module must meet the following minimum code coverage requirements before PR approval:

```
Domain Layer:       90% Line Coverage
Presentation Layer: 75% Line Coverage
Data Layer:         80% Line Coverage
Overall Project:    80% Combined Coverage
```

---

End of Document
