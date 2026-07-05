import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your AI MeetX account and get started.',
};

export default function RegisterLayout({ children }: { readonly children: ReactNode }) {
  return children;
}
