# Web Client Architecture Rules

Document ID: WEB-ARC-001
Version: 1.0.0
Status: Approved

---

# 1. Presentation Architecture

The application uses Next.js 15 App Router architecture.

```
app/              # Next.js App Router (Pages, Layouts)
components/       # UI Components (shadcn/ui, Feature widgets)
lib/              # Client wrappers, Hooks, event bindings
```

---

# 2. Strict Boundary Rules

1. **Pure Presentation**: All components MUST remain stateless UI templates. No API endpoint urls, SQL-like queries, or Firebase initialization configurations should be defined within `components/`.
2. **SDK Isolation**: Raw fetch, socket, and WebRTC protocols are hidden inside the `meetx-platform-sdk`.
3. **Zustand Scope**: Store files (e.g. `lib/stores/useChatStore.ts`) must only contain local UI flags (e.g. `isOpen: boolean`).
4. **Form Constraints**: All form validations must be declared via Zod and run before mutating SDK endpoints.
