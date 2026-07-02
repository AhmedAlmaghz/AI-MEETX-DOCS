# Web Client Event Consumption Guide

Document ID: WEB-EVT-001
Version: 1.0.0
Status: Approved

---

# 1. Event Flow

The Web Client receives live system events (e.g. `MuteAllParticipantsEvent`) via a WebSocket event client managed by `meetx-platform-sdk`.

```
Platform Event Bus (Server)
         │
         ▼ (WebSocket Stream)
meetx-platform-sdk (Client)
         │
         ▼ (React Context / Custom Hook)
    Web Client UI
```

---

# 2. Consumption Rules

- **Strict Event Mapping**: Every event consumed in the UI must map to an event payload defined in the platform's Event Catalog.
- **Hook-Based Registration**: Register event consumers only inside mounted components to avoid memory leaks.
- **Unsubscribe on Dismount**: WebSocket listeners MUST automatically unsubscribe when components dismount.
- **Action Triggers**: Use the SDK's publisher method to post events back to the platform.
