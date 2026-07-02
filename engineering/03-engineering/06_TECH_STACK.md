Document ID: TECH-001

Version: 2.0.0

Status: Approved (with supersession notes)

Owner: Engineering Team

Classification: Mandatory

> **[SUPERSEDED BY ADR-005]** — Sections §3–§5, §6, §7, §8, §9, §17, §18, §19, §20, §30 are superseded by the Next.js 16 SDK-First architecture. The sections below have been updated to reflect the new stack. See `engineering/00-governance/ADR/ADR-005-NEXTJS-SDK-FIRST.md`.

---

# 1. Purpose

This document defines the official technology stack of the AI Meeting Platform.

Only the technologies listed in this document may be used unless an Architecture Decision Record (ADR) explicitly approves an exception.

---

# 2. Technology Principles

Technology selection is based on the following priorities:

1. Long-term stability
2. Official support
3. Strong community adoption
4. TypeScript-first ecosystem
5. Web platform best practices
6. Performance
7. Security
8. Free or generous free-tier licensing
9. AI integration readiness

---

# 3. Platform

> **[UPDATED BY ADR-005]** — Platform is now SDK-first, multi-client.

**SDK Runtime**: TypeScript 5.x (strict mode) on Node.js 22.x LTS

**Reference Web Client**: Next.js 16 (App Router, React Server Components, Server Actions)

**Future Clients** (post-SDK):
- Desktop: Tauri 2 (Rust + WebView consuming SDK)
- Mobile (Android): React Native or native Kotlin consuming SDK
- Mobile (iOS): React Native or native Swift consuming SDK
- 3rd-party: Public npm package `@aimeetx/sdk`

**IDE**: VS Code (Latest Stable) or any TypeScript-capable IDE

**AI Development**: Google AI Studio

---

# 4. User Interface

> **[UPDATED BY ADR-005]** — UI framework is now React + Next.js.

**Framework**: React 19

**Meta-Framework**: Next.js 16 (App Router)

**Design System**: Custom design tokens in `@aimeetx/ui` (Material Design 3 inspired, but framework-agnostic)

**Navigation**: Next.js App Router (file-based routing) + typed route helpers

**State Management**: React Server Components + Server Actions + Signals (for client state)

**Image Loading**: `next/image` (built-in)

**Icons**: Lucide React (tree-shakeable, MIT licensed)

---

# 5. Architecture

> **[UPDATED BY ADR-005]** — Architecture is now SDK-first Clean Architecture.

**Pattern**: Clean Architecture (applied to TypeScript SDK)

**Presentation**: React components (consume SDK via hooks)

**Business Layer**: Use Cases (in SDK `domain/usecase/`)

**Data Access**: Repository Pattern (in SDK `data/repository/`)

**Communication**: Event-Driven (typed event bus in SDK `events/`)

**Dependency Injection**: tsyringe (Microsoft-maintained, decorator-based)

---

# 6. Concurrency

> **[UPDATED BY ADR-005]** — Concurrency is now RxJS + async/await.

**Async**: Native `async/await` + RxJS 7.x for event streams

**Reactive Streams**:
- RxJS `Observable` for event streams
- RxJS `BehaviorSubject` for state streams
- Native `Promise` for one-shot async operations

**Signals**: `@preact/signals-react` or React 19 `use()` hook for fine-grained reactivity

---

# 7. Local Storage

> **[UPDATED BY ADR-005]** — Local storage is now IndexedDB + Web Crypto.

**Structured Data**: IndexedDB (via `idb` library — typed wrapper)

**Secure Storage**: Web Crypto API + IndexedDB (encrypted at rest)

**Cache**: In-memory LRU cache + IndexedDB

**Files**: OPFS (Origin Private File System) for large files

---

# 8. Networking

> **[UPDATED BY ADR-005]** — Networking is now native fetch + WebSocket.

**HTTP Client**: Native `fetch` API with custom wrapper (interceptors, retry, timeout)

**Serialization**: Zod (runtime validation + TypeScript type inference)

**WebSocket**: Native `WebSocket` API with reconnection logic (exponential backoff)

**GraphQL** (future): `graphql-request` (lightweight client)

**Logging**: Custom fetch interceptor (debug only)

---

# 9. Backend

> **[UNCHANGED]** — Backend services remain as defined in `12_DEPLOYMENT_GUIDE.md`.

**Primary Option**: Firebase

**Supported Alternative**: Supabase

**Authentication**: Firebase Auth

**Database**: Cloud Firestore

**Storage**: Firebase Storage

**Push Notifications**: Firebase Cloud Messaging (FCM via Web Push API)

**Analytics**: Firebase Analytics

**Crash Reporting**: Sentry (web-compatible, better than Crashlytics for web)

**Remote Config**: Firebase Remote Config

---

# 10. Authentication

> **[UPDATED BY ADR-005]** — Auth methods are now web-compatible.

