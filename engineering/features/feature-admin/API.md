# feature-admin/API.md

Document ID: ADMIN-API-001

Version: 1.0.0

Status: Approved

Feature: Administration & Tenant Management

Base Paths: /api/v1/admin/tenants | /api/v1/admin/audit-log

---

> [!IMPORTANT]
> All endpoints in this module require a valid `SUPER_ADMIN` or `TENANT_ADMIN` JWT role claim.
> Super-admin endpoints are prefixed `/api/v1/admin/tenants`.

---

## 1. Create Tenant (Super Admin)

```
POST /api/v1/admin/tenants
```

### Request Body

```json
{
  "name": "Acme Corp",
  "domain": "acme.com",
  "plan": "ENTERPRISE",
  "adminEmail": "admin@acme.com"
}
```

### Response (201 Created)

```json
{
  "tenantId": "ten_abc123",
  "name": "Acme Corp",
  "domain": "acme.com",
  "status": "ACTIVE",
  "createdAt": "2025-01-15T09:00:00Z"
}
```

---

## 2. Suspend Tenant (Super Admin)

```
POST /api/v1/admin/tenants/{tenantId}/suspend
```

### Request Body

```json
{ "reason": "Payment failed - 90 days overdue" }
```

### Response (200 OK)

```json
{ "tenantId": "ten_abc123", "status": "SUSPENDED" }
```

---

## 3. Get Tenant Feature Flags

```
GET /api/v1/admin/tenants/{tenantId}/feature-flags
```

### Response (200 OK)

```json
{
  "tenantId": "ten_abc123",
  "featureFlags": {
    "recordingEnabled": true,
    "aiAssistantEnabled": false,
    "translationEnabled": true,
    "classroomModeEnabled": true,
    "maxMeetingCapacity": 200,
    "maxConcurrentMeetings": 25
  }
}
```

---

## 4. Update Feature Flags

```
PUT /api/v1/admin/tenants/{tenantId}/feature-flags
```

### Request Body

```json
{
  "aiAssistantEnabled": true,
  "maxMeetingCapacity": 500
}
```

### Response (200 OK)

```json
{
  "tenantId": "ten_abc123",
  "featureFlags": { ... },
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

## 5. Get Audit Log

```
GET /api/v1/admin/audit-log
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| tenantId | UUID | - | Filter by tenant |
| actorId | UUID | - | Filter by actor |
| actionType | string | - | Filter by AdminAction |
| from | ISO8601 | - | Start date |
| to | ISO8601 | - | End date |
| page | integer | 1 | Page number |
| pageSize | integer | 50 | Items per page |

### Response (200 OK)

```json
{
  "items": [
    {
      "id": "aud_001",
      "actorId": "usr_admin",
      "actorRole": "SUPER_ADMIN",
      "actionType": "UPDATE_FEATURE_FLAGS",
      "targetType": "Tenant",
      "targetId": "ten_abc123",
      "ipAddress": "203.0.113.1",
      "occurredAt": "2025-01-15T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 50,
  "totalCount": 142
}
```

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 403 | INSUFFICIENT_ADMIN_ROLE | User is not a SUPER_ADMIN or TENANT_ADMIN |
| 409 | TENANT_DOMAIN_EXISTS | Domain already registered |
| 404 | TENANT_NOT_FOUND | Tenant ID not found |

---

End of Document
