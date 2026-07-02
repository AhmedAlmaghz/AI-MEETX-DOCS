# feature-translation/API.md

Document ID: TRANSLATION-API-001

Version: 2.0.0

Status: Approved

Feature: Real-Time Translation

Base Path: /api/v1/meetings/{meetingId}/translation

Classification: Internal

---

# Overview

The Translation API provides endpoints to manage translation session configuration per meeting.

The actual audio translation is handled in real-time over WebSocket connections (not REST).
REST endpoints are used for configuration, language selection, and session status.

---

# Authentication

All endpoints require:
- Valid JWT Bearer token.
- Participant must be an active member of the specified meeting.

---

# Endpoints

---

## 1. Start Translation for Participant

Participants call this endpoint to register their target language preference.

This triggers the creation of a Gemini translation session if one does not yet exist for that language.

```
POST /api/v1/meetings/{meetingId}/translation/start
```

### Request Body

```json
{
  "targetLanguage": "ar",
  "enableSubtitles": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| targetLanguage | string (BCP-47) | Yes | The language to translate to (e.g., "ar", "en", "fr") |
| enableSubtitles | boolean | No | Whether to receive text subtitles (default: true) |

### Response

```json
{
  "translationSessionId": "ts_abc123",
  "targetLanguage": "ar",
  "status": "ACTIVE",
  "audioTrackId": "translation_track_ar",
  "startedAt": "2025-01-15T10:30:00Z"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Translation started successfully |
| 400 | Invalid language code or request body |
| 403 | Participant is not a member of the meeting |
| 404 | Meeting not found or not active |
| 429 | Maximum language sessions reached (10 per meeting) |

---

## 2. Stop Translation for Participant

Participant stops translation and reverts to original audio.

```
POST /api/v1/meetings/{meetingId}/translation/stop
```

### Request Body

```json
{
  "targetLanguage": "ar"
}
```

### Response

```json
{
  "status": "STOPPED",
  "message": "Translation stopped for participant"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Translation stopped |
| 404 | No active translation for participant |

---

## 3. Change Target Language

Switch participant to a different target language.

```
POST /api/v1/meetings/{meetingId}/translation/change-language
```

### Request Body

```json
{
  "newTargetLanguage": "fr"
}
```

### Response

```json
{
  "translationSessionId": "ts_def456",
  "targetLanguage": "fr",
  "status": "ACTIVE",
  "audioTrackId": "translation_track_fr",
  "switchedAt": "2025-01-15T10:35:00Z"
}
```

---

## 4. Get Translation Status for Meeting

Returns the current state of all translation sessions in a meeting.

Only available to the host or moderators.

```
GET /api/v1/meetings/{meetingId}/translation/status
```

### Response

```json
{
  "meetingId": "meeting_abc123",
  "activeSessions": [
    {
      "sessionId": "ts_abc123",
      "targetLanguage": "ar",
      "status": "ACTIVE",
      "participantCount": 8,
      "startedAt": "2025-01-15T10:30:00Z"
    },
    {
      "sessionId": "ts_def456",
      "targetLanguage": "fr",
      "status": "ACTIVE",
      "participantCount": 3,
      "startedAt": "2025-01-15T10:31:00Z"
    }
  ],
  "totalActiveLanguages": 2,
  "maxLanguages": 10
}
```

---

## 5. Get Supported Languages

Returns the list of languages supported for translation.

```
GET /api/v1/translation/languages
```

### Response

```json
{
  "supportedLanguages": [
    { "code": "ar", "name": "Arabic", "rtl": true },
    { "code": "en", "name": "English", "rtl": false },
    { "code": "fr", "name": "French", "rtl": false },
    { "code": "de", "name": "German", "rtl": false },
    { "code": "zh", "name": "Chinese (Simplified)", "rtl": false },
    { "code": "ja", "name": "Japanese", "rtl": false },
    { "code": "ko", "name": "Korean", "rtl": false },
    { "code": "es", "name": "Spanish", "rtl": false },
    { "code": "pt", "name": "Portuguese", "rtl": false },
    { "code": "it", "name": "Italian", "rtl": false },
    { "code": "hi", "name": "Hindi", "rtl": false },
    { "code": "tr", "name": "Turkish", "rtl": false },
    { "code": "fa", "name": "Persian", "rtl": true },
    { "code": "sw", "name": "Swahili", "rtl": false }
  ],
  "model": "gemini-3.5-live-translate-preview",
  "version": "2.0"
}
```

---

# WebSocket Events (Real-Time)

The following events are delivered via the real-time event system (not REST).

---

## Transcript Segment Event

Published when a text transcript segment (original or translated) is available.

```json
{
  "type": "TRANSCRIPT_SEGMENT",
  "meetingId": "meeting_abc123",
  "sessionId": "ts_abc123",
  "speakerId": "participant_xyz",
  "originalText": "Welcome to today's meeting.",
  "translatedText": "مرحباً بكم في اجتماع اليوم.",
  "targetLanguage": "ar",
  "startMs": 0,
  "endMs": 2400,
  "isFinal": true,
  "timestamp": "2025-01-15T10:30:01Z"
}
```

---

## Translation Session Event

Published when a translation session changes status.

```json
{
  "type": "TRANSLATION_SESSION_STATUS",
  "meetingId": "meeting_abc123",
  "sessionId": "ts_abc123",
  "targetLanguage": "ar",
  "status": "ACTIVE",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_LANGUAGE | The specified language code is not supported. |
| 403 | FORBIDDEN | Participant is not authorized to access this meeting's translation. |
| 404 | MEETING_NOT_FOUND | The meeting does not exist or is not active. |
| 429 | MAX_SESSIONS_REACHED | The meeting has reached the maximum of 10 translation sessions. |
| 503 | TRANSLATION_UNAVAILABLE | The Gemini Live Translate API is temporarily unavailable. |

---

End of Document