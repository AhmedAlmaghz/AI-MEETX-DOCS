# AI MeetX

> AI-powered real-time collaboration platform — Next.js 16 + TypeScript SDK-First monorepo.

## Architecture

This repository implements the **Next.js 16 SDK-First** architecture defined in [`engineering/00-governance/ADR/ADR-005-NEXTJS-SDK-FIRST.md`](engineering/00-governance/ADR/ADR-005-NEXTJS-SDK-FIRST.md).

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ apps/web │  │ apps/    │  │ apps/    │  │ 3rd-party│    │
│  │ (Next 16)│  │ desktop  │  │ mobile   │  │   SDK    │    │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
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

## Repository Structure

```
AI MEETX (Root)
├── apps/
│   └── web/                          # Next.js 16 reference client
├── packages/
│   ├── sdk/                          # @aimeetx/sdk — single source of truth
│   ├── ui/                           # @aimeetx/ui — shared design system
│   ├── network/                      # @aimeetx/network — HTTP + WebSocket
│   ├── storage/                      # @aimeetx/storage — persistence adapters
│   ├── events/                       # @aimeetx/events — typed event bus
│   ├── types/                        # @aimeetx/types — shared TypeScript types
│   └── config/                       # @aimeetx/config — shared configs
├── engineering/                      # Documentation (ADRs, specs, phases)
├── .github/workflows/                # CI/CD
├── .changeset/                       # SDK versioning
├── turbo.json                        # Turborepo pipeline
├── pnpm-workspace.yaml               # pnpm workspace
└── package.json                      # Root package.json
```

## Quick Start

### Prerequisites

- **Node.js** 22.x LTS (see `.nvmrc`)
- **pnpm** 9.x (`npm install -g pnpm@9.15.0`)

### Install

```bash
pnpm install
```

### Develop

```bash
# Run all packages in dev mode
pnpm dev

# Run only the web app
pnpm --filter @aimeetx/web dev
```

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test              # Run all tests
pnpm test:coverage     # Run with coverage
```

### Lint & Typecheck

```bash
pnpm lint
pnpm typecheck
```

## Documentation

All engineering documentation lives in [`engineering/`](engineering/):

- **Governance:** [`engineering/00-governance/`](engineering/00-governance/) — Constitution + ADRs
- **Product:** [`engineering/01-product/`](engineering/01-product/) — Vision + Requirements
- **Architecture:** [`engineering/02-architecture/`](engineering/02-architecture/) — Architecture Rules
- **Engineering Guides:** [`engineering/03-engineering/`](engineering/03-engineering/) — Coding Standards, Tech Stack, etc.
- **Phases:** [`engineering/phases/`](engineering/phases/) — Phase-by-phase execution plan
- **Roadmap:** [`engineering/ROADMAP.yaml`](engineering/ROADMAP.yaml) — 12-phase execution map

## Current Phase

**PHASE_00 — Foundation & SDK Monorepo Setup** (per [`engineering/phases/phase-0.yaml`](engineering/phases/phase-0.yaml))

## License

Proprietary — All rights reserved.