import type {
  AttachmentId,
  ConversationId,
  MeetingId,
  MessageId,
  Result,
  UserId,
} from '@aimeetx/types';

import type {
  Attachment,
  Conversation,
  ConversationStatus,
  ConversationType,
  Message,
  MessageStatus,
  ReadReceipt,
} from '../model/chat.js';

// ============================================================================
// Conversation Repository Port
// ============================================================================

/**
 * Create conversation input.
 *
 * Per `feature-chat/conversations/SPECIFICATION.md`: conversation creation parameters.
 */
export interface CreateConversationInput {
  readonly meetingId?: MeetingId;
  readonly type: ConversationType;
  readonly name?: string;
  readonly participantIds: ReadonlyArray<UserId>;
  readonly createdBy: UserId;
}

/**
 * Conversation update input.
 *
 * Per `feature-chat/conversations/SPECIFICATION.md`: conversation update parameters.
 */
export interface ConversationUpdate {
  readonly name?: string;
  readonly status?: ConversationStatus;
}

/**
 * Conversation repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., FirestoreConversationRepository).
 *
 * Per feature-chat/conversations/SPECIFICATION.md: Conversation repository operations.
 */
export interface ConversationRepository {
  /** Create a new conversation. */
  createConversation(input: CreateConversationInput): Promise<Result<Conversation, Error>>;

  /** Get a conversation by ID. */
  getConversation(conversationId: ConversationId): Promise<Result<Conversation | null, Error>>;

  /** Get a conversation by meeting ID. */
  getConversationByMeetingId(meetingId: MeetingId): Promise<Result<Conversation | null, Error>>;

  /** Update conversation details. */
  updateConversation(
    conversationId: ConversationId,
    update: ConversationUpdate,
  ): Promise<Result<Conversation, Error>>;

  /** Archive a conversation. */
  archiveConversation(conversationId: ConversationId): Promise<Result<Conversation, Error>>;

  /** Close a conversation. */
  closeConversation(conversationId: ConversationId): Promise<Result<Conversation, Error>>;

  /** Delete a conversation. */
  deleteConversation(conversationId: ConversationId): Promise<Result<void, Error>>;

  /** List conversations for a user. */
  listConversationsByUser(userId: UserId): Promise<Result<ReadonlyArray<Conversation>, Error>>;

  /** List conversations for a meeting. */
  listConversationsByMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<Conversation>, Error>>;

