# feature-meeting/invitations/EVENTS.md

Document ID: INVITATIONS-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Invitations & RSVP

Subdomain: feature-meeting/invitations

---

# Overview

Defines domain events published and consumed for invitation lifecycle and security configurations.

---

# Events Published

---

## InvitationCreatedEvent

Published when a new invitation is generated and ready for email delivery.

```yaml
Event: InvitationCreatedEvent

Schema:
  eventId: string
  meetingId: string
  invitationId: string
  inviteeEmail: string
  inviteeName: string | null
  inviteeRole: enum [HOST, CO_HOST, MODERATOR, SPEAKER, ATTENDEE]
  token: string
  expiresAt: ISO8601
  invitedBy: string                     # ParticipantId of host

Routing:
  topic: meeting.invitations.created
  partitionKey: meetingId

Side Effects:
  - Notification Feature: consumes this event to compose and send the email with ICS calendar attachment.
```

---

## InvitationRsvpUpdatedEvent

Published when an invitee responds to the invitation.

```yaml
Event: InvitationRsvpUpdatedEvent

Schema:
  eventId: string
  meetingId: string
  invitationId: string
  inviteeEmail: string
  status: enum [ACCEPTED, DECLINED]
  respondedAt: ISO8601

Routing:
  topic: meeting.invitations.rsvp_updated
  partitionKey: meetingId

Side Effects:
  - Participant List Update: notifies host via real-time alerts.
```

---

## InvitationRevokedEvent

Published when an invitation is revoked by the host.

```yaml
Event: InvitationRevokedEvent

Schema:
  eventId: string
  meetingId: string
  invitationId: string
  inviteeEmail: string
  revokedBy: string
  revokedAt: ISO8601

Routing:
  topic: meeting.invitations.revoked
  partitionKey: meetingId

Side Effects:
  - Access Revocation: access check will immediately fail for this token.
```

---

## MeetingPasscodeUpdatedEvent

Published when the passcode status changes.

```yaml
Event: MeetingPasscodeUpdatedEvent

Schema:
  eventId: string
  meetingId: string
  isPasscodeEnabled: boolean
  updatedBy: string
  updatedAt: ISO8601

Routing:
  topic: meeting.passcode.updated
  partitionKey: meetingId
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingEndedEvent` | feature-meeting/lifecycle | Terminate and clean up all invitations data and tokens. |

---

End of Document
