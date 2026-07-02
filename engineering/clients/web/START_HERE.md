# AI MeetX Web Client — Start Here

Document ID: WEB-START-001
Version: 1.0.0
Status: Active

---

# What is the Web Client?

The AI MeetX Web Client is a pure presentation/UI application built with **React, Next.js 15, and Tailwind CSS**. 

It **does not implement business logic, database queries, or network protocols directly**. Instead, it acts as a user interface shell consuming the core platform services through a **generated TypeScript SDK (meetx-platform-sdk)**.

---

# ⚠️ Mandatory Reading Order

All engineers and AI agents working on the Web Client MUST read these documents in order before making changes:

1. **Core Platform Spec**: First read `../../START_HERE.md` to understand the event catalog, platform rules, and domain models.
2. **Web Start Guide**: Read this file (`START_HERE.md`).
3. **Web Governance & ADRs**:
   - `00-governance/PROJECT_CONSTITUTION.md`
   - `00-governance/ADR/ADR-W001-NEXTJS-RSC.md`
   - `00-governance/ADR/ADR-W002-LIVEKIT-JS.md`
   - `00-governance/ADR/ADR-W003-ZUSTAND-UI-STATE.md`
   - `00-governance/ADR/ADR-W004-TS-SDK-CONSUMPTION.md`
4. **Web Technical Stack**: `03-engineering/06_WEB_TECH_STACK.md`
5. **Web Architecture & Directory Layout**: `02-architecture/04_WEB_ARCHITECTURE_RULES.md` and `03-engineering/07_WEB_REPOSITORY_STRUCTURE.md`
6. **Execution Phase**: Identify the current phase in `ROADMAP.yaml` and read the corresponding phase file in `phases/`.

---

# 🏛 Integration Patterns

```
┌────────────────────────────────────────────────────────┐
│                      Web Client UI                     │
│    (Next.js App Router Pages, shadcn/ui Components)    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (React Hooks)
┌────────────────────────────────────────────────────────┐
│                 meetx-platform-sdk                     │
│    (Generated client-side TypeScript bindings & hooks) │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼ (HTTP)          ▼ (WebSockets)     ▼ (WebRTC)
┌────────────────┐ ┌────────────────┐ ┌──────────────┐
│  Platform API  │ │  Event Server  │ │ LiveKit SFU  │
└────────────────┘ └────────────────┘ └──────────────┘
```

## 1. API Consumption
No fetch or axios instances are configured in feature modules. All remote communication MUST use hooks exposed by `meetx-platform-sdk`.
Example:
```typescript
import { useLoginMutation, useUserProfile } from 'meetx-platform-sdk/hooks';
```

## 2. Event Consumption
Client-side reactions to platform events (e.g. `ParticipantJoinedEvent`) are handled through custom event hooks that connect to the Event Server WebSocket.
Example:
```typescript
import { usePlatformEvent } from 'meetx-platform-sdk/events';
```

## 3. Real-Time Media
Raw WebRTC configurations and LiveKit room connections are managed inside `meetx-platform-sdk`. The Web Client UI consumes components and hooks from `@livekit/components-react` initialized by the SDK's context provider.

---

# 🔒 Client-Side Guardrails

1. **No Shared State Across Modules**: Zustand stores must be module-scoped. Never share a global store between `feature-auth` and `feature-chat`.
2. **Strict Accessibility**: All UI elements must use Radix UI primitives / shadcn/ui to comply with WCAG 2.1 AA.
3. **No Direct Storage Access**: Never write to localStorage or IndexedDB outside the SDK's data sync layers.
4. **Zod Validation**: All user inputs in forms must be validated using client-side Zod schemas before calling SDK mutations.

---

END OF FILE
