# feature-recording/SPECIFICATION.md

Document ID: RECORDING-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting Recording

Module: feature-recording

---

# 1. Domain Models

## 1.1 MeetingRecording (Aggregate Root)

```kotlin
data class MeetingRecording(
    val id: RecordingId,
    val meetingId: MeetingId,
    val egressId: String,                         // LiveKit Egress job ID
    val layout: RecordingLayout,
    val status: RecordingStatus = RecordingStatus.STARTING,
    val storageUrl: String? = null,
    val fileSizeBytes: Long? = null,
    val durationSeconds: Long? = null,
    val startedAt: Instant = Instant.now(),
    val stoppedAt: Instant? = null,
    val expiresAt: Instant? = null,
    val startedBy: ParticipantId
)
```

---

# 2. Value Objects

```kotlin
@JvmInline value class RecordingId(val value: String)

enum class RecordingLayout {
    SPEAKER_VIEW,
    GALLERY_VIEW,
    AUDIO_ONLY
}

enum class RecordingStatus {
    STARTING,
    ACTIVE,
    STOPPING,
    READY,
    FAILED,
    EXPIRED
}
```

---

# 3. LiveKit Egress Integration

```kotlin
interface RecordingGateway {
    suspend fun startEgress(
        roomName: String,
        layout: RecordingLayout,
        storageBucket: String
    ): Result<String>           // Returns egressId

    suspend fun stopEgress(egressId: String): Result<Unit>

    suspend fun getEgressStatus(egressId: String): Result<EgressStatus>
}

data class EgressStatus(
    val egressId: String,
    val status: String,         // "EGRESS_ACTIVE" | "EGRESS_COMPLETE" | "EGRESS_FAILED"
    val fileResults: List<EgressFileResult>
)

data class EgressFileResult(
    val filename: String,
    val location: String,       // Storage URL
    val size: Long,
    val duration: Long
)
```

---

# 4. Repository Contract

```kotlin
interface RecordingRepository {
    suspend fun save(recording: MeetingRecording): Result<MeetingRecording>
    suspend fun findById(id: RecordingId): Result<MeetingRecording?>
    suspend fun findByMeetingId(meetingId: MeetingId): Result<List<MeetingRecording>>
    suspend fun update(recording: MeetingRecording): Result<MeetingRecording>
}
```

---

# 5. Use Cases

## 5.1 StartRecordingUseCase

```
Input: StartRecordingCommand(meetingId, hostId, layout)

Steps:
1. Verify meeting is ACTIVE.
2. Verify hostId has HOST or CO_HOST role.
3. Check no recording already ACTIVE.
4. Call RecordingGateway.startEgress(roomName, layout, bucket).
5. Create MeetingRecording (status = STARTING).
6. Save recording.
7. Publish RecordingStartedEvent.
```

## 5.2 StopRecordingUseCase

```
Input: StopRecordingCommand(meetingId, recordingId, hostId)

Steps:
1. Verify hostId has HOST or CO_HOST role.
2. Load MeetingRecording.
3. Call RecordingGateway.stopEgress(egressId).
4. Update status = STOPPING.
5. Save recording.
6. Publish RecordingStoppedEvent.
7. Start EgressStatusPollingJob to watch for EGRESS_COMPLETE.
```

## 5.3 EgressStatusPollingJob

```
Triggers: Every 30 seconds after stop command.

Steps:
1. Load all STOPPING recordings.
2. For each, call RecordingGateway.getEgressStatus().
3. If status = EGRESS_COMPLETE:
   - Update MeetingRecording with storageUrl, fileSize, duration.
   - Set status = READY.
   - Publish RecordingReadyEvent.
4. If status = EGRESS_FAILED:
   - Set status = FAILED.
   - Publish RecordingFailedEvent.
```

---

# 6. Module Structure

```
feature-recording/
├── domain/
│   ├── model/
│   │   ├── MeetingRecording.kt
│   │   ├── RecordingLayout.kt
│   │   └── RecordingStatus.kt
│   ├── usecase/
│   │   ├── StartRecordingUseCase.kt
│   │   └── StopRecordingUseCase.kt
│   └── port/
│       ├── RecordingRepository.kt
│       └── RecordingGateway.kt
├── data/
│   ├── RecordingRepositoryImpl.kt
│   └── LivekitEgressGateway.kt
└── job/
    └── EgressStatusPollingJob.kt
```

---

End of Document
