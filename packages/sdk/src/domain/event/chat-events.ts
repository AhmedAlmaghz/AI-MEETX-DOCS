import type {
  ConversationId,
  DomainEvent,
  IsoDateString,
  MeetingId,
  MessageId,
  UserId,
} from '@aimeetx/types';

import type {
  AttachmentStatus,
  AttachmentType,
  ConversationStatus,
  ConversationType,
  MessageStatus,
  MessageType,
} from '../model/chat.js';

// ============================================================================
// Conversation Events
// ============================================================================

/**
 * ConversationCreatedEvent — published when a new conversation is created.
 *
 * Per `feature-chat/conversations/EVENTS.md`: triggered after conversation creation.
 */
export interface ConversationCreatedEvent extends DomainEvent {
  readonly eventType: 'ConversationCreated';
  readonly payload: {
    readonly conversationId: ConversationId;
    readonly meetingId: MeetingId | null;
    readonly type: ConversationType;
    readonly name: string | null;
    readonly createdBy: UserId;
    readonly participantIds: ReadonlyArray<UserId>;
    readonly createdAt: IsoDateString;
  };
}

/**
 * ConversationUpdatedEvent — published when a conversation is updated.
 *
 * Per `feature-chat/conversations/EVENTS.md`: triggered after conversation update.
 */
export interface ConversationUpdatedEvent extends DomainEvent {
  readonly eventType: 'ConversationUpdated';
  readonly payload: {
    readonly conversationId: ConversationId;
    readonly name: string | null;
    readonly status: ConversationStatus;
    readonly updatedBy: UserId;
    readonly updatedAt: IsoDateString;
  };
}

/**
 * ConversationArchivedEvent — published when a conversation is archived.
 *
 * Per `feature-chat/conversations/EVENTS.md`: triggered after conversation archive.
 */
export interface ConversationArchivedEvent extends DomainEvent {
  readonly eventType: 'ConversationArchived';
  readonly payload: {
    readonly conversationId: ConversationId;
    readonly archivedBy: UserId;
    readonly archivedAt: IsoDateString;
  };
}

/**
 * ConversationClosedEvent — published when a conversation is closed.
 *
 * Per `feature-chat/conversations/EVENTS.md`: triggered after conversation close.
 */
export interface ConversationClosedEvent extends DomainEvent {
  readonly eventType: 'ConversationClosed';
  readonly payload: {
    readonly conversationId: ConversationId;
    readonly closedBy: UserId;
    readonly reason: 'meeting_ended' | 'host_action' | 'system_cleanup';
    readonly closedAt: IsoDateString;
  };
}

/**
 * ParticipantAddedToConversationEvent — published when a participant is added.
 *
 * Per `feature-chat/conversations/EVENTS.md`: triggered after participant addition.
 */
export interface ParticipantAddedToConversationEvent extends DomainEvent {
  readonly eventType: 'ParticipantAddedToConversation';
  readonly payload: {
    readonly conversationId: ConversationId;
    readonly userId: UserId;
    readonly addedBy: UserId;
    readonly addedAt: IsoDateString;
  };
}

/**
 * ParticipantRemovedFromConversationEvent — published when a participant is removed.
 *
 * Per `feature-chat/conversations/EVENTS.md`: triggered after participant removal.
 */
export interface ParticipantRemovedFromConversationEvent extends DomainEvent {
  readonly eventType: 'ParticipantRemovedFromConversation';
  readonly payload: {
    readonly conversationId: ConversationId;
    readonly userId: UserId;
    readonly removedBy: UserId;
    readonly reason: string | null;
    readonly removedAt: IsoDateString;
  };
}

// ============================================================================
// Message Events
// ============================================================================

/**
 * MessageSentEvent — published when a new message is sent.
 *
 * Per `feature-chat/messages/EVENTS.md`: triggered after message creation.
 */
export interface MessageSentEvent extends DomainEvent {
  readonly eventType: 'MessageSent';
  readonly payload: {
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly senderId: UserId;
    readonly senderDisplayName: string;
    readonly type: MessageType;
    readonly content: string;
    readonly attachmentCount: number;
    readonly replyToMessageId: MessageId | null;
    readonly createdAt: IsoDateString;
  };
}

/**
 * MessageEditedEvent — published when a message is edited.
 *
 * Per `feature-chat/messages/EVENTS.md`: triggered after message edit.
 */
export interface MessageEditedEvent extends DomainEvent {
  readonly eventType: 'MessageEdited';
  readonly payload: {
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly editedBy: UserId;
    readonly previousContent: string;
    readonly newContent: string;
    readonly editedAt: IsoDateString;
  };
}

