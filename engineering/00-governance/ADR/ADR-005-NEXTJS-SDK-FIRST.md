# ADR-005: Next.js 16 SDK-First Platform Architecture

Document ID: ADR-005

Version: 1.0.0

Status: Accepted

Date: 2026-02-07

Deciders: Engineering Lead, Product Owner, Architecture Team

Affected Features: All — supersedes platform-level decisions in ADR-002 and `01_PROJECT_VISION.md` §12

Classification: Architecture Freeze — No changes without superseding ADR

Supersedes: ADR-002 (partially — monorepo structure), `01_PROJECT_VISION.md` §12 (Technical Vision), `06_TECH_STACK.md` §3–§5 (Platform/UI/Architecture), `07_REPOSITORY_STRUCTURE.md` (Android Gradle layout)

---

# Context

The original architecture (ADR-002) defined the AI MeetX platform as an **Android-native monorepo** built with Kotlin, Jetpack Compose, and Gradle modules. This decision was made when the product scope was limited to a single Android client.

The product vision has since expanded to include:

- **Web client** (browser-based meeting experience)
- **Desktop client** (Windows / macOS / Linux)
- **Mobile client** (Android and iOS)
- **Third-party integrations** via a public SDK

Building three or four separate native codebases — each with its own domain logic, event system, network layer, and storage layer — would result in:

- Duplicated business logic across platforms (violates Constitution §9: "No duplicated business logic")
- Divergent behavior between clients (violates Vision §17: "platform can evolve for years without architectural redesign")
- Slow delivery of new platforms (each new client requires a full re-implementation)
- Inconsistent AI integration (each client would need its own Gemini wiring)

The team needs a **single source of truth** for all business logic, networking, events, storage, and AI integration that can be consumed by any client platform.

---

# Problem

How do we architect the codebase so that:

1. Business logic, event system, network layer, storage, and AI integration are written **once** and consumed by **all** clients (web, desktop, mobile, third-party)?
2. The platform can ship a new client (e.g., iOS, watchOS, CLI) without re-implementing domain logic?
3. The architecture remains compliant with the existing governance (Clean Architecture, Event-Driven, Module Isolation, AI-as-Platform-Capability)?

---

# Decision

We adopt a **Next.js 16 + TypeScript SDK-First Monorepo** architecture.

The platform is structured as follows:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ apps/web │  │ apps/    │  │ apps/    │  │ 3rd-party│    │
│  │ (Next 16)│  │ desktop  │  │ mobile   │  │   SDK    │    │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
│        │             │             │             │          │
│        └─────────────┴─────────────┴─────────────┘          │
│                          │                                   │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │     @aimeetx/sdk      │  ← Single source of   │
│              │  (TypeScript SDK)     │    truth for domain   │
│              └───────────────────────┘    logic, events,     │
│                          │                network, storage,  │
│                          ▼                AI integration     │
│              ┌───────────────────────┐                       │
│              │   Backend Services    │  (LiveKit, Gemini,    │
│              │   (GKE / Cloud Run)   │   Firebase, Postgres) │
│              └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. SDK is the Single Source of Truth

All business logic, use cases, domain entities, event definitions, network contracts, storage interfaces, and AI integration live in **`packages/sdk`**. Clients are thin presentation layers that consume the SDK.

### 2. Next.js 16 as the Reference Web Client

`apps/web` is built with **Next.js 16** (App Router, React Server Components, Server Actions) and serves as:
- The primary web product
- The reference implementation proving the SDK works end-to-end
- The test bed for new SDK features before they ship to mobile/desktop

### 3. Monorepo Tooling

- **Package manager:** `pnpm` (fastest, strictest, best workspace support)
- **Build orchestration:** `Turborepo` (incremental builds, remote caching, task pipelines)
- **TypeScript:** `5.x` (latest stable) with `strict: true` across all packages
- **Node.js:** `22.x LTS`

### 4. Clean Architecture Preserved

The SDK follows the same Clean Architecture rules as ADR-004:

```
packages/sdk/src/
├── domain/          ← Pure TypeScript (no React, no Node, no platform APIs)
│   ├── model/       ← Domain entities & value objects
│   ├── usecase/     ← Single-responsibility use cases
│   └── port/        ← Repository contracts (interfaces)
├── data/            ← Infrastructure implementations
│   ├── repository/  ← Repository implementations
│   ├── datasource/  ← HTTP / WebSocket / IndexedDB adapters
│   └── mapper/      ← DTO ↔ Entity mappers
└── presentation/    ← Framework-agnostic state (signals/stores)
```

**Hard rule:** `domain/` MUST NOT import from `data/`, `presentation/`, React, Next.js, Node.js APIs, or any platform SDK. It is pure TypeScript.

### 5. Event System Preserved

