# engineering/features/feature-meeting/lifecycle/DATABASE.md

Document ID: MEETING-LIFECYCLE-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting

Subdomain: Lifecycle

---

# Purpose

Defines the persistence model for the Meeting Lifecycle subdomain.

Meeting is the Aggregate Root.

All persistence operations SHALL occur through the Meeting Repository.

---

# Aggregate

Meeting

Aggregate Root

↓

MeetingMetadata

MeetingSettings

MeetingSchedule

RetentionPolicy

---

# Primary Entity

Meeting

| Field | Type | Required |
|--------|------|----------|
| meetingId | UUID | Yes |
| ownerId | UUID | Yes |
| title | String | Yes |
| description | String? | No |
| meetingType | Enum | Yes |
| meetingStatus | Enum | Yes |
| createdAt | Instant | Yes |
| updatedAt | Instant | Yes |
| archivedAt | Instant? | No |
| deletedAt | Instant? | No |

---

# Value Object

MeetingSchedule

| Field | Type |
|--------|------|
| startTime | Instant |
| endTime | Instant |
| timezone | String |
| recurrenceRule | String? |

---

# Value Object

MeetingSettings

| Field | Type |
|--------|------|
| passwordProtected | Boolean |
| waitingRoomEnabled | Boolean |
| recordingEnabled | Boolean |
| translationEnabled | Boolean |
| aiAssistantEnabled | Boolean |
| screenSharingEnabled | Boolean |
| chatEnabled | Boolean |

---

# Value Object

MeetingMetadata

| Field | Type |
|--------|------|
| tags | List<String> |
| category | String |
| source | String |
| version | Integer |

---

# Value Object

RetentionPolicy

| Field | Type |
|--------|------|
| retentionDays | Integer |
| autoArchive | Boolean |
| autoDelete | Boolean |

---

# Repository Contract

MeetingRepository

Operations

Create

Update

Archive

Restore

Delete

FindById

FindByOwner

FindScheduled

FindActive

FindArchived

Exists

---

# Logical Collections

meetings

meeting_metadata

meeting_schedule

meeting_settings

---

# Relationships

User (Auth)

1

↓

N

Meeting

Meeting

1

↓

1

MeetingSchedule

Meeting

1

↓

1

MeetingSettings

Meeting

1

↓

1

MeetingMetadata

---

# State Persistence

Only the latest state SHALL be persisted.

Historical transitions are stored separately by the Audit feature.

---

# Soft Delete

Deletion SHALL NOT remove records immediately.

Fields

deletedAt

deletedBy

Deletion Status

SoftDeleted

---

# Archive Rules

Archived meetings

Read Only

Searchable

Cannot become Active again

---

# Cache Strategy

Level 1

Memory

Current Meeting

---

Level 2

Local Database

Recently Opened Meetings

---

Level 3

Remote Source

Complete Dataset

---

# Query Patterns

Most Frequent

Find Active Meeting

Find Scheduled Meetings

Find Meetings By Owner

Search By Title

Search By Date

Find Archived Meetings

---

# Index Recommendations

meetingId

ownerId

meetingStatus

meetingType

startTime

createdAt

deletedAt

---

# Consistency Rules

Meeting Aggregate SHALL be transactionally consistent.

Cross-feature consistency SHALL use Eventual Consistency.

---

# Migration Rules

Schema Version

Integer

Backward compatible migrations preferred.

Breaking changes require:

Repository update

Mapper update

Migration script

---

# Security

OwnerId immutable.

Deleted meetings inaccessible.

Archived meetings read-only.

Sensitive meeting settings encrypted if required.

---

# Completion Criteria

✓ Repository schema implemented

✓ Aggregate persistence verified

✓ Soft delete implemented

✓ Archive policy implemented

✓ Query performance validated

✓ Migration strategy documented

---

End of Document