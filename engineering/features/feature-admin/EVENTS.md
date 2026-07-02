# feature-admin/EVENTS.md

Document ID: ADMIN-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Administration & Tenant Management

Module: feature-admin

---

# Events Published

---

## TenantCreatedEvent

```yaml
Event: TenantCreatedEvent
Schema:
  eventId: string
  tenantId: string
  name: string
  domain: string
  plan: string
  createdBy: string
  createdAt: ISO8601
Routing:
  topic: admin.tenant.created
  partitionKey: tenantId
```

---

## TenantSuspendedEvent

```yaml
Event: TenantSuspendedEvent
Schema:
  eventId: string
  tenantId: string
  suspendedBy: string
  reason: string
  suspendedAt: ISO8601
Routing:
  topic: admin.tenant.suspended
  partitionKey: tenantId

Side Effects:
  - feature-meeting/lifecycle: Force-end all active meetings for tenant.
  - feature-auth: Revoke all active JWT sessions for tenant users.
```

---

## FeatureFlagsUpdatedEvent

```yaml
Event: FeatureFlagsUpdatedEvent
Schema:
  eventId: string
  tenantId: string
  updatedBy: string
  flags: TenantFeatureFlags (JSON)
  updatedAt: ISO8601
Routing:
  topic: admin.tenant.feature_flags_updated
  partitionKey: tenantId

Side Effects:
  - All services with feature flag caches must invalidate their Redis cache for this tenant.
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `UserRegisteredEvent` | feature-auth | Create `tenant_members` record. |

---

End of Document
