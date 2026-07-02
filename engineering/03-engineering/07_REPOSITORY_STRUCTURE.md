# Repository Structure

Document ID: REP-001

Version: 2.0.0

Status: Approved (superseded by ADR-005)

Owner: Engineering Team

Classification: Mandatory

> **[SUPERSEDED BY ADR-005]** — The original Android Gradle monorepo layout has been superseded by the Next.js 16 + TypeScript SDK-First monorepo layout. See `engineering/00-governance/ADR/ADR-005-NEXTJS-SDK-FIRST.md` for the current authoritative structure.

---

# 1. Purpose

This document defines the official repository structure for the AI MeetX Platform.

Every source file SHALL be located according to this structure.

No developer or AI Agent may create new top-level packages without an approved ADR.

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

The project follows a **SDK-First Monorepo** layout using **pnpm workspaces** and **Turborepo**.

```
AI MEETX (Root)
│
├── apps/
│   └── web/                          # Next.js 16 reference web client
│       ├── app/                      # App Router (RSC, layouts, pages)
│       │   ├── (auth)/               # Auth route group
│       │   ├── (meeting)/            # Meeting route group
│       │   ├── layout.tsx            # Root layout
│       │   └── page.tsx              # Home page
│       ├── components/               # React components (presentation only)
│       ├── lib/                      # Next.js-specific utilities
│       ├── public/                   # Static assets
│       ├── next.config.ts            # Next.js 16 configuration
│       ├── tailwind.config.ts        # Tailwind CSS configuration
│       └── package.json
│
├── packages/
│   ├── sdk/                          # @aimeetx/sdk — single source of truth
│   │   ├── src/
│   │   │   ├── domain/               # Pure TypeScript business logic
│   │   │   │   ├── model/            # Domain entities & value objects
│   │   │   │   ├── usecase/          # Single-responsibility use cases
│   │   │   │   └── port/             # Repository contracts (interfaces)
│   │   │   ├── data/                 # Infrastructure implementations
│   │   │   │   ├── repository/       # Repository implementations
│   │   │   │   ├── datasource/       # HTTP / WebSocket / IndexedDB adapters
│   │   │   │   └── mapper/           # DTO ↔ Entity mappers
│   │   │   ├── presentation/         # Framework-agnostic state (signals/stores)
│   │   │   ├── events/               # Typed event bus (re-exports from @aimeetx/events)
│   │   │   ├── translation/          # Gemini Live Translate (only module calling Gemini for translation)
│   │   │   ├── ai-assistant/         # Gemini AI Assistant (only module calling Gemini for AI)
│   │   │   ├── di/                   # tsyringe container configuration
│   │   │   └── index.ts              # Public API surface
│   │   ├── tests/                    # Unit & integration tests
│   │   └── package.json
│   │
│   ├── ui/                           # @aimeetx/ui — shared design system
│   │   ├── src/
│   │   │   ├── tokens/               # Design tokens (colors, spacing, typography)
│   │   │   ├── components/           # React components (Button, Input, Modal, etc.)
│   │   │   ├── theme/                # Theme provider, dark/light mode
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── network/                      # @aimeetx/network — HTTP + WebSocket
│   │   ├── src/
│   │   │   ├── http/                 # Fetch wrapper with interceptors
│   │   │   ├── websocket/            # Reconnecting WebSocket client
│   │   │   ├── livekit/              # LiveKit client wrapper
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── storage/                      # @aimeetx/storage — persistence adapters
│   │   ├── src/
│   │   │   ├── indexeddb/            # IndexedDB adapter (web)
│   │   │   ├── secure/               # Encrypted storage adapter (Web Crypto)
│   │   │   ├── memory/               # In-memory cache
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── events/                       # @aimeetx/events — typed event bus
│   │   ├── src/
│   │   │   ├── bus.ts                # RxJS-based typed event bus
│   │   │   ├── events/               # All domain event definitions
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── config/                       # @aimeetx/config — shared configs
│   │   ├── tsconfig/                 # Shared TypeScript configs
│   │   ├── eslint/                   # Shared ESLint configs
│   │   └── prettier/                 # Shared Prettier configs
│   │
│   └── types/                        # @aimeetx/types — shared TypeScript types
│       ├── src/
│       │   ├── domain/               # Cross-package domain types
│       │   └── index.ts
│       └── package.json
│
├── engineering/                      # Project specifications & master plans (Documentation)
│   ├── 00-governance/                # Constitutions, ADRs
│   ├── 01-product/                   # Product requirements (PRS)
│   ├── 02-architecture/              # Global architecture rules
│   ├── 03-engineering/               # Coding standards, databases, event system, guides
│   ├── features/                     # Feature-level technical documentation
│   ├── clients/                      # Client-specific documentation
│   ├── phases/                       # Phase YAML files
│   ├── ROADMAP.yaml                  # Phase map with dependencies
│   ├── INDEX.yaml                    # Full document index
│   └── CONTEXT.yaml                  # AI agent bootstrap contract
│
├── .github/
│   └── workflows/                    # GitHub Actions CI/CD
│       ├── ci.yml                    # Build, lint, test on every PR
│       └── release.yml               # Publish SDK + deploy web on tag
│
├── .changeset/                       # Changesets for SDK versioning
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # pnpm workspace declaration
├── package.json                      # Root package.json
├── tsconfig.json                     # Root TypeScript config
├── .eslintrc.cjs                     # Root ESLint config
├── .prettierrc                       # Root Prettier config
├── .gitignore
├── .nvmrc                            # Node.js version (22.x LTS)
└── README.md
```

