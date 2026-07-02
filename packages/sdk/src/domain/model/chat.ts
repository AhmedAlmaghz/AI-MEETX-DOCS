import type {
  AttachmentId,
  ConversationId,
  IsoDateString,
  MeetingId,
  MessageId,
  UserId,
} from '@aimeetx/types';

// ============================================================================
// Message Type
// ============================================================================

/**
 * Message type.
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: message type values.
 */
export type MessageType = 'text' | 'system' | 'file' | 'image' | 'link';

// ============================================================================
// Message Status
// ============================================================================

/**
 * Message delivery status.
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: message status values.
 * States: SENDING → SENT → DELIVERED → READ
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// ============================================================================
// Conversation Type
// ============================================================================

/**
 * Conversation type.
 *
 * Per `feature-chat/conversations/SPECIFICATION.md`: conversation type values.
 */
export type ConversationType = 'meeting' | 'direct' | 'group';

// ============================================================================
// Conversation Status
// ============================================================================

/**
 * Conversation status.
 *
 * Per `feature-chat/conversations/SPECIFICATION.md`: conversation status values.
 */
export type ConversationStatus = 'active' | 'archived' | 'closed';

// ============================================================================
// Attachment Type
// ============================================================================

/**
 * Attachment type.
 *
 * Per `feature-chat/attachments/SPECIFICATION.md`: attachment type values.
 */
export type AttachmentType =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'spreadsheet'
  | 'presentation'
  | 'other';

// ============================================================================
// Attachment Status
// ============================================================================

/**
 * Attachment upload/download status.
 *
 * Per `feature-chat/attachments/SPECIFICATION.md`: attachment status values.
 */
export type AttachmentStatus = 'uploading' | 'uploaded' | 'downloading' | 'downloaded' | 'failed';

// ============================================================================
// Chat Constraints
// ============================================================================

/**
 * Chat constraints.
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: message limits.
 */
export const CHAT_CONSTRAINTS = {
  MAX_MESSAGE_LENGTH: 10000,
  MIN_MESSAGE_LENGTH: 1,
  MAX_ATTACHMENT_SIZE_BYTES: 100 * 1024 * 1024, // 100 MB
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  MAX_CONVERSATION_NAME_LENGTH: 256,
  MIN_CONVERSATION_NAME_LENGTH: 1,
  MAX_FILENAME_LENGTH: 255,
  MAX_FILE_EXTENSION_LENGTH: 10,
  OFFLINE_CACHE_MESSAGE_LIMIT: 50,
} as const;

// ============================================================================
// Attachment (Entity)
// ============================================================================

/**
 * File attachment entity.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 *
 * Per `feature-chat/attachments/SPECIFICATION.md`: attachment entity.
 */
export interface Attachment {
  readonly id: AttachmentId;
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly type: AttachmentType;
  readonly status: AttachmentStatus;
  readonly storageUrl: string | null;
  readonly thumbnailUrl: string | null;
  readonly uploadedBy: UserId;
  readonly uploadedAt: IsoDateString;
  readonly downloadedAt: IsoDateString | null;
}

// ============================================================================
// Message (Entity)
// ============================================================================

/**
 * Chat message entity.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: message entity.
 */
export interface Message {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly senderId: UserId;
  readonly senderDisplayName: string;
  readonly type: MessageType;
  readonly content: string;
  readonly status: MessageStatus;
  readonly attachments: ReadonlyArray<Attachment>;
  readonly replyToMessageId: MessageId | null;
  readonly editedAt: IsoDateString | null;
  readonly deletedAt: IsoDateString | null;
  readonly isDeleted: boolean;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

// ============================================================================
// Conversation (Aggregate Root)
// ============================================================================

/**
 * Conversation aggregate root.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 *
 * Per `feature-chat/conversations/SPECIFICATION.md`: conversation is the root entity.
 */
export interface Conversation {
  readonly id: ConversationId;
  readonly meetingId: MeetingId | null;
  readonly type: ConversationType;
  readonly name: string | null;
  readonly status: ConversationStatus;
  readonly participantIds: ReadonlyArray<UserId>;
  readonly lastMessageId: MessageId | null;
  readonly lastMessageAt: IsoDateString | null;
  readonly createdBy: UserId;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

// ============================================================================
// Read Receipt (Entity)
// ============================================================================

/**
 * Read receipt entity.
 *
 * Per `feature-chat/read-receipts/SPECIFICATION.md`: read receipt entity.
 */
export interface ReadReceipt {
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly userId: UserId;
  readonly readAt: IsoDateString;
}

// ============================================================================
// Chat Errors
// ============================================================================

/**
 * Chat error types.
 *
 * Per feature-chat API specifications: error codes.
 */
export type ChatError =
  | { readonly code: 'ConversationNotFound'; readonly message: string }
  | { readonly code: 'MessageNotFound'; readonly message: string }
  | { readonly code: 'AttachmentNotFound'; readonly message: string }
  | { readonly code: 'MessageTooLong'; readonly message: string; readonly maxLength: number }
  | { readonly code: 'AttachmentTooLarge'; readonly message: string; readonly maxSizeBytes: number }
  | { readonly code: 'TooManyAttachments'; readonly message: string; readonly maxCount: number }
  | { readonly code: 'ConversationClosed'; readonly message: string }
  | { readonly code: 'NotConversationParticipant'; readonly message: string }
  | { readonly code: 'MessageAlreadyDeleted'; readonly message: string }
  | { readonly code: 'CannotEditMessage'; readonly message: string }
  | { readonly code: 'UploadFailed'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'DownloadFailed'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Unauthorized'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'ServerError'; readonly message: string; readonly status?: number }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine attachment type from MIME type.
 */
export function getAttachmentTypeFromMime(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'document';
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed'
  )
    return 'archive';
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'text/csv'
  )
    return 'spreadsheet';
  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return 'presentation';
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'document';
  return 'other';
}

/**
 * Check if a message can be edited.
 * Only text messages that are not deleted can be edited.
 */
export function canEditMessage(message: Message): boolean {
  return message.type === 'text' && !message.isDeleted;
}

/**
 * Check if a message can be deleted.
 * Only non-deleted messages can be deleted.
 */
export function canDeleteMessage(message: Message): boolean {
  return !message.isDeleted;
}