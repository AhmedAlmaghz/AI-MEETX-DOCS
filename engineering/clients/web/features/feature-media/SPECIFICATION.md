# Web Media UI Specifications

Document ID: WEB-MEDIA-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Integration Model

The Web Client imports `@livekit/components-react` components to render tracks.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useMediaDevices()`: Lists browser camera/microphone inputs.
- `useLiveKitRoom(token)`: Initializes room connection and manages remote track subscriptions.
- `useLocalTrackToggle()`: Mutes/unmutes active mic or webcam feeds.

---

# 3. Connection State UI

- **Connecting**: Display spinning loader centered on canvas.
- **Disconnected**: Display error toast and route back to lobby.
- **Reconnecting**: Display orange toast warning of network dropouts.
