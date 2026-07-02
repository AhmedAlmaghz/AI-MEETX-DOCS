# ADR-004: Clean Architecture Layer Isolation & DTO Segregation

Document ID: ADR-004

Version: 1.0.0

Status: Accepted

Date: 2025-01-18

Deciders: Chief Architect, Senior Android Engineers

Affected Features: All modules under `features/`

Classification: Architecture Freeze

---

# Context

To keep the codebase maintainable as features expand, we follow Clean Architecture boundaries. 

However, without strict tooling or guidelines:
- Data Transfer Objects (DTOs) leak into Jetpack Compose UI views.
- Android platform dependencies (such as Android Context or Firebase SDK classes) leak into pure business logic Use Cases.
- Presentation layers call DB adapters directly, bypassing domain validation.

---

# Problem

How do we enforce clean separation of layers and ensure that our business rules (Domain) remain decoupled from infrastructure details (Database/Network/UI)?

---

# Decision

We establish strict compile-time and structural boundaries across all feature modules:

1. **Pure Kotlin Domain**: The `domain/` package MUST NOT depend on the Android SDK, Hilt classes, Room annotations, or Firebase SDK. It is pure Kotlin.
2. **DTO Segregation**: DTOs (e.g. `LoginResponseDto`) are strictly confined to the `data/` layer. They are mapped to Domain Entities (`User`) before returning to the domain. DTOs must never reach ViewModels or UI screens.
3. **No Direct Framework Access**: UI elements must interact with data sources only through Use Cases. Direct repository calls from Composables are prohibited.
4. **Hilt Dependency Injection**: Repositories are exposed via interfaces (Ports) in the Domain layer and implemented in the Data layer. Hilt binds implementations to interfaces, keeping the Domain layer decoupled from concrete infrastructure.

```
[Presentation: UI/ViewModel]
           │
           ▼
[Domain: UseCase/Entity/Port] ◄── [Hilt Bindings]
           ▲
           │
[Data: DTO/RepositoryImpl/Source]
```

---

# Consequences

## Positive
- **Unit Testability**: Since Use Cases contain no platform dependencies, they can be tested in standard JVM unit tests in milliseconds.
- **Technology Swappability**: We can migrate from Room to SQLDelight or Firestore to Supabase without changing any business rules in the domain layer.
- **Maintainability**: New developers can understand feature logic by looking solely at the `domain/usecase/` directory.

## Negative
- **Boilerplate**: Requires mapping classes (e.g., `UserMapper.kt`) to transform DTOs to Entities.
- **Increased File Count**: Each simple CRUD operation requires a Use Case, Entity, Repository Port, Repository Implementation, and DTO.

---

End of Document