The SDK exposes a typed event bus (RxJS-based) that is the **only** mechanism for cross-module communication within the SDK. This preserves ADR-002's "no direct feature-to-feature dependency" rule at the SDK level.

### 6. AI Integration Preserved

Only the SDK's `translation` and `ai-assistant` modules may call Gemini APIs. Clients consume AI through SDK interfaces/events. This preserves ADR-001's AI isolation rule.

### 7. Dependency Injection

The SDK uses **`tsyringe`** (lightweight, decorator-based, Microsoft-maintained) as the DI container. This is the TypeScript equivalent of Hilt and preserves the "Domain depends on nothing except core language libraries" rule.

### 8. Future Client Strategy

| Client | Framework | Status |
|--------|-----------|--------|
| Web | Next.js 16 | Phase 00 (this ADR) |
| Desktop | Tauri 2 (Rust + WebView consuming SDK) | Post-SDK |
| Mobile (Android) | React Native or native Kotlin consuming SDK as npm package | Post-SDK |
| Mobile (iOS) | React Native or native Swift consuming SDK as npm package | Post-SDK |
| 3rd-party SDK | Public npm package `@aimeetx/sdk` | Post-SDK |

---

# New Repository Layout

```
AI MEETX (Root)
│
├── apps/
│   └── web/                          # Next.js 16 reference client
│       ├── app/                      # App Router (RSC, layouts, pages)
│       ├── components/               # React components (presentation only)
│       └── package.json
│
├── packages/
│   ├── sdk/                          # @aimeetx/sdk — single source of truth
│   │   ├── src/
│   │   │   ├── domain/               # Pure TypeScript business logic
│   │   │   ├── data/                 # Infrastructure adapters
│   │   │   ├── presentation/         # Framework-agnostic state
│   │   │   ├── events/               # Typed event bus
│   │   │   ├── translation/          # Gemini Live Translate (only module calling Gemini for translation)
│   │   │   ├── ai-assistant/         # Gemini AI Assistant (only module calling Gemini for AI)
│   │   │   └── index.ts              # Public API surface
│   │   └── package.json
│   │
│   ├── ui/                           # @aimeetx/ui — shared design system
│   │   ├── src/
│   │   │   ├── tokens/               # Design tokens (colors, spacing, typography)
│   │   │   ├── components/           # Headless + styled React components
│   │   │   └── theme/                # Theme provider, dark/light mode
│   │   └── package.json
│   │
│   ├── network/                      # @aimeetx/network — HTTP + WebSocket
│   │   ├── src/
│   │   │   ├── http/                 # Fetch wrapper with interceptors
│   │   │   ├── websocket/            # Reconnecting WebSocket client
│   │   │   └── livekit/              # LiveKit client wrapper
│   │   └── package.json
│   │
│   ├── storage/                      # @aimeetx/storage — persistence adapters
│   │   ├── src/
│   │   │   ├── indexeddb/            # IndexedDB adapter (web)
│   │   │   ├── secure/               # Encrypted storage adapter
│   │   │   └── memory/               # In-memory cache
│   │   └── package.json
│   │
│   ├── events/                       # @aimeetx/events — typed event bus
│   │   ├── src/
│   │   │   ├── bus.ts                # RxJS-based typed event bus
│   │   │   └── events/               # All domain event definitions
│   │   └── package.json
│   │
│   └── config/                       # Shared configs (tsconfig, eslint, prettier)
│       ├── tsconfig/
│       ├── eslint/
│       └── prettier/
│
├── engineering/                      # Documentation (unchanged)
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # pnpm workspace declaration
├── package.json                      # Root package.json
└── tsconfig.json                     # Root TypeScript config
```

---

# Alternatives Considered

## Alternative 1: Keep Android-Native Monorepo, Add Web Later

**Reason rejected:** Would require duplicating all domain logic in TypeScript when the web client is built. Violates Constitution §9 ("No duplicated business logic") and creates a permanent maintenance burden.

## Alternative 2: Build SDK in Kotlin Multiplatform (KMP)

**Reason rejected:** KMP was explicitly deferred in ADR-002 §Alternatives. KMP's web target (Kotlin/JS) is not production-ready for complex apps. KMP's iOS target requires touching Swift interop. TypeScript is the lingua franca of the web and has the richest ecosystem for SDK consumers.

## Alternative 3: Use a BaaS (Firebase + Client SDKs) Without a Custom SDK

**Reason rejected:** Firebase client SDKs are platform-specific (iOS, Android, Web). They do not provide a unified business-logic layer. We still need our own SDK for use cases, validation, event orchestration, and AI integration.

## Alternative 4: Use tRPC Instead of a Custom SDK

**Reason rejected:** tRPC is excellent for type-safe RPC but is server-coupled. Our SDK must work offline, in third-party apps, and in environments where the backend is not reachable. A standalone SDK with its own state management is required.

