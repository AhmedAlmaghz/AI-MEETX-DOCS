# Web Client Repository Structure

Document ID: WEB-REP-001
Version: 1.0.0
Status: Approved

---

# 1. Directory Layout

The Web Client UI codebase follows a standard Next.js 15 structure:

```
web-client/
├── public/                 # Static assets (images, fonts, manifest)
├── app/                    # Next.js App Router folders
│   ├── layout.tsx          # Root layout with theme providers
│   ├── page.tsx            # Main landing page
│   ├── (auth)/             # Route Group for authentication (login, register)
│   ├── (app)/              # Route Group for authenticated workflows
│   │   ├── dashboard/      # User dashboard view
│   │   ├── meeting/        # Live meeting room layouts
│   │   └── admin/          # Admin control screens
│
├── components/             # Reusable UI widgets
│   ├── ui/                 # Atomic shadcn/ui components (button, input, dialogue)
│   └── layout/             # Layout widgets (navbar, sidebar, panels)
│
├── lib/                    # SDK bindings and local utilities
│   ├── sdk.ts              # meetx-platform-sdk wrapper initialization
│   ├── stores/             # Zustand feature stores (useChatStore.ts, useUIStore.ts)
│   └── hooks/              # Custom UI hooks (useWindowSize.ts)
│
├── package.json
└── tsconfig.json
```

---

# 2. Key Import Rule

No components in `components/ui/` or `app/` are allowed to import raw data clients. All network query requests MUST import from the initialized SDK hooks defined in `lib/sdk.ts`.