  /** Add a participant to a conversation. */
  addParticipant(
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<Result<Conversation, Error>>;

  /** Remove a participant from a conversation. */
  removeParticipant(
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<Result<Conversation, Error>>;

  /** Update last message reference. */
  updateLastMessage(
    conversationId: ConversationId,
    messageId: MessageId,
    messageAt: import('@aimeetx/types').IsoDateString,
  ): Promise<Result<Conversation, Error>>;
}

// ============================================================================
// Message Repository Port
// ============================================================================

/**
 * Send message input.
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: message creation parameters.
 */
export interface SendMessageInput {
  readonly conversationId: ConversationId;
  readonly senderId: UserId;
  readonly senderDisplayName: string;
  readonly type: 'text' | 'system' | 'file' | 'image' | 'link';
  readonly content: string;
  readonly replyToMessageId?: MessageId;
}

/**
 * Message update input.
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: message update parameters.
 */
export interface MessageUpdate {
  readonly content?: string;
  readonly status?: MessageStatus;
}

/**
 * Message repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., FirestoreMessageRepository).
 *
 * Per feature-chat/messages/SPECIFICATION.md: Message repository operations.
 */
export interface MessageRepository {
  /** Send a new message. */
  sendMessage(input: SendMessageInput): Promise<Result<Message, Error>>;

  /** Get a message by ID. */
  getMessage(messageId: MessageId): Promise<Result<Message | null, Error>>;

  /** Edit a message. */
  editMessage(
    messageId: MessageId,
    newContent: string,
    editedBy: UserId,
  ): Promise<Result<Message, Error>>;

  /** Delete a message (soft delete). */
  deleteMessage(
    messageId: MessageId,
    deletedBy: UserId,
    reason?: 'user_action' | 'moderation' | 'system',
  ): Promise<Result<Message, Error>>;

  /** Update message status. */
  updateMessageStatus(
    messageId: MessageId,
    status: MessageStatus,
  ): Promise<Result<Message, Error>>;

  /** List messages in a conversation (paginated, newest first). */
  listMessages(
    conversationId: ConversationId,
    options?: {
      readonly limit?: number;
      readonly beforeMessageId?: MessageId;
    },
  ): Promise<Result<ReadonlyArray<Message>, Error>>;

  /** List messages by sender. */
  listMessagesBySender(
    conversationId: ConversationId,
    senderId: UserId,
    limit?: number,
  ): Promise<Result<ReadonlyArray<Message>, Error>>;

  /** Count unread messages for a user in a conversation. */
  countUnreadMessages(
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<Result<number, Error>>;

  /** Subscribe to real-time messages (returns unsubscribe function). */
  subscribeToMessages(
    conversationId: ConversationId,
    callback: (message: Message) => void,
  ): Promise<Result<() => void, Error>>;
}

// ============================================================================
// Attachment Repository Port
// ============================================================================

/**
 * Upload attachment input.
 *
 * Per `feature-chat/attachments/SPECIFICATION.md`: attachment upload parameters.
 */
export interface UploadAttachmentInput {
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly fileData: ArrayBuffer | Blob;
  readonly uploadedBy: UserId;
}

/**
 * Attachment repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., FirestoreAttachmentRepository).
 *
 * Per feature-chat/attachments/SPECIFICATION.md: Attachment repository operations.
 */
export interface AttachmentRepository {
  /** Upload an attachment. */
  uploadAttachment(input: UploadAttachmentInput): Promise<Result<Attachment, Error>>;

  /** Get an attachment by ID. */
  getAttachment(attachmentId: AttachmentId): Promise<Result<Attachment | null, Error>>;

  /** Get attachments for a message. */
  getAttachmentsByMessage(messageId: MessageId): Promise<Result<ReadonlyArray<Attachment>, Error>>;

  /** Get attachments for a conversation. */
  getAttachmentsByConversation(
    conversationId: ConversationId,
    limit?: number,
  ): Promise<Result<ReadonlyArray<Attachment>, Error>>;

  /** Update attachment status. */
  updateAttachmentStatus(
    attachmentId: AttachmentId,
    status: Attachment['status'],
  ): Promise<Result<Attachment, Error>>;

  /** Update attachment storage URL (after upload completes). */
  updateAttachmentStorageUrl(
    attachmentId: AttachmentId,
    storageUrl: string,
    thumbnailUrl?: string,
  ): Promise<Result<Attachment, Error>>;

  /** Delete an attachment. */
  deleteAttachment(attachmentId: AttachmentId): Promise<Result<void, Error>>;

  /** Get download URL for an attachment. */
  getDownloadUrl(attachmentId: AttachmentId): Promise<Result<string, Error>>;
}

// ============================================================================
// Read Receipt Repository Port
// ============================================================================

/**
 * Read receipt repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., FirestoreReadReceiptRepository).
 *
 * Per feature-chat/read-receipts/SPECIFICATION.md: Read receipt repository operations.
 */
export interface ReadReceiptRepository {
  /** Mark a message as read. */
  markMessageRead(
    messageId: MessageId,
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<Result<ReadReceipt, Error>>;

  /** Mark all messages in a conversation as read. */
  markConversationRead(
    conversationId: ConversationId,
    userId: UserId,
    lastReadMessageId: MessageId,
  ): Promise<Result<void, Error>>;

  /** Get read receipts for a message. */
  getReadReceipts(messageId: MessageId): Promise<Result<ReadonlyArray<ReadReceipt>, Error>>;

  /** Get last read message for a user in a conversation. */
  getLastReadMessage(
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<Result<MessageId | null, Error>>;

  /** Check if a user has read a message. */
  hasUserReadMessage(
    messageId: MessageId,
    userId: UserId,
  ): Promise<Result<boolean, Error>>;
}