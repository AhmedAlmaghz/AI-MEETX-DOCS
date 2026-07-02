Document ID: REP-001

Version: 1.0.0

Status: Approved

Owner: Engineering Team

Classification: Mandatory

---

# 1. Purpose

This document defines the official repository structure for the AI Meeting Platform.

Every source file SHALL be located according to this structure.

No developer or AI Agent may create new top-level modules without an approved ADR.

---

# 2. Repository Principles

The repository SHALL be:

- Modular
- Scalable
- Feature-Oriented
- Clean Architecture compliant
- Easy to navigate
- Easy to test
- Easy to maintain

---

# 3. Repository Layout

The project follows a **Feature-Modular Monorepo** layout. 

```
AI MEETX (Root)
│
├── gradle/
│   └── libs.versions.toml     # Centralized version catalog
│
├── app/                       # App Shell Module (Android Application)
│   ├── src/main/java/com/company/app/
│   │   ├── di/                # Global dependency injection modules
│   │   ├── navigation/        # Application navigation graph & destinations
│   │   └── MeetxApplication.kt # Application class initializing Hilt & Timber
│   └── build.gradle.kts
│
├── core/                      # Core Modules (Infrastructure & Helpers)
│   ├── network/               # Retrofit, OkHttp, WebSocket configuration
│   ├── database/              # Room database configurations & migrations
│   ├── designsystem/          # M3 color themes, typography, shared UI components
│   └── common/                # Threading utilities, custom Exceptions, Result wrapper
│
├── features/                  # Bounded Contexts (Independent Gradle Modules)
│   ├── feature-auth/          # User authentication (Email/Password, Google, Guest)
│   ├── feature-profile/       # User profile details and settings configuration
│   ├── feature-meeting/       # Main meeting context (contains subdomains)
│   │   ├── lifecycle/         # Meeting start, join, and end workflows
│   │   ├── participants/      # Participant roster management
│   │   ├── room/              # Audio/Video room state (LiveKit WebRTC tokens)
│   │   ├── permissions/       # Speaker queue, hand raising, role overrides
│   │   ├── invitations/       # Meeting RSVP, link sharing, and passcodes
│   │   ├── waiting-room/      # Host lobby gate, connection staging
│   │   ├── scheduling/        # Scheduled meetings and RFC 5545 rules
│   │   ├── presence/          # Heartbeat monitors & active speaker indicators
│   │   └── shared/            # Shared meeting kernel (IDs, roles, core errors)
│   ├── feature-chat/          # In-meeting messaging and file sharing
│   ├── feature-media/         # WebRTC capture, echo cancellation, hardware routing
│   ├── feature-translation/   # Gemini Live Translation streaming PCM integration
│   ├── feature-ai/            # Gemini AI Meeting Assistant (summary, actions, Q&A)
│   ├── feature-recording/     # LiveKit Egress recording trigger & cloud exports
│   ├── feature-notification/  # Firebase push notification delivery pipeline
│   ├── feature-classroom/     # Quiz systems, collaborative whiteboard, breakout rooms
│   ├── feature-admin/         # Tenant settings and immutable audit logging
│   └── feature-analytics/     # Business fact logs and aggregate dashboards
│
├── engineering/               # Project specifications & master plans (Documentation)
│   ├── 00-governance/         # Constitutions, ADRs
│   ├── 01-product/            # Product requirements (PRS)
│   ├── 02-architecture/       # Global architecture rules
│   ├── 03-engineering/        # Coding standards, databases, event system, guides
│   └── features/              # Feature-level technical documentation
│
└── build.gradle.kts           # Root gradle script
```

---

# 4. Feature Module Internal Layout

Every feature module (e.g., `features/feature-auth/`) MUST strictly enforce Clean Architecture layers:

```
feature-name/
├── src/main/java/com/company/feature/
│   ├── presentation/          # MVVM Presentation Layer
│   │   ├── ui/                # Composables (Stateless Screens, Dialogs, Cards)
│   │   ├── viewmodel/         # ViewModels exposing immutable StateFlow UI states
│   │   └── navigation/        # Feature navigation graph mappings
│   │
│   ├── domain/                # Pure Kotlin Business Layer
│   │   ├── model/             # Pure domain entities and value objects
│   │   ├── usecase/           # Single-responsibility Use Cases
│   │   └── port/              # Repository contracts (Interfaces)
│   │
│   └── data/                  # Infrastructure Data Layer
│       ├── model/             # DTO (Data Transfer Objects) mapping network/DB
│       ├── repository/        # Repository implementations mapping DTO to Domain
│       └── datasource/        # Remote & local API wrappers (Retrofit/Room)
│
└── build.gradle.kts           # Gradle configuration for this module
```

---

# 5. Dependency Rules

1. **Horizontal Separation**: No feature module under `features/` is allowed to depend on another feature module. Any cross-feature interaction must happen via published events or shared interfaces defined under `core/` or `feature-meeting/shared/`.
2. **Vertical Clean Architecture**: Presentation depends on Domain, Data depends on Domain. Domain depends on nothing except core language libraries.

---

End of Document