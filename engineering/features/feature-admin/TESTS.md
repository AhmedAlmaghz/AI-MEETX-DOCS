# feature-admin/TESTS.md

Document ID: ADMIN-TESTS-001

Version: 1.0.0

Status: Approved

Feature: Administration & Tenant Management

Module: feature-admin

---

# Test Strategy

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | JUnit 5 + MockK | CreateTenantUseCase, UpdateFeatureFlagsUseCase, AuditLog writing | 90% |
| Integration | Testcontainers (Postgres + Redis) | TenantRepository, RedisFeatureFlagService | 80% |
| Security | Manual | Admin role enforcement, audit log immutability | All admin endpoints |

---

# 1. Unit Tests

## 1.1 CreateTenantUseCase

```kotlin
describe("CreateTenantUseCase") {

    it("should create tenant and publish TenantCreatedEvent") {
        val repo = mockk<TenantRepository>()
        val eventBus = mockk<EventBus>()

        coEvery { repo.findByDomain("acme.com") } returns Result.success(null)
        coEvery { repo.save(any()) } answers { Result.success(firstArg()) }
        coEvery { eventBus.publish(any()) } just Runs

        val useCase = CreateTenantUseCase(repo, eventBus)
        val result = useCase(
            CreateTenantCommand(
                name = "Acme Corp",
                domain = "acme.com",
                plan = "ENTERPRISE",
                actorId = UserId("super_admin")
            )
        )

        result.isSuccess shouldBe true
        result.getOrNull()?.domain shouldBe "acme.com"
        coVerify { eventBus.publish(ofType<TenantCreatedEvent>()) }
    }

    it("should fail if domain already exists") {
        val repo = mockk<TenantRepository>()
        coEvery { repo.findByDomain("acme.com") } returns Result.success(buildTenant(domain = "acme.com"))

        val useCase = CreateTenantUseCase(repo, mockk())
        val result = useCase(CreateTenantCommand("Acme Corp", "acme.com", "FREE", UserId("admin")))

        result.isFailure shouldBe true
    }
}
```

---

## 1.2 RedisFeatureFlagService

```kotlin
@Testcontainers
class RedisFeatureFlagServiceIntegrationTest {

    @Test
    fun `should cache feature flags in Redis and return within 5ms`() = runTest {
        val flags = TenantFeatureFlags(
            recordingEnabled = true,
            aiAssistantEnabled = false,
            maxMeetingCapacity = 300
        )

        service.updateFlags(TenantId("t1"), flags).getOrThrow()

        val startMs = System.currentTimeMillis()
        val retrieved = service.getFlags(TenantId("t1")).getOrThrow()
        val elapsedMs = System.currentTimeMillis() - startMs

        elapsedMs shouldBeLessThan 5
        retrieved.aiAssistantEnabled shouldBe false
        retrieved.maxMeetingCapacity shouldBe 300
    }
}
```

---

# 2. Security Tests

```
Security Matrix:
- Super-admin JWT accessing /api/v1/admin/tenants -> 200 OK
- Tenant-admin JWT accessing /api/v1/admin/tenants (all tenants) -> 403 Forbidden
- Tenant-admin JWT accessing own tenant settings -> 200 OK
- Regular user JWT accessing any admin endpoint -> 403 Forbidden
- No JWT accessing any admin endpoint -> 401 Unauthorized
- Verify admin_audit_log: attempt UPDATE/DELETE -> Postgres policy blocks
```

---

# 3. Acceptance Test Matrix

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ADM-T-001 | Super admin creates tenant | Tenant active, audit log entry written | P0 |
| ADM-T-002 | Super admin suspends tenant | All active meetings force-ended, sessions revoked | P0 |
| ADM-T-003 | Tenant admin updates feature flags | Redis cache invalidated, new flags effective immediately | P0 |
| ADM-T-004 | Regular user accesses admin API | 403 Forbidden returned | P0 |
| ADM-T-005 | Audit log queried by date range | Correct entries returned | P1 |

---

End of Document
