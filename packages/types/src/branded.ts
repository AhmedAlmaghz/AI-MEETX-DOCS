/**
 * Branded type utility for creating nominal types from primitives.
 *
 * Prevents accidental mixing of IDs (e.g., passing a UserId where a MeetingId is expected).
 * Per ADR-004 (Clean Architecture) and Constitution §9: "No hidden dependencies."
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>;
 * type MeetingId = Brand<string, 'MeetingId'>;
 *
 * const userId: UserId = 'user_123' as UserId;
 * const meetingId: MeetingId = userId; // ❌ Type error
 * ```
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Helper to create a branded value from a primitive.
 */
export const brand = <T, B extends string>(value: T): Brand<T, B> => value as Brand<T, B>;

/**
 * Domain ID brands.
 */
export type UserId = Brand<string, 'UserId'>;
export type MeetingId = Brand<string, 'MeetingId'>;
export type ParticipantId = Brand<string, 'ParticipantId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type DeviceId = Brand<string, 'DeviceId'>;
export type OrganizationId = Brand<string, 'OrganizationId'>;
export type RecordingId = Brand<string, 'RecordingId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type TranslationSegmentId = Brand<string, 'TranslationSegmentId'>;
export type AttachmentId = Brand<string, 'AttachmentId'>;
export type TranslationSessionId = Brand<string, 'TranslationSessionId'>;
export type SummaryId = Brand<string, 'SummaryId'>;
export type ActionItemId = Brand<string, 'ActionItemId'>;
export type ReportId = Brand<string, 'ReportId'>;

// Classroom domain IDs
export type ClassroomSessionId = Brand<string, 'ClassroomSessionId'>;
export type QuizId = Brand<string, 'QuizId'>;
export type AttendanceId = Brand<string, 'AttendanceId'>;
export type BreakoutRoomId = Brand<string, 'BreakoutRoomId'>;

/**
 * ISO 8601 timestamp string.
 */
export type IsoDateString = Brand<string, 'IsoDateString'>;

/**
 * UUID v4 string.
 */
export type Uuid = Brand<string, 'Uuid'>;