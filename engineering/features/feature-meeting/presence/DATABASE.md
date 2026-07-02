# feature-meeting/presence/DATABASE.md

Document ID: PRESENCE-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Presence Tracking & Active Speakers

Subdomain: feature-meeting/presence

---

# 1. Storage Strategy

> [!IMPORTANT]
> Presence data is **Redis-first**. It is NOT stored in PostgreSQL.
> All presence state is ephemeral, stored in Redis with short TTLs.
> Postgres is used only for post-meeting analytics aggregation.

---

# 2. Redis Schema

## 2.1 Participant Presence Record

```
Key:    presence:{meetingId}:{participantId}
Type:   Redis Hash
TTL:    30 seconds (refreshed on every heartbeat)

Fields:
  connection_state   STRING   "CONNECTED" | "RECONNECTING" | "DISCONNECTED"
  network_quality    STRING   "EXCELLENT" | "GOOD" | "FAIR" | "POOR"
  is_speaking        STRING   "true" | "false"
  audio_level        STRING   "0.85"  (float, 0.0 to 1.0)
  last_heartbeat_at  STRING   ISO8601 timestamp
  connected_at       STRING   ISO8601 timestamp
```

## 2.2 Active Speaker Key

```
Key:    active_speaker:{meetingId}
Type:   Redis String
TTL:    5 seconds (refreshed on each audio update)
Value:  participantId of the highest active speaker
```

## 2.3 Meeting Presence Index

```
Key:    presence_index:{meetingId}
Type:   Redis Set
TTL:    Lifetime of the meeting
Value:  Set of active participantIds
```

---

# 3. Access Patterns

## Heartbeat (Write)

```redis
HSET presence:{meetingId}:{participantId} last_heartbeat_at "2025-01-15T10:30:00Z" connection_state "CONNECTED"
EXPIRE presence:{meetingId}:{participantId} 30
SADD presence_index:{meetingId} {participantId}
```

## Read All Presence in Meeting

```redis
SMEMBERS presence_index:{meetingId}
-- For each participantId:
HGETALL presence:{meetingId}:{participantId}
```

## Detect Missed Heartbeats

```
Filter: HGET presence:{meetingId}:{participantId} last_heartbeat_at
Check: if last_heartbeat_at < (NOW - 15s) → mark DISCONNECTED
```

## Get Active Speaker

```redis
GET active_speaker:{meetingId}
```

---

# 4. Analytics Aggregation Table (PostgreSQL — Post-Meeting)

Aggregated presence metrics written after meeting ends.

```sql
CREATE TABLE meeting_presence_analytics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES meeting_participants(id),
    total_connected_ms  BIGINT NOT NULL DEFAULT 0,
    disconnection_count INTEGER NOT NULL DEFAULT 0,
    avg_network_quality VARCHAR(20),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 5. Retention Policy

| Storage | Retention |
|---------|-----------|
| Redis presence keys | Auto-expire (30s TTL per key) + full delete on meeting end |
| `meeting_presence_analytics` | 6 months post-meeting |

---

End of Document