---

# Consequences

## Positive

- **Single source of truth:** Business logic written once, consumed by all clients.
- **Faster client delivery:** New clients (desktop, mobile, 3rd-party) consume the SDK and only build presentation.
- **Type safety end-to-end:** TypeScript types flow from SDK → web → mobile (via codegen) → 3rd-party.
- **AI isolation preserved:** Only SDK's `translation` and `ai-assistant` modules call Gemini.
- **Clean Architecture preserved:** SDK's `domain/` is pure TypeScript, no React/Next/Node.
- **Event-driven preserved:** Typed event bus is the only cross-module communication mechanism.
- **Testability:** SDK domain logic is testable in pure Node.js with no browser/React dependencies.
- **Future-proof:** New platforms (CLI, watchOS, embedded) can consume the SDK with minimal effort.

## Negative

- **Bundle size on web:** SDK must be tree-shakeable; clients only pay for what they import.
- **TypeScript ecosystem churn:** TypeScript and React ecosystems evolve fast; we must pin versions and update deliberately.
- **SDK API stability:** Once published as `@aimeetx/sdk`, breaking changes require semver-major bumps and migration guides.
- **Learning curve:** Team must be proficient in TypeScript, RxJS, and modern React patterns.

## Neutral

- **Backend services unchanged:** LiveKit, Gemini, Firebase, PostgreSQL, Redis remain as defined in ADR-001, ADR-003, and `12_DEPLOYMENT_GUIDE.md`.
- **Documentation structure unchanged:** `engineering/` directory and all governance documents remain valid (with the supersession notes above).

---

# Supersession Notes

This ADR **supersedes** the following sections of existing documents. The superseded sections MUST be marked as `[SUPERSEDED BY ADR-005]` in their respective files.

| Document | Superseded Section |
|----------|-------------------|
| `01_PROJECT_VISION.md` | §12 Technical Vision (Platform, Language, UI, Async, DI, Real-Time Media, Local Storage, Ephemeral Cache, CI/CD) |
| `06_TECH_STACK.md` | §3 Platform, §4 User Interface, §5 Architecture, §6 Concurrency, §7 Local Storage, §8 Networking, §9 Backend, §17 Logging, §18 Testing, §19 Build System, §20 Code Quality, §30 Approved Stack Summary |
| `07_REPOSITORY_STRUCTURE.md` | Entire document (Android Gradle layout replaced by pnpm + Turborepo layout) |
| `ADR-002` | Entire document (Android monorepo replaced by SDK-first monorepo) |

This ADR **does NOT supersede**:
- `ADR-001` (Gemini Live Translate) — still valid, now consumed via SDK
- `ADR-003` (Redis-First Storage) — still valid, backend-side decision
- `ADR-004` (Clean Architecture Layer Isolation) — still valid, now applied to TypeScript SDK
- `PROJECT_CONSTITUTION.md` — all 8 core principles remain binding
- `04_ARCHITECTURE_RULES.md` — all 30 sections remain binding (reinterpreted for TypeScript)
- `09_EVENT_SYSTEM.md` — all event definitions remain valid, now implemented in TypeScript
- `08_DATABASE_OVERVIEW.md` — entity definitions remain valid, now implemented in TypeScript

---

# Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| TypeScript ecosystem churn | Medium | Medium | Pin versions in `pnpm-workspace.yaml`; quarterly upgrade reviews |
| SDK bundle size on web | Medium | Medium | Tree-shaking, code-splitting, lazy-load heavy modules (LiveKit, Gemini) |
| Breaking SDK changes affect 3rd-party | Low | High | Strict semver discipline; deprecation warnings before removal |
| Team TypeScript proficiency gap | Medium | Medium | Training plan; pair programming; code review focus on TS idioms |
| Next.js 16 breaking changes | Low | Medium | Pin Next.js version; follow official upgrade guides |

---

# Implementation Reference

This ADR is implemented in **PHASE_00 — Foundation & SDK Monorepo Setup** (rewritten from the original Android-focused PHASE_00).

See:
- `engineering/phases/phase-0.yaml` (rewritten) — Foundation & SDK Monorepo Setup
- `engineering/03-engineering/06_TECH_STACK.md` (updated) — Next.js 16 + TypeScript stack
- `engineering/03-engineering/07_REPOSITORY_STRUCTURE.md` (rewritten) — pnpm + Turborepo layout

---

# ADR Lifecycle

This ADR is **Accepted** and enforced as part of Architecture Freeze v2.0.

Any changes to this decision require:
1. A new ADR that supersedes this one.
2. Review and approval by Engineering Lead, Product Owner, and Architecture Team.
3. Update to all dependent documents and the SDK public API.

---

End of Document