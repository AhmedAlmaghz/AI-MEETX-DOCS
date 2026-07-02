# feature-admin/SPECIFICATION.md

Document ID: ADMIN-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Administration & Tenant Management

Module: feature-admin

---

# 1. Domain Models

## 1.1 Tenant (Aggregate Root)

```kotlin
data class Tenant(
    val id: TenantId,
    val name: String,
    val domain: String,
    val status: TenantStatus = TenantStatus.ACTIVE,
    val plan: SubscriptionPlan,
    val featureFlags: TenantFeatureFlags = TenantFeatureFlags(),
    val settings: TenantSettings = TenantSettings(),
    val createdAt: Instant = Instant.now()
)

enum class TenantStatus { ACTIVE, SUSPENDED, DELETED }
```

## 1.2 TenantFeatureFlags (Value Object)

```kotlin
data class TenantFeatureFlags(
    val recordingEnabled: Boolean = true,
    val aiAssistantEnabled: Boolean = true,
    val translationEnabled: Boolean = true,
    val classroomModeEnabled: Boolean = true,
    val maxMeetingCapacity: Int = 100,
    val maxConcurrentMeetings: Int = 50
)
```

## 1.3 TenantSettings (Value Object)

```kotlin
data class TenantSettings(
    val defaultMeetingDurationMinutes: Int = 60,
    val defaultWaitingRoomEnabled: Boolean = true,
    val defaultRecordingLayout: String = "SPEAKER_VIEW",
    val allowExternalParticipants: Boolean = true
)
```

## 1.4 AuditLogEntry (Entity)

```kotlin
data class AuditLogEntry(
    val id: AuditLogId,
    val tenantId: TenantId?,
    val actorId: UserId,
    val actorRole: AdminRole,
    val actionType: AdminAction,
    val targetType: String,
    val targetId: String,
    val metadata: Map<String, String> = emptyMap(),
    val ipAddress: String,
    val occurredAt: Instant = Instant.now()
)

enum class AdminRole { SUPER_ADMIN, TENANT_ADMIN }

enum class AdminAction {
    CREATE_TENANT, SUSPEND_TENANT, DELETE_TENANT,
    INVITE_USER, DEACTIVATE_USER, REMOVE_USER,
    UPDATE_FEATURE_FLAGS, UPDATE_TENANT_SETTINGS,
    IMPERSONATE_USER
}
```

---

# 2. Feature Flag Service

```kotlin
interface FeatureFlagService {
    // Redis-cached; cache TTL = 60s
    suspend fun getFlags(tenantId: TenantId): Result<TenantFeatureFlags>
    suspend fun isEnabled(tenantId: TenantId, flag: FeatureFlag): Result<Boolean>
    suspend fun updateFlags(tenantId: TenantId, flags: TenantFeatureFlags): Result<Unit>
}

enum class FeatureFlag {
    RECORDING, AI_ASSISTANT, TRANSLATION, CLASSROOM_MODE
}
```

---

# 3. Repository Contracts

```kotlin
interface TenantRepository {
    suspend fun save(tenant: Tenant): Result<Tenant>
    suspend fun findById(id: TenantId): Result<Tenant?>
    suspend fun findByDomain(domain: String): Result<Tenant?>
    suspend fun update(tenant: Tenant): Result<Tenant>
    suspend fun findAll(page: Int, pageSize: Int): Result<List<Tenant>>
}

interface AuditLogRepository {
    suspend fun save(entry: AuditLogEntry): Result<AuditLogEntry>
    suspend fun findByTenantId(tenantId: TenantId, page: Int, pageSize: Int): Result<List<AuditLogEntry>>
    suspend fun findByActorId(actorId: UserId, page: Int, pageSize: Int): Result<List<AuditLogEntry>>
}
```

---

# 4. Module Structure

```
feature-admin/
├── domain/
│   ├── model/
│   │   ├── Tenant.kt
│   │   ├── TenantFeatureFlags.kt
│   │   ├── TenantSettings.kt
│   │   └── AuditLogEntry.kt
│   ├── usecase/
│   │   ├── CreateTenantUseCase.kt
│   │   ├── SuspendTenantUseCase.kt
│   │   ├── UpdateFeatureFlagsUseCase.kt
│   │   └── ImpersonateUserUseCase.kt
│   └── port/
│       ├── TenantRepository.kt
│       ├── AuditLogRepository.kt
│       └── FeatureFlagService.kt
└── data/
    ├── TenantRepositoryImpl.kt
    ├── AuditLogRepositoryImpl.kt
    └── RedisFeatureFlagService.kt
```

---

End of Document
