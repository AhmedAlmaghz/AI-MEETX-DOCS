# Meeting Analytics & Insights Module

## Overview

`feature-analytics` is the Business Intelligence layer of the AI MEETX platform. It ingests domain events from all other modules, writes raw fact records, and aggregates them every 5 minutes into pre-computed summary tables. This two-tier architecture ensures < 500ms dashboard query responses while maintaining < 5 minutes data freshness.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business requirements for tenant, user, and platform metrics.
2. [Specification](SPECIFICATION.md) - Domain models (MeetingFact, UserEngagementFact), data pipeline, and query services.
3. [Database Schema](DATABASE.md) - Two-tier storage: fact tables (raw) + summary tables (pre-computed).
4. [API Contract](API.md) - Analytics endpoints for meetings, user engagement, platform metrics, and CSV export.
5. [Event Catalog](EVENTS.md) - Complete list of consumed events and the aggregation job schedule.
6. [Test Plan](TESTS.md) - Unit tests for aggregation logic, integration, and performance benchmarks.

## Key Features

- **Event-Driven Ingestion**: All metrics sourced from domain events — no direct database polling.
- **Two-Tier Storage**: Raw fact tables for auditability + pre-computed summaries for fast API responses.
- **5-Minute Freshness**: Aggregation job runs every 5 minutes, guaranteeing minimal data lag.
- **Multi-Granularity**: Daily, weekly, and monthly time-series breakdowns for all metrics.
- **Role-Based Access**: Tenant admins see own data; platform metrics restricted to SUPER_ADMIN.
- **CSV Export**: On-demand raw data exports for reporting and compliance.
