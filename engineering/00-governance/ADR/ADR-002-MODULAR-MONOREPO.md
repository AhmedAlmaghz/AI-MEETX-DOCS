# ADR-002: Modular Monorepo Architecture for Android Native

Document ID: ADR-002

Version: 1.0.0

Status: Accepted

Date: 2025-01-16

Deciders: Chief Architect, Engineering Lead, Mobile Lead

Affected Features: All modules under `features/` and `core/`

Classification: Architecture Freeze — No changes without superseding ADR

---

# Context

The AI Meeting Platform is a large-scale application containing multiple distinct subdomains (Auth, Meeting, Profile, Media, Translation, Classroom, etc.).

A traditional single-module Android project (`app/` only) results in:
- High build compilation times (Gradle cannot cache parallel modules).
- Lack of enforcement of code boundaries (any package can import any class).
- Circular dependency risks.
- Massive merge conflict zones on single source folders.

---

# Problem

How do we architect the codebase to scale cleanly across multiple developers, facilitate incremental compilation caching, and preserve domain boundaries?

---

# Decision

We adopt a **Multi-Module Monorepo** structure for the Android project, separating the codebase into:

1. **App Shell (`app/`)**: Combines all modules, configures global Hilt modules, and defines root Navigation.
2. **Core Modules (`core/`)**: Low-level infrastructure modules (`core/network`, `core/database`, `core/designsystem`, `core/common`) shared by all features.
3. **Feature Modules (`features/`)**: Independent modules containing feature-specific presentation, domain, and data layers (e.g. `feature-auth`, `feature-meeting`).

## Module Dependency Rule

```
                  ┌──────────┐
                  │   app    │ (App Shell)
                  └────┬─────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
    ┌────────────────┐   ┌────────────────┐
    │  feature-auth  │   │ feature-meeting│ (Features)
    └────────┬───────┘   └───────┬────────┘
             │                   │
             └─────────┬─────────┘
                       ▼
                 ┌───────────┐
                 │   core    │ (Infrastructure)
                 └───────────┘
```

Feature modules MUST NOT import or directly reference other feature modules. 
All cross-module interaction occurs using:
1. **Domain Events** published to the central shared Flow event bus.
2. **Shared Interface Contracts** defined in `core/` or `feature-meeting/shared/`.

---

# Alternatives Considered

## Alternative 1: Single Module App (`app/` only)
- **Reason rejected**: High build times, no boundary enforcement.

## Alternative 2: Kotlin Multiplatform (KMP)
- **Reason rejected**: Explicitly deferred. Introduces unnecessary compilation complexities for the Android-first MVP roadmap.

---

# Consequences

## Positive
- **Faster Builds**: Gradle compiles unmodified modules in parallel and uses local/remote build cache.
- **Strict Isolation**: Features cannot accidentally access each other's database schemas, network clients, or private views.
- **Independent Testing**: Test suites can run per-module, speeding up CI pipeline gates.

## Negative
- Gradle configuration overhead (each module requires its own `build.gradle.kts`).
- Navigation requires decoupled routing mappings (features expose destinations rather than navigating directly).

---

End of Document