**Supported Methods**:
- Email / Password
- Google Sign-In (via `google-auth-library` or Firebase Auth)
- Anonymous Login (Guest Mode)
- WebAuthn / Passkeys (future)

**Future**:
- Apple
- Microsoft
- GitHub
- Magic Link

---

# 11. Real-Time Communication

> **[UNCHANGED]** — WebRTC is platform-agnostic.

**Primary Technology**: WebRTC

**Capabilities**:
- Audio Calls
- Video Calls
- Screen Sharing
- Camera Streaming
- Microphone Streaming
- Adaptive Bitrate
- Echo Cancellation
- Noise Suppression

**SDK Wrapper**: `livekit-client` (official LiveKit JS SDK)

---

# 12. Media Processing

> **[UPDATED BY ADR-005]** — Media processing is now Web APIs.

**Audio Codec**: Opus (via WebRTC)

**Video Codec**: VP8 / VP9 / H264 (Browser Dependent)

**Image Processing**: Canvas API + OffscreenCanvas

**Camera/Microphone**: `getUserMedia` API (MediaDevices)

**Audio Processing**: Web Audio API (echo cancellation, noise suppression built-in)

---

# 13. AI Platform

> **[UNCHANGED]** — AI provider is still Google Gemini.

**Provider**: Google Gemini API

**Models**:
- Gemini Live API
- Gemini Live Translation (`gemini-3.5-live-translate-preview`)
- Gemini Flash (General Tasks)

**Capabilities**:
- Live Translation
- Meeting Summaries
- AI Assistant
- Speech Understanding
- Content Generation
- Language Detection

**Future**:
- AI Agents
- Knowledge Base

**SDK Integration**: Only `@aimeetx/sdk/translation` and `@aimeetx/sdk/ai-assistant` modules may call Gemini APIs.

---

# 14. Live Translation

> **[UNCHANGED]** — Translation engine is still Gemini Live.

**Technology**: Gemini Live Translation

**Translation Mode**: Streaming

**Supported Streams**:
- Audio
- Text

**Target Languages**: Dynamic

**Translation Type**: Real-Time

**Per Participant**: Yes

**Personal Translation**: Yes

**Original Audio Preservation**: Yes

**Future**: Translated Voice Playback

---

# 15. Chat

> **[UPDATED BY ADR-005]** — Chat transport is now Firestore + WebSocket.

**Transport**: Firestore real-time listeners + WebSocket fallback

**Storage**: Firestore

**Attachments**: Firebase Storage

**Supported Types**:
- Text
- Image
- File

**Future**:
- Voice Message
- Video Message

---

# 16. Notifications

> **[UPDATED BY ADR-005]** — Notifications are now Web Push + in-app.

**Push Notifications**: Web Push API (via Firebase Cloud Messaging)

**In-App Notifications**: Custom toast/snackbar system in `@aimeetx/ui`

**Deep Links**: Supported via Next.js routing

---

# 17. Logging

> **[UPDATED BY ADR-005]** — Logging is now structured console + Sentry.

**Library**: Custom logger (structured JSON output) + `consola` (dev-friendly)

**Crash Reporting**: Sentry (`@sentry/nextjs`)

**Performance Monitoring**: Sentry Performance + Web Vitals

**Log Levels**: debug, info, warn, error

**Sensitive information SHALL NEVER be logged**:
- Passwords
- Tokens
- Emails
- Private Messages
- Audio Content
- Translated Text

---

# 18. Testing

> **[UPDATED BY ADR-005]** — Testing stack is now Vitest + Playwright.

**Unit Testing**: Vitest (fast, ESM-native, Jest-compatible API)

**Assertions**: Vitest built-in (`expect`) + Chai-style BDD

**Mocking**: Vitest built-in (`vi.mock`) + MSW (Mock Service Worker) for HTTP

**Component Testing**: React Testing Library + Vitest

**E2E Testing**: Playwright (cross-browser, reliable)

**Coverage**: Vitest coverage (c8 / v8)

**Property-Based Testing**: `fast-check` (for domain logic)

---

# 19. Build System

> **[UPDATED BY ADR-005]** — Build system is now pnpm + Turborepo.

**Package Manager**: pnpm 9.x (fastest, strictest, best workspace support)

**Build Orchestration**: Turborepo (incremental builds, remote caching, task pipelines)

**TypeScript**: TypeScript 5.x with `strict: true`

**Bundler (Web)**: Turbopack (Next.js 16 default) + esbuild (for SDK)

**Module Format**: ESM (`"type": "module"`) with dual CJS export for SDK

**Build Variants**: development, staging, production

---

# 20. Code Quality

> **[UPDATED BY ADR-005]** — Code quality tools are now ESLint + Prettier + TypeScript.

**Static Analysis**: TypeScript Compiler (`tsc --noEmit`) + ESLint

**Formatting**: Prettier (with `prettier-plugin-tailwindcss` for web)

**Linting**: ESLint 9.x (flat config) + `@typescript-eslint`

