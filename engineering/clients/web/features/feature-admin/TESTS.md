# Web Admin UI Testing Specifications

Document ID: WEB-ADMIN-TST-001
Version: 1.0.0
Status: Approved

---

# 1. Component Tests (Vitest)

- **Test case: Render audit rows**: Confirms audit table fields display actor and metadata fields correctly.
- **Test case: Role-based button locks**: Checks feature toggles are disabled if user has read-only profile flags.

---

# 2. Integration Tests (Playwright)

- **Test flow: Feature toggles**: Admin toggles "Gemini Translation Beta" switch, clicks save, views success banner, and confirms toggle value changes dynamically.
