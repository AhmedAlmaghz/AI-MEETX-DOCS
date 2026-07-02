# Web Notification UI Specifications

Document ID: WEB-NOT-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Integration Model

Toasts use `sonner` or custom react primitives. Push alerts use browser service workers.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useNotificationsQueue()`: Fetches past alert messages and statuses.
- `useMarkNotificationRead()`: Mutation to trigger read state updates.
- `useNotificationPreferences()`: Syncs settings checklists to profile databases.

---

# 3. Push API Flow

1. Browser requests permission via Service Worker registration.
2. Yields pushSubscription payload back to feature-notification subscription database.
3. Node server fires payload to browser endpoints when events dispatch.
