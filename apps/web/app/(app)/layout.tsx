import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';

/**
 * Protected app layout — all routes under /(app)/* require an active
 * session. AppShell performs the redirect to /login when needed.
 */
export default function ProtectedLayout({ children }: { readonly children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
