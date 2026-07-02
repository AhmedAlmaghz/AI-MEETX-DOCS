# Web Translation UI Specifications

Document ID: WEB-TRANS-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Integration Model

Subtitles are bound to WebSocket streams listening to translation events.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useSubtitleStream(roomId, targetLanguage)`: Connects to target WebSocket session and streams transcript segments.
- `useSetTranslationPreference()`: Updates account profile default target configurations.

---

# 3. Layout Rules

- Subtitles overlay must dynamically adjust position if bottom toolbar toggles.
- Contrast ratio: minimum 4.5:1 (text color must be white with a semi-transparent black background).
