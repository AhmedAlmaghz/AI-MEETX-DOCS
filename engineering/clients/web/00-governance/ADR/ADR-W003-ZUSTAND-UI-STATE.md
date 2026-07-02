# ADR-W003: Zustand for Client-Side UI State Management

## Context
We need a lightweight, fast, and module-friendly state manager to handle transient client state (such as open menus, dialog controls, and active panel flags).

## Decision
Use **Zustand** as the client-side state management library.

## Consequences
- **Modular Stores**: Each feature (e.g. `feature-chat`, `feature-admin`) maintains its own Zustand store. No single mega-store is permitted.
- **Hook Consumption**: Components select only the properties they need to prevent unnecessary re-renders.
- **No Persistence**: Stores are purely memory-based and reset when refreshing the page.
