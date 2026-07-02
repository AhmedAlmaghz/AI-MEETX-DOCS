# ADR-W002: LiveKit JS SDK and components-react for Real-Time Media

## Context
The platform uses LiveKit SFU for WebRTC media streams. We need to render high-quality, low-latency audio/video tracks inside the web browser.

## Decision
Use the official **LiveKit JS SDK (`livekit-client`)** and **`@livekit/components-react`** to bind tracks to React DOM components.

## Consequences
- **SDK Encapsulation**: The room connection loop is isolated within a custom hook inside `meetx-platform-sdk`.
- **UI Components**: Web layouts use React components (like `VideoTrack`, `AudioTrack`) for stream rendering.
- **Adaptive Layout**: Browser resize events automatically trigger quality adaptation requests to the SFU.
