import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'AI MeetX dashboard and meeting management.',
};

export default function ProtectedLayout({ children }: { readonly children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
