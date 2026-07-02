# engineering/features/feature-auth/API.md

Document ID: AUTH-API-001

Version: 1.0.0

Status: Approved

Feature: Authentication

Owner: Backend Integration Team

---

# 1. Purpose

This document defines all external API contracts used by the Authentication Feature.

It includes:

- Endpoints
- Request models
- Response models
- Error handling
- Authentication flows

---

# 2. API Base Configuration

Base URL:

https://api.platform.com/v1

Protocol:

HTTPS only

Format:

JSON

---

# 3. Authentication Endpoints

## 3.1 Register User

POST /auth/register

### Request

```
{
  "email": "string",
  "password": "string",
  "displayName": "string?"
}
```

### Response

```
{
  "userId": "string",
  "email": "string",
  "displayName": "string",
  "createdAt": "long"
}
```

---

## 3.2 Login User

POST /auth/login

### Request

```
{
  "email": "string",
  "password": "string",
  "deviceId": "string"
}
```

### Response

```
{
  "user": {
    "userId": "string",
    "email": "string",
    "displayName": "string",
    "role": "string"
  },
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600
}
```

---

## 3.3 Logout

POST /auth/logout

### Request

```
{
  "refreshToken": "string",
  "deviceId": "string"
}
```

### Response

```
{
  "success": true
}
```

---

## 3.4 Refresh Token

POST /auth/refresh

### Request

```
{
  "refreshToken": "string"
}
```

### Response

```
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600
}
```

---

## 3.5 Guest Session

POST /auth/guest

### Request

```
{
  "deviceId": "string"
}
```

### Response

```
{
  "guestId": "string",
  "accessToken": "string",
  "expiresIn": 7200
}
```

---

## 3.6 Password Reset

POST /auth/password/reset

### Request

```
{
  "email": "string"
}
```

### Response

```
{
  "success": true,
  "message": "Reset link sent"
}
```

---

## 3.7 Email Verification

POST /auth/email/verify

### Request

```
{
  "userId": "string",
  "verificationCode": "string"
}
```

### Response

```
{
  "verified": true
}
```

---

# 4. Error Handling

## Standard Error Response

```
{
  "errorCode": "string",
  "message": "string",
  "details": "string?"
}
```

---

## Error Codes

AUTH_INVALID_CREDENTIALS

AUTH_USER_NOT_FOUND

AUTH_EMAIL_NOT_VERIFIED

AUTH_TOKEN_EXPIRED

AUTH_TOKEN_INVALID

AUTH_DEVICE_NOT_ALLOWED

NETWORK_ERROR

SERVER_ERROR

---

# 5. Retry Strategy

- Login: no automatic retry
- Refresh token: automatic retry (max 2)
- Guest session: retry once
- Password reset: no retry

---

# 6. Authentication Flow

## Login Flow

1. User submits credentials
2. API validates input
3. Server authenticates user
4. Returns tokens + user data
5. Client stores tokens securely
6. Session is created locally

---

## Refresh Flow

1. Access token expires
2. Client sends refresh token
3. Server validates refresh token
4. New access token issued
5. Local session updated

---

## Logout Flow

1. Client sends refresh token
2. Server invalidates session
3. Local storage cleared
4. User logged out

---

# 7. Security Rules

- All requests MUST use HTTPS
- Tokens MUST NOT be exposed in logs
- Refresh tokens MUST be rotated
- Device binding enforced
- Expired tokens rejected immediately

---

# 8. Rate Limiting

Login attempts:

5 per minute per device

Password reset:

3 per hour per email

Guest sessions:

10 per hour per device

---

# 9. Headers

All requests SHALL include:

Authorization: Bearer <accessToken>

Device-Id: <deviceId>

Content-Type: application/json

---

# 10. Caching Rules

- Login response cached locally
- Token never cached in memory only
- User profile cached separately

---

# 11. Offline Behavior

Allowed:

- Token validation (local)
- Session read

Not allowed:

- Login
- Registration
- Token refresh

---

# 12. API Versioning

All endpoints use:

/v1/

Breaking changes require:

/v2/

---

# 13. Monitoring

All authentication endpoints MUST be tracked for:

- latency
- error rate
- success rate
- retry attempts

---

# 14. Completion Criteria

API layer is complete when:

✓ All endpoints implemented

✓ Retrofit interfaces defined

✓ DTOs mapped correctly

✓ Error handling implemented

✓ Secure storage integrated

✓ Tests passing

---

End of Document