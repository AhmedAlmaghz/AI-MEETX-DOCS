Document ID: DB-000

Version: 1.0.0

Status: Approved

Owner: Data Architecture Team

Classification: Mandatory

---

# 1. Purpose

This document defines the logical database architecture of the AI Meeting Platform.

It specifies:

- Domain entities
- Relationships
- Storage strategy
- Synchronization strategy
- Naming conventions

This document is technology-independent.

It applies equally whether Firebase or Supabase is used.

---

# 2. Database Philosophy

The platform follows:

Single Source of Truth

↓

Repository Pattern

↓

Local Cache

↓

Remote Synchronization

UI SHALL NEVER access storage directly.

---

# 3. Storage Layers

Three storage levels exist.

## Level 1

Memory Cache

Purpose

Fast access

Temporary

Not persisted

---

## Level 2

Local Database

Technology

Room

Purpose

Offline support

Fast queries

Caching

---

## Level 3

Remote Database

Primary

Cloud Firestore

Alternative

Supabase PostgreSQL

Purpose

Synchronization

Realtime updates

Persistence

---

# 4. Entity Categories

The platform data model is divided into independent domains.

AUTH

PROFILE

MEETING

PARTICIPANT

MEDIA

CHAT

TRANSLATION

AI

CLASSROOM

NOTIFICATION

RECORDING

ADMIN

ANALYTICS

---

# 5. Core Entities

## User

Represents an authenticated identity.

Fields

UserId

DisplayName

Email

PhotoUrl

PreferredLanguage

Theme

Role

Status

CreatedAt

UpdatedAt

---

## UserSettings

Stores user preferences.

Language

Theme

Notification Settings

Translation Settings

Accessibility

Privacy

---

## Device

Represents a registered device.

DeviceId

Platform

PushToken

LastSeen

---

# 6. Meeting Domain

## Meeting

MeetingId

Title

Description

OwnerId

Type

Status

StartTime

EndTime

Settings

CreatedAt

UpdatedAt

---

Meeting Types

Private

Group

Classroom

Webinar

---

Meeting Status

Scheduled

Waiting

Running

Finished

Cancelled

---

## Participant

ParticipantId

MeetingId

UserId

Role

AudioState

VideoState

ConnectionState

HandRaised

Language

JoinTime

LeaveTime

---

Participant Roles

Owner

Moderator

Teacher

Presenter

Member

Guest

---

# 7. Media Domain

## AudioTrack

TrackId

ParticipantId

Codec

Muted

Volume

Bitrate

---

## VideoTrack

TrackId

ParticipantId

Resolution

FrameRate

Camera

Enabled

---

## ScreenShare

ShareId

ParticipantId

StartedAt

EndedAt

Active

---

# 8. Chat Domain

## Conversation

ConversationId

MeetingId

Type

CreatedAt

---

## Message

MessageId

ConversationId

SenderId

Type

Content

Attachment

ReplyTo

CreatedAt

EditedAt

Deleted

---

Message Types

Text

Image

File

System

AI

---

# 9. Translation Domain

## TranslationSession

SessionId

MeetingId

TargetLanguage

Status

StartedAt

---

## TranslationSegment

SegmentId

SpeakerId

OriginalLanguage

OriginalText

TranslatedText

Confidence

Timestamp

---

Future Fields

TranslatedAudioUrl

VoiceProfile

---

# 10. AI Domain

## AISummary

SummaryId

MeetingId

Summary

Keywords

CreatedAt

---

## AIAction

ActionId

MeetingId

ActionType

Payload

Status

---

# 11. Classroom Domain

## Classroom

ClassroomId

TeacherId

Name

Description

Subject

---

## Assignment

AssignmentId

ClassroomId

Title

Description

DueDate

---

# 12. Notification Domain

## Notification

NotificationId

UserId

Title

Body

Type

Read

CreatedAt

---

# 13. Recording Domain

## Recording

RecordingId

MeetingId

OwnerId

Duration

StorageUrl

Status

CreatedAt

---

# 14. Analytics Domain

## AnalyticsEvent

EventId

EventType

UserId

MeetingId

Timestamp

Metadata

---

# 15. Relationships

User

↓

Meeting

↓

Participant

↓

Media

↓

Chat

↓

Translation

↓

Recording

---

One User

↓

Many Meetings

One Meeting

↓

Many Participants

One Participant

↓

Many Messages

One Meeting

↓

Many Translation Segments

---

# 16. Synchronization Strategy

Priority

Room

↓

Repository

↓

Firestore

Conflict Resolution

Last Write Wins

Future

CRDT support

---

# 17. Offline Strategy

The following SHALL work offline whenever possible:

User Profile

Settings

Recent Meetings

Recent Chat

Draft Messages

Cached Files

Pending Uploads

Synchronization occurs automatically.

---

# 18. Security

Sensitive fields SHALL be encrypted when stored locally.

Examples

Authentication Tokens

Refresh Tokens

Private Settings

Cached Credentials

Passwords SHALL NEVER be stored.

---

# 19. Firestore Collections

users

devices

meetings

participants

messages

translations

notifications

recordings

analytics

---

# 20. Room Tables

users

user_settings

cached_meetings

cached_messages

pending_uploads

translation_cache

notifications

---

# 21. Naming Convention

Collections

camelCase

Documents

UUID

Primary Keys

String

Foreign Keys

Entity IDs

---

# 22. Audit Fields

Every persisted entity SHOULD contain:

CreatedAt

UpdatedAt

CreatedBy

UpdatedBy

Version

Deleted

---

# 23. Data Lifecycle

Created

↓

Validated

↓

Persisted

↓

Cached

↓

Synchronized

↓

Archived

↓

Deleted

---

# 24. Future Expansion

Plugin Data

AI Knowledge Base

Organization Management

Enterprise Accounts

External Calendar Integration

---

End of Document