**Dependency Analysis**: `pnpm why` + `depcheck`

**Pre-commit Hooks**: Husky + lint-staged

---

# 21. Security

> **[UPDATED BY ADR-005]** — Security is now Web-standard.

**TLS**: HTTPS Only (HSTS enabled)

**Certificate Pinning**: Planned (via Service Worker)

**Encrypted Storage**: Mandatory (Web Crypto API)

**Secure Tokens**: Mandatory (HttpOnly cookies for web, secure storage for SDK)

**CSP**: Content Security Policy enforced

**Subresource Integrity**: SRI for all CDN assets

**Rate Limiting**: Backend-side (Cloudflare / API Gateway)

---

# 22. Localization

> **[UNCHANGED]** — Localization requirements are platform-agnostic.

**Default Languages**:
- Arabic
- English

**Expandable**: Yes

**RTL Support**: Mandatory

**LTR Support**: Mandatory

**Plural Resources**: Mandatory (via `ICU MessageFormat`)

**Library**: `next-intl` (for Next.js) + custom SDK i18n

---

# 23. Themes

> **[UPDATED BY ADR-005]** — Theming is now CSS variables + design tokens.

**System**: Custom design tokens in `@aimeetx/ui/tokens`

**Dynamic Colors**: Supported (via CSS `prefers-color-scheme`)

**Dark Theme**: Supported

**Light Theme**: Supported

**Future**: Custom Themes (user-defined)

---

# 24. Accessibility

> **[UNCHANGED]** — Accessibility requirements are platform-agnostic.

**Screen Readers**: Supported (ARIA labels, semantic HTML)

**Dynamic Font Size**: Supported

**High Contrast**: Supported

**Minimum Touch Target**: 44px (web standard, slightly smaller than Android's 48dp)

**Keyboard Navigation**: Mandatory (full keyboard accessibility)

---

# 25. CI/CD

> **[UPDATED BY ADR-005]** — CI/CD is now GitHub Actions + Vercel/GKE.

**CI**: GitHub Actions

**Build Automation**: Turborepo remote caching (Vercel)

**Testing**: Vitest (unit) + Playwright (E2E)

**Lint**: ESLint + Prettier + TypeScript

**Release**: Changesets (semantic versioning for SDK)

**Deployment**:
- Web: Vercel (Next.js 16 optimized) or self-hosted on GKE
- SDK: npm registry (public)
- Backend: GKE (unchanged)

---

# 26. Dependency Rules

> **[UPDATED BY ADR-005]** — Dependency rules apply to npm packages.

Every new dependency SHALL satisfy:

- Open Source or Free Tier
- Active Maintenance (last commit within 6 months)
- TypeScript Support (types included or `@types/*` available)
- Web Compatibility (or platform-specific with justification)
- Security Review (no known CVEs)
- Architecture Approval

Unused dependencies SHALL be removed.

---

# 27. Version Policy

> **[UNCHANGED]** — Version policy is platform-agnostic.

All dependencies SHALL use:

**Latest Stable Version**

Avoid:
- Alpha
- Beta
- RC

Unless approved through ADR.

---

# 28. Future Technologies

> **[UPDATED BY ADR-005]** — Future tech list updated.

These are explicitly deferred and MUST NOT be introduced in MVP:

- Wear OS
- AI Offline Models
- Self-hosted Backend (for MVP)
- Plugin Marketplace

**Now possible (post-MVP)**:
- Desktop Client (Tauri 2)
- iOS Client (React Native or native)
- Android Client (React Native or native)
- KMP (no longer needed — SDK is TypeScript)

---

# 29. Technology Governance

> **[UNCHANGED]** — Governance process is platform-agnostic.

Technology changes require:

- Technical Evaluation
- Security Review
- Performance Impact Analysis
- Architecture Approval
- Documentation Update

---

# 30. Approved Stack Summary

> **[UPDATED BY ADR-005]** — Approved stack is now Next.js 16 + TypeScript SDK.

**Language**: TypeScript 5.x (strict mode)

**UI**: React 19 + Next.js 16

**Architecture**: Clean Architecture (SDK) + Repository + Use Cases

**Dependency Injection**: tsyringe

**Networking**: Native fetch + WebSocket + Zod

**Database**: IndexedDB (client) + Firestore (backend)

**Secure Storage**: Web Crypto API

**Authentication**: Firebase Auth

**Storage**: Firebase Storage

**Realtime Communication**: WebRTC (via LiveKit)

**Messaging**: Firestore

**AI**: Gemini Live API (via SDK only)

**Translation**: Gemini Live Translation (via SDK only)

**Testing**: Vitest + React Testing Library + Playwright

**Logging**: consola + Sentry

**Crash Reporting**: Sentry

**Analytics**: Firebase Analytics + PostHog (product analytics)

**Build**: pnpm + Turborepo + Turbopack

**CI/CD**: GitHub Actions + Vercel + Changesets

---

End of Document