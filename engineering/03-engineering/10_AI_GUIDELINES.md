Document ID: AI-001

Version: 1.0.0

Status: Approved

Owner: AI Architecture Team

Classification: Mandatory

---

# 1. Purpose

This document defines the operating rules for AI Coding Agents working on the AI Meeting Platform.

It ensures that all generated code is:

- Architecturally compliant
- Consistent
- Testable
- Maintainable
- Production-ready

These rules are mandatory for every AI-assisted development session.

---

# 2. Primary Objective

The AI Agent SHALL:

- Build the project incrementally.
- Follow the approved engineering documentation.
- Never invent architecture.
- Never modify project structure.
- Never introduce unapproved technologies.
- Produce production-quality code.

---

# 3. Source of Truth

The AI Agent MUST use the following documents in order:

1. START_HERE.md
2. PROJECT_CONSTITUTION.md
3. PROJECT_VISION.md
4. PRODUCT_REQUIREMENTS.md
5. EXECUTION_MASTER_PLAN.md
6. ARCHITECTURE_RULES.md
7. CODING_STANDARDS.md
8. TECH_STACK.md
9. REPOSITORY_STRUCTURE.md
10. DATABASE_OVERVIEW.md
11. EVENT_SYSTEM.md
12. AI_GUIDELINES.md

For feature implementation, the agent MUST additionally load:

- feature/README.md
- REQUIREMENTS.md
- SPECIFICATION.md
- DATABASE.md
- API.md
- EVENTS.md
- TESTS.md

---

# 4. Execution Workflow

For every task:

Read Documentation

↓

Understand Scope

↓

Identify Dependencies

↓

Implement

↓

Run Tests

↓

Verify Architecture

↓

Update Documentation

↓

Stop

The AI Agent MUST stop after completing the assigned scope.

---

# 5. Scope Control

The AI Agent SHALL implement ONLY the requested scope.

It SHALL NOT:

- Continue to the next feature.
- Refactor unrelated modules.
- Rename existing modules.
- Add optional functionality.
- Remove existing functionality.

---

# 6. Architecture Compliance

The AI Agent SHALL comply with:

- Clean Architecture
- MVVM
- Repository Pattern
- SOLID Principles
- Event-Driven Design
- Dependency Injection
- Modular Architecture

Violations are not permitted.

---

# 7. Technology Compliance

The AI Agent SHALL use ONLY the approved technology stack.

Forbidden examples:

- LiveData
- XML Layouts
- AsyncTask
- Glide
- Koin
- RxJava

Unless explicitly approved.

---

# 8. Feature Isolation

Every feature SHALL remain independent.

The AI Agent SHALL NOT create direct implementation dependencies between features.

Communication SHALL occur through:

- Contracts
- Interfaces
- Events

---

# 9. Code Generation Rules

Generated code SHALL:

- Compile successfully.
- Follow Kotlin best practices.
- Be readable.
- Include error handling.
- Be testable.
- Avoid duplication.

---

# 10. Documentation Rules

When creating a new class:

- Add KDoc where appropriate.
- Update related documentation if required.
- Maintain consistency with engineering documents.

---

# 11. Testing Rules

The AI Agent SHALL generate:

- Unit tests for use cases.
- Repository tests.
- UI tests where applicable.

Critical paths require integration tests.

No feature is complete without passing tests.

---

# 12. Error Handling

Errors SHALL be represented using typed results.

Avoid:

- Returning null.
- Throwing generic exceptions.
- Silent failures.

Use explicit result models.

---

# 13. Performance Rules

Generated code SHALL:

- Avoid blocking the main thread.
- Use Coroutines.
- Use Flow for reactive state.
- Minimize recomposition.
- Avoid unnecessary allocations.

---

# 14. Security Rules

The AI Agent SHALL NEVER:

- Hardcode secrets.
- Log tokens.
- Log passwords.
- Expose sensitive information.

Secrets SHALL be loaded from secure configuration.

---

# 15. AI Integration Rules

Only approved modules may directly access Gemini APIs.

Other features SHALL interact through defined interfaces or events.

---

# 16. Database Rules

Repositories SHALL hide storage implementation.

Presentation and Domain layers SHALL NOT access Room or Firestore directly.

DTOs SHALL remain inside the Data layer.

---

# 17. Event Rules

When a feature needs to notify another feature:

Publish an event.

Do not call the other feature directly.

Events SHALL be immutable and versioned.

---

# 18. Dependency Rules

Before adding a dependency:

Verify that it exists in TECH_STACK.md.

If not listed:

Stop and request approval.

---

# 19. Refactoring Rules

The AI Agent MAY refactor code ONLY if:

- It is within the assigned scope.
- Behavior remains unchanged.
- Tests continue to pass.

Cross-feature refactoring is prohibited unless explicitly requested.

---

# 20. Completion Checklist

Before declaring a task complete, verify:

✓ Code compiles.

✓ Architecture rules satisfied.

✓ Tests pass.

✓ Documentation updated.

✓ No warnings.

✓ No TODOs without issue references.

✓ No unused code.

---

# 21. Failure Policy

If required information is missing:

- Stop implementation.
- Report the missing documentation.
- Do not invent requirements.

---

# 22. Output Expectations

Every implementation SHALL include:

- Source code
- Tests
- Documentation updates (if applicable)

Optional explanations may be provided separately.

---

# 23. Definition of Success

An AI-generated contribution is successful only if:

- It satisfies the requested requirements.
- It passes automated tests.
- It complies with architecture.
- It requires no architectural corrections.
- It is ready for production review.

---

# 24. Compliance

These guidelines are mandatory.

Any generated code that violates this document SHALL be rejected during review.

---

End of Document