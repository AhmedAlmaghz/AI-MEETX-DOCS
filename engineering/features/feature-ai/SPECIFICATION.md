# feature-ai/SPECIFICATION.md

Document ID: AI-SPEC-001

Version: 1.0.0

Status: Approved

Feature: AI Meeting Assistant

Module: feature-ai

---

# 1. Purpose

Defines the domain models, AI pipeline architecture, and service contracts for the AI Meeting Assistant module.

---

# 2. Domain Models

## 2.1 MeetingTranscriptContext (Value Object)

Holds the rolling context window fed to the AI.

```kotlin
data class MeetingTranscriptContext(
    val meetingId: MeetingId,
    val segments: List<TranscriptSegment>,
    val windowMinutes: Int = 30
) {
    fun toPromptString(): String =
        segments.joinToString("\n") { "[${it.speakerName}]: ${it.text}" }
}

data class TranscriptSegment(
    val segmentId: String,
    val speakerName: String,
    val text: String,
    val language: String,
    val timestamp: Instant
)
```

## 2.2 MeetingSummary (Entity)

```kotlin
data class MeetingSummary(
    val id: SummaryId,
    val meetingId: MeetingId,
    val summaryText: String,
    val keyTopics: List<String>,
    val generatedAt: Instant,
    val isFinal: Boolean = false
)
```

## 2.3 ActionItem (Entity)

```kotlin
data class ActionItem(
    val id: ActionItemId,
    val meetingId: MeetingId,
    val description: String,
    val assignedTo: String?,
    val dueDate: String?,
    val detectedAt: Instant,
    val confidence: Float
)
```

## 2.4 MeetingReport (Aggregate Root)

The final post-meeting deliverable.

```kotlin
data class MeetingReport(
    val id: ReportId,
    val meetingId: MeetingId,
    val summary: String,
    val decisions: List<String>,
    val actionItems: List<ActionItem>,
    val topicBreakdown: Map<String, Int>,  // topic → minutes discussed
    val generatedAt: Instant,
    val status: ReportStatus = ReportStatus.GENERATING
)

enum class ReportStatus { GENERATING, READY, FAILED }
```

---

# 3. AI Pipeline Architecture

```
Transcript Segment (from feature-translation)
    ↓
TranscriptAggregator (builds context window)
    ↓
Gemini API (gemini-2.0-flash-exp)
    ↓
SummaryParser / ActionItemParser / ReportBuilder
    ↓
MeetingSummary / ActionItem / MeetingReport (persisted)
    ↓
Domain Event Published
```

---

# 4. Gemini Prompt Templates

## 4.1 Running Summary Prompt

```
System: You are a meeting assistant AI. You receive live transcript segments and generate a concise meeting summary.

User: Here is the transcript so far:
{transcriptContext}

Generate a 2-3 sentence summary of what has been discussed so far.
```

## 4.2 Action Item Detection Prompt

```
System: Extract clear action items from this meeting transcript. Return JSON.

User: Transcript:
{transcriptContext}

Return JSON array: [{"description": "...", "assignedTo": "...", "dueDate": "..."}]
```

## 4.3 Q&A Prompt

```
System: You are an AI assistant in a meeting. Answer questions based on the transcript context.

Context:
{transcriptContext}

User Question: {userQuestion}
```

---

# 5. Service Contracts

```kotlin
interface AiMeetingService {
    suspend fun processTranscriptSegment(segment: TranscriptSegment): Result<Unit>
    suspend fun generateRunningSummary(meetingId: MeetingId): Result<MeetingSummary>
    suspend fun detectActionItems(meetingId: MeetingId): Result<List<ActionItem>>
    suspend fun answerQuestion(meetingId: MeetingId, question: String): Result<String>
    suspend fun generatePostMeetingReport(meetingId: MeetingId): Result<MeetingReport>
}
```

---

# 6. Repository Contracts

```kotlin
interface MeetingReportRepository {
    suspend fun save(report: MeetingReport): Result<MeetingReport>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<MeetingReport?>
    suspend fun update(report: MeetingReport): Result<MeetingReport>
}

interface ActionItemRepository {
    suspend fun saveAll(items: List<ActionItem>): Result<List<ActionItem>>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<List<ActionItem>>
}
```

---

# 7. Module Structure

```
feature-ai/
├── domain/
│   ├── model/
│   │   ├── MeetingReport.kt
│   │   ├── ActionItem.kt
│   │   └── MeetingSummary.kt
│   ├── usecase/
│   │   ├── ProcessTranscriptSegmentUseCase.kt
│   │   ├── GenerateRunningSummaryUseCase.kt
│   │   ├── DetectActionItemsUseCase.kt
│   │   ├── AnswerQuestionUseCase.kt
│   │   └── GeneratePostMeetingReportUseCase.kt
│   └── port/
│       ├── MeetingReportRepository.kt
│       └── ActionItemRepository.kt
├── data/
│   ├── MeetingReportRepositoryImpl.kt
│   └── GeminiAiGateway.kt
└── presentation/
    └── AiAssistantViewModel.kt
```

---

End of Document
