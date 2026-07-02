# Web Client Project Constitution

Document ID: WEB-GOV-001
Version: 1.0.0
Status: Approved

---

# 1. Purpose

This document defines the immutable UI/UX and engineering principles governing the AI MeetX Web Client application.

---

# 2. UI/UX Principles

1. **Accessibility First**: Web Client MUST be compliant with WCAG 2.1 AA. Screen reader tags, keyboard navigation, and aria-attributes are mandatory for all custom widgets.
2. **Device Responsiveness**: The UI must adapt seamlessly between desktop, tablet, and mobile layouts. Tailwind CSS breakpoints are the standard.
3. **No Direct Business Logic**: All business rules (validations, state calculations, network transformations) MUST be delegated to the `meetx-platform-sdk`.
4. **Performance Budgets**: Page loads MUST have a Lighthouse performance score of >= 90. All route boundaries must have loading suspension screens.

---

# 3. Non-Negotiable Web Rules

- **Zero "any" Types**: TypeScript strict mode is enabled. All entities map directly to the platform's JSON-schema models.
- **Server Components by Default**: Pages are React Server Components (RSC) to minimize bundle sizes. Client Components (`'use client'`) are only allowed for active interaction points.
- **Form Validation via Zod**: Every form submission must validate against a strict Zod schema matching the platform input DTO contracts.
- **Audit Logs are Read-Only**: No UI actions are allowed to edit, suspend, or delete log metadata.

---

End of Document
