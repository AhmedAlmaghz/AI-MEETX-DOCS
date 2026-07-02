# Web Client Coding Standards

Document ID: WEB-COD-001
Version: 1.0.0
Status: Approved

---

# 1. TypeScript Rules

- **Strict Type Checking**: Strict mode is enabled. No explicit or implicit `any` usage is allowed.
- **Explicit Returns**: Functions and React components must have explicit return type definitions.
- **Interfaces over Types**: Use `interface` for structural object shapes and API DTO definitions.

---

# 2. React & Next.js Standards

- **RSC Pattern**: Keep data-fetching components as Server Components. Extract user interactions to small Client Components (`'use client'`).
- **Hooks Naming**: Custom hooks must prefix with `use` (e.g. `useMeetingRoster`).
- **Tailwind Formatting**: Format Tailwind CSS classes logically using standard Prettier plugins.
- **Component File Structure**:
  ```typescript
  import { useClient } from 'react';
  // Imports...
  interface Props {}
  export function ComponentName(props: Props): React.ReactElement {}
  ```
