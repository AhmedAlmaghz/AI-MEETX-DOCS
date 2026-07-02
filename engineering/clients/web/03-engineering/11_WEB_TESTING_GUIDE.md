# Web Client Testing Guide

Document ID: WEB-TST-001
Version: 1.0.0
Status: Approved

---

# 1. Testing Strategy

The Web Client relies on three testing layers:

```
    Playwright (E2E User Flows)
                ▲
                │
  React Testing Library (Component UI)
                ▲
                │
        Vitest (Unit / SDK Mock)
```

---

# 2. Key Policies

- **SDK Mocking**: Unit tests for components must mock the `meetx-platform-sdk` hooks. This keeps tests fast and independent of active platform servers.
- **E2E coverage**: Playwright tests must cover core happy paths (Auth, joining a meeting room, toggling mic/camera).
- **Axe Accessibility Tests**: Playwright scripts must run automated Axe accessibility checks on all pages.
- **Coverage Target**: Unit and integration test suites must maintain >= 80% line coverage in all feature modules.
