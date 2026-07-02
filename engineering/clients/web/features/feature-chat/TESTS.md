# Web Chat UI Testing Specifications

Document ID: WEB-CHAT-TST-001
Version: 1.0.0
Status: Approved

---

# 1. Component Tests (Vitest)

- **Test case: Render text feed**: Checks bubble layouts show usernames and timestamps correctly.
- **Test case: Staging indicators**: Confirms drag-and-drop actions trigger staging indicators before uploads.

---

# 2. Integration Tests (Playwright)

- **Test flow: Message exchange**: User loads meeting page, types text message, hits submit, and verifies message resolves to DOM message feed list instantly.
