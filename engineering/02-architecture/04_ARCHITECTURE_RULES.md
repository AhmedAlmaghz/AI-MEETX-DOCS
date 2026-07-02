# Architecture Rules

Document ID: ARC-000

Version: 1.0.0

Status: Approved

Owner: Chief Software Architect

Classification: Mandatory

---

# 1. Purpose

This document defines the mandatory architectural rules of the AI Meeting Platform.

These rules are non-negotiable.

Every developer and every AI Coding Agent MUST follow them.

---

# 2. Architectural Style

The platform SHALL follow:

- Modular Architecture
- Clean Architecture
- Domain-Driven Design (Lightweight)
- Event-Driven Communication
- MVVM
- Repository Pattern
- Dependency Injection
- SOLID Principles
- Offline-first where applicable

---

# 3. Architectural Layers

Every Feature Module SHALL contain:

presentation/

domain/

data/

No additional business layers may be introduced without an ADR.

---

# 4. Presentation Layer Rules

Responsible only for:

- Rendering UI
- User Interaction
- UI State
- Navigation

Presentation MUST NOT:

- Access database
- Access network directly
- Implement business rules
- Perform AI processing

---

# 5. Domain Layer Rules

Responsible for:

Business Logic

Use Cases

Entities

Validation

Business Policies

The Domain Layer SHALL NOT depend on:

Android SDK

Compose

Firebase SDK

Supabase SDK

Networking

Database

Framework-specific APIs

---

# 6. Data Layer Rules

Responsible for:

Repositories

Remote Data Sources

Local Data Sources

Caching

DTO Mapping

Synchronization

---

# 7. Dependency Rule

Allowed dependency direction:

Presentation

↓

Domain

↓

Data

Never the opposite.

---

# 8. Feature Isolation

Each feature SHALL be isolated.

Examples:

feature-auth

feature-meeting

feature-media

feature-chat

feature-translation

feature-ai

Feature modules SHALL NOT directly reference each other.

---

# 9. Communication Rule

Feature modules communicate only through:

Events

Contracts

Interfaces

Shared Kernel

Direct implementation dependency is prohibited.

---

# 10. Shared Modules

Only reusable code belongs inside:

core

services

common

No business logic may be placed inside shared modules.

---

# 11. State Management

Each feature owns its own state.

Allowed:

StateFlow

SharedFlow

Immutable UI State

Not Allowed:

Mutable Global State

Singleton Business Objects

Global LiveData

---

# 12. Event System

Every cross-module communication SHALL use Events.

Examples:

MeetingCreated

ParticipantJoined

AudioMuted

MessageSent

TranslationUpdated

RecordingStarted

Events SHALL be immutable.

---

# 13. Repository Rules

Repositories belong to Data Layer only.

Repositories expose Domain Models.

Repositories SHALL NOT expose DTOs.

---

# 14. DTO Rules

DTOs exist only inside Data Layer.

DTOs SHALL NEVER reach:

Presentation

Domain

---

# 15. Mapping Rules

Allowed mappings:

DTO

↓

Entity

↓

UI Model

Reverse mapping when required.

No direct DTO → UI mapping.

---

# 16. Dependency Injection

Mandatory:

Hilt

Constructor Injection preferred.

Service Locator is prohibited.

---

# 17. Navigation Rules

Navigation belongs only inside App Shell.

Feature modules expose destinations.

Feature modules SHALL NOT navigate directly to other features.

---

# 18. Error Handling

Every layer defines its own error types.

Domain Errors

Data Errors

Presentation Errors

Exceptions SHALL NOT leak across layers.

---

# 19. AI Integration

AI is isolated.

Only modules allowed to access Gemini APIs:

feature-translation

feature-ai-assistant

All other modules consume AI through interfaces/events.

---

# 20. Media Engine

Media processing SHALL be isolated.

Modules may consume media services.

No feature may manipulate WebRTC internals directly.

---

# 21. Translation Engine

Translation is an independent module.

Input:

Audio Stream

Output:

Translated Text

Subtitles

Translated Audio (future)

Translation MUST NOT modify meeting logic.

---

# 22. Security Rules

Secrets SHALL NEVER exist in source code.

Tokens SHALL use Secure Storage.

Sensitive logs are prohibited.

PII must be minimized.

---

# 23. Offline Rules

Modules SHALL continue operating gracefully when offline whenever applicable.

Synchronization SHALL occur automatically after reconnect.

---

# 24. Performance Rules

Avoid unnecessary recomposition.

Avoid blocking Main Thread.

Use Coroutines.

Use Flow.

Heavy processing SHALL run on background threads.

---

# 25. Scalability Rules

Every module SHALL be replaceable.

Every module SHALL be independently testable.

Every module SHALL expose stable interfaces.

---

# 26. Documentation Rules

Every module SHALL contain:

README

Requirements

Specification

API

Events

Tests

---

# 27. Testing Rules

Every module SHALL include:

Unit Tests

Integration Tests

Critical modules SHALL include:

Performance Tests

Security Tests

---

# 28. Versioning Rules

Breaking architectural changes require:

ADR

Version Increment

Migration Plan

---

# 29. Forbidden Practices

❌ Business logic in UI

❌ Circular dependencies

❌ Feature-to-feature implementation dependency

❌ Global mutable state

❌ Direct database access from UI

❌ Direct network access from UI

❌ God Objects

❌ Utility classes containing business logic

❌ Copy/Paste implementations

---

# 30. Architecture Compliance

Before merging any module:

Architecture Review

Dependency Review

Event Review

Documentation Review

must pass.

---

END OF DOCUMENT