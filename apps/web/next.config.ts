import type { NextConfig } from 'next';

/**
 * Next.js 16 configuration for the AI MeetX web client.
 *
 * Per ADR-005: this is the reference web client consuming @aimeetx/sdk.
 * Per `06_TECH_STACK.md` §4: Next.js 16 App Router with React Server Components.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: ['@aimeetx/sdk', '@aimeetx/ui', '@aimeetx/types', '@aimeetx/events', '@aimeetx/network', '@aimeetx/storage'],
  // Security headers per `06_TECH_STACK.md` §21
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;