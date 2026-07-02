# feature-analytics/API.md

Document ID: ANALYTICS-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Analytics & Insights

Base Path: /api/v1/analytics

---

## 1. Get Meeting Analytics Summary

Returns aggregated meeting counts and duration trends for a tenant.

```
GET /api/v1/analytics/meetings
```

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| from | ISO8601 date | Yes | Start date |
| to | ISO8601 date | Yes | End date |
| granularity | DAILY / WEEKLY / MONTHLY | No | Default: DAILY |

### Response (200 OK)

```json
{
  "tenantId": "ten_abc123",
  "granularity": "DAILY",
  "from": "2025-01-01",
  "to": "2025-01-15",
  "series": [
    {
      "date": "2025-01-15",
      "totalMeetings": 48,
      "totalMeetingMinutes": 2880,
      "avgParticipantsPerMeeting": 8.3
    }
  ]
}
```

---

## 2. Get User Engagement

Returns per-user engagement statistics for a tenant.

```
GET /api/v1/analytics/engagement
```

### Query Parameters

| Param | Type | Required |
|-------|------|----------|
| from | date | Yes |
| to | date | Yes |
| userId | UUID | No (filter to specific user) |

### Response (200 OK)

```json
{
  "tenantId": "ten_abc123",
  "users": [
    {
      "userId": "usr_001",
      "name": "Sarah Connor",
      "meetingsHosted": 12,
      "meetingsAttended": 28,
      "totalMeetingMinutes": 1440
    }
  ]
}
```

---

## 3. Get Platform Metrics (Super Admin Only)

```
GET /api/v1/analytics/platform
```

### Query Parameters

| Param | Type | Required |
|-------|------|----------|
| from | date | Yes |
| to | date | Yes |

### Response (200 OK)

```json
{
  "from": "2025-01-01",
  "to": "2025-01-31",
  "dailyActiveUsers": 1240,
  "monthlyActiveUsers": 8400,
  "totalMeetings": 12500,
  "totalMeetingMinutes": 750000,
  "totalRecordingMinutes": 45000,
  "totalTranslationMinutes": 38000
}
```

---

## 4. Export Meeting Report (CSV)

```
GET /api/v1/analytics/meetings/export?from=2025-01-01&to=2025-01-31
```

Returns a `text/csv` file with raw meeting fact rows.

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_DATE_RANGE | `from` is after `to`, or range exceeds 12 months |
| 403 | INSUFFICIENT_ROLE | Platform metrics require SUPER_ADMIN role |

---

End of Document
