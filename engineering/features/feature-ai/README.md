# AI Meeting Assistant Module

## Overview

`feature-ai` is the Gemini-powered AI meeting assistant. It processes live meeting transcripts, generates incremental summaries, detects action items, answers participant questions via in-meeting chat, and produces comprehensive post-meeting reports.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business requirements, privacy rules, and Gemini usage policy.
2. [Specification](SPECIFICATION.md) - Domain models, AI pipeline architecture, and Gemini prompt templates.
3. [Database Schema](DATABASE.md) - Privacy-by-Design storage: only processed outputs persisted, never raw transcripts.
4. [API Contract](API.md) - REST endpoints and real-time WebSocket events.
5. [Domain Events](EVENTS.md) - Events published and consumed (transcript input, meeting end triggers).
6. [Test Plan](TESTS.md) - Unit, WireMock integration, and E2E test strategy.

## Key Features

- **Real-Time Summary**: Running summary updates as the meeting progresses, powered by Gemini.
- **Action Item Detection**: Automatically surfaces tasks and assignments from conversation context.
- **@AI Q&A Chat**: Participants query the AI via `@AI` prefix in meeting chat — answered in < 3 seconds.
- **Post-Meeting Reports**: Full reports (summary, decisions, actions, topic breakdown) generated within 5 minutes of meeting end.
- **Privacy-by-Design**: Raw transcripts never stored — only summarized outputs are persisted.
