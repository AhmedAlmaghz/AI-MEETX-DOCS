# AI MeetX — Start Here

Document ID: START-001
Version: 2.0.0
Status: Active

---

# What Is This Repository?

This repository contains the **complete engineering specification** for building the AI MeetX platform —
a production-grade, AI-powered real-time meeting platform with live translation, virtual classrooms,
multi-tenant administration, and enterprise analytics.

**Platform capabilities:**
- Video & Audio Meetings (WebRTC via LiveKit SFU)
- Real-Time AI Translation (Gemini Live)
- In-Meeting Chat & File Sharing
- Screen Sharing & Whiteboard
- AI Meeting Assistant (summaries, action items, Q&A)
- Virtual Classrooms (quizzes, attendance, breakout rooms)
- Recording & Playback
- Multi-Tenant Administration
- Platform Analytics

---

# ⚠️ MANDATORY READING ORDER

Every AI agent and human engineer MUST read documents in this exact order
**before touching any code or making any architectural decision.**

## Step 1 — Governance

| File | Purpose |
|------|---------|
| `engineering/00-governance/PROJECT_CONSTITUTION.md` | Immutable engineering principles |
| `engineering/00-governance/ADR/ADR-001-GEMINI-LIVE-TRANSLATE.md` | AI translation architecture decision |
| `engineering/00-governance/ADR/ADR-002-MODULAR-MONOREPO.md` | Monorepo architecture decision |
| `engineering/00-governance/ADR/ADR-003-REDIS-FIRST-STORAGE.md` | Ephemeral storage decision |
| `engineering/00-governance/ADR/ADR-004-CLEAN-ARCHITECTURE-ISOLATION.md` | Layer isolation decision |

## Step 2 — Product

| File | Purpose |
|------|---------|
| `engineering/01_PROJECT_VISION.md` | What we are building and why |
| `engineering/01-product/02_PRODUCT_REQUIREMENTS.md` | Full product requirements |

## Step 3 — Architecture

| File | Purpose |
|------|---------|
| `engineering/02-architecture/04_ARCHITECTURE_RULES.md` | Architecture rules and forbidden patterns |

## Step 4 — Engineering Guides

| File | Purpose |
|------|---------|
| `engineering/03-engineering/03_EXECUTION_MASTER_PLAN.md` | How to build — phase by phase |
| `engineering/03-engineering/05_CODING_STANDARDS.md` | Kotlin coding conventions |
| `engineering/03-engineering/06_TECH_STACK.md` | Technology choices and versions |
| `engineering/03-engineering/07_REPOSITORY_STRUCTURE.md` | Monorepo folder layout |
| `engineering/03-engineering/08_DATABASE_OVERVIEW.md` | Database schemas and collections |
| `engineering/03-engineering/09_EVENT_SYSTEM.md` | Event bus and domain events |
| `engineering/03-engineering/10_AI_GUIDELINES.md` | AI module rules and Gemini constraints |
| `engineering/03-engineering/11_TESTING_GUIDE.md` | Testing strategy and mock policies |
| `engineering/03-engineering/12_DEPLOYMENT_GUIDE.md` | GKE, Helm, CI/CD deployment |

## Step 5 — Execution Plan

| File | Purpose |
|------|---------|
| `engineering/ROADMAP.yaml` | Phase map with dependencies |
| `engineering/INDEX.yaml` | Full document index |
| `engineering/CONTEXT.yaml` | AI agent bootstrap contract |

## Step 6 — Load Current Phase

Read the **current active phase** from `engineering/ROADMAP.yaml`.
Then load only that phase's YAML from `engineering/phases/`.
Read only the feature documentation listed in that phase's `produces` key.

---

# 🏛 Architecture at a Glance

```
:app                         ← Shell (MainActivity, NavHost)
:core                        ← Base interfaces, DI setup
:core:events                 ← EventBus (domain event backbone)
:core:network                ← Retrofit + OkHttp factories
:core:storage                ← Room + EncryptedSharedPreferences
:core:ui                     ← Design system tokens + Compose theme

:feature-auth                ← Authentication & session management
:feature-profile             ← User profile & preferences
:feature-meeting             ← Meeting lifecycle (9 subdomains)
:feature-media               ← Audio/video/screen (8 subdomains)
:feature-chat                ← In-meeting chat & file sharing
:feature-translation         ← Gemini Live real-time translation
:feature-ai                  ← AI assistant (summary, Q&A, actions)
:feature-recording           ← Meeting recording & playback
:feature-notification        ← Push & in-app notifications
:feature-classroom           ← Quiz, attendance, breakout rooms
:feature-admin               ← Multi-tenant administration
:feature-analytics           ← Usage analytics & reporting
```

---

# 🔒 Non-Negotiable Rules

1. **No direct imports between feature modules** — all communication via domain events
2. **Only feature-translation and feature-ai may call Gemini APIs**
3. **Raw audio/video data is NEVER persisted** — only processed metadata
4. **Raw transcripts are NEVER persisted** — only summaries, action items, reports
5. **Build one phase at a time** — never skip or merge phases
6. **Every phase must pass exit gates** before the next begins
7. **Audit logs are immutable** — PostgreSQL RLS policy blocks UPDATE and DELETE

---

# 📦 Feature Documentation Structure

Each feature module has a full documentation set:

```
features/feature-{name}/
├── REQUIREMENTS.md     ← Functional & non-functional requirements
├── SPECIFICATION.md    ← Domain model, entities, value objects, use cases
├── DATABASE.md         ← Schema, collections, indexes, retention
├── API.md              ← Internal API contracts (use case interfaces)
├── EVENTS.md           ← Domain events produced and consumed
├── TESTS.md            ← Test specifications and acceptance criteria
└── README.md           ← Module overview and integration guide
```

Sub-layered modules (feature-meeting, feature-media) follow the same pattern
within each subdomain folder.

---

# 🚀 Execution Model

```
PHASE_00 (Foundation)
    └─▶ PHASE_01 (Auth)
            └─▶ PHASE_02 (Profile)
                    └─▶ PHASE_03 (Meeting)
                            ├─▶ PHASE_04 (Media)
                            ├─▶ PHASE_05 (Chat)
                            ├─▶ PHASE_06 (AI)
                            └─▶ PHASE_07 (Education)
                    └─▶ PHASE_08 (Admin)
                            └─▶ PHASE_09 (Analytics)
    ──────────────────────▶ PHASE_10 (Security & Quality)
                                    └─▶ PHASE_11 (Production Release)
```

---

END OF FILE