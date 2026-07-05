import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your AI MeetX account.',
};

export default function LoginLayout({ children }: { readonly children: ReactNode }) {
  return children;
}
