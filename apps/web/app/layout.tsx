import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@aimeetx/ui';

import './globals.css';

export const metadata: Metadata = {
  title: 'AI MeetX',
  description: 'AI-powered real-time collaboration platform',
};

/**
 * Root layout for the AI MeetX web client.
 *
 * Per ADR-005: this is the Next.js 16 App Router root layout.
 * It wraps the app in the ThemeProvider from @aimeetx/ui.
 */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultMode="system">{children}</ThemeProvider>
      </body>
    </html>
  );
}