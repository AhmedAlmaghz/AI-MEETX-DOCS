# Web Client AI Integration Guidelines

Document ID: WEB-AI-001
Version: 1.0.0
Status: Approved

---

# 1. Scope of AI in UI

The web client represents AI features visually. It does not communicate with Gemini models directly.

---

# 2. UI Constraints

- **Live Translation Subtitles**: Translated speech streams must render as a sticky subtitles overlay at the bottom of the active meeting layout.
- **AI Panel**: The Q&A panel and real-time meeting summaries render in a split-screen sidebar on the right side of the meeting layout.
- **Privacy Indicators**: A visual "AI Active" indicator (e.g. badge/sparkle icon) must be visible to all participants when summaries or translations are active. No raw audio logs are stored.
- **Client Processing Limits**: Avoid running heavy client-side audio/video processing. Rely on LiveKit and Gemini pipelines on the platform.