---

# 4. SDK Internal Layout (Clean Architecture)

The SDK (`packages/sdk/`) strictly enforces Clean Architecture layers:

```
packages/sdk/src/
├── domain/                          # Pure TypeScript (no React, no Node, no platform APIs)
│   ├── model/                       # Domain entities & value objects
│   │   ├── User.ts
│   │   ├── Meeting.ts
│   │   ├── Participant.ts
│   │   └── ...
│   ├── usecase/                     # Single-responsibility use cases
│   │   ├── JoinMeetingUseCase.ts
│   │   ├── LeaveMeetingUseCase.ts
│   │   ├── TranslateAudioUseCase.ts
│   │   └── ...
│   └── port/                        # Repository contracts (interfaces)
│       ├── MeetingRepository.ts
│       ├── AuthRepository.ts
│       └── ...
│
├── data/                            # Infrastructure implementations
│   ├── repository/                  # Repository implementations
│   │   ├── MeetingRepositoryImpl.ts
│   │   └── ...
│   ├── datasource/                  # HTTP / WebSocket / IndexedDB adapters
│   │   ├── HttpMeetingDataSource.ts
│   │   ├── WebSocketMeetingDataSource.ts
│   │   └── ...
│   ├── dto/                         # Data Transfer Objects (network/DB shape)
│   │   ├── MeetingDto.ts
│   │   └── ...
│   └── mapper/                      # DTO ↔ Entity mappers
│       ├── MeetingMapper.ts
│       └── ...
│
├── presentation/                    # Framework-agnostic state
│   ├── store/                       # State stores (signals, BehaviorSubject)
│   └── hook/                        # React hooks (consume stores)
│
├── events/                          # Re-exports from @aimeetx/events
│
├── translation/                     # Gemini Live Translate (ONLY module calling Gemini for translation)
│   ├── GeminiTranslationClient.ts
│   ├── TranslationGateway.ts
│   └── ...
│
├── ai-assistant/                    # Gemini AI Assistant (ONLY module calling Gemini for AI)
│   ├── GeminiAssistantClient.ts
│   ├── SummaryGenerator.ts
│   └── ...
│
├── di/                              # tsyringe container configuration
│   ├── container.ts                 # DI container setup
│   └── tokens.ts                    # DI tokens (symbols)
│
└── index.ts                         # Public API surface
```

---

# 5. Dependency Rules

### 5.1 Horizontal Separation (Apps vs Packages)

- **Apps** (`apps/*`) MAY depend on **packages** (`packages/*`).
- **Packages** (`packages/*`) MUST NOT depend on **apps** (`apps/*`).
- **Apps** MUST NOT depend on other **apps** directly.

### 5.2 Package Dependency Graph

```
apps/web
  ↓
packages/ui, packages/sdk
  ↓
packages/network, packages/storage, packages/events, packages/types
  ↓
packages/config (devDependency only)
```

**Rules:**
- `packages/sdk` MAY depend on `packages/network`, `packages/storage`, `packages/events`, `packages/types`.
- `packages/sdk` MUST NOT depend on `packages/ui` (UI is presentation-only).
- `packages/ui` MUST NOT depend on `packages/sdk` (UI is a dumb component library).
- `packages/network`, `packages/storage`, `packages/events`, `packages/types` MUST NOT depend on `packages/sdk` (they are infrastructure primitives).

### 5.3 Vertical Clean Architecture (within SDK)

- `presentation/` MAY depend on `domain/`, `data/`, `events/`.
- `data/` MAY depend on `domain/`, `events/`.
- `domain/` MUST NOT depend on `data/`, `presentation/`, React, Next.js, Node.js APIs, or any platform SDK.
- `domain/` is pure TypeScript.

### 5.4 AI Isolation

- Only `packages/sdk/src/translation/` and `packages/sdk/src/ai-assistant/` MAY import from `@google/generative-ai` or call Gemini APIs.
- All other modules MUST consume AI through SDK interfaces/events.

---

# 6. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React Component | PascalCase | `MeetingCard.tsx` |
| Hook | camelCase with `use` prefix | `useMeeting.ts` |
| Use Case | PascalCase with `UseCase` suffix | `JoinMeetingUseCase.ts` |
| Repository Interface | PascalCase with `Repository` suffix | `MeetingRepository.ts` |
| Repository Implementation | PascalCase with `RepositoryImpl` suffix | `MeetingRepositoryImpl.ts` |
| DTO | PascalCase with `Dto` suffix | `MeetingDto.ts` |
| Entity | PascalCase | `Meeting.ts` |
| Mapper | PascalCase with `Mapper` suffix | `MeetingMapper.ts` |
| Event | PascalCase with `Event` suffix | `MeetingCreatedEvent.ts` |
| Test | Same as source + `.test.ts` | `JoinMeetingUseCase.test.ts` |

---

# 7. Package Naming

All npm package names SHALL use the `@aimeetx/*` scope.

Examples:
- `@aimeetx/sdk`
- `@aimeetx/ui`
- `@aimeetx/network`
- `@aimeetx/storage`
- `@aimeetx/events`
- `@aimeetx/types`
- `@aimeetx/config`

---

End of Document