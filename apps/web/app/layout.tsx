import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@aimeetx/ui';
import { ErrorBoundary } from '@/components/ui';

import './globals.css';

const APP_NAME = 'AI MeetX';
const APP_DESCRIPTION = 'AI-powered real-time collaboration platform with live translation, virtual classrooms, and enterprise-grade security.';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ['video conferencing', 'real-time translation', 'AI meetings', 'collaboration', 'virtual classroom'],
  authors: [{ name: 'AI MeetX Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aimeetx.com',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultMode="system">
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
