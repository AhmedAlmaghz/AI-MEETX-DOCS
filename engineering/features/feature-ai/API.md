# feature-ai/API.md

Document ID: AI-API-001

Version: 1.0.0

Status: Approved

Feature: AI Meeting Assistant

Base Path: /api/v1/meetings/{meetingId}/ai

---

# Overview

Provides REST endpoints for fetching AI summaries, action items, Q&A interactions, and post-meeting reports.

---

# Endpoints

---

## 1. Get Running Summary

Returns the latest incremental AI summary for an active meeting.

```
GET /api/v1/meetings/{meetingId}/ai/summary
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "summaryText": "The team discussed Q1 marketing budget. Sarah proposed a 20% increase. John raised concerns about ROI metrics.",
  "keyTopics": ["marketing", "budget", "ROI"],
  "isFinal": false,
  "generatedAt": "2025-01-15T10:35:00Z"
}
```

---

## 2. Get Action Items

Returns AI-detected action items for the meeting.

```
GET /api/v1/meetings/{meetingId}/ai/action-items
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "actionItems": [
    {
      "id": "ai_001",
      "description": "Prepare ROI analysis report",
      "assignedTo": "John Connor",
      "dueDate": "next Friday",
      "confidence": 0.92,
      "detectedAt": "2025-01-15T10:33:00Z"
    }
  ]
}
```

---

## 3. Ask AI a Question

Sends a question to the AI assistant. Response is generated from the transcript context.

```
POST /api/v1/meetings/{meetingId}/ai/ask
```

### Request Body

```json
{
  "question": "What decisions were made about the budget so far?"
}
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "question": "What decisions were made about the budget so far?",
  "answer": "The team agreed to review the current marketing budget. Sarah proposed a 20% increase, pending ROI analysis from John.",
  "answeredAt": "2025-01-15T10:36:00Z"
}
```

---

## 4. Get Post-Meeting Report

Returns the final AI-generated report after the meeting ends.

```
GET /api/v1/meetings/{meetingId}/ai/report
```

### Response (200 OK)

```json
{
  "reportId": "rep_abc123",
  "meetingId": "meeting_abc123",
  "status": "READY",
  "summary": "...",
  "decisions": ["Review marketing budget", "John to prepare ROI analysis"],
  "actionItems": [
    {
      "description": "Prepare ROI analysis report",
      "assignedTo": "John Connor",
      "dueDate": "next Friday"
    }
  ],
  "topicBreakdown": {
    "marketing": 18,
    "budget": 12,
    "ROI": 8
  },
  "generatedAt": "2025-01-15T11:05:00Z"
}
```

---

## 5. Export Report (Markdown)

```
GET /api/v1/meetings/{meetingId}/ai/report/export?format=markdown
```

Returns the report as a `text/markdown` document.

---

# WebSocket Events (Real-Time)

| Event | Description |
|-------|-------------|
| `AI_SUMMARY_UPDATED` | Broadcast when incremental summary updates |
| `AI_ACTION_ITEM_DETECTED` | Broadcast when a new action item is found |
| `AI_REPORT_READY` | Broadcast when post-meeting report is generated |

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 404 | REPORT_NOT_READY | Post-meeting report is still being generated |
| 429 | AI_RATE_LIMIT | Gemini API rate limit exceeded |
| 503 | AI_SERVICE_UNAVAILABLE | Gemini API is unreachable |

---

End of Document
