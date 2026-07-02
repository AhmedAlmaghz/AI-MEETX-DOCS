# ADR-003: Redis-First Ephemeral Storage for Real-Time Presence & Waitlist

Document ID: ADR-003

Version: 1.0.0

Status: Accepted

Date: 2025-01-17

Deciders: Data Architect, Backend Lead, Devops Lead

Affected Features: feature-meeting/presence, feature-meeting/waiting-room

Classification: Architecture Freeze

---

# Context

Live meetings require real-time updates for:
- Participant heartbeat/presence status (updates every 5 seconds).
- Active speaker audio level checks (multiple updates per second).
- Waiting room gate admittance status.

Persisting these high-frequency, temporary states directly into a relational database like PostgreSQL results in:
- High CPU usage due to intensive write cycles.
- Mass index bloating on transactional tables.
- Network throughput bottlenecks during high-capacity meetings.

---

# Problem

How do we persist and query hot, high-frequency, and ephemeral state (like active speaker status or online presence) without overloading the primary relational database?

---

# Decision

We adopt a **Redis-First Ephemeral Storage** architecture for presence, active speakers, and waiting-room states. 

- **State Persistence**: Presence heartbeats and waiting room queues are stored in Redis Hash/Set structures.
- **TTL (Time-To-Live)**: Keys are assigned an expiration TTL (e.g. 30 seconds for presence, meeting duration for waitlist sets). Redis auto-deletes records of disconnected participants automatically.
- **Analytics Flush**: When a meeting ends, the analytics aggregator queries Redis one last time, writes the computed summaries (total minutes connected, avg network quality) to PostgreSQL, and purges all Redis keys in that meeting's namespace.

```
[Presence Event] ──► [Redis Cache] ──► [Immediate WebSocket Broadcast]
                           │ (Meeting End)
                           ▼
              [Postgres Analytics Fact Table]
```

---

# Consequences

## Positive
- **High Performance**: Redis reads and writes complete in under 2ms, enabling fast active speaker updates.
- **Postgres Optimization**: Zero transactional write pressure for ephemeral status updates.
- **Automatic Cleanup**: Expired heartbeats are cleaned up by Redis TTL automatically without requiring background cron delete scripts.

## Negative
- **Data Loss Risk**: Redis is in-memory. If a Redis node fails, active presence states are lost. 
- *Mitigation*: Clients immediately send heartbeats to rebuild presence state. Meeting lifecycle metadata itself remains safely in Postgres.

---

End of Document
