# engineering/features/feature-profile/DATABASE.md

Document ID: PROFILE-DB-001

Version: 1.0.0

Status: Approved

Feature: User Profile

---

# Purpose

Defines the persistent data model for the Profile Feature.

Authentication data is managed by feature-auth.

This feature stores only profile and preference information.

---

# Aggregate

Profile

Root Entity:

Profile

Owned Objects:

- UserPreferences
- NotificationSettings
- PrivacySettings
- AccessibilitySettings
- Presence

---

# Domain Model

## Profile

| Field | Type | Required |
|--------|------|----------|
| userId | String | Yes |
| displayName | String | Yes |
| email | String | Yes (Read Only) |
| avatarUrl | String? | No |
| preferredLanguage | String | Yes |
| translationLanguage | String | Yes |
| theme | Theme | Yes |
| role | UserRole | Yes |

---

## UserPreferences

| Field | Type |
|--------|------|
| theme | Theme |
| language | String |
| translationLanguage | String |

---

## NotificationSettings

| Field | Type |
|--------|------|
| pushEnabled | Boolean |
| meetingEnabled | Boolean |
| chatEnabled | Boolean |
| reminderEnabled | Boolean |

---

## PrivacySettings

| Field | Type |
|--------|------|
| profileVisibility | Visibility |
| onlineStatusVisible | Boolean |
| readReceiptsEnabled | Boolean |
| activityVisible | Boolean |

---

## AccessibilitySettings

| Field | Type |
|--------|------|
| fontScale | Float |
| highContrast | Boolean |
| reduceAnimations | Boolean |
| screenReaderHints | Boolean |

---

## Presence

| Value |
|-------|
| Online |
| Away |
| Busy |
| InMeeting |
| DoNotDisturb |

---

# Local Storage

Room Tables

profile

preferences

notification_settings

privacy_settings

accessibility_settings

---

# Remote Collections

Firestore

users/{userId}

Sub Documents

preferences

notifications

privacy

accessibility

---

# Repository Mapping

Remote DTO

↓

Mapper

↓

Domain Model

↓

Repository

↓

ViewModel

---

# Cache Policy

Source of Truth

Remote

Cache

Room

Memory

Current Profile

---

# Synchronization Strategy

Read

Room

↓

Firestore

↓

Update Cache

Write

Room

↓

Firestore

↓

Update Memory

Conflict Resolution

Last Write Wins

Timestamp Based

---

# Relationships

User (feature-auth)

1

↓

1

Profile

↓

1

Preferences

↓

1

NotificationSettings

↓

1

PrivacySettings

↓

1

AccessibilitySettings

---

# Validation Constraints

Display Name

Length

3–50

Avatar

Max Size

10 MB

Supported Formats

PNG

JPEG

WEBP

Language

ISO-639-1

Theme

Enum

Presence

Enum

---

# Indexes

profile.userId

preferences.userId

---

# Sensitive Data

Encrypted Locally

- Notification tokens
- Device identifiers (if stored)

Never Stored

- Password
- Access Token
- Refresh Token

---

# Migration Policy

Backward compatible schema changes only.

Breaking changes require:

- Database migration
- Mapper update
- Version increment

---

# Completion Criteria

- Local schema implemented
- Firestore mapping implemented
- Repository mapping complete
- Cache synchronization verified
- Migration tests passing

---

End of Document