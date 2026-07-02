# Deployment Guide

Document ID: DPL-001

Version: 1.0.0

Status: Approved

Owner: DevOps & Platform Team

Classification: Mandatory

---

# 1. Purpose

This document defines the deployment architecture, CI/CD pipeline structures, infrastructure dependencies, and environmental configurations for the AI Meeting Platform.

---

# 2. Deployment Architecture

The platform architecture is split into:

1. **Android Client Application**: Native Kotlin app compiled, optimized via R8/ProGuard, and deployed via Google Play Store.
2. **Backend Services (Monolithic Bounded Contexts)**: Executable JAR services built with Spring Boot or Ktor, containerized via Docker, and orchestrated on Google Kubernetes Engine (GKE) or AWS EKS.
3. **WebRTC Media Server (LiveKit)**: provisioned as a dedicated cluster with host networking to handle low-latency WebRTC SFU traffic.
4. **Cloud Infrastructure**: PostgreSQL (relational storage), Redis (presence/cache), Kafka (domain event streaming), and S3/GCS (media file storage).

```
[Android Client]
      ↓ (WebRTC / https)
 [LiveKit Cluster] ↔ [Backend API Gateway]
                         ↓
             [Backend Microservices]
             ↙           ↓           ↘
      [Postgres]      [Redis]      [Kafka]
```

---

# 3. Environment Environments

We support three environments:

| Environment | Purpose | Infrastructure Scale | Update Strategy |
|-------------|---------|-----------------------|-----------------|
| `development` | Testing and integration | Minimal sandbox | Commit-triggered |
| `staging` | Pre-production testing | Production-like scale | Branch-merge triggered |
| `production` | Active user environment | Fully redundant & scaled | Tagged-release triggered |

---

# 4. CI/CD Pipeline Configuration

We use GitHub Actions to automate testing and deployments.

### 4.1 Steps in Build Pipeline

1. **Static Analysis & Linting**: Run detekt and ktlint formatting tasks.
2. **Automated Testing**: Execute JUnit tests and database integration tests using Testcontainers.
3. **Compilation**: Package Android application into APK/AAB and backend services into Docker images.
4. **Publishing**: Upload docker images to Google Container Registry (GCR) / AWS ECR.
5. **Deployment**: Update kubernetes manifest files via GitOps (ArgoCD).

---

# 5. External Infrastructure Setup

### 5.1 Google Gemini API Gateway
- Ensure the API token (`GEMINI_API_KEY`) is securely stored in secret managers (AWS Secrets Manager or GCP Secret Manager).
- Inject the API key into GKE pod environments at container launch time.

### 5.2 LiveKit SFU Server
- Install LiveKit using Helm:
  ```bash
  helm repo add livekit https://livekit.github.io/helm-charts
  helm install livekit livekit/livekit --values values-production.yaml
  ```
- Configure domain SSL certificates for WebRTC ports (TCP `7880` for API, UDP `50000-60000` for WebRTC).

---

# 6. Database Migration Strategy

- **Relational Databases (PostgreSQL)**: Managed via Flyway. Migrations are packaged inside the backend service Docker images and run automatically on startup.
- **Cache Databases (Redis)**: Setup keyspaces with eviction policy `volatile-lru` to prevent memory exhaustion by expired presence records.

---

End of Document
