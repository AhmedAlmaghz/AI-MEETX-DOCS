# Web Meeting UI Testing Specifications

Document ID: WEB-MEETING-TST-001
Version: 1.0.0
Status: Approved

---

# 1. Component Tests (Vitest)

- **Test case: Render roster panel**: Confirms hand-raising order maps correctly to top positions.
- **Test case: Active speaker display**: Checks speaker tags light up on voice detection events.

---

# 2. Integration Tests (Playwright)

- **Test flow: Host admissions**: Host views waiting queue, clicks "Admit" on test participant, and verifies participant transfers from `/lobby` to active room.
