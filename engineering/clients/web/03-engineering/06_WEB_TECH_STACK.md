# Web Client Technology Stack

Document ID: WEB-TECH-001
Version: 1.0.0
Status: Approved

---

# 1. Base Framework

- **Next.js**: 15.x (App Router, Turbopack)
- **React**: 19.x
- **TypeScript**: 5.x

---

# 2. Design & UI Components

- **CSS**: Tailwind CSS v4
- **Components**: shadcn/ui + Radix UI Primitives
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

# 3. State & Core Integration

- **API SDK**: generated `meetx-platform-sdk`
- **Global State**: Zustand
- **Server Cache**: TanStack Query v5
- **Media Binding**: `@livekit/components-react` + `livekit-client`
- **Validation**: Zod + React Hook Form

---

# 4. Testing & Pipelines

- **Unit Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Linting**: ESLint + Prettier
- **Build Server**: Vercel / Docker (GKE deployment)
