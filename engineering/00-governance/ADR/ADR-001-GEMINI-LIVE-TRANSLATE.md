# ADR-001: Gemini Live Translate — Speech-to-Speech Translation Engine

Document ID: ADR-001

Version: 1.0.0

Status: Accepted

Date: 2025-01-15

Deciders: Engineering Lead, AI Team Lead, Product Owner

Affected Features: feature-translation

Classification: Architecture Freeze — No changes without superseding ADR

---

# Context

AI MEETX requires real-time translation for multilingual meetings.

The original design used a traditional STT → Translation → TTS pipeline:

```
Speaker Audio
    ↓
Whisper (Speech-to-Text)
    ↓
Translation Model (e.g., Google Translate API)
    ↓
TTS Synthesis (e.g., Google Cloud TTS)
    ↓
Listener Audio
```

This approach was evaluated during Phase 10 planning and found to have the following problems.

---

# Problem

| Problem | Description |
|---------|-------------|
| High latency | End-to-end delay of 3–6 seconds, unacceptable for live meetings |
| Unnatural voice | Synthesized speech loses speaker personality and prosody |
| High complexity | 3 separate AI model integrations required |
| High cost | Separate billing for Whisper, Translation API, and TTS API |
| Maintenance burden | 3 separate services to monitor, update, and maintain |
| Error surface | Multiple failure points — any one can break the pipeline |

---

# Decision

We adopt **Gemini Live Translate** (`gemini-3.5-live-translate-preview`) as the sole translation engine.

This is a Speech-to-Speech translation model that:
- Accepts raw PCM audio as input.
- Returns translated PCM audio as output.
- Simultaneously returns original and translated text transcripts.
- Operates over a persistent WebSocket connection (streaming).
- Eliminates the need for separate STT, Translation, and TTS services.

## Additional Design Decision: Sessions Per Language, Not Per Participant

To optimize cost, we create **one Gemini session per target language per meeting**, not one per participant.

```
Meeting: 50 participants
  → 20 want Arabic    → 1 Gemini session
  → 15 want English   → 1 Gemini session
  → 10 want French    → 1 Gemini session
  → 5 want Spanish    → 1 Gemini session
  ─────────────────────────────────────
  Total: 4 Gemini sessions (not 50)
```

This reduces cost by approximately 90% compared to per-participant sessions.

---

# New Architecture

```
Participant Audio
       │
       ▼
LiveKit Audio Track
       │
       ▼
AI Translation Gateway (per meeting)
       │
       ├─── Creates sessions per target language
       │
       ▼
Gemini Live Translate Session (per language)
  gemini-3.5-live-translate-preview
       │
       ├────────► Original Transcript (text stream)
       ├────────► Translated Transcript (text stream)
       │
       ▼
Translated Audio Stream
       │
       ▼
LiveKit Audio Track (per language)
       │
       ▼
Target Participants
```

---

# Alternatives Considered

## Alternative 1: Keep the STT → Translation → TTS Pipeline

**Reason rejected:** Too slow (3–6s latency), unnatural voice output, high operational complexity.

## Alternative 2: Hybrid (Gemini for translation, TTS for natural voice)

**Reason rejected:** Adds complexity without significant benefit since Gemini Live Translate already preserves voice prosody.

## Alternative 3: Per-Participant Gemini Sessions

**Reason rejected:** Too expensive. 50 participants = 50 sessions. Per-language sessions reduce cost by ~90%.

## Alternative 4: Open-Source (Whisper + OPUS-MT + Coqui TTS)

**Reason rejected:** Requires self-hosted infrastructure, significantly higher maintenance burden, and quality is lower than Gemini's model.

---

# Consequences

## Positive

- Latency reduced from 3–6s to < 800ms p95.
- Natural-sounding translated audio (speaker prosody preserved).
- Single integration point (one API, one WebSocket protocol).
- Cost reduced ~90% vs per-participant approach.
- Simplified architecture — 3 services replaced with 1.

## Negative

- Dependency on Google Cloud Gemini API availability.
- Cost per session (Gemini API pricing).
- Model may not support all niche languages.

## Neutral

- API key and quota management required.
- Session management complexity moved to Translation Gateway service.

---

# Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gemini API unavailable | Low | High | Fallback to text-only subtitles + host notification |
| Quota exceeded | Medium | Medium | Implement rate limiting and quota alerts |
| Language not supported | Low | Low | Graceful error with supported languages list |
| WebSocket disconnect | Medium | Medium | Automatic reconnect with exponential backoff |

---

# Implementation Reference

See:
- [TRANSLATION-SPEC-001](../features/feature-translation/SPECIFICATION.md) — Full component architecture.
- [TRANSLATION-REQ-001](../features/feature-translation/REQUIREMENTS.md) — Business and technical requirements.
- [TRANSLATION-API-001](../features/feature-translation/API.md) — REST and WebSocket API.
- [TRANSLATION-EVENTS-001](../features/feature-translation/EVENTS.md) — Domain events.
- [TRANSLATION-DB-001](../features/feature-translation/DATABASE.md) — Data model.
- [TRANSLATION-TESTS-001](../features/feature-translation/TESTS.md) — Test strategy.

---

# ADR Lifecycle

This ADR is **Accepted** and enforced as part of Architecture Freeze v1.0.

Any changes to this decision require:
1. A new ADR that supersedes this one.
2. Review and approval by Engineering Lead and AI Team Lead.
3. Update to `TRANSLATION-SPEC-001` and all dependent documents.

---

End of Document
