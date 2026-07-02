# ADR-W001: Next.js 15 App Router and React Server Components (RSC)

## Context
We need an application framework for the AI MeetX Web Client that provides server-side rendering (SSR), high performance, and SEO optimization (especially for public classroom sharing and landing pages).

## Decision
Adopt **Next.js 15** with the **App Router** as the primary web application framework.

## Consequences
- **RSC by Default**: Most pages are server-rendered, downloading minimal JavaScript.
- **Client Components**: Interactive features (like WebRTC rooms, chat widgets) are clearly separated using the `'use client'` directive.
- **SEO & Performance**: Out-of-the-box support for metadata APIs and optimal image loading.
