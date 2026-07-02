# Virtual Classroom Module

## Overview

`feature-classroom` extends standard meetings into a full virtual classroom experience. It provides instructor-grade tools including structured attendance tracking, live quiz/poll system, collaborative whiteboard, and breakout room management — all integrated with the base meeting infrastructure.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business requirements for classroom mode, quiz, whiteboard, and breakout rooms.
2. [Specification](SPECIFICATION.md) - Domain models for ClassroomSession, Quiz, AttendanceRecord, and BreakoutRoom.
3. [Database Schema](DATABASE.md) - Tables for sessions, attendance, quizzes, responses, and breakout rooms.
4. [API Contract](API.md) - REST endpoints for all classroom features and WebSocket events.
5. [Domain Events](EVENTS.md) - Published quiz, pause, and breakout events; consumed participant events.
6. [Test Plan](TESTS.md) - Unit and integration tests for quiz submission, attendance tracking, and breakout rooms.

## Key Features

- **Attendance Tracking**: Automatic join/leave logging with exportable CSV attendance reports.
- **Live Quiz System**: Multiple-choice quizzes with real-time aggregated result bars and optional answer reveal.
- **Breakout Rooms**: Up to 20 sub-rooms with automatic LiveKit room provisioning and participant assignment.
- **Pause/Resume**: Instructor-controlled classroom pause that freezes all participant interactions.
- **Whiteboard**: Collaborative drawing with instructor-controlled student edit permissions.
