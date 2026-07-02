# Web Translation UI Testing Specifications

Document ID: WEB-TRANS-TST-001
Version: 1.0.0
Status: Approved

---

# 1. Component Tests (Vitest)

- **Test case: Render text overlay**: Verifies subtitles container renders with high contrast styles.
- **Test case: Language selections**: Confirms selector choices trigger SDK mutations cleanly.

---

# 2. Integration Tests (Playwright)

- **Test flow: Live transcript**: Mock translation WebSocket socket inputs, verify subtitle text lines overlay active screens dynamically.