/**
 * MessageDeletedEvent — published when a message is deleted.
 *
 * Per `feature-chat/messages/EVENTS.md`: triggered after message deletion.
 */
export interface MessageDeletedEvent extends DomainEvent {
  readonly eventType: 'MessageDeleted';
  readonly payload: {
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly deletedBy: UserId;
    readonly reason: 'user_action' | 'moderation' | 'system';
    readonly deletedAt: IsoDateString;
  };
}

/**
 * MessageStatusChangedEvent — published when a message status changes.
 *
 * Per `feature-chat/messages/EVENTS.md`: triggered after status change.
 */
export interface MessageStatusChangedEvent extends DomainEvent {
  readonly eventType: 'MessageStatusChanged';
  readonly payload: {
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly previousStatus: MessageStatus;
    readonly newStatus: MessageStatus;
    readonly changedAt: IsoDateString;
  };
}

// ============================================================================
// Attachment Events
// ============================================================================

/**
 * AttachmentUploadedEvent — published when an attachment is uploaded.
 *
 * Per `feature-chat/attachments/EVENTS.md`: triggered after upload completion.
 */
export interface AttachmentUploadedEvent extends DomainEvent {
  readonly eventType: 'AttachmentUploaded';
  readonly payload: {
    readonly attachmentId: string;
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly filename: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly type: AttachmentType;
    readonly storageUrl: string;
    readonly uploadedBy: UserId;
    readonly uploadedAt: IsoDateString;
  };
}

/**
 * AttachmentDownloadedEvent — published when an attachment is downloaded.
 *
 * Per `feature-chat/attachments/EVENTS.md`: triggered after download completion.
 */
export interface AttachmentDownloadedEvent extends DomainEvent {
  readonly eventType: 'AttachmentDownloaded';
  readonly payload: {
    readonly attachmentId: string;
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly filename: string;
    readonly downloadedBy: UserId;
    readonly downloadedAt: IsoDateString;
  };
}

/**
 * AttachmentStatusChangedEvent — published when an attachment status changes.
 *
 * Per `feature-chat/attachments/EVENTS.md`: triggered after status change.
 */
export interface AttachmentStatusChangedEvent extends DomainEvent {
  readonly eventType: 'AttachmentStatusChanged';
  readonly payload: {
    readonly attachmentId: string;
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly previousStatus: AttachmentStatus;
    readonly newStatus: AttachmentStatus;
    readonly changedAt: IsoDateString;
  };
}

// ============================================================================
// Read Receipt Events
// ============================================================================

/**
 * MessageReadEvent — published when a message is read by a participant.
 *
 * Per `feature-chat/read-receipts/EVENTS.md`: triggered after message read.
 */
export interface MessageReadEvent extends DomainEvent {
  readonly eventType: 'MessageRead';
  readonly payload: {
    readonly messageId: MessageId;
    readonly conversationId: ConversationId;
    readonly userId: UserId;
    readonly readAt: IsoDateString;
  };
}

/**
 * ConversationMarkedReadEvent — published when all messages in a conversation are marked as read.
 *
 * Per `feature-chat/read-receipts/EVENTS.md`: triggered after marking conversation read.
 */
export interface ConversationMarkedReadEvent extends DomainEvent {
  readonly eventType: 'ConversationMarkedRead';
  readonly payload: {
    readonly conversationId: ConversationId;
    readonly userId: UserId;
    readonly lastReadMessageId: MessageId;
    readonly markedAt: IsoDateString;
  };
}

// ============================================================================
// Event Union Types
// ============================================================================

/**
 * Union of all conversation events.
 */
export type ConversationEvent =
  | ConversationCreatedEvent
  | ConversationUpdatedEvent
  | ConversationArchivedEvent
  | ConversationClosedEvent
  | ParticipantAddedToConversationEvent
  | ParticipantRemovedFromConversationEvent;

/**
 * Union of all message events.
 */
export type MessageEvent =
  | MessageSentEvent
  | MessageEditedEvent
  | MessageDeletedEvent
  | MessageStatusChangedEvent;

/**
 * Union of all attachment events.
 */
export type AttachmentEvent =
  | AttachmentUploadedEvent
  | AttachmentDownloadedEvent
  | AttachmentStatusChangedEvent;

/**
 * Union of all read receipt events.
 */
export type ReadReceiptEvent = MessageReadEvent | ConversationMarkedReadEvent;

/**
 * Union of all chat-related domain events.
 */
export type ChatEvent =
  | ConversationEvent
  | MessageEvent
  | AttachmentEvent
  | ReadReceiptEvent;