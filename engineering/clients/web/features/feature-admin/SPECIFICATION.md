# Web Admin UI Specifications

Document ID: WEB-ADMIN-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Component Layout

- `/dashboard/admin`: Main portal root route.
- `FeatureFlagsPanel`: Form panel displaying feature switches.
- `AuditLogTable`: Paginated logs table showing actor, action, timestamp, and metadata.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useTenantDetails()`: Queries tenant details and license levels.
- `useAdminAuditLogs(filters)`: Renders activity logs history.
- `useUpdateFeatureFlags()`: Mutation sending toggle updates back to servers.
