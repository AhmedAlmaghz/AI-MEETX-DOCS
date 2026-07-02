# engineering/features/feature-auth/DATABASE.md

Document ID: AUTH-DB-001

Version: 1.0.0

Status: Approved

Feature: Authentication

Owner: Data Architecture Team

---

# 1. Purpose

This document defines the data storage design for the Authentication Feature.

It specifies:

- Local storage structure
- Remote storage mapping
- Session persistence
- Token handling
- Caching strategy

---

# 2. Storage Strategy

Authentication data is stored across three layers:

## 1. Memory Cache
- Fast access during runtime
- Non-persistent
- Cleared on app termination

## 2. Local Storage (Room + Secure Storage)
- Persistent session storage
- Encrypted sensitive data
- Offline session restoration

## 3. Remote Storage (Auth Provider)
- Firebase Auth or Supabase Auth
- Source of truth for credentials

---

# 3. Core Data Entities

## 3.1 UserEntity (Domain Model)

Represents authenticated user.

Fields:

- userId: String
- email: String
- displayName: String?
- photoUrl: String?
- preferredLanguage: String
- role: UserRole
- createdAt: Long
- updatedAt: Long

---

## 3.2 AuthSessionEntity

Represents active session.

Fields:

- sessionId: String
- userId: String
- accessToken: String
- refreshToken: String
- expiryTime: Long
- isGuest: Boolean
- deviceId: String

---

## 3.3 DeviceEntity

Represents user device.

Fields:

- deviceId: String
- userId: String
- platform: String
- pushToken: String?
- lastActiveAt: Long

---

# 4. Local Database Schema (Room)

## 4.1 Tables

### users

- user_id (PK)
- email
- display_name
- photo_url
- preferred_language
- role
- created_at
- updated_at

---

### auth_session

- session_id (PK)
- user_id (FK)
- access_token
- refresh_token
- expiry_time
- is_guest
- device_id

---

### devices

- device_id (PK)
- user_id
- platform
- push_token
- last_active_at

---

# 5. Remote Storage Mapping

## Firebase / Supabase Mapping

### users collection

- id → userId
- email
- displayName
- photoUrl
- preferredLanguage
- role
- createdAt
- updatedAt

---

### sessions (optional backend tracking)

- sessionId
- userId
- deviceId
- createdAt
- expiresAt

---

# 6. Token Storage Strategy

## Access Token

- Stored in encrypted local storage
- Short-lived (15–60 min)

## Refresh Token

- Stored in encrypted storage
- Used for session renewal

## Security Rules

- Never stored in plain text
- Never logged
- Never exposed to UI layer

---

# 7. Caching Strategy

## Cache Levels

### Level 1: Memory Cache
- Current user session
- Fast access

### Level 2: Local Cache (Room)
- Persistent session
- Offline restore

### Level 3: Remote Source
- Auth provider validation

---

# 8. Session Lifecycle

## Creation

Login → Remote Auth → Token generation → Secure storage → Session saved locally

---

## Validation

App start → Check local session → Validate expiry → Refresh if needed

---

## Expiration

Token expired → Refresh attempt → If fail → logout event

---

## Termination

User logout → Clear local storage → Revoke remote session → Emit event

---

# 9. Data Flow

## Login Flow

UI → ViewModel → UseCase → Repository → Remote Auth API → Token Response → Mapper → Local Storage → Session Created

---

## Session Restore Flow

App Start → Local DB → Validate Token → Refresh if needed → Emit Auth State

---

# 10. Security Rules

- Tokens stored using EncryptedSharedPreferences
- No credentials stored in Room
- No sensitive logs
- Device binding enforced
- Session tied to deviceId

---

# 11. Data Consistency Rules

- Remote is source of truth for authentication
- Local cache is eventual consistent
- Session mismatch triggers re-authentication

---

# 12. Offline Behavior

Supported:

- Session restoration from cache
- Guest session continuation

Not supported:

- New login without network
- Registration without network

---

# 13. Data Mappers

## Responsibilities

Convert between:

DTO ↔ Entity ↔ Domain Model

Rules:

- No business logic in mappers
- One-to-one mapping preferred
- Null safety enforced

---

# 14. Repository Responsibilities

AuthRepository SHALL:

- Abstract all data sources
- Combine remote + local logic
- Expose domain models only
- Handle caching internally

---

# 15. Data Integrity Rules

- Session cannot exist without userId
- Device must be linked to session
- Expired sessions must be invalidated
- Guest sessions are ephemeral

---

# 16. Performance Rules

- Session read < 100ms (local)
- Token refresh async (non-blocking)
- No blocking disk operations on main thread

---

# 17. Migration Strategy

If schema changes:

- Add versioned migration
- Preserve existing sessions when possible
- Clear incompatible cache safely

---

# 18. Failure Handling

- Corrupted session → clear and re-auth
- Missing token → force login
- Network failure → fallback to local validation

---

# 19. Observability

All major events SHALL be traceable via:

- sessionId
- userId
- deviceId
- correlationId

---

# 20. Completion Criteria

This database layer is complete when:

✓ Room schema implemented

✓ Secure storage configured

✓ Token lifecycle working

✓ Session restore working

✓ Mappers implemented

✓ Tests passing

✓ No sensitive leaks

---

End of Document