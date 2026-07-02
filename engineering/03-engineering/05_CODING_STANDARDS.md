Document ID: COD-001

Version: 1.0.0

Status: Approved

Owner: Engineering Team

Classification: Mandatory

---

# 1. Purpose

This document defines the official coding standards for the AI Meeting Platform.

These standards apply to:

- Human Developers
- AI Coding Agents
- Code Reviews
- Pull Requests

Every source file MUST comply with this document.

---

# 2. General Principles

The codebase SHALL be:

- Simple
- Readable
- Maintainable
- Testable
- Modular
- Consistent
- Self-documenting

Code readability is preferred over clever implementations.

---

# 3. Programming Language

Primary Language

Kotlin

Minimum Version

Kotlin 2.x

No Java code shall be introduced unless explicitly approved.

---

# 4. UI Framework

Jetpack Compose

Material Design 3

Compose Navigation

View Binding is prohibited.

XML layouts are prohibited except where technically unavoidable.

---

# 5. Architecture

Mandatory:

- Clean Architecture
- MVVM
- Repository Pattern
- Use Cases
- Dependency Injection
- Event Driven Design

---

# 6. Package Naming

All package names SHALL be lowercase.

Example:

com.company.app

feature.auth.presentation

feature.auth.domain

feature.auth.data

core.network

core.database

services.translation

---

# 7. File Naming

Composable

LoginScreen.kt

ViewModel

LoginViewModel.kt

Use Case

LoginUseCase.kt

Repository

AuthRepository.kt

Repository Implementation

AuthRepositoryImpl.kt

DTO

LoginRequestDto.kt

Entity

User.kt

Mapper

UserMapper.kt

Event

UserLoggedInEvent.kt

---

# 8. Class Naming

PascalCase

Examples

MeetingManager

TranslationService

MediaController

UserProfile

---

# 9. Function Naming

camelCase

Examples

login()

logout()

joinMeeting()

leaveMeeting()

translateAudio()

muteParticipant()

---

# 10. Variable Naming

camelCase

Good

meetingId

currentUser

audioStream

translatedText

Avoid

tmp

data

value

test

---

# 11. Constants

UPPER_SNAKE_CASE

Examples

MAX_PARTICIPANTS

DEFAULT_LANGUAGE

NETWORK_TIMEOUT

---

# 12. Immutable First

Prefer:

val

Avoid:

var

Mutable state SHALL be minimized.

---

# 13. Null Safety

Avoid nullable types whenever possible.

Prefer:

Require validation.

Use sealed results.

Use Optional patterns.

Never use:

!!

except in impossible states.

---

# 14. Coroutines

Mandatory.

Never block Main Thread.

Use:

Dispatchers.IO

Dispatchers.Default

Dispatchers.Main

Suspend functions preferred.

---

# 15. Flow

Preferred:

StateFlow

SharedFlow

Avoid LiveData in new code.

---

# 16. Compose Rules

Composable functions SHALL be stateless whenever possible.

State hoisting is mandatory.

Avoid business logic inside composables.

Composable names SHALL end with:

Screen

Dialog

Card

Item

Bar

Example:

MeetingScreen

ParticipantCard

ChatItem

---

# 17. ViewModels

ViewModels SHALL:

Expose immutable state.

Contain no Android Context.

Contain no networking.

Contain no database code.

Contain no Firebase SDK code.

---

# 18. Use Cases

One responsibility only.

Good

LoginUseCase

TranslateAudioUseCase

JoinMeetingUseCase

Bad

UserManager

MeetingHelper

Utils

---

# 19. Repository Rules

Repositories expose Domain Models only.

DTOs never leave Data Layer.

Repositories SHALL hide implementation details.

---

# 20. Error Handling

Use sealed interfaces.

Example

Success

Error

Loading

ValidationError

NetworkError

AuthenticationError

Never return null to indicate failure.

---

# 21. Logging

Use Timber.

Log Levels:

Debug

Info

Warning

Error

Sensitive information SHALL NEVER be logged.

Never log:

Passwords

Tokens

Emails

Private Messages

Audio Content

Translated Text

---

# 22. Dependency Injection

Mandatory:

Hilt

Constructor Injection preferred.

Field Injection prohibited unless required.

---

# 23. Comments

Code should explain itself.

Comments are allowed only for:

Business rules.

Complex algorithms.

Workarounds.

TODO with issue reference.

Avoid obvious comments.

Bad

// increment counter

counter++

---

# 24. Documentation

Every public class SHALL include KDoc.

Every Use Case SHALL include description.

Every API SHALL include documentation.

---

# 25. Formatting

Maximum Line Length

120

Indentation

4 Spaces

No Tabs.

One declaration per line.

Trailing commas where supported.

---

# 26. Magic Numbers

Forbidden.

Extract constants.

Bad

if (count > 25)

Good

if (count > MAX_PARTICIPANTS)

---

# 27. Extension Functions

Allowed for:

Formatting

Mapping

Utility helpers

Avoid extensions containing business logic.

---

# 28. Utility Classes

Avoid generic Utils.

Prefer:

DateFormatter

AudioEncoder

LanguageMapper

Instead of:

Utils.kt

Helper.kt

Common.kt

---

# 29. Testing

Every Use Case SHALL have unit tests.

Every Repository SHALL have tests.

Critical features SHALL include integration tests.

---

# 30. Git Commit Convention

Format:

type(scope): description

Examples

feat(auth): add email login

fix(chat): resolve duplicate messages

refactor(media): simplify audio pipeline

docs(api): update translation endpoint

test(meeting): add join tests

---

# 31. Pull Request Rules

Every Pull Request SHALL include:

Purpose

Linked Requirement ID

Linked Task ID

Screenshots (UI)

Test Results

Checklist

---

# 32. Code Review Checklist

Reviewer SHALL verify:

✓ Architecture compliance

✓ Naming

✓ Test coverage

✓ Documentation

✓ Performance

✓ Security

✓ No duplicated logic

✓ No hidden dependencies

---

# 33. Definition of Clean Code

Clean code is:

Simple

Predictable

Consistent

Documented

Tested

Maintainable

Readable

---

# 34. Forbidden Practices

❌ God Classes

❌ Static mutable state

❌ Copy/Paste code

❌ Business logic in UI

❌ Android Context inside Domain

❌ Circular dependencies

❌ Global mutable variables

❌ Hidden side effects

❌ Unused code

❌ Dead code

❌ Commented-out code

---

# 35. Compliance

All source code SHALL comply with this document.

Any violation MUST be corrected before merge.

---

End of Document