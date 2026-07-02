# engineering/features/feature-profile/API.md

Document ID: PROFILE-API-001

Version: 1.0.0

Status: Approved

Feature: User Profile

---

# Purpose

Defines the public API contracts used by the Profile Feature.

Authentication is handled by feature-auth.

Authorization uses Bearer Token.

---

# Base Path

/api/v1/profile

---

# Endpoints

## Get Profile

GET /

Authorization

Required

Response

200 OK

```
ProfileDto
```

---

## Update Profile

PATCH /

Authorization

Required

Request

```json
{
  "displayName": "Ahmed",
  "preferredLanguage": "ar",
  "translationLanguage": "en"
}
```

Response

```
ProfileDto
```

---

## Upload Avatar

POST /avatar

Content-Type

multipart/form-data

Request

avatar

Supported

PNG

JPEG

WEBP

Maximum

10 MB

Response

```json
{
  "avatarUrl": "https://..."
}
```

---

## Delete Avatar

DELETE /avatar

Response

204 No Content

---

## Get Preferences

GET /preferences

Response

```json
{
  "theme": "SYSTEM",
  "language": "ar",
  "translationLanguage": "en"
}
```

---

## Update Preferences

PATCH /preferences

Request

```json
{
  "theme": "DARK",
  "language": "ar",
  "translationLanguage": "en"
}
```

Response

200 OK

---

## Notification Settings

GET /preferences/notifications

PATCH /preferences/notifications

---

Supported Fields

- pushEnabled
- meetingEnabled
- chatEnabled
- reminderEnabled

---

## Privacy Settings

GET /preferences/privacy

PATCH /preferences/privacy

---

Supported Fields

- profileVisibility
- onlineStatusVisible
- readReceiptsEnabled
- activityVisible

---

## Accessibility Settings

GET /preferences/accessibility

PATCH /preferences/accessibility

---

Supported Fields

- fontScale
- highContrast
- reduceAnimations
- screenReaderHints

---

## Presence

PUT /presence

Request

```json
{
  "status":"ONLINE"
}
```

Supported Values

ONLINE

AWAY

BUSY

IN_MEETING

DO_NOT_DISTURB

---

# DTO Models

## ProfileDto

```text
userId

displayName

email

avatarUrl

preferredLanguage

translationLanguage

theme

role
```

---

## PreferencesDto

```text
theme

language

translationLanguage
```

---

## NotificationSettingsDto

```text
pushEnabled

meetingEnabled

chatEnabled

reminderEnabled
```

---

## PrivacySettingsDto

```text
profileVisibility

onlineStatusVisible

readReceiptsEnabled

activityVisible
```

---

## AccessibilitySettingsDto

```text
fontScale

highContrast

reduceAnimations

screenReaderHints
```

---

# Error Codes

PROFILE_NOT_FOUND

INVALID_PROFILE

INVALID_AVATAR

FILE_TOO_LARGE

INVALID_LANGUAGE

INVALID_THEME

UNAUTHORIZED

NETWORK_ERROR

SERVER_ERROR

---

# Retry Policy

GET

Automatic Retry

PATCH

No Retry

Avatar Upload

Resume if supported

Otherwise manual retry

---

# Cache Policy

GET requests

Cacheable

PATCH requests

Invalidate cache

Refresh local cache immediately

---

# API Versioning

Current

v1

Breaking changes require

v2

---

# Security

Requires authenticated user.

Users may access only their own profile.

Avatar uploads SHALL be virus-scanned by backend.

---

# Completion Criteria

✓ Retrofit interface implemented

✓ DTOs implemented

✓ Repository mapping completed

✓ Error handling completed

✓ Tests passing

---

End of Document