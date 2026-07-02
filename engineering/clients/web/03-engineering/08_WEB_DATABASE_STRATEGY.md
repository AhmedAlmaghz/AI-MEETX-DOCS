# Web Client Database Strategy

Document ID: WEB-DB-001
Version: 1.0.0
Status: Approved

---

# 1. State Hydration & Caching

The Web Client UI does not contain database files. It relies on the caching layers exposed by `meetx-platform-sdk` and browser storage APIs.

---

# 2. Cache Layers

- **Query Cache (TanStack Query)**: In-memory cache for API responses. TTL is set to 5 minutes by default for read-only datasets.
- **IndexedDB (via TS SDK)**: Offline cache storage for persistent assets (e.g. cached classroom whiteboard layouts, message history).
- **Session Storage**: Holds transient token hashes for the active session context.

---

# 3. Connection Loss UI Rules

- **Offline Indicator**: A banner overlay must appear automatically when `navigator.onLine` reports `false`.
- **Query Fallback**: Component states must gracefully degrade, displaying cached data if the live query fails due to connectivity.
