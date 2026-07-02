# ADR-W004: Consuming Platform Services via a Generated TypeScript SDK

## Context
We want to keep client applications (Web, Mobile, Desktop) decoupled from the underlying platform's specific endpoint routing and serialization schemes. We must ensure that APIs, database models, and event contracts remain consistent across all clients.

## Decision
Generate and consume a single **TypeScript SDK (`meetx-platform-sdk`)** containing type definitions, API endpoints, repository port interfaces, and React hooks (e.g. TanStack query bindings).

## Consequences
- **No Manual Mapping**: The Web Client imports all queries, mutations, and domain models directly from the SDK package.
- **Contract Enforcement**: Breaking changes in the platform specifications automatically cause TypeScript compilation errors in the web client build pipeline.
- **Mocking**: Testing is simplified by injecting mock implementations of the SDK ports.
