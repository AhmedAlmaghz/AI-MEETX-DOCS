# Meeting Recording Module

## Overview

`feature-recording` manages the entire lifecycle of meeting recordings: starting and stopping LiveKit Egress jobs, monitoring egress completion, persisting metadata to the database, storing files in cloud object storage, and generating signed download links.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business requirements, storage policies, and participant notification rules.
2. [Specification](SPECIFICATION.md) - Domain models, LiveKit Egress integration, polling job, and use cases.
3. [Database Schema](DATABASE.md) - `meeting_recordings` table with egress tracking and storage pointers.
4. [API Contract](API.md) - REST endpoints for start/stop, listing recordings, and generating signed URLs.
5. [Domain Events](EVENTS.md) - RecordingStarted, Stopped, Ready, and Failed events.
6. [Test Plan](TESTS.md) - Unit tests for use cases and the egress polling job.

## Key Features

- **LiveKit Egress Integration**: Uses LiveKit's Egress service to compose meeting room video into MP4 files.
- **Layout Selection**: HOST chooses from Speaker View, Gallery View, or Audio-Only before recording.
- **Async File Readiness**: Polling job monitors egress status and updates recording state when file is uploaded.
- **Cloud Storage**: Files stored encrypted at rest in dedicated S3/GCS bucket with configurable retention.
- **Signed Download Links**: Generates temporary signed URLs (max 72 hours) for secure downloads.
