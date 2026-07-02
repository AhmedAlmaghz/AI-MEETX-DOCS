# feature-media

Document ID: MEDIA-README-001
Version: 2.0.0
Status: Approved

---

# Overview

The Media feature owns all real-time audio, video, and screen-sharing capabilities of the AI MeetX platform. It is composed of eight independent subdomains that communicate exclusively through domain events.

---

# Subdomain Map

```
feature-media/
│
├── media-platform/          ← Top-level capability gateway & configuration
│   ├── REQUIREMENTS.md
│   ├── SPECIFICATION.md
│   └── DATABASE.md
│
├── media-session/           ← Session lifecycle, state machine, participant binding
│   ├── REQUIREMENTS.md
│   ├── SPECIFICATION.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── EVENTS.md
│   └── TESTS.md
│
├── media-orchestrator/      ← Cross-subdomain coordination & quality routing
│   ├── REQUIREMENTS.md
│   ├── SPECIFICATION.md
│   └── DATABASE.md
│
├── audio-engine/            ← Real-time audio capture, processing, adaptation
│   ├── REQUIREMENTS.md
│   ├── SPECIFICATION.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── EVENTS.md
│   └── TESTS.md
│
├── video-engine/            ← Real-time video capture, encoding, adaptation
│   ├── REQUIREMENTS.md
│   ├── SPECIFICATION.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── EVENTS.md
│   └── TESTS.md
│
├── screen-share/            ← Screen capture, annotation, permissions
│   ├── REQUIREMENTS.md
│   ├── SPECIFICATION.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── EVENTS.md
│   └── TESTS.md
│
├── network-layer/           ← WebRTC transport, SFU integration, congestion control
│   ├── REQUIREMENTS.md
│   ├── SPECIFICATION.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── EVENTS.md
│   └── TESTS.md
│
└── devices/                 ← Device enumeration, selection, permission management
    ├── REQUIREMENTS.md
    ├── SPECIFICATION.md
    ├── DATABASE.md
    ├── API.md
    ├── EVENTS.md
    └── TESTS.md
```

---

# Dependency Order

```
media-platform
    └── media-session
            ├── devices
            ├── audio-engine
            ├── video-engine
            ├── screen-share
            └── network-layer
                    └── media-orchestrator
```

---

# Architectural Rules

- Subdomains MUST NOT import from each other directly
- All cross-subdomain communication is via domain events only
- Raw audio/video data is NEVER persisted — only metadata and state
- Device selection is owned exclusively by `devices` subdomain
- Session lifecycle is owned exclusively by `media-session` subdomain

---

# Integration Events

| Producer            | Event                          | Consumers                             |
|---------------------|--------------------------------|---------------------------------------|
| media-session       | MediaSessionActivatedEvent     | audio-engine, video-engine, screen-share, network-layer |
| media-session       | MediaSessionClosedEvent        | all subdomains                        |
| devices             | DeviceSelectedEvent            | audio-engine, video-engine            |
| devices             | DeviceUnavailableEvent         | audio-engine, video-engine            |
| audio-engine        | AudioQualityDegradedEvent      | media-orchestrator, network-layer     |
| video-engine        | VideoQualityDegradedEvent      | media-orchestrator, network-layer     |
| network-layer       | NetworkQualityChangedEvent     | audio-engine, video-engine, media-orchestrator |
| media-orchestrator  | MediaQualityAdaptedEvent       | audio-engine, video-engine            |

---

End of Document