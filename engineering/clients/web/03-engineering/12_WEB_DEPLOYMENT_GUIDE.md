# Web Client Deployment Guide

Document ID: WEB-DEP-001
Version: 1.0.0
Status: Approved

---

# 1. Target Infrastructure

The Next.js 15 Web Client is deployed to:
- **Vercel** (primary - for fast preview builds and automated serverless branch deploys).
- **Google Kubernetes Engine (GKE)** (fallback/self-hosted - via a multi-stage Docker build).

---

# 2. Deployment Pipelines

- **CI Pipeline (GitHub Actions)**: Runs ESLint, Prettier formatting checks, Vitest unit test suites, and Playwright smoke tests.
- **CD Pipeline**: Merges to `main` trigger auto-deployments.
- **Environment Variables**: API endpoints, Google Cloud tokens, and Firebase config variables must be injected securely at build-time. No secrets are stored in the client bundle.
