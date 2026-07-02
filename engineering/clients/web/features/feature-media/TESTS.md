# Web Media UI Testing Specifications

Document ID: WEB-MEDIA-TST-001
Version: 1.0.0
Status: Approved

---

# 1. Component Tests (Vitest)

- **Test case: Render device selectors**: Checks selectors display all mocked audio/video hardware entries.
- **Test case: Mute state synchronization**: Confirms local UI mic buttons toggle mock hooks cleanly.

---

# 2. Integration Tests (Playwright)

- **Test flow: WebRTC video feed**: Mock camera input in browser, load room URL, and verify local camera stream canvas element launches successfully.
